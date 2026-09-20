/* PONDASI-BLOK-FORM.JS
   Skema block untuk kategori Form:
   - input-teks, input-pencarian, textarea, select, checkbox, radio, saklar,
     slider, stepper, segment, toggle-grup, input-file, input-warna, fieldset, label

   Penting: .ruas-input adalah WRAPPER class (CSS: .ruas-input input, .ruas-input label).
   Jadi tag block harus 'div', bukan 'input'. renderIsiBlock generate inner <input>+<label>.
   Untuk slider/stepper: tag 'div' (wrapper), inner berisi <input type="range/number">.
*/
var P = P || {};
P.SKEMA_BLOCK = P.SKEMA_BLOCK || {};

/* Helper: skema untuk input dengan label melayang (floating label) */
P._skemaInput = function (jenis, label, placeholder, ekstraFields) {
    var fields = [
        { id: 'nama', label: 'Nama field', jenis: 'teks', placeholder: 'username' },
        { id: 'label', label: 'Label', jenis: 'teks', placeholder: placeholder }
    ];
    if (ekstraFields) fields = fields.concat(ekstraFields);
    return {
        nama: label,
        tag: 'div',
        kelasDefault: 'ruas-input',
        kategori: 'Form',
        kategoriDropdown: 'komponen',
        bagian: [
            { judul: 'Konten', buka: true, fields: fields },
            { judul: 'Kelas', fields: [
                { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'ruas-input' }
            ]},
            { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
            { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
        ]
    };
};

P.SKEMA_BLOCK['input-teks'] = P._skemaInput('text', 'Input Teks', 'Nama pengguna', [
    { id: 'tipe', label: 'Tipe input', jenis: 'pilih', opsi: ['text', 'email', 'password', 'tel', 'url'] },
    { id: 'placeholder', label: 'Placeholder', jenis: 'teks', placeholder: 'Masukkan teks...' },
    { id: 'nilai', label: 'Nilai awal', jenis: 'teks', placeholder: '' },
    { id: 'wajib', label: 'Wajib diisi', jenis: 'cek' }
]);

P.SKEMA_BLOCK['input-pencarian'] = P._skemaInput('search', 'Input Pencarian', 'Cari sesuatu', [
    { id: 'tipe', label: 'Tipe input', jenis: 'pilih', opsi: ['search'] },
    { id: 'placeholder', label: 'Placeholder', jenis: 'teks', placeholder: 'Cari...' }
]);

P.SKEMA_BLOCK['textarea'] = {
    nama: 'Textarea',
    tag: 'div',
    kelasDefault: 'ruas-input',
    kategori: 'Form',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'nama', label: 'Nama field', jenis: 'teks', placeholder: 'pesan' },
            { id: 'label', label: 'Label', jenis: 'teks', placeholder: 'Pesan' },
            { id: 'placeholder', label: 'Placeholder', jenis: 'teks', placeholder: 'Tulis pesan...' },
            { id: 'baris', label: 'Jumlah baris', jenis: 'angka', step: 1, min: 2, max: 20 },
            { id: 'wajib', label: 'Wajib diisi', jenis: 'cek' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'ruas-input' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
    ]
};

P.SKEMA_BLOCK['select'] = {
    nama: 'Select',
    tag: 'div',
    kelasDefault: 'ruas-input',
    kategori: 'Form',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'nama', label: 'Nama field', jenis: 'teks', placeholder: 'negara' },
            { id: 'label', label: 'Label', jenis: 'teks', placeholder: 'Pilih negara' },
            { id: 'items', label: 'Opsi (satu per baris)', jenis: 'daftar', format: 'isi',
              placeholder: 'Indonesia\nMalaysia\nSingapura' },
            { id: 'wajib', label: 'Wajib diisi', jenis: 'cek' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'ruas-input' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
    ]
};

P.SKEMA_BLOCK['checkbox'] = {
    nama: 'Checkbox',
    tag: 'label',
    kelasDefault: '',
    kategori: 'Form',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'nama', label: 'Nama field', jenis: 'teks', placeholder: 'setuju' },
            { id: 'label', label: 'Label', jenis: 'teks', placeholder: 'Saya setuju dengan syarat & ketentuan' },
            { id: 'nilai', label: 'Nilai', jenis: 'teks', placeholder: 'ya' },
            { id: 'dicek', label: 'Dicek default', jenis: 'cek' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'centang' }
        ]},
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
    ]
};

P.SKEMA_BLOCK['radio'] = {
    nama: 'Radio Group',
    tag: 'div',
    kelasDefault: '',
    kategori: 'Form',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'nama', label: 'Nama grup', jenis: 'teks', placeholder: 'jenis-kelamin' },
            { id: 'label', label: 'Label grup', jenis: 'teks', placeholder: 'Jenis Kelamin' },
            { id: 'items', label: 'Opsi (satu per baris)', jenis: 'daftar', format: 'isi',
              placeholder: 'Laki-laki\nPerempuan' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'radio' }
        ]},
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
    ]
};

P.SKEMA_BLOCK['saklar'] = {
    nama: 'Saklar (Switch)',
    tag: 'label',
    kelasDefault: '',
    kategori: 'Form',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'nama', label: 'Nama field', jenis: 'teks', placeholder: 'notifikasi' },
            { id: 'label', label: 'Label', jenis: 'teks', placeholder: 'Aktifkan notifikasi' },
            { id: 'dicek', label: 'Dinyalakan default', jenis: 'cek' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'saklar' }
        ]},
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
    ]
};

P.SKEMA_BLOCK['slider'] = {
    nama: 'Slider (Range)',
    tag: 'div',
    kelasDefault: '',
    kategori: 'Form',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'nama', label: 'Nama field', jenis: 'teks', placeholder: 'volume' },
            { id: 'label', label: 'Label', jenis: 'teks', placeholder: 'Volume' },
            { id: 'min', label: 'Min', jenis: 'angka', step: 1 },
            { id: 'max', label: 'Max', jenis: 'angka', step: 1, value: 100 },
            { id: 'step', label: 'Step', jenis: 'angka', step: 1, value: 1 },
            { id: 'nilai', label: 'Nilai awal', jenis: 'angka', step: 1, value: 50 }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'deret' }
        ]},
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
    ]
};

P.SKEMA_BLOCK['stepper'] = {
    nama: 'Stepper (Input Angka)',
    tag: 'div',
    kelasDefault: '',
    kategori: 'Form',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'nama', label: 'Nama field', jenis: 'teks', placeholder: 'jumlah' },
            { id: 'label', label: 'Label', jenis: 'teks', placeholder: 'Jumlah' },
            { id: 'min', label: 'Min', jenis: 'angka', step: 1 },
            { id: 'max', label: 'Max', jenis: 'angka', step: 1 },
            { id: 'step', label: 'Step', jenis: 'angka', step: 1, value: 1 },
            { id: 'nilai', label: 'Nilai awal', jenis: 'angka', step: 1, value: 0 }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'langkah-angka' }
        ]},
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
    ]
};

P.SKEMA_BLOCK['segment'] = {
    nama: 'Segment Control',
    tag: 'div',
    kelasDefault: 'segment',
    kategori: 'Form',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'nama', label: 'Nama field', jenis: 'teks', placeholder: 'view' },
            { id: 'items', label: 'Opsi (satu per baris)', jenis: 'daftar', format: 'isi',
              placeholder: 'Hari\nMinggu\nBulan' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'segment' }
        ]},
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
    ]
};

P.SKEMA_BLOCK['toggle-grup'] = {
    nama: 'Toggle Group',
    tag: 'div',
    kelasDefault: 'toggle-grup',
    kategori: 'Form',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'nama', label: 'Nama field', jenis: 'teks', placeholder: 'ukuran' },
            { id: 'items', label: 'Opsi (satu per baris)', jenis: 'daftar', format: 'isi',
              placeholder: 'S\nM\nL\nXL' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: 'toggle-grup' }
        ]},
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
    ]
};

P.SKEMA_BLOCK['input-file'] = P._skemaInput('file', 'Input File', 'Pilih berkas', [
    { id: 'tipe', label: 'Tipe input', jenis: 'pilih', opsi: ['file'] },
    { id: 'terima', label: 'Tipe file diterima', jenis: 'teks', placeholder: '.png, .jpg, .pdf' },
    { id: 'banyak', label: 'Multi-file', jenis: 'cek' }
]);

P.SKEMA_BLOCK['input-warna'] = P._skemaInput('color', 'Input Warna', 'Pilih warna', [
    { id: 'tipe', label: 'Tipe input', jenis: 'pilih', opsi: ['color'] },
    { id: 'nilai', label: 'Warna awal', jenis: 'warna' }
]);

P.SKEMA_BLOCK['fieldset'] = {
    nama: 'Fieldset (Grup Form)',
    tag: 'fieldset',
    kelasDefault: '',
    kategori: 'Form',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'judul', label: 'Legend (judul grup)', jenis: 'teks', placeholder: 'Informasi Pribadi' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: '' }
        ]},
        { judul: 'Tampilan', fields: P.FIELDS_TAMPILAN_UMUM },
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
    ]
};

P.SKEMA_BLOCK['label-form'] = {
    nama: 'Label Form',
    tag: 'label',
    kelasDefault: '',
    kategori: 'Form',
    kategoriDropdown: 'komponen',
    bagian: [
        { judul: 'Konten', buka: true, fields: [
            { id: 'isi', label: 'Teks label', jenis: 'teks', placeholder: 'Nama pengguna' },
            { id: 'untuk', label: 'Untuk (id field)', jenis: 'teks', placeholder: 'field-username' }
        ]},
        { judul: 'Kelas', fields: [
            { id: 'kelas', label: 'Kelas', jenis: 'teks', placeholder: '' }
        ]},
        { judul: 'Tipografi', fields: P.FIELDS_TIPOGRAFI_UMUM }
    ]
};
