import { fold } from './catalog.js';
import { shopContact } from '../../server/contact.js';

// Địa chỉ và số điện thoại lấy từ server/contact.js, cùng nguồn với chân trang.
export const shopInfo = {
  address: shopContact.address,
  hotlineDisplay: shopContact.phones[0].display,
  hotlineTel: shopContact.phones[0].tel,
  phones: shopContact.phones,
};

export function shopAddressReply(info = shopInfo) {
  const phones = info.phones?.length ? info.phones : [{ display: info.hotlineDisplay }];
  const [hotline, ...rest] = phones;
  const more = rest.map((phone) => phone.display).filter(Boolean).join(', ');
  return `Địa chỉ: ${info.address}. Hotline đặt hàng: ${hotline.display}${more ? `, ${more}` : ''}.`;
}

export function asksShopAddress(message) {
  const folded = fold(message);
  if (/(shop|cua hang|moc qua).{0,40}(o dau|dia chi)|(o dau|dia chi).{0,40}(shop|cua hang|moc qua)/.test(folded)) return true;
  const compact = folded.replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  return /^(dia chi|xin dia chi|cho dia chi|cho minh dia chi|gui dia chi|dia chi o dau)( shop| cua hang)?$/.test(compact);
}
