# Bảng giá Mộc Quả — file cốt lõi

> Mở file này **trước** mỗi lần đề xuất giá hay thêm hàng mới. Có loại mới thì ghi thêm một dòng vào `bang-gia.csv` (và mục nhật ký bên dưới), không lục nhiều file cũ.

Cập nhật: 7/11/2026 (Asia/Saigon). Nguồn giá đang bán: `js/data.js` trên nhánh `main` (commit gần nhất lúc lập file: `2772718`, sau PR #34).

## Nguyên tắc cốt lõi (không đổi nếu chủ shop chưa nói khác)

1. **Giá thị trường**, không bịa giá gốc để gạch ảo.
2. **Cùng khối lượng thì cùng giá**, mọi màu túi / mẫu bao bì (trắng, vàng, xanh…). Khác dòng (ví dụ muối ớt, thăng hoa, hộp) thì giá riêng.
3. **Túi hộp (hộp) phải đắt hơn** cùng sản phẩm đựng túi zip.
4. **Combo 2 món ≈ −6%** tổng giá lẻ của đúng những túi đang ghép. **Combo 3 món trở lên ≈ −11%**. Làm tròn tới 1.000đ, gần công thức.
5. Combo tính theo **cách ghép hiện tại**: cộng giá lẻ từng túi thật sự có trong combo. Không lấy giá túi 500g (hay túi khác) để suy ra combo nếu combo không chứa túi đó.
6. **Kế hoạch A** (đang chạy): đơn từ 300k giảm 3% và miễn ship; từ 500k giảm 7%; từ 1 triệu giảm 12%. Phần trăm này áp cho cả đơn, combo cũng được giảm thêm trên giá combo.
7. Không dùng “mua N tặng 1” làm khuyến mãi chung. Ngoại lệ đã có: **combo 6 túi xoài sấy dẻo 100g = 259.000đ** (vàng GoodGood / xanh Fresh & Healthy / trộn), giá không đổi khi thêm màu.
8. Khách lướt, không đọc kỹ: lợi ích (tiết kiệm, miễn ship) phải thấy ngay trên ảnh, cạnh giá và trong giỏ.
9. Ảnh combo phải thấy đủ túi có trong combo (ảnh chủ shop, hoặc ảnh ghép từ ảnh túi thật).
10. Slogan trên bao bì Mộc Quả: **“Quả của đất · Quà của tình”** + mocqua.com.
11. Giá hộp quà / set quà: (tổng giá lẻ theo gram thật + bao bì + công đóng) × (1 − 5…8%), mặc định −6%; không sâu hơn combo 3 (~11%); sàn không dưới 85% tổng giá lẻ phần trái cây. Chỉ đổi giá hộp quà khi chủ shop chốt gram và bao bì.
12. Viza Food là đối tác; Mộc Quả phân phối độc quyền. Không bịa sản phẩm đối thủ thành mã cửa hàng.

## Cách tính combo (nhắc lại)

```
tổng_lẻ = tổng giá bán lẻ của đúng từng túi / hộp trong combo
nếu 2 món:   giá_combo ≈ tổng_lẻ × 0,94
nếu 3+ món:  giá_combo ≈ tổng_lẻ × 0,89
làm tròn tới 1.000đ
```

Ví dụ đã chốt 7/11/2026 (combo 3 vị xoài dẻo + măng cụt thăng hoa 100g + sầu riêng sấy thăng hoa Fresh & Healthy 80g). Sầu riêng trong combo này là túi xanh F&H `MQ-THSR-080-FH` = **90.000đ** (chủ shop chốt 7/11/2026, đổi từ 159.000đ). Không dùng sầu riêng GoodGood 100g (110.000đ), không dùng Yummy 105g (199.000đ) hay Cheers+ 105g (149.000đ).

| Cách ghép | Tổng lẻ | × 0,89 | Giá combo |
|---|---:|---:|---:|
| Xoài 100g (49k) + măng cụt 100g (269k) + sầu riêng F&H 80g (90k) | 408.000 | 363.120 | **363.000** |
| Xoài 200g (89k, trắng hoặc vàng) + măng cụt 100g + sầu riêng F&H 80g | 448.000 | 398.720 | **399.000** |
| Xoài 300g (105k, trắng hoặc vàng) + măng cụt 100g + sầu riêng F&H 80g | 464.000 | 412.960 | **413.000** |

Không đưa túi xoài 500g (149k) vào các combo này. Túi 500g chỉ ghi thêm trên trang xoài (đã bán 149.000đ).

Combo đã có `VZ-MIX-CB3SX-480` (F&H 80g + xoài muối ớt GoodGood 200g + xoài dẻo GoodGood 200g) tính lại theo 90k: 90 + 89 + 89 = 268.000 × 0,89 = 238.520 → **239.000đ**.

## Xoài sấy dẻo Fresh & Healthy — túi trắng / túi vàng

Cùng khối lượng thì trắng và vàng cùng giá.

| Khối lượng | Giá | Trắng trong | Kem – đáy vàng |
|---|---:|---|---|
| 100g | 49.000 | (chưa có mẫu trắng trong 100g; các mẫu khác 100g đã 49k) | MQ-DXO-100-FHV (đã có) |
| 200g | 89.000 | MQ-DXO-200-FHT (đã có) | MQ-DXO-200-FHV (**thêm**) |
| 300g | 105.000 | MQ-DXO-300-FHT (**thêm**) | MQ-DXO-300-FHV (**thêm**) |
| 500g | 149.000 | MQ-DXO-500-FH (đã có, ghi thêm trong ngoặc) | MQ-DXO-500-FHV (đã có, ghi thêm trong ngoặc) |

Giá 300g khớp xoài Cheers+ 300g (cùng khối lượng thì cùng giá).

## Combo 6 túi xoài 100g

Giữ nguyên **259.000đ**. Ba lựa chọn: vàng GoodGood (`MQ-CBX-100-GG`), xanh Fresh & Healthy (`MQ-CBX-100-FH`), trộn 2 nhãn (`MQ-CBX-100-MIX`). Không đổi giá khi thêm màu.

## File đi kèm

- `bang-gia.csv` — một dòng một mã SKU, cột `status`: `dang-ban` hoặc `them-moi`.
- Khi có loại mới: thêm dòng CSV + một dòng nhật ký dưới đây + (nếu lên web) sửa `js/data.js` và `server/data/danh-muc.json`.

## Nhật ký

- **7/11/2026**: Lập file từ giá đang bán trên `main` (183 mã). Thêm kế hoạch: túi xoài F&H vàng 200g (89k), trắng/vàng 300g (105k); combo 3 vị xoài + măng cụt 100g + sầu riêng.
- **7/11/2026**: Chủ shop chốt sầu riêng thăng hoa Fresh & Healthy 80g `MQ-THSR-080-FH` = **90.000đ** (đổi từ 159.000đ). Combo 3 vị dùng túi F&H này, không dùng GoodGood 110k: giá **363.000 / 399.000 / 413.000**. Combo `VZ-MIX-CB3SX-480` tính lại **239.000đ**. GoodGood đỏ 100g vẫn 110.000đ; Yummy 105g vẫn 199.000đ; Cheers+ 105g vẫn 149.000đ.
