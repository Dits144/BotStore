async function analyzeVoiceNote() {
  return {
    supported: false,
    message: 'Voice pronunciation analysis belum aktif penuh. Kirim teks dengan .pronounce <kata/kalimat> untuk panduan pengucapan.'
  };
}

module.exports = { analyzeVoiceNote };
