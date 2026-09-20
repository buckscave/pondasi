/* PONDASI-BLOK-NAVIGASI.JS
   Skema block untuk kategori Navigasi:
   - bilah-aplikasi, menu-mendatar, breadcrumb, tab, pagination, mega-menu, header, footer
   */
var P = P || {};
P.SKEMA_BLOCK = P.SKEMA_BLOCK || {};

P.SKEMA_BLOCK['bilah-aplikasi'] = {
    nama: 'Bilah Aplikasi (Navbar)',
    tag: 'nav',
    kelasDefault: 'bilah-aplikasi',
    kategori: 'Navigasi',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'judul', label: 'Nama brand', jenis: 'teks', placeholder: 'pondasi' },
            { id: 'items', label: 'Item menu (satu per baris)', jenis: 'daftar', format: 'isi',
              placeholder: 'Beranda\nTentang\nKontak' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'bilah-aplikasi' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['menu-mendatar'] = {
    nama: 'Menu Mendatar',
    tag: 'nav',
    kelasDefault: 'menu-mendatar',
    kategori: 'Navigasi',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Item', buka: true, fields: [
            { id: 'items', label: 'Item menu (satu per baris)', jenis: 'daftar', format: 'isi',
              placeholder: 'Beranda\nProduk\nLayanan\nKontak' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'menu-mendatar' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['breadcrumb'] = {
    nama: 'Breadcrumb',
    tag: 'nav',
    kelasDefault: 'breadcrumb',
    kategori: 'Navigasi',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Item', buka: true, fields: [
            { id: 'items', label: 'Path (satu per baris)', jenis: 'daftar', format: 'isi',
              placeholder: 'Beranda\nProduk\nDetail' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'breadcrumb' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['tab'] = {
    nama: 'Tab',
    tag: 'div',
    kelasDefault: 'tab-bilah',
    kategori: 'Navigasi',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Item', buka: true, fields: [
            { id: 'items', label: 'Tab (judul | isi)', jenis: 'daftar', format: 'akordion',
              placeholder: 'Umum | Isi tab umum\nPrivasi | Isi tab privasi' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'tab-bilah' }
        ]},
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['pagination'] = {
    nama: 'Pagination',
    tag: 'nav',
    kelasDefault: 'pagination',
    kategori: 'Navigasi',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'halaman', label: 'Halaman aktif', jenis: 'angka', step: 1, min: 1, value: 2 },
            { id: 'total', label: 'Total halaman', jenis: 'angka', step: 1, min: 1, value: 5 }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'pagination' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['mega-menu'] = {
    nama: 'Mega Menu (CSS pure)',
    tag: 'nav',
    kelasDefault: 'mega-menu',
    kategori: 'Navigasi',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Item', buka: true, fields: [
            { id: 'items', label: 'Kategori | item (pisah kategori dengan ##)', jenis: 'textarea',
              placeholder: 'Produk ## Item 1\nItem 2\nItem 3\nLayanan ## Item 4\nItem 5' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'mega-menu' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['header'] = {
    nama: 'Header',
    tag: 'header',
    kelasDefault: 'header',
    kategori: 'Navigasi',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'judul', label: 'Judul', jenis: 'teks', placeholder: 'Nama situs' },
            { id: 'isi', label: 'Subjudul', jenis: 'teks', placeholder: 'Tagline singkat' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'header' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['footer'] = {
    nama: 'Footer',
    tag: 'footer',
    kelasDefault: 'footer',
    kategori: 'Navigasi',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'isi', label: 'Teks hak cipta', jenis: 'textarea', placeholder: '© 2026 Nama Perusahaan. Semua hak dilindungi.' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'footer' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};
