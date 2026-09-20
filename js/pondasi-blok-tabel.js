/* PONDASI-BLOK-TABEL.JS
   Skema block untuk kategori Tabel:
   - tabel
   */
var P = P || {};
P.SKEMA_BLOCK = P.SKEMA_BLOCK || {};

P.SKEMA_BLOCK['tabel'] = {
    nama: 'Tabel',
    tag: 'table',
    kelasDefault: 'tabel',
    kategori: 'Tabel',
    kategoriDropdown: 'isi',
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
};
