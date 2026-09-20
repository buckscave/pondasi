/* PONDASI-FIELDS.JS
   Definisi field umum untuk panel properti.
   HARUS di-load sebelum pondasi-blok-*.js dan pondasi-block-panel.js.
   */
var P = P || {};

P.FIELDS_TAMPILAN_UMUM = [
    { id: 'padding', label: 'Padding (rem)', jenis: 'box', step: 0.25 },
    { id: 'margin', label: 'Margin (rem)', jenis: 'box', step: 0.25 },
    { id: 'borderLebar', label: 'Border (px)', jenis: 'box-px', step: 1 },
    { id: 'borderGaya', label: 'Gaya border', jenis: 'pilih', opsi: ['', 'solid', 'dashed', 'dotted'] },
    { id: 'borderWarna', label: 'Warna border', jenis: 'warna' },
    { id: 'radius', label: 'Radius (px)', jenis: 'angka', step: 1 },
    { id: 'warnaTeks', label: 'Warna teks', jenis: 'warna' },
    { id: 'latar', label: 'Latar', jenis: 'warna' }
];

P.FIELDS_TIPOGRAFI_UMUM = [
    { id: 'warnaTeks', label: 'Warna teks', jenis: 'warna' },
    { id: 'ukuranFont', label: 'Ukuran font', jenis: 'teks', placeholder: '1rem' },
    { id: 'keluargaFont', label: 'Keluarga font', jenis: 'teks', placeholder: 'Arial, sans-serif' },
    { id: 'tinggiBaris', label: 'Tinggi baris', jenis: 'teks', placeholder: '1.5' },
    { id: 'tebal', label: 'Tebal', jenis: 'pilih', opsi: ['', 'normal', 'bold', '300', '500', '700'] },
    { id: 'dekorasi', label: 'Dekorasi teks', jenis: 'pilih', opsi: ['', 'none', 'underline', 'overline', 'line-through'] },
    { id: 'transformasi', label: 'Transformasi teks', jenis: 'pilih', opsi: ['', 'none', 'capitalize', 'uppercase', 'lowercase'] },
    { id: 'spasiHuruf', label: 'Spasi huruf', jenis: 'teks', placeholder: '0.02rem' },
    { id: 'align', label: 'Rata teks', jenis: 'pilih', opsi: ['', 'left', 'center', 'right', 'justify'] }
];

P.FIELDS_TATA_LETAK = [
    { id: 'display', label: 'Tampilan', jenis: 'pilih', opsi: ['', 'block', 'inline', 'inline-block', 'none'] },
    { id: 'position', label: 'Posisi', jenis: 'pilih', opsi: ['', 'static', 'relative', 'absolute', 'fixed', 'sticky'] },
    { id: 'width', label: 'Lebar', jenis: 'teks', placeholder: 'auto' },
    { id: 'height', label: 'Tinggi', jenis: 'teks', placeholder: 'auto' },
    { id: 'minWidth', label: 'Lebar min', jenis: 'teks', placeholder: '-' },
    { id: 'maxWidth', label: 'Lebar maks', jenis: 'teks', placeholder: '-' },
    { id: 'float', label: 'Mengambang', jenis: 'pilih', opsi: ['', 'left', 'right', 'none'] },
    { id: 'boxSizing', label: 'Ukuran kotak', jenis: 'pilih', opsi: ['', 'content-box', 'border-box'] },
    { id: 'z-index', label: 'Lapisan (z-index)', jenis: 'angka', step: 1 },
    { id: 'overflow', label: 'Sapu berlebih', jenis: 'pilih', opsi: ['', 'visible', 'hidden', 'scroll', 'auto'] }
];

P.FIELDS_TAMPILAN_VISUAL = [
    { id: 'latar', label: 'Warna latar', jenis: 'warna' },
    { id: 'gambarLatar', label: 'Gambar latar', jenis: 'teks', placeholder: 'url(...) atau gradient' },
    { id: 'borderLebar', label: 'Tebal garis (px)', jenis: 'box-px', step: 1 },
    { id: 'borderGaya', label: 'Gaya garis', jenis: 'pilih', opsi: ['', 'none', 'solid', 'dashed', 'dotted'] },
    { id: 'borderWarna', label: 'Warna garis', jenis: 'warna' },
    { id: 'radius', label: 'Sudut melengkung (px)', jenis: 'angka', step: 1 },
    { id: 'opacity', label: 'Kecerahan (0-1)', jenis: 'teks', placeholder: '1' },
    { id: 'boxShadow', label: 'Bayangan kotak', jenis: 'teks', placeholder: '0 2px 4px rgba(0,0,0,0.1)' },
    { id: 'textShadow', label: 'Bayangan teks', jenis: 'teks', placeholder: '1px 1px 2px rgba(0,0,0,0.2)' },
    { id: 'cursor', label: 'Kursor', jenis: 'pilih', opsi: ['', 'auto', 'default', 'pointer', 'text', 'wait', 'help', 'move', 'not-allowed'] }
];
