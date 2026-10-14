# Maisya-Saku 💳🕌
### Portal Sistem Aplikasi Keuangan Santri Ma'had Imam Syafi'i Brebes (PWA Cashless Santri)

Aplikasi Web App Progressive Web App (PWA) berbasis **React.js + Tailwind CSS** dan backend **Google Firebase Cloud Firestore** yang dirancang khusus untuk mewujudkan ekosistem pesantren bebas uang tunai (*cashless pesantren*) di **Ma'had Imam Syafi'i Brebes**.

---

## 🌟 Fitur Utama & Alur Sistem

### 1. 👨‍👩‍👦 Portal Wali Santri (Akses Tautan Unik WhatsApp)
- **Login Tanpa Password (Magic Link)**: Wali santri cukup mengklik link unik dari WhatsApp (contoh: `#token=wali-hendra`).
- **Dukungan Banyak Anak (Siblings)**: Jika orang tua memiliki lebih dari 1 anak di pondok (misal: Kakak di Aliyah & Adik di Mutawassith), keduanya dapat dipantau dan dikontrol dari satu link yang sama!
- **Kontrol Batas Belanja (Spending Limit)**: Orang tua memiliki kontrol penuh mengatur limit harian, mingguan, atau bulanan. Sistem otomatis menolak transaksi santri di kasir jika telah melewati kuota yang diizinkan!
- **Konfirmasi Transfer Uang Saku**: Nomor rekening resmi Ma'had Imam Syafi'i (BSI & Muamalat) dengan fitur 1-klik salin, upload foto bukti transfer, kode unik 3 digit, dan tombol konfirmasi otomatis via WhatsApp Bendahara.
- **Auto-Refresh Realtime**: Saldo dan status persetujuan setoran uang saku diperbarui secara otomatis per detik tanpa perlu refresh manual.
- **Rincian Transaksi Transparan**: Melihat secara detail setiap transaksi ananda (apa saja jajanan di kantin, berat cucian laundry, menit penelponan wartel, dan SPP).

### 2. 🛒 Petugas Kantin (POS Kasir Touchscreen & Katalog Barang)
- **Mesin Kasir Cepat**: Grid produk dengan filter kategori, pencarian, dan keranjang belanja.
- **Manajemen Barang Fleksibel**: Petugas kantin dapat menambah, mengedit harga, memperbarui stok, dan mengatur barcode barang secara mandiri.
- **Verifikasi Multi-Metode**: Dukungan USB RFID card reader, pemindai Barcode/QR, dan pencarian nama (menampilkan NIS dan Kelas).
- **Sensor Sidik Jari (Biometric Touch Pad)**: Area sensor sentuh di layar HP/tablet dengan animasi laser scan, getaran haptic, progress bar, serta simulasi fingerprint USB.
- **Penolakan Otomatis**: Jika total belanja melebihi sisa limit harian santri, sistem kasir langsung menampilkan peringatan merah dan memblokir checkout.
- **Struk Digital Kasir**: Pratinjau struk thermal 58mm/80mm yang siap dicetak.

### 3. 🧺 Petugas Laundry Pesantren
- **Penghitungan Otomatis**: Layanan Cuci Kering Lipat (Kg), Cuci + Setrika Wangi (Kg), Cuci Gamis/Jubah Putih (Pcs), Bedcover (Pcs).
- **Debet Saldo Biometrik**: Potong saldo otomatis dengan tap RFID dan sidik jari santri.
- **Tiket Klaim Laundry**: Menghasilkan nomor kode klaim dan estimasi tanggal selesai cuci.

### 4. 📞 Petugas Penelponan (Wartel Santri)
- **Manajemen Bilik Wartel**: Bilik Asrama Abu Bakar, Umar, dan Bilik Utama.
- **Live Stopwatch Timer**: Menghitung durasi panggilan telepon langsung saat santri berbicara dengan orang tua, atau input manual menit.
- **Tarif Per Menit**: Penghitungan biaya otomatis dan pendebetan saldo santri via sidik jari.

### 5. 🎓 Kasir SPP & Ekstrakurikuler
- **Pelunasan Syahriyah**: Bayar SPP bulanan, uang kitab, seragam, ekskul memanah, bela diri langsung dari saldo saku santri.
- **Kuitansi Sah**: Cetak kuitansi resmi berstempel digital.

### 6. 🏧 Kiosk Santri (Anjungan Cek Saldo Mandiri)
- **Desain Layar Penuh Kiosk**: Cocok dipasang pada tablet di dinding asrama atau lobby kantin.
- **3 Cara Cek Saldo**: Tap kartu RFID, scan barcode pada kartu santri, atau pilih nama santri + sentuh sensor sidik jari di layar.
- **Auto-Logout 15 Detik**: Melindungi privasi saldo santri setelah selesai melihat.

### 7. 🏛️ Bendahara & Administrator Pesantren
- **Antrean Persetujuan Top-Up**: Melihat bukti transfer wali santri dengan zoom viewer, persetujuan 1-klik yang langsung menambah saldo santri secara realtime.
- **Manajemen Santri**: Tambah data santri, set nomor RFID fisik, dan atur saldo awal.
- **Cetak Smartcard Santri**: Pratinjau dan cetak kartu pintar santri dengan foto, NIS, barcode, dan tag RFID.
- **Generator Link WhatsApp**: 1-klik kirim pesan template resmi berisi magic link ke WhatsApp wali santri.
- **Ekspor CSV / Excel**: Rekapitulasi seluruh mutasi keuangan santri.

---

## 🚀 Panduan Menjalankan Secara Lokal (Uji Coba)

1. Pastikan Node.js telah terinstal (versi 18+).
2. Jalankan perintah:
```bash
npm install
npm run dev
```
3. Buka browser pada alamat yang tertera (biasanya `http://localhost:5173/`).
4. Anda dapat langsung menguji seluruh fitur peran (Wali Santri, Kantin, Laundry, Wartel, SPP, Kiosk, dan Bendahara) melalui menu dropdown peran di bagian kanan atas.

---

## ☁️ Menghubungkan ke Google Firebase Cloud Firestore

Aplikasi telah dilengkapi arsitektur dual-mode:
1. **Mode Demo Lokal (Bawaan)**: Menggunakan LocalStorage dan BroadcastChannel realtime yang otomatis sinkron antar-tab dan antar-jendela tanpa perlu konfigurasi awal.
2. **Mode Live Firebase**:
   - Buka menu **Bendahara Pesantren** -> Pilih tab **Pengaturan Firebase Cloud**.
   - Masukkan `API Key`, `Project ID`, `Auth Domain`, dan `Storage Bucket` proyek Firebase Anda.
   - Klik **Simpan & Muat Ulang**. Sistem akan langsung beralih ke Cloud Firestore realtime listeners (`onSnapshot`).

---

## 🌐 Cara Publikasi ke GitHub Pages (Online)

Proyek ini telah dikonfigurasi dengan:
- Base path relatif `./` pada `vite.config.js`.
- File duplikat `404.html` otomatis untuk GitHub Pages SPA routing.
- Workflow GitHub Actions otomatis pada `.github/workflows/deploy.yml`.

### Langkah Publikasi:
1. Buat repository baru di akun GitHub Anda (misal: `maisya-saku`).
2. Hubungkan repository lokal dan push:
```bash
git init
git add .
git commit -m "feat: inisialisasi Maisya-Saku PWA Ma'had Imam Syafi'i Brebes"
git branch -M main
git remote add origin https://github.com/<username>/maisya-saku.git
git push -u origin main
```
3. Di GitHub: Masuk ke **Settings** -> **Pages** -> Pada bagian **Build and deployment**, pilih **Source: GitHub Actions**.
4. GitHub Actions akan otomatis melakukan build dan aplikasi Anda langsung aktif online!
