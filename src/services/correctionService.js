function correctSentence(text) {
  const lower = text.toLowerCase().trim();

  const patterns = [
    {
      match: /^i am go to (.+)$/,
      correct: (m) => `I am going to ${m[1]}`,
      alt: (m) => `I go to ${m[1]}`,
      note: 'Setelah "am" gunakan verb-ing.'
    },
    {
      match: /^she go to (.+)$/,
      correct: (m) => `She goes to ${m[1]}`,
      alt: null,
      note: 'Untuk subject she/he/it di present simple, verb ditambah -s/-es.'
    }
  ];

  for (const rule of patterns) {
    const matched = lower.match(rule.match);
    if (matched) {
      const corrected = capitalize(rule.correct(matched));
      const alternative = rule.alt ? capitalize(rule.alt(matched)) : null;
      return {
        corrected,
        alternative,
        meaning: 'Terjemahan: kalimatmu sudah diperbaiki agar lebih natural.',
        note: rule.note
      };
    }
  }

  return {
    corrected: capitalize(text),
    alternative: null,
    meaning: 'Terjemahan: (mode sederhana) arti belum tersedia detail.',
    note: 'Kalimat terlihat oke. Coba tambah konteks agar bisa dikoreksi lebih detail.'
  };
}

function capitalize(text) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

module.exports = {
  correctSentence
};
