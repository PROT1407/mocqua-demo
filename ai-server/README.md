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

- `GEMINI_MODEL` — mặc định `gemini-2.5-flash` (Flash rẻ, độ trễ thấp). Đổi được nếu Google ra model Flash mới.
- `MOCQUA_CATALOG_URL` — mặc định `https://mocqua.onrender.com/api/danh-muc`. Đây là JSON công khai của shop; server chỉ giữ tên, mã, khối lượng, giá và nhóm hàng.
- `CATALOG_TTL_MS` — cache danh mục trong bộ nhớ, mặc định 5 phút.

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

Chỉ các origin sau được gọi từ trình duyệt: `https://mocqua.com`, `https://www.mocqua.com`, `https://mocqua.onrender.com`, `https://h79gold.com`, `https://www.h79gold.com`, `http://localhost:3000`, `http://127.0.0.1:3000`.

## Render

- Root Directory: `ai-server`
- Build: `npm install`
- Start: `npm start`
- Health check: `/health`
- Env: `GEMINI_API_KEY` (secret). Không ghi khóa vào git, README, hay log.

Chưa tạo service ở PR này.
