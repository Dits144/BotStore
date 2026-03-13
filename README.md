# Bot WhatsApp Store (Node.js + Baileys)

Project ini adalah bot WhatsApp Store berbasis **Node.js (JavaScript murni)** dengan login QR, session persisten, sistem owner, sistem sewa per grup, dan katalog produk per grup.

## Stack
- Node.js LTS **20.x** (sangat direkomendasikan untuk Baileys)
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

## Login QR (default)
1. Pastikan `.env` berisi `AUTH_MODE=qr`.
2. Jalankan bot:
   ```bash
   npm start
   ```
3. Saat log `QR code generated, silakan scan`, QR akan tampil besar di terminal.
4. Scan dari WhatsApp > Linked devices > Link a device.
5. Setelah sukses akan muncul log `login success`, `berhasil terhubung`, dan `session saved`.

## Login Pairing Code (fallback)
1. Set `.env` ke `AUTH_MODE=pairing`.
2. Isi `PAIRING_PHONE_NUMBER=628xxxx` (atau kosongkan agar diminta via terminal).
3. Jalankan bot, lalu pairing code akan tampil di terminal.
4. Masukkan pairing code di WhatsApp saat diminta.

## Arti Log Reconnect
- `connecting to WhatsApp` -> socket sedang handshake.
- `disconnected` -> koneksi putus, cek `reason` & `statusCode` pada log JSON.
- `reconnecting in X seconds` -> bot melakukan retry dengan backoff (tidak spam).
- Jika `status loggedOut` -> session invalid, reset session agar bisa login ulang.

## Jika QR belum muncul (atau koneksi gagal terus)
1. Pastikan pakai Node 20 LTS:
   ```bash
   node -v
   ```
2. Sinkronkan waktu server (WA sangat sensitif terhadap waktu):
   ```bash
   timedatectl status
   sudo timedatectl set-ntp true
   ```
3. Cek koneksi outbound HTTPS/WebSocket dari VPS (port 443 tidak diblokir firewall/security group).
4. Reset session lalu start ulang:
   ```bash
   rm -rf sessions
   npm start
   ```
5. Jika masih `Connection Failure`, umumnya masalah ada di jaringan VPS/provider, bukan command bot.

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
- `cekrole` / `myrole`

### Debug Role (Private / Grup)
- `cekrole`
- `myrole`

### Grup Aktif (semua user)
- `infogrup`
- `list`
- `nama produk` (contoh: `capcut`)

### Admin Grup / Owner Bot
- `addlist capcut@1 bulan harga 50.000`
- `dellist capcut`
- `updatelist capcut@1 bulan harga 45.000 promo`

## Role
- **Owner bot**: semua command, termasuk command sewa + owner + manajemen katalog
- **Admin grup**: hanya `addlist` / `dellist` / `updatelist` + command user biasa
- **User biasa**: `list` + lihat detail produk
- **Owner utama (`6282120196167@s.whatsapp.net`) selalu valid sebagai owner bot**, meskipun data owner tambahan di database kosong.

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
- Claim owner via `botditstore144` **hanya** di personal chat dan langsung aktif sebagai Owner Bot penuh

## Update Fitur Baru (UX & Admin)
- Auto hapus pesan command admin (jika bot admin grup): `addlist`, `updatelist`, `dellist`, `setwelcome`, `h`, dan status transaksi `p/d/r/b`.
- `addlist` mendukung media gambar (contoh QRIS) via caption command pada foto.
- Trigger nama produk akan kirim gambar + caption jika item punya media.
- Typo suggestion untuk nama produk (fuzzy suggestion ringan).
- Command transaksi reply: `p`, `d`, `r`, `b` (admin/owner saja).
- Broadcast grup: `h <pesan>` + mention seluruh member.
- Welcome anggota baru dengan foto profil (fallback text), dukung `welcome on/off` dan `setwelcome@...` per grup.
- Command `allmenu` dinamis berdasarkan role.

### Command Tambahan
- `allmenu`
- `welcome on`
- `welcome off`
- `setwelcome@Halo @user, selamat datang di {group}`
- `h sudah buka gais silahkan order`
- `p` / `d` / `r` / `b` (harus reply pesan customer)
