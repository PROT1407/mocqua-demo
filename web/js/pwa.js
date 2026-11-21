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

export const INSTALL_GAP_MS = 7 * 24 * 60 * 60 * 1000;

export function installOffer({ standalone, mobile, dismissedAt, now, ios, hasPrompt }) {
  if (standalone || !mobile) return 'hidden';
  if (Number.isFinite(dismissedAt) && now - dismissedAt < INSTALL_GAP_MS) return 'hidden';
  if (ios) return 'ios';
  if (hasPrompt) return 'android';
  return 'hidden';
}

const DISMISS_KEY = 'mq_pwa_dismiss_at';

function dismissedAt() {
  try {
    const value = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function rememberDismiss() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* bộ nhớ bị chặn */
  }
}

function mountInstall() {
  if (document.body.classList.contains('page-admin')) return;
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const mobile = window.matchMedia('(max-width: 768px)').matches;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  let promptEvent = null;
  let banner = null;

  const paint = () => {
    const mode = installOffer({
      standalone,
      mobile,
      dismissedAt: dismissedAt(),
      now: Date.now(),
      ios,
      hasPrompt: Boolean(promptEvent),
    });
    if (banner) banner.remove();
    banner = null;
    if (mode === 'hidden') return;
    banner = document.createElement('aside');
    banner.className = 'install';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cài app Mộc Quả');
    const text = mode === 'ios'
      ? 'Cài app Mộc Quả: chạm Chia sẻ, rồi Thêm vào Màn hình chính.'
      : 'Cài app Mộc Quả để mở như một ứng dụng.';
    banner.innerHTML = `<p>${text}</p><div><button type="button" data-install-go>${mode === 'ios' ? 'Đã hiểu' : 'Cài app'}</button><button type="button" data-install-hide>Để sau</button></div>`;
    document.body.append(banner);
    banner.querySelector('[data-install-hide]').onclick = () => {
      rememberDismiss();
      banner.remove();
      banner = null;
    };
    banner.querySelector('[data-install-go]').onclick = async () => {
      if (mode === 'android' && promptEvent) {
        promptEvent.prompt();
        await promptEvent.userChoice.catch(() => {});
        promptEvent = null;
      }
      rememberDismiss();
      banner.remove();
      banner = null;
    };
  };

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    promptEvent = event;
    paint();
  });
  document.querySelector('[data-install-app]')?.addEventListener('click', () => {
    try { localStorage.removeItem(DISMISS_KEY); } catch { /* ignore */ }
    if (ios || promptEvent) paint();
  });
  paint();
}

if (typeof document !== 'undefined') {
  warmAiServer();
  mountInstall();
}
