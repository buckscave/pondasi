/* PONDASI-FLOATING-TOOLBAR.JS
   Floating toolbar untuk inline text formatting (mirip CKEditor classic).
   Muncul saat user seleksi teks di block yang sedang di-edit (contentEditable).
   Toolbar berisi: B, I, S, U, sub, sup — semua inline tag.
   Posisi: di atas seleksi teks, tidak nutup block.
   */
var P = P || {};

P.FloatingToolbar = {
    /* Element toolbar di DOM */
    el: null,

    /* State: sedang aktif atau tidak */
    aktif: false,

    /* Simpan seleksi terakhir (untuk restore setelah klik toolbar) */
    seleksiTersimpan: null,

    /* === INISIALISASI === */
    init: function () {
        if (this.el) return;  // sudah di-init
        var self = this;

        // Buat element toolbar
        this.el = document.createElement('div');
        this.el.className = 'pondasi-floating-toolbar';
        this.el.setAttribute('role', 'toolbar');
        this.el.setAttribute('aria-label', 'Format teks');
        this.el.style.display = 'none';
        this.el.innerHTML =
            '<button type="button" data-cmd="bold" title="Bold (Ctrl+B)" aria-label="Bold"><b>B</b></button>' +
            '<button type="button" data-cmd="italic" title="Italic (Ctrl+I)" aria-label="Italic"><i>I</i></button>' +
            '<button type="button" data-cmd="subscript" title="Subscript" aria-label="Subscript">X<sub>2</sub></button>' +
            '<button type="button" data-cmd="superscript" title="Superscript" aria-label="Superscript">X<sup>2</sup></button>' +
            '<span class="pondasi-floating-toolbar-pemisah"></span>' +
            '<button type="button" data-cmd="removeFormat" title="Hapus format" aria-label="Hapus format">&times;</button>';
        document.body.appendChild(this.el);

        // Pasang event handler
        this.el.addEventListener('mousedown', function (e) {
            // Cegah blur pada block saat klik toolbar
            e.preventDefault();
        });

        this.el.addEventListener('click', function (e) {
            var btn = e.target.closest('button[data-cmd]');
            if (!btn) return;
            var cmd = btn.getAttribute('data-cmd');
            self.eksekusi(cmd);
        });

        // Listen selectionchange untuk update posisi toolbar
        document.addEventListener('selectionchange', function () {
            self.updatePosisi();
        });

        // Listen mouseup (setelah user selesai seleksi teks dengan drag)
        document.addEventListener('mouseup', function (e) {
            // Cek apakah klik di dalam toolbar → jangan trigger update (biarkan click handler kerja)
            if (e.target && e.target.closest && e.target.closest('.pondasi-floating-toolbar')) return;
            setTimeout(function () { self.updatePosisi(); }, 50);
        });

        // Listen keyup (setelah user navigasi dengan keyboard Shift+arrow)
        document.addEventListener('keyup', function (e) {
            if (e.shiftKey || e.key === 'Shift' || e.key.indexOf('Arrow') === 0) {
                setTimeout(function () { self.updatePosisi(); }, 10);
            }
        });

        // Listen Esc untuk tutup toolbar
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && self.aktif) {
                self.tutup();
            }
        });

        // Listen scroll/resize untuk update posisi
        window.addEventListener('scroll', function () {
            if (self.aktif) self.updatePosisi();
        }, true);
        window.addEventListener('resize', function () {
            if (self.aktif) self.updatePosisi();
        });

    },

    /* === TAMPILKAN TOOLBAR === */
    buka: function () {
        if (!this.el) this.init();
        this.el.style.display = 'block';
        this.aktif = true;
        this.updatePosisi();
    },

    /* === TUTUP TOOLBAR === */
    tutup: function () {
        if (!this.el) return;
        this.el.style.display = 'none';
        this.aktif = false;
        this.seleksiTersimpan = null;
    },

    /* === UPDATE POSISI TOOLBAR === */
    updatePosisi: function () {
        if (!this.el) return;

        var sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        // Cek apakah seleksi ada di dalam block yang sedang di-edit (contentEditable)
        var range = sel.getRangeAt(0);
        var container = range.commonAncestorContainer;
        var blockEl = null;
        while (container) {
            if (container.nodeType === 1 && container.contentEditable === 'true') {
                blockEl = container;
                break;
            }
            container = container.parentNode;
        }

        // Kalau tidak ada block editable aktif, tutup toolbar
        if (!blockEl) {
            if (this.aktif) this.tutup();
            return;
        }

        // Toolbar tetap aktif selama di block editable (bahkan kalau selection collapsed)
        if (!this.aktif) this.buka();

        // Simpan seleksi untuk restore setelah klik toolbar (hanya kalau tidak collapsed)
        if (!sel.isCollapsed) {
            this.seleksiTersimpan = sel.getRangeAt(0).cloneRange();
        }

        // Posisi toolbar: menempel di pojok kiri atas block
        // Kalau tidak muat di atas, pindah ke pojok kiri bawah block
        var blockRect = blockEl.getBoundingClientRect();
        var toolbarRect = this.el.getBoundingClientRect();
        var top = blockRect.top - toolbarRect.height - 4;
        var left = blockRect.left;

        // Kalau tidak muat di atas (block di paling atas viewport), pindah ke bawah block
        if (top < 4) {
            top = blockRect.bottom + 4;
        }

        // Clamp horizontal supaya tidak keluar layar
        if (left < 4) left = 4;
        if (left + toolbarRect.width > window.innerWidth - 4) {
            left = window.innerWidth - toolbarRect.width - 4;
        }

        this.el.style.top = top + 'px';
        this.el.style.left = left + 'px';

        // Update tombol aktif (bold/italic/underline) sesuai state seleksi
        this.updateTombolAktif();
    },

    /* === UPDATE TOMBOL AKTIF (bold/italic/underline) === */
    updateTombolAktif: function () {
        if (!this.el) return;
        try {
            var cmds = ['bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript'];
            for (var i = 0; i < cmds.length; i++) {
                var cmd = cmds[i];
                var btn = this.el.querySelector('button[data-cmd="' + cmd + '"]');
                if (!btn) continue;
                try {
                    var isActive = document.queryCommandState(cmd);
                    if (isActive) {
                        btn.classList.add('pondasi-floating-toolbar-aktif');
                    } else {
                        btn.classList.remove('pondasi-floating-toolbar-aktif');
                    }
                } catch (e) {
                    // queryCommandState bisa throw untuk beberapa command di browser tertentu
                }
            }
        } catch (e) {}
    },

    /* === EKSEKUSI COMMAND === */
    eksekusi: function (cmd) {
        // Restore seleksi sebelum eksekusi (karena klik toolbar bisa clear seleksi)
        if (this.seleksiTersimpan) {
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(this.seleksiTersimpan);
        }

        try {
            // Eksekusi command via document.execCommand (deprecated tapi masih works)
            // Fokus ke block editable dulu supaya command jalan
            var sel = window.getSelection();
            if (sel.rangeCount > 0) {
                var range = sel.getRangeAt(0);
                var container = range.commonAncestorContainer;
                while (container) {
                    if (container.nodeType === 1 && container.contentEditable === 'true') {
                        container.focus();
                        break;
                    }
                    container = container.parentNode;
                }
            }

            // Restore seleksi lagi (karena focus bisa clear)
            if (this.seleksiTersimpan) {
                sel.removeAllRanges();
                sel.addRange(this.seleksiTersimpan);
            }

            // Eksekusi
            document.execCommand(cmd, false, null);

            // Update seleksi tersimpan (setelah eksekusi, seleksi mungkin berubah)
            if (sel.rangeCount > 0) {
                this.seleksiTersimpan = sel.getRangeAt(0).cloneRange();
            }

            // Update tombol aktif
            this.updateTombolAktif();

            // Trigger input event di block supaya editor save isi
            var blockEl = this._getActiveBlock();
            if (blockEl) {
                var ev = document.createEvent('Event');
                ev.initEvent('input', true, true);
                blockEl.dispatchEvent(ev);
            }
        } catch (e) {
            console.error('[pondasi FloatingToolbar] error eksekusi ' + cmd + ':', e.message);
        }
    },

    /* === GET ACTIVE BLOCK === */
    _getActiveBlock: function () {
        var sel = window.getSelection();
        if (sel.rangeCount === 0) return null;
        var container = sel.getRangeAt(0).commonAncestorContainer;
        while (container) {
            if (container.nodeType === 1 && container.contentEditable === 'true') {
                return container;
            }
            container = container.parentNode;
        }
        return null;
    }
};
