const DEFAULT_PROVIDER = process.env.AI_PROVIDER || 'openrouter';
const DEFAULT_MODEL = process.env.AI_MODEL || 'openai/gpt-4o-mini';

async function chatCompletion({ system, user, temperature = 0.3 }) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error('AI_API_KEY belum di-set');

  if (DEFAULT_PROVIDER !== 'openrouter') throw new Error(`Provider ${DEFAULT_PROVIDER} belum didukung`);

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      temperature,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI request gagal: ${response.status} ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || '';
}

module.exports = { chatCompletion };
