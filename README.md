# HÁN ĐỌC — Ứng dụng luyện đọc tiếng Trung HSK3 trên iPhone

Bản web app/PWA miễn phí, không có máy chủ và không yêu cầu tài khoản.

## Có gì trong bản này?

- **22 bài đọc HSK3 có sẵn** (chủ đề đời sống, học tập, công việc, du lịch...), mỗi bài gồm chữ Hán, pinyin và nghĩa Việt để bật/tắt.
- **157 mục từ vựng** kèm pinyin, nghĩa Việt; lưu từ yêu thích.
- **66 câu hỏi đọc hiểu** trắc nghiệm; chấm kết quả và giải thích bằng tiếng Việt.
- Nghe phát âm tiếng Quan thoại bằng tính năng **Text-to-Speech của iPhone**. Chọn tốc độ, nghe từng đoạn hoặc toàn bài.
- Tìm theo tên, chủ đề, từ vựng; lọc bài đã học và yêu thích.
- Lưu bài đã đọc, điểm bài kiểm tra, ngày học liên tiếp trên thiết bị; xuất/nhập bản sao lưu JSON.
- Bài học được tải trước khi kết nối mạng sẽ có thể đọc offline qua service worker (khi chạy tại một địa chỉ HTTPS).

**Giới hạn cần biết:** Tính năng “bài gợi ý hôm nay” luân phiên qua 22 bài có sẵn. Các bài mới từ lịch nhắc ChatGPT KHÔNG tự đồng bộ vào ứng dụng. Không có đăng nhập/đồng bộ dữ liệu giữa thiết bị. Việc phát âm bằng giọng đọc hệ thống phụ thuộc iOS, Safari và giọng tiếng Trung được cài; ngoại tuyến không đảm bảo có giọng phát âm.

## Cài lên iPhone đúng cách (khuyên dùng GitHub Pages)

### Phương án A — GitHub Pages

1. Giải nén thư mục `hsk3_iphone_app`.
2. Tạo repository mới trên GitHub, ví dụ `han-doc` (chọn **Public** nếu bạn muốn dùng GitHub Pages miễn phí; chỉ có mã và các bài học công khai, không có dữ liệu tiến độ cá nhân).
3. Tải toàn bộ **nội dung** thư mục lên phần gốc repository, bảo đảm `index.html` ở gốc cùng `app.js`, `data.js`, `styles.css`, `sw.js`, `manifest.webmanifest` và `assets/`.
4. Vào **Settings → Pages → Build and deployment → Deploy from a branch**, chọn branch `main`, folder `/(root)`, Save.
5. Sau khi GitHub Pages triển khai, mở địa chỉ dạng `https://TEN_TAI_KHOAN.github.io/han-doc/` từ Safari trên iPhone.
6. Safari → Chia sẻ (Share) → **Thêm vào Màn hình chính (Add to Home Screen)** → **Mở như ứng dụng web (Open as Web App)** → Thêm.

Không nên mở trực tiếp `index.html` trong ứng dụng Tệp (Files) rồi mong chờ tính năng cài PWA/offline. PWA và service worker hoạt động tốt nhất với trang được phục vụ qua HTTPS.

### Phương án B — Cloudflare Pages

Tải thư mục website lên Cloudflare Pages dưới dạng static site (Deploy assets), nhận URL HTTPS, sau đó thực hiện bước 6 ở trên.

## Dùng thử trên máy tính

Tại thư mục web, chạy:

```bash
python -m http.server 8080
```

Mở `http://localhost:8080/` trên máy tính.

## Chỉnh sửa bài đọc

Nội dung nằm trong `data.js`. Đây là tệp `window.HSK3_LESSONS = [...]` được tạo từ `make_data.py`. Nếu muốn tự thêm bài, chỉnh `make_data.py`, chạy `python make_data.py` (cần tiện ích ICU `uconv` để tạo pinyin) rồi tải lại `data.js` và đổi tên phiên bản cache trong `sw.js` để cập nhật offline.

## Quyền riêng tư

Ứng dụng không gọi API hoặc gửi câu trả lời lên máy chủ. Tiến độ nằm trong `localStorage` trên thiết bị và có thể mất khi xóa dữ liệu Safari. Tệp sao lưu JSON có thể chứa thông tin tiến độ, nên hãy lưu ở nơi phù hợp.
