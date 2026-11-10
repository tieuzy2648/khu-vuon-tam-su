# Khu vườn tâm sự (MindNest): hướng dẫn kết nối hòm thư

Website gồm 3 phần:

| File | Vai trò |
|---|---|
| `index.html` | Toàn bộ giao diện và tương tác |
| `config.js` | Nơi dán đường dẫn máy chủ (Apps Script) |
| `apps-script/Code.gs` | Máy chủ nhận thư và tra cứu hồi đáp, chạy trên Google |

Khi `config.js` còn trống, website chạy **chế độ xem thử**: thư không được gửi đi, trang ghi rõ điều này,
và ô tra cứu chỉ nhận 2 mã mẫu `VUONNHO2026` (đã có hồi đáp) và `CHOTHU2026` (đang chờ).

## Bước 1: Tạo bảng tính và máy chủ

1. Tạo một Google Sheets mới bằng **tài khoản Google của nhóm** (không dùng tài khoản cá nhân), đặt tên ví dụ `MindNest – Hòm thư`.
2. Mở **Tiện ích mở rộng → Apps Script**.
3. Xóa code mẫu, dán toàn bộ nội dung file `apps-script/Code.gs`, bấm **Lưu**.
4. Ở thanh trên, chọn hàm `caiDat` rồi bấm **Chạy**. Google sẽ hỏi quyền truy cập bảng tính, hãy cho phép.
   Hàm này tạo trang **Thư** với tiêu đề cột và một khóa bí mật dùng để mã hóa mã thư.

## Bước 2: Triển khai thành Web App

1. Bấm **Triển khai → Tùy chọn triển khai mới**, loại **Ứng dụng web**.
2. **Thực thi dưới dạng:** Tôi (tài khoản nhóm). **Người có quyền truy cập:** Bất kỳ ai.
3. Bấm **Triển khai**, sao chép **URL ứng dụng web** (dạng `https://script.google.com/macros/s/.../exec`).
4. Dán URL đó vào `config.js`:
   ```js
   window.CAU_HINH = { APPS_SCRIPT_URL: "https://script.google.com/macros/s/.../exec" };
   ```
5. Đẩy code lên lại (GitHub Pages) là xong. Dải "Chế độ xem thử" sẽ tự biến mất.

> Mỗi lần sửa `Code.gs`, phải vào **Triển khai → Quản lý các bản triển khai → Chỉnh sửa → Phiên bản mới**,
> nếu không máy chủ vẫn chạy code cũ.

## Bước 3: Đọc và trả lời thư

- Mỗi thư là một dòng trong trang **Thư**.
- Muốn hồi đáp: gõ lời nhắn vào cột **Phản hồi** (cột H). Cột **Ngày phản hồi** tự điền.
  Người gửi nhập mã ở mục Tra cứu là đọc được ngay.
- Xóa nội dung cột Phản hồi thì thư trở lại trạng thái "đang chờ".
- Cột **Mã thư (đã băm)** bị ẩn và không cần đụng tới. Nhóm không xem được mã gốc của người gửi.
- Nếu người gửi điền email và chọn "Có" nhận phản hồi, nhóm có thể gửi thêm qua email (thủ công).

## Bước 4: Duyệt lời nhắn trên Bảng ghim

- Lời nhắn mới nằm ở trang **Bảng ghim** của bảng tính, cột **Duyệt** mặc định là `Chờ duyệt`.
- Đọc lời nhắn, chọn `Có` để cho hiện lên web, hoặc `Không` để ẩn. Web hiện tối đa 30 lời nhắn mới nhất đã duyệt,
  và có thể mất tới 1 phút để cập nhật.
- Chỉ duyệt lời động viên chung. Không duyệt lời nhắn có tên thật, thông tin cá nhân, công kích người khác,
  hay chuyện riêng nặng nề (với trường hợp này, nhóm nên chú ý vì người viết có thể đang cần hỗ trợ).
- Biệt danh chỉ lưu trên trình duyệt người dùng, máy chủ chỉ nhận biệt danh khi họ ghim lời nhắn.

## Quyền riêng tư: nhóm cần làm đúng những gì trang web đã cam kết

- **Chỉ chia sẻ bảng tính cho thành viên được phân quyền.** Không bật "Bất kỳ ai có đường liên kết".
- **Xóa thư sau 12 tháng** (trang web đang ghi như vậy). Nếu nhóm chọn thời hạn khác, sửa lại đoạn
  "Thư được lưu trong bao lâu" trong `index.html`.
- Không chép nội dung thư ra ngoài nhóm, không đăng lại dưới bất kỳ hình thức nào.
- Nên bổ sung số điện thoại hoặc email **chính thức** của phòng tư vấn tâm lý / công tác sinh viên UEH
  vào các đoạn nhắc hỗ trợ, sau khi đã kiểm tra thông tin từ nguồn của trường.

## Giới hạn hiện tại

- Máy chủ giới hạn 20 thư và 60 lượt tra cứu mỗi phút (toàn hệ thống) để chống phá hoại.
  Sửa trong `Code.gs` nếu cần.
- Quên mã thì không tra cứu lại được, vì nhóm không lưu mã gốc.
- Email phản hồi chưa tự động gửi; nhóm trả lời email thủ công.
