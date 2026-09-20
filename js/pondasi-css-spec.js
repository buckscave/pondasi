/* PONDASI-CSS-SPEC.JS
   Whitelist properti & value CSS yang didukung pondasi (CSS 2.1-3.0).
   Scanner pakai spec ini untuk validasi: kalau properti/value TIDAK ada di sini,
   dianggap pelanggaran. Lebih ketat dari blacklist.
   */
var P = P || {};

P.CSS_SPEC = {
    versi: '2.1-3.0',
    tanggalUpdate: '2026-09-15',

    /* === PROPERTI YANG DIDUKUNG ===
       Format: { properti: { values: [...] | '*' , kategori: '...' } }
       values: '*' artinya value apa saja diterima (mis. warna, angka px)
       values: [...] artinya hanya value dalam list yang diterima
       */
    properti: {
        // === LAYOUT (display, position, float) ===
        'display': {
            values: ['block', 'inline', 'inline-block', 'table', 'table-row', 'table-cell', 'table-caption', 'table-header-group', 'table-footer-group', 'table-column', 'table-column-group', 'list-item', 'none', 'inherit'],
            kategori: 'layout'
        },
        'position': {
            values: ['static', 'relative', 'absolute', 'fixed', 'sticky', 'inherit'],
            kategori: 'layout'
        },
        'float': {
            values: ['left', 'right', 'none', 'inherit'],
            kategori: 'layout'
        },
        'clear': {
            values: ['left', 'right', 'both', 'none', 'inherit'],
            kategori: 'layout'
        },
        'z-index': {
            values: '*',
            kategori: 'layout'
        },
        'overflow': {
            values: ['visible', 'hidden', 'scroll', 'auto', 'inherit'],
            kategori: 'layout'
        },
        'overflow-x': {
            values: ['visible', 'hidden', 'scroll', 'auto', 'inherit'],
            kategori: 'layout'
        },
        'overflow-y': {
            values: ['visible', 'hidden', 'scroll', 'auto', 'inherit'],
            kategori: 'layout'
        },
        'clip': {
            values: '*',
            kategori: 'layout'
        },
        'visibility': {
            values: ['visible', 'hidden', 'collapse', 'inherit'],
            kategori: 'layout'
        },

        // === DIMENSI ===
        'width': { values: '*', kategori: 'dimensi' },
        'min-width': { values: '*', kategori: 'dimensi' },
        'max-width': { values: '*', kategori: 'dimensi' },
        'height': { values: '*', kategori: 'dimensi' },
        'min-height': { values: '*', kategori: 'dimensi' },
        'max-height': { values: '*', kategori: 'dimensi' },

        // === MARGIN & PADDING ===
        'margin': { values: '*', kategori: 'box' },
        'margin-top': { values: '*', kategori: 'box' },
        'margin-right': { values: '*', kategori: 'box' },
        'margin-bottom': { values: '*', kategori: 'box' },
        'margin-left': { values: '*', kategori: 'box' },
        'padding': { values: '*', kategori: 'box' },
        'padding-top': { values: '*', kategori: 'box' },
        'padding-right': { values: '*', kategori: 'box' },
        'padding-bottom': { values: '*', kategori: 'box' },
        'padding-left': { values: '*', kategori: 'box' },

        // === BORDER ===
        'border': { values: '*', kategori: 'border' },
        'border-top': { values: '*', kategori: 'border' },
        'border-right': { values: '*', kategori: 'border' },
        'border-bottom': { values: '*', kategori: 'border' },
        'border-left': { values: '*', kategori: 'border' },
        'border-width': { values: '*', kategori: 'border' },
        'border-style': {
            values: ['none', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset', 'inherit'],
            kategori: 'border'
        },
        'border-color': { values: '*', kategori: 'border' },
        'border-radius': { values: '*', kategori: 'border' },
        'border-top-left-radius': { values: '*', kategori: 'border' },
        'border-top-right-radius': { values: '*', kategori: 'border' },
        'border-bottom-left-radius': { values: '*', kategori: 'border' },
        'border-bottom-right-radius': { values: '*', kategori: 'border' },
        'border-collapse': {
            values: ['collapse', 'separate', 'inherit'],
            kategori: 'border'
        },
        'border-spacing': { values: '*', kategori: 'border' },
        'outline': { values: '*', kategori: 'border' },
        'outline-width': { values: '*', kategori: 'border' },
        'outline-style': {
            values: ['none', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset', 'inherit'],
            kategori: 'border'
        },
        'outline-color': { values: '*', kategori: 'border' },
        'outline-offset': { values: '*', kategori: 'border' },

        // === POSISI ===
        'top': { values: '*', kategori: 'posisi' },
        'right': { values: '*', kategori: 'posisi' },
        'bottom': { values: '*', kategori: 'posisi' },
        'left': { values: '*', kategori: 'posisi' },

        // === TIPOGRAFI ===
        'font': { values: '*', kategori: 'tipografi' },
        'font-family': { values: '*', kategori: 'tipografi' },
        'font-size': { values: '*', kategori: 'tipografi' },
        'font-style': {
            values: ['normal', 'italic', 'oblique', 'inherit'],
            kategori: 'tipografi'
        },
        'font-variant': {
            values: ['normal', 'small-caps', 'inherit'],
            kategori: 'tipografi'
        },
        'font-weight': {
            values: ['normal', 'bold', 'bolder', 'lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900', 'inherit'],
            kategori: 'tipografi'
        },
        'color': { values: '*', kategori: 'tipografi' },
        'line-height': { values: '*', kategori: 'tipografi' },
        'letter-spacing': { values: '*', kategori: 'tipografi' },
        'word-spacing': { values: '*', kategori: 'tipografi' },
        'text-align': {
            values: ['left', 'right', 'center', 'justify', 'inherit'],
            kategori: 'tipografi'
        },
        'text-decoration': {
            values: ['none', 'underline', 'overline', 'line-through', 'blink', 'inherit'],
            kategori: 'tipografi'
        },
        'text-indent': { values: '*', kategori: 'tipografi' },
        'text-transform': {
            values: ['none', 'capitalize', 'uppercase', 'lowercase', 'inherit'],
            kategori: 'tipografi'
        },
        'text-shadow': { values: '*', kategori: 'tipografi' },
        'vertical-align': {
            values: ['baseline', 'sub', 'super', 'top', 'text-top', 'middle', 'bottom', 'text-bottom', 'inherit'],
            kategori: 'tipografi'
        },
        'white-space': {
            values: ['normal', 'pre', 'nowrap', 'pre-wrap', 'pre-line', 'inherit'],
            kategori: 'tipografi'
        },
        'word-break': {
            values: ['normal', 'break-all', 'keep-all', 'inherit'],
            kategori: 'tipografi'
        },
        'word-wrap': {
            values: ['normal', 'break-word'],
            kategori: 'tipografi'
        },
        'text-overflow': {
            values: ['clip', 'ellipsis', 'inherit'],
            kategori: 'tipografi'
        },

        // === BACKGROUND ===
        'background': { values: '*', kategori: 'background' },
        'background-color': { values: '*', kategori: 'background' },
        'background-image': { values: '*', kategori: 'background' },
        'background-repeat': {
            values: ['repeat', 'repeat-x', 'repeat-y', 'no-repeat', 'inherit'],
            kategori: 'background'
        },
        'background-attachment': {
            values: ['scroll', 'fixed', 'local', 'inherit'],
            kategori: 'background'
        },
        'background-position': { values: '*', kategori: 'background' },
        'background-size': { values: '*', kategori: 'background' },
        'background-origin': {
            values: ['padding-box', 'border-box', 'content-box'],
            kategori: 'background'
        },
        'background-clip': {
            values: ['border-box', 'padding-box', 'content-box'],
            kategori: 'background'
        },

        // === LIST ===
        'list-style': { values: '*', kategori: 'list' },
        'list-style-type': {
            values: ['disc', 'circle', 'square', 'decimal', 'decimal-leading-zero', 'lower-roman', 'upper-roman', 'lower-greek', 'lower-latin', 'upper-latin', 'armenian', 'georgian', 'lower-alpha', 'upper-alpha', 'none', 'inherit'],
            kategori: 'list'
        },
        'list-style-position': {
            values: ['inside', 'outside', 'inherit'],
            kategori: 'list'
        },
        'list-style-image': { values: '*', kategori: 'list' },

        // === TABLE ===
        'table-layout': {
            values: ['auto', 'fixed', 'inherit'],
            kategori: 'table'
        },
        'caption-side': {
            values: ['top', 'bottom', 'inherit'],
            kategori: 'table'
        },
        'empty-cells': {
            values: ['show', 'hide', 'inherit'],
            kategori: 'table'
        },

        // === EFEK (CSS 3.0) ===
        'box-shadow': { values: '*', kategori: 'efek' },
        'opacity': { values: '*', kategori: 'efek' },
        'transform': { values: '*', kategori: 'efek' },
        'transform-origin': { values: '*', kategori: 'efek' },
        'transform-style': {
            values: ['flat', 'preserve-3d'],
            kategori: 'efek'
        },
        'transition': { values: '*', kategori: 'efek' },
        'transition-property': { values: '*', kategori: 'efek' },
        'transition-duration': { values: '*', kategori: 'efek' },
        'transition-timing-function': {
            values: ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'step-start', 'step-end', 'steps', 'cubic-bezier'],
            kategori: 'efek'
        },
        'transition-delay': { values: '*', kategori: 'efek' },
        'animation': { values: '*', kategori: 'efek' },
        'animation-name': { values: '*', kategori: 'efek' },
        'animation-duration': { values: '*', kategori: 'efek' },
        'animation-timing-function': {
            values: ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'step-start', 'step-end', 'steps', 'cubic-bezier'],
            kategori: 'efek'
        },
        'animation-delay': { values: '*', kategori: 'efek' },
        'animation-iteration-count': {
            values: '*',
            kategori: 'efek'
        },
        'animation-direction': {
            values: ['normal', 'reverse', 'alternate', 'alternate-reverse'],
            kategori: 'efek'
        },
        'animation-fill-mode': {
            values: ['none', 'forwards', 'backwards', 'both'],
            kategori: 'efek'
        },
        'animation-play-state': {
            values: ['running', 'paused'],
            kategori: 'efek'
        },

        // === USER INTERFACE ===
        'cursor': {
            values: ['auto', 'default', 'none', 'context-menu', 'help', 'pointer', 'progress', 'wait', 'cell', 'crosshair', 'text', 'vertical-text', 'alias', 'copy', 'move', 'no-drop', 'not-allowed', 'e-resize', 'n-resize', 'ne-resize', 'nw-resize', 's-resize', 'se-resize', 'sw-resize', 'w-resize', 'ew-resize', 'ns-resize', 'nesw-resize', 'nwse-resize', 'col-resize', 'row-resize', 'all-scroll', 'zoom-in', 'zoom-out', 'grab', 'grabbing', 'inherit'],
            kategori: 'ui'
        },
        'resize': {
            values: ['none', 'both', 'horizontal', 'vertical', 'inherit'],
            kategori: 'ui'
        },
        'user-select': {
            values: ['auto', 'none', 'text', 'all', 'element', 'inherit'],
            kategori: 'ui'
        },
        'box-sizing': {
            values: ['content-box', 'border-box', 'inherit'],
            kategori: 'ui'
        },

        // === CONTENT ===
        'content': { values: '*', kategori: 'content' },
        'quotes': { values: '*', kategori: 'content' },
        'counter-reset': { values: '*', kategori: 'content' },
        'counter-increment': { values: '*', kategori: 'content' },

        // === MISC ===
        'direction': {
            values: ['ltr', 'rtl', 'inherit'],
            kategori: 'misc'
        },
        'unicode-bidi': {
            values: ['normal', 'embed', 'bidi-override', 'inherit'],
            kategori: 'misc'
        },
        'unicode-range': { values: '*', kategori: 'misc' },

        // === IE / CSS HACK COMPATIBILITY ===
        // Properti ini dipakai di CSS lama untuk IE / browser lama.
        // Tidak masuk CSS standar tapi sering dipakai di CSS 2.1 era.
        'filter': { values: '*', kategori: 'misc' },         // CSS 3.0 Filter Effects + IE filter hack
        'zoom': { values: '*', kategori: 'misc' },           // IE extension, didukung semua browser untuk backward compat
        'text-justify': { values: '*', kategori: 'misc' },   // CSS 3.0 Text Module

        // === WORD/TEXT WRAPPING (CSS 3.0 Text) ===
        'hyphens': {
            values: ['none', 'manual', 'auto', 'inherit'],
            kategori: 'tipografi'
        },
        'tab-size': { values: '*', kategori: 'tipografi' },
        'text-align-last': {
            values: ['auto', 'left', 'right', 'center', 'justify', 'start', 'end', 'inherit'],
            kategori: 'tipografi'
        },
        'text-emphasis': { values: '*', kategori: 'tipografi' },
        'text-emphasis-color': { values: '*', kategori: 'tipografi' },
        'text-emphasis-position': { values: '*', kategori: 'tipografi' },
        'text-emphasis-style': { values: '*', kategori: 'tipografi' },
        'text-underline-position': { values: '*', kategori: 'tipografi' }
    },

    /* === SELECTOR YANG DIDUKUNG === */
    selector: {
        // Pseudo-class CSS 2.1
        ':link': true,
        ':visited': true,
        ':active': true,
        ':hover': true,
        ':focus': true,
        ':lang': true,
        ':first-child': true,
        // Pseudo-class CSS 3.0
        ':root': true,
        ':last-child': true,
        ':first-of-type': true,
        ':last-of-type': true,
        ':only-child': true,
        ':only-of-type': true,
        ':empty': true,
        ':target': true,
        ':enabled': true,
        ':disabled': true,
        ':checked': true,
        ':indeterminate': true,
        ':not': true,
        ':nth-child': true,
        ':nth-last-child': true,
        ':nth-of-type': true,
        ':nth-last-of-type': true,
        // Pseudo-element CSS 2.1/3.0
        '::before': true,
        '::after': true,
        '::first-line': true,
        '::first-letter': true,
        '::selection': true,
        // Pseudo-class CSS 3.0 UI
        ':default': true,
        ':valid': true,
        ':invalid': true,
        ':in-range': true,
        ':out-of-range': true,
        ':required': true,
        ':optional': true,
        ':read-only': true,
        ':read-write': true
    },

    /* === FUNGSI YANG DIDUKUNG ===
       Fungsi CSS yang boleh dipakai di value.
       */
    fungsi: {
        'rgb': true,
        'rgba': true,
        'hsl': true,
        'hsla': true,
        'url': true,
        'attr': true,
        'counter': true,
        'counters': true,
        'linear-gradient': true,
        'radial-gradient': true,
        'repeating-linear-gradient': true,
        'repeating-radial-gradient': true,
        'translate': true,
        'translateX': true,
        'translateY': true,
        'translateZ': true,
        'translate3d': true,
        'rotate': true,
        'rotateX': true,
        'rotateY': true,
        'rotateZ': true,
        'rotate3d': true,
        'scale': true,
        'scaleX': true,
        'scaleY': true,
        'scaleZ': true,
        'scale3d': true,
        'skew': true,
        'skewX': true,
        'skewY': true,
        'matrix': true,
        'matrix3d': true,
        'perspective': true,
        'cubic-bezier': true,
        'steps': true,
        'repeat': true,
        'repeatX': true,
        'repeatY': true,
        'no-repeat': true,
        'local': true,
        'rect': true
        // CATATAN: calc(), min(), max(), clamp() TIDAK didukung (CSS modern)
        // CATATAN: var() TIDAK didukung (CSS custom properties)
    },

    /* === UNIT YANG DIDUKUNG === */
    unit: {
        'px': true, 'em': true, 'rem': true,
        'pt': true, 'pc': true, 'in': true, 'cm': true, 'mm': true,
        'ex': true, 'ch': true,
        '%': true,
        'vw': true, 'vh': true,
        'vmin': true, 'vmax': true,
        'deg': true, 'grad': true, 'rad': true, 'turn': true,
        'ms': true, 's': true,
        'Hz': true, 'kHz': true,
        'dpi': true, 'dpcm': true, 'dppx': true,
        'fr': false  // fr adalah unit grid, TIDAK didukung
    },

    /* === KEYWORD GLOBAL === */
    keyword: {
        'inherit': true,
        'initial': true,  // CSS 3.0
        'unset': false,   // CSS Cascade 4, TIDAK didukung
        'revert': false   // CSS Cascade 5, TIDAK didukung
    },

    /* === AT-RULES YANG DIDUKUNG === */
    atRule: {
        '@import': true,
        '@media': true,
        '@font-face': true,
        '@keyframes': true,
        '@charset': true,
        '@page': true,
        '@supports': false,    // CSS Conditional 3, TIDAK didukung
        '@document': false,    // TIDAK didukung
        '@namespace': false    // TIDAK didukung
    },

    /* === KELAS PSEUDO YANG DIPETAKAN OTOMATIS ===
       Scanner cari kelas .pondasi-* atau kelas umum, lalu cek pseudo-nya.
       */
    pseudoKelas: [
        'hover', 'active', 'focus', 'visited', 'link',
        'target', 'checked', 'disabled', 'enabled',
        'first-child', 'last-child', 'only-child',
        'first-of-type', 'last-of-type', 'only-of-type',
        'empty', 'valid', 'invalid', 'required', 'optional'
    ],

    /* === FORMAT KOMENTAR KATEGORI ===
       Standar: /* @kategori: Nama Kategori *\/
       Scanner parse komentar ini untuk mengelompokkan kelas.
       */
    formatKategori: /\/\*\s*@kategori\s*:\s*(.+?)\s*\*\//i,

    /* === HELPER: cek apakah properti valid === */
    propertiValid: function(prop) {
        return Object.prototype.hasOwnProperty.call(this.properti, prop);
    },

    /* === HELPER: cek apakah value valid untuk properti === */
    valueValid: function(prop, value) {
        if (!this.propertiValid(prop)) return false;
        var spec = this.properti[prop];
        if (spec.values === '*') return true;  // value apa saja diterima
        // Normalize value: lowercase + trim
        var v = (value || '').toString().toLowerCase().trim();
        // Bisa multiple values dipisah spasi (mis. "1px solid #000")
        var parts = v.split(/\s+/);
        for (var i = 0; i < parts.length; i++) {
            if (spec.values.indexOf(parts[i]) < 0) {
                // Cek apakah value mengandung fungsi (mis. rgb(), url())
                var hasFunction = false;
                for (var fn in this.fungsi) {
                    if (parts[i].indexOf(fn + '(') >= 0) {
                        hasFunction = true;
                        break;
                    }
                }
                if (!hasFunction) return false;
            }
        }
        return true;
    },

    /* === HELPER: cek apakah value mengandung pattern terlarang ===
       Contoh: var(--xxx), calc(...), clamp(...), min(...), max(...)
       */
    valueMengandungTerlarang: function(value) {
        var v = (value || '').toString().toLowerCase();
        var terlarang = ['var(', 'calc(', 'clamp(', 'min(', 'max('];
        for (var i = 0; i < terlarang.length; i++) {
            if (v.indexOf(terlarang[i]) >= 0) return terlarang[i].replace('(', '');
        }
        return null;
    },

    /* === HELPER: cek apakah value mengandung keyword value terlarang ===
       Contoh: display: flex/grid/inline-flex/inline-grid
                position: sticky (sebagai mock — butuh prefix)
                gap di property yang tidak mendukung
       Return: string keyword terlarang yang ditemukan, atau null kalau valid.
       */
    valueTerlarang: function(prop, value) {
        if (!value) return null;
        var v = (value || '').toString().toLowerCase().trim();
        var p = (prop || '').toString().toLowerCase().trim();

        // display: flex/grid (CSS modern)
        if (p === 'display') {
            var flexGridKeywords = ['flex', 'inline-flex', 'grid', 'inline-grid', 'contents', 'run-in', 'flow-root', 'ruby', 'ruby-base', 'ruby-text'];
            // Cek exact match atau token di multi-value
            var tokens = v.split(/\s+/);
            for (var i = 0; i < tokens.length; i++) {
                if (flexGridKeywords.indexOf(tokens[i]) >= 0) {
                    return tokens[i];
                }
            }
        }

        // position: sticky diterima (di spec), tapi kalau user tulis tanpa prefix
        // sebenarnya butuh -webkit-sticky untuk Safari lama. Tidak kita tolak di sini.

        // gap / row-gap / column-gap sebagai PROPERTY sudah ditolak di propertiTerlarang.
        // Tapi user bisa tulis "gap: 1rem" sebagai shorthand di property lain (jarang) — skip.

        // Cek keyword terlarang global di value manapun
        var keywordTerlarangGlobal = [];
        var found = null;
        for (var j = 0; j < keywordTerlarangGlobal.length; j++) {
            if (v.indexOf(keywordTerlarangGlobal[j]) >= 0) {
                found = keywordTerlarangGlobal[j];
                break;
            }
        }
        return found;
    },

    /* === HELPER: cek apakah properti terlarang (flex/grid) === */
    propertiTerlarang: function(prop) {
        var terlarang = [
            'flex', 'flex-direction', 'flex-wrap', 'flex-flow',
            'flex-grow', 'flex-shrink', 'flex-basis',
            'justify-content', 'justify-items', 'justify-self',
            'align-items', 'align-content', 'align-self',
            'order',
            'gap', 'grid-gap', 'column-gap', 'row-gap',
            'grid', 'grid-template', 'grid-template-columns', 'grid-template-rows',
            'grid-template-areas', 'grid-area',
            'grid-column', 'grid-column-start', 'grid-column-end',
            'grid-row', 'grid-row-start', 'grid-row-end',
            'grid-auto-columns', 'grid-auto-rows', 'grid-auto-flow'
        ];
        return terlarang.indexOf(prop) >= 0;
    }
};
