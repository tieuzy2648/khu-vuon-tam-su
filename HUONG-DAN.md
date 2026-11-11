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
   Hàm này tạo ba trang **Thư**, **Bảng ghim**, **Tài khoản** cùng các khóa bí mật dùng để mã hóa mã thư,
   mật khẩu và phiên đăng nhập.

> **Đang dùng bản cũ?** Dán đè `Code.gs` mới, chạy lại `caiDat` một lần (dữ liệu cũ được giữ nguyên,
> chỉ thêm cột và trang mới), rồi làm bước 2 theo cách **Quản lý các bản triển khai → Chỉnh sửa → Phiên bản mới**
> để giữ nguyên đường dẫn trong `config.js`.

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
- **Đọc trước các dòng tô đỏ.** Dòng có cột **Cần chú ý** (cột M) = `Có` là thư chứa từ ngữ về tự hại
  (ví dụ "muốn chết", "không muốn sống", kể cả viết không dấu). Người viết vẫn được gửi thư để nhóm biết họ
  đang gặp khó khăn, nên hãy ưu tiên đọc và hồi đáp kèm nguồn hỗ trợ chuyên môn.
- Muốn hồi đáp: gõ lời nhắn vào cột **Phản hồi** (cột H). Cột **Ngày phản hồi** tự điền.
- Muốn tặng thêm **podcast** hoặc **bài hát**: dán đường dẫn `https://` vào cột **Podcast** (J) hoặc
  **Bài hát** (K). YouTube, Spotify, SoundCloud sẽ hiện trình phát ngay trong trang. Đường dẫn khác hiện
  thành nút mở trang. Có thể chỉ gửi podcast/bài hát mà không cần lời nhắn.
- Người gửi đọc hồi đáp bằng cách nhập mã ở mục Tra cứu, hoặc bấm **Lấy thư** nếu họ đã đăng nhập
  (biểu tượng thư trên thanh trên cùng sẽ báo có hồi đáp mới).
- Xóa nội dung cột Phản hồi, Podcast và Bài hát thì thư trở lại trạng thái "đang chờ".
- Cột **Mã thư (đã băm)** bị ẩn và không cần đụng tới. Nhóm không xem được mã gốc của người gửi.
- Cột **Tài khoản** (L) là mã tài khoản của người gửi nếu họ đăng nhập lúc gửi, để trống nếu gửi ẩn danh.
  Đừng sửa cột này, nếu không thư sẽ biến mất khỏi hòm thư của người gửi.
- Nếu người gửi điền email và chọn "Có" nhận phản hồi, nhóm có thể gửi thêm qua email (thủ công).

## Tài khoản người dùng

- Trang **Tài khoản** chứa tên đăng nhập, biệt danh, ngày tạo, lần đăng nhập gần nhất. Mật khẩu và mã khôi phục
  chỉ lưu dạng băm (cột ẩn), **nhóm không xem được và không đặt lại mật khẩu giúp người dùng được**.
- Quên mật khẩu: người dùng tự đặt lại bằng **mã khôi phục** được cấp lúc tạo tài khoản.
  Mất cả hai thì không lấy lại được (web đã báo rõ điều này khi đăng ký).
- Nhập sai mật khẩu 5 lần thì tài khoản tạm khóa 15 phút. Đăng nhập được nhớ 30 ngày trên mỗi trình duyệt.
- Người dùng có thể tự xóa tài khoản: dòng tài khoản bị xóa, thư và lời nhắn của họ được tách khỏi tài khoản.
- Không sửa tay các cột ẩn của trang Tài khoản.

## Bước 4: Duyệt lời nhắn trên Bảng ghim

- Lời nhắn mới nằm ở trang **Bảng ghim** của bảng tính, cột **Duyệt** mặc định là `Chờ duyệt`.
- Đọc lời nhắn, chọn `Có` để cho hiện lên web, hoặc `Không` để ẩn. Web hiện tối đa 30 lời nhắn mới nhất đã duyệt,
  và có thể mất tới 1 phút để cập nhật.
- Chỉ duyệt lời động viên chung. Không duyệt lời nhắn có tên thật, thông tin cá nhân, công kích người khác,
  hay chuyện riêng nặng nề (với trường hợp này, nhóm nên chú ý vì người viết có thể đang cần hỗ trợ).
- Lời nhắn chứa từ ngữ về tự hại bị chặn ngay từ web (người viết được mời sửa lại hoặc kể riêng qua Hòm thư),
  nên sẽ không xuất hiện ở đây.
- Người chưa có tài khoản: biệt danh chỉ lưu trên trình duyệt, máy chủ chỉ nhận khi họ ghim lời nhắn.
  Người có tài khoản: lời nhắn ký bằng biệt danh của tài khoản.

## Đổi câu chữ trên web

- **Lời nhắn hôm nay** (mục Góc lời nhắn) đổi mỗi ngày theo danh sách `LOI_NHAN` trong `index.html`.
- **Câu nói của hôm nay** hiện khi người dùng gõ từ ngữ nguy hiểm, lấy từ danh sách `QUOTE_NGAY`.
- **Gợi ý biệt danh** ghép từ `TEN_A`, `TEN_B` và `TEN_RIENG` (tối đa 24 ký tự, chỉ chữ, số, khoảng trắng).
- **Từ ngữ nguy hiểm** nằm ở `MAU_NGUY_CO`, có ở **cả** `index.html` và `Code.gs`. Sửa ở đâu thì sửa cả hai nơi.

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
- Quên mã thì không tra cứu lại được, vì nhóm không lưu mã gốc. Web hỏi lại hai lần (lần hai phải gõ
  4 ký tự cuối của mã) và cho tải mã về máy để hạn chế việc này. Người có tài khoản thì không cần mã:
  thư đã nằm sẵn trong hòm thư của họ.
- Email phản hồi chưa tự động gửi; nhóm trả lời email thủ công.
