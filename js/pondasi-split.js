/* PONDASI-SPLIT.JS */
var P = P || {};

    /* ======================================================================
       SELEKSI & NAVIGASI
       ====================================================================== */
    P.setActive = function(id) {
        P.STATE.activeId = id;
    }

    P.clearSelection = function() {
        P.STATE.selectedIds = [];
    }

    P.addToSelection = function(id) {
        if (P.STATE.selectedIds.indexOf(id) < 0 && id !== P.STATE.activeId) {
            P.STATE.selectedIds.push(id);
        }
    }

    /* ======================================================================
       LOCK REGION — toggle lock pada region aktif
       Region terkunci tidak bisa: split, add column, delete, swap, merge, yank, cut, drag.
       Lock hanya editor state (tidak diekspor ke HTML).
       ====================================================================== */
    P.toggleLockRegion = function() {
        var node = P.getById(P.STATE.activeId);
        if (!node) {
            P.flash('Tidak ada region terpilih');
            return;
        }
        node.locked = !node.locked;
        P.save();
        P.render();
        if (P.renderPanel) P.renderPanel();
        P.flash(node.locked ? 'Region terkunci (l untuk buka)' : 'Region tidak terkunci');
    }

    /* Cek apakah region aktif (atau salah satu region terpilih) terkunci.
       Dipanggil oleh handler split/delete/swap/dll sebelum eksekusi. */
    P.regionTerkunci = function() {
        // Cek region aktif
        var node = P.getById(P.STATE.activeId);
        if (node && node.locked) return true;
        // Cek region terpilih (multi-select)
        for (var i = 0; i < P.STATE.selectedIds.length; i++) {
            var sel = P.getById(P.STATE.selectedIds[i]);
            if (sel && sel.locked) return true;
        }
        return false;
    }

    // Navigasi: pakai geometri. Cari region leaf (child/sub-child tanpa anak) yang
    // visible di canvas, lalu pilih yang terdekat di arah panah.
    // Parent/grand-parent tidak bisa jadi target navigasi (hanya via breadcrumb).
    P.navigate = function(direction) {
        var canvas = document.getElementById('canvas');
        if (!canvas) return;

        // Kumpulkan semua region leaf yang visible
        var leaves = [];
        var allRegions = canvas.querySelectorAll('.pondasi-region');
        Array.prototype.forEach.call(allRegions, function (r) {
            var id = r.dataset.id;
            var node = P.getById(id);
            if (!node) return;
            // Hanya leaf (child/sub-child/sub-parent/sub-child tanpa anak) ATAU
            // parent/sub-parent dengan 0 anak (section kosong)
            if (node.children.length === 0) {
                leaves.push({ id: id, rect: r.getBoundingClientRect() });
            }
        });

        if (leaves.length === 0) return;

        // Aktif saat ini
        var activeEl = canvas.querySelector('.pondasi-active');
        var activeRect = activeEl ? activeEl.getBoundingClientRect() : null;
        if (!activeRect) {
            // Tidak ada aktif — pilih leaf pertama
            P.setActive(leaves[0].id);
            P.clearSelection();
            P.render();
            return;
        }

        var activeCx = activeRect.left + activeRect.width / 2;
        var activeCy = activeRect.top + activeRect.height / 2;

        // Cari leaf terdekat di arah panah
        var best = null;
        var bestScore = Infinity;
        leaves.forEach(function (leaf) {
            if (leaf.id === P.STATE.activeId) return;
            var cx = leaf.rect.left + leaf.rect.width / 2;
            var cy = leaf.rect.top + leaf.rect.height / 2;
            var dx = cx - activeCx;
            var dy = cy - activeCy;

            // Cek apakah leaf ada di arah yang benar
            var inDirection = false;
            var primaryAxis = 0;
            var secondaryAxis = 0;

            if (direction === 'right') {
                if (dx > 0) inDirection = true;
                primaryAxis = dx;
                secondaryAxis = Math.abs(dy);
            } else if (direction === 'left') {
                if (dx < 0) inDirection = true;
                primaryAxis = -dx;
                secondaryAxis = Math.abs(dy);
            } else if (direction === 'down') {
                if (dy > 0) inDirection = true;
                primaryAxis = dy;
                secondaryAxis = Math.abs(dx);
            } else if (direction === 'up') {
                if (dy < 0) inDirection = true;
                primaryAxis = -dy;
                secondaryAxis = Math.abs(dx);
            }

            if (!inDirection) return;

            // Skor: prioritaskan region di arah yang benar (primary),
            // lalu minimalkan offset di axis lain (secondary).
            // Skor = primaryAxis + secondaryAxis * 2 (berat)
            var score = primaryAxis + secondaryAxis * 2;
            if (score < bestScore) {
                bestScore = score;
                best = leaf;
            }
        });

        if (best) {
            P.setActive(best.id);
            P.clearSelection();
            P.render();
        }
    }

    P.extendSelection = function(direction) {
        // Pakai geometri juga — cari sibling di arah panah, tambahkan ke seleksi
        var canvas = document.getElementById('canvas');
        if (!canvas) return;

        var allRegions = canvas.querySelectorAll('.pondasi-region');
        var leaves = [];
        Array.prototype.forEach.call(allRegions, function (r) {
            var id = r.dataset.id;
            var node = P.getById(id);
            if (!node) return;
            if (node.children.length === 0) {
                leaves.push({ id: id, rect: r.getBoundingClientRect() });
            }
        });

        if (leaves.length === 0) return;

        var activeEl = canvas.querySelector('.pondasi-active');
        var activeRect = activeEl ? activeEl.getBoundingClientRect() : null;
        if (!activeRect) return;

        var activeCx = activeRect.left + activeRect.width / 2;
        var activeCy = activeRect.top + activeRect.height / 2;

        var best = null;
        var bestScore = Infinity;
        leaves.forEach(function (leaf) {
            if (leaf.id === P.STATE.activeId) return;
            if (P.STATE.selectedIds.indexOf(leaf.id) >= 0) return;
            var cx = leaf.rect.left + leaf.rect.width / 2;
            var cy = leaf.rect.top + leaf.rect.height / 2;
            var dx = cx - activeCx;
            var dy = cy - activeCy;

            var inDirection = false;
            var primaryAxis = 0;
            var secondaryAxis = 0;
            if (direction === 'right') {
                if (dx > 0) inDirection = true;
                primaryAxis = dx;
                secondaryAxis = Math.abs(dy);
            } else if (direction === 'left') {
                if (dx < 0) inDirection = true;
                primaryAxis = -dx;
                secondaryAxis = Math.abs(dy);
            } else if (direction === 'down') {
                if (dy > 0) inDirection = true;
                primaryAxis = dy;
                secondaryAxis = Math.abs(dx);
            } else if (direction === 'up') {
                if (dy < 0) inDirection = true;
                primaryAxis = -dy;
                secondaryAxis = Math.abs(dx);
            }
            if (!inDirection) return;

            var score = primaryAxis + secondaryAxis * 2;
            if (score < bestScore) {
                bestScore = score;
                best = leaf;
            }
        });

        if (best) {
            // Tambahkan aktif sebelumnya + target ke seleksi, lalu set aktif = target
            if (P.STATE.activeId !== best.id && P.STATE.selectedIds.indexOf(P.STATE.activeId) < 0) {
                P.STATE.selectedIds.push(P.STATE.activeId);
            }
            P.setActive(best.id);
            if (P.STATE.selectedIds.indexOf(best.id) < 0) {
                P.STATE.selectedIds.push(best.id);
            }
            P.render();
        }
    }

    /* ======================================================================
       SPLIT LOGIC
       ====================================================================== */

    // Pembagian 50:50 berbasis 12 kolom pondasi:
    // 12 → 6+6, 6 → 3+3, 4 → 2+2, 3 → 1+2, 2 → 1+1, 1 → (tidak bisa)
    P.halfSplit = function(col) {
        var half = Math.floor(col / 2);
        var other = col - half;
        return [half, other];
    }

    // v — split vertikal (kiri-kanan). count = jumlah region hasil (default 2)
    P.splitVertical = function(count) {
        count = count || 2;
        if (count < 1) count = 1;
        if (count > 12) count = 12;

        var node = P.getById(P.STATE.activeId);
        if (!node) return;
        P.pushUndo();

        if (node.type === 'grand-parent') {
            // grand-parent: buat section.baris + N kolom
            var parent = P.nParent();
            var colName = P.colNameForN(count);
            if (!colName) {
                P.flash('Pembagian ' + count + ' tidak didukung');
                return;
            }
            for (var i = 0; i < count; i++) {
                parent.children.push(P.nChildNamed(colName));
            }
            node.children.push(parent);
            P.setActive(parent.children[0].id);
        } else if (node.type === 'parent' || node.type === 'sub-child' || node.type === 'sub-parent') {
            if (node.children.length === 0) {
                // Isi dengan N kolom
                var colName2 = P.colNameForN(count);
                if (!colName2) {
                    P.flash('Pembagian ' + count + ' tidak didukung');
                    return;
                }
                for (var j = 0; j < count; j++) {
                    node.children.push(P.nChildNamed(colName2));
                }
                P.setActive(node.children[0].id);
            } else {
                P.flash('Pilih kolom child dulu lalu v');
                return;
            }
        } else if (node.type === 'child') {
            if (count !== 2) {
                P.flash('Motion split hanya untuk region kosong (section/sub-baris). Untuk kolom, gunakan v (50:50)');
                return;
            }
            // child (kolom): hapus, ganti 2 kolom-N/2 sebagai sibling langsung di parent (TANPA sub-parent)
            P.splitChildVerticalSibling(node);
        }
        P.clearSelection();
        P.save();
        P.render();
    }

    // v di kolom: hapus kolom, ganti 2 kolom-N/2 sebagai sibling langsung di parent
    // Jika kolom punya blocks, semua blocks masuk ke kolom pertama, kolom kedua kosong
    P.splitChildVerticalSibling = function(child) {
        if (!child.col || child.col <= 1) {
            P.flash('Kolom-1 tidak bisa dibelah lagi');
            return;
        }
        var parts = P.halfSplit(child.col);
        var parent = P.getParent(child.id);
        if (!parent) {
            P.flash('Tidak bisa split: tidak ada parent');
            return;
        }
        var idx = parent.children.indexOf(child);
        var newChild1 = P.nChild(parts[0]);
        var newChild2 = P.nChild(parts[1]);
        // Pindahkan blocks dari child ke newChild1
        if (child.blocks && child.blocks.length > 0) {
            newChild1.blocks = child.blocks;
        }
        if (child.content) {
            newChild1.content = child.content;
        }
        parent.children.splice(idx, 1, newChild1, newChild2);
        P.setActive(newChild1.id);
    }

    // h — split horisontal (atas-bawah). count = jumlah region hasil (default 2)
    P.splitHorizontal = function(count) {
        count = count || 2;
        if (count < 1) count = 1;
        if (count > 12) count = 12;

        var node = P.getById(P.STATE.activeId);
        if (!node) return;
        P.pushUndo();

        if (node.type === 'grand-parent') {
            for (var i = 0; i < count; i++) {
                node.children.push(P.nParent());
            }
            // Set active ke section terakhir
            if (count > 0) P.setActive(node.children[node.children.length - 1].id);
        } else if (node.type === 'parent') {
            // Tambah N section.baris sibling di grand-parent
            var gp = P.getParent(node.id);
            if (gp) {
                var idx = gp.children.indexOf(node);
                for (var j = 0; j < count; j++) {
                    var newSibling = P.nParent();
                    gp.children.splice(idx + 1 + j, 0, newSibling);
                }
                P.setActive(gp.children[idx + count].id);
            }
        } else if (node.type === 'sub-child') {
            var sp = P.getParent(node.id);
            if (sp) {
                var idx2 = sp.children.indexOf(node);
                for (var k = 0; k < count; k++) {
                    var newSibling2 = P.nSubChild();
                    sp.children.splice(idx2 + 1 + k, 0, newSibling2);
                }
                P.setActive(sp.children[idx2 + count].id);
            }
        } else if (node.type === 'sub-parent') {
            if (node.children.length === 0) {
                for (var m = 0; m < count; m++) {
                    node.children.push(P.nSubChild());
                }
                P.setActive(node.children[0].id);
            } else {
                P.flash('Sub-parent sudah berisi. Pilih sub-child lalu h');
                return;
            }
        } else if (node.type === 'child') {
            P.flash('Kolom tidak bisa di-h. Gunakan alt+h untuk jadi sub-baris');
            return;
        }
        P.clearSelection();
        P.save();
        P.render();
    }

    // alt+v — split vertikal pada kolom (kolom jadi sub-parent + N kolom proporsional di dalamnya)
    // count = jumlah region hasil (default 2, mendukung motion mis. 3alt+v)
    P.altSplitVertical = function(count) {
        count = count || 2;
        if (count < 1) count = 1;
        if (count > 12) count = 12;
        var node = P.getById(P.STATE.activeId);
        if (!node) return;
        P.pushUndo();

        if (node.type === 'child') {
            P.splitChildVerticalNested(node, count);
        } else if (node.type === 'sub-parent') {
            if (node.children.length === 0) {
                var colName = P.colNameForN(count);
                if (!colName) {
                    P.flash('Pembagian ' + count + ' tidak didukung');
                    return;
                }
                for (var i = 0; i < count; i++) {
                    node.children.push(P.nChildNamed(colName));
                }
                P.setActive(node.children[0].id);
            } else {
                P.flash('Sub-parent sudah berisi. Navigasi ke child lalu alt+v');
                return;
            }
        } else if (node.type === 'sub-child') {
            if (node.children.length === 0) {
                var colName2 = P.colNameForN(count);
                if (!colName2) {
                    P.flash('Pembagian ' + count + ' tidak didukung');
                    return;
                }
                for (var j = 0; j < count; j++) {
                    node.children.push(P.nChildNamed(colName2));
                }
                P.setActive(node.children[0].id);
            } else {
                P.flash('Sub-child sudah berisi. Navigasi ke child lalu alt+v');
                return;
            }
        } else {
            P.flash('alt+v hanya untuk kolom. Navigasi ke kolom dulu.');
            return;
        }
        P.clearSelection();
        P.save();
        P.render();
    }

    // alt+v di kolom: kolom jadi sub-parent (.kolom-N.sub-baris) + N kolom proporsional di dalamnya
    // Untuk N=2 (default): 50:50 (halfSplit). Untuk N>2: pakai colNameForN (sistem 12/10)
    P.splitChildVerticalNested = function(child, count) {
        count = count || 2;
        if (!child.col || child.col <= 1) {
            P.flash('Kolom-1 tidak bisa dibelah lagi');
            return;
        }
        var subParent = P.nSubParent(child.col);
        if (count === 2) {
            // Default 50:50
            var parts = P.halfSplit(child.col);
            subParent.children.push(P.nChild(parts[0]));
            subParent.children.push(P.nChild(parts[1]));
        } else {
            // Motion: N kolom proporsional (sistem 12/10 pondasi)
            var colName = P.colNameForN(count);
            if (!colName) {
                P.flash('Pembagian ' + count + ' tidak didukung');
                return;
            }
            for (var i = 0; i < count; i++) {
                subParent.children.push(P.nChildNamed(colName));
            }
        }
        var parent = P.getParent(child.id);
        if (parent) {
            var idx = parent.children.indexOf(child);
            parent.children[idx] = subParent;
            P.setActive(subParent.children[0].id);
        }
    }

    // alt+h — split horisontal pada kolom (kolom jadi sub-parent + N sub-baris.kolom-12 di dalamnya)
    // count = jumlah sub-baris hasil (default 2, mendukung motion mis. 3alt+h)
    P.altSplitHorizontal = function(count) {
        count = count || 2;
        if (count < 1) count = 1;
        if (count > 12) count = 12;
        var node = P.getById(P.STATE.activeId);
        if (!node) return;
        P.pushUndo();

        if (node.type === 'child') {
            P.splitChildHorizontalNested(node, count);
        } else if (node.type === 'sub-parent') {
            if (node.children.length === 0) {
                // Tambah N sub-baris.kolom-12
                for (var i = 0; i < count; i++) {
                    var sb = P.nSubChild();
                    sb.children.push(P.nChild(12));
                    node.children.push(sb);
                }
                P.setActive(node.children[0].id);
            } else {
                P.flash('Sub-parent sudah berisi. Navigasi ke child lalu alt+h');
                return;
            }
        } else {
            P.flash('alt+h hanya untuk kolom. Navigasi ke kolom dulu.');
            return;
        }
        P.clearSelection();
        P.save();
        P.render();
    }

    // alt+h di kolom: kolom jadi sub-parent (.kolom-N.sub-baris) + N sub-baris.kolom-12 di dalamnya
    // Setiap sub-baris berisi 1 div.kolom-12 (yang memegang font-size, sehingga teks bisa tampil)
    P.splitChildHorizontalNested = function(child, count) {
        count = count || 2;
        if (!child.col) {
            P.flash('Harus kolom-N untuk alt+h');
            return;
        }
        var subParent = P.nSubParent(child.col);
        // Buat N sub-baris, masing-masing berisi 1 kolom-12
        for (var i = 0; i < count; i++) {
            var subBaris = P.nSubChild();
            subBaris.children.push(P.nChild(12));
            subParent.children.push(subBaris);
        }
        var parent = P.getParent(child.id);
        if (parent) {
            var idx = parent.children.indexOf(child);
            parent.children[idx] = subParent;
            P.setActive(subParent.children[0].id);
        }
    }

    /* ======================================================================
       RESIZE — context-aware berdasarkan posisi region
       ======================================================================

       Logika: alt+arrow = arah region tumbuh.
       - Jika ada sibling di arah panah, ambil dari sana (region tumbuh, sibling menyempit).
       - Jika tidak ada sibling di arah panah (region di pojok), region menyempit/memendek
         (beri ke sisi yang ada).

       Untuk horizontal (alt+←/→): region tumbuh ke arah panah.
         alt+→ : tumbuh ke kanan. Ada sibling kanan? Ambil dari sana. Tidak? Beri ke sibling kiri (region menyempit).
         alt+← : tumbuh ke kiri. Ada sibling kiri? Ambil dari sana. Tidak? Beri ke sibling kanan (region menyempit).

       Untuk vertikal (alt+↑/↓): region tumbuh ke arah panah.
         alt+↓ : tumbuh ke bawah. Ada sibling bawah? Ambil dari sana (meninggikan). Tidak? Beri ke sibling atas (memendek).
         alt+↑ : tumbuh ke atas. Ada sibling atas? Ambil dari sana (meninggikan). Tidak? Beri ke sibling bawah (memendek).
    */
    P.resize = function(direction) {
        var node = P.getById(P.STATE.activeId);
        if (!node) return;

        // Kolom ganjil (sistem 10) tidak bisa di-resize
        if (P.isOddCol(node)) {
            P.flash('Kolom ganjil (sistem 10) tidak bisa di-resize. Hapus dan re-split dengan motion (mis. 5v) untuk mengubah pembagian.');
            return;
        }
        P.pushUndo();

        if (node.col !== undefined) {
            // === Horizontal: kolom (inline-block) ===
            if (direction === 'up' || direction === 'down') {
                P.flash('Kolom hanya bisa di-resize dengan alt+← / alt+→');
                return;
            }
            P.resizeKolom(node, direction);
        } else {
            // === Vertikal: baris/sub-baris (block stack) ===
            if (direction === 'left' || direction === 'right') {
                P.flash('Baris hanya bisa di-resize dengan alt+↑ / alt+↓');
                return;
            }
            P.resizeBaris(node, direction);
        }
        P.save();
        P.render();
    }

    // Resize kolom — context-aware berdasarkan posisi kiri/kanan
    P.resizeKolom = function(node, direction) {
        var parent = P.getParent(node.id);
        if (!parent) return;
        var idx = P.getSiblingIndex(node.id);
        var siblings = parent.children;
        var adaKanan = idx < siblings.length - 1;
        var adaKiri = idx > 0;

        if (direction === 'right') {
            // Tumbuh ke kanan
            if (adaKanan && siblings[idx + 1].col > 1) {
                // Ambil dari sibling kanan
                P.setCol(node, node.col + 1);
                P.setCol(siblings[idx + 1], siblings[idx + 1].col - 1);
            } else if (adaKiri && node.col > 1) {
                // Tidak ada sibling kanan (pojok kanan) — menyempit, beri ke sibling kiri
                P.setCol(node, node.col - 1);
                P.setCol(siblings[idx - 1], siblings[idx - 1].col + 1);
            } else if (adaKanan && node.col > 1) {
                // Sibling kanan tidak bisa dikecilkan (kolom-1), beri ke sibling kiri
                if (adaKiri) {
                    P.setCol(node, node.col - 1);
                    P.setCol(siblings[idx - 1], siblings[idx - 1].col + 1);
                } else {
                    P.flash('Tidak ada sibling yang bisa menerima kolom');
                }
            } else {
                P.flash('Tidak bisa melebarkan ke kanan');
            }
        } else if (direction === 'left') {
            // Tumbuh ke kiri
            if (adaKiri && siblings[idx - 1].col > 1) {
                // Ambil dari sibling kiri
                P.setCol(node, node.col + 1);
                P.setCol(siblings[idx - 1], siblings[idx - 1].col - 1);
            } else if (adaKanan && node.col > 1) {
                // Tidak ada sibling kiri (pojok kiri) — menyempit, beri ke sibling kanan
                P.setCol(node, node.col - 1);
                P.setCol(siblings[idx + 1], siblings[idx + 1].col + 1);
            } else if (adaKiri && node.col > 1) {
                // Sibling kiri tidak bisa dikecilkan (kolom-1), beri ke sibling kanan
                if (adaKanan) {
                    P.setCol(node, node.col - 1);
                    P.setCol(siblings[idx + 1], siblings[idx + 1].col + 1);
                } else {
                    P.flash('Tidak ada sibling yang bisa menerima kolom');
                }
            } else {
                P.flash('Tidak bisa melebarkan ke kiri');
            }
        }
    }

    // Resize baris — context-aware berdasarkan posisi atas/bawah
    P.resizeBaris = function(node, direction) {
        var parent = P.getParent(node.id);
        var idx = P.getSiblingIndex(node.id);
        var siblings = parent ? parent.children : [];
        var adaBawah = parent && idx < siblings.length - 1;
        var adaAtas = parent && idx > 0;

        // Inisialisasi h dari tinggi pixel saat ini (jika belum ada)
        var activeEl = document.querySelector('.pondasi-active');
        if (!node.h || node.h <= 0) {
            if (activeEl && activeEl.offsetHeight > 0) {
                node.h = Math.max(1, Math.round(activeEl.offsetHeight / 16));
            } else {
                node.h = 8;
            }
        }

        if (direction === 'down') {
            // Tumbuh ke bawah (meninggikan)
            if (adaBawah) {
                // Ambil dari sibling bawah
                var sbBawah = siblings[idx + 1];
                if (!sbBawah.h || sbBawah.h <= 0) {
                    var elBawah = document.querySelector('.pondasi-region[data-id="' + sbBawah.id + '"]');
                    sbBawah.h = elBawah ? Math.max(1, Math.round(elBawah.offsetHeight / 16)) : 4;
                }
                if (sbBawah.h > 1) {
                    node.h = node.h + 1;
                    sbBawah.h = sbBawah.h - 1;
                } else {
                    P.flash('Sibling bawah tidak bisa dikecilkan lagi');
                }
            } else if (adaAtas) {
                // Tidak ada sibling bawah (region di bawah) — memendek, beri ke sibling atas
                var sbAtas = siblings[idx - 1];
                if (!sbAtas.h || sbAtas.h <= 0) {
                    var elAtas = document.querySelector('.pondasi-region[data-id="' + sbAtas.id + '"]');
                    sbAtas.h = elAtas ? Math.max(1, Math.round(elAtas.offsetHeight / 16)) : 4;
                }
                if (node.h > 1) {
                    node.h = node.h - 1;
                    sbAtas.h = sbAtas.h + 1;
                } else {
                    P.flash('Tidak bisa memendekkan lagi');
                }
            } else {
                // Tidak ada sibling — tetap meninggikan
                node.h = node.h + 1;
            }
        } else if (direction === 'up') {
            // Tumbuh ke atas (meninggikan ke arah atas, atau memendek)
            if (adaAtas) {
                // Ambil dari sibling atas
                var sbAtas2 = siblings[idx - 1];
                if (!sbAtas2.h || sbAtas2.h <= 0) {
                    var elAtas2 = document.querySelector('.pondasi-region[data-id="' + sbAtas2.id + '"]');
                    sbAtas2.h = elAtas2 ? Math.max(1, Math.round(elAtas2.offsetHeight / 16)) : 4;
                }
                if (sbAtas2.h > 1) {
                    node.h = node.h + 1;
                    sbAtas2.h = sbAtas2.h - 1;
                } else {
                    P.flash('Sibling atas tidak bisa dikecilkan lagi');
                }
            } else if (adaBawah) {
                // Tidak ada sibling atas (region di atas) — memendek, beri ke sibling bawah
                var sbBawah2 = siblings[idx + 1];
                if (!sbBawah2.h || sbBawah2.h <= 0) {
                    var elBawah2 = document.querySelector('.pondasi-region[data-id="' + sbBawah2.id + '"]');
                    sbBawah2.h = elBawah2 ? Math.max(1, Math.round(elBawah2.offsetHeight / 16)) : 4;
                }
                if (node.h > 1) {
                    node.h = node.h - 1;
                    sbBawah2.h = sbBawah2.h + 1;
                } else {
                    P.flash('Tidak bisa memendekkan lagi');
                }
            } else {
                // Tidak ada sibling — tetap memendekkan
                node.h = Math.max(1, node.h - 1);
            }
        }
    }

    /* ======================================================================
       SWAP
       ====================================================================== */
    P.swap = function(direction) {
        P.pushUndo();
        var ids = P.STATE.selectedIds.length > 0
            ? [P.STATE.activeId].concat(P.STATE.selectedIds)
            : [P.STATE.activeId];

        // Dedup
        var seen = {};
        ids = ids.filter(function (id) {
            if (seen[id]) return false;
            seen[id] = true;
            return true;
        });

        // === BULK SWAP: kalau ada multi-select, pindah semua sekaligus ===
        if (ids.length > 1) {
            P.swapMultiRegion(ids, direction);
            return;
        }

        // === SINGLE SWAP (existing behavior) ===
        var node = P.getById(P.STATE.activeId);
        if (!node) return;
        var parent = P.getParent(node.id);
        if (!parent) {
            P.flash('Grand-parent tidak bisa di-swap');
            return;
        }
        var idx = P.getSiblingIndex(node.id);
        var siblings = parent.children;
        var swapIdx = -1;
        if (direction === 'left' || direction === 'up') swapIdx = idx - 1;
        else if (direction === 'right' || direction === 'down') swapIdx = idx + 1;

        if (swapIdx >= 0 && swapIdx < siblings.length) {
            var tmp = siblings[idx];
            siblings[idx] = siblings[swapIdx];
            siblings[swapIdx] = tmp;
            P.save();
            P.render();
        }
    }

    /* ======================================================================
       BULK SWAP MULTI-REGION
       - swapMultiRegion(ids, direction): pindah semua region terpilih naik/turun
       - Hanya bekerja kalau semua region ada di parent yang sama
       - Kalau arah=up/left: proses dari index terkecil, swap dengan sebelumnya
       - Kalau arah=down/right: proses dari index terbesar, swap dengan setelahnya
       ====================================================================== */
    P.swapMultiRegion = function(ids, direction) {
        // Ambil node & parent untuk tiap id
        var nodes = ids.map(function (id) { return P.getById(id); }).filter(function (n) { return n; });
        if (nodes.length === 0) return;
        // Semua harus dari parent yang sama
        var firstParent = P.getParent(nodes[0].id);
        if (!firstParent) { P.flash('Grand-parent tidak bisa di-swap'); return; }
        for (var i = 0; i < nodes.length; i++) {
            if (P.getParent(nodes[i].id) !== firstParent) {
                P.flash('Region terpilih harus dari parent yang sama');
                return;
            }
        }
        // Kumpulkan index di parent
        var indexes = nodes.map(function (n) { return firstParent.children.indexOf(n); });
        // Urutkan
        indexes.sort(function (a, b) { return a - b; });
        // Validasi batas
        if (direction === 'up' || direction === 'left') {
            if (indexes[0] <= 0) { P.flash('Sudah di paling atas/kiri'); return; }
        } else {
            if (indexes[indexes.length - 1] >= firstParent.children.length - 1) {
                P.flash('Sudah di paling bawah/kanan');
                return;
            }
        }
        // Lakukan swap
        if (direction === 'up' || direction === 'left') {
            // Naik: proses dari yang terkecil
            for (var j = 0; j < indexes.length; j++) {
                var idx = indexes[j];
                var tmp = firstParent.children[idx - 1];
                firstParent.children[idx - 1] = firstParent.children[idx];
                firstParent.children[idx] = tmp;
            }
        } else {
            // Turun: proses dari yang terbesar
            for (var k = indexes.length - 1; k >= 0; k--) {
                var idx2 = indexes[k];
                var tmp2 = firstParent.children[idx2 + 1];
                firstParent.children[idx2 + 1] = firstParent.children[idx2];
                firstParent.children[idx2] = tmp2;
            }
        }
        // Update activeId ke salah satu region yang dipindah
        // (pertahankan P.STATE.activeId, tapi clear selection jika sudah invalid)
        var activeStillExists = P.getById(P.STATE.activeId) !== null;
        if (!activeStillExists && firstParent.children.length > 0) {
            P.setActive(firstParent.children[0].id);
        }
        // Tetap pertahankan selectedIds (region masih ada, hanya index-nya yang berubah)
        P.save();
        P.render();
        P.flash(nodes.length + ' region dipindah');
    };

    /* ======================================================================
       DELETE
       ====================================================================== */
    P.deleteRegions = function() {
        P.pushUndo();  // simpan state sebelum hapus untuk undo
        var ids = P.STATE.selectedIds.length > 0
            ? [P.STATE.activeId].concat(P.STATE.selectedIds)
            : [P.STATE.activeId];
        // Dedup
        var seen = {};
        ids = ids.filter(function (id) {
            if (seen[id]) return false;
            seen[id] = true;
            return true;
        });

        if (ids.length === 1 && P.getById(ids[0]) === P.STATE.tree) {
            // Grand-parent: bersihkan children saja
            P.STATE.tree.children = [];
            P.setActive(P.STATE.tree.id);
            P.clearSelection();
            P.save();
            P.render();
            return;
        }

        // Kumpulkan semua parent yang akan terpengaruh
        var affectedParents = {};
        ids.forEach(function (id) {
            var node = P.getById(id);
            if (!node || node === P.STATE.tree) return;
            var parent = P.getParent(id);
            if (!parent) return;
            if (!affectedParents[parent.id]) affectedParents[parent.id] = parent;
        });

        // Hapus region
        var lastParent = null;
        ids.forEach(function (id) {
            var node = P.getById(id);
            if (!node || node === P.STATE.tree) return;
            var parent = P.getParent(id);
            if (!parent) return;
            var idx = parent.children.indexOf(node);
            if (idx >= 0) parent.children.splice(idx, 1);
            lastParent = parent;
        });

        // Untuk tiap parent yang terpengaruh: redistribute kolom sibling yang tersisa
        Object.keys(affectedParents).forEach(function (pid) {
            var parent = affectedParents[pid];
            P.redistributeAfterDelete(parent);
        });

        // Set aktif ke parent dari region terakhir yang dihapus, atau grand-parent
        if (lastParent) {
            P.setActive(lastParent.id);
        } else {
            P.setActive(P.STATE.tree.id);
        }
        P.clearSelection();
        P.save();
        P.render();
    }

    /*
       Redistribute sibling setelah hapus.
       - Jika parent adalah section/sub-baris (anak block stack): tidak perlu redistribute kolom (layout CSS yang atur)
       - Jika parent punya anak kolom (sistem 12 atau 10):
         * Sistem 12 (ada col numerik): bagi ulang 12 ke N sibling yang tersisa
         * Sistem 10 (kolom ganjil): konversi ke sistem 12 sesuai aturan:
           - 5 kolom-lima, hapus 1 → 4 kolom-3 (sistem 12)
           - 7 kolom-tujuh, hapus 1 → 6 kolom-2 (sistem 12)
           - 8 kolom-delapan, hapus 1 → 7 kolom... tidak ada yang proporsional, fallback ke motion split
           - 9 kolom-sembilan, hapus 1 → 8 kolom...
           - 10 kolom-sepuluh, hapus 1 → 9 kolom...
           - 11 kolom-sebelas, hapus 1 → 10 kolom...
       Aturan konversi: cari kelas sistem 12 yang proporsional. Kalau tidak ada, gunakan motion split
       (colNameForN) yang mungkin menghasilkan kelas sistem 10 lagi.
    */
    P.redistributeAfterDelete = function(parent) {
        if (!parent || parent.children.length === 0) return;

        // Cek apakah anak pertama adalah kolom (sistem 10 atau 12)
        var firstChild = parent.children[0];
        if (firstChild.col === undefined && !P.isOddCol(firstChild)) {
            // Anak bukan kolom (section / sub-baris sibling) — tidak perlu redistribute
            return;
        }

        var n = parent.children.length;

        // Cek apakah anak-anak adalah kolom ganjil (sistem 10)
        var allOdd = parent.children.every(function (c) { return P.isOddCol(c); });
        if (allOdd) {
            // Konversi: cari kelas sistem 12 yang proporsional untuk N sibling
            var sys12Col = P.oddToSystem12(n);
            if (sys12Col) {
                // Konversi semua anak ke sistem 12
                parent.children.forEach(function (c) {
                    c.classes = [sys12Col];
                    c.colName = null;
                    var match = /^kolom-(\d+)$/.exec(sys12Col);
                    c.col = match ? parseInt(match[1], 10) : 0;
                });
            } else {
                // Tidak ada konversi sistem 12 yang pas untuk N sibling
                // Pakai motion split (colNameForN) — mungkin hasilnya sistem 10 lagi
                var colName = P.colNameForN(n);
                if (colName) {
                    parent.children.forEach(function (c) {
                        c.classes = [colName];
                        var match2 = /^kolom-(\d+)$/.exec(colName);
                        if (match2) {
                            c.col = parseInt(match2[1], 10);
                            c.colName = null;
                        } else {
                            c.col = 0;
                            var nameMatch = /^kolom-([a-z]+)$/.exec(colName);
                            c.colName = nameMatch ? nameMatch[1] : null;
                        }
                    });
                }
            }
            return;
        }

        // Sistem 12 (atau campuran): redistribute ke N sibling dengan kelas proporsional
        // colNameForN akan pilih sistem 12 untuk N=1,2,3,4,6,12 dan sistem 10 untuk N=5,7,8,9,10,11
        var colName = P.colNameForN(n);
        if (colName) {
            parent.children.forEach(function (c) {
                c.classes = [colName];
                var match = /^kolom-(\d+)$/.exec(colName);
                if (match) {
                    c.col = parseInt(match[1], 10);
                    c.colName = null;
                } else {
                    c.col = 0;
                    var nameMatch = /^kolom-([a-z]+)$/.exec(colName);
                    c.colName = nameMatch ? nameMatch[1] : null;
                }
            });
        }
    }

    /* ======================================================================
       MERGE (j)
       ====================================================================== */
    P.mergeRegions = function() {
        if (P.STATE.selectedIds.length === 0) {
            P.flash('Pilih 2+ region dengan shift+arrow dulu, lalu j');
            return;
        }
        P.pushUndo();
        // Gabung + dedup
        var ids = [P.STATE.activeId].concat(P.STATE.selectedIds);
        var seen = {};
        ids = ids.filter(function (id) {
            if (seen[id]) return false;
            seen[id] = true;
            return true;
        });
        var nodes = ids.map(function (id) { return P.getById(id); }).filter(function (n) { return n; });

        // Semua harus kolom (col !== undefined) & parent sama
        var firstParent = P.getParent(nodes[0].id);
        if (!firstParent) {
            P.flash('Tidak bisa merge grand-parent');
            return;
        }
        for (var i = 0; i < nodes.length; i++) {
            if (P.getParent(nodes[i].id) !== firstParent) {
                P.flash('Region terpilih harus dari parent yang sama');
                return;
            }
            if (nodes[i].col === undefined) {
                P.flash('Merge saat ini hanya untuk kolom-N');
                return;
            }
            // Kolom ganjil (sistem 10) tidak bisa di-merge
            if (P.isOddCol(nodes[i])) {
                P.flash('Kolom ganjil (sistem 10) tidak bisa di-merge. Hapus dan re-split dengan motion untuk mengubah pembagian.');
                return;
            }
        }

        // Urutkan berdasarkan index di parent
        nodes.sort(function (a, b) {
            return firstParent.children.indexOf(a) - firstParent.children.indexOf(b);
        });

        var totalCol = nodes.reduce(function (s, n) { return s + n.col; }, 0);
        if (totalCol > 12) {
            P.flash('Total kolom hasil merge melebihi 12 (' + totalCol + ')');
            return;
        }

        // Set col node pertama, hapus sisanya
        P.setCol(nodes[0], totalCol);
        for (var j = 1; j < nodes.length; j++) {
            var idx = firstParent.children.indexOf(nodes[j]);
            if (idx >= 0) firstParent.children.splice(idx, 1);
        }
        P.setActive(nodes[0].id);
        P.clearSelection();
        P.save();
        P.render();
    }

