# Mộc Quả — website demo (mocqua.com)

Website bán hàng **mô phỏng**, nhiều trang, HTML/CSS/JS thuần, không cần build và không có backend. Giỏ hàng, yêu thích, đơn hàng, điểm thưởng đều lưu trong `localStorage` của trình duyệt. Có `noindex` và `robots.txt` chặn công cụ tìm kiếm.

## Trang
| Trang | Tệp |
|---|---|
| Trang chủ | `index.html` |
| Cửa hàng (lọc danh mục/vùng/đặc tính/giá, sắp xếp, tìm kiếm, lưới/danh sách, xem thêm) | `cua-hang.html` |
| Chi tiết sản phẩm (`?id=`) | `san-pham.html` |
| Hộp quà: hộp sẵn, tự thiết kế, gợi ý chọn quà, quà doanh nghiệp | `hop-qua.html` |
| Giỏ hàng | `gio-hang.html` |
| Thanh toán | `thanh-toan.html` |
| Đặt hàng thành công | `dat-hang-thanh-cong.html` |
| Tra cứu đơn (mã mẫu `MQ-DEMO-2026`, SĐT `0909000000`) | `tra-cuu-don.html` |
| Yêu thích | `yeu-thich.html` |
| Tài khoản / hội viên Hạt Mộc | `tai-khoan.html` |
| Câu chuyện | `cau-chuyen.html` |
| Góc ẩm thực + bài viết (`?slug=`) | `goc-am-thuc.html`, `bai-viet.html` |
| Liên hệ | `lien-he.html` |
| Chính sách (hướng dẫn, thanh toán, giao hàng, đổi trả, bảo mật) | `chinh-sach.html` |
| 404 | `404.html` |

## Cấu trúc
- `js/data.js` — dữ liệu mẫu: sản phẩm, hộp quà, mã giảm giá, tỉnh thành, bài viết, nhận xét, lịch mùa vụ.
- `js/app.js` — header/mega menu, tìm kiếm trực tiếp, ngăn kéo giỏ hàng, yêu thích, xem nhanh, nút nổi, thanh dưới trên mobile.
- `js/ui.js` — các khối dùng chung (thẻ hộp quà, lịch mùa, ước tính ngày giao, trạng thái đơn).
- `js/pages/*.js` — mã riêng cho từng trang.
- `css/src/*.css` — nguồn CSS; `css/style.css` là bản ghép (`cat css/src/*.css > css/style.css`).

## Mã giảm giá demo
`MOCQUA10` (−10%, tối đa 200k) · `TET2027` (−100k cho đơn từ 1 triệu) · `FREESHIP`.

## Dữ liệu cần thay trước khi chạy thật
Giá (giá demo), hotline/Zalo 0909 000 000, email, địa chỉ showroom, thông tin ngân hàng, mã QR, nhận xét (mẫu), số liệu bán, dinh dưỡng, hành trình lô, nội dung chính sách, ảnh sản phẩm thật. Form chưa nối backend; thanh toán chưa nối cổng thanh toán.
