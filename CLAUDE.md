# VietNews - Development Guide

## Commands
- Run backend tests: `pytest backend/tests/`
- Run frontend tests: `cd frontend && npm run test`
- Run renderer tests: `cd renderer && npm run test`
- Run DB migrations: `python -m backend.src.db.migrations`

## Domain Rules
- **article**: Thông tin bài viết đã crawl (title, summary, category, source_url, published_at).
- **hot_score**: Điểm 0-100 đánh giá tin nóng. Điểm >= 60 là tin hot.
- **rendered_image_url**: Đường dẫn ảnh PNG đã render trên Cloudinary.
