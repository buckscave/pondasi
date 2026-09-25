/* PONDASI-BLOK-LAINNYA.JS
   Skema block untuk kategori Lainnya:
   - chip, badge, avatar, daftar-komponen, timeline, tree-view
   - jam, tanggal, hitung-mundur (block dinamis)
   */
var P = P || {};
P.SKEMA_BLOCK = P.SKEMA_BLOCK || {};

P.SKEMA_BLOCK['chip'] = {
    nama: 'Chip / Tag',
    tag: 'span',
    kelasDefault: 'chip',
    kategori: 'Lainnya',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'isi', label: 'Teks chip', jenis: 'teks', placeholder: 'Pondasi' },
            { id: 'ikon', label: 'Ikon (opsional)', jenis: 'teks', placeholder: 'fa-tag' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'chip' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['badge'] = {
    nama: 'Badge',
    tag: 'span',
    kelasDefault: 'badge',
    kategori: 'Lainnya',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'isi', label: 'Teks badge', jenis: 'teks', placeholder: 'Baru' },
            { id: 'jenis', label: 'Jenis', jenis: 'pilih', opsi: ['angka', 'titik', 'teks'] }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'badge' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['avatar'] = {
    nama: 'Avatar',
    tag: 'div',
    kelasDefault: 'avatar',
    kategori: 'Lainnya',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Sumber', buka: true, fields: [
            { id: 'src', label: 'URL gambar', jenis: 'teks', placeholder: 'https://...' },
            { id: 'isi', label: 'Inisial (jika tanpa gambar)', jenis: 'teks', placeholder: 'AB' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'avatar' }
        ]},
        { judul: 'Ukuran', fields: [
            { id: 'ukuran', label: 'Ukuran', jenis: 'pilih', opsi: ['kecil', 'sedang', 'besar'] }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['daftar-komponen-lainnya'] = {
    nama: 'Daftar Komponen',
    tag: 'ul',
    kelasDefault: 'daftar-komponen',
    kategori: 'Lainnya',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Item', buka: true, fields: [
            { id: 'items', label: 'Item (judul | keterangan)', jenis: 'daftar', format: 'akordion',
              placeholder: 'Item 1 | Keterangan 1\nItem 2 | Keterangan 2' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'daftar-komponen' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['timeline'] = {
    nama: 'Timeline',
    tag: 'div',
    kelasDefault: 'timeline',
    kategori: 'Lainnya',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Item', buka: true, fields: [
            { id: 'items', label: 'Item (judul | isi)', jenis: 'daftar', format: 'akordion',
              placeholder: '2024-01 | Awal mula\n2024-06 | Peluncuran resmi\n2025-01 | Versi 2.0' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'timeline' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['tree-view'] = {
    nama: 'Tree View',
    tag: 'ul',
    kelasDefault: 'tree-view',
    kategori: 'Lainnya',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Item', buka: true, fields: [
            { id: 'items', label: 'Item (gunakan indentasi dengan spasi untuk nested)', jenis: 'textarea',
              placeholder: 'Folder 1\n  Sub-folder 1\n  Sub-folder 2\nFolder 2' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'tree-view' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

/* === BLOCK DINAMIS (auto-update via pondasi-aksi.js) === */

P.SKEMA_BLOCK['jam'] = {
    nama: 'Jam (Real-time)',
    tag: 'span',
    kelasDefault: '',
    kategori: 'Lainnya',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'format', label: 'Format', jenis: 'pilih', opsi: ['24', '12'] }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: '' }
        ]},
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
    ]
};

P.SKEMA_BLOCK['tanggal'] = {
    nama: 'Tanggal',
    tag: 'span',
    kelasDefault: '',
    kategori: 'Lainnya',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'format', label: 'Format', jenis: 'pilih', opsi: ['panjang', 'pendek', 'angka', 'iso'] }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: '' }
        ]},
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
    ]
};

P.SKEMA_BLOCK['hitung-mundur'] = {
    nama: 'Hitung Mundur (Countdown)',
    tag: 'span',
    kelasDefault: '',
    kategori: 'Lainnya',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'target', label: 'Target tanggal (ISO)', jenis: 'teks', placeholder: '2026-12-31T23:59:59' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: '' }
        ]},
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
    ]
};
