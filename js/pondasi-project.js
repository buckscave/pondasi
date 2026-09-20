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
            text: P.formatTanggal(p.modifiedAt) + ' · ' + p.regionCount + ' region' });
        var btnHapus = P.el('button', { class: 'pondasi-sidebar-list-hapus', title: 'Hapus',
            html: '<i class="fa-solid fa-trash" aria-hidden="true"></i>' });
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

        // Tombol hapus
        var btnHapus = P.el('button', { class: 'pondasi-sidebar-list-hapus', title: 'Hapus template',
            html: '<i class="fa-solid fa-trash" aria-hidden="true"></i>' });
        btnHapus.addEventListener('click', function (e) {
            e.stopPropagation();
            P.konfirmasi('Hapus template "' + t.name + '"?', function (ok) {
                if (ok) {
                    P.deleteUserTemplate(t.id);
                    P.renderUserTemplateList();
                }
            }, 'Hapus Template', 'Hapus', 'Batal');
        });

        var infoWrap = P.el('div', { class: 'pondasi-sidebar-list-info-wrap' });
        infoWrap.appendChild(nama);
        infoWrap.appendChild(desc);
        infoWrap.addEventListener('click', function () {
            P.terapkanUserTemplatePilihan(t.id);
        });

        item.appendChild(preview);
        item.appendChild(infoWrap);
        item.appendChild(btnHapus);
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

P.terapkanTemplatePilihan = function(key) {
    if (!P.STATE.currentProjectId) {
        P.newProject(P.TEMPLATES[key].name, key);
        P.tutupSidebarKiri();
        P.flash('Dokumen baru dari template "' + P.TEMPLATES[key].name + '"');
        return;
    }
    P.konfirmasi('Terapkan template "' + P.TEMPLATES[key].name + '"? Layout saat ini akan diganti.', function (ok) {
        if (ok) {
            P.applyTemplate(key);
            P.tutupSidebarKiri();
            P.flash('Template diterapkan');
        }
    }, 'Terapkan Template', 'Terapkan', 'Batal');
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
    if (expHTML && expHTML.checked) {
        var html = P.generateExportHTML();
        if (typeof P.storageExport === 'function') {
            P.storageExport(nama, 'html', html);
        } else {
            P.downloadFile(nama + '.html', html, 'text/html;charset=utf-8');
        }
        count++;
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

    var title = settings.judul || P.getProjectName() || 'Dibuat dengan pondasi';

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

    return '<!DOCTYPE html>\n' +
'<html lang="' + escA(settings.bahasa || 'id') + '">\n' +
'<head>\n' +
metaTags +
'    <title>' + escH(title) + '</title>\n' +
temaLinksStr +
cssLinksStr +
customLink +
'</head>\n' +
'<body' + bodyAttrs + bodyStyle + '>\n' +
P.serializeNode(P.STATE.tree, 1) +
scriptsStr +
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
        case 'konfirmasi-buat-dokumen': P.konfirmasiBuatDokumen(); break;
        case 'template-panel': P.tampilkanTemplatePanel(); break;
        case 'save-as-template': P.konfirmasiSaveAsTemplate(); break;
        case 'save-project': P.simpanProject(); break;
        case 'saveas-panel': P.tampilkanSaveAsPanel(); break;
        case 'konfirmasi-saveas': P.konfirmasiSaveAs(); break;
        case 'export-panel': P.tampilkanExportPanel(); break;
        case 'konfirmasi-export': P.konfirmasiExport(); break;
        case 'settings-panel': P.tampilkanSettingsPanel(); break;
        case 'terapkan-settings': P.terapkanSettings(); break;
        case 'tutup-sidebar-kiri': P.tutupSidebarKiri(); break;
        // Dialog actions
        case 'dialog-ok': P.prosesDialog(true); break;
        case 'dialog-batal': P.prosesDialog(false); break;
    }
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
