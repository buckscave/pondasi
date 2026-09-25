/* PONDASI-INIT.JS */
var P = P || {};

    /* ======================================================================
       INIT
       ====================================================================== */
    P.init = function() {
        console.log('pondasi init v143 — mulai (multi-dokumen: fix persistensi delete, z-index, edit mode stale, settings apply, dead code cleanup)');

        // Cek storage mode dulu (deteksi PHP server)
        P.cekStorage(function (mode) {
            console.log('pondasi: storage mode =', mode);

            // Populate datalist untuk autocomplete properti CSS
            if (P.CSS_SPEC && P.CSS_SPEC.properti) {
                var dl = document.getElementById('pondasi-css-properti-list');
                if (dl) {
                    var props = Object.keys(P.CSS_SPEC.properti).sort();
                    var html = '';
                    for (var i = 0; i < props.length; i++) {
                        html += '<option value="' + props[i] + '"></option>';
                    }
                    dl.innerHTML = html;
                    console.log('[pondasi] datalist properti CSS:', props.length, 'item');
                }
            }

            // Populate datalists untuk autocomplete value CSS
            if (P.populateValueDatalists) {
                P.populateValueDatalists();
            }

            // Load tema manifest (async)
            if (P.Tema) {
                P.Tema.loadManifest(function (tema) {
                    if (tema) {
                        console.log('pondasi: tema dimuat:', tema.nama, '(' + tema.berkas.length + ' berkas)');
                    }
                    // Scan tema CSS untuk dapatkan rules + pseudo per kelas
                    if (P.Scanner && P.Scanner.scanTemaCSS) {
                        P.Scanner.scanTemaCSS(function () {
                            console.log('pondasi: tema CSS di-scan');
                            lanjutInit(mode);
                        });
                    } else {
                        lanjutInit(mode);
                    }
                });
            } else {
                lanjutInit(mode);
            }
        });

        function lanjutInit(mode) {
            try {
                // Load projects dari storage (server atau localStorage)
                if (mode === 'server') {
                    P.storageLoad(function (success) {
                        console.log('pondasi: projects loaded from server, success =', success);
                        P.initAfterLoad();
                    });
                } else {
                    P.loadProjects();
                    P.migrateLegacy();
                    console.log('pondasi: projects loaded from localStorage');
                    P.initAfterLoad();
                }
            } catch (e) {
                console.error('pondasi init error:', e);
                // Fallback: clear localStorage lama, buat project baru
                console.log('pondasi: clearing localStorage and creating new project');
                try {
                    localStorage.removeItem('pondasi.projects.v2');
                    localStorage.removeItem('pondasi.current.v2');
                    localStorage.removeItem('pondasi.tree.v1');
                    localStorage.removeItem('pondasi.customcss.v1');
                } catch (e2) {}
                P.STATE.projects = {};
                P.STATE.currentProjectId = null;
                P.newProject('Proyek tanpa judul');
                P.render();
                P.registerListeners();
            }
        }
    };

    P.registerListeners = function() {
        // Pastikan listeners hanya terdaftar sekali
        if (P._listenersRegistered) return;
        P._listenersRegistered = true;

        document.addEventListener('keydown', function(e) {
            if (P.handleKey) P.handleKey(e);
        });
        document.body.addEventListener('click', function(e) {
            if (P.handleFloating) P.handleFloating(e);
        });
        document.body.addEventListener('click', function(e) {
            if (P.handleFloatingKiri) P.handleFloatingKiri(e);
        });
        // v116: floating kanan untuk canvas tools + code view
        document.body.addEventListener('click', function(e) {
            if (P.handleFloatingKanan) P.handleFloatingKanan(e);
        });
        // Footer page badge → toggle popover
        var footerPage = document.getElementById('footer-page');
        if (footerPage && P.handleFooterPageClick) {
            footerPage.addEventListener('click', P.handleFooterPageClick);
        }
        // Footer page nav buttons (< >)
        var footerPagePrev = document.getElementById('footer-page-prev');
        if (footerPagePrev) footerPagePrev.addEventListener('click', function () { P.pagePrev(); });
        var footerPageNext = document.getElementById('footer-page-next');
        if (footerPageNext) footerPageNext.addEventListener('click', function () { P.pageNext(); });
        // Footer + icon → tambah halaman
        var footerAdd = document.getElementById('footer-page-add');
        if (footerAdd && P.handleFooterPageAddClick) {
            footerAdd.addEventListener('click', P.handleFooterPageAddClick);
        }
        // Footer ✏️ icon → rename halaman aktif
        var footerRename = document.getElementById('footer-page-rename');
        if (footerRename && P.handleFooterPageRenameClick) {
            footerRename.addEventListener('click', P.handleFooterPageRenameClick);
        }
        // Page panel X → tutup
        var pagePanelTutup = document.getElementById('page-panel-tutup');
        if (pagePanelTutup && P.handlePagePanelTutup) {
            pagePanelTutup.addEventListener('click', P.handlePagePanelTutup);
        }
        // File picker untuk "Buka dari Berkas"
        var bukaFileInput = document.getElementById('buka-dari-berkas-file');
        if (bukaFileInput && P.handleBukaDariBerkasChange) {
            bukaFileInput.addEventListener('change', P.handleBukaDariBerkasChange);
        }
        // v116: File picker untuk assets gambar
        var assetsFileInput = document.getElementById('assets-gambar-file');
        if (assetsFileInput && P.handleAssetsGambarChange) {
            assetsFileInput.addEventListener('change', P.handleAssetsGambarChange);
        }
        // v116: Code view buttons
        var cvClose = document.getElementById('codeview-close');
        if (cvClose) cvClose.addEventListener('click', function () { P.tutupCodeView(); });
        var cvApply = document.getElementById('codeview-apply');
        if (cvApply) cvApply.addEventListener('click', function () { P.applyCodeView(); });
        var cvCopy = document.getElementById('codeview-copy');
        if (cvCopy) cvCopy.addEventListener('click', function () { P.copyCodeView(); });
        // Code view tab buttons
        var cvTabs = document.querySelectorAll('.pondasi-codeview-tab');
        for (var tvi = 0; tvi < cvTabs.length; tvi++) {
            cvTabs[tvi].addEventListener('click', function (e) {
                P.setCodeViewTab(e.target.dataset.cvTab || e.target.parentNode.dataset.cvTab);
            });
        }
        // Code view: Esc untuk tutup
        document.addEventListener('keydown', function (e) {
            var cvOverlay = document.getElementById('codeview-overlay');
            if (!cvOverlay || cvOverlay.hasAttribute('hidden')) return;
            if (e.key === 'Escape' || e.keyCode === 27) {
                // Jangan tutup kalau sedang di textarea (esc mungkin untuk batal edit)
                if (e.target && e.target.tagName === 'TEXTAREA') {
                    e.target.blur();
                    return;
                }
                P.tutupCodeView();
                e.preventDefault();
            }
        });
        // Breadcrumb scroll buttons
        var bcScrollLeft = document.getElementById('breadcrumb-scroll-left');
        if (bcScrollLeft) {
            bcScrollLeft.addEventListener('click', function () { P.scrollBreadcrumb('left'); });
        }
        var bcScrollRight = document.getElementById('breadcrumb-scroll-right');
        if (bcScrollRight) {
            bcScrollRight.addEventListener('click', function () { P.scrollBreadcrumb('right'); });
        }
        // Update tombol panah saat user scroll manual di breadcrumb
        var bcEl = document.getElementById('breadcrumb');
        if (bcEl && P.updateBreadcrumbScrollButtons) {
            bcEl.addEventListener('scroll', P.updateBreadcrumbScrollButtons);
        }
        // Klik di luar page panel → tutup popover
        document.addEventListener('mousedown', function (e) {
            var panel = document.getElementById('page-panel');
            if (!panel || panel.hasAttribute('hidden')) return;
            // Jangan tutup kalau klik di dalam panel atau di badge footer
            if (e.target.closest('#page-panel, #footer-page, #footer-page-add, #footer-page-rename')) return;
            P.tutupPagePanel();
        });
        // Akordion "Buat Dokumen" & "Buat Proyek" — saat satu buka, tutup yang lain
        var akorDok = document.getElementById('akordion-buat-dokumen');
        var akorProyek = document.getElementById('akordion-buat-proyek');
        if (akorDok && akorProyek) {
            akorDok.addEventListener('toggle', function () {
                if (akorDok.open) akorProyek.removeAttribute('open');
            });
            akorProyek.addEventListener('toggle', function () {
                if (akorProyek.open) akorDok.removeAttribute('open');
            });
        }
        var canvas = document.getElementById('canvas');
        if (canvas) canvas.addEventListener('mousedown', function(e) {
            if (P.handleMouseDown) P.handleMouseDown(e);
        });
        document.addEventListener('mousemove', function(e) {
            if (P.handleMouseMove) P.handleMouseMove(e);
        });
        document.addEventListener('mouseup', function(e) {
            if (P.handleMouseUp) P.handleMouseUp(e);
        });

        // Editor bar mini (Isi / Komponen / Properti)
        var editorBar = document.getElementById('editor-bar');
        if (editorBar) editorBar.addEventListener('click', P.handleEditorBarClick);
        // Dropdown isi & komponen
        var ddIsi = document.getElementById('dropdown-isi');
        if (ddIsi) ddIsi.addEventListener('click', P.handleDropdownClick);
        var ddKomponen = document.getElementById('dropdown-komponen');
        if (ddKomponen) ddKomponen.addEventListener('click', P.handleDropdownClick);
        // Panel properti KOMPONEN — gunakan event delegation (untuk dynamic content)
        var panelProp = document.getElementById('panel-properti');
        if (panelProp) {
            // Klik tombol close
            panelProp.addEventListener('click', function (e) {
                // Cek tombol close-properti (X)
                var closeBtn = e.target.closest('[data-action="close-properti"]');
                if (closeBtn) {
                    panelProp.hidden = true;
                    return;
                }
                // Delegate ke handler block-panel untuk swatch button dll.
                P.handlePanelClickDelegated(e);
            });
            // Change event — input/select/checkbox changes (onBlur / onSubmit)
            panelProp.addEventListener('change', P.handlePanelChangeDelegated);
            // Input event — live update untuk text/textarea
            panelProp.addEventListener('input', P.handlePanelInputDelegated);
        }

        // Panel properti REGION — event delegation terpisah
        var panelRegion = document.getElementById('panel-properti-region');
        if (panelRegion) {
            panelRegion.addEventListener('click', function (e) {
                var closeBtn = e.target.closest('[data-action="close-properti-region"]');
                if (closeBtn) {
                    panelRegion.hidden = true;
                    var btnP = document.getElementById('btn-properti');
                    if (btnP) btnP.classList.remove('pondasi-editor-bar-aktif');
                    return;
                }
                // Delegate ke handler yang sama (region pakai data-mode="region" di badan)
                P.handlePanelClickDelegated(e);
            });
            panelRegion.addEventListener('change', P.handlePanelChangeDelegated);
            panelRegion.addEventListener('input', P.handlePanelInputDelegated);
        }

        // Click di luar region (saat mode edit aktif) → exit edit mode
        document.addEventListener('mousedown', function (e) {
            if (!P.STATE.editMode.active) return;
            // Skip kalau event ini baru saja di-handle oleh handleMouseDown (double-click → masukModeEdit)
            if (P._modeEditBaruMasuk && (Date.now() - P._modeEditBaruMasuk < 500)) {
                return;
            }
            // Pastikan target adalah element (bukan document)
            if (!e.target || !e.target.closest) return;
            // Klik di editor bar, dropdown, panel, swatches, floating, floating-toolbar, footer, modal — jangan exit
            if (e.target.closest('.pondasi-editor-bar, .pondasi-editor-dropdown, .pondasi-editor-panel, .pondasi-swatches-modal, .pondasi-floating, .pondasi-floating-toolbar, .pondasi-footer, .pondasi-modal, #block-menu-popup, #preview-overlay')) return;
            // Klik di dalam region editing (termasuk blocks, insert points, elemen dalam komponen) — jangan exit
            if (e.target.closest('.pondasi-editing, [data-block-wrapper], .pondasi-block-insert, [data-block-id]')) return;
            // Klik di luar region editing → exit
            P.keluarModeEdit();
        });

        // Klik di dalam region editing tapi BUKAN di block → batal pilih block
        // (sehingga panel kembali ke mode region)
        document.addEventListener('click', function (e) {
            if (!P.STATE.editMode.active) return;
            if (!P.STATE.editMode.selectedBlockId) return;
            if (!e.target || !e.target.closest) return;
            // Jangan deselect kalau klik di block, panel, editor bar, dll
            if (e.target.closest('[data-block-wrapper], [data-block-id], .pondasi-editor-panel, .pondasi-editor-bar, .pondasi-editor-dropdown, .pondasi-swatches-modal, .pondasi-block-insert, #block-menu-popup')) return;
            // Klik di region editing (bukan di block) → deselect block
            if (e.target.closest('.pondasi-editing')) {
                P.batalPilihBlock();
            }
        });


        // Swatches modal handler
        var swatchesModal = document.getElementById('swatches-modal');
        if (swatchesModal) {
            swatchesModal.addEventListener('click', function (e) {
                // Klik tombol Tutup
                var closeBtn = e.target.closest('[data-action="close-swatches"]');
                if (closeBtn) {
                    P.closeSwatches();
                    return;
                }
                // v127: Klik tombol "Terapkan" — apply warna yang sudah di-seleksi
                var applyBtn = e.target.closest('[data-action="apply-hex"]');
                if (applyBtn) {
                    P.applyHexFromInput();
                    return;
                }
                // Klik tombol "Kosong" — select kosong
                var noneBtn = e.target.closest('[data-action="apply-none"]');
                if (noneBtn) {
                    P.selectSwatch('', P.STATE.editMode.paletteOpen);
                    return;
                }
                // Klik swatch — v125: seleksi dulu, apply via tombol "Terapkan"
                var sw = e.target.closest('.pondasi-swatch');
                if (sw && sw.dataset.color !== undefined) {
                    P.selectSwatch(sw.dataset.color, sw.dataset.type || P.STATE.editMode.paletteOpen);
                }
                // Klik backdrop (di luar box)
                if (e.target === swatchesModal) {
                    P.closeSwatches();
                }
            });
            // v123: color picker pakai custom HSL wheel, bukan native input[type=color]
            // Auto-apply di-revert — user harus klik "Terapkan" manual
            var hexInput = document.getElementById('swatches-hex');
            if (hexInput) {
                hexInput.addEventListener('input', function () {
                    var v = hexInput.value.trim();
                    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                        // Sync ke custom wheel (jika ada)
                        if (P.setColorWheelValue) P.setColorWheelValue(v);
                    }
                });
                // Enter di hex input → apply
                hexInput.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        P.applyHexFromInput();
                    }
                });
            }
            // v124: init custom color wheel (selalu visible di samping swatches)
            if (P.initColorWheel) P.initColorWheel();
            // v134: init gradient picker
            if (P.initGradient) P.initGradient();
        }

        // Auto-save on unload — hanya register di registerListeners (jangan duplikat di initAfterLoad).
        // Pakai sync save via localStorage kalau server mode gagal (sendBeacon untuk server).
        window.addEventListener('beforeunload', P.handleBeforeUnload);

        // === SCANNER: Listener untuk input CSS eksternal di form buat dokumen ===
        var cssEksternalInput = document.getElementById('buat-css-eksternal');
        if (cssEksternalInput) {
            var scanTimer = null;
            cssEksternalInput.addEventListener('input', function () {
                // Hapus data-file-key kalau user ketik manual (bukan dari file picker)
                cssEksternalInput.removeAttribute('data-file-key');
                if (scanTimer) clearTimeout(scanTimer);
                scanTimer = setTimeout(function () {
                    P.cekCssEksternalInput();
                }, 500);  // debounce 500ms
            });
            cssEksternalInput.addEventListener('blur', function () {
                if (scanTimer) clearTimeout(scanTimer);
                // Hanya scan kalau BUKAN dari file picker (data-file-key ada)
                if (!cssEksternalInput.getAttribute('data-file-key')) {
                    P.cekCssEksternalInput();
                }
            });
        }
        // Listener untuk tombol "..." (file picker)
        var pickBtn = document.getElementById('buat-css-eksternal-pick');
        if (pickBtn) {
            pickBtn.addEventListener('click', function () {
                P.pilihFileCSS();
            });
        }
        // Listener untuk file input change
        var fileInput = document.getElementById('buat-css-eksternal-file');
        if (fileInput) {
            fileInput.addEventListener('change', function () {
                P.handleFileCSSDipilih();
            });
        }
        // Listener untuk template import file input
        var templateFileInput = document.getElementById('template-import-file');
        if (templateFileInput) {
            templateFileInput.addEventListener('change', function () {
                P.handleFileTemplateDipilih();
            });
        }
        // Listener untuk image file picker
        var imageFileInput = document.getElementById('image-pick-file');
        if (imageFileInput) {
            imageFileInput.addEventListener('change', function () {
                P.handleImageFileDipilih();
            });
        }

        // === DISABLED AKORDION GUARD — cegah toggle <details class="-disabled"> ===
        // <details> tidak punya attribute disabled native; pakai class + JS prevent toggle.
        document.addEventListener('toggle', function (ev) {
            var det = ev.target;
            if (det && det.tagName === 'DETAILS' &&
                (det.hasAttribute('disabled') ||
                 det.className.indexOf('-disabled') >= 0)) {
                // Paksa tutup kembali
                det.open = false;
            }
        }, true);

        // === DRAG PANEL PROPERTI (region + komponen) ===
        // Kedua panel bisa di-drag via headernya (class pondasi-panel-drag-handle)
        P.initPanelDrag();
    }

    /* === DRAG LOGIC untuk panel melayang ===
       Dipakai oleh: panel-properti-region dan panel-properti (komponen).
       Header (class pondasi-panel-drag-handle) bisa di-drag untuk pindah panel.
       Tombol close di header TIDAK trigger drag (cursor pointer). */
    P.initPanelDrag = function() {
        if (P._panelDragInit) return;
        P._panelDragInit = true;

        var dragPanel = null;
        var dragOffsetX = 0;
        var dragOffsetY = 0;

        // Mousedown di drag handle → mulai drag
        document.addEventListener('mousedown', function(e) {
            var handle = e.target.closest('.pondasi-panel-drag-handle');
            if (!handle) return;
            // Skip kalau klik tombol close (atau elemen di dalam head selain handle area)
            if (e.target.closest('.pondasi-editor-bar-keluar')) return;

            var panelId = handle.getAttribute('data-panel-id');
            var panel = document.getElementById(panelId);
            if (!panel || panel.hidden) return;

            dragPanel = panel;
            var rect = panel.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;

            // Switch ke absolute positioning (dari fixed/relative default)
            panel.style.position = 'fixed';
            panel.style.left = rect.left + 'px';
            panel.style.top = rect.top + 'px';
            // Hapus right/bottom supaya tidak konflik
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';

            document.body.classList.add('pondasi-panel-dragging');
            e.preventDefault();
        });

        // Mousemove → pindah panel
        document.addEventListener('mousemove', function(e) {
            if (!dragPanel) return;
            var newLeft = e.clientX - dragOffsetX;
            var newTop = e.clientY - dragOffsetY;

            // Clamp ke viewport (jangan keluar layar)
            var panelW = dragPanel.offsetWidth;
            var panelH = dragPanel.offsetHeight;
            var maxLeft = window.innerWidth - panelW;
            var maxTop = window.innerHeight - panelH;
            if (newLeft < 0) newLeft = 0;
            if (newTop < 0) newTop = 0;
            if (newLeft > maxLeft) newLeft = maxLeft;
            if (newTop > maxTop) newTop = maxTop;

            dragPanel.style.left = newLeft + 'px';
            dragPanel.style.top = newTop + 'px';
        });

        // Mouseup → selesai drag
        document.addEventListener('mouseup', function() {
            if (!dragPanel) return;
            dragPanel = null;
            document.body.classList.remove('pondasi-panel-dragging');
        });

        // Mouseleave dari window → selesai drag (jaga-jaga)
        window.addEventListener('blur', function() {
            if (dragPanel) {
                dragPanel = null;
                document.body.classList.remove('pondasi-panel-dragging');
            }
        });
    };

    // Handler beforeunload — sync save (localStorage) + sendBeacon (server mode)
    P.handleBeforeUnload = function() {
        if (!P.STATE || !P.STATE.currentProjectId) return;
        try {
            P.syncToProject();
            // Selalu simpan ke localStorage (sync, jamin tidak hilang walau server mode)
            P.saveProjects();
            // Kirim ke server via sendBeacon (async, tetap dikirim walau tab unload)
            if (P.storage.mode === 'server' && navigator.sendBeacon) {
                var project = P.STATE.projects[P.STATE.currentProjectId];
                if (project) {
                    var params = 'id=' + encodeURIComponent(P.STATE.currentProjectId) +
                                 '&data=' + encodeURIComponent(JSON.stringify(project));
                    var blob = new Blob([params], { type: 'application/x-www-form-urlencoded' });
                    navigator.sendBeacon(P.storage.serverUrl + '?action=write', blob);
                }
            }
        } catch (e) {
            // Log error supaya tidak silent — walau user tidak lihat flash saat tab ditutup,
            // setidaknya ada trail di console untuk debugging.
            console.error('[pondasi] beforeunload save gagal:', e);
        }
    };

    P.initAfterLoad = function() {
        // v117: Inject SVG sprite (hidden <svg> berisi semua <symbol>)
        if (P.injectIconSprite) P.injectIconSprite();
        // v116: Replace semua <i data-icon="X"> di DOM dengan SVG <use>
        if (P.replaceIcons) P.replaceIcons();
        // v130: Extract warna dari CSS eksternal → tambahkan ke Warna Pengguna
        // v132: Cleanup dulu — buang warna default yang terlanjur masuk dari versi sebelumnya
        if (P.cleanupCustomColors) P.cleanupCustomColors();
        if (P.Scanner && P.Scanner.scanProjectColors) P.Scanner.scanProjectColors();
        // Kalau tidak ada project aktif, auto-create (UX: user langsung lihat canvas editable)
        if (!P.STATE.currentProjectId || !P.STATE.projects[P.STATE.currentProjectId]) {
            console.log('pondasi: auto-create new project');
            P.newProject('Proyek tanpa judul');
        } else {
            P.loadFromProject();
        }

        if (!P.STATE.activeId || !P.getById(P.STATE.activeId)) {
            if (P.STATE.tree) P.STATE.activeId = P.STATE.tree.id;
        }

        P.render();

        // Listeners — pakai registerListeners (dengan guard, hanya sekali)
        P.registerListeners();

        // Re-apply tinggi saat window resize
        window.addEventListener('resize', function () {
            if (P.applyVerticalHeights) P.applyVerticalHeights();
            if (P.STATE.editMode.active && P.posisikanBarEditor) P.posisikanBarEditor();
        });

        window.addEventListener('load', function () {
            if (P.applyVerticalHeights) P.applyVerticalHeights();
        });

        setTimeout(function() { if (P.applyVerticalHeights) P.applyVerticalHeights(); }, 0);

        // Init project UI — apply settings ke body editor
        if (typeof P.initProjectUI === 'function') {
            P.initProjectUI();
        }

        // Render panel region (sudah default visible sejak app load)
        // Pastikan posisi default di-set kalau belum pernah di-drag
        var panelRegionInit = document.getElementById('panel-properti-region');
        if (panelRegionInit && !panelRegionInit.hidden) {
            if (!panelRegionInit.style.top && !panelRegionInit.style.right && !panelRegionInit.style.left) {
                panelRegionInit.style.top = '8px';
                panelRegionInit.style.right = '8px';
            }
        }
        if (P.renderPanel) P.renderPanel();
        // Render list halaman di sidebar dokumen
        if (P.renderPageList) P.renderPageList();
        // Update indikator halaman di footer
        if (P.updatePageIndicator) P.updatePageIndicator();

        // Statusline awal
        if (P.setStatusline) P.setStatusline('siap — tekan v untuk split, ? untuk bantuan');
    }

    // Mulai setelah DOM siap
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { if (P.init) P.init(); });
    } else {
        if (P.init) P.init();
    }

