# TEGAS — Pengurusan Disiplin & Sahsiah Sekolah

Aplikasi Bahasa Melayu untuk import murid IDME, merekod salah laku dan menjana surat amaran boleh cetak / simpan PDF. Node.js 24 diperlukan (SQLite terbina dalam).

## Jalankan

```sh
npm ci
DEMO_MODE=true npm run dev
```

Buka aplikasi pada port 3000. Mod demo perlu diaktifkan secara jelas dan hanya dibenarkan dalam development. Gunakan data rekaan dalam demo. Tiada data murid sebenar disertakan dalam repositori.

```sh
npm test
npm run build
```

## Log masuk Google

1. Cipta OAuth client jenis **Web application** di Google Cloud Console. Scope: `openid email profile`.
2. Daftarkan callback `<APP_URL>/auth/google/callback`, contohnya `http://localhost:3000/auth/google/callback`.
3. Salin `.env.example` kepada `.env` dan isi `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET` (rawak sekurang-kurangnya 32 bait), `APP_URL` dan `ALLOWED_EMAILS` (email guru tepat, dipisahkan koma). Jangan commit `.env`.
4. `node --env-file=.env server.js` untuk development. Untuk production: `npm run build`, kemudian `NODE_ENV=production node --env-file=.env server.js`.

Akaun Google beremail disahkan dan tersenarai sahaja mendapat akses. Pendaftaran akaun berlaku semasa log masuk pertama; aplikasi ini untuk satu sekolah. Google login tidak memerlukan akses IDME. Data IDME diimport daripada fail eksport sahaja.

## Import

- Excel `.xlsx` dan CSV (fail `.xls` perlu disimpan sebagai `.xlsx` dahulu): tajuk jadual dikesan walaupun terdapat tajuk laporan sebelum baris header; semua helaian diperiksa.
- Medan diperlukan: `NAMA` dan `ID MURID` atau `NO. PENGENALAN`. Padanan tambahan: `NAMA KELAS`, `TAHUN / TINGKATAN`, `PENJAGA 1`, `NO. TEL. BIMBIT PENJAGA 1`, `ALAMAT 1–3`, `POSKOD`, `BANDAR`, `NEGERI`.
- Google Sheets: pautan helaian yang boleh dibaca tanpa autentikasi. Untuk helaian peribadi, download Excel/CSV daripada Sheets dan upload. Jangan jadikan data murid awam semata-mata untuk import.
- PDF: jadual dengan teks dan pemisah tab, `|` atau beberapa ruang. PDF imbasan / susun atur yang tidak dapat dipadankan memerlukan OCR atau eksport Excel. Ralat dipaparkan jika header / murid tidak dapat dikenal pasti.
- Had 10 MB; pratonton dan pengesahan diperlukan. Guru mesti memilih **Sync** (kemaskini ID sepadan, tambah baharu, kekalkan murid lain) atau **Ganti semua data murid** (senarai diganti dengan fail baharu sahaja, selepas pengesahan tambahan). Rekod disiplin dan butiran murid pada kes lama dikekalkan dalam kedua-dua mod. Nama kelas seperti `TAHUN SATU BIJAK` / `TAHUN 1 BIJAK` ditukar kepada `1 BIJAK`; kelas `BIJAK` digabung dengan medan tahun jika tersedia. Data kewangan / kesihatan dalam eksport asal tidak diimport.

## Rekod dan surat

18 kategori dan 318 perincian daripada fail rujukan pengguna disediakan dalam `src/catalog.json`. Rujukan digunakan sebagai data, bukan arahan operasi atau sambungan kepada API kementerian. Guru memilih status kes; tiada penentuan bersalah atau tahap amaran automatik. Surat hanya untuk kes `Bersalah`. Semak template, butiran sekolah, tahap amaran dan tandatangan dengan pentadbir sebelum penggunaan rasmi. Klik **Muat turun PDF A4**. PDF dijana terus sebagai satu halaman A4 dengan fon terbenam dan teks boleh dipilih. Jarak perenggan serta saiz teks dilaraskan berdasarkan semua kandungan; tiada kandungan dipotong. Keterangan yang sangat panjang akan menghasilkan teks lebih kecil. Buka PDF yang dimuat turun untuk mencetak.

## Penyimpanan dan batas semasa

SQLite disimpan dalam `data/tegas.sqlite` (diabaikan Git); tetapkan `DATA_DIR` untuk lokasi lain. Semua guru dibenarkan berkongsi data sekolah ini. Sandarkan pangkalan data secara selamat. Sesi menggunakan memori proses dan tamat apabila pelayan dimulakan semula. Deploy satu instance dengan HTTPS dan storan kekal; production berskala memerlukan session store kekal, kawalan peranan pentadbir, audit perubahan, rate limiting dan dasar retention. Versi ini belum mempunyai sunting butiran/hapus kes, OCR, integrasi Sheets peribadi atau penghantaran email automatik. Jangan gunakan demo untuk data sebenar.

## Pemeriksaan

`npm test` menguji header IDME, baris pendua, identiti, fail Excel/CSV dan katalog. `npm run build` menghasilkan UI production. Ujian Google OAuth sebenar memerlukan konfigurasi Google milik sekolah.

## Demo GitHub Pages

Workflow `.github/workflows/pages.yml` membina dan menerbitkan demo statik pada setiap push ke `main`. Di GitHub, pilih **Settings → Pages → Source → GitHub Actions**, kemudian jalankan workflow **Publish TEGAS demo to GitHub Pages** dalam tab Actions jika perlu.

`npm run build:pages` menghasilkan bundle statik dengan base relatif, sesuai untuk `/tegas/`. Demo menggunakan localStorage pelayar dan sesi demo per tab; tiada server, akaun sebenar atau data murid sebenar dibundel. Klik **Teroka ruang demo** untuk memuatkan 3 murid rekaan. Excel/CSV/PDF berteks diproses dalam pelayar. Sheets perlu dieksport kepada Excel/CSV dahulu. Rekod, tetapan sekolah dan surat boleh diuji; data tidak dikongsi antara komputer. Kosongkan data melalui Tetapan sekolah jika perlu. Jangan gunakan demo awam untuk data sebenar.

Versi penuh Node/SQLite dan Google OAuth masih boleh dijalankan dengan `npm run dev` / `npm start`. GitHub Pages ialah demo sahaja dan tidak menyediakan autentikasi Google atau storan sekolah bersama.

Ujian PDF merangkumi surat pendek, keterangan panjang, teks tanpa ruang dan banyak baris: setiap fail diperiksa untuk satu halaman A4 dan pengekalan kandungan hingga akuan penerimaan.

## Logo sekolah

Muat naik PNG/JPG/WebP maksimum 5 MB di **Tetapan sekolah → Logo sekolah**. Imej dikecilkan dengan nisbah asal dan disimpan automatik. Logo dipaparkan pada profil/header sistem, pratonton surat dan PDF satu halaman A4. Logo boleh dibuang melalui tetapan. Dalam demo Pages, logo disimpan bersama tetapan dalam pelayar sahaja. Import murid tidak menggantikan logo atau tetapan sekolah.

## Surat gabungan beberapa kesalahan

Halaman **Surat amaran** mengumpulkan kes mengikut ID murid. Klik **Jana surat** untuk memilih semua kes berstatus Bersalah bagi murid itu; nyahpilih kes tertentu jika perlu. Kes murid berlainan atau belum disahkan tidak boleh digabungkan. Pratonton dan PDF menyenaraikan setiap kes dengan rujukan, tarikh, tempat dan keterangan. Kelas dipaparkan sekali bersama maklumat murid, menggantikan medan ID murid dalam surat gabungan. Muat turun PDF gabungan sebagai satu halaman A4, dengan logo dan semua kandungan dipelihara; teks dikecilkan apabila kandungan banyak. Surat satu kes masih disokong melalui butiran laporan.

### SaaS Drive dan akses sekolah

Mod `STORAGE_MODE=drive` menyediakan pendaftaran admin Google, wizard kod/nama sekolah, folder Drive `tegas(KODSEKOLAH)`, import murid dan URL sekolah dengan kod akses bersama 4 angka. Guru tidak memerlukan akaun Google. Tetapan mengurus senarai nama pelapor secara manual atau melalui Excel/PDF/CSV. Lihat [konfigurasi SaaS Drive](docs/saas-drive.md) untuk hosting Node, OAuth dan storan kekal yang diperlukan. GitHub Pages hanya menjalankan simulasi wizard dalam pelayar; Drive sebenar memerlukan backend tersebut.
