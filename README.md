# FamiVault (FinTr)

A zero-based envelope budgeting application designed for newlywed households, powered by Vue 3, Framework7, ElysiaJS, Drizzle ORM, and Gemini Vision AI OCR.

## Features

- **Zero-Based Budgeting**: Alokasi penuh pendapatan bulanan ke dalam amplop anggaran (Unallocated Fund = Rp 0).
- **Sistem Amplop Interaktif**: Lacak sisa anggaran per kategori amplop dengan riwayat transaksi terintegrasi dan opsi kustomisasi (nama, target alokasi default, warna visual, dan perilaku *rollover*).
- **Split Transactions (Transaksi Terbagi)**: Pecah pengeluaran dari satu struk belanja besar ke beberapa amplop anggaran berbeda secara fleksibel dalam satu form input tunggal dengan validasi sisa saldo ketat.
- **AI OCR Receipt Scanning & Rincian Barang**: Unggah foto struk/bukti transfer atau manfaatkan fitur *Share Target* Android untuk memindai struk. Ditenagai oleh **Gemini Vision AI** untuk mengekstrak nominal, tanggal, merchant, klasifikasi rekomendasi amplop otomatis, serta rincian detail barang belanjaan yang tersimpan dalam format catatan multi-baris terstruktur.
- **Sinkronisasi Real-Time (SSE)**: Sinkronisasi instan otomatis untuk data transaksi dan amplop anggaran antar perangkat pasangan menggunakan Server-Sent Events (SSE) dengan otentikasi kueri token yang aman.
- **Autentikasi Aman & Local Avatar Caching**: Login mudah menggunakan Google OAuth dengan bypass mode demo. Dilengkapi dengan unduh otomatis & caching lokal gambar profil Google untuk mengatasi limitasi rate limiting (429) dan fallback huruf inisial reaktif jika gambar gagal dimuat.
- **Rekonsiliasi Saldo Aktual**: Monitor selisih anggaran tercatat aplikasi dengan jumlah dana riil (rekening bank + dompet digital + kas fisik) secara mingguan atau periodik dengan widget interaktif.
- **PWA & Capacitor Mobile Optimization**: Dilengkapi dengan penanganan tombol kembali perangkat Android (*hardware back button*), *dirty-form checks*, dan terintegrasi penuh sebagai aplikasi PWA/Native Mobile dengan Capacitor.

---

## Siklus Alur Penggunaan Pengguna (User Lifecycle Flow)

FamiVault dirancang untuk membantu rumah tangga mengelola anggaran dengan metode _Zero-Based Budgeting_. Berikut adalah panduan langkah demi langkah siklus penggunaan aplikasi dari awal periode hingga transisi bulan berikutnya:

### 1. Awal Periode Anggaran (Setiap Gajian / Tanggal 1)

- **Langkah 1: Inisialisasi Periode Baru:** Ketika periode baru (misalnya bulan berjalan) dimulai, sistem akan membuat sesi anggaran baru berdasarkan pendapatan Anda.
- **Langkah 2: Tentukan Template Amplop:** Masuk ke tab **Amplop** untuk mengelola amplop anggaran bulanan Anda. Anda dapat menentukan nama amplop (misal: _Makan & Dapur_, _Tabungan_, _Hiburan_), target alokasi default bulanan, warna visual, dan perilaku sisa dana (_Rollover_).
- **Langkah 3: Alokasikan Dana (Zero-Based Budgeting):** Distribusikan total take-home pay Anda ke dalam amplop-amplop tersebut hingga seluruh dana teralokasikan secara penuh (Sisa anggaran unallocated = Rp 0).

### 2. Aktivitas Harian (Transaksi Real-Time)

- **Pencatatan Manual:** Setiap kali melakukan pembelian fisik, tekan tombol melayang **`+`** (FAB) di Dasbor untuk memasukkan jumlah transaksi, memilih amplop tujuan, mencatat nama toko/merchant, serta tanggal transaksi.
- **Pencatatan Cepat via AI OCR (Bukti Transfer/QRIS):**
  1. Ambil screenshot bukti transfer atau struk transaksi digital (misalnya dari GoPay, OVO, ShopeePay, atau m-Banking).
  2. Buka halaman Tambah Transaksi di FamiVault, pilih tombol **"Scan Resi via AI"**, lalu unggah gambar tersebut.
  3. **Gemini Vision AI** akan mengekstrak data nominal, tanggal, dan nama merchant secara instan, serta **merekomendasikan klasifikasi amplop** secara otomatis (misalnya, pembayaran GoFood otomatis disarankan masuk ke amplop _Makan & Dapur_).
  4. Pengguna meninjau hasil ekstraksi dan menekan tombol simpan. Saldo amplop terkait akan langsung terpotong.

### 3. Aktivitas Rekonsiliasi Saldo Aktual (Mingguan / Setiap Ingin Sinkronisasi)

- **Kapan waktu yang tepat memasukkan saldo rekening?** Anda dapat memasukkan sisa saldo riil/aktual Anda secara fleksibel, misalnya:
  - Setiap akhir pekan (mingguan) untuk evaluasi rutin mingguan.
  - Setiap kali Anda mencurigai ada pengeluaran atau transfer yang terlewat dicatat.
  - Di akhir periode sebelum menutup anggaran bulan berjalan guna memastikan kecocokan data 100%.
- **Bagaimana alur penggunaannya?**
  1. Hitung total uang riil yang Anda miliki saat ini (jumlah gabungan dari sisa saldo rekening bank asli, dompet digital seperti GoPay/OVO, dan kas fisik).
  2. Buka halaman Dasbor (Home), gulir ke bawah menuju widget **Rekonsiliasi Saldo**, lalu masukkan angka tersebut pada kolom input yang tersedia.
  3. Sistem akan secara otomatis membandingkan nominal tersebut dengan sisa saldo terhitung yang ada di dalam amplop FamiVault.
  4. Selisih (_Variance_) yang muncul akan menjadi indikator pembantu: jika selisih minus, berarti ada pengeluaran riil yang belum dicatat di aplikasi; jika selisih plus, berarti ada pemasukan atau transaksi yang salah catat. Ini mempercepat perbaikan pembukuan agar selalu akurat.

### 4. Akhir Periode & Transisi Bulan Baru (_Rollover_)

- Saat berganti periode bulan selanjutnya, sistem secara otomatis mengevaluasi sisa dana di setiap amplop sesuai dengan perilaku _Rollover_ yang telah dikonfigurasi sebelumnya:
  - **Reset (Kembali Nol):** Sisa dana ditarik kembali ke Kategori Utama (_Unallocated Fund_) agar dapat diatur ulang dari awal di bulan baru.
  - **Rollover (Menumpuk):** Sisa dana dibiarkan menumpuk di amplop yang sama (cocok untuk kategori seperti _Kesehatan_ atau _Darurat_).
  - **Transfer ke Tabungan:** Sisa dana langsung dialihkan secara otomatis ke amplop _Tabungan_.
- Siklus kembali ke **Langkah 1** untuk merencanakan anggaran bulan baru!

---

## Panduan Menghubungkan Akun Pasangan (Household Connection Guide)

FamiVault memungkinkan pasangan mengelola amplop anggaran secara bersama-sama dalam satu Rumah Tangga (*Household*). Berikut adalah alur cara menghubungkan akun dan memantau status keanggotaan di UI:

### 1. Mendapatkan Kode Undangan (Invite Code)
- Buka menu **Pengaturan** (ikon gerigi di pojok kanan atas halaman Dasbor).
- Pada kartu **Rumah Tangga**, Anda akan melihat 6 karakter **Kode Undangan** unik milik Rumah Tangga Anda (contoh: `A1B2C3`).
- Salin kode tersebut dan kirimkan ke pasangan Anda.

### 2. Bergabung ke Rumah Tangga Pasangan
- Pasangan Anda harus membuka aplikasi FamiVault di perangkat mereka sendiri dan masuk ke menu **Pengaturan**.
- Pada kartu **Rumah Tangga** bagian bawah, temukan kolom input **"Gabung Rumah Tangga Pasangan"**.
- Tempel atau ketik **Kode Undangan** yang telah Anda bagikan, lalu tekan tombol **Gabung**.
- Sistem akan memindahkan akun pasangan Anda ke dalam Rumah Tangga Anda. Aplikasi pasangan akan secara otomatis ter-logout untuk menyegarkan token otentikasi. Setelah login kembali, seluruh data amplop, alokasi, dan transaksi akan saling terhubung secara real-time.

### 3. Memantau Status Keanggotaan di UI
- **Melalui Halaman Pengaturan (Settings):**
  Di kartu **Rumah Tangga**, terdapat daftar **Anggota Terhubung** yang menampilkan seluruh anggota yang tergabung dalam Rumah Tangga saat ini lengkap dengan foto profil/avatar, nama, alamat email, serta peran mereka (misalnya: `Owner` untuk pembuat awal, dan `Anggota` untuk pasangan yang baru bergabung).
- **Melalui Halaman Dasbor (Home):**
  Di bagian atas dasbor, terdapat indikator status **PartnerStatusBar**:
  - Jika belum terhubung dengan pasangan, status bar akan bertuliskan **"Menunggu Partner..."** dengan satu lingkaran avatar Anda sendiri.
  - Jika pasangan berhasil terhubung, status bar akan bertuliskan **"Alokasi Saling Terhubung"** dan menampilkan dua avatar yang saling bertumpuk (avatar Anda dan avatar pasangan) serta menampilkan gabungan nama Anda dan pasangan (contoh: *Ihsan & Partner*).

---

## Tech Stack

### Backend

- **Runtime**: Bun
- **Framework**: ElysiaJS
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL
- **OCR AI**: Gemini Vision API (OpenAI-compatible protocol)

### Frontend

- **Framework**: Vue 3 + Framework7 v9
- **Bundler**: Vite
- **Language**: TypeScript
- **Target Platforms**: Mobile (Capacitor) & Browser (PWA)

---

## Project Structure

```
fintr/
├── apps/
│   └── client/                 # Vue 3 + Framework7 Frontend
├── packages/
│   └── api/                    # ElysiaJS Backend
├── docker-compose.yml          # PostgreSQL Container
└── package.json                # Bun Workspace Root
```

---

## Getting Started

### Prerequisites

- Bun (latest)
- Docker & Docker Compose
- Google Cloud OAuth Credentials
- Gemini Vision API Key & Base URL

### Setup Environment

Configure the `.env` file in the root directory (copy from `.env.example`):

```bash
cp .env.example .env
```

Also configure the API environment:

```bash
cp packages/api/.env.example packages/api/.env
```

### Installation

Install all dependencies using Bun:

```bash
bun install
```

### Run Locally (Safe Development Setup)

To start the database, run migrations, and spin up the frontend and backend servers, simply run:

```bash
./dev.sh
```

This script:

1. **Handles Port Conflicts**: Detects if port `5432` (or your configured DB port) is used by another project/container and warns you.
2. **Cleans Orphan Processes**: Safely kills leftover Bun processes listening on ports `3001` (API) and `5173` (Client).
3. **Graceful Terminations**: Presses `Ctrl+C` in the terminal to clean up all background processes concurrently.

#### Overriding Ports

If port `5432` is taken on your machine:

1. Open `packages/api/.env`.
2. Modify the port in your `DATABASE_URL` (e.g. `postgresql://fintr:fintr_secret@localhost:5433/fintr`).
3. Running `./dev.sh` will automatically map your docker-compose database container to host port `5433`!

---

## Testing as a PWA / Mobile Web Share Target

To test the Web Share Target API locally (requires a secure context like `localhost`):

### Android Emulator / USB Debugging:

1. Ensure your Android device/emulator is connected.
2. Forward the local client and API ports:
   ```bash
   adb reverse tcp:5173 tcp:5173
   adb reverse tcp:3001 tcp:3001
   ```
3. Open Chrome on Android and navigate to `http://localhost:5173`.
4. Tap **Add to Home Screen** in Chrome to install the PWA.
5. You can now share images (receipt screenshots) directly to FamiVault using Android's native share menu!
