/* PONDASI-PANEL-FIELD.JS
   Render field HTML untuk panel properti (block & region).
   HARUS di-load setelah pondasi-fields.js, sebelum panel-block/region.
   Refactored dari pondasi-block-panel.js.
*/
var P = P || {};

P.buatStateTabs = function(block) {
    if (!block.stateStyle) block.stateStyle = {};

    var states = [
        { id: '', label: 'Normal' },
        { id: ':hover', label: 'Hover' },
        { id: ':focus', label: 'Focus' },
        { id: ':active', label: 'Active' }
    ];

    var wrapper = document.createElement('div');
    wrapper.className = 'pondasi-state-tabs-wrapper';

    // Tab bar
    var tabBar = document.createElement('div');
    tabBar.className = 'pondasi-state-tab-bar';

    for (var i = 0; i < states.length; i++) {
        var tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'pondasi-state-tab' + (i === 0 ? ' pondasi-state-tab-aktif' : '');
        tab.setAttribute('data-state', states[i].id);
        tab.textContent = states[i].label;
        tab.onclick = function(e) {
            var target = e.target;
            var stateId = target.getAttribute('data-state');
            // Hapus aktif dari semua tab
            var tabs = tabBar.querySelectorAll('.pondasi-state-tab');
            for (var j = 0; j < tabs.length; j++) {
                tabs[j].classList.remove('pondasi-state-tab-aktif');
            }
            target.classList.add('pondasi-state-tab-aktif');
            // Sembunyikan semua panel
            var panels = wrapper.querySelectorAll('.pondasi-state-panel');
            for (var k = 0; k < panels.length; k++) {
                panels[k].classList.remove('pondasi-state-panel-aktif');
            }
            // Tampilkan panel yang dipilih
            var panel = wrapper.querySelector('.pondasi-state-panel[data-state="' + stateId + '"]');
            if (panel) panel.classList.add('pondasi-state-panel-aktif');
        };
        tabBar.appendChild(tab);
    }
    wrapper.appendChild(tabBar);

    // Panels (satu per state)
    for (var p = 0; p < states.length; p++) {
        var panel = document.createElement('div');
        panel.className = 'pondasi-state-panel' + (p === 0 ? ' pondasi-state-panel-aktif' : '');
        panel.setAttribute('data-state', states[p].id);

        if (states[p].id === '') {
            // Normal — kosong, info saja
            panel.innerHTML = '<div class="pondasi-state-info">Properti normal ada di bagian Tampilan di bawah. Gunakan tab Hover/Focus/Active untuk atur properti yang berbeda saat interaksi.</div>';
        } else {
            // Hover/Focus/Active — field untuk state-specific style
            var stateData = block.stateStyle[states[p].id] || {};
            var fields = [
                { id: 'state.bg', label: 'Warna latar', jenis: 'warna', val: stateData['background-color'] || '' },
                { id: 'state.color', label: 'Warna teks', jenis: 'warna', val: stateData['color'] || '' },
                { id: 'state.borderColor', label: 'Warna garis', jenis: 'warna', val: stateData['border-color'] || '' },
                { id: 'state.opacity', label: 'Kecerahan', jenis: 'teks', val: stateData['opacity'] || '', placeholder: '1' },
                { id: 'state.transform', label: 'Transformasi', jenis: 'teks', val: stateData['transform'] || '', placeholder: 'scale(1.05)' },
                { id: 'state.boxShadow', label: 'Bayangan', jenis: 'teks', val: stateData['box-shadow'] || '', placeholder: '0 4px 8px rgba(0,0,0,0.2)' }
            ];
            for (var f = 0; f < fields.length; f++) {
                var fld = fields[f];
                var valAttr = fld.val ? ' value="' + P.escAttr(fld.val) + '"' : '';
                var styleAttr = '';
                if (fld.jenis === 'warna' && fld.val) {
                    valAttr = '';
                    styleAttr = ' style="background:' + P.escAttr(fld.val) + '"';
                    panel.insertAdjacentHTML('beforeend',
                        '<div class="pondasi-properti-baris pondasi-properti-baris-inline">' +
                        '<label class="pondasi-properti-label">' + fld.label + '</label>' +
                        '<button type="button" class="pondasi-properti-warna-btn" ' +
                        'data-state-prop="' + fld.id + '" data-state-id="' + states[p].id + '" ' +
                        'data-state-css="' + P.getStateCssProp(fld.id) + '"' +
                        'data-action="swatch-state"' + styleAttr + '></button></div>');
                    continue;
                }
                panel.insertAdjacentHTML('beforeend',
                    '<div class="pondasi-properti-baris">' +
                    '<label class="pondasi-properti-label">' + fld.label + '</label>' +
                    '<input type="text" class="pondasi-properti-input" ' +
                    'data-state-prop="' + fld.id + '" data-state-id="' + states[p].id + '" ' +
                    'data-state-css="' + P.getStateCssProp(fld.id) + '"' +
                    ' value="' + P.escAttr(fld.val || '') + '" placeholder="' + P.escAttr(fld.placeholder || '-') + '">' +
                    '</div>');
            }
            // Info text
            panel.insertAdjacentHTML('beforeend',
                '<div class="pondasi-state-info">Properti di sini hanya berlaku saat ' +
                states[p].label.toLowerCase() + '. Perubahan otomatis membuat kelas kustom.</div>');
        }
        wrapper.appendChild(panel);
    }

    return wrapper;
};

/* === HELPER: MAP STATE PROP ID KE CSS PROP === */
P.getStateCssProp = function(propId) {
    var map = {
        'state.bg': 'background-color',
        'state.color': 'color',
        'state.borderColor': 'border-color',
        'state.opacity': 'opacity',
        'state.transform': 'transform',
        'state.boxShadow': 'box-shadow'
    };
    return map[propId] || propId;
};

P.buatDetails = function(judul, buka, fieldsHtmlArr) {
    var det = P.el('details', { class: 'pondasi-properti-grup' });
    if (buka) det.setAttribute('open', 'open');
    det.appendChild(P.el('summary', { text: judul }));
    var isi = P.el('div', { class: 'pondasi-properti-isi' });
    fieldsHtmlArr.forEach(function(html) {
        isi.insertAdjacentHTML('beforeend', html);
    });
    det.appendChild(isi);
    return det;
};

/* ======================================================================
   RENDER FIELD HTML — kembalikan string HTML untuk satu field
   ====================================================================== */


P.renderPanelFieldHtml = function(f, block, mode) {
    var val = '';
    var disabledAttr = '';
    if (mode === 'block') {
        val = P.ambilNilaiBlock(block, f.id);
    } else if (mode === 'region') {
        // Region mode — ambil dari customCSS[regionId].rules, lalu scanner data
        val = P.ambilNilaiRegion(block, f.id);
        // Disable kalau properti struktural DAN value-nya dari kelas region (bukan user override)
        if (P.isRegionFieldDisabled && P.isRegionFieldDisabled(block, f.id)) {
            disabledAttr = ' disabled title="Properti dari kelas region, tidak bisa diubah lewat panel — gunakan split engine (v/V/h)"';
        }
    }

    // Deteksi layout: full (label atas, input bawah) untuk field konten
    // Field konten: isi, judul, kepala, label, caption, sumber, deskripsi, pesan, tooltipTeks, alt, placeholder
    var layoutFull = false;
    var fieldIdFull = ['isi', 'judul', 'kepala', 'label', 'caption', 'sumber', 'deskripsi',
        'pesan', 'tooltipTeks', 'alt', 'placeholder', 'nama', 'url', 'src', 'kode', 'html', 'text'];
    if (fieldIdFull.indexOf(f.id) >= 0) layoutFull = true;
    // Atau kalau f.jenis === 'textarea' → selalu full
    if (f.jenis === 'textarea') layoutFull = true;
    // Atau kalau ada properti f.layout === 'full'
    if (f.layout === 'full') layoutFull = true;

    var clsLayout = layoutFull ? ' pondasi-properti-baris-full' : '';
    var clsLabel = layoutFull ? ' pondasi-properti-label-full' : '';

    switch (f.jenis) {
        case 'teks':
            return '<div class="pondasi-properti-baris' + clsLayout + '">' +
                '<label class="pondasi-properti-label' + clsLabel + '">' + f.label + '</label>' +
                '<input type="text" class="pondasi-properti-input' + (layoutFull ? ' pondasi-properti-input-full' : '') + '" data-field="' + f.id +
                '" data-jenis="teks" data-mode="' + mode + '" value="' + P.escAttr(val) +
                '" placeholder="' + P.escAttr(f.placeholder || '') + '"' + disabledAttr + '>' +
                '</div>';

        case 'textarea':
            // Textarea: layout full (label di atas, textarea full width di bawah)
            // Tampilkan textContent (buang tag HTML) supaya user-friendly
            var valText = val ? P.stripHtml(val) : '';
            return '<div class="pondasi-properti-baris' + clsLayout + '">' +
                '<label class="pondasi-properti-label' + clsLabel + '">' + f.label + '</label>' +
                '<textarea class="pondasi-properti-textarea pondasi-properti-textarea-full" data-field="' + f.id +
                '" data-jenis="textarea" data-mode="' + mode + '" placeholder="' +
                P.escAttr(f.placeholder || '') + '"' + disabledAttr + '>' + P.escHtml(valText) + '</textarea>' +
                '</div>';

        case 'angka':
            return '<div class="pondasi-properti-baris pondasi-properti-baris-inline">' +
                '<label class="pondasi-properti-label">' + f.label + '</label>' +
                '<div class="pondasi-properti-num-wrapper">' +
                '<input type="number" class="pondasi-properti-num pondasi-properti-num-lebar" data-field="' +
                f.id + '" data-jenis="angka" data-mode="' + mode + '" value="' +
                P.escAttr(val) + '" step="' + (f.step || 1) + '"' +
                (f.min !== undefined ? ' min="' + f.min + '"' : '') +
                (f.max !== undefined ? ' max="' + f.max + '"' : '') + disabledAttr + '>' +
                '<span class="pondasi-properti-spinner">' +
                '<button type="button" class="pondasi-properti-spinner-up" data-field="' + f.id + '" data-step="' + (f.step || 1) + '" data-mode="' + mode + '"' + disabledAttr + '>&#9650;</button>' +
                '<button type="button" class="pondasi-properti-spinner-down" data-field="' + f.id + '" data-step="' + (f.step || 1) + '" data-mode="' + mode + '"' + disabledAttr + '>&#9660;</button>' +
                '</span>' +
                '</div>' +
                '</div>';

        case 'box':
        case 'box-px':
            var sisi = ['atas', 'kanan', 'bawah', 'kiri'];
            var unit = f.jenis === 'box-px' ? 'px' : 'rem';
            var inputs = sisi.map(function(s) {
                var sval = '';
                var sisiDisabled = '';
                if (mode === 'block') sval = P.ambilNilaiBox(block, f.id, s);
                else if (mode === 'region') {
                    sval = P.ambilNilaiBoxRegion(block, f.id, s);
                    // Per-sisi disable untuk region (mis. margin kiri/kanan disable)
                    if (P.isRegionBoxSisiDisabled && P.isRegionBoxSisiDisabled(block, f.id, s)) {
                        sisiDisabled = ' disabled title="Properti struktural dari kelas region — tidak bisa diubah"';
                    }
                }
                return '<input type="number" class="pondasi-properti-num" data-field="' +
                    f.id + '" data-jenis="box" data-sisi="' + s + '" data-unit="' + unit +
                    '" data-mode="' + mode + '" value="' + P.escAttr(sval) +
                    '" step="' + (f.step || 1) + '" placeholder="0"' + sisiDisabled + '>';
            }).join('');
            return '<fieldset class="pondasi-properti-fieldset">' +
                '<legend>' + f.label + '</legend>' +
                inputs +
                '</fieldset>';

        case 'pilih':
            var opts = (f.opsi || []).map(function(op) {
                var sel = op === val ? ' selected' : '';
                var label = op === '' ? '—' : op;
                return '<option value="' + P.escAttr(op) + '"' + sel + '>' +
                    P.escHtml(label) + '</option>';
            }).join('');
            return '<div class="pondasi-properti-baris pondasi-properti-baris-inline">' +
                '<label class="pondasi-properti-label">' + f.label + '</label>' +
                '<select class="pondasi-properti-select pondasi-properti-select-lebar" data-field="' +
                f.id + '" data-jenis="pilih" data-mode="' + mode + '"' + disabledAttr + '>' +
                opts +
                '</select>' +
                '</div>';

        case 'warna':
            var warnaStyle = val ? ' style="background:' + P.escAttr(val) + '"' : '';
            return '<div class="pondasi-properti-baris pondasi-properti-baris-inline">' +
                '<label class="pondasi-properti-label">' + f.label + '</label>' +
                '<button type="button" class="pondasi-properti-warna-btn" data-field="' +
                f.id + '" data-jenis="warna" data-action="swatch-block" data-mode="' + mode +
                '" title="Pilih warna"' + warnaStyle + disabledAttr + '></button>' +
                '</div>';

        case 'cek':
            var cekAttr = (val === true || val === 'true' || val === 'checked') ? ' checked' : '';
            return '<label class="pondasi-properti-baris pondasi-properti-cek">' +
                '<input type="checkbox" data-field="' + f.id +
                '" data-jenis="cek" data-mode="' + mode + '"' + cekAttr + '>' +
                '<span class="pondasi-properti-label-inline">' + f.label + '</span>' +
                '</label>';

        case 'daftar':
            var textVal = mode === 'block' ? P.serializeItems(block.items, f.format) : '';
            return '<div class="pondasi-properti-baris">' +
                '<label class="pondasi-properti-label">' + f.label + '</label>' +
                '<textarea class="pondasi-properti-textarea pondasi-properti-textarea-pendek" data-field="' +
                f.id + '" data-jenis="daftar" data-format="' + f.format + '" data-mode="' + mode +
                '" placeholder="' + P.escAttr(f.placeholder || '') + '">' +
                P.escHtml(textVal) + '</textarea>' +
                '</div>';

        case 'aksi':
            var aksi = (mode === 'block' && block.aksi && block.aksi.klik) ? block.aksi.klik
                : { jenis: 'none' };
            var optsA = [
                { v: 'none', l: 'tidak ada' },
                { v: 'link', l: 'buka tautan' },
                { v: 'alert', l: 'pesan alert' },
                { v: 'kustom', l: 'kustom (JS)' }
            ];
            var aksiOpts = optsA.map(function(o) {
                var sel = o.v === aksi.jenis ? ' selected' : '';
                return '<option value="' + o.v + '"' + sel + '>' + o.l + '</option>';
            }).join('');
            var urlStyle = aksi.jenis === 'link' ? '' : ' style="display:none;"';
            var pesanStyle = aksi.jenis === 'alert' ? '' : ' style="display:none;"';
            var kodeStyle = aksi.jenis === 'kustom' ? '' : ' style="display:none;"';
            return '<div class="pondasi-properti-baris pondasi-properti-aksi">' +
                '<label class="pondasi-properti-label">Aksi klik</label>' +
                '<select class="pondasi-properti-select pondasi-properti-select-lebar" data-field="aksi.klik.jenis" data-jenis="aksi-jenis" data-mode="' + mode + '">' + aksiOpts + '</select>' +
                '<input type="text" class="pondasi-properti-input" data-field="aksi.klik.url" data-jenis="aksi-url" data-mode="' + mode + '" value="' + P.escAttr(aksi.url || '') + '" placeholder="https://..."' + urlStyle + '>' +
                '<input type="text" class="pondasi-properti-input" data-field="aksi.klik.pesan" data-jenis="aksi-pesan" data-mode="' + mode + '" value="' + P.escAttr(aksi.pesan || '') + '" placeholder="Pesan alert..."' + pesanStyle + '>' +
                '<textarea class="pondasi-properti-textarea pondasi-properti-textarea-pendek" data-field="aksi.klik.kode" data-jenis="aksi-kode" data-mode="' + mode + '" placeholder="JavaScript: alert(\'halo\')"' + kodeStyle + '>' + P.escHtml(aksi.kode || '') + '</textarea>' +
                '</div>';

        default:
            return '';
    }
};


