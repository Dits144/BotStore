# WhatsApp English Learning Bot (Baileys Mod)

Bot WhatsApp ringan untuk belajar bahasa Inggris harian: vocab, grammar, quiz, translate, dan chat practice.

## Fitur MVP
- `.menu`
- `.daily`
- `.quiz`
- `.answer <jawaban>`
- `.translate <kalimat>`
- `.arti <kata/kalimat>`
- `.grammar <topik>`
- `.vocab`
- `.chat on` / `.chat off`
- `.score`
- `.streak`
- `.resetprogress`

## Batas Grup
Bot hanya aktif di grup:
`120363406071615706@g.us`

Jika command digunakan di luar grup itu, bot akan mengabaikan atau membalas singkat.

## Struktur Project

```txt
project-root/
  src/
    commands/
      menu.js
      daily.js
      quiz.js
      answer.js
      translate.js
      arti.js
      grammar.js
      vocab.js
      chat.js
      score.js
      streak.js
      resetprogress.js
    handlers/
      messageHandler.js
    services/
      userService.js
      lessonService.js
      quizService.js
      correctionService.js
    utils/
      parser.js
      formatter.js
      constants.js
    database/
      db.js
  data/
    vocab.json
    grammar.json
    quizzes.json
    users.json
  session/
  index.js
  package.json
  .env.example
  README.md
```

## Install
```bash
npm install
```

## Jalankan
```bash
npm start
```

## Scan QR
1. Jalankan `npm start`.
2. QR akan muncul di terminal pada login pertama.
3. Scan QR lewat WhatsApp (Linked Devices).
4. Session tersimpan di folder `session/`, jadi tidak perlu scan ulang selama auth valid.

## Cara Pakai Command
Contoh:
- `.menu`
- `.daily`
- `.quiz`
- `.answer confident`
- `.translate saya mau belajar bahasa inggris`
- `.grammar present simple`
- `.chat on`

## Catatan
- Bot memakai penyimpanan lokal JSON (`data/users.json`) untuk progress user.
- Sudah ada reconnect logic saat koneksi putus.
- Arsitektur dipisah per command, service, handler agar mudah dikembangkan.
