// Thông báo đơn qua Telegram. Thiếu TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID thì bỏ qua, không làm hỏng đơn.
// Shop không có trạng thái "đã thanh toán" / "đã huỷ" (chỉ cho_ck, da_nhan, dang_giao, xong) nên không gửi thêm khi đổi trạng thái.

const SAMPLE = 'Mộc Quả thử thông báo. Nếu thấy tin này, Telegram đã nối được.';

export function telegramSettings(env = process.env) {
  const token = String(env.TELEGRAM_BOT_TOKEN || '').trim();
  const chatIds = String(env.TELEGRAM_CHAT_ID || '').split(',').map((id) => id.trim()).filter(Boolean);
  return { token, chatIds, enabled: Boolean(token && chatIds.length) };
}

export function scrubTelegram(error) {
  return String(error?.message || error || 'error').replace(/bot\d+:[A-Za-z0-9_-]+/g, 'bot<hidden>');
}

function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0đ';
  return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
}

export function formatNewOrder(order, { shopUrl = process.env.SHOP_PUBLIC_URL || 'https://mocqua.onrender.com' } = {}) {
  const when = new Date(order.createdAt || Date.now()).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false,
  });
  const customer = order.customer || {};
  const summary = order.summary || {};
  const note = customer.note || order.note || '';
  const pay = order.payMethod === 'cod' ? 'Khi nhận hàng' : order.payMethod === 'vietqr' ? 'Chuyển khoản' : String(order.payMethod || '');
  const lines = (order.items || []).map((item) => {
    const name = [item.name, item.w].filter(Boolean).join(' ');
    return `- ${name} × ${item.qty} = ${money(item.line)}`;
  });
  const discount = summary.discount
    ? `${money(summary.discount)}${summary.discountPct ? ` (${summary.discountPct}%)` : ''}`
    : '0đ';
  return [
    `🛒 ĐƠN MỚI #${order.code}`,
    when,
    `Khách: ${customer.name || ''}`,
    `Điện thoại: ${customer.phone || ''}`,
    `Địa chỉ: ${[customer.address, customer.ward, customer.province].filter(Boolean).join(', ')}`,
    note ? `Ghi chú: ${note}` : '',
    ...lines,
    `Tạm tính: ${money(summary.subtotal)}`,
    `Giảm: ${discount}`,
    `Phí giao: ${summary.ship ? money(summary.ship) : '0đ'}`,
    `TỔNG: ${money(summary.total)}`,
    `Thanh toán: ${pay}`,
    `Quản trị: ${String(shopUrl).replace(/\/$/, '')}/admin`,
  ].filter(Boolean).join('\n');
}

export function sampleTelegramText() {
  return SAMPLE;
}

export async function sendTelegram(text, { fetchImpl = globalThis.fetch, settings = telegramSettings() } = {}) {
  if (!settings.enabled) return { skipped: true, sent: 0 };
  let sent = 0;
  for (const chatId of settings.chatIds) {
    let response;
    try {
      response = await fetchImpl(`https://api.telegram.org/bot${settings.token}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: String(text).slice(0, 4000) }),
      });
    } catch (error) {
      console.error('telegram', scrubTelegram(error));
      continue;
    }
    if (!response.ok) {
      console.error('telegram send failed', response.status);
      continue;
    }
    sent += 1;
  }
  return { skipped: false, sent };
}

export function notifyNewOrder(order, deps = {}) {
  try {
    const settings = deps.settings || telegramSettings();
    if (!settings.enabled) return;
    const text = formatNewOrder(order, deps);
    sendTelegram(text, { ...deps, settings }).catch((error) => {
      console.error('telegram', scrubTelegram(error));
    });
  } catch (error) {
    console.error('telegram', scrubTelegram(error));
  }
}
