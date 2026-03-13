# WhatsApp English Learning Bot (Stage 2)

Bot WhatsApp belajar bahasa Inggris berbasis **Node.js + JavaScript + Baileys Mod**, modular dan ringan untuk VPS.

## Fitur
- `.menu`
- `.daily`
- `.quiz`
- `.answer <jawaban>`
- `.translate <kalimat>` / `.tr <kalimat>` (AI + fallback lokal)
- `.fix <kalimat>` / `.correct <kalimat>` (AI grammar correction + fallback)
- `.arti <kata/kalimat>`
- `.grammar <topik>`
- `.vocab`
- `.pronounce <kata/kalimat>`
- `.chat on` / `.chat off` (AI chat practice ringkas)
- `.leaderboard` / `.top`
- `.rank`
- `.reminder on|off|status` (owner)
- `.score`
- `.streak`
- `.resetprogress`

## Group Restriction
Bot hanya aktif di grup:
`120363406071615706@g.us`

## Struktur
```txt
project-root/
  src/
    commands/
      answer.js arti.js chat.js daily.js fix.js grammar.js leaderboard.js
      menu.js pronounce.js quiz.js rank.js reminder.js resetprogress.js
      score.js streak.js translate.js vocab.js
    handlers/
      messageHandler.js
    services/
      aiService.js chatPracticeService.js correctionService.js leaderboardService.js
      lessonService.js pronunciationService.js quizService.js reminderService.js
      speechService.js translateService.js userService.js
    scheduler/
      dailyReminder.js
    utils/
      constants.js formatter.js parser.js
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
1. Install dependency:
   ```bash
   npm install
   ```
2. Copy env:
   ```bash
   cp .env.example .env
   ```
3. Isi `.env`:
   - `AI_API_KEY`
   - `OWNER_NUMBER`
   - `DAILY_REMINDER_TIME`
   - `TZ`
4. Jalankan bot:
   ```bash
   npm start
   ```

## QR Login
- Saat login awal, QR ditampilkan di terminal.
- Scan via WhatsApp > Linked Devices.
- Auth disimpan di folder `session/`, jadi tidak perlu scan ulang terus-menerus.

## Reminder Harian
- Scheduler pakai `node-cron`.
- Default waktu: `07:00` (`TZ=Asia/Jakarta`).
- Owner bisa kontrol lewat `.reminder on|off|status`.

## Voice Note
- MVP sudah mendeteksi voice note saat chat mode aktif.
- Analisis pronunciation voice **belum aktif penuh** (fallback aman): bot akan mengarahkan user kirim teks dengan `.pronounce`.

## Catatan Stabilitas
- Semua command dibatasi di allowed group.
- AI error tidak bikin bot crash (fallback lokal disiapkan).
- JSON storage pakai write aman (tmp file + rename).
