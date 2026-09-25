# Panduan Kontribusi Pondasi

Terima kasih tertarik berkontribusi ke Pondasi! Dokumen ini menjelaskan konvensi, workflow, dan ekspektasi.

## Code of Conduct

Jadilah sopan. Kritik konstruktif diterima, serangan personal tidak. Fokus pada kode, bukan orang.

## Sebelum Mulai

1. **Baca README.md** — pahami filosofi (CSS 2.1-3.0, ES5 murni, tanpa dependensi, gaya vim/tmux).
2. **Baca worklog.md** — pahami sejarah implementasi, apa yang sudah dikerjakan, apa yang tertunda.
3. **Cek issue tracker** — pastikan tidak ada yang sudah mengerjakan fitur/bug yang sama.

## Setup Dev

Pondasi tidak butuh build step. Cukup:

```bash
git clone <repo>
cd pondasi
# Buka index.html di browser
```

Tidak ada `npm install`, tidak ada `package.json`, tidak ada bundler. Semua JS di-load langsung via `<script src="js/...">` di `index.html`.

## Konvensi Kode

### Bahasa

- **Komentar, nama variabel, nama fungsi**: Bahasa Indonesia. Contoh: `P.tampilkanDokumenPanel`, `P.ambilNilaiBlock`, `// cek storage mode dulu`.
- **Keyword teknis CSS**: English. Contoh: `display`, `position`, `font-size`.
- **Pesan error/flash**: Bahasa Indonesia. Contoh: `'Nama dokumen tidak boleh kosong'`.

### JavaScript

- **ES5 murni**. TIDAK BOLEH: `let`, `const`, `=>`, `class`, template literal, `for...of`, `Object.assign`, `Object.keys` (boleh tapi pakai dengan hati-hati).
- **`var` untuk semua deklarasi**.
- **No semicolon** di akhir baris (konsisten dengan kode existing — walau `;` valid ES5, kode pondasi tidak pakai).
- **Indentation**: 4 spasi.
- **Naming**: camelCase untuk fungsi/variabel (`namaField`, `ambilNilaiBlock`), UPPER_CASE untuk konstanta (`P.STATE.projectsKey`).
- **Pola**: setiap file mulai dengan `var P = P || {};` lalu attach ke `P` namespace.

Contoh kode yang benar:

```js
var P = P || {};

P.fungsiBaru = function(param1, param2) {
    var hasil = param1 + param2;
    if (hasil > 10) {
        return hasil;
    }
    return null;
};
```

Contoh kode yang DILARANG:

```js
const hasil = param1 + param2;  // ❌ const
let counter = 0;                  // ❌ let
const fn = (a, b) => a + b;       // ❌ arrow function
class Foo { ... }                  // ❌ class
`template ${var}`                 // ❌ template literal
for (const item of array) { ... } // ❌ for...of
```

### CSS

- **CSS 2.1-3.0 saja**. TIDAK BOLEH: `display: flex`, `display: grid`, `var(--custom)`, `clamp()`, `min()/max()` sebagai fungsi.
- **Vendor prefix** untuk compatibility browser lama: `-webkit-`, `-moz-`, `-o-`, `-ms-`. Boleh dipakai untuk properti yang belum standard (sebagian masih ada).
- **IE hacks** seperti `*display: inline; *zoom: 1;` (IE6/7) — sudah tidak diperlukan, tolong hapus kalau ketemu.
- **Indentation**: 2 spasi.
- **Naming**: kebab-case. Prefix `pondasi-` untuk builder chrome (UI editor), tanpa prefix untuk kelas tema (kelas yang akan diekspor).
- **Color**: hardcoded hex (`#00AAD4`, `#1E2832`, `#5A646E`, `#A0AAB4`). Pakai palette yang konsisten.

Contoh CSS yang benar:

```css
.nama-kelas {
    display: block;
    padding: 1rem;
    margin-bottom: 1rem;
    background-color: #E1F6FA;
    border-left: 4px solid #00AAD4;
    border-radius: 4px;
    -webkit-border-radius: 4px;
    -moz-border-radius: 4px;
}
```

### HTML

- **Indentation**: 4 spasi.
- **Attribute**: selalu pakai double quote: `class="..."`, `data-action="..."`.
- **Self-closing** untuk void elements (`<img>`, `<input>`, `<hr>`, `<br>` — tanpa `/>`).
- **Button** selalu pakai `type="button"` kecuali benar-benar tombol submit di form (tidak ada di pondasi).
- **Aksesibilitas**: semua tombol ikon-only (X, ?, +) WAJIB punya `aria-label`. Semua input WAJIB punya `<label for="...">`.

## Workflow Pull Request

1. **Fork** repo ke akun Anda.
2. **Buat branch** dengan nama deskriptif: `feature/multi-page-project`, `fix/dialog-z-index`, `docs/update-readme`.
3. **Commit** dengan pesan konvensional:
   - `feat: tambah block skema untuk timeline`
   - `fix: bump z-index floating-toolbar ke 10600`
   - `refactor: hapus dead code P.handlePropertiChange`
   - `docs: tambah section kontribusi di README`
   - `chore: bump version ke v82`
4. **Pastikan** `node --check` lulus untuk semua file JS yang diubah:
   ```bash
   for f in js/*.js; do node --check "$f"; done
   ```
5. **Update worklog.md** dengan entry baru:
   ```markdown
   ---
   Task ID: feature-name-1
   Agent: <nama kamu>
   Task: <ringkasan singkat>
   
   Work Log:
   - <langkah 1>
   - <langkah 2>
   
   Stage Summary:
   - <hasil / artifact yang dihasilkan>
   ```
6. **Bump version**:
   - `index.html`: semua `?v=XX` di `<link>` dan `<script>`.
   - `js/pondasi-init.js`: console.log string `'pondasi init vXX — mulai ...'`.
7. **Kirim PR** dengan deskripsi: masalah yang dipecahkan, pendekatan yang dipakai, screenshot kalau ada UI change.

## Review Checklist

Reviewer akan cek:

- [ ] `node --check` lulus untuk semua JS.
- [ ] CSS braces balanced.
- [ ] Tidak ada `let`/`const`/`=>`/`class`/template literal baru.
- [ ] Tidak ada `display: flex/grid/var()` baru di CSS.
- [ ] Tidak ada `console.log` baru (kecuali di `pondasi-init.js` untuk diagnostic).
- [ ] Komentar dan nama variabel dalam Bahasa Indonesia.
- [ ] Aksesibilitas: `aria-label` di tombol ikon-only, `<label for>` di input.
- [ ] Worklog di-update.
- [ ] Version di-bump.

## Area yang Butuh Bantuan

Lihat bagian "Batasan Diketahui" di README.md. Prioritas tinggi:

1. **Multi-page project** — struktur `project.pages = [{ name, tree, settings }]`.
2. **Undo untuk settings** — undo stack terpisah untuk perubahan settings (bukan tree).
3. **@supports scanner validation** — tambah check di `pondasi-scanner.js`.
4. **Ganti `document.execCommand`** dengan Selection API.
5. **Automated test** — setup minimal: QUnit atau Jasmine untuk scanner, tree engine, split engine.

Prioritas rendah (nice to have):

6. **Custom user template** — save tree sebagai template custom di `pondasi.templates.v1`.
7. **Project version history** — snapshot tree per N menit.
8. **Recycle bin untuk delete** — project yang dihapus masuk trash, bisa restore 30 hari.
9. **Search/filter project** — search box di recent list.
10. **Inline rename project** — click nama project di recent list → edit inline.

## Pertanyaan?

- Lihat `worklog.md` untuk konteks implementasi.
- Lihat `README.md` untuk arsitektur dan struktur folder.
- Buat issue di repo kalau ada pertanyaan teknis.

Terima kasih sudah berkontribusi!
