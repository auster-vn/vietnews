# VietNews - Terminology & Architecture
- Scraper: Dùng selectolax bóc tách dữ liệu vietnamplus.vn.
- ETL: Pipeline chuẩn hóa văn bản và tính toán điểm tin nóng.
- Neon Postgres: DB chính lưu thông tin bài viết.
- Redis Cloud: Lưu hash danh sách tin đã đọc để không crawl trùng lặp.
