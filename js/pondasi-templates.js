/* PONDASI-TEMPLATES.JS
   5 template wireframe umum yang sering dipakai website.
   Setiap template punya:
     - name:        nama tampilan
     - deskripsi:   ringkasan singkat layout
     - tree:        tree node pondasi (pakai factory P.nGrandParent() dll)
     - settings:    override settings (default dari P.defaultSettings() kalau tidak ada)
*/
var P = P || {};

P.TEMPLATES = {
    'landing-page': {
        name: 'Landing Page',
        deskripsi: 'Header + hero (8+4) + 3 fitur + footer',
        settings: {
            judul: 'Landing Page',
            deskripsi: 'Halaman muka untuk produk atau layanan',
            dimensi: '1200',
            temaWarna: 'terang'
        },
        tree: (function () {
            var gp = P.nGrandParent();
            var s1 = P.nParent();  // header
            gp.children.push(s1);
            var s2 = P.nParent();  // hero
            s2.children.push(P.nChild(8), P.nChild(4));
            gp.children.push(s2);
            var s3 = P.nParent();  // 3 fitur
            s3.children.push(P.nChild(4), P.nChild(4), P.nChild(4));
            gp.children.push(s3);
            var s4 = P.nParent();  // footer
            gp.children.push(s4);
            return gp;
        })()
    },

    'artikel-blog': {
        name: 'Artikel / Blog',
        deskripsi: 'Header + main (8) + sidebar (4) + footer',
        settings: {
            judul: 'Artikel Blog',
            deskripsi: 'Layout artikel dengan sidebar',
            dimensi: '1200',
            temaWarna: 'terang'
        },
        tree: (function () {
            var gp = P.nGrandParent();
            var s1 = P.nParent();  // header
            gp.children.push(s1);
            var s2 = P.nParent();  // main + sidebar
            s2.children.push(P.nChild(8), P.nChild(4));
            gp.children.push(s2);
            var s3 = P.nParent();  // footer
            gp.children.push(s3);
            return gp;
        })()
    },

    'portfolio': {
        name: 'Portfolio',
        deskripsi: 'Header + galeri 4 kolom + about (6+6) + footer',
        settings: {
            judul: 'Portfolio',
            deskripsi: 'Galeri karya dengan bagian tentang',
            dimensi: '1280',
            temaWarna: 'terang'
        },
        tree: (function () {
            var gp = P.nGrandParent();
            var s1 = P.nParent();  // header
            gp.children.push(s1);
            var s2 = P.nParent();  // galeri
            s2.children.push(P.nChild(3), P.nChild(3), P.nChild(3), P.nChild(3));
            gp.children.push(s2);
            var s3 = P.nParent();  // about
            s3.children.push(P.nChild(6), P.nChild(6));
            gp.children.push(s3);
            var s4 = P.nParent();  // footer
            gp.children.push(s4);
            return gp;
        })()
    },

    'dashboard': {
        name: 'Dashboard / Aplikasi',
        deskripsi: 'Sidebar (3) + main content (9)',
        settings: {
            judul: 'Dashboard',
            deskripsi: 'Layout aplikasi dengan sidebar navigasi',
            dimensi: 'full',
            temaWarna: 'terang'
        },
        tree: (function () {
            var gp = P.nGrandParent();
            var s1 = P.nParent();
            s1.children.push(P.nChild(3), P.nChild(9));
            gp.children.push(s1);
            return gp;
        })()
    },

    'form-page': {
        name: 'Halaman Form',
        deskripsi: 'Header + form tengah (6) + footer',
        settings: {
            judul: 'Form',
            deskripsi: 'Halaman form terpusat (login, kontak, daftar)',
            dimensi: '960',
            temaWarna: 'terang'
        },
        tree: (function () {
            var gp = P.nGrandParent();
            var s1 = P.nParent();  // header
            gp.children.push(s1);
            var s2 = P.nParent();  // form centered
            s2.children.push(P.nChild(3), P.nChild(6), P.nChild(3));
            gp.children.push(s2);
            var s3 = P.nParent();  // footer
            gp.children.push(s3);
            return gp;
        })()
    }
};

/* ======================================================================
   USER TEMPLATES — simpan/load/hapus template buatan user
   Disimpan di localStorage key 'pondasi.templates.v1' (array JSON)
   ====================================================================== */

P.USER_TEMPLATES_KEY = 'pondasi.templates.v1';

/* Ambil semua user template dari localStorage */
P.getUserTemplates = function() {
    try {
        var raw = localStorage.getItem(P.USER_TEMPLATES_KEY);
        if (!raw) return [];
        var list = JSON.parse(raw);
        if (!Array.isArray(list)) return [];
        return list;
    } catch (e) {
        return [];
    }
};

/* Simpan user templates ke localStorage */
P.saveUserTemplates = function(list) {
    try {
        localStorage.setItem(P.USER_TEMPLATES_KEY, JSON.stringify(list));
    } catch (e) {
        P.flash('Gagal menyimpan template: ' + (e.message || 'error'));
    }
};

/* Save as template — simpan tree + settings aktif sebagai template baru */
P.saveAsTemplate = function(nama, deskripsi) {
    if (!P.STATE.tree || !P.STATE.currentProjectId) {
        P.flash('Tidak ada dokumen aktif');
        return false;
    }
    nama = (nama || '').trim();
    if (!nama) { P.flash('Nama template tidak boleh kosong'); return false; }

    // Deep copy tree
    var treeCopy = P.deepCopy(P.STATE.tree);
    // Ambil settings aktif
    var settings = P.getProjectSettings();
    // Ambil customCSS untuk region (kalau ada)
    var customCSSCopy = {};
    if (P.STATE.customCSS) {
        for (var rid in P.STATE.customCSS) {
            if (P.STATE.customCSS.hasOwnProperty(rid)) {
                var css = P.STATE.customCSS[rid];
                customCSSCopy[rid] = {
                    className: css.className,
                    rules: P.deepCopy(css.rules || {}),
                    pseudo: P.deepCopy(css.pseudo || {})
                };
            }
        }
    }

    var template = {
        id: 'utpl_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
        name: nama,
        deskripsi: deskripsi || '',
        tree: treeCopy,
        settings: settings,
        customCSS: customCSSCopy,
        createdAt: Date.now()
    };

    var list = P.getUserTemplates();
    list.push(template);
    P.saveUserTemplates(list);
    P.flash('Template "' + nama + '" disimpan');
    return true;
};

/* Apply user template */
P.applyUserTemplate = function(templateId) {
    var list = P.getUserTemplates();
    var template = null;
    for (var i = 0; i < list.length; i++) {
        if (list[i].id === templateId) { template = list[i]; break; }
    }
    if (!template) { P.flash('Template tidak ditemukan'); return false; }

    if (typeof P.keluarModeEdit === 'function') P.keluarModeEdit();
    P.pushUndo();

    P.STATE.tree = P.deepCopy(template.tree);
    P.beriIdBaruRegion(P.STATE.tree);
    P.STATE.customCSS = {};
    if (template.customCSS) {
        for (var rid in template.customCSS) {
            if (template.customCSS.hasOwnProperty(rid)) {
                P.STATE.customCSS[rid] = P.deepCopy(template.customCSS[rid]);
            }
        }
    }

    if (template.settings) {
        var settings = P.getProjectSettings();
        var judulLama = settings.judul;
        settings = P.deepCopy(template.settings);
        settings.judul = judulLama;
        P.updateProjectSettings(settings);
    }

    P.STATE.activeId = P.STATE.tree.id;
    P.STATE.selectedIds = [];
    P.syncToProject();
    P.saveProjects();
    P.render();
    P.flash('Template "' + template.name + '" diterapkan');
    return true;
};

/* Hapus user template */
P.deleteUserTemplate = function(templateId) {
    var list = P.getUserTemplates();
    var newList = [];
    var deleted = false;
    for (var i = 0; i < list.length; i++) {
        if (list[i].id === templateId) deleted = true;
        else newList.push(list[i]);
    }
    if (deleted) {
        P.saveUserTemplates(newList);
        P.flash('Template dihapus');
    }
    return deleted;
};

/* Dapatkan SEMUA template (bawaan + user) */
P.getAllTemplates = function() {
    var result = [];
    if (P.TEMPLATES) {
        Object.keys(P.TEMPLATES).forEach(function(key) {
            result.push({
                id: key,
                name: P.TEMPLATES[key].name,
                deskripsi: P.TEMPLATES[key].deskripsi || '',
                isUser: false,
                createdAt: 0
            });
        });
    }
    var userList = P.getUserTemplates();
    userList.forEach(function(t) {
        result.push({
            id: t.id,
            name: t.name,
            deskripsi: t.deskripsi || '',
            isUser: true,
            createdAt: t.createdAt || 0
        });
    });
    return result;
};
