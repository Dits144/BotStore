# WhatsApp English Learning Bot (Production Stabilization)

Bot belajar bahasa Inggris berbasis **Node.js + JavaScript + Baileys Mod**.

## Runtime Config: `.env` vs `.env.example`
- `.env` = file runtime yang benar-benar dibaca bot saat jalan.
- `.env.example` = template aman tanpa API key asli.

> Jangan pernah commit atau bagikan API key asli.

## Env yang dipakai
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

## Fitur (wired)
- `.menu`, `.daily`, `.quiz`, `.answer <jawaban>`
- `.tr/.translate <teks>` (auto detect)
- `.tren <teks>` (paksa ke English)
- `.trid <teks>` (paksa ke Indonesia)
- `.fix/.correct <kalimat>`
- `.arti`, `.grammar`, `.vocab`
- `.chat on/off`, `.score`, `.streak`, `.resetprogress`
- `.leaderboard/.top`, `.rank`
- `.claimowner <password>`
- `.reminder on/off/status`, `.health`, `.debugcmd`

## AI vs Fallback Lokal
Jika `AI_API_KEY` tersedia:
- `.tr/.tren/.trid`, `.fix/.correct`, chat mode akan prioritas pakai AI OpenRouter.

Jika AI gagal/tidak aktif:
- bot fallback ke local translation/correction terbatas,
- bot tetap tidak crash.

## Cara setup
1. Install:
```bash
npm install
```
2. Copy template env:
```bash
cp .env.example .env
```
3. Isi `AI_API_KEY` di `.env`.
4. Jalankan:
```bash
npm start
```

## Sanity startup log
Saat startup bot menampilkan:
- session path
- allowed group id
- owner loaded yes/no
- AI enabled yes/no
- provider
- model
- vocab count
- quiz count
- grammar topics count
- total command loaded
- reminder time + timezone

## Uji cepat
- `.health`
- `.tr halo apa kabar`
- `.trid I want to learn English`
- `.tren saya ingin belajar`
- `.fix I am go to school`

## Catatan voice note
Voice note terdeteksi. Jika STT belum aktif penuh, bot memberi fallback aman dan arahkan ke `.pronounce <teks>`.
