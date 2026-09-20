/* PONDASI-MEGA-DROPDOWN.JS
   Mega dropdown dinamis 2 kolom (kategori + isi) untuk editor bar.
   Sumber: SKEMA_BLOCK (built-in) + Scanner (custom classes dari CSS eksternal).
   Kelas invalid → di-skip total. Kelas valid → masuk dropdown.
   */
var P = P || {};

/* KATEGORI PRIORITAS untuk dropdown "Isi" */
P.KATEGORI_ISI = [
    { id: 'Teks', urut: 1 },
    { id: 'Daftar', urut: 2 },
    { id: 'Media', urut: 3 },
    { id: 'Tabel', urut: 4 }
];

/* KATEGORI PRIORITAS untuk dropdown "Komponen" */
P.KATEGORI_KOMPONEN = [
    { id: 'Tombol', urut: 1 },
    { id: 'Form', urut: 2 },
    { id: 'Kontainer', urut: 3 },
    { id: 'Navigasi', urut: 4 },
    { id: 'Feedback', urut: 5 },
    { id: 'Lainnya', urut: 6 }
];

/* Render mega dropdown dinamis.
   jenis: 'isi' atau 'komponen'
   */
P.renderMegaDropdown = function (jenis) {
    var ddId = jenis === 'isi' ? 'dropdown-isi' : 'dropdown-komponen';
    var dd = document.getElementById(ddId);
    if (!dd) return '';

    var kategoriList = jenis === 'isi' ? P.KATEGORI_ISI : P.KATEGORI_KOMPONEN;

    // Kumpulkan block dari SKEMA_BLOCK berdasarkan kategoriDropdown
    var blocksPerKategori = {};
    // Track kelas yang sudah dipakai built-in (untuk skip duplikat di eksternal)
    var kelasBuiltIn = {};
    Object.keys(P.SKEMA_BLOCK).forEach(function (jenisKey) {
        var skema = P.SKEMA_BLOCK[jenisKey];
        if (!skema) return;
        if (skema.kategoriDropdown !== jenis) return;
        var kat = skema.kategori || 'Lainnya';
        if (!blocksPerKategori[kat]) blocksPerKategori[kat] = [];
        blocksPerKategori[kat].push({
            jenis: jenisKey,
            nama: skema.nama,  // nama komponen, mis. "Heading 1"
            tag: skema.tag,
            kelasDefault: skema.kelasDefault || '',
            sumber: 'built-in'
        });
        // Track setiap kelas di kelasDefault
        if (skema.kelasDefault) {
            var tokens = skema.kelasDefault.split(/\s+/);
            tokens.forEach(function (t) { kelasBuiltIn[t] = true; });
        }
    });

    // Tambah kelas dari scanner (CSS eksternal + customCSS)
    // Kelas yang invalid → di-skip total
    // Kelas yang valid → masuk dropdown (skip kalau sudah ada di built-in)
    if (P.Scanner) {
        var semuaKelas = P.Scanner.getSemuaKelasValid();
        Object.keys(semuaKelas.kategori).forEach(function (kat) {
            if (!blocksPerKategori[kat]) blocksPerKategori[kat] = [];
            semuaKelas.kategori[kat].forEach(function (namaKelas) {
                // Skip kalau kelas ini sudah ada di built-in (sebagai kelasDefault tunggal)
                // Cek apakah ada built-in block dengan kelasDefault == namaKelas
                var sudahAda = false;
                for (var i = 0; i < blocksPerKategori[kat].length; i++) {
                    if (blocksPerKategori[kat][i].kelasDefault === namaKelas) {
                        sudahAda = true;
                        break;
                    }
                }
                if (sudahAda) return;

                // Buat nama yang lebih manusiawi dari nama kelas:
                // "judul-1" → "Judul 1"
                // "tombol-berisi" → "Tombol Berisi"
                // "ruas-input" → "Ruas Input"
                var namaBersih = namaKelas
                    .replace(/^t-/, '')         // buang prefix t-
                    .replace(/-t$/, '')          // buang suffix -t
                    .replace(/^tombol-/, '')     // buang prefix tombol-
                    .replace(/^ruas-/, '')       // buang prefix ruas-
                    .replace(/-/g, ' ')          // ganti - dengan spasi
                    .replace(/\b\w/g, function (c) { return c.toUpperCase(); });  // kapitalisasi

                blocksPerKategori[kat].push({
                    jenis: null,
                    nama: namaBersih,  // nama bersih, bukan .kelas
                    tag: null,
                    kelasDefault: namaKelas,
                    sumber: 'eksternal'
                });
            });
        });

        // Tambah juga kelas invalid (greyed out) supaya user tahu kelas itu ada tapi bermasalah
        if (P.STATE.projects && P.STATE.currentProjectId) {
            var project = P.STATE.projects[P.STATE.currentProjectId];
            if (project && project.cssExternal) {
                project.cssExternal.forEach(function (ext) {
                    if (ext.status !== 'ok' || !ext.classes) return;
                    ext.classes.forEach(function (k) {
                        if (k.valid) return; // skip yang valid (sudah ditambah di atas)
                        var kat = k.kategori || 'Lainnya';
                        if (!blocksPerKategori[kat]) blocksPerKategori[kat] = [];

                        // Skip kalau kelas invalid ini sudah ada (built-in atau eksternal valid)
                        if (kelasBuiltIn[k.nama]) return;
                        var sudahAdaInvalid = false;
                        for (var j = 0; j < blocksPerKategori[kat].length; j++) {
                            if (blocksPerKategori[kat][j].kelasDefault === k.nama) {
                                sudahAdaInvalid = true;
                                break;
                            }
                        }
                        if (sudahAdaInvalid) return;

                        // Buat nama bersih juga
                        var namaBersihInvalid = k.nama
                            .replace(/^t-/, '')
                            .replace(/-t$/, '')
                            .replace(/^tombol-/, '')
                            .replace(/^ruas-/, '')
                            .replace(/-/g, ' ')
                            .replace(/\b\w/g, function (c) { return c.toUpperCase(); });

                        blocksPerKategori[kat].push({
                            jenis: null,
                            nama: namaBersihInvalid,
                            tag: null,
                            kelasDefault: k.nama,
                            sumber: 'eksternal-invalid',
                            error: k.errors && k.errors.length > 0 ? k.errors[0].pesan : 'Kelas ini bermasalah (lihat tooltip).'
                        });
                    });
                });
            }
        }
    }

    // Bangun HTML mega dropdown: 2 kolom
    var html = '<div class="pondasi-mega-dropdown">';
    html += '<div class="pondasi-mega-dropdown-kategori">';
    kategoriList.forEach(function (k) {
        var items = blocksPerKategori[k.id] || [];
        if (items.length === 0) return;
        html += '<div class="pondasi-mega-dropdown-kategori-item" data-kategori="' + k.id + '" tabindex="0">';
        html += '<span class="pondasi-mega-dropdown-kategori-nama">' + k.id + '</span>';
        html += '<span class="pondasi-mega-dropdown-kategori-jumlah">' + items.length + '</span>';
        html += '</div>';
    });
    html += '</div>'; // .pondasi-mega-dropdown-kategori

    html += '<div class="pondasi-mega-dropdown-isi">';
    kategoriList.forEach(function (k) {
        var items = blocksPerKategori[k.id] || [];
        if (items.length === 0) return;
        html += '<div class="pondasi-mega-dropdown-isi-kategori" data-kategori="' + k.id + '">';
        items.forEach(function (item) {
            var isInvalid = item.sumber === 'eksternal-invalid';
            var dataAttr = 'data-jenis="' + (item.jenis || '') + '" data-kelas="' + item.kelasDefault + '" data-tag="' + (item.tag || '') + '" data-sumber="' + item.sumber + '"';
            var cls = 'pondasi-mega-dropdown-item' + (isInvalid ? ' pondasi-mega-dropdown-item-disabled' : '');
            var titleAttr = isInvalid && item.error ? ' title="' + item.error.replace(/"/g, '&quot;') + '"' : '';
            html += '<div class="' + cls + '"' + dataAttr + titleAttr + ' tabindex="0">';
            html += '<span class="pondasi-mega-dropdown-item-nama">' + item.nama + '</span>';
            if (item.tag) {
                html += '<span class="pondasi-mega-dropdown-item-tag">&lt;' + item.tag + '&gt;</span>';
            } else if (item.sumber === 'eksternal') {
                html += '<span class="pondasi-mega-dropdown-item-tag">css</span>';
            } else if (isInvalid) {
                html += '<span class="pondasi-mega-dropdown-item-tag">!</span>';
            }
            html += '</div>';
        });
        html += '</div>';
    });
    html += '</div>'; // .pondasi-mega-dropdown-isi

    html += '</div>'; // .pondasi-mega-dropdown

    dd.innerHTML = html;
    dd.setAttribute('data-mega', 'true');

    // Pasang event handler
    P.pasangMegaDropdownHandler(dd, jenis);

    return html;
};

/* Pasang handler untuk mega dropdown */
P.pasangMegaDropdownHandler = function (dd, jenis) {
    // Hover kategori → highlight item di kolom kanan
    var kategoriItems = dd.querySelectorAll('.pondasi-mega-dropdown-kategori-item');
    var isiKategoriEls = dd.querySelectorAll('.pondasi-mega-dropdown-isi-kategori');

    // Default: tampilkan kategori pertama
    if (kategoriItems.length > 0) {
        kategoriItems[0].classList.add('pondasi-mega-dropdown-kategori-item-aktif');
    }
    if (isiKategoriEls.length > 0) {
        isiKategoriEls[0].style.display = 'block';
    }
    // Sembunyikan yang lain
    for (var i = 1; i < isiKategoriEls.length; i++) {
        isiKategoriEls[i].style.display = 'none';
    }

    // Handler hover/focus kategori
    Array.prototype.forEach.call(kategoriItems, function (katEl) {
        var showKategori = function () {
            // Hapus aktif dari semua kategori
            Array.prototype.forEach.call(kategoriItems, function (k) { k.classList.remove('pondasi-mega-dropdown-kategori-item-aktif'); });
            katEl.classList.add('pondasi-mega-dropdown-kategori-item-aktif');
            // Sembunyikan semua isi kategori
            Array.prototype.forEach.call(isiKategoriEls, function (isi) { isi.style.display = 'none'; });
            // Tampilkan isi kategori yang dipilih
            var kat = katEl.getAttribute('data-kategori');
            var target = dd.querySelector('.pondasi-mega-dropdown-isi-kategori[data-kategori="' + kat + '"]');
            if (target) target.style.display = 'block';
        };
        katEl.addEventListener('mouseenter', showKategori);
        katEl.addEventListener('focus', showKategori);
    });

    // Handler klik item
    var itemEls = dd.querySelectorAll('.pondasi-mega-dropdown-item');
    Array.prototype.forEach.call(itemEls, function (itemEl) {
        itemEl.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            // Skip kalau disabled
            if (itemEl.classList.contains('pondasi-mega-dropdown-item-disabled')) {
                var title = itemEl.getAttribute('title') || 'Kelas ini bermasalah. Perbaiki di berkas CSS Anda.';
                P.flash(title);
                return;
            }
            var jenisBlock = itemEl.getAttribute('data-jenis');
            var kelasDefault = itemEl.getAttribute('data-kelas');
            var tag = itemEl.getAttribute('data-tag');
            var sumber = itemEl.getAttribute('data-sumber');

            // Insert block
            if (jenisBlock && P.SKEMA_BLOCK[jenisBlock]) {
                // Built-in block — pakai insertBlockFromSkema (handle key SKEMA_BLOCK baru)
                if (P.insertBlockFromSkema) {
                    P.insertBlockFromSkema(jenisBlock);
                } else {
                    // Fallback ke insertBlock lama (untuk backward compat)
                    P.insertBlock(jenisBlock, false);
                }
            } else if (sumber === 'eksternal' && kelasDefault) {
                // Custom class dari CSS eksternal — insert block generik (div) dengan kelas tersebut
                P.insertBlockCustom(kelasDefault, tag || 'div');
            }
            P.tutupDropdownKeyboard();
            setTimeout(function () { P.fokusKeFieldTeksBlockBaru(); }, 100);
        });
    });
};

/* Insert block custom dengan kelas dari CSS eksternal */
P.insertBlockCustom = function (kelas, tag) {
    var node = P.getById(P.STATE.editMode.regionId);
    if (!node) return;
    if (!node.blocks) node.blocks = [];
    P.pushUndo();
    var newBlock = {
        id: P.genBlockId(),
        tag: tag || 'div',
        kelas: kelas,
        isi: '',
        properti: {},
        style: {},
        aksi: {}
    };
    node.blocks.push(newBlock);
    P.save();
    P.renderBlocks();
    P.renderPanel();
};
