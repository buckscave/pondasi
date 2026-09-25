/* PONDASI-EDITOR.JS */
var P = P || {};

    /* ======================================================================
       EDIT MODE
       ====================================================================== */

    /*
       Posisikan editor melayang:
       - Default: di bawah region, menempel pojok kiri bawah
       - Jika region di paling atas layar (tidak muat editor di atas): editor di bawah
       - Jika region di paling bawah layar (tidak muat editor di bawah): editor di atas
       Editor lebar ~toolbar (sekitar 700px), tinggi ~70px
    */

    /* Editor command: jalankan execCommand atau aksi custom */
    P.editorCommand = function(cmd, value) {
        if (!P.STATE.editMode.active) return;
        // Cari block yang sedang di-edit (contentEditable=true)
        var blockEl = document.querySelector('.pondasi-block[contenteditable="true"]');
        if (blockEl) {
            // Fokus ke block yang sedang di-edit
            blockEl.focus();
        } else {
            // Fallback: fokus ke region
            var regionEl = document.querySelector('.pondasi-region[data-id="' + P.STATE.editMode.regionId + '"]');
            if (regionEl) regionEl.focus();
        }

        // Restore selection kalau palette baru ditutup
        // v126: JANGAN null-kan savedSelection di sini — biarkan applySwatch/closeSwatches yang handle
        if (P.STATE.editMode.savedSelection) {
            P.restoreSelection(P.STATE.editMode.savedSelection);
            // JANGan null-kan — keep alive untuk multi-apply
        }

        try {
            document.execCommand(cmd, false, value || null);
        } catch (e) {
            // Some commands may fail silently
        }
        // Trigger input event untuk update state
        P.handleEditorInput();
    }

    P.handleEditorInput = function() {
        if (!P.STATE.editMode.active) return;
        var regionEl = document.querySelector('.pondasi-region[data-id="' + P.STATE.editMode.regionId + '"]');
        if (!regionEl) return;
        var node = P.getById(P.STATE.editMode.regionId);
        if (!node) return;
        // Simpan konten ke node (tanpa label & placeholder)
        var clone = regionEl.cloneNode(true);
        var label = clone.querySelector('.pondasi-region-label');
        if (label) label.remove();
        var ph = clone.querySelector('.pondasi-placeholder');
        if (ph) ph.remove();
        node.content = clone.innerHTML;

        // Auto-generate kelas kustom jika region punya inline style di luar kolom-*
        P.autoGenerateCustomClass(regionEl, node);

        P.save();
    }

    /*
       Auto-generate kelas kustom.
       Saat user apply style (font, size, line-height, margin, padding, border, color, fill, stroke)
       ke region, auto-generate nama kelas (mis. "kustom-r3") dan update input kelas kustom.
       Style disimpan ke P.STATE.customCSS[regionId] sebagai rule untuk kelas tersebut.
       Saat exit edit mode, simpan rule ke localStorage dan terapkan ke region.
    */
    P.autoGenerateCustomClass = function(regionEl, node) {
        // Cek apakah region punya inline style
        var hasInlineStyle = false;
        var rules = {};
        // Daftar style yang generate kelas kustom (bukan HTML tag native)
        var styleProps = [
            'fontFamily', 'fontSize', 'lineHeight',
            'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
            'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
            'border'
        ];
        styleProps.forEach(function (prop) {
            var val = regionEl.style[prop];
            if (val && val !== '' && val !== 'initial') {
                hasInlineStyle = true;
                rules[prop] = val;
            }
        });

        if (hasInlineStyle) {
            // Generate nama kelas otomatis kalau belum ada
            if (!P.STATE.editMode.customClass) {
                // kustom-<id-pendek>
                var shortId = node.id.replace(/^r(\d+)_.*/, 'r$1');
                P.STATE.editMode.customClass = 'kustom-' + shortId;
            }
            // Update input
            var inp = document.getElementById('editor-custom-class');
            if (inp && inp.value !== P.STATE.editMode.customClass) {
                inp.value = P.STATE.editMode.customClass;
            }
            // Simpan rule ke customCSS
            P.STATE.customCSS[node.id] = {
                className: P.STATE.editMode.customClass,
                rules: rules
            };
        }
    }

    /* Simpan & restore selection (untuk palette) */
    P.saveSelection = function() {
        var sel = window.getSelection();
        if (sel.rangeCount === 0) return null;
        return sel.getRangeAt(0).cloneRange();
    }

    P.restoreSelection = function(range) {
        if (!range) return;
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }

    /* Daftar warna pondasi untuk swatches (MEJIKUHIBINIU + grayscale) */
    var pondasiColors = [
        // MERAH
        { name: 'merah-muda', hex: '#FF8080' },
        { name: 'merah', hex: '#FF3232' },
        { name: 'merah-tua', hex: '#B30000' },
        // JINGGA
        { name: 'jingga-muda', hex: '#FFA080' },
        { name: 'jingga', hex: '#FF6432' },
        { name: 'jingga-tua', hex: '#C83200' },
        // KUNING
        { name: 'kuning-muda', hex: '#FFE180' },
        { name: 'kuning', hex: '#FFC832' },
        { name: 'kuning-tua', hex: '#C89600' },
        // HIJAU
        { name: 'hijau-muda', hex: '#B4E664' },
        { name: 'hijau', hex: '#80C832' },
        { name: 'hijau-tua', hex: '#4B9600' },
        // BIRU
        { name: 'biru-muda', hex: '#78C8F0' },
        { name: 'biru', hex: '#32A5E1' },
        { name: 'biru-tua', hex: '#0073B4' },
        // NILA
        { name: 'nila-muda', hex: '#B482F0' },
        { name: 'nila', hex: '#823CDC' },
        { name: 'nila-tua', hex: '#500AAA' },
        // UNGU
        { name: 'ungu-muda', hex: '#DCB4E6' },
        { name: 'ungu', hex: '#B978C8' },
        { name: 'ungu-tua', hex: '#874696' },
        // GRAYSCALE
        { name: 'putih', hex: '#FFFFFF' },
        { name: 'abu-muda', hex: '#E1E6EB' },
        { name: 'abu', hex: '#A0AAB4' },
        { name: 'abu-tua', hex: '#5A646E' },
        { name: 'kelabu', hex: '#3C4650' },
        { name: 'gelap', hex: '#1E2832' },
        { name: 'hitam', hex: '#0A141E' }
    ];

    /* Buka modal swatches (terdepan) */
    P.openSwatches = function(type) {
        if (!P.STATE.editMode.active && !P.STATE.editMode.paletteOpen) return;
        var modal = document.getElementById('swatches-modal');
        var body = document.getElementById('swatches-body');
        var title = document.getElementById('swatches-title');
        var noneBtn = document.getElementById('swatches-none');
        if (!modal || !body) return;

        // v126: HANYA simpan savedSelection jika belum ada
        // Jangan timpa saat re-render (modal sudah terbuka, savedSelection harus tetap dari canvas)
        if (!P.STATE.editMode.savedSelection) {
            P.STATE.editMode.savedSelection = P.saveSelection();
        }
        P.STATE.editMode.paletteOpen = type;

        // Set judul
        var titles = { text: 'Warna Teks', fill: 'Warna Latar (Fill)', stroke: 'Warna Garis (Stroke)', border: 'Warna Border' };
        if (title) title.textContent = titles[type] || 'Palet Warna';

        // v121: tombol "kosong" dipindah ke header (bukan di grid)
        if (noneBtn) {
            if (type === 'fill' || type === 'stroke' || type === 'border') {
                noneBtn.style.display = '';
                noneBtn.title = 'Hapus ' + (type === 'fill' ? 'latar' : 'garis');
            } else {
                noneBtn.style.display = 'none';
            }
        }

        // Bangun swatches
        while (body.firstChild) body.removeChild(body.firstChild);

        // v129: Section title "Warna Pondasi"
        var titleDefault = P.el('div', { class: 'pondasi-palette-section-title', text: 'Warna Pondasi' });
        body.appendChild(titleDefault);

        // v122: Grid 7 kolom × 4 baris (murni, tanpa spacer)
        var grid = P.el('div', { class: 'pondasi-palette-grid' });

        // Susun warna per tingkat (tua, normal, muda)
        var rows = [
            [pondasiColors[2], pondasiColors[5], pondasiColors[8], pondasiColors[11], pondasiColors[14], pondasiColors[17], pondasiColors[20]],  // tua
            [pondasiColors[1], pondasiColors[4], pondasiColors[7], pondasiColors[10], pondasiColors[13], pondasiColors[16], pondasiColors[19]],  // normal
            [pondasiColors[0], pondasiColors[3], pondasiColors[6], pondasiColors[9], pondasiColors[12], pondasiColors[15], pondasiColors[18]]   // muda
        ];

        rows.forEach(function (rowColors) {
            rowColors.forEach(function (c) {
                var sw = P.el('button', { class: 'pondasi-swatch', title: c.name });
                sw.style.backgroundColor = c.hex;
                sw.dataset.color = c.hex;
                sw.dataset.type = type;
                if (c.hex === '#FFFFFF') sw.style.border = '1px solid #5A646E';
                grid.appendChild(sw);
            });
        });

        // Baris 4: grayscale (7 warna, index 21-27)
        for (var gi = 21; gi < 28; gi++) {
            var c = pondasiColors[gi];
            var sw = P.el('button', { class: 'pondasi-swatch', title: c.name });
            sw.style.backgroundColor = c.hex;
            sw.dataset.color = c.hex;
            sw.dataset.type = type;
            if (c.hex === '#FFFFFF') sw.style.border = '1px solid #5A646E';
            grid.appendChild(sw);
        }

        body.appendChild(grid);

        // v125: Clear selected swatch highlight (reset saat modal dibuka)
        P.STATE.editMode.selectedColor = null;

        // v122: Baris warna kustom user (jika ada)
        var customColors = P.getCustomColors ? P.getCustomColors() : [];
        if (customColors.length > 0) {
            // v129: Section title "Warna Pengguna"
            var titleCustom = P.el('div', { class: 'pondasi-palette-section-title pondasi-palette-custom-title', text: 'Warna Pengguna' });
            body.appendChild(titleCustom);
            var customRow = P.el('div', { class: 'pondasi-palette-grid pondasi-palette-custom-row' });
            customColors.forEach(function (hex) {
                // v140: Handle gradient entries sama seperti refreshCustomColorRow
                var isGradient = hex.indexOf('#GRAD:') === 0;
                var gradientClassName = isGradient ? hex.substring(6) : null;
                var swWrap = P.el('div', { class: 'pondasi-swatch-wrap' });
                var sw = P.el('button', { class: 'pondasi-swatch', title: isGradient ? 'Gradient: ' + gradientClassName : 'Kustom: ' + hex });
                if (isGradient) {
                    // v140: Render swatch dengan gradient background
                    var cssBody = P.getGradientCSSBody ? P.getGradientCSSBody(gradientClassName) : '';
                    if (cssBody) {
                        sw.style.background = cssBody;
                    } else {
                        sw.style.backgroundColor = '#3C4650';  // fallback
                    }
                    sw.dataset.color = hex;
                    sw.dataset.type = type;
                    sw.dataset.gradientClass = gradientClassName;
                } else {
                    sw.style.backgroundColor = hex;
                    sw.dataset.color = hex;
                    sw.dataset.type = type;
                    if (hex.toUpperCase() === '#FFFFFF') sw.style.border = '1px solid #5A646E';
                }
                swWrap.appendChild(sw);
                var delBtn = P.el('button', {
                    class: 'pondasi-swatch-del',
                    title: 'Hapus ' + (isGradient ? 'gradient ' + gradientClassName : 'warna kustom ' + hex),
                    html: P.icon('x', 8)
                });
                delBtn.dataset.delColor = hex;
                delBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    P.removeCustomColor(hex);
                });
                swWrap.appendChild(delBtn);
                customRow.appendChild(swWrap);
            });
            body.appendChild(customRow);
        }

        modal.hidden = false;

        // v134: Reset gradient ke flat saat modal dibuka
        if (P.resetGradient) P.resetGradient();
    }

    P.closeSwatches = function() {
        var modal = document.getElementById('swatches-modal');
        if (modal) modal.hidden = true;
        P.STATE.editMode.paletteOpen = null;
        // v126: baru null-kan savedSelection saat modal CLOSE
        if (P.STATE.editMode.savedSelection) {
            P.restoreSelection(P.STATE.editMode.savedSelection);
            P.STATE.editMode.savedSelection = null;
        }
        // Clear selected color
        P.STATE.editMode.selectedColor = null;
    }

    /* v126: Refresh baris custom colors tanpa re-render seluruh modal */
    /* Supaya savedSelection tidak hilang */
    P.refreshCustomColorRow = function(type) {
        var body = document.getElementById('swatches-body');
        if (!body) return;
        // Hapus baris kustom lama + title lama (jika ada)
        var oldCustomRow = body.querySelector('.pondasi-palette-custom-row');
        if (oldCustomRow) oldCustomRow.parentNode.removeChild(oldCustomRow);
        var oldTitle = body.querySelector('.pondasi-palette-custom-title');
        if (oldTitle) oldTitle.parentNode.removeChild(oldTitle);
        // Render baris kustom baru
        var customColors = P.getCustomColors ? P.getCustomColors() : [];
        if (customColors.length === 0) return;
        // v129: Section title "Warna Pengguna"
        var titleCustom = P.el('div', { class: 'pondasi-palette-section-title pondasi-palette-custom-title', text: 'Warna Pengguna' });
        body.appendChild(titleCustom);
        var customRow = P.el('div', { class: 'pondasi-palette-grid pondasi-palette-custom-row' });
        customColors.forEach(function (hex) {
            // v137: Cek apakah ini gradient entry
            var isGradient = hex.indexOf('#GRAD:') === 0;
            var gradientClassName = isGradient ? hex.substring(6) : null;

            var swWrap = P.el('div', { class: 'pondasi-swatch-wrap' });
            var sw = P.el('button', { class: 'pondasi-swatch', title: isGradient ? 'Gradient: ' + gradientClassName : 'Kustom: ' + hex });
            if (isGradient) {
                // v137: Render swatch dengan gradient background
                sw.style.background = P.getGradientCSSBody(gradientClassName);
                sw.dataset.color = hex;  // pakai #GRAD:classname sebagai color identifier
                sw.dataset.type = type;
                sw.dataset.gradientClass = gradientClassName;
            } else {
                sw.style.backgroundColor = hex;
                sw.dataset.color = hex;
                sw.dataset.type = type;
                if (hex.toUpperCase() === '#FFFFFF') sw.style.border = '1px solid #5A646E';
            }
            swWrap.appendChild(sw);
            // Tombol hapus
            var delBtn = P.el('button', {
                class: 'pondasi-swatch-del',
                title: 'Hapus ' + (isGradient ? 'gradient ' + gradientClassName : 'warna kustom ' + hex),
                html: P.icon('x', 8)
            });
            delBtn.dataset.delColor = hex;
            delBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                P.removeCustomColor(hex);
            });
            swWrap.appendChild(delBtn);
            customRow.appendChild(swWrap);
        });
        body.appendChild(customRow);
    }

    /* v125: Select swatch — highlight + update hex, TIDAK apply langsung */
    /* User harus klik "Terapkan" untuk apply */
    /* v132: JANGAN sync ke color wheel untuk warna default — HSL round-trip tidak presisi */
    /* v135: Dalam gradient mode, auto-update active stop color (eyedropper behavior) */
    P.selectSwatch = function(color, type) {
        // Update hex input dengan warna ASLI
        var hexInput = document.getElementById('swatches-hex');
        if (hexInput) hexInput.value = color ? color.toUpperCase() : '';

        // v135: Dalam gradient mode, auto-update active stop color
        if (P.isGradientMode && P.isGradientMode() && color && color.indexOf('#GRAD:') !== 0) {
            P.setActiveStopColor(color);
            return;
        }

        // v137: Jika color = #GRAD:classname, load gradient data + apply ke block
        if (color && color.indexOf('#GRAD:') === 0) {
            var gradClassName = color.substring(6);

            // v141: Load gradient data ke UI (stops, angle, type, tab)
            if (P.loadGradientFromCSS) P.loadGradientFromCSS(gradClassName);

            // Apply gradient class ke block
            var bid = P.STATE.editMode.selectedBlockId;
            if (bid) {
                var blk = P.cariBlockById(bid);
                if (blk) {
                    if (!blk.classes) blk.classes = [];
                    blk.classes = blk.classes.filter(function (c) { return c.indexOf('gradlin-') !== 0 && c.indexOf('gradrad-') !== 0; });
                    blk.classes.push(gradClassName);
                    if (blk.style) delete blk.style.backgroundColor;
                    P.save();
                    P.renderBlocks();
                    P.renderPanel();
                    P.flash('Gradient diterapkan: ' + gradClassName);
                }
            }

            // v141: Highlight swatch gradient yang dipilih
            var allSw = document.querySelectorAll('.pondasi-swatch');
            for (var swi = 0; swi < allSw.length; swi++) {
                allSw[swi].classList.remove('pondasi-swatch-selected');
                if (allSw[swi].dataset.color === color) {
                    allSw[swi].classList.add('pondasi-swatch-selected');
                }
            }
            return;
        }

        // Highlight swatch yang dipilih
        var allSwatches = document.querySelectorAll('.pondasi-swatch');
        for (var i = 0; i < allSwatches.length; i++) {
            allSwatches[i].classList.remove('pondasi-swatch-selected');
            if (color && allSwatches[i].dataset.color && allSwatches[i].dataset.color.toUpperCase() === color.toUpperCase()) {
                allSwatches[i].classList.add('pondasi-swatch-selected');
            }
        }

        // Simpan selected color untuk apply nanti
        P.STATE.editMode.selectedColor = color;
        P.STATE.editMode.selectedColorType = type;
    }

    /* Apply swatch — v125: apply warna, TIDAK auto-close modal */
    P.applySwatch = function(color, type) {
        if (!P.STATE.editMode.active) return;

        // Jalur A: State swatch (pseudo-class tab color picker)
        if (type && type.indexOf('state-') === 0) {
            if (P.applySwatchState) {
                P.applySwatchState(color);
            }
            return;
        }

        // Jalur A: Rule swatch (penjabaran kelas color picker)
        if (type && type.indexOf('rule-') === 0) {
            var ctx = P.STATE.editMode.ruleContext;
            if (ctx && P.terapkanInlineOverride) {
                var block = P.cariBlockById(P.STATE.editMode.selectedBlockId);
                if (block) {
                    P.terapkanInlineOverride(block, ctx.prop, color);
                    P.renderPanel();
                }
            }
            return;
        }

        // Mode block: apply ke block.style via P.applySwatchBlock
        if (type && type.indexOf('block-') === 0) {
            var field = type.slice('block-'.length);
            P.applySwatchBlock(color, field);
            return;
        }

        var regionEl = document.querySelector('.pondasi-region[data-id="' + P.STATE.editMode.regionId + '"]');
        if (!regionEl) return;
        regionEl.focus();
        // v126: Restore saved selection SETIAP kali apply (jangan null-kan)
        // User bisa apply berkali-kali tanpa close modal
        if (P.STATE.editMode.savedSelection) {
            P.restoreSelection(P.STATE.editMode.savedSelection);
            // JANGAN null-kan savedSelection — keep alive sampai modal close
        }

        if (type === 'text') {
            if (color === '') {
                // Hapus warna teks — pakai default
                P.editorCommand('foreColor', '#1E2832');
            } else {
                P.editorCommand('foreColor', color);
            }
        } else if (type === 'fill') {
            if (color === '') {
                // Hapus latar — pakai transparent
                P.editorCommand('hiliteColor', 'transparent');
                P.editorCommand('backColor', 'transparent');
            } else {
                P.editorCommand('hiliteColor', color);
                P.editorCommand('backColor', color);
            }
        } else if (type === 'stroke') {
            // Stroke = border color untuk selection (wrap span dengan border)
            var sel = window.getSelection();
            if (sel.rangeCount > 0 && !sel.isCollapsed) {
                var range = sel.getRangeAt(0);
                var span = document.createElement('span');
                span.style.border = '1px solid ' + (color || 'transparent');
                if (color === '') span.style.border = '0';
                try {
                    range.surroundContents(span);
                } catch (e) {
                    span.textContent = range.toString();
                    range.deleteContents();
                    range.insertNode(span);
                }
                P.handleEditorInput();
            } else {
                // Tidak ada selection — aplikasikan ke region (inline style)
                if (color === '') {
                    regionEl.style.border = '';
                } else {
                    regionEl.style.border = '1px solid ' + color;
                }
                P.handleEditorInput();
            }
        } else if (type === 'border') {
            // Border color untuk region (cangkang) — update dataset.borderColor
            if (color === '') {
                regionEl.dataset.borderColor = '#5A646E';
            } else {
                regionEl.dataset.borderColor = color;
            }
            // Re-apply border
            var bw = regionEl.dataset.borderWidth || '0';
            var bs = regionEl.dataset.borderStyle || 'none';
            var bc = regionEl.dataset.borderColor;
            if (bs === 'none' || bw === '0px' || bw === '0') {
                regionEl.style.border = '';
            } else {
                regionEl.style.border = bw + ' ' + bs + ' ' + bc;
            }
            P.handleEditorInput();
        }
        // v125: TIDAK auto-close modal — user bisa apply warna lain atau close manual
        P.flash('Warna diterapkan: ' + (color || 'kosong'));
    }

    /* Aksi kustom (insert-link, insert-image, dll) */
    P.editorAction = function(action) {
        if (!P.STATE.editMode.active) return;
        var regionEl = document.querySelector('.pondasi-region[data-id="' + P.STATE.editMode.regionId + '"]');
        if (!regionEl) return;
        regionEl.focus();

        if (P.STATE.editMode.savedSelection) {
            P.restoreSelection(P.STATE.editMode.savedSelection);
            // v126: jangan null-kan — keep alive untuk multi-apply
        }

        switch (action) {
            case 'insert-link':
                var url = prompt('URL tautan:', 'https://');
                if (url) P.editorCommand('createLink', url);
                break;
            case 'insert-image':
                var img = prompt('URL gambar:', 'https://');
                if (img) P.editorCommand('insertImage', img);
                break;
            case 'insert-icon':
                var icon = prompt('Karakter ikon (emoji/symbol):', '★');
                if (icon) {
                    var sel = window.getSelection();
                    if (sel.rangeCount > 0) {
                        var range = sel.getRangeAt(0);
                        range.insertNode(document.createTextNode(icon));
                        range.collapse(false);
                        P.handleEditorInput();
                    }
                }
                break;
            case 'insert-span':
                // Bungkus selection dengan <span>
                var spanText = prompt('Teks untuk span (akan menggantikan seleksi):', 'span');
                if (spanText) {
                    var sel2 = window.getSelection();
                    if (sel2.rangeCount > 0) {
                        var range2 = sel2.getRangeAt(0);
                        range2.deleteContents();
                        var spanEl = document.createElement('span');
                        spanEl.textContent = spanText;
                        range2.insertNode(spanEl);
                        P.handleEditorInput();
                    }
                }
                break;
            case 'insert-newline':
                // Sisipkan <br> tanpa memecah paragraf
                document.execCommand('insertLineBreak');
                P.handleEditorInput();
                break;
            case 'swatch-text':
                P.openSwatches('text');
                break;
            case 'swatch-fill':
                P.openSwatches('fill');
                break;
            case 'swatch-stroke':
                P.openSwatches('stroke');
                break;
            case 'swatch-border-color':
                P.openSwatches('border');
                break;
            case 'close-swatches':
                P.closeSwatches();
                break;
            case 'apply-none':
                // v125: select kosong dulu, apply via "Terapkan"
                P.selectSwatch('', P.STATE.editMode.paletteOpen);
                break;
            case 'apply-hex':
                P.applyHexFromInput();
                break;
            case 'insert-table':
                P.insertTable();
                break;
            case 'apply-class':
                P.applyCustomClass();
                break;
            case 'exit-edit':
                P.keluarModeEdit();
                break;
        }
    }

    /* Apply hex dari input hex / color picker */
    /* v126: apply + tambahkan ke custom colors + update baris kustom tanpa re-render seluruh modal */
    P.applyHexFromInput = function() {
        var hexInput = document.getElementById('swatches-hex');
        if (!hexInput) return;
        var val = hexInput.value.trim();
        if (!val) {
            if (P.STATE.editMode.selectedColor === '') {
                val = '';
            } else {
                return;
            }
        }
        // Validasi hex (kecuali kosong)
        if (val && !/^#[0-9a-fA-F]{3,7}$/.test(val)) {
            P.flash('Hex tidak valid (mis. #FF3232)');
            return;
        }
        // Normalize
        if (val) {
            val = val.toUpperCase();
            if (val.length === 4) {
                val = '#' + val[1] + val[1] + val[2] + val[2] + val[3] + val[3];
            }
        }
        // v126: Apply warna ke canvas — savedSelection masih alive karena tidak ditimpa
        // v135: Dalam gradient mode, "Terapkan" hanya apply gradient ke block
        // Stop colors sudah auto-update dari wheel/swatch (eyedropper behavior)
        if (P.isGradientMode && P.isGradientMode()) {
            // Apply gradient class ke block
            var blockId = P.STATE.editMode.selectedBlockId;
            if (blockId) {
                var gradCls = P.applyGradientToBlock ? P.applyGradientToBlock(blockId, 'latar') : null;
                P.renderBlocks();
                P.renderPanel();
                // v138: Refresh baris "Warna Pengguna" supaya swatch gradient langsung muncul
                if (P.refreshCustomColorRow) P.refreshCustomColorRow(P.STATE.editMode.paletteOpen);
                // v141: Highlight swatch gradient yang baru di-apply
                if (gradCls) {
                    var gradColor = '#GRAD:' + gradCls;
                    P.selectSwatch(gradColor, P.STATE.editMode.paletteOpen);
                }
                P.flash('Gradient diterapkan');
                return;
            }
            P.applySwatch(val, P.STATE.editMode.paletteOpen);
            return;
        }
        // Mode flat (existing behavior)
        P.applySwatch(val, P.STATE.editMode.paletteOpen);
        // v130: tambahkan ke custom colors HANYA jika bukan palette default
        if (val && P.addCustomColor) {
            var wasAdded = P.addCustomColor(val);
            if (wasAdded) {
                // Hanya refresh baris custom jika warna baru benar-benar ditambahkan
                P.refreshCustomColorRow(P.STATE.editMode.paletteOpen);
            }
            // Highlight swatch yang baru di-apply (baik default maupun custom)
            P.selectSwatch(val, P.STATE.editMode.paletteOpen);
        } else if (!val) {
            // val kosong (apply none) — tetap highlight
            P.selectSwatch('', P.STATE.editMode.paletteOpen);
        }
    }

    /* Sisipkan tabel sederhana */
    P.insertTable = function() {
        var rows = prompt('Jumlah baris:', '2');
        if (!rows) return;
        var cols = prompt('Jumlah kolom:', '2');
        if (!cols) return;
        rows = parseInt(rows, 10);
        cols = parseInt(cols, 10);
        if (isNaN(rows) || isNaN(cols) || rows < 1 || cols < 1) {
            P.flash('Jumlah baris/kolom tidak valid');
            return;
        }
        var html = '<table><tbody>';
        for (var r = 0; r < rows; r++) {
            html += '<tr>';
            for (var c = 0; c < cols; c++) {
                html += '<td>' + (r === 0 ? 'Judul ' + (c + 1) : 'Sel') + '</td>';
            }
            html += '</tr>';
        }
        html += '</tbody></table>';
        var regionEl = document.querySelector('.pondasi-region[data-id="' + P.STATE.editMode.regionId + '"]');
        if (regionEl) {
            regionEl.focus();
            document.execCommand('insertHTML', false, html);
            P.handleEditorInput();
        }
    }

    /* Apply kelas kustom ke region */
    P.applyCustomClass = function() {
        var inp = document.getElementById('editor-custom-class');
        if (!inp) return;
        var cls = inp.value.trim();
        if (!cls) {
            P.flash('Nama kelas tidak boleh kosong');
            return;
        }
        // Sanitasi: hanya huruf, angka, - dan _
        if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(cls)) {
            P.flash('Nama kelas tidak valid. Hanya huruf, angka, - dan _');
            return;
        }
        P.STATE.editMode.customClass = cls;
        // Update tree node
        var node = P.getById(P.STATE.editMode.regionId);
        if (node) {
            // Hapus kelas kustom lama
            node.classes = node.classes.filter(function (c) {
                return c.indexOf('kolom-') === 0 || c === 'baris' || c === 'sub-baris';
            });
            // Tambah kelas baru
            if (node.classes.indexOf(cls) < 0) {
                node.classes.push(cls);
            }
            node.customClass = cls;
        }
        // Simpan rule CSS kustom (font, size, line-height yang dipilih di editor)
        var rules = {};
        var ff = document.getElementById('editor-font-family');
        var fs = document.getElementById('editor-font-size');
        var lh = document.getElementById('editor-line-height');
        if (ff && ff.value) rules.fontFamily = ff.value;
        if (fs && fs.value) rules.fontSize = fs.value;
        if (lh && lh.value) rules.lineHeight = lh.value;
        // Ambil warna teks & bg dari region (inline style yang sudah diterapkan)
        var regionEl = document.querySelector('.pondasi-region[data-id="' + P.STATE.editMode.regionId + '"]');
        if (regionEl) {
            var cs = window.getComputedStyle(regionEl);
            if (cs.color && cs.color !== 'rgb(30, 40, 50)') rules.color = cs.color;
            if (cs.backgroundColor && cs.backgroundColor !== 'rgb(255, 255, 255)') rules.backgroundColor = cs.backgroundColor;
        }
        P.STATE.customCSS[P.STATE.editMode.regionId] = {
            className: cls,
            rules: rules
        };
        P.save();
        P.flash('Kelas "' + cls + '" diterapkan. CSS akan diekspor ke berkas terpisah.');
    }

    /* Update tombol aktif di editor (bold/italic/underline state) */
    P.updateEditorButtonStates = function() {
        if (!P.STATE.editMode.active) return;
        var cmds = ['bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript',
                    'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull',
                    'insertUnorderedList', 'insertOrderedList'];
        cmds.forEach(function (cmd) {
            var btn = document.querySelector('.pondasi-editor-btn[data-cmd="' + cmd + '"]');
            if (!btn) return;
            try {
                if (document.queryCommandState(cmd)) {
                    btn.classList.add('pondasi-editor-btn-active');
                } else {
                    btn.classList.remove('pondasi-editor-btn-active');
                }
            } catch (e) {
                // Some commands may not be supported
            }
        });
        // Update heading select ke tag blok aktif
        try {
            var block = document.queryCommandValue('formatBlock');
            var sel = document.getElementById('editor-heading');
            if (sel && block) {
                var tag = block.toUpperCase().replace(/[<>]/g, '');
                for (var i = 0; i < sel.options.length; i++) {
                    if (sel.options[i].value === tag) {
                        sel.selectedIndex = i;
                        break;
                    }
                }
            }
        } catch (e) {}
    }

    /* Editor event handler (click di toolbar) */
    P.handleEditorClick = function(e) {
        var target = e.target.closest('[data-cmd], [data-action]');
        if (!target) return;
        e.preventDefault();
        e.stopPropagation();
        if (target.dataset.cmd) {
            P.editorCommand(target.dataset.cmd);
        } else if (target.dataset.action) {
            P.editorAction(target.dataset.action);
        }
    }

    P.handleEditorChange = function(e) {
        var target = e.target;
        if (target.id === 'editor-heading') {
            P.editorCommand('formatBlock', target.value);
        } else if (target.id === 'editor-font-family') {
            P.applyRegionStyle('fontFamily', target.value);
        } else if (target.id === 'editor-font-size') {
            P.applyRegionStyle('fontSize', target.value);
        } else if (target.id === 'editor-line-height') {
            P.applyRegionStyle('lineHeight', target.value);
        } else if (target.id === 'region-margin-top' || target.id === 'region-margin-right' ||
                   target.id === 'region-margin-bottom' || target.id === 'region-margin-left') {
            P.applyRegionBox('margin', target);
        } else if (target.id === 'region-padding-top' || target.id === 'region-padding-right' ||
                   target.id === 'region-padding-bottom' || target.id === 'region-padding-left') {
            P.applyRegionBox('padding', target);
        } else if (target.id === 'region-border-width') {
            P.applyRegionBorder('width', target.value);
        } else if (target.id === 'region-border-style') {
            P.applyRegionBorder('style', target.value);
        }
    }

    /* Apply margin/padding region (input number → rem) */
    P.applyRegionBox = function(prop, target) {
        if (!P.STATE.editMode.active) return;
        var regionEl = document.querySelector('.pondasi-region[data-id="' + P.STATE.editMode.regionId + '"]');
        if (!regionEl) return;
        var val = target.value;
        var side = target.id.replace('region-' + prop + '-', '');
        var cssProp = prop + P.capitalize(side);
        if (val === '' || isNaN(parseFloat(val))) {
            regionEl.style[cssProp] = '';
        } else {
            regionEl.style[cssProp] = val + 'rem';
        }
        P.handleEditorInput();
    }

    P.capitalize = function(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    /* Apply region-level style (font, size, line-height) — pakai inline style region */
    P.applyRegionStyle = function(prop, value) {
        if (!P.STATE.editMode.active) return;
        var regionEl = document.querySelector('.pondasi-region[data-id="' + P.STATE.editMode.regionId + '"]');
        if (!regionEl) return;
        if (value === '') {
            regionEl.style[prop] = '';
        } else {
            regionEl.style[prop] = value;
        }
        P.handleEditorInput();
    }

    /* Apply border (stroke) ke region */
    P.applyRegionBorder = function(dim, value) {
        if (!P.STATE.editMode.active) return;
        var regionEl = document.querySelector('.pondasi-region[data-id="' + P.STATE.editMode.regionId + '"]');
        if (!regionEl) return;
        // Simpan state border saat ini
        if (!regionEl.dataset.borderWidth) regionEl.dataset.borderWidth = '0';
        if (!regionEl.dataset.borderStyle) regionEl.dataset.borderStyle = 'none';
        if (!regionEl.dataset.borderColor) regionEl.dataset.borderColor = '#5A646E';
        if (dim === 'width') regionEl.dataset.borderWidth = (value || '0') + 'px';
        if (dim === 'style') regionEl.dataset.borderStyle = value || 'none';
        // Apply
        var bw = regionEl.dataset.borderWidth;
        var bs = regionEl.dataset.borderStyle;
        var bc = regionEl.dataset.borderColor;
        if (bs === 'none' || bw === '0px' || bw === '0') {
            regionEl.style.border = '';
        } else {
            regionEl.style.border = bw + ' ' + bs + ' ' + bc;
        }
        P.handleEditorInput();
    }

    /* ======================================================================
       BLOCK EDITOR — sistem insert-as-block untuk region edit mode
       ======================================================================

       Struktur block dalam node:
       node.blocks = [
         { tag: "h3", kelas: "judul-3", isi: "Judul Saya", properti: {} },
         { tag: "p", kelas: "isi-1", isi: "Paragraf teks...", properti: {} },
         { tag: "img", kelas: "kartu-gambar", properti: { src: "...", alt: "..." } },
         ...
       ]

       Setiap block dirender sebagai element HTML tag dengan kelas tampilan.css.
       Block bisa di-reorder (drag / ctrl+arrow), dihapus, dan diedit teksnya.
    */

    // Daftar isi yang bisa di-insert
    // Clipboard untuk copy/cut/paste block
    P.clipboardBlock = null;

    P.DAFTAR_ISI = {
        'p':         { tag: 'p',         kelas: 'isi-1',      isiPlaceholder: 'Ketik paragraf...' },
        'h1':        { tag: 'h1',        kelas: 'judul-1',    isiPlaceholder: 'Ketik heading 1...' },
        'h2':        { tag: 'h2',        kelas: 'judul-2',    isiPlaceholder: 'Ketik heading 2...' },
        'h3':        { tag: 'h3',        kelas: 'judul-3',    isiPlaceholder: 'Ketik heading 3...' },
        'h4':        { tag: 'h4',        kelas: 'judul-4',    isiPlaceholder: 'Ketik heading 4...' },
        'h5':        { tag: 'h5',        kelas: 'judul-5',    isiPlaceholder: 'Ketik heading 5...' },
        'h6':        { tag: 'h6',        kelas: 'judul-6',    isiPlaceholder: 'Ketik heading 6...' },
        'blockquote':{ tag: 'blockquote',kelas: '',             isiPlaceholder: 'Ketik kutipan...' },
        'pre':       { tag: 'pre',       kelas: '',             isiPlaceholder: 'Ketik kode...' },
        'ul':        { tag: 'ul',        kelas: '',             isi: '<li>Item 1</li><li>Item 2</li>' },
        'ol':        { tag: 'ol',        kelas: '',             isi: '<li>Item 1</li><li>Item 2</li>' },
        'hr':        { tag: 'hr',        kelas: 'pemisah',    isi: '' },
        'img':       { tag: 'img',       kelas: 'kartu-gambar', properti: { src: '', alt: 'Gambar' } },
        'table':     { tag: 'table',     kelas: 'tabel',      isi: '<thead><tr><th>Judul 1</th><th>Judul 2</th></tr></thead><tbody><tr><td>Isi 1</td><td>Isi 2</td></tr></tbody>' },
        'spacer':    { tag: 'div',       kelas: '',             properti: { style: 'height:2rem;' } }
    };

    // Daftar komponen yang bisa di-insert
    P.DAFTAR_KOMPONEN = {
        'tombol-berisi':   { tag: 'div', kelas: 'tombol tombol-berisi', isi: 'Tombol' },
        'tombol-garis':    { tag: 'div', kelas: 'tombol tombol-garis', isi: 'Tombol' },
        'tombol-melayang': { tag: 'div', kelas: 'tombol-melayang', isi: '+' },
        'kartu':           { tag: 'div', kelas: 'kartu bayangan-1', isi: '<div class="kartu-kepala">Judul Kartu</div><div class="kartu-badan">Isi kartu di sini.</div>' },
        'akordion':        { tag: 'div', kelas: 'akordion', isi: '<details class="akordion-item" open><summary>Pertanyaan 1</summary><div class="akordion-isi">Jawaban 1.</div></details>' },
        'pemisah-teks':    { tag: 'div', kelas: 'pemisah-teks', isi: 'Atau' },
        'input-melayang':  { tag: 'div', kelas: 'ruas-input', isi: '<input type="text" placeholder=" "><label>Label</label>' },
        'textarea':        { tag: 'div', kelas: 'ruas-input', isi: '<textarea placeholder=" " rows="3"></textarea><label>Label</label>' },
        'select':          { tag: 'div', kelas: 'ruas-input', isi: '<div class="ruas-pilih"><select><option>Pilih</option><option>Opsi 1</option></select></div>' },
        'checkbox':        { tag: 'label', kelas: '', isi: '<input type="checkbox" class="centang"> Centang saya' },
        'radio':           { tag: 'label', kelas: '', isi: '<input type="radio" name="demo" class="radio"> Pilih saya' },
        'saklar':          { tag: 'label', kelas: '', isi: '<input type="checkbox" class="saklar"> Aktif' },
        'slider':          { tag: 'input', kelas: 'deret', properti: { type: 'range', min: '0', max: '100', value: '50' } },
        'stepper':         { tag: 'div', kelas: 'langkah-angka', isi: '<input type="number" value="0"><button class="langkah-tombol langkah-naik">+</button><button class="langkah-tombol langkah-turun">&minus;</button>' },
        'segment':         { tag: 'div', kelas: 'segment', isi: '<button class="segment-item segment-aktif">A</button><button class="segment-item">B</button>' },
        'toggle-grup':     { tag: 'div', kelas: 'toggle-grup', isi: '<button class="toggle-grup-item toggle-aktif">List</button><button class="toggle-grup-item">Grid</button>' },
        'bilah-aplikasi':  { tag: 'div', kelas: 'bilah-aplikasi', isi: '<span class="bilah-judul">Judul Aplikasi</span>' },
        'tab':             { tag: 'div', kelas: 'tab-bilah', isi: '<button class="tab tab-aktif">Tab 1</button><button class="tab">Tab 2</button>' },
        'menu-mendatar':   { tag: 'div', kelas: 'menu-mendatar', isi: '<a class="menu-mendatar-item menu-aktif">Beranda</a><a class="menu-mendatar-item">Tentang</a>' },
        'pesan-info':      { tag: 'div', kelas: 'pesan pesan-info', isi: 'Pesan info.' },
        'pesan-sukses':    { tag: 'div', kelas: 'pesan pesan-sukses', isi: 'Pesan sukses.' },
        'chip':            { tag: 'span', kelas: 'chip', isi: 'Chip' },
        'badge':           { tag: 'span', kelas: 'badge', isi: '3' },
        'progress':        { tag: 'div', kelas: 'progress', isi: '<div class="progress-nilai" style="width:50%;"></div>' },
        'tooltip':         { tag: 'span', kelas: 'tooltip', isi: 'Arahkan kursor<span class="tooltip-teks">Tooltip teks</span>' },
        'avatar':          { tag: 'div', kelas: 'avatar', isi: '<span class="avatar-teks">AB</span>' },
        'daftar':          { tag: 'ul', kelas: 'daftar bayangan-1', isi: '<li class="daftar-item">Item 1</li><li class="daftar-item">Item 2</li>' }
    };

    // ID unik untuk block
    P.blockNextId = 1;
    P.genBlockId = function() {
        return "b" + (P.blockNextId++);
    }

    // Insert block ke region aktif
    P.insertBlock = function(daftarKey, isKomponen) {
        if (!P.STATE.editMode.active) return;
        var node = P.getById(P.STATE.editMode.regionId);
        if (!node) return;

        P.pushUndo();

        var template;
        if (isKomponen) {
            template = P.DAFTAR_KOMPONEN[daftarKey];
        } else {
            template = P.DAFTAR_ISI[daftarKey];
        }
        if (!template) return;

        var block = {
            id: P.genBlockId(),
            tag: template.tag,
            kelas: template.kelas || '',
            isi: template.isi || '',
            properti: template.properti ? P.duplikasiObjek(template.properti) : {}
        };

        // Untuk img, prompt URL
        if (template.tag === 'img') {
            var url = prompt('URL gambar:', 'https://');
            if (!url) return;
            block.properti = block.properti || {};
            block.properti.src = url;
            block.properti.alt = 'Gambar';
            block.isi = '';
        }

        // Untuk table, prompt rows/cols
        if (template.tag === 'table') {
            var rows = prompt('Jumlah baris:', '2');
            var cols = prompt('Jumlah kolom:', '2');
            if (!rows || !cols) return;
            rows = parseInt(rows, 10);
            cols = parseInt(cols, 10);
            var html = '<thead><tr>';
            for (var c = 0; c < cols; c++) html += '<th>Judul ' + (c + 1) + '</th>';
            html += '</tr></thead><tbody>';
            for (var r = 0; r < rows; r++) {
                html += '<tr>';
                for (var c2 = 0; c2 < cols; c2++) html += '<td>Sel</td>';
                html += '</tr>';
            }
            html += '</tbody>';
            block.isi = html;
        }

        // Tambah ke node.blocks
        if (!node.blocks) node.blocks = [];
        node.blocks.push(block);

        P.save();
        P.renderBlocks();
        // Fokus ke block baru
        setTimeout(function () {
            var el = document.querySelector('[data-block-id="' + block.id + '"]');
            if (el) {
                el.focus();
                // Pilih semua teks
                var sel = window.getSelection();
                var range = document.createRange();
                range.selectNodeContents(el);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }, 50);
    }

    /* === INSERT BLOCK DARI SKEMA_BLOCK (mega dropdown pakai ini) ===
       Skema baru (pondasi-blok-*.js) punya key berbeda dari DAFTAR_ISI lama.
       Mis. 'paragraf' (bukan 'p'), 'heading-1' (bukan 'h1'), 'tombol-berisi' (sama).
       Fungsi ini langsung pakai data dari SKEMA_BLOCK, tidak perlu lookup DAFTAR_*.
       */
    P.insertBlockFromSkema = function(jenisBlock) {
        if (!P.STATE.editMode.active) return;
        var node = P.getById(P.STATE.editMode.regionId);
        if (!node) return;

        var skema = P.SKEMA_BLOCK[jenisBlock];
        if (!skema) {
            console.warn('[pondasi] skema tidak ditemukan untuk jenis:', jenisBlock);
            return;
        }

        P.pushUndo();

        // Tentukan tag & kelas default dari skema
        var tag = skema.tag || 'div';
        var kelas = skema.kelasDefault || '';

        // Tentukan isi default berdasarkan jenis block
        var isiDefault = '';

        // === FORM BLOCKS ===
        // Form blocks pakai tag 'div'/'label' (wrapper), bukan 'input'/'textarea'/'select'.
        // renderIsiBlock akan generate inner HTML via 'form-input'/'pilihan' case.
        var formJenis = ['input-teks', 'input-pencarian', 'textarea', 'select',
            'checkbox', 'radio', 'saklar', 'slider', 'stepper',
            'input-file', 'input-warna', 'fieldset', 'label-form'];
        if (formJenis.indexOf(jenisBlock) >= 0) {
            // Form blocks: isi kosong, renderIsiBlock akan generate
            isiDefault = '';
            // Tapi set properti default
            var formProperti = {};
            if (jenisBlock === 'input-teks') { formProperti.tipe = 'text'; formProperti.placeholder = ''; formProperti.label = 'Label'; }
            else if (jenisBlock === 'input-pencarian') { formProperti.tipe = 'search'; formProperti.placeholder = ''; formProperti.label = 'Cari'; }
            else if (jenisBlock === 'textarea') { formProperti.label = 'Pesan'; formProperti.baris = 3; }
            else if (jenisBlock === 'select') { formProperti.label = 'Pilih'; formProperti.items = ['Opsi 1', 'Opsi 2']; }
            else if (jenisBlock === 'checkbox') { formProperti.label = 'Pilih'; formProperti.nilai = 'ya'; }
            else if (jenisBlock === 'radio') { formProperti.label = 'Pilih'; formProperti.items = ['Opsi 1', 'Opsi 2']; }
            else if (jenisBlock === 'saklar') { formProperti.label = 'Aktifkan'; }
            else if (jenisBlock === 'slider') { formProperti.min = 0; formProperti.max = 100; formProperti.step = 1; formProperti.nilai = 50; formProperti.label = 'Volume'; }
            else if (jenisBlock === 'stepper') { formProperti.min = 0; formProperti.step = 1; formProperti.nilai = 0; formProperti.label = 'Jumlah'; }
            else if (jenisBlock === 'input-file') { formProperti.tipe = 'file'; formProperti.label = 'Pilih berkas'; }
            else if (jenisBlock === 'input-warna') { formProperti.tipe = 'color'; formProperti.nilai = '#00AAD4'; formProperti.label = 'Pilih warna'; }
            else if (jenisBlock === 'fieldset') { formProperti.judul = 'Informasi Pribadi'; }
            else if (jenisBlock === 'label-form') { formProperti.untuk = ''; }

            var blockForm = {
                id: P.genBlockId(),
                tag: tag,
                kelas: kelas,
                isi: isiDefault,
                properti: formProperti,
                style: {},
                aksi: {},
                jenis: jenisBlock
            };
            // Set block.items untuk select dan radio (dipakai oleh renderIsiBlock)
            if (jenisBlock === 'select' || jenisBlock === 'radio') {
                blockForm.items = formProperti.items || [];
            }
            if (!node.blocks) node.blocks = [];
            node.blocks.push(blockForm);
            P.save();
            P.renderBlocks();
            P.flash(skema.nama + ' ditambahkan');
            return;
        }

        // === NON-FORM BLOCKS ===
        if (tag === 'p') isiDefault = 'Ketik paragraf...';
        else if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') isiDefault = 'Ketik heading...';
        else if (tag === 'blockquote') isiDefault = 'Ketik kutipan...';
        else if (tag === 'pre') isiDefault = '<code>Ketik kode...</code>';
        else if (tag === 'code') isiDefault = 'kode()';
        else if (tag === 'mark') isiDefault = 'teks disorot';
        else if (tag === 'kbd') isiDefault = 'Ctrl+S';
        else if (tag === 'abbr') isiDefault = 'HTML';
        else if (tag === 'small') isiDefault = 'Keterangan kecil';
        else if (tag === 'span') isiDefault = 'Teks';
        else if (tag === 'ul' || tag === 'ol') isiDefault = '<li>Item 1</li><li>Item 2</li>';
        else if (tag === 'dl') isiDefault = '<dt>Istilah</dt><dd>Definisi</dd>';
        else if (tag === 'img' || tag === 'figure') {
            // Untuk gambar/figure: tampilkan dialog pilih sumber
            P._imageInsertType = jenisBlock;
            P._imageInsertNode = node;
            P._imageInsertSkema = skema;
            // v117: tambah opsi pilih dari Asset Manager
            P.tampilkanDialog('Sumber Gambar',
                'Pilih sumber gambar:\n\n• Dari Asset Manager — pilih gambar yang sudah diupload\n• File dari Harddisk — upload baru lalu pakai\n• URL — masukkan link gambar dari internet',
                'Dari Assets', 'Lainnya',
                function(ok) {
                    if (ok === true) {
                        // Dari Asset Manager
                        P.tampilkanAssetPicker(function (assetURL, assetName, assetMeta) {
                            // Untuk mode file://, pakai relative path 'gambar/nama.jpg'
                            // Saat export, gambar akan disertakan di folder gambar/
                            var relPath = 'gambar/' + assetName;
                            P._insertImageBlock(node, tag, kelas, jenisBlock, relPath, assetMeta.alt || 'Gambar', skema);
                        });
                    } else if (ok === 'Lainnya') {
                        // Pilih antara file harddisk atau URL
                        P.tampilkanDialog('Sumber Lain',
                            'Pilih:\n\n• File dari Harddisk (akan diupload ke Assets + dikompres)\n• URL — link dari internet',
                            'File Harddisk', 'URL',
                            function(ok2) {
                                if (ok2 === true) {
                                    // File dari harddisk → upload ke Assets, lalu pakai
                                    var fileInput = document.getElementById('image-pick-file');
                                    if (fileInput) {
                                        fileInput.value = '';
                                        // Set flag supaya handler tahu ini untuk insert block
                                        fileInput.dataset.purpose = 'insert-block';
                                        try { fileInput.click(); } catch (e) {}
                                    }
                                } else if (ok2 === 'URL') {
                                    var url = prompt('URL gambar:', 'https://');
                                    if (url) {
                                        P._insertImageBlock(node, tag, kelas, jenisBlock, url, 'Gambar', skema);
                                    }
                                }
                            });
                    } else if (ok === false) {
                        // Cancel
                    }
                });
            return;
        }
        else if (tag === 'hr') isiDefault = '';
        else if (tag === 'table') isiDefault = '<thead><tr><th>Judul 1</th><th>Judul 2</th></tr></thead><tbody><tr><td>Isi 1</td><td>Isi 2</td></tr></tbody>';
        else if (tag === 'button') isiDefault = 'Tombol';
        // (Form blocks: input/textarea/select sudah di-handle di form blocks section di atas)
        else if (tag === 'progress') {
            var blockProgress = {
                id: P.genBlockId(),
                tag: tag,
                kelas: kelas,
                isi: '',
                properti: { value: '50', max: '100' },
                style: {},
                aksi: {},
                jenis: jenisBlock
            };
            if (!node.blocks) node.blocks = [];
            node.blocks.push(blockProgress);
            P.save();
            P.renderBlocks();
            P.flash(skema.nama + ' ditambahkan');
            return;
        }
        else if (tag === 'nav') {
            // Nav biasanya butuh children (menu items)
            if (jenisBlock === 'breadcrumb') {
                isiDefault = '<ol><li><a href="#">Beranda</a></li><li><a href="#">Produk</a></li><li>Detail</li></ol>';
            } else if (jenisBlock === 'pagination') {
                isiDefault = '<ul><li><a href="#">&laquo;</a></li><li><a href="#">1</a></li><li><a href="#">2</a></li><li><a href="#">3</a></li><li><a href="#">&raquo;</a></li></ul>';
            } else if (jenisBlock === 'mega-menu') {
                isiDefault = '<ul><li><a href="#">Produk</a></li><li><a href="#">Layanan</a></li><li><a href="#">Tentang</a></li></ul>';
            } else {
                isiDefault = '<a href="#">Beranda</a><a href="#">Tentang</a><a href="#">Kontak</a>';
            }
        }
        else if (tag === 'header') isiDefault = '<h1>Nama Situs</h1>';
        else if (tag === 'footer') isiDefault = '<p>&copy; 2026 Nama Perusahaan.</p>';
        else if (tag === 'section') {
            if (jenisBlock === 'hero') {
                isiDefault = '<h1>Selamat datang</h1><p>Deskripsi singkat tentang situs Anda.</p><button class="tombol tombol-berisi">Mulai</button>';
            } else if (jenisBlock === 'banner') {
                isiDefault = '<h2>Penawaran terbatas!</h2><p>Diskon 50% hari ini.</p><button class="tombol tombol-berisi">Beli sekarang</button>';
            }
        }
        else if (tag === 'div') {
            // Div bisa berisi banyak hal tergantung jenis
            if (jenisBlock === 'kartu') isiDefault = '<div class="kartu-kepala">Judul Kartu</div><div class="kartu-badan">Isi kartu di sini.</div>';
            else if (jenisBlock === 'akordion') isiDefault = '<details class="akordion-item" open><summary>Pertanyaan 1</summary><div class="akordion-isi">Jawaban 1.</div></details>';
            else if (jenisBlock === 'pemisah-teks' || jenisBlock === 'pemisah-teks-komponen') isiDefault = 'Atau';
            else if (jenisBlock === 'modal') isiDefault = '<div class="modal-kepala">Judul</div><div class="modal-badan">Isi modal.</div><div class="modal-kaki"><button class="tombol tombol-berisi">OK</button></div>';
            else if (jenisBlock === 'drawer') isiDefault = '<div class="drawer-kepala">Menu</div><div class="drawer-badan">Isi drawer</div>';
            else if (jenisBlock === 'kosong' || jenisBlock === 'empty-state') isiDefault = '<div class="kosong-ikon">[ ]</div><div class="kosong-judul">Belum ada data</div><div class="kosong-teks">Tambahkan data untuk melihatnya di sini.</div>';
            else if (jenisBlock === 'skeleton') isiDefault = '';
            else if (jenisBlock === 'spinner') isiDefault = '';
            else if (jenisBlock === 'grup-tombol') isiDefault = '<button class="tombol tombol-berisi">Kiri</button><button class="tombol tombol-garis">Tengah</button><button class="tombol tombol-garis">Kanan</button>';
            else if (jenisBlock === 'segment' || jenisBlock === 'toggle-grup') isiDefault = '<button class="segment-item segment-aktif">A</button><button class="segment-item">B</button>';
            else if (jenisBlock === 'tab') isiDefault = '<button class="tab tab-aktif">Tab 1</button><button class="tab">Tab 2</button>';
            else if (jenisBlock === 'spinner-feedback' || jenisBlock === 'spinner') isiDefault = '';
            else if (jenisBlock === 'tooltip') isiDefault = 'Hover saya<span class="tooltip-teks">Tooltip teks</span>';
            else if (jenisBlock === 'popover') isiDefault = 'Klik saya<span class="popover-teks">Isi popover</span>';
            else if (jenisBlock === 'timeline') isiDefault = '<div class="timeline-item"><div class="timeline-titik"></div><div class="timeline-isi"><h4>2024</h4><p>Awal mula</p></div></div>';
            else if (jenisBlock === 'tree-view') isiDefault = '<li>Folder 1<ul><li>Sub 1</li></ul></li>';
            else if (jenisBlock === 'bilah-aplikasi') isiDefault = '<span class="bilah-judul">Judul Aplikasi</span>';
            else if (jenisBlock === 'menu-mendatar') isiDefault = '<a class="menu-mendatar-item menu-aktif">Beranda</a><a class="menu-mendatar-item">Tentang</a>';
            else if (jenisBlock === 'toast') isiDefault = 'Pesan toast';
            else if (jenisBlock === 'galeri') isiDefault = '<div class="galeri-item"><img src="https://" alt="Gambar 1"></div><div class="galeri-item"><img src="https://" alt="Gambar 2"></div>';
            else isiDefault = 'Ketik di sini...';
        }
        else if (tag === 'span') {
            if (jenisBlock === 'chip') isiDefault = 'Chip';
            else if (jenisBlock === 'badge') isiDefault = '3';
            else if (jenisBlock === 'tooltip') isiDefault = 'Hover saya<span class="tooltip-teks">Tooltip teks</span>';
            else if (jenisBlock === 'popover') isiDefault = 'Klik saya<span class="popover-teks">Isi popover</span>';
            else isiDefault = 'Teks';
        }
        else if (tag === 'form') isiDefault = '';
        else isiDefault = 'Ketik di sini...';

        // Buat block
        var blockFinal = {
            id: P.genBlockId(),
            tag: tag,
            kelas: kelas,
            isi: isiDefault,
            properti: {},
            style: {},
            aksi: {},
            jenis: jenisBlock  // simpan jenis supaya jenisBlock() bisa deteksi
        };

        // Tambah ke node.blocks
        if (!node.blocks) node.blocks = [];
        node.blocks.push(blockFinal);

        P.save();
        P.renderBlocks();
        P.flash(skema.nama + ' ditambahkan');
    }

    // Helper: insert image block dengan URL atau data URL
    P._insertImageBlock = function(node, tag, kelas, jenisBlock, src, alt, skema) {
        var block;
        if (tag === 'figure') {
            // Figure: tag figure, isi berisi <img> + <figcaption>
            block = {
                id: P.genBlockId(),
                tag: tag,
                kelas: kelas,
                isi: '<img src="' + src + '" alt="' + (alt || 'Gambar') + '"><figcaption>Keterangan gambar</figcaption>',
                properti: { src: src, alt: alt || 'Gambar', judul: 'Keterangan gambar' },
                style: {},
                aksi: {},
                jenis: jenisBlock
            };
        } else {
            // Gambar biasa: tag img
            block = {
                id: P.genBlockId(),
                tag: tag,
                kelas: kelas,
                isi: '',
                properti: { src: src, alt: alt || 'Gambar' },
                style: {},
                aksi: {},
                jenis: jenisBlock
            };
        }
        if (!node.blocks) node.blocks = [];
        node.blocks.push(block);
        P.save();
        P.renderBlocks();
        P.flash((skema ? skema.nama : 'Gambar') + ' ditambahkan');
    };

    // Handler: file gambar dipilih dari harddisk
    P.handleImageFileDipilih = function() {
        var fileInput = document.getElementById('image-pick-file');
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) return;
        var file = fileInput.files[0];

        // Validasi tipe file
        if (!file.type.match(/^image\//)) {
            P.flash('Berkas harus berupa gambar');
            return;
        }

        // Cek ukuran — gambar > 2MB akan warning (data URL bisa besar di localStorage)
        if (file.size > 2 * 1024 * 1024) {
            P.konfirmasi('Ukuran gambar ' + Math.round(file.size / 1024) + ' KB cukup besar. Data URL akan disimpan di localStorage. Lanjutkan?', function(ok) {
                if (ok) P._bacaFileGambar(file);
            }, 'Gambar Besar', 'Lanjutkan', 'Batal');
            return;
        }

        P._bacaFileGambar(file);
    };

    // Baca file gambar → data URL → insert block
    P._bacaFileGambar = function(file) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var dataUrl = e.target.result;
            var altText = file.name.replace(/\.[^.]+$/, ''); // nama file tanpa ekstensi
            var node = P._imageInsertNode;
            var tag = P._imageInsertType === 'figure' ? 'figure' : 'img';
            var kelas = P._imageInsertSkema ? (P._imageInsertSkema.kelasDefault || '') : '';
            P._insertImageBlock(node, tag, kelas, P._imageInsertType, dataUrl, altText, P._imageInsertSkema);
        };
        reader.onerror = function() {
            P.flash('Gagal membaca gambar');
        };
        reader.readAsDataURL(file);
    };

    // Duplikasi objek sederhana
    P.duplikasiObjek = function(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    // Render blocks dalam region edit mode
    P.renderBlocks = function() {
        var node = P.getById(P.STATE.editMode.regionId);
        if (!node) return;
        var regionEl = document.querySelector('.pondasi-region[data-id="' + P.STATE.editMode.regionId + '"]');
        if (!regionEl) return;

        // Hapus semua isi region (kecuali label)
        var label = regionEl.querySelector('.pondasi-region-label');
        while (regionEl.firstChild) regionEl.removeChild(regionEl.firstChild);
        if (label) regionEl.appendChild(label);

        // Render blocks
        if (node.blocks && node.blocks.length > 0) {
            node.blocks.forEach(function (block, idx) {
                var el = document.createElement(block.tag);
                el.setAttribute('data-block-id', block.id);
                // v135: Gabungkan block.kelas + block.classes (untuk gradient class dll)
                var allClasses = (block.kelas || '');
                if (block.classes && block.classes.length > 0) {
                    allClasses += (allClasses ? ' ' : '') + block.classes.join(' ');
                }
                allClasses += (allClasses ? ' ' : '') + 'pondasi-block';
                el.className = allClasses;
                // contentEditable = false (default), hanya true setelah double-click
                el.contentEditable = false;

                // Highlight kalau selectedBlockId = block.id atau di selectedBlockIds
                var isMultiSelected = P.STATE.editMode.selectedBlockIds &&
                    P.STATE.editMode.selectedBlockIds.indexOf(block.id) >= 0;
                if (P.STATE.editMode.selectedBlockId === block.id) {
                    el.style.outline = '2px solid #FFC832';
                    el.style.outlineOffset = '2px';
                } else if (isMultiSelected) {
                    el.style.outline = '2px solid #00B482';  // hijau untuk multi-select
                    el.style.outlineOffset = '2px';
                } else {
                    el.style.outline = '1px dashed #C8D0DA';
                    el.style.outlineOffset = '2px';
                }
                el.style.margin = '2px 0';
                el.style.cursor = 'pointer';

                // Set isi — pakai P.renderIsiBlock untuk mendukung items & jenis-specific
                var isiHtml = P.renderIsiBlock(block);
                if (isiHtml) {
                    el.innerHTML = isiHtml;
                } else if (block.isi) {
                    el.innerHTML = block.isi;
                } else if (block.tag !== 'img' && block.tag !== 'hr' && block.tag !== 'input') {
                    var ph = '';
                    var def = P.DAFTAR_ISI[block.tag === 'div' ? 'spacer' : block.tag];
                    if (def && def.isiPlaceholder) ph = def.isiPlaceholder;
                    if (!ph) ph = 'Ketik di sini...';
                    el.innerHTML = '<span style="color:#A0AAB4;">' + ph + '</span>';
                }

                // Set properti (src, alt, style, dll) — attribute HTML
                if (block.properti) {
                    for (var k in block.properti) {
                        if (block.properti.hasOwnProperty(k) && k !== 'label' && k !== 'placeholder' &&
                            k !== 'nama' && k !== 'tipe' && k !== 'jenisInput' &&
                            k !== 'required' && k !== 'checked' && k !== 'nilai' &&
                            k !== 'min' && k !== 'max' && k !== 'step' &&
                            k !== 'baris' && k !== 'kolom') {
                            el.setAttribute(k, block.properti[k]);
                        }
                    }
                }

                // Sync field spesifik per jenis block ke DOM attributes
                var jenisBlock = P.jenisBlock(block);
                // singkatan: field 'judul' (kepanjangan) → title attribute
                if (jenisBlock === 'singkatan' && block.judul) {
                    el.setAttribute('title', block.judul);
                }
                // label-form: field 'untuk' → for attribute
                if (jenisBlock === 'label-form' && block.untuk) {
                    el.setAttribute('for', block.untuk);
                }
                // gambar/figure: field 'src' → src attribute, 'alt' → alt attribute
                if ((jenisBlock === 'gambar' || jenisBlock === 'figure') && block.src) {
                    var imgEl = el.tagName === 'IMG' ? el : el.querySelector('img');
                    if (imgEl) {
                        imgEl.setAttribute('src', block.src);
                        if (block.alt) imgEl.setAttribute('alt', block.alt);
                    } else {
                        // Gambar block tag = img → set langsung
                        el.setAttribute('src', block.src);
                        if (block.alt) el.setAttribute('alt', block.alt);
                    }
                }
                // figure: field 'judul' → figcaption text
                if (jenisBlock === 'figure') {
                    var figcap = el.querySelector('figcaption');
                    if (figcap && block.judul) {
                        figcap.textContent = block.judul;
                    }
                }

                // Apply block.style (inline CSS)
                P.terapkanStyleBlock(el, block);
                // Apply block.aksi (event handlers)
                P.terapkanAksiBlock(el, block);

                // Setel ref di DOM — supaya delegation handler di regionEl bisa akses
                // (BUG FIX v25: sebelumnya tidak disetel → delegation return early)
                el._pondasiBlockRef = block;
                el._pondasiBlockIdx = idx;

                // Menu block (⋮) — tombol kecil di pojok kanan
                var menu = document.createElement('span');
                menu.className = 'pondasi-block-menu';
                menu.innerHTML = '⋮';
                menu.setAttribute('data-block-menu', block.id);
                menu.style.cssText = 'position:absolute;top:0;right:0;font-size:14px;color:#5A646E;cursor:pointer;padding:2px 6px;background:rgba(255,255,255,0.9);border-radius:3px;line-height:1;display:none;';

                // Bungkus block + menu dalam container relative
                var wrapper = document.createElement('div');
                wrapper.className = 'pondasi-block-wrapper';
                wrapper.style.cssText = 'position:relative;display:block;';
                wrapper.appendChild(el);
                wrapper.appendChild(menu);
                wrapper.setAttribute('data-block-wrapper', block.id);

                // v115: tampilkan indikator inherited/override dari master page
                var curPage = P.getCurrentPage ? P.getCurrentPage() : null;
                if (curPage && curPage.inheritFrom) {
                    if (block._inherited === true) {
                        // Inherited — read-only, cyan dashed border + M badge
                        wrapper.className += ' pondasi-block-inherited';
                        // Tambah unlock button
                        var unlockBtn = document.createElement('button');
                        unlockBtn.type = 'button';
                        unlockBtn.className = 'pondasi-block-unlock-btn';
                        unlockBtn.title = 'Unlock block — jadikan override lokal (bisa diedit)';
                        unlockBtn.innerHTML = P.icon('lock-open');
                        var rid = region.id;
                        var bid = block.id;
                        unlockBtn.onclick = function (e) {
                            e.stopPropagation();
                            P.konfirmasi('Jadikan block ini override lokal? Block bisa diedit, tidak akan ikut berubah saat master diubah.', function (ok) {
                                if (ok) P.unlockBlockOverride(rid, bid);
                            }, 'Unlock Block', 'Unlock', 'Batal');
                        };
                        wrapper.appendChild(unlockBtn);
                    } else if (block._inherited === false && block._originBlockId) {
                        // Override — orange dashed border + O badge + reset button
                        wrapper.className += ' pondasi-block-overridden';
                        var resetBtn = document.createElement('button');
                        resetBtn.type = 'button';
                        resetBtn.className = 'pondasi-block-unlock-btn';
                        resetBtn.title = 'Reset ke versi master';
                        resetBtn.style.color = '#FF9500';
                        resetBtn.style.borderColor = '#FF9500';
                        resetBtn.innerHTML = P.icon('rotate-left');
                        var rid2 = region.id;
                        var bid2 = block.id;
                        resetBtn.onclick = function (e) {
                            e.stopPropagation();
                            P.konfirmasi('Reset block ini ke versi master? Perubahan lokal akan hilang.', function (ok) {
                                if (ok) P.resetBlockOverride(rid2, bid2);
                            }, 'Reset ke Master', 'Reset', 'Batal');
                        };
                        wrapper.appendChild(resetBtn);
                    }
                }

                // Hover untuk tampilkan menu
                wrapper.onmouseenter = function () { menu.style.display = 'block'; };
                wrapper.onmouseleave = function () { menu.style.display = 'none'; };

                // v115: enable drag untuk cross-page copy
                wrapper.setAttribute('draggable', 'true');
                wrapper.addEventListener('dragstart', function (e) {
                    e.dataTransfer.effectAllowed = 'copy';
                    e.dataTransfer.setData('text/block-id', block.id);
                    e.dataTransfer.setData('text/plain', 'block:' + block.id);
                });

                regionEl.appendChild(wrapper);
            });

            // Insert point di akhir — hapus, redundant dengan editor bar
            // (user pakai tombol "Isi" / "Komponen" di editor bar, atau tekan i/k)
        } else {
            // Region kosong — tampilkan placeholder minimal
            var emptyPoint = document.createElement('div');
            emptyPoint.style.cssText = 'padding:2rem;text-align:center;color:#A0AAB4;font-size:0.875rem;border:2px dashed #C8D0DA;border-radius:6px;margin:0.5rem;';
            emptyPoint.innerHTML = 'Region kosong<br><br><span style="font-size:0.75rem;">Tekan <kbd style="background:#3C4650;color:#FFFFFF;padding:2px 6px;border-radius:3px;font-family:monospace;">i</kbd> untuk insert isi, <kbd style="background:#3C4650;color:#FFFFFF;padding:2px 6px;border-radius:3px;font-family:monospace;">k</kbd> untuk insert komponen</span>';
            emptyPoint.onclick = function () {
                P.tampilkanDropdownIsi();
            };
            regionEl.appendChild(emptyPoint);
        }

        // Catatan: input handler untuk simpan isi block ada di delegation (regionEl.addEventListener('input', ...))
        // Tidak perlu pasang inline per-blockEl (BUG FIX v25: hapus duplikat)

        // Menu block click handler
        var menus = regionEl.querySelectorAll('[data-block-menu]');
        for (var j = 0; j < menus.length; j++) {
            (function (m, blockIdx) {
                m.onclick = function (e) {
                    e.stopPropagation();
                    P.tampilkanMenuBlock(m, blockIdx);
                };
            })(menus[j], j);
        }

        // Inject pseudo-class CSS (hover/focus/active) untuk preview editor
        if (typeof P.injectPseudoStyle === 'function') {
            P.injectPseudoStyle();
        }

        // Pasang event delegation di regionEl untuk handle click, blur, input, dan drag block
        if (!regionEl._pondasiBlockHandlerPasang) {
            regionEl._pondasiBlockHandlerPasang = true;

            // Click handler — single click (pilih), shift+click (multi-select), double click (edit teks)
            regionEl.addEventListener('click', function (ev) {
                var blockEl = ev.target.closest('[data-block-id]');
                if (!blockEl) return;
                var blockRef = blockEl._pondasiBlockRef;
                if (!blockRef) return;

                // Cek apakah user baru saja seleksi teks (drag-select)
                // Tapi JANGAN blokir kalau ini double-click (browser auto-select kata)
                var selCek = window.getSelection();
                if (selCek && !selCek.isCollapsed && selCek.rangeCount > 0) {
                    var rangeCek = selCek.getRangeAt(0);
                    if (blockEl.contains(rangeCek.commonAncestorContainer)) {
                        // Cek apakah seleksi ini dari drag (mousedown ke mouseup jarak > 5px)
                        // atau dari double-click (browser auto-select kata)
                        // Double-click: seleksi 1 kata, range kecil. Drag: seleksi bebas.
                        // Untuk MVP: biarkan seleksi tetap, tapi tetap proses klik (jangan return)
                        // Hanya skip kalau user jelas sedang drag (mousedrag terdeteksi sebelumnya)
                        // Sebenarnya lebih aman: jangan return, biarkan klik diproses
                        // ev.preventDefault();
                        // ev.stopPropagation();
                        // return;
                    }
                }

                ev.preventDefault();
                ev.stopPropagation();

                // Shift+klik: multi-select block
                if (ev.shiftKey) {
                    if (P.STATE.editMode.selectedBlockIds === undefined) P.STATE.editMode.selectedBlockIds = [];
                    if (P.STATE.editMode.selectedBlockIds.indexOf(blockRef.id) >= 0) {
                        P.STATE.editMode.selectedBlockIds = P.STATE.editMode.selectedBlockIds.filter(function (id) { return id !== blockRef.id; });
                    } else {
                        P.STATE.editMode.selectedBlockIds.push(blockRef.id);
                    }
                    P.renderBlocks();
                    P.flash((P.STATE.editMode.selectedBlockIds || []).length + ' block terpilih');
                    return;
                }

                var sekarang = Date.now();
                var klikTerakhirVal = (P.STATE.editMode.lastBlockClickId === blockRef.id)
                    ? (P.STATE.editMode.lastBlockClickTime || 0) : 0;
                if (sekarang - klikTerakhirVal < 350) {
                    P.STATE.editMode.lastBlockClickId = null;
                    P.STATE.editMode.lastBlockClickTime = 0;
                    blockEl.contentEditable = true;
                    blockEl.style.cursor = 'text';
                    blockEl.style.outline = '2px solid #00AAD4';
                    blockEl.style.outlineOffset = '2px';
                    blockEl.focus();
                    var sel = window.getSelection();
                    var range = document.createRange();
                    range.selectNodeContents(blockEl);
                    sel.removeAllRanges();
                    sel.addRange(range);
                    // Init floating toolbar (kalau belum di-init)
                    if (P.FloatingToolbar) P.FloatingToolbar.init();
                } else {
                    P.STATE.editMode.lastBlockClickId = blockRef.id;
                    P.STATE.editMode.lastBlockClickTime = sekarang;
                    P.pilihBlock(blockRef.id);
                    // Tutup floating toolbar kalau bukan mode edit teks
                    if (P.FloatingToolbar) P.FloatingToolbar.tutup();
                }
            });

            // Blur handler — capture phase
            regionEl.addEventListener('blur', function (ev) {
                var blockEl = ev.target.closest('[data-block-id]');
                if (!blockEl || !blockEl._pondasiBlockRef) return;
                if (ev.target !== blockEl) return;
                var blockRef = blockEl._pondasiBlockRef;
                var blockIdx = blockEl._pondasiBlockIdx;
                blockEl.contentEditable = false;
                blockEl.style.cursor = 'pointer';
                // Tutup floating toolbar saat keluar dari edit teks
                if (P.FloatingToolbar) P.FloatingToolbar.tutup();
                if (P.STATE.editMode.selectedBlockId === blockRef.id) {
                    blockEl.style.outline = '2px solid #FFC832';
                } else {
                    blockEl.style.outline = '1px dashed #C8D0DA';
                }
                blockEl.style.outlineOffset = '2px';
                var n = P.getById(P.STATE.editMode.regionId);
                if (n && n.blocks && n.blocks[blockIdx]) {
                    var jenis = P.jenisBlock(n.blocks[blockIdx]);
                    // Cek tag untuk tentukan cara save
                    var tag = n.blocks[blockIdx].tag;
                    // Semua block yang punya teks konten → simpan innerHTML
                    // Untuk block input (input/textarea/select), jangan save isi innerHTML (mereka pakai properti)
                    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
                        // Input element — save value, bukan innerHTML
                        // (akan di-handle di properti handler)
                    } else if (tag === 'img' || tag === 'hr' || tag === 'progress') {
                        // Void element — tidak ada innerHTML
                    } else {
                        // Block dengan konten — save innerHTML
                        n.blocks[blockIdx].isi = blockEl.innerHTML;
                        P.save();
                    }
                }
            }, true);

            // Input handler — simpan isi saat mengetik
            regionEl.addEventListener('input', function (ev) {
                var blockEl = ev.target.closest('[data-block-id]');
                if (!blockEl || !blockEl._pondasiBlockRef) return;
                if (ev.target !== blockEl) return;
                var blockIdx = blockEl._pondasiBlockIdx;
                var n = P.getById(P.STATE.editMode.regionId);
                if (n && n.blocks && n.blocks[blockIdx]) {
                    var tag = n.blocks[blockIdx].tag;
                    // Hanya save untuk block dengan konten (bukan void/input)
                    if (tag !== 'input' && tag !== 'textarea' && tag !== 'select' &&
                        tag !== 'img' && tag !== 'hr' && tag !== 'progress') {
                        n.blocks[blockIdx].isi = blockEl.innerHTML;
                        P.save();
                    }
                }
            });

            // Drag-reorder handler — drag block ke posisi lain
            var dragBlockState = null;
            regionEl.addEventListener('mousedown', function (ev) {
                if (ev.button !== 0) return;
                var wrapper = ev.target.closest('[data-block-wrapper]');
                if (!wrapper) return;
                var blockEl = wrapper.querySelector('[data-block-id]');
                if (!blockEl || blockEl.contentEditable === 'true') return;
                if (ev.target.closest('[data-block-menu]')) return;
                var blockRef = blockEl._pondasiBlockRef;
                if (!blockRef) return;
                dragBlockState = {
                    startX: ev.clientX, startY: ev.clientY,
                    blockId: blockRef.id, wrapper: wrapper, started: false
                };
            });
            document.addEventListener('mousemove', function (ev) {
                if (!dragBlockState) return;
                var dx = ev.clientX - dragBlockState.startX;
                var dy = ev.clientY - dragBlockState.startY;
                if (!dragBlockState.started) {
                    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
                    dragBlockState.started = true;
                    dragBlockState.wrapper.style.opacity = '0.5';
                    document.body.style.cursor = 'move';
                }
                var targetEl = document.elementFromPoint(ev.clientX, ev.clientY);
                if (!targetEl) return;
                var targetWrapper = targetEl.closest('[data-block-wrapper]');
                var allInd = regionEl.querySelectorAll('.pondasi-block-drop-indicator');
                for (var ai = 0; ai < allInd.length; ai++) allInd[ai].parentNode.removeChild(allInd[ai]);
                if (targetWrapper && targetWrapper !== dragBlockState.wrapper) {
                    var ind = document.createElement('div');
                    ind.className = 'pondasi-block-drop-indicator';
                    ind.style.cssText = 'height:3px;background:#00AAD4;border-radius:2px;margin:2px 0;';
                    var tr = targetWrapper.getBoundingClientRect();
                    var mid = tr.top + tr.height / 2;
                    if (ev.clientY < mid) targetWrapper.parentNode.insertBefore(ind, targetWrapper);
                    else targetWrapper.parentNode.insertBefore(ind, targetWrapper.nextSibling);
                }
            });
            document.addEventListener('mouseup', function (ev) {
                if (!dragBlockState) return;
                dragBlockState.wrapper.style.opacity = '';
                document.body.style.cursor = '';
                var allInd = regionEl.querySelectorAll('.pondasi-block-drop-indicator');
                for (var ai = 0; ai < allInd.length; ai++) allInd[ai].parentNode.removeChild(allInd[ai]);
                if (dragBlockState.started) {
                    var targetEl = document.elementFromPoint(ev.clientX, ev.clientY);
                    if (targetEl) {
                        var targetWrapper = targetEl.closest('[data-block-wrapper]');
                        if (targetWrapper && targetWrapper !== dragBlockState.wrapper) {
                            var node = P.getById(P.STATE.editMode.regionId);
                            if (node && node.blocks) {
                                var srcIdx = -1, dstIdx = -1;
                                var targetBlockEl = targetWrapper.querySelector('[data-block-id]');
                                for (var bi = 0; bi < node.blocks.length; bi++) {
                                    if (node.blocks[bi].id === dragBlockState.blockId) srcIdx = bi;
                                    if (targetBlockEl && targetBlockEl._pondasiBlockRef &&
                                        node.blocks[bi].id === targetBlockEl._pondasiBlockRef.id) dstIdx = bi;
                                }
                                if (srcIdx >= 0 && dstIdx >= 0 && srcIdx !== dstIdx) {
                                    P.pushUndo();
                                    var moved = node.blocks.splice(srcIdx, 1)[0];
                                    var tr2 = targetWrapper.getBoundingClientRect();
                                    var mid2 = tr2.top + tr2.height / 2;
                                    if (ev.clientY >= mid2 && srcIdx < dstIdx) dstIdx--;
                                    else if (ev.clientY < mid2 && srcIdx > dstIdx) dstIdx++;
                                    node.blocks.splice(dstIdx, 0, moved);
                                    P.save();
                                    P.renderBlocks();
                                    P.flash('Block dipindah');
                                }
                            }
                        }
                    }
                }
                dragBlockState = null;
            });
        }
    }

    // Menu block (⋮) — reorder, duplikat, hapus
    P.tampilkanMenuBlock = function(el, blockIdx) {
        // Toggle menu popup sederhana
        var existing = document.getElementById('block-menu-popup');
        if (existing) existing.remove();

        var node = P.getById(P.STATE.editMode.regionId);
        if (!node || !node.blocks) return;
        var totalBlocks = node.blocks.length;
        var blockRef = node.blocks[blockIdx];

        var popup = document.createElement('div');
        popup.id = 'block-menu-popup';
        popup.style.cssText = 'position:fixed;z-index:10600;background:#1E2832;border:1px solid #3C4650;border-radius:4px;box-shadow:0 6px 20px rgba(0,0,0,0.5);padding:4px;min-width:8rem;';

        var items = [
            { label: 'Properti', aksi: function () { P.pilihBlock(blockRef.id); } },
            { label: '', separator: true },
            { label: 'Naik', aksi: function () { P.pindahBlock(blockIdx, -1); }, nonaktif: blockIdx === 0 },
            { label: 'Turun', aksi: function () { P.pindahBlock(blockIdx, 1); }, nonaktif: blockIdx === totalBlocks - 1 },
            { label: '', separator: true },
            { label: 'Salin (Copy)', aksi: function () { P.salinBlock(blockIdx); } },
            { label: 'Potong (Cut)', aksi: function () { P.potongBlock(blockIdx); } },
            { label: 'Tempel (Paste)', aksi: function () { P.tempelBlock(blockIdx); }, nonaktif: !P.clipboardBlock },
            { label: '', separator: true },
            { label: 'Duplikat', aksi: function () { P.duplikatBlock(blockIdx); } },
            { label: 'Hapus', aksi: function () { P.hapusBlock(blockIdx); } }
        ];

        items.forEach(function (item) {
            if (item.separator) {
                var sep = document.createElement('div');
                sep.style.cssText = 'height:1px;background:#3C4650;margin:2px 0;';
                popup.appendChild(sep);
                return;
            }
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = item.label;
            btn.style.cssText = 'display:block;width:100%;padding:6px 12px;background:transparent;border:0;color:#A0AAB4;font-size:12px;text-align:left;cursor:pointer;border-radius:3px;';
            btn.onmouseenter = function () { btn.style.backgroundColor = '#00AAD4'; btn.style.color = '#FFFFFF'; };
            btn.onmouseleave = function () { btn.style.backgroundColor = ''; btn.style.color = '#A0AAB4'; };
            if (item.nonaktif) {
                btn.style.opacity = '0.4';
                btn.style.cursor = 'not-allowed';
                btn.onmouseenter = function () { btn.style.backgroundColor = ''; btn.style.color = '#A0AAB4'; };
            } else {
                btn.onclick = function () { item.aksi(); popup.remove(); };
            }
            popup.appendChild(btn);
        });

        document.body.appendChild(popup);
        // Posisi
        var rect = el.getBoundingClientRect();
        popup.style.top = (rect.bottom + 4) + 'px';
        popup.style.left = (rect.right - 128) + 'px';

        // Tutup saat klik di luar
        setTimeout(function () {
            document.addEventListener('click', function tutupMenu(ev) {
                if (!popup.contains(ev.target)) {
                    popup.remove();
                    document.removeEventListener('click', tutupMenu);
                }
            });
        }, 100);
    }

    // Pindah block (reorder)
    P.pindahBlock = function(idx, arah) {
        var node = P.getById(P.STATE.editMode.regionId);
        if (!node || !node.blocks) return;
        var newIdx = idx + arah;
        if (newIdx < 0 || newIdx >= node.blocks.length) return;
        P.pushUndo();
        var tmp = node.blocks[idx];
        node.blocks[idx] = node.blocks[newIdx];
        node.blocks[newIdx] = tmp;
        P.save();
        P.renderBlocks();
    }

    // Duplikat block
    P.duplikatBlock = function(idx) {
        var node = P.getById(P.STATE.editMode.regionId);
        if (!node || !node.blocks) return;
        P.pushUndo();
        var copy = P.duplikasiObjek(node.blocks[idx]);
        copy.id = P.genBlockId();
        node.blocks.splice(idx + 1, 0, copy);
        P.save();
        P.renderBlocks();
    }

    // Hapus block
    P.hapusBlock = function(idx) {
        var node = P.getById(P.STATE.editMode.regionId);
        if (!node || !node.blocks) return;
        P.pushUndo();
        node.blocks.splice(idx, 1);
        P.save();
        P.renderBlocks();
    }

    /* ======================================================================
       BULK OPERATIONS UNTUK MULTI-SELECT BLOCK
       - hapusBanyakBlock(ids)       : hapus beberapa block sekaligus
       - pindahBanyakBlock(ids, arah): reorder beberapa block sekaligus
       - perluasSeleksiBlock(arah)   : shift+arrow untuk extend seleksi
       - pilihSemuaBlock()           : Ctrl+A — pilih semua block
       ====================================================================== */
    P.hapusBanyakBlock = function(ids) {
        var node = P.getById(P.STATE.editMode.regionId);
        if (!node || !node.blocks) return;
        if (!ids || ids.length === 0) return;
        P.pushUndo();
        // Filter out blocks yang id-nya ada di ids
        var setIds = {};
        ids.forEach(function (id) { setIds[id] = true; });
        node.blocks = node.blocks.filter(function (b) { return !setIds[b.id]; });
        P.save();
        P.renderBlocks();
        P.renderPanel();
    };

    P.pindahBanyakBlock = function(ids, arah) {
        var node = P.getById(P.STATE.editMode.regionId);
        if (!node || !node.blocks) return;
        if (!ids || ids.length === 0) return;
        // Urutkan index berdasarkan arah: kalau naik (-1), proses dari index terkecil;
        // kalau turun (+1), proses dari index terbesar. Supaya tidak overlap.
        var indexes = [];
        ids.forEach(function (id) {
            var idx = P.cariIndexBlock(id);
            if (idx >= 0) indexes.push(idx);
        });
        if (indexes.length === 0) return;
        // Validasi: bisa pindah? (cek batas)
        // Kalau arah=-1: index terkecil harus > 0
        // Kalau arah=+1: index terbesar harus < length-1
        indexes.sort(function (a, b) { return a - b; });
        if (arah === -1) {
            if (indexes[0] <= 0) { P.flash('Sudah di atas'); return; }
        } else {
            if (indexes[indexes.length - 1] >= node.blocks.length - 1) { P.flash('Sudah di bawah'); return; }
        }
        P.pushUndo();
        if (arah === -1) {
            // Naik: proses dari yang terkecil
            for (var i = 0; i < indexes.length; i++) {
                var idx = indexes[i];
                // Swap dengan sebelumnya
                // Catatan: setelah swap sebelumnya, index blok yang dipindah jadi idx-1,
                // dan blok di idx-1 jadi idx. Untuk iterasi berikutnya, kita cari index baru
                // berdasarkan id (bukan index lama).
                var tmp = node.blocks[idx - 1];
                node.blocks[idx - 1] = node.blocks[idx];
                node.blocks[idx] = tmp;
            }
        } else {
            // Turun: proses dari yang terbesar
            for (var j = indexes.length - 1; j >= 0; j--) {
                var idx2 = indexes[j];
                var tmp2 = node.blocks[idx2 + 1];
                node.blocks[idx2 + 1] = node.blocks[idx2];
                node.blocks[idx2] = tmp2;
            }
        }
        P.save();
        P.renderBlocks();
        P.flash(ids.length + ' block dipindah');
    };

    P.perluasSeleksiBlock = function(arah) {
        var node = P.getById(P.STATE.editMode.regionId);
        if (!node || !node.blocks || node.blocks.length === 0) return;
        // Jika belum ada selectedBlockId, mulai dari index 0
        var idxSekarang = -1;
        if (P.STATE.editMode.selectedBlockId) {
            idxSekarang = P.cariIndexBlock(P.STATE.editMode.selectedBlockId);
        }
        if (idxSekarang < 0) {
            // Belum ada seleksi — mulai dari 0, pilih block 0
            P.pilihBlock(node.blocks[0].id);
            return;
        }
        var idxTarget = idxSekarang + arah;
        if (idxTarget < 0 || idxTarget >= node.blocks.length) return;
        // Inisialisasi selectedBlockIds kalau belum ada
        if (!P.STATE.editMode.selectedBlockIds) P.STATE.editMode.selectedBlockIds = [];
        // Tambah block target ke seleksi (kalau belum ada)
        var idTarget = node.blocks[idxTarget].id;
        if (P.STATE.editMode.selectedBlockIds.indexOf(idTarget) < 0) {
            P.STATE.editMode.selectedBlockIds.push(idTarget);
        } else {
            // Sudah di seleksi — toggle: hapus dari seleksi, kecuali kalau itu selectedBlockId
            if (idTarget !== P.STATE.editMode.selectedBlockId) {
                P.STATE.editMode.selectedBlockIds = P.STATE.editMode.selectedBlockIds.filter(function (id) {
                    return id !== idTarget;
                });
            }
        }
        // Update selectedBlockId ke target (cursor bergerak)
        P.STATE.editMode.selectedBlockId = idTarget;
        P.renderBlocks();
        P.flash((P.STATE.editMode.selectedBlockIds.length + 1) + ' block terpilih');
    };

    P.pilihSemuaBlock = function() {
        var node = P.getById(P.STATE.editMode.regionId);
        if (!node || !node.blocks || node.blocks.length === 0) { P.flash('Tidak ada block'); return; }
        P.STATE.editMode.selectedBlockIds = node.blocks.map(function (b) { return b.id; });
        // selectedBlockId tetap yang pertama sebagai anchor
        if (!P.STATE.editMode.selectedBlockId) {
            P.STATE.editMode.selectedBlockId = node.blocks[0].id;
        }
        P.renderBlocks();
        P.flash(node.blocks.length + ' block terpilih (semua)');
    };

    // Salin (copy) block ke clipboard
    P.salinBlock = function(idx) {
        var node = P.getById(P.STATE.editMode.regionId);
        if (!node || !node.blocks) return;
        P.clipboardBlock = P.duplikasiObjek(node.blocks[idx]);
        P.flash('Block disalin');
    }

    // Potong (cut) block ke clipboard
    P.potongBlock = function(idx) {
        var node = P.getById(P.STATE.editMode.regionId);
        if (!node || !node.blocks) return;
        P.pushUndo();
        P.clipboardBlock = P.duplikasiObjek(node.blocks[idx]);
        node.blocks.splice(idx, 1);
        P.save();
        P.renderBlocks();
        P.flash('Block dipotong');
    }

    // Tempel (paste) block dari clipboard setelah idx
    P.tempelBlock = function(idx) {
        var node = P.getById(P.STATE.editMode.regionId);
        if (!node || !node.blocks) return;
        if (!P.clipboardBlock) { P.flash('Clipboard kosong'); return; }
        P.pushUndo();
        var copy = P.duplikasiObjek(P.clipboardBlock);
        copy.id = P.genBlockId();
        node.blocks.splice(idx + 1, 0, copy);
        P.save();
        P.renderBlocks();
        P.flash('Block ditempel');
    }

    // Tampilkan dropdown isi (mega dropdown dinamis)
    P.tampilkanDropdownIsi = function() {
        var dd = document.getElementById('dropdown-isi');
        var dk = document.getElementById('dropdown-komponen');
        if (dk) dk.hidden = true;
        if (dd) {
            dd.hidden = false;
            // Render mega dropdown dinamis
            if (P.renderMegaDropdown) {
                P.renderMegaDropdown('isi');
            }
            P.posisikanDropdown(dd, document.getElementById('btn-isi'));
        }
    }

    // Tampilkan dropdown komponen (mega dropdown dinamis)
    P.tampilkanDropdownKomponen = function() {
        var dd = document.getElementById('dropdown-komponen');
        var di = document.getElementById('dropdown-isi');
        if (di) di.hidden = true;
        if (dd) {
            dd.hidden = false;
            // Render mega dropdown dinamis
            if (P.renderMegaDropdown) {
                P.renderMegaDropdown('komponen');
            }
            P.posisikanDropdown(dd, document.getElementById('btn-komponen'));
        }
    }

    // Posisikan dropdown di bawah tombol
    P.posisikanDropdown = function(dd, btn) {
        if (!dd || !btn) return;
        var rect = btn.getBoundingClientRect();
        var ddRect = dd.getBoundingClientRect();
        // Default: di bawah tombol editor bar
        var top = rect.bottom + 4;
        var left = rect.left;
        // Cek apakah dropdown muat di bawah (tidak nutup region aktif)
        // Editor bar biasanya di bawah region. Dropdown di bawah editor bar = di area bawah layar.
        // Kalau tidak muat di bawah, muncul di ATAS editor bar (di area region atas)
        if (top + ddRect.height > window.innerHeight - 8) {
            top = rect.top - ddRect.height - 4;
        }
        // Kalau masih tidak muat (region terlalu kecil), fallback ke tengah layar
        if (top < 8 || top + ddRect.height > window.innerHeight - 8) {
            top = Math.max(8, Math.floor((window.innerHeight - ddRect.height) / 2));
        }
        // Clamp horizontal
        if (left + ddRect.width > window.innerWidth - 8) {
            left = window.innerWidth - ddRect.width - 8;
        }
        if (left < 8) left = 8;
        dd.style.top = top + 'px';
        dd.style.left = left + 'px';
    }

    // Toggle panel properti
    // Toggle panel KOMPONEN (bukan region — region pakai shortcut w)
    // Panel komponen auto-show saat block dipilih, tapi (e) bisa manual override hide/show.
    P.togglePanelProperti = function() {
        var panel = document.getElementById('panel-properti');
        if (!panel) return;
        panel.hidden = !panel.hidden;
        if (!panel.hidden) {
            // Posisi default kalau belum pernah di-drag
            if (!panel.style.top && !panel.style.bottom && !panel.style.right && !panel.style.left) {
                panel.style.bottom = '48px';
                panel.style.right = '8px';
            }
            // Kalau tidak ada block terpilih, render panel kosong / info
            P.renderPanel();
        }
    }

    // Toggle panel REGION (shortcut w)
    P.togglePanelRegion = function() {
        var panel = document.getElementById('panel-properti-region');
        if (!panel) return;
        panel.hidden = !panel.hidden;
        // Update tombol highlight
        var btn = document.getElementById('btn-panel-region');
        if (btn) {
            if (panel.hidden) btn.classList.remove('pondasi-floating-btn-aktif');
            else btn.classList.add('pondasi-floating-btn-aktif');
        }
        if (!panel.hidden) {
            // Posisi default kalau belum pernah di-drag
            if (!panel.style.top && !panel.style.right && !panel.style.left) {
                panel.style.top = '8px';
                panel.style.right = '8px';
            }
            P.renderPanel();
        }
    }

    // Posisikan panel properti melayang
    P.posisikanPanel = function(panel) {
        if (!panel) return;
        var regionEl = document.querySelector('.pondasi-region[data-id="' + P.STATE.editMode.regionId + '"]');
        if (!regionEl) return;
        var rect = regionEl.getBoundingClientRect();
        var panelW = 256; // 16rem
        var top = rect.top;
        var left = rect.right + 8;
        if (left + panelW > window.innerWidth - 8) {
            left = rect.left - panelW - 8;
        }
        if (left < 8) left = 8;
        if (top < 8) top = 8;
        panel.style.top = top + 'px';
        panel.style.left = left + 'px';
        // Tambah resize handle kalau belum ada
        if (!panel.querySelector('.pondasi-editor-panel-resize')) {
            var resize = document.createElement('div');
            resize.className = 'pondasi-editor-panel-resize';
            panel.appendChild(resize);
            P.pasangDragPanel(panel);
            P.pasangResizePanel(panel, resize);
        }
    }

    // Drag-move panel: drag dari header
    P.pasangDragPanel = function(panel) {
        var head = panel.querySelector('.pondasi-editor-panel-head');
        if (!head) return;
        if (head._dragPasang) return;  // sudah dipasang
        head._dragPasang = true;

        var dragState = null;

        head.addEventListener('mousedown', function(e) {
            // Jangan drag kalau yang diklik adalah tombol (close, dll)
            if (e.target.closest('button')) return;
            dragState = {
                startX: e.clientX,
                startY: e.clientY,
                startLeft: parseInt(panel.style.left || '0', 10),
                startTop: parseInt(panel.style.top || '0', 10)
            };
            e.preventDefault();
        });

        document.addEventListener('mousemove', function(e) {
            if (!dragState) return;
            var dx = e.clientX - dragState.startX;
            var dy = e.clientY - dragState.startY;
            var newLeft = dragState.startLeft + dx;
            var newTop = dragState.startTop + dy;
            // Clamp — jangan keluar layar
            var panelW = panel.offsetWidth;
            var panelH = panel.offsetHeight;
            if (newLeft < 0) newLeft = 0;
            if (newTop < 0) newTop = 0;
            if (newLeft + panelW > window.innerWidth) newLeft = window.innerWidth - panelW;
            if (newTop + panelH > window.innerHeight) newTop = window.innerHeight - panelH;
            panel.style.left = newLeft + 'px';
            panel.style.top = newTop + 'px';
        });

        document.addEventListener('mouseup', function() {
            dragState = null;
        });
    };

    // Resize panel: tarik dari pojok kanan bawah
    P.pasangResizePanel = function(panel, handle) {
        if (!handle) return;
        if (handle._resizePasang) return;
        handle._resizePasang = true;

        var resizeState = null;

        handle.addEventListener('mousedown', function(e) {
            e.preventDefault();
            e.stopPropagation();
            resizeState = {
                startX: e.clientX,
                startY: e.clientY,
                startW: panel.offsetWidth,
                startH: panel.offsetHeight
            };
        });

        document.addEventListener('mousemove', function(e) {
            if (!resizeState) return;
            var dx = e.clientX - resizeState.startX;
            var dy = e.clientY - resizeState.startY;
            var newW = resizeState.startW + dx;
            var newH = resizeState.startH + dy;
            // Clamp — min/max dari CSS
            var minW = 192;  // 12rem
            var maxW = 512;  // 32rem
            var minH = 96;   // 6rem
            var maxH = window.innerHeight * 0.8;
            if (newW < minW) newW = minW;
            if (newW > maxW) newW = maxW;
            if (newH < minH) newH = minH;
            if (newH > maxH) newH = maxH;
            panel.style.width = newW + 'px';
            panel.style.height = newH + 'px';
        });

        document.addEventListener('mouseup', function() {
            resizeState = null;
        });
    };

    // Update field properti dari region saat ini
    P.updatePropertiDariRegion = function() {
        var regionEl = document.querySelector('.pondasi-region[data-id="' + P.STATE.editMode.regionId + '"]');
        if (!regionEl) return;
        var node = P.getById(P.STATE.editMode.regionId);
        if (!node) return;

        // Kelas kustom
        var inpClass = document.getElementById('editor-custom-class');
        if (inpClass) {
            var css = P.STATE.customCSS[P.STATE.editMode.regionId];
            inpClass.value = (css && css.className) ? css.className : '';
        }

        // Margin/padding
        var fields = ['margin-top','margin-right','margin-bottom','margin-left',
                      'padding-top','padding-right','padding-bottom','padding-left'];
        fields.forEach(function (f) {
            var el = document.getElementById('region-' + f);
            if (el) {
                var val = regionEl.style[f.replace(/-/, P.capitalize)];
                el.value = val ? val.replace(/rem$/, '').replace(/px$/, '') : '';
            }
        });
    }

    // Posisikan bar mini editor — di luar region (di atas atau di bawah)
    P.posisikanBarEditor = function() {
        var bar = document.getElementById('editor-bar');
        if (!bar || bar.hidden) return;
        var regionEl = document.querySelector('.pondasi-region[data-id="' + P.STATE.editMode.regionId + '"]');
        if (!regionEl) return;
        var rect = regionEl.getBoundingClientRect();
        var barH = bar.offsetHeight || 40;
        var barW = bar.offsetWidth || 320;
        var margin = 4;

        // Hitung ruang di atas dan bawah region
        var ruangAtas = rect.top;
        var ruangBawah = window.innerHeight - rect.bottom;

        // Default: di bawah region (pojok kiri bawah region)
        var diBawah = true;
        // Kalau tidak muat di bawah DAN muat di atas → pindah ke atas
        if (ruangBawah < barH + margin && ruangAtas > barH + margin) {
            diBawah = false;
        }

        var top, left;
        if (diBawah) {
            top = rect.bottom + margin;
            left = rect.left;
        } else {
            top = rect.top - barH - margin;
            left = rect.left;
        }

        // Clamp — coba pindah sisi kalau tidak muat
        if (diBawah && top + barH > window.innerHeight - margin) {
            var atas = rect.top - barH - margin;
            if (atas >= margin) { top = atas; diBawah = false; }
            else if (atas >= 0) { top = margin; diBawah = false; }
            else { top = window.innerHeight - barH - margin; if (top < margin) top = margin; }
        }
        if (!diBawah && top < margin) {
            var bawah = rect.bottom + margin;
            if (bawah + barH < window.innerHeight - margin) { top = bawah; }
            else { top = margin; }
        }

        // Clamp horizontal
        if (left + barW > window.innerWidth - margin) left = window.innerWidth - barW - margin;
        if (left < margin) left = margin;

        bar.style.top = top + 'px';
        bar.style.left = left + 'px';
    }

    // Masuk mode edit baru (block-based)
    P.masukModeEdit = function() {
        if (P.STATE.editMode.active) return;
        var node = P.getById(P.STATE.activeId);
        if (!node) { P.flash('Pilih region dulu'); return; }
        if (node.type === 'grand-parent') { P.flash('Grand-parent tidak bisa di-edit. Pilih child.'); return; }
        if (node.children && node.children.length > 0) { P.flash('Region punya child. Pilih child.'); return; }

        P.pushUndo();
        P.STATE.editMode.active = true;
        P.STATE.editMode.regionId = P.STATE.activeId;
        // Set flag timestamp supaya document mousedown listener tidak langsung keluarModeEdit
        P._modeEditBaruMasuk = Date.now();

        // Init blocks kalau belum ada
        if (!node.blocks) node.blocks = [];

        P.render();
        var regionEl = document.querySelector('.pondasi-region[data-id="' + P.STATE.activeId + '"]');
        if (regionEl) {
            regionEl.classList.add('pondasi-editing');
            regionEl.classList.add('pondasi-has-content');
        }
        document.body.classList.add('pondasi-editing-active');

        // Fokus ke region supaya keyboard events sampai
        if (regionEl) {
            regionEl.setAttribute('tabindex', '0');
            try { regionEl.focus(); } catch (e) {}
        }

        // Tampilkan bar mini
        var bar = document.getElementById('editor-bar');
        if (bar) {
            bar.hidden = false;
            if (window.requestAnimationFrame) {
                window.requestAnimationFrame(P.posisikanBarEditor);
            } else {
                setTimeout(P.posisikanBarEditor, 16);
            }
        }

        // Render blocks
        P.renderBlocks();
        // Re-posisi bar setelah blocks dirender (region mungkin berubah tinggi)
        if (window.requestAnimationFrame) {
            window.requestAnimationFrame(P.posisikanBarEditor);
        }

        // Mulai auto-update untuk block dinamis (jam, tanggal, hitung-mundur)
        P.startDinamisTimers();

        // Panel region sudah default visible — cukup re-render supaya seksi editable muncul
        P.renderPanel();

        P.flash('Mode edit aktif. Klik + Isi untuk insert blok.');
    }

    /* === MASUK EDIT TEKS BLOCK (dipanggil saat Enter di block terseleksi) ===
       Sama seperti double-click block: aktifkan contentEditable + fokus + seleksi semua teks.
       */

    // Auto-update timer untuk block dinamis (jam, tanggal, hitung-mundur) di canvas
    P._dinamisTimerJam = null;
    P._dinamisTimerTanggal = null;
    P._dinamisTimerMundur = null;

    P.startDinamisTimers = function() {
        P.stopDinamisTimers(); // clear existing
        var node = P.getById(P.STATE.editMode.regionId);
        if (!node || !node.blocks) return;

        var hasJam = false, hasTanggal = false, hasMundur = false;
        node.blocks.forEach(function(block) {
            if (block.jenis === 'jam') hasJam = true;
            if (block.jenis === 'tanggal') hasTanggal = true;
            if (block.jenis === 'hitung-mundur') hasMundur = true;
        });

        if (hasJam) {
            P._dinamisTimerJam = setInterval(function() {
                P._updateDinamisBlocks('jam');
            }, 1000);
        }
        if (hasTanggal) {
            P._dinamisTimerTanggal = setInterval(function() {
                P._updateDinamisBlocks('tanggal');
            }, 60000);
        }
        if (hasMundur) {
            P._dinamisTimerMundur = setInterval(function() {
                P._updateDinamisBlocks('hitung-mundur');
            }, 1000);
        }
    };

    P.stopDinamisTimers = function() {
        if (P._dinamisTimerJam) { clearInterval(P._dinamisTimerJam); P._dinamisTimerJam = null; }
        if (P._dinamisTimerTanggal) { clearInterval(P._dinamisTimerTanggal); P._dinamisTimerTanggal = null; }
        if (P._dinamisTimerMundur) { clearInterval(P._dinamisTimerMundur); P._dinamisTimerMundur = null; }
    };

    // Update text content block dinamis tanpa full re-render (lebih efisien)
    P._updateDinamisBlocks = function(jenis) {
        var node = P.getById(P.STATE.editMode.regionId);
        if (!node || !node.blocks) return;
        node.blocks.forEach(function(block) {
            if (block.jenis !== jenis) return;
            var el = document.querySelector('[data-block-id="' + block.id + '"]');
            if (!el) return;
            // Pakai renderIsiBlock untuk dapat nilai terbaru
            var html = P.renderIsiBlock(block);
            if (html) el.innerHTML = html;
        });
    };

    P.masukEditTextBlock = function() {
        if (!P.STATE.editMode.selectedBlockId) { P.flash('Pilih block dulu'); return; }
        var blockEl = document.querySelector('[data-block-id="' + P.STATE.editMode.selectedBlockId + '"]');
        if (!blockEl) return;
        // Cek tag — input/textarea/select/img/hr/progress tidak bisa edit teks inline
        var tag = blockEl.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select' ||
            tag === 'img' || tag === 'hr' || tag === 'progress') {
            // Untuk void/input element → masuk panel properti saja
            if (P.masukPropertiBlock) P.masukPropertiBlock();
            return;
        }
        // Aktifkan contentEditable
        blockEl.contentEditable = true;
        blockEl.style.cursor = 'text';
        blockEl.style.outline = '2px solid #00AAD4';
        blockEl.style.outlineOffset = '2px';
        blockEl.focus();
        // Seleksi semua teks
        var sel = window.getSelection();
        var range = document.createRange();
        range.selectNodeContents(blockEl);
        sel.removeAllRanges();
        sel.addRange(range);
        // Init floating toolbar
        if (P.FloatingToolbar) {
            P.FloatingToolbar.init();
            setTimeout(function () { P.FloatingToolbar.updatePosisi(); }, 50);
        }
        P.flash('Mode edit teks. Esc untuk keluar.');
    };

    // Keluar mode edit — auto-apply: simpan blocks, hapus inline style, render ulang
    P.keluarModeEdit = function() {
        if (!P.STATE.editMode.active) return;
        // Tutup floating toolbar
        if (P.FloatingToolbar) P.FloatingToolbar.tutup();
        var regionEl = document.querySelector('.pondasi-region[data-id="' + P.STATE.editMode.regionId + '"]');
        if (regionEl) {
            regionEl.classList.remove('pondasi-editing');
            regionEl.classList.remove('pondasi-has-content');
            regionEl.contentEditable = 'false';
        }
        document.body.classList.remove('pondasi-editing-active');
        P.STATE.editMode.active = false;
        P.STATE.editMode.regionId = null;
        P.STATE.editMode.selectedBlockId = null;
        P.STATE.editMode.paletteOpen = null;
        P.STATE.editMode.savedSelection = null;

        // Sembunyikan bar mini, dropdown
        var bar = document.getElementById('editor-bar');
        if (bar) bar.hidden = true;
        var di = document.getElementById('dropdown-isi');
        if (di) di.hidden = true;
        var dk = document.getElementById('dropdown-komponen');
        if (dk) dk.hidden = true;
        // Panel komponen auto-hide via renderPanel (selectedBlockId = null)
        // Tombol editor bar highlight juga di-remove
        var btnProp = document.getElementById('btn-properti');
        if (btnProp) btnProp.classList.remove('pondasi-editor-bar-aktif');
        // Panel region tetap tampil — default visible inspector

        // Stop auto-update timers untuk block dinamis
        P.stopDinamisTimers();

        P.save();
        P.render();
        P.renderPanel();
        P.flash('Mode edit selesai.');
    }

    // Handler untuk bar mini, dropdown, panel
    P.handleEditorBarClick = function(e) {
        var btn = e.target.closest('[data-action]');
        if (!btn) return;
        var action = btn.dataset.action;
        switch (action) {
            case 'dropdown-isi':
                P.tampilkanDropdownIsi();
                break;
            case 'dropdown-komponen':
                P.tampilkanDropdownKomponen();
                break;
            case 'toggle-properti':
                // (e) sekarang toggle panel KOMPONEN (bukan region)
                P.togglePanelProperti();
                var btnP = document.getElementById('btn-properti');
                if (btnP) {
                    if (!document.getElementById('panel-properti').hidden) btnP.classList.add('pondasi-editor-bar-aktif');
                    else btnP.classList.remove('pondasi-editor-bar-aktif');
                }
                break;
            case 'exit-edit':
                P.keluarModeEdit();
                break;
            case 'close-properti':
                // Tutup panel komponen
                var pp = document.getElementById('panel-properti');
                if (pp) pp.hidden = true;
                var btnPC = document.getElementById('btn-properti');
                if (btnPC) btnPC.classList.remove('pondasi-editor-bar-aktif');
                break;
            case 'close-properti-region':
                // Tutup panel region
                var ppR = document.getElementById('panel-properti-region');
                if (ppR) ppR.hidden = true;
                var btnPR = document.getElementById('btn-properti');
                if (btnPR) btnPR.classList.remove('pondasi-editor-bar-aktif');
                break;
        }
    }

    // Handler untuk dropdown item (insert isi/komponen)
    P.handleDropdownClick = function(e) {
        var item = e.target.closest('[data-insert], [data-insert-komponen]');
        if (!item) return;
        if (item.dataset.insert) {
            P.insertBlock(item.dataset.insert, false);
        } else if (item.dataset.insertKomponen) {
            P.insertBlock(item.dataset.insertKomponen, true);
        }
        // Tutup dropdown
        var di = document.getElementById('dropdown-isi');
        if (di) di.hidden = true;
        var dk = document.getElementById('dropdown-komponen');
        if (dk) dk.hidden = true;
    }


