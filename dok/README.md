# Pondasi

> Web builder offline, gaya vim/tmux, hanya CSS 2.1–3.0, ES5 murni, tanpa dependensi.

Pondasi adalah web builder untuk orang yang berpikir seperti developer tetapi tidak ingin menulis kode. Berjalan penuh di browser, tanpa server (bisa via `file://`), tanpa framework JS, tanpa preprocessor CSS. Hasil ekspor adalah HTML + CSS murni yang dapat di-hosting di mana saja.

## Daftar Isi

- [Filosofi](#filosofi)
- [Fitur Utama](#fitur-utama)
- [Quick Start](#quick-start)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Arsitektur](#arsitektur)
- [Struktur Folder](#struktur-folder)
- [Modul JS](#modul-js)
- [File CSS](#file-css)
- [Menambah Block Baru](#menambah-block-baru)
- [Menambah Field Baru](#menambah-field-baru)
- [Scanner CSS](#scanner-css)
- [Storage](#storage)
- [Mode Server (Opsional)](#mode-server-opsional)
- [Export](#export)
- [Kontribusi](#kontribusi)
- [Batasan Diketahui](#batasan-diketahui)

---

## Filosofi

Pondasi dibangun di atas empat pilar:

1. **CSS 2.1–3.0 saja** — tidak ada flexbox, tidak ada grid layout, tidak ada CSS variables, tidak ada `clamp()`. Hanya `block`, `inline-block`, `float`, `position`. Alasannya: output harus berjalan di browser lama, dan pondasi.css (framework CSS internal) mengikuti standar Material Design versi lama yang kompatibel dengan IE8+.

2. **ES5 murni** — tidak ada `let`/`const`, tidak ada arrow function, tidak ada `class`, tidak ada template literal, tidak ada `for...of`. Hanya `var`, function declaration, dan `Array.prototype.forEach`. Alasannya: kompatibilitas browser luas, dan menjaga bundle tetap kecil (tidak perlu transpiller).

3. **Tanpa dependensi** — tidak pakai React, tidak pakai jQuery, tidak pakai Bootstrap. Hanya DOM API native. Satu-satunya dependensi eksternal adalah FontAwesome (untuk ikon), yang opsional dan bisa dihapus.

4. **Gaya vim/tmux** — kontrol utama via keyboard, modal/sidebar geser dari samping, command palette berbasis huruf tunggal (D/T/S/E/,/i/k/e). Mouse dipakai untuk seleksi dan drag, bukan untuk navigasi menu.

## Fitur Utama

- **Multi-dokumen** — kelola beberapa dokumen web dalam satu sesi, simpan ke localStorage atau server PHP opsional.
- **Split engine** — bagi region menjadi N kolom (sistem 12 atau 10), otomatis konversi ganjil ke genap saat hapus.
- **Lock region** — kunci region supaya tidak ter-edit tak sengaja (`l` shortcut). Region terkunci tidak bisa di-split/hapus/swap/merge.
- **Block editor** — sisipkan 82 jenis block (teks, gambar, tabel, tombol, kartu, form, navigasi, feedback, dll) via mega-dropdown 2 kolom.
- **Panel properti 4 seksi** — Konten, Tata Letak, Tampilan, Lanjutan. Setiap seksi pakai `<details>` collapsible. Panel region pakai folder-tree hierarchy + info read-only.
- **Scanner CSS** — whitelist properti + value CSS + parser + validator. Blokir `display: flex/grid`, `gap`, `var()`, `calc()`, `@supports`. Kelas yang melanggar spec di-skip, tidak masuk dropdown. CSS Kustom textarea di-validasi real-time.
- **Tree-shaking CSS export** — ekspor hanya CSS untuk kelas yang benar-benar dipakai di tree, termasuk recurse ke `@media` body.
- **State tabs kontekstual** — hanya tampilkan pseudo-class (`:hover`, `:focus`, `:active`) yang benar-benar diubah untuk kelas tertentu.
- **Hybrid editing** — inline override di canvas, otomatis di-clone ke custom CSS saat ekspor.
- **5 template wireframe** — landing page, artikel blog, portfolio, dashboard, form page.
- **Pengaturan per-dokumen** — meta tags, dimensi, tema (terang/gelap), font family, CSS eksternal, script eksternal, aturan grid.
- **Preview in-place** — buka iframe overlay untuk lihat hasil tanpa meninggalkan editor.

## Quick Start

Pondasi berjalan langsung dari folder — tidak perlu build step. Ada 3 mode pemakaian:

### Mode 1: `file://` (paling mudah, tanpa server)

1. Download / clone folder `pondasi/`.
2. Buka `index.html` di browser (double-click, atau via `file://`).
3. Mulai membuat: tekan `v` untuk split, `Enter` untuk masuk mode edit, `i` untuk sisipkan teks.

**Batasan**: tidak bisa fetch CSS eksternal via URL (CORS browser block) — harus pakai file picker (tombol `...` di sidebar buat dokumen). Scanner pakai `getComputedStyle` fallback (bisa lambat).

### Mode 2: Static server (paling praktis, tanpa PHP)

1. Letakkan folder `pondasi/` di document root server statis (Apache, Nginx, XAMPP, Python `http.server`, Node `http-server`, dll).
2. Contoh: `cd pondasi && python3 -m http.server 8000`
3. Akses via `http://localhost:8000/`.

**Keuntungan**: bisa fetch CSS eksternal via URL (relatif atau http://). Scanner full mode (XHR semua berkas tema). Persistence via localStorage.

### Mode 3: PHP server (untuk persistence server-side)

1. Letakkan folder `pondasi/` di document root server PHP.
2. Pastikan `server.php` ada di root folder (sejajar dengan `index.html`).
3. Akses via `http://localhost/pondasi/`.
4. Pondasi akan auto-detect server mode di init dan pakai `server.php` untuk save/load.

**Keuntungan**: save/load project ke filesystem server (file JSON per project). Export file tersimpan di folder `ekspor/` di server. Multi-device: akses project dari device lain.

## Server Requirements

**Pondasi TIDAK wajib pakai server.** Pilih sesuai kebutuhan:

| Mode | Butuh server? | Persistence | CSS eksternal via URL | Export |
|------|---------------|-------------|----------------------|--------|
| `file://` | Tidak | localStorage | ❌ (pakai file picker) | Browser download |
| Static server | Ya (Apache/Nginx/Python) | localStorage | ✓ | Browser download |
| PHP server | Ya (PHP) | Server filesystem | ✓ | Server file + browser download |

**Rekomendasi untuk pemakaian personal**: Mode 2 (static server) paling praktis. Jalankan `python3 -m http.server 8000` di folder pondasi, akses `http://localhost:8000/`.

**Mode `file://`** juga OK kalau tidak butuh fetch CSS eksternal via URL. Cukup double-click `index.html`.

## Keyboard Shortcuts

### Di luar mode edit (region terpilih)

| Tombol | Aksi |
|--------|------|
| `v` | Split region aktif (input jumlah kolom) |
| `V` | Tambah kolom ke region aktif |
| `←` / `→` | Navigasi region sibling (kiri/kanan) |
| `↑` / `↓` | Navigasi region vertikal (atas/bawah) |
| `Shift` + arrow | Multi-select region |
| `Ctrl` + arrow | Pindah semua terpilih |
| `Backspace` | Hapus region aktif (atau semua terpilih) |
| `j` | Gabung region adjacent (untuk kolom) |
| `l` | Kunci/buka kunci region aktif (lock) |
| `u` / `Ctrl+Z` | Undo |
| `r` / `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Enter` | Masuk mode edit |
| `?` | Tampilkan bantuan |
| `D` | Buka panel berkas / dokumen |
| `T` | Buka panel template |
| `S` | Simpan dokumen |
| `E` | Buka panel ekspor |
| `,` | Buka panel pengaturan |
| `Esc` | Bersihkan seleksi / tutup modal |

### Di mode edit (block di region)

| Tombol | Aksi |
|--------|------|
| `i` | Buka/tutup/switch dropdown Isi (paragraf, heading, dll) |
| `k` | Buka/tutup/switch dropdown Komponen (tombol, kartu, form, dll) |
| `e` | Toggle panel properti |
| `↑` / `↓` | Navigasi block aktif |
| `Shift` + `↑/↓` | Multi-select block |
| `Ctrl` + `A` | Pilih semua block |
| `Shift` + klik | Toggle multi-select block individual |
| `Backspace` | Hapus block aktif / terpilih |
| `Ctrl` + `↑/↓` | Reorder block naik/turun |
| `y` | Yank (copy) block |
| `x` | Cut block |
| `p` | Paste block |
| `Enter` | Fokus ke field pertama panel properti |
| `Double-click` block | Edit teks inline (contentEditable) |
| `Drag` block | Reorder via mouse |
| `Esc` | Keluar mode edit |

## Arsitektur

Pondasi terdiri dari 3 lapisan:

```
┌─────────────────────────────────────────────────┐
│  Layer 3: Builder UI (pondasi-app.css + JS)    │  ← Editor chrome, sidebar, floating bar
├─────────────────────────────────────────────────┤
│  Layer 2: Block Editor (pondasi-block-panel.js) │  ← Skema block, panel properti
├─────────────────────────────────────────────────┤
│  Layer 1: Tree Engine (pondasi-state.js,        │  ← Tree data structure, undo/redo
│            pondasi-split.js, pondasi-render.js) │     split engine, render ke DOM
├─────────────────────────────────────────────────┤
│  Layer 0: CSS Framework (pondasi.css,           │  ← Grid 12/10, container, base
│            tampilan.css, tampilan-*.css)         │     Material Design-like styles
└─────────────────────────────────────────────────┘
```

**Layer 0 — CSS Framework**: kelas-kelas CSS yang akan dipakai oleh hasil ekspor (`pondasi.css`, `tampilan.css`, `tampilan-teks.css`, dll). User tidak pernah melihat kode ini, hanya melihat hasilnya di canvas dan di preview.

**Layer 1 — Tree Engine**: data model tree (grand-parent → parent → child → sub-parent → sub-child). Setiap node punya `id`, `type`, `tag`, `classes`, `children`. `pondasi-render.js` mengubah tree menjadi DOM. `pondasi-split.js` menangani logika pembagian region (sistem 12 atau 10 kolom).

**Layer 2 — Block Editor**: ketika user masuk mode edit (tekan `Enter` di region), tree engine pause, dan block editor aktif. User sisipkan block (paragraf, heading, tombol, kartu) ke dalam region. Skema block ada di `../js/pondasi-blok-*.js` (11 file modul per kategori).

**Layer 3 — Builder UI**: chrome editor — floating bar kiri (project management), floating bar kanan (canvas tools), sidebar panel (dokumen, template, save as, export, settings), help modal, dialog konfirmasi, snackbar flash.

## Struktur Folder

```
pondasi/
├── index.html              # Entry point — load semua CSS + JS
├── server.php              # Server PHP opsional untuk save/load
├── css/
│   ├── pondasi.css         # Grid 12/10, container, normalize
│   ├── tampilan.css        # Material Design base theme
│   ├── tampilan-teks.css   # Tipografi
│   ├── tampilan-teks-tambahan.css  # Heading, lead, monospace
│   ├── tampilan-daftar.css # ul/ol/dl
│   ├── tampilan-media.css  # img, figure, galeri
│   ├── tampilan-tabel.css  # table
│   ├── tampilan-tombol.css # button
│   ├── tampilan-form.css   # input, select, textarea, checkbox, radio
│   ├── tampilan-kontainer.css  # card, akordion, hero, modal
│   ├── tampilan-navigasi.css   # nav, breadcrumb, tab, pagination
│   ├── tampilan-feedback.css   # snackbar, dialog, tooltip
│   ├── tampilan-lainnya.css   # chip, badge, avatar, progress
│   ├── tampilan-tambahan.css   # Stub CSS untuk 16 kelas yang sebelumnya missing
│   ├── pondasi-app.css     # Builder chrome (sidebar, floating, panel)
│   ├── pondasi-mega-dropdown.css  # 2-column dropdown
│   ├── pondasi-floating-toolbar.css  # Inline text editor toolbar (B/I/sub/sup)
│   └── pondasi-panel-kelas.css  # Panel properti kelas (details/summary)
├── js/
│   ├── pondasi-state.js    # Tree data, project, undo/redo, save/load
│   ├── pondasi-storage.js  # Storage adapter (localStorage vs server)
│   ├── pondasi-init.js     # Bootstrap, register listeners
│   ├── pondasi-input.js    # Keyboard handler (vim/tmux style)
│   ├── pondasi-ui.js        # Floating bar kanan, help modal
│   ├── pondasi-project.js  # Sidebar panel (dokumen/template/saveas/export/settings)
│   ├── pondasi-templates.js # 5 template wireframe
│   ├── pondasi-render.js    # Tree → DOM
│   ├── pondasi-split.js     # Split engine (region → N kolom)
│   ├── pondasi-editor.js    # Block editor, drag reorder, mode edit
│   ├── pondasi-fields.js    # FIELDS_TIPOGRAFI_UMUM, FIELDS_TATA_LETAK, FIELDS_TAMPILAN_VISUAL
│   ├── pondasi-block-panel.js # Skema block lama + render panel properti block
│   ├── pondasi-blok-teks.js      # Skema: paragraf, heading, kutipan, kode
│   ├── pondasi-blok-daftar.js    # Skema: ul, ol, dl
│   ├── pondasi-blok-media.js     # Skema: gambar, galeri, hr, spacer
│   ├── pondasi-blok-tabel.js     # Skema: table
│   ├── pondasi-blok-tombol.js    # Skema: tombol, grup-tombol
│   ├── pondasi-blok-form.js      # Skema: input, select, checkbox, radio, slider, dll
│   ├── pondasi-blok-kontainer.js # Skema: kartu, akordion, hero, modal, drawer
│   ├── pondasi-blok-navigasi.js  # Skema: nav, breadcrumb, tab, pagination
│   ├── pondasi-blok-feedback.js  # Skema: toast, snackbar, progress, spinner, tooltip
│   ├── pondasi-blok-lainnya.js   # Skema: chip, badge, avatar, daftar-komponen, timeline
│   ├── pondasi-mega-dropdown.js  # Dropdown 2-kolom untuk pilih block
│   ├── pondasi-floating-toolbar.js # Inline text editor (B/I/sub/sup)
│   ├── pondasi-panel-kelas.js    # Panel properti region (kelas kustom)
│   ├── pondasi-class-context.js  # Breadcrumb class, state tabs
│   ├── pondasi-css-spec.js  # Whitelist CSS spec (properti yang diizinkan)
│   ├── pondasi-scanner.js   # Scanner engine (parse CSS, validasi kelas)
│   └── pondasi-tema.js      # Tema manifest + tree-shake CSS
└── server.php              # Endpoint PHP untuk save/load/export
```

## Modul JS

### Load order (penting!)

`index.html` load JS dalam urutan spesifik karena ada dependensi:

1. `pondasi-state.js` — define `P` global, `P.STATE`, factory node (`P.nGrandParent` dll)
2. `pondasi-storage.js` — butuh `P`
3. `pondasi-css-spec.js` — butuh `P`, define `P.CSS_SPEC`
4. `pondasi-scanner.js` — butuh `P.CSS_SPEC`
5. `pondasi-tema.js` — butuh `P`, `P.Scanner`
6. `pondasi-render.js` — butuh `P.STATE`
7. `pondasi-split.js` — butuh `P.STATE`, `P.nChild`, dll
8. `pondasi-editor.js` — butuh `P.STATE`, `P.render`
9. `pondasi-fields.js` — define `P.FIELDS_TIPOGRAFI_UMUM` dll (HARUS sebelum pondasi-blok-*.js)
10. `pondasi-blok-*.js` (11 file) — butuh `P.SKEMA_BLOCK`, `P.FIELDS_*`
11. `pondasi-block-panel.js` — butuh semua skema block
12. `pondasi-mega-dropdown.js`, `pondasi-floating-toolbar.js`, `pondasi-panel-kelas.js`, `pondasi-class-context.js`
13. `pondasi-templates.js` — butuh `P.nGrandParent`, `P.nParent`, `P.nChild`
14. `pondasi-project.js` — butuh `P.STATE`, `P.TEMPLATES`
15. `pondasi-input.js` — butuh semua handler
16. `pondasi-ui.js`
17. `pondasi-init.js` — bootstrap, panggil `P.init()`

### Pola kode

Setiap file JS pakai pola yang sama:

```js
var P = P || {};

P.namaModul = function() { ... };

// Atau attach ke namespace yang sudah ada:
P.STATE = P.STATE || {};
P.STATE.foo = 'bar';
```

Tidak ada IIFE, tidak ada module system. Semua global. Alasannya: ES5 murni, dan bundle tetap kecil karena tidak ada wrapper function per modul.

## File CSS

### Layer 0 (framework, dipakai hasil ekspor)

- `pondasi.css` — Grid 12/10 kolom (`kolom-1` s/d `kolom-12`, `kolom-lima` s/d `kolom-sebelas`), `.baris`, `.sub-baris`, container, normalize.
- `tampilan.css` + `tampilan-*.css` (12 file) — Material Design-like theme: tipografi, daftar, media, tabel, tombol, form, kontainer, navigasi, feedback, lainnya.
- `tampilan-tambahan.css` — Stub CSS untuk 16 kelas yang sebelumnya tidak ada definisi (hero, modal, drawer, banner, breadcrumb, pagination, mega-menu, daftar-komponen, timeline, tree-view, kutipan, kode, toast, spinner, header, footer).

### Layer 3 (builder chrome, tidak diekspor)

- `pondasi-app.css` — Sidebar, floating bar, footer, statusline, help modal, swatches, guide overlay, grid overlay.
- `pondasi-mega-dropdown.css` — 2-kolom dropdown untuk pilih block.
- `pondasi-floating-toolbar.css` — Inline text editor (B/I/sub/sup) muncul saat seleksi teks.
- `pondasi-panel-kelas.css` — Panel properti region dengan details/summary, state tabs.

## Menambah Block Baru

1. **Tambah skema block** di `../js/pondasi-blok-<kategori>.js`:

```js
P.SKEMA_BLOCK['nama-block'] = {
    nama: 'Nama Block',
    tag: 'div',
    kelasDefault: 'nama-kelas',  // harus ada di CSS!
    kategori: 'Kategori',
    kategoriDropdown: 'isi' | 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'isi', label: 'Teks', jenis: 'textarea', placeholder: 'Ketik...' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'nama-kelas' }
        ]},
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
    ]
};
```

2. **Tambah CSS** untuk kelas default di `css/tampilan-<kategori>.css` (atau `tampilan-tambahan.css` kalau belum ada filenya):

```css
.nama-kelas {
    display: block;
    padding: 1rem;
    margin: 1rem 0;
    background-color: #F4F6F8;
    border-radius: 4px;
}
```

3. **Tambah deteksi** di `P.jenisBlock()` (`../js/pondasi-block-panel.js`) supaya block lama yang sudah ada di tree bisa dikenali:

```js
if (kelas.indexOf('nama-kelas') >= 0) return 'nama-block';
```

4. **(Opsional) Tambah ke scanner whitelist** kalau kelas punya pseudo-class yang ingin ditampilkan di state tabs. Edit `../js/pondasi-css-spec.js` kalau perlu tambah properti baru.

## Menambah Field Baru

1. **Definisikan field** di `../js/pondasi-fields.js` (kalau umum) atau di skema block:

```js
P.FIELDS_BARU = [
    { id: 'namaField', label: 'Label Field', jenis: 'teks', placeholder: '...' }
];
```

2. **Tambah mapping** CSS properti di `P.fieldToCssProp` (`../js/pondasi-block-panel.js`):

```js
'namaField': 'css-property-name'
```

3. **(Opsional) Tambah ke tampilanProps** kalau field terkait visual (warna, border, dll) supaya muncul di state tabs. Edit array `tampilanProps` di `P.renderPanelBlock`.

Jenis field yang didukung: `teks`, `textarea`, `angka`, `pilih`, `warna`, `box`, `box-px`, `daftar`, `cek`, `aksi`.

## Scanner CSS

Pondasi punya scanner CSS di `../js/pondasi-scanner.js` yang melakukan 3 hal:

1. **Whitelist** — `P.CSS_SPEC` (`../js/pondasi-css-spec.js`) mendaftar properti CSS yang diizinkan. Properti di luar whitelist ditandai sebagai error.

2. **Parser** — `P.Scanner.scanCSSString(cssText)` parse string CSS, ekstrak kelas + aturan + pseudo-class. Mendukung `@media`, `:hover`, `:focus`, `.kelas.pseudo` compound selector.

3. **Validator** — kelas yang punya properti terlarang (flex, grid, CSS variables) di-skip dari dropdown mega-menu. User diberi peringatan via flash message.

Scanner juga punya `P.Scanner.scanTemaCSS()` yang dijalankan saat init untuk mendapatkan rules + pseudo per kelas dari semua file tema CSS. Hasilnya dipakai oleh state tabs kontekstual di panel properti.

## Storage

Pondasi mendukung 2 mode storage:

### Mode localStorage (default)

- Dipakai otomatis kalau halaman dibuka via `file://` atau server PHP tidak tersedia.
- Key: `pondasi.projects.v2` (semua project dict), `pondasi.current.v2` (id project aktif).
- Sync, jamin tidak hilang walau tab ditutup abrupt.
- Migrasi otomatis dari `pondasi.tree.v1` (format lama) di `P.migrateLegacy()`.

### Mode server PHP

- Dipakai otomatis kalau `server.php` terdeteksi di root URL.
- Endpoint: `?action=ping|list|read|write|delete|export`.
- Async (XHR), dengan fallback ke localStorage kalau gagal.
- `beforeunload` pakai `navigator.sendBeacon` supaya data terkirim walau tab ditutup.

## Mode Server (Opsional)

`server.php` menyediakan 5 endpoint:

- `GET ?action=ping` — health check
- `GET ?action=list` — daftar semua project id + nama
- `GET ?action=read&id=...` — baca 1 project (JSON)
- `POST ?action=write` (body: `id=...&data=...`) — tulis 1 project
- `GET ?action=delete&id=...` — hapus 1 project
- `POST ?action=export` (body: `nama=...&ext=...&content=...`) — tulis file ke folder `ekspor/`

File project disimpan sebagai `<projectId>.json` di folder yang sama dengan `server.php`. File ekspor disimpan di subfolder `ekspor/`.

## Export

Pondasi bisa ekspor beberapa format (checkbox di panel Export):

- **HTML** — halaman lengkap dengan `<link>` ke tema CSS.
- **CSS kustom** — `pondasi-custom.css` berisi kelas yang dibuat user via inline override.
- **pondasi.css** — framework CSS (perlu disalin manual dari folder).
- **tampilan.css** — tema lengkap (perlu disalin manual).
- **CSS Build (tree-shake)** — `nama-project-build.css`, hanya kelas yang benar-benar dipakai di tree. Diproses async via `P.Tema.treeShakeCSS()`.
- **Inline CSS (1 file HTML)** — semua CSS kustom di-inline ke `<style>` di HTML. pondasi.css & tampilan.css tetap perlu disalin manual.

Hasil ekspor bisa di-hosting di server statis mana pun (GitHub Pages, Netlify, shared hosting).

## Kontribusi

### Setup dev

1. Clone repo.
2. Buka `index.html` di browser. Tidak perlu `npm install`, tidak perlu build step.
3. Edit file JS/CSS, refresh browser untuk lihat perubahan.
4. Bump version di `index.html` (`?v=XX` di semua `<link>` dan `<script>`) supaya cache invalid.

### Style guide

- **Bahasa**: Bahasa Indonesia untuk komentar, nama variabel, nama fungsi. English untuk keyword teknis (`display`, `position`, dll).
- **Naming**: camelCase untuk fungsi/variabel, PascalCase untuk konstruktor (tidak dipakai), UPPER_CASE untuk konstanta.
- **CSS class**: kebab-case, prefix `pondasi-` untuk builder chrome, tanpa prefix untuk tema (kelas yang diekspor).
- **Indentation**: 4 spasi untuk JS, 2 spasi untuk CSS, 4 spasi untuk HTML.
- **No semicolon** di akhir baris JS (konsisten dengan kode existing).
- **No arrow function**, **no let/const**, **no template literal** — ES5 murni.
- **No flexbox/grid/CSS variables** di CSS tema — hanya CSS 2.1-3.0.

### Testing

Saat ini belum ada automated test. Manual testing:

1. Buka `index.html` di browser.
2. Cek console — pastikan tidak ada error merah.
3. Coba flow utama: split region → masuk mode edit → sisipkan block → edit properti → simpan → reload → buka dokumen → ekspor.
4. Test di browser lama (IE11 jika perlu) untuk verifikasi ES5 compatibility.

### Pull request

1. Fork repo.
2. Buat branch feature.
3. Commit dengan pesan konvensional (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`).
4. Pastikan `node --check` lulus untuk semua file JS yang diubah.
5. Update worklog (`worklog.md`) dengan entry task baru.
6. Bump version di `index.html` dan `pondasi-init.js`.
7. Kirim PR.

## Batasan Diketahui

- **Multi-page project belum tersedia** — saat ini 1 project = 1 halaman. Akordion "Buat Proyek Baru" di sidebar sengaja di-disabled.
- **`document.execCommand` deprecated** — pondasi pakai untuk formatting inline teks (bold/italic/sub/sup). Akan diganti dengan Selection API di masa depan.
- **@supports tidak divalidasi** — scanner recurse ke body `@supports { ... }` tanpa peringatan. Akan di-fix.
- **Z-index hierarchy** — saat ini pakai rentang 100-10700 dengan banyak lapisan. Bisa membingungkan kalau menambah UI melayang baru.
- **Undo untuk settings belum ada** — perubahan di panel Settings (tema, dimensi, font) tidak masuk undo stack. Hanya perubahan tree yang bisa undo.
- **localStorage quota** — kalau penuh, user diberi peringatan tapi tidak ada UI untuk lihat sisa quota atau hapus project lama secara batch.
- **Custom user template belum ada** — user tidak bisa save tree sebagai template custom. Hanya 5 template bawaan.
- **Collaborative editing belum ada** — walaupun server mode aktif, tidak ada sync real-time antar client.

---

Dibuat dengan pondasi.css.
