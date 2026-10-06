# TEGAS SaaS — Drive sekolah masing-masing

Backend Node dan wizard tersedia dalam kod. Sambungan Google dan hosting production belum diaktifkan. GitHub Pages menyediakan simulasi menggunakan storan pelayar, bukan Drive bersama.

## Aliran pengguna

1. Admin mendaftar menggunakan Google email dan membenarkan `drive.file`.
2. Wizard meminta kod unik sekolah, nama sekolah dan kod akses 4 angka.
3. Backend mencipta folder `tegas(KODSEKOLAH)` dalam Drive admin dan fail `tegas-school-data.json`. Percubaan semula mencari folder/fail dengan pengenal sekolah sebelum mencipta.
4. Admin mengimport murid melalui pratonton dan memilih sync atau ganti.
5. Wizard memberikan URL `APP_URL/#/sekolah/KODSEKOLAH`.
6. Semua guru masuk menggunakan URL dan satu kod akses bersama. Tiada akaun Google atau pengesanan identiti guru diperlukan.
7. Tetapan mengurus nama guru: manual, Excel, CSV atau PDF berteks dengan lajur `NAMA GURU` / `NAMA`. Pelapor dipilih daripada senarai tersebut. Nama yang dipilih ialah maklumat laporan; ia tidak membuktikan identiti pengguna.

## Storan dan akses

Murid, kes, snapshot murid, logo, nama guru dan tetapan berada dalam fail JSON Drive sekolah. PDF dijana untuk dimuat turun; PDF tidak disimpan secara automatik ke Drive. Import ganti menghasilkan salinan backup fail Drive sebelum menulis data baharu.

Backend menyimpan daftar sekolah, pengikatan admin, hash kod akses, sesi dan refresh token terenkripsi dalam SQLite di `DATA_DIR`. Ini diperlukan supaya pengguna berkongsi kod tanpa perlu memiliki akses Google Drive. Token tidak dihantar ke frontend. PIN menggunakan salted scrypt; lima cubaan salah setiap klien atau 30 bagi sekolah dalam 15 minit disekat sementara. Sesi akses tamat selepas empat jam, dan penukaran kod oleh admin membatalkan akses lama.

Setiap permintaan data mesti mempunyai sesi yang membuka sekolah tersebut. Menukar kod sekolah sahaja tidak memberikan akses. Semua pengguna kod bersama boleh mengurus rekod, import, nama guru dan tetapan biasa. Hanya admin Google boleh mengurus pautan Drive dan menukar kod akses.

Penulisan menggunakan revision dan kunci SQLite per sekolah. Revision lapuk ditolak dengan 409. Kegagalan Drive tidak dilaporkan sebagai simpanan berjaya. Jalankan satu instance backend dengan cakera kekal; deployment berbilang mesin belum disokong. Jangan sunting JSON secara manual ketika aplikasi digunakan. Backup boleh dipulihkan secara pentadbiran; tiada UI pemulihan automatik.

## Hosting sebenar

Gunakan satu servis Node 24 dengan HTTPS dan cakera kekal untuk `DATA_DIR`. Servis yang sama menyediakan frontend dan API; bina frontend biasa menggunakan `npm run build`, bukan `build:pages`.

Tetapkan melalui tetapan rahsia hosting:

- `STORAGE_MODE=drive`, `NODE_ENV=production`, `APP_URL=https://domain-backend-anda`
- `DATA_DIR` pada cakera kekal
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `SESSION_SECRET` rawak dan kekal
- `TOKEN_ENCRYPTION_KEY`: 32 bait rawak dalam base64, kekal merentas restart

Aktifkan Google Drive API, konfigurasi consent screen dan OAuth web client. Redirect URI mesti `APP_URL/auth/google/callback`. Akaun admin perlu dibenarkan sebagai test user jika aplikasi OAuth masih dalam testing. Google mungkin memerlukan penerbitan/pengesahan consent untuk pelanggan awam. Jangan letakkan rahsia dalam chat, repo atau Vite environment.

Jalankan `npm ci`, `npm test`, `npm run build`, kemudian `npm start`. Reverse proxy hendaklah menetapkan IP klien dengan betul kerana had cubaan menggunakan IP. OAuth, penyediaan folder, perkongsian data antara peranti dan pemulihan backup mesti diuji dengan akaun Drive sebenar sebelum production. Ujian automatik menggunakan mock dan tidak mengesahkan konfigurasi Google sebenar.

Data localStorage demo tidak dipindahkan secara automatik. OAuth/admin sekolah tidak disediakan oleh GitHub Pages; URL demo pada peranti lain tidak berkongsi data atau pendaftaran sekolah.
