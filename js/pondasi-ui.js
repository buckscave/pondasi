/* PONDASI-UI.JS */
var P = P || {};

    /* ======================================================================
       TOOLBAR / FLOATING HANDLER (kanan + modal actions)
       ====================================================================== */
    P.handleFloating = function(e) {
        var btn = e.target.closest('[data-action]');
        if (!btn) return;
        var action = btn.dataset.action;
        switch (action) {
            case 'help':
                // Kalau sidebar/dialog terbuka, jangan buka help — biar tidak tertutup sidebar
                if (!P.semuaModalTutup()) return;
                P.showHelp();
                break;
            case 'close-help':
                P.hideHelp();
                break;
            case 'toggle-panel-region':
                // Tombol floating kanan untuk toggle panel region (shortcut w)
                if (P.togglePanelRegion) P.togglePanelRegion();
                break;
            case 'toggle-guide':
                P.toggleGuide();
                break;
            case 'toggle-grid':
                P.toggleGrid();
                break;
            case 'toggle-jarak':
                P.toggleJarak();
                break;
            case 'toggle-preview':
                P.togglePreview();
                break;
            case 'reset-workspace':
                P.konfirmasi('Bersihkan workspace? Semua region akan dihapus dan tidak bisa di-undo.', function (ok) {
                    if (ok) {
                        P.pushUndo();
                        P.STATE.tree = P.nGrandParent();
                        P.STATE.activeId = P.STATE.tree.id;
                        P.STATE.selectedIds = [];
                        P.syncToProject();
                        P.save();
                        P.render();
                        P.flash('Workspace dibersihkan');
                    }
                }, 'Reset Workspace', 'Reset', 'Batal');
                break;
        }
    }

    P.guideVisible = false;
    P.gridVisible = false;
    P.guideSystem = 'both';  // '12' | '10' | 'both'
    P.guideDenganJarak = false;  // toggle jarak untuk guide overlay
    P.jarakAktif = false;  // toggle jarak untuk region split (apply .jarak ke .baris/.sub-baris)

    // Deteksi sistem kolom region aktif (12 atau 10)
    P.detectColumnSystem = function(node) {
        if (!node) return 'both';
        // Cek apakah region aktif adalah kolom sistem 10 (ganjil nama Indonesia)
        if (P.isOddCol(node)) return '10';
        // Cek parent: jika parent punya anak-anak kolom ganjil → sistem 10
        var parent = P.getParent(node.id);
        if (parent && parent.children.length > 0) {
            var firstChild = parent.children[0];
            if (P.isOddCol(firstChild)) return '10';
        }
        // Cek apakah region aktif punya child kolom ganjil
        if (node.children && node.children.length > 0) {
            if (P.isOddCol(node.children[0])) return '10';
        }
        // Cek kelas: kolom-lima/tujuh/delapan/sembilan/sepuluh/sebelas
        if (node.classes) {
            for (var i = 0; i < node.classes.length; i++) {
                var c = node.classes[i];
                if (c === 'kolom-lima' || c === 'kolom-tujuh' || c === 'kolom-delapan' ||
                    c === 'kolom-sembilan' || c === 'kolom-sepuluh' || c === 'kolom-sebelas') {
                    return '10';
                }
            }
        }
        return '12';
    }

    P.updateGuideSystem = function() {
        var active = P.getById(P.STATE.activeId);
        P.guideSystem = P.detectColumnSystem(active);
        // Update overlay: tampilkan/hapus baris yang tidak relevan
        var baris12 = document.querySelector('.pondasi-guide-baris-12');
        var baris10 = document.querySelector('.pondasi-guide-baris-10');
        var label12 = document.querySelector('.pondasi-guide-label-12');
        var label10 = document.querySelector('.pondasi-guide-label-10');
        if (P.guideSystem === '12') {
            if (baris12) baris12.style.display = '';
            if (baris10) baris10.style.display = 'none';
            if (label12) label12.style.display = '';
            if (label10) label10.style.display = 'none';
        } else if (P.guideSystem === '10') {
            if (baris12) baris12.style.display = 'none';
            if (baris10) baris10.style.display = '';
            if (label12) label12.style.display = 'none';
            if (label10) label10.style.display = '';
        } else {
            if (baris12) baris12.style.display = '';
            if (baris10) baris10.style.display = '';
            if (label12) label12.style.display = '';
            if (label10) label10.style.display = '';
        }
    }

    P.toggleGuide = function() {
        P.guideVisible = !P.guideVisible;
        var g = document.getElementById('guide-overlay');
        if (g) g.hidden = !P.guideVisible;
        var btn = document.getElementById('btn-guide');
        if (btn) {
            if (P.guideVisible) btn.classList.add('pondasi-floating-btn-aktif');
            else btn.classList.remove('pondasi-floating-btn-aktif');
        }
        if (P.guideVisible) {
            P.updateGuideSystem();
            // Apply jarak juga (kalau state P.guideDenganJarak true)
            P.applyJarakKeGuide();
            var teks = 'panduan ' + (P.guideSystem === 'both' ? '12/10' : P.guideSystem) + ' kolom aktif';
            if (P.guideDenganJarak) teks += ' (dengan jarak)';
            P.setStatusline(teks);
        } else {
            P.setStatusline('panduan dimatikan');
        }
    }

    P.toggleGrid = function() {
        P.gridVisible = !P.gridVisible;
        var g = document.getElementById('grid-overlay');
        if (g) g.hidden = !P.gridVisible;
        var btn = document.getElementById('btn-grid');
        if (btn) {
            if (P.gridVisible) btn.classList.add('pondasi-floating-btn-aktif');
            else btn.classList.remove('pondasi-floating-btn-aktif');
        }
        P.setStatusline(P.gridVisible ? 'grid 16px aktif' : 'grid dimatikan');
    }

    // Toggle jarak — apply .jarak ke parent dari region aktif (hybrid)
    // User bisa pilih baris/sub-baris mana yang berjarak, mana yang rapat.
    // Jika region aktif adalah kolom-*, .jarak diletakkan di parent-nya (section/sub-parent).
    // Jika region aktif adalah section/sub-baris sendiri, .jarak diletakkan di region itu.
    // Juga apply ke guide overlay agar konsisten.
    P.toggleJarak = function() {
        P.jarakAktif = !P.jarakAktif;
        var btn = document.getElementById('btn-jarak');
        if (btn) {
            if (P.jarakAktif) btn.classList.add('pondasi-floating-btn-aktif');
            else btn.classList.remove('pondasi-floating-btn-aktif');
        }
        // Apply ke parent region aktif
        P.applyJarakKeParentAktif();
        // Apply ke guide overlay
        P.guideDenganJarak = P.jarakAktif;
        P.applyJarakKeGuide();
        // Statusline — tampilkan target yang di-apply
        var node = P.getById(P.STATE.activeId);
        var teks = '';
        if (P.jarakAktif) {
            teks = 'jarak aktif — ';
        } else {
            teks = 'jarak dimatikan — ';
        }
        if (node) {
            var target = node;
            if (node.type === 'child') {
                target = P.getParent(P.STATE.activeId);
            }
            if (target) {
                teks += 'diterapkan ke ' + P.regionLabel(target).split('.').slice(0, 2).join('.');
            } else {
                teks += 'diterapkan ke root';
            }
        }
        P.setStatusline(teks);
    }

    // Toggle preview — buka di tab baru via preview.html
    P.previewVisible = false;
    P.togglePreview = function() {
        var btn = document.getElementById('btn-preview');
        // Generate HTML lengkap dari tree
        var html = P.buatHTMLPreview();
        // Simpan ke sessionStorage
        try {
            sessionStorage.setItem('pondasi-preview-html', html);
        } catch (e) {
            P.flash('Gagal menyimpan preview: ' + (e.message || 'sessionStorage penuh'));
            return;
        }
        // Buka preview.html di tab baru
        var base = window.location.href.replace(/[^/]*$/, '');
        window.open(base + 'preview.html', '_blank');
        if (btn) btn.classList.add('pondasi-floating-btn-aktif');
        P.setStatusline('Preview dibuka di tab baru');
        setTimeout(function() {
            if (btn) btn.classList.remove('pondasi-floating-btn-aktif');
        }, 1000);
    }

    // Buat HTML lengkap dari tree untuk preview — buka di tab baru, path absolute
    P.buatHTMLPreview = function() {
        var settings = P.getProjectSettings();
        // Base path = lokasi pondasi (window.location.origin + path ke folder pondasi)
        var base = window.location.href.replace(/[^/]*$/, '');
        // Generate CSS link tags — pakai absolute path supaya Blob URL bisa akses
        var cssLinks = '';
        var semuaBerkas = [
            'css/pondasi.css',
            'css/tampilan.css',
            'css/tampilan-teks.css',
            'css/tampilan-teks-tambahan.css',
            'css/tampilan-daftar.css',
            'css/tampilan-media.css',
            'css/tampilan-tabel.css',
            'css/tampilan-tombol.css',
            'css/tampilan-form.css',
            'css/tampilan-kontainer.css',
            'css/tampilan-navigasi.css',
            'css/tampilan-feedback.css',
            'css/tampilan-lainnya.css',
            'css/tampilan-tambahan.css',
            'css/pondasi-aksi.css'
        ];
        semuaBerkas.forEach(function (b) {
            cssLinks += '<link rel="stylesheet" href="' + base + b + '">';
        });
        // CSS eksternal dari settings
        if (settings.cssLinks && settings.cssLinks.length > 0) {
            settings.cssLinks.forEach(function (href) {
                if (href) cssLinks += '<link rel="stylesheet" href="' + href + '">';
            });
        }
        var customCSS = '';
        if (Object.keys(P.STATE.customCSS).length > 0) {
            customCSS = '<style>' + P.generateCustomCSS() + '</style>';
        }
        if (typeof P.generateBlockPseudoCSSForExport === 'function') {
            var pseudoCSS = P.generateBlockPseudoCSSForExport();
            if (pseudoCSS) customCSS += '<style>' + pseudoCSS + '</style>';
        }
        var bodyAttrs = '';
        if (settings.temaWarna === 'gelap') bodyAttrs = ' data-tema="gelap"';
        if (settings.dimensi) bodyAttrs += ' data-dimensi="' + settings.dimensi + '"';
        var bodyStyle = '';
        if (settings.fontFamily || settings.fontSize || settings.lineHeight) {
            var sp = [];
            if (settings.fontFamily) sp.push('font-family: ' + settings.fontFamily);
            if (settings.fontSize) sp.push('font-size: ' + settings.fontSize);
            if (settings.lineHeight) sp.push('line-height: ' + settings.lineHeight);
            bodyStyle = ' style="' + sp.join('; ') + '"';
        }
        // Include pondasi-aksi.js + init (selalu include di preview supaya semua aksi bekerja)
        var aksiScript = '<script src="' + base + 'js/pondasi-aksi.js"></' + 'script>' +
            '<script>PondasiAksi.init(document);</' + 'script>';

        return '<!DOCTYPE html><html lang="' + (settings.bahasa || 'id') + '"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' + cssLinks + customCSS + '</head><body' + bodyAttrs + bodyStyle + '>' + P.serializeNode(P.STATE.tree, 0) + aksiScript + '</body></html>';
    }

    // Apply/hapus kelas .jarak dari parent region aktif
    // Jika region aktif = kolom-* (child/sub-parent), apply ke parent (section/sub-parent/sub-child)
    // Jika region aktif = section/sub-baris (parent/sub-child), apply ke region itu sendiri
    P.applyJarakKeParentAktif = function() {
        var node = P.getById(P.STATE.activeId);
        if (!node) return;
        // Tentukan target: parent dari region aktif, atau region itu sendiri
        var targetNode = node;
        if (node.type === 'child') {
            // Kolom — apply ke parent (section/sub-parent/sub-child)
            targetNode = P.getParent(P.STATE.activeId);
        }
        if (!targetNode) return;
        // Cari element DOM untuk targetNode
        var targetEl = document.querySelector('.pondasi-region[data-id="' + targetNode.id + '"]');
        if (!targetEl) return;
        // Toggle kelas .jarak
        if (P.jarakAktif) {
            targetEl.classList.add('jarak');
        } else {
            targetEl.classList.remove('jarak');
        }
        // Simpan state ke node agar persistent saat render
        if (targetNode.classes.indexOf('jarak') >= 0) {
            if (!P.jarakAktif) {
                targetNode.classes = targetNode.classes.filter(function (c) { return c !== 'jarak'; });
            }
        } else {
            if (P.jarakAktif) {
                targetNode.classes.push('jarak');
            }
        }
        P.save();
    }

    // Apply/hapus kelas pondasi-guide-jarak dari baris-12 & baris-10 sesuai state P.guideDenganJarak
    P.applyJarakKeGuide = function() {
        var baris12 = document.getElementById('guide-baris-12');
        var baris10 = document.getElementById('guide-baris-10');
        if (P.guideDenganJarak) {
            if (baris12) baris12.classList.add('pondasi-guide-jarak');
            if (baris10) baris10.classList.add('pondasi-guide-jarak');
        } else {
            if (baris12) baris12.classList.remove('pondasi-guide-jarak');
            if (baris10) baris10.classList.remove('pondasi-guide-jarak');
        }
    }

