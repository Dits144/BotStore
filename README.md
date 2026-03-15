# WhatsApp English Learning Bot (Bugfix + Wiring Pass)

Bot belajar bahasa Inggris berbasis **Node.js + JavaScript + Baileys Mod**.

## Runtime Config: `.env` vs `.env.example`
- `.env` = file runtime yang benar-benar dibaca bot.
- `.env.example` = template aman tanpa API key asli.

> Jangan pernah commit/bagikan API key asli.

## Provider AI yang didukung
- `openrouter`
- `groq`

## Env runtime
```env
LOG_LEVEL=silent
ALLOWED_GROUP_ID=120363406071615706@g.us
OWNER_NUMBER=6282120196167
AI_PROVIDER=openrouter
AI_API_KEY=your_openrouter_api_key_here
AI_MODEL=openai/gpt-4o-mini
DAILY_REMINDER_TIME=07:00
TZ=Asia/Jakarta
```

## Catatan penting owner
Jika `OWNER_NUMBER` terisi di `.env`, maka owner dianggap sudah ada dan `.claimowner` akan ditolak.

Pesan ini normal:
> Bot ini sudah memiliki owner dari konfigurasi.

Jika ingin pakai `.claimowner`, kosongkan `OWNER_NUMBER` di `.env` lalu restart bot.

## Fitur yang difokuskan stabil
- `.tr/.translate`, `.tren`, `.trid`
- `.fix/.correct`
- `.chat on/.chat off` + pesan biasa saat chat mode aktif
- `.health`, `.debugcmd`
- `.claimowner`

## AI wiring behavior
- Jika AI ready (`provider valid + model ada + key ada`), command AI pakai provider dulu.
- Jika request AI gagal, bot fallback lokal dan log alasan error ke console.

## Startup sanity log
Saat startup bot menampilkan:
- dotenv env file detected
- allowed group
- owner loaded
- AI enabled/provider/model
- AI provider valid/model loaded/service ready
- vocab/quiz/grammar count
- total command loaded
- reminder time/timezone
- session path

## Uji cepat
- `.health`
- `.debugcmd`
- `.tr halo apa kabar`
- `.trid I want to learn English`
- `.tren saya ingin belajar`
- `.fix I am go to school`
- `.chat on` lalu kirim pesan biasa

## Voice note
Voice note terdeteksi. Jika STT belum aktif penuh, bot fallback aman dan arahkan user pakai `.pronounce <teks>`.
