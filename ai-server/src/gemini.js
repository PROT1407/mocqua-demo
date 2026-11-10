const MODEL_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,80}$/;

export function resolveModel(value = process.env.GEMINI_MODEL) {
  const model = String(value || 'gemini-3.5-flash-lite').trim();
  if (!MODEL_NAME.test(model)) throw new Error('model');
  return model;
}

export async function generateReply({ apiKey, model, system, contents, fetchImpl = globalThis.fetch, timeoutMs = 20000 }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: { temperature: 0.4, maxOutputTokens: 700 },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    console.error('gemini request failed', response.status);
    throw new Error('gemini-http');
  }
  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const reply = parts.filter((part) => part && !part.thought && part.text).map((part) => part.text).join('\n').trim();
  if (!reply) throw new Error('gemini-empty');
  return reply;
}
