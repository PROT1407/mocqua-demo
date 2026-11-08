import express from 'express';
import { createCatalogSource, formatCatalog } from './catalog.js';
import { generateReply, resolveModel } from './gemini.js';
import { SYSTEM_PROMPT, buildContents, readChat } from './prompt.js';

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
} = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '32kb' }));
  app.use(corsAllowlist);
  const limitPosts = rateLimiter(rateLimit.max, rateLimit.windowMs);

  app.get('/health', (_req, res) => {
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
      const reply = await generate({
        apiKey,
        model,
        system: SYSTEM_PROMPT,
        contents: buildContents(chat.message, chat.history, {
          ok: catalog.ok && catalog.items.length > 0,
          stale: catalog.stale,
          updated: catalog.updated,
          text: formatCatalog(catalog.items),
        }),
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
    return 'gemini-2.5-flash';
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
