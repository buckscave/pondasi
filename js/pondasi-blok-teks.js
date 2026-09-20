/* PONDASI-BLOK-TEKS.JS
   Skema block untuk kategori Teks (isi dasar):
   - paragraf, heading-1, heading-2, heading-3, heading-4, heading-5, heading-6
   - kutipan, kode-blok, kode-inline, sorotan, keyboard, singkatan, subjudul-1, subjudul-2
   - keterangan, label-atas
   */
var P = P || {};
P.SKEMA_BLOCK = P.SKEMA_BLOCK || {};

P.SKEMA_BLOCK['paragraf'] = {
    nama: 'Paragraf',
    tag: 'p',
    kelasDefault: 'isi-1',
    kategori: 'Teks',
    kategoriDropdown: 'isi',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'isi', label: 'Teks', jenis: 'textarea', placeholder: 'Ketik paragraf...' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'isi-1' }
        ]},
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM },
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM }
    ]
};

P.SKEMA_BLOCK['heading-1'] = {
    nama: 'Heading 1',
    tag: 'h1',
    kelasDefault: 'judul-1',
    kategori: 'Teks',
    kategoriDropdown: 'isi',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'isi', label: 'Teks', jenis: 'teks', placeholder: 'Judul level 1' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'judul-1' }
        ]},
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM },
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM }
    ]
};

P.SKEMA_BLOCK['heading-2'] = {
    nama: 'Heading 2',
    tag: 'h2',
    kelasDefault: 'judul-2',
    kategori: 'Teks',
    kategoriDropdown: 'isi',
    bagian: P.SKEMA_BLOCK['heading-1'].bagian.map(function (b) {
        if (b.judul === 'Konten') return { judul: 'Konten', buka: true, fields: [{ id: 'isi', label: 'Teks', jenis: 'teks', placeholder: 'Judul level 2' }] };
        if (b.judul === 'Kelas') return { judul: 'Kelas', fields: [{ id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'judul-2' }] };
        return b;
    })
};

P.SKEMA_BLOCK['heading-3'] = {
    nama: 'Heading 3',
    tag: 'h3',
    kelasDefault: 'judul-3',
    kategori: 'Teks',
    kategoriDropdown: 'isi',
    bagian: P.SKEMA_BLOCK['heading-1'].bagian.map(function (b) {
        if (b.judul === 'Konten') return { judul: 'Konten', buka: true, fields: [{ id: 'isi', label: 'Teks', jenis: 'teks', placeholder: 'Judul level 3' }] };
        if (b.judul === 'Kelas') return { judul: 'Kelas', fields: [{ id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'judul-3' }] };
        return b;
    })
};

P.SKEMA_BLOCK['heading-4'] = {
    nama: 'Heading 4',
    tag: 'h4',
    kelasDefault: 'judul-4',
    kategori: 'Teks',
    kategoriDropdown: 'isi',
    bagian: P.SKEMA_BLOCK['heading-1'].bagian.map(function (b) {
        if (b.judul === 'Konten') return { judul: 'Konten', buka: true, fields: [{ id: 'isi', label: 'Teks', jenis: 'teks', placeholder: 'Judul level 4' }] };
        if (b.judul === 'Kelas') return { judul: 'Kelas', fields: [{ id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'judul-4' }] };
        return b;
    })
};

P.SKEMA_BLOCK['heading-5'] = {
    nama: 'Heading 5',
    tag: 'h5',
    kelasDefault: 'judul-5',
    kategori: 'Teks',
    kategoriDropdown: 'isi',
    bagian: P.SKEMA_BLOCK['heading-1'].bagian.map(function (b) {
        if (b.judul === 'Konten') return { judul: 'Konten', buka: true, fields: [{ id: 'isi', label: 'Teks', jenis: 'teks', placeholder: 'Judul level 5' }] };
        if (b.judul === 'Kelas') return { judul: 'Kelas', fields: [{ id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'judul-5' }] };
        return b;
    })
};

P.SKEMA_BLOCK['heading-6'] = {
    nama: 'Heading 6',
    tag: 'h6',
    kelasDefault: 'judul-6',
    kategori: 'Teks',
    kategoriDropdown: 'isi',
    bagian: P.SKEMA_BLOCK['heading-1'].bagian.map(function (b) {
        if (b.judul === 'Konten') return { judul: 'Konten', buka: true, fields: [{ id: 'isi', label: 'Teks', jenis: 'teks', placeholder: 'Judul level 6' }] };
        if (b.judul === 'Kelas') return { judul: 'Kelas', fields: [{ id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'judul-6' }] };
        return b;
    })
};

P.SKEMA_BLOCK['subjudul-1'] = {
    nama: 'Subjudul 1',
    tag: 'h2',
    kelasDefault: 'subjudul-1',
    kategori: 'Teks',
    kategoriDropdown: 'isi',
    bagian: P.SKEMA_BLOCK['heading-1'].bagian.map(function (b) {
        if (b.judul === 'Konten') return { judul: 'Konten', buka: true, fields: [{ id: 'isi', label: 'Teks', jenis: 'teks', placeholder: 'Subjudul' }] };
        if (b.judul === 'Kelas') return { judul: 'Kelas', fields: [{ id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'subjudul-1' }] };
        return b;
    })
};

P.SKEMA_BLOCK['subjudul-2'] = {
    nama: 'Subjudul 2',
    tag: 'h3',
    kelasDefault: 'subjudul-2',
    kategori: 'Teks',
    kategoriDropdown: 'isi',
    bagian: P.SKEMA_BLOCK['heading-1'].bagian.map(function (b) {
        if (b.judul === 'Konten') return { judul: 'Konten', buka: true, fields: [{ id: 'isi', label: 'Teks', jenis: 'teks', placeholder: 'Subjudul' }] };
        if (b.judul === 'Kelas') return { judul: 'Kelas', fields: [{ id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'subjudul-2' }] };
        return b;
    })
};

P.SKEMA_BLOCK['kutipan'] = {
    nama: 'Kutipan',
    tag: 'blockquote',
    kelasDefault: 'kutipan',
    kategori: 'Teks',
    kategoriDropdown: 'isi',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'isi', label: 'Teks kutipan', jenis: 'textarea', placeholder: 'Teks yang dikutip...' },
            { id: 'sumber', label: 'Sumber', jenis: 'teks', placeholder: '— Penulis, Judul Buku' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'kutipan' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['kode-blok'] = {
    nama: 'Kode Blok',
    tag: 'pre',
    kelasDefault: 'kode',
    kategori: 'Teks',
    kategoriDropdown: 'isi',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'isi', label: 'Kode', jenis: 'textarea', placeholder: '<div>\n  <p>Contoh</p>\n</div>' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'kode' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['kode-inline'] = {
    nama: 'Kode Inline',
    tag: 'code',
    kelasDefault: 'kode-inline',
    kategori: 'Teks',
    kategoriDropdown: 'isi',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'isi', label: 'Kode', jenis: 'teks', placeholder: '' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'kode-inline' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['sorotan'] = {
    nama: 'Teks Sorotan',
    tag: 'mark',
    kelasDefault: 'sorotan',
    kategori: 'Teks',
    kategoriDropdown: 'isi',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'isi', label: 'Teks', jenis: 'teks', placeholder: 'Teks yang disorot' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'sorotan' }
        ]},
        { judul: 'Warna', fields: [
            { id: 'warnaLatar', label: 'Warna latar', jenis: 'warna' },
            { id: 'warnaTeks', label: 'Warna teks', jenis: 'warna' }
        ]},
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['keyboard'] = {
    nama: 'Tombol Keyboard',
    tag: 'kbd',
    kelasDefault: 'keyboard',
    kategori: 'Teks',
    kategoriDropdown: 'isi',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'isi', label: 'Tombol', jenis: 'teks', placeholder: 'Ctrl + S' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'keyboard' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['singkatan'] = {
    nama: 'Singkatan',
    tag: 'abbr',
    kelasDefault: 'singkatan',
    kategori: 'Teks',
    kategoriDropdown: 'isi',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'isi', label: 'Singkatan', jenis: 'teks', placeholder: 'HTML' },
            { id: 'judul', label: 'Kepanjangan', jenis: 'teks', placeholder: 'HyperText Markup Language' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'singkatan' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['keterangan'] = {
    nama: 'Keterangan',
    tag: 'small',
    kelasDefault: 'keterangan',
    kategori: 'Teks',
    kategoriDropdown: 'isi',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'isi', label: 'Teks', jenis: 'textarea', placeholder: 'Keterangan kecil...' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'keterangan' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['label-atas'] = {
    nama: 'Label Atas (Overline)',
    tag: 'span',
    kelasDefault: 'label-atas',
    kategori: 'Teks',
    kategoriDropdown: 'isi',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'isi', label: 'Teks', jenis: 'teks', placeholder: 'LABEL ATAS' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'label-atas' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

/* Tambah styling default untuk teks inline baru di tampilan-teks.css */
