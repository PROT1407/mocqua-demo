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
| `ADMIN_PASSWORD` | Mật khẩu trang `/admin`. Để trống thì không đăng nhập được |
| `ADMIN_SECRET` | Khoá ký cookie. Bỏ trống thì dùng tạm mật khẩu admin |
| `BANK_BIN` | Mã NAPAS 6 số của ngân hàng nhận tiền |
| `BANK_NAME` | Tên ngân hàng hiện cạnh mã QR. Không bắt buộc |
| `ACCOUNT_NO` | Số tài khoản |
| `ACCOUNT_NAME` | Tên chủ tài khoản, đúng như ngân hàng in |
| `DB_PATH` | File SQLite. Mặc định `data/mocqua.sqlite` |

Chưa điền đủ `BANK_BIN`, `ACCOUNT_NO`, `ACCOUNT_NAME` thì đơn vẫn được ghi, trang đơn hiện số tiền và mã đơn, nhưng chưa có ảnh QR. Không ghi số tài khoản mẫu vào git.

Mã QR lấy từ địa chỉ ảnh VietQR chuẩn:

`https://img.vietqr.io/image/{BANK_BIN}-{ACCOUNT_NO}-compact2.png?amount=...&addInfo={mã đơn}&accountName=...`

Nội dung chuyển khoản là mã đơn, ví dụ `MQ261024-K7MQ2X`.

## Thử mua hàng

1. Vào cửa hàng, chọn Sấy dẻo → Xoài → một hãng.
2. Trên trang món, chọn khối lượng (và màu túi nếu có), cho vào giỏ.
3. Giỏ tự thêm dòng quà 0đ khi đơn từ mức tặng, hoặc khi đủ số túi xoài từ khối lượng quy định. Mức mặc định: đơn từ 199.000đ hoặc 2 túi xoài từ 200g, lấy mức nhiều hơn, tối đa 3 gói. Gói quà là xoài muối ớt GoodGood 50–100g.
4. Đặt hàng, điền tên, điện thoại, địa chỉ. Chọn chuyển khoản để sang trang có QR. Trả khi nhận hàng là lựa chọn phụ.
5. Vào `/admin`, đăng nhập, thấy đơn mới, đổi trạng thái: Chờ CK → Đã nhận → Đang giao → Xong. Sửa một giá ở tab Giá bán rồi tải lại trang món.

Hotline `0909 000 000` trên các trang tĩnh cũ là số mẫu từ bản demo, chưa phải số shop.

## Dữ liệu sản phẩm

- Nguồn: `js/data.js`, sinh từ `research/` (`gen_data.py`, `pricing.py`, …).
- Máy chủ đọc file này lúc khởi động. Sửa danh mục xong thì chạy lại `npm start`.
- Giá và câu ngắn sửa trong `/admin` nằm ở SQLite, đè lên file. Bấm "Về giá gốc" để bỏ phần đè.
- Ảnh dùng lại thư mục `assets/`.

## Đưa lên mạng

GitHub Pages chỉ phục vụ file tĩnh, không chạy được đơn hàng và trang quản trị. Cần một máy Node 22, một volume giữ file SQLite, và các biến môi trường ở trên.

Ví dụ với Docker:

```bash
docker build -t mocqua .
docker run -p 3000:3000 \
  -e ADMIN_PASSWORD='mật khẩu dài' \
  -e ADMIN_SECRET='một chuỗi ngẫu nhiên khác' \
  -e BANK_BIN='......' \
  -e ACCOUNT_NO='......' \
  -e ACCOUNT_NAME='TEN CHU TAI KHOAN' \
  -v mocqua-data:/app/data \
  mocqua
```

Trên Railway, Render, Fly.io hoặc VPS: chọn Node 22, lệnh `npm start`, gắn đĩa vào `data/` để đơn không mất khi khởi động lại. Đặt biến môi trường trong bảng điều khiển của chỗ chạy, không ghi vào repo.

Khi tên miền mocqua.com trỏ tới máy này, nhớ bỏ `noindex` trong `server/pages.js` nếu muốn công cụ tìm kiếm thấy trang.

Ảnh biên lai chuyển khoản chưa có chỗ tải lên. Khách giữ trang đơn; shop đối soát bằng mã đơn trong nội dung chuyển khoản.
