/* PONDASI-PANEL-KELAS.JS
   Panel properti dinamis berbasis kelas (Fase 3e, 4, 5):
   - A. Tampilkan kelas lain dalam 1 komponen (multi-class)
   - B. Tombol "+" untuk tambah properti
   - C. Pseudo-class tabs (Normal / :hover / :focus / :active / ...)
   - E. Auto-clone class saat user ubah value (custom class management)
   */
var P = P || {};

/* === HELPER: DAPATKAN SEMUA KELAS DARI BLOCK ===
   Block punya kelas utama di block.kelas (mis. "tombol tombol-berisi")
   + kelas dari isi HTML (mis. kartu → kartu-kepala, kartu-badan)
   Return: ['tombol', 'tombol-berisi', 'kartu-kepala', 'kartu-badan']
   */
P.getBlockAllClasses = function (block) {
    var semua = [];
    var seen = {};

    // 1. Dari block.kelas (split spasi)
    if (block.kelas) {
        var tokens = block.kelas.split(/\s+/);
        for (var i = 0; i < tokens.length; i++) {
            var t = tokens[i].trim();
            if (t && !seen[t]) { seen[t] = true; semua.push(t); }
        }
    }

    // 2. Dari block.isi (parse HTML untuk cari class="...")
    if (block.isi && typeof block.isi === 'string') {
        var classRegex = /class\s*=\s*["']([^"']+)["']/g;
        var m;
        while ((m = classRegex.exec(block.isi)) !== null) {
            var klsTokens = m[1].split(/\s+/);
            for (var j = 0; j < klsTokens.length; j++) {
                var kt = klsTokens[j].trim();
                if (kt && !seen[kt]) { seen[kt] = true; semua.push(kt); }
            }
        }
    }

    return semua;
};

/* === HELPER: DAPATKAN SEMUA KELAS DARI REGION ===
   Region punya kelas di node.classes (array)
   */
P.getRegionAllClasses = function (node) {
    if (!node || !node.classes) return [];
    var semua = [];
    var seen = {};
    for (var i = 0; i < node.classes.length; i++) {
        var c = node.classes[i];
        if (c && !seen[c]) { seen[c] = true; semua.push(c); }
    }
    return semua;
};

/* === A+C: RENDER BAGIAN "KELAS TERPAKAI" UNTUK BLOCK ===
   Untuk setiap kelas yang dipakai block, tampilkan rules dari scanner.
   Termasuk pseudo-class tabs.
   */
P.renderRulesFields = function (rules, namaKelas, pseudo, block) {
    var html = '';

    // Daftar properti yang selalu tampil (meski kosong) — dikelompokkan per kategori
    var kategori = [
        { judul: 'Tata Letak', props: ['display', 'position', 'width', 'height', 'float', 'clear', 'z-index', 'overflow', 'overflow-x', 'overflow-y', 'vertical-align', 'box-sizing'] },
        { judul: 'Jarak Tepian (Margin)', props: ['margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'margin'] },
        { judul: 'Tepi Dalam (Padding)', props: ['padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'padding'] },
        { judul: 'Garis Luar (Border)', props: ['border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width', 'border-style', 'border-color', 'border-radius'] },
        { judul: 'Warna & Latar', props: ['color', 'background-color', 'background-image', 'background-repeat', 'background-position'] },
        { judul: 'Tipografi', props: ['font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'word-spacing', 'text-align', 'text-decoration', 'text-transform', 'white-space'] },
        { judul: 'Efek Visual', props: ['opacity', 'box-shadow', 'text-shadow', 'cursor', 'transition', 'transform', 'animation', 'outline', 'outline-offset', 'filter', 'visibility'] }
    ];

    for (var ci = 0; ci < kategori.length; ci++) {
        var kat = kategori[ci];
        html += '<div class="pondasi-properti-kelas-subgrup">';
        html += '<div class="pondasi-properti-kelas-subgrup-judul">' + kat.judul + '</div>';

        for (var pi = 0; pi < kat.props.length; pi++) {
            var prop = kat.props[pi];
            var val = rules[prop] || '';
            var label = P.formatLabelProperti(prop);
            var jenis = P.deteksiJenisProperti(prop, val);

            // Box properties (margin/padding/border 4 sisi) → fieldset
            if (prop === 'margin' || prop === 'padding' || (prop.indexOf('-width') >= 0 && prop.indexOf('border') >= 0)) {
                // Skip — sudah ditampilkan per sisi (margin-top, margin-right, dll)
                // Kecuali kalau prop = 'margin' atau 'padding' (shorthand) → tampilkan sebagai fieldset 4 sisi
                if (prop === 'margin' || prop === 'padding') {
                    var sisi = ['atas', 'kanan', 'bawah', 'kiri'];
                    var unit = 'rem';
                    var inputs = '';
                    for (var si = 0; si < sisi.length; si++) {
                        var sval = rules[prop + '-' + sisi[si]] || '';
                        if (!sval && prop === 'margin') sval = rules['margin-' + sisi[si]] || '';
                        if (!sval && prop === 'padding') sval = rules['padding-' + sisi[si]] || '';
                        inputs += '<span class="pondasi-properti-sisi">' + sisi[si][0] + '</span>' +
                            '<input type="text" class="pondasi-properti-num" ' +
                            'data-field="rule.' + namaKelas + '.' + (pseudo || '') + '.' + prop + '-' + sisi[si] + '" ' +
                            'data-jenis="rule-teks" data-mode="rule" data-kelas="' + P.escAttr(namaKelas) + '" ' +
                            'data-pseudo="' + P.escAttr(pseudo || '') + '" data-prop="' + P.escAttr(prop + '-' + sisi[si]) + '" ' +
                            'value="' + P.escAttr(sval) + '" placeholder="-" style="width:36px;">';
                    }
                    html += '<fieldset class="pondasi-properti-fieldset"><legend>' + label + '</legend>' + inputs + '</fieldset>';
                }
                continue;
            }

            // Color picker (persegi)
            if (jenis === 'warna') {
                html += '<div class="pondasi-properti-baris pondasi-properti-baris-inline">' +
                    '<label class="pondasi-properti-label">' + P.escHtml(label) + '</label>' +
                    '<button type="button" class="pondasi-properti-warna-btn" ' +
                    'data-field="rule.' + namaKelas + '.' + (pseudo || '') + '.' + prop + '" ' +
                    'data-jenis="rule-warna" data-mode="rule" data-kelas="' + P.escAttr(namaKelas) + '" ' +
                    'data-pseudo="' + P.escAttr(pseudo || '') + '" data-prop="' + P.escAttr(prop) + '" ' +
                    'data-action="swatch-rule" title="' + P.escAttr(prop) + '"' +
                    (val ? ' style="background:' + P.escAttr(val) + '"' : '') + '></button>' +
                    '</div>';
            } else {
                // Default: text input 2 kolom dengan datalist untuk value
                var listId = P.getValueDatalistId(prop);
                html += '<div class="pondasi-properti-baris">' +
                    '<label class="pondasi-properti-label">' + P.escHtml(label) + '</label>' +
                    '<input type="text" class="pondasi-properti-input" ' +
                    'data-field="rule.' + namaKelas + '.' + (pseudo || '') + '.' + prop + '" ' +
                    'data-jenis="rule-teks" data-mode="rule" data-kelas="' + P.escAttr(namaKelas) + '" ' +
                    'data-pseudo="' + P.escAttr(pseudo || '') + '" data-prop="' + P.escAttr(prop) + '" ' +
                    'value="' + P.escAttr(val) + '" placeholder="-"' +
                    (listId ? ' list="' + listId + '"' : '') + '>' +
                    '</div>';
            }
        }
        html += '</div>'; // subgrup
    }

    // Tambah properti yang ada di kelas tapi tidak di kategori di atas
    var ada = {};
    for (var k = 0; k < kategori.length; k++) {
        for (var kp = 0; kp < kategori[k].props.length; kp++) {
            ada[kategori[k].props[kp]] = true;
        }
    }
    var extraProps = Object.keys(rules).filter(function(p) { return !ada[p]; });
    if (extraProps.length > 0) {
        html += '<div class="pondasi-properti-kelas-subgrup">';
        html += '<div class="pondasi-properti-kelas-subgrup-judul">Lainnya</div>';
        for (var ei = 0; ei < extraProps.length; ei++) {
            var ep = extraProps[ei];
            var ev = rules[ep] || '';
            var el = P.formatLabelProperti(ep);
            html += '<div class="pondasi-properti-baris">' +
                '<label class="pondasi-properti-label">' + P.escHtml(el) + '</label>' +
                '<input type="text" class="pondasi-properti-input" ' +
                'data-field="rule.' + namaKelas + '.' + (pseudo || '') + '.' + ep + '" ' +
                'data-jenis="rule-teks" data-mode="rule" data-kelas="' + P.escAttr(namaKelas) + '" ' +
                'data-pseudo="' + P.escAttr(pseudo || '') + '" data-prop="' + P.escAttr(ep) + '" ' +
                'value="' + P.escAttr(ev) + '" placeholder="-">' +
                '</div>';
        }
        html += '</div>';
    }

    return html;
};

/* === HELPER: DAPATKAN DATALIST ID UNTUK VALUE PROPERTI ===
   Beberapa properti punya value yang bisa di-autocomplete (display, position, dll).
   */
P.getValueDatalistId = function(prop) {
    var map = {
        'display': 'pondasi-val-display',
        'position': 'pondasi-val-position',
        'float': 'pondasi-val-float',
        'clear': 'pondasi-val-clear',
        'overflow': 'pondasi-val-overflow',
        'text-align': 'pondasi-val-text-align',
        'font-weight': 'pondasi-val-font-weight',
        'font-style': 'pondasi-val-font-style',
        'text-transform': 'pondasi-val-text-transform',
        'text-decoration': 'pondasi-val-text-decoration',
        'white-space': 'pondasi-val-white-space',
        'vertical-align': 'pondasi-val-vertical-align',
        'border-style': 'pondasi-val-border-style',
        'border-collapse': 'pondasi-val-border-collapse',
        'cursor': 'pondasi-val-cursor',
        'box-sizing': 'pondasi-val-box-sizing',
        'background-repeat': 'pondasi-val-bg-repeat',
        'background-attachment': 'pondasi-val-bg-attachment',
        'list-style-type': 'pondasi-val-list-type',
        'list-style-position': 'pondasi-val-list-pos',
        'visibility': 'pondasi-val-visibility',
        'resize': 'pondasi-val-resize',
        'user-select': 'pondasi-val-user-select'
    };
    return map[prop] || null;
};

/* === POPULATE VALUE DATALISTS ===
   Dipanggil di init untuk buat <datalist> untuk value autocomplete.
   */
P.populateValueDatalists = function() {
    var datalists = {
        'pondasi-val-display': ['block', 'inline', 'inline-block', 'table', 'table-cell', 'none', 'inherit'],
        'pondasi-val-position': ['static', 'relative', 'absolute', 'fixed', 'sticky', 'inherit'],
        'pondasi-val-float': ['left', 'right', 'none', 'inherit'],
        'pondasi-val-clear': ['left', 'right', 'both', 'none', 'inherit'],
        'pondasi-val-overflow': ['visible', 'hidden', 'scroll', 'auto', 'inherit'],
        'pondasi-val-text-align': ['left', 'right', 'center', 'justify', 'inherit'],
        'pondasi-val-font-weight': ['normal', 'bold', '300', '400', '500', '600', '700', 'inherit'],
        'pondasi-val-font-style': ['normal', 'italic', 'oblique', 'inherit'],
        'pondasi-val-text-transform': ['none', 'capitalize', 'uppercase', 'lowercase', 'inherit'],
        'pondasi-val-text-decoration': ['none', 'underline', 'overline', 'line-through', 'inherit'],
        'pondasi-val-white-space': ['normal', 'pre', 'nowrap', 'pre-wrap', 'pre-line', 'inherit'],
        'pondasi-val-vertical-align': ['baseline', 'top', 'middle', 'bottom', 'sub', 'super', 'text-top', 'text-bottom', 'inherit'],
        'pondasi-val-border-style': ['none', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset', 'inherit'],
        'pondasi-val-border-collapse': ['collapse', 'separate', 'inherit'],
        'pondasi-val-cursor': ['auto', 'default', 'pointer', 'text', 'wait', 'help', 'move', 'not-allowed', 'crosshair', 'grab', 'grabbing', 'inherit'],
        'pondasi-val-box-sizing': ['content-box', 'border-box', 'inherit'],
        'pondasi-val-bg-repeat': ['repeat', 'repeat-x', 'repeat-y', 'no-repeat', 'inherit'],
        'pondasi-val-bg-attachment': ['scroll', 'fixed', 'local', 'inherit'],
        'pondasi-val-list-type': ['disc', 'circle', 'square', 'decimal', 'lower-roman', 'upper-roman', 'lower-alpha', 'upper-alpha', 'none', 'inherit'],
        'pondasi-val-list-pos': ['inside', 'outside', 'inherit'],
        'pondasi-val-visibility': ['visible', 'hidden', 'collapse', 'inherit'],
        'pondasi-val-resize': ['none', 'both', 'horizontal', 'vertical', 'inherit'],
        'pondasi-val-user-select': ['auto', 'none', 'text', 'all', 'inherit']
    };
    for (var id in datalists) {
        if (!datalists.hasOwnProperty(id)) continue;
        var dl = document.getElementById(id);
        if (!dl) {
            dl = document.createElement('datalist');
            dl.id = id;
            document.body.appendChild(dl);
        }
        var html = '';
        for (var i = 0; i < datalists[id].length; i++) {
            html += '<option value="' + datalists[id][i] + '"></option>';
        }
        dl.innerHTML = html;
    }
};

/* === B: TOMBOL "+ TAMBAH PROPERTI" ===
   Klik → tampilkan dropdown whitelist properti dari CSS_SPEC.
   */
P.renderTambahPropertiButton = function (namaKelas, pseudo) {
    return '<div class="pondasi-properti-tambah-prop">' +
        '<button type="button" class="pondasi-properti-tambah-btn" ' +
        'data-action="tambah-properti" data-kelas="' + P.escAttr(namaKelas) + '" ' +
        'data-pseudo="' + P.escAttr(pseudo || '') + '">' +
        '<i class="fa-solid fa-plus" aria-hidden="true"></i> Tambah properti' +
        '</button>' +
        '</div>';
};

/* === HELPER: DETEKSI JENIS FIELD DARI PROP+VALUE ===
   - Kalau value match #hex atau rgb/rgba → 'warna'
   - Kalau value match /^\d/ (mulai angka) → 'angka'
   - Kalau properti di whitelist warna (color, background-color, border-color, dll) → 'warna'
   - Kalau properti di whitelist select (display, position, dll) → 'pilih'
   - Default → 'teks'
   */
P.deteksiJenisProperti = function (prop, val) {
    prop = prop.toLowerCase();
    val = String(val || '');

    // Cek apakah properti warna
    var propWarna = ['color', 'background-color', 'background', 'border-color', 'border',
        'outline-color', 'outline', 'box-shadow', 'text-shadow', 'fill', 'stroke'];
    if (propWarna.indexOf(prop) >= 0) {
        // Tapi kalau value mengandung pattern selain warna (mis. "1px solid #000"), tetap teks
        if (/^(#[0-9a-fA-F]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(|transparent|inherit|currentColor)$/.test(val.trim())) {
            return 'warna';
        }
        if (prop === 'background-color' || prop === 'color' || prop === 'border-color') return 'warna';
    }

    // Cek apakah value angka
    if (/^-?\d/.test(val) && !/\s/.test(val.trim())) return 'angka';

    return 'teks';
};

/* === HELPER: FORMAT LABEL DARI NAMA PROPERTI (manusiawi) ===
   Mis. "background-color" → "Warna latar"
   "padding" → "Padding (tepi dalam)"
   */
P.formatLabelProperti = function(prop) {
    var map = {
        'display': 'Tampilan',
        'position': 'Posisi',
        'width': 'Lebar',
        'height': 'Tinggi',
        'padding': 'Padding (tepi dalam)',
        'padding-top': 'Padding atas',
        'padding-right': 'Padding kanan',
        'padding-bottom': 'Padding bawah',
        'padding-left': 'Padding kiri',
        'margin': 'Margin (jarak tepian)',
        'margin-top': 'Margin atas',
        'margin-right': 'Margin kanan',
        'margin-bottom': 'Margin bawah',
        'margin-left': 'Margin kiri',
        'border': 'Garis luar',
        'border-width': 'Tebal garis',
        'border-style': 'Gaya garis',
        'border-color': 'Warna garis',
        'border-top': 'Garis atas',
        'border-right': 'Garis kanan',
        'border-bottom': 'Garis bawah',
        'border-left': 'Garis kiri',
        'border-radius': 'Sudut melengkung',
        'border-top-left-radius': 'Sudut kiri atas',
        'border-top-right-radius': 'Sudut kanan atas',
        'border-bottom-left-radius': 'Sudut kiri bawah',
        'border-bottom-right-radius': 'Sudut kanan bawah',
        'background': 'Latar',
        'background-color': 'Warna latar',
        'background-image': 'Gambar latar',
        'background-repeat': 'Ulang latar',
        'background-position': 'Posisi latar',
        'background-size': 'Ukuran latar',
        'background-attachment': 'Lampiran latar',
        'color': 'Warna teks',
        'font': 'Font',
        'font-family': 'Keluarga font',
        'font-size': 'Ukuran font',
        'font-style': 'Gaya font',
        'font-variant': 'Varian font',
        'font-weight': 'Tebal font',
        'line-height': 'Tinggi baris',
        'letter-spacing': 'Spasi huruf',
        'word-spacing': 'Spasi kata',
        'text-align': 'Rata teks',
        'text-decoration': 'Dekorasi teks',
        'text-indent': 'Indent teks',
        'text-transform': 'Transformasi teks',
        'text-shadow': 'Bayangan teks',
        'vertical-align': 'Rata vertikal',
        'white-space': 'Ruang putih',
        'list-style': 'Gaya daftar',
        'list-style-type': 'Tipe daftar',
        'list-style-position': 'Posisi daftar',
        'list-style-image': 'Gambar daftar',
        'table-layout': 'Tata tabel',
        'border-collapse': 'Rapat border',
        'border-spacing': 'Spasi border',
        'box-shadow': 'Bayangan kotak',
        'box-sizing': 'Ukuran kotak',
        'opacity': 'Kecerahan',
        'transform': 'Transformasi',
        'transform-origin': 'Asal transformasi',
        'transition': 'Transisi',
        'transition-property': 'Properti transisi',
        'transition-duration': 'Durasi transisi',
        'transition-timing-function': 'Fungsi transisi',
        'transition-delay': 'Jeda transisi',
        'animation': 'Animasi',
        'animation-name': 'Nama animasi',
        'animation-duration': 'Durasi animasi',
        'animation-timing-function': 'Fungsi animasi',
        'animation-delay': 'Jeda animasi',
        'animation-iteration-count': 'Pengulangan animasi',
        'animation-direction': 'Arah animasi',
        'animation-fill-mode': 'Mode animasi',
        'animation-play-state': 'Status animasi',
        'cursor': 'Kursor',
        'overflow': 'Sapu berlebih',
        'overflow-x': 'Sapu berlebih X',
        'overflow-y': 'Sapu berlebih Y',
        'float': 'Mengambang',
        'clear': 'Bersihkan',
        'z-index': 'Lapisan (z-index)',
        'visibility': 'Keterlihatan',
        'clip': 'Potong',
        'outline': 'Garis luar tipis',
        'outline-width': 'Tebal garis tipis',
        'outline-style': 'Gaya garis tipis',
        'outline-color': 'Warna garis tipis',
        'outline-offset': 'Jarak garis tipis',
        'content': 'Konten',
        'direction': 'Arah',
        'unicode-bidi': 'Unicode bidi',
        'text-overflow': 'Potong teks',
        'word-break': 'Pecah kata',
        'word-wrap': 'Bungkus kata',
        'resize': 'Ubah ukuran',
        'user-select': 'Pilih pengguna',
        'filter': 'Filter',
        'zoom': 'Zoom',
        'text-justify': 'Rata teks',
        'hyphens': 'Tanda hubung',
        'tab-size': 'Ukuran tab',
        'text-align-last': 'Rata teks akhir'
    };
    if (map[prop]) return map[prop];
    // Fallback: kapitalisasi kata
    return prop
        .replace(/-/g, ' ')
        .replace(/\b\w/g, function (c) { return c.toUpperCase(); });
};

/* === B: TAMPILKAN DROPDOWN TAMBAH PROPERTI ===
   Tampilkan modal kecil dengan list properti dari CSS_SPEC yang belum dipakai.
   Sekarang pakai <datalist> untuk autocomplete (lebih native, tidak modal).
   */
P.tampilkanTambahProperti = function (namaKelas, pseudo, btnEl) {
    var panel = btnEl.closest('.pondasi-pseudo-rules-panel-aktif') ||
                btnEl.closest('.pondasi-properti-kelas-isi');
    if (!panel) return;

    // 2 input: 1 untuk properti (autocomplete), 1 untuk value
    var html = '<div class="pondasi-properti-baris pondasi-properti-baris-rule-baru">' +
        '<label class="pondasi-properti-label pondasi-properti-label-full">Properti baru</label>' +
        '<div class="pondasi-properti-tambah-row">' +
        '<input type="text" class="pondasi-properti-input pondasi-properti-input-autocomplete" ' +
        'list="pondasi-css-properti-list" ' +
        'placeholder="nama properti..." ' +
        'data-jenis="rule-baru-prop" data-kelas="' + P.escAttr(namaKelas) + '" ' +
        'data-pseudo="' + P.escAttr(pseudo || '') + '">' +
        '<input type="text" class="pondasi-properti-input pondasi-properti-input-value" ' +
        'placeholder="value..." ' +
        'data-jenis="rule-baru-val" data-kelas="' + P.escAttr(namaKelas) + '" ' +
        'data-pseudo="' + P.escAttr(pseudo || '') + '">' +
        '<button type="button" class="pondasi-properti-tambah-confirm" ' +
        'data-action="tambah-properti-confirm" data-kelas="' + P.escAttr(namaKelas) + '" ' +
        'data-pseudo="' + P.escAttr(pseudo || '') + '" title="Tambah"><i class="fa-solid fa-check" aria-hidden="true"></i></button>' +
        '<button type="button" class="pondasi-properti-tambah-cancel" ' +
        'data-action="tambah-properti-cancel" title="Batal"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
        '</div>' +
        '</div>';

    var lama = panel.querySelector('.pondasi-properti-baris-rule-baru');
    if (lama) lama.remove();

    var tambahBtn = panel.querySelector('[data-action="tambah-properti"]');
    if (tambahBtn && tambahBtn.parentNode) {
        tambahBtn.parentNode.insertAdjacentHTML('beforebegin', html);
    } else {
        panel.insertAdjacentHTML('beforeend', html);
    }

    setTimeout(function () {
        var inp = panel.querySelector('.pondasi-properti-input-autocomplete');
        if (inp) inp.focus();
    }, 50);
};

/* === B: TUTUP MODAL TAMBAH PROPERTI === */
P.tutupTambahProperti = function () {
    var modal = document.getElementById('pondasi-tambah-prop-modal');
    if (modal) modal.remove();
};

/* === B+E: TAMBAH PROPERTI KE KELAS ===
   Trigger auto-clone class, tambahkan properti baru dengan value kosong.
   */
P.tambahPropertiKeKelas = function (namaKelas, pseudo, prop) {
    P.tutupTambahProperti();
    // Clone class & tambah properti
    P.cloneClassDanTambahProp(namaKelas, pseudo, prop, '');
    P.flash('Properti "' + prop + '" ditambahkan ke .' + namaKelas);
    P.renderPanel();
};

/* === E: AUTO-CLONE CLASS SAAT USER UBAH VALUE ===
   - Clone kelas asal jadi nama-1, nama-2, dst
   - Override properti yang diubah
   - Inject <style> untuk live preview
   - Update block.kelas atau region.classes
   - Simpan ke project.customClasses
   */
P.cloneClassDanOverride = function (namaKelasAsal, pseudo, prop, newVal) {
    if (!P.STATE.projects || !P.STATE.currentProjectId) return null;
    var project = P.STATE.projects[P.STATE.currentProjectId];
    if (!project.customClasses) project.customClasses = {};

    // Cari counter untuk nama baru
    var counter = 1;
    var namaBaru;
    do {
        namaBaru = namaKelasAsal + '-' + counter;
        counter++;
    } while (project.customClasses[namaBaru] || P.Scanner.getKelasDetail(namaBaru));

    // Dapatkan detail kelas asal
    var detail = P.Scanner.getKelasDetail(namaKelasAsal);
    if (!detail) {
        // Kelas asal tidak ditemukan — buat custom baru
        detail = { rules: {}, pseudo: {} };
    }

    // Clone rules
    var newRules = {};
    for (var r in detail.rules) {
        if (detail.rules.hasOwnProperty(r)) newRules[r] = detail.rules[r];
    }
    // Override properti yang diubah
    newRules[prop] = newVal;

    // Clone pseudo
    var newPseudo = {};
    for (var p in detail.pseudo) {
        if (detail.pseudo.hasOwnProperty(p)) {
            newPseudo[p] = {};
            for (var pr in detail.pseudo[p]) {
                if (detail.pseudo[p].hasOwnProperty(pr)) {
                    newPseudo[p][pr] = detail.pseudo[p][pr];
                }
            }
        }
    }
    // Override properti di pseudo kalau pseudo match
    if (pseudo && newPseudo[pseudo]) {
        newPseudo[pseudo][prop] = newVal;
        // Hapus dari rules utama kalau ada di pseudo
        // (sebenarnya tetap ada di rules utama, tapi pseudo override)
    } else if (pseudo) {
        // Pseudo belum ada — buat baru
        newPseudo[pseudo] = {};
        newPseudo[pseudo][prop] = newVal;
    }

    // Simpan ke customClasses
    project.customClasses[namaBaru] = {
        nama: namaBaru,
        parent: namaKelasAsal,
        rules: newRules,
        pseudo: newPseudo,
        createdAt: Date.now()
    };

    // Generate CSS string & inject ke DOM
    P.injectCustomClassCSS(namaBaru, newRules, newPseudo);

    // Update scanner cache
    if (P.Scanner.cache.kelasDetail) {
        P.Scanner.cache.kelasDetail[namaBaru] = { rules: newRules, pseudo: newPseudo };
    }

    // Update block.kelas atau region.classes
    P.terapkanKelasCustom(namaKelasAsal, namaBaru);

    P.save();
    return namaBaru;
};

/* === E: CLONE CLASS & TAMBAH PROPERTI BARU ===
   Sama seperti cloneClassDanOverride tapi untuk tambah properti (value kosong).
   */
P.cloneClassDanTambahProp = function (namaKelasAsal, pseudo, prop, val) {
    return P.cloneClassDanOverride(namaKelasAsal, pseudo, prop, val || '');
};

/* === E: INJECT CSS CLASS CUSTOM KE DOM ===
   Buat/update <style> tag untuk live preview.
   */
P.injectCustomClassCSS = function (namaKelas, rules, pseudo) {
    var styleId = 'pondasi-custom-class-' + namaKelas;
    var styleEl = document.getElementById(styleId);
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
    }
    var css = '';
    // Rules utama
    css += '.' + namaKelas + ' {\n';
    for (var r in rules) {
        if (rules.hasOwnProperty(r)) {
            css += '  ' + r + ': ' + rules[r] + ';\n';
        }
    }
    css += '}\n';
    // Pseudo
    for (var p in pseudo) {
        if (pseudo.hasOwnProperty(p)) {
            css += '.' + namaKelas + p + ' {\n';
            for (var pr in pseudo[p]) {
                if (pseudo[p].hasOwnProperty(pr)) {
                    css += '  ' + pr + ': ' + pseudo[p][pr] + ';\n';
                }
            }
            css += '}\n';
        }
    }
    styleEl.textContent = css;
};

/* === E: TERAPKAN KELAS CUSTOM KE BLOCK/REGION ===
   Ganti kelas asal dengan kelas custom di block.kelas atau region.classes.
   */
P.terapkanKelasCustom = function (namaKelasAsal, namaKelasBaru) {
    // Cek apakah ini block atau region
    if (P.STATE.editMode.selectedBlockId) {
        // Block mode
        var block = P.cariBlockById(P.STATE.editMode.selectedBlockId);
        if (!block) return;
        if (block.kelas) {
            // Replace nama kelas asal dengan nama baru
            block.kelas = block.kelas.replace(
                new RegExp('\\b' + namaKelasAsal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b'),
                function (match) {
                    // Cek apakah nama baru sudah ada di kelas
                    if (block.kelas.indexOf(namaKelasBaru) < 0) {
                        return namaKelasBaru;
                    }
                    return match;  // sudah ada, jangan replace
                }
            );
        } else {
            block.kelas = namaKelasBaru;
        }
    } else if (P.STATE.activeId) {
        // Region mode
        var node = P.getById(P.STATE.activeId);
        if (!node || !node.classes) return;
        for (var i = 0; i < node.classes.length; i++) {
            if (node.classes[i] === namaKelasAsal) {
                // Cek apakah nama baru sudah ada
                if (node.classes.indexOf(namaKelasBaru) < 0) {
                    node.classes[i] = namaKelasBaru;
                }
                break;
            }
        }
    }
};

/* === E: GENERATE CSS UNTUK EXPORT ===
   Gabungkan semua customClasses jadi 1 string CSS.
   */
P.generateCustomClassesCSS = function () {
    if (!P.STATE.projects || !P.STATE.currentProjectId) return '';
    var project = P.STATE.projects[P.STATE.currentProjectId];
    if (!project.customClasses) return '';
    var css = '/* ==========================================================================\n';
    css += '   css_kustom.css — Kelas kustom yang dibuat user via editor pondasi\n';
    css += '   ========================================================================== */\n\n';
    for (var nama in project.customClasses) {
        if (!project.customClasses.hasOwnProperty(nama)) continue;
        var cc = project.customClasses[nama];
        css += '/* dari .' + (cc.parent || '?') + ' */\n';
        css += '.' + nama + ' {\n';
        for (var r in cc.rules) {
            if (cc.rules.hasOwnProperty(r)) {
                css += '  ' + r + ': ' + cc.rules[r] + ';\n';
            }
        }
        css += '}\n';
        for (var p in cc.pseudo) {
            if (cc.pseudo.hasOwnProperty(p)) {
                css += '.' + nama + p + ' {\n';
                for (var pr in cc.pseudo[p]) {
                    if (cc.pseudo[p].hasOwnProperty(pr)) {
                        css += '  ' + pr + ': ' + cc.pseudo[p][pr] + ';\n';
                    }
                }
                css += '}\n';
            }
        }
        css += '\n';
    }
    return css;
};
