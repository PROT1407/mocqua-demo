import crypto from 'node:crypto';
import { fold } from './catalog.js';
import { buildAssistant } from './prompt.js';
import { notifyOwner, scrubSecret } from './telegram.js';

const HUMAN = ['gap nhan vien', 'goi lai', 'nguoi that'];
const PAUSE_MS = 60 * 60 * 1000;
const HISTORY_TTL_MS = 60 * 60 * 1000;
const HISTORY_LIMIT = 10;
const RATE_MAX = 8;
const RATE_WINDOW_MS = 10 * 60 * 1000;

export function facebookSettings(env = process.env) {
  return {
    verifyToken: String(env.FB_VERIFY_TOKEN || '').trim(),
    appSecret: String(env.FB_APP_SECRET || '').trim(),
    pageToken: String(env.FB_PAGE_ACCESS_TOKEN || '').trim(),
  };
}

export function facebookReady(settings) {
  return Boolean(settings.verifyToken && settings.appSecret && settings.pageToken);
}

export function verifyChallenge(query, settings) {
  if (!settings.verifyToken) return { ok: false };
  if (query?.['hub.mode'] === 'subscribe' && query?.['hub.verify_token'] === settings.verifyToken) {
    return { ok: true, challenge: String(query['hub.challenge'] ?? '') };
  }
  return { ok: false };
}

export function validSignature(raw, header, secret) {
  if (!secret || !header || raw == null) return false;
  const digest = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  const expected = Buffer.from(`sha256=${digest}`);
  const actual = Buffer.from(String(header));
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

export function wantsHuman(text) {
  const folded = fold(text);
  return HUMAN.some((phrase) => folded.includes(phrase));
}

export function extractOrder(text) {
  const source = String(text || '');
  const phone = source.match(/(?:\+84|0)\d{8,10}/);
  if (!phone) return null;
  const folded = fold(source);
  const address = /(duong|pho |phuong|quan|huyen|tinh|thanh pho|tp |dia chi|so nha|hem |thon )/.test(folded);
  const lines = source.split(/\n/).map((line) => line.trim()).filter(Boolean);
  if (!address && lines.length < 3) return null;
  return { phone: phone[0], text: source.slice(0, 800) };
}

export function createMessenger({
  settings,
  generate,
  loadCatalog,
  sendOwner = (text) => notifyOwner(text),
  fetchImpl = globalThis.fetch,
  apiKey = '',
  model = '',
  now = () => Date.now(),
} = {}) {
  const history = new Map();
  const paused = new Map();
  const rates = new Map();
  const warned = new Map();

  function remember(psid, role, text) {
    const slot = history.get(psid) || { at: 0, turns: [] };
    if (now() - slot.at > HISTORY_TTL_MS) slot.turns = [];
    slot.turns.push({ role, text });
    slot.turns = slot.turns.slice(-HISTORY_LIMIT);
    slot.at = now();
    history.set(psid, slot);
    return slot.turns.filter((turn) => turn.role === 'user' || turn.role === 'model');
  }

  function historyOf(psid) {
    const slot = history.get(psid);
    if (!slot || now() - slot.at > HISTORY_TTL_MS) return [];
    return slot.turns.slice();
  }

  function isPaused(psid) {
    const until = paused.get(psid) || 0;
    if (until && until > now()) return true;
    if (until) paused.delete(psid);
    return false;
  }

  function pause(psid) {
    paused.set(psid, now() + PAUSE_MS);
  }

  function limited(psid) {
    const recent = (rates.get(psid) || []).filter((t) => now() - t < RATE_WINDOW_MS);
    if (recent.length >= RATE_MAX) {
      rates.set(psid, recent);
      return true;
    }
    recent.push(now());
    rates.set(psid, recent);
    warned.delete(psid);
    return false;
  }

  async function graph(body) {
    const response = await fetchImpl(`https://graph.facebook.com/v21.0/me/messages?access_token=${encodeURIComponent(settings.pageToken)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) console.error('facebook send failed', response.status);
  }

  async function say(psid, text) {
    await graph({ recipient: { id: psid }, sender_action: 'typing_on' });
    await graph({
      recipient: { id: psid },
      messaging_type: 'RESPONSE',
      message: { text: String(text).slice(0, 1900), metadata: 'mocqua-bot' },
    });
  }

  async function handoff(psid, reason) {
    pause(psid);
    await sendOwner(`👤 Facebook cần người thật.\n${reason}\nPSID: ${psid}`);
  }

  async function onText(psid, text) {
    if (isPaused(psid)) return;
    if (wantsHuman(text)) {
      await handoff(psid, `Khách nhắn: ${text.slice(0, 300)}`);
      await say(psid, 'Mộc Quả đã báo nhân viên. Anh/chị chờ một chút, Mộc Quả sẽ trả lời trực tiếp.');
      return;
    }
    const order = extractOrder(text);
    if (order) {
      const turns = remember(psid, 'user', text);
      const summary = turns.map((turn) => `${turn.role === 'model' ? 'Mộc Quả' : 'Khách'}: ${turn.text}`).join('\n');
      await sendOwner(`📩 KHÁCH FACEBOOK MUỐN ĐẶT\nPSID: ${psid}\nĐiện thoại: ${order.phone}\n\n${summary}`);
      const reply = 'Mộc Quả đã ghi nhận thông tin anh/chị gửi. Mộc Quả sẽ liên hệ để xác nhận. Anh/chị cũng có thể tự đặt trên https://mocqua.onrender.com. Mộc Quả chưa nhận thanh toán trong khung chat này.';
      remember(psid, 'model', reply);
      await say(psid, reply);
      return;
    }
    if (limited(psid)) {
      if (!warned.get(psid)) {
        warned.set(psid, true);
        await say(psid, 'Anh/chị nhắn hơi nhanh. Mộc Quả trả lời tiếp sau ít phút.');
      }
      return;
    }
    await graph({ recipient: { id: psid }, sender_action: 'typing_on' });
    let reply = 'Mộc Quả chưa trả lời được lúc này. Anh/chị xem hàng trên https://mocqua.onrender.com nhé.';
    if (apiKey) {
      try {
        const catalog = await loadCatalog();
        const priorTurns = historyOf(psid);
        remember(psid, 'user', text);
        const turn = buildAssistant(text, priorTurns, catalog);
        reply = await generate({ apiKey, model, system: turn.system, contents: turn.contents });
      } catch (error) {
        console.error('facebook assistant failed', scrubSecret(error));
      }
    }
    remember(psid, 'model', reply);
    await graph({
      recipient: { id: psid },
      messaging_type: 'RESPONSE',
      message: { text: String(reply).slice(0, 1900), metadata: 'mocqua-bot' },
    });
  }

  return async function handle(payload) {
    if (payload?.object !== 'page') return;
    for (const entry of payload.entry || []) {
      for (const event of entry.messaging || []) {
        if (event.delivery || event.read) continue;
        const message = event.message || (event.postback ? { text: event.postback.title || event.postback.payload || '' } : null);
        if (!message) continue;
        if (message.is_echo) {
          if (message.metadata === 'mocqua-bot') continue;
          const customer = event.recipient?.id;
          if (customer) await handoff(customer, 'Nhân viên đã trả lời trên trang Facebook.');
          continue;
        }
        const psid = event.sender?.id;
        if (!psid) continue;
        const text = typeof message.text === 'string' ? message.text.trim() : '';
        if (!text && message.attachments?.length) {
          if (isPaused(psid)) continue;
          await sendOwner(`📎 Khách Facebook gửi ảnh hoặc tệp. PSID: ${psid}`);
          await say(psid, 'Mộc Quả sẽ xem ảnh và trả lời sớm.');
          continue;
        }
        if (text) await onText(psid, text);
      }
    }
  };
}
