import { esc, vnd } from './format.js';
import { shopContact } from './contact.js';

const DEFAULT_ORIGIN = 'https://mocqua.onrender.com';
const DEFAULT_IMAGE = '/assets/products/real/xoai-deo-muoi-ot.webp';

const HOME_TITLE = 'Trái cây sấy cao cấp TP.HCM – Sầu riêng, mít, xoài | Mộc Quả';
const HOME_DESCRIPTION = 'Cửa hàng trái cây sấy cao cấp tại TP.HCM: sầu riêng sấy thăng hoa, mít sấy Thái, xoài sấy dẻo. Nguyên túi, giao toàn quốc.';

const SHOP_SEO = {
  '': {
    title: 'Cửa hàng trái cây sấy TP.HCM | Mộc Quả',
    description: 'Chọn trái cây sấy theo cách làm: dẻo, thăng hoa, giòn, khô. Sầu riêng, mít sấy Thái, xoài sấy dẻo tại Mộc Quả.',
  },
  deo: {
    title: 'Xoài sấy dẻo, mít sấy Thái | Mộc Quả',
    description: 'Xoài sấy dẻo và mít sấy Thái, túi nguyên bao bì. Xem khối lượng và giá đang bán, giao từ TP.HCM.',
  },
  thanghoa: {
    title: 'Sầu riêng sấy thăng hoa | Mộc Quả',
    description: 'Sầu riêng sấy thăng hoa Yummy, Cheers+, Fresh & Healthy. Giòn xốp, nguyên túi, giao toàn quốc.',
  },
  gion: {
    title: 'Mít sấy Thái giòn | Mộc Quả',
    description: 'Mít sấy Thái giòn rụm của Fresh & Healthy và Mộc Quả. Chọn túi, xem giá đang bán và đặt giao.',
  },
  kho: {
    title: 'Trái cây sấy khô | Mộc Quả',
    description: 'Trái cây sấy khô, vị đậm, để được lâu. Xem từng loại và giá tại cửa hàng Mộc Quả.',
  },
  omai: {
    title: 'Ô mai và xí muội | Mộc Quả',
    description: 'Ô mai, xí muội chua cay mặn ngọt. Xem vị, khối lượng và giá đang bán tại Mộc Quả.',
  },
  set: {
    title: 'Hộp quà trái cây sấy | Mộc Quả',
    description: 'Hộp quà trái cây sấy và set biếu, gói sẵn. Xem hộp đang bán và giá tại Mộc Quả.',
  },
  hat: {
    title: 'Hạt dinh dưỡng | Mộc Quả',
    description: 'Hạt điều, mắc ca, hạt sen, dẻ cười. Hộp nguyên, xem khối lượng và giá tại Mộc Quả.',
  },
};

export const PAGE_SEO = {
  combo: {
    title: 'Combo quà tặng trái cây sấy | Mộc Quả',
    description: 'Combo quà tặng trái cây sấy: sầu riêng sấy thăng hoa, mít sấy Thái, xoài sấy dẻo. Giá tính từ giá lẻ đang bán.',
  },
  catalog: {
    title: 'Danh mục trái cây sấy | Mộc Quả',
    description: 'Danh mục trái cây sấy Mộc Quả và Viza Food theo nhãn, loại quả và khối lượng. Giá lấy từ danh mục đang bán.',
  },
  compare: {
    title: 'So sánh giá trái cây sấy | Mộc Quả',
    description: 'So sánh giá trái cây sấy và hạt theo thương hiệu, nhãn, khối lượng. Mỗi ô có nguồn và ngày xem.',
  },
  gift: {
    title: 'Hộp quà trái cây sấy | Mộc Quả',
    description: 'Hộp quà trái cây sấy, tự chọn vị trong hộp. Giá cập nhật theo danh mục đang bán.',
  },
};

export function siteUrl() {
  const raw = String(process.env.SITE_URL || DEFAULT_ORIGIN).trim() || DEFAULT_ORIGIN;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return DEFAULT_ORIGIN;
    return url.origin;
  } catch {
    return DEFAULT_ORIGIN;
  }
}

export function absoluteUrl(pathname) {
  const value = String(pathname || '/');
  if (/^https?:\/\//i.test(value)) return value;
  return siteUrl() + (value.startsWith('/') ? value : `/${value}`);
}

export function seoText(value) {
  return String(value ?? '')
    .replace(/ri\s*6/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.:;])/g, '$1')
    .trim();
}

export function clip(value, max) {
  const text = seoText(value).replace(/\s+/g, ' ');
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > 40 ? cut.slice(0, space) : cut).trim()}…`;
}

export function homeSeo() {
  return { title: HOME_TITLE, description: HOME_DESCRIPTION };
}

export function shopSeo(catId) {
  return SHOP_SEO[catId] || SHOP_SEO[''];
}

export function productTitle(product) {
  const name = seoText(product?.name) || 'Trái cây sấy';
  const lead = (product?.variants || []).find((variant) => variant.sku === product?.defaultSku) || product?.variants?.[0];
  const weight = String(lead?.w || '').split('·')[0].trim();
  const useful = /^\d+(?:[.,]\d+)?\s?(?:g|kg)$/i.test(weight) && !name.toLowerCase().includes(weight.toLowerCase());
  const titled = useful ? `${name} ${weight} | Mộc Quả` : `${name} | Mộc Quả`;
  if (titled.length <= 65) return titled;
  const base = `${name} | Mộc Quả`;
  if (base.length <= 70) return base;
  return `${clip(name, 46)} | Mộc Quả`;
}

export function productDescription(product) {
  return clip(product?.short || product?.name || 'Trái cây sấy tại Mộc Quả', 155);
}

export function robotsTxt() {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /gio-hang',
    'Disallow: /api/',
    '',
    `Sitemap: ${siteUrl()}/sitemap.xml`,
    '',
  ].join('\n');
}

function xml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function shopSitemap(catalog, updated) {
  const lastmod = /^\d{4}-\d{2}-\d{2}$/.test(String(updated || '')) ? String(updated) : '';
  const paths = ['/', '/cua-hang', '/combo', '/danh-muc', '/hop-qua', '/so-sanh'];
  for (const cat of catalog?.cats || []) {
    if (cat?.id) paths.push(`/cua-hang?cat=${encodeURIComponent(cat.id)}`);
  }
  for (const product of catalog?.products || []) {
    if (!product?.id || product.hidden) continue;
    paths.push(`/san-pham/${encodeURIComponent(product.id)}`);
  }
  const body = paths.map((pathname) => {
    const loc = xml(absoluteUrl(pathname));
    return `  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function headTags({ title, description, path = '/', image, type = 'website', price, noindex = false }) {
  const url = absoluteUrl(path);
  const img = absoluteUrl(image || DEFAULT_IMAGE);
  const lines = [
    `<meta name="robots" content="${noindex ? 'noindex, nofollow' : 'index, follow'}">`,
    `<link rel="canonical" href="${esc(url)}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:image" content="${esc(img)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:type" content="${esc(type)}">`,
    `<meta property="og:locale" content="vi_VN">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(description)}">`,
    `<meta name="twitter:image" content="${esc(img)}">`,
  ];
  if (type === 'product' && Number.isInteger(price) && price > 0) {
    lines.push(`<meta property="product:price:amount" content="${price}">`);
    lines.push(`<meta property="product:price:currency" content="VND">`);
  }
  return lines.join('\n');
}

export function jsonLdTag(blocks) {
  const list = (blocks || []).filter(Boolean);
  if (!list.length) return '';
  const payload = { '@context': 'https://schema.org', '@graph': list };
  return `<script type="application/ld+json">${JSON.stringify(payload).replace(/</g, '\\u003c')}</script>`;
}

function phones() {
  return shopContact.phones.map((phone) => phone.display);
}

function addressLd() {
  const parts = String(shopContact.address || '').split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 3) {
    return {
      '@type': 'PostalAddress',
      streetAddress: parts[0],
      addressLocality: parts[1],
      addressRegion: parts.slice(2).join(', '),
      addressCountry: 'VN',
    };
  }
  return { '@type': 'PostalAddress', streetAddress: shopContact.address, addressCountry: 'VN' };
}

function hoursLd() {
  const match = String(shopContact.hours || '').match(/(\d{1,2}:\d{2}).+?(\d{1,2}:\d{2})/);
  const opens = match ? match[1].padStart(5, '0') : '08:00';
  const closes = match ? match[2].padStart(5, '0') : '21:00';
  return {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens,
    closes,
  };
}

export function homeJsonLd() {
  const url = absoluteUrl('/');
  const image = absoluteUrl(DEFAULT_IMAGE);
  const org = {
    '@type': 'Organization',
    name: 'Mộc Quả',
    url,
    image,
    email: shopContact.email,
    telephone: phones(),
    address: addressLd(),
    sameAs: [shopContact.facebook, shopContact.tiktok].filter(Boolean),
  };
  const store = {
    '@type': ['LocalBusiness', 'Store'],
    name: 'Mộc Quả',
    url,
    image,
    email: shopContact.email,
    telephone: phones(),
    address: addressLd(),
    openingHoursSpecification: hoursLd(),
  };
  const website = {
    '@type': 'WebSite',
    name: 'Mộc Quả',
    url,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl()}/cua-hang?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
  return [org, store, website];
}

function productImages(product) {
  const list = [];
  const push = (src) => {
    if (!src || list.length >= 8) return;
    const abs = absoluteUrl(src);
    if (!list.includes(abs)) list.push(abs);
  };
  push(product.cardImg);
  for (const photo of product.gallery || product.photos || []) push(photo.src);
  for (const variant of product.variants || []) {
    push(variant.img);
    push(variant.back);
  }
  return list;
}

function storageAnswer(product) {
  for (const section of product.sections || []) {
    for (const row of section.spec || []) {
      if (/bảo quản|cách dùng/i.test(String(row?.[0] || ''))) return clip(`${row[0]}: ${row[1]}`, 240);
    }
    for (const paragraph of section.p || []) {
      if (/bảo quản|đậy kín|nơi khô/i.test(paragraph)) return clip(paragraph, 240);
    }
  }
  return 'Đậy kín bao bì sau khi mở và để nơi khô ráo, tránh nắng.';
}

export function productFaqs(product, settings) {
  const lead = (product.variants || []).find((variant) => variant.sku === product.defaultSku) || product.variants?.[0];
  const price = lead?.price;
  const weight = lead?.w || product.weightLabel || '';
  const soldOut = !!(product.oos || lead?.oos);
  const hotline = phones().join(', ');
  const ship = Number(settings?.shipFee);
  const free = Number(settings?.freeShip);
  const name = seoText(product.name);
  return [
    {
      q: `${name} giá bao nhiêu?`,
      a: price > 0
        ? `${name}${weight ? ` ${weight}` : ''} đang bán ${vnd(price)}. Giá trên trang lấy từ danh mục đang bán.`
        : `${name} hiện chưa niêm yết giá. Gọi ${hotline} để Mộc Quả kiểm tra.`,
    },
    {
      q: 'Phí giao hàng thế nào?',
      a: Number.isInteger(ship) && Number.isInteger(free)
        ? `Phí giao ${vnd(ship)}. Đơn từ ${vnd(free)} được miễn phí giao.`
        : 'Phí giao và mức miễn phí ghi ở thanh ưu đãi trên trang, tính trong giỏ.',
    },
    {
      q: 'Đặt hàng bằng cách nào?',
      a: `Chọn khối lượng, bấm Cho vào giỏ rồi thanh toán. Cần người xem đơn, gọi ${hotline}.`,
    },
    {
      q: soldOut ? 'Sản phẩm còn hàng không?' : 'Bảo quản thế nào sau khi mở?',
      a: soldOut
        ? `${name} đang hết hàng. Trang có gợi ý túi còn hàng cùng loại.`
        : storageAnswer(product),
    },
  ];
}

export function productJsonLd(product, settings) {
  const lead = (product.variants || []).find((variant) => variant.sku === product.defaultSku) || product.variants?.[0];
  const path = `/san-pham/${encodeURIComponent(product.id)}`;
  const url = absoluteUrl(path);
  const soldOut = !!(product.oos || lead?.oos);
  const name = seoText(product.name);
  const productLd = {
    '@type': 'Product',
    name,
    image: productImages(product),
    description: productDescription(product),
    brand: { '@type': 'Brand', name: seoText(product.brandName) || 'Mộc Quả' },
    ...(lead?.sku ? { sku: lead.sku } : {}),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'VND',
      ...(lead?.price > 0 ? { price: lead.price } : {}),
      availability: soldOut ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Mộc Quả' },
    },
  };
  const crumbs = [
    { name: 'Mộc Quả', item: absoluteUrl('/') },
    { name: 'Cửa hàng', item: absoluteUrl('/cua-hang') },
    { name: seoText(product.catName) || 'Danh mục', item: absoluteUrl(`/cua-hang?cat=${encodeURIComponent(product.cat || '')}`) },
    { name, item: url },
  ];
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.item,
    })),
  };
  const faqs = productFaqs(product, settings);
  const faq = {
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
  return [productLd, breadcrumb, faq];
}

export function faqBlock(items) {
  const rows = (items || []).map((item) => `<details><summary>${esc(item.q)}</summary><p>${esc(item.a)}</p></details>`).join('');
  return `<section class="faq" aria-labelledby="faq-h"><h2 id="faq-h">Câu hỏi thường gặp</h2>${rows}</section>`;
}
