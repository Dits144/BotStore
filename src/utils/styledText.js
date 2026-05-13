// ─────────────────────────────────────────────────────────────────────────────
// styledText — Unicode font converter for bot messages
//
// styled() — Headers/titles: Script Bold first letter + Sans-Serif Bold rest
//   Example: "Transaksi Pending" → "𝓣𝗿𝗮𝗻𝘀𝗮𝗸𝘀𝗶 𝓟𝗲𝗻𝗱𝗶𝗻𝗴"
//
// sans() — Body/alerts: Mathematical Sans-Serif (regular)
//   Example: "Ketik nama produk" → "𝖪𝖾𝗍𝗂𝗄 𝗇𝖺𝗆𝖺 𝗉𝗋𝗈𝖽𝗎𝗄"
// ─────────────────────────────────────────────────────────────────────────────

// ══════ styled() maps ══════

const SCRIPT_BOLD_UPPER = {
  A: '𝓐', B: '𝓑', C: '𝓒', D: '𝓓', E: '𝓔', F: '𝓕', G: '𝓖', H: '𝓗',
  I: '𝓘', J: '𝓙', K: '𝓚', L: '𝓛', M: '𝓜', N: '𝓝', O: '𝓞', P: '𝓟',
  Q: '𝓠', R: '𝓡', S: '𝓢', T: '𝓣', U: '𝓤', V: '𝓥', W: '𝓦', X: '𝓧',
  Y: '𝓨', Z: '𝓩'
};

const SANS_BOLD_LOWER = {
  a: '𝗮', b: '𝗯', c: '𝗰', d: '𝗱', e: '𝗲', f: '𝗳', g: '𝗴', h: '𝗵',
  i: '𝗶', j: '𝗷', k: '𝗸', l: '𝗹', m: '𝗺', n: '𝗻', o: '𝗼', p: '𝗽',
  q: '𝗾', r: '𝗿', s: '𝘀', t: '𝘁', u: '𝘂', v: '𝘃', w: '𝘄', x: '𝘅',
  y: '𝘆', z: '𝘇'
};

const SANS_BOLD_UPPER = {
  A: '𝗔', B: '𝗕', C: '𝗖', D: '𝗗', E: '𝗘', F: '𝗙', G: '𝗚', H: '𝗛',
  I: '𝗜', J: '𝗝', K: '𝗞', L: '𝗟', M: '𝗠', N: '𝗡', O: '𝗢', P: '𝗣',
  Q: '𝗤', R: '𝗥', S: '𝗦', T: '𝗧', U: '𝗨', V: '𝗩', W: '𝗪', X: '𝗫',
  Y: '𝗬', Z: '𝗭'
};

// ══════ sans() maps ══════

const SANS_UPPER = {
  A: '𝖠', B: '𝖡', C: '𝖢', D: '𝖣', E: '𝖤', F: '𝖥', G: '𝖦', H: '𝖧',
  I: '𝖨', J: '𝖩', K: '𝖪', L: '𝖫', M: '𝖬', N: '𝖭', O: '𝖮', P: '𝖯',
  Q: '𝖰', R: '𝖱', S: '𝖲', T: '𝖳', U: '𝖴', V: '𝖵', W: '𝖶', X: '𝖷',
  Y: '𝖸', Z: '𝖹'
};

const SANS_LOWER = {
  a: '𝖺', b: '𝖻', c: '𝖼', d: '𝖽', e: '𝖾', f: '𝖿', g: '𝗀', h: '𝗁',
  i: '𝗂', j: '𝗃', k: '𝗄', l: '𝗅', m: '𝗆', n: '𝗇', o: '𝗈', p: '𝗉',
  q: '𝗊', r: '𝗋', s: '𝗌', t: '𝗍', u: '𝗎', v: '𝗏', w: '𝗐', x: '𝗑',
  y: '𝗒', z: '𝗓'
};

// ══════ Functions ══════

/** styled(): Script Bold first letter + Sans Bold rest (for headers/titles) */
function styled(text) {
  if (!text) return '';
  return text.replace(/[a-zA-Z]+/g, (word) => {
    let result = '';
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      if (i === 0) {
        result += SCRIPT_BOLD_UPPER[ch.toUpperCase()] || ch;
      } else {
        const lower = ch.toLowerCase();
        result += ch === ch.toUpperCase() ? (SANS_BOLD_UPPER[ch] || ch) : (SANS_BOLD_LOWER[lower] || ch);
      }
    }
    return result;
  });
}

/** sans(): Mathematical Sans-Serif regular (for body text/alerts) */
function sans(text) {
  if (!text) return '';
  return text.replace(/[a-zA-Z]/g, (ch) => {
    return ch === ch.toUpperCase() ? (SANS_UPPER[ch] || ch) : (SANS_LOWER[ch] || ch);
  });
}

module.exports = { styled, sans };
