/* PONDASI-BLOK-TOMBOL.JS
   Skema block untuk kategori Tombol:
   - tombol-berisi, tombol-garis, tombol-hantu, tombol-ikon, tombol-melayang, grup-tombol
   */
var P = P || {};
P.SKEMA_BLOCK = P.SKEMA_BLOCK || {};

P.SKEMA_BLOCK['tombol-berisi'] = {
    nama: 'Tombol Berisi',
    tag: 'button',
    kelasDefault: 'tombol tombol-berisi',
    kategori: 'Tombol',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'isi', label: 'Teks tombol', jenis: 'teks', placeholder: 'Kirim' },
            { id: 'ikon', label: 'Ikon (opsional)', jenis: 'teks', placeholder: 'fa-paper-plane' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'tombol tombol-berisi' }
        ]},
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM },
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Aksi', fields: [
            { id: 'aksi', label: 'Aksi', jenis: 'aksi' }
        ]}
    ]
};

P.SKEMA_BLOCK['tombol-garis'] = {
    nama: 'Tombol Garis',
    tag: 'button',
    kelasDefault: 'tombol tombol-garis',
    kategori: 'Tombol',
    kategoriDropdown: 'komponen',
    bagian: P.SKEMA_BLOCK['tombol-berisi'].bagian.map(function (b) {
        if (b.judul === 'Kelas') return { judul: 'Kelas', fields: [{ id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'tombol tombol-garis' }] };
        return b;
    })
};

P.SKEMA_BLOCK['tombol-hantu'] = {
    nama: 'Tombol Hantu (Ghost)',
    tag: 'button',
    kelasDefault: 'tombol tombol-datar',
    kategori: 'Tombol',
    kategoriDropdown: 'komponen',
    bagian: P.SKEMA_BLOCK['tombol-berisi'].bagian.map(function (b) {
        if (b.judul === 'Kelas') return { judul: 'Kelas', fields: [{ id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'tombol tombol-datar' }] };
        return b;
    })
};

P.SKEMA_BLOCK['tombol-ikon'] = {
    nama: 'Tombol Ikon',
    tag: 'button',
    kelasDefault: 'tombol tombol-ikon',
    kategori: 'Tombol',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'isi', label: 'Ikon (kelas FontAwesome)', jenis: 'teks', placeholder: 'fa-search' },
            { id: 'judul', label: 'Aksesibilitas (title)', jenis: 'teks', placeholder: 'Cari' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'tombol tombol-ikon' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Aksi', fields: [
            { id: 'aksi', label: 'Aksi', jenis: 'aksi' }
        ]}
    ]
};

P.SKEMA_BLOCK['tombol-melayang'] = {
    nama: 'Tombol Melayang (FAB)',
    tag: 'button',
    kelasDefault: 'tombol-melayang',
    kategori: 'Tombol',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'isi', label: 'Ikon', jenis: 'teks', placeholder: 'fa-plus' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'tombol-melayang' }
        ]},
        { judul: 'Posisi', fields: [
            { id: 'posisi', label: 'Posisi layar', jenis: 'pilih',
              opsi: ['kanan-bawah', 'kiri-bawah', 'kanan-atas', 'kiri-atas'] }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Aksi', fields: [
            { id: 'aksi', label: 'Aksi', jenis: 'aksi' }
        ]}
    ]
};

P.SKEMA_BLOCK['grup-tombol'] = {
    nama: 'Grup Tombol',
    tag: 'div',
    kelasDefault: 'grup-tombol',
    kategori: 'Tombol',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Tombol', buka: true, fields: [
            { id: 'items', label: 'Tombol (satu per baris)', jenis: 'daftar', format: 'tombol',
              placeholder: 'Kiri\nTengah\nKanan' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'grup-tombol' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM }
    ]
};
