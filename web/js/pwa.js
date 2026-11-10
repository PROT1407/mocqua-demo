if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  });
}

// Đánh thức ai-server khi khách mở cửa hàng. Không chờ, không báo lỗi.
// Mỗi trình duyệt tối đa một lần mỗi 10 phút (localStorage, không được thì sessionStorage).
const AI_WARM_KEY = 'mq_ai_warm_at';
const AI_WARM_GAP_MS = 10 * 60 * 1000;
const DEFAULT_AI_HEALTH = 'https://ai-server-u9ob.onrender.com/health';

function aiHealthUrl() {
  const meta = document.querySelector('meta[name="mq-ai-health"]');
  if (!meta) return DEFAULT_AI_HEALTH;
  const raw = meta.content.trim();
  if (!raw) return '';
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
    return url.href;
  } catch {
    return '';
  }
}

function warmStamp() {
  try {
    return Math.max(Number(localStorage.getItem(AI_WARM_KEY) || 0), Number(sessionStorage.getItem(AI_WARM_KEY) || 0));
  } catch {
    try {
      return Number(sessionStorage.getItem(AI_WARM_KEY) || 0);
    } catch {
      return 0;
    }
  }
}

function rememberWarm(now) {
  try {
    localStorage.setItem(AI_WARM_KEY, String(now));
  } catch {
    /* bộ nhớ đầy hoặc bị chặn */
  }
  try {
    sessionStorage.setItem(AI_WARM_KEY, String(now));
  } catch {
    /* cửa sổ riêng tư */
  }
}

function warmAiServer() {
  if (document.body.classList.contains('page-admin')) return;
  const url = aiHealthUrl();
  if (!url) return;
  const now = Date.now();
  const last = warmStamp();
  if (last && now - last < AI_WARM_GAP_MS) return;
  rememberWarm(now);
  fetch(url, {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit',
    cache: 'no-store',
    keepalive: true,
  }).catch(() => {});
}

warmAiServer();
