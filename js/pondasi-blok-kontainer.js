/* PONDASI-BLOK-KONTAINER.JS
   Skema block untuk kategori Kontainer:
   - kartu, akordion, pemisah-teks, hero, modal, drawer, banner, empty-state
   */
var P = P || {};
P.SKEMA_BLOCK = P.SKEMA_BLOCK || {};

P.SKEMA_BLOCK['kartu'] = {
    nama: 'Kartu',
    tag: 'div',
    kelasDefault: 'kartu',
    kategori: 'Kontainer',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'judul', label: 'Judul', jenis: 'teks', placeholder: 'Judul kartu' },
            { id: 'isi', label: 'Isi', jenis: 'textarea', placeholder: 'Isi kartu...' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'kartu' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['akordion'] = {
    nama: 'Akordion',
    tag: 'div',
    kelasDefault: 'akordion',
    kategori: 'Kontainer',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Item', buka: true, fields: [
            { id: 'items', label: 'Item (judul | isi)', jenis: 'daftar', format: 'akordion',
              placeholder: 'Bagian 1 | Isi bagian 1\nBagian 2 | Isi bagian 2' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'akordion' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['pemisah-teks-komponen'] = {
    nama: 'Pemisah Teks (Komponen)',
    tag: 'div',
    kelasDefault: 'pemisah-teks',
    kategori: 'Kontainer',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'isi', label: 'Teks di tengah', jenis: 'teks', placeholder: 'Atau' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'pemisah-teks' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['hero'] = {
    nama: 'Hero / Banner',
    tag: 'section',
    kelasDefault: 'hero',
    kategori: 'Kontainer',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'judul', label: 'Judul utama', jenis: 'teks', placeholder: 'Selamat datang' },
            { id: 'isi', label: 'Subjudul', jenis: 'textarea', placeholder: 'Deskripsi singkat...' },
            { id: 'label', label: 'Teks tombol', jenis: 'teks', placeholder: 'Mulai sekarang' },
            { id: 'url', label: 'URL tombol', jenis: 'teks', placeholder: '#' }
        ]},
        { judul: 'Background', fields: [
            { id: 'gambar', label: 'URL gambar background', jenis: 'teks', placeholder: 'https://...' },
            { id: 'warnaLatar', label: 'Warna latar', jenis: 'warna' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'hero' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['modal'] = {
    nama: 'Modal / Dialog (CSS pure)',
    tag: 'div',
    kelasDefault: 'modal',
    kategori: 'Kontainer',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'judul', label: 'Judul modal', jenis: 'teks', placeholder: 'Konfirmasi' },
            { id: 'isi', label: 'Isi modal', jenis: 'textarea', placeholder: 'Apakah Anda yakin?' },
            { id: 'label', label: 'Teks tombol OK', jenis: 'teks', placeholder: 'Ya, lanjutkan' }
        ]},
        { judul: 'Trigger', fields: [
            { id: 'target', label: 'ID target (#hash URL)', jenis: 'teks', placeholder: 'modal-1' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'modal' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['drawer'] = {
    nama: 'Drawer / Sidebar Toggle (CSS pure)',
    tag: 'div',
    kelasDefault: 'drawer',
    kategori: 'Kontainer',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'judul', label: 'Judul drawer', jenis: 'teks', placeholder: 'Menu' },
            { id: 'isi', label: 'Isi drawer', jenis: 'textarea', placeholder: 'Item menu...' }
        ]},
        { judul: 'Trigger', fields: [
            { id: 'target', label: 'ID checkbox trigger', jenis: 'teks', placeholder: 'drawer-toggle-1' },
            { id: 'posisi', label: 'Posisi', jenis: 'pilih', opsi: ['kiri', 'kanan'] }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'drawer' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['banner'] = {
    nama: 'Banner / CTA',
    tag: 'section',
    kelasDefault: 'banner',
    kategori: 'Kontainer',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'judul', label: 'Judul', jenis: 'teks', placeholder: 'Penawaran terbatas!' },
            { id: 'isi', label: 'Teks', jenis: 'textarea', placeholder: 'Diskon 50% hari ini.' },
            { id: 'label', label: 'Teks tombol', jenis: 'teks', placeholder: 'Beli sekarang' },
            { id: 'url', label: 'URL tombol', jenis: 'teks', placeholder: '#' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'banner' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['empty-state'] = {
    nama: 'Empty State',
    tag: 'div',
    kelasDefault: 'kosong',
    kategori: 'Kontainer',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'judul', label: 'Judul', jenis: 'teks', placeholder: 'Belum ada data' },
            { id: 'isi', label: 'Teks keterangan', jenis: 'textarea', placeholder: 'Tambahkan data untuk melihatnya di sini.' },
            { id: 'label', label: 'Teks tombol aksi', jenis: 'teks', placeholder: 'Tambah data' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'kosong' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};
