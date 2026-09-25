/* PONDASI-COLORWHEEL.JS v123
   Custom HSL color wheel menggunakan <canvas>.
   Langsung tampil di dalam modal Pondasi (bukan dialog native browser).

   Fitur:
   - Color wheel 150×150px (hue ring + saturation radial)
   - Brightness slider (0-100%)
   - Hex display realtime
   - Color preview box
   - Click/drag untuk pilih warna
*/

var P = P || {};

(function () {

    var canvas, ctx;
    var cursorEl, previewEl, infoEl, brightnessSlider;
    var currentHue = 0;      // 0-360
    var currentSat = 100;    // 0-100 (radial distance dari center)
    var currentLight = 50;   // 0-100 (brightness slider)
    var isDragging = false;

    /* === HSL → RGB === */
    function hslToRgb(h, s, l) {
        h = h / 360; s = s / 100; l = l / 100;
        var r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            var hue2rgb = function (p, q, t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    }

    /* === RGB → Hex === */
    function rgbToHex(r, g, b) {
        var toHex = function (n) {
            var s = n.toString(16).toUpperCase();
            return s.length === 1 ? '0' + s : s;
        };
        return '#' + toHex(r) + toHex(g) + toHex(b);
    }

    /* === Hex → HSL === */
    function hexToHsl(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
        }
        var r = parseInt(hex.substring(0, 2), 16) / 255;
        var g = parseInt(hex.substring(2, 4), 16) / 255;
        var b = parseInt(hex.substring(4, 6), 16) / 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;
        if (max === min) {
            h = s = 0;
        } else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    }

    /* === Render color wheel ke canvas === */
    /* Wheel = hue (angle) × saturation (radial), dengan lightness dari slider */
    function renderWheel() {
        if (!ctx) return;
        var w = canvas.width, h = canvas.height;
        var cx = w / 2, cy = h / 2;
        var radius = Math.min(cx, cy) - 1;
        // Pakai pixel-by-pixel supaya akurat (150x150 = 22500 pixel, masih cepat)
        var imageData = ctx.createImageData(w, h);
        var data = imageData.data;
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                var dx = x - cx;
                var dy = y - cy;
                var dist = Math.sqrt(dx * dx + dy * dy);
                var idx = (y * w + x) * 4;
                if (dist <= radius) {
                    // Hue dari angle
                    var angle = Math.atan2(dy, dx) * 180 / Math.PI;
                    if (angle < 0) angle += 360;
                    // Saturation dari jarak radial (0-100)
                    var sat = Math.min(100, (dist / radius) * 100);
                    // Lightness dari slider
                    var rgb = hslToRgb(angle, sat, currentLight);
                    data[idx] = rgb.r;
                    data[idx + 1] = rgb.g;
                    data[idx + 2] = rgb.b;
                    data[idx + 3] = 255;
                } else {
                    data[idx + 3] = 0;  // transparent di luar wheel
                }
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }

    /* === Update cursor position + preview + hex === */
    /* v125: hanya update hex input + preview, TIDAK apply langsung */
    function updateFromHsl() {
        if (!canvas) return;
        var cx = canvas.width / 2, cy = canvas.height / 2;
        var radius = Math.min(cx, cy) - 1;
        var angleRad = currentHue * Math.PI / 180;
        var dist = (currentSat / 100) * radius;
        var x = cx + Math.cos(angleRad) * dist;
        var y = cy + Math.sin(angleRad) * dist;
        if (cursorEl) {
            // v124: cursor posisi relatif ke canvas offsetLeft/offsetTop dalam parent
            cursorEl.style.left = (canvas.offsetLeft + x) + 'px';
            cursorEl.style.top = (canvas.offsetTop + y) + 'px';
        }
        var rgb = hslToRgb(currentHue, currentSat, currentLight);
        var hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        if (previewEl) previewEl.style.backgroundColor = hex;
        if (infoEl) infoEl.textContent = hex;
        // Sync ke hex input
        var hexInput = document.getElementById('swatches-hex');
        if (hexInput) hexInput.value = hex;
        // v135: Dalam gradient mode, auto-update active stop color
        if (P.isGradientMode && P.isGradientMode()) {
            P.setActiveStopColor(hex);
        }
        // v125: clear swatch selected highlight (karena warna dari wheel mungkin tidak match swatch)
        var allSwatches = document.querySelectorAll('.pondasi-swatch');
        for (var i = 0; i < allSwatches.length; i++) {
            allSwatches[i].classList.remove('pondasi-swatch-selected');
        }
    }

    /* === Handle click/drag di canvas → update HSL === */
    function handlePick(e) {
        if (!canvas) return;
        var rect = canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var cx = canvas.width / 2, cy = canvas.height / 2;
        var radius = Math.min(cx, cy) - 1;
        var dx = x - cx, dy = y - cy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        // Clamp ke radius
        if (dist > radius) {
            var scale = radius / dist;
            dx *= scale;
            dy *= scale;
            dist = radius;
        }
        currentHue = Math.atan2(dy, dx) * 180 / Math.PI;
        if (currentHue < 0) currentHue += 360;
        currentSat = Math.min(100, (dist / radius) * 100);
        updateFromHsl();
    }

    /* === Set wheel value dari hex (untuk sync saat user input hex manual) === */
    P.setColorWheelValue = function (hex) {
        var hsl = hexToHsl(hex);
        currentHue = hsl.h;
        currentSat = hsl.s;
        currentLight = hsl.l;
        if (brightnessSlider) brightnessSlider.value = currentLight;
        renderWheel();
        updateFromHsl();
    };

    /* === Toggle color wheel panel === */
    P.toggleColorWheel = function () {
        var panel = document.getElementById('color-wheel-panel');
        if (!panel) return;
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
            // Render ulang kalau baru tampil
            renderWheel();
            updateFromHsl();
        } else {
            panel.style.display = 'none';
        }
    };

    /* === Init color wheel (dipanggil dari init setelah DOM ready) === */
    P.initColorWheel = function () {
        canvas = document.getElementById('color-wheel-canvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        cursorEl = document.getElementById('color-wheel-cursor');
        previewEl = document.getElementById('color-wheel-preview');
        infoEl = document.getElementById('color-wheel-info');
        brightnessSlider = document.getElementById('color-wheel-brightness');

        // Render wheel awal
        renderWheel();
        updateFromHsl();

        // Mouse events di canvas
        canvas.addEventListener('mousedown', function (e) {
            isDragging = true;
            handlePick(e);
        });
        document.addEventListener('mousemove', function (e) {
            if (isDragging) handlePick(e);
        });
        document.addEventListener('mouseup', function () {
            isDragging = false;
        });

        // Touch events (mobile)
        canvas.addEventListener('touchstart', function (e) {
            e.preventDefault();
            isDragging = true;
            var touch = e.touches[0];
            handlePick({ clientX: touch.clientX, clientY: touch.clientY });
        });
        canvas.addEventListener('touchmove', function (e) {
            e.preventDefault();
            if (isDragging) {
                var touch = e.touches[0];
                handlePick({ clientX: touch.clientX, clientY: touch.clientY });
            }
        });
        canvas.addEventListener('touchend', function () {
            isDragging = false;
        });

        // Brightness slider
        if (brightnessSlider) {
            brightnessSlider.addEventListener('input', function () {
                currentLight = parseInt(brightnessSlider.value, 10);
                renderWheel();
                updateFromHsl();
            });
        }
    };

})();
