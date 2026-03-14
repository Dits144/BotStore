# WhatsApp English Learning Bot (Stabilized)

Bot WhatsApp belajar bahasa Inggris berbasis **Node.js + JavaScript + Baileys Mod**.

## Command Utama
- `.menu`
- `.daily`
- `.quiz`
- `.answer <jawaban>`
- `.translate <teks>` / `.tr <teks>` (auto-detect)
- `.tren <teks>` (paksa ke English)
- `.trid <teks>` (paksa ke Indonesia)
- `.arti <teks>`
- `.grammar <topik>`
- `.vocab`
- `.chat on` / `.chat off`
- `.fix <kalimat>` / `.correct <kalimat>`
- `.pronounce <kata/kalimat>`
- `.leaderboard` / `.top`
- `.rank`
- `.score`
- `.streak`
- `.resetprogress`
- `.claimowner <password>`
- `.reminder on|off|status` *(owner)*
- `.health` *(owner)*
- `.debugcmd` *(owner)*

## Group Guard
Bot hanya aktif di group:
`120363406071615706@g.us`

## Owner Claim
Jika bot belum punya owner, jalankan:
```txt
.claimowner botengress144
```
Owner disimpan permanen di `data/users.json` (global.ownerNumber).

## AI Translation
- `.tr` mendeteksi bahasa otomatis (ID ↔ EN).
- Jika `AI_API_KEY` tersedia, bot mencoba AI untuk dua arah.
- Jika AI error/tidak tersedia, fallback lokal tetap jalan (dua arah).

## Format Data
### `data/vocab.json`
Array object dengan format:
```json
{"word":"confident","meaning":"percaya diri","example":"I feel confident..."}
```

### `data/quizzes.json`
Array object dengan format:
```json
{"id":"q1","question":"...","answer":"...","options":["A","B","C","D"]}
```

## Setup
1. Install dependency
```bash
npm install
```
2. Copy env
```bash
cp .env.example .env
```
3. Isi `.env`
```env
ALLOWED_GROUP_ID=120363406071615706@g.us
OWNER_NUMBER=
AI_PROVIDER=openrouter
AI_API_KEY=your_ai_provider_key
AI_MODEL=openai/gpt-4o-mini
DAILY_REMINDER_TIME=12:00
TZ=Asia/Jakarta
```
4. Jalankan
```bash
npm start
```

## Startup Logs (untuk debug VPS)
Saat startup bot akan menampilkan:
- allowed group id
- owner loaded (yes/no)
- AI enabled (yes/no)
- vocab data loaded count
- quiz data loaded count
- total commands loaded
- reminder schedule
- session path
