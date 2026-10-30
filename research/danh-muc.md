# Danh mục tra cứu `/danh-muc`

Trang công khai để tra cứu **Thương hiệu → Nhãn → Sản phẩm → Khối lượng**: tìm kiếm, chip lọc theo thương hiệu, nhóm, nhãn, chip *Cần kiểm tra*, và chế độ **So sánh** (cùng loại sản phẩm, cùng khối lượng; cột giá bán lẻ, giá/100g, nguồn · ngày).

- Dữ liệu sản phẩm: `server/data/danh-muc.json` (sửa tay, có trong git).
- Giá bán lẻ, nguồn giá, ngày kiểm theo từng mã: bảng SQLite `catalog_prices`, sửa ở `/admin` → tab **Danh mục**. Có nút xuất/nhập JSON (Render gói miễn phí không giữ ổ đĩa, nên xuất trước khi deploy).
- API: `GET /api/danh-muc`, `PUT /api/admin/catalog-prices/:code`, `GET /api/admin/catalog-prices.json`, `POST /api/admin/catalog-prices/import`.
- Ảnh: `assets/catalog/<slug>.webp` (cạnh dài tối đa 1000px, mở trong thư viện ảnh) và `<slug>-sm.webp` (480px, dùng cho thẻ, ảnh nhỏ, bảng so sánh), tải lười (lazy-load). Mỗi mã có **một ảnh chính** trên lưới; ảnh cùng sản phẩm nhưng khác phong cách (nền trắng/đen, cầm tay, lô hàng, phối cảnh, đĩa trưng bày) được giữ làm ảnh phụ trong thư viện. Chỉ bỏ ảnh trùng hoặc gần như giống hệt (cùng bố cục, chỉ khác tông màu). Sản phẩm chưa có ảnh rõ hiện khung giữ chỗ.
- Viza Food (Công ty CP Viza Food) là **đối thủ / tham khảo**, không bán tại Mộc Quả. Không ghi giá khuyến mãi trên tem (36k/37k).

## Quy tắc mã

- Mộc Quả: `MQZ-<SP>-<gram>`, ví dụ `MQZ-HMC-500`. Mã chưa rõ khối lượng giữ nguyên như chủ shop đặt (`MQZ-DDY`, `MQZ-THXO`, `MQZ-XXX`, `MQZ-SETH6`).
- Đối thủ: `VZ-<NHÃN>-<SP>-<gram>`; `XX` = chưa rõ khối lượng.
  - Nhãn: `GF` GoodFood, `GG` Good Good, `CH` Cheers+, `YM` Yummy, `PS` Premium Shrinking Dried Durian, `FH` Fresh & Healthy, `KT` Kita, `VZ` Viza Food (hộp), `YC` YC Nuts & Seeds.
  - Sản phẩm: `XD` xoài sấy dẻo (`XDV` túi vàng, `XDH` túi hồng cam, `XDL` túi lá, `XDR` túi băng đỏ, `XDT` túi tròn), `XDMO` xoài dẻo muối ớt, `XTH` xoài thăng hoa, `SRTH` sầu riêng thăng hoa, `SRS` sầu riêng sấy, `KF` King Fruit, `MT` Monthong, `GD/RY/YD` Golden/Royal/Yummy Durian, `MHH` mít Hoa Hậu, `MIT`/`MITV` mít sấy, `THOM`, `COC`, `ME`, `TL` thanh long, `MC` mãng cầu, `CARI`, `HDI` điều, `HMC` macca, `HDC` dẻ cười, `HSE` hạt sen, `DUA` dừa; combo `CB…` (ví dụ `CB2DM` = combo 2 điều + macca, `CB4SV` = Tết Sum Vầy, `CB2SRM` = combo 2 túi sầu riêng sấy + mít Hoa Hậu, đang tạm gác; gram ở cuối là tổng khối lượng).

## Danh sách mã và ảnh chính

| Thương hiệu | Nhãn | Sản phẩm | Mã (khối lượng) | Cần kiểm tra | Ảnh chính | Ảnh phụ |
|---|---|---|---|---|---|---|
| Mộc Quả | Mộc Quả | Hạt mắc ca nứt vỏ | `MQZ-HMC-500` (500g) |  | mqz-hmc.webp |  |
| Mộc Quả | Mộc Quả | Hạt điều rang muối | `MQZ-HDI-500` (500g) |  | mqz-hdi.webp | mqz-hdi-2.webp (nền đen), mqz-hdi-3.webp (thực tế) |
| Mộc Quả | Mộc Quả | Dâu tây sấy thăng hoa | `MQZ-THDT-100` (100g) |  | mqz-thdt.webp | mqz-thdt-2.webp (nền trắng), mqz-thdt-3.webp (thực tế), mqz-thdt-4.webp (lô hàng) |
| Mộc Quả | Mộc Quả | Dâu tây sấy (hũ thiếc) | `MQZ-DDY` (Chưa rõ) | có | mqz-ddy.webp |  |
| Mộc Quả | Mộc Quả | Xoài sấy thăng hoa (hũ thiếc) | `MQZ-THXO` (Chưa rõ) | có | mqz-thxo.webp |  |
| Mộc Quả | Mộc Quả | Trái cây sấy (chưa rõ loại) | `MQZ-XXX` (Chưa rõ) | có | mqz-xxx.webp | mqz-xxx-2.webp (đĩa trưng bày) |
| Mộc Quả | Mộc Quả | Xoài sấy dẻo | `MQZ-DXO-500` (500g) |  | mqz-dxo.webp | mqz-dxo-2.webp (đĩa trưng bày) |
| Mộc Quả | Mộc Quả | Mít sấy giòn | `MQZ-GMI-500` (500g) |  | mqz-gmi.webp | mqz-gmi-2.webp (thực tế) |
| Mộc Quả | Mộc Quả | Long nhãn sấy | `MQZ-LN-250` (~250g) | có | mqz-ln.webp | mqz-ln-2.webp (nền đen), mqz-ln-3.webp (lô hàng) |
| Mộc Quả | Mộc Quả | Long nhãn ôm sen | `MQZ-LNOS-250` (~250g) | có | mqz-lnos.webp |  |
| Mộc Quả | Mộc Quả | Hạt dinh dưỡng | `MQZ-HDD-500` (~500g) | có | mqz-hdd.webp | mqz-hdd-2.webp (thực tế) |
| Mộc Quả | Mộc Quả | Mix hạt cao cấp | `MQZ-MIX-500` (~500g) | có | mqz-mix.webp | mqz-mix-2.webp (thực tế) |
| Mộc Quả | Mộc Quả | Bánh đồng tiền mix hạt | `MQZ-BDT-300` (~300g) | có | mqz-bdt.webp | mqz-bdt-2.webp (thực tế) |
| Mộc Quả | Mộc Quả | Hộp quà Tết 2027 · 6 hũ thủy tinh | `MQZ-SETH6` (6 hũ) | có | mqz-seth6.webp | mqz-seth6-2.webp (phối cảnh) |
| Viza Food | GoodFood | Thơm sấy dẻo | `VZ-GF-THOM-100` (100g) |  | vz-gf-thom.webp | vz-gf-thom-2.webp (phối cảnh) |
| Viza Food | GoodFood | Cóc sấy dẻo muối ớt | `VZ-GF-COC-100` (100g) |  | vz-gf-coc.webp |  |
| Viza Food | Good Good | Xoài sấy dẻo muối ớt | `VZ-GG-XDMO-100` (100g), `VZ-GG-XDMO-200` (200g) | có | vz-gg-xdmo.webp |  |
| Viza Food | Good Good | Xoài sấy dẻo (túi trắng) | `VZ-GG-XD-200` (200g) |  | vz-gg-xd.webp |  |
| Viza Food | Good Good | Xoài sấy dẻo (túi vàng lớn) | `VZ-GG-XDV-XX` (Chưa rõ) | có | — (khung giữ chỗ) |  |
| Viza Food | Good Good | Mít sấy Hoa Hậu | `VZ-GG-MHH-250` (250g (tạm)) | có | vz-gg-mhh.webp |  |
| Viza Food | Good Good | King Fruit sầu riêng sấy thăng hoa | `VZ-GG-KF-100` (100g (3.53oz)) |  | vz-gg-kf.webp | vz-gg-kf-2.webp (phối cảnh), vz-gg-kf-3.webp (phối cảnh), vz-gg-kf-4.webp (phối cảnh), vz-gg-cb-srm.webp (khung combo: mít Hoa Hậu + sầu riêng sấy túi vàng Good Good) |
| Viza Food | Good Good | Me sấy dẻo muối ớt | `VZ-GG-ME-100` (100g) |  | — (khung giữ chỗ) |  |
| Viza Food | Good Good | Thơm sấy dẻo | `VZ-GG-THOM-80` (80g (in trên bao)) |  | vz-gg-thom.webp |  |
| Viza Food | Good Good | Cóc sấy dẻo muối ớt | `VZ-GG-COC-100` (100g) |  | vz-gg-coc.webp |  |
| Viza Food | Good Good | Thanh long sấy dẻo | `VZ-GG-TL-100` (100g) | có | vz-gg-tl.webp |  |
| Viza Food | Good Good | Mãng cầu sấy dẻo | `VZ-GG-MC-100` (100g) | có | vz-gg-mc.webp |  |
| Viza Food | Good Good | Bột cari Ngon (hũ) | `VZ-GG-CARI-100` (100g) |  | vz-gg-cari.webp |  |
| Viza Food | Good Good | Combo xoài muối ớt + cóc muối ớt | `VZ-GG-CB2XC-200` (2 × 100g) |  | vz-gg-cb-xc.webp |  |
| Viza Food | Cheers+ | Xoài sấy thăng hoa | `VZ-CH-XTH-120` (120g) |  | vz-ch-xth.webp | vz-ch-xth-2.webp (mẫu bao bì khác) |
| Viza Food | Cheers+ | Sầu riêng sấy thăng hoa | `VZ-CH-SRTH-100` (100g · 3 gói nhỏ) |  | vz-ch-srth.webp | vz-ch-srth-2.webp (nền trắng) |
| Viza Food | Cheers+ | Xoài sấy dẻo (túi lá xoài) | `VZ-CH-XDL-200` (200g (250–300g)) | có | vz-ch-xdl.webp | vz-ch-xdl-2.webp (phối cảnh) |
| Viza Food | Cheers+ | Xoài sấy dẻo (túi băng đỏ) | `VZ-CH-XDR-200` (200g (250–300g, tạm)) | có | vz-ch-xdr.webp |  |
| Viza Food | Cheers+ | Xoài sấy dẻo (túi tròn áo dài) | `VZ-CH-XDT-200` (200g) |  | vz-ch-xdt.webp | vz-ch-xdt-2.webp (nền trắng), vz-ch-xdt-3.webp (phối cảnh), vz-ch-xdt-4.webp (thực tế) |
| Viza Food | Cheers+ | Combo 3 xoài sấy dẻo + tặng me Good Good 100g | `VZ-CH-CB3X-600` (3 × 200g + me 100g) | có | vz-ch-cb3x.webp |  |
| Viza Food | Yummy | Sầu riêng sấy thăng hoa | `VZ-YM-SRTH-100` (100g) |  | vz-ym-srth.webp |  |
| Viza Food | Yummy | Yummy Monthong sầu riêng sấy thăng hoa | `VZ-YM-MT-100` (100g (tạm)) | có | vz-ym-mt.webp |  |
| Viza Food | Premium Shrinking Dried Durian | Golden Durian sầu riêng sấy thăng hoa | `VZ-PS-GD-100` (100g (100g – 150g – 200g)) |  | vz-ps-gd.webp |  |
| Viza Food | Premium Shrinking Dried Durian | Royal Durian sầu riêng sấy thăng hoa | `VZ-PS-RY-100` (100g (100g – 150g – 200g)) |  | vz-ps-ry.webp |  |
| Viza Food | Premium Shrinking Dried Durian | Yummy Durian sầu riêng sấy thăng hoa | `VZ-PS-YD-100` (100g (100g – 150g – 200g)) |  | vz-ps-yd.webp |  |
| Viza Food | Fresh & Healthy | Xoài sấy dẻo (túi trắng xanh) | `VZ-FH-XD-100` (100g), `VZ-FH-XD-250` (250g), `VZ-FH-XD-500` (500g) |  | vz-fh-xd.webp | vz-fh-xd-2.webp (phối cảnh), vz-fh-xd-3.webp (nền trắng) |
| Viza Food | Fresh & Healthy | Xoài sấy dẻo (túi hồng cam) | `VZ-FH-XDH-100` (100g) |  | vz-fh-xdh.webp |  |
| Viza Food | Fresh & Healthy | Xoài sấy dẻo (túi vàng) | `VZ-FH-XDV-100` (100g) |  | vz-fh-xdv.webp |  |
| Viza Food | Fresh & Healthy | Combo xoài sấy dẻo 100g + 250g | `VZ-FH-CB-350` (100g + 250g = 350g) |  | vz-fh-cb350.webp |  |
| Viza Food | Fresh & Healthy | Mít sấy | `VZ-FH-MIT-300` (300g (200–300g)) |  | vz-fh-mit.webp | vz-fh-mit-2.webp (phối cảnh), vz-fh-mit-3.webp (phối cảnh), vz-fh-mit-4.webp (phối cảnh) |
| Viza Food | Fresh & Healthy | Mít sấy (túi vàng có cửa sổ) | `VZ-FH-MITV-XX` (Chưa rõ) | có | — (khung giữ chỗ) |  |
| Viza Food | Fresh & Healthy | Xoài sấy dẻo muối ớt (túi đỏ) | `VZ-FH-XDMO-XX` (Chưa rõ) | có | vz-fh-xdmo.webp |  |
| Viza Food | Fresh & Healthy | Sầu riêng sấy thăng hoa | `VZ-FH-SRTH-XX` (Chưa rõ) | có | vz-fh-srth.webp | vz-fh-srth-2.webp (phối cảnh) |
| Viza Food | Kita | Sầu riêng sấy thăng hoa | `VZ-KT-SRTH-100` (100g · 3 gói nhỏ) |  | vz-kt-srth.webp | vz-kt-srth-2.webp (phối cảnh) |
| Viza Food | Viza Food | Hạt điều rang muối (hộp) | `VZ-VZ-HDI-100` (100g) |  | vz-vz-hdi.webp |  |
| Viza Food | Viza Food | Hạt macca sấy nứt vỏ (hộp) | `VZ-VZ-HMC-100` (100g) |  | vz-vz-hmc.webp |  |
| Viza Food | Viza Food | Hạt dẻ cười (hộp) | `VZ-VZ-HDC-100` (100g) |  | vz-vz-hdc.webp |  |
| Viza Food | Viza Food | Hạt sen sấy (hộp) | `VZ-VZ-HSE-100` (100g) |  | vz-vz-hse.webp |  |
| Viza Food | Viza Food | Dừa sấy giòn (hộp) | `VZ-VZ-DUA-100` (100g) |  | vz-vz-dua.webp |  |
| Viza Food | Viza Food | Combo 2: hạt điều + macca | `VZ-VZ-CB2DM-200` (2 × 100g) |  | vz-vz-cb2dm.webp |  |
| Viza Food | Viza Food | Combo 2 "Sức Khỏe & Thanh Mát" (dẻ cười + hạt sen) | `VZ-VZ-CB2SK-200` (2 × 100g) |  | vz-vz-cb2sk.webp |  |
| Viza Food | Viza Food | Combo 3 "Hạt Dinh Dưỡng" (macca, điều, dẻ cười) | `VZ-VZ-CB3DD-300` (3 × 100g) |  | vz-vz-cb3dd.webp |  |
| Viza Food | Viza Food | Combo 3 Tết "Trọn Vị An Lành" (điều, dẻ cười, hạt sen) | `VZ-VZ-CB3AL-300` (3 × 100g) |  | vz-vz-cb3al.webp |  |
| Viza Food | Viza Food | Combo 4 "Sức Khỏe Tự Nhiên" (hạt sen, dừa, điều, dẻ cười) | `VZ-VZ-CB4SK-400` (4 × 100g) |  | vz-vz-cb4sk.webp |  |
| Viza Food | Viza Food | Combo 4 Tết "Tết Sum Vầy" (macca, dẻ cười, hạt sen, điều) | `VZ-VZ-CB4SV-400` (4 × 100g) |  | vz-vz-cb4sv.webp |  |
| Viza Food | Viza Food | Combo 5 hạt (macca, dừa, dẻ cười, hạt sen, điều) | `VZ-VZ-CB5-500` (5 × 100g) |  | vz-vz-cb5.webp |  |
| Viza Food | YC Nuts & Seeds | Combo 4 Hạt Dinh Dưỡng (dẻ cười, hạt sen, điều, macca) | `VZ-YC-CB4-400` (4 × 100g) |  | vz-yc-cb4.webp |  |

Ảnh đĩa trưng bày (không gắn mã): trung-bay-sau-rieng.webp = Sầu riêng sấy thăng hoa (đĩa chân vàng) (cần kiểm tra); trung-bay-sapoche-1.webp = Sapoche sấy thăng hoa; trung-bay-sapoche-2.webp = Sapoche sấy thăng hoa (một lát) (cần kiểm tra)

Khung combo trong thư viện ảnh: ảnh có `kind: "combo"` hiện chú thích "Combo: …" (theo `alt`) trong thư viện ảnh của thẻ, không phải mã riêng.

## Mã tạm gác (không hiện trên lưới)

Lưu trong `parked` của `server/data/danh-muc.json`, giữ nguyên dữ liệu và file ảnh. Trang `/danh-muc`, bảng so sánh và tab admin chỉ đọc `products`, nên mã tạm gác không hiện và không nhận giá.

| Mã | Sản phẩm | Ngày | Lý do |
|---|---|---|---|
| `VZ-GG-SRS-100` | Good Good sầu riêng sấy (túi vàng) 100g | 2026-10-30, sửa 2026-10-31 | Ảnh duy nhất (vz-gg-srs.webp) có cả túi tím mít Hoa Hậu bên trái. Ảnh này (bản chép vz-gg-cb-srm.webp) nay là khung combo trong thư viện ảnh của thẻ sầu riêng Good Good `VZ-GG-KF-100`. Khi có ảnh riêng một túi sầu riêng thì chuyển lại vào `products`. |
| `VZ-GG-CB2SRM-350` | Combo sầu riêng sấy túi vàng + mít Hoa Hậu túi tím (100g + 250g) | 2026-10-31 | Chủ shop muốn để combo thành một khung trong thư viện ảnh của thẻ sầu riêng Good Good, không tách thẻ riêng. Ảnh vz-gg-cb-srm.webp là ảnh thứ 5 của `VZ-GG-KF-100`, chú thích "Combo: mít Hoa Hậu + sầu riêng sấy túi vàng Good Good" (loại ảnh `combo`). |

`VZ-GG-MHH-250` (mít Hoa Hậu túi tím) vẫn bán riêng với ảnh một túi của nó (vz-gg-mhh.webp).
