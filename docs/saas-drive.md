# TEGAS SaaS dengan storan Google Drive

Status: reka bentuk untuk pelaksanaan. Sambungan Drive dan pengasingan sekolah belum aktif. Demo GitHub Pages masih menggunakan localStorage.

## Kontrak aplikasi

- Akaun Google mengenal pasti pengguna; sekolah ialah tenant. Keahlian sekolah dan peranan pentadbir/guru disahkan pada backend untuk setiap permintaan.
- Identiti sekolah daripada sesi yang disahkan, bukan daripada folder ID atau school ID yang dihantar pelayar sahaja.
- Setiap sekolah mempunyai data murid, kes, logo, tetapan, surat dan log perubahan berasingan. Guru sekolah yang sama berkongsi data; guru sekolah lain tidak mempunyai akses.
- Kekalkan import sync/ganti, sejarah murid pada kes, normalisasi kelas dan PDF satu halaman A4.
- Token Google dan kunci rahsia disimpan pada backend secara selamat. Fail rahsia tidak diterbitkan ke GitHub Pages atau bundle JavaScript.

## Keputusan storan yang diperlukan

1. **Drive sekolah masing-masing:** pemilik sekolah memberi kebenaran OAuth untuk aplikasi menyediakan/mengakses fail sekolah. Keahlian guru dalam aplikasi tidak memerlukan semua guru memiliki token Drive pemilik. Penarikan kebenaran pemilik menghentikan akses storan sekolah itu.
2. **Drive pusat pengendali SaaS:** backend mengurus folder berasingan untuk setiap sekolah, menggunakan identiti Google pengendali. Pelanggan hanya log masuk aplikasi. Pengendali menanggung kuota, pemilikan dan pengurusan data.

Keputusan ini menentukan identiti OAuth storan, aliran pendaftaran sekolah dan pemilikan data. Jangan menyambung demo kepada Drive secara awam sebelum pilihan dibuat dan akses sebenar diuji.

## Struktur storan cadangan

Satu folder bagi setiap sekolah dengan pengenal dalaman unik; nama sekolah bukan kunci keselamatan.

- `school.json`: profil, konfigurasi dan rujukan logo.
- `students.json`: senarai murid, versi dan masa import terakhir.
- `cases/`: fail kes beridentiti unik, termasuk snapshot murid dan status.
- `assets/`: logo sekolah.
- `letters/`: PDF yang dipilih untuk disimpan bersama rujukan kes.
- `audit/`: rekod perubahan.
- `backups/`: salinan sebelum import ganti dan perubahan besar.

Google Drive ialah storan fail, bukan pangkalan data transaksi. Backend mesti menyusun penulisan, mengesan versi lapuk dan mengendalikan kegagalan rangkaian supaya kemaskini serentak tidak memadam kerja guru lain. Pilih satu model backend yang menguatkuasakan penulisan ini; proses berbilang instance memerlukan penguncian bersama. Jangan mendakwa perubahan atomik pada beberapa fail Drive.

## Hosting dan pengesahan

GitHub Pages boleh menjadi frontend. Endpoint backend memerlukan hosting berasingan dengan HTTPS, sesi yang sesuai untuk domain frontend/backend, sekatan origin/CSRF, dan storan token yang kekal. Google Apps Script atau servis Node ialah pilihan pelaksanaan; kesesuaian ditentukan selepas model Drive dan skala sekolah diketahui. Apps Script sahaja tidak menjadikan data multi-tenant secara automatik.

OAuth Google dan kebenaran Drive diperlukan untuk versi SaaS sebenar. Skop dipilih mengikut fail/folder yang aplikasi benar-benar perlu akses; jangan meminta akses seluruh Drive jika akses fail aplikasi mencukupi. Keperluan pengesahan aplikasi Google bergantung pada skop dan jenis pengguna. Uji keperluan akaun yang dipilih; jangan menganggap service account boleh memiliki fail dalam My Drive.

## Migrasi demo

LocalStorage lama kekal sehingga pengguna memilih sekolah, menyemak eksport, dan mengesahkan import ke storan baharu. Tiada migrasi automatik data sebenar kepada Drive yang belum disahkan. Semak jumlah murid/kes, logo dan penjaga sebelum dan selepas migrasi. Simpan backup sebelum ganti.

## Bukti yang diperlukan sebelum aktif

- Dua sekolah menggunakan murid ber-ID sama tanpa data bercampur.
- Guru tidak boleh membaca/mengubah folder atau kes sekolah lain walaupun menukar parameter permintaan.
- Dua guru sekolah sama melihat data yang sama selepas refresh/peranti lain.
- Import sync/ganti, logo, kes dan PDF berfungsi dengan storan Drive sebenar.
- Penulisan serentak, token tamat tempoh/ditarik, kuota dan kegagalan separa tidak dilaporkan sebagai simpanan berjaya.
- Backup dan pemulihan diuji; rahsia tidak muncul dalam bundle, repo atau log.

## Prasyarat luar

Pilihan pemilikan Drive, akaun Google dengan akses yang diperlukan, konfigurasi OAuth dan tempat hosting backend. Masukkan credential melalui tetapan hosting secara selamat, bukan chat. Bilangan sekolah/guru dan ciri langganan boleh diperincikan selepas aliran tenant dan storan asas ditentukan.
