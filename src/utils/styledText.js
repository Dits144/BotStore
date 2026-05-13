// ─────────────────────────────────────────────────────────────────────────────
// styledText — Unicode font converter for bot alerts
//
// Converts plain text to stylized Unicode text:
//   First letter of each word → Mathematical Bold Script Capital (𝓐-𝓩)
//   Remaining letters → Mathematical Sans-Serif Bold Small (𝗮-𝘇)
//
// Example: "Gagal menambahkan list" → "𝓖𝗮𝗴𝗮𝗹 𝓜𝗲𝗻𝗮𝗺𝗯𝗮𝗵𝗸𝗮𝗻 𝓛𝗶𝘀𝘁"
// ─────────────────────────────────────────────────────────────────────────────

// Mathematical Bold Script Capital: A-Z → U+1D4D0 to U+1D4E9
const SCRIPT_BOLD_UPPER = {
  A: '𝓐', B: '𝓑', C: '𝓒', D: '𝓓', E: '𝓔', F: '𝓕', G: '𝓖', H: '𝓗',
  I: '𝓘', J: '𝓙', K: '𝓚', L: '𝓛', M: '𝓜', N: '𝓝', O: '𝓞', P: '𝓟',
  Q: '𝓠', R: '𝓡', S: '𝓢', T: '𝓣', U: '𝓤', V: '𝓥', W: '𝓦', X: '𝓧',
  Y: '𝓨', Z: '𝓩'
};

// Mathematical Sans-Serif Bold Small: a-z → U+1D5EE to U+1D607
const SANS_BOLD_LOWER = {
  a: '𝗮', b: '𝗯', c: '𝗰', d: '𝗱', e: '𝗲', f: '𝗳', g: '𝗴', h: '𝗵',
  i: '𝗶', j: '𝗷', k: '𝗸', l: '𝗹', m: '𝗺', n: '𝗻', o: '𝗼', p: '𝗽',
  q: '𝗾', r: '𝗿', s: '𝘀', t: '𝘁', u: '𝘂', v: '𝘃', w: '𝘄', x: '𝘅',
  y: '𝘆', z: '𝘇'
};

// Mathematical Sans-Serif Bold Capital: A-Z → U+1D5D4 to U+1D5ED
const SANS_BOLD_UPPER = {
  A: '𝗔', B: '𝗕', C: '𝗖', D: '𝗗', E: '𝗘', F: '𝗙', G: '𝗚', H: '𝗛',
  I: '𝗜', J: '𝗝', K: '𝗞', L: '𝗟', M: '𝗠', N: '𝗡', O: '𝗢', P: '𝗣',
  Q: '𝗤', R: '𝗥', S: '𝗦', T: '𝗧', U: '𝗨', V: '𝗩', W: '𝗪', X: '𝗫',
  Y: '𝗬', Z: '𝗭'
};

/**
 * Convert a word to styled text:
 * First letter → Script Bold Capital, rest → Sans Bold Lower/Upper
 */
function styledWord(word) {
  if (!word) return '';

  let result = '';
  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    if (i === 0) {
      // First letter → Script Bold Capital
      const upper = ch.toUpperCase();
      result += SCRIPT_BOLD_UPPER[upper] || ch;
    } else {
      // Remaining → Sans Bold
      const lower = ch.toLowerCase();
      if (SANS_BOLD_LOWER[lower]) {
        result += ch === ch.toUpperCase() ? (SANS_BOLD_UPPER[ch] || ch) : SANS_BOLD_LOWER[lower];
      } else {
        result += ch;
      }
    }
  }
  return result;
}

/**
 * Convert full text to styled font.
 * Preserves emojis, special characters, and whitespace.
 * Only converts ASCII letter words.
 *
 * @param {string} text - Plain text to convert
 * @returns {string} Styled text
 */
function styled(text) {
  if (!text) return '';
  // Split by word boundaries while preserving separators
  return text.replace(/[a-zA-Z]+/g, (match) => styledWord(match));
}

module.exports = { styled, styledWord };
