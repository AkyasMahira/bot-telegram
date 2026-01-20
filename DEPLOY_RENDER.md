# Deploy Bot Telegram ke Render.com (GRATIS)

## Tentang Render.com

**Render.com** menawarkan **free tier** yang cocok untuk bot Telegram:

### Free Tier:
- ✅ **Gratis selamanya** (tidak perlu kartu kredit)
- ✅ 750 jam/bulan (cukup untuk 1 service 24/7)
- ✅ 512MB RAM
- ⚠️ **Sleep setelah 15 menit tidak aktif**
- ⚠️ Perlu 30-60 detik untuk "wake up"

**Catatan**: Bot akan sleep jika tidak ada aktivitas 15 menit. Saat ada message baru, bot akan wake up otomatis (delay 30-60 detik untuk response pertama).

---

## Cara Deploy ke Render.com

### 1. Persiapan

Pastikan code sudah di GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Buat Akun Render

1. Kunjungi [render.com](https://render.com)
2. Sign up dengan GitHub account (gratis, tidak perlu kartu kredit)
3. Authorize Render untuk akses GitHub

### 3. Create New Web Service

1. Di Render dashboard, klik **"New +"** → **"Web Service"**
2. Connect repository GitHub Anda
3. Klik **"Connect"** pada repository bot

### 4. Configure Service

Isi form dengan:

**Name**: `telegram-patient-bot` (atau nama lain)

**Region**: `Singapore` (paling dekat dengan Indonesia)

**Branch**: `main`

**Runtime**: `Node`

**Build Command**: `npm install`

**Start Command**: `npm start`

**Plan**: Pilih **"Free"**

### 5. Setup Environment Variables

Scroll ke bawah ke bagian **"Environment Variables"**, tambahkan:

```
TELEGRAM_BOT_TOKEN = your_telegram_bot_token
SPREADSHEET_ID = your_google_sheet_id
```

**Untuk Google Credentials**, pilih salah satu cara:

#### Cara 1: Base64 (Recommended)

1. Convert credentials.json ke base64:
   ```bash
   base64 -i credentials.json | pbcopy
   ```
   (Output otomatis di-copy ke clipboard)

2. Tambahkan environment variable:
   ```
   GOOGLE_CREDENTIALS_BASE64 = <paste-base64-string>
   ```

#### Cara 2: Secret File (Lebih Aman)

1. Di Render dashboard, klik **"Secret Files"**
2. Klik **"Add Secret File"**
3. Filename: `credentials.json`
4. Contents: Paste isi file credentials.json Anda
5. Tambahkan environment variable:
   ```
   GOOGLE_APPLICATION_CREDENTIALS = /etc/secrets/credentials.json
   ```

### 6. Deploy

1. Klik **"Create Web Service"**
2. Render akan mulai build dan deploy
3. Tunggu hingga status menjadi **"Live"** (hijau)
4. Check logs untuk memastikan "Bot started successfully"

### 7. Test Bot

1. Buka Telegram
2. Kirim `/start` ke bot Anda
3. Bot akan merespon (mungkin delay 30-60 detik jika baru wake up)

---

## Mengatasi Sleep Issue

Bot Render free tier akan sleep setelah 15 menit tidak aktif. Ada beberapa cara mengatasinya:

### Opsi 1: Terima Saja (Recommended untuk Free)

- Bot akan wake up otomatis saat ada message
- Delay 30-60 detik untuk response pertama
- Cocok jika bot tidak perlu instant response

### Opsi 2: Cron Job Keep-Alive (Gratis)

Gunakan service gratis untuk ping bot setiap 14 menit:

1. **Cron-job.org** (gratis):
   - Daftar di [cron-job.org](https://cron-job.org)
   - Create job: ping URL Render setiap 14 menit
   - URL: `https://your-app.onrender.com`

2. **UptimeRobot** (gratis):
   - Daftar di [uptimerobot.com](https://uptimerobot.com)
   - Add monitor: HTTP(s) check setiap 5 menit
   - URL: `https://your-app.onrender.com`

**Catatan**: Render free tier punya limit 750 jam/bulan. Jika di-keep alive 24/7, akan habis di hari ke-31. Tapi biasanya cukup untuk 1 bulan.

### Opsi 3: Upgrade ke Paid ($7/bulan)

- Tidak sleep
- Lebih banyak resource
- Cocok untuk production

---

## Update Bot

Setiap kali push ke GitHub, Render akan auto-deploy:

```bash
git add .
git commit -m "Update bot"
git push
```

Render akan otomatis rebuild dan redeploy.

---

## Monitoring

### Check Logs
1. Render dashboard → Service → **"Logs"** tab
2. Lihat real-time logs
3. Debug error jika ada

### Check Status
- **Live** (hijau): Bot running
- **Building**: Sedang deploy
- **Sleeping**: Bot sleep (akan wake up saat ada request)

### Metrics
- Render dashboard → Service → **"Metrics"** tab
- Lihat CPU, Memory, Request usage

---

## Troubleshooting

### Bot tidak merespon
1. Check logs: Apakah ada error?
2. Check status: Apakah "Live"?
3. Pastikan TELEGRAM_BOT_TOKEN benar
4. Jika sleeping, tunggu 30-60 detik

### Google Sheets error
1. Pastikan GOOGLE_CREDENTIALS_BASE64 atau Secret File sudah di-set
2. Pastikan service account punya akses ke sheet
3. Check logs untuk error detail

### Build failed
1. Check logs untuk error message
2. Pastikan `package.json` punya script `"start": "node src/index.js"`
3. Pastikan dependencies lengkap

---

## Perbandingan: Railway vs Render

| Feature | Railway | Render Free |
|---------|---------|-------------|
| **Harga** | $5 trial, lalu $1-3/bulan | Gratis selamanya |
| **Sleep** | Tidak sleep | Sleep setelah 15 menit |
| **RAM** | 512MB-8GB | 512MB |
| **Setup** | Mudah | Mudah |
| **Auto-deploy** | Ya | Ya |
| **Cocok untuk** | Production | Development/Testing |

---

## Kesimpulan

**Render.com free tier** adalah pilihan terbaik untuk:
- ✅ Bot personal/testing
- ✅ Bot dengan traffic rendah
- ✅ Budget terbatas (gratis)
- ✅ Tidak perlu instant response

**Upgrade ke paid** jika:
- ❌ Perlu bot aktif 24/7 tanpa delay
- ❌ Traffic tinggi
- ❌ Production use

Untuk bot pasien seperti ini, **Render free tier sudah cukup** karena:
- Dokter tidak akan input data setiap detik
- Delay 30-60 detik saat wake up masih acceptable
- Gratis selamanya!
