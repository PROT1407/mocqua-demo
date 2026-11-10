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

Phần Facebook nằm ở cuối file, làm sau khi máy chủ AI đã chạy.
