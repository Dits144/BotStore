# Bot WhatsApp Store (Go + whatsmeow)

Bot WhatsApp modular untuk kebutuhan store per-grup, dengan sistem sewa grup, role owner/admin, katalog produk, dan login QR.

## Fitur Utama
- Login WhatsApp via QR di terminal.
- Reconnect otomatis jika session sudah tersimpan.
- Sistem owner bot (owner utama + owner tambahan via claim code).
- Sistem sewa grup (`addsewa`, `renewsewa`, `delsewa`, dll).
- Middleware validasi sewa untuk command umum grup.
- Command `infogrup` dengan fallback aman.
- Katalog produk per grup (`list`, `addlist`, `dellist`, `updatelist`, detail by name).
- SQLite + auto migration saat start.
- Struktur modular siap dikembangkan.

## Struktur Folder

```bash
cmd/
  bot/main.go
internal/
  app/
  bot/
  config/
  database/
  middleware/
  handlers/
  services/
  repositories/
  models/
  utils/
data/
main.go
```

## Setup Lokal
1. Install Go (disarankan >= 1.22).
2. Clone repo lalu install dependency:
   ```bash
   go mod tidy
   ```
3. Copy env:
   ```bash
   cp .env.example .env
   ```
4. Jalankan bot:
   ```bash
   go run .
   ```
   atau:
   ```bash
   go run ./cmd/bot
   ```

## Scan QR & Session
- Saat pertama run, terminal menampilkan `qr generated` + string QR.
- Scan QR dengan WhatsApp (Linked Devices).
- Session tersimpan di `data/session.db`.
- Run berikutnya akan reconnect tanpa scan ulang jika session valid.

## Build Binary
```bash
go build -o botstore ./cmd/bot
```

## Role & Akses
- **Owner utama (tetap):** `6282120196167@s.whatsapp.net`.
- **Owner tambahan:** bisa ditambah via command owner atau claim personal chat (`Ditsanalah144`, sesuai env).
- **Admin grup:** diambil dari metadata WhatsApp group participants.
- **User biasa:** akses command umum di grup aktif.

## Daftar Command

### Owner Bot
- `owner 62xxxx@s.whatsapp.net`
- `delowner 62xxxx@s.whatsapp.net` (owner utama tidak bisa dihapus)
- `listowner`
- `addsewa (idgroup) (hari)`
- `renewsewa (idgroup) (hari)`
- `delsewa (idgroup)`
- `listsewa`
- `ceksewa (idgroup)`

### Grup Aktif (Semua User)
- `infogrup`
- `list`
- `nama_produk` (contoh: `capcut`)

### Admin Grup / Owner Bot
- `addlist nama@deskripsi`
- `dellist nama`
- `updatelist nama@deskripsi`

## Cara Kerja Sewa Grup
- Command umum grup hanya berjalan jika grup terdaftar dan status sewanya aktif.
- Owner bot tetap bisa menjalankan command owner saat grup tidak aktif.
- Scheduler tiap 1 menit memperbarui flag aktif/expired di database.

## Contoh Format Balasan
- `addsewa` sukses:
  - 📦 Group
  - 🆔 Group ID
  - ⏳ Durasi
  - 📅 Expired
  - ✅ status sukses
- `list`:
  - box judul grup
  - waktu/tanggal Indonesia
  - katalog produk estetik
- `infogrup`:
  - nama, link (fallback), owner (fallback), tanggal dibuat (fallback), total member, total admin.

## Catatan Pengembangan Lanjutan
- Tambah unit test per service/repository.
- Tambah rate-limit antispam di grup tidak aktif.
- Tambah command transaksi/order.
- Tambah panel web admin.
- Encrypt sensitif config/secret jika deploy production.
