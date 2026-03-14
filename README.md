# WhatsApp English Learning Bot (Stabilization Pass)

Bot WhatsApp belajar bahasa Inggris berbasis **Node.js + JavaScript + Baileys Mod**, fokus stabil untuk VPS.

## Fokus Stabilitas
Project ini difokuskan ke **bugfix + audit alur end-to-end**, bukan menambah fitur berlebihan.

## Command yang Didukung
- `.menu`
- `.daily`
- `.quiz`
- `.answer <jawaban>`
- `.translate <kalimat>` / `.tr <kalimat>`
- `.arti <kata/kalimat>`
- `.grammar <topik>`
- `.vocab`
- `.chat on` / `.chat off`
- `.score`
- `.streak`
- `.resetprogress`
- `.fix <kalimat>` / `.correct <kalimat>`
- `.pronounce <kata/kalimat>`
- `.leaderboard` / `.top`
- `.rank`
- `.reminder on|off|status` (owner)
- `.health` (owner)
- `.debugcmd` (owner)

## Group Guard
Bot hanya aktif untuk group:
`120363406071615706@g.us`

## AI vs Lokal (Jujur)
- **Butuh AI_API_KEY**: `.translate/.tr`, `.fix/.correct`, chat practice AI.
- Jika `AI_API_KEY` tidak ada/AI error: bot **tidak crash** dan fallback ke local helper.
- `AI_API_KEY` adalah key dari provider model AI (misalnya OpenRouter), **bukan dari Baileys/WhatsApp**.

## Voice Note
- Voice note sudah dideteksi.
- Analisis pronunciation voice belum aktif penuh; bot memberi fallback aman untuk pakai `.pronounce <teks>`.

## Struktur Project
```txt
project-root/
  src/
    commands/
      answer.js arti.js chat.js daily.js debugcmd.js fix.js grammar.js
      health.js leaderboard.js menu.js pronounce.js quiz.js rank.js
      reminder.js resetprogress.js score.js streak.js translate.js vocab.js
    handlers/
      messageHandler.js
    services/
      aiService.js chatPracticeService.js commandService.js correctionService.js
      leaderboardService.js lessonService.js pronunciationService.js quizService.js
      reminderService.js speechService.js translateService.js userService.js
    scheduler/
      dailyReminder.js
    utils/
      constants.js formatter.js message.js parser.js
    database/
      db.js
  data/
    grammar.json quizzes.json users.json vocab.json
  session/
  index.js
  package.json
  .env.example
  README.md
```

## Setup
1. Install:
   ```bash
   npm install
   ```
2. Copy env:
   ```bash
   cp .env.example .env
   ```
3. Isi `.env`:
   ```env
   ALLOWED_GROUP_ID=120363406071615706@g.us
   OWNER_NUMBER=6282120196167

   AI_PROVIDER=openrouter
   AI_API_KEY=your_ai_provider_key
   AI_MODEL=openai/gpt-4o-mini

   DAILY_REMINDER_TIME=12:00
   TZ=Asia/Jakarta
   ```
4. Jalankan:
   ```bash
   npm start
   ```

## Startup Sanity Logs
Saat bot start, akan print:
- allowed group id
- owner number loaded yes/no
- ai enabled yes/no
- total command loaded
- reminder schedule
- session path

## Checklist Uji Manual End-to-End
1. Login QR muncul di terminal.
2. Bot connect.
3. Kirim di group allowed:
   - `.menu`
   - `.daily`
   - `.quiz`
   - `.answer A` (atau jawaban teks)
   - `.grammar present simple`
   - `.vocab`
   - `.score`
   - `.tr halo apa kabar`
   - `.fix I am go to school`
   - `.chat on`, lalu kirim pesan biasa
   - `.leaderboard`
   - `.rank`
   - `.reminder status` (owner)
   - `.health` (owner)
   - `.debugcmd` (owner)

## Catatan Teknis
- Storage JSON aman: read default, recover file corrupt, write atomic (tmp + rename).
- Scheduler reminder start sekali saat koneksi open.
- Reconnect aman saat koneksi putus (kecuali logged out).
