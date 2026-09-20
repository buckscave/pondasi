/* PONDASI-INPUT.JS */
var P = P || {};

    /* ======================================================================
       KEYBOARD HANDLER
       ====================================================================== */
    P.handleKey = function(e) {
        // Jika sedang dalam mode edit
        if (P.STATE.editMode.active) {
            // Jika sedang edit teks inline (contentEditable), biarkan browser handle
            // (Enter = baris baru, Backspace = hapus karakter, dll)
            // Kecuali Escape (keluar edit teks) dan Ctrl+Z/Y (undo/redo)
            var target = e.target;
            var diContentEditable = target && target.isContentEditable === true;
            if (diContentEditable) {
                // Hanya handle shortcut global (Escape, Ctrl+Z, dll), bukan typing
                if (e.key === 'Escape') {
                    e.preventDefault();
                    // Blur dari block editable → simpan isi
                    if (target.blur) target.blur();
                    return;
                }
                // Ctrl+Z/Y untuk undo/redo — biarkan pondasi handler
                if (e.ctrlKey && (e.key === 'z' || e.key === 'Z' || e.key === 'y' || e.key === 'Y')) {
                    // Lanjut ke handler bawah (jangan return)
                } else {
                    // Semua key lainnya (termasuk Enter, Backspace, arrow) → biarkan browser handle
                    return;
                }
            }

            if (e.key === 'i' || e.key === 'k' || e.key === 'e') {
            }
            // Escape: tutup dialog/sidebar/modal → kembali ke region → keluar mode edit
            if (e.key === 'Escape') {
                e.preventDefault();
                // Tutup dialog dulu
                var dialog = document.getElementById('pondasi-dialog');
                if (dialog && dialog.style.display !== 'none') {
                    P.prosesDialog(false);
                    return;
                }
                // Tutup swatches modal
                var sw = document.getElementById('swatches-modal');
                if (sw && !sw.hidden) { P.closeSwatches(); return; }
                // Tutup dropdown
                var ddIsi = document.getElementById('dropdown-isi');
                var ddKomponen = document.getElementById('dropdown-komponen');
                if ((ddIsi && !ddIsi.hidden) || (ddKomponen && !ddKomponen.hidden)) {
                    P.tutupDropdownKeyboard();
                    return;
                }
                // Tutup sidebar kiri
                if (P.sidebarAktif) { P.tutupSidebarKiri(); return; }
                // Kalau fokus di panel properti (komponen atau region) → kembali ke region
                var panelBlock = document.getElementById('panel-properti');
                var panelRegion = document.getElementById('panel-properti-region');
                var aktif = document.activeElement;
                if (panelBlock && !panelBlock.hidden && panelBlock.contains(aktif)) {
                    var regionEl = document.querySelector('.pondasi-region[data-id="' + P.STATE.editMode.regionId + '"]');
                    if (regionEl) {
                        regionEl.focus();
                        if (P.STATE.editMode.selectedBlockId) {
                            P.batalPilihBlock();
                        }
                    }
                    P.flash('Kembali ke region');
                    return;
                }
                // Selain itu: keluar mode edit
                P.keluarModeEdit();
                return;
            }

            // Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z — undo/redo
            if (e.ctrlKey && !e.altKey) {
                if ((e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
                    e.preventDefault(); P.undo(); return;
                }
                if ((e.key === 'y' || e.key === 'Y') && !e.shiftKey) {
                    e.preventDefault(); P.redo(); return;
                }
                if ((e.key === 'z' || e.key === 'Z') && e.shiftKey) {
                    e.preventDefault(); P.redo(); return;
                }
            }

            // u/r undo/redo (saat TIDAK di input/textarea/contentEditable)
            var tCheck = e.target;
            var diInput = tCheck && (tCheck.tagName === 'INPUT' || tCheck.tagName === 'TEXTAREA' || tCheck.isContentEditable);
            if (!diInput && !e.altKey && !e.ctrlKey && !e.shiftKey) {
                if (e.key === 'u') { e.preventDefault(); P.undo(); return; }
                if (e.key === 'r') { e.preventDefault(); P.redo(); return; }
            }

            // Ctrl+B/I/U untuk bold/italic/underline
            // Jika target adalah contentEditable (block sedang di-edit), biarkan browser handle
            if (e.ctrlKey && !e.altKey && !e.shiftKey) {
                if (tCheck && tCheck.isContentEditable) {
                    // Biarkan browser handle Ctrl+B/I/U natively untuk contentEditable
                    // Tidak preventDefault, tidak return — biarkan default
                } else {
                    if (e.key === 'b' || e.key === 'B') { e.preventDefault(); P.editorCommand('bold'); return; }
                    if (e.key === 'i' || e.key === 'I') { e.preventDefault(); P.editorCommand('italic'); return; }
                    if (e.key === 'u' || e.key === 'U') { e.preventDefault(); P.editorCommand('underline'); return; }
                }
            }

            // BUG FIX v25: i/k toggle/switch harus dicek SEBELUM handleDropdownKeyboard
            // supaya i/k tetap bisa toggle/switch saat dropdown sudah terbuka.
            // Sebelumnya: i ditekan, dropdown terbuka; i ditekan lagi → masuk
            // handleDropdownKeyboard → k bukan arrow/enter → return → tidak ada apa-apa.
            // Sekarang: i/k dicek duluan, baru arrow/enter/escape ke handleDropdownKeyboard.
            if (!diInput && !e.altKey && !e.ctrlKey && !e.shiftKey) {
                if (e.key === 'i') {
                    e.preventDefault();
                    var ddIsiCek = document.getElementById('dropdown-isi');
                    var ddKomCek = document.getElementById('dropdown-komponen');
                    var isiTerbukaCek = ddIsiCek && !ddIsiCek.hidden;
                    var komTerbukaCek = ddKomCek && !ddKomCek.hidden;
                    if (isiTerbukaCek) {
                        P.tutupDropdownKeyboard();
                    } else if (komTerbukaCek) {
                        P.tutupDropdownKeyboard();
                        P.bukaDropdownKeyboard('isi');
                    } else {
                        P.bukaDropdownKeyboard('isi');
                    }
                    return;
                }
                if (e.key === 'k') {
                    e.preventDefault();
                    var ddIsiCek2 = document.getElementById('dropdown-isi');
                    var ddKomCek2 = document.getElementById('dropdown-komponen');
                    var isiTerbukaCek2 = ddIsiCek2 && !ddIsiCek2.hidden;
                    var komTerbukaCek2 = ddKomCek2 && !ddKomCek2.hidden;
                    if (komTerbukaCek2) {
                        P.tutupDropdownKeyboard();
                    } else if (isiTerbukaCek2) {
                        P.tutupDropdownKeyboard();
                        P.bukaDropdownKeyboard('komponen');
                    } else {
                        P.bukaDropdownKeyboard('komponen');
                    }
                    return;
                }
            }

            // Dropdown keyboard nav (arrow up/down, enter) — hanya kalau dropdown terbuka
            // dan user TIDAK menekan i/k (sudah ditangani di atas)
            var ddIsi2 = document.getElementById('dropdown-isi');
            var ddKomponen2 = document.getElementById('dropdown-komponen');
            if ((ddIsi2 && !ddIsi2.hidden) || (ddKomponen2 && !ddKomponen2.hidden)) {
                P.handleDropdownKeyboard(e);
                return;
            }

            // Panel properti: navigasi linear (folder tree style)
            var panel2 = document.getElementById('panel-properti');
            var tPanel = e.target;
            if (tPanel && panel2 && !panel2.hidden && panel2.contains(tPanel)) {
                var isSeksiHeader = tPanel.classList && tPanel.classList.contains('pondasi-properti-seksi-header');
                var isSummary = tPanel.tagName === 'SUMMARY';

                // Spasi/Enter → toggle
                if (e.key === ' ' || e.key === 'Enter') {
                    if (isSeksiHeader) {
                        e.preventDefault();
                        var sp = tPanel.closest('.pondasi-properti-seksi');
                        if (sp) sp.classList.toggle('pondasi-properti-seksi-tutup');
                        return;
                    }
                    if (isSummary) {
                        e.preventDefault();
                        var dp = tPanel.parentElement;
                        if (dp) {
                            if (dp.hasAttribute('open')) dp.removeAttribute('open');
                            else dp.setAttribute('open', 'open');
                        }
                        return;
                    }
                }

                // Arrow Up/Down → navigasi linear semua elemen (folder tree, skip collapse)
                if (!e.altKey && !e.ctrlKey && !e.shiftKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                    e.preventDefault();
                    var linearList = [];
                    var seksis = panel2.querySelectorAll('.pondasi-properti-seksi');
                    for (var si = 0; si < seksis.length; si++) {
                        var hdr = seksis[si].querySelector('.pondasi-properti-seksi-header');
                        if (hdr) linearList.push(hdr);
                        if (!seksis[si].classList.contains('pondasi-properti-seksi-tutup')) {
                            var fields = seksis[si].querySelectorAll('summary, input, select, textarea, button.pondasi-properti-warna-btn, .pondasi-state-tab');
                            for (var fi = 0; fi < fields.length; fi++) {
                                linearList.push(fields[fi]);
                            }
                        }
                    }
                    var curPos = -1;
                    for (var li = 0; li < linearList.length; li++) {
                        if (linearList[li] === tPanel) { curPos = li; break; }
                    }
                    var arah = e.key === 'ArrowDown' ? 1 : -1;
                    var newPos = curPos + arah;
                    if (newPos >= 0 && newPos < linearList.length) {
                        linearList[newPos].focus();
                    }
                    return;
                }

                // Tab: biarkan default (tapi tanpa outline — pakai full block highlight)
                if (e.key === 'Tab') return;
            }

            // Shortcut saat fokus di region (bukan input/textarea)
            if (!diInput) {
                // i/k sudah ditangani di atas (BUG FIX v25: pindah sebelum handleDropdownKeyboard)
                // e: tutup dropdown, toggle panel region
                if (e.key === 'e' && !e.altKey && !e.ctrlKey && !e.shiftKey) {
                    e.preventDefault();
                    // Tutup dropdown dulu kalau ada
                    var ddIsi3 = document.getElementById('dropdown-isi');
                    var ddKom3 = document.getElementById('dropdown-komponen');
                    if ((ddIsi3 && !ddIsi3.hidden) || (ddKom3 && !ddKom3.hidden)) {
                        P.tutupDropdownKeyboard();
                        return;  // Jangan lanjut ke toggle panel — dropdown baru ditutup
                    }
                    // Toggle panel region
                    var panelRegion = document.getElementById('panel-properti');
                    if (panelRegion && !panelRegion.hidden && P.STATE.editMode.selectedBlockId === null) {
                        panelRegion.hidden = true;
                        var btnPE = document.getElementById('btn-properti');
                        if (btnPE) btnPE.classList.remove('pondasi-editor-bar-aktif');
                    } else {
                        P.bukaPropertiRegion();
                    }
                    return;
                }
                if (e.key === 'y' && !e.altKey && !e.ctrlKey && !e.shiftKey) {
                    e.preventDefault(); P.yankBlockAktif(); return;
                }
                if (e.key === 'x' && !e.altKey && !e.ctrlKey && !e.shiftKey) {
                    e.preventDefault(); P.cutBlockAktif(); return;
                }
                if (e.key === 'p' && !e.altKey && !e.ctrlKey && !e.shiftKey) {
                    e.preventDefault(); P.pasteBlockAktif(); return;
                }
                if (e.key === 'Enter' && !e.altKey && !e.ctrlKey && !e.shiftKey) {
                    if (P.STATE.editMode.selectedBlockId) {
                        e.preventDefault();
                        // Enter di block terseleksi → masuk edit teks inline (sama seperti double-click)
                        P.masukEditTextBlock();
                        return;
                    }
                }
                if (e.key === 'Backspace' && !e.altKey && !e.ctrlKey && !e.shiftKey) {
                    e.preventDefault();
                    // Bulk hapus: jika ada multi-select, hapus semua; jika tidak, hapus single
                    var idsTerpilih = P.STATE.editMode.selectedBlockIds || [];
                    if (idsTerpilih.length > 0) {
                        // Bulk hapus multi-select
                        P.hapusBanyakBlock(idsTerpilih);
                        P.STATE.editMode.selectedBlockIds = [];
                        P.STATE.editMode.selectedBlockId = null;
                        P.renderBlocks();
                        P.renderPanel();
                        P.flash(idsTerpilih.length + ' block dihapus');
                    } else if (P.STATE.editMode.selectedBlockId) {
                        var idxHapus = P.cariIndexBlock(P.STATE.editMode.selectedBlockId);
                        if (idxHapus >= 0) {
                            P.hapusBlock(idxHapus);
                            P.STATE.editMode.selectedBlockId = null;
                            P.renderBlocks();
                            P.renderPanel();
                            P.flash('Block dihapus');
                        }
                    }
                    return;
                }
                if (e.ctrlKey && !e.altKey && !e.shiftKey) {
                    if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        // Bulk pindah kalau ada multi-select, else pindah single
                        var idsPindah = P.STATE.editMode.selectedBlockIds || [];
                        if (idsPindah.length > 0) {
                            P.pindahBanyakBlock(idsPindah, -1);
                        } else {
                            P.pindahBlockAktif(-1);
                        }
                        return;
                    }
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        var idsPindah2 = P.STATE.editMode.selectedBlockIds || [];
                        if (idsPindah2.length > 0) {
                            P.pindahBanyakBlock(idsPindah2, 1);
                        } else {
                            P.pindahBlockAktif(1);
                        }
                        return;
                    }
                }
                if (!e.altKey && !e.ctrlKey && !e.shiftKey) {
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        P.navigasiBlock(e.key === 'ArrowDown' ? 1 : -1);
                        return;
                    }
                }
                // Shift+ArrowUp/ArrowDown: extend multi-select block
                if (e.shiftKey && !e.altKey && !e.ctrlKey) {
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        P.perluasSeleksiBlock(e.key === 'ArrowDown' ? 1 : -1);
                        return;
                    }
                }
                // Escape seleksi multi-block (Clear multi-select, tetap di mode edit)
                // Ctrl+A: pilih semua block
                if (e.ctrlKey && !e.altKey && !e.shiftKey && (e.key === 'a' || e.key === 'A')) {
                    e.preventDefault();
                    P.pilihSemuaBlock();
                    return;
                }
            }
            return;
        }

        // === DI LUAR MODE EDIT ===
        var t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

        if (e.key === '?' || (e.shiftKey && e.key === '/')) {
            e.preventDefault();
            var modal = document.getElementById('help-modal');
            if (!modal) return;
            // Kalau sidebar/dialog terbuka, jangan toggle help — biar tidak muncul di belakang
            if (!P.semuaModalTutup()) return;
            modal.hidden = !modal.hidden;
            return;
        }

        if (e.key === 'Escape') {
            // Prioritas: tutup custom dialog dulu (kalau terbuka di atas sidebar)
            var dlg = document.getElementById('pondasi-dialog');
            if (dlg && dlg.style.display !== 'none') { P.prosesDialog(false); return; }
            if (P.sidebarAktif) { P.tutupSidebarKiri(); return; }
            var modals = ['help-modal', 'swatches-modal'];
            for (var mi = 0; mi < modals.length; mi++) {
                var m = document.getElementById(modals[mi]);
                if (m && !m.hidden) { m.hidden = true; return; }
            }
            P.clearSelection();
            P.clearPendingCount();
            P.hideHelp();
            P.render();
            return;
        }

        if (e.key === 'Enter' && !e.altKey && !e.ctrlKey && !e.shiftKey) {
            e.preventDefault();
            P.clearPendingCount();
            P.masukModeEdit();
            return;
        }

        if (!e.altKey && !e.ctrlKey && !e.shiftKey) {
            if (e.key === 'd' || e.key === 'D') { if (!P.semuaModalTutup()) return; e.preventDefault(); P.clearPendingCount(); P.tampilkanDokumenPanel(); return; }
            if (e.key === 't' || e.key === 'T') { if (!P.semuaModalTutup()) return; e.preventDefault(); P.clearPendingCount(); P.tampilkanTemplatePanel(); return; }
            if (e.key === 's' || e.key === 'S') { if (!P.semuaModalTutup()) return; e.preventDefault(); P.clearPendingCount(); P.simpanProject(); return; }
            if (e.key === 'e' || e.key === 'E') { if (!P.semuaModalTutup()) return; e.preventDefault(); P.clearPendingCount(); P.tampilkanExportPanel(); return; }
            if (e.key === ',') { if (!P.semuaModalTutup()) return; e.preventDefault(); P.clearPendingCount(); P.tampilkanSettingsPanel(); return; }
            if (e.key === 'y' || e.key === 'Y') { if (!P.semuaModalTutup()) return; e.preventDefault(); P.clearPendingCount(); P.yankRegion(); return; }
            if (e.key === 'x' || e.key === 'X') { if (!P.semuaModalTutup()) return; e.preventDefault(); P.clearPendingCount(); P.cutRegion(); return; }
            if (e.key === 'p' || e.key === 'P') { if (!P.semuaModalTutup()) return; e.preventDefault(); P.clearPendingCount(); P.pasteRegion(); return; }
        }

        var _helpModal = document.getElementById('help-modal');
        if (_helpModal && !_helpModal.hidden) return;

        if (/^[0-9]$/.test(e.key) && !e.altKey && !e.ctrlKey && !e.shiftKey) {
            var n = parseInt(e.key, 10);
            if (P.STATE.pendingCount === null && n === 0) return;
            e.preventDefault();
            if (P.STATE.pendingCount !== null) {
                P.STATE.pendingCount = P.STATE.pendingCount * 10 + n;
            } else {
                P.STATE.pendingCount = n;
            }
            if (P.STATE.pendingCount > 12) P.STATE.pendingCount = 12;
            P.schedulePendingCountReset();
            P.updateStatus();
            return;
        }

        var key = e.key.toLowerCase();
        var dir = null;
        if (key === 'arrowleft' || key === 'left') dir = 'left';
        else if (key === 'arrowright' || key === 'right') dir = 'right';
        else if (key === 'arrowup' || key === 'up') dir = 'up';
        else if (key === 'arrowdown' || key === 'down') dir = 'down';

        if (dir) {
            e.preventDefault();
            P.clearPendingCount();
            if (e.altKey && !e.ctrlKey && !e.shiftKey) P.resize(dir);
            else if (e.ctrlKey && !e.altKey && !e.shiftKey) P.swap(dir);
            else if (e.shiftKey && !e.altKey && !e.ctrlKey) P.extendSelection(dir);
            else if (!e.altKey && !e.ctrlKey && !e.shiftKey) P.navigate(dir);
            return;
        }

        // v/h tanpa alt: split normal (grand-parent → section+kolom, parent → tambah kolom/sibling)
        if (key === 'v' && !e.altKey && !e.ctrlKey && !e.shiftKey) {
            e.preventDefault();
            var hitungV = P.STATE.pendingCount || 2;
            P.clearPendingCount();
            if (P.regionTerkunci && P.regionTerkunci()) {
                P.flash('Region terkunci — buka kunci (l) dulu untuk split');
                return;
            }
            P.splitVertical(hitungV);
            return;
        }
        if (key === 'h' && !e.altKey && !e.ctrlKey && !e.shiftKey) {
            e.preventDefault();
            var hitungH = P.STATE.pendingCount || 2;
            P.clearPendingCount();
            if (P.regionTerkunci && P.regionTerkunci()) {
                P.flash('Region terkunci — buka kunci (l) dulu untuk split');
                return;
            }
            P.splitHorizontal(hitungH);
            return;
        }
        // alt+v/alt+h: alt-split (kolom → sub-parent, sub-baris)
        if (key === 'v' && e.altKey && !e.ctrlKey && !e.shiftKey) {
            e.preventDefault();
            var hitungAltV = P.STATE.pendingCount || 2;
            P.clearPendingCount();
            if (P.regionTerkunci && P.regionTerkunci()) {
                P.flash('Region terkunci — buka kunci (l) dulu');
                return;
            }
            P.altSplitVertical(hitungAltV);
            return;
        }
        if (key === 'h' && e.altKey && !e.ctrlKey && !e.shiftKey) {
            e.preventDefault();
            var hitungAltH = P.STATE.pendingCount || 2;
            P.clearPendingCount();
            if (P.regionTerkunci && P.regionTerkunci()) {
                P.flash('Region terkunci — buka kunci (l) dulu');
                return;
            }
            P.altSplitHorizontal(hitungAltH);
            return;
        }
        // Lock region (toggle)
        if (key === 'l' && !e.altKey && !e.ctrlKey && !e.shiftKey) {
            e.preventDefault();
            P.clearPendingCount();
            if (P.toggleLockRegion) P.toggleLockRegion();
            return;
        }
        // Toggle panel region (w)
        if (key === 'w' && !e.altKey && !e.ctrlKey && !e.shiftKey) {
            e.preventDefault();
            P.clearPendingCount();
            if (P.togglePanelRegion) P.togglePanelRegion();
            return;
        }
        if (e.key === 'Backspace' && !e.altKey && !e.ctrlKey && !e.shiftKey) {
            e.preventDefault(); P.clearPendingCount();
            if (P.regionTerkunci && P.regionTerkunci()) {
                P.flash('Region terkunci — buka kunci (l) dulu untuk hapus');
                return;
            }
            P.deleteRegions(); return;
        }
        if (key === 'j' && !e.altKey && !e.ctrlKey && !e.shiftKey) {
            e.preventDefault(); P.clearPendingCount();
            if (P.regionTerkunci && P.regionTerkunci()) {
                P.flash('Region terkunci — buka kunci (l) dulu untuk merge');
                return;
            }
            P.mergeRegions(); return;
        }
        if (key === 'u' && !e.altKey && !e.ctrlKey && !e.shiftKey) {
            e.preventDefault(); P.clearPendingCount(); P.undo(); return;
        }
        if (key === 'r' && !e.altKey && !e.ctrlKey && !e.shiftKey) {
            e.preventDefault(); P.clearPendingCount(); P.redo(); return;
        }
        if (key === 'z' && e.ctrlKey && !e.altKey && !e.shiftKey) {
            e.preventDefault(); P.clearPendingCount(); P.undo(); return;
        }
        if ((key === 'y' && e.ctrlKey && !e.altKey && !e.shiftKey) ||
            (key === 'z' && e.ctrlKey && e.shiftKey && !e.altKey)) {
            e.preventDefault(); P.clearPendingCount(); P.redo(); return;
        }
    }

    P.clearPendingCount = function() {
        P.STATE.pendingCount = null;
        if (P.STATE.pendingTimer) {
            clearTimeout(P.STATE.pendingTimer);
            P.STATE.pendingTimer = null;
        }
    }

    P.schedulePendingCountReset = function() {
        if (P.STATE.pendingTimer) clearTimeout(P.STATE.pendingTimer);
        P.STATE.pendingTimer = setTimeout(function () {
            P.STATE.pendingCount = null;
            P.updateStatus();
        }, 2000);
    }

    /* ======================================================================
       MOUSE HANDLER (click select, drag resize/swap, double-click edit)
       ====================================================================== */
    P.findRegionEl = function(target) {
        var e = target;
        while (e && e !== document.body) {
            if (e.classList && e.classList.contains('pondasi-region')) return e;
            e = e.parentNode;
        }
        return null;
    }

    P.dragState = null;

    P.handleMouseDown = function(e) {
        if (e.button !== 0) return;
        if (P.STATE.editMode.active) return;
        var regionEl = P.findRegionEl(e.target);
        if (!regionEl) return;
        if (e.target.closest('.pondasi-region-label, .pondasi-placeholder, .pondasi-breadcrumb')) return;

        // Shift+klik: multi-select region
        if (e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            var shiftRegionId = regionEl.dataset.id;
            if (P.STATE.selectedIds.indexOf(shiftRegionId) >= 0) {
                // Sudah terpilih → hapus dari seleksi
                P.STATE.selectedIds = P.STATE.selectedIds.filter(function (id) { return id !== shiftRegionId; });
            } else {
                P.addToSelection(shiftRegionId);
            }
            P.render();
            P.flash(P.STATE.selectedIds.length + ' region terpilih');
            return;
        }

        // Deteksi double-click manual
        var regionId = regionEl.dataset.id;
        var now = Date.now();
        if (P._lastClickRegionId === regionId && (now - (P._lastClickTime || 0) < 400)) {
            e.preventDefault();
            e.stopPropagation();
            P._lastClickRegionId = null;
            P._lastClickTime = 0;
            P.setActive(regionId);
            P.clearSelection();
            P.clearPendingCount();
            P.render();
            P.masukModeEdit();
            return;
        }
        P._lastClickRegionId = regionId;
        P._lastClickTime = now;

        var rect = regionEl.getBoundingClientRect();
        var offsetX = e.clientX - rect.left;
        var offsetY = e.clientY - rect.top;
        var w = rect.width;
        var h = rect.height;

        var edgeSize = 6;
        var onEdge = null;
        if (offsetX < edgeSize) onEdge = 'left';
        else if (offsetX > w - edgeSize) onEdge = 'right';
        else if (offsetY < edgeSize) onEdge = 'top';
        else if (offsetY > h - edgeSize) onEdge = 'bottom';

        var node = P.getById(regionEl.dataset.id);
        if (!node) return;

        var mode = null;
        if (onEdge === 'left' || onEdge === 'right') {
            if (node.col !== undefined && !P.isOddCol(node)) mode = 'resize-h';
        } else if (onEdge === 'top' || onEdge === 'bottom') {
            if (node.col === undefined) mode = 'resize-v';
        }
        if (!mode) mode = 'swap';

        P.dragState = {
            startX: e.clientX, startY: e.clientY,
            regionId: regionEl.dataset.id, regionEl: regionEl,
            mode: mode, edge: onEdge, regionRect: rect, started: false
        };
        e.preventDefault();
    }

    P.lastCursorRegion = null;

    P.updateCursorForEdge = function(e) {
        var target = e.target;
        var regionEl = P.findRegionEl(target);
        if (!regionEl) {
            if (P.lastCursorRegion) {
                P.lastCursorRegion.style.cursor = '';
                P.lastCursorRegion = null;
            }
            return;
        }
        var node = P.getById(regionEl.dataset.id);
        if (!node) return;
        if (node.type === 'grand-parent') { regionEl.style.cursor = 'default'; return; }
        var rect = regionEl.getBoundingClientRect();
        var offsetX = e.clientX - rect.left;
        var offsetY = e.clientY - rect.top;
        var w = rect.width;
        var h = rect.height;
        var edgeSize = 6;
        var cursor = '';
        if (offsetX < edgeSize && offsetX > 0) {
            cursor = (node.col !== undefined) ? 'ew-resize' : 'pointer';
        } else if (offsetX > w - edgeSize && offsetX < w) {
            cursor = (node.col !== undefined) ? 'ew-resize' : 'pointer';
        } else if (offsetY < edgeSize && offsetY > 0) {
            cursor = 'ns-resize';
        } else if (offsetY > h - edgeSize && offsetY < h) {
            cursor = 'ns-resize';
        } else {
            cursor = 'pointer';
        }
        if (P.lastCursorRegion && P.lastCursorRegion !== regionEl) {
            P.lastCursorRegion.style.cursor = '';
        }
        regionEl.style.cursor = cursor;
        P.lastCursorRegion = regionEl;
    }

    P.handleMouseMove = function(e) {
        if (!P.dragState) { P.updateCursorForEdge(e); return; }
        var dx = e.clientX - P.dragState.startX;
        var dy = e.clientY - P.dragState.startY;
        if (!P.dragState.started) {
            if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
            P.dragState.started = true;
            if (P.dragState.mode === 'resize-h' || P.dragState.mode === 'resize-v') {
                P.pushUndo();
            }
            document.body.classList.add('pondasi-dragging');
            P.dragState.regionEl.classList.add('pondasi-drag-source');
        }
        if (P.dragState.mode === 'resize-h') {
            var parent = P.getParent(P.dragState.regionId);
            if (!parent) return;
            P.dragState.regionEl = document.querySelector('.pondasi-region[data-id="' + P.dragState.regionId + '"]');
            if (!P.dragState.regionEl) return;
            var parentEl = P.dragState.regionEl.parentElement;
            if (!parentEl) return;
            var parentRect = parentEl.getBoundingClientRect();
            if (parentRect.width === 0) return;
            var oneColWidth = parentRect.width / 12;
            var delta = 0;
            if (P.dragState.edge === 'right') delta = Math.round(dx / oneColWidth);
            else if (P.dragState.edge === 'left') delta = -Math.round(dx / oneColWidth);
            if (delta !== 0) {
                P.resizeByDelta(P.dragState.regionId, delta, P.dragState.edge);
                P.dragState.startX = e.clientX;
                P.dragState.startY = e.clientY;
            }
        } else if (P.dragState.mode === 'resize-v') {
            var node = P.getById(P.dragState.regionId);
            if (!node) return;
            P.dragState.regionEl = document.querySelector('.pondasi-region[data-id="' + P.dragState.regionId + '"]');
            if (!P.dragState.regionEl) return;
            if (!node.h) {
                var cur = P.dragState.regionEl.offsetHeight;
                node.h = Math.max(1, Math.round(cur / 16));
            }
            var deltaRem = Math.round(dy / 16);
            if (deltaRem !== 0) {
                node.h = Math.max(1, node.h + deltaRem);
                P.dragState.startY = e.clientY;
                P.save();
                P.render();
            }
        } else if (P.dragState.mode === 'swap') {
            var targetEl = document.elementFromPoint(e.clientX, e.clientY);
            if (!targetEl) return;
            var targetRegion = P.findRegionEl(targetEl);
            if (targetRegion && targetRegion.dataset.id !== P.dragState.regionId) {
                var src = P.getById(P.dragState.regionId);
                var dst = P.getById(targetRegion.dataset.id);
                if (src && dst) {
                    var srcP = P.getParent(src.id);
                    var dstP = P.getParent(dst.id);
                    if (srcP && dstP && srcP.id === dstP.id) {
                        targetRegion.classList.add('pondasi-drop-target');
                    }
                }
            }
            var allTargets = document.querySelectorAll('.pondasi-drop-target');
            Array.prototype.forEach.call(allTargets, function (t) {
                if (t !== targetRegion) t.classList.remove('pondasi-drop-target');
            });
        }
    }

    P.handleMouseUp = function(e) {
        if (!P.dragState) return;
        if (P.dragState.started && P.dragState.mode === 'swap') {
            var targetEl = document.elementFromPoint(e.clientX, e.clientY);
            if (targetEl) {
                var targetRegion = P.findRegionEl(targetEl);
                if (targetRegion && targetRegion.dataset.id !== P.dragState.regionId) {
                    var src = P.getById(P.dragState.regionId);
                    var dst = P.getById(targetRegion.dataset.id);
                    if (src && dst) {
                        var srcP = P.getParent(src.id);
                        var dstP = P.getParent(dst.id);
                        if (srcP && dstP && srcP.id === dstP.id) {
                            P.pushUndo();
                            var srcIdx = srcP.children.indexOf(src);
                            var dstIdx = dstP.children.indexOf(dst);
                            srcP.children[srcIdx] = dst;
                            srcP.children[dstIdx] = src;
                            P.save();
                        }
                    }
                }
            }
        }
        if (P.dragState.regionEl) P.dragState.regionEl.classList.remove('pondasi-drag-source');
        document.body.classList.remove('pondasi-dragging');
        var allTargets = document.querySelectorAll('.pondasi-drop-target');
        Array.prototype.forEach.call(allTargets, function (t) { t.classList.remove('pondasi-drop-target'); });
        if (!P.dragState.started) {
            P.setActive(P.dragState.regionId);
            if (!e.shiftKey) P.clearSelection();
            P.render();
        } else {
            P.render();
        }
        P.dragState = null;
    }

    P.resizeByDelta = function(regionId, delta, edge) {
        var node = P.getById(regionId);
        if (!node || node.col === undefined) return;
        if (P.isOddCol(node)) { P.flash('Kolom ganjil tidak bisa di-resize'); return; }
        var parent = P.getParent(regionId);
        if (!parent) return;
        var idx = parent.children.indexOf(node);
        if (delta > 0) {
            for (var d = 0; d < delta; d++) {
                var donor = null;
                if (idx < parent.children.length - 1 && parent.children[idx + 1].col > 1) {
                    donor = parent.children[idx + 1];
                    P.setCol(node, node.col + 1);
                    P.setCol(donor, donor.col - 1);
                } else if (idx > 0 && parent.children[idx - 1].col > 1) {
                    donor = parent.children[idx - 1];
                    P.setCol(node, node.col + 1);
                    P.setCol(donor, donor.col - 1);
                } else { break; }
            }
        } else if (delta < 0) {
            if (node.col <= 1) return;
            for (var d2 = 0; d2 < -delta; d2++) {
                if (node.col <= 1) break;
                var receiver = null;
                if (idx > 0) { receiver = parent.children[idx - 1]; }
                else if (idx < parent.children.length - 1) { receiver = parent.children[idx + 1]; }
                if (receiver) {
                    P.setCol(node, node.col - 1);
                    P.setCol(receiver, receiver.col + 1);
                } else { break; }
            }
        }
        P.save();
        P.render();
    }

    /* ======================================================================
       CUT / COPY / PASTE ISI REGION (di luar mode edit)
       ====================================================================== */
    P.clipboardRegionBlocks = null;

    P.yankRegion = function() {
        var node = P.getById(P.STATE.activeId);
        if (!node) { P.flash('Pilih region dulu'); return; }
        if (node.type === 'grand-parent') { P.flash('Grand-parent tidak punya isi'); return; }
        if (node.children && node.children.length > 0) { P.flash('Region punya child — pilih leaf region'); return; }
        if (!node.blocks || node.blocks.length === 0) { P.flash('Region kosong'); return; }
        P.clipboardRegionBlocks = P.deepCopy(node.blocks);
        P.clipboardRegionBlocks.forEach(function (block) { block.id = P.genBlockId(); });
        P.flash(node.blocks.length + ' block disalin (yank)');
    };

    P.cutRegion = function() {
        var node = P.getById(P.STATE.activeId);
        if (!node) { P.flash('Pilih region dulu'); return; }
        if (node.locked) { P.flash('Region terkunci — buka (l) dulu'); return; }
        if (node.type === 'grand-parent') { P.flash('Grand-parent tidak punya isi'); return; }
        if (node.children && node.children.length > 0) { P.flash('Region punya child — pilih leaf region'); return; }
        if (!node.blocks || node.blocks.length === 0) { P.flash('Region kosong'); return; }
        P.pushUndo();
        P.clipboardRegionBlocks = P.deepCopy(node.blocks);
        P.clipboardRegionBlocks.forEach(function (block) { block.id = P.genBlockId(); });
        node.blocks = [];
        P.save();
        P.render();
        P.flash(P.clipboardRegionBlocks.length + ' block dipotong (cut)');
    };

    P.pasteRegion = function() {
        if (!P.clipboardRegionBlocks || P.clipboardRegionBlocks.length === 0) {
            P.flash('Clipboard isi kosong'); return;
        }
        var node = P.getById(P.STATE.activeId);
        if (!node) { P.flash('Pilih region target'); return; }
        if (node.type === 'grand-parent') { P.flash('Pilih child region'); return; }
        if (node.children && node.children.length > 0) { P.flash('Region punya child — pilih leaf'); return; }
        P.pushUndo();
        var newBlocks = P.deepCopy(P.clipboardRegionBlocks);
        newBlocks.forEach(function (block) { block.id = P.genBlockId(); });
        if (!node.blocks) node.blocks = [];
        newBlocks.forEach(function (block) { node.blocks.push(block); });
        P.save();
        P.render();
        P.flash(newBlocks.length + ' block ditempel (paste)');
    };

    /* ======================================================================
       PANEL FIELD NAVIGATION (Tab/Arrow di panel properti)
       ====================================================================== */
    P.pindahFieldPanel = function(elemenAktif, arah) {
        var panel = document.getElementById('panel-properti');
        if (!panel) return;
        var badan = document.getElementById('panel-properti-badan');
        if (!badan) badan = panel;

        var semuaField = [];
        var summaries = badan.querySelectorAll('details > summary');
        for (var s = 0; s < summaries.length; s++) {
            semuaField.push(summaries[s]);
        }
        var fields = badan.querySelectorAll(
            'input[type="text"]:not([readonly]), input[type="number"], input[type="checkbox"], ' +
            'select, textarea, button.pondasi-properti-warna-btn'
        );
        for (var i = 0; i < fields.length; i++) {
            var dp = fields[i].closest('details');
            if (dp && !dp.hasAttribute('open')) continue;
            semuaField.push(fields[i]);
        }

        if (semuaField.length === 0) {
            var semuaDetails = badan.querySelectorAll('details');
            for (var d = 0; d < semuaDetails.length; d++) {
                if (!semuaDetails[d].hasAttribute('open')) {
                    semuaDetails[d].setAttribute('open', 'open');
                    return P.pindahFieldPanel(elemenAktif, arah);
                }
            }
            return;
        }

        semuaField.sort(function (a, b) {
            if (a.compareDocumentPosition) {
                var rel = a.compareDocumentPosition(b);
                if (rel & 4) return -1;
                if (rel & 2) return 1;
            }
            return 0;
        });

        var aktif = document.activeElement;
        var idxAktif = -1;
        for (var j = 0; j < semuaField.length; j++) {
            if (semuaField[j] === aktif || semuaField[j] === elemenAktif) {
                idxAktif = j;
                break;
            }
        }

        var idxBaru;
        if (idxAktif < 0) {
            idxBaru = arah > 0 ? 0 : semuaField.length - 1;
        } else {
            idxBaru = idxAktif + arah;
            if (idxBaru >= semuaField.length) idxBaru = 0;
            if (idxBaru < 0) idxBaru = semuaField.length - 1;
        }

        var target = semuaField[idxBaru];
        if (!target) return;

        // Hapus class pondasi-field-aktif dari semua field
        var semuaAktif = badan.querySelectorAll('.pondasi-field-aktif');
        for (var k = 0; k < semuaAktif.length; k++) {
            semuaAktif[k].classList.remove('pondasi-field-aktif');
        }

        // Buka details parent kalau tertutup
        if (target.tagName !== 'SUMMARY') {
            var td = target.closest('details');
            if (td && !td.hasAttribute('open')) td.setAttribute('open', 'open');
        }
        // Set tabindex untuk summary
        if (target.tagName === 'SUMMARY') target.setAttribute('tabindex', '0');
        // Tambah class aktif
        target.classList.add('pondasi-field-aktif');
        // Fokus
        target.focus();
        // Select all untuk text input
        if ((target.tagName === 'INPUT' && target.type === 'text') ||
            target.tagName === 'TEXTAREA') {
            try { target.select(); } catch (e) {}
        }
        // Scroll
        if (target.scrollIntoView) target.scrollIntoView({ block: 'nearest' });
    };

    /* ======================================================================
       KEYBOARD-DRIVEN DROPDOWN & BLOCK NAVIGATION
       ====================================================================== */
    P.dropdownKeyboardState = { aktifIdx: -1 };

    P.bukaDropdownKeyboard = function(jenis) {
        var ddTarget = document.getElementById(jenis === 'isi' ? 'dropdown-isi' : 'dropdown-komponen');
        var ddLain = document.getElementById(jenis === 'isi' ? 'dropdown-komponen' : 'dropdown-isi');
        if (ddLain) ddLain.hidden = true;
        if (ddTarget) {
            ddTarget.hidden = false;
            // Render mega dropdown dinamis (ganti dari dropdown hardcoded lama)
            if (P.renderMegaDropdown) {
                P.renderMegaDropdown(jenis);
            }
            P.posisikanDropdown(ddTarget, document.getElementById(jenis === 'isi' ? 'btn-isi' : 'btn-komponen'));
        }
        P.dropdownKeyboardState.aktifIdx = -1;
        P.dropdownKeyboardState.kategoriIdx = 0;
        P.dropdownKeyboardState.fokus = 'kategori';
        // Set focus ke kategori pertama supaya keyboard nav jalan
        setTimeout(function () {
            var dd = document.getElementById(jenis === 'isi' ? 'dropdown-isi' : 'dropdown-komponen');
            if (!dd || dd.hidden) return;
            dd.setAttribute('tabindex', '-1');
            dd.focus();
            // Highlight kategori pertama + tampilkan isi kategori pertama
            var kategoriItems = dd.querySelectorAll('.pondasi-mega-dropdown-kategori-item');
            var isiKategoriEls = dd.querySelectorAll('.pondasi-mega-dropdown-isi-kategori');
            // Sembunyikan semua isi kategori dulu
            for (var i = 0; i < isiKategoriEls.length; i++) {
                isiKategoriEls[i].style.display = 'none';
            }
            if (kategoriItems.length > 0) {
                kategoriItems[0].classList.add('pondasi-mega-dropdown-kategori-item-aktif');
                // Focus ke kategori pertama supaya arrow key langsung jalan
                if (kategoriItems[0].focus) kategoriItems[0].focus();
            }
            if (isiKategoriEls.length > 0) {
                isiKategoriEls[0].style.display = 'block';
                // Highlight item pertama (tapi tidak focus)
                var firstItem = isiKategoriEls[0].querySelector('.pondasi-mega-dropdown-item');
                if (firstItem) {
                    firstItem.classList.add('pondasi-mega-dropdown-item-aktif');
                }
            }
        }, 50);
        P.setStatusline('↑↓ pindah (kategori/item), → masuk ke item, ← kembali ke kategori, Enter pilih, Esc batal');
    };

    P.tutupDropdownKeyboard = function() {
        var ddIsi = document.getElementById('dropdown-isi');
        var ddKomponen = document.getElementById('dropdown-komponen');
        if (ddIsi) ddIsi.hidden = true;
        if (ddKomponen) ddKomponen.hidden = true;
        P.dropdownKeyboardState.aktifIdx = -1;
        P.setStatusline('siap');
    };

    P.highlightDropdownItem = function(items, idx) {
        for (var i = 0; i < items.length; i++) {
            if (i === idx) items[i].classList.add('pondasi-dropdown-item-aktif');
            else items[i].classList.remove('pondasi-dropdown-item-aktif');
        }
        if (items[idx] && items[idx].scrollIntoView) items[idx].scrollIntoView({ block: 'nearest' });
    };

    P.handleDropdownKeyboard = function(e) {
        var ddIsi = document.getElementById('dropdown-isi');
        var ddKomponen = document.getElementById('dropdown-komponen');
        var dd = null;
        if (ddIsi && !ddIsi.hidden) dd = ddIsi;
        if (ddKomponen && !ddKomponen.hidden) dd = ddKomponen;
        if (!dd) return;

        // Cek apakah ini mega dropdown (punya .pondasi-mega-dropdown-kategori-item)
        var isMega = dd.querySelector('.pondasi-mega-dropdown-kategori-item');
        if (!isMega) {
            // Fallback: dropdown lama (hardcoded)
            var itemsLama = dd.querySelectorAll('.pondasi-dropdown-item');
            if (itemsLama.length === 0) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                P.dropdownKeyboardState.aktifIdx = Math.min(P.dropdownKeyboardState.aktifIdx + 1, itemsLama.length - 1);
                P.highlightDropdownItem(itemsLama, P.dropdownKeyboardState.aktifIdx);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                P.dropdownKeyboardState.aktifIdx = Math.max(P.dropdownKeyboardState.aktifIdx - 1, 0);
                P.highlightDropdownItem(itemsLama, P.dropdownKeyboardState.aktifIdx);
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                var idx = P.dropdownKeyboardState.aktifIdx;
                if (idx >= 0 && idx < itemsLama.length) {
                    var item = itemsLama[idx];
                    if (item.dataset.insert) P.insertBlock(item.dataset.insert, false);
                    else if (item.dataset.insertKomponen) P.insertBlock(item.dataset.insertKomponen, true);
                    P.tutupDropdownKeyboard();
                    setTimeout(function () { P.fokusKeFieldTeksBlockBaru(); }, 100);
                }
                return;
            }
            return;
        }

        // === MEGA DROPDOWN NAVIGATION ===
        var kategoriItems = dd.querySelectorAll('.pondasi-mega-dropdown-kategori-item');
        var kategoriAktifEl = dd.querySelector('.pondasi-mega-dropdown-kategori-item-aktif');
        var kategoriAktifIdx = -1;
        for (var ki = 0; ki < kategoriItems.length; ki++) {
            if (kategoriItems[ki] === kategoriAktifEl) { kategoriAktifIdx = ki; break; }
        }

        // Item di kategori aktif
        var items = [];
        if (kategoriAktifEl) {
            var kat = kategoriAktifEl.getAttribute('data-kategori');
            var isiKat = dd.querySelector('.pondasi-mega-dropdown-isi-kategori[data-kategori="' + kat + '"]');
            if (isiKat) {
                items = isiKat.querySelectorAll('.pondasi-mega-dropdown-item');
            }
        }

        // Inisialisasi state kalau belum ada
        if (P.dropdownKeyboardState.aktifIdx === -1) P.dropdownKeyboardState.aktifIdx = 0;
        if (P.dropdownKeyboardState.kategoriIdx === undefined) P.dropdownKeyboardState.kategoriIdx = 0;
        if (P.dropdownKeyboardState.kategoriIdx !== kategoriAktifIdx && kategoriAktifIdx >= 0) {
            P.dropdownKeyboardState.kategoriIdx = kategoriAktifIdx;
            P.dropdownKeyboardState.aktifIdx = 0;
        }

        // === NAVIGASI NATURAL (mirip file explorer) ===
        // Di kolom kategori (fokus = 'kategori'):
        //   ArrowUp/ArrowDown: pindah kategori
        //   ArrowRight: masuk ke kolom item
        // Di kolom item (fokus = 'item'):
        //   ArrowUp/ArrowDown: pindah item (wrap ke kategori sebelum/berikut)
        //   ArrowLeft: kembali ke kolom kategori

        var fokus = P.dropdownKeyboardState.fokus || 'kategori';

        // ArrowLeft: kembali ke kolom kategori (dari item)
        if (e.key === 'ArrowLeft' && !e.shiftKey && !e.altKey && !e.ctrlKey) {
            e.preventDefault();
            P.dropdownKeyboardState.fokus = 'kategori';
            if (kategoriAktifEl && kategoriAktifEl.focus) {
                kategoriAktifEl.focus();
            }
            return;
        }

        // ArrowRight: dari kategori → masuk ke item pertama di kategori aktif
        if (e.key === 'ArrowRight' && !e.shiftKey && !e.altKey && !e.ctrlKey) {
            e.preventDefault();
            P.dropdownKeyboardState.fokus = 'item';
            P.dropdownKeyboardState.aktifIdx = 0;
            if (items.length > 0) {
                P.highlightMegaItem(dd, items, 0);
                if (items[0] && items[0].focus) items[0].focus();
            }
            return;
        }

        // ArrowUp/ArrowDown: navigasi tergantung fokus
        if (e.key === 'ArrowUp' && !e.shiftKey) {
            e.preventDefault();
            if (fokus === 'kategori') {
                // Di kategori → pindah kategori ke atas (wrap ke bawah kalau di paling atas)
                var newKatUp = P.dropdownKeyboardState.kategoriIdx - 1;
                if (newKatUp < 0) newKatUp = kategoriItems.length - 1;
                P.dropdownKeyboardState.kategoriIdx = newKatUp;
                P.dropdownKeyboardState.aktifIdx = 0;
                P.aktifkanKategoriMega(dd, newKatUp);
                if (kategoriItems[newKatUp] && kategoriItems[newKatUp].focus) {
                    kategoriItems[newKatUp].focus();
                }
            } else {
                // Di item → pindah item ke atas. Kalau item pertama, pindah ke kategori sebelumnya, item terakhir
                if (P.dropdownKeyboardState.aktifIdx > 0) {
                    P.dropdownKeyboardState.aktifIdx--;
                    P.highlightMegaItem(dd, items, P.dropdownKeyboardState.aktifIdx);
                    if (items[P.dropdownKeyboardState.aktifIdx] && items[P.dropdownKeyboardState.aktifIdx].focus) {
                        items[P.dropdownKeyboardState.aktifIdx].focus();
                    }
                } else {
                    // Item pertama → pindah ke kategori sebelumnya, item terakhir
                    var newKatUp2 = P.dropdownKeyboardState.kategoriIdx - 1;
                    if (newKatUp2 < 0) newKatUp2 = kategoriItems.length - 1;
                    P.dropdownKeyboardState.kategoriIdx = newKatUp2;
                    P.aktifkanKategoriMega(dd, newKatUp2);
                    // Ambil items di kategori baru
                    var katBaru = kategoriItems[newKatUp2].getAttribute('data-kategori');
                    var isiKatBaru = dd.querySelector('.pondasi-mega-dropdown-isi-kategori[data-kategori="' + katBaru + '"]');
                    var itemsKatBaru = isiKatBaru ? isiKatBaru.querySelectorAll('.pondasi-mega-dropdown-item') : [];
                    P.dropdownKeyboardState.aktifIdx = itemsKatBaru.length - 1;
                    P.highlightMegaItem(dd, itemsKatBaru, P.dropdownKeyboardState.aktifIdx);
                    if (itemsKatBaru[P.dropdownKeyboardState.aktifIdx] && itemsKatBaru[P.dropdownKeyboardState.aktifIdx].focus) {
                        itemsKatBaru[P.dropdownKeyboardState.aktifIdx].focus();
                    }
                }
            }
            return;
        }
        if (e.key === 'ArrowDown' && !e.shiftKey) {
            e.preventDefault();
            if (fokus === 'kategori') {
                // Di kategori → pindah kategori ke bawah (wrap ke atas kalau di paling bawah)
                var newKatDn = P.dropdownKeyboardState.kategoriIdx + 1;
                if (newKatDn >= kategoriItems.length) newKatDn = 0;
                P.dropdownKeyboardState.kategoriIdx = newKatDn;
                P.dropdownKeyboardState.aktifIdx = 0;
                P.aktifkanKategoriMega(dd, newKatDn);
                if (kategoriItems[newKatDn] && kategoriItems[newKatDn].focus) {
                    kategoriItems[newKatDn].focus();
                }
            } else {
                // Di item → pindah item ke bawah. Kalau item terakhir, pindah ke kategori berikutnya, item pertama
                if (P.dropdownKeyboardState.aktifIdx < items.length - 1) {
                    P.dropdownKeyboardState.aktifIdx++;
                    P.highlightMegaItem(dd, items, P.dropdownKeyboardState.aktifIdx);
                    if (items[P.dropdownKeyboardState.aktifIdx] && items[P.dropdownKeyboardState.aktifIdx].focus) {
                        items[P.dropdownKeyboardState.aktifIdx].focus();
                    }
                } else {
                    // Item terakhir → pindah ke kategori berikutnya, item pertama
                    var newKatDn2 = P.dropdownKeyboardState.kategoriIdx + 1;
                    if (newKatDn2 >= kategoriItems.length) newKatDn2 = 0;
                    P.dropdownKeyboardState.kategoriIdx = newKatDn2;
                    P.aktifkanKategoriMega(dd, newKatDn2);
                    P.dropdownKeyboardState.aktifIdx = 0;
                    // Ambil items di kategori baru
                    var katBaru2 = kategoriItems[newKatDn2].getAttribute('data-kategori');
                    var isiKatBaru2 = dd.querySelector('.pondasi-mega-dropdown-isi-kategori[data-kategori="' + katBaru2 + '"]');
                    var itemsKatBaru2 = isiKatBaru2 ? isiKatBaru2.querySelectorAll('.pondasi-mega-dropdown-item') : [];
                    P.highlightMegaItem(dd, itemsKatBaru2, 0);
                    if (itemsKatBaru2[0] && itemsKatBaru2[0].focus) {
                        itemsKatBaru2[0].focus();
                    }
                }
            }
            return;
        }
        // Tab: pindah antar kategori
        if (e.key === 'Tab' && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            var arah = e.shiftKey ? -1 : 1;
            var newKatIdx3 = P.dropdownKeyboardState.kategoriIdx + arah;
            if (newKatIdx3 < 0) newKatIdx3 = kategoriItems.length - 1;
            if (newKatIdx3 >= kategoriItems.length) newKatIdx3 = 0;
            P.dropdownKeyboardState.kategoriIdx = newKatIdx3;
            P.dropdownKeyboardState.aktifIdx = 0;
            P.dropdownKeyboardState.fokus = 'kategori';
            P.aktifkanKategoriMega(dd, newKatIdx3);
            if (kategoriItems[newKatIdx3] && kategoriItems[newKatIdx3].focus) {
                kategoriItems[newKatIdx3].focus();
            }
            return;
        }
        // Enter: pilih item
        if (e.key === 'Enter') {
            e.preventDefault();
            if (P.dropdownKeyboardState.aktifIdx >= 0 && P.dropdownKeyboardState.aktifIdx < items.length) {
                var itemEl = items[P.dropdownKeyboardState.aktifIdx];
                if (itemEl.classList.contains('pondasi-mega-dropdown-item-disabled')) {
                    var title = itemEl.getAttribute('title') || 'Kelas ini bermasalah.';
                    P.flash(title);
                    return;
                }
                var jenisBlock = itemEl.getAttribute('data-jenis');
                var kelasDefault = itemEl.getAttribute('data-kelas');
                var tag = itemEl.getAttribute('data-tag');
                var sumber = itemEl.getAttribute('data-sumber');
                if (jenisBlock && P.SKEMA_BLOCK[jenisBlock]) {
                    // Built-in block — pakai insertBlockFromSkema
                    if (P.insertBlockFromSkema) {
                        P.insertBlockFromSkema(jenisBlock);
                    } else {
                        P.insertBlock(jenisBlock, false);
                    }
                } else if (sumber === 'eksternal' && kelasDefault) {
                    P.insertBlockCustom(kelasDefault, tag || 'div');
                }
                P.tutupDropdownKeyboard();
                setTimeout(function () { P.fokusKeFieldTeksBlockBaru(); }, 100);
            }
            return;
        }
    };

    /* Helper: aktifkan kategori di mega dropdown */
    P.aktifkanKategoriMega = function(dd, idx) {
        var kategoriItems = dd.querySelectorAll('.pondasi-mega-dropdown-kategori-item');
        var isiKategoriEls = dd.querySelectorAll('.pondasi-mega-dropdown-isi-kategori');
        // Hapus aktif dari semua
        for (var i = 0; i < kategoriItems.length; i++) {
            kategoriItems[i].classList.remove('pondasi-mega-dropdown-kategori-item-aktif');
        }
        // Sembunyikan semua isi kategori
        for (var j = 0; j < isiKategoriEls.length; j++) {
            isiKategoriEls[j].style.display = 'none';
        }
        if (idx < 0 || idx >= kategoriItems.length) return;
        // Aktifkan kategori yang dipilih
        kategoriItems[idx].classList.add('pondasi-mega-dropdown-kategori-item-aktif');
        var kat = kategoriItems[idx].getAttribute('data-kategori');
        var target = dd.querySelector('.pondasi-mega-dropdown-isi-kategori[data-kategori="' + kat + '"]');
        if (target) {
            target.style.display = 'block';
            // Highlight item pertama di kategori baru
            var firstItem = target.querySelector('.pondasi-mega-dropdown-item');
            var allItems = dd.querySelectorAll('.pondasi-mega-dropdown-item');
            for (var k = 0; k < allItems.length; k++) {
                allItems[k].classList.remove('pondasi-mega-dropdown-item-aktif');
            }
            if (firstItem) firstItem.classList.add('pondasi-mega-dropdown-item-aktif');
        }
    };

    /* Helper: highlight item di mega dropdown */
    P.highlightMegaItem = function(dd, items, idx) {
        // Hapus aktif dari semua item (di semua kategori)
        var allItems = dd.querySelectorAll('.pondasi-mega-dropdown-item');
        for (var i = 0; i < allItems.length; i++) {
            allItems[i].classList.remove('pondasi-mega-dropdown-item-aktif');
        }
        if (idx >= 0 && idx < items.length) {
            items[idx].classList.add('pondasi-mega-dropdown-item-aktif');
            // Scroll ke item kalau di luar viewport
            if (items[idx].scrollIntoView) {
                items[idx].scrollIntoView({ block: 'nearest' });
            }
        }
    };

    P.fokusKeFieldTeksBlockBaru = function() {
        var node = P.getById(P.STATE.editMode.regionId);
        if (!node || !node.blocks) return;
        var blockBaru = node.blocks[node.blocks.length - 1];
        if (!blockBaru) return;
        P.pilihBlock(blockBaru.id);
        setTimeout(function () {
            var panel = document.getElementById('panel-properti');
            if (!panel || panel.hidden) return;
            var firstDetails = panel.querySelector('details');
            if (firstDetails && !firstDetails.hasAttribute('open')) {
                firstDetails.setAttribute('open', 'open');
            }
            var fields = ['isi', 'judul', 'kepala', 'label', 'kelas'];
            for (var i = 0; i < fields.length; i++) {
                var inp = panel.querySelector('[data-field="' + fields[i] + '"]');
                if (inp && inp.offsetParent !== null) {
                    inp.focus();
                    if (inp.select) inp.select();
                    return;
                }
            }
            var firstInput = panel.querySelector('input[type="text"]:not([readonly]), input[type="number"], select, textarea');
            if (firstInput && firstInput.offsetParent !== null) firstInput.focus();
        }, 50);
    };

    P.bukaPropertiRegion = function() {
        var panel = document.getElementById('panel-properti');
        if (!panel) return;
        if (P.STATE.editMode.selectedBlockId) P.batalPilihBlock();
        panel.hidden = false;
        P.posisikanPanel(panel);
        P.renderPanel();
        var btnP = document.getElementById('btn-properti');
        if (btnP) btnP.classList.add('pondasi-editor-bar-aktif');
        setTimeout(function () {
            if (panel.hidden) return;
            var firstDetails = panel.querySelector('details');
            if (firstDetails && !firstDetails.hasAttribute('open')) {
                firstDetails.setAttribute('open', 'open');
            }
            var firstInput = panel.querySelector('input[type="text"]:not([readonly]), input[type="number"], select');
            if (firstInput && firstInput.offsetParent !== null) firstInput.focus();
        }, 50);
        P.setStatusline('Properti region — ↑↓ pindah field, Spasi buka/tutup group, Esc kembali ke region');
    };

    P.navigasiBlock = function(arah) {
        var node = P.getById(P.STATE.editMode.regionId);
        if (!node || !node.blocks || node.blocks.length === 0) return;
        var idxSekarang = -1;
        if (P.STATE.editMode.selectedBlockId) {
            idxSekarang = P.cariIndexBlock(P.STATE.editMode.selectedBlockId);
        }
        var idxBaru = idxSekarang + arah;
        if (idxBaru < 0) idxBaru = 0;
        if (idxBaru >= node.blocks.length) idxBaru = node.blocks.length - 1;
        if (idxBaru === idxSekarang) return;
        P.pilihBlock(node.blocks[idxBaru].id);
    };

    P.pindahBlockAktif = function(arah) {
        if (!P.STATE.editMode.selectedBlockId) { P.flash('Pilih block dulu'); return; }
        var idx = P.cariIndexBlock(P.STATE.editMode.selectedBlockId);
        if (idx < 0) return;
        P.pindahBlock(idx, arah);
        P.renderPanel();
    };

    P.masukPropertiBlock = function() {
        if (!P.STATE.editMode.selectedBlockId) { P.flash('Pilih block dulu'); return; }
        var panel = document.getElementById('panel-properti');
        if (!panel) return;
        panel.hidden = false;
        P.posisikanPanel(panel);
        P.renderPanel();
        var btnP = document.getElementById('btn-properti');
        if (btnP) btnP.classList.add('pondasi-editor-bar-aktif');
        setTimeout(function () {
            if (panel.hidden) return;
            var firstDetails = panel.querySelector('details');
            if (firstDetails && !firstDetails.hasAttribute('open')) {
                firstDetails.setAttribute('open', 'open');
            }
            var fields = ['isi', 'judul', 'kepala', 'label', 'kelas'];
            for (var i = 0; i < fields.length; i++) {
                var inp = panel.querySelector('[data-field="' + fields[i] + '"]');
                if (inp && inp.offsetParent !== null) {
                    inp.focus();
                    if (inp.select) inp.select();
                    return;
                }
            }
            var firstInput = panel.querySelector('input[type="text"]:not([readonly]), input[type="number"], select, textarea');
            if (firstInput && firstInput.offsetParent !== null) firstInput.focus();
        }, 50);
        P.setStatusline('Properti block — ↑↓ pindah field, Spasi buka/tutup group, Esc kembali ke region');
    };

    P.yankBlockAktif = function() {
        if (!P.STATE.editMode.selectedBlockId) { P.flash('Pilih block dulu'); return; }
        var idx = P.cariIndexBlock(P.STATE.editMode.selectedBlockId);
        if (idx < 0) return;
        P.salinBlock(idx);
        P.setStatusline('Block disalin (yank)');
    };

    P.cutBlockAktif = function() {
        if (!P.STATE.editMode.selectedBlockId) { P.flash('Pilih block dulu'); return; }
        var idx = P.cariIndexBlock(P.STATE.editMode.selectedBlockId);
        if (idx < 0) return;
        P.potongBlock(idx);
        P.STATE.editMode.selectedBlockId = null;
        P.renderBlocks();
        P.renderPanel();
        P.setStatusline('Block dipotong (cut)');
    };

    P.pasteBlockAktif = function() {
        if (!P.clipboardBlock) { P.flash('Clipboard kosong'); return; }
        var node = P.getById(P.STATE.editMode.regionId);
        if (!node || !node.blocks) return;
        var idx = -1;
        if (P.STATE.editMode.selectedBlockId) {
            idx = P.cariIndexBlock(P.STATE.editMode.selectedBlockId);
        }
        if (idx < 0) idx = node.blocks.length - 1;
        P.tempelBlock(idx);
        var newIdx = idx + 1;
        if (node.blocks[newIdx]) P.pilihBlock(node.blocks[newIdx].id);
        P.setStatusline('Block ditempel (paste)');
    };
