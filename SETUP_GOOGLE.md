# Google Cloud Setup Guide

Panduan lengkap untuk setup Google Cloud Project, enable Google Sheets API, dan membuat Service Account untuk Telegram Patient Bot.

## Table of Contents

1. [Create Google Cloud Project](#1-create-google-cloud-project)
2. [Enable Google Sheets API](#2-enable-google-sheets-api)
3. [Create Service Account](#3-create-service-account)
4. [Download Credentials JSON](#4-download-credentials-json)
5. [Share Spreadsheet with Service Account](#5-share-spreadsheet-with-service-account)
6. [Verify Setup](#6-verify-setup)

---

## 1. Create Google Cloud Project

### Step 1.1: Access Google Cloud Console

1. Buka browser dan kunjungi [Google Cloud Console](https://console.cloud.google.com)
2. Login dengan akun Google Anda
3. Jika ini pertama kali menggunakan Google Cloud, Anda mungkin perlu menyetujui Terms of Service

### Step 1.2: Create New Project

1. Di bagian atas halaman, klik dropdown **Select a project**
2. Klik tombol **NEW PROJECT** di pojok kanan atas dialog
3. Isi form:
   - **Project name**: `telegram-patient-bot` (atau nama lain yang Anda inginkan)
   - **Organization**: Biarkan default atau pilih organization jika ada
   - **Location**: Biarkan default atau pilih folder jika ada
4. Klik tombol **CREATE**
5. Tunggu beberapa detik hingga project selesai dibuat
6. Pastikan project yang baru dibuat sudah terpilih (cek di dropdown atas)

**Screenshot reference:**
```
┌─────────────────────────────────────────┐
│ Google Cloud Console                    │
├─────────────────────────────────────────┤
│ [Select a project ▼]  [NEW PROJECT]     │
│                                         │
│ New Project                             │
│ ┌─────────────────────────────────────┐ │
│ │ Project name                        │ │
│ │ telegram-patient-bot                │ │
│ │                                     │ │
│ │ Organization                        │ │
│ │ No organization                     │ │
│ │                                     │ │
│ │ Location                            │ │
│ │ No organization                     │ │
│ │                                     │ │
│ │         [CANCEL]  [CREATE]          │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 2. Enable Google Sheets API

### Step 2.1: Navigate to APIs & Services

1. Dari dashboard Google Cloud Console
2. Klik menu hamburger (☰) di pojok kiri atas
3. Pilih **APIs & Services** → **Library**
4. Atau gunakan search bar dan ketik "APIs & Services"

### Step 2.2: Search for Google Sheets API

1. Di halaman API Library, gunakan search bar
2. Ketik: `Google Sheets API`
3. Klik pada hasil **Google Sheets API** (dari Google)

### Step 2.3: Enable the API

1. Di halaman Google Sheets API, klik tombol **ENABLE**
2. Tunggu beberapa detik hingga API enabled
3. Anda akan diarahkan ke halaman API details
4. Pastikan status menunjukkan "API enabled"

**Navigation path:**
```
☰ Menu → APIs & Services → Library → Search "Google Sheets API" → ENABLE
```

**Verification:**
- Setelah enabled, Anda bisa cek di **APIs & Services** → **Enabled APIs & services**
- Google Sheets API harus muncul dalam list

---

## 3. Create Service Account

Service Account adalah akun khusus yang digunakan oleh aplikasi (bukan user) untuk mengakses Google APIs.

### Step 3.1: Navigate to Service Accounts

1. Dari menu hamburger (☰), pilih **APIs & Services** → **Credentials**
2. Atau dari halaman API yang sudah enabled, klik tab **Credentials**

### Step 3.2: Create Service Account

1. Klik tombol **+ CREATE CREDENTIALS** di bagian atas
2. Pilih **Service account** dari dropdown menu
3. Isi form Service Account Details:
   - **Service account name**: `telegram-bot-service` (atau nama lain)
   - **Service account ID**: Akan otomatis terisi (contoh: `telegram-bot-service`)
   - **Service account description**: `Service account for Telegram Patient Bot to access Google Sheets`
4. Klik **CREATE AND CONTINUE**

### Step 3.3: Grant Permissions (Optional)

1. Di step "Grant this service account access to project":
   - Anda bisa skip step ini dengan klik **CONTINUE**
   - Atau pilih role jika diperlukan (untuk use case ini tidak wajib)
2. Klik **CONTINUE**

### Step 3.4: Grant User Access (Optional)

1. Di step "Grant users access to this service account":
   - Anda bisa skip step ini
2. Klik **DONE**

**Form reference:**
```
┌─────────────────────────────────────────────┐
│ Create service account                      │
├─────────────────────────────────────────────┤
│ Service account details                     │
│                                             │
│ Service account name *                      │
│ ┌─────────────────────────────────────────┐ │
│ │ telegram-bot-service                    │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Service account ID *                        │
│ ┌─────────────────────────────────────────┐ │
│ │ telegram-bot-service                    │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Service account description                 │
│ ┌─────────────────────────────────────────┐ │
│ │ Service account for Telegram Bot        │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│         [CANCEL]  [CREATE AND CONTINUE]     │
└─────────────────────────────────────────────┘
```

---

## 4. Download Credentials JSON

### Step 4.1: Access Service Account

1. Setelah service account dibuat, Anda akan kembali ke halaman Credentials
2. Scroll ke bagian **Service Accounts**
3. Klik pada service account yang baru dibuat (contoh: `telegram-bot-service@...`)

### Step 4.2: Create Key

1. Di halaman service account details, klik tab **KEYS**
2. Klik **ADD KEY** → **Create new key**
3. Pilih **JSON** sebagai key type
4. Klik **CREATE**

### Step 4.3: Download and Save

1. File JSON akan otomatis terdownload ke komputer Anda
2. File ini berisi credentials yang sangat sensitif
3. Rename file menjadi `credentials.json` (opsional, untuk konsistensi)
4. Pindahkan file ke root directory project Telegram Bot Anda

**⚠️ PENTING - Security Warning:**
```
┌─────────────────────────────────────────────┐
│ ⚠️  JANGAN SHARE FILE INI!                  │
├─────────────────────────────────────────────┤
│ File credentials.json berisi private key    │
│ yang memberikan akses penuh ke service      │
│ account. Jangan:                            │
│                                             │
│ ❌ Commit ke Git/GitHub                     │
│ ❌ Share via email/chat                     │
│ ❌ Upload ke public storage                 │
│ ❌ Hardcode dalam kode                      │
│                                             │
│ ✅ Simpan di local machine                  │
│ ✅ Tambahkan ke .gitignore                  │
│ ✅ Backup di secure location                │
└─────────────────────────────────────────────┘
```

### Step 4.4: Note the Service Account Email

1. Buka file `credentials.json` dengan text editor
2. Cari field `client_email`
3. Copy email tersebut (format: `xxx@xxx.iam.gserviceaccount.com`)
4. Email ini akan digunakan untuk share spreadsheet

**Example credentials.json structure:**
```json 
{
  "type": "service_account",
  "project_id": "telegram-patient-bot-xxxxx",
  "private_key_id": "xxxxxxxxxxxxx",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "telegram-bot-service@telegram-patient-bot-xxxxx.iam.gserviceaccount.com",
  "client_id": "xxxxxxxxxxxxx",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

---

## 5. Share Spreadsheet with Service Account

Agar bot bisa menulis ke spreadsheet, Anda harus share spreadsheet dengan service account email.

### Step 5.1: Open Your Spreadsheet

1. Buka Google Sheets
2. Buka spreadsheet yang akan digunakan untuk menyimpan data pasien
3. Atau buat spreadsheet baru jika belum ada

### Step 5.2: Setup Spreadsheet Headers

Pastikan baris pertama (row 1) berisi header kolom:

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ID | Tanggal | Nama Pasien | NIK / No. RM | Jenis Kelamin | Usia | Alamat | No. Telepon | Dokter Pemeriksa | Diagnosa | Tindakan | Penyakit lainnya | Golongan darah | Tekanan Darah | Gigi yang dikeluhkan | Perawatan Persetujuan | Biaya dokter | Biaya lab | Total Biaya | Keterangan lain |

### Step 5.3: Share with Service Account

1. Klik tombol **Share** di pojok kanan atas spreadsheet
2. Di field "Add people and groups", paste service account email
   - Email format: `telegram-bot-service@telegram-patient-bot-xxxxx.iam.gserviceaccount.com`
3. Pastikan permission level adalah **Editor** (bukan Viewer)
4. **UNCHECK** opsi "Notify people" (service account tidak perlu notifikasi)
5. Klik **Share** atau **Send**

**Share dialog reference:**
```
┌─────────────────────────────────────────────┐
│ Share "Patient Data"                        │
├─────────────────────────────────────────────┤
│ Add people and groups                       │
│ ┌─────────────────────────────────────────┐ │
│ │ telegram-bot-service@project.iam...    │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [Editor ▼]                                  │
│                                             │
│ ☐ Notify people                             │
│                                             │
│ Message (optional)                          │
│ ┌─────────────────────────────────────────┐ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│                    [Cancel]  [Share]        │
└─────────────────────────────────────────────┘
```

### Step 5.4: Get Spreadsheet ID

1. Lihat URL spreadsheet di browser
2. Copy bagian ID dari URL

**URL format:**
```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit#gid=0
                                        ^^^^^^^^^^^^^^^^^^^
                                        Copy this part
```

**Example:**
```
URL: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit

Spreadsheet ID: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
```

---

## 6. Verify Setup

### Checklist

Pastikan semua langkah berikut sudah selesai:

- [ ] Google Cloud Project sudah dibuat
- [ ] Google Sheets API sudah enabled
- [ ] Service Account sudah dibuat
- [ ] Credentials JSON sudah didownload
- [ ] File `credentials.json` ada di project directory
- [ ] Service account email sudah dicatat
- [ ] Spreadsheet sudah dibuat dengan header yang benar
- [ ] Spreadsheet sudah di-share dengan service account email dengan permission "Editor"
- [ ] Spreadsheet ID sudah dicatat

### Test Configuration

Setelah semua setup selesai, test dengan menjalankan bot:

1. Pastikan file `.env` sudah dikonfigurasi:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token
   SPREADSHEET_ID=your_spreadsheet_id
   GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
   ```

2. Jalankan bot:
   ```bash
   npm start
   ```

3. Test dengan Telegram:
   - Kirim `/start` ke bot
   - Kirim `/newpatient`
   - Isi semua field
   - Konfirmasi dengan "Yes"
   - Check spreadsheet, data harus muncul

### Troubleshooting

#### Error: "The caller does not have permission"

**Penyebab:** Spreadsheet belum di-share dengan service account

**Solusi:**
1. Pastikan service account email benar
2. Share spreadsheet dengan email tersebut
3. Pastikan permission adalah "Editor", bukan "Viewer"

#### Error: "Unable to parse range"

**Penyebab:** Spreadsheet ID salah atau format tidak valid

**Solusi:**
1. Double-check Spreadsheet ID dari URL
2. Pastikan tidak ada spasi atau karakter tambahan
3. Pastikan spreadsheet tidak dihapus

#### Error: "invalid_grant" atau "Invalid JWT"

**Penyebab:** Credentials JSON tidak valid atau expired

**Solusi:**
1. Download ulang credentials JSON dari Google Cloud Console
2. Pastikan file tidak corrupt
3. Pastikan path di `.env` benar

#### Error: "API has not been used in project"

**Penyebab:** Google Sheets API belum enabled

**Solusi:**
1. Kembali ke Google Cloud Console
2. Enable Google Sheets API
3. Tunggu beberapa menit untuk propagasi

---

## Additional Resources

### Official Documentation

- [Google Cloud Console](https://console.cloud.google.com)
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Service Accounts Documentation](https://cloud.google.com/iam/docs/service-accounts)
- [Google Sheets API Node.js Quickstart](https://developers.google.com/sheets/api/quickstart/nodejs)

### Video Tutorials

- Search YouTube: "Google Sheets API Service Account Tutorial"
- Search YouTube: "How to create Google Cloud Service Account"

### Support

Jika mengalami kesulitan:
1. Check troubleshooting section di atas
2. Baca error message dengan teliti
3. Search error message di Google
4. Buat issue di repository project ini

---

## Security Best Practices

### Protecting Credentials

1. **Never commit credentials to Git:**
   ```bash
   # Make sure .gitignore includes:
   credentials.json
   .env
   ```

2. **Rotate keys regularly:**
   - Delete old keys dari Google Cloud Console
   - Create new keys setiap 90 hari

3. **Limit service account permissions:**
   - Hanya berikan akses ke spreadsheet yang diperlukan
   - Jangan share service account email ke orang lain

4. **Monitor usage:**
   - Check Google Cloud Console untuk aktivitas yang mencurigakan
   - Enable logging jika diperlukan

### Production Deployment

Untuk production environment:

1. **Use Secret Management:**
   - Google Secret Manager
   - AWS Secrets Manager
   - HashiCorp Vault

2. **Environment-specific credentials:**
   - Gunakan service account berbeda untuk dev/staging/production
   - Jangan gunakan credentials yang sama

3. **Backup credentials:**
   - Simpan backup di secure location
   - Gunakan password manager atau encrypted storage

---

## Summary

Anda sekarang sudah berhasil:
✅ Setup Google Cloud Project
✅ Enable Google Sheets API
✅ Create Service Account
✅ Download credentials
✅ Share spreadsheet dengan service account

Bot Telegram Anda sekarang siap untuk menulis data ke Google Sheets!

Kembali ke [README.md](./README.md) untuk melanjutkan setup bot.
