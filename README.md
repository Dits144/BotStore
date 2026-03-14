# WhatsApp English Learning Bot (Production Stabilization)

Bot belajar bahasa Inggris berbasis **Node.js + JavaScript + Baileys Mod**.

## Fitur Existing (Sudah Wired)
- `.menu`
- `.daily`
- `.quiz`
- `.answer <jawaban>`
- `.translate <teks>` / `.tr <teks>` (auto detect)
- `.tren <teks>` (paksa ke English)
- `.trid <teks>` (paksa ke Indonesia)
- `.arti <teks>`
- `.grammar <topik>`
- `.vocab`
- `.chat on` / `.chat off`
- `.score` / `.streak` / `.resetprogress`
- `.fix <kalimat>` / `.correct <kalimat>`
- `.pronounce <teks>`
- `.leaderboard` / `.top` / `.rank`
- `.claimowner <password>`
- `.reminder on|off|status` *(owner)*
- `.health` *(owner)*
- `.debugcmd` *(owner)*

## Group Restriction
Bot hanya aktif di grup:
`120363406071615706@g.us`

## AI vs Lokal
### Butuh AI API key
- `.tr/.translate/.tren/.trid` (prioritas AI)
- `.fix/.correct`
- chat mode AI (`.chat on`)

### Fallback lokal (jika AI gagal / AI_API_KEY tidak tersedia)
- translate dua arah ID ↔ EN (dataset lokal terbatas)
- koreksi grammar sederhana rule-based

> `AI_API_KEY` adalah key dari provider model AI (contoh OpenRouter), **bukan key Baileys/WhatsApp**.

## Owner Claim
Jika belum ada owner:
```txt
.claimowner botengress144
```
Owner disimpan permanen di `data/users.json` -> `global.ownerNumber`.

## Struktur Data
### `data/vocab.json`
Array item:
```json
{
  "word": "confident",
  "meaning": "percaya diri",
  "example": "I feel confident when I speak in class."
}
```

### `data/quizzes.json`
Array item:
```json
{
  "id": "q1",
  "question": "Apa arti kata 'confident'?",
  "answer": "percaya diri",
  "options": ["percaya diri", "jadwal", "tantangan", "latihan"]
}
```

### `data/grammar.json`
Minimal field per topik:
- `title`
- `pattern`
- `usage`
- `examples`
- `exercises`

## Setup
1. Install dependencies
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

## Startup Log Wajib
Saat startup bot akan menampilkan:
- session path
- allowed group id
- owner loaded yes/no
- AI enabled yes/no
- provider
- model
- vocab loaded count
- quizzes loaded count
- grammar topics count
- total command loaded
- reminder time
- timezone

## Checklist Uji End-to-End
1. QR muncul di terminal lalu scan.
2. Di grup allowed kirim:
   - `.menu`
   - `.daily`
   - `.quiz`
   - `.answer A`
   - `.tr how are you`
   - `.tren saya mau belajar bahasa inggris`
   - `.trid i am happy`
   - `.grammar present simple`
   - `.vocab`
   - `.chat on` lalu kirim pesan biasa
   - `.fix I am go to school`
   - `.score`
   - `.leaderboard`
   - `.rank`
3. Owner flow:
   - `.claimowner botengress144`
   - `.health`
   - `.debugcmd`
   - `.reminder status`

## Voice Note
Voice note sudah terdeteksi. Jika STT belum aktif penuh, bot memakai fallback aman dan mengarahkan user pakai `.pronounce <teks>`.
