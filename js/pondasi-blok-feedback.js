/* PONDASI-BLOK-FEEDBACK.JS
   Skema block untuk kategori Feedback:
   - pesan-info, pesan-sukses, pesan-peringatan, pesan-error, toast,
     progress, spinner, tooltip, popover
   */
var P = P || {};
P.SKEMA_BLOCK = P.SKEMA_BLOCK || {};

/* Helper: skema pesan */
P._skemaPesan = function (jenis, label, kelas, placeholder) {
    return {
        nama: label,
        tag: 'div',
        kelasDefault: kelas,
        kategori: 'Feedback',
        kategoriDropdown: 'komponen',
        bagian: [
            { judul: 'Konten', buka: true, fields: [
                { id: 'judul', label: 'Judul', jenis: 'teks', placeholder: placeholder },
                { id: 'isi', label: 'Pesan', jenis: 'textarea', placeholder: 'Detail pesan...' }
            ]},
            { judul: 'Kelas', fields: [
                { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: kelas }
            ]},
            { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
    };
};

P.SKEMA_BLOCK['pesan-info'] = P._skemaPesan('info', 'Pesan Info', 'pesan-info', 'Informasi');
P.SKEMA_BLOCK['pesan-sukses'] = P._skemaPesan('sukses', 'Pesan Sukses', 'pesan-sukses', 'Berhasil');
P.SKEMA_BLOCK['pesan-peringatan'] = P._skemaPesan('peringatan', 'Pesan Peringatan', 'pesan-peringatan', 'Perhatian');
P.SKEMA_BLOCK['pesan-error'] = P._skemaPesan('error', 'Pesan Error', 'pesan-error', 'Terjadi kesalahan');

P.SKEMA_BLOCK['toast'] = {
    nama: 'Toast / Snackbar',
    tag: 'div',
    kelasDefault: 'toast',
    kategori: 'Feedback',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'isi', label: 'Pesan', jenis: 'teks', placeholder: 'Data tersimpan' },
            { id: 'label', label: 'Teks aksi (opsional)', jenis: 'teks', placeholder: 'Batal' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'toast' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['progress'] = {
    nama: 'Progress Bar',
    tag: 'progress',
    kelasDefault: 'progress',
    kategori: 'Feedback',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'nilai', label: 'Nilai (0-100)', jenis: 'angka', step: 1, min: 0, max: 100, value: 50 },
            { id: 'maks', label: 'Nilai maks', jenis: 'angka', step: 1, min: 1, value: 100 }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'progress' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM }
    ]
};

P.SKEMA_BLOCK['spinner'] = {
    nama: 'Spinner (Loading)',
    tag: 'div',
    kelasDefault: 'spinner',
    kategori: 'Feedback',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Kelas', buka: true, fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'spinner' }
        ]},
        { judul: 'Tampilan', fields: [
            { id: 'lebar', label: 'Lebar (px)', jenis: 'angka', step: 1, value: 32 },
            { id: 'tinggi', label: 'Tinggi (px)', jenis: 'angka', step: 1, value: 32 },
            { id: 'warna', label: 'Warna', jenis: 'warna' }
        ]}
    ]
};

P.SKEMA_BLOCK['tooltip'] = {
    nama: 'Tooltip',
    tag: 'span',
    kelasDefault: 'tooltip',
    kategori: 'Feedback',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'isi', label: 'Teks utama', jenis: 'teks', placeholder: 'Hover saya' },
            { id: 'judul', label: 'Teks tooltip', jenis: 'teks', placeholder: 'Keterangan saat hover' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'tooltip' }
        ]},
        { judul: 'Posisi tooltip', fields: [
            { id: 'posisi', label: 'Posisi', jenis: 'pilih', opsi: ['atas', 'bawah', 'kiri', 'kanan'] }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};

P.SKEMA_BLOCK['popover'] = {
    nama: 'Popover (CSS pure)',
    tag: 'span',
    kelasDefault: 'popover',
    kategori: 'Feedback',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'isi', label: 'Teks trigger', jenis: 'teks', placeholder: 'Klik saya' },
            { id: 'judul', label: 'Isi popover', jenis: 'textarea', placeholder: 'Konten popover yang muncul' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'popover' }
        ]},
        { judul: 'Posisi', fields: [
            { id: 'posisi', label: 'Posisi popover', jenis: 'pilih', opsi: ['atas', 'bawah', 'kiri', 'kanan'] }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
]
};
