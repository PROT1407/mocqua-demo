# Máy chủ AI dùng chung

API nhỏ để hai website (Mộc Quả và H79 Gold) gọi chung một khóa Gemini. Khóa chỉ đặt trên server này, không đưa vào mã giao diện.

Deploy thành **một Web Service Render riêng**, Root Directory là `ai-server`. Không đổi lệnh chạy của cửa hàng Mộc Quả.

## Chạy local

```bash
cd ai-server
npm install
export GEMINI_API_KEY="điền-khóa-của-bạn"
export PORT=10000
npm start
```

Biến tùy chọn:

- `GEMINI_MODEL` — mặc định `gemini-3.5-flash-lite`. Đổi được khi Google ra model Flash khác.
- `MOCQUA_CATALOG_URL` — mặc định `https://mocqua.onrender.com/api/danh-muc`. Server chỉ giữ tên, nhãn, khối lượng, giá và link `/san-pham/<shopId>` khi danh mục có slug trang cửa hàng. Không đoán link từ id danh mục.
- `SHOP_PUBLIC_URL` — gốc link sản phẩm, mặc định `https://mocqua.onrender.com`.
- `CATALOG_TTL_MS` — cache danh mục trong bộ nhớ, mặc định 10 phút. Lỗi tải thì dùng bản gần nhất. Lần tải đầu chờ khoảng 25 giây và thử lại một lần, vì shop miễn phí khởi động chậm. Máy chủ làm nóng danh mục ngay khi bật, không chặn cổng lắng nghe.

Máy chủ lắng nghe `0.0.0.0` và `PORT` (Render thường là 10000).

## Kiểm tra

```bash
curl -s http://127.0.0.1:10000/health

curl -s -X POST http://127.0.0.1:10000/api/h79gold \
  -H 'Content-Type: application/json' \
  -d '{"message":"giá vàng"}'

curl -s -X POST http://127.0.0.1:10000/api/mocqua \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:3000' \
  -d '{"message":"Xoài sấy thăng hoa Cheers+ giá bao nhiêu?","history":[]}'
```

`/health` trả `{ "ok": true }`. `/api/h79gold` trả 503 vì chưa nối logic vàng. `/api/mocqua` trả `{ "reply": "..." }` khi đã có `GEMINI_API_KEY`; nếu thiếu khóa thì 503, không làm sập tiến trình.

Chỉ các origin sau được gọi từ trình duyệt tới `/api/mocqua`: `https://mocqua.com`, `https://www.mocqua.com`, `https://mocqua.onrender.com`, `https://h79gold.com`, `https://www.h79gold.com`, `http://localhost:3000`, `http://127.0.0.1:3000`. Webhook Facebook không dùng danh sách này.

`GET /` trả `{ "ok": true, "service": "mocqua-ai-server" }`.

## Facebook

Webhook: `https://ai-server-u9ob.onrender.com/webhook/facebook`

Biến trên service **ai-server** (không phải cửa hàng): `FB_VERIFY_TOKEN`, `FB_APP_SECRET`, `FB_PAGE_ACCESS_TOKEN`, và `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` nếu muốn báo chủ shop khi khách nhắn đặt hàng hoặc xin gặp người. Thiếu biến Facebook thì webhook trả về mà không trả lời khách.

Cách nối trang nằm trong `docs/thong-bao-don-va-facebook.md`.

## Render

- Root Directory: `ai-server`
- Build: `npm install`
- Start: `npm start`
- Health check: `/health`
- Env: `GEMINI_API_KEY` (secret), và các biến Facebook / Telegram ở trên nếu dùng. Không ghi khóa vào git, README, hay log.

Chưa tạo service ở PR này.
