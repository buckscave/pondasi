/* PONDASI-RENDER.JS */
var P = P || {};

    /* ======================================================================
       RENDER TREE → DOM
       ====================================================================== */
    P.regionLabel = function(node) {
        var cls = node.classes.join('.');
        return node.tag + '.' + cls;
    }

    P.placeholderText = function(node) {
        var hints = [];
        if (node.type === 'grand-parent') {
            hints.push('<span class="pondasi-ph-key">v</span> split vertikal');
            hints.push('<span class="pondasi-ph-key">h</span> split horisontal');
        } else if (node.type === 'parent') {
            hints.push('<span class="pondasi-ph-key">v</span> tambah kolom');
            hints.push('<span class="pondasi-ph-key">h</span> tambah baris sibling');
        } else if (node.type === 'child') {
            hints.push('<span class="pondasi-ph-key">alt+v</span> split vertikal');
            hints.push('<span class="pondasi-ph-key">alt+h</span> split horisontal');
        } else if (node.type === 'sub-parent') {
            hints.push('<span class="pondasi-ph-key">v</span> tambah kolom');
            hints.push('<span class="pondasi-ph-key">h</span> tambah sub-baris');
        } else if (node.type === 'sub-child') {
            hints.push('<span class="pondasi-ph-key">v</span> tambah kolom');
            hints.push('<span class="pondasi-ph-key">h</span> tambah sibling');
        }
        return hints.join(' &nbsp; ');
    }

    P.renderNode = function(node) {
        var e = document.createElement(node.tag);
        // Ambil customCSS region (kalau ada) — tambah className kustom ke kelas region
        // sehingga selector "div.kolom-4.kelas_kustom" berlaku di export.
        var regionCSS = P.STATE.customCSS && P.STATE.customCSS[node.id];
        var allClasses = node.classes.slice();
        if (regionCSS && regionCSS.className) {
            allClasses.push(regionCSS.className);
        }
        e.className = allClasses.join(' ') + ' pondasi-region pondasi-type-' + node.type;
        // Tambah kelas pondasi-has-content kalau node punya konten (auto-height)
        if (node.content && node.content.trim()) {
            e.classList.add('pondasi-has-content');
        }
        e.dataset.id = node.id;

        // Aktif / terpilih
        if (node.id === P.STATE.activeId) e.classList.add('pondasi-active');
        if (P.STATE.selectedIds.indexOf(node.id) >= 0) e.classList.add('pondasi-selected');
        // Terkunci — blok split/delete/swap/merge/yank/cut
        if (node.locked) e.classList.add('pondasi-region-locked');

        // Style tambahan
        if (node.h) e.style.minHeight = node.h + 'rem';

        // Apply customCSS region rules ke DOM (inline style untuk live preview)
        // Catatan: di export, rules ini akan di-generate sebagai CSS rule dengan selector
        // .kelas_kustom { ... } (lihat P.generateCustomCSS di pondasi-state.js)
        if (regionCSS && regionCSS.rules) {
            for (var prop in regionCSS.rules) {
                if (regionCSS.rules.hasOwnProperty(prop) && regionCSS.rules[prop]) {
                    var val = regionCSS.rules[prop];
                    // Coba set via style[camelCase] (untuk properti standar)
                    var camelProp = prop.replace(/-([a-z])/g, function(m, c) { return c.toUpperCase(); });
                    try { e.style[camelProp] = val; }
                    catch (err) { /* skip invalid property */ }
                }
            }
        }

        // Label kecil di pojok
        var label = P.el('span', { class: 'pondasi-region-label' });
        label.textContent = P.regionLabel(node);
        e.appendChild(label);

        // Anak atau placeholder
        if (node.children.length === 0) {
            // Jika node punya blocks (dari block editor), render blocks
            if (node.blocks && node.blocks.length > 0) {
                node.blocks.forEach(function (block) {
                    var be = document.createElement(block.tag);
                    if (block.kelas) be.className = block.kelas;
                    if (block.isi) be.innerHTML = block.isi;
                    if (block.properti) {
                        for (var pk in block.properti) {
                            if (block.properti.hasOwnProperty(pk)) {
                                be.setAttribute(pk, block.properti[pk]);
                            }
                        }
                    }
                    e.appendChild(be);
                });
            } else if (node.content && node.content.trim()) {
                // Konten lama (compatibility)
                var contentDiv = P.el('div', {
                    class: 'pondasi-region-content',
                    html: node.content
                });
                e.appendChild(contentDiv);
            } else {
                var ph = P.el('div', {
                    class: 'pondasi-placeholder',
                    html: P.placeholderText(node)
                });
                e.appendChild(ph);
            }
        } else {
            node.children.forEach(function (c) {
                e.appendChild(P.renderNode(c));
            });
        }

        return e;
    }

    P.render = function() {
        var canvas = document.getElementById('canvas');
        if (!canvas) return;
        // Guard: kalau tree null (mis. setelah delete current project sebelum auto-create),
        // jangan crash — biarkan caller (newProject/dll) yang re-render setelah tree siap.
        if (!P.STATE.tree) {
            console.warn('[pondasi] P.render dipanggil dengan tree null — skip render');
            return;
        }
        // Hapus semua anak
        while (canvas.firstChild) canvas.removeChild(canvas.firstChild);
        // Render grand-parent sebagai canvas itu sendiri
        // Tambah className kustom kalau ada customCSS untuk root
        var rootCSS = P.STATE.customCSS && P.STATE.customCSS[P.STATE.tree.id];
        var rootClasses = P.STATE.tree.classes.slice();
        if (rootCSS && rootCSS.className) {
            rootClasses.push(rootCSS.className);
        }
        canvas.className = rootClasses.join(' ') + ' pondasi-region pondasi-type-' + P.STATE.tree.type;
        canvas.dataset.id = P.STATE.tree.id;
        canvas.classList.add('pondasi-canvas');  // pastikan kelas pondasi-canvas tetap
        // Apply customCSS root rules ke canvas
        if (rootCSS && rootCSS.rules) {
            for (var rProp in rootCSS.rules) {
                if (rootCSS.rules.hasOwnProperty(rProp) && rootCSS.rules[rProp]) {
                    var rVal = rootCSS.rules[rProp];
                    var rCamel = rProp.replace(/-([a-z])/g, function(m, c) { return c.toUpperCase(); });
                    try { canvas.style[rCamel] = rVal; } catch (err) {}
                }
            }
        }
        if (P.STATE.tree.id === P.STATE.activeId) canvas.classList.add('pondasi-active');
        else canvas.classList.remove('pondasi-active');
        if (P.STATE.selectedIds.indexOf(P.STATE.tree.id) >= 0) canvas.classList.add('pondasi-selected');
        else canvas.classList.remove('pondasi-selected');
        if (P.STATE.tree.h) canvas.style.minHeight = P.STATE.tree.h + 'rem';

        // Grand-parent TIDAK menampilkan label di pojok kanan — sudah ada di breadcrumb
        // (Hanya child yang tampilkan label, sesuai keinginan)

        // Render anak-anak grand-parent
        P.STATE.tree.children.forEach(function (c) {
            canvas.appendChild(P.renderNode(c));
        });
        P.updateStatus();
        // Terapkan tinggi region supaya sistem pembagian terlihat
        if (window.requestAnimationFrame) {
            window.requestAnimationFrame(P.applyVerticalHeights);
        } else {
            setTimeout(P.applyVerticalHeights, 16);
        }

        // Pastikan canvas/region punya focus supaya keyboard shortcut bekerja
        var ae = document.activeElement;
        var safeFocus = !ae || (ae.tagName !== 'INPUT' && ae.tagName !== 'TEXTAREA' &&
            !ae.isContentEditable && ae.tagName !== 'SELECT');
        if (safeFocus) {
            if (P.STATE.editMode.active && P.STATE.editMode.regionId) {
                // Mode edit: fokus ke region yang sedang di-edit
                var editRegion = canvas.querySelector('.pondasi-region[data-id="' + P.STATE.editMode.regionId + '"]');
                if (editRegion) {
                    editRegion.setAttribute('tabindex', '0');
                    try { editRegion.focus(); } catch (e) {}
                }
            } else if (ae !== canvas) {
                // Non-edit: fokus ke canvas
                try { canvas.focus(); } catch (e) {}
            }
        }

        // Scroll ke region aktif supaya terlihat
        if (P.STATE.activeId) {
            var activeEl = canvas.querySelector('.pondasi-region[data-id="' + P.STATE.activeId + '"]');
            if (activeEl && activeEl.scrollIntoView) {
                activeEl.scrollIntoView({ block: 'nearest' });
            }
        }
    }

    /*
       applyVerticalHeights — bagi tinggi parent ke anak-anak yang stack vertikal.
       - grand-parent (canvas): anak section.baris stack vertikal → bagi tinggi canvas / N
       - parent (section): anak kolom inline-block → kolom height: 100% (dari CSS)
       - sub-parent dengan anak sub-baris (alt+h): sub-baris stack vertikal → bagi tinggi / N
       - sub-parent dengan anak kolom (alt+v): kolom height: 100% (dari CSS)
       - sub-child: anak kolom → 100%; atau anak sub-baris sibling → bagi tinggi
    */
    P.applyVerticalHeights = function() {
        var canvas = document.getElementById('canvas');
        if (!canvas) return;

        function processContainer(element, node) {
            if (!element || !node) return;

            // Kumpulkan region anak (skip label, placeholder, content)
            var regionChildren = Array.prototype.filter.call(element.children, function (c) {
                return c.classList && c.classList.contains('pondasi-region');
            });

            // Tentukan apakah anak-anak stack vertikal
            var verticalStack = false;
            if (node.type === 'grand-parent') {
                verticalStack = true;
            } else if (node.type === 'parent') {
                verticalStack = false;
            } else if (node.type === 'sub-parent' || node.type === 'sub-child') {
                if (node.children.length > 0 && node.children[0].type === 'sub-child') {
                    verticalStack = true;
                }
            }

            if (verticalStack && regionChildren.length > 0) {
                var totalH = element.clientHeight;
                if (totalH === 0) {
                    totalH = element.offsetHeight;
                }
                if (totalH > 0) {
                    // Cek apakah ada anak dengan tinggi eksplisit (node.h, hasil alt+↑/↓)
                    var fixedHeights = {};
                    var fixedTotal = 0;
                    var fixedCount = 0;
                    // Cek juga apakah ada anak dengan konten (auto-height, tidak pakai fixed)
                    var autoContentCount = 0;
                    node.children.forEach(function (c) {
                        if (c.h && c.h > 0) {
                            var pxH = c.h * 16;
                            fixedHeights[c.id] = pxH;
                            fixedTotal += pxH;
                            fixedCount++;
                        } else if (c.content && c.content.trim()) {
                            // Region dengan konten — auto-height, tidak di-set tinggi
                            autoContentCount++;
                        }
                    });
                    // Region dengan tinggi auto (kosong, tidak ada content)
                    var autoCount = node.children.length - fixedCount - autoContentCount;
                    var eachAuto = autoCount > 0
                        ? Math.floor((totalH - fixedTotal) / autoCount)
                        : 0;
                    for (var i = 0; i < regionChildren.length; i++) {
                        var cid = node.children[i].id;
                        if (fixedHeights[cid]) {
                            regionChildren[i].style.height = fixedHeights[cid] + 'px';
                        } else if (node.children[i].content && node.children[i].content.trim()) {
                            // Region dengan konten — biarkan tinggi natural, hapus style.height
                            regionChildren[i].style.height = '';
                        } else {
                            regionChildren[i].style.height = eachAuto + 'px';
                        }
                    }
                }
            }

            // Recursive ke anak-anak
            node.children.forEach(function (c, i) {
                if (regionChildren[i]) processContainer(regionChildren[i], c);
            });
        }

        processContainer(canvas, P.STATE.tree);
    }

    P.updateStatus = function() {
        var active = P.getById(P.STATE.activeId);
        var infoEl = document.getElementById('status-info');
        var hintEl = document.getElementById('status-hint');
        // status-info & status-hint tidak ada lagi di layout baru, pakai statusline
        var total = P.countRegions(P.STATE.tree);
        var selectedCount = P.STATE.selectedIds.length;

        // Default statusline
        var statusText = 'aktif: ' + (active ? P.regionLabel(active) : '—') + ' | total ' + total + ' region';
        if (selectedCount > 0) statusText += ' | ' + selectedCount + ' terpilih';
        if (P.STATE.pendingCount !== null) {
            statusText = 'akan split jadi ' + P.STATE.pendingCount + ' — tekan v/h (esc batal)';
        }
        // Kalau ada flash aktif, jangan overwrite (cek class)
        var statuslineEl = document.getElementById('statusline');
        if (statuslineEl && !statuslineEl.classList.contains('pondasi-status-flash')) {
            statuslineEl.textContent = statusText;
        }

        // Update guide system kalau guide aktif
        if (P.guideVisible) P.updateGuideSystem();

        // Update breadcrumb
        P.updateBreadcrumb();
    }

    P.setStatusline = function(text) {
        var el = document.getElementById('statusline');
        if (!el) return;
        el.textContent = text;
    }

    P.updateBreadcrumb = function() {
        var bc = document.getElementById('breadcrumb');
        if (!bc) return;
        // Hapus semua
        while (bc.firstChild) bc.removeChild(bc.firstChild);

        // Bangun path dari root ke aktif
        var active = P.getById(P.STATE.activeId);
        if (!active) return;

        var path = [];
        var cur = active;
        while (cur) {
            path.unshift(cur);
            cur = P.getParent(cur.id);
        }

        // Render
        path.forEach(function (n, i) {
            if (i > 0) {
                var sep = P.el('span', { class: 'pondasi-breadcrumb-sep', text: '>' });
                bc.appendChild(sep);
            }
            var item = P.el('span', {
                class: 'pondasi-breadcrumb-item' + (n.id === P.STATE.activeId ? ' pondasi-breadcrumb-active' : ''),
                text: P.regionLabel(n).split('.').slice(0, 2).join('.')  // mis. "section.baris"
            });
            item.dataset.id = n.id;
            item.addEventListener('click', function (e) {
                e.stopPropagation();
                P.setActive(n.id);
                P.clearSelection();
                P.render();
            });
            bc.appendChild(item);
        });
    }

    P.countRegions = function(node) {
        var n = 1;
        if (node.children) {
            node.children.forEach(function (c) { n += P.countRegions(c); });
        }
        return n;
    }

