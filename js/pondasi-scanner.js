/* PONDASI-SCANNER.JS
   Backend engine yang memindai CSS/JS untuk memastikan sesuai standar pondasi (CSS 2.1-3.0, ES5).
   Trigger:
   1. Buat dokumen — user input CSS path/URL → fetch + scan → centang/X di samping input
   2. Hasil scan → panel properties — kelas yang valid masuk dropdown (skip yang invalid)
   3. Live watcher — saat user blur/Enter di field kelas & style, scanner cek
   4. Pre-export — scan ulang sebelum finalisasi (warning, tetap export)
   */
var P = P || {};

P.Scanner = {
    /* === CACHE HASIL SCAN === */
    cache: {
        // { url: { status: 'ok'|'error'|'loading', error: string, classes: [...], categories: {...}, rawText: string } }
        cssExternal: {},
        // Hasil scan customCSS (yang dibuat user via editor)
        customCSSClasses: [],
        customCSSCategories: {}
    },

    /* === CLEAR CACHE (saat project berganti) === */
    clearCache: function() {
        this.cache.cssExternal = {};
        this.cache.customCSSClasses = [];
        this.cache.customCSSCategories = {};
    },

    /* === FUNGSI UTAMA: SCAN STRING CSS ===
       Mengembalikan: {
         valid: boolean,
         errors: [{ baris: N, kelas: 'nama', properti: 'prop', value: 'val', pesan: '...' }],
         kelas: [{ nama: 'tombol-berisi', kategori: 'Tombol', valid: true, aturan: [...] }],
         kategori: { 'Tombol': ['tombol-berisi', ...], ... }
       }
       */
    scanCSSString: function(cssText) {
        var hasil = {
            valid: true,
            errors: [],
            kelas: [],
            kategori: {},
            kelasDetail: {}  // { 'tombol-berisi': { rules: {...}, pseudo: { ':hover': {...} } } }
        };
        if (!cssText || typeof cssText !== 'string') return hasil;

        // 1. Bangun map baris → kategoriAktif (track per baris)
        var lines = cssText.split('\n');
        var kategoriPerBaris = [];
        var kategoriAktif = 'Lainnya';
        for (var li = 0; li < lines.length; li++) {
            var line = lines[li];
            var kategoriMatch = line.match(P.CSS_SPEC.formatKategori);
            if (kategoriMatch) {
                kategoriAktif = kategoriMatch[1].trim();
            }
            kategoriPerBaris.push(kategoriAktif);
        }

        // 2. Tokenize: pecah jadi rule blocks
        // Pakai balanced-brace parser (bukan regex) supaya bisa handle nested { } (mis. @supports { .test { ... } })
        var cssTextNoComment = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
        var rules = this._parseRulesBalanced(cssTextNoComment);
        for (var ri = 0; ri < rules.length; ri++) {
            var selectorRaw = rules[ri].selector.trim();
            var body = rules[ri].body.trim();
            var baris = rules[ri].baris;
            
            // Skip at-rules yang di-parse terpisah
            if (selectorRaw.charAt(0) === '@') {
                // Cek apakah at-rule ini didukung oleh spec
                var atRuleMatch = selectorRaw.match(/^(@[a-z-]+)/i);
                var atRuleName = atRuleMatch ? atRuleMatch[1].toLowerCase() : '';
                if (P.CSS_SPEC.atRule[atRuleName] === false) {
                    // At-rule TIDAK didukung (mis. @supports, @document, @namespace)
                    // TANDAI sebagai error, jangan recurse ke body-nya
                    hasil.valid = false;
                    var errAt = {
                        baris: baris,
                        kelas: '(at-rule)',
                        properti: atRuleName,
                        value: selectorRaw,
                        pesan: 'At-rule "' + atRuleName + '" tidak didukung (di luar standar pondasi CSS 2.1-3.0)'
                    };
                    hasil.errors.push(errAt);
                    continue;
                }
                if (selectorRaw.match(/^@media|^@keyframes|^@font-face|^@page/i)) {
                    // At-rule yang didukung & butuh recurse ke body
                    var nested = this.scanCSSString(body);
                    hasil.errors = hasil.errors.concat(nested.errors);
                    hasil.kelas = hasil.kelas.concat(nested.kelas);
                    for (var nk in nested.kategori) {
                        if (nested.kategori.hasOwnProperty(nk)) {
                            if (!hasil.kategori[nk]) hasil.kategori[nk] = [];
                            hasil.kategori[nk] = hasil.kategori[nk].concat(nested.kategori[nk]);
                        }
                    }
                    // Merge kelasDetail dari nested
                    for (var nkd in nested.kelasDetail) {
                        if (nested.kelasDetail.hasOwnProperty(nkd)) {
                            if (!hasil.kelasDetail[nkd]) hasil.kelasDetail[nkd] = { rules: {}, pseudo: {} };
                            // Merge rules
                            for (var nr in nested.kelasDetail[nkd].rules) {
                                if (nested.kelasDetail[nkd].rules.hasOwnProperty(nr)) {
                                    hasil.kelasDetail[nkd].rules[nr] = nested.kelasDetail[nkd].rules[nr];
                                }
                            }
                            // Merge pseudo
                            for (var np in nested.kelasDetail[nkd].pseudo) {
                                if (nested.kelasDetail[nkd].pseudo.hasOwnProperty(np)) {
                                    if (!hasil.kelasDetail[nkd].pseudo[np]) hasil.kelasDetail[nkd].pseudo[np] = {};
                                    for (var npr in nested.kelasDetail[nkd].pseudo[np]) {
                                        hasil.kelasDetail[nkd].pseudo[np][npr] = nested.kelasDetail[nkd].pseudo[np][npr];
                                    }
                                }
                            }
                        }
                    }
                }
                continue;
            }

            // 3. Parse selector — ekstrak semua kelas + pseudo-class
            // Pattern: .nama-kelas[:pseudo-class] atau #nama-id[:pseudo-class]
            // Compound selector (mis. .tombol-t.tombol-berisi) → extract semua kelas
            var selectors = selectorRaw.split(',');
            for (var si = 0; si < selectors.length; si++) {
                var sel = selectors[si].trim();
                if (!sel) continue;

                // Extract SEMUA kelas di selector (mis. .tombol-t.tombol-berisi → ['tombol', 'tombol-berisi'])
                var kelasMatches = sel.match(/\.([a-zA-Z0-9_-]+)/g) || [];
                var idMatches = sel.match(/#([a-zA-Z0-9_-]+)/g) || [];

                // Kumpulkan semua nama kelas dari selector
                var namaKelasList = [];
                for (var km = 0; km < kelasMatches.length; km++) {
                    namaKelasList.push(kelasMatches[km].substring(1));  // buang titik
                }
                // Tambah id (jika ada) sebagai nama kelas juga
                for (var im = 0; im < idMatches.length; im++) {
                    namaKelasList.push(idMatches[im].substring(1));
                }
                if (namaKelasList.length === 0) continue;

                // Deteksi pseudo-class/element setelah nama kelas terakhir
                // :hover, :focus, :active, ::before, dll
                var pseudoMatch = sel.match(/:([a-zA-Z-]+)(::[a-zA-Z-]+)?/);
                var pseudo = null;
                if (pseudoMatch) {
                    var pseudoPart = ':' + pseudoMatch[1];
                    if (pseudoMatch[2]) pseudoPart = pseudoPart + pseudoMatch[2];
                    pseudo = pseudoPart;
                }

                // 4. Validasi body — cek tiap deklarasi properti:value
                var declarations = body.split(';');
                var kelasValid = true;
                var kelasErrors = [];
                var rules = {};
                for (var di = 0; di < declarations.length; di++) {
                    var decl = declarations[di].trim();
                    if (!decl) continue;
                    var colonIdx = decl.indexOf(':');
                    if (colonIdx < 0) continue;
                    var prop = decl.substring(0, colonIdx).trim().toLowerCase();
                    var val = decl.substring(colonIdx + 1).trim();

                    if (prop.match(/^(-webkit-|-moz-|-ms-|-o-|-khtml-)/)) continue;
                    if (prop.charAt(0) === '*' || prop.charAt(0) === '_') {
                        prop = prop.substring(1);
                    }

                    if (P.CSS_SPEC.propertiTerlarang(prop)) {
                        kelasValid = false;
                        hasil.valid = false;
                        var err1 = {
                            baris: baris,
                            kelas: namaKelasList[0],  // pakai kelas pertama untuk error
                            properti: prop,
                            value: val,
                            pesan: 'Properti "' + prop + '" tidak didukung (CSS modern)'
                        };
                        kelasErrors.push(err1);
                        hasil.errors.push(err1);
                        continue;
                    }

                    if (!P.CSS_SPEC.propertiValid(prop)) {
                        kelasValid = false;
                        hasil.valid = false;
                        var err2 = {
                            baris: baris,
                            kelas: namaKelasList[0],
                            properti: prop,
                            value: val,
                            pesan: 'Properti "' + prop + '" tidak dikenal (di luar whitelist pondasi)'
                        };
                        kelasErrors.push(err2);
                        hasil.errors.push(err2);
                        continue;
                    }

                    var terlarang = P.CSS_SPEC.valueMengandungTerlarang(val);
                    if (terlarang) {
                        kelasValid = false;
                        hasil.valid = false;
                        var err3 = {
                            baris: baris,
                            kelas: namaKelasList[0],
                            properti: prop,
                            value: val,
                            pesan: 'Value mengandung fungsi "' + terlarang + '" yang tidak didukung'
                        };
                        kelasErrors.push(err3);
                        hasil.errors.push(err3);
                        continue;
                    }

                    // Cek value-level terlarang (mis. display: flex, display: grid)
                    var valTerlarang = P.CSS_SPEC.valueTerlarang(prop, val);
                    if (valTerlarang) {
                        kelasValid = false;
                        hasil.valid = false;
                        var err3b = {
                            baris: baris,
                            kelas: namaKelasList[0],
                            properti: prop,
                            value: val,
                            pesan: 'Value "' + valTerlarang + '" tidak didukung untuk properti "' + prop + '" (CSS modern)'
                        };
                        kelasErrors.push(err3b);
                        hasil.errors.push(err3b);
                        continue;
                    }

                    rules[prop] = val;
                }

                // 5. Tambahkan ke hasil — untuk SETIAP kelas di selector
                var kategoriRule = kategoriPerBaris[baris - 1] || 'Lainnya';

                // Untuk setiap kelas di selector (mis. .tombol-t.tombol-berisi → proses keduanya)
                for (var nki = 0; nki < namaKelasList.length; nki++) {
                    var namaKelas = namaKelasList[nki];

                    // Cek apakah kelas ini sudah ada di hasil.kelas
                    var kelasObjSudahAda = null;
                    for (var ki = 0; ki < hasil.kelas.length; ki++) {
                        if (hasil.kelas[ki].nama === namaKelas) {
                            kelasObjSudahAda = hasil.kelas[ki];
                            break;
                        }
                    }

                    if (kelasObjSudahAda) {
                        if (pseudo) {
                            if (!kelasObjSudahAda.pseudo) kelasObjSudahAda.pseudo = {};
                            if (!kelasObjSudahAda.pseudo[pseudo]) kelasObjSudahAda.pseudo[pseudo] = {};
                            for (var mp in rules) {
                                if (rules.hasOwnProperty(mp)) {
                                    kelasObjSudahAda.pseudo[pseudo][mp] = rules[mp];
                                }
                            }
                        } else {
                            if (!kelasObjSudahAda.rules) kelasObjSudahAda.rules = {};
                            for (var mr in rules) {
                                if (rules.hasOwnProperty(mr)) {
                                    kelasObjSudahAda.rules[mr] = rules[mr];
                                }
                            }
                        }
                        if (!kelasValid) kelasObjSudahAda.valid = false;
                        // Merge errors hanya untuk kelas pertama (supaya tidak duplikat)
                        if (nki === 0) {
                            kelasObjSudahAda.errors = kelasObjSudahAda.errors.concat(kelasErrors);
                        }
                    } else {
                        var kelasObj = {
                            nama: namaKelas,
                            kategori: kategoriRule,
                            valid: kelasValid,
                            selector: sel,
                            errors: nki === 0 ? kelasErrors : [],
                            rules: pseudo ? {} : rules,
                            pseudo: pseudo ? (function() { var p = {}; p[pseudo] = rules; return p; })() : {}
                        };
                        hasil.kelas.push(kelasObj);
                    }

                    // Update kelasDetail
                    if (!hasil.kelasDetail[namaKelas]) {
                        hasil.kelasDetail[namaKelas] = { rules: {}, pseudo: {} };
                    }
                    if (pseudo) {
                        if (!hasil.kelasDetail[namaKelas].pseudo[pseudo]) {
                            hasil.kelasDetail[namaKelas].pseudo[pseudo] = {};
                        }
                        for (var pp in rules) {
                            if (rules.hasOwnProperty(pp)) {
                                hasil.kelasDetail[namaKelas].pseudo[pseudo][pp] = rules[pp];
                            }
                        }
                    } else {
                        for (var rp in rules) {
                            if (rules.hasOwnProperty(rp)) {
                                hasil.kelasDetail[namaKelas].rules[rp] = rules[rp];
                            }
                        }
                    }

                    // Tambahkan ke mapping kategori (hanya yang valid)
                    if (kelasValid) {
                        if (!hasil.kategori[kategoriRule]) hasil.kategori[kategoriRule] = [];
                        if (hasil.kategori[kategoriRule].indexOf(namaKelas) < 0) {
                            hasil.kategori[kategoriRule].push(namaKelas);
                        }
                    }
                }
            }
        }

        return hasil;
    },

    /* === HELPER: PARSE RULES DENGAN BALANCED BRACE PARSER ===
       Handle nested { } (mis. @supports { .test { ... } }).
       Return: [{ selector: string, body: string, baris: number }]
       */
    _parseRulesBalanced: function(cssText) {
        var rules = [];
        var i = 0;
        var len = cssText.length;
        var barisBase = 1;
        
        while (i < len) {
            // Skip whitespace
            while (i < len && /\s/.test(cssText.charAt(i))) {
                if (cssText.charAt(i) === '\n') barisBase++;
                i++;
            }
            if (i >= len) break;
            
            // Read selector until { or }
            var selectorStart = i;
            while (i < len && cssText.charAt(i) !== '{' && cssText.charAt(i) !== '}') {
                if (cssText.charAt(i) === '\n') barisBase++;
                i++;
            }
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
                else if (c === '\n') barisBase++;
                if (depth > 0) i++;
            }
            // Now i is at the closing } of depth=0
            var body = cssText.substring(bodyStart, i).trim();
            // i is at }, move past
            i++;
            
            // Calculate selector baris (count \n from start of cssText to selectorStart)
            var selectorBaris = 1;
            for (var sb = 0; sb < selectorStart; sb++) {
                if (cssText.charAt(sb) === '\n') selectorBaris++;
            }
            
            rules.push({ selector: selector, body: body, baris: selectorBaris });
        }
        return rules;
    },

    /* === FUNGSI: SCAN STRING JS (untuk cek ES6+) === */
    scanJSString: function(jsText) {
        var hasil = { valid: true, errors: [] };
        if (!jsText || typeof jsText !== 'string') return hasil;

        var lines = jsText.split('\n');
        // Pattern ES6+ yang dilarang
        var patterns = [
            { regex: /=>/g, pesan: 'Arrow function (=>) — gunakan function() biasa' },
            { regex: /\blet\s/g, pesan: 'let — gunakan var' },
            { regex: /\bconst\s/g, pesan: 'const — gunakan var' },
            { regex: /`/g, pesan: 'Template literal (backtick) — gunakan string biasa dengan +' },
            { regex: /\.\.\./g, pesan: 'Spread/rest (...) — tidak didukung ES5' },
            { regex: /\bclass\s+\w+/g, pesan: 'class keyword — gunakan prototype' },
            { regex: /\bimport\s+/g, pesan: 'import — tidak didukung ES5' },
            { regex: /\bexport\s+/g, pesan: 'export — tidak didukung ES5' },
            { regex: /\basync\s+/g, pesan: 'async — tidak didukung ES5' },
            { regex: /\bawait\s+/g, pesan: 'await — tidak didukung ES5' },
            { regex: /\bfor\s*\(\s*(?:var|let|const)\s+\w+\s+of\b/g, pesan: 'for...of — gunakan for...in atau forEach' },
            { regex: /\?\./g, pesan: 'Optional chaining (?.) — tidak didukung ES5' },
            { regex: /\?\?/g, pesan: 'Nullish coalescing (??) — tidak didukung ES5' }
        ];

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            // Skip baris komentar
            var trimmed = line.trim();
            if (trimmed.indexOf('//') === 0 || trimmed.indexOf('/*') === 0) continue;

            for (var pi = 0; pi < patterns.length; pi++) {
                var p = patterns[pi];
                if (p.regex.test(line)) {
                    p.regex.lastIndex = 0;  // reset regex global
                    hasil.valid = false;
                    hasil.errors.push({
                        baris: i + 1,
                        kode: line.trim().substring(0, 80),
                        pesan: p.pesan
                    });
                }
            }
        }

        return hasil;
    },

    /* === FUNGSI: FETCH + SCAN CSS EKSTERNAL ===
       Mengembalikan via callback: { status, error, classes, categories, rawText }
       */
    fetchDanScanCSS: function(url, callback) {
        var self = this;
        if (!url) {
            if (callback) callback({ status: 'error', error: 'URL kosong', classes: [], categories: {} });
            return;
        }

        // Cek cache dulu
        if (self.cache.cssExternal[url]) {
            var cached = self.cache.cssExternal[url];
            if (cached.status === 'ok') {
                if (callback) callback(cached);
                return;
            }
        }

        // Mark as loading
        self.cache.cssExternal[url] = { status: 'loading', error: null, classes: [], categories: {} };

        // Fetch via XHR (ES5, no fetch API)
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState !== 4) return;
            if (xhr.status === 200 || (xhr.status === 0 && xhr.responseText)) {
                // Sukses fetch
                var cssText = xhr.responseText;
                var scanResult = self.scanCSSString(cssText);
                var result = {
                    status: 'ok',
                    error: null,
                    rawText: cssText,
                    classes: scanResult.kelas,
                    categories: scanResult.kategori,
                    errors: scanResult.errors,
                    valid: scanResult.valid,
                    kelasDetail: scanResult.kelasDetail || {}
                };
                self.cache.cssExternal[url] = result;
                if (callback) callback(result);
            } else {
                // Gagal fetch
                var errMsg = 'Gagal memuat berkas (HTTP ' + xhr.status + ')';
                if (xhr.status === 0) errMsg = 'Gagal mengakses berkas (network error / CORS / file:// tidak diizinkan)';
                var errResult = {
                    status: 'error',
                    error: errMsg,
                    classes: [],
                    categories: {},
                    errors: []
                };
                self.cache.cssExternal[url] = errResult;
                if (callback) callback(errResult);
            }
        };
        xhr.onerror = function() {
            var errResult = {
                status: 'error',
                error: 'Gagal mengakses berkas (network error)',
                classes: [],
                categories: {},
                errors: []
            };
            self.cache.cssExternal[url] = errResult;
            if (callback) callback(errResult);
        };
        try {
            xhr.send();
        } catch (e) {
            var errResult = {
                status: 'error',
                error: 'Error: ' + e.message,
                classes: [],
                categories: {},
                errors: []
            };
            self.cache.cssExternal[url] = errResult;
            if (callback) callback(errResult);
        }
    },

    /* === FUNGSI: SCAN CUSTOM CSS (yang dibuat user via editor) === */
    scanCustomCSS: function() {
        var cssString = P.generateCustomCSS ? P.generateCustomCSS() : '';
        var result = this.scanCSSString(cssString);
        this.cache.customCSSClasses = result.kelas;
        this.cache.customCSSCategories = result.kategori;
        return result;
    },

    /* === FUNGSI: GABUNGKAN SEMUA KELAS VALID DARI SEMUA SUMBER ===
       Mengembalikan: {
         kategori: { 'Tombol': ['tombol-berisi', ...], ... },
         semuaKelas: ['tombol-berisi', ...]
       }
       */
    getSemuaKelasValid: function() {
        var result = { kategori: {}, semuaKelas: [] };
        var seen = {};

        // Dari customCSS
        var customResult = this.scanCustomCSS();
        for (var kat in customResult.kategori) {
            if (customResult.kategori.hasOwnProperty(kat)) {
                if (!result.kategori[kat]) result.kategori[kat] = [];
                customResult.kategori[kat].forEach(function (kls) {
                    if (seen[kls] === undefined) {
                        result.kategori[kat].push(kls);
                        result.semuaKelas.push(kls);
                        seen[kls] = true;
                    }
                });
            }
        }

        // Dari cssExternal
        if (P.STATE.projects && P.STATE.projects[P.STATE.currentProjectId]) {
            var project = P.STATE.projects[P.STATE.currentProjectId];
            if (project.cssExternal && project.cssExternal.length) {
                project.cssExternal.forEach(function (ext) {
                    if (ext.status === 'ok' && ext.categories) {
                        for (var ekat in ext.categories) {
                            if (ext.categories.hasOwnProperty(ekat)) {
                                if (!result.kategori[ekat]) result.kategori[ekat] = [];
                                ext.categories[ekat].forEach(function (kls) {
                                    if (seen[kls] === undefined) {
                                        result.kategori[ekat].push(kls);
                                        result.semuaKelas.push(kls);
                                        seen[kls] = true;
                                    }
                                });
                            }
                        }
                    }
                });
            }
        }

        // Dari tampilan.css (hardcoded list kategori utama untuk MVP)
        // CATATAN: tampilan.css juga di-scan saat init, tapi untuk MVP kita pakai list hardcoded
        var kategoriTampilan = this.kategoriTampilanCSS();
        for (var tkat in kategoriTampilan) {
            if (kategoriTampilan.hasOwnProperty(tkat)) {
                if (!result.kategori[tkat]) result.kategori[tkat] = [];
                kategoriTampilan[tkat].forEach(function (kls) {
                    if (seen[kls] === undefined) {
                        result.kategori[tkat].push(kls);
                        result.semuaKelas.push(kls);
                        seen[kls] = true;
                    }
                });
            }
        }

        return result;
    },

    /* === KATEGORI TAMPILAN.CSS (hardcoded untuk MVP) ===
       TODO: scan tampilan.css saat init untuk dapat list ini otomatis.
       */
    kategoriTampilanCSS: function() {
        return {
            'Teks': ['isi-1', 'isi-2', 'isi-3', 'judul-1', 'judul-2', 'judul-3', 'judul-4', 'judul-5', 'judul-6', 'kutipan', 'kode'],
            'Tombol': ['tombol-berisi', 'tombol-garis', 'tombol-melayang', 'tombol-ikon'],
            'Kartu': ['kartu', 'kartu-gambar', 'kartu-header', 'kartu-badan', 'kartu-kaki'],
            'Form': ['ruas-input', 'ruas-textarea', 'ruas-select', 'ruas-checkbox', 'ruas-radio', 'ruas-saklar', 'ruas-slider', 'ruas-stepper', 'ruas-segment', 'ruas-toggle-grup'],
            'Pesan': ['pesan-info', 'pesan-sukses', 'pesan-peringatan', 'pesan-error'],
            'Badge': ['badge', 'chip', 'tag'],
            'Navigasi': ['bilah-aplikasi', 'menu-mendatar', 'tab', 'breadcrumb'],
            'Akordion': ['akordion', 'akordion-item', 'akordion-kepala', 'akordion-isi'],
            'Tabel': ['tabel', 'tabel-baris', 'tabel-sel', 'tabel-kepala'],
            'Layout': ['wadah', 'baris', 'kolom', 'bagian', 'pemisah-teks'],
            'Efek': ['bayangan', 'bayangan-sm', 'bayangan-md', 'bayangan-lg', 'sudut', 'sudut-sm', 'sudut-md', 'sudut-lg', 'transisi'],
            'Progress': ['progress', 'progress-bar', 'stepper'],
            'Lainnya': ['avatar', 'tooltip', 'spacer', 'pemisah']
        };
    },

    /* === FUNGSI: SCAN SEMUA SUMBER DI PROJECT SAAT INI === */
    scanProject: function() {
        var summary = {
            totalKelas: 0,
            kelasValid: 0,
            kelasInvalid: 0,
            errors: [],
            fileStatus: []
        };

        // 1. Custom CSS
        var customResult = this.scanCustomCSS();
        summary.errors = summary.errors.concat(customResult.errors);
        customResult.kelas.forEach(function (k) {
            summary.totalKelas++;
            if (k.valid) summary.kelasValid++;
            else summary.kelasInvalid++;
        });

        // 2. CSS Eksternal
        if (P.STATE.projects && P.STATE.projects[P.STATE.currentProjectId]) {
            var project = P.STATE.projects[P.STATE.currentProjectId];
            if (project.cssExternal && project.cssExternal.length) {
                project.cssExternal.forEach(function (ext) {
                    var status = {
                        url: ext.url,
                        status: ext.status,
                        error: ext.error,
                        kelasCount: ext.classes ? ext.classes.length : 0,
                        kelasValid: ext.classes ? ext.classes.filter(function (k) { return k.valid; }).length : 0,
                        kelasInvalid: ext.classes ? ext.classes.filter(function (k) { return !k.valid; }).length : 0
                    };
                    summary.fileStatus.push(status);
                    if (ext.classes) {
                        ext.classes.forEach(function (k) {
                            summary.totalKelas++;
                            if (k.valid) summary.kelasValid++;
                            else summary.kelasInvalid++;
                        });
                    }
                    if (ext.errors) summary.errors = summary.errors.concat(ext.errors);
                });
            }
        }

        return summary;
    },

    /* === FUNGSI: VALIDASI SATU KELAS (untuk live watcher) === */
    validasiKelas: function(namaKelas) {
        if (!namaKelas) return { valid: true, pesan: '' };
        // Ambil dari cache getSemuaKelasValid
        var semua = this.getSemuaKelasValid();
        // Cek apakah kelas ada di list valid
        if (semua.semuaKelas.indexOf(namaKelas) >= 0) {
            return { valid: true, pesan: '' };
        }
        return {
            valid: false,
            pesan: 'Kelas ".' + namaKelas + '" tidak ditemukan di CSS yang tersedia. Mungkin ada pelanggaran standar pondasi (flex/grid/var?). Cek berkas CSS Anda.'
        };
    },

    /* === FUNGSI: GET DETAIL KELAS (rules + pseudo) ===
       Lookup dari cache. Kalau belum ada, scan semua sumber CSS.
       Return: { rules: {properti: value}, pseudo: {':hover': {properti: value}, ...} }
       atau null kalau kelas tidak ditemukan.
       */
    getKelasDetail: function(namaKelas) {
        if (!namaKelas) return null;

        // 1. Cek cache dulu
        if (this.cache.kelasDetail && this.cache.kelasDetail[namaKelas]) {
            return this.cache.kelasDetail[namaKelas];
        }

        // 2. Init cache kalau belum ada
        if (!this.cache.kelasDetail) this.cache.kelasDetail = {};

        // 3. Scan semua sumber untuk populate cache
        // a. customCSS (yang dibuat user via editor)
        var customResult = this.scanCustomCSS();
        if (customResult.kelasDetail && customResult.kelasDetail[namaKelas]) {
            this.cache.kelasDetail[namaKelas] = customResult.kelasDetail[namaKelas];
            return this.cache.kelasDetail[namaKelas];
        }

        // b. cssExternal (CSS eksternal user)
        if (P.STATE.projects && P.STATE.currentProjectId) {
            var project = P.STATE.projects[P.STATE.currentProjectId];
            if (project && project.cssExternal) {
                for (var i = 0; i < project.cssExternal.length; i++) {
                    var ext = project.cssExternal[i];
                    if (ext.status !== 'ok' || !ext.kelasDetail) continue;
                    if (ext.kelasDetail[namaKelas]) {
                        // Merge dengan yang sudah ada di cache (kalau ada)
                        if (!this.cache.kelasDetail[namaKelas]) {
                            this.cache.kelasDetail[namaKelas] = { rules: {}, pseudo: {} };
                        }
                        var detail = ext.kelasDetail[namaKelas];
                        // Merge rules
                        if (detail.rules) {
                            for (var r in detail.rules) {
                                if (detail.rules.hasOwnProperty(r)) {
                                    this.cache.kelasDetail[namaKelas].rules[r] = detail.rules[r];
                                }
                            }
                        }
                        // Merge pseudo
                        if (detail.pseudo) {
                            for (var p in detail.pseudo) {
                                if (detail.pseudo.hasOwnProperty(p)) {
                                    if (!this.cache.kelasDetail[namaKelas].pseudo[p]) {
                                        this.cache.kelasDetail[namaKelas].pseudo[p] = {};
                                    }
                                    for (var pr in detail.pseudo[p]) {
                                        if (detail.pseudo[p].hasOwnProperty(pr)) {
                                            this.cache.kelasDetail[namaKelas].pseudo[p][pr] = detail.pseudo[p][pr];
                                        }
                                    }
                                }
                            }
                        }
                        return this.cache.kelasDetail[namaKelas];
                    }
                }
            }
        }

        // c. Tema default (tampilan*.css) — coba CSSOM dulu, fallback ke getComputedStyle
        var detailTema = this.bacaKelasDariStylesheets(namaKelas);
        if (!detailTema) {
            // CSSOM diblokir (file://) — pakai getComputedStyle via elemen sementara
            detailTema = this.bacaKelasDariElement(namaKelas);
        }
        if (detailTema) {
            this.cache.kelasDetail[namaKelas] = detailTema;
            return detailTema;
        }

        // 4. Kelas tidak ditemukan
        return null;
    },

    /* === FUNGSI: BACA KELAS DARI document.styleSheets ===
       Pakai CSSOM API. Kalau diblokir CORS (file://), return null.
       Return: { rules: {...}, pseudo: {...} } atau null.
       */
    bacaKelasDariStylesheets: function(namaKelas) {
        if (!document.styleSheets) return null;
        var hasil = { rules: {}, pseudo: {} };

        // Loop semua stylesheet di document
        for (var i = 0; i < document.styleSheets.length; i++) {
            var sheet = document.styleSheets[i];
            var rules;
            try {
                rules = sheet.cssRules || sheet.rules;
            } catch (e) {
                // CORS — skip stylesheet yang tidak bisa diakses
                continue;
            }
            if (!rules) continue;

            // Loop semua rule di stylesheet ini
            for (var j = 0; j < rules.length; j++) {
                var rule = rules[j];
                if (!rule.selectorText) continue;
                var selectorText = rule.selectorText;
                var style = rule.style;
                if (!style) continue;

                // Cek apakah selector mengandung kelas yang dicari
                // Handle compound selectors: .tombol.tombol-berisi:hover, .tombol .tombol-berisi, dll
                var selectors = selectorText.split(',');
                for (var s = 0; s < selectors.length; s++) {
                    var sel = selectors[s].trim();

                    // Extract SEMUA kelas dari selector (mis. .tombol.tombol-berisi:hover → ['tombol', 'tombol-berisi'])
                    var allClasses = sel.match(/\.([a-zA-Z0-9_-]+)/g) || [];
                    var classNames = [];
                    for (var ac = 0; ac < allClasses.length; ac++) {
                        classNames.push(allClasses[ac].substring(1));
                    }

                    // Cek apakah namaKelas ada di daftar kelas selector ini
                    if (classNames.indexOf(namaKelas) < 0) continue;

                    // Deteksi pseudo-class/element di akhir selector
                    // Mis. .tombol-berisi:hover → pseudo = ':hover'
                    // Mis. .tombol.tombol-berisi:focus → pseudo = ':focus'
                    var pseudoMatch = sel.match(/:([a-zA-Z-]+)(::[a-zA-Z-]+)?\s*$/);
                    var pseudo = null;
                    if (pseudoMatch) {
                        pseudo = ':' + pseudoMatch[1];
                        if (pseudoMatch[2]) pseudo += pseudoMatch[2];
                    }

                    // Simpan rules
                    for (var k = 0; k < style.length; k++) {
                        var prop = style[k];
                        var val = style.getPropertyValue(prop);
                        // Skip vendor-prefixed properties (sudah di-handle di scanCSSString)
                        if (prop.match(/^(-webkit-|-moz-|-ms-|-o-|-khtml-)/)) continue;
                        if (pseudo) {
                            if (!hasil.pseudo[pseudo]) hasil.pseudo[pseudo] = {};
                            hasil.pseudo[pseudo][prop] = val;
                        } else {
                            hasil.rules[prop] = val;
                        }
                    }
                }
            }
        }

        if (Object.keys(hasil.rules).length === 0 && Object.keys(hasil.pseudo).length === 0) {
            return null;
        }
        return hasil;
    },

    /* === FALLBACK: BACA KELAS DARI ELEMEN SEMENTARA (getComputedStyle) ===
       Kalau CSSOM diblokir (file://), buat elemen sementara dengan kelas
       yang dicari, attach ke DOM, baca getComputedStyle, lalu hapus.
       Ini workaround untuk file:// yang tidak bisa akses cssRules.
       */
    bacaKelasDariElement: function(namaKelas) {
        var hasil = { rules: {}, pseudo: {} };
        // Buat elemen sementara
        var el = document.createElement('div');
        el.className = namaKelas;
        el.style.cssText = 'display:none !important; position:absolute !important; left:-9999px !important; top:0 !important; width:0 !important; height:0 !important; overflow:hidden !important;';
        document.body.appendChild(el);
        var cs = getComputedStyle(el);
        // Baca properti yang penting saja (tidak semua, karena terlalu banyak)
        var propsPenting = [
            'display', 'position', 'width', 'height', 'padding', 'margin',
            'border', 'border-width', 'border-style', 'border-color', 'border-radius',
            'background', 'background-color', 'background-image',
            'color', 'font-size', 'font-weight', 'font-family', 'font-style',
            'line-height', 'text-align', 'text-decoration', 'text-transform',
            'letter-spacing', 'word-spacing', 'vertical-align', 'white-space',
            'opacity', 'visibility', 'overflow', 'overflow-x', 'overflow-y',
            'float', 'clear', 'z-index', 'top', 'right', 'bottom', 'left',
            'box-shadow', 'box-sizing', 'cursor', 'list-style', 'list-style-type',
            'transition', 'transform', 'animation', 'outline', 'outline-width',
            'outline-style', 'outline-color', 'outline-offset'
        ];
        for (var i = 0; i < propsPenting.length; i++) {
            var prop = propsPenting[i];
            var val = cs.getPropertyValue(prop);
            if (val && val !== '' && val !== 'auto' && val !== 'normal' && val !== 'none' && val !== 'medium' && val !== '0px' && val !== '0' && val !== 'static' && val !== 'inherit') {
                hasil.rules[prop] = val;
            }
        }
        document.body.removeChild(el);
        if (Object.keys(hasil.rules).length === 0) return null;
        return hasil;
    },

    /* === SCAN TEMA CSS SAAT INIT ===
       Fetch semua berkas tema via XHR, scan, cache kelasDetail.
       Bekerja di server mode (http://). Di file:// mungkin gagal (CORS).
       */
    scanTemaCSS: function (callback) {
        var self = this;
        if (!P.Tema || !P.Tema.getTemaAktif) {
            if (callback) callback();
            return;
        }
        var tema = P.Tema.getTemaAktif();
        if (!tema || !tema.berkas) {
            if (callback) callback();
            return;
        }

        // Cek apakah sudah di-scan
        if (self.cache.temaScanned) {
            if (callback) callback();
            return;
        }

        var berkasTersisa = tema.berkas.slice();
        var semuaKelasDetail = {};

        var fetchBerikutnya = function () {
            if (berkasTersisa.length === 0) {
                // Merge ke cache
                if (!self.cache.kelasDetail) self.cache.kelasDetail = {};
                for (var kelas in semuaKelasDetail) {
                    if (semuaKelasDetail.hasOwnProperty(kelas)) {
                        if (!self.cache.kelasDetail[kelas]) {
                            self.cache.kelasDetail[kelas] = semuaKelasDetail[kelas];
                        } else {
                            // Merge rules
                            for (var r in semuaKelasDetail[kelas].rules) {
                                self.cache.kelasDetail[kelas].rules[r] = semuaKelasDetail[kelas].rules[r];
                            }
                            // Merge pseudo
                            for (var p in semuaKelasDetail[kelas].pseudo) {
                                if (!self.cache.kelasDetail[kelas].pseudo[p]) {
                                    self.cache.kelasDetail[kelas].pseudo[p] = {};
                                }
                                for (var pr in semuaKelasDetail[kelas].pseudo[p]) {
                                    self.cache.kelasDetail[kelas].pseudo[p][pr] = semuaKelasDetail[kelas].pseudo[p][pr];
                                }
                            }
                        }
                    }
                }
                self.cache.temaScanned = true;
                if (callback) callback();
                return;
            }
            var berkas = berkasTersisa.shift();
            var url = 'css/' + berkas;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState !== 4) return;
                if (xhr.status === 200 || (xhr.status === 0 && xhr.responseText)) {
                    var result = self.scanCSSString(xhr.responseText);
                    if (result.kelasDetail) {
                        for (var k in result.kelasDetail) {
                            if (result.kelasDetail.hasOwnProperty(k)) {
                                semuaKelasDetail[k] = result.kelasDetail[k];
                            }
                        }
                    }
                }
                fetchBerikutnya();
            };
            try {
                xhr.send();
            } catch (e) {
                fetchBerikutnya();
            }
        };
        fetchBerikutnya();
    },

    /* === FUNGSI: INVALIDATE CACHE KELAS DETAIL ===
       Dipanggil saat customCSS berubah / cssExternal di-rescan.
       */
    invalidateKelasDetail: function(namaKelas) {
        if (!namaKelas) {
            // Clear semua
            this.cache.kelasDetail = {};
        } else if (this.cache.kelasDetail) {
            delete this.cache.kelasDetail[namaKelas];
        }
    },

    /* === FUNGSI: VALIDASI INLINE STYLE (untuk live watcher) === */
    validasiInlineStyle: function(styleObj) {
        var errors = [];
        if (!styleObj) return errors;
        for (var prop in styleObj) {
            if (!styleObj.hasOwnProperty(prop)) continue;
            var val = styleObj[prop];
            // Cek properti terlarang
            if (P.CSS_SPEC.propertiTerlarang(prop)) {
                errors.push({ properti: prop, value: val, pesan: 'Properti terlarang (CSS modern)' });
                continue;
            }
            // Cek properti tidak dikenal
            if (!P.CSS_SPEC.propertiValid(prop)) {
                errors.push({ properti: prop, value: val, pesan: 'Properti tidak dikenal' });
                continue;
            }
            // Cek value terlarang
            var terlarang = P.CSS_SPEC.valueMengandungTerlarang(val);
            if (terlarang) {
                errors.push({ properti: prop, value: val, pesan: 'Value mengandung ' + terlarang + '()' });
            }
        }
        return errors;
    }
};
