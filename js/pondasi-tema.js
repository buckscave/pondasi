/* PONDASI-TEMA.JS
   Modul untuk load tema (manifest), pilih tema saat buat dokumen,
   dan tree-shaking CSS saat export (hanya include kelas yang dipakai).
   */
var P = P || {};

P.Tema = {
    /* Cache tema yang sudah di-load */
    cache: {
        tema: {}
    },

    /* Tema yang sedang aktif di project */
    aktif: null,

    /* Manifest default pondasi — INLINE (tidak perlu fetch XHR).
       Penting: kalau pondasi dibuka via file:// (offline), XHR fetch diblokir CORS.
       Inline manifest menghindari masalah itu.
       Untuk tema custom, user bisa pakai file picker (FileReader API).
       */
    manifestDefault: {
        id: 'pondasi-default',
        nama: 'Pondasi Default',
        deskripsi: 'Tema default pondasi — Material Design, flat, modern, clean & minimalis',
        versi: '1.0',
        induk: 'tampilan.css',
        warnaUtama: '#00AAD4',
        warnaSekunder: '#00B482',
        berkas: [
            'tampilan.css',
            'tampilan-teks.css',
            'tampilan-teks-tambahan.css',
            'tampilan-daftar.css',
            'tampilan-media.css',
            'tampilan-tabel.css',
            'tampilan-tombol.css',
            'tampilan-form.css',
            'tampilan-kontainer.css',
            'tampilan-navigasi.css',
            'tampilan-feedback.css',
            'tampilan-lainnya.css'
        ],
        kategori: [
            'Teks', 'Daftar', 'Media', 'Tabel',
            'Tombol', 'Form', 'Kontainer', 'Navigasi', 'Feedback', 'Lainnya'
        ]
    },

    /* Load manifest — pakai inline manifest default, TANPA fetch XHR.
       Ini bekerja offline (file://) tanpa masalah CORS.
       */
    loadManifest: function (callback) {
        var manifest = this.manifestDefault;
        var temaId = manifest.id;
        this.cache.tema[temaId] = {
            id: temaId,
            nama: manifest.nama,
            deskripsi: manifest.deskripsi,
            versi: manifest.versi,
            induk: manifest.induk,
            berkas: manifest.berkas || [],
            kategori: manifest.kategori || [],
            warnaUtama: manifest.warnaUtama,
            warnaSekunder: manifest.warnaSekunder
        };
        this.aktif = temaId;
        if (callback) callback(this.cache.tema[temaId]);
    },

    /* Dapatkan tema aktif */
    getTemaAktif: function () {
        if (!this.aktif) return null;
        return this.cache.tema[this.aktif];
    },

    /* Dapatkan list semua berkas CSS tema aktif */
    getBerkasTema: function () {
        var tema = this.getTemaAktif();
        if (!tema) return [];
        return tema.berkas.map(function (b) { return 'css/' + b; });
    },

    /* Generate <link> tags untuk tema aktif (untuk HTML export) */
    generateLinkTags: function () {
        var berkas = this.getBerkasTema();
        var html = '';
        berkas.forEach(function (b) {
            html += '<link rel="stylesheet" href="' + b + '">\n';
        });
        return html;
    },

    /* === TREE-SHAKING: ambil hanya kelas yang dipakai di project === */
    treeShakeCSS: function (callback) {
        var self = this;
        var tema = this.getTemaAktif();
        if (!tema) {
            if (callback) callback('');
            return;
        }

        // 1. Kumpulkan semua kelas yang dipakai di tree
        var kelasDipakai = {};
        var tambahKelas = function (kelasStr) {
            if (!kelasStr) return;
            var tokens = kelasStr.split(/\s+/);
            tokens.forEach(function (t) {
                if (t) kelasDipakai[t] = true;
            });
        };

        var walkNode = function (node) {
            if (!node) return;
            if (node.classes) {
                node.classes.forEach(function (c) { kelasDipakai[c] = true; });
            }
            if (node.blocks) {
                node.blocks.forEach(function (block) {
                    tambahKelas(block.kelas);
                });
            }
            if (node.children) {
                node.children.forEach(walkNode);
            }
        };
        walkNode(P.STATE.tree);

        if (P.STATE.customCSS) {
            Object.keys(P.STATE.customCSS).forEach(function (rid) {
                var css = P.STATE.customCSS[rid];
                if (css && css.className) kelasDipakai[css.className] = true;
            });
        }


        // 2. Fetch semua berkas tema (kalau online). Kalau offline, fallback ke kosong.
        var semuaCSS = '';
        var berkasTersisa = tema.berkas.slice();
        var fetchBerikutnya = function () {
            if (berkasTersisa.length === 0) {
                var filtered = self.filterCSSByClasses(semuaCSS, kelasDipakai);
                if (callback) callback(filtered);
                return;
            }
            var berkas = berkasTersisa.shift();
            var url = 'css/' + berkas;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState !== 4) return;
                if (xhr.status === 200 || (xhr.status === 0 && xhr.responseText)) {
                    semuaCSS += '\n/* === ' + berkas + ' === */\n' + xhr.responseText;
                } else {
                    console.warn('[pondasi Tema] tidak bisa fetch ' + berkas + ' (HTTP ' + xhr.status + '). Mungkin offline mode (file://).');
                }
                fetchBerikutnya();
            };
            try {
                xhr.send();
            } catch (e) {
                console.warn('[pondasi Tema] XHR error untuk ' + berkas + ': ' + e.message);
                fetchBerikutnya();
            }
        };
        fetchBerikutnya();
    },

    /* Filter CSS string — ambil hanya rule yang punya kelas di `kelasDipakai` */
    filterCSSByClasses: function (cssText, kelasDipakai) {
        var hasil = [];
        if (!cssText) return '';

        var cssNoComment = cssText.replace(/\/\*[\s\S]*?\*\//g, '');

        // Pakai balanced-brace parser supaya bisa handle nested { } (@media, @supports, @keyframes)
        var rules = this._parseRulesBalanced(cssNoComment);
        for (var ri = 0; ri < rules.length; ri++) {
            var selectorRaw = rules[ri].selector.trim();
            var body = rules[ri].body.trim();
            if (!selectorRaw || !body) continue;

            if (selectorRaw.charAt(0) === '@') {
                // Untuk at-rule @media, recurse ke body dan tree-shake rule di dalamnya.
                // Untuk @keyframes/@font-face/@page — pertahankan apa adana (tidak ada kelas).
                if (selectorRaw.match(/^@media/i)) {
                    var mediaPrefix = selectorRaw;
                    // Tree-shake body — hanya kelas dipakai yang dipertahankan
                    var innerFiltered = [];
                    var innerRules = this._parseRulesBalanced(body);
                    for (var ii = 0; ii < innerRules.length; ii++) {
                        var innerSelector = innerRules[ii].selector.trim();
                        var innerBody = innerRules[ii].body.trim();
                        if (!innerSelector || !innerBody) continue;
                        // Nested at-rule (jarang) — pertahankan apa adana
                        if (innerSelector.charAt(0) === '@') {
                            innerFiltered.push(innerSelector + ' { ' + innerBody + ' }');
                            continue;
                        }
                        var innerKelas = innerSelector.match(/\.([a-zA-Z0-9_-]+)/g) || [];
                        var innerInclude = false;
                        for (var ik = 0; ik < innerKelas.length; ik++) {
                            var innerNama = innerKelas[ik].substring(1);
                            if (kelasDipakai[innerNama]) {
                                innerInclude = true;
                                break;
                            }
                        }
                        if (innerInclude || innerKelas.length === 0) {
                            innerFiltered.push(innerSelector + ' { ' + innerBody + ' }');
                        }
                    }
                    if (innerFiltered.length > 0) {
                        hasil.push(mediaPrefix + ' {\n' + innerFiltered.join('\n') + '\n}');
                    }
                } else {
                    // @keyframes, @font-face, @page — pertahankan apa adana
                    hasil.push(selectorRaw + ' { ' + body + ' }');
                }
                continue;
            }

            var kelasDiSelector = selectorRaw.match(/\.([a-zA-Z0-9_-]+)/g) || [];
            var idDiSelector = selectorRaw.match(/#([a-zA-Z0-9_-]+)/g) || [];

            var includeRule = false;
            for (var i = 0; i < kelasDiSelector.length; i++) {
                var nama = kelasDiSelector[i].substring(1);
                if (kelasDipakai[nama]) {
                    includeRule = true;
                    break;
                }
            }
            if (!includeRule && idDiSelector.length > 0) {
                includeRule = true;
            }
            if (!includeRule && kelasDiSelector.length === 0 && idDiSelector.length === 0) {
                includeRule = true;
            }

            if (includeRule) {
                hasil.push(selectorRaw + ' { ' + body + ' }');
            }
        }

        var header = '/* ==========================================================================\n';
        header += '   pondasi-build.css — CSS hasil tree-shaking (hanya kelas yang dipakai)\n';
        header += '   Generated by pondasi\n';
        header += '   ========================================================================== */\n\n';

        return header + hasil.join('\n\n');
    },

    /* === HELPER: PARSE RULES DENGAN BALANCED BRACE PARSER ===
       Handle nested { } (mis. @media { .test { ... } }).
       Return: [{ selector: string, body: string }]
       */
    _parseRulesBalanced: function(cssText) {
        var rules = [];
        var i = 0;
        var len = cssText.length;

        while (i < len) {
            // Skip whitespace
            while (i < len && /\s/.test(cssText.charAt(i))) i++;
            if (i >= len) break;

            // Read selector until { or }
            var selectorStart = i;
            while (i < len && cssText.charAt(i) !== '{' && cssText.charAt(i) !== '}') i++;
            if (i >= len) break;

            var selector = cssText.substring(selectorStart, i).trim();

            if (cssText.charAt(i) === '}') {
                // Stray closing brace — skip
                i++;
                continue;
            }

            // We're at '{'
            i++;
            // Read body with balanced braces
            var depth = 1;
            var bodyStart = i;
            while (i < len && depth > 0) {
                var c = cssText.charAt(i);
                if (c === '{') depth++;
                else if (c === '}') depth--;
                if (depth > 0) i++;
            }
            var body = cssText.substring(bodyStart, i).trim();
            i++; // move past closing }

            rules.push({ selector: selector, body: body });
        }
        return rules;
    }
};
