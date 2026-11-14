import crypto from 'node:crypto';
import { fold } from './catalog.js';
import { buildAssistant, isFirstGreeting, shapeReply } from './prompt.js';
import { notifyOwner, scrubSecret } from './telegram.js';

const HUMAN = ['gap nhan vien', 'goi lai', 'nguoi that'];
const PAUSE_MS = 60 * 60 * 1000;
const HISTORY_TTL_MS = 60 * 60 * 1000;
const HISTORY_LIMIT = 10;
const DEFAULT_RATE_MAX = 40;
const DEFAULT_RATE_WINDOW_MS = 10 * 60 * 1000;
const DEFAULT_QUIET_MS = 4000;
const DEFAULT_MAX_WAIT_MS = 12 * 1000;
const RATE_TEXT = 'Anh/chị nhắn hơi nhanh. Mộc Quả trả lời tiếp sau ít phút.';
const HUMAN_REPLY = 'Mộc Quả đã báo nhân viên. Anh/chị chờ một chút, Mộc Quả sẽ trả lời trực tiếp.';
const ORDER_REPLY = 'Mộc Quả đã ghi nhận thông tin anh/chị gửi. Mộc Quả sẽ liên hệ để xác nhận. Anh/chị cũng có thể tự đặt trên https://mocqua.onrender.com. Mộc Quả chưa nhận thanh toán trong khung chat này.';
const FALLBACK = 'Mộc Quả đã nhận tin của anh/chị, nhân viên sẽ trả lời ngay ạ. Anh/chị cũng có thể xem hàng tại https://mocqua.onrender.com.';
const FAIL_ALERT_PSID_MS = 10 * 60 * 1000;
const FAIL_ALERT_GLOBAL_MS = 60 * 1000;

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
  env = process.env,
  rateMax,
  rateWindowMs,
  quietMs,
  maxWaitMs,
  schedule = (fn, ms) => setTimeout(fn, ms),
  clearSchedule = (id) => clearTimeout(id),
} = {}) {
  const history = new Map();
  const paused = new Map();
  const rates = new Map();
  const warned = new Map();
  const bursts = new Map();
  const lanes = new Map();
  const geminiAlerts = new Map();
  let geminiAlertGlobalAt = 0;
  const RATE_MAX = positiveInt(rateMax ?? env.FB_RATE_MAX, DEFAULT_RATE_MAX);
  const RATE_WINDOW_MS = positiveInt(rateWindowMs ?? env.FB_RATE_WINDOW_MS, DEFAULT_RATE_WINDOW_MS);
  const QUIET_MS = positiveInt(quietMs, DEFAULT_QUIET_MS);
  const MAX_WAIT_MS = positiveInt(maxWaitMs, DEFAULT_MAX_WAIT_MS);

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

  function recentHits(psid) {
    const recent = (rates.get(psid) || []).filter((t) => now() - t < RATE_WINDOW_MS);
    if (recent.length) rates.set(psid, recent);
    else rates.delete(psid);
    return recent;
  }

  function isOver(psid) {
    return recentHits(psid).length >= RATE_MAX;
  }

  function takeSlot(psid) {
    const recent = recentHits(psid);
    if (recent.length >= RATE_MAX) return false;
    recent.push(now());
    rates.set(psid, recent);
    return true;
  }

  function markWarned(psid) {
    const at = warned.get(psid) || 0;
    if (at && now() - at < RATE_WINDOW_MS) return false;
    warned.set(psid, now());
    return true;
  }

  function onLane(psid, fn) {
    const prev = lanes.get(psid) || Promise.resolve();
    const run = prev.then(() => fn(), () => fn());
    const settled = run.then(() => {}, () => {});
    lanes.set(psid, settled);
    settled.then(() => {
      if (lanes.get(psid) === settled) lanes.delete(psid);
    });
    return run;
  }

  async function graph(body) {
    const response = await fetchImpl(`https://graph.facebook.com/v21.0/me/messages?access_token=${encodeURIComponent(settings.pageToken)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) console.error('facebook send failed', response.status);
  }

  function showTyping(psid) {
    graph({ recipient: { id: psid }, sender_action: 'typing_on' }).catch((error) => {
      console.error('facebook typing failed', scrubSecret(error));
    });
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

  async function deliverOrder(psid, text) {
    const order = extractOrder(text);
    if (!order) return;
    const turns = remember(psid, 'user', text);
    const summary = turns.map((turn) => `${turn.role === 'model' ? 'Mộc Quả' : 'Khách'}: ${turn.text}`).join('\n');
    await sendOwner(`📩 KHÁCH FACEBOOK MUỐN ĐẶT\nPSID: ${psid}\nĐiện thoại: ${order.phone}\n\n${summary}`);
    remember(psid, 'model', ORDER_REPLY);
    await say(psid, ORDER_REPLY);
  }

  function takeGeminiAlert(psid) {
    const t = now();
    if (geminiAlerts.size > 500) {
      for (const [id, at] of geminiAlerts) {
        if (t - at >= FAIL_ALERT_PSID_MS) geminiAlerts.delete(id);
      }
    }
    const last = geminiAlerts.get(psid) || 0;
    if (last && t - last < FAIL_ALERT_PSID_MS) return false;
    if (geminiAlertGlobalAt && t - geminiAlertGlobalAt < FAIL_ALERT_GLOBAL_MS) return false;
    geminiAlerts.set(psid, t);
    geminiAlertGlobalAt = t;
    return true;
  }

  async function notifyGeminiDown(psid, text) {
    if (!takeGeminiAlert(psid)) return;
    const snippet = String(text || '').trim().slice(0, 300);
    const notice = scrubSecret(`⚠️ Bot chưa trả lời được (Gemini lỗi).\nPSID: ${psid}\nKhách nhắn: ${snippet}`);
    try {
      await sendOwner(notice);
    } catch (error) {
      console.error('facebook owner alert failed', scrubSecret(error));
    }
  }

  async function respond(psid, texts) {
    if (isPaused(psid)) return;
    const text = texts.join('\n').trim();
    if (!text) return;
    if (wantsHuman(text)) {
      await handoff(psid, `Khách nhắn: ${text.slice(0, 300)}`);
      await say(psid, HUMAN_REPLY);
      return;
    }
    if (texts.length === 1 && extractOrder(text)) {
      await deliverOrder(psid, text);
      return;
    }
    if (!takeSlot(psid)) {
      if (markWarned(psid)) await say(psid, RATE_TEXT);
      return;
    }
    const priorTurns = historyOf(psid);
    let reply = FALLBACK;
    let geminiFailed = !apiKey;
    if (apiKey) {
      try {
        const catalog = await loadCatalog();
        remember(psid, 'user', text);
        const turn = buildAssistant(text, priorTurns, catalog, { consecutive: texts.length > 1 });
        reply = await generate({ apiKey, model, system: turn.system, contents: turn.contents });
        geminiFailed = false;
      } catch (error) {
        console.error('facebook assistant failed', scrubSecret(error));
        reply = FALLBACK;
        geminiFailed = true;
      }
    }
    reply = shapeReply(reply, {
      allowSlogan: !geminiFailed && isFirstGreeting(priorTurns, text),
      message: text,
    });
    if (geminiFailed) await notifyGeminiDown(psid, text);
    remember(psid, 'model', reply);
    await say(psid, reply);
  }

  function takeBurst(psid) {
    const burst = bursts.get(psid);
    if (!burst) return null;
    bursts.delete(psid);
    if (burst.timer != null) {
      clearSchedule(burst.timer);
      burst.timer = null;
    }
    return burst;
  }

  function arm(psid, burst) {
    if (burst.timer != null) clearSchedule(burst.timer);
    burst.seq += 1;
    const seq = burst.seq;
    const elapsed = Math.max(0, now() - burst.startedAt);
    const delay = Math.min(QUIET_MS, Math.max(0, MAX_WAIT_MS - elapsed));
    burst.timer = schedule(() => onLane(psid, () => {
      const current = bursts.get(psid);
      if (!current || current.seq !== seq) return undefined;
      return flushBody(psid);
    }).catch((error) => {
      console.error('facebook', scrubSecret(error));
    }), delay);
  }

  function pushBurst(psid, text) {
    let burst = bursts.get(psid);
    if (!burst) {
      let resolve = () => {};
      const done = new Promise((settle) => { resolve = settle; });
      burst = { texts: [], startedAt: now(), done, resolve, timer: null, seq: 0, typed: false };
      bursts.set(psid, burst);
    }
    burst.texts.push(text);
    if (!burst.typed) {
      burst.typed = true;
      showTyping(psid);
    }
    arm(psid, burst);
    return burst.done;
  }

  async function flushBody(psid) {
    const burst = takeBurst(psid);
    if (!burst) return;
    try {
      if (burst.texts.length) await respond(psid, burst.texts);
    } catch (error) {
      console.error('facebook', scrubSecret(error));
    } finally {
      burst.resolve();
    }
  }

  function beginText(psid, text) {
    if (isPaused(psid)) return {};
    if (wantsHuman(text)) {
      const burst = takeBurst(psid);
      const all = [...(burst?.texts || []), text].join('\n');
      return {
        immediate: (async () => {
          try {
            await handoff(psid, `Khách nhắn: ${all.slice(0, 300)}`);
            await say(psid, HUMAN_REPLY);
          } finally {
            burst?.resolve();
          }
        })(),
      };
    }
    if (extractOrder(text)) {
      const burst = takeBurst(psid);
      return {
        immediate: (async () => {
          try {
            for (const line of burst?.texts || []) remember(psid, 'user', line);
            await deliverOrder(psid, text);
          } finally {
            burst?.resolve();
          }
        })(),
      };
    }
    if (isOver(psid)) {
      if (markWarned(psid)) return { immediate: say(psid, RATE_TEXT) };
      return {};
    }
    return { after: pushBurst(psid, text) };
  }

  function bufferText(psid, text) {
    let follow = Promise.resolve();
    const queued = onLane(psid, () => {
      const outcome = beginText(psid, text);
      follow = outcome.after || Promise.resolve();
      return outcome.immediate;
    });
    return queued.then(() => follow);
  }

  function dispatch(event) {
    if (event.delivery || event.read) return null;
    const message = event.message;
    if (message?.is_echo) {
      if (message.metadata === 'mocqua-bot') return null;
      const customer = event.recipient?.id;
      if (!customer) return null;
      return onLane(customer, async () => {
        const burst = takeBurst(customer);
        try {
          await handoff(customer, 'Nhân viên đã trả lời trên trang Facebook.');
        } finally {
          burst?.resolve();
        }
      });
    }
    if (event.postback) {
      const psid = event.sender?.id;
      if (!psid) return null;
      const text = String(event.postback.title || event.postback.payload || '').trim();
      if (!text) return null;
      return onLane(psid, async () => {
        await flushBody(psid);
        await respond(psid, [text]);
      });
    }
    if (!message) return null;
    const psid = event.sender?.id;
    if (!psid) return null;
    const text = typeof message.text === 'string' ? message.text.trim() : '';
    if (!text && message.attachments?.length) {
      if (isPaused(psid)) return null;
      return (async () => {
        await sendOwner(`📎 Khách Facebook gửi ảnh hoặc tệp. PSID: ${psid}`);
        await say(psid, 'Mộc Quả sẽ xem ảnh và trả lời sớm.');
      })();
    }
    if (text) return bufferText(psid, text);
    return null;
  }

  return async function handle(payload) {
    if (payload?.object !== 'page') return;
    const waits = [];
    for (const entry of payload.entry || []) {
      for (const event of entry.messaging || []) {
        const wait = dispatch(event);
        if (wait) waits.push(wait);
      }
    }
    await Promise.all(waits);
  };
}

function positiveInt(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}
