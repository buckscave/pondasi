/* PONDASI-PANEL-REGION.JS
   Panel properti region — folder tree, info, seksi editable.
   HARUS di-load setelah pondasi-panel-field.js.
   Refactored dari pondasi-block-panel.js.
*/
var P = P || {};

P.renderPanelRegion = function(badan, judulEl) {
    // Kosongkan badan dulu
    while (badan.firstChild) badan.removeChild(badan.firstChild);

    var node = P.getById(P.STATE.activeId);
    if (judulEl) judulEl.textContent = 'Properti Region';
    badan.setAttribute('data-mode', 'region');

    if (!node) {
        badan.appendChild(P.el('div', { class: 'pondasi-region-info-empty',
            text: 'Tidak ada region terpilih. Klik region di canvas atau tekan Esc.' }));
        return;
    }

    // === SEKSI 1: HIERARKI (collapsible) — folder-tree FULL ===
    // Tampilkan root + semua anak + sibling. Klik node = select node.
    // Fold/unfold via icon panah (▸/▾) di samping nama folder.
    badan.appendChild(P.buatSeksi('Hierarki', true, function (isi) {
        // State fold/unfold disimpan di P.STATE._treeFold = { nodeId: true|false }
        if (!P.STATE._treeFold) P.STATE._treeFold = {};

        // Render tree recursively dari root
        var root = P.STATE.tree;
        if (!root) return;

        var renderTreeNode = function (n, depth) {
            if (!n) return;
            var isActive = (n.id === node.id);
            var hasChildren = n.children && n.children.length > 0;
            var isFolded = P.STATE._treeFold[n.id] === true;

            var row = P.el('div', {
                class: 'pondasi-region-tree-row' + (isActive ? ' pondasi-region-tree-row-aktif' : ''),
                dataset: { nodeId: n.id }
            });
            row.style.paddingLeft = (8 + depth * 16) + 'px';

            // Fold/unfold arrow (hanya kalau punya anak)
            if (hasChildren) {
                var arrow = P.el('i', {
                    class: 'fa-solid ' + (isFolded ? 'fa-caret-right' : 'fa-caret-down') + ' pondasi-region-tree-arrow',
                    'aria-hidden': 'true',
                    title: isFolded ? 'Buka' : 'Tutup'
                });
                arrow.style.cursor = 'pointer';
                arrow.addEventListener('click', function (e) {
                    e.stopPropagation();
                    P.STATE._treeFold[n.id] = !isFolded;
                    P.renderPanel();
                });
                row.appendChild(arrow);
            } else {
                // Spacer untuk alignment kalau tidak ada arrow
                var spacer = P.el('span', { class: 'pondasi-region-tree-arrow-spacer' });
                row.appendChild(spacer);
            }

            // Folder/file icon
            var iconClass = hasChildren ? (isFolded ? 'fa-folder' : 'fa-folder-open') : 'fa-file';
            if (isActive) iconClass = hasChildren ? (isFolded ? 'fa-folder' : 'fa-folder-open') : 'fa-file-lines';
            row.appendChild(P.el('i', { class: 'fa-solid ' + iconClass + ' pondasi-region-tree-icon',
                'aria-hidden': 'true' }));

            // Nama: tag.classes
            var namaStr = n.tag;
            if (n.classes && n.classes.length > 0) {
                namaStr += '.' + n.classes.join('.');
            }
            row.appendChild(P.el('span', { class: 'pondasi-region-tree-nama', text: namaStr }));

            // Badge tipe region
            if (n.type) {
                row.appendChild(P.el('span', { class: 'pondasi-region-tree-tipe', text: n.type }));
            }

            // Lock icon kalau region terkunci
            if (n.locked) {
                row.appendChild(P.el('i', { class: 'fa-solid fa-lock pondasi-region-tree-lock',
                    'aria-hidden': 'true', title: 'Terkunci (l untuk buka)' }));
            }

            // Klik row (selain arrow) = select node
            (function (nid) {
                row.addEventListener('click', function () {
                    P.STATE.activeId = nid;
                    P.render();
                    P.renderPanel();
                    if (P.updateBreadcrumb) P.updateBreadcrumb();
                });
            })(n.id);

            isi.appendChild(row);

            // Render anak kalau tidak difold
            if (hasChildren && !isFolded) {
                for (var ci = 0; ci < n.children.length; ci++) {
                    renderTreeNode(n.children[ci], depth + 1);
                }
            }
        };

        // Auto-unfold path dari root ke node aktif supaya selalu terlihat
        var pathIds = {};
        var cur = node;
        while (cur) {
            pathIds[cur.id] = true;
            cur = P.getParent(cur.id);
        }
        for (var pid in pathIds) {
            if (pathIds.hasOwnProperty(pid) && P.STATE._treeFold[pid] === true) {
                // Paksa unfold untuk node di path
                delete P.STATE._treeFold[pid];
            }
        }

        renderTreeNode(root, 0);
    }));

    // === SEKSI 2: INFO REGION (collapsible) — Nama + Tag editable + info read-only ===
    badan.appendChild(P.buatSeksi('Info Region', false, function (isi) {
        // Field editable: Nama region
        var namaRow = P.el('div', { class: 'pondasi-region-info-baris' });
        namaRow.appendChild(P.el('span', { class: 'pondasi-region-info-label', text: 'Nama' }));
        var namaInput = P.el('input', {
            type: 'text',
            class: 'pondasi-region-info-input',
            value: node.nama || '',
            placeholder: 'mis. header, menu-utama',
            dataset: { regionField: 'nama' }
        });
        namaInput.style.cssText = 'display:inline-block;width:calc(100% - 100px);background:#3C4650;color:#E1F6FA;border:1px solid #5A646E;border-radius:2px;padding:2px 6px;font-size:11px;font-family:"Courier New",monospace;';
        // Save nama on blur
        namaInput.addEventListener('blur', function() {
            node.nama = namaInput.value.trim();
            P.save();
            P.render();
            P.renderPanel();
        });
        // Enter key = save + blur
        namaInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') { e.preventDefault(); namaInput.blur(); }
        });
        namaRow.appendChild(namaInput);
        isi.appendChild(namaRow);

        // Field editable: Tag region
        var tagRow = P.el('div', { class: 'pondasi-region-info-baris' });
        tagRow.appendChild(P.el('span', { class: 'pondasi-region-info-label', text: 'Tag' }));
        var tagSelect = P.el('select', {
            class: 'pondasi-region-info-input',
            dataset: { regionField: 'tag' }
        });
        tagSelect.style.cssText = 'display:inline-block;width:calc(100% - 100px);background:#3C4650;color:#E1F6FA;border:1px solid #5A646E;border-radius:2px;padding:2px 6px;font-size:11px;';
        // Daftar tag container (section-like)
        var tags = ['main', 'section', 'article', 'aside', 'header', 'footer', 'nav', 'div'];
        for (var ti = 0; ti < tags.length; ti++) {
            var opt = P.el('option', { value: tags[ti], text: tags[ti] });
            if (node.tag === tags[ti]) opt.setAttribute('selected', 'selected');
            tagSelect.appendChild(opt);
        }
        // Save tag on change
        tagSelect.addEventListener('change', function() {
            node.tag = tagSelect.value;
            P.save();
            P.render();
            P.renderPanel();
        });
        tagRow.appendChild(tagSelect);
        isi.appendChild(tagRow);

        // Separator
        var sep = P.el('div', { style: 'border-top:1px solid #1A2A34;margin:6px 0;' });
        isi.appendChild(sep);

        // Info read-only (seperti sebelumnya)
        var pathNodes = [];
        var cur2 = node;
        while (cur2) {
            pathNodes.unshift(cur2);
            cur2 = P.getParent(cur2.id);
        }
        var kedalaman = pathNodes.length - 1;
        var jumlahAnak = (node.children && node.children.length) ? node.children.length : 0;
        var jumlahBlock = (node.blocks && node.blocks.length) ? node.blocks.length : 0;
        var pathStr = pathNodes.map(function (n) {
            return n.tag + (n.classes && n.classes.length ? '.' + n.classes.join('.') : '');
        }).join(' › ');

        var infoFields = [
            { label: 'Kelas', value: (node.classes || []).join(' ') || '—' },
            { label: 'Tipe', value: node.type || '—' },
            { label: 'Kedalaman', value: kedalaman + ' (root = 0)' },
            { label: 'Jumlah Anak', value: jumlahAnak + ' region' },
            { label: 'Jumlah Block', value: jumlahBlock + ' block' },
            { label: 'Path', value: pathStr },
            { label: 'Status', value: node.locked ? 'Terkunci' : 'Tidak terkunci' }
        ];
        for (var ii = 0; ii < infoFields.length; ii++) {
            var f = infoFields[ii];
            var rowEl = P.el('div', { class: 'pondasi-region-info-baris' });
            rowEl.appendChild(P.el('span', { class: 'pondasi-region-info-label', text: f.label }));
            var valEl = P.el('span', { class: 'pondasi-region-info-value', text: f.value });
            if (f.label === 'Path') {
                valEl.style.wordBreak = 'break-all';
                valEl.style.fontSize = '10px';
            }
            rowEl.appendChild(valEl);
            isi.appendChild(rowEl);
        }
    }));

    // (Catatan: seksi "Kelas dari Tema" sengaja dihilangkan — value dari kelas region
    //  sudah otomatis tampil di Tata Letak/Tampilan/Tipografi, dengan field yang
    //  berasal dari kelas pondasi.css otomatis di-disable (read-only).)

    // === SEKSI 4-6: TATA LETAK + TAMPILAN + TIPOGRAFI (hanya saat edit mode aktif) ===
    // Di luar mode edit, region adalah view-only — user lihat struktur tanpa bisa edit props.
    // Saat masuk mode edit (Enter), 3 seksi editable muncul.
    var isRegionEditable = P.STATE.editMode.active && P.STATE.editMode.regionId === node.id;
    if (isRegionEditable) {
        badan.appendChild(P.buatSeksi('Tata Letak', false, function (isi) {
            P.renderRegionEditableSeksis(isi, node);
        }));
    }

    // === SEKSI 7: AKSI (collapsible) ===
    badan.appendChild(P.buatSeksi('Aksi', false, function (isi) {
        var aksiRow = P.el('div', { class: 'pondasi-region-aksi-row' });

        // Tombol Lock/Unlock
        var lockBtn = P.el('button', {
            type: 'button',
            class: 'pondasi-region-aksi-btn' + (node.locked ? ' pondasi-region-aksi-btn-aktif' : ''),
            title: 'Kunci region (l) — blok split/delete/swap/yank/cut/merge',
            html: '<i class="fa-solid ' + (node.locked ? 'fa-lock' : 'fa-lock-open') + '" aria-hidden="true"></i> ' +
                  (node.locked ? 'Buka Kunci' : 'Kunci')
        });
        lockBtn.addEventListener('click', function () {
            if (P.toggleLockRegion) P.toggleLockRegion();
        });
        aksiRow.appendChild(lockBtn);

        // Tombol Masuk Mode Edit (hanya kalau region bisa di-edit, dan belum di mode edit)
        var jumlahAnak2 = (node.children && node.children.length) ? node.children.length : 0;
        if ((node.type === 'child' || node.type === 'sub-child' || jumlahAnak2 === 0) && !isRegionEditable) {
            var editBtn = P.el('button', {
                type: 'button',
                class: 'pondasi-region-aksi-btn',
                title: 'Masuk mode edit (Enter)',
                html: '<i class="fa-solid fa-pen-to-square" aria-hidden="true"></i> Edit Block'
            });
            editBtn.addEventListener('click', function () {
                if (P.masukModeEdit) P.masukModeEdit();
            });
            aksiRow.appendChild(editBtn);
        }

        isi.appendChild(aksiRow);
    }));
};

/* Render seksi editable region (Tata Letak + Tampilan + Tipografi) ke container.
   Dipakai oleh:
   1. renderPanelRegion — seksi Tata Letak standalone (collapsed, isi = 3 sub-seksi)
   2. renderPanelBlock — seksi "Region" di panel komponen (collapsed, isi = 3 sub-seksi)
   Field dengan properti struktural (display, width, margin kiri/kanan) akan auto-disable. */
P.renderRegionEditableSeksis = function(container, node) {
    // Sub-seksi Tata Letak
    container.appendChild(P.buatSeksi('Tata Letak', false, function (isi) {
        var tataLetakHtml = '';
        tataLetakHtml += P.FIELDS_TATA_LETAK.map(function (f) {
            return P.renderPanelFieldHtml(f, node, 'region');
        }).join('');
        tataLetakHtml += P.renderPanelFieldHtml({ id: 'margin', label: 'atas/kanan/bawah/kiri (rem)', jenis: 'box', step: 0.25 }, node, 'region');
        tataLetakHtml += P.renderPanelFieldHtml({ id: 'padding', label: 'atas/kanan/bawah/kiri (rem)', jenis: 'box', step: 0.25 }, node, 'region');
        isi.insertAdjacentHTML('beforeend', tataLetakHtml);
    }));

    // Sub-seksi Tampilan (Warna & Garis)
    container.appendChild(P.buatSeksi('Tampilan', true, function (isi) {
        var tampilanHtml = P.FIELDS_TAMPILAN_VISUAL.map(function (f) {
            return P.renderPanelFieldHtml(f, node, 'region');
        }).join('');
        isi.insertAdjacentHTML('beforeend', tampilanHtml);
    }));

    // Sub-seksi Tipografi
    container.appendChild(P.buatSeksi('Tipografi', false, function (isi) {
        var tipografiHtml = P.FIELDS_TIPOGRAFI_UMUM.map(function (f) {
            return P.renderPanelFieldHtml(f, node, 'region');
        }).join('');
        isi.insertAdjacentHTML('beforeend', tipografiHtml);
    }));
};



P.ambilNilaiRegion = function(node, fieldId) {
    if (!node) return '';
    var regionId = node.id;
    var cssProp = P.fieldToCssProp(fieldId);

    // 1. Cek customCSS[regionId].rules (user override) — boleh edit
    var css = P.STATE.customCSS[regionId];
    if (css && css.rules) {
        if (css.rules[cssProp] !== undefined && css.rules[cssProp] !== '') return css.rules[cssProp];
        var camelProp = cssProp.replace(/-([a-z])/g, function(m, c) { return c.toUpperCase(); });
        if (css.rules[camelProp] !== undefined && css.rules[camelProp] !== '') return css.rules[camelProp];
    }

    // 2. Cek scanner data (rules dari kelas region, mis. kolom-4) — read-only
    //    Ambil SEMUA kelas yang dipakai region, merge rules-nya
    var mergedRules = P.getRegionMergedRules ? P.getRegionMergedRules(node) : null;
    if (mergedRules) {
        if (mergedRules[cssProp] !== undefined && mergedRules[cssProp] !== '') return mergedRules[cssProp];
        var camelProp2 = cssProp.replace(/-([a-z])/g, function(m, c) { return c.toUpperCase(); });
        if (mergedRules[camelProp2] !== undefined && mergedRules[camelProp2] !== '') return mergedRules[camelProp2];
    }

    // 3. Cek DOM region element (untuk live style yang belum di-save)
    var regionEl = document.querySelector('.pondasi-region[data-id="' + regionId + '"]');
    if (regionEl) {
        var camelProp3 = cssProp.replace(/-([a-z])/g, function(m, c) { return c.toUpperCase(); });
        if (regionEl.style[camelProp3]) return regionEl.style[camelProp3];
    }

    return '';
};

/* Cek apakah properti adalah "struktural" — harus read-only kalau value dari kelas region.
   Properti yang di-disable: display, width, margin-left, margin-right.
   Alasan:
   - display: dari kelas region (block untuk baris, inline-block untuk kolom) — struktur layout
   - width: dari kelas kolom-N (mis. 33.333% untuk kolom-4) — struktur layout
   - margin-left/right: dari kelas .jarak (margin 1% kiri/kanan) — struktur layout
   Properti lain (position, height, margin-top/bottom, padding, dll) BOLEH di-edit. */
P.isRegionStructuralProp = function(cssProp) {
    var structuralProps = [
        'display',
        'width',
        'margin-left', 'margin-right'
    ];
    return structuralProps.indexOf(cssProp) >= 0;
};

/* Cek apakah field tertentu harus di-disable (read-only) untuk region
   Return true jika value berasal dari kelas region (pondasi.css) DAN properti struktural */
P.isRegionFieldDisabled = function(node, fieldId) {
    if (!node) return false;
    var cssProp = P.fieldToCssProp(fieldId);

    // Kalau user sudah override di customCSS → boleh edit (tidak disable)
    var css = P.STATE.customCSS[node.id];
    if (css && css.rules && css.rules[cssProp] !== undefined && css.rules[cssProp] !== '') return false;

    // Cek apakah properti struktural
    if (!P.isRegionStructuralProp(cssProp)) return false;

    // Cek apakah value-nya memang dari kelas region (scanner data)
    var mergedRules = P.getRegionMergedRules ? P.getRegionMergedRules(node) : null;
    if (mergedRules && mergedRules[cssProp] !== undefined && mergedRules[cssProp] !== '') return true;

    return false;
};

/* Ambil merged rules dari SEMUA kelas region (pondasi.css)
   Mis. region pakai classes=['kolom-4', 'sub-baris'] → merge rules dari .kolom-4 + .sub-baris
   Hanya ambil dari scanner cache (kelas yang sudah di-scan saat init).
   Tidak termasuk pseudo-class (rules Normal saja). */
/* Rules struktur dari pondasi.css (hardcoded karena [class*='kolom-'] adalah attribute selector
   yang tidak ter-scan oleh scanner — scanner hanya extract class selectors via titik).
   Source: pondasi.css baris 442-540 (struktur baris/kolom). */
P.REGION_STRUCTURAL_RULES = {
    'baris': {
        'position': 'relative',
        'display': 'block',
        'font-size': '0',
        'margin': '0 auto',
        'max-width': '75rem',
        'text-align': 'left',
        'overflow': 'hidden'
    },
    'sub-baris': {
        'position': 'relative',
        'display': 'block',
        'font-size': '0',
        'margin': '0 auto',
        'max-width': '75rem',
        'text-align': 'left',
        'overflow': 'hidden'
    },
    'kolom-base': {  // [class*='kolom-'] — berlaku untuk semua kolom-*
        'position': 'relative',
        'display': 'inline-block',
        'font-size': '0.85rem',
        'vertical-align': 'top'
    },
    'kolom-width': {  // Width per kolom (dari @media min-width: 48rem)
        1: '8.333%', 2: '16.666%', 3: '24.999%', 4: '33.333%',
        5: '41.666%', 6: '50%', 7: '58.333%', 8: '66.666%',
        9: '75%', 10: '83.333%', 11: '91.666%', 12: '100%'
    }
};

P.getRegionMergedRules = function(node) {
    if (!node || !node.classes) return null;
    var merged = {};

    // 1. Tambah rules struktur dari hardcoded (pondasi.css attribute selectors)
    for (var i = 0; i < node.classes.length; i++) {
        var c = node.classes[i];

        // baris / sub-baris
        if (c === 'baris' || c === 'sub-baris') {
            var barisRules = P.REGION_STRUCTURAL_RULES['baris'];
            for (var bp in barisRules) {
                if (barisRules.hasOwnProperty(bp)) merged[bp] = barisRules[bp];
            }
        }

        // kolom-N (termasuk kolom-lima, kolom-tujuh, dll — nama Indonesia)
        var colMatch = c.match(/^kolom-(\d+)$/);
        if (colMatch) {
            var colNum = parseInt(colMatch[1], 10);
            // Base rules dari [class*='kolom-']
            var baseRules = P.REGION_STRUCTURAL_RULES['kolom-base'];
            for (var kp in baseRules) {
                if (baseRules.hasOwnProperty(kp)) merged[kp] = baseRules[kp];
            }
            // Width spesifik
            var widthMap = P.REGION_STRUCTURAL_RULES['kolom-width'];
            if (widthMap[colNum]) merged['width'] = widthMap[colNum];
        }
    }

    // 2. Merge rules dari scanner (kelas lain yang ter-scan normal — tampilan-*.css)
    if (P.Scanner) {
        for (var j = 0; j < node.classes.length; j++) {
            var namaKelas = node.classes[j];
            var detail = P.Scanner.getKelasDetail(namaKelas);
            if (!detail || !detail.rules) continue;
            for (var prop in detail.rules) {
                if (detail.rules.hasOwnProperty(prop)) {
                    merged[prop] = detail.rules[prop];
                }
            }
        }
    }

    return merged;
};

/* Cek apakah box field tertentu (per-sisi) harus di-disable untuk region
   Return true jika sisi tertentu dari box field harus read-only.
   Mis. margin field: kanan & kiri disable (struktural), atas & bawah editable.
   Padding/border/radius: semua sisi editable. */
P.isRegionBoxSisiDisabled = function(node, fieldId, sisi) {
    if (!node) return false;

    // Hanya margin yang punya per-sisi disable
    if (fieldId !== 'margin') return false;

    // Kalau user sudah override margin-left/right di customCSS → boleh edit
    var css = P.STATE.customCSS[node.id];
    var cssPropKebab = 'margin-' + sisi;
    var cssPropCamel = 'margin' + P.capitalize(sisi);
    if (css && css.rules) {
        if (css.rules[cssPropKebab] !== undefined && css.rules[cssPropKebab] !== '') return false;
        if (css.rules[cssPropCamel] !== undefined && css.rules[cssPropCamel] !== '') return false;
    }

    // Disable margin kiri & kanan (struktural dari .jarak)
    // Atas & bawah boleh di-edit
    if (sisi === 'kiri' || sisi === 'kanan') {
        // Cek apakah value-nya dari kelas region (mis. .jarak [class*='kolom-'] → margin 1%)
        var mergedRules = P.getRegionMergedRules ? P.getRegionMergedRules(node) : null;
        if (mergedRules) {
            if (mergedRules[cssPropKebab] !== undefined && mergedRules[cssPropKebab] !== '') return true;
            if (mergedRules[cssPropCamel] !== undefined && mergedRules[cssPropCamel] !== '') return true;
        }
    }

    return false;
};

/* Ambil nilai box (4 sisi) untuk region */
P.ambilNilaiBoxRegion = function(node, fieldId, sisi) {
    if (!node) return '';
    var regionId = node.id;
    var cssProp;
    var cssPropKebab;
    if (fieldId === 'padding') { cssProp = 'padding' + P.capitalize(sisi); cssPropKebab = 'padding-' + sisi; }
    else if (fieldId === 'margin') { cssProp = 'margin' + P.capitalize(sisi); cssPropKebab = 'margin-' + sisi; }
    else if (fieldId === 'borderLebar') { cssProp = 'border' + P.capitalize(sisi) + 'Width'; cssPropKebab = 'border-' + sisi + '-width'; }
    else if (fieldId === 'radius') { cssProp = 'border' + P.capitalize(sisi) + 'Radius'; cssPropKebab = 'border-' + sisi + '-radius'; }
    else return '';

    // 1. Cek customCSS user override
    var css = P.STATE.customCSS[regionId];
    if (css && css.rules) {
        if (css.rules[cssProp] !== undefined && css.rules[cssProp] !== '') return css.rules[cssProp];
        if (css.rules[cssPropKebab] !== undefined && css.rules[cssPropKebab] !== '') return css.rules[cssPropKebab];
    }
    // 2. Cek scanner data (rules dari kelas region)
    var mergedRules = P.getRegionMergedRules ? P.getRegionMergedRules(node) : null;
    if (mergedRules) {
        if (mergedRules[cssProp] !== undefined && mergedRules[cssProp] !== '') return mergedRules[cssProp];
        if (mergedRules[cssPropKebab] !== undefined && mergedRules[cssPropKebab] !== '') return mergedRules[cssPropKebab];
    }
    // 3. Cek DOM
    var regionEl = document.querySelector('.pondasi-region[data-id="' + regionId + '"]');
    if (regionEl) {
        if (regionEl.style[cssProp]) return regionEl.style[cssProp];
    }
    return '';
};

/* Terapkan properti region ke customCSS + DOM */
P.terapkanPropertiRegion = function(target) {
    var node = P.getById(P.STATE.activeId);
    if (!node) return;

    // Skip kalau input di-disable (properti struktural dari kelas region)
    if (target.disabled) return;

    var field = target.dataset.field;
    var jenis = target.dataset.jenis;
    var val = target.value;
    var regionId = node.id;
    var regionEl = document.querySelector('.pondasi-region[data-id="' + regionId + '"]');

    // Init customCSS untuk region ini kalau belum ada
    if (!P.STATE.customCSS[regionId]) {
        // Generate className kustom
        var shortId = regionId.replace(/^r(\d+)_.*/, 'r$1');
        P.STATE.customCSS[regionId] = {
            className: 'kustom-' + shortId,
            rules: {},
            pseudo: {}
        };
    }

    if (jenis === 'teks' || jenis === 'textarea') {
        var cssProp = P.fieldToCssProp(field);
        // Simpan ke rules
        if (val) {
            P.STATE.customCSS[regionId].rules[cssProp] = val;
        } else {
            delete P.STATE.customCSS[regionId].rules[cssProp];
        }
        // Apply ke DOM
        if (regionEl) {
            var camelProp = cssProp.replace(/-([a-z])/g, function(m, c) { return c.toUpperCase(); });
            if (val) regionEl.style[camelProp] = val;
            else regionEl.style[camelProp] = '';
        }
    } else if (jenis === 'angka') {
        var cssPropN = P.fieldToCssProp(field);
        if (val) {
            P.STATE.customCSS[regionId].rules[cssPropN] = val + 'px';
            if (regionEl) {
                var camelPropN = cssPropN.replace(/-([a-z])/g, function(m, c) { return c.toUpperCase(); });
                regionEl.style[camelPropN] = val + 'px';
            }
        } else {
            delete P.STATE.customCSS[regionId].rules[cssPropN];
            if (regionEl) {
                var camelPropN2 = cssPropN.replace(/-([a-z])/g, function(m, c) { return c.toUpperCase(); });
                regionEl.style[camelPropN2] = '';
            }
        }
    } else if (jenis === 'box') {
        var sisi = target.dataset.sisi;
        var unit = target.dataset.unit || 'rem';
        var cssPropB;
        if (field === 'padding') cssPropB = 'padding' + P.capitalize(sisi);
        else if (field === 'margin') cssPropB = 'margin' + P.capitalize(sisi);
        else if (field === 'borderLebar') cssPropB = 'border' + P.capitalize(sisi) + 'Width';
        else if (field === 'radius') cssPropB = 'border' + P.capitalize(sisi) + 'Radius';
        else return;
        if (val) {
            P.STATE.customCSS[regionId].rules[cssPropB] = val + unit;
            if (regionEl) regionEl.style[cssPropB] = val + unit;
        } else {
            delete P.STATE.customCSS[regionId].rules[cssPropB];
            if (regionEl) regionEl.style[cssPropB] = '';
        }
    } else if (jenis === 'pilih') {
        var cssPropP = P.fieldToCssProp(field);
        if (val) {
            P.STATE.customCSS[regionId].rules[cssPropP] = val;
            if (regionEl) {
                var camelPropP = cssPropP.replace(/-([a-z])/g, function(m, c) { return c.toUpperCase(); });
                regionEl.style[camelPropP] = val;
            }
        } else {
            delete P.STATE.customCSS[regionId].rules[cssPropP];
            if (regionEl) {
                var camelPropP2 = cssPropP.replace(/-([a-z])/g, function(m, c) { return c.toUpperCase(); });
                regionEl.style[camelPropP2] = '';
            }
        }
    } else if (jenis === 'warna') {
        var cssPropW = P.fieldToCssProp(field);
        if (val) {
            P.STATE.customCSS[regionId].rules[cssPropW] = val;
            if (regionEl) {
                var camelPropW = cssPropW.replace(/-([a-z])/g, function(m, c) { return c.toUpperCase(); });
                regionEl.style[camelPropW] = val;
            }
        } else {
            delete P.STATE.customCSS[regionId].rules[cssPropW];
            if (regionEl) {
                var camelPropW2 = cssPropW.replace(/-([a-z])/g, function(m, c) { return c.toUpperCase(); });
                regionEl.style[camelPropW2] = '';
            }
        }
    }

    P.save();
};

/* State tabs untuk region — cek apakah ada pseudo-class yang diubah untuk region aktif */


