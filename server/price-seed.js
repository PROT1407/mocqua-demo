// Dữ liệu khởi tạo cho bảng so sánh Thương hiệu → Nhãn → Khối lượng.
// Chỉ ghi số đã thấy trên trang thật (link + ngày xem). Ô giá để trống khi trang không ghi giá.
// Dòng Mộc Quả là ước lượng theo kích thước hũ, chờ chủ shop cân thật.
const D = '2026-10-30';
const TCS = 'https://traicaysay.net/';

const MQ_NOTE = 'Ước lượng theo kích thước hũ và cỡ phổ biến trên thị trường. Chờ cân thật.';
const MQ_VAR = 'Cỡ gợi ý theo thị trường, chưa có hàng. Ước lượng.';

function mq(fruit, product, code, g, pack, note = MQ_NOTE) {
  return { brand: 'Mộc Quả', label: 'Mộc Quả', product, fruit, weightG: g, price: null, pack, code, sourceUrl: '', checkedAt: D, isEstimate: true, note };
}

function ref(brand, label, fruit, product, g, price, pack, sourceUrl, note = '') {
  return { brand, label, product, fruit, weightG: g, price, pack, code: '', sourceUrl, checkedAt: D, isEstimate: false, note };
}

export const PRICE_SEED = [
  mq('Dâu tây', 'Dâu tây sấy thăng hoa', 'MQZ-THDT-100', 100, 'Hũ PET ống cao ~8 × 18–20 cm (~900–1000 ml)'),
  mq('Dâu tây', 'Dâu tây sấy thăng hoa', 'MQZ-THDT-50', 50, 'Hũ PET nhỏ'),
  mq('Macca', 'Macca nứt vỏ', 'MQZ-HMC-500', 500, 'Hũ PET ống cao ~8 × 18–20 cm (~900–1000 ml)', MQ_NOTE + ' Thị trường thường cân cả vỏ hạt và bao bì.'),
  mq('Hạt điều', 'Hạt điều rang muối', 'MQZ-HDI-500', 500, 'Hũ PET miệng rộng nắp đen ~10 × 13–15 cm'),
  mq('Hạt điều', 'Hạt điều rang muối', 'MQZ-HDI-250', 250, 'Hũ PET nhỏ', MQ_VAR),
  mq('Hạt mix', 'Hạt dinh dưỡng (mix)', 'MQZ-HDD-500', 500, 'Hũ PET'),
  mq('Hạt mix', 'Hạt dinh dưỡng (mix)', 'MQZ-HDD-250', 250, 'Hũ PET nhỏ', MQ_VAR),
  mq('Hạt mix', 'Mix hạt cao cấp', 'MQZ-MIX-500', 500, 'Hũ PET'),
  mq('Hạt mix', 'Mix hạt cao cấp', 'MQZ-MIX-250', 250, 'Hũ PET nhỏ', MQ_VAR),
  mq('Long nhãn', 'Long nhãn ôm sen', 'MQZ-LNOS-250', 250, 'Hũ PET'),
  mq('Long nhãn', 'Long nhãn ôm sen', 'MQZ-LNOS-500', 500, 'Hũ / hộp lớn', MQ_VAR),
  mq('Long nhãn', 'Long nhãn sấy', 'MQZ-LN-250', 250, 'Hũ PET'),
  mq('Long nhãn', 'Long nhãn sấy', 'MQZ-LN-500', 500, 'Hũ / túi lớn', MQ_VAR),
  mq('Bánh hạt', 'Bánh đồng tiền mix hạt', 'MQZ-BDT-300', 300, 'Hũ PET'),
  mq('Bánh hạt', 'Bánh đồng tiền mix hạt', 'MQZ-BDT-500', 500, 'Hũ PET lớn', MQ_VAR),

  // Viza Food, trang traicaysay.net (Công ty Cổ phần Viza Food)
  ref('Viza Food', 'Viza Food', 'Xoài', 'Xoài sấy dẻo nguyên vị', 100, 55000, 'Túi', TCS + 'xoai-say-deo-100gr'),
  ref('Viza Food', 'Viza Food', 'Xoài', 'Xoài sấy dẻo nguyên vị', 200, 105000, 'Túi', TCS + 'xoai-say-deo-200gr'),
  ref('Viza Food', 'Viza Food', 'Xoài', 'Xoài sấy dẻo nguyên vị', 350, 180000, 'Túi', TCS + 'xoai-say-deo-tui-350g'),
  ref('Viza Food', 'Viza Food', 'Xoài', 'Xoài chín cây sấy dẻo (tuyển chọn)', 300, 180000, 'Túi', TCS + 'xoai-chin-cay-say-deo-nguyen-vi-tui-300g'),
  ref('Viza Food', 'Ăn Là Ghiền', 'Xoài', 'Xoài sấy dẻo muối ớt', 100, 55000, 'Túi', TCS + 'an-la-ghien100gxoai-say-deo-muoi-ot-ngot-chua-tu-nhien-an-la-ghien-hang-nguyen-mieng-bao-bi-dep'),
  ref('Viza Food', 'Viza Food', 'Xoài', 'Xoài sấy dẻo muối ớt', 200, 105000, 'Túi', TCS + 'an-la-ghienxoai-say-deo-muoi-ot-tu-nhien-nguyen-mieng-hang-dep-tieu-chuan-xuat-khau'),
  ref('Viza Food', 'Viza Food', 'Xoài', 'Xoài sấy dẻo muối ớt', 350, 180000, 'Túi', TCS + '350gxoai-say-deo-muoi-ot-chua-ngot-tu-nhien-nguyen-mieng-hang-dep-rat-it-xo-tieu-chuan-xuat-khau'),
  ref('Viza Food', 'Viza Food', 'Xoài', 'Xoài sấy thăng hoa', 100, 199000, 'Túi', TCS + 'xoai-say-thang-hoa-giu-tron-huong-vi-xoai-phu-hop-qua-tang-snack-cao-cap-tui-100g-viza-food'),
  ref('Viza Food', 'Viza Food', 'Thơm', 'Thơm sấy dẻo', 80, 80000, 'Túi', TCS + '80gthom-say-deo-chua-ngot-tu-nhien-dai-thom-khong-bi-kho-so-viza-food'),
  ref('Viza Food', 'Viza Food', 'Sầu riêng', 'Sầu riêng sấy thăng hoa nguyên múi', 120, 350000, 'Túi', TCS + 'sau-rieng-say'),
  ref('Viza Food', 'GoodGood', 'Sầu riêng', 'Sầu riêng sấy thăng hoa', 100, 180000, 'Túi', TCS + 'sau-rieng-say-thang-hoa-good-good-tui-100gr'),
  ref('Viza Food', 'GoodGood', 'Măng cụt', 'Măng cụt sấy thăng hoa', 100, 390000, 'Túi', TCS + 'mang-cut-say-thang-hoa-tui-100g-bao-ngon-giu-huong-vi-nhu-tuoi-good-good-cua-viza-food'),
  ref('Viza Food', 'KiTa', 'Sầu riêng', 'Sầu riêng sấy', 100, 200000, 'Túi', TCS + 'sau-rieng-say-kita-100gr'),
  ref('Viza Food', 'Cheers', 'Sầu riêng', 'Sầu riêng sấy thăng hoa', 100, 250000, 'Túi', TCS + 'sau-rieng-say-thang-hoa-cheers-100g'),
  ref('Viza Food', 'Yummy', 'Sầu riêng', 'Sầu riêng sấy thăng hoa', 120, 246500, 'Túi 120g gồm 3 túi nhỏ', 'https://vivina.net/sau-rieng-say-thang-hoa-yummy-viza-food-120g--nguyen-mui-gion-xop-tui-kem-tien-loi-p24153.html', 'Bán trên Vivina bởi gian vizafoodstore.'),

  // Dâu tây sấy thăng hoa
  ref('Hanafood', 'Hanafood', 'Dâu tây', 'Dâu tây sấy thăng hoa', 200, 74000, 'Hũ PET', 'https://www.hanafood.vn/dau-tay-say-thang-hoa-1', 'Giá gốc trên trang 83.000đ. Trang không ghi kích thước hũ.'),
  ref('Gấu Home', 'Gấu Home', 'Dâu tây', 'Dâu tây sấy thăng hoa Đà Lạt', 50, 40000, '', 'https://marketplace.tripmap.vn/product/dau-tay-say-thang-hoa-da-lat-nguyen-trai-chua', 'Trang ghi 50g/100g/200g, giá 40.000đ là giá thấp nhất, gán cho 50g. Cần kiểm lại.'),
  ref('Gấu Home', 'Gấu Home', 'Dâu tây', 'Dâu tây sấy thăng hoa Đà Lạt', 100, null, '', 'https://marketplace.tripmap.vn/product/dau-tay-say-thang-hoa-da-lat-nguyen-trai-chua', 'Trang không ghi giá riêng cho 100g.'),
  ref('Gấu Home', 'Gấu Home', 'Dâu tây', 'Dâu tây sấy thăng hoa Đà Lạt', 200, null, '', 'https://marketplace.tripmap.vn/product/dau-tay-say-thang-hoa-da-lat-nguyen-trai-chua', 'Trang không ghi giá riêng cho 200g.'),
  ref('WEYES', 'WEYES', 'Dâu tây', 'Dâu tây sấy thăng hoa nguyên quả', 40, 59000, '', 'https://theweyes.com/products/freeze-dried-strawberry'),
  ref('Charfarm', 'Charfarm', 'Dâu tây', 'Dâu tây sấy thăng hoa', null, 75600, 'Hộp PET 1000 ml (40–42 quả)', 'https://kitbuy.vn/d%c3%a2u-t%c3%a2y-s%e1%ba%a5y-l%e1%ba%a1nh-gi%c3%b2n-c%c3%b4ng-ngh%e1%bb%87-s%e1%ba%a5y-th%c4%83ng-hoa-h%c5%a9-pet-1000ml-%c3%adt-%c4%91%c6%b0%e1%bb%9dng-%c3%adt-ch%e1%ba%a5t-b%c3%a9o-t%e1%bb%b1-nhi%c3%aan-v%e1%bb%8b-tr%c3%a1i-c%c3%a2y-charfarm-i.4836232.22313097463', 'Trang không ghi gram, chỉ ghi 1000 ml, 40–42 quả, tương đương thành phẩm của 1kg dâu tươi. Giá gốc 149.000đ.'),
  ref('Kentary', 'Kentary', 'Dâu tây', 'Dâu tây sấy thăng hoa', 200, null, '', 'https://kentary.vn/shop/dau-tay-say-thang-hoa/', 'Trang ghi các cỡ 200 / 400 / 800g, không ghi giá.'),

  // Macca nứt vỏ
  ref("S'Tiêng", "S'Tiêng", 'Macca', 'Macca nứt vỏ sấy chín', 500, 220000, 'Hộp PET', 'https://vinmart.co/500gr-hat-macca-nut-vo-say-chin-s-tieng-gion-ngon-hop-pet-t271263307.html', 'Trang ghi 500g cả bao bì.'),
  ref('Xanh Nuts', 'Xanh Nuts', 'Macca', 'Macca nứt vỏ loại 1', 500, 119000, 'Lon PET 930 ml', 'https://vinmart.co/hat-macca-nut-vo-loai-1-macca-dak-lak-lon-pet-500gr-930ml-s12297742518.html', 'Trang ghi 500g cân cả vỏ. Giá gốc 140.000đ.'),
  ref('Queen Nuts', 'Queen Nuts', 'Macca', 'Macca nứt vỏ loại 1', 500, 119000, 'Hũ PET / túi zip', 'https://kitbuy.vn/500gr-h%e1%ba%a1t-macca-m%e1%ba%afc-ca-n%e1%bb%a9t-v%e1%bb%8f-lo%e1%ba%a1i-1-i.296778982.5146760259', 'Trang ghi cân cả trọng lượng bao bì 500g. Giá gốc 180.000đ.'),
  ref('LMD Agriculture', 'LMD Agriculture', 'Macca', 'Macca tách nứt size trung 21–25mm', 500, 151200, 'Hủ PET', 'https://lmdagriculture.vn/hat-macca-tach-nut-size-trung-21-25mm-hu-pet-500gr/', 'Giá đọc từ kết quả tìm kiếm; lúc mở trang đang bảo trì.'),

  // Hạt điều rang muối
  ref('Faminuts', 'Faminuts', 'Hạt điều', 'Hạt điều rang muối', 500, 242000, 'Hũ nắp nhôm', 'https://faminutshouse.vn/products/hat-dieu-rang-muoi-faminuts-hu-nap-nhom-500g/'),
  ref('Bazan', 'Bazan', 'Hạt điều', 'Hạt điều rang muối vỏ lụa', 500, null, 'Hộp nắp xanh', 'https://bachhoa.extra.vn/hat-dieu-rang-muoi-bazan-binh-phuoc-nguyen-hat-dinh-duong-a-loai-1-hop-500g-nap-xanh-con-vo-lua-t214160170.html', 'Trang không hiện giá lúc xem.'),

  // Hạt mix
  ref("Lê's Garden", "Lê's Garden", 'Hạt mix', 'Mixed nut 5 loại hạt dinh dưỡng', 500, 220000, 'Hủ', 'https://hatdieu.org/mixed-nut-5-loai-hat-dinh-duong-500gr', 'Macca, óc chó, hạt bí, hạnh nhân, điều.'),
  ref('FENFOOD', 'FENFOOD', 'Hạt mix', 'Mix 5 loại hạt cao cấp', 250, null, 'Hũ PET', 'https://vinmart.co/hat-dinh-duong-mix-fenfood-5-loai-hat-dieu-hanh-nhan-oc-cho-vang-macca-bi-loai-cao-cap-l2182779778.html', 'Có cỡ 250g và 500g. Chưa đọc được giá.'),
  ref('FENFOOD', 'FENFOOD', 'Hạt mix', 'Mix 5 loại hạt cao cấp', 500, null, 'Hũ PET', 'https://vinmart.co/hat-dinh-duong-mix-fenfood-5-loai-hat-dieu-hanh-nhan-oc-cho-vang-macca-bi-loai-cao-cap-l2182779778.html', 'Có cỡ 250g và 500g. Chưa đọc được giá.'),

  // Long nhãn sấy
  ref('King Deli', 'King Deli', 'Long nhãn', 'Long nhãn sấy', 250, 81000, '', 'https://dungculambanh.com.vn/long-nhan-say-250gr/'),
  ref('Moonshop', 'Moonshop', 'Long nhãn', 'Long nhãn sấy khô Hưng Yên', 250, 140000, 'Hũ', 'https://www.shopmoon.vn/long-nhan-say-kho-hung-yen-hu-250gr', 'Giá gốc 150.000đ.'),
  ref('Quà Quê Hương', 'Quà Quê Hương', 'Long nhãn', 'Long nhãn sấy dẻo loại đặc biệt', 250, 90000, 'Hũ PET', 'https://quaquehuong.vn/san-pham/long-nhan-say-deo-250g-loai-dac-biet/', 'Giá gốc 95.000đ.'),
  ref('Vườn Quê Mộc', 'Vườn Quê Mộc', 'Long nhãn', 'Long nhãn sấy khô', 200, 98000, 'Hũ', 'https://vuonquemoc.vn/san-pham/long-nhan-say-kho', 'Trang ghi khối lượng 200G nhưng phần đóng gói ghi hũ 250g, 500g. Cần kiểm lại.'),
  ref('KiKi Fruit', 'KiKi Fruit', 'Long nhãn', 'Long nhãn sấy khô Hưng Yên', 500, 189000, '', 'https://muathongminh.vn/500g-long-nhan-say-kho-hung-yen-loai-ngon-kiki-fruit-p.2__786566035', 'Giá Lazada theo trang lịch sử giá.'),

  // Long nhãn ôm sen
  ref('Nông sản Dũng Hà', 'Dũng Hà', 'Long nhãn', 'Long nhãn ôm sen', 100, 55000, 'Túi', 'https://nongsandungha.com/thuc-pham/long-nhan-long-hat-sen/', 'Trang hiện khoảng giá 55.000–465.000đ cho 100g–1kg; gán giá đầu cho 100g. Cần kiểm lại.'),
  ref('Nông sản Dũng Hà', 'Dũng Hà', 'Long nhãn', 'Long nhãn ôm sen', 250, null, 'Túi', 'https://nongsandungha.com/thuc-pham/long-nhan-long-hat-sen/'),
  ref('Nông sản Dũng Hà', 'Dũng Hà', 'Long nhãn', 'Long nhãn ôm sen', 500, null, 'Túi', 'https://nongsandungha.com/thuc-pham/long-nhan-long-hat-sen/'),
  ref('Nông sản Dũng Hà', 'Dũng Hà', 'Long nhãn', 'Long nhãn ôm sen', 1000, 465000, 'Túi', 'https://nongsandungha.com/thuc-pham/long-nhan-long-hat-sen/', 'Gán giá cuối khoảng giá cho 1kg. Cần kiểm lại.'),
  ref('Sen Vô Ưu', 'Sen Vô Ưu', 'Long nhãn', 'Long nhãn bọc hạt sen', 200, 98000, 'Hộp', 'https://vouu.vn/long-nhan-boc-hat-sen-an-lien-sen-vo-uu'),
  ref('Sen Vô Ưu', 'Sen Vô Ưu', 'Long nhãn', 'Long nhãn bọc hạt sen', 500, 236000, 'Hộp', 'https://vouu.vn/long-nhan-boc-hat-sen-an-lien-sen-vo-uu'),
  ref('Sen Hồng', 'Sen Hồng', 'Long nhãn', 'Long nhãn ôm hạt sen', 500, 210000, 'Hộp', 'https://senhongshop.com/long-nhan-om-hat-sen-hop-500g', 'Giá gốc 240.000đ.'),
  ref('ADANS FOOD', 'ADANS FOOD', 'Long nhãn', 'Long nhãn ôm sen', 250, 119000, '', 'https://dangiaphat.com/long-nhan-om-sen-adans-food-1', 'Trang có cỡ 250g / 500g / 1kg; cũng hiện mức 139.000đ. Cần kiểm lại.'),

  // Bánh đồng tiền mix hạt
  ref('Hoàng Kiều', 'Hoàng Kiều', 'Bánh hạt', 'Bánh đồng tiền mix hạt dinh dưỡng', 250, 70000, 'Hũ', 'https://hoangkieufoods.com/san-pham/banh-dong-tien-mix-hat-dinh-duong/'),
  ref('Hoàng Kiều', 'Hoàng Kiều', 'Bánh hạt', 'Bánh đồng tiền mix hạt dinh dưỡng', 450, 120000, 'Hũ', 'https://hoangkieufoods.com/san-pham/banh-dong-tien-mix-hat-dinh-duong-hu-450g/'),
  ref('Supermart', 'Supermart', 'Bánh hạt', 'Bánh đồng tiền mix hạt dinh dưỡng', 500, 80100, 'Hủ', 'https://marketplace.tripmap.vn/product/banh-dong-tien-mix-hat-dinh-duong-gion-thom-hu', 'Giá gốc 104.130đ. Trang cũng nhắc gói 300g.'),
];
