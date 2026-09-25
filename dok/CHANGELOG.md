# Changelog

Semua perubahan penting di project ini akan didokumentasikan di sini.

Format berdasarkan [Keep a Changelog](https://keepachangelog.com/id/1.0.0/),
versi mengikuti [Semantic Versioning](https://semver.org/lang/id/spec/v2.0.0.html).

## [v83] — 2026-09-19

### Ditambahkan
- **Tipografi seksi di 49 block skema** yang menampilkan teks ke user. Sebelumnya hanya 3 block (paragraf, heading, tombol) yang punya. Sekarang semua block teks, daftar, kontainer, navigasi, feedback, lainnya, dan form punya seksi Tipografi. Helper `_skemaPesan` dan `_skemaInput` juga diupdate.
- **Validasi value-level di scanner** (`P.CSS_SPEC.valueTerlarang`) — blokir keyword value terlarang per property:
  - `display: flex/grid/inline-flex/inline-grid/contents/run-in/flow-root/ruby*` — semua di-tolak
  - Property terlarang (flex/gap/grid-template-*) tetap di-blok via `propertiTerlarang`
  - `var()`, `calc()`, `clamp()`, `min()`, `max()` tetap di-blok via `valueMengandungTerlarang`
- **@supports validation** — at-rule yang tidak didukung (`@supports`, `@document`, `@namespace`) sekarang ditandai sebagai error dan TIDAK di-recurse ke body-nya. Sebelumnya scanner recurse ke body `@supports` dan silently accept isinya.
- **Balanced-brace parser** (`_parseRulesBalanced`) di `pondasi-scanner.js` dan `pondasi-tema.js`. Ganti regex lama `/([^{}]+)\{([^{}]*)\}/g` yang tidak bisa handle nested `{ }` (mis. `@supports { .test { ... } }`). Sekarang nested at-rules di-parse dengan benar.
- **@media tree-shake** — saat export CSS Build, body `@media` di-recurse dan hanya rule dengan kelas dipakai yang dipertahankan. Sebelumnya semua rule `@media` dipertahankan apa adanya.
- **CSS Kustom validation real-time** — textarea "Inline CSS" di panel Lanjutan sekarang divalidasi oleh scanner saat user mengetik. Status ditampilkan di bawah textarea: hijau "CSS valid" atau merah "Pelanggaran: ...". Sebelumnya textarea ini tidak berfungsi (tidak disimpan ke block).
- **`block.cssKustom` field** — simpan CSS mentah user, di-apply ke DOM block via `terapkanStyleBlock`, di-serialize ke `style` attribute saat export.
- **Panel properti region redesign** — ganti 4 seksi editable (Kelas Kustom, Margin, Padding, Border, Latar & Sudut) dengan struktur baru:
  - **Seksi 1: Hierarki** — folder-tree view dari root ke region aktif. Klik baris untuk navigasi. Indentasi per depth, icon folder/file, badge tipe region, lock icon kalau terkunci.
  - **Seksi 2: Info Region (read-only)** — Tag, Kelas, Tipe, ID Node, Kedalaman, Jumlah Anak, Jumlah Block, Path (full string), Status.
  - **Seksi 3: Kelas dari Tema (read-only)** — kelas pondasi yang aktif di region, dari scanner.
  - **Seksi 4: Aksi** — Tombol Lock/Unlock, Tombol Edit Block (kalau region bisa di-edit).
- **Lock region feature** — `P.toggleLockRegion()` + `P.regionTerkunci()`. Shortcut `l` di luar mode edit toggle lock region aktif. Region terkunci tidak bisa di-split (v/h/alt+v/alt+h), dihapus (Backspace), digabung (j), atau di-cut. Visual: border kuning dashed + ikon gembok di pojok region. Lock hanya editor state, tidak diekspor ke HTML.

### Diubah
- Shortcut `h` (sebelumnya split horizontal, masih berfungsi), `l` (sebelumnya tidak terpakai, sekarang lock region). Navigasi sibling tetap `←`/`→` (arrow keys).
- README.md: tabel shortcut diupdate (`h`/`l` dihapus dari navigasi, `l` ditambahkan untuk lock).
- README.md: bagian Quick Start di-restrukturisasi jadi 3 mode jelas (`file://`, static server, PHP server) dengan tabel perbandingan. Sebelumnya misleading (kelihatannya seakan PHP wajib).
- Help modal di index.html: tambah entry untuk shortcut `l`.

### Dihapus
- 4 seksi editable di panel properti region (Kelas Kustom, Margin, Padding, Border, Latar & Sudut). Region properties sekarang read-only, perubahan region dilakukan via split engine saja (lebih konsisten dengan paradigma vim).

## [v82] — 2026-09-18

### Ditambahkan
- File baru `css/tampilan-tambahan.css` (350+ baris) — definisi CSS stub untuk 16 kelas yang sebelumnya tidak ada: kutipan, kode, hero, modal, drawer, banner, toast, spinner, breadcrumb, pagination, mega-menu, daftar-komponen, timeline, tree-view, header, footer. Plus dark theme overrides.
- Link ke `tampilan-tambahan.css` di `index.html`.
- `aria-label="Tutup panel"` di 5 tombol close sidebar (aksesibilitas).
- `type="button"` di tombol Tutup help modal.
- Dokumentasi: `README.md` (panduan lengkap), `CONTRIBUTING.md` (panduan kontribusi), `ARCHITECTURE.md` (arsitektur teknis), `CHANGELOG.md` (file ini).

### Diubah
- Rename CSS `.pesan-t` → `.pesan`, `.pesan-info-t` → `.pesan-info`, `.pesan-sukses-t` → `.pesan-sukses`, `.pesan-peringatan-t` → `.pesan-peringatan`, `.pesan-error-t` → `.pesan-error` (+ dark theme variants) di `tampilan.css` — supaya match dengan JS skema kelasDefault.
- Skema block `tab`: kelasDefault `'tab'` → `'tab-bilah'` (match CSS existing).
- Konsolidasi CSS rule `.pondasi-floating-btn-active` → `.pondasi-floating-btn-aktif` (standardisasi ke Bahasa Indonesia, konsisten dengan `pondasi-editor-bar-aktif`). Update 8 occurrences di `pondasi-ui.js`.
- `NodeList.forEach` → `Array.prototype.forEach.call` di `pondasi-mega-dropdown.js` (3x) dan `pondasi-project.js` (1x) untuk ES5 compatibility.
- Bump z-index 4 elemen supaya di atas sidebar (10500): `.pondasi-floating-toolbar` (10001 → 10600), `.pondasi-swatches-modal` (10002 → 10600), `.pondasi-tambah-prop-modal` (10003 → 10600), `#block-menu-popup` (10001 → 10600, inline di `pondasi-editor.js`).
- `P.render()` sekarang punya guard `if (!P.STATE.tree) return` supaya tidak crash kalau tree null.
- `P.showHelp()` / `P.hideHelp()` sekarang null-check element `help-modal` sebelum set `.hidden`.
- `handleBeforeUnload` sekarang log error ke console (sebelumnya swallow silently).
- Format tanggal di recent list sekarang pakai relative time ("baru saja", "5 menit lalu", "hari ini 14:30", "kemarin 14:30", "3 hari lalu", "Sen, 14 Sep 2025").
- Validasi nama dokumen: trim + slice(0, 60) supaya tidak break layout recent list.
- Save As sekarang cek duplikat nama → konfirmasi dialog sebelum simpan.
- Filename sanitization: collapse multiple dashes (`My---Project` → `my-project`), strip leading/trailing dash.

### Dihapus
- Dead function `P.exportHTML` di `pondasi-state.js` (90 baris). Sudah digantikan oleh `P.generateExportHTML` di `pondasi-project.js`.
- Dead function `P.handlePropertiChange` di `pondasi-editor.js` (56 baris). Sudah digantikan oleh `P.handlePanelChangeDelegated` di `pondasi-block-panel.js`.
- Dead function `P.updateEditorLabel` dan `P.updateEditorClassInput` di `pondasi-editor.js` (16 baris). Referensi element ID yang tidak ada di HTML.
- Dead function `P.loadCustomCSS`, `P.newTree`, `P.renameProject` di `pondasi-state.js`.
- Dead function `P.tampilkanBuatDokumenPanel` di `pondasi-project.js` (8 baris). Referensi elemen yang tidak ada di HTML.
- Dead branch `P.handlePropertiChange` call di `pondasi-block-panel.js:1914-1916`.
- Dead HTML attribute `data-kelas` di 14 dropdown items di `index.html`.
- Empty CSS rule `body[data-tema="gelap"] .galeri .galeri-item {}` di `tampilan-media.css` (comment-only body).
- Duplikat `vertical-align: middle;` di `pondasi-app.css:2159`.
- Invalid CSS property `tabindex: 0;` di `pondasi-panel-kelas.css:112`.
- 25 `console.log` debug statements dari 7 file (pondasi-class-context.js, pondasi-floating-toolbar.js, pondasi-input.js, pondasi-project.js, pondasi-scanner.js, pondasi-blok-teks.js, pondasi-tema.js). Dipertahankan di `pondasi-init.js` untuk diagnostic.

## [v81] — 2026-09-18

### Ditambahkan
- `P.handleBeforeUnload` — handler beforeunload yang pakai `navigator.sendBeacon` untuk server mode + sync save ke localStorage (supaya data tidak hilang walau tab ditutup abrupt).
- Cek `#pondasi-dialog` dan `#preview-overlay` di `P.semuaModalTutup()` supaya shortcut D/T/S/E/, tidak trigger saat dialog/preview terbuka.
- Guard `P.keluarModeEdit()` di awal `P.openProject()` dan `P.applyTemplate()` supaya `editMode.regionId` tidak stale setelah switch project.
- Auto-recovery di `renderRecentDokumen`: kalau current project dihapus, auto-create "Proyek tanpa judul" + `P.keluarModeEdit()`.
- `aria-hidden` attribute di sidebar (true saat slide-out, false saat aktif) untuk aksesibilitas screen reader.
- Settings field `fontSize` dan `lineHeight` sekarang di-apply ke `document.body.style` di `P.applySettingsKeEditor()` supaya preview editor konsisten dengan export.
- Field `settings` (judul, deskripsi, dimensi, temaWarna) di semua 5 template `pondasi-templates.js`. Sebelumnya branch `if (template.settings)` di `P.applyTemplate` selalu false (dead code).
- JS guard untuk `<details class="-disabled">` via `document.addEventListener('toggle', ...)` supaya tidak bisa di-toggle (attribute `disabled` tidak native untuk details).
- Validasi `currentProjectId` di `P.loadProjects()` — kalau id ada di localStorage tapi tidak ada di projects dict, set null.
- ID collision protection di `P.genProjectId()` — cek `P.STATE.projects[id]`, rekursif kalau sudah ada. Random string dari 4 char → 8 char (~2 milyar kombinasi).
- `P.genId()` juga random 4 char → 8 char.
- Error handling di `P.saveProjects()`: catch `QuotaExceededError` / `SecurityError` / generic, flash peringatan ke user.
- Error handling di `P.loadProjects()`: catch JSON parse error, backup data corrupt ke key `.corrupt-<timestamp>`, reset ke `{}`, flash peringatan.

### Diubah
- Class dialog di `index.html`: hapus suffix `-t` (`lapis-dialog-t` → `lapis-dialog`, `tombol-t tombol-garis` → `tombol tombol-garis`, dll) supaya match dengan CSS yang sudah ada di `tampilan-feedback.css` dan `tampilan-tombol.css`.
- z-index hierarchy: dialog 1000 → 10600, snackbar 1100 → 10700, help-modal 1000 → 10600 (semua di atas sidebar 10500) supaya UI melayang tetap tampil saat sidebar terbuka.
- Shortcut `?` sekarang cek `P.semuaModalTutup()` supaya help tidak muncul di belakang sidebar/dialog.
- Tombol `?` di footer sekarang cek `P.semuaModalTutup()` sebelum `P.showHelp()`.
- Escape handler sekarang prioritas: tutup custom dialog dulu, lalu sidebar, lalu modal lain.
- Label checkbox export "Semua dalam 1 ZIP" → "Inline CSS (1 file HTML)" (lebih akurat dengan behavior aktual).
- `P.renderRecentDokumen` tombol hapus: kalau yang dihapus adalah current project, auto-create baru supaya canvas tidak kosong.
- `P.deleteProject` tidak lagi memanggil `P.storageDelete` (yang recursive). Storage adapter (`P.storageDelete`) sekarang langsung panggil `P.saveProjects()` di fallback path (project sudah dihapus dari in-memory dict oleh pemanggil).
- `P.bukaSidebar` / `P.tutupSidebarKiri` sekarang set/unset `aria-hidden` attribute untuk aksesibilitas.
- Catch block di `P.init` (fallback path) sekarang panggil `P.render()` setelah `P.newProject()` supaya canvas ter-render.
- `P.handleBeforeUnload` (di `registerListeners`) tidak lagi duplikat di `initAfterLoad`. Hanya 1 listener beforeunload sekarang.
- `P.formatTanggal` sekarang pakai relative time untuk < 7 hari, format jam untuk today/yesterday, format tanggal lengkap untuk lebih lama.

### Dihapus
- Dead function `P.tampilkanBuatDokumenPanel` di `pondasi-project.js` (8 baris).
- HTML attribute `disabled` di `<details id="akordion-buat-proyek">` (tidak native untuk details) — ganti ke class `pondasi-sidebar-akordion-disabled` + JS guard.

## [v80] — 2026-09-18

### Diubah
- Hapus sub-seksi "Tampilan" yang muncul setelah "Tipografi" di panel properti block. Field-nya (padding, margin, border, radius, warnaTeks, latar) sudah tercakup di seksi Tata Letak dan seksi Tampilan (Warna & Garis + Tipografi).
- Tambah filter `_sudahTercakup` (32 ID field) supaya field Tampilan yang duplikat di-skip, field unik (mis. `warnaNilai` di block `progress`) otomatis di-merge ke "Warna & Garis".

## [v79] — 2026-09-17

### Ditambahkan
- `pondasi-fields.js` di-load SEBELUM `pondasi-blok-*.js`. Sebelumnya skema modular tidak punya akses ke `P.FIELDS_TIPOGRAFI_UMUM` dll karena load order salah.

## [v78 dan sebelumnya]

Lihat `worklog.md` untuk detail implementasi per versi.
