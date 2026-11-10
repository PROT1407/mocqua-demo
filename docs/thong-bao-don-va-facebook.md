# Thông báo đơn và Facebook

Hướng dẫn ngắn cho chủ shop. Không ghi token thật vào file này.

## 1. Telegram báo đơn mới

1. Mở Telegram, nhắn `@BotFather`, gửi `/newbot`, đặt tên bot. BotFather trả một token dạng `123456:ABC...`.
2. Nhắn cho bot đó một câu bất kỳ (ví dụ `xin chào`) để Telegram tạo cuộc trò chuyện.
3. Lấy chat id: mở `https://api.telegram.org/bot<TOKEN>/getUpdates` trên trình duyệt, tìm `"chat":{"id": ...}`. Muốn nhận ở nhiều chỗ thì cách các id bằng dấu phẩy.
4. Trên Render, service **cửa hàng** (mocqua, không phải ai-server), thêm:
   - `TELEGRAM_BOT_TOKEN` = token vừa lấy
   - `TELEGRAM_CHAT_ID` = chat id
5. Deploy lại service cửa hàng. Vào `/admin`, bấm **Gửi thử thông báo**. Thấy tin trên Telegram là được.
6. Mỗi đơn đặt trên website sẽ gửi một tin `🛒 ĐƠN MỚI`. Telegram lỗi thì đơn vẫn lưu.

Shop chưa có trạng thái “đã thanh toán” hay “đã huỷ”, nên không gửi thêm tin khi đổi trạng thái đơn.

## 2. Facebook Messenger cho fanpage Mộc Quả

Làm trên service **ai-server** (`https://ai-server-u9ob.onrender.com`), không phải service cửa hàng.

1. Vào [Meta for Developers](https://developers.facebook.com/), tạo ứng dụng loại Business, thêm sản phẩm Messenger.
2. Tạo một chuỗi bất kỳ làm `FB_VERIFY_TOKEN` (chỉ mình biết). Dán lên Render cùng `FB_APP_SECRET` (trong mục Cài đặt cơ bản của app) và token trang ở bước sau.
3. Trong Messenger → Cài đặt, webhook URL: `https://ai-server-u9ob.onrender.com/webhook/facebook`, verify token đúng chuỗi vừa đặt. Bấm xác minh.
4. Đăng ký trang với các trường: `messages`, `messaging_postbacks`, `message_echoes`.
5. Tạo token trang (Page access token) cho fanpage Mộc Quả, dán vào `FB_PAGE_ACCESS_TOKEN`.
6. Muốn bot báo khi khách để lại tên, số điện thoại, địa chỉ hoặc xin gặp người: điền `TELEGRAM_BOT_TOKEN` và `TELEGRAM_CHAT_ID` trên **ai-server** (cùng bot với cửa hàng cũng được).
7. Đưa app sang chế độ Live và xin quyền `pages_messaging`. Khách không phải quản trị trang chỉ nhắn được sau khi Meta duyệt quyền này.

Bot đưa link sản phẩm và mời đặt trên website. Bot không nhận thanh toán và không gửi số tài khoản. Nhân viên trả lời tay trên trang thì bot im khách đó 60 phút.

## 3. Google Sheet lưu đơn

Đĩa gói miễn phí của Render không giữ đơn khi máy ngủ hoặc deploy. Google Sheet là bản sao miễn phí, nằm ngoài Render. Mỗi đơn đặt thành công trên website thêm **một dòng** lúc đơn vừa lưu. Sửa trạng thái trong `/admin` không sửa lại dòng cũ. File JSON ở `/admin` vẫn cần nếu muốn nhập đơn trở lại cửa hàng, hoặc lấy giá đã sửa.

1. Vào [Google Sheets](https://sheets.google.com), tạo một bảng trống, đặt tên ví dụ `Mộc Quả — đơn hàng`. Để sheet đầu trống, không gõ dòng tiêu đề.
2. Trên bảng đó: **Tiện ích** (Extensions) → **Apps Script**. Xoá code mẫu. Mở file `docs/google-sheets-apps-script.gs` trong repo, copy toàn bộ, dán vào, rồi Save.
3. Cạnh tên project, bấm bánh răng **Project Settings** → **Script properties** → **Add script property**. Tên: `GOOGLE_SHEETS_SECRET`. Giá trị: một chuỗi chỉ mình biết (ví dụ một câu dài). Đây không phải mật khẩu Google.
4. **Deploy** → **New deployment** → bánh răng chọn loại **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Deploy. Google hỏi quyền sửa bảng thì cho phép.
5. Copy **Web app URL**, dạng `https://script.google.com/macros/s/.../exec`. Mở URL đó trên trình duyệt: thấy `{"ok":true,"service":"mocqua-sheets"}` là được (trình duyệt có thể đổi sang địa chỉ `googleusercontent.com`). Bước này không ghi dòng nào.
6. Trên Render, service **cửa hàng** (mocqua, không phải ai-server) → **Environment**, thêm:
   - `GOOGLE_SHEETS_WEBHOOK_URL` = URL vừa copy
   - `GOOGLE_SHEETS_SECRET` = đúng chuỗi ở bước 3
7. Save. Render deploy lại. Vào `/admin`, bấm **Gửi thử thông báo**.
   - Telegram: `ok`, `không cấu hình`, hoặc `lỗi`
   - Google Sheet: `ok`, `không cấu hình`, hoặc `lỗi`
   - Khi Sheet là `ok`, bảng có một dòng mã `TEST`, cột Đánh dấu là `TEST`. Danh sách đơn trên `/admin` không thêm đơn mới.
8. Đơn khách đặt sau đó thêm một dòng thật (giờ Việt Nam, mã đơn, khách, điện thoại, địa chỉ, ghi chú, món kèm quy cách và mã, số lượng, giá, tạm tính, giảm, phí giao, tổng, cách thanh toán, trạng thái lúc đặt).

Sheet chậm hoặc lỗi thì đơn vẫn lưu, Telegram vẫn gửi. Máy thử lại một lần, mỗi lần chờ khoảng 10 giây, rồi bỏ qua. Không ghi URL hay chuỗi bí mật ra log.

Sửa code Apps Script xong phải **Deploy → Manage deployments → bút chì → Version: New version → Deploy**. URL giữ nguyên, không cần sửa Render.

## 4. Đỡ máy ngủ (gói Render free)

Gói free ngủ sau khoảng 15 phút không có ai gọi. Lần mở đầu mất khoảng 30–60 giây.

Render cho **750 giờ máy mỗi tháng cho cả workspace** (mọi service free cộng lại). Một service chạy suốt ngày đêm hết khoảng 720–744 giờ, gần kín hạn mức. Hai service cùng chạy 24/7 thì khoảng 1.500 giờ, vượt hạn mức, Render dừng service. Vì vậy **chỉ ping cửa hàng**, không ping ai-server suốt ngày.

Cửa hàng có địa chỉ nhẹ `https://mocqua.onrender.com/healthz` (trả `{"ok":true}`, không đọc đơn). ai-server có `https://ai-server-u9ob.onrender.com/health`, cũng nhẹ. Trang cửa hàng, khi khách mở (trừ trang `/admin`), tự gọi health của ai-server tối đa một lần mỗi 10 phút trên mỗi trình duyệt. Lời gọi đó không làm chậm trang và không hiện lỗi. Không cần monitor riêng cho ai-server.

### Nên dùng cron-job.org để chỉ gọi khoảng 7h–23h

1. Đăng ký miễn phí tại [cron-job.org](https://cron-job.org).
2. Tạo một cronjob:
   - URL: `https://mocqua.onrender.com/healthz`
   - Nếu có ô múi giờ: chọn **Asia/Ho_Chi_Minh**, lịch `*/5 7-22 * * *`
   - Nếu lịch tính theo UTC: `*/5 0-15 * * *` (cùng nghĩa: 7:00 đến 22:55 giờ Việt Nam)
3. Bật job. Cứ 5 phút một lần trong khoảng đó. 5 phút ngắn hơn 15 phút máy ngủ, nên cửa hàng thức trong giờ bán. Khoảng 23h job ngừng, máy ngủ sau đó. Sáng hôm sau lần đầu có thể chậm 30–60 giây.
4. Không tạo job thứ hai cho `ai-server-u9ob.onrender.com`.

Khoảng 16 giờ/ngày × 30 ngày ≈ 480 giờ, còn dư trong 750 giờ cho lần deploy và cho ai-server khi có khách.

### UptimeRobot

[UptimeRobot](https://uptimerobot.com) gói free cũng gọi được mỗi 5 phút, nhưng **không hẹn giờ** (cửa sổ bảo trì chỉ có ở gói trả phí, và vẫn còn gọi thưa hơn). Monitor 24/7 cho một service tốn gần hết 750 giờ.

Nếu vẫn dùng UptimeRobot: tạo **một** HTTP(s) monitor, URL `https://mocqua.onrender.com/healthz`, interval 5 phút. Không thêm monitor cho ai-server. Biết là cách này để cửa hàng thức gần cả tháng và gần chạm hạn mức giờ.

