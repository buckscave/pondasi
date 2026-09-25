/* PONDASI-PROJECT.JS
   UI untuk manajemen proyek: Panel Dokumen, Template, Save As, Export, Settings.
   Semua pakai sidebar panel (push content), bukan modal.
*/
var P = P || {};

/* ======================================================================
   SIDEBAR PANEL MANAGEMENT (hanya 1 sidebar aktif dalam satu waktu)
   ====================================================================== */
P.sidebarAktif = null;  // id panel yang sedang aktif

P.bukaSidebar = function(panelId, btnId) {
    // Tutup sidebar lain dulu
    P.tutupSidebarKiri();
    // Buka sidebar baru
    var panel = document.getElementById(panelId);
    if (!panel) return;
    panel.classList.add('pondasi-sidebar-aktif');
    // Hapus hidden attribute (kalau ada) supaya tampil, dan tandai aria-hidden=false
    panel.removeAttribute('hidden');
    panel.setAttribute('aria-hidden', 'false');
    document.body.classList.add('pondasi-sidebar-kiri-aktif');
    P.sidebarAktif = panelId;
    // Highlight tombol yang aktif
    if (btnId) {
        var btn = document.getElementById(btnId);
        if (btn) btn.classList.add('pondasi-floating-btn-aktif');
    }
};

P.tutupSidebarKiri = function() {
    // Tutup semua sidebar kiri
    var sidebars = document.querySelectorAll('.pondasi-sidebar-kiri');
    for (var i = 0; i < sidebars.length; i++) {
        sidebars[i].classList.remove('pondasi-sidebar-aktif');
        sidebars[i].setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('pondasi-sidebar-kiri-aktif');
    // Hapus highlight dari semua tombol floating kiri
    var btns = document.querySelectorAll('.pondasi-floating-kiri .pondasi-floating-btn-aktif');
    for (var j = 0; j < btns.length; j++) {
        btns[j].classList.remove('pondasi-floating-btn-aktif');
    }
    P.sidebarAktif = null;
};

P.toggleSidebar = function(panelId, btnId, renderFn) {
    if (P.sidebarAktif === panelId) {
        // Sudah aktif → tutup
        P.tutupSidebarKiri();
    } else {
        // Buka
        if (renderFn) renderFn();
        P.bukaSidebar(panelId, btnId);
    }
};

/* ======================================================================
   PANEL DOKUMEN
   ====================================================================== */
P.tampilkanDokumenPanel = function() {
    P.toggleSidebar('dokumen-panel', 'btn-dokumen', function () {
        P.renderRecentDokumen();
        // Akordion: saat satu buka, disable yang lain
        var akordionDokumen = document.getElementById('akordion-buat-dokumen');
        var akordionProyek = document.getElementById('akordion-buat-proyek');
        if (akordionDokumen) {
            akordionDokumen.addEventListener('toggle', function () {
                if (akordionDokumen.open && akordionProyek) {
                    akordionProyek.removeAttribute('open');
                }
            });
        }
        if (akordionProyek) {
            akordionProyek.addEventListener('toggle', function () {
                if (akordionProyek.open && akordionDokumen) {
                    akordionDokumen.removeAttribute('open');
                }
            });
        }
    });
};

P.renderRecentDokumen = function() {
    // Render list halaman dulu
    P.renderPageList();
    // Render list dokumen
    var list = document.getElementById('dokumen-recent-list');
    if (!list) return;
    while (list.firstChild) list.removeChild(list.firstChild);
    var projects = P.listProjects();
    if (projects.length === 0) {
        list.appendChild(P.el('div', { class: 'pondasi-sidebar-list-empty', text: 'Belum ada dokumen.' }));
        return;
    }
    projects.forEach(function (p) {
        var item = P.el('div', { class: 'pondasi-sidebar-list-item' });
        if (p.id === P.STATE.currentProjectId) item.className += ' pondasi-sidebar-list-item-aktif';
        var nama = P.el('div', { class: 'pondasi-sidebar-list-nama', text: p.name });
        var info = P.el('div', { class: 'pondasi-sidebar-list-info',
            text: P.formatTanggal(p.modifiedAt) + ' · ' + (p.pageCount || 1) + ' halaman · ' + p.regionCount + ' region' });
        var btnHapus = P.el('button', { class: 'pondasi-sidebar-list-hapus', title: 'Hapus',
            html: P.icon('trash') });
        var infoWrap = P.el('div', { class: 'pondasi-sidebar-list-info-wrap' });
        infoWrap.appendChild(nama);
        infoWrap.appendChild(info);
        infoWrap.addEventListener('click', function () {
            P.openProject(p.id);
            P.tutupSidebarKiri();
        });
        btnHapus.addEventListener('click', function (e) {
            e.stopPropagation();
            P.konfirmasi('Hapus dokumen "' + p.name + '"? Tidak bisa dibatalkan.', function (ok) {
                if (ok) {
                    var wasCurrent = (p.id === P.STATE.currentProjectId);
                    P.deleteProject(p.id);
                    P.renderRecentDokumen();
                    // Kalau dokumen aktif yang dihapus, auto-create baru supaya canvas tidak kosong
                    if (wasCurrent) {
                        if (typeof P.keluarModeEdit === 'function') P.keluarModeEdit();
                        P.newProject('Proyek tanpa judul');
                    }
                }
            }, 'Hapus Dokumen', 'Hapus', 'Batal');
        });
        item.appendChild(infoWrap);
        item.appendChild(btnHapus);
        list.appendChild(item);
    });
};

P.renderPageList = function() {
    // Halaman tidak lagi di-render di sidebar (dipindah ke footer popover)
    // Fungsi ini tetap dipertahankan sebagai no-op agar panggilan lama tidak error
    // Page panel di-render terpisah via P.renderPagePanel()
    if (P.renderPagePanel) P.renderPagePanel();
};

/* === Render page panel popover (thumbnails) === */
P.renderPagePanel = function() {
    var grid = document.getElementById('page-panel-grid');
    if (!grid) return;
    while (grid.firstChild) grid.removeChild(grid.firstChild);
    if (!P.STATE.currentProjectId) return;
    var pages = P.listPages();
    if (pages.length === 0) {
        grid.appendChild(P.el('div', { class: 'pondasi-page-panel-empty', text: 'Belum ada halaman. Klik + di footer untuk tambah.' }));
        return;
    }
    // Dapatkan master pages untuk dropdown inherit
    var masterPages = P.listMasterPages();

    pages.forEach(function (pg, idx) {
        var thumb = P.el('div', { class: 'pondasi-page-thumb' });
        if (pg.isActive) thumb.className += ' pondasi-page-thumb-aktif';
        thumb.dataset.pageId = pg.id;
        thumb.dataset.pageIdx = idx;
        thumb.setAttribute('draggable', 'true');
        thumb.title = pg.name + ' — ' + pg.regionCount + ' region';

        // Preview area — render mini tree
        var preview = P.el('div', { class: 'pondasi-page-thumb-preview' });
        var page = (function () {
            var project = P.STATE.projects[P.STATE.currentProjectId];
            if (!project) return null;
            for (var i = 0; i < project.pages.length; i++) {
                if (project.pages[i].id === pg.id) return project.pages[i];
            }
            return null;
        })();
        if (page && page.tree && P.serializeNode) {
            var inner = P.el('div', { class: 'pondasi-page-thumb-preview-inner' });
            try {
                inner.innerHTML = P.serializeNode(page.tree, 0);
            } catch (e) {
                inner.innerHTML = '<div style="color:#999;font-size:11px;padding:8px;">(preview error)</div>';
            }
            preview.appendChild(inner);
        } else {
            preview.appendChild(P.el('div', { class: 'pondasi-page-thumb-preview-empty', text: 'kosong' }));
        }

        // Master badge (jika isMaster)
        if (page && page.isMaster) {
            var masterBadge = P.el('div', { class: 'pondasi-page-thumb-master-badge', text: 'MASTER' });
            thumb.appendChild(masterBadge);
        }

        // Inherit indicator (jika inheritFrom)
        if (page && page.inheritFrom) {
            var inheritInfo = (function() {
                for (var i = 0; i < masterPages.length; i++) {
                    if (masterPages[i].id === page.inheritFrom) return '↳ ' + masterPages[i].name;
                }
                return '↳ (master hilang)';
            })();
            thumb.title = thumb.title + ' — inherit dari ' + inheritInfo;
        }

        // Drag handle (grip icon)
        var dragHandle = P.el('div', { class: 'pondasi-page-thumb-drag-handle',
            html: P.icon('grip-vertical') });

        // Foot: nomor + nama + inherit indicator
        var foot = P.el('div', { class: 'pondasi-page-thumb-foot' });
        var num = P.el('span', { class: 'pondasi-page-thumb-num', text: (idx + 1) });
        var name = P.el('span', { class: 'pondasi-page-thumb-name', text: pg.name });
        foot.appendChild(num);
        foot.appendChild(name);

        // Actions (master toggle, rename, duplikat, hapus)
        var actions = P.el('div', { class: 'pondasi-page-thumb-actions' });
        // Master toggle button (bookmark icon)
        var isMaster = page && page.isMaster;
        var btnMaster = P.el('button', {
            class: 'pondasi-page-thumb-action' + (isMaster ? ' pondasi-page-thumb-action-active' : ''),
            title: isMaster ? 'Lepas status master' : 'Jadikan master page',
            html: P.icon('bookmark'),
            style: isMaster ? 'background-color:#FF9500;color:#1E2832;border-color:#FF9500;' : ''
        });
        btnMaster.addEventListener('click', function (e) {
            e.stopPropagation();
            P.setPageAsMaster(pg.id, !isMaster);
            P.renderPagePanel();
            P.flash(isMaster ? 'Status master dilepas' : 'Halaman jadi master. Halaman lain bisa inherit dari sini.');
        });
        // Inherit dropdown (jika ada master pages dan bukan master page sendiri)
        if (masterPages.length > 0 && !isMaster) {
            var btnInherit = P.el('button', {
                class: 'pondasi-page-thumb-action',
                title: 'Inherit dari master page',
                html: P.icon('link') });
            btnInherit.addEventListener('click', function (e) {
                e.stopPropagation();
                P.tampilkanInheritDialog(pg.id, pg.name);
            });
            actions.appendChild(btnMaster);
            actions.appendChild(btnInherit);
        } else {
            actions.appendChild(btnMaster);
        }
        // Detach button (jika sedang inherit)
        if (page && page.inheritFrom) {
            var btnDetach = P.el('button', {
                class: 'pondasi-page-thumb-action',
                title: 'Lepas dari master (keep blocks lokal)',
                html: P.icon('link-slash') });
            btnDetach.addEventListener('click', function (e) {
                e.stopPropagation();
                P.detachPageFromMaster(pg.id);
            });
            actions.appendChild(btnDetach);
        }
        var btnRename = P.el('button', { class: 'pondasi-page-thumb-action', title: 'Rename halaman',
            html: P.icon('pen') });
        btnRename.addEventListener('click', function (e) {
            e.stopPropagation();
            P.promptRenamePage(pg.id);
        });
        var btnDup = P.el('button', { class: 'pondasi-page-thumb-action', title: 'Duplikat halaman',
            html: P.icon('copy') });
        btnDup.addEventListener('click', function (e) {
            e.stopPropagation();
            P.duplicatePage(pg.id);
            P.renderPagePanel();
            P.updatePageIndicator();
            P.flash('Halaman diduplikat (plek ketiplek)');
        });
        var btnHapus = P.el('button', { class: 'pondasi-page-thumb-action pondasi-page-thumb-action-hapus', title: 'Hapus halaman',
            html: P.icon('trash') });
        btnHapus.addEventListener('click', function (e) {
            e.stopPropagation();
            P.konfirmasi('Hapus halaman "' + pg.name + '"? Tidak bisa dibatalkan.', function (ok) {
                if (ok) {
                    P.deletePage(pg.id);
                    P.renderPagePanel();
                }
            }, 'Hapus Halaman', 'Hapus', 'Batal');
        });
        actions.appendChild(btnRename);
        actions.appendChild(btnDup);
        actions.appendChild(btnHapus);

        // Click thumb (bukan action) → switch page
        thumb.addEventListener('click', function (e) {
            if (e.target.closest('.pondasi-page-thumb-actions')) return;
            if (e.target.closest('.pondasi-page-thumb-drag-handle')) return;
            P.switchPage(pg.id);
            P.tutupPagePanel();
        });

        // v115: Drop target untuk cross-page block copy
        // User drag block dari canvas (dataTransfer "block:<id>") → drop ke thumbnail
        thumb.addEventListener('dragover', function (e) {
            // Cek apakah ini drag block (bukan drag reorder page)
            var types = e.dataTransfer.types;
            var isBlockDrag = false;
            if (types && types.length > 0) {
                for (var ti = 0; ti < types.length; ti++) {
                    if (types[ti] === 'text/block-id') { isBlockDrag = true; break; }
                }
            }
            if (isBlockDrag) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                thumb.classList.add('pondasi-page-thumb-drop-target');
                // Tampilkan "drop badge"
                if (!thumb.querySelector('.pondasi-page-thumb-drop-badge')) {
                    var dropBadge = P.el('div', { class: 'pondasi-page-thumb-drop-badge', text: 'DROP DI SINI' });
                    thumb.appendChild(dropBadge);
                }
            }
        });
        thumb.addEventListener('dragleave', function () {
            thumb.classList.remove('pondasi-page-thumb-drop-target');
            var db = thumb.querySelector('.pondasi-page-thumb-drop-badge');
            if (db) db.parentNode.removeChild(db);
        });
        thumb.addEventListener('drop', function (e) {
            var blockId = e.dataTransfer.getData('text/block-id');
            if (blockId) {
                e.preventDefault();
                e.stopPropagation();
                thumb.classList.remove('pondasi-page-thumb-drop-target');
                var db2 = thumb.querySelector('.pondasi-page-thumb-drop-badge');
                if (db2) db2.parentNode.removeChild(db2);
                P.copyBlockToPage(blockId, pg.id);
            }
        });

        // Drag handlers (reorder page)
        (function (pageIdx) {
            thumb.addEventListener('dragstart', function (e) {
                thumb.classList.add('pondasi-dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', String(pageIdx));
            });
            thumb.addEventListener('dragend', function () {
                thumb.classList.remove('pondasi-dragging');
                var all = grid.querySelectorAll('.pondasi-drag-over, .pondasi-drag-over-right');
                for (var i = 0; i < all.length; i++) {
                    all[i].classList.remove('pondasi-drag-over');
                    all[i].classList.remove('pondasi-drag-over-right');
                }
            });
            thumb.addEventListener('dragover', function (e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                var rect = thumb.getBoundingClientRect();
                var mid = rect.left + rect.width / 2;
                thumb.classList.remove('pondasi-drag-over', 'pondasi-drag-over-right');
                if (e.clientX < mid) {
                    thumb.classList.add('pondasi-drag-over');
                } else {
                    thumb.classList.add('pondasi-drag-over-right');
                }
            });
            thumb.addEventListener('dragleave', function () {
                thumb.classList.remove('pondasi-drag-over', 'pondasi-drag-over-right');
            });
            thumb.addEventListener('drop', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                if (isNaN(fromIdx)) return;
                var rect = thumb.getBoundingClientRect();
                var mid = rect.left + rect.width / 2;
                var toIdx = pageIdx;
                if (e.clientX >= mid) {
                    toIdx = pageIdx + 1;
                    if (fromIdx < toIdx) toIdx--;
                } else {
                    if (fromIdx < toIdx) toIdx--;
                }
                if (fromIdx === toIdx) return;
                P.reorderPage(fromIdx, toIdx);
            });
        })(idx);

        thumb.appendChild(dragHandle);
        thumb.appendChild(preview);
        thumb.appendChild(actions);
        thumb.appendChild(foot);
        grid.appendChild(thumb);
    });
};

/* === Dialog pilih master untuk inherit === */
P.tampilkanInheritDialog = function(pageId, pageName) {
    var masterPages = P.listMasterPages();
    if (masterPages.length === 0) {
        P.flash('Belum ada master page. Tandai satu halaman sebagai master dulu.');
        return;
    }
    // Build message with master list
    var msg = 'Pilih master page untuk halaman "' + pageName + '":\n\n';
    masterPages.forEach(function(m, i) {
        msg += (i + 1) + '. ' + m.name + '\n';
    });
    msg += '\n(ketik nomor, atau 0 untuk lepas inherit)';
    var input = prompt(msg, '1');
    if (input === null) return;
    var choice = parseInt(input.trim(), 10);
    if (isNaN(choice)) { P.flash('Input tidak valid'); return; }
    if (choice === 0) {
        P.setPageInheritFrom(pageId, null);
        P.flash('Inherit dilepas');
    } else if (choice >= 1 && choice <= masterPages.length) {
        P.setPageInheritFrom(pageId, masterPages[choice - 1].id);
        P.flash('Halaman "' + pageName + '" inherit dari "' + masterPages[choice - 1].name + '"');
    } else {
        P.flash('Nomor tidak valid');
    }
};

/* === Toggle page panel popover === */
P.togglePagePanel = function() {
    var panel = document.getElementById('page-panel');
    if (!panel) return;
    if (panel.hasAttribute('hidden')) {
        P.bukaPagePanel();
    } else {
        P.tutupPagePanel();
    }
};

P.bukaPagePanel = function() {
    var panel = document.getElementById('page-panel');
    if (!panel) return;
    P.renderPagePanel();
    panel.removeAttribute('hidden');
};

P.tutupPagePanel = function() {
    var panel = document.getElementById('page-panel');
    if (!panel) return;
    panel.setAttribute('hidden', '');
};

/* === Prompt rename halaman (pakai custom dialog atau prompt) === */
P.promptRenamePage = function(pageId) {
    var pages = P.listPages();
    var page = null;
    for (var i = 0; i < pages.length; i++) {
        if (pages[i].id === pageId) { page = pages[i]; break; }
    }
    if (!page) return;
    var namaBaru = prompt('Nama halaman baru:', page.name);
    if (namaBaru === null) return;
    namaBaru = namaBaru.trim();
    if (!namaBaru) { P.flash('Nama tidak boleh kosong'); return; }
    if (namaBaru === page.name) return;
    P.renamePage(pageId, namaBaru);
    P.renderPagePanel();
    P.updatePageIndicator();
    P.flash('Halaman di-rename: ' + namaBaru);
};

/* === Tambah halaman dari footer (+) === */
P.tambahHalamanDariFooter = function() {
    if (!P.STATE.currentProjectId) {
        P.flash('Buat dokumen/proyek dulu sebelum menambah halaman');
        return;
    }
    var nama = prompt('Nama halaman baru:', 'Halaman ' + (P.listPages().length + 1));
    if (!nama) return;
    P.newPage(nama);
    P.renderPagePanel();
    P.flash('Halaman "' + nama + '" dibuat');
};

/* === Copy block ke halaman lain (cross-page) === */
/* Dipanggil saat user drag block dari canvas dan drop ke thumbnail halaman lain. */
P.copyBlockToPage = function(sourceBlockId, targetPageId) {
    if (!P.STATE.currentProjectId) return false;
    var project = P.STATE.projects[P.STATE.currentProjectId];
    if (!project || !project.pages) return false;
    // Find source block in current tree
    var sourceBlock = null;
    var sourceRegion = null;
    (function walk(node) {
        if (sourceBlock) return;
        if (node.blocks) {
            for (var i = 0; i < node.blocks.length; i++) {
                if (node.blocks[i].id === sourceBlockId) {
                    sourceBlock = node.blocks[i];
                    sourceRegion = node;
                    return;
                }
            }
        }
        if (node.children) node.children.forEach(walk);
    })(P.STATE.tree);
    if (!sourceBlock) {
        P.flash('Block sumber tidak ditemukan');
        return false;
    }
    // Find target page
    var targetPage = null;
    for (var j = 0; j < project.pages.length; j++) {
        if (project.pages[j].id === targetPageId) { targetPage = project.pages[j]; break; }
    }
    if (!targetPage) {
        P.flash('Halaman target tidak ditemukan');
        return false;
    }
    // Find first region in target page tree (depth-first)
    var targetRegion = null;
    (function walkTarget(node) {
        if (targetRegion) return;
        if (node.type === 'parent' || node.type === 'child' || node.type === 'sub-child') {
            // Check if this is a leaf region (has blocks or could have blocks)
            if (node.type === 'sub-child' || (node.children && node.children.length === 0)) {
                targetRegion = node;
                return;
            }
        }
        if (node.children) node.children.forEach(walkTarget);
    })(targetPage.tree);
    if (!targetRegion) {
        // Fallback: find any region with type sub-child
        (function walkAny(node) {
            if (targetRegion) return;
            if (node.type === 'sub-child') { targetRegion = node; return; }
            if (node.children) node.children.forEach(walkAny);
        })(targetPage.tree);
    }
    if (!targetRegion) {
        P.flash('Halaman target tidak punya region untuk drop block');
        return false;
    }
    // Initialize blocks array if not exist
    if (!targetRegion.blocks) targetRegion.blocks = [];
    // Copy block (deep copy, new ID, mark as local addition)
    var newBlock = P.deepCopy(sourceBlock);
    newBlock.id = P.genBlockId();
    newBlock._inherited = false;
    newBlock._originBlockId = null;
    targetRegion.blocks.push(newBlock);
    // Save
    P.saveProjects();
    P.renderPagePanel();
    var targetName = targetPage.name;
    P.flash('Block disalin ke halaman "' + targetName + '"');
    return true;
};

/* === Update indikator halaman di footer === */
P.updatePageIndicator = function() {
    var el = document.getElementById('footer-page');
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
    var idx = P.getCurrentPageIndex();
    var total = P.getPageCount();
    if (total === 0) {
        el.appendChild(P.el('span', { class: 'pondasi-footer-page-name', text: '—' }));
        if (P.updatePageNavButtons) P.updatePageNavButtons();
        return;
    }
    var nama = P.getCurrentPageName() || '—';
    var curPage = P.getCurrentPage();
    var isMaster = curPage && curPage.isMaster;
    var isInherit = curPage && curPage.inheritFrom;
    if (isMaster) {
        el.appendChild(P.el('span', { class: 'pondasi-footer-page-master', text: 'M' }));
    }
    var numSpan = P.el('span', { class: 'pondasi-footer-page-num', text: idx + '/' + total });
    var nameSpan = P.el('span', { class: 'pondasi-footer-page-name', text: nama });
    el.appendChild(numSpan);
    el.appendChild(nameSpan);
    var titleParts = ['Halaman ' + idx + ' dari ' + total + ': ' + nama];
    if (isMaster) titleParts.push('MASTER');
    if (isInherit) {
        var master = P.listMasterPages().filter(function(m) { return m.id === isInherit; })[0];
        titleParts.push('inherit dari ' + (master ? master.name : '?'));
    }
    el.title = titleParts.join(' — ') + ' — klik untuk lihat semua halaman';
    if (P.updatePageNavButtons) P.updatePageNavButtons();
};

P.buatDokumenBaru = function() {
    var namaInput = document.getElementById('dokumen-nama-baru');
    var nama = namaInput ? namaInput.value.trim() : '';
    if (!nama) { P.flash('Nama dokumen tidak boleh kosong'); return; }
    P.newProject(nama, null);
    if (namaInput) namaInput.value = '';
    P.tutupSidebarKiri();
    P.flash('Dokumen "' + nama + '" dibuat');
};

/* ======================================================================
   PANEL TEMPLATE
   ====================================================================== */
P.tampilkanTemplatePanel = function() {
    P.toggleSidebar('template-panel', 'btn-template', function () {
        P.renderTemplateList();
    });
};

P.renderTemplateList = function() {
    var list = document.getElementById('template-list');
    if (!list) return;
    while (list.firstChild) list.removeChild(list.firstChild);
    Object.keys(P.TEMPLATES).forEach(function (key) {
        var t = P.TEMPLATES[key];
        var item = P.el('div', { class: 'pondasi-template-item', dataset: { templateKey: key } });
        var preview = P.el('div', { class: 'pondasi-template-item-preview' });
        preview.innerHTML = P.renderTemplatePreview(t.tree);
        var nama = P.el('div', { class: 'pondasi-template-item-nama', text: t.name });
        var desc = P.el('div', { class: 'pondasi-template-item-desc', text: t.deskripsi || '' });
        item.appendChild(preview);
        item.appendChild(nama);
        item.appendChild(desc);
        item.addEventListener('click', function () {
            P.terapkanTemplatePilihan(key);
        });
        list.appendChild(item);
    });

    // Render user templates juga
    P.renderUserTemplateList();
};

P.renderUserTemplateList = function() {
    var list = document.getElementById('template-user-list');
    if (!list) return;
    while (list.firstChild) list.removeChild(list.firstChild);

    var userTemplates = P.getUserTemplates ? P.getUserTemplates() : [];
    if (userTemplates.length === 0) {
        list.appendChild(P.el('div', { class: 'pondasi-sidebar-list-empty',
            text: 'Belum ada template. Gunakan "Simpan sebagai Template" di atas.' }));
        return;
    }
    userTemplates.forEach(function (t) {
        var item = P.el('div', { class: 'pondasi-template-item', dataset: { templateId: t.id } });
        var preview = P.el('div', { class: 'pondasi-template-item-preview' });
        if (t.tree) preview.innerHTML = P.renderTemplatePreview(t.tree);
        var nama = P.el('div', { class: 'pondasi-template-item-nama', text: t.name });
        var desc = P.el('div', { class: 'pondasi-template-item-desc', text: t.deskripsi || '' });

        // Tombol export JSON
        var btnExport = P.el('button', { class: 'pondasi-sidebar-list-hapus', title: 'Export sebagai .json',
            html: P.icon('download') });
        btnExport.style.marginRight = '4px';
        btnExport.addEventListener('click', function (e) {
            e.stopPropagation();
            P.exportTemplateJson(t.id);
        });

        // Tombol hapus
        var btnHapus = P.el('button', { class: 'pondasi-sidebar-list-hapus', title: 'Hapus template',
            html: P.icon('trash') });
        btnHapus.addEventListener('click', function (e) {
            e.stopPropagation();
            P.konfirmasi('Hapus template "' + t.name + '"?', function (ok) {
                if (ok) {
                    P.deleteUserTemplate(t.id);
                    P.renderUserTemplateList();
                }
            }, 'Hapus Template', 'Hapus', 'Batal');
        });

        // Wrapper untuk tombol export + hapus
        var btnWrap = P.el('div', { style: 'display:inline-block;white-space:nowrap;' });
        btnWrap.appendChild(btnExport);
        btnWrap.appendChild(btnHapus);

        var infoWrap = P.el('div', { class: 'pondasi-sidebar-list-info-wrap' });
        infoWrap.appendChild(nama);
        infoWrap.appendChild(desc);
        infoWrap.addEventListener('click', function () {
            P.terapkanUserTemplatePilihan(t.id);
        });

        item.appendChild(preview);
        item.appendChild(infoWrap);
        item.appendChild(btnWrap);
        list.appendChild(item);
    });
};

P.terapkanUserTemplatePilihan = function(templateId) {
    var userList = P.getUserTemplates ? P.getUserTemplates() : [];
    var template = null;
    for (var i = 0; i < userList.length; i++) {
        if (userList[i].id === templateId) { template = userList[i]; break; }
    }
    if (!template) return;

    if (!P.STATE.currentProjectId) {
        // Tidak ada project aktif — buat baru dari template
        P.newProject(template.name);
        setTimeout(function() {
            P.applyUserTemplate(templateId);
        }, 100);
        P.tutupSidebarKiri();
        P.flash('Dokumen baru dari template "' + template.name + '"');
        return;
    }
    P.konfirmasi('Terapkan template "' + template.name + '"? Layout saat ini akan diganti.', function (ok) {
        if (ok) {
            P.applyUserTemplate(templateId);
            P.tutupSidebarKiri();
            P.flash('Template diterapkan');
        }
    }, 'Terapkan Template', 'Terapkan', 'Batal');
};

P.konfirmasiSaveAsTemplate = function() {
    var namaInput = document.getElementById('template-save-nama');
    var descInput = document.getElementById('template-save-deskripsi');
    var nama = namaInput ? namaInput.value.trim() : '';
    var deskripsi = descInput ? descInput.value.trim() : '';
    if (!nama) { P.flash('Nama template tidak boleh kosong'); return; }
    if (!P.STATE.tree || !P.STATE.currentProjectId) { P.flash('Tidak ada dokumen aktif'); return; }

    P.konfirmasi('Simpan layout saat ini sebagai template "' + nama + '"?', function (ok) {
        if (ok) {
            P.saveAsTemplate(nama, deskripsi);
            if (namaInput) namaInput.value = '';
            if (descInput) descInput.value = '';
            P.renderUserTemplateList();
        }
    }, 'Simpan Template', 'Simpan', 'Batal');
};

P.konfirmasiSaveAsTemplateMultiPage = function() {
    var namaInput = document.getElementById('template-save-nama');
    var descInput = document.getElementById('template-save-deskripsi');
    var nama = namaInput ? namaInput.value.trim() : '';
    var deskripsi = descInput ? descInput.value.trim() : '';
    if (!nama) { P.flash('Nama template tidak boleh kosong'); return; }
    if (!P.STATE.currentProjectId) { P.flash('Tidak ada proyek aktif'); return; }
    var pageCount = P.getPageCount();
    if (pageCount < 2) {
        P.flash('Multi-page template butuh minimal 2 halaman. Saat ini hanya ' + pageCount + '.');
        return;
    }

    P.konfirmasi('Simpan SEMUA ' + pageCount + ' halaman sebagai multi-page template "' + nama + '"?', function (ok) {
        if (ok) {
            P.saveAsTemplateMultiPage(nama, deskripsi);
            if (namaInput) namaInput.value = '';
            if (descInput) descInput.value = '';
            P.renderUserTemplateList();
        }
    }, 'Simpan Multi-page Template', 'Simpan', 'Batal');
};

P.terapkanTemplatePilihan = function(key) {
    if (!P.TEMPLATES || !P.TEMPLATES[key]) {
        P.flash('Template tidak ditemukan');
        return;
    }
    var tpl = P.TEMPLATES[key];
    var hasCurrentProject = !!P.STATE.currentProjectId;
    var isMultiPageTpl = !!(tpl.pages && tpl.pages.length > 1);
    var tplPagesCount = isMultiPageTpl ? tpl.pages.length : 1;

    // Build dialog HTML
    var overlay = document.getElementById('pondasi-dialog');
    if (!overlay) {
        // Fallback: prompt numbered
        var opt = prompt('Terapkan template "' + tpl.name + '"?\n' +
            '1 = Terapkan ke halaman ini\n' +
            '2 = Buat dokumen baru (single page)\n' +
            '3 = Buat proyek baru (multi-page)', '1');
        if (opt === '1') {
            P.applyTemplateToCurrentPage(key);
            P.tutupSidebarKiri();
            P.flash('Template diterapkan ke halaman ini');
        } else if (opt === '2') {
            var nama2 = prompt('Nama dokumen baru:', tpl.name);
            if (nama2) {
                P.applyTemplateAsNewDocument(key, nama2);
                P.tutupSidebarKiri();
                P.flash('Dokumen baru dibuat dari template');
            }
        } else if (opt === '3') {
            var nama3 = prompt('Nama proyek baru:', tpl.name);
            if (!nama3) return;
            var jml = prompt('Jumlah halaman (template akan diulang/apply ke tiap halaman):', String(Math.max(1, tplPagesCount)));
            var j = parseInt(jml, 10);
            if (isNaN(j) || j < 1) j = 1;
            P.applyTemplateAsNewProjectMultiPage(key, nama3, j);
            P.tutupSidebarKiri();
            P.flash('Proyek baru dengan ' + j + ' halaman dibuat dari template');
        }
        return;
    }

    // Custom dialog with 3 options
    var judulEl = document.getElementById('pondasi-dialog-judul');
    var isiEl = document.getElementById('pondasi-dialog-isi');
    var kakiEl = document.getElementById('pondasi-dialog-kaki');
    if (judulEl) judulEl.textContent = 'Terapkan Template: ' + tpl.name;
    // Custom isi: 3 radio buttons
    if (isiEl) {
        isiEl.innerHTML = '' +
            '<label class="pondasi-apply-tpl-dialog-opt">' +
              '<input type="radio" name="tpl-opt" value="halaman" checked>' +
              '<span class="pondasi-apply-tpl-dialog-opt-title">Terapkan ke halaman ini</span>' +
              '<span class="pondasi-apply-tpl-dialog-opt-desc">Replace layout halaman aktif dengan template. Layout lama hilang (bisa undo).' + (hasCurrentProject ? '' : ' — butuh proyek aktif') + '</span>' +
            '</label>' +
            '<label class="pondasi-apply-tpl-dialog-opt">' +
              '<input type="radio" name="tpl-opt" value="dokumen">' +
              '<span class="pondasi-apply-tpl-dialog-opt-title">Buat dokumen baru (single page)</span>' +
              '<span class="pondasi-apply-tpl-dialog-opt-desc">Buat dokumen baru dengan 1 halaman berisi template. Cocok untuk prototyping cepat.</span>' +
            '</label>' +
            '<label class="pondasi-apply-tpl-dialog-opt">' +
              '<input type="radio" name="tpl-opt" value="proyek">' +
              '<span class="pondasi-apply-tpl-dialog-opt-title">Buat proyek baru (multi-page)</span>' +
              '<span class="pondasi-apply-tpl-dialog-opt-desc">Buat proyek baru dengan beberapa halaman. Template akan di-apply ke setiap halaman. Minta nama + jumlah halaman setelah ini.</span>' +
            '</label>' +
            '<div style="margin-top:8px;padding:8px;background-color:#0A141E;border-radius:3px;font-size:11px;color:#A0AAB4;line-height:1.5;">' +
                '<strong style="color:#00AAD4;">Info template:</strong><br>' +
                'Nama: ' + P.escHtml(tpl.name || '-') + '<br>' +
                'Tipe: ' + (isMultiPageTpl ? 'Multi-page (' + tplPagesCount + ' halaman)' : 'Single page') + '<br>' +
                'Untuk opsi "Buat proyek baru", template akan di-apply ke setiap halaman baru yang dibuat.' +
            '</div>';
    }
    // Footer: 2 tombol
    if (kakiEl) {
        kakiEl.innerHTML = '';
        var btnBatal = document.createElement('button');
        btnBatal.type = 'button';
        btnBatal.className = 'pondasi-apply-tpl-dialog-btn';
        btnBatal.textContent = 'Batal';
        btnBatal.dataset.action = 'dialog-batal';
        kakiEl.appendChild(btnBatal);
        var btnOK = document.createElement('button');
        btnOK.type = 'button';
        btnOK.className = 'pondasi-apply-tpl-dialog-btn pondasi-apply-tpl-dialog-btn-primary';
        btnOK.textContent = 'Lanjut';
        btnOK.dataset.action = 'dialog-ok';
        kakiEl.appendChild(btnOK);
    }
    overlay.style.display = 'block';
    overlay.classList.add('dialog-tampil');

    // Setup callback
    P.dialogCallbackFn = function (ok) {
        if (!ok) {
            overlay.style.display = 'none';
            overlay.classList.remove('dialog-tampil');
            P.dialogCallbackFn = null;
            return;
        }
        var selected = 'halaman';
        var radios = overlay.querySelectorAll('input[name="tpl-opt"]');
        for (var i = 0; i < radios.length; i++) {
            if (radios[i].checked) { selected = radios[i].value; break; }
        }
        overlay.style.display = 'none';
        overlay.classList.remove('dialog-tampil');
        P.dialogCallbackFn = null;
        if (selected === 'halaman') {
            if (!hasCurrentProject) {
                P.flash('Buat dokumen/proyek dulu sebelum menerapkan template');
                return;
            }
            P.applyTemplateToCurrentPage(key);
            P.tutupSidebarKiri();
            P.flash('Template diterapkan ke halaman aktif');
        } else if (selected === 'dokumen') {
            var namaDoc = prompt('Nama dokumen baru:', tpl.name || 'Dokumen dari Template');
            if (!namaDoc) return;
            P.applyTemplateAsNewDocument(key, namaDoc);
            P.tutupSidebarKiri();
            P.flash('Dokumen baru dibuat dari template');
        } else { // proyek
            var namaPro = prompt('Nama proyek baru:', tpl.name || 'Proyek dari Template');
            if (!namaPro) return;
            var defaultJml = Math.max(1, tplPagesCount);
            var jmlInput = prompt('Jumlah halaman (template akan di-apply ke setiap halaman):', String(defaultJml));
            if (jmlInput === null) return;
            var jml = parseInt(jmlInput, 10);
            if (isNaN(jml) || jml < 1) jml = 1;
            if (jml > 50) jml = 50;  // limit supaya tidak crash
            P.applyTemplateAsNewProjectMultiPage(key, namaPro, jml);
            P.tutupSidebarKiri();
            P.flash('Proyek baru dengan ' + jml + ' halaman dibuat dari template');
        }
    };
};

P.renderTemplatePreview = function(node) {
    if (!node) return '';
    var html = '';
    function walk(n) {
        if (!n) return;
        if (n.children && n.children.length > 0) {
            var firstChild = n.children[0];
            var isVertical = (n.type === 'grand-parent') ||
                (n.type === 'parent' && firstChild.type === 'sub-child') ||
                (n.type === 'sub-parent' && firstChild.type === 'sub-child');
            if (isVertical) {
                n.children.forEach(function (c) {
                    html += '<div class="pondasi-tpl-prev-row">';
                    walk(c);
                    html += '</div>';
                });
            } else {
                html += '<div class="pondasi-tpl-prev-horz">';
                n.children.forEach(function (c) {
                    var flex = c.col > 0 ? c.col : 1;
                    if (c.colName && c.col === 0) {
                        var m = { 'lima': 2, 'tujuh': 1.4, 'delapan': 1.25, 'sembilan': 1.1, 'sepuluh': 1, 'sebelas': 1 };
                        flex = m[c.colName] || 1;
                    }
                    html += '<div class="pondasi-tpl-prev-box" style="flex:' + flex + '"></div>';
                });
                html += '</div>';
            }
        } else {
            html += '<div class="pondasi-tpl-prev-box pondasi-tpl-prev-box-full"></div>';
        }
    }
    walk(node);
    return html;
};

/* ======================================================================
   PANEL SAVE AS
   ====================================================================== */
P.tampilkanSaveAsPanel = function() {
    P.toggleSidebar('saveas-panel', 'btn-saveas', function () {
        var inp = document.getElementById('saveas-nama');
        if (inp) {
            inp.value = P.getProjectName() + ' (salinan)';
            setTimeout(function () { inp.focus(); inp.select(); }, 50);
        }
    });
};

P.tambahHalamanBaru = function() {
    if (!P.STATE.currentProjectId) {
        P.flash('Buat dokumen dulu sebelum menambah halaman');
        return;
    }
    var nama = prompt('Nama halaman:', 'Halaman ' + (P.listPages().length + 1));
    if (!nama) return;
    P.newPage(nama);
    P.renderPageList();
    if (P.updatePageIndicator) P.updatePageIndicator();
    P.flash('Halaman "' + nama + '" dibuat');
};

P.konfirmasiSaveAs = function() {
    var inp = document.getElementById('saveas-nama');
    var nama = inp ? inp.value.trim().slice(0, 60) : '';  // limit 60 char
    if (!nama) { P.flash('Nama tidak boleh kosong'); return; }
    if (!P.STATE.currentProjectId) { P.flash('Tidak ada dokumen aktif'); return; }
    // Cek duplikat nama — beri peringatan tapi tetap izinkan (user mungkin mau replace manual)
    var adaDuplikat = P.listProjects().some(function (p) { return p.name === nama; });
    if (adaDuplikat) {
        P.konfirmasi('Nama "' + nama + '" sudah dipakai dokumen lain. Tetap simpan dengan nama ini?', function (ok) {
            if (ok) {
                P.saveAsProject(nama);
                P.tutupSidebarKiri();
                P.flash('Disimpan sebagai "' + nama + '"');
            }
        }, 'Nama Duplikat', 'Simpan', 'Batal');
        return;
    }
    P.saveAsProject(nama);
    P.tutupSidebarKiri();
    P.flash('Disimpan sebagai "' + nama + '"');
};

/* ======================================================================
   PANEL EXPORT (dengan checklist)
   ====================================================================== */
P.tampilkanExportPanel = function() {
    P.toggleSidebar('export-panel', 'btn-export', function () {
        var inp = document.getElementById('export-nama');
        if (inp) {
            var nama = (P.getProjectName() || 'pondasi-export')
                .replace(/[^a-zA-Z0-9_-]/g, '-')
                .replace(/-+/g, '-')          // collapse multiple dashes
                .replace(/^-|-$/g, '')        // strip leading/trailing dash
                .toLowerCase();
            if (!nama) nama = 'pondasi-export';
            inp.value = nama;
            setTimeout(function () { inp.focus(); inp.select(); }, 50);
        }
    });
};

P.konfirmasiExport = function() {
    var namaInput = document.getElementById('export-nama');
    var nama = namaInput ? namaInput.value.trim() : 'pondasi-export';
    if (!nama) nama = 'pondasi-export';
    nama = nama
        .replace(/[^a-zA-Z0-9_-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase();
    if (!nama) nama = 'pondasi-export';

    // === PRE-EXPORT SCAN ===
    var scanSummary = P.Scanner.scanProject();
    var adaPelanggaran = scanSummary.errors.length > 0 || scanSummary.kelasInvalid > 0;
    if (adaPelanggaran) {
        // Tampilkan warning, tapi tetap lanjut export (sesuai pilihan user)
        var pesan = 'Scanner menemukan ' + scanSummary.errors.length + ' pelanggaran' +
                    (scanSummary.kelasInvalid > 0 ? ' (' + scanSummary.kelasInvalid + ' kelas di-skip)' : '') +
                    '.\n\nExport tetap dilanjutkan, tapi hasil mungkin tidak sesuai standar pondasi.' +
                    '\n\nLanjutkan export?';
        P.konfirmasi(pesan, function (ok) {
            if (ok) P.lanjutkanExport(nama);
        }, 'Peringatan Scanner', 'Lanjut Export', 'Batal');
        return;
    }
    P.lanjutkanExport(nama);
};

/* === TREE-SHAKING: Export CSS yang sudah di-filter (hanya kelas dipakai) === */
P.exportTreeShakeCSS = function (nama, callback) {
    if (!P.Tema) {
        if (callback) callback(null);
        return;
    }
    P.flash('Memproses tree-shaking CSS...');
    P.Tema.treeShakeCSS(function (cssFiltered) {
        if (!cssFiltered) {
            P.flash('Gagal tree-shake CSS');
            if (callback) callback(null);
            return;
        }
        // Download atau simpan ke server
        if (typeof P.storageExport === 'function') {
            P.storageExport(nama + '-build', 'css', cssFiltered);
        } else if (P.downloadFile) {
            P.downloadFile(nama + '-build.css', cssFiltered, 'text/css;charset=utf-8');
        }
        P.flash('CSS build diunduh (' + Math.round(cssFiltered.length / 1024) + ' KB)');
        if (callback) callback(cssFiltered);
    });
};

P.lanjutkanExport = function(nama) {
    var expHTML = document.getElementById('export-html');
    var expCSS = document.getElementById('export-css');
    var expPondasiCSS = document.getElementById('export-pondasi-css');
    var expTampilanCSS = document.getElementById('export-tampilan-css');
    var expZip = document.getElementById('export-zip');
    var expFolderZip = document.getElementById('export-folder-zip');
    var expAllPages = document.getElementById('export-all-pages');

    // Mode ZIP Folder Structure (css/js/gambar/index.html)
    if (expFolderZip && expFolderZip.checked) {
        P.exportAsZipFolder(nama);
        return;
    }

    var count = 0;

    // Mode ZIP (inline CSS): gabungkan semua jadi 1 file HTML dengan inline CSS kustom.
    // pondasi.css & tampilan.css tetap perlu disalin manual (lihat help / export info).
    if (expZip && expZip.checked) {
        var htmlContent = P.generateExportHTML();
        var inlineCSS = '';
        if (Object.keys(P.STATE.customCSS).length > 0) {
            inlineCSS += P.generateCustomCSS();
        }
        if (typeof P.generateBlockPseudoCSSForExport === 'function') {
            var pseudoCSS = P.generateBlockPseudoCSSForExport();
            if (pseudoCSS) inlineCSS += '\n' + pseudoCSS;
        }
        // Replace <link rel="stylesheet" href="pondasi-custom.css"> dengan <style>
        if (inlineCSS) {
            htmlContent = htmlContent.replace(
                '<link rel="stylesheet" href="pondasi-custom.css">',
                '<style>\n' + inlineCSS + '\n</style>'
            );
        }
        if (typeof P.storageExport === 'function') {
            P.storageExport(nama, 'html', htmlContent);
        } else {
            P.downloadFile(nama + '.html', htmlContent, 'text/html;charset=utf-8');
        }
        P.tutupSidebarKiri();
        P.flash('HTML dengan inline CSS diunduh (1 file)');
        return;
    }

    // Mode individual files
    var expAllPages = document.getElementById('export-all-pages');
    if (expHTML && expHTML.checked) {
        if (expAllPages && expAllPages.checked) {
            // Export semua halaman
            var project = P.STATE.projects[P.STATE.currentProjectId];
            if (project && project.pages) {
                // Sync halaman aktif dulu
                P.syncToProject();
                project.pages.forEach(function(page) {
                    // Sementara swap tree + customCSS
                    var savedTree = P.STATE.tree;
                    var savedCSS = P.STATE.customCSS;
                    var savedPageId = P.STATE.currentPageId;
                    P.STATE.tree = page.tree;
                    P.STATE.customCSS = page.customCSS || {};
                    P.STATE.currentPageId = page.id;
                    var pageNama = P.sanitizeNama(page.name) || ('halaman-' + page.id);
                    var html = P.generateExportHTML();
                    if (typeof P.storageExport === 'function') {
                        P.storageExport(nama + '-' + pageNama, 'html', html);
                    } else {
                        P.downloadFile(nama + '-' + pageNama + '.html', html, 'text/html;charset=utf-8');
                    }
                    count++;
                    // Restore
                    P.STATE.tree = savedTree;
                    P.STATE.customCSS = savedCSS;
                    P.STATE.currentPageId = savedPageId;
                });
            }
        } else {
            // Export halaman aktif saja
            var html = P.generateExportHTML();
            if (typeof P.storageExport === 'function') {
                P.storageExport(nama, 'html', html);
            } else {
                P.downloadFile(nama + '.html', html, 'text/html;charset=utf-8');
            }
            count++;
        }
    }

    if (expCSS && expCSS.checked) {
        var cssContent = P.generateCustomCSS();
        if (cssContent && cssContent !== '/* Belum ada kelas kustom */\n') {
            if (typeof P.storageExport === 'function') {
                P.storageExport('pondasi-custom', 'css', cssContent);
            } else {
                P.downloadFile('pondasi-custom.css', cssContent, 'text/css;charset=utf-8');
            }
            count++;
        }
    }

    if (expPondasiCSS && expPondasiCSS.checked) {
        P.flash('pondasi.css: salin manual dari folder pondasi');
    }

    if (expTampilanCSS && expTampilanCSS.checked) {
        P.flash('tampilan.css: salin manual dari folder pondasi');
    }

    // CSS Build (tree-shake) — async, jadi handle terpisah
    var expBuildCSS = document.getElementById('export-build-css');
    if (expBuildCSS && expBuildCSS.checked) {
        // Tutup sidebar dulu, lalu proses async
        P.tutupSidebarKiri();
        if (count > 0) {
            var modeAwal = (typeof P.isServerMode === 'function' && P.isServerMode()) ? 'ekspor/' : 'unduhan';
            P.flash(count + ' file di' + modeAwal + ' + memproses CSS build...');
        } else {
            P.flash('Memproses CSS build (tree-shake)...');
        }
        P.exportTreeShakeCSS(nama, function () {
            // callback setelah tree-shake selesai
        });
        return;
    }

    if (count > 0) {
        P.tutupSidebarKiri();
        var mode = (typeof P.isServerMode === 'function' && P.isServerMode()) ? 'ekspor/' : 'unduhan';
        P.flash(count + ' file di' + mode);
    } else {
        P.flash('Pilih minimal 1 file untuk diekspor');
    }
};

// Generate HTML untuk export (dipisah dari exportHTML lama)
P.generateExportHTML = function() {
    var settings = P.getProjectSettings();
    var perluCustomLink = Object.keys(P.STATE.customCSS).length > 0;
    if (typeof P.generateBlockPseudoCSSForExport === 'function') {
        if (P.generateBlockPseudoCSSForExport()) perluCustomLink = true;
    }
    var customLink = perluCustomLink ? '    <link rel="stylesheet" href="pondasi-custom.css">\n' : '';

    var escA = function(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); };
    var escH = function(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };

    var metaTags = '';
    metaTags += '    <meta charset="' + escA(settings.charset || 'UTF-8') + '">\n';
    metaTags += '    <meta name="viewport" content="' + escA(settings.viewport) + '">\n';
    if (settings.deskripsi) metaTags += '    <meta name="description" content="' + escA(settings.deskripsi) + '">\n';
    if (settings.robots) metaTags += '    <meta name="robots" content="' + escA(settings.robots) + '">\n';

    // Title HTML: page.title (override) > project.settings.judul > project.name > default
    var title = P.getPageJudul ? P.getPageJudul() : (settings.judul || P.getProjectName() || 'Dibuat dengan pondasi');

    var cssLinksStr = '';
    if (settings.cssLinks && settings.cssLinks.length > 0) {
        settings.cssLinks.forEach(function (href) {
            if (href) cssLinksStr += '    <link rel="stylesheet" href="' + escA(href) + '">\n';
        });
    }

    var scriptsStr = '';
    if (settings.scripts && settings.scripts.length > 0) {
        settings.scripts.forEach(function (s) {
            if (!s || !s.src) return;
            var attrs = '';
            if (s.defer) attrs += ' defer';
            if (s.async) attrs += ' async';
            scriptsStr += '    <script src="' + escA(s.src) + '"' + attrs + '></script>\n';
        });
    }

    var bodyAttrs = settings.tema === 'gelap' ? ' data-tema="gelap"' : '';
    var bodyStyle = '';
    if (settings.fontFamily || settings.fontSize || settings.lineHeight) {
        var sp = [];
        if (settings.fontFamily) sp.push('font-family: ' + settings.fontFamily);
        if (settings.fontSize) sp.push('font-size: ' + settings.fontSize);
        if (settings.lineHeight) sp.push('line-height: ' + settings.lineHeight);
        bodyStyle = ' style="' + sp.join('; ') + '"';
    }

    // Generate CSS link tags dari tema aktif
    var temaLinksStr = '';
    if (P.Tema && P.Tema.getBerkasTema) {
        var berkas = P.Tema.getBerkasTema();
        berkas.forEach(function (b) {
            temaLinksStr += '    <link rel="stylesheet" href="' + escA(b) + '">\n';
        });
    } else {
        // Fallback
        temaLinksStr = '    <link rel="stylesheet" href="css/pondasi.css">\n' +
            '    <link rel="stylesheet" href="css/tampilan.css">\n' +
            '    <link rel="stylesheet" href="css/tampilan-teks.css">\n' +
            '    <link rel="stylesheet" href="css/tampilan-teks-tambahan.css">\n' +
            '    <link rel="stylesheet" href="css/tampilan-daftar.css">\n' +
            '    <link rel="stylesheet" href="css/tampilan-media.css">\n' +
            '    <link rel="stylesheet" href="css/tampilan-tabel.css">\n' +
            '    <link rel="stylesheet" href="css/tampilan-tombol.css">\n' +
            '    <link rel="stylesheet" href="css/tampilan-form.css">\n' +
            '    <link rel="stylesheet" href="css/tampilan-kontainer.css">\n' +
            '    <link rel="stylesheet" href="css/tampilan-navigasi.css">\n' +
            '    <link rel="stylesheet" href="css/tampilan-feedback.css">\n' +
            '    <link rel="stylesheet" href="css/tampilan-lainnya.css">\n';
    }

    // Cek apakah ada aksi JavaScript (klik/scroll/dinamis) yang perlu pondasi-aksi.js
    var perluAksiJs = false;
    if (P.STATE.tree) {
        (function cekAksi(node) {
            if (node.blocks && node.blocks.length > 0) {
                node.blocks.forEach(function(block) {
                    if (block.aksi) {
                        if (block.aksi.klik && block.aksi.klik.jenis && block.aksi.klik.jenis !== 'none') perluAksiJs = true;
                        if (block.aksi.scroll && block.aksi.scroll.jenis && block.aksi.scroll.jenis !== 'none') perluAksiJs = true;
                        if (block.aksi.tambahan && block.aksi.tambahan.jenis && block.aksi.tambahan.jenis !== 'none') perluAksiJs = true;
                    }
                    if (block.jenis === 'jam' || block.jenis === 'tanggal' || block.jenis === 'hitung-mundur') perluAksiJs = true;
                });
            }
            if (node.children && node.children.length > 0) {
                node.children.forEach(cekAksi);
            }
        })(P.STATE.tree);
    }

    var aksiJsStr = perluAksiJs ?
        '    <link rel="stylesheet" href="css/pondasi-aksi.css">\n' +
        '    <script src="js/pondasi-aksi.js"></script>\n' +
        '    <script>PondasiAksi.init(document);</script>\n' : '';

    return '<!DOCTYPE html>\n' +
'<html lang="' + escA(settings.bahasa || 'id') + '">\n' +
'<head>\n' +
metaTags +
'    <title>' + escH(title) + '</title>\n' +
temaLinksStr +
cssLinksStr +
customLink +
(aksiJsStr ? aksiJsStr.split('\n')[0] + '\n' : '') + // CSS link di head
'</head>\n' +
'<body' + bodyAttrs + bodyStyle + '>\n' +
P.serializeNode(P.STATE.tree, 1) +
scriptsStr +
(perluAksiJs ? '    <script src="js/pondasi-aksi.js"></script>\n    <script>PondasiAksi.init(document);</script>\n' : '') +
'</body>\n' +
'</html>\n';
};

/* ======================================================================
   SETTINGS PANEL
   ====================================================================== */
P.tampilkanSettingsPanel = function() {
    P.toggleSidebar('settings-panel', 'btn-settings', function () {
        P.renderSettings();
    });
};

P.renderSettings = function() {
    var badan = document.getElementById('settings-badan');
    if (!badan) return;
    var s = P.getProjectSettings();
    var html = '';
    // Dokumen
    html += '<div class="pondasi-sidebar-section">';
    html += P.fieldSettings('judul', 'Judul', s.judul, 'text', 'Judul halaman');
    html += P.fieldSettings('deskripsi', 'Deskripsi', s.deskripsi, 'textarea', 'Deskripsi untuk SEO');
    html += P.fieldSettings('bahasa', 'Bahasa', s.bahasa, 'text', 'id, en, dll');
    html += P.fieldSettings('robots', 'Robots', s.robots, 'text', 'index, follow');
    html += P.fieldSettings('viewport', 'Viewport', s.viewport, 'text', 'width=device-width, initial-scale=1');
    html += P.fieldSettings('charset', 'Charset', s.charset, 'text', 'UTF-8');
    html += '</div>';

    // === Halaman aktif: judul override ===
    var curPage = P.getCurrentPage ? P.getCurrentPage() : null;
    if (curPage) {
        html += '<details class="pondasi-properti-grup" open><summary>Halaman Aktif: ' + P.escHtml(curPage.name) + '</summary><div class="pondasi-properti-isi">';
        html += '<div style="font-size:11px;color:#A0AAB4;margin-bottom:4px;">Judul HTML halaman ini (override — kosongkan untuk pakai default project)</div>';
        html += '<input type="text" class="pondasi-sidebar-input" id="settings-page-judul" placeholder="kosongkan untuk pakai default" value="' + P.escAttr(curPage.title || '') + '" data-page-id="' + curPage.id + '">';
        html += '<button type="button" class="pondasi-sidebar-btn" data-action="terapkan-page-judul" style="margin-top:6px;">Simpan Judul Halaman</button>';
        html += '</div></details>';
    }

    // Dimensi
    html += '<details class="pondasi-properti-grup"><summary>Dimensi</summary><div class="pondasi-properti-isi">';
    html += P.fieldSettingsPilih('dimensi', 'Lebar dokumen', s.dimensi, [
        { v: '1200', l: '1200px (75rem) — default' },
        { v: '1280', l: '1280px (80rem)' },
        { v: '1024', l: '1024px (64rem)' },
        { v: '960', l: '960px (60rem)' },
        { v: 'full', l: 'Full width (tanpa batas)' }
    ]);
    html += '</div></details>';

    // Tema
    html += '<details class="pondasi-properti-grup"><summary>Tema</summary><div class="pondasi-properti-isi">';
    html += P.fieldSettingsPilih('tema', 'File tema CSS', s.tema, [
        { v: 'tampilan.css', l: 'tampilan.css (default)' }
    ]);
    html += P.fieldSettingsPilih('temaWarna', 'Warna tema', s.temaWarna, [
        { v: 'terang', l: 'Terang' },
        { v: 'gelap', l: 'Gelap' }
    ]);
    html += '</div></details>';

    // Aturan Grid
    html += '<details class="pondasi-properti-grup"><summary>Aturan Grid</summary><div class="pondasi-properti-isi">';
    html += P.fieldSettingsPilih('gridMode', 'Mode grid', s.gridMode, [
        { v: 'hybrid', l: 'Hybrid (12 + 10)' },
        { v: 'strict-12', l: 'Strict 12 kolom' },
        { v: 'strict-10', l: 'Strict 10 kolom' }
    ]);
    html += P.fieldSettingsPilih('gridUnit', 'Unit grid (px)', String(s.gridUnit), [
        { v: '16', l: '16px (1rem)' },
        { v: '10', l: '10px' },
        { v: '5', l: '5px' },
        { v: '1', l: '1px' }
    ]);
    html += '</div></details>';

    // Tipografi
    html += '<details class="pondasi-properti-grup"><summary>Tipografi</summary><div class="pondasi-properti-isi">';
    html += '<div class="pondasi-properti-baris"><label class="pondasi-properti-label">Font family (satu per baris)</label>';
    html += '<textarea class="pondasi-properti-textarea" data-setting="fontFamilies" placeholder="Inter, sans-serif&#10;Playfair Display, serif">' + P.escHtml((s.fontFamilies || (s.fontFamily ? [s.fontFamily] : [])).join('\n')) + '</textarea></div>';
    html += P.fieldSettings('fontSize', 'Font size default', s.fontSize, 'text', '16px');
    html += P.fieldSettings('lineHeight', 'Line height default', s.lineHeight, 'text', '1.5');
    html += '</div></details>';

    // CSS eksternal
    html += '<details class="pondasi-properti-grup"><summary>CSS Eksternal</summary><div class="pondasi-properti-isi">';
    html += '<div class="pondasi-properti-baris"><label class="pondasi-properti-label">Link CSS (satu per baris)</label>';
    html += '<textarea class="pondasi-properti-textarea" data-setting="cssLinks" placeholder="https://fonts.googleapis.com/...">' + P.escHtml((s.cssLinks || []).join('\n')) + '</textarea>';
    html += '</div></div></details>';

    // Script eksternal
    html += '<details class="pondasi-properti-grup"><summary>Script Eksternal</summary><div class="pondasi-properti-isi">';
    html += '<div class="pondasi-properti-baris"><label class="pondasi-properti-label">Script src (satu per baris, optional: |defer|async)</label>';
    html += '<textarea class="pondasi-properti-textarea" data-setting="scripts" placeholder="app.js|defer">' + P.escHtml((s.scripts || []).map(function (sc) { return sc.src + (sc.defer ? '|defer' : '') + (sc.async ? '|async' : ''); }).join('\n')) + '</textarea>';
    html += '</div></div></details>';

    badan.innerHTML = html;
};

P.fieldSettings = function(id, label, value, jenis, placeholder) {
    if (jenis === 'textarea') {
        return '<div class="pondasi-properti-baris"><label class="pondasi-properti-label">' + label + '</label>' +
            '<textarea class="pondasi-properti-textarea" data-setting="' + id + '" placeholder="' + P.escAttr(placeholder || '') + '">' + P.escHtml(value || '') + '</textarea></div>';
    }
    return '<div class="pondasi-properti-baris"><label class="pondasi-properti-label">' + label + '</label>' +
        '<input type="text" class="pondasi-properti-input" data-setting="' + id + '" value="' + P.escAttr(value || '') + '" placeholder="' + P.escAttr(placeholder || '') + '"></div>';
};

P.fieldSettingsPilih = function(id, label, value, opsi) {
    var opts = opsi.map(function (o) {
        var sel = o.v === value ? ' selected' : '';
        return '<option value="' + P.escAttr(o.v) + '"' + sel + '>' + P.escHtml(o.l) + '</option>';
    }).join('');
    return '<div class="pondasi-properti-baris pondasi-properti-baris-inline"><label class="pondasi-properti-label">' + label + '</label>' +
        '<select class="pondasi-properti-select pondasi-properti-select-lebar" data-setting="' + id + '">' + opts + '</select></div>';
};

P.terapkanSettings = function() {
    var badan = document.getElementById('settings-badan');
    if (!badan) return;
    var s = P.getProjectSettings();
    var fields = badan.querySelectorAll('[data-setting]');
    Array.prototype.forEach.call(fields, function (f) {
        var key = f.dataset.setting;
        var val = f.value;
        if (key === 'cssLinks') {
            s.cssLinks = val.split('\n').map(function (l) { return l.trim(); }).filter(function (l) { return l; });
        } else if (key === 'scripts') {
            s.scripts = val.split('\n').map(function (l) {
                l = l.trim();
                if (!l) return null;
                var parts = l.split('|');
                return { src: parts[0].trim(), defer: parts.indexOf('defer') >= 0, async: parts.indexOf('async') >= 0 };
            }).filter(function (x) { return x; });
        } else if (key === 'fontFamilies') {
            s.fontFamilies = val.split('\n').map(function (l) { return l.trim(); }).filter(function (l) { return l; });
            s.fontFamily = s.fontFamilies.length > 0 ? s.fontFamilies[0] : '';
        } else if (key === 'gridUnit') {
            s.gridUnit = parseInt(val, 10) || 16;
        } else {
            s[key] = val;
        }
    });
    P.updateProjectSettings(s);
    P.applySettingsKeEditor();
    P.tutupSidebarKiri();
    P.flash('Pengaturan diterapkan');
};

/* === Terapkan judul HTML per-halaman (dari Settings panel) === */
P.terapkanPageJudul = function() {
    var inp = document.getElementById('settings-page-judul');
    if (!inp) return;
    var pageId = inp.dataset.pageId;
    if (!pageId) return;
    var val = inp.value.trim();
    P.setPageJudul(pageId, val);
    P.flash(val ? 'Judul halaman disimpan' : 'Judul halaman di-reset ke default');
    P.updatePageIndicator();
};

P.applySettingsKeEditor = function() {
    var s = P.getProjectSettings();
    // Tema warna (terang/gelap) — data-tema di body
    if (s.temaWarna === 'gelap') document.body.setAttribute('data-tema', 'gelap');
    else document.body.removeAttribute('data-tema');
    // Dimensi — data-dimensi di body
    if (s.dimensi) document.body.setAttribute('data-dimensi', s.dimensi);
    else document.body.removeAttribute('data-dimensi');
    // Font family
    document.body.style.fontFamily = s.fontFamily || '';
    // Font size & line height — supaya preview editor konsisten dengan export
    document.body.style.fontSize = s.fontSize || '';
    document.body.style.lineHeight = s.lineHeight || '';
};

/* ======================================================================
   SAVE PROJECT
   ====================================================================== */
P.simpanProject = function() {
    if (!P.STATE.currentProjectId) { P.tampilkanDokumenPanel(); return; }
    P.saveProject();
};

/* ======================================================================
   UTIL
   ====================================================================== */
P.formatTanggal = function(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    var now = new Date();
    var diff = now.getTime() - ts;
    var hari = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    var bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    var sameDay = d.toDateString() === now.toDateString();
    var yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    var isYesterday = d.toDateString() === yesterday.toDateString();

    // Format jam (HH:MM)
    var jam = (d.getHours() < 10 ? '0' : '') + d.getHours();
    var menit = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();

    // Relative time untuk < 7 hari
    if (diff < 60 * 1000) return 'baru saja';
    if (diff < 60 * 60 * 1000) return Math.floor(diff / 60000) + ' menit lalu';
    if (sameDay) return 'hari ini ' + jam + ':' + menit;
    if (isYesterday) return 'kemarin ' + jam + ':' + menit;
    if (diff < 7 * 24 * 60 * 60 * 1000) {
        var hariLalu = Math.floor(diff / (24 * 60 * 60 * 1000));
        return hariLalu + ' hari lalu';
    }
    // Lebih dari 7 hari — tampilkan tanggal lengkap
    return hari[d.getDay()] + ', ' + d.getDate() + ' ' + bulan[d.getMonth()] + ' ' + d.getFullYear();
};

P.handleFloatingKiri = function(e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var action = btn.dataset.action;
    switch (action) {
        case 'dokumen-panel': P.tampilkanDokumenPanel(); break;
        case 'buka-panel': P.tampilkanBukaPanel(); break;
        case 'assets-panel': P.tampilkanAssetsPanel(); break;
        case 'upload-gambar': P.uploadGambar(); break;
        case 'buka-dari-berkas': P.bukaDariBerkas(); break;
        case 'simpan-ke-berkas': P.simpanKeBerkas(); break;
        case 'konfirmasi-buat-dokumen': P.konfirmasiBuatDokumen(); break;
        case 'konfirmasi-buat-proyek': P.konfirmasiBuatProyek(); break;
        case 'template-panel': P.tampilkanTemplatePanel(); break;
        case 'save-as-template': P.konfirmasiSaveAsTemplate(); break;
        case 'save-as-template-multipage': P.konfirmasiSaveAsTemplateMultiPage(); break;
        case 'import-template': P.pilihFileTemplate(); break;
        case 'save-project': P.simpanProject(); break;
        case 'saveas-panel': P.tampilkanSaveAsPanel(); break;
        case 'konfirmasi-saveas': P.konfirmasiSaveAs(); break;
        case 'export-panel': P.tampilkanExportPanel(); break;
        case 'konfirmasi-export': P.konfirmasiExport(); break;
        case 'settings-panel': P.tampilkanSettingsPanel(); break;
        case 'terapkan-settings': P.terapkanSettings(); break;
        case 'terapkan-page-judul': P.terapkanPageJudul(); break;
        case 'tutup-sidebar-kiri': P.tutupSidebarKiri(); break;
        // Dialog actions
        case 'dialog-ok': P.prosesDialog(true); break;
        case 'dialog-batal': P.prosesDialog(false); break;
    }
};

/* === Handler floating kanan (canvas tools, code view) === */
P.handleFloatingKanan = function(e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var action = btn.dataset.action;
    switch (action) {
        case 'toggle-codeview':
            if (P.toggleCodeView) P.toggleCodeView();
            break;
    }
};

/* === Tampilkan Assets panel === */
P.tampilkanAssetsPanel = function() {
    P.toggleSidebar('assets-panel', 'btn-assets', function () {
        P.renderAssetsList();
    });
};

/* === Upload gambar dengan kompresi === */
P.uploadGambar = function() {
    if (!P.STATE.currentProjectId) {
        P.flash('Buat dokumen/proyek dulu sebelum upload gambar');
        return;
    }
    var fileInput = document.getElementById('assets-gambar-file');
    if (!fileInput) { P.flash('File input tidak ditemukan'); return; }
    fileInput.value = '';
    fileInput.click();
};

P.handleAssetsGambarChange = function(e) {
    var files = e.target.files;
    if (!files || files.length === 0) return;
    if (!P.STATE.currentProjectId) { P.flash('Tidak ada proyek aktif'); return; }
    var projectId = P.STATE.currentProjectId;

    // Baca opsi kompresi
    var doCompress = document.getElementById('assets-compress');
    doCompress = doCompress ? doCompress.checked : true;
    var useWebp = document.getElementById('assets-webp');
    useWebp = useWebp ? useWebp.checked : false;
    var maxDimInput = document.getElementById('assets-max-dim');
    var maxDim = maxDimInput ? parseInt(maxDimInput.value, 10) : 1920;
    if (isNaN(maxDim) || maxDim < 100) maxDim = 1920;
    if (maxDim > 4096) maxDim = 4096;
    var qualityInput = document.getElementById('assets-quality');
    var quality = qualityInput ? parseFloat(qualityInput.value) : 0.8;
    if (isNaN(quality) || quality < 0.1) quality = 0.8;
    if (quality > 1.0) quality = 1.0;

    var options = { compress: doCompress, maxDim: maxDim, quality: quality, webp: useWebp };

    // Proses setiap file
    var processedCount = 0;
    var errorCount = 0;
    P.flash('Memproses ' + files.length + ' gambar...');

    function processNext(idx) {
        if (idx >= files.length) {
            P.renderAssetsList();
            if (errorCount > 0) {
                P.flash(processedCount + ' gambar diupload, ' + errorCount + ' gagal');
            } else {
                P.flash(processedCount + ' gambar diupload & dikompres');
            }
            return;
        }
        var file = files[idx];
        var nama = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
        // Unique nama kalau sudah ada
        P.compressImage(file, options, function (blob, info, err) {
            if (err || !blob) {
                errorCount++;
                console.error('Gagal kompres ' + file.name + ':', err);
            } else {
                var finalNama = nama;
                // Tambah suffix ukuran ke nama file biar uniq
                var dotIdx = finalNama.lastIndexOf('.');
                var base = dotIdx > 0 ? finalNama.substring(0, dotIdx) : finalNama;
                var ext = info.type === 'image/webp' ? 'webp' : 'jpg';
                finalNama = base + '-' + info.width + 'x' + info.height + '.' + ext;
                P.saveAsset(projectId, finalNama, blob, info, function (id, saveErr) {
                    if (saveErr) {
                        errorCount++;
                        console.error('Gagal save ' + finalNama + ':', saveErr);
                    } else {
                        processedCount++;
                    }
                    processNext(idx + 1);
                });
                return;
            }
            processNext(idx + 1);
        });
    }
    processNext(0);
};

/* === Render list gambar di sidebar Assets === */
P.renderAssetsList = function() {
    var list = document.getElementById('assets-gambar-list');
    if (!list) return;
    while (list.firstChild) list.removeChild(list.firstChild);
    if (!P.STATE.currentProjectId) {
        list.appendChild(P.el('div', { class: 'pondasi-sidebar-list-empty', text: 'Buat proyek dulu.' }));
        return;
    }
    var projectId = P.STATE.currentProjectId;
    P.listAssets(projectId, function (assets, err) {
        if (err) {
            list.appendChild(P.el('div', { class: 'pondasi-sidebar-list-empty', text: 'Error: ' + err.message }));
            return;
        }
        if (assets.length === 0) {
            list.appendChild(P.el('div', { class: 'pondasi-sidebar-list-empty', text: 'Belum ada gambar. Klik tombol di atas untuk upload.' }));
            return;
        }
        // Sort by createdAt desc
        assets.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
        assets.forEach(function (asset) {
            var item = P.el('div', { class: 'pondasi-asset-item' });
            item.title = 'Klik untuk copy URL, atau klik 🗑 untuk hapus';
            // Thumbnail
            var thumb = P.el('div', { class: 'pondasi-asset-thumb' });
            thumb.style.backgroundImage = 'url(' + URL.createObjectURL(asset.blob) + ')';
            // Info
            var info = P.el('div', { class: 'pondasi-asset-info' });
            var namaEl = P.el('span', { class: 'pondasi-asset-nama', text: asset.nama });
            var metaEl = P.el('span', { class: 'pondasi-asset-meta',
                text: asset.width + 'x' + asset.height + ' · ' + P.formatBytes(asset.compressedSize) + (asset.originalSize !== asset.compressedSize ? ' (asal ' + P.formatBytes(asset.originalSize) + ')' : '') });
            info.appendChild(namaEl);
            info.appendChild(metaEl);
            // Hapus button
            var delBtn = P.el('button', { class: 'pondasi-asset-del', title: 'Hapus gambar',
                html: P.icon('trash') });
            delBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                P.konfirmasi('Hapus gambar "' + asset.nama + '"?', function (ok) {
                    if (ok) {
                        P.deleteAsset(asset.id, function () {
                            P.renderAssetsList();
                            P.flash('Gambar dihapus');
                        });
                    }
                }, 'Hapus Gambar', 'Hapus', 'Batal');
            });
            // Klik item → copy URL
            item.addEventListener('click', function () {
                // Buat URL object untuk dipakai di block image
                var url = URL.createObjectURL(asset.blob);
                // Salin ke clipboard
                var tempInput = document.createElement('input');
                tempInput.value = asset.nama;
                document.body.appendChild(tempInput);
                tempInput.select();
                try { document.execCommand('copy'); P.flash('Nama file disalin: ' + asset.nama); }
                catch (e2) { P.flash('URL: ' + url); }
                document.body.removeChild(tempInput);
            });
            item.appendChild(thumb);
            item.appendChild(info);
            item.appendChild(delBtn);
            list.appendChild(item);
        });
    });
};

/* === Buka panel sidebar === */
P.tampilkanBukaPanel = function() {
    P.toggleSidebar('buka-panel', 'btn-buka', function () {
        P.renderRecentDokumen();
    });
};

/* === Navigasi halaman prev/next === */
P.pagePrev = function() {
    var idx = P.getCurrentPageIndex();
    var total = P.getPageCount();
    if (total < 2) return;
    if (idx <= 1) { P.flash('Sudah halaman pertama'); return; }
    var project = P.STATE.projects[P.STATE.currentProjectId];
    var targetPageId = project.pages[idx - 2].id;  // 0-based index = idx-2
    P.switchPage(targetPageId);
};

P.pageNext = function() {
    var idx = P.getCurrentPageIndex();
    var total = P.getPageCount();
    if (total < 2) return;
    if (idx >= total) { P.flash('Sudah halaman terakhir'); return; }
    var project = P.STATE.projects[P.STATE.currentProjectId];
    var targetPageId = project.pages[idx].id;  // 0-based index = idx (next)
    P.switchPage(targetPageId);
};

P.updatePageNavButtons = function() {
    var btnPrev = document.getElementById('footer-page-prev');
    var btnNext = document.getElementById('footer-page-next');
    var idx = P.getCurrentPageIndex();
    var total = P.getPageCount();
    if (btnPrev) btnPrev.disabled = (total < 2 || idx <= 1);
    if (btnNext) btnNext.disabled = (total < 2 || idx >= total);
};

/* === Simpan proyek ke berkas .json === */
P.simpanKeBerkas = function() {
    if (!P.STATE.currentProjectId) {
        P.flash('Tidak ada proyek aktif');
        return;
    }
    P.syncToProject();
    var project = P.STATE.projects[P.STATE.currentProjectId];
    // Bersihkan undoStack/redoStack dari setiap page (tidak perlu disimpan)
    var cleanedPages = project.pages.map(function(p) {
        var cp = P.deepCopy(p);
        delete cp.undoStack;
        delete cp.redoStack;
        return cp;
    });
    var exportData = {
        format: 'pondasi-project',
        version: 1,
        exportedAt: new Date().toISOString(),
        project: {
            id: project.id,
            name: project.name,
            pages: cleanedPages,
            currentPageId: project.currentPageId,
            cssExternal: project.cssExternal || [],
            settings: project.settings,
            createdAt: project.createdAt,
            modifiedAt: project.modifiedAt
        }
    };
    var json = JSON.stringify(exportData, null, 2);
    var nama = (project.name || 'proyek').toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!nama) nama = 'proyek';
    P.downloadFile(nama + '.json', json, 'application/json;charset=utf-8');
    P.tutupSidebarKiri();
    P.flash('Proyek disimpan ke berkas: ' + nama + '.json');
};

/* === Buka proyek dari berkas .json === */
P.bukaDariBerkas = function() {
    var fileInput = document.getElementById('buka-dari-berkas-file');
    if (!fileInput) {
        P.flash('File input tidak ditemukan');
        return;
    }
    // Reset value supaya bisa trigger change event untuk file yang sama
    fileInput.value = '';
    fileInput.click();
};

P.handleBukaDariBerkasChange = function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
        try {
            var data = JSON.parse(ev.target.result);
            if (!data || data.format !== 'pondasi-project' || !data.project) {
                P.flash('Format file tidak valid (bukan proyek Pondasi)');
                return;
            }
            P.importProjectFromJson(data.project);
        } catch (err) {
            P.flash('Gagal parse JSON: ' + err.message);
        }
    };
    reader.onerror = function() {
        P.flash('Gagal membaca file');
    };
    reader.readAsText(file);
};

/* === Import project dari JSON object === */
P.importProjectFromJson = function(projectData) {
    if (!projectData || !projectData.pages || projectData.pages.length === 0) {
        P.flash('Data proyek tidak valid');
        return;
    }
    // Generate new IDs supaya tidak bentrok dengan project existing
    var newProjectId = P.genProjectId();
    var oldToNewPageId = {};
    var newPages = projectData.pages.map(function(p) {
        var newPageId = P.genPageId();
        oldToNewPageId[p.id] = newPageId;
        var newPage = {
            id: newPageId,
            name: p.name || 'Halaman',
            tree: P.deepCopy(p.tree),
            customCSS: P.deepCopy(p.customCSS || {}),
            title: p.title || '',
            isMaster: !!p.isMaster,
            inheritFrom: null  // reset inherit (master link rusak setelah import)
        };
        // Beri ID baru ke region di tree
        P.beriIdBaruRegion(newPage.tree);
        // Tandai semua block sebagai non-inherited (karena master link sudah putus)
        (function walk(node) {
            if (node.blocks) {
                node.blocks.forEach(function(b) {
                    b._inherited = false;
                    b._originBlockId = null;
                });
            }
            if (node.children) node.children.forEach(walk);
        })(newPage.tree);
        return newPage;
    });
    var project = {
        id: newProjectId,
        name: projectData.name + ' (impor)',
        pages: newPages,
        currentPageId: newPages[0].id,
        cssExternal: P.deepCopy(projectData.cssExternal || []),
        settings: P.deepCopy(projectData.settings || P.defaultSettings()),
        createdAt: Date.now(),
        modifiedAt: Date.now()
    };
    P.STATE.projects[newProjectId] = project;
    P.STATE.currentProjectId = newProjectId;
    P.STATE.currentPageId = newPages[0].id;
    P.saveProjects();
    P.loadFromProject();
    if (P.applySettingsKeEditor) P.applySettingsKeEditor();
    P.render();
    if (P.renderPanel) P.renderPanel();
    if (P.updatePageIndicator) P.updatePageIndicator();
    P.tutupSidebarKiri();
    P.flash('Proyek "' + projectData.name + '" diimpor (' + newPages.length + ' halaman)');
};

/* === Klik badge halaman di footer → toggle popover === */
P.handleFooterPageClick = function(e) {
    var el = e.target.closest('#footer-page');
    if (!el) return;
    P.togglePagePanel();
};

/* === Klik tombol + di footer → tambah halaman === */
P.handleFooterPageAddClick = function(e) {
    P.tambahHalamanDariFooter();
};

/* === Klik tombol ✏️ di footer → rename halaman aktif === */
P.handleFooterPageRenameClick = function(e) {
    if (!P.STATE.currentProjectId) {
        P.flash('Tidak ada halaman aktif');
        return;
    }
    var page = P.getCurrentPage();
    if (!page) return;
    P.promptRenamePage(page.id);
};

/* === Klik X di page panel → tutup === */
P.handlePagePanelTutup = function(e) {
    P.tutupPagePanel();
};

/* ======================================================================
   CUSTOM DIALOG (tampilan.css style) — ganti confirm/prompt browser
   ====================================================================== */
P.dialogCallbackFn = null;  // callback yang di-set saat dialog tampil

P.tampilkanDialog = function(judul, isi, tombolOK, tombolBatal, callback) {
    var overlay = document.getElementById('pondasi-dialog');
    if (!overlay) {
        if (callback) callback(confirm(isi));
        return;
    }
    var judulEl = document.getElementById('pondasi-dialog-judul');
    var isiEl = document.getElementById('pondasi-dialog-isi');
    var kakiEl = document.getElementById('pondasi-dialog-kaki');
    if (!judulEl || !isiEl || !kakiEl) {
        if (callback) callback(confirm(isi));
        return;
    }
    judulEl.textContent = judul || 'Konfirmasi';
    isiEl.textContent = isi;
    var btns = kakiEl.querySelectorAll('button');
    if (btns[0]) btns[0].textContent = tombolBatal || 'Batal';
    if (btns[1]) btns[1].textContent = tombolOK || 'OK';
    overlay.style.display = 'block';
    overlay.classList.add('dialog-tampil');
    P.dialogCallbackFn = callback;
};

P.tutupDialog = function() {
    var overlay = document.getElementById('pondasi-dialog');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.classList.remove('dialog-tampil');
    }
};

// Dipanggil saat tombol OK/Batal diklik — proses callback lalu tutup
P.prosesDialog = function(ok) {
    P.tutupDialog();
    var cb = P.dialogCallbackFn;
    P.dialogCallbackFn = null;
    if (cb) cb(ok);
};

/* ======================================================================
   KONFIRMASI BUAT DOKUMEN — dari form Buat Dokumen Baru di sidebar
   ====================================================================== */
P.konfirmasiBuatDokumen = function() {
    var nama = (document.getElementById('buat-nama') || {}).value || '';
    nama = nama.trim().slice(0, 60);  // limit 60 char, trim whitespace
    if (!nama) { P.flash('Nama dokumen tidak boleh kosong'); return; }
    var dimensi = (document.getElementById('buat-dimensi') || {}).value || '1200';
    var judul = (document.getElementById('buat-judul') || {}).value || '';
    var tema = (document.getElementById('buat-tema') || {}).value || 'tampilan.css';
    var font = (document.getElementById('buat-font') || {}).value || '';
    var deskripsi = (document.getElementById('buat-deskripsi') || {}).value || '';
    var cssEksternal = (document.getElementById('buat-css-eksternal') || {}).value || '';
    cssEksternal = cssEksternal.trim();

    // Buat project baru dengan settings
    var settings = P.defaultSettings();
    settings.dimensi = dimensi;
    settings.judul = judul;
    settings.tema = tema;  // tema ID, mis. "pondasi-default"
    settings.fontFamily = font;
    settings.fontFamilies = font ? [font] : [];
    settings.deskripsi = deskripsi;

    var projectId = P.genProjectId();
    P.STATE.projects[projectId] = {
        id: projectId,
        name: nama,
        tree: P.nGrandParent(),
        customCSS: {},
        cssExternal: [],
        settings: settings,
        createdAt: Date.now(),
        modifiedAt: Date.now()
    };
    P.STATE.currentProjectId = projectId;

    // Kalau ada CSS eksternal, simpan + scan
    if (cssEksternal) {
        var inpEl = document.getElementById('buat-css-eksternal');
        var fileKey = inpEl ? inpEl.getAttribute('data-file-key') : null;
        var extEntry;

        if (fileKey && P.Scanner.cache.cssExternal[fileKey]) {
            // Dari file picker — ambil dari cache
            var cached = P.Scanner.cache.cssExternal[fileKey];
            extEntry = {
                url: cssEksternal,  // nama file sebagai identifier
                status: cached.status,
                error: cached.error,
                classes: cached.classes || [],
                categories: cached.categories || {},
                errors: cached.errors || [],
                rawText: cached.rawText || '',
                sumber: 'file-picker'
            };
            P.STATE.projects[projectId].cssExternal.push(extEntry);
            P.saveProjects();
            var cnt = extEntry.classes ? extEntry.classes.filter(function (k) { return k.valid; }).length : 0;
            P.flash('CSS dari file picker dimuat: ' + cnt + ' kelas valid');
        } else {
            // Dari URL/path — fetch via XHR
            extEntry = {
                url: cssEksternal,
                status: 'loading',
                error: null,
                classes: [],
                categories: {},
                errors: [],
                sumber: 'url'
            };
            P.STATE.projects[projectId].cssExternal.push(extEntry);
            // Scan async
            P.Scanner.fetchDanScanCSS(cssEksternal, function (result) {
                extEntry.status = result.status;
                extEntry.error = result.error;
                extEntry.classes = result.classes || [];
                extEntry.categories = result.categories || [];
                extEntry.errors = result.errors || [];
                extEntry.rawText = result.rawText || '';
                    if (P.Scanner && P.Scanner.extractColorsFromCSS) P.Scanner.extractColorsFromCSS(result.rawText || '');
                P.saveProjects();
                if (result.status === 'ok') {
                    var cnt2 = extEntry.classes ? extEntry.classes.filter(function (k) { return k.valid; }).length : 0;
                    P.flash('CSS eksternal dimuat: ' + cnt2 + ' kelas valid');
                } else {
                    P.flash('CSS eksternal gagal: ' + result.error);
                }
            });
        }
    }

    P.saveProjects();
    P.loadFromProject();
    P.applySettingsKeEditor();
    P.render();
    P.tutupSidebarKiri();
    P.flash('Dokumen "' + nama + '" dibuat');
};

/* === KONFIRMASI BUAT PROYEK BARU === */
/* Buat project dengan jumlah halaman sesuai input user. Halaman pertama "Beranda", sisanya "Halaman 2, 3, ...". */
P.konfirmasiBuatProyek = function() {
    var nama = (document.getElementById('buatproyek-nama') || {}).value || '';
    nama = nama.trim().slice(0, 60);
    if (!nama) { P.flash('Nama proyek tidak boleh kosong'); return; }
    // Jumlah halaman
    var jmlInput = document.getElementById('buatproyek-jml-halaman');
    var jml = jmlInput ? parseInt(jmlInput.value, 10) : 1;
    if (isNaN(jml) || jml < 1) jml = 1;
    if (jml > 50) jml = 50;
    var dimensi = (document.getElementById('buatproyek-dimensi') || {}).value || '1200';
    var judul = (document.getElementById('buatproyek-judul') || {}).value || '';
    var tema = (document.getElementById('buatproyek-tema') || {}).value || 'tampilan.css';
    var font = (document.getElementById('buatproyek-font') || {}).value || '';
    var deskripsi = (document.getElementById('buatproyek-deskripsi') || {}).value || '';
    var cssEksternal = (document.getElementById('buatproyek-css-eksternal') || {}).value || '';
    cssEksternal = cssEksternal.trim();

    var settings = P.defaultSettings();
    settings.dimensi = dimensi;
    settings.judul = judul;
    settings.tema = tema;
    settings.fontFamily = font;
    settings.fontFamilies = font ? [font] : [];
    settings.deskripsi = deskripsi;

    // Buat N halaman sesuai input
    var pages = [];
    for (var i = 0; i < jml; i++) {
        var pId = P.genPageId();
        var pageName = (i === 0) ? 'Beranda' : ('Halaman ' + (i + 1));
        pages.push({
            id: pId,
            name: pageName,
            tree: P.nGrandParent(),
            customCSS: {}
        });
    }

    var projectId = P.genProjectId();
    P.STATE.projects[projectId] = {
        id: projectId,
        name: nama,
        pages: pages,
        currentPageId: pages[0].id,
        cssExternal: [],
        settings: settings,
        createdAt: Date.now(),
        modifiedAt: Date.now()
    };
    P.STATE.currentProjectId = projectId;
    P.STATE.currentPageId = pages[0].id;

    // Handle CSS eksternal (sama dengan konfirmasiBuatDokumen)
    if (cssEksternal) {
        var inpEl = document.getElementById('buatproyek-css-eksternal');
        var fileKey = inpEl ? inpEl.getAttribute('data-file-key') : null;
        var extEntry;
        if (fileKey && P.Scanner.cache.cssExternal[fileKey]) {
            var cached = P.Scanner.cache.cssExternal[fileKey];
            extEntry = {
                url: cssEksternal,
                status: cached.status,
                error: cached.error,
                classes: cached.classes || [],
                categories: cached.categories || {},
                errors: cached.errors || [],
                rawText: cached.rawText || '',
                sumber: 'file-picker'
            };
            P.STATE.projects[projectId].cssExternal.push(extEntry);
        } else {
            extEntry = {
                url: cssEksternal,
                status: 'loading',
                error: null,
                classes: [],
                categories: {},
                errors: [],
                sumber: 'url'
            };
            P.STATE.projects[projectId].cssExternal.push(extEntry);
            P.Scanner.fetchDanScanCSS(cssEksternal, function (result) {
                extEntry.status = result.status;
                extEntry.error = result.error;
                extEntry.classes = result.classes || [];
                extEntry.categories = result.categories || [];
                extEntry.errors = result.errors || [];
                extEntry.rawText = result.rawText || '';
                    if (P.Scanner && P.Scanner.extractColorsFromCSS) P.Scanner.extractColorsFromCSS(result.rawText || '');
                P.saveProjects();
            });
        }
    }

    P.saveProjects();
    P.loadFromProject();
    P.applySettingsKeEditor();
    P.render();
    P.tutupSidebarKiri();
    P.updatePageIndicator();
    var info = jml === 1 ? '1 halaman' : (jml + ' halaman');
    P.flash('Proyek "' + nama + '" dibuat dengan ' + info + '. Kelola halaman via ikon + di footer.');
};

/* === TRIGGER SCAN CSS EKSTERNAL SAAT USER INPUT === */
P.cekCssEksternalInput = function() {
    var inp = document.getElementById('buat-css-eksternal');
    var statusEl = document.getElementById('buat-css-eksternal-status');
    var ketEl = document.getElementById('buat-css-eksternal-keterangan');
    if (!inp || !statusEl) return;
    var url = inp.value.trim();
    if (!url) {
        // Kosong — reset status & keterangan
        statusEl.className = 'pondasi-scan-status';
        statusEl.innerHTML = '';
        statusEl.title = '';
        if (ketEl) { ketEl.className = 'pondasi-scan-keterangan'; ketEl.innerHTML = ''; }
        return;
    }
    // Tampilkan loading
    statusEl.className = 'pondasi-scan-status pondasi-scan-loading';
    statusEl.innerHTML = '...';
    statusEl.title = 'Memindai berkas...';
    if (ketEl) {
        ketEl.className = 'pondasi-scan-keterangan pondasi-scan-keterangan-loading';
        ketEl.innerHTML = 'Memindai berkas CSS...';
    } else {
        console.warn('[pondasi Scanner] ketEl null — element #buat-css-eksternal-keterangan tidak ditemukan di DOM');
    }
    // Scan
    P.Scanner.fetchDanScanCSS(url, function (result) {
        if (result.status === 'ok') {
            var kelasValid = result.classes ? result.classes.filter(function (k) { return k.valid; }).length : 0;
            var kelasInvalid = result.classes ? result.classes.filter(function (k) { return !k.valid; }).length : 0;
            var totalKategori = result.categories ? Object.keys(result.categories).length : 0;
            if (kelasInvalid === 0) {
                statusEl.className = 'pondasi-scan-status pondasi-scan-ok';
                statusEl.innerHTML = '&check;';
                statusEl.title = 'Berkas valid';
                if (ketEl) {
                    ketEl.className = 'pondasi-scan-keterangan pondasi-scan-keterangan-ok';
                    ketEl.innerHTML = '<strong>Berkas valid.</strong> ' + kelasValid + ' kelas ditemukan' +
                        (totalKategori > 0 ? ' dalam ' + totalKategori + ' kategori' : '') +
                        '. Semua kelas siap dipakai di dropdown.';
                }
            } else {
                statusEl.className = 'pondasi-scan-status pondasi-scan-warning';
                statusEl.innerHTML = '!';
                statusEl.title = kelasValid + ' kelas valid, ' + kelasInvalid + ' di-skip';
                if (ketEl) {
                    ketEl.className = 'pondasi-scan-keterangan pondasi-scan-keterangan-warning';
                    var detailErrors = result.errors.slice(0, 3).map(function (e) {
                        return '.' + e.kelas + ' &rarr; ' + e.pesan;
                    }).join('; ');
                    var sisaErrors = result.errors.length > 3 ? ' (+' + (result.errors.length - 3) + ' lagi)' : '';
                    ketEl.innerHTML = '<strong>Berkas termuat, tapi ada pelanggaran.</strong> ' +
                        kelasValid + ' kelas valid, ' + kelasInvalid + ' kelas di-skip (tidak masuk dropdown). ' +
                        'Pelanggaran: ' + detailErrors + sisaErrors + '. ' +
                        'Perbaiki berkas CSS Anda supaya kelas yang di-skip bisa dipakai.';
                }
            }
        } else {
            statusEl.className = 'pondasi-scan-status pondasi-scan-error';
            statusEl.innerHTML = '&times;';
            statusEl.title = result.error || 'Gagal memuat berkas';
            if (ketEl) {
                ketEl.className = 'pondasi-scan-keterangan pondasi-scan-keterangan-error';
                var pesanError = result.error || 'Gagal memuat berkas';
                var saran = '';
                if (pesanError.indexOf('network error') >= 0 || pesanError.indexOf('HTTP 0') >= 0) {
                    saran = ' Mungkin path tidak bisa diakses. Jangan gunakan file:// &mdash; browser blokir akses file lokal dari http. ' +
                        'Letakkan berkas CSS di folder yang dilayani server PHP, lalu pakai URL http atau path relatif (mis. "berkas.css" atau "./css/berkas.css"). ' +
                        'Atau klik tombol "..." di sebelah input untuk pilih file langsung dari harddisk.';
                } else if (pesanError.indexOf('HTTP 404') >= 0) {
                    saran = ' Berkas tidak ditemukan. Periksa path/URL. Pastikan berkas ada di folder server PHP.';
                } else if (pesanError.indexOf('HTTP 403') >= 0) {
                    saran = ' Akses ditolak. Cek permission berkas.';
                } else if (pesanError.indexOf('CORS') >= 0 || pesanError.indexOf('cross-origin') >= 0) {
                    saran = ' Browser blokir karena beda origin. Pakai file picker (tombol "..." di sebelah input) sebagai gantinya.';
                }
                ketEl.innerHTML = '<strong>Gagal memuat berkas.</strong> ' + pesanError + '.' + saran;
            }
        }
    });
};

/* === FILE PICKER: pilih file CSS dari harddisk (tidak perlu URL) === */
P.pilihFileCSS = function() {
    var fileInput = document.getElementById('buat-css-eksternal-file');
    if (fileInput) {
        // Reset value supaya change event tetap trigger walau pilih file yang sama
        fileInput.value = '';
        try {
            fileInput.click();
        } catch (e) {
            console.error('[pondasi Scanner] error saat fileInput.click():', e.message);
        }
    } else {
        console.error('[pondasi Scanner] fileInput tidak ditemukan di DOM');
    }
};

/* === HANDLE FILE CSS DIPILIH LEWAT FILE PICKER === */
P.handleFileCSSDipilih = function() {
    var fileInput = document.getElementById('buat-css-eksternal-file');
    var inp = document.getElementById('buat-css-eksternal');
    var statusEl = document.getElementById('buat-css-eksternal-status');
    var ketEl = document.getElementById('buat-css-eksternal-keterangan');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) return;
    var file = fileInput.files[0];
    var namaFile = file.name;
    var ukuranKB = Math.round(file.size / 1024);

    // Tampilkan loading
    statusEl.className = 'pondasi-scan-status pondasi-scan-loading';
    statusEl.innerHTML = '...';
    statusEl.title = 'Memindai berkas...';
    if (ketEl) {
        ketEl.className = 'pondasi-scan-keterangan pondasi-scan-keterangan-loading';
        ketEl.innerHTML = 'Memindai <strong>' + namaFile + '</strong> (' + ukuranKB + ' KB)...';
    }

    // Baca isi file via FileReader API
    var reader = new FileReader();
    reader.onload = function(e) {
        var cssText = e.target.result;
        // Scan langsung string CSS (tidak perlu fetch)
        var scanResult = P.Scanner.scanCSSString(cssText);
        var result = {
            status: 'ok',
            error: null,
            rawText: cssText,
            classes: scanResult.kelas,
            categories: scanResult.kategori,
            errors: scanResult.errors,
            valid: scanResult.valid,
            namaFile: namaFile  // simpan nama file supaya tahu ini dari file picker
        };

        // Update input field dengan nama file (bukan path, karena FileReader tidak punya path)
        if (inp) inp.value = namaFile;

        // Update status & keterangan
        var kelasValid = result.classes ? result.classes.filter(function (k) { return k.valid; }).length : 0;
        var kelasInvalid = result.classes ? result.classes.filter(function (k) { return !k.valid; }).length : 0;
        var totalKategori = result.categories ? Object.keys(result.categories).length : 0;

        if (kelasInvalid === 0) {
            statusEl.className = 'pondasi-scan-status pondasi-scan-ok';
            statusEl.innerHTML = '&check;';
            statusEl.title = 'Berkas valid';
            if (ketEl) {
                ketEl.className = 'pondasi-scan-keterangan pondasi-scan-keterangan-ok';
                ketEl.innerHTML = '<strong>Berkas valid.</strong> ' + namaFile + ' (' + ukuranKB + ' KB). ' +
                    kelasValid + ' kelas ditemukan' +
                    (totalKategori > 0 ? ' dalam ' + totalKategori + ' kategori' : '') +
                    '. Semua kelas siap dipakai di dropdown.';
            }
        } else {
            statusEl.className = 'pondasi-scan-status pondasi-scan-warning';
            statusEl.innerHTML = '!';
            statusEl.title = kelasValid + ' kelas valid, ' + kelasInvalid + ' di-skip';
            if (ketEl) {
                ketEl.className = 'pondasi-scan-keterangan pondasi-scan-keterangan-warning';
                var detailErrors = result.errors.slice(0, 3).map(function (e) {
                    return '.' + e.kelas + ' → ' + e.pesan;
                }).join('; ');
                var sisaErrors = result.errors.length > 3 ? ' (+' + (result.errors.length - 3) + ' lagi)' : '';
                ketEl.innerHTML = '<strong>Berkas termuat, tapi ada pelanggaran.</strong> ' +
                    namaFile + ' (' + ukuranKB + ' KB). ' +
                    kelasValid + ' kelas valid, ' + kelasInvalid + ' kelas di-skip (tidak masuk dropdown). ' +
                    'Pelanggaran: ' + detailErrors + sisaErrors + '. ' +
                    'Perbaiki berkas CSS Anda supaya kelas yang di-skip bisa dipakai.';
            }
        }

        // Simpan ke cache scanner dengan key khusus (namaFile + timestamp)
        var cacheKey = 'file:' + namaFile + ':' + Date.now();
        P.Scanner.cache.cssExternal[cacheKey] = result;
        // Tandai input dengan data attribute supaya saat konfirmasiBuatDokumen tahu ini file picker
        if (inp) inp.setAttribute('data-file-key', cacheKey);
        // Hapus data-file-key sebelumnya (kalau user ganti input manual)
    };
    reader.onerror = function() {
        statusEl.className = 'pondasi-scan-status pondasi-scan-error';
        statusEl.innerHTML = '&times;';
        statusEl.title = 'Gagal membaca berkas';
        if (ketEl) {
            ketEl.className = 'pondasi-scan-keterangan pondasi-scan-keterangan-error';
            ketEl.innerHTML = '<strong>Gagal membaca berkas.</strong> ' + namaFile + ' tidak bisa dibaca. Coba pilih ulang.';
        }
    };
    reader.readAsText(file);
};

/* ======================================================================
   GANTI confirm() dengan custom dialog — helper
   ====================================================================== */
P.konfirmasi = function(pesan, callback, judul, tombolOK, tombolBatal) {
    P.tampilkanDialog(judul || 'Konfirmasi', pesan, tombolOK || 'OK', tombolBatal || 'Batal', callback);
};

P.initProjectUI = function() {
    P.applySettingsKeEditor();
};

P.semuaModalTutup = function() {
    if (P.sidebarAktif) return false;
    var modals = ['help-modal', 'swatches-modal'];
    for (var i = 0; i < modals.length; i++) {
        var m = document.getElementById(modals[i]);
        if (m && !m.hidden) return false;
    }
    // Cek custom dialog — pakai inline style display (bukan [hidden])
    var dlg = document.getElementById('pondasi-dialog');
    if (dlg && dlg.style.display !== 'none') return false;
    // Cek preview overlay
    var prev = document.getElementById('preview-overlay');
    if (prev && prev.style.display !== 'none' && P.previewVisible) return false;
    return true;
};

/* === EXPORT AS ZIP FOLDER STRUCTURE === */
/* Buat ZIP dengan struktur folder: nama_proyek/css/js/gambar/index.html */
P.exportAsZipFolder = function(nama) {
    if (typeof PondasiZip === 'undefined') {
        P.flash('PondasiZip tidak tersedia');
        return;
    }
    P.flash('Membuat ZIP folder structure...');

    var expAllPages = document.getElementById('export-all-pages');
    var exportAll = expAllPages && expAllPages.checked;
    var project = P.STATE.projects[P.STATE.currentProjectId];
    if (!project) { P.flash('Tidak ada proyek aktif'); return; }

    // Sync halaman aktif dulu
    P.syncToProject();

    // Tentukan daftar halaman yang akan di-export
    var pagesToExport;
    if (exportAll && project.pages.length > 1) {
        pagesToExport = project.pages;
    } else {
        pagesToExport = [P.getCurrentPage()];
    }

    // Sanitasi nama file
    function sanitizeFilename(s) {
        s = String(s || '').toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        return s || 'halaman';
    }

    var folderName = sanitizeFilename(nama);
    var zip = new PondasiZip();

    // Cek apakah perlu pondasi-aksi.js (jika ada block dinamis/aksi)
    function pageHasAksi(tree) {
        if (!tree) return false;
        var found = false;
        (function walk(node) {
            if (found) return;
            if (node.blocks) {
                for (var i = 0; i < node.blocks.length; i++) {
                    var b = node.blocks[i];
                    if (b.aksi && (b.aksi.klik || b.aksi.scroll || b.aksi.tambahan)) { found = true; return; }
                    if (b.jenis === 'jam' || b.jenis === 'tanggal' || b.jenis === 'hitung-mundur') { found = true; return; }
                }
            }
            if (node.children) node.children.forEach(walk);
        })(tree);
        return found;
    }

    var perluAksiJs = false;
    for (var pi = 0; pi < pagesToExport.length; pi++) {
        if (pageHasAksi(pagesToExport[pi].tree)) { perluAksiJs = true; break; }
    }

    // Generate HTML per halaman, dengan path relatif css/ dan js/
    // Save original state supaya bisa restore
    var savedTree = P.STATE.tree;
    var savedCSS = P.STATE.customCSS;
    var savedPageId = P.STATE.currentPageId;

    for (var i = 0; i < pagesToExport.length; i++) {
        var page = pagesToExport[i];
        // Swap state
        P.STATE.tree = page.tree;
        P.STATE.customCSS = page.customCSS || {};
        P.STATE.currentPageId = page.id;

        var html = P.generateExportHTMLForFolder(perluAksiJs);
        var htmlFilename;
        if (pagesToExport.length === 1) {
            htmlFilename = folderName + '/index.html';
        } else {
            var namaFile = sanitizeFilename(page.name);
            if (i === 0) namaFile = 'index';
            htmlFilename = folderName + '/' + namaFile + '.html';
        }
        zip.addFile(htmlFilename, html);
    }

    // Restore state
    P.STATE.tree = savedTree;
    P.STATE.customCSS = savedCSS;
    P.STATE.currentPageId = savedPageId;

    // Tambah file CSS ke folder css/
    // 1. pondasi.css (framework — embed inline karena tidak punya akses ke file dari JS)
    //    Untuk kasus ini, kita tulis note di README supaya user salin manual dari folder pondasi
    //    ATAU kita bisa fetch via XHR (kalau server mode) — tapi untuk file://, salin manual.
    //    Solusi: tulis placeholder note di README.

    // 2. tampilan.css (tema) — sama, salin manual

    // 3. pondasi-custom.css (CSS user) — generate dari STATE.customCSS
    var customCSS = P.generateCustomCSS();
    if (customCSS && customCSS !== '/* Belum ada kelas kustom */\n') {
        zip.addFile(folderName + '/css/pondasi-custom.css', customCSS);
    }

    // 4. pondasi-aksi.css & pondasi-aksi.js (jika perlu)
    if (perluAksiJs) {
        // Untuk file:// mode, kita tidak bisa fetch file dari js/pondasi-aksi.js
        // Solusi: tulis note di README. Atau, untuk simplicity, biarkan user copy manual.
        // Alternative: bisa pakai XMLHTTPRequest untuk fetch file lokal (kalau di http server).
        // Untuk v114, kita beri note di README supaya user copy manual.
    }

    // 5. README.txt dengan instruksi
    var readme = 'PROYEK: ' + nama + '\n';
    readme += 'Dibuat dengan: Pondasi Web Builder v117\n';
    readme += 'Tanggal: ' + new Date().toLocaleString('id-ID') + '\n';
    readme += 'Halaman: ' + pagesToExport.length + '\n';
    readme += '\n';
    readme += '=== STRUKTUR FOLDER ===\n';
    readme += folderName + '/\n';
    readme += '  index.html              ← halaman utama (buka ini di browser)\n';
    if (pagesToExport.length > 1) {
        for (var k = 0; k < pagesToExport.length; k++) {
            var p = pagesToExport[k];
            var namaFile = sanitizeFilename(p.name);
            if (k === 0) continue;  // index.html sudah di-list
            readme += '  ' + namaFile + '.html' + '         ← ' + p.name + '\n';
        }
    }
    readme += '  css/\n';
    readme += '    pondasi.css          ← framework (SALIN dari folder pondasi)\n';
    readme += '    tampilan.css          ← tema lengkap (SALIN dari folder pondasi/css)\n';
    if (perluAksiJs) {
        readme += '    pondasi-aksi.css     ← CSS untuk aksi JS (SALIN dari folder pondasi/css)\n';
    }
    if (customCSS && customCSS !== '/* Belum ada kelas kustom */\n') {
        readme += '    pondasi-custom.css   ← CSS kustom Anda (sudah include di ZIP)\n';
    }
    readme += '  js/\n';
    if (perluAksiJs) {
        readme += '    pondasi-aksi.js      ← runtime JS untuk aksi (SALIN dari folder pondasi/js)\n';
    }
    readme += '  gambar/                 ← gambar Anda (sudah include di ZIP dari Asset Manager)\n';
    readme += '  svg/                    ← ikon svg (buat manual kalau perlu)\n';
    readme += '  fonts/                  ← font kustom (buat manual kalau perlu)\n';
    readme += '  README.txt              ← file ini\n';
    readme += '\n';
    readme += '=== CARA PAKAI ===\n';
    readme += '1. Ekstrak ZIP ini ke folder tujuan\n';
    readme += '2. Salin file berikut dari folder Pondasi ke folder ini:\n';
    readme += '   - css/pondasi.css\n';
    readme += '   - css/tampilan.css\n';
    if (perluAksiJs) {
        readme += '   - css/pondasi-aksi.css\n';
        readme += '   - js/pondasi-aksi.js\n';
    }
    readme += '3. Buka index.html di browser\n';
    readme += '4. Untuk deploy: upload semua file ke server (Apache/Nginx/static hosting)\n';
    readme += '\n';
    readme += '=== FILE YANG SUDAH INCLUDE DI ZIP ===\n';
    readme += '- index.html (+ halaman lain kalau multi-page)\n';
    readme += '- css/pondasi-custom.css (CSS kustom Anda)\n';
    readme += '- gambar/* (gambar dari Asset Manager, sudah dikompres)\n';
    readme += '- README.txt (file ini)\n';
    readme += '\n';
    readme += '=== FILE YANG PERLU DISALIN MANUAL ===\n';
    readme += 'File-file framework/tema tidak bisa di-embed otomatis karena keterbatasan browser.\n';
    readme += 'Salin dari folder aplikasi Pondasi Anda (folder css/ dan js/).\n';
    readme += '\n';
    readme += '=== INFO TEKNIS ===\n';
    readme += '- Format: HTML5 + CSS 2.1/3.0 (no flex/grid, pakai float)\n';
    readme += '- JavaScript: ES5 murni (kompatibel browser lama)\n';
    readme += '- Tanpa dependensi eksternal\n';
    readme += '- Bisa dibuka via file:// (offline) atau server\n';

    // v117: Tambah gambar dari IndexedDB ke folder gambar/ sebelum finalisasi ZIP
    // Karena listAssets async, kita pakai callback
    P.flash('Mengumpulkan gambar dari Asset Manager...');
    if (!P.STATE.currentProjectId || !P.listAssets) {
        // Tidak ada asset API — lanjut tanpa gambar
        finalizeZipWithReadme();
        return;
    }
    P.listAssets(P.STATE.currentProjectId, function (assets, assetErr) {
        if (assetErr || !assets || assets.length === 0) {
            // Tidak ada gambar — lanjut
            finalizeZipWithReadme();
            return;
        }
        // Konversi blob ke Uint8Array untuk ZIP
        var pending = assets.length;
        assets.forEach(function (asset) {
            var reader = new FileReader();
            reader.onload = function (ev) {
                try {
                    var u8 = new Uint8Array(ev.target.result);
                    zip.addFile(folderName + '/gambar/' + asset.nama, u8);
                } catch (e) {
                    console.error('Gagal add gambar ke ZIP:', asset.nama, e);
                }
                pending--;
                if (pending <= 0) finalizeZipWithReadme();
            };
            reader.onerror = function () {
                pending--;
                if (pending <= 0) finalizeZipWithReadme();
            };
            reader.readAsArrayBuffer(asset.blob);
        });
    });

    function finalizeZipWithReadme() {
        // Tambah README setelah gambar
        zip.addFile(folderName + '/README.txt', readme);
        // Tambah folder placeholder untuk svg/ dan fonts/
        zip.addFile(folderName + '/svg/.gitkeep', 'Taruh file SVG ikon di sini');
        zip.addFile(folderName + '/fonts/.gitkeep', 'Taruh file font (.woff, .woff2, .ttf) di sini');
        // Generate ZIP dan trigger download
        var blob = zip.generateBlob();
        if (P.downloadFile) {
            P.downloadFile(folderName + '.zip', blob, 'application/zip');
        }
        P.tutupSidebarKiri();
        var fileCount = zip.files.length;
        P.flash('ZIP dibuat: ' + folderName + '.zip (' + fileCount + ' file)');
    }
};

/* === Generate HTML untuk export dengan path folder (css/ dan js/) === */
P.generateExportHTMLForFolder = function(perluAksiJs) {
    var settings = P.getProjectSettings();
    var perluCustomLink = Object.keys(P.STATE.customCSS).length > 0;
    if (typeof P.generateBlockPseudoCSSForExport === 'function') {
        if (P.generateBlockPseudoCSSForExport()) perluCustomLink = true;
    }
    var customLink = perluCustomLink ? '    <link rel="stylesheet" href="css/pondasi-custom.css">\n' : '';

    var escA = function(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); };
    var escH = function(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };

    var title = P.getPageJudul ? P.getPageJudul() : (settings.judul || P.getProjectName() || 'Dibuat dengan pondasi');

    // Path ke tema CSS — pakai css/ prefix (di folder yang sama dengan HTML)
    var temaLinksStr = '';
    temaLinksStr += '    <link rel="stylesheet" href="css/pondasi.css">\n';
    temaLinksStr += '    <link rel="stylesheet" href="css/tampilan.css">\n';

    var cssLinksStr = '';
    if (settings.cssLinks && settings.cssLinks.length > 0) {
        settings.cssLinks.forEach(function (href) {
            cssLinksStr += '    <link rel="stylesheet" href="' + escA(href) + '">\n';
        });
    }

    var scriptsStr = '';
    if (settings.scripts && settings.scripts.length > 0) {
        settings.scripts.forEach(function (sc) {
            scriptsStr += '    <script src="' + escA(sc.src) + '"' + (sc.defer ? ' defer' : '') + (sc.async ? ' async' : '') + '></script>\n';
        });
    }

    // Body attributes
    var bodyAttrs = '';
    if (settings.temaWarna === 'gelap') bodyAttrs += ' data-tema="gelap"';
    if (settings.dimensi) bodyAttrs += ' data-dimensi="' + escA(settings.dimensi) + '"';

    var bodyStyle = '';
    if (settings.fontFamily) bodyStyle += ' style="font-family: ' + escA(settings.fontFamily) + ';"';

    // Meta tags
    var metaTags = '';
    metaTags += '    <meta charset="' + escA(settings.charset || 'UTF-8') + '">\n';
    metaTags += '    <meta name="viewport" content="' + escA(settings.viewport) + '">\n';
    if (settings.deskripsi) metaTags += '    <meta name="description" content="' + escA(settings.deskripsi) + '">\n';
    if (settings.robots) metaTags += '    <meta name="robots" content="' + escA(settings.robots) + '">\n';

    var aksiJsStr = perluAksiJs ?
        '    <link rel="stylesheet" href="css/pondasi-aksi.css">\n' +
        '    <script src="js/pondasi-aksi.js"></script>\n' +
        '    <script>PondasiAksi.init(document);</script>\n' : '';

    return '<!DOCTYPE html>\n' +
'<html lang="' + escA(settings.bahasa || 'id') + '">\n' +
'<head>\n' +
metaTags +
'    <title>' + escH(title) + '</title>\n' +
temaLinksStr +
cssLinksStr +
customLink +
(aksiJsStr ? aksiJsStr.split('\n')[0] + '\n' : '') +
'</head>\n' +
'<body' + bodyAttrs + bodyStyle + '>\n' +
P.serializeNode(P.STATE.tree, 1) +
scriptsStr +
(perluAksiJs ? '    <script src="js/pondasi-aksi.js"></script>\n    <script>PondasiAksi.init(document);</script>\n' : '') +
'</body>\n' +
'</html>\n';
};
