/* PONDASI-CLASS-CONTEXT.JS
   Sistem class context untuk panel properti:
   - Breadcrumb untuk DOM hierarchy (kartu > kartu-kepala > kartu-badan)
   - Compound class merge (tombol + tombol-berisi)
   - State tabs kontekstual (hanya pseudo yang ada di kelas aktif)
   - Hybrid editing (inline override → auto-clone saat export)
   */
var P = P || {};

/* === STATE: Class context aktif === */
P.STATE = P.STATE || {};
P.STATE.editMode = P.STATE.editMode || {};
// P.STATE.editMode.classContext = null; // nama kelas yang sedang aktif di breadcrumb

/* === DAPATKAN HIRARKI KELAS DARI BLOCK ===
   Return: [{ kelas: 'kartu', type: 'main' }, { kelas: 'kartu-kepala', type: 'child' }, ...]
   - Main: dari block.kelas (split spasi → ambil kelas pertama sebagai main)
   - Compound: kelas tambahan di block.kelas (mis. tombol-berisi di "tombol tombol-berisi")
   - Child: dari parse HTML block.isi (cari class="..." di elemen dalam)
   */
P.getBlockClassHierarchy = function (block) {
    var result = [];
    var seen = {};

    if (!block) return result;

    // 1. Main class + compound classes dari block.kelas
    if (block.kelas) {
        var tokens = block.kelas.split(/\s+/);
        for (var i = 0; i < tokens.length; i++) {
            var t = tokens[i].trim();
            if (!t || seen[t]) continue;
            seen[t] = true;
            result.push({
                kelas: t,
                type: i === 0 ? 'main' : 'compound'
            });
        }
    }

    // 2. Child classes dari parse HTML block.isi
    if (block.isi && typeof block.isi === 'string') {
        var classRegex = /class\s*=\s*["']([^"']+)["']/g;
        var m;
        var childSeen = {};
        while ((m = classRegex.exec(block.isi)) !== null) {
            var klsTokens = m[1].split(/\s+/);
            for (var j = 0; j < klsTokens.length; j++) {
                var kt = klsTokens[j].trim();
                if (!kt || seen[kt] || childSeen[kt]) continue;
                childSeen[kt] = true;
                seen[kt] = true;
                result.push({
                    kelas: kt,
                    type: 'child'
                });
            }
        }
    }

    return result;
};

/* === RENDER BREADCRUMB ===
   Tampilkan hirarki kelas sebagai breadcrumb clickable.
   Klik node → set classContext aktif.
   */
P.renderBreadcrumb = function (block) {
    var hierarchy = P.getBlockClassHierarchy(block);
    if (hierarchy.length === 0) return null;

    // Set context default = main class (kelas pertama)
    if (!P.STATE.editMode.classContext) {
        P.STATE.editMode.classContext = hierarchy[0].kelas;
    }

    var wrapper = document.createElement('div');
    wrapper.className = 'pondasi-breadcrumb-wrapper';

    var label = document.createElement('div');
    label.className = 'pondasi-breadcrumb-label';
    label.textContent = 'Struktur:';
    wrapper.appendChild(label);

    var bc = document.createElement('div');
    bc.className = 'pondasi-breadcrumb';

    for (var i = 0; i < hierarchy.length; i++) {
        var h = hierarchy[i];
        var chip = document.createElement('span');
        chip.className = 'pondasi-breadcrumb-chip';
        if (h.kelas === P.STATE.editMode.classContext) {
            chip.classList.add('pondasi-breadcrumb-chip-aktif');
        }
        chip.setAttribute('data-kelas', h.kelas);
        chip.setAttribute('data-type', h.type);
        chip.textContent = h.kelas;

        chip.onclick = function (e) {
            var target = e.currentTarget;
            var kelas = target.getAttribute('data-kelas');
            P.STATE.editMode.classContext = kelas;
            // Re-render panel
            P.renderPanel();
        };

        bc.appendChild(chip);

        // Separator (kecuali terakhir)
        if (i < hierarchy.length - 1) {
            var sep = document.createElement('span');
            sep.className = 'pondasi-breadcrumb-sep';
            sep.innerHTML = '&rsaquo;';
            bc.appendChild(sep);
        }
    }

    wrapper.appendChild(bc);
    return wrapper;
};

/* === DAPATKAN PROPERTI MERGE DARI CLASS CONTEXT AKTIF ===
   Untuk compound class: merge rules dari semua kelas di elemen yang sama.
   Untuk child class: hanya rules dari kelas itu sendiri.
   */
P.getContextProperties = function (block) {
    var contextKelas = P.STATE.editMode.classContext || '';
    if (!contextKelas) return { rules: {}, pseudo: {} };

    var hierarchy = P.getBlockClassHierarchy(block);
    var isChild = false;
    for (var i = 0; i < hierarchy.length; i++) {
        if (hierarchy[i].kelas === contextKelas && hierarchy[i].type === 'child') {
            isChild = true;
            break;
        }
    }

    if (isChild) {
        // Child class — hanya ambil rules dari kelas itu
        var detail = P.Scanner ? P.Scanner.getKelasDetail(contextKelas) : null;
        return detail || { rules: {}, pseudo: {} };
    }

    // Main + compound — merge semua kelas di elemen yang sama (type main + compound)
    var merged = { rules: {}, pseudo: {} };
    for (var j = 0; j < hierarchy.length; j++) {
        var h = hierarchy[j];
        if (h.type === 'child') continue; // skip child
        var d = P.Scanner ? P.Scanner.getKelasDetail(h.kelas) : null;
        if (!d) continue;
        // Merge rules (kelas belakang menimpa)
        for (var r in d.rules) {
            if (d.rules.hasOwnProperty(r)) merged.rules[r] = d.rules[r];
        }
        // Merge pseudo
        for (var p in d.pseudo) {
            if (d.pseudo.hasOwnProperty(p)) {
                if (!merged.pseudo[p]) merged.pseudo[p] = {};
                for (var pr in d.pseudo[p]) {
                    if (d.pseudo[p].hasOwnProperty(pr)) {
                        merged.pseudo[p][pr] = d.pseudo[p][pr];
                    }
                }
            }
        }
    }
    return merged;
};

/* === DAPATKAN STATE TABS PER SEKSI ===
   Cek apakah pseudo class mengubah properti yang termasuk dalam seksi ini.
   Jika ya, return state tabs element. Jika tidak, return null.
   */
P.getSeksiPseudo = function (block, seksiProps, normalFieldsHtml) {
    var props = P.getContextProperties(block);
    var pseudoKeys = Object.keys(props.pseudo || {});
    if (!block.stateStyle) block.stateStyle = {};
    var contextKelas = P.STATE.editMode.classContext || '';

    // Cek pseudo yang relevant ke seksi ini
    var relevantPseudo = {};
    for (var i = 0; i < pseudoKeys.length; i++) {
        var pk = pseudoKeys[i];
        var pseudoRules = props.pseudo[pk] || {};
        var userState = block.stateStyle[pk] || {};
        var allChanged = {};
        for (var pr in pseudoRules) { if (pseudoRules.hasOwnProperty(pr)) allChanged[pr] = pseudoRules[pr]; }
        for (var us in userState) { if (userState.hasOwnProperty(us)) allChanged[us] = userState[us]; }

        var hasMatch = false;
        for (var ap = 0; ap < seksiProps.length; ap++) {
            var propCheck = seksiProps[ap];
            if (allChanged[propCheck] !== undefined) { hasMatch = true; break; }
            for (var ak in allChanged) {
                if (ak.indexOf(propCheck) >= 0 || propCheck.indexOf(ak) >= 0) { hasMatch = true; break; }
            }
            if (hasMatch) break;
        }
        if (hasMatch) relevantPseudo[pk] = allChanged;
    }

    // Tambah user state
    for (var usk in block.stateStyle) {
        if (block.stateStyle.hasOwnProperty(usk) && !relevantPseudo[usk]) {
            var usRules = block.stateStyle[usk];
            var usMatch = false;
            for (var up = 0; up < seksiProps.length; up++) {
                for (var uk in usRules) {
                    if (uk.indexOf(seksiProps[up]) >= 0 || seksiProps[up].indexOf(uk) >= 0) { usMatch = true; break; }
                }
                if (usMatch) break;
            }
            if (usMatch) relevantPseudo[usk] = usRules;
        }
    }

    var relKeys = Object.keys(relevantPseudo);
    // Hanya return state tabs kalau ada pseudo. Kalau tidak ada, return null (field pakai judul biasa)
    if (relKeys.length === 0) return null;

    var states = [{ id: '', label: 'Normal' }];
    for (var s = 0; s < relKeys.length; s++) {
        states.push({ id: relKeys[s], label: relKeys[s].replace(':', '').replace(/^./, function(c) { return c.toUpperCase(); }) });
    }

    var wrapper = document.createElement('div');
    wrapper.className = 'pondasi-state-tabs-wrapper';

    var tabBar = document.createElement('div');
    tabBar.className = 'pondasi-state-tab-bar';

    for (var t = 0; t < states.length; t++) {
        var tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'pondasi-state-tab' + (t === 0 ? ' pondasi-state-tab-aktif' : '');
        tab.setAttribute('data-state', states[t].id);
        tab.textContent = states[t].label;
        tab.onclick = function(e) {
            var target = e.target;
            var stateId = target.getAttribute('data-state');
            var tabs = tabBar.querySelectorAll('.pondasi-state-tab');
            for (var j = 0; j < tabs.length; j++) tabs[j].classList.remove('pondasi-state-tab-aktif');
            target.classList.add('pondasi-state-tab-aktif');
            var panels = wrapper.querySelectorAll('.pondasi-state-panel');
            for (var k = 0; k < panels.length; k++) panels[k].classList.remove('pondasi-state-panel-aktif');
            var panel = wrapper.querySelector('.pondasi-state-panel[data-state="' + stateId + '"]');
            if (panel) panel.classList.add('pondasi-state-panel-aktif');
        };
        tabBar.appendChild(tab);
    }
    wrapper.appendChild(tabBar);

    for (var p = 0; p < states.length; p++) {
        var panel = document.createElement('div');
        panel.className = 'pondasi-state-panel' + (p === 0 ? ' pondasi-state-panel-aktif' : '');
        panel.setAttribute('data-state', states[p].id);

        if (states[p].id === '') {
            // Normal — masukkan field normal ke sini
            if (normalFieldsHtml) {
                panel.innerHTML = normalFieldsHtml;
            }
        } else {
            // Pseudo — hanya properti yang berubah
            var changedProps = relevantPseudo[states[p].id] || {};
            var changedKeys = Object.keys(changedProps);
            var filteredKeys = [];
            for (var fk = 0; fk < changedKeys.length; fk++) {
                var fProp = changedKeys[fk];
                var match = false;
                for (var sp = 0; sp < seksiProps.length; sp++) {
                    if (fProp.indexOf(seksiProps[sp]) >= 0 || seksiProps[sp].indexOf(fProp) >= 0) { match = true; break; }
                }
                if (match) filteredKeys.push(fProp);
            }

            if (filteredKeys.length === 0) {
                panel.innerHTML = '<div class="pondasi-state-info">Tidak ada perubahan saat ' + states[p].label.toLowerCase() + '.</div>';
            } else {
                for (var fc = 0; fc < filteredKeys.length; fc++) {
                    var cProp = filteredKeys[fc];
                    var cVal = changedProps[cProp];
                    var cLabel = P.formatLabelProperti(cProp);
                    var cJenis = 'teks';
                    if (cProp.indexOf('color') >= 0 || cProp === 'background' || cProp === 'border-color') cJenis = 'warna';

                    if (cJenis === 'warna') {
                        panel.insertAdjacentHTML('beforeend',
                            '<div class="pondasi-properti-baris pondasi-properti-baris-inline">' +
                            '<label class="pondasi-properti-label">' + cLabel + '</label>' +
                            '<button type="button" class="pondasi-properti-warna-btn" ' +
                            'data-state-prop="' + cProp + '" data-state-id="' + states[p].id + '" ' +
                            'data-context="' + P.escAttr(contextKelas) + '" ' +
                            'data-action="swatch-state"' +
                            (cVal ? ' style="background:' + P.escAttr(cVal) + '"' : '') + '></button></div>');
                    } else {
                        panel.insertAdjacentHTML('beforeend',
                            '<div class="pondasi-properti-baris">' +
                            '<label class="pondasi-properti-label">' + cLabel + '</label>' +
                            '<input type="text" class="pondasi-properti-input" ' +
                            'data-state-prop="' + cProp + '" data-state-id="' + states[p].id + '" ' +
                            'data-context="' + P.escAttr(contextKelas) + '" ' +
                            'value="' + P.escAttr(cVal) + '" placeholder="-">' +
                            '</div>');
                    }
                }
            }
        }
        wrapper.appendChild(panel);
    }

    return wrapper;
};

/* === BUAT STATE TABS KONTEKSTUAL (lama — tetap untuk backward compat) ===
   Selalu tampilkan Normal + Hover + Focus + Active.
   Field di tiap tab bisa diisi user (disimpan ke block.stateStyle).
   Kalau kelas punya pseudo di CSS, nilai default dari CSS ditampilkan.
   Kalau tidak ada, field kosong.
   */
P.buatStateTabsKontekstual = function (block) {
    var props = P.getContextProperties(block);
    var pseudoKeys = Object.keys(props.pseudo || {});

    if (!block.stateStyle) block.stateStyle = {};
    var contextKelas = P.STATE.editMode.classContext || '';

    // Jika tidak ada pseudo di CSS dan tidak ada user state style → tanpa tab
    var hasUserState = Object.keys(block.stateStyle || {}).length > 0;
    if (pseudoKeys.length === 0 && !hasUserState) return null;

    // States: Normal + hanya pseudo yang ada
    var states = [{ id: '', label: 'Normal' }];
    for (var i = 0; i < pseudoKeys.length; i++) {
        states.push({ id: pseudoKeys[i], label: pseudoKeys[i].replace(':', '').replace(/^./, function(c) { return c.toUpperCase(); }) });
    }
    // Tambah user state yang belum ada di pseudoKeys
    for (var us in block.stateStyle) {
        if (block.stateStyle.hasOwnProperty(us) && pseudoKeys.indexOf(us) < 0) {
            states.push({ id: us, label: us.replace(':', '').replace(/^./, function(c) { return c.toUpperCase(); }) });
        }
    }

    // Jika hanya Normal → tidak perlu tab bar
    if (states.length <= 1) return null;

    var wrapper = document.createElement('div');
    wrapper.className = 'pondasi-state-tabs-wrapper';

    var tabBar = document.createElement('div');
    tabBar.className = 'pondasi-state-tab-bar';

    for (var s = 0; s < states.length; s++) {
        var tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'pondasi-state-tab' + (s === 0 ? ' pondasi-state-tab-aktif' : '');
        tab.setAttribute('data-state', states[s].id);
        tab.textContent = states[s].label;
        tab.onclick = function(e) {
            var target = e.target;
            var stateId = target.getAttribute('data-state');
            var tabs = tabBar.querySelectorAll('.pondasi-state-tab');
            for (var j = 0; j < tabs.length; j++) tabs[j].classList.remove('pondasi-state-tab-aktif');
            target.classList.add('pondasi-state-tab-aktif');
            var panels = wrapper.querySelectorAll('.pondasi-state-panel');
            for (var k = 0; k < panels.length; k++) panels[k].classList.remove('pondasi-state-panel-aktif');
            var panel = wrapper.querySelector('.pondasi-state-panel[data-state="' + stateId + '"]');
            if (panel) panel.classList.add('pondasi-state-panel-aktif');
        };
        tabBar.appendChild(tab);
    }
    wrapper.appendChild(tabBar);

    for (var p = 0; p < states.length; p++) {
        var panel = document.createElement('div');
        panel.className = 'pondasi-state-panel' + (p === 0 ? ' pondasi-state-panel-aktif' : '');
        panel.setAttribute('data-state', states[p].id);

        if (states[p].id === '') {
            // Normal — kosong, biarkan field di bawah (Tipografi, Warna & Garis) yang menampilkan nilai
        } else {
            // Hover/Focus/Active — hanya tampilkan properti yang BERUBAH
            var stateData = block.stateStyle[states[p].id] || {};
            var pseudoRules = props.pseudo[states[p].id] || {};

            var changedProps = {};
            for (var pk in pseudoRules) {
                if (pseudoRules.hasOwnProperty(pk)) {
                    changedProps[pk] = stateData[pk] || pseudoRules[pk];
                }
            }
            for (var sk in stateData) {
                if (stateData.hasOwnProperty(sk) && !changedProps[sk]) {
                    changedProps[sk] = stateData[sk];
                }
            }

            var changedKeys = Object.keys(changedProps);
            if (changedKeys.length === 0) {
                panel.innerHTML = '<div class="pondasi-state-info">Tidak ada perubahan saat ' + states[p].label.toLowerCase() + '.</div>';
            } else {
                for (var ck = 0; ck < changedKeys.length; ck++) {
                    var cProp = changedKeys[ck];
                    var cVal = changedProps[cProp];
                    var cLabel = P.formatLabelProperti(cProp);
                    var cJenis = 'teks';
                    if (cProp.indexOf('color') >= 0 || cProp === 'background' || cProp === 'border-color') cJenis = 'warna';

                    if (cJenis === 'warna') {
                        panel.insertAdjacentHTML('beforeend',
                            '<div class="pondasi-properti-baris pondasi-properti-baris-inline">' +
                            '<label class="pondasi-properti-label">' + cLabel + '</label>' +
                            '<button type="button" class="pondasi-properti-warna-btn" ' +
                            'data-state-prop="' + cProp + '" data-state-id="' + states[p].id + '" ' +
                            'data-context="' + P.escAttr(contextKelas) + '" ' +
                            'data-action="swatch-state"' +
                            (cVal ? ' style="background:' + P.escAttr(cVal) + '"' : '') + '></button></div>');
                    } else {
                        panel.insertAdjacentHTML('beforeend',
                            '<div class="pondasi-properti-baris">' +
                            '<label class="pondasi-properti-label">' + cLabel + '</label>' +
                            '<input type="text" class="pondasi-properti-input" ' +
                            'data-state-prop="' + cProp + '" data-state-id="' + states[p].id + '" ' +
                            'data-context="' + P.escAttr(contextKelas) + '" ' +
                            'value="' + P.escAttr(cVal) + '" placeholder="-">' +
                            '</div>');
                    }
                }
            }
        }
        wrapper.appendChild(panel);
    }

    return wrapper;
};

/* === APPLY INLINE OVERRIDE (HYBRID — PART 1) ===
   Saat user edit properti di panel Tampilan, simpan sebagai inline override.
   block.style[prop] = value
   Apply ke elemen block langsung (live preview).
   */
P.terapkanInlineOverride = function (block, cssProp, value) {
    if (!block.style) block.style = {};
    if (value && value !== '') {
        block.style[cssProp] = value;
    } else {
        delete block.style[cssProp];
    }
    // Apply ke elemen di kanvas
    var el = document.querySelector('[data-block-id="' + block.id + '"]');
    if (el) {
        el.style.setProperty(P.camelToKebab(cssProp), value || '');
    }
    P.save();
};

/* === APPLY STATE OVERRIDE (HYBRID — PART 1) ===
   Saat user edit properti di tab pseudo, simpan ke block.stateStyle.
   */
P.terapkanStateOverride = function (block, stateId, cssProp, value) {
    if (!block.stateStyle) block.stateStyle = {};
    if (!block.stateStyle[stateId]) block.stateStyle[stateId] = {};
    if (value && value !== '') {
        block.stateStyle[stateId][cssProp] = value;
    } else {
        delete block.stateStyle[stateId][cssProp];
        if (Object.keys(block.stateStyle[stateId]).length === 0) {
            delete block.stateStyle[stateId];
        }
    }
    P.save();
};

/* === HELPER: CAMEL TO KEBAB === */
P.camelToKebab = function (str) {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase();
};

/* === INJECT STATE STYLE KE DOM (LIVE PREVIEW) ===
   Buat/update <style> tag untuk pseudo-class dari block.stateStyle.
   Format: .pondasi-block[data-block-id="b1"]:hover { background-color: #xxx; }
   */
P.injectStateStyle = function (block) {
    if (!block.stateStyle) return;
    var styleId = 'pondasi-state-style-' + block.id;
    var styleEl = document.getElementById(styleId);

    var css = '';
    for (var state in block.stateStyle) {
        if (!block.stateStyle.hasOwnProperty(state)) continue;
        var rules = block.stateStyle[state];
        if (Object.keys(rules).length === 0) continue;
        // Selector: pakai data-block-id supaya spesifik
        css += '[data-block-id="' + block.id + '"]' + state + ' {\n';
        for (var prop in rules) {
            if (rules.hasOwnProperty(prop)) {
                css += '  ' + prop + ': ' + rules[prop] + ' !important;\n';
            }
        }
        css += '}\n';
    }

    if (!css) {
        if (styleEl) styleEl.remove();
        return;
    }

    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
    }
    styleEl.textContent = css;
};

/* === APPLY SWATCH TO STATE (dipanggil dari openSwatches callback) ===
   Saat user pilih warna di swatches modal untuk state field.
   */
P.applySwatchState = function (color) {
    var ctx = P.STATE.editMode.stateContext;
    if (!ctx) return;
    var block = P.cariBlockById(P.STATE.editMode.selectedBlockId);
    if (!block) return;
    P.terapkanStateOverride(block, ctx.stateId, ctx.prop, color);
    P.injectStateStyle(block);
    P.renderPanel();
};

/* === GENERATE STATE CSS UNTUK EXPORT (HYBRID — PART 2) ===
   Saat export, inject pseudo-class rules dari block.stateStyle.
   Format: .nama-kelas-custom:hover { background-color: #xxx; }
   */
P.generateStateCSS = function (block) {
    if (!block.stateStyle) return '';
    var css = '';
    var kelasUtama = (block.kelas || '').split(/\s+/)[0] || block.tag;
    for (var state in block.stateStyle) {
        if (!block.stateStyle.hasOwnProperty(state)) continue;
        var rules = block.stateStyle[state];
        if (Object.keys(rules).length === 0) continue;
        css += '.' + kelasUtama + state + ' {\n';
        for (var prop in rules) {
            if (rules.hasOwnProperty(prop)) {
                css += '  ' + prop + ': ' + rules[prop] + ';\n';
            }
        }
        css += '}\n';
    }
    return css;
};

/* === GENERATE INLINE STYLE CSS UNTUK EXPORT (HYBRID — PART 2) ===
   Saat export, inline overrides di block.style bisa di-clone ke kelas custom.
   Untuk MVP: tetap sebagai inline style di HTML (akan di-improve di iterasi berikutnya).
   */
P.generateInlineStyleStr = function (block) {
    if (!block.style || Object.keys(block.style).length === 0) return '';
    var parts = [];
    for (var prop in block.style) {
        if (block.style.hasOwnProperty(prop) && block.style[prop]) {
            parts.push(P.camelToKebab(prop) + ': ' + block.style[prop]);
        }
    }
    return parts.length > 0 ? parts.join('; ') : '';
};
