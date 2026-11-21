// Danh sách ảnh trên trang sản phẩm. Admin dùng cùng hàm này để không thiếu ảnh kệ, ảnh mở túi hay ảnh combo.
export function productGallery(data, variant) {
  if (Array.isArray(data?.gallery) && data.gallery.length) {
    const shots = data.gallery.filter((photo) => photo && photo.src);
    if (shots.length) {
      const hero = shots.find((photo) => photo.hero) || shots[0];
      return [hero, ...shots.filter((photo) => photo !== hero)];
    }
  }
  const list = [];
  if (variant?.img) list.push({ src: variant.img, alt: `${data.name}, bao bì ${variant.label}`, kind: 'Bao bì' });
  if (variant?.back && variant.back !== variant.img) {
    list.push({ src: variant.back, alt: `${data.name}, ${variant.backKind || 'mặt sau'}`, kind: variant.backKind || 'Mặt sau' });
  }
  for (const photo of data.photos || []) {
    if (photo.src && !list.some((item) => item.src === photo.src)) {
      list.push({ src: photo.src, alt: photo.alt || data.name, kind: photo.kind || 'Ảnh' });
    }
  }
  if (data.open?.src) list.push({ src: data.open.src, alt: data.open.cap || 'Mở túi', kind: 'Mở túi' });
  const bagOn = (shelf) => !shelf.bags || shelf.bags.some((key) => [variant?.img, variant?.back].some((src) => src && new RegExp('/' + key + '[-.]').test(src)));
  for (const shelf of data.shelves || (data.shelf ? [data.shelf] : [])) {
    if (shelf?.src && bagOn(shelf) && !list.some((item) => item.src === shelf.src)) {
      list.push({ src: shelf.src, alt: shelf.cap || 'Trên kệ', kind: 'Trên kệ' });
    }
  }
  if (!list.length && data.open?.src) list.push({ src: data.open.src, alt: data.name, kind: 'Ảnh' });
  return list;
}
