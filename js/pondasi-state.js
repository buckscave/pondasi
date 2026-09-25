/* PONDASI-STATE.JS */
var P = P || {};

    /* ======================================================================
       STATE GLOBAL
       ====================================================================== */
    P.STATE = {
        // Multi-project management
        currentProjectId: null,    // id project aktif (null = belum ada project)
        currentPageId: null,       // id halaman aktif dalam project
        projects: {},              // {projectId: {id, name, pages: [...], currentPageId, cssExternal, settings, ...}}

        // Editor state (per-session, dari halaman aktif)
        tree: null,
        activeId: null,
        selectedIds: [],
        nextId: 1,
        drag: null,
        pendingCount: null,
        pendingTimer: null,
        undoStack: [],
        redoStack: [],
        maxHistory: 50,
        editMode: {
            active: false,
            regionId: null,
            selectedBlockId: null,
            lastBlockClickId: null,
            lastBlockClickTime: 0,
            customClass: null,
            paletteOpen: null,
            savedSelection: null
        },
        customCSS: {},

        // Storage keys
        projectsKey: 'pondasi.projects.v2',
        currentKey: 'pondasi.current.v2',
        legacyTreeKey: 'pondasi.tree.v1',
        legacyCustomCSSKey: 'pondasi.customcss.v1'
    };

    /* === PAGE ID GENERATOR === */
    P.genPageId = function() {
        return 'page_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    };

    /* ======================================================================
       UTIL
       ====================================================================== */
    P.genId = function() {
        // 8 char random (~2 milyar kombinasi) — collision probability sangat rendah
        return 'r' + (P.STATE.nextId++) + '_' + Math.random().toString(36).slice(2, 10);
    }

    P.el = function(tag, attrs, children) {
        var e = document.createElement(tag);
        if (attrs) {
            for (var k in attrs) {
                if (attrs.hasOwnProperty(k)) {
                    if (k === 'class') e.className = attrs[k];
                    else if (k === 'text') e.textContent = attrs[k];
                    else if (k === 'html') e.innerHTML = attrs[k];
                    else if (k === 'dataset') {
                        for (var d in attrs.dataset) {
                            if (attrs.dataset.hasOwnProperty(d)) e.dataset[d] = attrs.dataset[d];
                        }
                    } else if (k.indexOf('on') === 0) {
                        e.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
                    } else {
                        e.setAttribute(k, attrs[k]);
                    }
                }
            }
        }
        if (children) {
            if (!Array.isArray(children)) children = [children];
            children.forEach(function (c) {
                if (c == null) return;
                if (typeof c === 'string') e.appendChild(document.createTextNode(c));
                else e.appendChild(c);
            });
        }
        return e;
    }

    P.getById = function(id, node) {
        node = node || P.STATE.tree;
        if (node.id === id) return node;
        if (!node.children) return null;
        for (var i = 0; i < node.children.length; i++) {
            var f = P.getById(id, node.children[i]);
            if (f) return f;
        }
        return null;
    }

    P.getParent = function(id, node, parent) {
        node = node || P.STATE.tree;
        parent = parent || null;
        if (node.id === id) return parent;
        if (!node.children) return null;
        for (var i = 0; i < node.children.length; i++) {
            var f = P.getParent(id, node.children[i], node);
            if (f !== null) return f;
        }
        return null;
    }

    P.getSiblingIndex = function(id) {
        var p = P.getParent(id);
        if (!p) return -1;
        for (var i = 0; i < p.children.length; i++) {
            if (p.children[i].id === id) return i;
        }
        return -1;
    }

    P.isHorizontalSiblingGroup = function(node) {
        // kolom-* → sibling horisontal (kiri-kanan)
        // section/sub-baris → sibling vertikal (atas-bawah)
        return node && node.col !== undefined;
    }

    /* ======================================================================
       FACTORY NODE
       ====================================================================== */
    P.nGrandParent = function() {
        return {
            id: P.genId(),
            type: 'grand-parent',
            tag: 'main',
            classes: ['baris'],
            children: []
        };
    }

    P.nParent = function() {
        return {
            id: P.genId(),
            type: 'parent',
            tag: 'section',
            classes: ['baris'],
            children: []
        };
    }

    P.nChild = function(col) {
        return {
            id: P.genId(),
            type: 'child',
            tag: 'div',
            classes: ['kolom-' + col],
            col: col,
            children: []
        };
    }

    P.nSubParent = function(col) {
        return {
            id: P.genId(),
            type: 'sub-parent',
            tag: 'div',
            classes: ['kolom-' + col, 'sub-baris'],
            col: col,
            children: []
        };
    }

    P.nSubChild = function() {
        return {
            id: P.genId(),
            type: 'sub-child',
            tag: 'div',
            classes: ['sub-baris'],
            children: []
        };
    }

    P.setCol = function(node, col) {
        node.col = col;
        var classes = node.classes.filter(function (c) { return c.indexOf('kolom-') !== 0; });
        classes.unshift('kolom-' + col);
        node.classes = classes;
    }

    /*
       Helper untuk motion split: tentukan kelas kolom berdasarkan N region yang diinginkan.

       Pondasi.css punya 2 sistem:
       - Sistem 12 (genap): kolom-1, kolom-2, kolom-3, kolom-4, kolom-5, kolom-6, kolom-7,
                            kolom-8, kolom-9, kolom-10, kolom-11, kolom-12
       - Sistem 10 (ganjil nama Indonesia): kolom-lima (1/5), kolom-tujuh (1/7),
                            kolom-delapan (1/8), kolom-sembilan (1/9), kolom-sepuluh (1/10),
                            kolom-sebelas (1/11)

       Pemetaan N → kelas kolom untuk proporsional:
       - 1, 2  → kolom-6 (12 sistem, 50:50)
       - 3     → kolom-4 (12 sistem, 33:33:33)
       - 4     → kolom-3 (12 sistem, 25:25:25:25)
       - 5     → kolom-lima (10 sistem, 20:20:20:20:20)
       - 6     → kolom-2 (12 sistem, 16.6...)
       - 7     → kolom-tujuh (10 sistem, 1/7 tiap)
       - 8     → kolom-delapan (10 sistem, 1/8)
       - 9     → kolom-sembilan (10 sistem, 1/9)
       - 10    → kolom-sepuluh (10 sistem, 1/10)
       - 11    → kolom-sebelas (10 sistem, 1/11)
       - 12    → kolom-1 (12 sistem, 1/12)

       Returns: {colName: string, isNamed: boolean}
       isNamed = true jika pakai sistem 10 (nama Indonesia, mis. 'lima')
    */
    P.colNameForN = function(n) {
        var map = {
            1: 'kolom-12',
            2: 'kolom-6',
            3: 'kolom-4',
            4: 'kolom-3',
            5: 'kolom-lima',
            6: 'kolom-2',
            7: 'kolom-tujuh',
            8: 'kolom-delapan',
            9: 'kolom-sembilan',
            10: 'kolom-sepuluh',
            11: 'kolom-sebelas',
            12: 'kolom-1'
        };
        return map[n] || null;
    }

    // Cek apakah kelas kolom adalah sistem 10 (ganjil, nama Indonesia)
    P.isOddCol = function(node) {
        return node && node.colName && node.col === 0;
    }

    // Konversi kelas kolom ganjil ke kelas sistem 12 terdekat untuk distribusi equal N sibling
    // Mis. kolom-lima + 4 sibling → masing-masing kolom-3
    // kolom-tujuh + 6 sibling → masing-masing kolom-2
    // Digunakan saat hapus kolom ganjil → konversi sibling ke sistem 12
    P.oddToSystem12 = function(siblingCount) {
        // Map: jumlah sibling → kelas sistem 12 yang proporsional
        var map = {
            1: 'kolom-12',
            2: 'kolom-6',
            3: 'kolom-4',
            4: 'kolom-3',
            6: 'kolom-2',
            12: 'kolom-1'
        };
        return map[siblingCount] || null;
    }

    // Buat node kolom dengan nama kelas tertentu (string seperti 'kolom-6' atau 'kolom-lima')
    P.nChildNamed = function(className) {
        var node = P.nChild(0);  // col=0 placeholder, akan di-set via setColFromName
        node.classes = [className];
        // Untuk kolom-* angka, simpan angka; untuk nama Indonesia, tidak simpan col numerik
        var match = /^kolom-(\d+)$/.exec(className);
        if (match) {
            node.col = parseInt(match[1], 10);
            node.colName = null;
        } else {
            // Kolom ganjil (lima, tujuh, dll) — simpan nama, col = 0 (tidak dipakai untuk resize)
            var nameMatch = /^kolom-([a-z]+)$/.exec(className);
            node.colName = nameMatch ? nameMatch[1] : null;
            node.col = 0;
        }
        return node;
    }

    /* ======================================================================
       SAVE / LOAD / EXPORT (pakai project system)
       ====================================================================== */

    // Save editor state ke project aktif + persist ke storage
    P.save = function() {
        if (!P.STATE.currentProjectId) return;
        P.syncToProject();
        // Pakai storage adapter (server atau localStorage)
        if (typeof P.storageSave === 'function') {
            P.storageSave();
        } else {
            P.saveProjects();
        }
    }

    /*
       Undo / Redo — per operasi mutasi
    */
    P.deepCopy = function(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /* === v122: Custom colors management (warna kustom user) === */
    /* Disimpan di localStorage, terpisah dari palette mejikuhibiniu */
    P.getCustomColors = function() {
        try {
            var stored = localStorage.getItem('pondasi.customColors');
            if (!stored) return [];
            var arr = JSON.parse(stored);
            return Array.isArray(arr) ? arr : [];
        } catch (e) {
            return [];
        }
    };

    P.addCustomColor = function(hex) {
        if (!hex) return false;
        hex = hex.toUpperCase();
        // Validate format
        if (!/^#[0-9A-F]{6}$/.test(hex)) return false;
        var colors = P.getCustomColors();
        // v130: Cek apakah warna sudah ada di palette default mejikuhibiniu
        // Jika ya, jangan tambahkan ke custom — tetap sebagai warna default
        var paletteHexes = ['FF8080','FF3232','B30000','FFA080','FF6432','C83200','FFE180','FFC832','C89600','B4E664','80C832','4B9600','78C8F0','32A5E1','0073B4','B482F0','823CDC','500AAA','DCB4E6','B978C8','874696','FFFFFF','E1E6EB','A0AAB4','5A646E','3C4650','1E2832','0A141E'];
        var hexNoHash = hex.substring(1);
        if (paletteHexes.indexOf(hexNoHash) >= 0) return false;  // sudah ada di palette default
        if (colors.indexOf(hex) >= 0) return false;  // sudah ada di custom
        colors.push(hex);
        // Limit max 14 warna kustom (2 baris × 7)
        if (colors.length > 14) colors = colors.slice(-14);
        try {
            localStorage.setItem('pondasi.customColors', JSON.stringify(colors));
        } catch (e) {
            return false;
        }
        return true;
    };

    P.removeCustomColor = function(hex) {
        if (!hex) return false;
        // v138: Jangan uppercase gradient entries (#GRAD:gradlin-1 punya nama class lowercase)
        if (hex.indexOf('#GRAD:') !== 0) {
            hex = hex.toUpperCase();
        }
        var colors = P.getCustomColors();
        var idx = colors.indexOf(hex);
        if (idx < 0) return false;
        colors.splice(idx, 1);
        try {
            localStorage.setItem('pondasi.customColors', JSON.stringify(colors));
        } catch (e) {
            return false;
        }
        // v126: Refresh baris custom tanpa re-render seluruh modal
        if (P.refreshCustomColorRow && P.STATE.editMode.paletteOpen) {
            P.refreshCustomColorRow(P.STATE.editMode.paletteOpen);
        }
        P.flash('Warna kustom dihapus');
        return true;
    };

    P.pushUndo = function() {
        // Simpan juga blocks + editMode state untuk block-level undo
        var node = P.getById(P.STATE.activeId);
        var snapshot = {
            tree: P.deepCopy(P.STATE.tree),
            activeId: P.STATE.activeId,
            selectedIds: P.deepCopy(P.STATE.selectedIds),
            nextId: P.STATE.nextId,
            // Block-level: simpan blocks region yang sedang di-edit
            editRegionId: P.STATE.editMode.regionId,
            editBlocks: (node && node.blocks) ? P.deepCopy(node.blocks) : null,
            editSelectedBlockId: P.STATE.editMode.selectedBlockId
        };
        P.STATE.undoStack.push(snapshot);
        if (P.STATE.undoStack.length > P.STATE.maxHistory) {
            P.STATE.undoStack.shift();
        }
        P.STATE.redoStack = [];
        // Sync ke page (per-page undo/redo persistence)
        P.syncUndoRedoToPage();
    }

    P.undo = function() {
        if (P.STATE.undoStack.length === 0) {
            P.flash('Tidak ada operasi untuk undo');
            return;
        }
        // Simpan state saat ini ke redo (dengan block state juga)
        var currentNode = P.getById(P.STATE.activeId);
        var current = {
            tree: P.deepCopy(P.STATE.tree),
            activeId: P.STATE.activeId,
            selectedIds: P.deepCopy(P.STATE.selectedIds),
            nextId: P.STATE.nextId,
            editRegionId: P.STATE.editMode.regionId,
            editBlocks: (currentNode && currentNode.blocks) ? P.deepCopy(currentNode.blocks) : null,
            editSelectedBlockId: P.STATE.editMode.selectedBlockId
        };
        P.STATE.redoStack.push(current);
        // Pop undo
        var prev = P.STATE.undoStack.pop();
        P.STATE.tree = prev.tree;
        P.STATE.activeId = prev.activeId;
        P.STATE.selectedIds = prev.selectedIds;
        P.STATE.nextId = prev.nextId;
        // Restore block state kalau ada
        if (prev.editRegionId && prev.editBlocks) {
            var editNode = P.getById(prev.editRegionId);
            if (editNode) {
                editNode.blocks = P.deepCopy(prev.editBlocks);
            }
            P.STATE.editMode.selectedBlockId = prev.editSelectedBlockId;
        }
        P.save();
        P.render();
        if (P.STATE.editMode.active) {
            P.renderBlocks();
            P.renderPanel();
        }
        P.flash('Undo');
        // Sync ke page (per-page undo/redo persistence)
        P.syncUndoRedoToPage();
    }

    P.redo = function() {
        if (P.STATE.redoStack.length === 0) {
            P.flash('Tidak ada operasi untuk redo');
            return;
        }
        var currentNode = P.getById(P.STATE.activeId);
        var current = {
            tree: P.deepCopy(P.STATE.tree),
            activeId: P.STATE.activeId,
            selectedIds: P.deepCopy(P.STATE.selectedIds),
            nextId: P.STATE.nextId,
            editRegionId: P.STATE.editMode.regionId,
            editBlocks: (currentNode && currentNode.blocks) ? P.deepCopy(currentNode.blocks) : null,
            editSelectedBlockId: P.STATE.editMode.selectedBlockId
        };
        P.STATE.undoStack.push(current);
        var next = P.STATE.redoStack.pop();
        P.STATE.tree = next.tree;
        P.STATE.activeId = next.activeId;
        P.STATE.selectedIds = next.selectedIds;
        P.STATE.nextId = next.nextId;
        // Restore block state kalau ada
        if (next.editRegionId && next.editBlocks) {
            var editNode = P.getById(next.editRegionId);
            if (editNode) {
                editNode.blocks = P.deepCopy(next.editBlocks);
            }
            P.STATE.editMode.selectedBlockId = next.editSelectedBlockId;
        }
        P.save();
        P.render();
        if (P.STATE.editMode.active) {
            P.renderBlocks();
            P.renderPanel();
        }
        P.flash('Redo');
        // Sync ke page (per-page undo/redo persistence)
        P.syncUndoRedoToPage();
    }

    /* === Helper: sync undo/redo stack ke halaman aktif === */
    P.syncUndoRedoToPage = function() {
        if (!P.STATE.currentProjectId) return;
        var page = P.getCurrentPage();
        if (!page) return;
        page.undoStack = P.deepCopy(P.STATE.undoStack);
        page.redoStack = P.deepCopy(P.STATE.redoStack);
    };

    // Load project aktif (dari localStorage) — dipanggil di init
    P.load = function() {
        P.loadProjects();
        P.migrateLegacy();
        if (P.STATE.currentProjectId && P.STATE.projects[P.STATE.currentProjectId]) {
            return P.loadFromProject();
        }
        return false;
    }

    /* ======================================================================
       PROJECT MANAGEMENT
       ====================================================================== */

    P.defaultSettings = function() {
        return {
            judul: '',
            deskripsi: '',
            bahasa: 'id',
            robots: 'index, follow',
            viewport: 'width=device-width, initial-scale=1',
            charset: 'UTF-8',
            dimensi: '1200',
            tema: 'tampilan.css',
            cssLinks: [],
            scripts: [],
            gridMode: 'hybrid',
            gridUnit: 16,
            fontFamily: '',
            fontFamilies: [],
            fontSize: '',
            lineHeight: '',
            temaWarna: 'terang'
        };
    };

    P.genProjectId = function() {
        // 8 char random — cek collision, rekursif kalau sudah ada
        var id;
        do {
            id = 'p' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
        } while (P.STATE.projects && P.STATE.projects[id]);
        return id;
    };

    P.loadProjects = function() {
        try {
            var raw = localStorage.getItem(P.STATE.projectsKey);
            if (raw) {
                P.STATE.projects = JSON.parse(raw);
                if (!P.STATE.projects || typeof P.STATE.projects !== 'object') {
                    throw new Error('projects bukan object');
                }
            } else {
                P.STATE.projects = {};
            }
        } catch (e) {
            // Backup data corrupt supaya user bisa recover manual, lalu reset
            console.error('[pondasi] Data proyek rusak, backup ke', P.STATE.projectsKey + '.corrupt-' + Date.now(), e);
            try {
                localStorage.setItem(P.STATE.projectsKey + '.corrupt-' + Date.now(), raw || '(null)');
            } catch (e2) {}
            P.STATE.projects = {};
            if (typeof P.flash === 'function') {
                setTimeout(function () { P.flash('Data proyek rusak — mulai dari awal. Backup disimpan di localStorage.'); }, 500);
            }
        }
        try {
            P.STATE.currentProjectId = localStorage.getItem(P.STATE.currentKey) || null;
            // Validasi: currentProjectId harus ada di projects dict
            if (P.STATE.currentProjectId && !P.STATE.projects[P.STATE.currentProjectId]) {
                P.STATE.currentProjectId = null;
            }
        } catch (e) {
            P.STATE.currentProjectId = null;
        }
    };

    P.saveProjects = function() {
        try {
            localStorage.setItem(P.STATE.projectsKey, JSON.stringify(P.STATE.projects));
            if (P.STATE.currentProjectId) {
                localStorage.setItem(P.STATE.currentKey, P.STATE.currentProjectId);
            }
        } catch (e) {
            // Quota exceeded atau localStorage tidak tersedia — beri tahu user
            var pesan = 'Penyimpanan gagal: ';
            if (e && e.name === 'QuotaExceededError') {
                pesan += 'kuota localStorage penuh. Hapus dokumen lama yang tidak terpakai.';
            } else if (e && e.name === 'SecurityError') {
                pesan += 'localStorage diblokir (private browsing?). Data tidak akan tersimpan setelah tab ditutup.';
            } else {
                pesan += (e && e.message) ? e.message : 'error tidak diketahui.';
            }
            console.error('[pondasi] saveProjects gagal:', pesan, e);
            if (typeof P.flash === 'function') {
                setTimeout(function () { P.flash(pesan); }, 100);
            }
        }
    };

    P.syncToProject = function() {
        if (!P.STATE.currentProjectId) return;
        var project = P.STATE.projects[P.STATE.currentProjectId];
        if (!project) return;
        // Sinkronkan tree + customCSS ke halaman aktif
        var page = P.getCurrentPage();
        if (page) {
            page.tree = P.deepCopy(P.STATE.tree);
            page.customCSS = P.deepCopy(P.STATE.customCSS);
            // Simpan undo/redo stack ke halaman (per-page undo/redo)
            page.undoStack = P.deepCopy(P.STATE.undoStack);
            page.redoStack = P.deepCopy(P.STATE.redoStack);
            // Jika halaman aktif adalah master, propagate ke semua page yang inherit
            if (page.isMaster && P.propagateMaster) {
                P.propagateMaster(page.id);
            }
        }
        project.modifiedAt = Date.now();
    };

    P.loadFromProject = function() {
        if (!P.STATE.currentProjectId) return false;
        var project = P.STATE.projects[P.STATE.currentProjectId];
        if (!project) return false;
        // Load dari halaman aktif
        var page = P.getCurrentPage();
        if (!page) {
            // Fallback: kalau project belum punya pages (legacy), migrate dulu
            P.migrateProjectToPages(project);
            page = P.getCurrentPage();
            if (!page) return false;
        }
        P.STATE.tree = P.deepCopy(page.tree);
        P.STATE.customCSS = P.deepCopy(page.customCSS || {});
        // Load undo/redo stack dari halaman (per-page undo/redo)
        P.STATE.undoStack = page.undoStack ? P.deepCopy(page.undoStack) : [];
        P.STATE.redoStack = page.redoStack ? P.deepCopy(page.redoStack) : [];
        var maxId = 0;
        if (P.STATE.tree) {
            (function walk(n) {
                var m = /^r(\d+)_/.exec(n.id);
                if (m && parseInt(m[1], 10) > maxId) maxId = parseInt(m[1], 10);
                if (n.children) n.children.forEach(walk);
            })(P.STATE.tree);
        }
        P.STATE.nextId = maxId + 1;
        P.STATE.activeId = P.STATE.tree ? P.STATE.tree.id : null;
        P.STATE.selectedIds = [];
        return true;
    };

    /* === MULTI-PAGE: migrate project lama (tree tunggal) ke pages array === */
    P.migrateProjectToPages = function(project) {
        if (project.pages && project.pages.length > 0) return; // sudah multi-page
        var pageId = P.genPageId();
        project.pages = [{
            id: pageId,
            name: 'Beranda',
            tree: project.tree || P.nGrandParent(),
            customCSS: project.customCSS || {}
        }];
        project.currentPageId = pageId;
        P.STATE.currentPageId = pageId;
        // Hapus field lama (sudah dipindah ke page)
        delete project.tree;
        delete project.customCSS;
    };

    /* === MULTI-PAGE: dapatkan halaman aktif === */
    P.getCurrentPage = function() {
        if (!P.STATE.currentProjectId) return null;
        var project = P.STATE.projects[P.STATE.currentProjectId];
        if (!project) return null;
        // Migrate kalau belum punya pages
        if (!project.pages || project.pages.length === 0) {
            P.migrateProjectToPages(project);
        }
        // Cari halaman aktif
        var pageId = P.STATE.currentPageId || project.currentPageId;
        if (pageId) {
            for (var i = 0; i < project.pages.length; i++) {
                if (project.pages[i].id === pageId) return project.pages[i];
            }
        }
        // Fallback: halaman pertama
        if (project.pages.length > 0) {
            P.STATE.currentPageId = project.pages[0].id;
            project.currentPageId = project.pages[0].id;
            return project.pages[0];
        }
        return null;
    };

    /* === MULTI-PAGE: list semua halaman di project aktif === */
    P.listPages = function() {
        if (!P.STATE.currentProjectId) return [];
        var project = P.STATE.projects[P.STATE.currentProjectId];
        if (!project) return [];
        if (!project.pages) return [];
        return project.pages.map(function(page) {
            return {
                id: page.id,
                name: page.name,
                regionCount: page.tree ? P.countRegions(page.tree) : 0,
                isActive: page.id === (P.STATE.currentPageId || project.currentPageId)
            };
        });
    };

    /* === MULTI-PAGE: tambah halaman baru === */
    P.newPage = function(nama) {
        if (!P.STATE.currentProjectId) return null;
        var project = P.STATE.projects[P.STATE.currentProjectId];
        if (!project) return null;
        // Sync halaman aktif dulu
        P.syncToProject();
        // Buat halaman baru
        var pageId = P.genPageId();
        var page = {
            id: pageId,
            name: nama || ('Halaman ' + (project.pages.length + 1)),
            tree: P.nGrandParent(),
            customCSS: {}
        };
        project.pages.push(page);
        // Switch ke halaman baru
        P.STATE.currentPageId = pageId;
        project.currentPageId = pageId;
        P.saveProjects();
        P.loadFromProject();
        P.render();
        P.renderPanel();
        if (P.updatePageIndicator) P.updatePageIndicator();
        return pageId;
    };

    /* === MULTI-PAGE: switch halaman === */
    P.switchPage = function(pageId) {
        if (!P.STATE.currentProjectId) return false;
        var project = P.STATE.projects[P.STATE.currentProjectId];
        if (!project || !project.pages) return false;
        // Cari halaman
        var found = null;
        for (var i = 0; i < project.pages.length; i++) {
            if (project.pages[i].id === pageId) { found = project.pages[i]; break; }
        }
        if (!found) return false;
        // Jangan switch kalau sama
        if (P.STATE.currentPageId === pageId) return true;
        // Keluar mode edit
        if (typeof P.keluarModeEdit === 'function') P.keluarModeEdit();
        // Sync halaman aktif dulu (termasuk undo/redo stack ke page)
        P.syncToProject();
        // Switch
        P.STATE.currentPageId = pageId;
        project.currentPageId = pageId;
        P.saveProjects();
        P.loadFromProject();
        P.render();
        P.renderPanel();
        P.updatePageIndicator();
        return true;
    };

    /* === MULTI-PAGE: reorder halaman (pindah posisi di array) === */
    P.reorderPage = function(fromIdx, toIdx) {
        if (!P.STATE.currentProjectId) return false;
        var project = P.STATE.projects[P.STATE.currentProjectId];
        if (!project || !project.pages) return false;
        var pages = project.pages;
        if (fromIdx < 0 || fromIdx >= pages.length) return false;
        if (toIdx < 0 || toIdx >= pages.length) return false;
        if (fromIdx === toIdx) return false;
        // Pindahkan
        var moved = pages.splice(fromIdx, 1)[0];
        pages.splice(toIdx, 0, moved);
        project.modifiedAt = Date.now();
        P.saveProjects();
        P.renderPanel();
        P.updatePageIndicator();
        return true;
    };

    /* === MULTI-PAGE: dapatkan index halaman aktif (1-based) === */
    P.getCurrentPageIndex = function() {
        if (!P.STATE.currentProjectId) return 0;
        var project = P.STATE.projects[P.STATE.currentProjectId];
        if (!project || !project.pages) return 0;
        for (var i = 0; i < project.pages.length; i++) {
            if (project.pages[i].id === P.STATE.currentPageId) return i + 1;
        }
        return 0;
    };

    /* === MULTI-PAGE: total halaman === */
    P.getPageCount = function() {
        if (!P.STATE.currentProjectId) return 0;
        var project = P.STATE.projects[P.STATE.currentProjectId];
        if (!project || !project.pages) return 0;
        return project.pages.length;
    };

    /* === MULTI-PAGE: set judul HTML per-halaman (override project.settings.judul) === */
    P.setPageJudul = function(pageId, judul) {
        if (!P.STATE.currentProjectId) return false;
        var project = P.STATE.projects[P.STATE.currentProjectId];
        if (!project || !project.pages) return false;
        for (var i = 0; i < project.pages.length; i++) {
            if (project.pages[i].id === pageId) {
                project.pages[i].title = judul || '';
                project.modifiedAt = Date.now();
                P.saveProjects();
                return true;
            }
        }
        return false;
    };

    /* === MULTI-PAGE: dapatkan judul HTML efektif (page.title || project.settings.judul) === */
    P.getPageJudul = function(pageId) {
        if (!P.STATE.currentProjectId) return '';
        var project = P.STATE.projects[P.STATE.currentProjectId];
        if (!project || !project.pages) return '';
        var page = null;
        if (pageId) {
            for (var i = 0; i < project.pages.length; i++) {
                if (project.pages[i].id === pageId) { page = project.pages[i]; break; }
            }
        } else {
            page = P.getCurrentPage();
        }
        if (!page) return '';
        if (page.title && page.title.trim()) return page.title;
        // Fallback: project settings judul
        return (project.settings && project.settings.judul) || project.name || '';
    };

    /* === MULTI-PAGE: toggle status master page === */
    P.setPageAsMaster = function(pageId, isMaster) {
        if (!P.STATE.currentProjectId) return false;
        var project = P.STATE.projects[P.STATE.currentProjectId];
        if (!project || !project.pages) return false;
        for (var i = 0; i < project.pages.length; i++) {
            if (project.pages[i].id === pageId) {
                project.pages[i].isMaster = !!isMaster;
                project.modifiedAt = Date.now();
                P.saveProjects();
                P.renderPagePanel();
                P.updatePageIndicator();
                return true;
            }
        }
        return false;
    };

    /* === MULTI-PAGE: set halaman inherit dari master === */
    P.setPageInheritFrom = function(pageId, masterPageId) {
        if (!P.STATE.currentProjectId) return false;
        var project = P.STATE.projects[P.STATE.currentProjectId];
        if (!project || !project.pages) return false;
        // Validasi: masterPageId harus null ATAU page dengan isMaster=true
        if (masterPageId) {
            var master = null;
            for (var i = 0; i < project.pages.length; i++) {
                if (project.pages[i].id === masterPageId && project.pages[i].isMaster) { master = project.pages[i]; break; }
            }
            if (!master) { P.flash('Halaman target bukan master page'); return false; }
            // Tidak boleh inherit dari diri sendiri
            if (masterPageId === pageId) { P.flash('Tidak bisa inherit dari diri sendiri'); return false; }
        }
        for (var j = 0; j < project.pages.length; j++) {
            if (project.pages[j].id === pageId) {
                project.pages[j].inheritFrom = masterPageId || null;
                project.modifiedAt = Date.now();
                P.saveProjects();
                P.syncMasterToPage(pageId);
                P.renderPagePanel();
                if (pageId === P.STATE.currentPageId) {
                    P.loadFromProject();
                    P.render();
                }
                return true;
            }
        }
        return false;
    };

    /* === MULTI-PAGE: list semua master page di project aktif === */
    P.listMasterPages = function() {
        if (!P.STATE.currentProjectId) return [];
        var project = P.STATE.projects[P.STATE.currentProjectId];
        if (!project || !project.pages) return [];
        return project.pages.filter(function(p) { return p.isMaster; }).map(function(p) {
            return { id: p.id, name: p.name };
        });
    };

    /* === MULTI-PAGE: sync blocks dari master ke page yang inherit === */
    /* v115: dukung block-level override. Block dengan _inherited === false TIDAK diupdate. */
    P.syncMasterToPage = function(pageId) {
        if (!P.STATE.currentProjectId) return false;
        var project = P.STATE.projects[P.STATE.currentProjectId];
        if (!project || !project.pages) return false;
        var page = null;
        for (var i = 0; i < project.pages.length; i++) {
            if (project.pages[i].id === pageId) { page = project.pages[i]; break; }
        }
        if (!page || !page.inheritFrom) return false;
        var master = null;
        for (var j = 0; j < project.pages.length; j++) {
            if (project.pages[j].id === page.inheritFrom && project.pages[j].isMaster) { master = project.pages[j]; break; }
        }
        if (!master) return false;

        // Strategy: walk both trees depth-first in parallel by position.
        // For each block in current page tree:
        //   - If block._inherited === false → keep (local override or local addition)
        //   - Else → replace with corresponding block from master (preserve local block ID, set _inherited=true, _originBlockId=master block id)
        // Master blocks beyond child count → append to child's region (with _inherited=true)
        // Child blocks beyond master count → leave as-is (user additions)

        var newTree = P.deepCopy(master.tree);
        P.beriIdBaruRegion(newTree);
        // Walk newTree, mark all blocks as _inherited=true and save _originBlockId
        (function walkMarkInherited(node) {
            if (node.blocks) {
                node.blocks.forEach(function(b) {
                    b._inherited = true;
                    b._originBlockId = b.id;  // save as origin (after beriIdBaruRegion, id is new)
                });
            }
            if (node.children) node.children.forEach(walkMarkInherited);
        })(newTree);

        // Walk current child tree, collect blocks with _inherited === false (overrides + local additions)
        // Match by position path: e.g. "children[0].blocks[2]"
        var childOverrides = {};  // path → block data
        var childAdditions = {};  // regionPath → array of extra blocks (local additions beyond master)
        (function collectOverrides(node, path) {
            if (node.blocks) {
                for (var bi = 0; bi < node.blocks.length; bi++) {
                    var b = node.blocks[bi];
                    if (b._inherited === false) {
                        // Override or local addition
                        var bpath = path + '.blocks[' + bi + ']';
                        childOverrides[bpath] = b;
                    }
                }
            }
            if (node.children) {
                node.children.forEach(function(c, ci) {
                    collectOverrides(c, path + '.children[' + ci + ']');
                });
            }
        })(page.tree, '');

        // Apply overrides ke newTree
        (function applyOverrides(node, path) {
            if (node.blocks) {
                for (var bi = 0; bi < node.blocks.length; bi++) {
                    var bpath = path + '.blocks[' + bi + ']';
                    if (childOverrides[bpath]) {
                        // Replace this block with override (keep override's local id, mark _inherited=false)
                        var override = P.deepCopy(childOverrides[bpath]);
                        override._inherited = false;
                        node.blocks[bi] = override;
                    }
                }
            }
            if (node.children) {
                node.children.forEach(function(c, ci) {
                    applyOverrides(c, path + '.children[' + ci + ']');
                });
            }
        })(newTree, '');

        page.tree = newTree;
        page.customCSS = P.deepCopy(master.customCSS || {});
        return true;
    };

    /* === Unlock block inherited → jadi local override === */
    P.unlockBlockOverride = function(regionId, blockId) {
        var region = P.getById(regionId);
        if (!region || !region.blocks) return false;
        for (var i = 0; i < region.blocks.length; i++) {
            if (region.blocks[i].id === blockId) {
                region.blocks[i]._inherited = false;
                P.save();
                P.renderBlocks();
                P.renderPanel();
                P.flash('Block di-unlock — sekarang bisa diedit (override lokal)');
                return true;
            }
        }
        return false;
    };

    /* === Reset block override → kembali ke versi master === */
    P.resetBlockOverride = function(regionId, blockId) {
        var page = P.getCurrentPage();
        if (!page || !page.inheritFrom) {
            P.flash('Halaman tidak inherit dari master');
            return false;
        }
        var project = P.STATE.projects[P.STATE.currentProjectId];
        var master = null;
        for (var i = 0; i < project.pages.length; i++) {
            if (project.pages[i].id === page.inheritFrom && project.pages[i].isMaster) {
                master = project.pages[i];
                break;
            }
        }
        if (!master) return false;
        // Find block in current tree, get its _originBlockId
        var region = P.getById(regionId);
        if (!region || !region.blocks) return false;
        var block = null;
        for (var j = 0; j < region.blocks.length; j++) {
            if (region.blocks[j].id === blockId) { block = region.blocks[j]; break; }
        }
        if (!block || !block._originBlockId) {
            P.flash('Block tidak punya origin master');
            return false;
        }
        // Find master block by _originBlockId (depth-first walk)
        var masterBlock = null;
        (function walk(node) {
            if (masterBlock) return;
            if (node.blocks) {
                for (var k = 0; k < node.blocks.length; k++) {
                    if (node.blocks[k].id === block._originBlockId) {
                        masterBlock = node.blocks[k];
                        return;
                    }
                }
            }
            if (node.children) node.children.forEach(walk);
        })(master.tree);
        if (!masterBlock) {
            P.flash('Block master tidak ditemukan (mungkin sudah dihapus di master)');
            return false;
        }
        // Replace block content with master's (preserve local id)
        var newBlock = P.deepCopy(masterBlock);
        newBlock.id = block.id;  // keep local id
        newBlock._inherited = true;
        newBlock._originBlockId = masterBlock.id;
        // Replace in region.blocks
        for (var m = 0; m < region.blocks.length; m++) {
            if (region.blocks[m].id === blockId) {
                region.blocks[m] = newBlock;
                break;
            }
        }
        P.save();
        P.renderBlocks();
        P.renderPanel();
        P.flash('Block di-reset ke versi master');
        return true;
    };

    /* === MULTI-PAGE: propagate master ke semua page yang inherit === */
    P.propagateMaster = function(masterPageId) {
        if (!P.STATE.currentProjectId) return false;
        var project = P.STATE.projects[P.STATE.currentProjectId];
        if (!project || !project.pages) return false;
        var needReload = false;
        project.pages.forEach(function(p) {
            if (p.inheritFrom === masterPageId) {
                P.syncMasterToPage(p.id);
                if (p.id === P.STATE.currentPageId) needReload = true;
            }
        });
        if (needReload) {
            P.loadFromProject();
            P.render();
        }
        return true;
    };

    /* === MULTI-PAGE: detach page dari master (break link, keep blocks lokal) === */
    P.detachPageFromMaster = function(pageId) {
        if (!P.STATE.currentProjectId) return false;
        var project = P.STATE.projects[P.STATE.currentProjectId];
        if (!project || !project.pages) return false;
        for (var i = 0; i < project.pages.length; i++) {
            if (project.pages[i].id === pageId) {
                if (!project.pages[i].inheritFrom) { P.flash('Halaman tidak terkait master'); return false; }
                project.pages[i].inheritFrom = null;
                project.modifiedAt = Date.now();
                P.saveProjects();
                P.renderPagePanel();
                P.flash('Halaman dilepas dari master — blocks tetap ada secara lokal');
                return true;
            }
        }
        return false;
    };

    /* === MULTI-PAGE: hapus halaman === */
    P.deletePage = function(pageId) {
        if (!P.STATE.currentProjectId) return false;
        var project = P.STATE.projects[P.STATE.currentProjectId];
        if (!project || !project.pages) return false;
        // Minimal 1 halaman
        if (project.pages.length <= 1) {
            P.flash('Minimal 1 halaman harus ada');
            return false;
        }
        // Hapus
        var idx = -1;
        for (var i = 0; i < project.pages.length; i++) {
            if (project.pages[i].id === pageId) { idx = i; break; }
        }
        if (idx < 0) return false;
        project.pages.splice(idx, 1);
        // Kalau hapus halaman aktif, switch ke halaman pertama
        if (P.STATE.currentPageId === pageId) {
            P.STATE.currentPageId = project.pages[0].id;
            project.currentPageId = project.pages[0].id;
            P.loadFromProject();
            P.render();
        }
        P.saveProjects();
        P.renderPanel();
        if (P.updatePageIndicator) P.updatePageIndicator();
        return true;
    };

    /* === MULTI-PAGE: duplikat halaman === */
    P.duplicatePage = function(pageId) {
        if (!P.STATE.currentProjectId) return null;
        var project = P.STATE.projects[P.STATE.currentProjectId];
        if (!project || !project.pages) return null;
        // Cari halaman source
        var src = null;
        for (var i = 0; i < project.pages.length; i++) {
            if (project.pages[i].id === pageId) { src = project.pages[i]; break; }
        }
        if (!src) return null;
        // Buat duplikat — PLEK KETIPLEK: tree, customCSS, title, isMaster(=false), dll. Tapi ID baru & nama +suffix
        var newPageId = P.genPageId();
        var newPage = {
            id: newPageId,
            name: src.name + ' (salinan)',
            tree: P.deepCopy(src.tree),
            customCSS: P.deepCopy(src.customCSS),
            title: src.title || '',  // copy judul juga
            isMaster: false,  // duplikat TIDAK jadi master (default off, user pilih manual)
            inheritFrom: src.inheritFrom || null  // pertahankan inherit kalau src inherit
        };
        // Beri ID baru ke region di tree duplikat
        P.beriIdBaruRegion(newPage.tree);
        // undo/redo stack TIDAK di-copy (halaman baru mulai dengan stack kosong)
        project.pages.push(newPage);
        P.saveProjects();
        P.renderPanel();
        return newPageId;
    };

    /* === MULTI-PAGE: rename halaman === */
    P.renamePage = function(pageId, namaBaru) {
        if (!P.STATE.currentProjectId) return false;
        var project = P.STATE.projects[P.STATE.currentProjectId];
        if (!project || !project.pages) return false;
        for (var i = 0; i < project.pages.length; i++) {
            if (project.pages[i].id === pageId) {
                project.pages[i].name = namaBaru;
                P.saveProjects();
                P.renderPanel();
                return true;
            }
        }
        return false;
    };

    /* === MULTI-PAGE: dapatkan nama halaman aktif === */
    P.getCurrentPageName = function() {
        var page = P.getCurrentPage();
        return page ? page.name : '';
    };

    P.newProject = function(nama, templateKey) {
        var projectId = P.genProjectId();
        var tree = P.nGrandParent();
        var settings = P.defaultSettings();

        if (templateKey && P.TEMPLATES && P.TEMPLATES[templateKey]) {
            tree = P.deepCopy(P.TEMPLATES[templateKey].tree);
            P.beriIdBaruRegion(tree);
            settings = P.deepCopy(P.TEMPLATES[templateKey].settings || P.defaultSettings());
        }

        var pageId = P.genPageId();
        var project = {
            id: projectId,
            name: nama || 'Proyek tanpa judul',
            pages: [{
                id: pageId,
                name: 'Beranda',
                tree: tree,
                customCSS: {}
            }],
            currentPageId: pageId,
            cssExternal: [],
            settings: settings,
            createdAt: Date.now(),
            modifiedAt: Date.now()
        };
        P.STATE.projects[projectId] = project;
        P.STATE.currentProjectId = projectId;
        P.STATE.currentPageId = pageId;
        P.saveProjects();
        P.loadFromProject();
        P.render();
        return projectId;
    };

    P.openProject = function(projectId) {
        if (!P.STATE.projects[projectId]) return false;
        // Keluar mode edit dulu supaya editMode.regionId tidak stale
        if (typeof P.keluarModeEdit === 'function') P.keluarModeEdit();
        if (P.STATE.currentProjectId) {
            P.syncToProject();
        }
        P.STATE.currentProjectId = projectId;
        // Set currentPageId dari project
        var project = P.STATE.projects[projectId];
        P.STATE.currentPageId = project.currentPageId || (project.pages && project.pages.length > 0 ? project.pages[0].id : null);
        P.saveProjects();
        P.loadFromProject();
        P.render();
        return true;
    };

    P.deleteProject = function(projectId) {
        if (!P.STATE.projects[projectId]) return false;
        delete P.STATE.projects[projectId];
        if (P.STATE.currentProjectId === projectId) {
            P.STATE.currentProjectId = null;
            P.STATE.tree = null;
            P.STATE.customCSS = {};
        }
        // Pakai storage adapter untuk hapus dari server/localStorage
        if (typeof P.storageDelete === 'function') {
            P.storageDelete(projectId);
        } else {
            P.saveProjects();
        }
        return true;
    };

    P.saveProject = function() {
        if (!P.STATE.currentProjectId) {
            P.flash('Tidak ada proyek aktif');
            return;
        }
        P.syncToProject();
        P.saveProjects();
        P.flash('Proyek tersimpan');
    };

    P.saveAsProject = function(namaBaru) {
        if (!P.STATE.currentProjectId) return null;
        P.syncToProject();
        var src = P.STATE.projects[P.STATE.currentProjectId];
        var projectId = P.genProjectId();
        // Duplikat semua halaman
        var newPages = src.pages.map(function(page) {
            var newPageId = P.genPageId();
            var newPage = {
                id: newPageId,
                name: page.name,
                tree: P.deepCopy(page.tree),
                customCSS: P.deepCopy(page.customCSS)
            };
            P.beriIdBaruRegion(newPage.tree);
            return newPage;
        });
        var project = {
            id: projectId,
            name: namaBaru || (src.name + ' (salinan)'),
            pages: newPages,
            currentPageId: newPages[0].id,
            cssExternal: P.deepCopy(src.cssExternal || []),
            settings: P.deepCopy(src.settings),
            createdAt: Date.now(),
            modifiedAt: Date.now()
        };
        P.STATE.projects[projectId] = project;
        P.STATE.currentProjectId = projectId;
        P.STATE.currentPageId = newPages[0].id;
        P.saveProjects();
        P.loadFromProject();
        return projectId;
    };

    P.getProjectSettings = function() {
        if (!P.STATE.currentProjectId) return P.defaultSettings();
        var project = P.STATE.projects[P.STATE.currentProjectId];
        if (!project) return P.defaultSettings();
        return project.settings || P.defaultSettings();
    };

    P.updateProjectSettings = function(newSettings) {
        if (!P.STATE.currentProjectId) return;
        var project = P.STATE.projects[P.STATE.currentProjectId];
        if (!project) return;
        project.settings = newSettings;
        project.modifiedAt = Date.now();
        P.saveProjects();
    };

    P.listProjects = function() {
        var list = [];
        Object.keys(P.STATE.projects).forEach(function (id) {
            var p = P.STATE.projects[id];
            // Migrate kalau belum multi-page
            if (!p.pages) P.migrateProjectToPages(p);
            list.push({
                id: p.id,
                name: p.name,
                createdAt: p.createdAt,
                modifiedAt: p.modifiedAt,
                regionCount: p.pages && p.pages[0] ? P.countRegions(p.pages[0].tree) : 0,
                pageCount: p.pages ? p.pages.length : 0
            });
        });
        list.sort(function (a, b) {
            return (b.modifiedAt || 0) - (a.modifiedAt || 0);
        });
        return list;
    };

    P.applyTemplate = function(templateKey) {
        // Default behavior: apply ke halaman aktif (backward compat)
        return P.applyTemplateToCurrentPage(templateKey);
    };

    /* === Apply template ke halaman aktif saja === */
    P.applyTemplateToCurrentPage = function(templateKey) {
        if (!P.TEMPLATES || !P.TEMPLATES[templateKey]) return false;
        var template = P.TEMPLATES[templateKey];
        if (typeof P.keluarModeEdit === 'function') P.keluarModeEdit();
        P.pushUndo();
        P.STATE.tree = P.deepCopy(template.tree);
        P.beriIdBaruRegion(P.STATE.tree);
        P.STATE.customCSS = {};
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
        return true;
    };

    /* === Apply template → buat proyek baru dengan semua halaman dari template === */
    P.applyTemplateAsNewProject = function(templateKey, projectName) {
        if (!P.TEMPLATES || !P.TEMPLATES[templateKey]) return null;
        var template = P.TEMPLATES[templateKey];
        if (typeof P.keluarModeEdit === 'function') P.keluarModeEdit();
        // Buat project baru
        var projectId = P.genProjectId();
        var pageId = P.genPageId();
        // Template bisa punya pages array (multi-page) atau single tree (legacy)
        var pages = [];
        if (template.pages && template.pages.length > 0) {
            // Multi-page template
            template.pages.forEach(function (tplPage, i) {
                var pId = P.genPageId();
                var newPage = {
                    id: pId,
                    name: tplPage.name || ('Halaman ' + (i + 1)),
                    tree: P.deepCopy(tplPage.tree),
                    customCSS: P.deepCopy(tplPage.customCSS || {})
                };
                P.beriIdBaruRegion(newPage.tree);
                pages.push(newPage);
            });
        } else {
            // Single-tree template (legacy)
            var newPage = {
                id: pageId,
                name: 'Beranda',
                tree: P.deepCopy(template.tree),
                customCSS: {}
            };
            P.beriIdBaruRegion(newPage.tree);
            pages.push(newPage);
        }
        var settings = P.defaultSettings();
        if (template.settings) {
            settings = P.deepCopy(template.settings);
        }
        var project = {
            id: projectId,
            name: projectName || (template.nama || 'Proyek dari Template'),
            pages: pages,
            currentPageId: pages[0].id,
            cssExternal: [],
            settings: settings,
            createdAt: Date.now(),
            modifiedAt: Date.now()
        };
        P.STATE.projects[projectId] = project;
        P.STATE.currentProjectId = projectId;
        P.STATE.currentPageId = pages[0].id;
        P.saveProjects();
        P.loadFromProject();
        if (P.applySettingsKeEditor) P.applySettingsKeEditor();
        P.render();
        if (P.updatePageIndicator) P.updatePageIndicator();
        return projectId;
    };

    /* === Apply template → buat DOKUMEN baru (single page, no multi-page wrapper) === */
    P.applyTemplateAsNewDocument = function(templateKey, documentName) {
        if (!P.TEMPLATES || !P.TEMPLATES[templateKey]) return null;
        var template = P.TEMPLATES[templateKey];
        if (typeof P.keluarModeEdit === 'function') P.keluarModeEdit();
        var projectId = P.genProjectId();
        var pageId = P.genPageId();
        // Pakai tree dari template (atau pages[0] kalau multi-page template)
        var tplTree;
        var tplCustomCSS = {};
        if (template.pages && template.pages.length > 0) {
            tplTree = template.pages[0].tree;
            tplCustomCSS = template.pages[0].customCSS || {};
        } else {
            tplTree = template.tree;
        }
        var newPage = {
            id: pageId,
            name: 'Beranda',
            tree: P.deepCopy(tplTree),
            customCSS: P.deepCopy(tplCustomCSS)
        };
        P.beriIdBaruRegion(newPage.tree);
        var settings = P.defaultSettings();
        if (template.settings) {
            settings = P.deepCopy(template.settings);
        }
        var project = {
            id: projectId,
            name: documentName || (template.nama || 'Dokumen dari Template'),
            pages: [newPage],
            currentPageId: pageId,
            cssExternal: [],
            settings: settings,
            createdAt: Date.now(),
            modifiedAt: Date.now()
        };
        P.STATE.projects[projectId] = project;
        P.STATE.currentProjectId = projectId;
        P.STATE.currentPageId = pageId;
        P.saveProjects();
        P.loadFromProject();
        if (P.applySettingsKeEditor) P.applySettingsKeEditor();
        P.render();
        if (P.updatePageIndicator) P.updatePageIndicator();
        return projectId;
    };

    /* === Apply template → buat PROYEK baru dengan N halaman (template di-apply ke tiap halaman) === */
    P.applyTemplateAsNewProjectMultiPage = function(templateKey, projectName, pageCount) {
        if (!P.TEMPLATES || !P.TEMPLATES[templateKey]) return null;
        var template = P.TEMPLATES[templateKey];
        if (typeof P.keluarModeEdit === 'function') P.keluarModeEdit();
        var projectId = P.genProjectId();
        // Buat pageCount halaman, masing-masing apply template
        // Kalau template multi-page, pakai pages[0] (atau cycling kalau pageCount > tpl.pages.length)
        var pages = [];
        var tplPages = (template.pages && template.pages.length > 0) ? template.pages : [{ tree: template.tree, customCSS: {} }];
        for (var i = 0; i < pageCount; i++) {
            var tplPage = tplPages[i % tplPages.length];
            var pId = P.genPageId();
            var pageName;
            if (pageCount === 1) {
                pageName = 'Beranda';
            } else if (i === 0) {
                pageName = 'Beranda';
            } else {
                pageName = 'Halaman ' + (i + 1);
            }
            var newPage = {
                id: pId,
                name: pageName,
                tree: P.deepCopy(tplPage.tree),
                customCSS: P.deepCopy(tplPage.customCSS || {})
            };
            P.beriIdBaruRegion(newPage.tree);
            pages.push(newPage);
        }
        var settings = P.defaultSettings();
        if (template.settings) {
            settings = P.deepCopy(template.settings);
        }
        var project = {
            id: projectId,
            name: projectName || (template.nama || 'Proyek dari Template'),
            pages: pages,
            currentPageId: pages[0].id,
            cssExternal: [],
            settings: settings,
            createdAt: Date.now(),
            modifiedAt: Date.now()
        };
        P.STATE.projects[projectId] = project;
        P.STATE.currentProjectId = projectId;
        P.STATE.currentPageId = pages[0].id;
        P.saveProjects();
        P.loadFromProject();
        if (P.applySettingsKeEditor) P.applySettingsKeEditor();
        P.render();
        if (P.updatePageIndicator) P.updatePageIndicator();
        return projectId;
    };

    P.beriIdBaruRegion = function(node) {
        node.id = P.genId();
        if (node.blocks) {
            node.blocks.forEach(function (block) {
                block.id = P.genBlockId();
            });
        }
        if (node.children) {
            node.children.forEach(function (c) {
                P.beriIdBaruRegion(c);
            });
        }
    };

    P.migrateLegacy = function() {
        try {
            var legacyTree = localStorage.getItem(P.STATE.legacyTreeKey);
            var legacyCSS = localStorage.getItem(P.STATE.legacyCustomCSSKey);
            if (legacyTree && Object.keys(P.STATE.projects).length === 0) {
                var projectId = P.genProjectId();
                var pageId = P.genPageId();
                P.STATE.projects[projectId] = {
                    id: projectId,
                    name: 'Proyek lama',
                    pages: [{
                        id: pageId,
                        name: 'Beranda',
                        tree: JSON.parse(legacyTree),
                        customCSS: legacyCSS ? JSON.parse(legacyCSS) : {}
                    }],
                    currentPageId: pageId,
                    cssExternal: [],
                    settings: P.defaultSettings(),
                    createdAt: Date.now(),
                    modifiedAt: Date.now()
                };
                P.STATE.currentProjectId = projectId;
                P.STATE.currentPageId = pageId;
                P.saveProjects();
                localStorage.removeItem(P.STATE.legacyTreeKey);
                localStorage.removeItem(P.STATE.legacyCustomCSSKey);
            }
        } catch (e) {}
    };

    // Dapatkan nama project aktif
    P.getProjectName = function() {
        if (!P.STATE.currentProjectId) return '';
        var project = P.STATE.projects[P.STATE.currentProjectId];
        return project ? project.name : '';
    };

    // Counter untuk auto-generate nama region/block (reset per export)
    P._exportCounter = { region: 0, block: 0 };

    // Sanitize nama → hanya alphanumeric + dash + underscore
    P.sanitizeNama = function(nama) {
        if (!nama) return '';
        var s = String(nama).trim().toLowerCase();
        s = s.replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        return s;
    };

    // Auto-generate nama readable untuk region
    P.autoNamaRegion = function(node, indent) {
        P._exportCounter.region++;
        // Basakan dari tag + counter, mis. "section-1", "div-2", "main-1"
        return node.tag + '-' + P._exportCounter.region;
    };

    // Auto-generate nama readable untuk block
    P.autoNamaBlock = function(block) {
        P._exportCounter.block++;
        return (block.tag || 'block') + '-' + P._exportCounter.block;
    };

    // Dapatkan nama region untuk export (user-set atau auto)
    P.getNamaRegion = function(node) {
        if (node.nama && node.nama.trim()) return P.sanitizeNama(node.nama);
        return P.autoNamaRegion(node);
    };

    // Dapatkan nama block untuk export (user-set atau auto)
    P.getNamaBlock = function(block) {
        if (block.nama && block.nama.trim()) return P.sanitizeNama(block.nama);
        return P.autoNamaBlock(block);
    };

    // Daftar tag yang sejenis untuk kontainer (section-like)
    P.TAG_CONTAINER = ['section', 'article', 'aside', 'header', 'footer', 'nav', 'main', 'div'];
    // Daftar tag yang sejenis untuk text-level (div-like)
    P.TAG_DIV_LIKE = ['div', 'span', 'figure', 'figcaption', 'details', 'summary'];

    P.serializeNode = function(node, indent) {
        var pad = '';
        for (var i = 0; i < indent; i++) pad += '    ';

        // Tag: pakai node.tag (bisa diubah user via panel region)
        var tag = node.tag || 'div';

        // Class: gabung kelas tema + kelas kustom (kalau ada)
        var allClasses = node.classes.slice();
        var regionCSS = P.STATE.customCSS[node.id];
        if (regionCSS && regionCSS.className) {
            allClasses.push(regionCSS.className);
        }
        var cls = allClasses.join(' ');

        // ID: pakai nama region kalau ada aksi/anchor, atau kalau user set nama eksplisit
        var idAttr = '';
        var namaRegion = P.getNamaRegion(node);
        if (node.nama && node.nama.trim()) {
            // User set nama → output sebagai id
            idAttr = ' id="' + P.sanitizeNama(node.nama) + '"';
        }

        // HTML comment untuk nama region (jika ada nama user-set)
        var comment = '';
        if (node.nama && node.nama.trim()) {
            comment = pad + '<!-- ' + node.nama.trim() + ' -->\n';
        }

        // Build opening tag
        var open = comment + pad + '<' + tag + ' class="' + cls + '"' + idAttr + '>\n';
        var close = pad + '</' + tag + '>\n';
        var body = '';
        if (node.children.length === 0) {
            // Jika ada blocks (dari block editor), serialize blocks
            if (node.blocks && node.blocks.length > 0) {
                var innerPad = pad + '    ';
                node.blocks.forEach(function (block) {
                    var be = '<' + block.tag;

                    // Class: kelas tema + kelas kustom block (jika ada style override)
                    var blockClasses = [];
                    if (block.kelas) {
                        var kelasTokens = block.kelas.split(/\s+/);
                        for (var kt = 0; kt < kelasTokens.length; kt++) {
                            if (kelasTokens[kt]) blockClasses.push(kelasTokens[kt]);
                        }
                    }
                    // Tambah class kustom untuk block style (mis. "block-3" atau block.nama)
                    var blockStyleClass = P.getBlockStyleClass(block);
                    if (blockStyleClass) blockClasses.push(blockStyleClass);
                    // Tambah class kustom untuk cssKustom mentah
                    if (block.cssKustom && block.cssKustom.trim()) {
                        var cssKustomClass = P.getBlockCssKustomClass(block);
                        if (cssKustomClass) blockClasses.push(cssKustomClass);
                    }
                    // v137: Tambah block.classes (untuk gradient class dll)
                    if (block.classes && block.classes.length > 0) {
                        for (var bcIdx = 0; bcIdx < block.classes.length; bcIdx++) {
                            if (blockClasses.indexOf(block.classes[bcIdx]) < 0) {
                                blockClasses.push(block.classes[bcIdx]);
                            }
                        }
                    }

                    if (blockClasses.length > 0) {
                        be += ' class="' + blockClasses.join(' ') + '"';
                    }

                    // ID: pakai nama block kalau user set
                    if (block.nama && block.nama.trim()) {
                        be += ' id="' + P.sanitizeNama(block.nama) + '"';
                    }

                    // Tidak ada inline style — semua style via CSS class

                    // Tambah atribut HTML dari block.properti (kecuali reserved)
                    if (block.properti) {
                        var reservedProps = ['label', 'placeholder', 'nama', 'tipe',
                            'jenisInput', 'required', 'checked', 'nilai',
                            'min', 'max', 'step', 'baris', 'kolom'];
                        for (var pk in block.properti) {
                            if (block.properti.hasOwnProperty(pk) &&
                                reservedProps.indexOf(pk) < 0) {
                                be += ' ' + pk + '="' + block.properti[pk] + '"';
                            }
                        }
                    }
                    // Tambah aksi (onclick / data-aksi)
                    var aksiStr = P.serialBlockAksi(block);
                    if (aksiStr) be += aksiStr;

                    // HTML comment untuk nama block (jika user set)
                    var blockComment = '';
                    if (block.nama && block.nama.trim()) {
                        blockComment = innerPad + '<!-- ' + block.nama.trim() + ' -->\n';
                    }

                    // Tag self-closing (hr, img, input)
                    if (block.tag === 'hr' || block.tag === 'img' || block.tag === 'input') {
                        body += blockComment + innerPad + be + '>\n';
                    } else {
                        // Gunakan renderIsiBlock untuk dapat HTML items yang benar
                        var isiHTML = P.renderIsiBlock(block);
                        if (isiHTML) {
                            body += blockComment + innerPad + be + '>' + isiHTML + '</' + block.tag + '>\n';
                        } else if (block.isi) {
                            body += blockComment + innerPad + be + '>' + block.isi + '</' + block.tag + '>\n';
                        } else {
                            body += blockComment + innerPad + be + '></' + block.tag + '>\n';
                        }
                    }
                });
            } else if (node.content && node.content.trim()) {
                // Konten lama (compatibility)
                var innerPad2 = pad + '    ';
                var tempDiv = document.createElement('div');
                tempDiv.innerHTML = node.content;
                body = innerPad2 + tempDiv.innerHTML.trim() + '\n';
            } else {
                body = pad + '    <!-- kosong -->\n';
            }
        } else {
            node.children.forEach(function (c) {
                body += P.serializeNode(c, indent + 1);
            });
        }
        return open + body + close;
    }

    // Dapatkan class CSS untuk block style (user override via panel)
    // Format: "block-N" atau "block-nama" kalau user set nama
    P.getBlockStyleClass = function(block) {
        if (!block.style && !block.cssKustom) return '';
        if (block.nama && block.nama.trim()) {
            return 'block-' + P.sanitizeNama(block.nama);
        }
        // Auto-generate class berdasarkan block ID
        var shortId = (block.id || '').replace(/^b(\d+)_.*/, 'b$1');
        return 'block-' + shortId;
    };

    // Dapatkan class CSS untuk cssKustom mentah
    P.getBlockCssKustomClass = function(block) {
        if (!block.cssKustom || !block.cssKustom.trim()) return '';
        if (block.nama && block.nama.trim()) {
            return 'kustom-' + P.sanitizeNama(block.nama);
        }
        var shortId = (block.id || '').replace(/^b(\d+)_.*/, 'b$1');
        return 'kustom-' + shortId;
    };

    // Generate CSS string dari customCSS (untuk export)
    P.generateCustomCSS = function() {
        var lines = [
            '/* ==========================================================================',
            '   pondasi-custom.css — Kelas kustom yang dibuat user via editor pondasi',
            '   ========================================================================== */',
            ''
        ];
        Object.keys(P.STATE.customCSS).forEach(function (rid) {
            var css = P.STATE.customCSS[rid];
            if (!css || !css.className) return;
            var cls = css.className;
            var rules = css.rules || {};

            // v134: Skip gradient entries di sini (di-handle terpisah di bawah)
            if (css.isGradient) return;

            var node = P.getById(rid);
            // Tentukan selector: tag.region.classes.kelas_kustom
            // Mis. div.kolom-4.kustom-r3 — hanya region spesifik ini yang kena rule.
            var selector;
            if (node) {
                selector = node.tag + '.' + node.classes.join('.') + '.' + cls;
            } else {
                selector = '.' + cls;
            }
            // Bangun rule CSS (Normal)
            var ruleLines = [];
            Object.keys(rules).forEach(function (prop) {
                var val = rules[prop];
                if (val) {
                    // CamelCase → kebab-case
                    var cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
                    ruleLines.push('    ' + cssProp + ': ' + val + ';');
                }
            });
            if (ruleLines.length > 0) {
                lines.push(selector + ' {');
                lines = lines.concat(ruleLines);
                lines.push('}');
                lines.push('');
            }
            // Pseudo-class rules (kalau ada — region yang punya :hover/:focus dll)
            if (css.pseudo) {
                Object.keys(css.pseudo).forEach(function (pseudoKey) {
                    var pseudoRules = css.pseudo[pseudoKey] || {};
                    var pseudoLines = [];
                    Object.keys(pseudoRules).forEach(function (prop) {
                        var val = pseudoRules[prop];
                        if (val) {
                            var cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
                            pseudoLines.push('    ' + cssProp + ': ' + val + ';');
                        }
                    });
                    if (pseudoLines.length > 0) {
                        lines.push(selector + pseudoKey + ' {');
                        lines = lines.concat(pseudoLines);
                        lines.push('}');
                        lines.push('');
                    }
                });
            }
        });

        // === v134: GRADIENT RULES ===
        // Generate CSS rules untuk gradient classes (.gard-*)
        var hasGradient = false;
        Object.keys(P.STATE.customCSS).forEach(function (rid) {
            var css = P.STATE.customCSS[rid];
            if (!css || !css.isGradient) return;
            if (!hasGradient) {
                lines.push('/* === Gradient classes === */');
                hasGradient = true;
            }
            var cls = css.className;
            var rules = css.rules || {};
            lines.push('.' + cls + ' {');
            Object.keys(rules).forEach(function (prop) {
                var val = rules[prop];
                if (val) {
                    lines.push('    ' + prop + ': ' + val + ';');
                }
            });
            lines.push('}');
            lines.push('');
        });

        // === BLOCK STYLE RULES ===
        // Generate CSS rules untuk block.style (user override via panel komponen)
        // Selector: tag.kelas-tema.block-nama { ... } atau tag.kelas-tema.block-bN { ... }
        var tree = P.STATE.tree;
        if (tree) {
            (function walkBlocks(node) {
                if (node.blocks && node.blocks.length > 0) {
                    node.blocks.forEach(function (block) {
                        var hasStyle = block.style && Object.keys(block.style).length > 0;
                        var hasCssKustom = block.cssKustom && block.cssKustom.trim();
                        if (!hasStyle && !hasCssKustom) return;

                        var styleClass = P.getBlockStyleClass(block);
                        var cssKustomClass = P.getBlockCssKustomClass(block);

                        // Selector: tag.kelas-tema.block-nama
                        var selectorParts = [block.tag];
                        if (block.kelas) {
                            var tokens = block.kelas.split(/\s+/);
                            for (var t = 0; t < tokens.length; t++) {
                                if (tokens[t]) selectorParts.push('.' + tokens[t]);
                            }
                        }
                        if (styleClass) selectorParts.push('.' + styleClass);
                        var selector = selectorParts.join('');

                        var ruleLines = [];

                        // 1. block.style (properti individual)
                        if (hasStyle) {
                            for (var prop in block.style) {
                                if (block.style.hasOwnProperty(prop) && block.style[prop]) {
                                    var cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
                                    ruleLines.push('    ' + cssProp + ': ' + block.style[prop] + ';');
                                }
                            }
                        }

                        // 2. block.cssKustom (CSS mentah dari textarea)
                        if (hasCssKustom) {
                            var raw = block.cssKustom.trim();
                            // Parse mentah — split per baris, ambil prop: val
                            var rawLines = raw.split('\n');
                            for (var ri = 0; ri < rawLines.length; ri++) {
                                var line = rawLines[ri].trim();
                                if (!line) continue;
                                // Hapus trailing ; kalau ada
                                if (line.charAt(line.length - 1) === ';') {
                                    line = line.substring(0, line.length - 1);
                                }
                                ruleLines.push('    ' + line + ';');
                            }
                        }

                        if (ruleLines.length > 0) {
                            lines.push(selector + ' {');
                            lines = lines.concat(ruleLines);
                            lines.push('}');
                            lines.push('');
                        }
                    });
                }
                if (node.children && node.children.length > 0) {
                    node.children.forEach(walkBlocks);
                }
            })(tree);
        }

        if (lines.length <= 3) {
            // Tidak ada rule
            return '/* Belum ada kelas kustom */\n';
        }
        return lines.join('\n');
    }

    P.downloadFile = function(filename, content, mime) {
        var blob = new Blob([content], { type: mime });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    /* ======================================================================
       HELP MODAL
       ====================================================================== */
    P.showHelp = function() {
        var m = document.getElementById('help-modal');
        if (m) m.hidden = false;
    }
    P.hideHelp = function() {
        var m = document.getElementById('help-modal');
        if (m) m.hidden = true;
    }

    /* ======================================================================
       FLASH MESSAGE — pakai snackbar dari tampilan.css
       ====================================================================== */
    P.flashTimer = null;
    P.flash = function(msg) {
        // Cari atau buat snackbar element
        var sb = document.getElementById('pondasi-snackbar');
        if (!sb) {
            sb = document.createElement('div');
            sb.id = 'pondasi-snackbar';
            sb.className = 'snackbar';
            document.body.appendChild(sb);
        }
        sb.textContent = msg;
        sb.classList.add('snackbar-tampil');
        sb.style.bottom = '2.5rem';  // naikkan supaya tidak tabrakan dengan statusline
        // Auto-hide setelah 2.5 detik
        if (P.flashTimer) clearTimeout(P.flashTimer);
        P.flashTimer = setTimeout(function () {
            sb.classList.remove('snackbar-tampil');
        }, 2500);
    }


/* === v132: Cleanup — hapus warna default yang terlanjur masuk ke custom colors === */
P.cleanupCustomColors = function() {
    var paletteHexes = ['FF8080','FF3232','B30000','FFA080','FF6432','C83200','FFE180','FFC832','C89600','B4E664','80C832','4B9600','78C8F0','32A5E1','0073B4','B482F0','823CDC','500AAA','DCB4E6','B978C8','874696','FFFFFF','E1E6EB','A0AAB4','5A646E','3C4650','1E2832','0A141E'];
    var colors = P.getCustomColors();
    var cleaned = colors.filter(function(hex) {
        // v138: Keep gradient entries (#GRAD:*)
        if (hex.indexOf('#GRAD:') === 0) return true;
        var hexNoHash = hex.replace('#', '').toUpperCase();
        return paletteHexes.indexOf(hexNoHash) < 0;
    });
    if (cleaned.length !== colors.length) {
        try {
            localStorage.setItem('pondasi.customColors', JSON.stringify(cleaned));
        } catch (e) {}
        return colors.length - cleaned.length;
    }
    return 0;
};
