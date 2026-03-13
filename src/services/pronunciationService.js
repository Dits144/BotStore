const dictionary = {
  comfortable: 'kumf-ter-bel',
  enough: 'i-naf',
  vocabulary: 'vo-kab-yu-ler-i',
  schedule: 'ske-jul',
  confident: 'kon-fi-dent'
};

function syllableLike(word) {
  return word
    .toLowerCase()
    .replace(/tion/g, 'syen')
    .replace(/ough/g, 'af')
    .replace(/ph/g, 'f')
    .replace(/c(?=[eiy])/g, 's')
    .replace(/[^a-z]/g, '');
}

function getPronunciationGuide(text) {
  const words = text.split(/\s+/).filter(Boolean);
  return words.map((word) => {
    const key = word.toLowerCase();
    return { word, pronounce: dictionary[key] || syllableLike(word) || word };
  });
}

module.exports = { getPronunciationGuide };
