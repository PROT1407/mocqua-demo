// Địa chỉ GET rẻ trên ai-server. Trang cửa hàng gọi nền để máy miễn phí đỡ ngủ.
export const DEFAULT_AI_HEALTH_URL = 'https://ai-server-u9ob.onrender.com/health';

export function aiHealthUrl(env = process.env) {
  const raw = String(env.AI_SERVER_HEALTH_URL ?? '').trim();
  const value = raw || DEFAULT_AI_HEALTH_URL;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
    return url.href;
  } catch {
    return '';
  }
}
