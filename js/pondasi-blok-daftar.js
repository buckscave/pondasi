/* PONDASI-BLOK-DAFTAR.JS
   Skema block untuk kategori Daftar:
   - daftar-bullet, daftar-nomor, daftar-definisi, daftar-komponen
   */
var P = P || {};
P.SKEMA_BLOCK = P.SKEMA_BLOCK || {};

P.SKEMA_BLOCK['daftar-bullet'] = {
    nama: 'Daftar Bullet',
    tag: 'ul',
    kelasDefault: 'daftar',
    kategori: 'Daftar',
    kategoriDropdown: 'isi',
    bagian: [
        { judul: 'Item', buka: true, fields: [
            { id: 'items', label: 'Item (satu per baris)', jenis: 'daftar', format: 'isi',
              placeholder: 'Item 1\nItem 2\nItem 3' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'daftar' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['daftar-nomor'] = {
    nama: 'Daftar Nomor',
    tag: 'ol',
    kelasDefault: 'daftar',
    kategori: 'Daftar',
    kategoriDropdown: 'isi',
    bagian: [
        { judul: 'Item', buka: true, fields: [
            { id: 'items', label: 'Item (satu per baris)', jenis: 'daftar', format: 'isi',
              placeholder: 'Langkah 1\nLangkah 2\nLangkah 3' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'daftar' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['daftar-definisi'] = {
    nama: 'Daftar Definisi',
    tag: 'dl',
    kelasDefault: 'daftar-definisi',
    kategori: 'Daftar',
    kategoriDropdown: 'isi',
    bagian: [
        { judul: 'Item', buka: true, fields: [
            { id: 'itemsDefinisi', label: 'Istilah & definisi', jenis: 'daftar-definisi',
              placeholder: 'Istilah 1: Definisi 1\nIstilah 2: Definisi 2' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'daftar-definisi' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['daftar-komponen'] = {
    nama: 'Daftar Komponen',
    tag: 'ul',
    kelasDefault: 'daftar-komponen',
    kategori: 'Daftar',
    kategoriDropdown: 'isi',
    bagian: [
        { judul: 'Item', buka: true, fields: [
            { id: 'items', label: 'Item daftar', jenis: 'daftar', format: 'komponen',
              placeholder: 'Judul 1\nJudul 2\nJudul 3' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'daftar-komponen' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};
