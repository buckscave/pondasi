/* PONDASI-STATE.JS */
var P = P || {};

    /* ======================================================================
       STATE GLOBAL
       ====================================================================== */
    P.STATE = {
        // Multi-project management
        currentProjectId: null,    // id project aktif (null = belum ada project)
        projects: {},              // {projectId: {id, name, tree, customCSS, settings, ...}}

        // Editor state (per-session)
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
    }

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
        project.tree = P.deepCopy(P.STATE.tree);
        project.customCSS = P.deepCopy(P.STATE.customCSS);
        project.modifiedAt = Date.now();
    };

    P.loadFromProject = function() {
        if (!P.STATE.currentProjectId) return false;
        var project = P.STATE.projects[P.STATE.currentProjectId];
        if (!project) return false;
        P.STATE.tree = P.deepCopy(project.tree);
        P.STATE.customCSS = P.deepCopy(project.customCSS || {});
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
        P.STATE.undoStack = [];
        P.STATE.redoStack = [];
        return true;
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

        var project = {
            id: projectId,
            name: nama || 'Proyek tanpa judul',
            tree: tree,
            customCSS: {},
            cssExternal: [],  // [{ url, status, error, classes, categories, errors }]
            settings: settings,
            createdAt: Date.now(),
            modifiedAt: Date.now()
        };
        P.STATE.projects[projectId] = project;
        P.STATE.currentProjectId = projectId;
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
        var project = {
            id: projectId,
            name: namaBaru || (src.name + ' (salinan)'),
            tree: P.deepCopy(src.tree),
            customCSS: P.deepCopy(src.customCSS),
            cssExternal: P.deepCopy(src.cssExternal || []),
            settings: P.deepCopy(src.settings),
            createdAt: Date.now(),
            modifiedAt: Date.now()
        };
        P.STATE.projects[projectId] = project;
        P.STATE.currentProjectId = projectId;
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
            list.push({
                id: p.id,
                name: p.name,
                createdAt: p.createdAt,
                modifiedAt: p.modifiedAt,
                regionCount: P.countRegions(p.tree)
            });
        });
        list.sort(function (a, b) {
            return (b.modifiedAt || 0) - (a.modifiedAt || 0);
        });
        return list;
    };

    P.applyTemplate = function(templateKey) {
        if (!P.TEMPLATES || !P.TEMPLATES[templateKey]) return false;
        var template = P.TEMPLATES[templateKey];
        // Keluar mode edit dulu supaya editMode.regionId tidak stale
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
                P.STATE.projects[projectId] = {
                    id: projectId,
                    name: 'Proyek lama',
                    tree: JSON.parse(legacyTree),
                    customCSS: legacyCSS ? JSON.parse(legacyCSS) : {},
                    cssExternal: [],
                    settings: P.defaultSettings(),
                    createdAt: Date.now(),
                    modifiedAt: Date.now()
                };
                P.STATE.currentProjectId = projectId;
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

