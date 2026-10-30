# Mộc Quả

Cửa hàng trái cây sấy. Khách xem hàng theo cách sấy, cho vào giỏ, đặt một trang, nhận mã chuyển khoản VietQR. Chủ shop đăng nhập để xem đơn, đổi trạng thái và sửa giá.

Danh mục vẫn lấy từ `js/data.js` (pipeline trong `research/` giữ nguyên). Giá sửa trên trang quản trị được ghi đè trong SQLite, không sửa file danh mục.

Trang tĩnh cũ (`cau-chuyen.html`, `chinh-sach.html`, `hop-qua.html`…) vẫn được phục vụ. Trang mua hàng mới nằm ở `/`, `/cua-hang`, `/san-pham/...`, `/gio-hang`, `/thanh-toan`.

## Chạy trên máy

Cần Node.js 22.13 trở lên (dùng SQLite gắn sẵn trong Node).

```bash
cp .env.example .env
# Sửa ADMIN_PASSWORD trong .env
npm install
npm start
```

Mở http://localhost:3000

Kiểm tra tự động:

```bash
npm run check
```

`npm run dev` tự khởi động lại khi sửa file máy chủ.

## Biến môi trường

Xem `.env.example`.

| Biến | Việc |
|---|---|
| `PORT` | Cổng, mặc định 3000 |
| `ADMIN_PASSWORD` | Mật khẩu trang `/admin`. Ít nhất 10 ký tự, không dùng toàn số hay mật khẩu phổ biến. Trống hoặc quá yếu thì máy chủ không khởi động |
| `ADMIN_SECRET` | Khoá ký cookie. Bỏ trống thì dùng tạm mật khẩu admin |
| `BANK_BIN` | Mã NAPAS 6 số. Mặc định `970407` (Techcombank) |
| `BANK_NAME` | Tên ngân hàng hiện cạnh mã QR. Mặc định `Techcombank` |
| `ACCOUNT_NO` | Số tài khoản. Mặc định `19029781376018` |
| `ACCOUNT_NAME` | Tên chủ tài khoản trên VietQR. Mặc định `NGUYEN NGOC HUY` |
| `DB_PATH` | File SQLite. Mặc định `data/mocqua.sqlite` |

Biến `BANK_*` / `ACCOUNT_*` để trống thì máy chủ dùng tài khoản Techcombank ở trên, nên mã QR vẫn hiện. Đặt biến trên máy chạy thật nếu cần đổi tài khoản. Đây là số nhận tiền công khai, khác với `ADMIN_PASSWORD`.

Mã QR lấy từ địa chỉ ảnh VietQR chuẩn:

`https://img.vietqr.io/image/{BANK_BIN}-{ACCOUNT_NO}-compact2.png?amount=...&addInfo={mã đơn}&accountName=...`

Nội dung chuyển khoản là mã đơn, ví dụ `MQ261024-K7MQ2X`.

## Thử mua hàng

1. Vào cửa hàng, chọn Sấy dẻo → Xoài → một hãng.
2. Trên trang món, chọn khối lượng (và màu túi nếu có), cho vào giỏ.
3. Giỏ tự thêm dòng quà 0đ khi đơn từ mức tặng, hoặc khi đủ số túi xoài từ khối lượng quy định. Mức mặc định: đơn từ 199.000đ hoặc 2 túi xoài từ 200g, lấy mức nhiều hơn, tối đa 3 gói. Gói quà là xoài muối ớt GoodGood 50–100g.
4. Đặt hàng, điền tên, điện thoại, địa chỉ. Chọn chuyển khoản để sang trang có QR. Trả khi nhận hàng là lựa chọn phụ.
5. Vào `/admin`, đăng nhập, thấy đơn mới, đổi trạng thái: Chờ CK → Đã nhận → Đang giao → Xong. Sửa một giá ở tab Giá bán rồi tải lại trang món.

Liên hệ shop: hotline và Zalo `0931 330 248`, `0919 997 283`, email `huydaigia1407@gmail.com`, địa chỉ 376/15 Nguyễn Đình Chiểu, Quận 3, TP. Hồ Chí Minh. Facebook và TikTok ghi trong chân trang và trang Liên hệ. Số `0909000000` chỉ dùng cho đơn mẫu `MQ-DEMO-2026` trên trang tra cứu tĩnh, không phải số shop.

## Danh mục tra cứu

Trang `/danh-muc`: tra cứu Thương hiệu → Nhãn → Sản phẩm → Khối lượng, có so sánh giá/100g. Chi tiết, quy tắc mã và danh sách ảnh: `research/danh-muc.md`.

## Dữ liệu sản phẩm

- Nguồn: `js/data.js`, sinh từ `research/` (`gen_data.py`, `pricing.py`, …).
- Máy chủ đọc file này lúc khởi động. Sửa danh mục xong thì chạy lại `npm start`.
- Giá và câu ngắn sửa trong `/admin` nằm ở SQLite, đè lên file. Bấm "Về giá gốc" để bỏ phần đè.
- Ảnh dùng lại thư mục `assets/`.

## Render gói miễn phí

Trang chạy gói free của Render (Singapore), ví dụ https://mocqua.onrender.com. Đĩa trên gói này là bộ nhớ tạm. File SQLite mất khi deploy, khi máy chủ khởi động lại, và khi máy ngủ (khoảng 15 phút không có khách) rồi tỉnh lại. Cách chạy này không gắn đĩa trả phí và không chuyển sang Postgres.

Thói quen của chủ shop: sau mỗi đợt đơn, và luôn trước khi bấm deploy, vào `/admin` rồi bấm **Xuất tất cả (JSON)**. Giữ file đó trên máy. Khi trang lên lại mà danh sách đơn trống, chọn file → **Thêm đơn còn thiếu** → **Nhập bản sao**.

- **Xuất tất cả (JSON)** là bản đầy đủ: mọi đơn, món trong đơn, quà, giá đã sửa và mức quà. Dùng file này để nhập lại.
- **Xuất đơn (CSV)** để mở bằng Excel. Không dùng CSV để nhập lại.
- **Thêm đơn còn thiếu** giữ đơn đang có, chỉ thêm mã chưa có.
- **Thay toàn bộ đơn** xoá đơn hiện tại rồi ghi đúng file. Phải tick xác nhận.
- Tick **Khôi phục luôn giá đã sửa và mức quà** khi muốn lấy lại phần đó trong file JSON.

Cookie quản trị có `HttpOnly`, `SameSite=Lax`, và `Secure` khi trang chạy HTTPS. Phiên hết hạn sau 7 ngày. Nhập sai mật khẩu 5 lần từ cùng một địa chỉ thì khoá khoảng 15 phút. Bộ đếm nằm trong bộ nhớ của một máy chủ. Thao tác quản trị (đăng nhập, sửa đơn, nhập bản sao) chỉ nhận khi trình duyệt gửi từ chính trang này.

## Cài lên màn hình điện thoại

Mở https://mocqua.onrender.com bằng Chrome hoặc Safari, đúng địa chỉ có khoá HTTPS.

- Android: menu trình duyệt → **Cài đặt ứng dụng** hoặc **Thêm vào Màn hình chính**.
- iPhone: nút Chia sẻ → **Thêm vào Màn hình chính**.

Icon Mộc Quả hiện trên màn hình. Bấm vào là vào cửa hàng. Giỏ vẫn nằm trên máy khi mất mạng. Đặt hàng, mã VietQR và trang quản trị cần có mạng.

## Đưa lên mạng

GitHub Pages chỉ phục vụ file tĩnh, không chạy được đơn hàng và trang quản trị. Cần một máy Node 22 và các biến môi trường ở trên.

Ví dụ với Docker:

```bash
docker build -t mocqua .
docker run -p 3000:3000 \
  -e ADMIN_PASSWORD='mật khẩu dài' \
  -e ADMIN_SECRET='một chuỗi ngẫu nhiên khác' \
  -e BANK_BIN='970407' \
  -e BANK_NAME='Techcombank' \
  -e ACCOUNT_NO='19029781376018' \
  -e ACCOUNT_NAME='NGUYEN NGOC HUY' \
  -v mocqua-data:/app/data \
  mocqua
```

Trên Render gói miễn phí: Node 22, lệnh `npm start`, không gắn đĩa. Đơn chỉ còn nếu chủ shop xuất JSON rồi nhập lại (mục trên). Chỗ chạy có đĩa riêng thì mới gắn volume vào `data/`. Đặt `ADMIN_PASSWORD` (ít nhất 10 ký tự) và `ADMIN_SECRET` trong bảng điều khiển, không ghi mật khẩu vào repo. Tài khoản Techcombank đã có trong `.env.example`; đặt lại `BANK_*` nếu đổi số nhận tiền.

Khi tên miền mocqua.com trỏ tới máy này, nhớ bỏ `noindex` trong `server/pages.js` nếu muốn công cụ tìm kiếm thấy trang.

Ảnh biên lai chuyển khoản chưa có chỗ tải lên. Khách giữ trang đơn; shop đối soát bằng mã đơn trong nội dung chuyển khoản.
