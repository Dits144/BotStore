const DEFAULT_PROVIDER = process.env.AI_PROVIDER || 'openrouter';
const DEFAULT_MODEL = process.env.AI_MODEL || 'openai/gpt-4o-mini';

const PROVIDER_CONFIG = {
  openrouter: {
    url: 'https://openrouter.ai/api/v1/chat/completions'
  },
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions'
  }
};

function getAIConfig() {
  const provider = (process.env.AI_PROVIDER || DEFAULT_PROVIDER).toLowerCase().trim();
  const model = process.env.AI_MODEL || DEFAULT_MODEL;
  const apiKey = process.env.AI_API_KEY || '';

  return {
    provider,
    model,
    apiKeyPresent: Boolean(apiKey),
    enabled: Boolean(apiKey)
  };
}

function validateProvider(provider) {
  return Boolean(PROVIDER_CONFIG[provider]);
}

function getAIReadiness() {
  const cfg = getAIConfig();
  const providerValid = validateProvider(cfg.provider);
  const modelLoaded = Boolean(cfg.model);
  const ready = cfg.apiKeyPresent && providerValid && modelLoaded;

  return {
    ...cfg,
    providerValid,
    modelLoaded,
    ready
  };
}

function isAIEnabled() {
  return getAIReadiness().ready;
}

async function chatCompletion({ system, user, temperature = 0.3, task = 'generic' }) {
  const readiness = getAIReadiness();
  const apiKey = process.env.AI_API_KEY;

  if (!apiKey) throw new Error('AI_API_KEY tidak tersedia');
  if (!readiness.providerValid) throw new Error(`AI provider tidak didukung: ${readiness.provider}`);

  const endpoint = PROVIDER_CONFIG[readiness.provider].url;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  console.log(`[AI] provider=${readiness.provider} model=${readiness.model} task=${task}`);
  console.log(`[AI] ${task} request started`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: readiness.model,
        temperature,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status} ${text.slice(0, 180)}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('Response choices kosong/tidak valid');

    console.log(`[AI] ${task} request success`);
    return content;
  } catch (error) {
    console.error(`[AI] ${task} request failed:`, error.message);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  chatCompletion,
  isAIEnabled,
  validateProvider,
  getAIConfig,
  getAIReadiness
};
