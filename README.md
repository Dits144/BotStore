# Bot WhatsApp Store (Node.js + Baileys)

Project ini adalah bot WhatsApp Store berbasis **Node.js (JavaScript murni)** dengan login QR, session persisten, sistem owner, sistem sewa per grup, dan katalog produk per grup.

## Stack
- Node.js LTS **20.x** (direkomendasikan)
- `@whiskeysockets/baileys`
- `sqlite3` + `sqlite` (wrapper Promise)
- `dotenv`
- `pino`
- `dayjs`
- `qrcode-terminal`

## Kenapa tidak pakai better-sqlite3?
`better-sqlite3` adalah native module. Pada beberapa environment (terutama Node sangat baru seperti v24.x), binary binding bisa tidak cocok / belum tersedia, sehingga muncul error:
`Could not locate the bindings file for better-sqlite3`.

Project ini sudah dimigrasikan ke `sqlite3` + `sqlite` agar lebih stabil di VPS Ubuntu dan flow async lebih aman.

## Struktur Folder

```bash
src/
  config/
  database/
  handlers/
  commands/
    owner/
    rental/
    group/
    catalogue/
  services/
  repositories/
  middlewares/
  utils/
  events/
sessions/
data/
.env.example
package.json
README.md
index.js
```

## Fitur
- Login WhatsApp via QR di terminal
- Session tersimpan (tidak perlu scan ulang setiap restart)
- Auto reconnect dengan delay agar tidak spam reconnect
- Owner utama + owner tambahan (claim via chat personal)
- Sistem sewa grup (`addsewa`, `renewsewa`, `delsewa`, `listsewa`, `ceksewa`)
- Middleware validasi sewa untuk command grup
- `infogrup` dengan fallback field metadata aman
- Katalog produk per grup (`list`, `addlist`, `dellist`, `updatelist`, trigger nama produk)
- Auto init DB + auto create folder/file tabel jika belum ada
- Log DB: `database connected`, `database initialized`, `failed to connect database`

## Instalasi Local
1. Install Node.js LTS 20:
   ```bash
   node -v
   ```
2. Install dependency:
   ```bash
   npm install
   ```
3. Copy env:
   ```bash
   cp .env.example .env
   ```
4. Jalankan bot:
   ```bash
   npm start
   ```

## Cara Scan QR
- Saat start pertama, bot akan log `qr generated` lalu QR tampil di terminal
- Scan dari WhatsApp > Linked devices > Link a device
- Session akan tersimpan di folder `sessions/`
- Jika session masih valid, bot akan reconnect otomatis dan QR memang tidak ditampilkan lagi

## Daftar Command

### Owner Bot
- `owner 62xxxx@s.whatsapp.net`
- `delowner 62xxxx@s.whatsapp.net`
- `listowner`
- `addsewa 1203630xxxx@g.us 90`
- `renewsewa 1203630xxxx@g.us 30`
- `delsewa 1203630xxxx@g.us`
- `listsewa`
- `ceksewa 1203630xxxx@g.us`

### Grup Aktif (semua user)
- `infogrup`
- `list`
- `nama produk` (contoh: `capcut`)

### Admin Grup / Owner Bot
- `addlist capcut@1 bulan harga 50.000`
- `dellist capcut`
- `updatelist capcut@1 bulan harga 45.000 promo`

## Role
- **Owner bot**: semua command
- **Admin grup**: addlist/dellist/updatelist
- **User biasa**: list + lihat detail produk

## Sistem Sewa Grup
- Command umum hanya jalan di grup dengan sewa aktif
- Grup expired/tidak terdaftar: command umum ditolak
- Command owner tetap bisa dijalankan
- Scheduler update status sewa berkala sesuai `RENTAL_REFRESH_SECONDS`
- Semua waktu timezone `Asia/Jakarta`

## Deploy VPS Ubuntu
```bash
sudo apt update
sudo apt install -y git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

git clone <repo-kamu>
cd BotStore
npm install
cp .env.example .env
npm start
```

## Jika Native Dependency Gagal Build
Walau sudah pindah ke `sqlite3`, di beberapa VPS minimal tetap bisa butuh toolchain:

```bash
sudo apt install -y build-essential python3 make g++
```

Lalu reset dependency:

```bash
rm -rf node_modules package-lock.json
npm install
```

## PM2 (24 jam)
```bash
npm install -g pm2
pm2 start index.js --name botstore
pm2 save
pm2 startup
```

## Restart Service
```bash
pm2 restart botstore
```

## Catatan Penting
- Node direkomendasikan: **20.x LTS**
- Hindari menjalankan di Node experimental/terlalu baru (mis. 24.x) untuk stabilitas dependency
- Owner utama default: `6282120196167@s.whatsapp.net`
- Owner utama tidak bisa dihapus
- Claim owner via `Ditsanalah144` **hanya** di personal chat
