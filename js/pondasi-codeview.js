/* PONDASI-CODEVIEW.JS
   Code view overlay: lihat & edit HTML/CSS yang di-generate.
   Tabs: HTML (editable), CSS Kustom (editable), Tema CSS (read-only).
   Apply: parse & update STATE.
*/

var P = P || {};

(function () {

    var cvActiveTab = 'html';
    var cvOriginalHtml = '';  // untuk deteksi perubahan
    var cvOriginalCSS = '';

    /* === Buka code view === */
    P.toggleCodeView = function () {
        var overlay = document.getElementById('codeview-overlay');
        if (!overlay) return;
        if (overlay.hasAttribute('hidden')) {
            P.bukaCodeView();
        } else {
            P.tutupCodeView();
        }
    };

    P.bukaCodeView = function () {
        var overlay = document.getElementById('codeview-overlay');
        if (!overlay) return;
        if (!P.STATE.currentProjectId || !P.STATE.tree) {
            P.flash('Tidak ada dokumen aktif');
            return;
        }
        // Generate HTML & CSS untuk ditampilkan
        P.refreshCodeView();
        overlay.removeAttribute('hidden');
        // Highlight tombol
        var btn = document.getElementById('btn-codeview');
        if (btn) btn.classList.add('pondasi-floating-btn-aktif');
        // Focus textarea
        setTimeout(function () {
            var ta = document.getElementById('codeview-textarea');
            if (ta) ta.focus();
        }, 50);
    };

    P.tutupCodeView = function () {
        var overlay = document.getElementById('codeview-overlay');
        if (!overlay) return;
        overlay.setAttribute('hidden', '');
        var btn = document.getElementById('btn-codeview');
        if (btn) btn.classList.remove('pondasi-floating-btn-aktif');
    };

    /* === Refresh tampilan code view berdasarkan active tab === */
    P.refreshCodeView = function () {
        var ta = document.getElementById('codeview-textarea');
        var info = document.getElementById('codeview-info');
        var status = document.getElementById('codeview-status');
        if (!ta) return;

        if (cvActiveTab === 'html') {
            var html = P.generateExportHTML();
            ta.value = html;
            ta.readOnly = false;
            cvOriginalHtml = html;
            if (info) info.textContent = 'HTML — halaman aktif (editable)';
            if (status) status.textContent = 'Lines: ' + html.split('\n').length + ' | Chars: ' + html.length;
        } else if (cvActiveTab === 'css') {
            var css = P.generateCustomCSS();
            if (typeof P.generateBlockPseudoCSSForExport === 'function') {
                var pseudo = P.generateBlockPseudoCSSForExport();
                if (pseudo) css += '\n\n/* === Pseudo-class blocks === */\n' + pseudo;
            }
            ta.value = css;
            ta.readOnly = false;
            cvOriginalCSS = css;
            if (info) info.textContent = 'CSS Kustom — editable';
            if (status) status.textContent = 'Lines: ' + css.split('\n').length + ' | Chars: ' + css.length;
        } else if (cvActiveTab === 'css-build') {
            // Tree-shake preview — hanya kelas yang dipakai di halaman ini
            if (info) info.textContent = 'CSS Build (tree-shake) — preview production';
            if (status) status.textContent = 'Loading tree-shake...';
            ta.value = '/* Loading CSS Build (tree-shake)... */';
            ta.readOnly = true;
            // Pakai Tema.treeShakeCSS yang sama dengan export
            if (P.Tema && P.Tema.treeShakeCSS) {
                P.Tema.treeShakeCSS(function (cssFiltered) {
                    if (!cssFiltered) {
                        ta.value = '/* Gagal tree-shake CSS */';
                        if (status) status.textContent = 'Error: tree-shake gagal';
                        return;
                    }
                    // Tambah pondasi-custom.css + pseudo juga (supaya lengkap seperti yang akan di-export)
                    var full = '/* === CSS Build (tree-shake) — production preview === */\n\n';
                    full += '/* === pondasi framework (tree-shake) === */\n';
                    full += cssFiltered;
                    full += '\n\n/* === pondasi-custom (user) === */\n';
                    full += P.generateCustomCSS();
                    if (typeof P.generateBlockPseudoCSSForExport === 'function') {
                        var pseudo = P.generateBlockPseudoCSSForExport();
                        if (pseudo) {
                            full += '\n\n/* === Pseudo-class blocks === */\n';
                            full += pseudo;
                        }
                    }
                    ta.value = full;
                    if (status) status.textContent = 'Lines: ' + full.split('\n').length + ' | Chars: ' + full.length + ' | Size: ' + Math.round(full.length / 1024) + ' KB';
                });
            } else {
                ta.value = '/* P.Tema.treeShakeCSS tidak tersedia */';
                if (status) status.textContent = 'Error: tree-shake API tidak tersedia';
            }
        } else if (cvActiveTab === 'css-framework') {
            // Tema CSS — read-only, fetch dari file
            if (info) info.textContent = 'Tema CSS (tampilan.css) — read-only';
            if (status) status.textContent = 'Loading...';
            ta.value = '/* Loading tema CSS... */';
            ta.readOnly = true;
            var settings = P.getProjectSettings();
            var temaFile = 'css/' + (settings.tema || 'tampilan.css');
            var xhr = new XMLHttpRequest();
            xhr.open('GET', temaFile, true);
            xhr.onload = function () {
                if (xhr.status === 200 || xhr.status === 0) {
                    ta.value = xhr.responseText;
                    if (status) status.textContent = 'Lines: ' + xhr.responseText.split('\n').length + ' | Chars: ' + xhr.responseText.length + ' | File: ' + temaFile;
                } else {
                    ta.value = '/* Gagal load ' + temaFile + ' — pastikan file ada di server */';
                    if (status) status.textContent = 'Error loading ' + temaFile;
                }
            };
            xhr.onerror = function () {
                ta.value = '/* Gagal load ' + temaFile + ' — mungkin mode file://, buka via server */';
                if (status) status.textContent = 'Error loading ' + temaFile;
            };
            xhr.send();
        }
    };

    /* === Switch tab === */
    P.setCodeViewTab = function (tabName) {
        cvActiveTab = tabName;
        // Update tab buttons
        var tabs = document.querySelectorAll('.pondasi-codeview-tab');
        for (var i = 0; i < tabs.length; i++) {
            if (tabs[i].dataset.cvTab === tabName) {
                tabs[i].classList.add('pondasi-codeview-tab-aktif');
            } else {
                tabs[i].classList.remove('pondasi-codeview-tab-aktif');
            }
        }
        P.refreshCodeView();
    };

    /* === Apply perubahan ke STATE === */
    P.applyCodeView = function () {
        var ta = document.getElementById('codeview-textarea');
        if (!ta) return;
        var val = ta.value;
        if (cvActiveTab === 'html') {
            // Apply HTML — parse tree dari HTML mentah
            P.konfirmasi(
                'Apply HTML ke halaman aktif? Layout saat ini akan diganti (bisa undo).',
                function (ok) {
                    if (!ok) return;
                    P.applyHtmlToState(val);
                },
                'Apply HTML',
                'Apply',
                'Batal'
            );
        } else if (cvActiveTab === 'css') {
            // Apply CSS kustom — parse string ke customCSS object
            P.konfirmasi(
                'Apply CSS kustom? Aturan CSS yang ada akan diganti.',
                function (ok) {
                    if (!ok) return;
                    P.applyCssToState(val);
                },
                'Apply CSS',
                'Apply',
                'Batal'
            );
        } else {
            P.flash('Tab ini read-only');
        }
    };

    /* === Apply HTML mentah ke STATE.tree === */
    /* v117: applyHtmlToState sekarang ada real parser di bawah (P.parseHtmlToTree).
       Lihat definisi P.applyHtmlToState di akhir file (di luar IIFE). */

    /* === Apply CSS kustom ke STATE.customCSS (v118: REAL parser) === */
    /* Parse string CSS menjadi customCSS object.
       Format customCSS: { regionId: { className, rules: { prop: val }, pseudo: { ... } } }
       v118: parse CSS string, map ke customCSS object, sync ke STATE.customCSS.
    */
    P.applyCssToState = function (css) {
        var page = P.getCurrentPage();
        if (!page) {
            P.flash('Tidak ada halaman aktif');
            return;
        }
        if (P.keluarModeEdit) P.keluarModeEdit();
        P.pushUndo();
        var parsed = P.parseCssToCustomCSS(css);
        if (parsed.errors.length > 0) {
            P.flash('CSS di-apply dengan ' + parsed.errors.length + ' warning');
        } else {
            P.flash('CSS kustom di-apply ke STATE.customCSS (' + Object.keys(parsed.customCSS).length + ' kelas)');
        }
        // Merge: replace entire customCSS dengan hasil parse
        P.STATE.customCSS = parsed.customCSS;
        // Hapus cssOverride (sudah di-apply ke customCSS object)
        delete page.cssOverride;
        P.syncToProject();
        P.saveProjects();
        P.render();
        P.refreshCodeView();
    };

    /* === Parse CSS string → customCSS object ===
       Format CSS yang diharapkan (sama dengan output generateCustomCSS):
         .nama-kelas { prop: val; ... }                       ← tanpa region (global)
         div.kolom-4.nama-kelas { prop: val; ... }            ← dengan region
         div.kolom-4.nama-kelas:hover { prop: val; ... }      ← dengan pseudo
       Output: { customCSS: { id: { className, rules, pseudo } }, errors: [] }
    */
    P.parseCssToCustomCSS = function (css) {
        var result = { customCSS: {}, errors: [] };
        if (!css || !css.trim()) return result;
        // Strip comments
        css = css.replace(/\/\*[\s\S]*?\*\//g, '');
        // Tokenize: cari selector { ... }
        var regex = /([^{}]+)\{([^}]*)\}/g;
        var match;
        var idx = 0;
        while ((match = regex.exec(css)) !== null) {
            var selector = match[1].trim();
            var body = match[2].trim();
            if (!selector || !body) continue;
            // Parse selector: cari class terakhir sebagai className
            // Contoh: "div.kolom-4.kustom-r3" → className="kustom-r3"
            //         ".kustom-r3" → className="kustom-r3"
            //         "div.kolom-4.kustom-r3:hover" → className="kustom-r3", pseudo=":hover"
            var pseudo = '';
            var pseudoMatch = selector.match(/:(hover|focus|active|visited|first-child|last-child|nth-child\([^)]+\))\s*$/);
            if (pseudoMatch) {
                pseudo = ':' + pseudoMatch[1];
                selector = selector.replace(/:([^:]+)$/, '').trim();
            }
            // Ambil class terakhir
            var classMatch = selector.match(/\.([a-zA-Z0-9_-]+)$/);
            if (!classMatch) {
                result.errors.push('Selector tidak punya class: ' + selector);
                continue;
            }
            var className = classMatch[1];
            // Cari region ID dari selector — pakai region yang punya className sama di STATE.customCSS existing
            // Kalau tidak ada, buat ID baru
            var regionId = null;
            // Coba match dengan region yang ada di tree (selector seperti div.kolom-4)
            var regionMatch = selector.match(/^([a-zA-Z]+)\.([a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)*)\./);
            if (regionMatch) {
                var tag = regionMatch[1];
                var classes = regionMatch[2].split('.');
                // Walk tree untuk cari region dengan tag + classes matching
                if (P.STATE.tree) {
                    (function walk(node) {
                        if (regionId) return;
                        if (node.tag === tag && node.classes) {
                            var matchAll = true;
                            for (var ci = 0; ci < classes.length; ci++) {
                                if (node.classes.indexOf(classes[ci]) < 0) { matchAll = false; break; }
                            }
                            if (matchAll) regionId = node.id;
                        }
                        if (node.children) node.children.forEach(walk);
                    })(P.STATE.tree);
                }
            }
            if (!regionId) {
                // Tidak match region existing — buat ID baru (acak)
                regionId = 'cssblock_' + (idx++);
            }
            // Parse body ke rules { prop: val }
            var rules = {};
            var decls = body.split(';');
            for (var di = 0; di < decls.length; di++) {
                var decl = decls[di].trim();
                if (!decl) continue;
                var colonIdx = decl.indexOf(':');
                if (colonIdx < 0) continue;
                var prop = decl.substring(0, colonIdx).trim();
                var val = decl.substring(colonIdx + 1).trim();
                if (!prop || !val) continue;
                // Kebab-case → camelCase (reverse dari generateCustomCSS)
                var camelProp = prop.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); });
                rules[camelProp] = val;
            }
            // Simpan ke result
            if (!result.customCSS[regionId]) {
                result.customCSS[regionId] = {
                    className: className,
                    rules: {},
                    pseudo: {}
                };
            }
            if (pseudo) {
                result.customCSS[regionId].pseudo[pseudo] = rules;
            } else {
                // Merge rules ke normal
                for (var p in rules) {
                    if (rules.hasOwnProperty(p)) {
                        result.customCSS[regionId].rules[p] = rules[p];
                    }
                }
            }
        }
        return result;
    };

    /* === Copy code view ke clipboard === */
    P.copyCodeView = function () {
        var ta = document.getElementById('codeview-textarea');
        if (!ta) return;
        ta.select();
        try {
            if (document.execCommand('copy')) {
                P.flash('Disalin ke clipboard');
            } else {
                P.flash('Gagal copy — gunakan Ctrl+C manual');
            }
        } catch (e) {
            P.flash('Gagal copy: ' + e.message);
        }
        // Deselect
        ta.selectionStart = ta.selectionEnd = 0;
    };

})();

/* === HTML Parser: parse HTML string → tree structure Pondasi ===
   Strategy sederhana (v117):
   - Parse <body> inner HTML via DOMParser
   - Walk DOM tree, map ke node Pondasi:
     - <main class="baris"> → grand-parent (root)
     - <section>, <div class="baris"> → parent
     - <div class="kolom-X"> → child (with col = X)
     - <div class="sub-baris"> → sub-child
   - Map elemen dalam region → blocks
   - Preserve custom classes, attributes, text content
   - Build new tree structure
*/
P.parseHtmlToTree = function (htmlString) {
    // Ekstrak body content
    var bodyMatch = htmlString.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (!bodyMatch) {
        return { error: 'Body tidak ditemukan di HTML' };
    }
    var bodyHTML = bodyMatch[1];
    var parser = new DOMParser();
    var doc = parser.parseFromString('<div id="root">' + bodyHTML + '</div>', 'text/html');
    var root = doc.getElementById('root');
    if (!root) return { error: 'Parse gagal' };

    // Recursive walker
    function parseNode(el, depth) {
        if (!el || el.nodeType !== 1) return null;
        var tag = el.tagName.toLowerCase();
        var cls = el.className || '';
        var classList = cls.split(/\s+/).filter(Boolean);
        var id = el.getAttribute('id') || '';

        // Tentukan tipe node berdasarkan tag + class
        var nodeType = null;
        var col = 0;
        var colName = '';

        // Main dengan class baris → grand-parent
        if ((tag === 'main' || tag === 'div') && classList.indexOf('baris') >= 0 && depth === 0) {
            nodeType = 'grand-parent';
        } else if (tag === 'section' && classList.indexOf('baris') >= 0) {
            nodeType = 'parent';
        } else if (classList.indexOf('kolom') >= 0) {
            // Cari kelas kolom-X
            for (var ci = 0; ci < classList.length; ci++) {
                var m = classList[ci].match(/^kolom-(\d+)$/);
                if (m) { col = parseInt(m[1], 10); break; }
                var m2 = classList[ci].match(/^kolom-(lima|tujuh|delapan|sembilan|sepuluh|sebelas)$/);
                if (m2) { colName = m2[1]; col = 0; break; }
            }
            nodeType = 'child';
        } else if (classList.indexOf('sub-baris') >= 0) {
            nodeType = 'sub-child';
        } else {
            // Bukan region Pondasi — skip atau anggap wrapper
            return null;
        }

        var node = {
            id: P.genId(),
            type: nodeType,
            tag: tag,
            classes: classList.slice(),
            blocks: []
        };
        if (col > 0) node.col = col;
        if (colName) node.colName = colName;

        // Walk children: pisahkan region vs block
        var children = [];
        for (var i = 0; i < el.children.length; i++) {
            var child = el.children[i];
            var childNode = parseNode(child, depth + 1);
            if (childNode) {
                children.push(childNode);
            } else {
                // Ini adalah block konten — bukan region
                // Block disimpan sebagai "blocks" di region ini
                var block = parseBlock(child);
                if (block) node.blocks.push(block);
            }
        }
        node.children = children;
        return node;
    }

    function parseBlock(el) {
        if (!el || el.nodeType !== 1) return null;
        var tag = el.tagName.toLowerCase();
        var cls = el.className || '';
        var classList = cls.split(/\s+/).filter(Boolean);

        // Tentukan jenis block dari tag + class
        var jenis = 'kustom';
        if (tag === 'p') jenis = 'paragraf';
        else if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') jenis = 'heading';
        else if (tag === 'ul' || tag === 'ol') jenis = 'daftar';
        else if (tag === 'img') jenis = 'gambar';
        else if (tag === 'a' && classList.indexOf('tombol') >= 0) jenis = 'tombol';
        else if (tag === 'blockquote') jenis = 'kutipan';
        else if (tag === 'pre') jenis = 'kode';
        else if (tag === 'figure') jenis = 'figur';
        else if (tag === 'table') jenis = 'tabel';
        else if (tag === 'form') jenis = 'form';
        else if (tag === 'header') jenis = 'header';
        else if (tag === 'footer') jenis = 'footer';
        else if (tag === 'nav') jenis = 'navigasi';
        else if (tag === 'aside') jenis = 'aside';
        else if (tag === 'article') jenis = 'kartu';

        var block = {
            id: P.genBlockId(),
            jenis: jenis,
            tag: tag,
            classes: classList.slice(),
            isi: el.textContent || '',
            properti: {}
        };

        // Untuk gambar, ambil src + alt
        if (tag === 'img') {
            block.properti.src = el.getAttribute('src') || '';
            block.properti.alt = el.getAttribute('alt') || '';
        }
        // Untuk link, ambil href
        if (tag === 'a') {
            block.properti.href = el.getAttribute('href') || '#';
        }
        // Inner HTML (untuk block kompleks)
        block._innerHtml = el.innerHTML;
        return block;
    }

    // Cari root (main.baris atau div.baris pertama)
    var mainEl = root.querySelector('main.baris, main, div.baris');
    if (!mainEl) {
        // Fallback: cari section pertama
        mainEl = root.querySelector('section.baris, section');
        if (!mainEl) return { error: 'Tidak ada elemen root (main.baris atau section.baris) di body' };
    }
    var tree = parseNode(mainEl, 0);
    if (!tree) return { error: 'Gagal parse root' };
    return { tree: tree };
};

/* === Apply HTML dari code view → STATE.tree (v117: REAL parser) === */
P.applyHtmlToState = function (html) {
    var result = P.parseHtmlToTree(html);
    if (result.error) {
        P.flash('Parse gagal: ' + result.error);
        return;
    }
    if (P.keluarModeEdit) P.keluarModeEdit();
    P.pushUndo();
    P.STATE.tree = result.tree;
    P.STATE.activeId = result.tree.id;
    P.STATE.selectedIds = [];
    // Hapus htmlOverride (sudah di-apply ke tree)
    var page = P.getCurrentPage();
    if (page) delete page.htmlOverride;
    P.syncToProject();
    P.saveProjects();
    P.render();
    P.renderPanel();
    P.flash('HTML di-apply ke canvas — layout diperbarui');
    P.tutupCodeView();
};
