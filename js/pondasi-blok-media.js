/* PONDASI-BLOK-MEDIA.JS
   Skema block untuk kategori Media:
   - gambar, figure, galeri, garis-pemisah, pemisah-tebal, pemisah-titik, pemisah-putus,
     spacer, spacer-sm, spacer-md, spacer-lg, spacer-xl, kosong, skeleton
   */
var P = P || {};
P.SKEMA_BLOCK = P.SKEMA_BLOCK || {};

P.SKEMA_BLOCK['gambar'] = {
    nama: 'Gambar',
    tag: 'img',
    kelasDefault: 'gambar',
    kategori: 'Media',
    kategoriDropdown: 'isi',
    bagian: [
        { judul: 'Sumber', buka: true, fields: [
            { id: 'src', label: 'URL gambar', jenis: 'gambar-pick', placeholder: 'https://... atau klik tombol untuk pilih dari Assets' },
            { id: 'alt', label: 'Alt teks', jenis: 'teks', placeholder: 'Deskripsi gambar' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'gambar' }
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
};

P.SKEMA_BLOCK['figure'] = {
    nama: 'Figure + Caption',
    tag: 'figure',
    kelasDefault: 'gambar-bingkai',
    kategori: 'Media',
    kategoriDropdown: 'isi',
    bagian: [
        { judul: 'Sumber', buka: true, fields: [
            { id: 'src', label: 'URL gambar', jenis: 'gambar-pick', placeholder: 'https://... atau klik tombol untuk pilih dari Assets' },
            { id: 'alt', label: 'Alt teks', jenis: 'teks', placeholder: 'Deskripsi gambar' },
            { id: 'judul', label: 'Caption', jenis: 'teks', placeholder: 'Keterangan gambar' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'gambar-bingkai' }
        ]},
        { judul: 'Tampilan', fields: [
            { id: 'lebar', label: 'Lebar', jenis: 'teks', placeholder: 'auto' },
            { id: 'radius', label: 'Radius (px)', jenis: 'angka', step: 1 }
        ]}
    ]
};

P.SKEMA_BLOCK['galeri'] = {
    nama: 'Galeri Gambar',
    tag: 'div',
    kelasDefault: 'galeri',
    kategori: 'Media',
    kategoriDropdown: 'isi',
    bagian: [
        { judul: 'Gambar', buka: true, fields: [
            { id: 'items', label: 'URL gambar (satu per baris)', jenis: 'daftar', format: 'galeri',
              placeholder: 'https://gambar1.jpg\nhttps://gambar2.jpg\nhttps://gambar3.jpg' },
            { id: 'kolom', label: 'Kolom', jenis: 'pilih', opsi: ['2', '3', '4', '5'] }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'galeri' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM }
    ]
};

P.SKEMA_BLOCK['garis-pemisah'] = {
    nama: 'Garis Pemisah',
    tag: 'hr',
    kelasDefault: 'pemisah',
    kategori: 'Media',
    kategoriDropdown: 'isi',
    bagian: [
        { judul: 'Kelas', buka: true, fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'pemisah' }
        ]},
        { judul: 'Tampilan', fields: [
            { id: 'margin', label: 'Margin (rem)', jenis: 'box', step: 0.25 },
            { id: 'borderLebar', label: 'Tebal garis (px)', jenis: 'angka', step: 1 },
            { id: 'borderGaya', label: 'Gaya garis', jenis: 'pilih', opsi: ['', 'solid', 'dashed', 'dotted'] },
            { id: 'borderWarna', label: 'Warna garis', jenis: 'warna' }
        ]}
    ]
};

P.SKEMA_BLOCK['pemisah-teks'] = {
    nama: 'Pemisah Teks',
    tag: 'div',
    kelasDefault: 'pemisah-teks',
    kategori: 'Media',
    kategoriDropdown: 'isi',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'isi', label: 'Teks di tengah', jenis: 'teks', placeholder: 'Atau' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'pemisah-teks' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM }
    ]
};

P.SKEMA_BLOCK['spacer'] = {
    nama: 'Spacer',
    tag: 'div',
    kelasDefault: 'spacer',
    kategori: 'Media',
    kategoriDropdown: 'isi',
    bagian: [
        { judul: 'Ukuran', buka: true, fields: [
            { id: 'tinggi', label: 'Tinggi (px)', jenis: 'angka', step: 4, min: 4 }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'spacer' }
        ]}
    ]
};

P.SKEMA_BLOCK['kosong'] = {
    nama: 'Empty State',
    tag: 'div',
    kelasDefault: 'kosong',
    kategori: 'Media',
    kategoriDropdown: 'isi',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'isi', label: 'Teks ilustrasi', jenis: 'textarea', placeholder: 'Belum ada data' },
            { id: 'judul', label: 'Judul', jenis: 'teks', placeholder: 'Kosong' },
            { id: 'keterangan', label: 'Teks keterangan', jenis: 'textarea', placeholder: 'Tambahkan data untuk melihatnya di sini.' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'kosong' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM }
    ]
};

P.SKEMA_BLOCK['skeleton'] = {
    nama: 'Skeleton Loader',
    tag: 'div',
    kelasDefault: 'skeleton',
    kategori: 'Media',
    kategoriDropdown: 'isi',
    bagian: [
        { judul: 'Ukuran', buka: true, fields: [
            { id: 'lebar', label: 'Lebar', jenis: 'teks', placeholder: '100%' },
            { id: 'tinggi', label: 'Tinggi', jenis: 'teks', placeholder: '16px' },
            { id: 'radius', label: 'Radius (px)', jenis: 'angka', step: 1 }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'skeleton' }
        ]}
    ]
};
