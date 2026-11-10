export function ownerSettings(env = process.env) {
  const token = String(env.TELEGRAM_BOT_TOKEN || '').trim();
  const chatIds = String(env.TELEGRAM_CHAT_ID || '').split(',').map((id) => id.trim()).filter(Boolean);
  return { token, chatIds, enabled: Boolean(token && chatIds.length) };
}

export function scrubSecret(error) {
  return String(error?.message || error || 'error')
    .replace(/bot\d+:[A-Za-z0-9_-]+/g, 'bot<hidden>')
    .replace(/access_token=[^&\s]+/gi, 'access_token=<hidden>');
}

export async function notifyOwner(text, { fetchImpl = globalThis.fetch, settings = ownerSettings() } = {}) {
  if (!settings.enabled) return { skipped: true, sent: 0 };
  let sent = 0;
  for (const chatId of settings.chatIds) {
    try {
      const response = await fetchImpl(`https://api.telegram.org/bot${settings.token}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: String(text).slice(0, 4000) }),
      });
      if (!response.ok) {
        console.error('telegram send failed', response.status);
        continue;
      }
      sent += 1;
    } catch (error) {
      console.error('telegram', scrubSecret(error));
    }
  }
  return { skipped: false, sent };
}
