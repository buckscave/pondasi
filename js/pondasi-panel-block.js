/* PONDASI-PANEL-BLOCK.JS
   Panel properti komponen (block) — render + handler.
   HARUS di-load setelah pondasi-panel-field.js.
   Refactored dari pondasi-block-panel.js.
*/
var P = P || {};

P.renderPanelBlock = function(badan, block, judulEl) {
    while (badan.firstChild) badan.removeChild(badan.firstChild);

    var jenis = P.jenisBlock(block);
    var skema = P.SKEMA_BLOCK[jenis] || P.SKEMA_BLOCK['teks'];

    if (judulEl) judulEl.textContent = 'Properti: ' + (skema.nama || jenis);
    badan.setAttribute('data-mode', 'block');

    // classContext sudah di-set/di-validasi di renderPanel — jangan reset di sini

    var kontenJudul = ['Konten', 'Item', 'Sumber', 'Struktur', 'Atribut', 'Aksi', 'Tombol', 'Trigger', 'Konten & Atribut'];
    var tataLetakJudul = ['Ukuran', 'Posisi'];
    var tampilanJudul = ['Kelas', 'Tipografi', 'Status', 'Background', 'Warna', 'Posisi tooltip', 'Posisi popover'];
    // Catatan: 'Tampilan' sengaja TIDAK dimasukkan — field-nya (padding/margin/border/radius/warnaTeks/latar)
    // sudah tercakup di seksi Tata Letak (Padding/Margin) dan seksi Tampilan (Warna & Garis + Tipografi).
    // Field unik dari skema Tampilan (mis. warnaNilai pada progress) tetap di-merge ke Warna & Garis.

    // (Catatan: properti region sekarang tampil di panel terpisah — panel-properti-region.
    //  Tidak perlu embed region di sini lagi.)

    // === BREADCRUMB (di atas, setelah header) ===
    if (P.renderBreadcrumb) {
        var bc = P.renderBreadcrumb(block);
        if (bc) badan.appendChild(bc);
    }

    // === SEKSI 1: KONTEN ===
    badan.appendChild(P.buatSeksi('Konten', true, function(isi) {
        skema.bagian.forEach(function(bag) {
            if (!bag || !bag.fields) return;
            if (kontenJudul.indexOf(bag.judul) < 0) return;
            var fieldsHtml;
            try {
                fieldsHtml = bag.fields.map(function(f) {
                    return P.renderPanelFieldHtml(f, block, 'block');
                }).join('');
            } catch (e) { return; }
            isi.insertAdjacentHTML('beforeend',
                '<details class="pondasi-properti-grup"' + (bag.buka ? ' open' : '') + '>' +
                '<summary>' + bag.judul + '</summary>' +
                '<div class="pondasi-properti-isi">' + fieldsHtml + '</div>' +
                '</details>'
            );
        });
    }));

    // === SEKSI 2: TATA LETAK ===
    badan.appendChild(P.buatSeksi('Tata Letak', false, function(isi) {
        var tataLetakPseudoProps = ['display', 'position', 'width', 'height', 'float', 'z-index', 'overflow', 'margin', 'padding'];

        // Kumpulkan field normal sebagai HTML string
        var tataLetakNormalHtml = '';
        skema.bagian.forEach(function(bag) {
            if (!bag || !bag.fields) return;
            if (tataLetakJudul.indexOf(bag.judul) < 0) return;
            try { tataLetakNormalHtml += bag.fields.map(function(f) { return P.renderPanelFieldHtml(f, block, 'block'); }).join(''); }
            catch (e) {}
        });
        tataLetakNormalHtml += P.FIELDS_TATA_LETAK.map(function(f) { return P.renderPanelFieldHtml(f, block, 'block'); }).join('');
        tataLetakNormalHtml += P.renderPanelFieldHtml({ id: 'margin', label: 'atas/kanan/bawah/kiri (rem)', jenis: 'box', step: 0.25 }, block, 'block');
        tataLetakNormalHtml += P.renderPanelFieldHtml({ id: 'padding', label: 'atas/kanan/bawah/kiri (rem)', jenis: 'box', step: 0.25 }, block, 'block');

        // State tabs (field normal masuk ke tab Normal)
        var tataLetakPseudo = P.getSeksiPseudo(block, tataLetakPseudoProps, tataLetakNormalHtml);
        if (tataLetakPseudo) {
            isi.appendChild(tataLetakPseudo);
        } else {
            // Tidak ada state tabs — tampilkan dengan judul
            skema.bagian.forEach(function(bag) {
                if (!bag || !bag.fields) return;
                if (tataLetakJudul.indexOf(bag.judul) < 0) return;
                var fieldsHtml;
                try { fieldsHtml = bag.fields.map(function(f) { return P.renderPanelFieldHtml(f, block, 'block'); }).join(''); }
                catch (e) { return; }
                isi.insertAdjacentHTML('beforeend', '<details class="pondasi-properti-grup"' + (bag.buka ? ' open' : '') + '><summary>' + bag.judul + '</summary><div class="pondasi-properti-isi">' + fieldsHtml + '</div></details>');
            });
            isi.appendChild(P.buatDetails('Posisi & Ukuran', false, [P.FIELDS_TATA_LETAK.map(function(f) { return P.renderPanelFieldHtml(f, block, 'block'); }).join('')]));
            isi.appendChild(P.buatDetails('Jarak Tepian (Margin)', false, [P.renderPanelFieldHtml({ id: 'margin', label: 'atas/kanan/bawah/kiri (rem)', jenis: 'box', step: 0.25 }, block, 'block')]));
            isi.appendChild(P.buatDetails('Tepi Dalam (Padding)', false, [P.renderPanelFieldHtml({ id: 'padding', label: 'atas/kanan/bawah/kiri (rem)', jenis: 'box', step: 0.25 }, block, 'block')]));
        }
    }));

    // === SEKSI 3: TAMPILAN ===
    badan.appendChild(P.buatSeksi('Tampilan', true, function(isi) {
        // Kelas input — full width, paling atas
        var kelasVal = P.ambilNilaiBlock(block, 'kelas') || '';
        isi.insertAdjacentHTML('beforeend',
            '<div class="pondasi-properti-baris pondasi-properti-baris-full">' +
            '<label class="pondasi-properti-label pondasi-properti-label-full">Kelas</label>' +
            '<input type="text" class="pondasi-properti-input pondasi-properti-input-full" data-field="kelas" ' +
            'data-jenis="teks" data-mode="block" value="' + P.escAttr(kelasVal) + '" ' +
            'placeholder="kelas-komponen">' +
            '</div>'
        );

        var tampilanProps = ['background-color', 'color', 'border-color', 'border-width', 'border-style', 'border-radius', 'opacity', 'box-shadow', 'cursor', 'font-size', 'font-weight', 'font-style', 'line-height', 'text-align', 'letter-spacing', 'transform', 'transition', 'outline'];

        // Set field ID yang SUDAH tercakup di seksi lain (Tata Letak, Tipografi, Warna & Garis).
        // Digunakan untuk memfilter field duplikat dari skema 'Tampilan' tiap block.
        var _sudahTercakup = {
            padding: true, margin: true,
            borderLebar: true, borderGaya: true, borderWarna: true,
            radius: true, latar: true, warnaTeks: true, gambarLatar: true,
            lebar: true, tinggi: true, width: true, height: true,
            opacity: true, boxShadow: true, textShadow: true, cursor: true,
            ukuranFont: true, keluargaFont: true, tinggiBaris: true, tebal: true,
            dekorasi: true, transformasi: true, spasiHuruf: true, align: true,
            display: true, position: true, minWidth: true, maxWidth: true,
            float: true, boxSizing: true, 'z-index': true, overflow: true
        };

        // Kumpulkan field UNIK dari skema 'Tampilan' (field yang BELUM tercakup di seksi lain).
        // Contoh: warnaNilai pada block 'progress'. Field ini akan di-merge ke "Warna & Garis".
        var tampilanUnikHtml = '';
        skema.bagian.forEach(function(bag) {
            if (!bag || !bag.fields) return;
            if (bag.judul !== 'Tampilan') return;
            try {
                bag.fields.forEach(function(f) {
                    if (_sudahTercakup[f.id]) return;
                    tampilanUnikHtml += P.renderPanelFieldHtml(f, block, 'block');
                });
            } catch (e) {}
        });

        // Kumpulkan field normal sebagai HTML string
        var tampilanNormalHtml = '';
        skema.bagian.forEach(function(bag) {
            if (!bag || !bag.fields) return;
            if (tampilanJudul.indexOf(bag.judul) < 0) return;
            if (tataLetakJudul.indexOf(bag.judul) >= 0) return;
            if (bag.judul === 'Kelas') return;
            if (bag.judul === 'Tampilan') return; // field uniknya sudah di tampilanUnikHtml
            try { tampilanNormalHtml += bag.fields.map(function(f) { return P.renderPanelFieldHtml(f, block, 'block'); }).join(''); }
            catch (e) {}
        });
        tampilanNormalHtml += P.FIELDS_TAMPILAN_VISUAL.map(function(f) { return P.renderPanelFieldHtml(f, block, 'block'); }).join('');
        tampilanNormalHtml += tampilanUnikHtml;

        // State tabs (field normal masuk ke tab Normal)
        var tampilanPseudo = P.getSeksiPseudo(block, tampilanProps, tampilanNormalHtml);
        if (tampilanPseudo) {
            isi.appendChild(tampilanPseudo);
        } else {
            // Tidak ada state tabs — tampilkan dengan judul
            skema.bagian.forEach(function(bag) {
                if (!bag || !bag.fields) return;
                if (tampilanJudul.indexOf(bag.judul) < 0) return;
                if (tataLetakJudul.indexOf(bag.judul) >= 0) return;
                if (bag.judul === 'Kelas') return;
                if (bag.judul === 'Tampilan') return; // skip, field unik sudah di-merge ke Warna & Garis
                var fieldsHtml;
                try { fieldsHtml = bag.fields.map(function(f) { return P.renderPanelFieldHtml(f, block, 'block'); }).join(''); }
                catch (e) { return; }
                isi.insertAdjacentHTML('beforeend', '<details class="pondasi-properti-grup"' + (bag.buka ? ' open' : '') + '><summary>' + bag.judul + '</summary><div class="pondasi-properti-isi">' + fieldsHtml + '</div></details>');
            });
            // "Warna & Garis": FIELDS_TAMPILAN_VISUAL + field unik dari skema 'Tampilan' (mis. warnaNilai)
            var warnaGarisHtml = P.FIELDS_TAMPILAN_VISUAL.map(function(f) { return P.renderPanelFieldHtml(f, block, 'block'); }).join('') + tampilanUnikHtml;
            isi.appendChild(P.buatDetails('Warna &amp; Garis', false, [warnaGarisHtml]));
        }
    }));

    // === SEKSI 4: LANJUTAN ===
    badan.appendChild(P.buatSeksi('Lanjutan', false, function(isi) {
        isi.appendChild(P.buatDetails('Identitas', false, [
            P.renderPanelFieldHtml({ id: 'nama', label: 'Nama', jenis: 'teks',
                placeholder: 'mis. judul-utama, tombol-cta' }, block, 'block'),
            P.renderPanelFieldHtml({ id: 'id', label: 'ID HTML', jenis: 'teks',
                placeholder: 'header-utama' }, block, 'block'),
            P.renderPanelFieldHtml({ id: 'dataAtribut', label: 'Data atribut', jenis: 'textarea',
                placeholder: 'data-toggle="modal"\ndata-target="#modal-1"' }, block, 'block')
        ]));
        var cssKustomField = P.renderPanelFieldHtml({ id: 'cssKustom', label: 'CSS Kustom', jenis: 'textarea',
            placeholder: 'background: linear-gradient(...);\ntransform: rotate(5deg);' }, block, 'block');
        // Tambah elemen status validasi real-time di bawah textarea
        cssKustomField += '<div class="pondasi-css-kustom-status"></div>';
        isi.appendChild(P.buatDetails('CSS Kustom', false, [cssKustomField]));
        isi.appendChild(P.buatDetails('Animasi', false, [
            P.renderPanelFieldHtml({ id: 'transition', label: 'Transisi', jenis: 'teks',
                placeholder: 'all 0.3s ease' }, block, 'block'),
            P.renderPanelFieldHtml({ id: 'animation', label: 'Animasi', jenis: 'teks',
                placeholder: 'fade-in 0.5s ease-in' }, block, 'block'),
            P.renderPanelFieldHtml({ id: 'transform', label: 'Transformasi', jenis: 'teks',
                placeholder: 'translateY(-2px) scale(1.05)' }, block, 'block')
        ]));
        isi.appendChild(P.buatDetails('Responsif', false, [
            P.renderPanelFieldHtml({ id: 'mobile', label: 'Tampilan mobile (< 768px)', jenis: 'pilih',
                opsi: ['', 'block', 'inline', 'inline-block', 'none'] }, block, 'block'),
            P.renderPanelFieldHtml({ id: 'tablet', label: 'Tampilan tablet (< 1024px)', jenis: 'pilih',
                opsi: ['', 'block', 'inline', 'inline-block', 'none'] }, block, 'block'),
            P.renderPanelFieldHtml({ id: 'lebarMobile', label: 'Lebar mobile', jenis: 'teks',
                placeholder: '100%' }, block, 'block')
        ]));
        isi.appendChild(P.buatDetails('Kondisi (Logika Tampil)', false, [
            P.renderPanelFieldHtml({ id: 'kondisiJenis', label: 'Jenis kondisi', jenis: 'pilih',
                opsi: ['', 'scroll', 'click', 'hover-parent', 'checked-sibling'] }, block, 'block'),
            P.renderPanelFieldHtml({ id: 'kondisiTarget', label: 'Target/selector', jenis: 'teks',
                placeholder: '#toggle-btn' }, block, 'block'),
            P.renderPanelFieldHtml({ id: 'kondisiAksi', label: 'Aksi', jenis: 'pilih',
                opsi: ['', 'show', 'hide', 'toggle', 'add-class', 'remove-class'] }, block, 'block'),
            P.renderPanelFieldHtml({ id: 'kondisiKelas', label: 'Kelas (jika add/remove)', jenis: 'teks',
                placeholder: 'aktif' }, block, 'block')
        ]));
    }));
};

/* === BANTU: BUAT SEKSI COLLAPSIBLE ===
   Membuat container seksi dengan header yang bisa toggle collapse.
   */


P.ambilNilaiBlock = function(block, fieldId) {
    // Nested fields (aksi.klik.url)
    if (fieldId.indexOf('.') >= 0) {
        var parts = fieldId.split('.');
        var cur = block;
        for (var i = 0; i < parts.length; i++) {
            if (cur == null) return '';
            cur = cur[parts[i]];
        }
        return cur || '';
    }
    if (fieldId === 'kelas') return block.kelas || '';
    if (fieldId === 'isi') return block.isi || '';
    if (fieldId === 'nama') return block.nama || '';
    if (fieldId === 'cssKustom') return block.cssKustom || '';

    // HTML attribute fields (src, alt, href, name, label, placeholder, tipe, dll.)
    // Catatan: 'nama' TIDAK ada di sini — 'nama' adalah block.nama (label readable), bukan HTML name attr.
    // Kalau user butuh HTML name attribute, pakai field 'name' di skema.
    var attrFields = ['src', 'alt', 'href', 'name', 'tipe', 'placeholder',
        'label', 'nilai', 'min', 'max', 'step', 'required', 'checked', 'value'];
    if (attrFields.indexOf(fieldId) >= 0) {
        if (block.properti && block.properti[fieldId] !== undefined) {
            return block.properti[fieldId];
        }
        if (block[fieldId] !== undefined) return block[fieldId];
        return '';
    }

    // Block-level fields (judul, kepala, tooltipTeks, allowMultiple, items)
    var blockFields = ['judul', 'kepala', 'tooltipTeks', 'allowMultiple', 'items'];
    if (blockFields.indexOf(fieldId) >= 0) {
        return block[fieldId] !== undefined ? block[fieldId] : '';
    }

    // Style fields — cek 3 sumber berurutan:
    // 1. block.style (user override — inline)
    // 2. scanner data (nilai dari CSS kelas aktif)
    // 3. kosong
    var cssProp = P.fieldToCssProp(fieldId);

    // 1. Cek block.style (user override)
    if (block.style) {
        // Cek camelCase dan kebab-case
        if (block.style[cssProp] !== undefined && block.style[cssProp] !== '') return block.style[cssProp];
        var camelProp = cssProp.replace(/-([a-z])/g, function(m, c) { return c.toUpperCase(); });
        if (block.style[camelProp] !== undefined && block.style[camelProp] !== '') return block.style[camelProp];
    }

    // 2. Cek scanner data (nilai dari CSS kelas)
    if (P.getContextProperties) {
        var contextProps = P.getContextProperties(block);
        if (contextProps && contextProps.rules) {
            // Cek kebab-case (format CSS asli)
            if (contextProps.rules[cssProp] !== undefined) return contextProps.rules[cssProp];
            // Cek camelCase (format JS style)
            var camelProp2 = cssProp.replace(/-([a-z])/g, function(m, c) { return c.toUpperCase(); });
            if (contextProps.rules[camelProp2] !== undefined) return contextProps.rules[camelProp2];
        }
    }

    return '';
};

P.ambilNilaiBox = function(block, fieldId, sisi) {
    var cssProp;
    var cssPropKebab;
    if (fieldId === 'padding') { cssProp = 'padding' + P.capitalize(sisi); cssPropKebab = 'padding-' + sisi; }
    else if (fieldId === 'margin') { cssProp = 'margin' + P.capitalize(sisi); cssPropKebab = 'margin-' + sisi; }
    else if (fieldId === 'borderLebar') { cssProp = 'border' + P.capitalize(sisi) + 'Width'; cssPropKebab = 'border-' + sisi + '-width'; }
    else if (fieldId === 'radius') { cssProp = 'border' + P.capitalize(sisi) + 'Radius'; cssPropKebab = 'border-' + sisi + '-radius'; }
    else return '';

    // 1. Cek block.style (user override)
    if (block.style) {
        if (block.style[cssProp] !== undefined && block.style[cssProp] !== '') return block.style[cssProp];
        if (block.style[cssPropKebab] !== undefined && block.style[cssPropKebab] !== '') return block.style[cssPropKebab];
    }

    // 2. Cek scanner data (nilai dari CSS kelas)
    if (P.getContextProperties) {
        var contextProps = P.getContextProperties(block);
        if (contextProps && contextProps.rules) {
            if (contextProps.rules[cssPropKebab] !== undefined) return contextProps.rules[cssPropKebab];
            if (contextProps.rules[cssProp] !== undefined) return contextProps.rules[cssProp];
        }
    }

    return '';
};

/* ======================================================================
   ESCAPE HTML & ATTR
   ====================================================================== */


P.terapkanStyleBlock = function(blockEl, block) {
    if (block.style) {
        for (var prop in block.style) {
            if (block.style.hasOwnProperty(prop) && block.style[prop]) {
                blockEl.style[prop] = block.style[prop];
            }
        }
    }
    // Inline CSS kustom (mentah, dari textarea "Inline CSS" di Lanjutan)
    if (block.cssKustom && block.cssKustom.trim()) {
        // cssText adalah cara untuk apply multiple properti sekaligus dari string
        // Tapi ini akan replace seluruh style — jadi kita baca dulu yang sudah ada,
        // gabung, lalu set ulang.
        var existing = blockEl.getAttribute('style') || '';
        var combined = existing ? existing + '; ' : '';
        combined += block.cssKustom.trim();
        blockEl.setAttribute('style', combined);
    }
};

P.terapkanAksiBlock = function(blockEl, block) {
    if (!block.aksi || !block.aksi.klik) return;
    var klik = block.aksi.klik;
    if (klik.jenis === 'none' || !klik.jenis) return;

    blockEl.style.cursor = 'pointer';

    if (klik.jenis === 'link' && klik.url) {
        blockEl.addEventListener('click', function(e) {
            // Jangan trigger kalau lagi edit teks
            if (blockEl.contentEditable === 'true') return;
            e.preventDefault();
            window.location.href = klik.url;
        });
    } else if (klik.jenis === 'alert' && klik.pesan) {
        blockEl.addEventListener('click', function(e) {
            if (blockEl.contentEditable === 'true') return;
            e.preventDefault();
            alert(klik.pesan);
        });
    } else if (klik.jenis === 'kustom' && klik.kode) {
        blockEl.setAttribute('onclick', klik.kode);
    }
};

/* ======================================================================
   SERIALIZE BLOCK STYLE & AKSI FOR EXPORT
   ====================================================================== */
P.serialBlockStyle = function(block) {
    var lines = [];
    // 1. block.style (properti individual camelCase)
    if (block.style) {
        for (var prop in block.style) {
            if (block.style.hasOwnProperty(prop) && block.style[prop]) {
                var cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
                lines.push(cssProp + ': ' + block.style[prop]);
            }
        }
    }
    // 2. block.cssKustom (string CSS mentah dari textarea "Inline CSS")
    // Tidak difilter di sini — sudah divalidasi oleh scanner saat user input.
    if (block.cssKustom && block.cssKustom.trim()) {
        // Hapus ; di akhir kalau ada, supaya tidak double
        var raw = block.cssKustom.trim();
        if (raw.charAt(raw.length - 1) === ';') raw = raw.substring(0, raw.length - 1);
        lines.push(raw);
    }
    return lines.join('; ');
};

P.serialBlockAksi = function(block) {
    if (!block.aksi || !block.aksi.klik) return '';
    var klik = block.aksi.klik;
    if (klik.jenis === 'link' && klik.url) {
        // Untuk tombol, render sebagai <a href> saat export
        return ' data-aksi="link" data-aksi-url="' + P.escAttr(klik.url) + '"';
    }
    if (klik.jenis === 'alert' && klik.pesan) {
        var pesanEsc = klik.pesan.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        return ' onclick="alert(\'' + pesanEsc + '\')"';
    }
    if (klik.jenis === 'kustom' && klik.kode) {
        return ' onclick="' + P.escAttr(klik.kode) + '"';
    }
    return '';
};

/* ======================================================================
   RENDER ISI BLOCK — generate inner HTML berdasar jenis block
   ====================================================================== */
P.renderIsiBlock = function(block) {
    var jenis = P.jenisBlock(block);

    // Map modular keys ke legacy keys supaya render cases yang ada bisa dipakai
    var jenisMap = {
        'input-teks': 'form-input',
        'input-pencarian': 'form-input',
        'input-file': 'form-input',
        'input-warna': 'form-input',
        'textarea': 'form-input',
        'select': 'form-input',
        'checkbox': 'pilihan',
        'radio': 'pilihan',
        'saklar': 'pilihan',
        'daftar-bullet': 'daftar',
        'daftar-nomor': 'daftar',
        'daftar-definisi': 'daftar-definisi',
        'daftar-komponen-lainnya': 'daftar-komponen',
        'kosong': 'empty-state',
        'pemisah-teks-komponen': 'pemisah-teks',
        'garis-pemisah': 'hr',
        'tombol-berisi': 'tombol',
        'tombol-garis': 'tombol',
        'tombol-hantu': 'tombol',
        'tombol-ikon': 'tombol-ikon',
        'tombol-melayang': 'tombol-ikon',
        'grup-tombol': 'grup-tombol',
        'pesan-info': 'pesan',
        'pesan-sukses': 'pesan',
        'pesan-peringatan': 'pesan',
        'pesan-error': 'pesan'
    };
    if (jenisMap[jenis]) jenis = jenisMap[jenis];

    if (jenis === 'tombol') {
        // Render ikon kalau ada (field 'ikon' berisi class FontAwesome mis. 'fa-search')
        var teks = P.escHtml(block.isi || 'Tombol');
        if (block.ikon) {
            var ikonHtml = '<i class="fa-solid ' + P.escAttr(block.ikon) + '" aria-hidden="true"></i>';
            return ikonHtml + ' ' + teks;
        }
        return teks;
    }
    if (jenis === 'tombol-ikon') {
        // Tombol ikon: block.isi berisi nama ikon FontAwesome (mis. 'fa-search')
        var ikonCls = block.isi || 'fa-circle-question';
        return '<i class="fa-solid ' + P.escAttr(ikonCls) + '" aria-hidden="true"></i>';
    }
    if (jenis === 'grup-tombol') {
        // Grup tombol: items berisi daftar teks tombol
        if (block.items && block.items.length > 0) {
            return block.items.map(function(item) {
                var teks = typeof item === 'string' ? item : (item.isi || item.label || 'Tombol');
                return '<button type="button" class="tombol tombol-berisi">' + P.escHtml(teks) + '</button>';
            }).join('');
        }
        return '<button type="button" class="tombol tombol-berisi">Tombol 1</button>' +
               '<button type="button" class="tombol tombol-berisi">Tombol 2</button>';
    }
    if (jenis === 'pesan') {
        // Pesan (info/sukses/peringatan/error): judul + isi
        var pesanJudul = block.judul || '';
        var pesanIsi = block.isi || '';
        if (pesanJudul) {
            return '<strong>' + P.escHtml(pesanJudul) + '</strong> ' + P.escHtml(pesanIsi);
        }
        return P.escHtml(pesanIsi);
    }
    if (jenis === 'empty-state') {
        // Empty state: judul + isi + label (tombol aksi)
        var esJudul = block.judul || 'Belum ada data';
        var esIsi = block.isi || '';
        var esLabel = block.label || '';
        var html = '<div class="kosong-ikon"><i class="fa-solid fa-inbox" aria-hidden="true"></i></div>';
        html += '<h3>' + P.escHtml(esJudul) + '</h3>';
        if (esIsi) html += '<p>' + P.escHtml(esIsi) + '</p>';
        if (esLabel) html += '<button type="button" class="tombol tombol-berisi">' + P.escHtml(esLabel) + '</button>';
        return html;
    }
    if (jenis === 'kutipan') {
        var kutipanIsi = block.isi || '';
        var kutipanSumber = block.sumber || '';
        var html = P.escHtml(kutipanIsi);
        if (kutipanSumber) html += '<cite>' + P.escHtml(kutipanSumber) + '</cite>';
        return html;
    }
    if (jenis === 'singkatan') {
        var singkatIsi = block.isi || '';
        var kepanjangan = block.judul || '';
        return P.escHtml(singkatIsi);
        // Catatan: title attribute di-set via renderBlocks setAttribute
    }
    if (jenis === 'hero') {
        var heroJudul = block.judul || 'Selamat datang';
        var heroIsi = block.isi || '';
        var heroLabel = block.label || '';
        var heroUrl = block.url || '#';
        var html = '<h1>' + P.escHtml(heroJudul) + '</h1>';
        if (heroIsi) html += '<p>' + P.escHtml(heroIsi) + '</p>';
        if (heroLabel) html += '<a href="' + P.escAttr(heroUrl) + '" class="tombol tombol-berisi">' + P.escHtml(heroLabel) + '</a>';
        return html;
    }
    if (jenis === 'banner') {
        var banJudul = block.judul || '';
        var banIsi = block.isi || '';
        var banLabel = block.label || '';
        var banUrl = block.url || '#';
        var html = '';
        if (banJudul) html += '<h2>' + P.escHtml(banJudul) + '</h2>';
        if (banIsi) html += '<p>' + P.escHtml(banIsi) + '</p>';
        if (banLabel) html += '<a href="' + P.escAttr(banUrl) + '" class="tombol tombol-berisi">' + P.escHtml(banLabel) + '</a>';
        return html;
    }
    if (jenis === 'modal') {
        var modalJudul = block.judul || 'Konfirmasi';
        var modalIsi = block.isi || '';
        var modalLabel = block.label || 'Ya, lanjutkan';
        var html = '<div class="modal-kepala">' + P.escHtml(modalJudul) + '</div>';
        html += '<div class="modal-badan-isi">' + P.escHtml(modalIsi) + '</div>';
        html += '<div class="modal-kaki"><button type="button" class="tombol tombol-berisi">' + P.escHtml(modalLabel) + '</button></div>';
        return html;
    }
    if (jenis === 'drawer') {
        var drawerJudul = block.judul || 'Menu';
        var drawerIsi = block.isi || '';
        var html = '<div class="drawer-kepala">' + P.escHtml(drawerJudul) + '</div>';
        html += '<div class="drawer-badan">' + P.escHtml(drawerIsi) + '</div>';
        return html;
    }
    if (jenis === 'header') {
        var headerJudul = block.judul || 'Nama situs';
        var headerIsi = block.isi || '';
        var html = '<h1>' + P.escHtml(headerJudul) + '</h1>';
        if (headerIsi) html += '<p>' + P.escHtml(headerIsi) + '</p>';
        return html;
    }
    if (jenis === 'footer') {
        return P.escHtml(block.isi || '© 2026 Nama Perusahaan.');
    }
    if (jenis === 'breadcrumb') {
        if (block.items && block.items.length > 0) {
            return '<ul>' + block.items.map(function(item) {
                var teks = typeof item === 'string' ? item : (item.isi || item.label || '');
                return '<li><a href="#">' + P.escHtml(teks) + '</a></li>';
            }).join('') + '</ul>';
        }
        return '<ul><li><a href="#">Beranda</a></li></ul>';
    }
    if (jenis === 'pagination') {
        var hal = (block.properti && block.properti.halaman) || 2;
        var total = (block.properti && block.properti.total) || 5;
        var html = '<ul>';
        html += '<li><a href="#">&laquo;</a></li>';
        for (var p = 1; p <= total; p++) {
            var cls = (p === hal) ? ' class="aktif"' : '';
            html += '<li' + cls + '><a href="#">' + p + '</a></li>';
        }
        html += '<li><a href="#">&raquo;</a></li></ul>';
        return html;
    }
    if (jenis === 'timeline') {
        if (block.items && block.items.length > 0) {
            return '<ul>' + block.items.map(function(item) {
                var judul = item.judul || '';
                var isi = item.isi || '';
                return '<li><strong>' + P.escHtml(judul) + '</strong><p>' + P.escHtml(isi) + '</p></li>';
            }).join('') + '</ul>';
        }
        return '<ul><li><strong>2024</strong><p>Awal mula</p></li></ul>';
    }
    if (jenis === 'tree-view') {
        if (block.isi) {
            // Parse indentasi (spasi) → nested ul/li
            var lines = block.isi.split('\n');
            var html = '<ul>';
            var prevIndent = 0;
            for (var li = 0; li < lines.length; li++) {
                var line = lines[li];
                var indent = line.match(/^(\s*)/)[1].length;
                var text = line.trim();
                if (!text) continue;
                if (indent > prevIndent) html += '<ul>';
                else if (indent < prevIndent) html += '</li></ul></li>';
                else if (li > 0) html += '</li>';
                html += '<li>' + P.escHtml(text);
                prevIndent = indent;
            }
            html += '</li></ul>';
            return html;
        }
        return '<ul><li>Folder 1<ul><li>Sub-folder 1</li></ul></li></ul>';
    }
    if (jenis === 'fieldset') {
        var legend = block.judul || '';
        if (legend) return '<legend>' + P.escHtml(legend) + '</legend>';
        return '';
    }
    if (jenis === 'label-form') {
        return P.escHtml(block.isi || 'Label');
    }
    if (jenis === 'toast') {
        var toastIsi = block.isi || '';
        var toastLabel = block.label || '';
        var html = P.escHtml(toastIsi);
        if (toastLabel) html += '<button type="button" class="tombol tombol-berisi">' + P.escHtml(toastLabel) + '</button>';
        return html;
    }
    if (jenis === 'popover') {
        var popIsi = block.isi || '';
        var popJudul = block.judul || '';
        var popPosisi = (block.properti && block.properti.posisi) || 'atas';
        return P.escHtml(popIsi) +
            '<span class="popover-teks popover-' + P.escAttr(popPosisi) + '">' + P.escHtml(popJudul) + '</span>';
    }
    if (jenis === 'kartu') {
        var kepala = block.kepala || 'Judul Kartu';
        var isi = block.isi || 'Isi kartu di sini.';
        return '<div class="kartu-kepala">' + P.escHtml(kepala) + '</div>' +
            '<div class="kartu-badan">' + P.escHtml(isi) + '</div>';
    }
    if (jenis === 'akordion') {
        if (!block.items || block.items.length === 0) return '';
        return block.items.map(function(item) {
            return '<details class="akordion-item"' + (item.terbuka ? ' open' : '') + '>' +
                '<summary>' + P.escHtml(item.judul || '') + '</summary>' +
                '<div class="akordion-isi">' + P.escHtml(item.isi || '') + '</div>' +
                '</details>';
        }).join('');
    }
    if (jenis === 'tab') {
        if (!block.items || block.items.length === 0) return '';
        return block.items.map(function(item) {
            return '<button class="tab' + (item.aktif ? ' tab-aktif' : '') + '">' +
                P.escHtml(item.label || '') + '</button>';
        }).join('');
    }
    if (jenis === 'segment') {
        if (!block.items || block.items.length === 0) return '';
        return block.items.map(function(item) {
            return '<button class="segment-item' + (item.aktif ? ' segment-aktif' : '') + '">' +
                P.escHtml(item.label || '') + '</button>';
        }).join('');
    }
    if (jenis === 'toggle-grup') {
        if (!block.items || block.items.length === 0) return '';
        return block.items.map(function(item) {
            return '<button class="toggle-grup-item' + (item.aktif ? ' toggle-aktif' : '') + '">' +
                P.escHtml(item.label || '') + '</button>';
        }).join('');
    }
    if (jenis === 'menu-mendatar') {
        if (!block.items || block.items.length === 0) return '';
        return block.items.map(function(item) {
            return '<a href="' + P.escAttr(item.href || '#') + '" class="menu-mendatar-item' +
                (item.aktif ? ' menu-aktif' : '') + '">' + P.escHtml(item.label || '') + '</a>';
        }).join('');
    }
    if (jenis === 'daftar' || jenis === 'daftar-komponen') {
        if (!block.items || block.items.length === 0) return '';
        return block.items.map(function(item) {
            // item.isi boleh HTML (untuk fleksibilitas)
            return '<li class="daftar-item">' + (item.isi || '') + '</li>';
        }).join('');
    }
    if (jenis === 'daftar-definisi') {
        // Daftar definisi: block.isi berisi "Istilah: Definisi\nIstilah2: Definisi2"
        if (!block.isi) return '<dt>Istilah</dt><dd>Definisi</dd>';
        var lines = block.isi.split('\n');
        var html = '';
        for (var di = 0; di < lines.length; di++) {
            var line = lines[di].trim();
            if (!line) continue;
            var colonIdx = line.indexOf(':');
            if (colonIdx > 0) {
                html += '<dt>' + P.escHtml(line.substring(0, colonIdx).trim()) + '</dt>';
                html += '<dd>' + P.escHtml(line.substring(colonIdx + 1).trim()) + '</dd>';
            } else {
                html += '<dt>' + P.escHtml(line) + '</dt>';
            }
        }
        return html || '<dt>Istilah</dt><dd>Definisi</dd>';
    }
    if (jenis === 'bilah-aplikasi') {
        var navJudul = block.judul || 'Judul';
        var navItems = block.items || [];
        var navHtml = '<span class="bilah-judul">' + P.escHtml(navJudul) + '</span>';
        if (navItems.length > 0) {
            navHtml += '<ul>';
            navItems.forEach(function(item) {
                var teks = typeof item === 'string' ? item : (item.isi || item.label || '');
                navHtml += '<li><a href="#">' + P.escHtml(teks) + '</a></li>';
            });
            navHtml += '</ul>';
        }
        return navHtml;
    }
    if (jenis === 'mega-menu') {
        // Mega menu: items berisi "Kategori ## Item1\nItem2" format
        if (block.isi) {
            return block.isi; // tampilkan mentah dulu — parse terlalu kompleks untuk MVP
        }
        return '<div class="mega-menu-kepala">Menu</div><div class="mega-menu-isi">Kategori</div>';
    }
    if (jenis === 'figure') {
        var figSrc = block.src || '';
        var figAlt = block.alt || '';
        var figCaption = block.judul || '';
        return '<img src="' + P.escAttr(figSrc) + '" alt="' + P.escAttr(figAlt) + '">' +
               (figCaption ? '<figcaption>' + P.escHtml(figCaption) + '</figcaption>' : '');
    }
    if (jenis === 'galeri') {
        if (block.items && block.items.length > 0) {
            return block.items.map(function(item) {
                var url = typeof item === 'string' ? item : (item.isi || item.src || '');
                return '<div class="galeri-item"><img src="' + P.escAttr(url) + '" alt=""></div>';
            }).join('');
        }
        return '<div class="galeri-item"><img src="" alt=""></div><div class="galeri-item"><img src="" alt=""></div>';
    }
    if (jenis === 'pemisah') {
        return P.escHtml(block.isi || 'atau');
    }
    if (jenis === 'pesan') {
        return P.escHtml(block.isi || 'Pesan.');
    }
    if (jenis === 'chip') {
        return P.escHtml(block.isi || 'Chip');
    }
    if (jenis === 'badge') {
        return P.escHtml(block.isi || '3');
    }
    if (jenis === 'progress') {
        var nilai = (block.properti && block.properti.nilai !== undefined) ?
            block.properti.nilai : '50';
        return '<div class="progress-nilai" style="width:' + P.escAttr(nilai) + '%;"></div>';
    }
    if (jenis === 'tooltip') {
        return P.escHtml(block.isi || 'Arahkan kursor') +
            '<span class="tooltip-teks">' + P.escHtml(block.tooltipTeks || 'Tooltip') + '</span>';
    }
    if (jenis === 'avatar') {
        if (block.properti && block.properti.src) {
            return '<img src="' + P.escAttr(block.properti.src) + '" alt="Avatar">';
        }
        return '<span class="avatar-teks">' + P.escHtml(block.isi || 'AB') + '</span>';
    }
    if (jenis === 'form-input') {
        var label = (block.properti && block.properti.label) || 'Label';
        var placeholder = (block.properti && block.properti.placeholder) || '';
        var nama = (block.properti && block.properti.nama) || '';
        var tipe = (block.properti && block.properti.tipe) || 'text';
        var wajib = (block.properti && block.properti.required) ? ' required' : '';

        // Deteksi jenisInput dari block.jenis (modular key) atau block.jenisInput (legacy)
        var jenisInput = 'input';
        if (block.jenis === 'textarea') jenisInput = 'textarea';
        else if (block.jenis === 'select') jenisInput = 'select';
        else if (block.jenis === 'input-file') { jenisInput = 'input'; tipe = 'file'; }
        else if (block.jenis === 'input-warna') { jenisInput = 'input'; tipe = 'color'; }
        else if (block.jenis === 'input-pencarian') { jenisInput = 'input'; tipe = 'search'; }
        else if (block.jenisInput) jenisInput = block.jenisInput;
        // Deteksi dari isi lama (kalau ada)
        if (block.isi && block.isi.indexOf('<textarea') >= 0) jenisInput = 'textarea';
        else if (block.isi && block.isi.indexOf('<select') >= 0) jenisInput = 'select';
        else if (block.isi && block.isi.indexOf('<input') >= 0) jenisInput = 'input';

        // Extra attributes per jenis
        var extraAttrs = '';
        // input-file: accept + multiple
        if (block.jenis === 'input-file') {
            if (block.properti && block.properti.terima) extraAttrs += ' accept="' + P.escAttr(block.properti.terima) + '"';
            if (block.properti && block.properti.banyak) extraAttrs += ' multiple';
        }
        // input-warna: value (warna awal)
        if (block.jenis === 'input-warna') {
            if (block.properti && block.properti.nilai) extraAttrs += ' value="' + P.escAttr(block.properti.nilai) + '"';
        }
        // input-teks: nilai awal
        if (block.jenis === 'input-teks') {
            if (block.properti && block.properti.nilai) extraAttrs += ' value="' + P.escAttr(block.properti.nilai) + '"';
        }
        // textarea: rows
        if (jenisInput === 'textarea') {
            var rows = (block.properti && block.properti.baris) || 3;
            return '<textarea placeholder=" "' + (nama ? ' name="' + P.escAttr(nama) + '"' : '') +
                ' rows="' + rows + '"' + wajib + '></textarea><label>' + P.escHtml(label) + '</label>';
        } else if (jenisInput === 'select') {
            // Render <option> dari items (jika ada) atau dari block.isi (legacy)
            var optsHtml = '<option value="">Pilih...</option>';
            if (block.items && block.items.length > 0) {
                block.items.forEach(function(item) {
                    var val = typeof item === 'string' ? item : (item.isi || item.label || '');
                    optsHtml += '<option value="' + P.escAttr(val) + '">' + P.escHtml(val) + '</option>';
                });
            }
            return '<div class="ruas-pilih"><select' + (nama ? ' name="' + P.escAttr(nama) + '"' : '') +
                wajib + '>' + optsHtml + '</select></div><label>' + P.escHtml(label) + '</label>';
        } else {
            return '<input type="' + P.escAttr(tipe) + '" placeholder=" "' +
                (nama ? ' name="' + P.escAttr(nama) + '"' : '') +
                (placeholder ? ' data-ph="' + P.escAttr(placeholder) + '"' : '') +
                extraAttrs + wajib + '><label>' + P.escHtml(label) + '</label>';
        }
    }
    if (jenis === 'pilihan') {
        var labelText = (block.properti && block.properti.label) || 'Pilih';
        var nameP = (block.properti && block.properti.nama) || '';
        var nilaiP = (block.properti && block.properti.nilai) || '';
        var cekP = (block.properti && block.properti.checked) ? ' checked' : '';

        // Deteksi jenis pilihan dari block.jenis (modular) atau block.kelas (legacy)
        var cls = 'centang';
        var inputType = 'checkbox';
        if (block.jenis === 'saklar' || (block.kelas && block.kelas.indexOf('saklar') >= 0)) {
            cls = 'saklar';
        } else if (block.jenis === 'radio' || (block.kelas && block.kelas.indexOf('radio') >= 0)) {
            cls = 'radio';
            inputType = 'radio';
        }

        if (cls === 'saklar') {
            return '<input type="checkbox" class="saklar"' +
                (nameP ? ' name="' + P.escAttr(nameP) + '"' : '') + cekP + '> ' +
                '<span class="saklar-lacak"></span><span class="saklar-label">' + P.escHtml(labelText) + '</span>';
        }

        // Radio group: render multiple radio options dari items
        if (cls === 'radio' && block.items && block.items.length > 0) {
            var radioHtml = '';
            if (block.properti && block.properti.label) {
                radioHtml += '<div class="radio-grup-label">' + P.escHtml(block.properti.label) + '</div>';
            }
            block.items.forEach(function(item, idx) {
                var teks = typeof item === 'string' ? item : (item.isi || item.label || '');
                var val = typeof item === 'string' ? item : (item.nilai || teks);
                var checked = (idx === 0) ? ' checked' : '';
                radioHtml += '<label class="radio-pilihan">' +
                    '<input type="radio" class="radio" name="' + P.escAttr(nameP || 'radio-grup') + '"' +
                    ' value="' + P.escAttr(val) + '"' + checked + '> ' +
                    '<span>' + P.escHtml(teks) + '</span></label>';
            });
            return radioHtml;
        }

        // Checkbox tunggal
        return '<label class="centang-pilihan"><input type="' + inputType + '" class="' + cls + '"' +
            (nameP ? ' name="' + P.escAttr(nameP) + '"' : '') +
            (nilaiP ? ' value="' + P.escAttr(nilaiP) + '"' : '') + cekP + '> ' +
            '<span>' + P.escHtml(labelText) + '</span></label>';
    }
    if (jenis === 'slider') {
        // Slider: render <input type="range"> dengan min/max/step/nilai
        var slMin = (block.properti && block.properti.min !== undefined) ? block.properti.min : 0;
        var slMax = (block.properti && block.properti.max !== undefined) ? block.properti.max : 100;
        var slStep = (block.properti && block.properti.step !== undefined) ? block.properti.step : 1;
        var slNilai = (block.properti && block.properti.nilai !== undefined) ? block.properti.nilai : 50;
        var slName = (block.properti && block.properti.nama) || '';
        return '<input type="range" class="deret" min="' + P.escAttr(slMin) + '" max="' + P.escAttr(slMax) +
            '" step="' + P.escAttr(slStep) + '" value="' + P.escAttr(slNilai) + '"' +
            (slName ? ' name="' + P.escAttr(slName) + '"' : '') + '>';
    }
    if (jenis === 'stepper') {
        var valSt = (block.properti && block.properti.nilai) || '0';
        var minSt = (block.properti && block.properti.min) !== undefined ?
            ' min="' + P.escAttr(block.properti.min) + '"' : '';
        var maxSt = (block.properti && block.properti.max) !== undefined ?
            ' max="' + P.escAttr(block.properti.max) + '"' : '';
        var stepSt = (block.properti && block.properti.step) !== undefined ?
            ' step="' + P.escAttr(block.properti.step) + '"' : '';
        return '<input type="number" value="' + P.escAttr(valSt) + '"' +
            minSt + maxSt + stepSt + '>' +
            '<button class="langkah-tombol langkah-naik">+</button>' +
            '<button class="langkah-tombol langkah-turun">&minus;</button>';
    }
    if (jenis === 'tabel') {
        var rows = (block.properti && block.properti.baris) || 2;
        var cols = (block.properti && block.properti.kolom) || 2;
        var html = '<thead><tr>';
        for (var c = 0; c < cols; c++) html += '<th>Judul ' + (c + 1) + '</th>';
        html += '</tr></thead><tbody>';
        for (var r = 0; r < rows; r++) {
            html += '<tr>';
            for (var c2 = 0; c2 < cols; c2++) html += '<td>Sel</td>';
            html += '</tr>';
        }
        html += '</tbody>';
        return html;
    }
    if (jenis === 'spacer' || jenis === 'hr' || jenis === 'gambar') {
        return '';
    }

    // Default: return block.isi
    return block.isi || '';
};

/* ======================================================================
   APPLY SWATCH BLOCK (dipanggil dari applySwatch saat paletteOpen = 'block-...')
   ====================================================================== */
P.applySwatchBlock = function(color, field) {
    var block = P.cariBlockById(P.STATE.editMode.selectedBlockId);
    if (!block) return;
    if (!block.style) block.style = {};
    var cssProp;
    if (field === 'warnaTeks') cssProp = 'color';
    else if (field === 'latar') cssProp = 'backgroundColor';
    else if (field === 'borderWarna') cssProp = 'borderColor';
    else if (field === 'warnaNilai') cssProp = 'color';
    else cssProp = P.fieldToCssProp(field);

    if (color === '') {
        block.style[cssProp] = '';
    } else {
        block.style[cssProp] = color;
    }
    P.renderBlocks();
    P.save();
    P.renderPanel();  // Update color preview
};

/* ======================================================================
   HANDLE PANEL CHANGES (delegated)
   ====================================================================== */
P.handlePanelClickDelegated = function(e) {
    // Handler untuk tombol spinner (up/down) input angka
    var spinnerBtn = e.target.closest('.pondasi-properti-spinner-up, .pondasi-properti-spinner-down');
    if (spinnerBtn) {
        e.preventDefault();
        e.stopPropagation();
        var fieldSp = spinnerBtn.getAttribute('data-field');
        var stepSp = parseFloat(spinnerBtn.getAttribute('data-step')) || 1;
        var modeSp = spinnerBtn.getAttribute('data-mode');
        var isUpSp = spinnerBtn.classList.contains('pondasi-properti-spinner-up');
        var arahSp = isUpSp ? 1 : -1;
        var inputWrapper = spinnerBtn.closest('.pondasi-properti-num-wrapper');
        if (!inputWrapper) return;
        var numInputSp = inputWrapper.querySelector('.pondasi-properti-num');
        if (!numInputSp) return;
        var currentValSp = parseFloat(numInputSp.value) || 0;
        var newValSp = currentValSp + (stepSp * arahSp);
        if (numInputSp.min !== '' && newValSp < parseFloat(numInputSp.min)) newValSp = parseFloat(numInputSp.min);
        if (numInputSp.max !== '' && newValSp > parseFloat(numInputSp.max)) newValSp = parseFloat(numInputSp.max);
        var decimalsSp = (String(stepSp).split('.')[1] || '').length;
        newValSp = parseFloat(newValSp.toFixed(decimalsSp));
        numInputSp.value = newValSp;
        var evSp = document.createEvent('Event');
        evSp.initEvent('change', true, true);
        numInputSp.dispatchEvent(evSp);
        return;
    }

    // C. Handler untuk klik tab pseudo-class
    var pseudoTab = e.target.closest('.pondasi-pseudo-tab');
    if (pseudoTab) {
        e.preventDefault();
        e.stopPropagation();
        var kelas = pseudoTab.getAttribute('data-kelas');
        var pseudo = pseudoTab.getAttribute('data-pseudo');
        // Hapus aktif dari semua tab di grup ini
        var tabs = pseudoTab.parentNode.querySelectorAll('.pondasi-pseudo-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].classList.remove('pondasi-pseudo-tab-aktif');
        }
        pseudoTab.classList.add('pondasi-pseudo-tab-aktif');
        // Sembunyikan semua panel rules
        var panels = pseudoTab.parentNode.parentNode.querySelectorAll('.pondasi-pseudo-rules-panel');
        for (var j = 0; j < panels.length; j++) {
            panels[j].classList.remove('pondasi-pseudo-rules-panel-aktif');
        }
        // Tampilkan panel yang dipilih
        var targetPanel = pseudoTab.parentNode.parentNode.querySelector('.pondasi-pseudo-rules-panel[data-pseudo="' + pseudo + '"][data-kelas="' + kelas + '"]');
        if (targetPanel) targetPanel.classList.add('pondasi-pseudo-rules-panel-aktif');
        return;
    }

    // B. Handler untuk tombol "+ Tambah properti"
    var tambahBtn = e.target.closest('[data-action="tambah-properti"]');
    if (tambahBtn) {
        e.preventDefault();
        e.stopPropagation();
        var namaKelas = tambahBtn.getAttribute('data-kelas');
        var pseudoTambah = tambahBtn.getAttribute('data-pseudo');
        P.tampilkanTambahProperti(namaKelas, pseudoTambah, tambahBtn);
        return;
    }

    // B. Handler untuk klik item di modal tambah properti
    var propItem = e.target.closest('.pondasi-tambah-prop-item');
    if (propItem) {
        e.preventDefault();
        e.stopPropagation();
        var prop = propItem.getAttribute('data-prop');
        var kelasItem = propItem.getAttribute('data-kelas');
        var pseudoItem = propItem.getAttribute('data-pseudo');
        P.tambahPropertiKeKelas(kelasItem, pseudoItem, prop);
        return;
    }

    // B. Handler untuk tutup modal tambah properti
    var tutupBtn = e.target.closest('[data-action="tutup-tambah-prop"]');
    if (tutupBtn) {
        e.preventDefault();
        e.stopPropagation();
        P.tutupTambahProperti();
        return;
    }

    // B. Handler untuk confirm tambah properti (lewat autocomplete)
    var confirmBtn = e.target.closest('[data-action="tambah-properti-confirm"]');
    if (confirmBtn) {
        e.preventDefault();
        e.stopPropagation();
        var kelasC = confirmBtn.getAttribute('data-kelas');
        var pseudoC = confirmBtn.getAttribute('data-pseudo');
        var barisBaru = confirmBtn.closest('.pondasi-properti-baris-rule-baru');
        if (!barisBaru) return;
        var inputProp = barisBaru.querySelector('.pondasi-properti-input-autocomplete');
        var inputVal = barisBaru.querySelector('.pondasi-properti-input-value');
        if (!inputProp || !inputProp.value.trim()) return;
        var propBaru = inputProp.value.trim().toLowerCase();
        var valBaru = inputVal ? inputVal.value.trim() : '';
        // Clone class + tambah properti + set value
        P.cloneClassDanOverride(kelasC, pseudoC, propBaru, valBaru);
        P.flash('Properti "' + propBaru + '" ditambahkan ke .' + kelasC);
        P.renderPanel();
        return;
    }

    // B. Handler untuk batal tambah properti
    var cancelBtn = e.target.closest('[data-action="tambah-properti-cancel"]');
    if (cancelBtn) {
        e.preventDefault();
        e.stopPropagation();
        var barisBatal = cancelBtn.closest('.pondasi-properti-baris-rule-baru');
        if (barisBatal) barisBatal.remove();
        return;
    }

    // E. Handler untuk swatch rule (color picker di rule kelas)
    var swatchRuleBtn = e.target.closest('[data-action="swatch-rule"]');
    if (swatchRuleBtn) {
        e.preventDefault();
        e.stopPropagation();
        var kelasR = swatchRuleBtn.getAttribute('data-kelas');
        var pseudoR = swatchRuleBtn.getAttribute('data-pseudo');
        var propR = swatchRuleBtn.getAttribute('data-prop');
        P.STATE.editMode.paletteOpen = 'rule-' + kelasR + '-' + pseudoR + '-' + propR;
        P.STATE.editMode.ruleContext = { kelas: kelasR, pseudo: pseudoR, prop: propR };
        P.openSwatches('rule-' + kelasR + '-' + pseudoR + '-' + propR);
        return;
    }

    // Jalur A: Handler untuk swatch state (color picker di tab pseudo)
    var swatchStateBtn = e.target.closest('[data-action="swatch-state"]');
    if (swatchStateBtn) {
        e.preventDefault();
        e.stopPropagation();
        var stateProp = swatchStateBtn.getAttribute('data-state-prop');
        var stateId = swatchStateBtn.getAttribute('data-state-id');
        var contextK = swatchStateBtn.getAttribute('data-context') || '';
        P.STATE.editMode.paletteOpen = 'state-' + stateId + '-' + stateProp;
        P.STATE.editMode.stateContext = { prop: stateProp, stateId: stateId, context: contextK };
        P.openSwatches('state-' + stateId + '-' + stateProp);
        return;
    }

    var target = e.target.closest('[data-action]');
    if (!target) return;
    var action = target.dataset.action;
    if (action === 'swatch-block') {
        var field = target.dataset.field;
        var mode = target.dataset.mode;
        if (mode === 'block') {
            P.STATE.editMode.paletteOpen = 'block-' + field;
            P.STATE.editMode.savedSelection = null;
            P.openSwatches('block-' + field);
        } else {
            // Region mode: delegate ke existing handler
            if (field === 'borderWarna') {
                P.STATE.editMode.paletteOpen = 'border';
                P.openSwatches('border');
            } else if (field === 'latar') {
                P.STATE.editMode.paletteOpen = 'fill';
                P.openSwatches('fill');
            }
        }
    }
};

P.handlePanelChangeDelegated = function(e) {
    var target = e.target;

    // Jalur A: State field (block pseudo-class) → simpan ke block.stateStyle
    if (target.dataset && target.dataset.stateProp) {
        var stateProp = target.dataset.stateProp;
        var stateId = target.dataset.stateId || '';
        var val = target.value || '';
        var block = P.cariBlockById(P.STATE.editMode.selectedBlockId);
        if (block) {
            P.terapkanStateOverride(block, stateId, stateProp, val);
            // Inject style untuk live preview
            P.injectStateStyle(block);
        }
        return;
    }

    // Jalur B: Rule field (penjabaran kelas) → simpan sebagai inline override (hybrid)
    if (target.dataset && target.dataset.jenis === 'rule-teks') {
        var rProp = target.dataset.prop;
        var rVal = target.value || '';
        var rBlock = P.cariBlockById(P.STATE.editMode.selectedBlockId);
        if (rBlock) {
            P.terapkanInlineOverride(rBlock, rProp, rVal);
        }
        return;
    }

    if (!target.dataset || !target.dataset.field) return;
    var mode = target.dataset.mode || 'region';
    if (mode === 'block') {
        P.terapkanPropertiBlock(target);
    } else if (mode === 'region') {
        P.terapkanPropertiRegion(target);
    }
};

P.handlePanelInputDelegated = function(e) {
    var target = e.target;

    // Jalur A: Live update untuk state field (block pseudo-class)
    if (target.dataset && target.dataset.stateProp) {
        var stateProp = target.dataset.stateProp;
        var stateId = target.dataset.stateId || '';
        var val = target.value || '';
        var block = P.cariBlockById(P.STATE.editMode.selectedBlockId);
        if (block) {
            P.terapkanStateOverride(block, stateId, stateProp, val);
            P.injectStateStyle(block);
        }
        return;
    }

    // Jalur B: Live update untuk rule field (hybrid inline override)
    if (target.dataset && target.dataset.jenis === 'rule-teks') {
        var rProp = target.dataset.prop;
        var rVal = target.value || '';
        var rBlock = P.cariBlockById(P.STATE.editMode.selectedBlockId);
        if (rBlock) {
            P.terapkanInlineOverride(rBlock, rProp, rVal);
        }
        return;
    }

    if (!target.dataset || !target.dataset.field) return;
    if (target.dataset.jenis === 'teks' || target.dataset.jenis === 'textarea' ||
        target.dataset.jenis === 'daftar' || target.dataset.jenis === 'angka' ||
        target.dataset.jenis === 'box') {
        var mode = target.dataset.mode || 'region';
        if (mode === 'block') {
            P.terapkanPropertiBlock(target);
        } else if (mode === 'region') {
            P.terapkanPropertiRegion(target);
        }
    }
};

P.terapkanPropertiBlock = function(target) {
    var block = P.cariBlockById(P.STATE.editMode.selectedBlockId);
    if (!block) return;

    var field = target.dataset.field;
    var jenis = target.dataset.jenis;
    var val = target.value;

    // Handle nested fields (aksi.klik.url, aksi.klik.jenis, dll.)
    if (field.indexOf('.') >= 0) {
        var parts = field.split('.');
        var cur = block;
        for (var i = 0; i < parts.length - 1; i++) {
            if (!cur[parts[i]]) cur[parts[i]] = {};
            cur = cur[parts[i]];
        }
        cur[parts[parts.length - 1]] = val;

        // Jika aksi-jenis berubah, re-render panel (untuk show/hide URL/pesan/kode fields)
        if (jenis === 'aksi-jenis') {
            P.renderPanel();
        }
        P.renderBlocks();
        P.save();
        return;
    }

    // Handle by jenis
    if (jenis === 'teks' || jenis === 'textarea') {
        if (field === 'kelas') {
            block.kelas = val;
        } else if (field === 'isi') {
            block.isi = val;
        } else if (field === 'nama') {
            // Nama block (readable label untuk export — bukan HTML name attribute)
            block.nama = val;
            P.renderBlocks();
            P.save();
            return;
        } else if (field === 'cssKustom') {
            // Inline CSS kustom — simpan raw di block.cssKustom + validasi scanner
            block.cssKustom = val;
            // Validasi real-time: cek apakah ada properti/value terlarang
            if (P.Scanner && P.CSS_SPEC) {
                // Bungkus CSS sebagai rule dummy untuk dipindai scanner
                var dummyCss = '.pondasi-block-temp {\n' + val + '\n}';
                var scan = P.Scanner.scanCSSString(dummyCss);
                // Filter error yang relevan (kelas dummy kita sendiri)
                var blockErrors = scan.errors.filter(function (e) {
                    return e.kelas === 'pondasi-block-temp';
                });
                // Tampilkan status di bawah textarea (jika ada elemen status)
                var statusEl = target.parentNode.parentNode.querySelector('.pondasi-css-kustom-status');
                if (statusEl) {
                    if (blockErrors.length === 0) {
                        statusEl.className = 'pondasi-css-kustom-status pondasi-css-kustom-status-ok';
                        statusEl.textContent = 'CSS valid (sesuai standar pondasi)';
                    } else {
                        statusEl.className = 'pondasi-css-kustom-status pondasi-css-kustom-status-error';
                        var firstErr = blockErrors[0];
                        statusEl.textContent = 'Pelanggaran: ' + firstErr.pesan +
                            (firstErr.value ? ' (value: ' + firstErr.value + ')' : '');
                    }
                } else if (blockErrors.length > 0) {
                    // Fallback: flash pesan error pertama
                    P.flash('CSS Kustom: ' + blockErrors[0].pesan);
                }
            }
        } else if (field === 'judul' || field === 'kepala' || field === 'tooltipTeks') {
            // Block-level field
            block[field] = val;
        } else {
            // HTML attribute atau style field
            var attrFields = ['src', 'alt', 'href', 'name', 'nama', 'tipe', 'placeholder',
                'label', 'nilai'];
            if (attrFields.indexOf(field) >= 0) {
                if (!block.properti) block.properti = {};
                block.properti[field] = val;
            } else {
                // Style field
                if (!block.style) block.style = {};
                var cssProp = P.fieldToCssProp(field);
                block.style[cssProp] = val || '';
            }
        }
    } else if (jenis === 'angka') {
        if (field === 'min' || field === 'max' || field === 'step' || field === 'nilai') {
            if (!block.properti) block.properti = {};
            block.properti[field] = val;
        } else if (field === 'tinggi') {
            // Spacer height
            if (!block.properti) block.properti = {};
            block.properti.style = 'height:' + (val || '2') + 'rem;';
        } else if (field === 'baris' || field === 'kolom') {
            if (!block.properti) block.properti = {};
            block.properti[field] = parseInt(val, 10) || 1;
        } else {
            // Style field dengan unit px
            if (!block.style) block.style = {};
            var cssPropN = P.fieldToCssProp(field);
            block.style[cssPropN] = val ? val + 'px' : '';
        }
    } else if (jenis === 'box') {
        var sisi = target.dataset.sisi;
        var unit = target.dataset.unit || 'rem';
        if (!block.style) block.style = {};
        var cssPropB = P.fieldToCssPropBox(field, sisi);
        block.style[cssPropB] = val ? val + unit : '';
    } else if (jenis === 'pilih') {
        if (field === 'borderGaya') {
            if (!block.style) block.style = {};
            block.style.borderTopStyle = val;
            block.style.borderRightStyle = val;
            block.style.borderBottomStyle = val;
            block.style.borderLeftStyle = val;
        } else if (field === 'tipe') {
            if (!block.properti) block.properti = {};
            block.properti.tipe = val;
        } else {
            if (!block.style) block.style = {};
            var cssPropP = P.fieldToCssProp(field);
            block.style[cssPropP] = val || '';
        }
    } else if (jenis === 'warna') {
        // Handled via swatches modal, not here
        return;
    } else if (jenis === 'cek') {
        var cekVal = target.checked;
        if (field === 'allowMultiple') {
            block.allowMultiple = cekVal;
        } else if (field === 'wajib') {
            if (!block.properti) block.properti = {};
            block.properti.required = cekVal;
        } else if (field === 'dicentang') {
            if (!block.properti) block.properti = {};
            block.properti.checked = cekVal;
        } else {
            block[field] = cekVal;
        }
    } else if (jenis === 'daftar') {
        var format = target.dataset.format;
        block.items = P.parseItems(val, format);
        // Untuk tab/segment/toggle-grup: pastikan hanya satu yang aktif
        if (format === 'label-aktif' && block.items.length > 0) {
            var firstAktif = -1;
            for (var iA = 0; iA < block.items.length; iA++) {
                if (block.items[iA].aktif) {
                    if (firstAktif >= 0) block.items[iA].aktif = false;
                    else firstAktif = iA;
                }
            }
            // Tidak ada yang aktif → aktifkan yang pertama
            if (firstAktif < 0) block.items[0].aktif = true;
        }
    }

    P.renderBlocks();
    P.save();
};

/* ======================================================================
   REGION PROPERTIES — ambil/terapkan properti region ke customCSS
   Untuk panel properti region (bukan block).
   Region pakai P.STATE.customCSS[regionId] = { className, rules, pseudo }
   ====================================================================== */

/* Ambil nilai properti region dari customCSS, scanner data (kelas region), atau DOM
   Priority: customCSS user override > scanner data (dari kelas pondasi.css) > kosong */


