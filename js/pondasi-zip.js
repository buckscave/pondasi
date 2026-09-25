/* PONDASI-ZIP.JS
   Pure ES5 ZIP writer (no external dependency).
   Format: ZIP STORE (no compression) — file size tetap kecil untuk HTML/CSS/JS.

   Pemakaian:
     var zip = new PondasiZip();
     zip.addFile('index.html', htmlContent);
     zip.addFile('css/pondasi.css', cssContent);
     var blob = zip.generateBlob();  // → Blob application/zip
     P.downloadFile('nama.zip', blob, 'application/zip');
*/

var PondasiZip = (function () {

    // === CRC32 table (precomputed) ===
    var crcTable = (function () {
        var table = [];
        for (var n = 0; n < 256; n++) {
            var c = n;
            for (var k = 0; k < 8; k++) {
                if (c & 1) {
                    c = 0xEDB88320 ^ (c >>> 1);
                } else {
                    c = c >>> 1;
                }
            }
            table[n] = c;
        }
        return table;
    })();

    function crc32(bytes) {
        var crc = 0xFFFFFFFF;
        for (var i = 0; i < bytes.length; i++) {
            crc = crcTable[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
        }
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    // === Helper: string → UTF-8 bytes ===
    function strToBytes(str) {
        // Untuk ES5 tanpa TextEncoder, pakai unescape(encodeURIComponent())
        // yang konversi string JS (UTF-16) → byte string Latin-1 hasil UTF-8 encoding
        var utf8 = unescape(encodeURIComponent(str));
        var bytes = [];
        for (var i = 0; i < utf8.length; i++) {
            bytes.push(utf8.charCodeAt(i) & 0xFF);
        }
        return bytes;
    }

    // === Helper: 4-byte little-endian ===
    function uint32LE(val) {
        return [
            val & 0xFF,
            (val >>> 8) & 0xFF,
            (val >>> 16) & 0xFF,
            (val >>> 24) & 0xFF
        ];
    }

    // === Helper: 2-byte little-endian ===
    function uint16LE(val) {
        return [val & 0xFF, (val >>> 8) & 0xFF];
    }

    // === Helper: DOS date/time ===
    // Kalau Date tidak ada, pakai 0 (1980-01-00 00:00:00 — tapi ZIP tolerate)
    function dosDateTime(date) {
        var d = date instanceof Date ? date : new Date();
        var year = d.getFullYear();
        if (year < 1980) year = 1980;
        var dosDate = ((year - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
        var dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (Math.floor(d.getSeconds() / 2));
        return { date: dosDate, time: dosTime };
    }

    function PondasiZip() {
        this.files = [];  // { name, bytes, crc, size, date, time }
        this.offset = 0;
    }

    PondasiZip.prototype.addFile = function (name, content) {
        var bytes;
        if (typeof content === 'string') {
            bytes = strToBytes(content);
        } else if (content instanceof Array) {
            bytes = content;
        } else if (content && content.length !== undefined) {
            // TypedArray atau ArrayBuffer
            bytes = Array.prototype.slice.call(content);
        } else {
            bytes = strToBytes(String(content || ''));
        }
        var dt = dosDateTime(new Date());
        this.files.push({
            name: name,
            bytes: bytes,
            crc: crc32(bytes),
            size: bytes.length,
            date: dt.date,
            time: dt.time,
            localHeaderOffset: this.offset
        });
        // Update offset akumulatif (akan dihitung saat generate, tapi simpan supaya central dir bener)
        this.offset += 30 + name.length + bytes.length;
    };

    PondasiZip.prototype.generateBytes = function () {
        var out = [];
        var centralDir = [];

        // Local file headers + file data
        for (var i = 0; i < this.files.length; i++) {
            var f = this.files[i];
            var nameBytes = strToBytes(f.name);

            // Local file header signature: 0x04034b50
            var localHeader = [].concat(
                [0x50, 0x4B, 0x03, 0x04],         // signature
                uint16LE(20),                       // version needed (2.0)
                uint16LE(0),                        // general purpose bit flag
                uint16LE(0),                        // compression method: 0 = STORE
                uint16LE(f.time),                   // last mod file time
                uint16LE(f.date),                   // last mod file date
                uint32LE(f.crc),                    // CRC-32
                uint32LE(f.size),                   // compressed size (== uncompressed for STORE)
                uint32LE(f.size),                   // uncompressed size
                uint16LE(nameBytes.length),         // file name length
                uint16LE(0)                         // extra field length
            );
            out = out.concat(localHeader, nameBytes, f.bytes);

            // Central directory header (disimpan terpisah, akan di-append setelah semua local)
            var centralHeader = [].concat(
                [0x50, 0x4B, 0x01, 0x02],         // central file header signature
                uint16LE(20),                       // version made by (2.0)
                uint16LE(20),                       // version needed to extract
                uint16LE(0),                        // general purpose bit flag
                uint16LE(0),                        // compression method: 0 = STORE
                uint16LE(f.time),                   // last mod file time
                uint16LE(f.date),                   // last mod file date
                uint32LE(f.crc),                    // CRC-32
                uint32LE(f.size),                   // compressed size
                uint32LE(f.size),                   // uncompressed size
                uint16LE(nameBytes.length),         // file name length
                uint16LE(0),                        // extra field length
                uint16LE(0),                        // file comment length
                uint16LE(0),                        // disk number start
                uint16LE(0),                        // internal file attributes
                uint32LE(0),                        // external file attributes
                uint32LE(f.localHeaderOffset),     // relative offset of local header
                nameBytes                           // file name
            );
            centralDir = centralDir.concat(centralHeader);
        }

        // Append central directory
        var centralDirOffset = out.length;
        out = out.concat(centralDir);

        // End of central directory record
        var eocd = [].concat(
            [0x50, 0x4B, 0x05, 0x06],         // EOCD signature
            uint16LE(0),                       // number of this disk
            uint16LE(0),                       // disk where central dir starts
            uint16LE(this.files.length),       // entries on this disk
            uint16LE(this.files.length),       // total entries
            uint32LE(centralDir.length),      // size of central directory
            uint32LE(centralDirOffset),       // offset of start of central directory
            uint16LE(0)                        // comment length
        );
        out = out.concat(eocd);

        return out;
    };

    PondasiZip.prototype.generateBlob = function () {
        var bytes = this.generateBytes();
        // Convert array of byte ints → Uint8Array
        var u8 = new Uint8Array(bytes.length);
        for (var i = 0; i < bytes.length; i++) {
            u8[i] = bytes[i];
        }
        return new Blob([u8], { type: 'application/zip' });
    };

    return PondasiZip;
})();

// Expose sebagai global
window.PondasiZip = PondasiZip;
