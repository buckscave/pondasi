# Arsitektur Pondasi

Dokumen ini menjelaskan arsitektur teknis Pondasi Web Builder secara mendalam. Untuk panduan penggunaan, lihat `README.md`. Untuk kontribusi, lihat `CONTRIBUTING.md`.

## Diagram Lapisan

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Layer 3: Builder UI                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │ Floating Kiri│  │ Floating Kn  │  │ Sidebar Panel│                 │
│  │ (D/T/S/E/,)  │  │ (guide/grid/ │  │ (dokumen/    │                 │
│  │              │  │  jarak/preview│  │  template/   │                 │
│  │              │  │  /reset)     │  │  export/...) │                 │
│  └──────────────┘  └──────────────┘  └──────────────┘                 │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │ Help Modal │  │ Dialog       │  │ Snackbar     │                  │
│  │            │  │ Konfirmasi   │  │ (flash msg)  │                  │
│  └────────────┘  └──────────────┘  └──────────────┘                  │
├─────────────────────────────────────────────────────────────────────────┤
│  Layer 2: Block Editor                                                 │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │ Mega-      │  │ Floating     │  │ Panel        │                  │
│  │ Dropdown   │  │ Toolbar      │  │ Properti     │                  │
│  │ (2-kolom)  │  │ (B/I/sub/sup)│  │ (4 seksi)    │                  │
│  └────────────┘  └──────────────┘  └──────────────┘                  │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │ Skema      │  │ Class        │  │ Scanner CSS  │                  │
│  │ Block (82) │  │ Context      │  │ (whitelist + │                  │
│  │            │  │ (breadcrumb +│  │  validator)  │                  │
│  │            │  │  state tabs) │  │              │                  │
│  └────────────┘  └──────────────┘  └──────────────┘                  │
├─────────────────────────────────────────────────────────────────────────┤
│  Layer 1: Tree Engine                                                   │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │ State      │  │ Split Engine │  │ Render       │                  │
│  │ (tree,     │  │ (region →    │  │ (tree → DOM) │                  │
│  │  undo/redo)│  │  N kolom)    │  │              │                  │
│  └────────────┘  └──────────────┘  └──────────────┘                  │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │ Project    │  │ Storage      │  │ Tema         │                  │
│  │ Mgmt       │  │ Adapter      │  │ (manifest +  │                  │
│  │ (multi-doc)│  │ (local/srv)  │  │  tree-shake) │                  │
│  └────────────┘  └──────────────┘  └──────────────┘                  │
├─────────────────────────────────────────────────────────────────────────┤
│  Layer 0: CSS Framework                                                 │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │ pondasi.css│  │ tampilan.css │  │ tampilan-    │                  │
│  │ (grid 12/10│  │ + 12 file    │  │ tambahan.css │                  │
│  │  container)│  │ tema         │  │ (16 stub)    │                  │
│  └────────────┘  └──────────────┘  └──────────────┘                  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Layer 0: CSS Framework

File CSS yang akan dipakai oleh hasil ekspor. User tidak pernah melihat kode ini, hanya melihat hasilnya di canvas dan di preview.

### pondasi.css

Grid system pondasi. Dua sistem kolom:

- **Sistem 12** (genap, default): `kolom-1` s/d `kolom-12`. Total lebar 12 unit.
- **Sistem 10** (ganjil, nama Indonesia): `kolom-lima` (1/5), `kolom-tujuh` (1/7), `kolom-delapan` (1/8), `kolom-sembilan` (1/9), `kolom-sepuluh` (1/10), `kolom-sebelas` (1/11).

Sistem 10 dipakai untuk jumlah kolom yang tidak bisa dibagi rata di sistem 12 (mis. 5 kolom = 12/5 bukan integer). Lihat `P.colNameForN()` di `pondasi-state.js` untuk mapping N → kelas.

Container utama: `.baris` (display: block, clearfix), `.sub-baris` (nested). Semua pakai `float: left` + box-sizing trick untuk layout. TIDAK ADA flexbox/grid.

### tampilan.css + tampilan-*.css (12 file)

Tema Material Design-like. Setiap file fokus ke satu kategori:

- `tampilan-teks.css` — paragraf, heading, link, mark, small
- `tampilan-teks-tambahan.css` — `.lead`, `.kode-inline`, `.keterangan`
- `tampilan-daftar.css` — ul, ol, dl
- `tampilan-media.css` — img, figure, figcaption, `.gambar-bingkai`, `.galeri`
- `tampilan-tabel.css` — table, thead, tbody, caption
- `tampilan-tombol.css` — `.tombol`, `.tombol-berisi`, `.tombol-garis`, `.tombol-hantu`, `.tombol-ikon`, `.tombol-melayang`, `.grup-tombol`
- `tampilan-form.css` — `.ruas-input`, `.ruas-textarea`, `.ruas-select`, `.ruas-checkbox`, `.ruas-radio-grup`, `.ruas-saklar`, `.ruas-slider`, `.ruas-stepper`, `.ruas-segment`, `.ruas-toggle-grup`
- `tampilan-kontainer.css` — `.kartu`, `.akordion`, `.pemisah-teks`
- `tampilan-navigasi.css` — `.bilah-aplikasi`, `.menu-mendatar`, `.tab-bilah`
- `tampilan-feedback.css` — `.snackbar`, `.lapis-dialog`, `.kotak-dialog`, `.pesan`, `.pesan-info`, `.pesan-sukses`, `.pesan-peringatan`, `.pesan-error`, `.tooltip`, `.popover`
- `tampilan-lainnya.css` — `.chip`, `.badge`, `.avatar`, `.progress`, `.kosong`, `.skeleton`

### tampilan-tambahan.css

Stub CSS untuk 16 kelas yang sebelumnya tidak ada definisinya. Ditambahkan saat beberes-total:

- `.kutipan`, `.kode` — block quote + code block
- `.hero` — banner besar bagian atas
- `.modal`, `.modal-badan`, `.modal-kepala`, `.modal-kaki` — dialog overlay
- `.drawer`, `.drawer-kanan` — panel geser dari samping
- `.banner` — block iklan/pengumuman
- `.toast`, `.toast-info`, `.toast-sukses`, `.toast-peringatan`, `.toast-error`
- `.spinner` — indikator loading dengan `@keyframes` animation
- `.breadcrumb` — navigasi jalur
- `.pagination` — navigasi halaman
- `.mega-menu` — dropdown navigasi besar
- `.daftar-komponen` — list dengan styling khusus
- `.timeline` — daftar peristiwa berurutan
- `.tree-view` — pohon hierarki
- `.header`, `.footer` — container semantik

Semua dengan dark theme overrides (`[data-tema="gelap"] .nama-kelas { ... }`).

## Layer 1: Tree Engine

### Data Model

Tree adalah nested object:

```js
{
    id: 'r1_abc12345',         // ID unik, format r<nextId>_random8chars
    type: 'grand-parent',     // 'grand-parent' | 'parent' | 'child' | 'sub-parent' | 'sub-child'
    tag: 'main',               // HTML tag
    classes: ['baris'],        // CSS classes
    children: [                // Untuk parent/grand-parent/sub-parent
        {
            id: 'r2_def67890',
            type: 'parent',
            tag: 'section',
            classes: ['baris'],
            children: [
                {
                    id: 'r3_ghi90123',
                    type: 'child',
                    tag: 'div',
                    classes: ['kolom-6'],
                    col: 6,
                    children: [],
                    blocks: [                    // Untuk leaf (child/sub-child)
                        {
                            id: 'b1_xyz',         // Block ID
                            tag: 'p',
                            kelas: 'isi-1',      // kelas default dari skema
                            jenis: 'teks',        // jenis block (key di P.SKEMA_BLOCK)
                            isi: 'Teks paragraf',
                            style: {              // Inline style override (di-clone ke custom CSS saat export)
                                color: '#FF0000',
                                fontSize: '1.25rem'
                            },
                            properti: {},         // Atribut HTML tambahan (mis. data-toggle)
                            aksi: null            // onclick handler
                        }
                    ]
                }
            ]
        }
    ]
}
```

### Pondasi-state.js

P.STATE — global state. Field utama:

- `currentProjectId` — id project aktif (null kalau belum ada)
- `projects` — dict `{projectId: project}` dengan `project = {id, name, tree, customCSS, cssExternal, settings, createdAt, modifiedAt}`
- `tree` — tree yang sedang aktif (snapshot dari `project.tree`)
- `activeId` — id region yang sedang dipilih
- `selectedIds` — array id region yang ter-multi-select
- `nextId` — counter untuk genId
- `editMode` — `{active, regionId, selectedBlockId, lastBlockClickId, lastBlockClickTime, customClass, paletteOpen, savedSelection}`
- `customCSS` — dict `{regionId: {className, rules}}` untuk override kelas kustom
- `undoStack` / `redoStack` — array snapshot tree (max 50)

Fungsi utama:
- `P.newProject(nama, templateKey)` — buat project baru
- `P.openProject(id)` — switch ke project lain (sync current dulu, load, render)
- `P.deleteProject(id)` — hapus project (kalau current, auto-create baru)
- `P.saveAsProject(nama)` — duplicate ke project baru dengan nama beda
- `P.applyTemplate(templateKey)` — ganti tree project aktif dengan template
- `P.syncToProject()` — copy `P.STATE.tree` + `customCSS` ke `project` dict
- `P.loadFromProject()` — copy `project.tree` ke `P.STATE.tree`, reset `nextId` dan `activeId`
- `P.pushUndo()` — simpan snapshot ke undoStack, reset redoStack
- `P.undo()` / `P.redo()` — pop/push antar stack

### Pondasi-split.js

Logika pembagian region. Fungsi utama:

- `P.splitRegion(id, n)` — bagi region aktif jadi N kolom. Auto-detect sistem 12 atau 10 via `P.colNameForN(n)`.
- `P.addColumn(id, count)` — tambah `count` kolom ke region yang sudah ada.
- `P.deleteRegion(id)` — hapus region, sibling menyesuaikan. Untuk kolom ganjil, konversi otomatis ke sistem 12 via `P.oddToSystem12(siblingCount)`.
- `P.mergeRegions(id1, id2)` — gabung 2 region adjacent (untuk kolom: jumlahkan N kolom).

Sistem 12 vs 10 diatur oleh `P.detectColumnSystem(node)` di `pondasi-ui.js`. Hasil deteksi mempengaruhi guide overlay (cyan lines).

### Pondasi-render.js

`P.render()` — render tree ke DOM canvas:

1. Clear `#canvas`.
2. Set class canvas = `tree.classes + ' pondasi-region pondasi-type-' + tree.type`.
3. Walk tree recursively:
   - Parent/grand-parent: buat element, render children, return.
   - Child/sub-child: buat element dengan `.pondasi-region` class, render blocks di dalamnya (kalau ada).
4. Pasang event listener (mousedown untuk seleksi, dblclick untuk edit mode).
5. Update breadcrumb (`P.updateBreadcrumb()`).
6. Update editor bar (`P.posisikanBarEditor()`).

Setiap region DOM punya `data-id` attribute = `node.id`. Block DOM punya `data-block-id` = `block.id`.

### Pondasi-storage.js

Storage adapter dengan 2 mode:

- `P.storage.mode = 'local'` (default) — pakai localStorage.
- `P.storage.mode = 'server'` — pakai `server.php` via XHR.

Auto-detect di `P.cekStorage(callback)`:
1. Kalau `window.location.protocol === 'file:'` → mode local.
2. Else, ping `?action=ping` di `server.php`. Kalau 200 OK dengan `{ok: true}` → mode server.
3. Else → mode local.

Fungsi adapter:
- `P.storageSave(callback)` — sync ke localStorage + async XHR ke server (kalau server mode).
- `P.storageLoad(callback)` — load semua project.
- `P.storageDelete(id, callback)` — hapus project.
- `P.storageExport(nama, ext, content, callback)` — tulis file ekspor.

`P.handleBeforeUnload` (di `pondasi-init.js`) — sync save ke localStorage + `navigator.sendBeacon` untuk server mode. Supaya data tidak hilang walau tab ditutup abrupt.

### Pondasi-tema.js

Tema manifest + tree-shake CSS.

- `P.Tema.loadManifest(callback)` — XHR `css/tema-manifest.json` untuk dapatkan daftar berkas tema.
- `P.Tema.getBerkasTema()` — return array nama berkas tema (untuk generate `<link>` di export).
- `P.Tema.generateLinkTags()` — generate string `<link rel="stylesheet" href="...">` untuk semua berkas tema.
- `P.Tema.treeShakeCSS(callback)` — fetch semua berkas tema, parse, filter hanya rule yang punya kelas dipakai di tree. Return CSS string yang sudah di-tree-shake.

## Layer 2: Block Editor

### Pondasi-fields.js

Definisi field umum yang dipakai berbagai skema block:

- `P.FIELDS_TIPOGRAFI_UMUM` (9 field) — warnaTeks, ukuranFont, keluargaFont, tinggiBaris, tebal, dekorasi, transformasi, spasiHuruf, align.
- `P.FIELDS_TATA_LETAK` (10 field) — display, position, width, height, minWidth, maxWidth, float, boxSizing, z-index, overflow.
- `P.FIELDS_TAMPILAN_VISUAL` (10 field) — latar, gambarLatar, borderLebar, borderGaya, borderWarna, radius, opacity, boxShadow, textShadow, cursor.
- `P.FIELDS_TAMPILAN_UMUM` (8 field) — versi lama, sudah tidak dipakai di panel baru (di-skip di `tampilanJudul` array).

### Pondasi-blok-*.js (11 file modul skema)

Setiap file mendifinisikan skema block per kategori. Pattern:

```js
P.SKEMA_BLOCK = P.SKEMA_BLOCK || {};  // penting: jangan overwrite!

P.SKEMA_BLOCK['nama-jenis'] = {
    nama: 'Nama Block',           // untuk display di dropdown
    tag: 'div',                    // HTML tag default
    kelasDefault: 'nama-kelas',   // CSS class default (HARUS ada di CSS!)
    kategori: 'Kategori',          // untuk filter scanner
    kategoriDropdown: 'isi',      // 'isi' atau 'komponen' (mega-dropdown section)
    bagian: [                      // seksi di panel properti
        { judul: 'Konten', buka: true, fields: [...] },
        { judul: 'Kelas', fields: [...] },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
    ]
};
```

Jenis field yang didukung: `teks`, `textarea`, `angka`, `pilih`, `warna`, `box` (4 sisi: atas/kanan/bawah/kiri), `box-px` (sama tapi px), `daftar` (multi-line), `cek`, `aksi`.

### Pondasi-block-panel.js

Render panel properti block. Fungsi utama:

- `P.renderPanelBlock(badan, block, judulEl)` — render 4 seksi: Konten, Tata Letak, Tampilan, Lanjutan.
  - **Konten**: skema fields dengan judul di array `kontenJudul`.
  - **Tata Letak**: skema fields dengan judul di `tataLetakJudul` + `FIELDS_TATA_LETAK` + margin/padding box.
  - **Tampilan**: input kelas full-width, skema fields dengan judul di `tampilanJudul` (KECUALI 'Tampilan' — field unik di-merge ke Warna & Garis), + `FIELDS_TAMPILAN_VISUAL`.
  - **Lanjutan**: Identitas (id, data-attrs), CSS Kustom, Animasi, Responsif.
- `P.ambilNilaiBlock(block, fieldId)` — ambil nilai field dari 3 sumber: `block.style[fieldId]` → scanner (customCSS) → empty.
- `P.terapkanPropertiBlock(target)` — apply perubahan field ke block (inline style + save).
- `P.renderPanelFieldHtml(f, block, mode)` — render HTML untuk satu field.

### Pondasi-mega-dropdown.js

Dropdown 2-kolom untuk pilih block:

- Kolom kiri: list kategori (Teks, Daftar, Media, Tabel, Tombol, Form, Kontainer, Navigasi, Feedback, Lainnya).
- Kolom kanan: list block per kategori.
- Hover/focus kategori → tampilkan isi kategori.
- Klik block → insert ke region aktif.

Filter:
- Block di-skip kalau `kelasDefault` tidak valid (scanner check).
- Block dari CSS eksternal yang sudah di-scan juga muncul.

### Pondasi-floating-toolbar.js

Toolbar melayang kecil (B/I/sub/sup/×) yang muncul saat user seleksi teks di contentEditable block. Implementasi pakai `document.execCommand` (deprecated tapi masih berfungsi).

### Pondasi-panel-kelas.js

Panel properti region (saat di luar mode edit, klik region). Berisi:

- Input kelas kustom (dengan autocomplete dari scanner whitelist).
- Breadcrumb class context (region > parent > grandparent).
- Pseudo-class tabs (Normal / Hover / Focus / Active) — hanya tampil yang benar-benar diubah.
- "+ tambah properti" modal untuk tambah properti CSS baru.

### Pondasi-class-context.js

Fungsi untuk dapatkan kelas CSS yang berlaku untuk region aktif:

- `P.getBlockClassHierarchy(block)` — array kelas dari `block.kelas` + kelas region parent.
- `P.renderBreadcrumb(block)` — render breadcrumb visual.
- `P.getContextProperties(block)` — dapatkan semua properti CSS yang berlaku untuk region + pseudo-class.
- `P.getSeksiPseudo(block, props, normalFieldsHtml)` — generate state tabs kalau ada pseudo-class yang diubah.

### Pondasi-scanner.js + pondasi-css-spec.js

Scanner engine. Detail di `README.md` bagian "Scanner CSS".

- `P.CSS_SPEC` — whitelist properti + aturan + atRule.
- `P.Scanner.scanCSSString(cssText)` — parse string CSS, return `{kelas, kategori, errors, valid}`.
- `P.Scanner.scanTemaCSS(callback)` — scan semua berkas tema di init, cache hasilnya.
- `P.Scanner.fetchDanScanCSS(url, callback)` — fetch URL, scan, return result.
- `P.Scanner.cache.cssExternal[cacheKey]` — cache hasil scan CSS eksternal.

## Layer 3: Builder UI

### Pondasi-init.js

Bootstrap:

1. `P.init()` — entry point, panggil `P.cekStorage()`.
2. Setelah storage mode diketahui, load projects (`P.storageLoad` atau `P.loadProjects`).
3. `P.initAfterLoad()`:
   - Kalau tidak ada project aktif, auto-create "Proyek tanpa judul".
   - Else, load dari project aktif.
   - `P.render()`.
   - `P.registerListeners()` (dengan guard, hanya sekali).
   - Apply settings ke editor body.
   - Set statusline awal.

### Pondasi-input.js

Keyboard handler utama. Pattern:

1. Tangkap `document.keydown`.
2. Cek `e.target.tagName` — skip kalau di INPUT/TEXTAREA/contentEditable (kecuali mode edit).
3. Mode edit branch: handle `i`/`k`/`e`/arrow/y/x/p/Backspace/drag.
4. Di luar mode edit: handle `v`/`V`/arrow/`Enter`/`?`/`D`/`T`/`S`/`E`/`,`/`y`/`x`/`p`/`Backspace`/`Esc`.
5. Numeric prefix: `1`-`9` untuk multi-count (mis. `3v` = split jadi 3 kolom).

### Pondasi-ui.js

Handler floating bar kanan + preview overlay:

- `P.toggleGuide()` — toggle guide overlay (cyan lines 12/10 kolom).
- `P.toggleGrid()` — toggle grid overlay (magenta 16px lines).
- `P.toggleJarak()` — toggle `.jarak` class ke parent region aktif (margin antar kolom).
- `P.togglePreview()` — buka iframe overlay dengan HTML preview.
- `P.handleFloating(e)` — delegation untuk `data-action` click.

### Pondasi-project.js

Sidebar panel kiri (project management):

- `P.bukaSidebar(panelId, btnId)` / `P.tutupSidebarKiri()` — manajemen sidebar aktif (hanya 1 dalam satu waktu).
- `P.renderRecentDokumen()` — list dokumen terbaru di panel Dokumen.
- `P.konfirmasiBuatDokumen()` — buat dokumen baru dari form.
- `P.renderTemplateList()` — list 5 template di panel Template.
- `P.terapkanTemplatePilihan(key)` — apply template ke project aktif.
- `P.konfirmasiSaveAs()` — save as ke nama baru, cek duplikat.
- `P.tampilkanExportPanel()` + `P.konfirmasiExport()` + `P.lanjutkanExport(nama)` — export flow.
- `P.renderSettings()` + `P.terapkanSettings()` — panel Settings.
- `P.applySettingsKeEditor()` — apply settings ke body editor (font, dimensi, tema).
- `P.tampilkanDialog(...)` + `P.konfirmasi(...)` — custom dialog (ganti `confirm()` browser).

## Alur Data

### Buat dokumen baru

```
User klik tombol "D" → tampilkanDokumenPanel() → bukaSidebar('dokumen-panel')
User isi form → klik "Buat Dokumen" → konfirmasiBuatDokumen()
  → P.newProject(nama)         // buat project di P.STATE.projects
  → P.saveProjects()           // persist ke localStorage
  → P.loadFromProject()        // copy project.tree ke P.STATE.tree
  → P.applySettingsKeEditor()  // apply settings ke body
  → P.render()                 // render tree ke DOM
  → tutupSidebarKiri()
  → flash('Dokumen "..." dibuat')
```

### Split region

```
User tekan "3" + "v" → P.STATE.pendingCount = 3 → handleKey v branch
  → P.splitRegion(activeId, 3)
    → colName = P.colNameForN(3)   // 'kolom-4'
    → pushUndo()
    → parent.children = [P.nChild(4), P.nChild(4), P.nChild(4)]  // ganti children
    → P.save() + P.render()
```

### Masuk mode edit

```
User tekan Enter di region terpilih → P.masukModeEdit()
  → P.STATE.editMode.active = true
  → P.STATE.editMode.regionId = P.STATE.activeId
  → P.render()                   // re-render dengan mode edit styling
  → P.renderBlocks()             // render block di region yang di-edit
  → P.posiskanBarEditor()        // tampilkan editor bar mini di bawah region
  → P.renderPanel()              // render panel properti (region mode)
```

### Sisipkan block

```
User tekan "i" → bukaDropdownKeyboard('isi')
  → tampilkan dropdown-isi
User pilih "Paragraf" → handleDropdownClick(e)
  → dataInsert = 'p'
  → P.insertBlockFromSkema('teks')   // lookup P.SKEMA_BLOCK['teks']
    → block = { id: P.genBlockId(), tag: 'p', kelas: skema.kelasDefault, jenis: 'teks', ... }
    → node.blocks.push(block)
    → P.save() + P.renderBlocks()
```

### Edit properti block

```
User klik block di canvas → pilihBlock(blockId)
  → P.STATE.editMode.selectedBlockId = blockId
  → P.renderPanel()    // render panel properti BLOCK (bukan region)
  → Fokus ke field pertama

User ubah field "Warna teks" → handlePanelChangeDelegated(e)
  → target.dataset.field = 'warnaTeks'
  → P.terapkanPropertiBlock(target)
    → block.style.warnaTeks = target.value
    → P.terapkanStyleBlock(block)   // apply ke DOM block
    → P.save()
```

### Save project

```
User tekan "S" → P.simpanProject()
  → P.saveProject()
    → P.syncToProject()              // copy P.STATE.tree ke project.tree
    → P.saveProjects()               // persist ke localStorage
    → flash('Proyek tersimpan')
```

### Export

```
User tekan "E" → tampilkanExportPanel() → bukaSidebar('export-panel')
User centang "HTML" + "CSS Build" → klik "Ekspor Sekarang"
  → P.konfirmasiExport()
    → P.Scanner.scanProject()   // pre-export scan, warning kalau ada pelanggaran
    → P.lanjutkanExport(nama)
      → generateExportHTML() (sync) → storageExport()
      → exportTreeShakeCSS(nama, cb) (async)
        → P.Tema.treeShakeCSS(cb)
          → fetch semua berkas tema, parse, filter, return CSS string
        → storageExport(nama + '-build', 'css', cssFiltered)
      → tutupSidebarKiri()
      → flash('2 file diunduhan')
```

## State Management

Pondasi tidak pakai reactive framework. State update explicit:

1. Mutasi `P.STATE` (tree, editMode, dll).
2. Panggil `P.save()` untuk persist (sync ke localStorage, async ke server).
3. Panggil `P.render()` untuk re-render DOM.

Undo/redo: snapshot tree sebelum mutasi (`P.pushUndo()`). `P.undo()` pop dari undoStack, push state saat ini ke redoStack.

## Edge Cases

### Tree null

Setelah delete current project, `P.STATE.tree` di-set null sebelum `P.newProject()` membuat tree baru. `P.render()` punya guard `if (!P.STATE.tree) return;` supaya tidak crash.

### Edit mode stale

`P.openProject()` dan `P.applyTemplate()` memanggil `P.keluarModeEdit()` di awal supaya `editMode.regionId` tidak stale (merujuk region di tree lama).

### Quota exceeded

`P.saveProjects()` catch `QuotaExceededError`, flash peringatan ke user.

### Corrupt data

`P.loadProjects()` catch JSON parse error, backup data corrupt ke key `.corrupt-<timestamp>`, reset ke `{}`, flash peringatan.

### Server mode gagal

`P.storageSave` fallback ke localStorage kalau XHR gagal. `P.handleBeforeUnload` selalu simpan ke localStorage (sync) + `navigator.sendBeacon` (async, tapi tetap dikirim walau tab unload).

## Pertanyaan Umum

**Q: Kenapa pakai `var` bukan `let`/`const`?**  
A: ES5 murni. `let`/`const` baru di ES6. Pakai `var` supaya kompatibel dengan browser lama (IE11) dan menjaga bundle kecil (tidak butuh transpiller).

**Q: Kenapa tidak pakai framework JS (React/Vue/Svelte)?**  
A: Pondasi adalah builder offline-first. Framework JS butuh build step (webpack/vite), menambah kompleksitas. DOM API native sudah cukup untuk kebutuhan pondasi.

**Q: Kenapa CSS 2.1-3.0 saja, tidak pakai flexbox/grid?**  
A: Output pondasi harus berjalan di browser lama (IE8+). Flexbox butuh IE10+, grid butuh IE11+ (dengan prefix). Pakai `float` + `inline-block` sudah cukup untuk layout yang pondasi butuh.

**Q: Kenapa tidak ada automated test?**  
A: Belum sempat setup. Saat ini hanya manual testing. Kandidat test: scanner, tree engine, split engine. Untuk scanner sudah ada script test di `scripts/test-scanner*.js`.

**Q: Bisakah pondasi dipakai untuk production?**  
A: Output ekspor pondasi (HTML + CSS) boleh dipakai untuk production. Editor pondasi sendiri masih dalam tahap pengembangan (lihat batasan di README).

**Q: Bagaimana cara menambah font kustom?**  
A: Tambah link CSS Google Fonts di panel Settings → CSS Eksternal. Atau set Font Family di Settings → Tipografi. Font akan di-apply ke body editor dan hasil ekspor.
