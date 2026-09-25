/* PONDASI-ASSETS.JS
   Asset manager: upload gambar (dengan kompresi via Canvas API),
   simpan ke IndexedDB, list di sidebar Assets.

   Konsep:
   - User pilih file gambar → compress via Canvas (max dimensi, quality)
   - Simpan blob + metadata ke IndexedDB (per-project)
   - Tampilkan thumbnail list di sidebar
   - Saat export ZIP folder → include gambar di folder gambar/
*/

var P = P || {};

(function () {

    /* === IndexedDB helpers === */
    var DB_NAME = 'pondasi-assets';
    var DB_VERSION = 1;
    var STORE_NAME = 'gambar';

    function openDB(callback) {
        if (!window.indexedDB) {
            if (callback) callback(null, new Error('IndexedDB tidak didukung browser ini'));
            return;
        }
        var req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = function (ev) {
            var db = ev.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                var store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('projectId', 'projectId', { unique: false });
            }
        };
        req.onsuccess = function (ev) { if (callback) callback(ev.target.result, null); };
        req.onerror = function (ev) { if (callback) callback(null, ev.target.error); };
    }

    /* === Image compression via Canvas === */
    /* Input: File object, options { maxDim, quality, webp, compress }
       Output: callback(blob, info) di mana info = { width, height, originalSize, compressedSize, type, sourceType }
    */
    P.compressImage = function (file, options, callback) {
        if (!file || !file.type.startsWith('image/')) {
            if (callback) callback(null, null, new Error('File bukan gambar'));
            return;
        }
        options = options || {};
        var maxDim = options.maxDim || 1920;
        var quality = options.quality || 0.8;
        var useWebp = !!options.webp;
        var doCompress = options.compress !== false;

        var img = new Image();
        var url = URL.createObjectURL(file);
        img.onload = function () {
            var w = img.naturalWidth;
            var h = img.naturalHeight;
            var origSize = file.size;
            var sourceType = file.type;

            if (!doCompress) {
                // Tidak perlu kompres — pakai file asli
                URL.revokeObjectURL(url);
                if (callback) callback(file, {
                    width: w, height: h,
                    originalSize: origSize, compressedSize: origSize,
                    type: sourceType, sourceType: sourceType
                }, null);
                return;
            }

            // Hitung dimensi baru (preserve aspect ratio)
            var newW = w, newH = h;
            if (w > maxDim || h > maxDim) {
                if (w >= h) {
                    newW = maxDim;
                    newH = Math.round(h * (maxDim / w));
                } else {
                    newH = maxDim;
                    newW = Math.round(w * (maxDim / h));
                }
            }

            // Draw ke canvas
            var canvas = document.createElement('canvas');
            canvas.width = newW;
            canvas.height = newH;
            var ctx = canvas.getContext('2d');
            // Background putih untuk PNG dengan transparency (supaya JPEG tidak hitam)
            if (sourceType === 'image/png' && useWebp === false) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, newW, newH);
            }
            ctx.drawImage(img, 0, 0, newW, newH);
            URL.revokeObjectURL(url);

            // Convert ke blob
            var outType = useWebp ? 'image/webp' : 'image/jpeg';
            // Cek browser support webp
            if (useWebp && canvas.toDataURL(outType).indexOf('data:' + outType) !== 0) {
                // WebP tidak didukung, fallback ke jpeg
                outType = 'image/jpeg';
            }
            canvas.toBlob(function (blob) {
                if (!blob) {
                    if (callback) callback(null, null, new Error('Gagal konversi gambar'));
                    return;
                }
                if (callback) callback(blob, {
                    width: newW, height: newH,
                    originalSize: origSize, compressedSize: blob.size,
                    type: outType, sourceType: sourceType
                }, null);
            }, outType, quality);
        };
        img.onerror = function () {
            URL.revokeObjectURL(url);
            if (callback) callback(null, null, new Error('Gagal load gambar'));
        };
        img.src = url;
    };

    /* === Save gambar ke IndexedDB === */
    P.saveAsset = function (projectId, nama, blob, info, callback) {
        openDB(function (db, err) {
            if (err) { if (callback) callback(null, err); return; }
            var id = 'ast_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
            var tx = db.transaction([STORE_NAME], 'readwrite');
            var store = tx.objectStore(STORE_NAME);
            var record = {
                id: id,
                projectId: projectId,
                nama: nama,
                blob: blob,
                width: info.width,
                height: info.height,
                originalSize: info.originalSize,
                compressedSize: info.compressedSize,
                type: info.type,
                sourceType: info.sourceType,
                createdAt: Date.now()
            };
            var req = store.add(record);
            req.onsuccess = function () { if (callback) callback(id, null); };
            req.onerror = function (ev) { if (callback) callback(null, ev.target.error); };
        });
    };

    /* === List semua asset di project === */
    P.listAssets = function (projectId, callback) {
        openDB(function (db, err) {
            if (err) { if (callback) callback([], err); return; }
            var tx = db.transaction([STORE_NAME], 'readonly');
            var store = tx.objectStore(STORE_NAME);
            var idx = store.index('projectId');
            var req = idx.getAll(projectId);
            req.onsuccess = function () { if (callback) callback(req.result || [], null); };
            req.onerror = function (ev) { if (callback) callback([], ev.target.error); };
        });
    };

    /* === Hapus asset === */
    P.deleteAsset = function (assetId, callback) {
        openDB(function (db, err) {
            if (err) { if (callback) callback(false, err); return; }
            var tx = db.transaction([STORE_NAME], 'readwrite');
            var store = tx.objectStore(STORE_NAME);
            var req = store.delete(assetId);
            req.onsuccess = function () { if (callback) callback(true, null); };
            req.onerror = function (ev) { if (callback) callback(false, ev.target.error); };
        });
    };

    /* === Get asset blob URL === */
    P.getAssetURL = function (assetId, callback) {
        openDB(function (db, err) {
            if (err) { if (callback) callback(null, err); return; }
            var tx = db.transaction([STORE_NAME], 'readonly');
            var store = tx.objectStore(STORE_NAME);
            var req = store.get(assetId);
            req.onsuccess = function () {
                if (!req.result) { if (callback) callback(null, new Error('Asset tidak ditemukan')); return; }
                var url = URL.createObjectURL(req.result.blob);
                if (callback) callback(url, null);
            };
            req.onerror = function (ev) { if (callback) callback(null, ev.target.error); };
        });
    };

    /* === Format bytes ke human-readable === */
    P.formatBytes = function (bytes) {
        if (!bytes || bytes < 0) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

})();

/* === Asset Picker — modal untuk pilih gambar dari Asset Manager ===
   Pemakaian:
     P.tampilkanAssetPicker(function (url, nama, meta) {
       // url = blob URL (sementara, untuk preview)
       // nama = nama file (untuk path relatif di HTML: gambar/nama.jpg)
       // meta = { width, height, compressedSize, ... }
     });
*/
P.tampilkanAssetPicker = function (callback) {
    if (!P.STATE.currentProjectId) {
        P.flash('Tidak ada proyek aktif');
        if (callback) callback(null, null, null);
        return;
    }
    var projectId = P.STATE.currentProjectId;
    P.listAssets(projectId, function (assets, err) {
        if (err || assets.length === 0) {
            P.flash('Belum ada gambar di Assets. Upload dulu via toolbar Assets.');
            if (callback) callback(null, null, null);
            return;
        }
        // Build modal picker
        var overlay = document.createElement('div');
        overlay.className = 'pondasi-asset-picker-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:13000;display:block;';
        var modal = document.createElement('div');
        modal.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#1E2832;border:1px solid #3C4650;border-radius:6px;padding:16px;max-width:600px;max-height:80vh;overflow:auto;';
        modal.innerHTML = '<div style="color:#E8EDF2;font-size:14px;font-weight:bold;margin-bottom:12px;">Pilih Gambar dari Asset Manager</div>';
        var grid = document.createElement('div');
        grid.style.cssText = 'display:block;font-size:0;max-height:400px;overflow-y:auto;';
        assets.forEach(function (asset) {
            var item = document.createElement('div');
            item.style.cssText = 'display:inline-block;width:120px;margin:8px;background:#0A141E;border:1px solid #3C4650;border-radius:4px;cursor:pointer;vertical-align:top;';
            item.innerHTML = '<div style="height:80px;background-size:cover;background-position:center;border-bottom:1px solid #3C4650;background-image:url(' + URL.createObjectURL(asset.blob) + ');"></div>' +
                             '<div style="padding:6px;font-size:11px;color:#E8EDF2;word-break:break-all;">' + P.escHtml(asset.nama) + '</div>' +
                             '<div style="padding:0 6px 6px;font-size:10px;color:#5A646E;">' + asset.width + 'x' + asset.height + ' · ' + P.formatBytes(asset.compressedSize) + '</div>';
            item.onclick = function () {
                var url = URL.createObjectURL(asset.blob);
                var nama = asset.nama;
                var meta = {
                    width: asset.width,
                    height: asset.height,
                    alt: asset.nama.replace(/\.[^.]+$/, '')
                };
                document.body.removeChild(overlay);
                if (callback) callback(url, nama, meta);
            };
            grid.appendChild(item);
        });
        modal.appendChild(grid);
        // Tombol batal
        var btnBatal = document.createElement('button');
        btnBatal.type = 'button';
        btnBatal.textContent = 'Batal';
        btnBatal.style.cssText = 'display:block;margin:12px auto 0;padding:6px 16px;background:#3C4650;color:#E8EDF2;border:1px solid #5A646E;border-radius:4px;cursor:pointer;font-size:12px;';
        btnBatal.onclick = function () {
            document.body.removeChild(overlay);
            if (callback) callback(null, null, null);
        };
        modal.appendChild(btnBatal);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    });
};
