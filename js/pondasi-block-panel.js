/* PONDASI-BLOCK-PANEL.JS
   Dispatcher panel properti — render panel region + komponen.
   Shared utilities: buatSeksi, jenisBlock, cariBlockById, escHtml, escAttr, dll.
   HARUS di-load SETELAH pondasi-panel-field.js, pondasi-panel-region.js,
   pondasi-panel-block.js (karena pakai fungsi dari sana).
   Field umum (FIELDS_*) ada di pondasi-fields.js yang di-load sebelum file ini.
*/
var P = P || {};

/* PONDASI-BLOCK-PANEL.JS
   Panel properti per-block — skema field per jenis block, rendering dinamis,
   apply style/aksi ke block element, serialize untuk export.
   Field umum (FIELDS_*) ada di pondasi-fields.js yang di-load sebelum file ini.
*/
var P = P || {};

/* ======================================================================
   SKEMA BLOCK — definisi field per jenis block
   ====================================================================== */

// Merge skema lama ke P.SKEMA_BLOCK (yang sudah diisi oleh pondasi-blok-*.js)
// Penting: jangan pakai P.SKEMA_BLOCK = {...} karena akan menimpa skema modular!
// Pakai pattern merge: hanya isi kalau key belum ada (skema modular lebih prioritas)
var _skemaLama = {
    /* === TEKS (p, h1-h6, blockquote, pre) === */
    'teks': {
        nama: 'Teks',
        bagian: [
            { judul: 'Konten', buka: true, fields: [
                { id: 'isi', label: 'Teks', jenis: 'textarea', placeholder: 'Ketik teks...' }
            ]},
            { judul: 'Kelas', fields: [
                { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'judul-1' }
            ]},
            { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM },
            { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM }
        ]
    },

    /* === DAFTAR (ul/ol native) === */
    'daftar': {
        nama: 'Daftar',
        bagian: [
            { judul: 'Item', buka: true, fields: [
                { id: 'items', label: 'Item (satu per baris, boleh HTML)', jenis: 'daftar', format: 'isi',
                  placeholder: 'Item 1\nItem 2' }
            ]},
            { judul: 'Kelas', fields: [
                { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'daftar' }
            ]},
            { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM }
        ]
    },

    /* === GAMBAR === */
    'gambar': {
        nama: 'Gambar',
        bagian: [
            { judul: 'Sumber', buka: true, fields: [
                { id: 'src', label: 'URL gambar', jenis: 'teks', placeholder: 'https://...' },
                { id: 'alt', label: 'Alt teks', jenis: 'teks', placeholder: 'Deskripsi gambar' }
            ]},
            { judul: 'Kelas', fields: [
                { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'kartu-gambar' }
            ]},
            { judul: 'Tampilan', fields: [
                { id: 'lebar', label: 'Lebar', jenis: 'teks', placeholder: '100%' },
                { id: 'tinggi', label: 'Tinggi', jenis: 'teks', placeholder: 'auto' },
                { id: 'radius', label: 'Radius (px)', jenis: 'angka', step: 1 },
                { id: 'borderLebar', label: 'Border (px)', jenis: 'box-px', step: 1 },
                { id: 'borderGaya', label: 'Gaya border', jenis: 'pilih', opsi: ['', 'solid', 'dashed', 'dotted'] },
                { id: 'borderWarna', label: 'Warna border', jenis: 'warna' }
            ]}
        ]
    },

    /* === TABEL === */
    'tabel': {
        nama: 'Tabel',
        bagian: [
            { judul: 'Struktur', buka: true, fields: [
                { id: 'baris', label: 'Jumlah baris', jenis: 'angka', step: 1, min: 1, max: 20 },
                { id: 'kolom', label: 'Jumlah kolom', jenis: 'angka', step: 1, min: 1, max: 10 }
            ]},
            { judul: 'Kelas', fields: [
                { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'tabel' }
            ]},
            { judul: 'Tampilan', fields: [
                { id: 'lebar', label: 'Lebar', jenis: 'teks', placeholder: '100%' },
                { id: 'radius', label: 'Radius (px)', jenis: 'angka', step: 1 },
                { id: 'borderLebar', label: 'Border (px)', jenis: 'box-px', step: 1 },
                { id: 'borderGaya', label: 'Gaya border', jenis: 'pilih', opsi: ['', 'solid', 'dashed', 'dotted'] },
                { id: 'borderWarna', label: 'Warna border', jenis: 'warna' }
            ]}
        ]
    },

    /* === HR (garis pemisah) === */
    'hr': {
        nama: 'Garis Pemisah',
        bagian: [
            { judul: 'Kelas', buka: true, fields: [
                { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'pemisah' }
            ]},
            { judul: 'Tampilan', fields: [
                { id: 'margin', label: 'Margin (rem)', jenis: 'box', step: 0.25 },
                { id: 'borderLebar', label: 'Tebal (px)', jenis: 'angka', step: 1 },
                { id: 'borderGaya', label: 'Gaya', jenis: 'pilih', opsi: ['', 'solid', 'dashed', 'dotted'] },
                { id: 'borderWarna', label: 'Warna', jenis: 'warna' }
            ]}
        ]
    },

    /* === SPACER === */
    'spacer': {
        nama: 'Spacer',
        bagian: [
            { judul: 'Ukuran', buka: true, fields: [
                { id: 'tinggi', label: 'Tinggi (rem)', jenis: 'angka', step: 0.5, min: 0.5, max: 20 }
            ]}
        ]
    },

    /* === TOMBOL === */
    'tombol': {
        nama: 'Tombol',
        bagian: [
            { judul: 'Konten', buka: true, fields: [
                { id: 'isi', label: 'Teks tombol', jenis: 'teks', placeholder: 'Klik saya' }
            ]},
            { judul: 'Aksi', buka: true, fields: [
                { id: 'aksi', label: 'Aksi klik', jenis: 'aksi' }
            ]},
            { judul: 'Kelas', fields: [
                { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'tombol tombol-berisi' }
            ]},
            { judul: 'Tampilan', fields: [
                { id: 'warnaTeks', label: 'Warna teks', jenis: 'warna' },
                { id: 'latar', label: 'Latar', jenis: 'warna' },
                { id: 'padding', label: 'Padding (rem)', jenis: 'box', step: 0.25 },
                { id: 'margin', label: 'Margin (rem)', jenis: 'box', step: 0.25 },
                { id: 'borderLebar', label: 'Border (px)', jenis: 'box-px', step: 1 },
                { id: 'borderGaya', label: 'Gaya border', jenis: 'pilih', opsi: ['', 'solid', 'dashed', 'dotted'] },
                { id: 'borderWarna', label: 'Warna border', jenis: 'warna' },
                { id: 'radius', label: 'Radius (px)', jenis: 'angka', step: 1 }
            ]}
        ]
    },

    /* === KARTU === */
    'kartu': {
        nama: 'Kartu',
        bagian: [
            { judul: 'Konten', buka: true, fields: [
                { id: 'kepala', label: 'Judul kartu', jenis: 'teks', placeholder: 'Judul' },
                { id: 'isi', label: 'Isi kartu', jenis: 'textarea', placeholder: 'Isi kartu...' }
            ]},
            { judul: 'Kelas', fields: [
                { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'kartu bayangan-1' }
            ]},
            { judul: 'Tampilan', fields: [
                { id: 'padding', label: 'Padding (rem)', jenis: 'box', step: 0.25 },
                { id: 'margin', label: 'Margin (rem)', jenis: 'box', step: 0.25 },
                { id: 'latar', label: 'Latar', jenis: 'warna' },
                { id: 'radius', label: 'Radius (px)', jenis: 'angka', step: 1 },
                { id: 'borderLebar', label: 'Border (px)', jenis: 'box-px', step: 1 },
                { id: 'borderGaya', label: 'Gaya border', jenis: 'pilih', opsi: ['', 'solid', 'dashed', 'dotted'] },
                { id: 'borderWarna', label: 'Warna border', jenis: 'warna' }
            ]}
        ]
    },

    /* === AKORDION === */
    'akordion': {
        nama: 'Akordion',
        bagian: [
            { judul: 'Item', buka: true, fields: [
                { id: 'items', label: 'Item (Judul | Isi, * di awal = terbuka)',
                  jenis: 'daftar', format: 'judul-isi',
                  placeholder: '*Pertanyaan 1 | Jawaban 1\nPertanyaan 2 | Jawaban 2' }
            ]},
            { judul: 'Aksi', fields: [
                { id: 'allowMultiple', label: 'Boleh beberapa terbuka sekaligus', jenis: 'cek' }
            ]},
            { judul: 'Kelas', fields: [
                { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'akordion' }
            ]},
            { judul: 'Tampilan', fields: [
                { id: 'padding', label: 'Padding (rem)', jenis: 'box', step: 0.25 },
                { id: 'margin', label: 'Margin (rem)', jenis: 'box', step: 0.25 }
            ]}
        ]
    },

    /* === PEMISAH TEKS === */
    'pemisah': {
        nama: 'Pemisah Teks',
        bagian: [
            { judul: 'Konten', buka: true, fields: [
                { id: 'isi', label: 'Teks pemisah', jenis: 'teks', placeholder: 'atau' }
            ]},
            { judul: 'Kelas', fields: [
                { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'pemisah-teks' }
            ]}
        ]
    },

    /* === FORM INPUT (input-melayang/textarea/select) === */
    'form-input': {
        nama: 'Input Form',
        bagian: [
            { judul: 'Atribut', buka: true, fields: [
                { id: 'label', label: 'Label', jenis: 'teks', placeholder: 'Nama' },
                { id: 'placeholder', label: 'Placeholder', jenis: 'teks', placeholder: 'Ketik di sini...' },
                { id: 'nama', label: 'Name', jenis: 'teks', placeholder: 'namaField' },
                { id: 'tipe', label: 'Tipe (input saja)', jenis: 'pilih',
                  opsi: ['', 'text', 'email', 'password', 'number', 'tel', 'url'] },
                { id: 'wajib', label: 'Wajib diisi', jenis: 'cek' }
            ]},
            { judul: 'Kelas', fields: [
                { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'ruas-input' }
            ]},
            { judul: 'Tampilan', fields: [
                { id: 'lebar', label: 'Lebar', jenis: 'teks', placeholder: '100%' },
                { id: 'padding', label: 'Padding (rem)', jenis: 'box', step: 0.25 },
                { id: 'margin', label: 'Margin (rem)', jenis: 'box', step: 0.25 }
            ]}
        ]
    },

    /* === CHECKBOX / RADIO / SAKLAR === */
    'pilihan': {
        nama: 'Pilihan',
        bagian: [
            { judul: 'Atribut', buka: true, fields: [
                { id: 'label', label: 'Label', jenis: 'teks', placeholder: 'Pilih saya' },
                { id: 'nama', label: 'Name (group)', jenis: 'teks', placeholder: 'namaGroup' },
                { id: 'nilai', label: 'Value', jenis: 'teks', placeholder: 'nilai' },
                { id: 'dicentang', label: 'Dicentang default', jenis: 'cek' }
            ]},
            { judul: 'Kelas', fields: [
                { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'centang / radio / saklar' }
            ]}
        ]
    },

    /* === SLIDER === */
    'slider': {
        nama: 'Slider',
        bagian: [
            { judul: 'Atribut', buka: true, fields: [
                { id: 'min', label: 'Min', jenis: 'angka', step: 1 },
                { id: 'max', label: 'Max', jenis: 'angka', step: 1 },
                { id: 'step', label: 'Step', jenis: 'angka', step: 1 },
                { id: 'nilai', label: 'Nilai', jenis: 'angka', step: 1 },
                { id: 'nama', label: 'Name', jenis: 'teks' }
            ]},
            { judul: 'Kelas', fields: [
                { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'deret' }
            ]}
        ]
    },

    /* === STEPPER === */
    'stepper': {
        nama: 'Input Angka (Stepper)',
        bagian: [
            { judul: 'Atribut', buka: true, fields: [
                { id: 'min', label: 'Min', jenis: 'angka', step: 1 },
                { id: 'max', label: 'Max', jenis: 'angka', step: 1 },
                { id: 'step', label: 'Step', jenis: 'angka', step: 1 },
                { id: 'nilai', label: 'Nilai awal', jenis: 'angka', step: 1 }
            ]},
            { judul: 'Kelas', fields: [
                { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'langkah-angka' }
            ]}
        ]
    },

    /* === SEGMENT === */
    'segment': {
        nama: 'Segment',
        bagian: [
            { judul: 'Item', buka: true, fields: [
                { id: 'items', label: 'Item (* di awal = aktif)',
                  jenis: 'daftar', format: 'label-aktif', placeholder: '*A\nB\nC' }
            ]},
            { judul: 'Kelas', fields: [
                { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'segment' }
            ]}
        ]
    },

    /* === TOGGLE GRUP === */
    'toggle-grup': {
        nama: 'Toggle Group',
        bagian: [
            { judul: 'Item', buka: true, fields: [
                { id: 'items', label: 'Item (* di awal = aktif)',
                  jenis: 'daftar', format: 'label-aktif', placeholder: '*List\nGrid' }
            ]},
            { judul: 'Kelas', fields: [
                { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'toggle-grup' }
            ]}
        ]
    },

    /* === TAB === */
    'tab': {
        nama: 'Tab',
        bagian: [
            { judul: 'Item', buka: true, fields: [
                { id: 'items', label: 'Tab (* di awal = aktif)',
                  jenis: 'daftar', format: 'label-aktif', placeholder: '*Tab 1\nTab 2' }
            ]},
            { judul: 'Kelas', fields: [
                { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'tab-bilah' }
            ]}
        ]
    },

    /* === MENU MENDATAR === */
    'menu-mendatar': {
        nama: 'Menu Mendatar',
        bagian: [
            { judul: 'Item', buka: true, fields: [
                { id: 'items', label: 'Item (Label | URL, * di awal = aktif)',
                  jenis: 'daftar', format: 'label-href',
                  placeholder: '*Beranda | /\nTentang | /tentang' }
            ]},
            { judul: 'Kelas', fields: [
                { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'menu-mendatar' }
            ]}
        ]
    },

    /* === BILAH APLIKASI === */
    'bilah-aplikasi': {
        nama: 'Bilah Aplikasi',
        bagian: [
            { judul: 'Konten', buka: true, fields: [
                { id: 'judul', label: 'Judul', jenis: 'teks', placeholder: 'Judul Aplikasi' }
            ]},
            { judul: 'Kelas', fields: [
                { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'bilah-aplikasi' }
            ]}
        ]
    },

    /* === PESAN === */
    'pesan': {
        nama: 'Pesan',
        bagian: [
            { judul: 'Konten', buka: true, fields: [
                { id: 'isi', label: 'Pesan', jenis: 'textarea', placeholder: 'Pesan...' }
            ]},
            { judul: 'Kelas', fields: [
                { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'pesan pesan-info' }
            ]}
        ]
    },

    /* === CHIP === */
    'chip': {
        nama: 'Chip',
        bagian: [
            { judul: 'Konten', buka: true, fields: [
                { id: 'isi', label: 'Teks chip', jenis: 'teks', placeholder: 'Chip' }
            ]},
            { judul: 'Kelas', fields: [
                { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'chip' }
            ]},
            { judul: 'Tampilan', fields: [
                { id: 'warnaTeks', label: 'Warna teks', jenis: 'warna' },
                { id: 'latar', label: 'Latar', jenis: 'warna' }
            ]}
        ]
    },

    /* === BADGE === */
    'badge': {
        nama: 'Badge',
        bagian: [
            { judul: 'Konten', buka: true, fields: [
                { id: 'isi', label: 'Teks badge', jenis: 'teks', placeholder: '3' }
            ]},
            { judul: 'Kelas', fields: [
                { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'badge' }
            ]},
            { judul: 'Tampilan', fields: [
                { id: 'warnaTeks', label: 'Warna teks', jenis: 'warna' },
                { id: 'latar', label: 'Latar', jenis: 'warna' }
            ]}
        ]
    },

    /* === PROGRESS === */
    'progress': {
        nama: 'Progress',
        bagian: [
            { judul: 'Atribut', buka: true, fields: [
                { id: 'nilai', label: 'Nilai (0-100)', jenis: 'angka', step: 1, min: 0, max: 100 }
            ]},
            { judul: 'Kelas', fields: [
                { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'progress' }
            ]},
            { judul: 'Tampilan', fields: [
                { id: 'warnaNilai', label: 'Warna nilai', jenis: 'warna' },
                { id: 'tinggi', label: 'Tinggi (px)', jenis: 'angka', step: 1 }
            ]}
        ]
    },

    /* === TOOLTIP === */
    'tooltip': {
        nama: 'Tooltip',
        bagian: [
            { judul: 'Konten', buka: true, fields: [
                { id: 'isi', label: 'Teks utama', jenis: 'teks', placeholder: 'Arahkan kursor' },
                { id: 'tooltipTeks', label: 'Tooltip teks', jenis: 'teks', placeholder: 'Tooltip' }
            ]},
            { judul: 'Kelas', fields: [
                { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'tooltip' }
            ]}
        ]
    },

    /* === AVATAR === */
    'avatar': {
        nama: 'Avatar',
        bagian: [
            { judul: 'Konten', buka: true, fields: [
                { id: 'isi', label: 'Inisial / teks', jenis: 'teks', placeholder: 'AB' },
                { id: 'src', label: 'URL gambar (opsional)', jenis: 'teks', placeholder: 'https://...' }
            ]},
            { judul: 'Kelas', fields: [
                { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'avatar' }
            ]}
        ]
    },

    /* === DAFTAR KOMPONEN === */
    'daftar-komponen': {
        nama: 'Daftar Komponen',
        bagian: [
            { judul: 'Item', buka: true, fields: [
                { id: 'items', label: 'Item (satu per baris, boleh HTML)',
                  jenis: 'daftar', format: 'isi', placeholder: 'Item 1\nItem 2' }
            ]},
            { judul: 'Kelas', fields: [
                { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'daftar bayangan-1' }
            ]},
            { judul: 'Tampilan', fields: [
                { id: 'padding', label: 'Padding (rem)', jenis: 'box', step: 0.25 },
                { id: 'margin', label: 'Margin (rem)', jenis: 'box', step: 0.25 }
            ]}
        ]
    }
};

// Merge _skemaLama ke P.SKEMA_BLOCK
// Hanya isi kalau key belum ada (skema modular lebih prioritas)
P.SKEMA_BLOCK = P.SKEMA_BLOCK || {};
for (var _k in _skemaLama) {
    if (_skemaLama.hasOwnProperty(_k) && !P.SKEMA_BLOCK.hasOwnProperty(_k)) {
        P.SKEMA_BLOCK[_k] = _skemaLama[_k];
    }
}

/* ======================================================================
   JENIS BLOCK — deteksi jenis dari tag + kelas
   ====================================================================== */
P.jenisBlock = function(block) {
    var tag = block.tag;
    var kelas = block.kelas || '';

    // Prioritas 1: kalau block punya field `jenis` eksplisit, pakai itu
    if (block.jenis && P.SKEMA_BLOCK[block.jenis]) return block.jenis;

    // Prioritas 2: deteksi dari tag + kelas (existing behavior untuk block lama)
    if (tag === 'p' || tag === 'h1' || tag === 'h2' || tag === 'h3' ||
        tag === 'h4' || tag === 'h5' || tag === 'h6' ||
        tag === 'blockquote' || tag === 'pre') return 'teks';
    if (tag === 'img') return 'gambar';
    if (tag === 'table') return 'tabel';
    if (tag === 'hr') return 'hr';
    if (tag === 'ul' || tag === 'ol') return 'daftar';

    if (kelas.indexOf('tombol-melayang') >= 0) return 'tombol';
    if (kelas.indexOf('tombol') >= 0) return 'tombol';
    if (kelas.indexOf('kartu') >= 0) return 'kartu';
    if (kelas.indexOf('akordion') >= 0) return 'akordion';
    if (kelas.indexOf('pemisah-teks') >= 0) return 'pemisah';
    if (kelas.indexOf('ruas-input') >= 0) return 'form-input';
    if (kelas.indexOf('centang') >= 0) return 'pilihan';
    if (kelas.indexOf('radio') >= 0) return 'pilihan';
    if (kelas.indexOf('saklar') >= 0) return 'pilihan';
    if (kelas.indexOf('deret') >= 0) return 'slider';
    if (kelas.indexOf('langkah-angka') >= 0) return 'stepper';
    if (kelas.indexOf('segment') >= 0) return 'segment';
    if (kelas.indexOf('toggle-grup') >= 0) return 'toggle-grup';
    if (kelas.indexOf('bilah-aplikasi') >= 0) return 'bilah-aplikasi';
    if (kelas.indexOf('tab-bilah') >= 0) return 'tab';
    if (kelas.indexOf('menu-mendatar') >= 0) return 'menu-mendatar';
    if (kelas.indexOf('pesan') >= 0) return 'pesan';
    if (kelas.indexOf('chip') >= 0) return 'chip';
    if (kelas.indexOf('badge') >= 0) return 'badge';
    if (kelas.indexOf('progress') >= 0) return 'progress';
    if (kelas.indexOf('tooltip') >= 0) return 'tooltip';
    if (kelas.indexOf('avatar') >= 0) return 'avatar';
    if (kelas.indexOf('daftar') >= 0) return 'daftar-komponen';

    // Prioritas 3: lookup dari SKEMA_BLOCK berdasarkan kelasDefault
    // Berguna untuk block baru (kode-inline, sorotan, keyboard, dll)
    if (kelas) {
        var kelasTokens = kelas.split(/\s+/);
        for (var jenis in P.SKEMA_BLOCK) {
            if (!P.SKEMA_BLOCK.hasOwnProperty(jenis)) continue;
            var skema = P.SKEMA_BLOCK[jenis];
            if (!skema.kelasDefault) continue;
            var defTokens = skema.kelasDefault.split(/\s+/);
            // Cek apakah semua kelasDefault ada di kelas block
            var match = true;
            for (var i = 0; i < defTokens.length; i++) {
                if (kelasTokens.indexOf(defTokens[i]) < 0) { match = false; break; }
            }
            if (match) return jenis;
        }
    }

    // Spacer: tag div tanpa kelas dengan properti style height
    if (tag === 'div' && (!kelas || kelas === '')) {
        if (block.properti && block.properti.style && block.properti.style.indexOf('height') >= 0) {
            return 'spacer';
        }
    }

    return 'teks'; // default
};

/* ======================================================================
   CARI BLOCK
   ====================================================================== */
P.cariBlockById = function(blockId) {
    var node = P.getById(P.STATE.editMode.regionId);
    if (!node || !node.blocks) return null;
    for (var i = 0; i < node.blocks.length; i++) {
        if (node.blocks[i].id === blockId) return node.blocks[i];
    }
    return null;
};

P.cariIndexBlock = function(blockId) {
    var node = P.getById(P.STATE.editMode.regionId);
    if (!node || !node.blocks) return -1;
    for (var i = 0; i < node.blocks.length; i++) {
        if (node.blocks[i].id === blockId) return i;
    }
    return -1;
};

/* ======================================================================
   PILIH / BATAL PILIH BLOCK
   ====================================================================== */
P.pilihBlock = function(blockId) {
    P.STATE.editMode.selectedBlockId = blockId;
    P.renderBlocks();
    // Auto-show panel komponen saat block dipilih
    var panelBlock = document.getElementById('panel-properti');
    if (panelBlock && panelBlock.hidden) {
        panelBlock.hidden = false;
        // Posisi default kalau belum pernah di-drag
        if (!panelBlock.style.top && !panelBlock.style.bottom && !panelBlock.style.right && !panelBlock.style.left) {
            panelBlock.style.bottom = '48px';
            panelBlock.style.right = '8px';
        }
        var btnP = document.getElementById('btn-properti');
        if (btnP) btnP.classList.add('pondasi-editor-bar-aktif');
    }
    // Panel region sudah default visible — tidak perlu auto-show
    // (cukup re-render untuk update kondisional seksi editable)
    P.renderPanel();
};

P.batalPilihBlock = function() {
    P.STATE.editMode.selectedBlockId = null;
    P.renderBlocks();
    // Auto-hide panel komponen saat deselect block
    var panelBlock = document.getElementById('panel-properti');
    if (panelBlock && !panelBlock.hidden) {
        panelBlock.hidden = true;
        var btnP = document.getElementById('btn-properti');
        if (btnP) btnP.classList.remove('pondasi-editor-bar-aktif');
    }
    P.renderPanel();
};

/* ======================================================================
   RENDER PANEL — dispatcher
   Sekarang ada 2 panel terpisah:
   - panel-properti-region → render region properties (selalu tampil saat tidak di dialog)
   - panel-properti (komponen) → render block properties (tampil saat block dipilih)
   ====================================================================== */
P.renderPanel = function() {
    // === RENDER PANEL REGION ===
    var panelRegion = document.getElementById('panel-properti-region');
    var badanRegion = document.getElementById('panel-properti-region-badan');
    var judulRegion = document.getElementById('panel-properti-region-judul');

    if (panelRegion && !panelRegion.hidden && badanRegion) {
        P._savePanelState(badanRegion);
        while (badanRegion.firstChild) badanRegion.removeChild(badanRegion.firstChild);
        P.renderPanelRegion(badanRegion, judulRegion);
        P._restorePanelState(badanRegion);
    }

    // === RENDER PANEL KOMPONEN ===
    var panelBlock = document.getElementById('panel-properti');
    var badanBlock = document.getElementById('panel-properti-badan');
    var judulBlock = document.getElementById('panel-properti-judul');

    if (panelBlock && !panelBlock.hidden && badanBlock) {
        if (P.STATE.editMode.selectedBlockId) {
            var block = P.cariBlockById(P.STATE.editMode.selectedBlockId);
            if (block) {
                // Validasi classContext
                var hierarchy = P.getBlockClassHierarchy ? P.getBlockClassHierarchy(block) : [];
                var contextValid = false;
                for (var hi = 0; hi < hierarchy.length; hi++) {
                    if (hierarchy[hi].kelas === P.STATE.editMode.classContext) { contextValid = true; break; }
                }
                if (!contextValid) P.STATE.editMode.classContext = null;

                P._savePanelState(badanBlock);
                while (badanBlock.firstChild) badanBlock.removeChild(badanBlock.firstChild);
                P.renderPanelBlock(badanBlock, block, judulBlock);
                P._restorePanelState(badanBlock);
            } else {
                panelBlock.hidden = true;
                P.STATE.editMode.selectedBlockId = null;
            }
        } else {
            panelBlock.hidden = true;
        }
    }
};

/* Helper: simpan state seksi + details sebelum re-render */
P._savePanelState = function(badan) {
    badan._seksiState = {};
    var seksis = badan.querySelectorAll('.pondasi-properti-seksi');
    for (var si = 0; si < seksis.length; si++) {
        var judulSeksi = seksis[si].querySelector('.pondasi-properti-seksi-judul');
        if (judulSeksi) {
            badan._seksiState[judulSeksi.textContent] = !seksis[si].classList.contains('pondasi-properti-seksi-tutup');
        }
    }
    badan._detailsState = {};
    var details = badan.querySelectorAll('.pondasi-properti-grup');
    for (var di = 0; di < details.length; di++) {
        var summary = details[di].querySelector('summary');
        if (summary) {
            badan._detailsState[summary.textContent] = details[di].hasAttribute('open');
        }
    }
};

/* Helper: restore state seksi + details setelah re-render */
P._restorePanelState = function(badan) {
    if (!badan._seksiState) return;
    var seksis = badan.querySelectorAll('.pondasi-properti-seksi');
    for (var si = 0; si < seksis.length; si++) {
        var judulSeksi = seksis[si].querySelector('.pondasi-properti-seksi-judul');
        if (judulSeksi && badan._seksiState[judulSeksi.textContent] !== undefined) {
            if (badan._seksiState[judulSeksi.textContent]) {
                seksis[si].classList.remove('pondasi-properti-seksi-tutup');
            } else {
                seksis[si].classList.add('pondasi-properti-seksi-tutup');
            }
        }
    }
    var details = badan.querySelectorAll('.pondasi-properti-grup');
    for (var di = 0; di < details.length; di++) {
        var summary = details[di].querySelector('summary');
        if (summary && badan._detailsState[summary.textContent]) {
            details[di].setAttribute('open', 'open');
        }
    }
    delete badan._seksiState;
    delete badan._detailsState;
};


P.buatSeksi = function(judul, buka, isiFn) {
    var seksi = document.createElement('div');
    seksi.className = 'pondasi-properti-seksi' + (buka ? '' : ' pondasi-properti-seksi-tutup');

    var header = document.createElement('div');
    header.className = 'pondasi-properti-seksi-header';
    header.setAttribute('tabindex', '0');
    header.innerHTML = '<span class="pondasi-properti-seksi-judul">' + judul + '</span>' +
        '<span class="pondasi-properti-seksi-arrow">&#9662;</span>';

    var isi = document.createElement('div');
    isi.className = 'pondasi-properti-seksi-isi';
    if (isiFn) isiFn(isi);

    header.onclick = function() {
        seksi.classList.toggle('pondasi-properti-seksi-tutup');
    };

    seksi.appendChild(header);
    seksi.appendChild(isi);
    return seksi;
};

/* === BANTU: BUAT STATE TABS (pseudo-class) ===
   Tabs: Normal | Hover | Focus | Active
   Setiap tab menampilkan field yang bisa diisi untuk state tersebut.
   Nilai disimpan di block.stateStyle = { ':hover': {...}, ':focus': {...}, ... }
   */

P.escHtml = function(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

P.escAttr = function(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};

/* Strip HTML tag dari string, return textContent saja.
   Mis. "<div class='kartu-kepala'>Judul</div>" → "Judul"
   */
P.stripHtml = function(html) {
    if (html == null) return '';
    var tmp = document.createElement('div');
    tmp.innerHTML = String(html);
    return tmp.textContent || tmp.innerText || '';
};

/* ======================================================================
   FIELD → CSS PROP MAPPING
   ====================================================================== */
P.fieldToCssProp = function(field) {
    var map = {
        'warnaTeks': 'color',
        'latar': 'background-color',
        'gambarLatar': 'background-image',
        'ukuranFont': 'font-size',
        'keluargaFont': 'font-family',
        'tinggiBaris': 'line-height',
        'tebal': 'font-weight',
        'miring': 'font-style',
        'dekorasi': 'text-decoration',
        'transformasi': 'text-transform',
        'spasiHuruf': 'letter-spacing',
        'align': 'text-align',
        'radius': 'border-radius',
        'lebar': 'width',
        'tinggi': 'height',
        'minWidth': 'min-width',
        'maxWidth': 'max-width',
        'borderGaya': 'border-style',
        'borderWarna': 'border-color',
        'borderLebar': 'border-width',
        'display': 'display',
        'position': 'position',
        'float': 'float',
        'boxSizing': 'box-sizing',
        'z-index': 'z-index',
        'overflow': 'overflow',
        'opacity': 'opacity',
        'boxShadow': 'box-shadow',
        'textShadow': 'text-shadow',
        'cursor': 'cursor',
        'transition': 'transition',
        'animation': 'animation',
        'transform': 'transform',
        'margin': 'margin',
        'padding': 'padding',
        'warnaNilai': 'color'
    };
    return map[field] || field;
};

P.fieldToCssPropBox = function(field, sisi) {
    var s = P.capitalize(sisi);
    if (field === 'padding') return 'padding' + s;
    if (field === 'margin') return 'margin' + s;
    if (field === 'borderLebar') return 'border' + s + 'Width';
    if (field === 'radius') return 'border' + s + 'Radius';
    return field + s;
};

/* ======================================================================
   PARSE / SERIALIZE ITEMS (untuk daftar editor)
   ====================================================================== */
P.parseItems = function(text, format) {
    if (!text) return [];
    var lines = text.split('\n');
    var items = [];
    lines.forEach(function(line) {
        line = line.trim();
        if (!line) return;
        var item;
        if (format === 'isi') {
            item = { isi: line };
        } else if (format === 'label-aktif') {
            var aktif = false;
            if (line.charAt(0) === '*') {
                aktif = true;
                line = line.slice(1);
            }
            item = { label: line, aktif: aktif };
        } else if (format === 'judul-isi') {
            var terbuka = false;
            if (line.charAt(0) === '*') {
                terbuka = true;
                line = line.slice(1);
            }
            var parts = line.split('|');
            item = { judul: (parts[0] || '').trim(), isi: (parts[1] || '').trim(),
                terbuka: terbuka };
        } else if (format === 'label-href') {
            var aktifH = false;
            if (line.charAt(0) === '*') {
                aktifH = true;
                line = line.slice(1);
            }
            var partsH = line.split('|');
            item = { label: (partsH[0] || '').trim(), href: (partsH[1] || '').trim(),
                aktif: aktifH };
        } else {
            item = { isi: line };
        }
        items.push(item);
    });
    return items;
};

P.serializeItems = function(items, format) {
    if (!items || items.length === 0) return '';
    return items.map(function(item) {
        if (format === 'isi') {
            return item.isi || '';
        } else if (format === 'label-aktif') {
            return (item.aktif ? '*' : '') + (item.label || '');
        } else if (format === 'judul-isi') {
            return (item.terbuka ? '*' : '') + (item.judul || '') + ' | ' + (item.isi || '');
        } else if (format === 'label-href') {
            return (item.aktif ? '*' : '') + (item.label || '') + ' | ' + (item.href || '');
        }
        return '';
    }).join('\n');
};

/* ======================================================================
   APPLY STYLE & AKSI TO BLOCK ELEMENT
   ====================================================================== */

