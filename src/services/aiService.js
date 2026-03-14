const DEFAULT_PROVIDER = process.env.AI_PROVIDER || 'openrouter';
const DEFAULT_MODEL = process.env.AI_MODEL || 'openai/gpt-4o-mini';

function isAIEnabled() {
  return Boolean(process.env.AI_API_KEY);
}

function validateProvider(provider) {
  return ['openrouter'].includes(provider);
}

async function chatCompletion({ system, user, temperature = 0.3 }) {
  const provider = process.env.AI_PROVIDER || DEFAULT_PROVIDER;
  const model = process.env.AI_MODEL || DEFAULT_MODEL;
  const apiKey = process.env.AI_API_KEY;

  if (!apiKey) {
    throw new Error('AI_API_KEY tidak tersedia');
  }

  if (!validateProvider(provider)) {
    throw new Error(`AI provider tidak didukung: ${provider}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`AI request gagal: ${response.status} ${text.slice(0, 180)}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content?.trim() || '';
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  chatCompletion,
  isAIEnabled,
  validateProvider
};
