/* PONDASI-AKSI.JS
   Runtime library untuk aksi JavaScript (klik, scroll, dinamis).
   Dipakai di: editor preview + hasil export HTML.
   Cara pakai: Panggil PondasiAksi.init(document) setelah DOM siap.
   Data attributes:
     data-aksi-klik="toggle-tampil" data-aksi-target="#menu"
     data-aksi-klik="toggle-kelas" data-aksi-target="#el" data-aksi-kelas="aktif"
     data-aksi-klik="navigasi" data-aksi-url="#section"
     data-aksi-klik="alert" data-aksi-pesan="Halo!"
     data-aksi-klik="gulir-ke" data-aksi-target="#section"
     data-aksi-klik="salin" data-aksi-teks="Teks untuk disalin"
     data-aksi-klik="kustom" data-aksi-kode="alert('kustom')"
     data-aksi-scroll="muncul" data-aksi-efek="fade"
     data-aksi-scroll="parallax" data-aksi-kecepatan="0.5"
     data-dinamis="jam" data-format="24"
     data-dinamis="tanggal" data-format="panjang"
     data-dinamis="hitung-mundur" data-aksi-target="2026-12-31T23:59:59"
*/
var PondasiAksi = (function() {

    function init(root) {
        root = root || document;
        bindKlik(root);
        bindScroll(root);
        initDinamis(root);
    }

    /* === KLIK AKSI === */
    function bindKlik(root) {
        var els = root.querySelectorAll('[data-aksi-klik]');
        Array.prototype.forEach.call(els, function(el) {
            if (el._pondasiAksiBound) return;
            el._pondasiAksiBound = true;
            el.addEventListener('click', function(e) {
                var jenis = el.getAttribute('data-aksi-klik');
                var target = el.getAttribute('data-aksi-target');
                var kelas = el.getAttribute('data-aksi-kelas');
                var url = el.getAttribute('data-aksi-url');
                var pesan = el.getAttribute('data-aksi-pesan');
                var teks = el.getAttribute('data-aksi-teks');
                var kode = el.getAttribute('data-aksi-kode');

                switch (jenis) {
                    case 'toggle-tampil':
                        e.preventDefault();
                        var tEl = target ? document.querySelector(target) : null;
                        if (tEl) {
                            if (tEl.style.display === 'none' || tEl.hasAttribute('hidden')) {
                                tEl.style.display = '';
                                tEl.removeAttribute('hidden');
                                tEl.setAttribute('data-aksi-status', 'tampil');
                            } else {
                                tEl.style.display = 'none';
                                tEl.setAttribute('data-aksi-status', 'sembunyi');
                            }
                        }
                        break;

                    case 'toggle-kelas':
                        e.preventDefault();
                        var tkEl = target ? document.querySelector(target) : null;
                        if (tkEl && kelas) {
                            tkEl.classList.toggle(kelas);
                        }
                        break;

                    case 'navigasi':
                        if (url) {
                            if (url.charAt(0) === '#') {
                                e.preventDefault();
                                var navTarget = document.querySelector(url);
                                if (navTarget) navTarget.scrollIntoView({ behavior: 'smooth' });
                            } else {
                                window.location.href = url;
                            }
                        }
                        break;

                    case 'alert':
                        e.preventDefault();
                        if (pesan) alert(pesan);
                        break;

                    case 'gulir-ke':
                        e.preventDefault();
                        var gTarget = target ? document.querySelector(target) : null;
                        if (gTarget) gTarget.scrollIntoView({ behavior: 'smooth' });
                        break;

                    case 'salin':
                        e.preventDefault();
                        if (teks) {
                            if (navigator.clipboard) {
                                navigator.clipboard.writeText(teks);
                            } else {
                                var ta = document.createElement('textarea');
                                ta.value = teks;
                                document.body.appendChild(ta);
                                ta.select();
                                try { document.execCommand('copy'); } catch (err) {}
                                document.body.removeChild(ta);
                            }
                            if (window.PondasiFlash) PondasiFlash('Disalin: ' + teks);
                        }
                        break;

                    case 'kustom':
                        if (kode) {
                            try { (new Function(kode))(); }
                            catch (err) { if (window.console) console.error('[pondasi-aksi] Kustom JS error:', err); }
                        }
                        break;

                    case 'none':
                    default:
                        break;
                }
            });
        });
    }

    /* === SCROLL AKSI === */
    function bindScroll(root) {
        // Muncul saat gulir (fade/slide/zoom)
        var munculEls = root.querySelectorAll('[data-aksi-scroll="muncul"]');
        if (munculEls.length > 0) {
            if ('IntersectionObserver' in window) {
                var observer = new IntersectionObserver(function(entries) {
                    Array.prototype.forEach.call(entries, function(entry) {
                        if (entry.isIntersecting) {
                            var el = entry.target;
                            var efek = el.getAttribute('data-aksi-efek') || 'fade';
                            el.classList.add('pondasi-aksi-muncul-' + efek);
                            el.setAttribute('data-aksi-status', 'tampil');
                            observer.unobserve(el);
                        }
                    });
                }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
                Array.prototype.forEach.call(munculEls, function(el) {
                    el.classList.add('pondasi-aksi-menunggu');
                    observer.observe(el);
                });
            } else {
                // Fallback: langsung tampilkan
                Array.prototype.forEach.call(munculEls, function(el) {
                    el.setAttribute('data-aksi-status', 'tampil');
                });
            }
        }

        // Parallax
        var parallaxEls = root.querySelectorAll('[data-aksi-scroll="parallax"]');
        if (parallaxEls.length > 0) {
            var ticking = false;
            function updateParallax() {
                Array.prototype.forEach.call(parallaxEls, function(el) {
                    var kec = parseFloat(el.getAttribute('data-aksi-kecepatan')) || 0.5;
                    var arah = el.getAttribute('data-aksi-arah') || 'atas';
                    var rect = el.getBoundingClientRect();
                    var windowHeight = window.innerHeight;
                    if (rect.top < windowHeight && rect.bottom > 0) {
                        var offset = (rect.top - windowHeight / 2) * kec * -1;
                        if (arah === 'bawah') offset = offset * -1;
                        el.style.transform = 'translateY(' + offset + 'px)';
                    }
                });
                ticking = false;
            }
            window.addEventListener('scroll', function() {
                if (!ticking) {
                    window.requestAnimationFrame(updateParallax);
                    ticking = true;
                }
            });
            updateParallax();
        }
    }

    /* === BLOCK DINAMIS === */
    function initDinamis(root) {
        var dinamisEls = root.querySelectorAll('[data-dinamis]');
        Array.prototype.forEach.call(dinamisEls, function(el) {
            var jenis = el.getAttribute('data-dinamis');
            var format = el.getAttribute('data-format') || '';

            if (jenis === 'jam') {
                updateJam(el, format);
                setInterval(function() { updateJam(el, format); }, 1000);
            } else if (jenis === 'tanggal') {
                updateTanggal(el, format);
                setInterval(function() { updateTanggal(el, format); }, 60000);
            } else if (jenis === 'hitung-mundur') {
                var target = el.getAttribute('data-aksi-target');
                if (target) {
                    updateHitungMundur(el, target);
                    setInterval(function() { updateHitungMundur(el, target); }, 1000);
                }
            } else if (jenis === 'hitung-naik') {
                var targetVal = parseInt(el.getAttribute('data-aksi-target') || '100', 10);
                var durasi = parseInt(el.getAttribute('data-format') || '2000', 10);
                hitungNaik(el, targetVal, durasi);
            }
        });
    }

    function updateJam(el, format) {
        var d = new Date();
        var jam = d.getHours();
        var menit = d.getMinutes();
        var detik = d.getSeconds();
        var suffix = '';

        if (format === '12') {
            suffix = jam >= 12 ? ' PM' : ' AM';
            jam = jam % 12;
            if (jam === 0) jam = 12;
        }

        var jamStr = (jam < 10 ? '0' : '') + jam;
        var menitStr = (menit < 10 ? '0' : '') + menit;
        var detikStr = (detik < 10 ? '0' : '') + detik;

        el.textContent = jamStr + ':' + menitStr + ':' + detikStr + suffix;
    }

    function updateTanggal(el, format) {
        var d = new Date();
        var hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        var bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        var hariShort = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        var bulanShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
            'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

        var teks = '';
        if (format === 'panjang') {
            teks = hari[d.getDay()] + ', ' + d.getDate() + ' ' + bulan[d.getMonth()] + ' ' + d.getFullYear();
        } else if (format === 'pendek') {
            teks = hariShort[d.getDay()] + ', ' + d.getDate() + ' ' + bulanShort[d.getMonth()] + ' ' + d.getFullYear();
        } else if (format === 'angka') {
            var tgl = (d.getDate() < 10 ? '0' : '') + d.getDate();
            var bln = (d.getMonth() + 1 < 10 ? '0' : '') + (d.getMonth() + 1);
            teks = tgl + '/' + bln + '/' + d.getFullYear();
        } else if (format === 'iso') {
            teks = d.toISOString().split('T')[0];
        } else {
            teks = d.getDate() + ' ' + bulan[d.getMonth()] + ' ' + d.getFullYear();
        }

        el.textContent = teks;
    }

    function updateHitungMundur(el, targetStr) {
        var target = new Date(targetStr).getTime();
        var now = new Date().getTime();
        var selisih = target - now;

        if (selisih <= 0) {
            el.textContent = '00:00:00';
            el.setAttribute('data-aksi-status', 'selesai');
            return;
        }

        var hari = Math.floor(selisih / (1000 * 60 * 60 * 24));
        var jam = Math.floor((selisih % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var menit = Math.floor((selisih % (1000 * 60 * 60)) / (1000 * 60));
        var detik = Math.floor((selisih % (1000 * 60)) / 1000);

        var jamStr = (jam < 10 ? '0' : '') + jam;
        var menitStr = (menit < 10 ? '0' : '') + menit;
        var detikStr = (detik < 10 ? '0' : '') + detik;

        if (hari > 0) {
            el.textContent = hari + 'h ' + jamStr + ':' + menitStr + ':' + detikStr;
        } else {
            el.textContent = jamStr + ':' + menitStr + ':' + detikStr;
        }
    }

    function hitungNaik(el, target, durasi) {
        var start = 0;
        var startTime = null;
        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / durasi, 1);
            var value = Math.floor(progress * (target - start) + start);
            el.textContent = value.toLocaleString('id-ID');
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                el.textContent = target.toLocaleString('id-ID');
            }
        }
        window.requestAnimationFrame(step);
    }

    // Flash helper (kalau tidak ada P.flash)
    function PondasiFlash(msg) {
        if (typeof P !== 'undefined' && P.flash) {
            P.flash(msg);
        }
    }

    return {
        init: init,
        bindKlik: bindKlik,
        bindScroll: bindScroll,
        initDinamis: initDinamis,
        bindSticky: bindSticky,
        bindCarousel: bindCarousel,
        bindTabs: bindTabs,
        bindAccordion: bindAccordion,
        bindModal: bindModal,
        bindOffCanvas: bindOffCanvas,
        bindLightbox: bindLightbox,
        bindTypewriter: bindTypewriter,
        bindScrollProgress: bindScrollProgress
    };
})();

/* === Auto-init saat DOM siap === */
if (typeof P !== 'undefined') {
    P.PondasiAksi = PondasiAksi;
}

/* ======================================================================
   FITUR TAMBAHAN: sticky, carousel, tabs, accordion JS, modal,
   off-canvas, lightbox, typewriter, scroll progress bar
   ====================================================================== */

/* 2. STICKY HEADER + SHRINK */
function bindSticky(root) {
    var els = root.querySelectorAll('[data-aksi-sticky]');
    Array.prototype.forEach.call(els, function(el) {
        var shrinkAt = parseInt(el.getAttribute('data-aksi-shrink-at')) || 100;
        var shrinkClass = el.getAttribute('data-aksi-shrink-class') || 'pondasi-sticky-shrink';
        var ticking = false;
        function update() {
            if (window.scrollY > shrinkAt) {
                el.classList.add(shrinkClass);
                el.setAttribute('data-aksi-status', 'sticky');
            } else {
                el.classList.remove(shrinkClass);
                el.setAttribute('data-aksi-status', 'normal');
            }
            ticking = false;
        }
        window.addEventListener('scroll', function() {
            if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
        });
        update();
    });
}

/* 3. CAROUSEL / SLIDER */
function bindCarousel(root) {
    var els = root.querySelectorAll('[data-aksi-carousel]');
    Array.prototype.forEach.call(els, function(el) {
        var slides = el.querySelectorAll('[data-carousel-slide]');
        if (slides.length === 0) return;
        var current = 0;
        var interval = parseInt(el.getAttribute('data-aksi-interval')) || 4000;
        var auto = el.getAttribute('data-aksi-auto') !== 'false';

        function show(idx) {
            Array.prototype.forEach.call(slides, function(s, i) {
                s.style.display = i === idx ? 'block' : 'none';
            });
            current = idx;
        }
        function next() { show((current + 1) % slides.length); }
        function prev() { show((current - 1 + slides.length) % slides.length); }

        // Nav buttons
        var nextBtn = el.querySelector('[data-carousel-next]');
        var prevBtn = el.querySelector('[data-carousel-prev]');
        if (nextBtn) nextBtn.addEventListener('click', function(e) { e.preventDefault(); next(); });
        if (prevBtn) prevBtn.addEventListener('click', function(e) { e.preventDefault(); prev(); });

        // Dots
        var dots = el.querySelectorAll('[data-carousel-dot]');
        Array.prototype.forEach.call(dots, function(dot, i) {
            dot.addEventListener('click', function(e) { e.preventDefault(); show(i); });
        });

        show(0);
        if (auto) { el._carouselTimer = setInterval(next, interval); }
    });
}

/* 4. TABS (JS switch) */
function bindTabs(root) {
    var els = root.querySelectorAll('[data-aksi-tabs]');
    Array.prototype.forEach.call(els, function(el) {
        var tabs = el.querySelectorAll('[data-tab-trigger]');
        var panels = el.querySelectorAll('[data-tab-panel]');
        Array.prototype.forEach.call(tabs, function(tab, idx) {
            tab.addEventListener('click', function(e) {
                e.preventDefault();
                Array.prototype.forEach.call(tabs, function(t) { t.classList.remove('tab-aktif'); });
                tab.classList.add('tab-aktif');
                Array.prototype.forEach.call(panels, function(p, pi) {
                    p.style.display = pi === idx ? 'block' : 'none';
                });
            });
        });
        // Activate first by default
        if (tabs.length > 0) tabs[0].click();
    });
}

/* 5. ACCORDION (JS allowMultiple) */
function bindAccordion(root) {
    var els = root.querySelectorAll('[data-aksi-akordion]');
    Array.prototype.forEach.call(els, function(el) {
        var allowMultiple = el.getAttribute('data-aksi-multi') === 'true';
        var items = el.querySelectorAll('[data-akordion-item]');
        Array.prototype.forEach.call(items, function(item) {
            var trigger = item.querySelector('[data-akordion-trigger]');
            if (!trigger) trigger = item.querySelector('summary');
            if (!trigger) return;
            trigger.addEventListener('click', function(e) {
                if (allowMultiple) return; // let details toggle naturally
                e.preventDefault();
                var isOpen = item.hasAttribute('open');
                Array.prototype.forEach.call(items, function(it) { it.removeAttribute('open'); });
                if (!isOpen) item.setAttribute('open', 'open');
            });
        });
    });
}

/* 6. MODAL (JS toggle) */
function bindModal(root) {
    // Triggers: [data-aksi-modal="buka"] data-aksi-target="#modal-id"
    var triggers = root.querySelectorAll('[data-aksi-modal="buka"]');
    Array.prototype.forEach.call(triggers, function(trigger) {
        if (trigger._pondasiModalBound) return;
        trigger._pondasiModalBound = true;
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            var target = trigger.getAttribute('data-aksi-target');
            var modal = target ? document.querySelector(target) : null;
            if (modal) {
                modal.style.display = 'block';
                modal.classList.add('modal-tampil');
                modal.setAttribute('data-aksi-status', 'tampil');
            }
        });
    });
    // Close buttons: [data-aksi-modal="tutup"]
    var closers = root.querySelectorAll('[data-aksi-modal="tutup"]');
    Array.prototype.forEach.call(closers, function(closer) {
        if (closer._pondasiModalBound) return;
        closer._pondasiModalBound = true;
        closer.addEventListener('click', function(e) {
            e.preventDefault();
            var modal = closer.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                modal.classList.remove('modal-tampil');
                modal.setAttribute('data-aksi-status', 'sembunyi');
            }
        });
    });
    // Click backdrop to close
    var modals = root.querySelectorAll('.modal');
    Array.prototype.forEach.call(modals, function(modal) {
        if (modal._pondasiBackdropBound) return;
        modal._pondasiBackdropBound = true;
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
                modal.classList.remove('modal-tampil');
            }
        });
    });
}

/* 9. MOBILE OFF-CANVAS */
function bindOffCanvas(root) {
    var triggers = root.querySelectorAll('[data-aksi-offcanvas="buka"]');
    Array.prototype.forEach.call(triggers, function(trigger) {
        if (trigger._pondasiOffBound) return;
        trigger._pondasiOffBound = true;
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            var target = trigger.getAttribute('data-aksi-target');
            var drawer = target ? document.querySelector(target) : null;
            if (drawer) {
                drawer.classList.add('drawer-tampil');
                drawer.setAttribute('data-aksi-status', 'tampil');
                document.body.style.overflow = 'hidden';
            }
        });
    });
    var closers = root.querySelectorAll('[data-aksi-offcanvas="tutup"]');
    Array.prototype.forEach.call(closers, function(closer) {
        if (closer._pondasiOffBound) return;
        closer._pondasiOffBound = true;
        closer.addEventListener('click', function(e) {
            e.preventDefault();
            var drawer = closer.closest('.drawer');
            if (drawer) {
                drawer.classList.remove('drawer-tampil');
                drawer.setAttribute('data-aksi-status', 'sembunyi');
                document.body.style.overflow = '';
            }
        });
    });
}

/* 10. LIGHTBOX IMAGE */
function bindLightbox(root) {
    var triggers = root.querySelectorAll('[data-aksi-lightbox]');
    Array.prototype.forEach.call(triggers, function(trigger) {
        if (trigger._pondasiLightboxBound) return;
        trigger._pondasiLightboxBound = true;
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            var src = trigger.getAttribute('data-aksi-src') || trigger.getAttribute('href') || '';
            var alt = trigger.getAttribute('data-aksi-alt') || trigger.querySelector('img') ? (trigger.querySelector('img').alt || '') : '';
            // Create overlay
            var overlay = document.createElement('div');
            overlay.className = 'pondasi-lightbox-overlay';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:99999;display:flex;align-items:center;justify-content:center;cursor:pointer;';
            var img = document.createElement('img');
            img.src = src;
            img.alt = alt;
            img.style.cssText = 'max-width:90%;max-height:90%;border-radius:4px;box-shadow:0 4px 20px rgba(0,0,0,0.5);';
            overlay.appendChild(img);
            overlay.addEventListener('click', function() {
                document.body.removeChild(overlay);
            });
            document.body.appendChild(overlay);
        });
    });
}

/* 12. TYPEWRITER */
function bindTypewriter(root) {
    var els = root.querySelectorAll('[data-aksi-typewriter]');
    Array.prototype.forEach.call(els, function(el) {
        var text = el.getAttribute('data-aksi-teks') || el.textContent || '';
        var speed = parseInt(el.getAttribute('data-aksi-speed')) || 50;
        el.textContent = '';
        var i = 0;
        function type() {
            if (i < text.length) {
                el.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        type();
    });
}

/* 13. SCROLL PROGRESS BAR */
function bindScrollProgress(root) {
    var bars = root.querySelectorAll('[data-aksi-scroll-progress]');
    Array.prototype.forEach.call(bars, function(bar) {
        bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;background:#00AAD4;z-index:99998;width:0;transition:width 0.1s;';
        var ticking = false;
        function update() {
            var scrollTop = window.scrollY || document.documentElement.scrollTop;
            var scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            var percent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            bar.style.width = percent + '%';
            ticking = false;
        }
        window.addEventListener('scroll', function() {
            if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
        });
        update();
    });
}

/* === Update PondasiAksi.init untuk panggil semua bind functions === */
var originalInit = PondasiAksi.init;
PondasiAksi.init = function(root) {
    root = root || document;
    originalInit(root);
    bindSticky(root);
    bindCarousel(root);
    bindTabs(root);
    bindAccordion(root);
    bindModal(root);
    bindOffCanvas(root);
    bindLightbox(root);
    bindTypewriter(root);
    bindScrollProgress(root);
};
