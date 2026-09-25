/* PONDASI-GRADIENT.JS v134
   Gradient picker untuk color picker modal.
   Tipe: flat (default), linear, radial.
   Output: CSS class di customCSS object (bukan inline style).
   Class format: .gard-{hash} { background: linear-gradient(...); }
*/

var P = P || {};

(function () {

    var gradientType = 'flat';  // 'flat' | 'linear' | 'radial'
    var gradientAngle = 135;
    var gradientStops = [
        { color: '#00AAD4', position: 0 },
        { color: '#0073B4', position: 100 }
    ];
    var activeStopIdx = 0;  // stop yang sedang dipilih untuk color wheel
    var gradientCounter = { linear: 0, radial: 0 };  // v137: counter untuk naming

    /* === v137: Generate CSS class name — gradlin-1, gradrad-1 === */
    function genGradientClassName() {
        var prefix = gradientType === 'linear' ? 'gradlin' : 'gradrad';
        gradientCounter[gradientType] = (gradientCounter[gradientType] || 0) + 1;
        return prefix + '-' + gradientCounter[gradientType];
    }

    /* === Generate CSS rule string untuk gradient === */
    P.generateGradientCSS = function(className) {
        if (!className) className = genGradientClassName();
        var stopsStr = gradientStops.map(function (s) {
            return s.color + ' ' + s.position + '%';
        }).join(', ');

        var bgValue;
        if (gradientType === 'linear') {
            bgValue = 'linear-gradient(' + gradientAngle + 'deg, ' + stopsStr + ')';
        } else if (gradientType === 'radial') {
            bgValue = 'radial-gradient(circle at center, ' + stopsStr + ')';
        } else {
            return '';  // flat = no gradient
        }
        return '.' + className + ' {\n    background: ' + bgValue + ';\n}';
    }

    /* === Get current gradient class name === */
    P.getGradientClassName = function() {
        return genGradientClassName();
    }

    /* === Get current gradient type === */
    P.getGradientType = function() {
        return gradientType;
    }

    /* === Set gradient type === */
    P.setGradientType = function(type) {
        gradientType = type;
        var controls = document.getElementById('gradient-controls');
        if (controls) {
            controls.style.display = (type === 'flat') ? 'none' : 'block';
        }
        // Toggle angle wrap (hidden untuk radial)
        var angleWrap = document.getElementById('gradient-angle-wrap');
        if (angleWrap) {
            angleWrap.style.display = (type === 'linear') ? 'block' : 'none';
        }
        P.updateGradientPreview();
    }

    /* === Update gradient preview === */
    P.updateGradientPreview = function() {
        var preview = document.getElementById('gradient-preview');
        if (!preview) return;
        if (gradientType === 'flat') {
            preview.style.background = '';
            return;
        }
        var stopsStr = gradientStops.map(function (s) {
            return s.color + ' ' + s.position + '%';
        }).join(', ');
        if (gradientType === 'linear') {
            preview.style.background = 'linear-gradient(' + gradientAngle + 'deg, ' + stopsStr + ')';
        } else if (gradientType === 'radial') {
            preview.style.background = 'radial-gradient(circle at center, ' + stopsStr + ')';
        }
    }

    /* === Render stop swatches === */
    P.renderGradientStops = function() {
        var container = document.getElementById('gradient-stops');
        if (!container) return;
        while (container.firstChild) container.removeChild(container.firstChild);

        gradientStops.forEach(function (stop, idx) {
            var stopEl = document.createElement('div');
            stopEl.className = 'pondasi-gradient-stop';
            if (idx === activeStopIdx) stopEl.className += ' pondasi-gradient-stop-aktif';

            var sw = document.createElement('button');
            sw.className = 'pondasi-gradient-stop-swatch';
            if (idx === activeStopIdx) sw.className += ' aktif';
            sw.style.backgroundColor = stop.color;
            sw.title = 'Stop ' + (idx + 1) + ': ' + stop.color + ' @ ' + stop.position + '%';
            sw.dataset.stopIdx = idx;
            sw.addEventListener('click', function (e) {
                e.stopPropagation();
                activeStopIdx = idx;
                P.renderGradientStops();
                // Update hex input + color wheel ke warna stop ini
                var hexInput = document.getElementById('swatches-hex');
                if (hexInput) hexInput.value = stop.color;
            });
            stopEl.appendChild(sw);

            // Tombol hapus stop (min 2 stops)
            if (gradientStops.length > 2) {
                var delBtn = document.createElement('button');
                delBtn.className = 'pondasi-gradient-stop-del';
                delBtn.title = 'Hapus stop';
                delBtn.innerHTML = P.icon('x', 8);
                delBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    gradientStops.splice(idx, 1);
                    if (activeStopIdx >= gradientStops.length) activeStopIdx = gradientStops.length - 1;
                    P.renderGradientStops();
                    P.updateGradientPreview();
                });
                stopEl.appendChild(delBtn);
            }

            container.appendChild(stopEl);
        });
    }

    /* === Add new stop === */
    P.addGradientStop = function() {
        if (gradientStops.length >= 6) {
            P.flash('Maksimal 6 stops');
            return;
        }
        // Tambah stop di tengah stop terakhir dan sebelumnya
        var last = gradientStops[gradientStops.length - 1];
        var prev = gradientStops[gradientStops.length - 2];
        var newPos = prev ? Math.round((prev.position + last.position) / 2) : 50;
        var newColor = last.color;
        gradientStops.push({ color: newColor, position: newPos });
        // Sort by position
        gradientStops.sort(function (a, b) { return a.position - b.position; });
        activeStopIdx = gradientStops.length - 1;
        P.renderGradientStops();
        P.updateGradientPreview();
    }

    /* === Set active stop color (dipanggil saat user pilih warna dari wheel/swatch) === */
    P.setActiveStopColor = function(hex) {
        if (gradientType === 'flat' || activeStopIdx < 0 || activeStopIdx >= gradientStops.length) return;
        gradientStops[activeStopIdx].color = hex;
        P.renderGradientStops();
        P.updateGradientPreview();
    }

    /* === Init gradient UI === */
    P.initGradient = function() {
        // Type buttons
        var typeBtns = document.querySelectorAll('.pondasi-gradient-type-btn');
        for (var i = 0; i < typeBtns.length; i++) {
            typeBtns[i].addEventListener('click', function (e) {
                var type = e.target.dataset.gradientType || e.target.parentNode.dataset.gradientType;
                // Update aktif class
                for (var j = 0; j < typeBtns.length; j++) {
                    typeBtns[j].classList.remove('pondasi-gradient-type-aktif');
                }
                e.target.classList.add('pondasi-gradient-type-aktif');
                P.setGradientType(type);
            });
        }

        // Angle slider
        var angleSlider = document.getElementById('gradient-angle');
        var angleVal = document.getElementById('gradient-angle-val');
        if (angleSlider) {
            angleSlider.addEventListener('input', function () {
                gradientAngle = parseInt(angleSlider.value, 10);
                if (angleVal) angleVal.textContent = gradientAngle + '°';
                P.updateGradientPreview();
            });
        }

        // Add stop button
        var addStopBtn = document.getElementById('gradient-add-stop');
        if (addStopBtn) {
            addStopBtn.addEventListener('click', function () {
                P.addGradientStop();
            });
        }

        // Render initial stops
        P.renderGradientStops();
    }

    /* === Apply gradient ke block === */
    /* Generate CSS class, simpan ke customCSS, apply class ke block */
    P.applyGradientToBlock = function(blockId, field) {
        if (gradientType === 'flat') {
            // Flat = pakai inline style (existing behavior)
            return null;
        }
        var className = genGradientClassName();
        var cssRule = P.generateGradientCSS(className);

        // v135: Parse CSS rule → pisahkan prop dan val, hapus trailing semicolon
        var matchResult = cssRule.match(/\{\s*([^:]+):\s*([^}]+?)\s*;?\s*\}/);
        var bgProp = matchResult ? matchResult[1].trim() : 'background';
        var bgVal = matchResult ? matchResult[2].trim() : '';
        var rulesObj = {};
        rulesObj[bgProp] = bgVal;

        // Simpan ke customCSS object
        if (!P.STATE.customCSS) P.STATE.customCSS = {};
        var cssKey = 'gradient_' + className;
        P.STATE.customCSS[cssKey] = {
            className: className,
            rules: rulesObj,
            isGradient: true,
            gradientData: {
                type: gradientType,
                angle: gradientAngle,
                stops: JSON.parse(JSON.stringify(gradientStops))
            }
        };

        // Apply class ke block
        var block = P.cariBlockById(blockId);
        if (block) {
            if (!block.classes) block.classes = [];
            // v142: Hapus class gradient lama (gard-*, gradlin-*, gradrad-*)
            block.classes = block.classes.filter(function (c) {
                return c.indexOf('gard-') !== 0 && c.indexOf('gradlin-') !== 0 && c.indexOf('gradrad-') !== 0;
            });
            block.classes.push(className);
            // Hapus inline backgroundColor (karena pakai class)
            if (block.style) {
                delete block.style.backgroundColor;
            }
        }

        P.save();

        // v135: Inject CSS rule ke <style> tag supaya langsung terlihat di canvas
        P.injectGradientCSS(className, bgProp + ': ' + bgVal + ';');

        // v137: Tambah gradient ke custom colors (sebagai swatch di "Warna Pengguna")
        // Simpan sebagai entri gradient dengan data lengkap
        if (P.addCustomColor) {
            // Simpan gradient sebagai color kustom dengan marker gradient
            var gradientHex = '#GRAD:' + className;
            // Tidak bisa pakai addCustomColor (validasi hex) — simpan langsung
            var colors = P.getCustomColors();
            // Cek apakah gradient class ini sudah ada
            var existing = false;
            for (var ci = 0; ci < colors.length; ci++) {
                if (colors[ci] === gradientHex) { existing = true; break; }
            }
            if (!existing) {
                colors.push(gradientHex);
                try {
                    localStorage.setItem('pondasi.customColors', JSON.stringify(colors));
                } catch (e) {}
            }
        }

        return className;
    }

    /* v135: Inject/update gradient CSS ke <style> tag di <head> */
    P.injectGradientCSS = function(className, cssBody) {
        var styleId = 'pondasi-style-' + className;
        var existing = document.getElementById(styleId);
        if (existing) existing.parentNode.removeChild(existing);
        var style = document.createElement('style');
        style.id = styleId;
        style.textContent = '.' + className + ' { ' + cssBody + ' }';
        document.head.appendChild(style);
    }

    /* v139: Re-inject semua gradient <style> tags (dipanggil setelah render) */
    P.reinjectGradientStyles = function() {
        if (!P.STATE.customCSS) return;
        Object.keys(P.STATE.customCSS).forEach(function(key) {
            var css = P.STATE.customCSS[key];
            if (!css || !css.isGradient) return;
            var rules = css.rules || {};
            for (var prop in rules) {
                if (rules.hasOwnProperty(prop)) {
                    P.injectGradientCSS(css.className, prop + ': ' + rules[prop] + ';');
                    break;
                }
            }
        });
    }

    /* === Get gradient type untuk cek apakah sedang mode gradient === */
    P.isGradientMode = function() {
        return gradientType !== 'flat';
    }

    /* v137: Get CSS body string untuk gradient class (untuk swatch preview) */
    P.getGradientCSSBody = function(className) {
        if (!className) return '';
        if (!P.STATE.customCSS) return '';
        for (var key in P.STATE.customCSS) {
            if (P.STATE.customCSS[key] && P.STATE.customCSS[key].className === className) {
                var css = P.STATE.customCSS[key];
                var rules = css.rules || {};
                for (var prop in rules) {
                    if (rules.hasOwnProperty(prop)) {
                        // v138: Return just the VALUE (e.g., "linear-gradient(...)"), not "prop: val"
                        return rules[prop];
                    }
                }
            }
        }
        return '';
    }

    /* v141: Load gradient dari customCSS ke UI (stops, angle, type) */
    /* Dipanggil saat user klik swatch gradient di "Warna Pengguna" */
    P.loadGradientFromCSS = function(className) {
        if (!className || !P.STATE.customCSS) return false;
        for (var key in P.STATE.customCSS) {
            var css = P.STATE.customCSS[key];
            if (!css || !css.isGradient || css.className !== className) continue;
            var data = css.gradientData;
            if (!data) return false;

            // Set type
            gradientType = data.type || 'linear';
            gradientAngle = data.angle || 135;
            gradientStops = JSON.parse(JSON.stringify(data.stops || [
                { color: '#00AAD4', position: 0 },
                { color: '#0073B4', position: 100 }
            ]));
            activeStopIdx = 0;

            // Update UI
            // Type buttons
            var typeBtns = document.querySelectorAll('.pondasi-gradient-type-btn');
            for (var i = 0; i < typeBtns.length; i++) {
                typeBtns[i].classList.remove('pondasi-gradient-type-aktif');
                if (typeBtns[i].dataset.gradientType === gradientType) {
                    typeBtns[i].classList.add('pondasi-gradient-type-aktif');
                }
            }
            // Show/hide controls
            var controls = document.getElementById('gradient-controls');
            if (controls) controls.style.display = (gradientType === 'flat') ? 'none' : 'block';
            var angleWrap = document.getElementById('gradient-angle-wrap');
            if (angleWrap) angleWrap.style.display = (gradientType === 'linear') ? 'block' : 'none';

            // Angle slider
            var angleSlider = document.getElementById('gradient-angle');
            var angleVal = document.getElementById('gradient-angle-val');
            if (angleSlider) angleSlider.value = gradientAngle;
            if (angleVal) angleVal.textContent = gradientAngle + '\u00b0';

            // Render stops + preview
            P.renderGradientStops();
            P.updateGradientPreview();

            // Set hex input ke stop pertama
            var hexInput = document.getElementById('swatches-hex');
            if (hexInput && gradientStops.length > 0) {
                hexInput.value = gradientStops[0].color;
            }
            return true;
        }
        return false;
    };

    /* === Reset gradient ke flat saat modal dibuka === */
    P.resetGradient = function() {
        gradientType = 'flat';
        gradientAngle = 135;
        gradientStops = [
            { color: '#00AAD4', position: 0 },
            { color: '#0073B4', position: 100 }
        ];
        activeStopIdx = 0;
        // Reset UI
        var typeBtns = document.querySelectorAll('.pondasi-gradient-type-btn');
        for (var i = 0; i < typeBtns.length; i++) {
            typeBtns[i].classList.remove('pondasi-gradient-type-aktif');
            if (typeBtns[i].dataset.gradientType === 'flat') {
                typeBtns[i].classList.add('pondasi-gradient-type-aktif');
            }
        }
        var controls = document.getElementById('gradient-controls');
        if (controls) controls.style.display = 'none';
        P.renderGradientStops();
        P.updateGradientPreview();
    }
})();
