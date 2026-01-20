# Deploy Bot Telegram ke Railway

## Tentang Railway

**Railway** adalah platform cloud yang memudahkan deployment aplikasi. 

### Biaya Railway:
- **Free Trial**: $5 kredit gratis untuk pengguna baru (tidak perlu kartu kredit)
- **Hobby Plan**: $5/bulan untuk usage-based pricing
- **Pro Plan**: $20/bulan untuk fitur lebih lengkap

**Catatan Penting**: Railway **tidak sepenuhnya gratis** lagi sejak 2023. Anda mendapat $5 kredit trial, tapi setelah itu perlu upgrade ke plan berbayar. Bot Telegram yang ringan biasanya menghabiskan sekitar $1-3/bulan.

### Alternatif Gratis:
- **Render.com** - Free tier dengan batasan (sleep setelah 15 menit tidak aktif)
- **Fly.io** - Free tier dengan resource terbatas
- **Heroku** - Tidak gratis lagi sejak 2022
- **VPS Murah** - DigitalOcean, Vultr ($4-5/bulan)

---

## Cara Deploy ke Railway

### 1. Persiapan Project

Pastikan file-file berikut sudah siap:

✅ `package.json` dengan script `"start": "node src/index.js"`
✅ `.gitignore` untuk exclude file sensitif
✅ `.env.example` sebagai template environment variables

### 2. Buat Akun Railway

1. Kunjungi [railway.app](https://railway.app)
2. Sign up dengan GitHub account
3. Verifikasi email Anda

### 3. Setup Project di Railway

#### Opsi A: Deploy dari GitHub (Recommended)

1. **Push code ke GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Connect ke Railway**:
   - Login ke Railway dashboard
   - Klik "New Project"
   - Pilih "Deploy from GitHub repo"
   - Pilih repository Anda
   - Railway akan auto-detect Node.js project

#### Opsi B: Deploy dengan Railway CLI

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login**:
   ```bash
   railway login
   ```

3. **Initialize project**:
   ```bash
   railway init
   ```

4. **Deploy**:
   ```bash
   railway up
   ```

### 4. Setup Environment Variables

Di Railway dashboard:

1. Pilih project Anda
2. Klik tab "Variables"
3. Tambahkan environment variables berikut:

```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
GOOGLE_SHEET_ID=your_google_sheet_id
```

### 5. Upload Google Credentials

**Penting**: Jangan commit `credentials.json` ke Git!

**Cara 1: Encode ke Base64** (Recommended)

1. Convert credentials.json ke base64:
   ```bash
   base64 -i credentials.json
   ```

2. Copy output dan tambahkan ke Railway Variables:
   ```
   GOOGLE_CREDENTIALS_BASE64=<base64-string>
   ```

3. Update `src/config.js` untuk decode:
   ```javascript
   // Tambahkan di bagian atas
   const fs = require('fs');
   const path = require('path');

   // Untuk Railway deployment
   if (process.env.GOOGLE_CREDENTIALS_BASE64) {
     const credentials = Buffer.from(
       process.env.GOOGLE_CREDENTIALS_BASE64, 
       'base64'
     ).toString('utf-8');
     
     const credPath = path.join(__dirname, '..', 'credentials.json');
     fs.writeFileSync(credPath, credentials);
   }
   ```

**Cara 2: Paste JSON langsung**

1. Copy isi `credentials.json`
2. Tambahkan ke Railway Variables:
   ```
   GOOGLE_CREDENTIALS={"type":"service_account",...}
   ```

3. Update `src/config.js`:
   ```javascript
   if (process.env.GOOGLE_CREDENTIALS) {
     const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
     const credPath = path.join(__dirname, '..', 'credentials.json');
     fs.writeFileSync(credPath, JSON.stringify(credentials));
   }
   ```

### 6. Upload Gambar Karies

Gambar-gambar karies (D-car.jpeg, L-car.jpeg, dll) sudah ada di repository, jadi akan otomatis ter-deploy.

Pastikan gambar-gambar ini **tidak** ada di `.gitignore`:
```bash
# Cek apakah gambar ter-track
git status

# Jika belum, tambahkan:
git add *.jpeg
git commit -m "Add karies images"
git push
```

### 7. Deploy & Monitor

1. **Deploy**:
   - Jika dari GitHub: Railway auto-deploy setiap push
   - Jika dari CLI: `railway up`

2. **Check Logs**:
   ```bash
   railway logs
   ```
   
   Atau lihat di Railway dashboard → tab "Deployments" → klik deployment → "View Logs"

3. **Pastikan bot running**:
   - Cek logs untuk "Bot started successfully"
   - Test bot di Telegram dengan `/start`

### 8. Troubleshooting

**Bot tidak merespon**:
- Cek logs: `railway logs`
- Pastikan TELEGRAM_BOT_TOKEN benar
- Pastikan tidak ada error di logs

**Google Sheets error**:
- Pastikan GOOGLE_CREDENTIALS sudah di-set
- Pastikan service account punya akses ke sheet
- Cek GOOGLE_SHEET_ID benar

**Gambar tidak terkirim**:
- Pastikan file .jpeg ada di repository
- Cek path gambar di code
- Lihat error di logs

### 9. Update Bot

**Dari GitHub**:
```bash
git add .
git commit -m "Update bot"
git push
```
Railway akan auto-deploy.

**Dari CLI**:
```bash
railway up
```

---

## Monitoring & Maintenance

### Check Resource Usage
- Railway dashboard → Project → "Metrics"
- Monitor CPU, Memory, Network usage
- Estimasi biaya bulanan

### Keep Bot Running
Railway akan keep bot running 24/7 (tidak sleep seperti Render free tier).

### Backup
- Backup `.env` variables
- Backup `credentials.json`
- Backup Google Sheet ID

---

## Estimasi Biaya

Untuk bot Telegram sederhana:
- **CPU**: Minimal (bot hanya merespon saat ada message)
- **Memory**: ~50-100MB
- **Network**: Minimal
- **Estimasi**: $1-3/bulan

**Tips hemat**:
- Gunakan $5 trial credit dulu
- Monitor usage di dashboard
- Optimize code untuk efisiensi

---

## Alternatif Deployment Gratis

### 1. Render.com (Free Tier)
- Gratis dengan batasan
- Sleep setelah 15 menit tidak aktif
- Bot perlu "wake up" saat ada request pertama

### 2. Fly.io (Free Tier)
- 3 shared-cpu VMs gratis
- 160GB bandwidth/bulan
- Cocok untuk bot kecil

### 3. VPS Sendiri
- DigitalOcean Droplet: $4/bulan
- Vultr: $2.50/bulan
- Full control, tapi perlu setup manual

---

## Kesimpulan

Railway bagus untuk deployment cepat dan mudah, tapi **tidak sepenuhnya gratis**. Jika budget terbatas, pertimbangkan:

1. **Gunakan trial $5 Railway** untuk testing
2. **Pindah ke Render.com** jika bot tidak perlu 24/7 aktif
3. **Gunakan VPS murah** jika perlu kontrol penuh dan hemat biaya

Untuk bot Telegram yang ringan seperti ini, **Render.com free tier** atau **Fly.io** bisa jadi pilihan terbaik untuk gratis.
