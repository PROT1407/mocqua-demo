import express from 'express';
import { createCatalogSource } from './catalog.js';
import { createMessenger, facebookReady, facebookSettings, validSignature, verifyChallenge } from './facebook.js';
import { generateReply, resolveModel } from './gemini.js';
import { buildAssistant, readChat } from './prompt.js';

const ALLOWED_ORIGINS = new Set([
  'https://mocqua.com',
  'https://www.mocqua.com',
  'https://mocqua.onrender.com',
  'https://h79gold.com',
  'https://www.h79gold.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

export function createApp({
  loadCatalog = createCatalogSource(),
  generate = generateReply,
  apiKey = process.env.GEMINI_API_KEY || '',
  model = safeModel(),
  rateLimit = {
    max: positiveInt(process.env.RATE_LIMIT_MAX, 30),
    windowMs: positiveInt(process.env.RATE_LIMIT_WINDOW_MS, 10 * 60 * 1000),
  },
  facebook = {},
} = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  const fb = { ...facebookSettings(), ...(facebook.settings || {}) };
  const messenger = createMessenger({
    settings: fb,
    generate: facebook.generate || generate,
    loadCatalog: facebook.loadCatalog || loadCatalog,
    sendOwner: facebook.sendOwner,
    fetchImpl: facebook.fetchImpl,
    apiKey: facebook.apiKey ?? apiKey,
    model: facebook.model || model,
    now: facebook.now,
  });
  let facebookTail = Promise.resolve();
  app.locals.drainFacebook = () => facebookTail;

  app.get('/webhook/facebook', (req, res) => {
    const result = verifyChallenge(req.query, fb);
    if (!result.ok) {
      res.sendStatus(403);
      return;
    }
    res.status(200).type('text/plain').send(result.challenge);
  });

  app.post('/webhook/facebook', express.raw({ type: () => true, limit: '256kb' }), (req, res) => {
    if (!facebookReady(fb)) {
      res.status(200).json({ ok: true, skipped: true });
      return;
    }
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');
    if (!validSignature(raw, req.get('x-hub-signature-256'), fb.appSecret)) {
      res.sendStatus(403);
      return;
    }
    let payload = {};
    try {
      payload = JSON.parse(raw.toString('utf8') || '{}');
    } catch {
      res.status(200).json({ ok: true });
      return;
    }
    res.status(200).json({ ok: true });
    const job = messenger(payload).catch((error) => {
      console.error('facebook', String(error?.message || 'error').replace(/access_token=[^&\s]+/gi, 'access_token=<hidden>'));
    });
    facebookTail = facebookTail.then(() => job, () => job);
  });

  app.use((req, res, next) => {
    if (req.path.startsWith('/webhook/facebook')) return next();
    return corsAllowlist(req, res, next);
  });
  app.use(express.json({ limit: '32kb' }));
  const limitPosts = rateLimiter(rateLimit.max, rateLimit.windowMs);

  app.get('/', (_req, res) => {
    res.json({ ok: true, service: 'mocqua-ai-server' });
  });

  // Rẻ: không đọc danh mục, không gọi Gemini. Cửa hàng gọi GET này để đánh thức máy.
  app.get('/health', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ ok: true });
  });

  app.post('/api/h79gold', limitPosts, (_req, res) => {
    res.status(503).json({
      error: 'Cổng H79 Gold được giữ chỗ và chưa nối. Sẽ bổ sung khi bên H79 gửi logic.',
    });
  });

  app.post('/api/mocqua', limitPosts, async (req, res) => {
    const chat = readChat(req.body);
    if (chat.error) {
      res.status(400).json({ error: chat.error });
      return;
    }
    if (!apiKey) {
      res.status(503).json({ error: 'Trợ lý đang tạm nghỉ vì chưa có khóa Gemini trên máy chủ.' });
      return;
    }
    try {
      const catalog = await loadCatalog();
      const turn = buildAssistant(chat.message, chat.history, catalog);
      const reply = await generate({
        apiKey,
        model,
        system: turn.system,
        contents: turn.contents,
      });
      res.json({ reply });
    } catch (err) {
      console.error('mocqua assistant failed', err instanceof Error ? err.message : 'error');
      res.status(502).json({ error: 'Trợ lý chưa trả lời được lúc này. Bạn thử lại sau, hoặc xem hàng trên website Mộc Quả.' });
    }
  });

  app.use((err, _req, res, next) => {
    if (res.headersSent) return next(err);
    if (err?.type === 'entity.too.large') {
      res.status(413).json({ error: 'Nội dung gửi lên quá lớn.' });
      return;
    }
    if (err instanceof SyntaxError && err.status === 400) {
      res.status(400).json({ error: 'JSON không hợp lệ.' });
      return;
    }
    console.error('request failed');
    res.status(500).json({ error: 'Máy chủ gặp lỗi.' });
  });

  return app;
}

function safeModel() {
  try {
    return resolveModel();
  } catch {
    return 'gemini-3.5-flash-lite';
  }
}

function positiveInt(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

function corsAllowlist(req, res, next) {
  const origin = req.get('origin');
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    res.status(403).json({ error: 'Trang này chưa được phép gọi API.' });
    return;
  }
  if (origin) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
}

function rateLimiter(max, windowMs) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const ip = req.ip || 'local';
    const recent = (hits.get(ip) || []).filter((t) => now - t < windowMs);
    if (hits.size > 5000) {
      for (const [key, times] of hits) if (times.every((t) => now - t >= windowMs)) hits.delete(key);
    }
    if (recent.length >= max) {
      res.status(429).json({ error: 'Bạn gửi hơi nhanh. Đợi một lát rồi thử lại.' });
      return;
    }
    recent.push(now);
    hits.set(ip, recent);
    next();
  };
}
