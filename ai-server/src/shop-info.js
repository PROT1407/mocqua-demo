import { fold } from './catalog.js';

// Câu trả lời địa chỉ của bot. Khác khối liên hệ trên website (server/contact.js).
export const shopInfo = {
  address: '376/15, phường Bàn Cờ, Quận 3, TP.HCM',
  hotlineDisplay: '0919 997 283',
  hotlineTel: '0919997283',
};

export function shopAddressReply(info = shopInfo) {
  return `Địa chỉ: ${info.address}. Hotline đặt hàng: ${info.hotlineDisplay}.`;
}

export function asksShopAddress(message) {
  const folded = fold(message);
  if (/(shop|cua hang|moc qua).{0,40}(o dau|dia chi)|(o dau|dia chi).{0,40}(shop|cua hang|moc qua)/.test(folded)) return true;
  const compact = folded.replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  return /^(dia chi|xin dia chi|cho dia chi|cho minh dia chi|gui dia chi|dia chi o dau)( shop| cua hang)?$/.test(compact);
}
