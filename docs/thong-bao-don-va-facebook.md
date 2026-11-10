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

