<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->
<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/auster-vn/vietnews">
    <!-- <img src="frontend/public/logo.png" alt="Logo" width="80" height="80"> -->
  </a>

  <h3 align="center">VietNews</h3>

  <p align="center">
    Hệ thống bản tin nóng tự động và vận hành dashboard thông minh thời gian thực.
    <br />
    <a href="https://github.com/auster-vn/vietnews"><strong>Khám phá tài liệu »</strong></a>
    <br />
    <br />
    <a href="https://github.com/auster-vn/vietnews/issues/new?labels=bug&template=bug-report---.md">Báo cáo Lỗi</a>
    ·
    <a href="https://github.com/auster-vn/vietnews/issues/new?labels=enhancement&template=feature-request---.md">Yêu cầu Tính năng</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Mục Lục</summary>
  <ol>
    <li>
      <a href="#about-the-project">Giới thiệu Dự án</a>
      <ul>
        <li><a href="#built-with">Công nghệ sử dụng</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Bắt đầu</a>
      <ul>
        <li><a href="#prerequisites">Yêu cầu hệ thống</a></li>
        <li><a href="#installation">Cài đặt</a></li>
      </ul>
    </li>
    <li><a href="#architecture">Kiến trúc</a></li>
    <li><a href="#usage">Sử dụng</a></li>
    <li><a href="#contributing">Đóng góp</a></li>
    <li><a href="#license">Giấy phép</a></li>
    <li><a href="#contact">Liên hệ</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->
## About The Project

VietNews là một hệ thống tự động cào, xử lý, phân loại tin tức thời gian thực và tự động tạo ảnh thẻ tóm tắt (infographics/news card graphics) chất lượng cao. Hệ thống giám sát vận hành tin tức vietnamplus.vn, tính toán mức độ nóng (hot score) của các sự kiện chính trị, kinh tế, xã hội, khoa học, và hiển thị trực quan thông qua giao diện đa nền tảng hiện đại.

### Công dụng (Use Cases)
* **Cào tin tức hiệu năng cao (Automated Ingestion):** Parser tối ưu sử dụng thư viện Selectolax trong Python để bóc tách vietnamplus.vn một cách tin cậy và không trùng lặp nhờ cache Redis Cloud.
* **ETL Pipeline & Classifier:** Chuẩn hóa dữ liệu văn bản thô, tự động nhận diện danh mục chính xác và tính toán điểm tin nóng `hot_score` (từ 0 đến 100) đại diện cho độ thịnh hành và tầm quan trọng của tin tức.
* **Dựng ảnh thẻ tự động (Vector-to-PNG Renderer):** Sử dụng Node.js Satori kết hợp Resvg để chuyển đổi templates React JSX thành ảnh vector SVG và render ra file PNG độ phân giải cao, sau đó đồng bộ hóa và phân phối thông qua Cloudinary.
* **Giao diện đa nền tảng mượt mà:**
  * **Mobile:** Trải nghiệm vuốt (swipe) đọc tin tức phong cách Tinder độc đáo, tối ưu hóa kích thước hình ảnh và cử chỉ kéo thả.
  * **Desktop:** Dashboard quản lý vận hành split-screen, tích hợp biểu đồ metrics tổng quan, danh sách cuộn nhanh sidebar, thanh công cụ autoplay tự động chuyển tin, và khả năng zoom lightbox xem chi tiết infographic.
* **Vận hành linh hoạt:** Tích hợp cả chế độ render live bằng client-side React replica siêu mượt và chế độ hiển thị ảnh PNG tĩnh tối ưu hóa băng thông.

<p align="right">(<a href="#readme-top">quay lại đầu trang</a>)</p>

### Built With

* [![Next][Next.js]][Next-url]
* [![React][React.js]][React-url]
* [![FastAPI][FastAPI]][FastAPI-url]
* [![PostgreSQL][PostgreSQL]][PostgreSQL-url]
* [![Redis][Redis]][Redis-url]
* [![Docker][Docker]][Docker-url]

<p align="right">(<a href="#readme-top">quay lại đầu trang</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

Để có thể chạy dự án local hoặc triển khai trên các platform hosting miễn phí, hãy làm theo hướng dẫn dưới đây.

### Prerequisites

Hệ thống yêu cầu cài đặt:
* Python >= 3.12 (đề xuất sử dụng `uv` quản lý gói nhanh chóng)
* Node.js >= 18 & npm
* Cơ sở dữ liệu PostgreSQL (hoặc dùng tài khoản Neon Postgres miễn phí)
* Redis Server (hoặc dùng Redis Cloud miễn phí)

### Installation

1. Lấy API Key từ [Cloudinary](https://cloudinary.com/).
2. Clone repository:
   ```sh
   git clone https://github.com/auster-vn/vietnews.git
   cd vietnews
   ```
3. Cài đặt các gói phụ thuộc:
   * **Backend (Python FastAPI):**
     ```sh
     cd backend
     uv pip install -r requirements.txt
     ```
   * **Frontend (Next.js):**
     ```sh
     cd ../frontend
     npm install
     ```
   * **Renderer (Node.js Satori):**
     ```sh
     cd ../renderer
     npm install
     ```
4. Cấu hình biến môi trường `.env` ở thư mục gốc:
   ```env
   # Database & Cache Connection
   NEON_DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
   REDIS_HOST=your-redis-host
   REDIS_PORT=6379
   REDIS_PASSWORD=your-redis-password
   
   # Cloudinary config (For image renderer uploading)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   
   # API Configuration
   NEXT_PUBLIC_API_URL=http://localhost:8000
   INTERNAL_CRON_SECRET=your-internal-cron-secret
   ```
5. Chạy database migrations (Khởi tạo bảng):
   ```sh
   cd ../backend
   python -m backend.src.db.migrations
   ```

<p align="right">(<a href="#readme-top">quay lại đầu trang</a>)</p>

<!-- ARCHITECTURE -->
## Kiến trúc

Hệ thống VietNews được chia thành các cấu phần module tách biệt giúp dễ dàng triển khai độc lập trên các hosting miễn phí (như Vercel cho Next.js, Render/Railway/Fly.io cho FastAPI và Node.js Renderer):

1. **Scraper & ETL pipeline (Python backend):** Thực hiện định kỳ bóc tách dữ liệu từ VietnamPlus, xử lý làm sạch, phân loại và lưu trữ vào Postgres.
2. **Database Layer (Neon Postgres & Redis Cloud):** Lưu trữ dữ liệu dạng quan hệ bền vững (Postgres) và kiểm soát tin tức trùng lặp tốc độ cao (Redis).
3. **Card Renderer (Node.js/Satori):** API Server nhận dữ liệu bài viết từ Backend, biên dịch JSX thành SVG, kết xuất ảnh PNG tĩnh và tải lên Cloudinary CDN.
4. **API Gateway (FastAPI):** Endpoint RESTful cung cấp danh sách tin tức, bộ lọc, tìm kiếm và kích hoạt cào tin thủ công bảo mật bằng `INTERNAL_CRON_SECRET`.
5. **Web Client (Next.js):** Giao diện UI/UX tương tác thời gian thực, đáp ứng thiết bị di động và các màn hình vận hành dashboard.

<p align="right">(<a href="#readme-top">quay lại đầu trang</a>)</p>

<!-- USAGE -->
## Usage

Hoạt động mặc định của các dịch vụ chạy local:
* **Frontend Dashboard Web UI:** `http://localhost:3000`
* **Backend REST API (Swagger Docs):** `http://localhost:8000/docs`
* **Node.js Card Renderer Server:** Chạy mặc định phục vụ render ảnh PNG tĩnh qua API nội bộ.

<p align="right">(<a href="#readme-top">quay lại đầu trang</a>)</p>

<!-- CONTRIBUTING -->
## Contributing

Đóng góp mã nguồn giúp cộng đồng mã nguồn mở trở nên tốt hơn là điều tuyệt vời. Mọi đóng góp của bạn đều được **ghi nhận và trân trọng**.

1. Fork Dự án
2. Tạo Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit những thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên Branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

<p align="right">(<a href="#readme-top">quay lại đầu trang</a>)</p>

<!-- LICENSE -->
## License

Phân phối dưới giấy phép MIT. Xem thêm thông tin chi tiết tại kho lưu trữ.

<p align="right">(<a href="#readme-top">quay lại đầu trang</a>)</p>

<!-- CONTACT -->
## Contact

Auster VN - [@auster_vn](https://auster-vn.github.io/#contact)

Project Link: [https://github.com/auster-vn/vietnews](https://github.com/auster-vn/vietnews)

<p align="right">(<a href="#readme-top">quay lại đầu trang</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/auster-vn/vietnews.svg?style=for-the-badge
[contributors-url]: https://github.com/auster-vn/vietnews/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/auster-vn/vietnews.svg?style=for-the-badge
[forks-url]: https://github.com/auster-vn/vietnews/network/members
[stars-shield]: https://img.shields.io/github/stars/auster-vn/vietnews.svg?style=for-the-badge
[stars-url]: https://github.com/auster-vn/vietnews/stargazers
[issues-shield]: https://img.shields.io/github/issues/auster-vn/vietnews.svg?style=for-the-badge
[issues-url]: https://github.com/auster-vn/vietnews/issues
[license-shield]: https://img.shields.io/github/license/auster-vn/vietnews.svg?style=for-the-badge

[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[FastAPI]: https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white
[FastAPI-url]: https://fastapi.tiangolo.com/
[PostgreSQL]: https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white
[PostgreSQL-url]: https://www.postgresql.org/
[Redis]: https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white
[Redis-url]: https://redis.io/
[Docker]: https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white
[Docker-url]: https://www.docker.com/
