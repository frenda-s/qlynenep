# NeNepOS — Hệ thống quản lý nề nếp học sinh

Ứng dụng full-stack Nuxt 4 hỗ trợ deploy linh hoạt trên cả **Cloudflare Workers** (Serverless Edge full-stack) và **Node.js** (Docker/VPS). Cơ sở dữ liệu phân tán sử dụng **libSQL / Turso** (SQLite).

Dữ liệu nề nếp & tiêu chí thi đua được cấu hình chuẩn theo văn bản **Tiêu chuẩn đánh giá thi đua lớp học năm học 2026 – 2027 — Trường THPT Chu Văn An – Gia Nghĩa**.

---

## Stack công nghệ

- **Framework**: Nuxt 4 (TypeScript, Vue 3)
- **Engine / Runtime**: Cloudflare Workers (preset Nitro `cloudflare-module` + Worker Static Assets) hoặc Node.js server (`node-server`)
- **Database**: libSQL / Turso (SQLite Edge) + Drizzle ORM
- **Authentication**: JWT HS256 (`jose`), cookie `httpOnly`
- **Validation**: Zod
- **UI / Styling**: Tailwind CSS 4 (`@tailwindcss/vite`), Reka UI, `@lucide/vue`
- **QR Code**: `jsqr` (quét trực tiếp camera) + `qrcode-generator` (tạo mã thẻ học sinh)
- **Kiểm thử**: Vitest

---

## Tiêu chí thi đua 2026 – 2027 (THPT Chu Văn An – Gia Nghĩa)

Hệ thống đã cập nhật đầy đủ các danh mục và mức điểm phạt theo đúng văn bản nội quy:

### 1. Chấp hành giờ giấc
- **Vắng học có lý do**: -2 điểm / 1 hs / buổi
- **Vắng học không lý do**: -10 điểm / 1 hs / buổi
- **Cúp tiết, cúp chào cờ hoặc các giờ sinh hoạt**: -10 điểm / 1 hs / lượt
- **Đi học muộn**: -5 điểm / 1 hs
- **Sinh hoạt đầu giờ không trong lớp**: -10 điểm / 1 hs

### 2. Vệ sinh, trang trí
- **Làm dơ bẩn phòng học, viết vẽ lên tường, bàn học**: -15 điểm / 1 lượt hs
- **Không chuẩn bị, thu xếp dụng cụ, bàn ghế sinh hoạt tập thể**: -15 điểm / tập thể lớp
- **Không có bình hoa, khăn bàn trên bàn giáo viên**: -10 điểm / lớp
- **Bị giáo viên phê bình do giữ vệ sinh kém (xả rác trong lớp)**: -20 điểm / buổi

### 3. Tác phong, nề nếp học sinh
- **Vi phạm tác phong**: Không đeo bảng tên, trang điểm lòe loẹt, sai đồng phục, đi dép lê, tóc không gọn gàng/nhuộm tóc, nam không đóng thùng, nam đeo khuyên tai: -10 điểm / 1 hs
- **Ăn quà vặt trong lớp, cắn hạt dưa, nhai kẹo cao su, xả rác khuôn viên**: -10 điểm / 1 hs
- **Sử dụng điện thoại trong buổi học không đúng quy định**: -20 điểm / 1 hs
- **Học sinh đánh nhau, vô lễ; hút thuốc lá, uống rượu bia tới trường**: -30 điểm / 1 hs
- **Mang quẹt lửa, dao, kéo, đồ sắc nhọn đến trường**: -20 điểm / 1 hs
- **Nói tục, chửi thề**: -20 điểm / 1 hs
- **Vi phạm quy định xe cộ & an toàn giao thông**: Đi xe/để xe sai quy định, không gương chiếu hậu, độ chế xe, nẹt pô: -20 điểm / 1 hs
- **Sử dụng MXH bôi nhọ, lăng mạ, bóc phốt, kích bác danh dự người khác**: -20 điểm / 1 hs

### 4. Bảo quản trường lớp
- **Làm hư hỏng tài sản trong lớp (bàn, ghế, bảng, rèm, cửa...)**: -20 điểm / 1 hs
- **Không tắt quạt, điện khi ra về hoặc phòng trống**: -20 điểm
- **Ra về không đóng cửa phòng học**: -10 điểm

### 5. Hoạt động ngoại khóa & phong trào
- **Vắng có phép khi tham gia hoạt động ngoại khóa**: -5 điểm / 1 hs / lần
- **Vắng không phép trong các buổi ngoại khóa, hoạt động phong trào**: -10 điểm / 1 hs / lần
- **Tập thể xếp cuối các cuộc thi do cấp trên tổ chức**: -20 điểm / lớp

---

## Triển khai Cloudflare Workers Full-stack + Turso Database

Hệ thống được thiết lập để chạy toàn bộ cả Nuxt frontend (giao diện di động cho Ban nề nếp + Web Admin) lẫn backend API trên **Cloudflare Workers** với **Worker Static Assets**, kết nối đến **Turso Database**.

### Bước 1: Tạo Database trên Turso

1. Đăng ký/đăng nhập tài khoản tại [turso.tech](https://turso.tech) hoặc qua Turso CLI:
   ```bash
   # Cài Turso CLI (nếu chưa có)
   curl -sSfL https://get.tur.so/install.sh | bash

   # Đăng nhập và tạo database
   turso auth login
   turso db create nenepos-db
   ```
2. Lấy URL và Token kết nối:
   ```bash
   turso db show nenepos-db --url
   # Ví dụ: libsql://nenepos-db-username.turso.io

   turso db tokens create nenepos-db
   # Ví dụ chuỗi JWT token...
   ```

### Bước 2: Chạy Migration và Cập nhật Tiêu chí lên Turso

Chạy các lệnh sau từ máy của bạn (điền URL và Token Turso):

```bash
# Áp dụng bảng và cấu trúc dữ liệu lên Turso
LIBSQL_URL="libsql://nenepos-db-username.turso.io" \
LIBSQL_AUTH_TOKEN="<token-turso>" \
pnpm db:migrate

# Đồng bộ nội quy, tên trường và tiêu chí thi đua 2026-2027
LIBSQL_URL="libsql://nenepos-db-username.turso.io" \
LIBSQL_AUTH_TOKEN="<token-turso>" \
pnpm db:sync-rules

# (Tùy chọn) Seed tài khoản admin/giáo viên ban đầu
LIBSQL_URL="libsql://nenepos-db-username.turso.io" \
LIBSQL_AUTH_TOKEN="<token-turso>" \
pnpm db:seed
```

> **Tài khoản mặc định sau khi seed:**
> - `admin` / `admin123` (ADMIN)
> - `teacher1` / `teacher123` (TEACHER)
> - `discipline1` / `discipline123` (DISCIPLINE - Ban nề nếp)

### Bước 3: Cấu hình Secrets trên Cloudflare

1. Đăng nhập Cloudflare bằng Wrangler:
   ```bash
   pnpm wrangler login
   ```
2. Thêm các secret bảo mật lên Cloudflare Worker:
   ```bash
   pnpm wrangler secret put AUTH_SECRET
   # Nhập chuỗi ngẫu nhiên, ví dụ sinh bằng: openssl rand -base64 32

   pnpm wrangler secret put LIBSQL_URL
   # Nhập URL: libsql://nenepos-db-username.turso.io

   pnpm wrangler secret put LIBSQL_AUTH_TOKEN
   # Nhập token xác thực của Turso
   ```

### Bước 4: Deploy lên Cloudflare Workers

Chỉ cần chạy lệnh:
```bash
pnpm deploy:cf
```
Lệnh này sẽ tự động:
1. Build full-stack Nuxt ứng dụng theo preset `cloudflare-module` tối ưu cho Workers runtime.
2. Đẩy file tĩnh vào Worker Static Assets (`.output/public`).
3. Đẩy worker server entrypoint (`.output/server/index.mjs`) lên Cloudflare.
4. Xuất URL trực tiếp cho hệ thống (ví dụ: `https://nenepos.<subdomain>.workers.dev`).

### Kiểm tra thử nghiệm cục bộ với Wrangler

Tạo file `.dev.vars` (sao chép từ `.dev.vars.example`) chứa:
```ini
AUTH_SECRET=dev-secret-change-me-in-production
LIBSQL_URL=libsql://nenepos-db-username.turso.io
LIBSQL_AUTH_TOKEN=your-turso-token
```
Sau đó chạy:
```bash
pnpm build:cf
pnpm preview:cf
```
Wrangler sẽ giả lập môi trường Cloudflare Workers cục bộ tại `http://localhost:8787`.

---

## Chạy Local Development (Node.js & SQLite file)

Để phát triển cục bộ mà không cần kết nối mạng hoặc Turso:

```bash
pnpm install
pnpm db:reset        # Tạo database local.db đã có sẵn tiêu chí 2026 và dữ liệu mẫu
pnpm dev             # Khởi chạy server phát triển tại http://localhost:3000
```

---

## Danh mục Script

| Lệnh | Ý nghĩa |
|------|---------|
| `pnpm dev` | Khởi chạy server phát triển Nuxt |
| `pnpm build` / `pnpm build:cf` | Build ứng dụng cho Cloudflare Workers |
| `pnpm build:node` | Build cho máy chủ Node.js / Docker |
| `pnpm preview:cf` | Giả lập Cloudflare Workers bằng `wrangler dev` |
| `pnpm deploy:cf` | Build và deploy trực tiếp lên Cloudflare Workers |
| `pnpm db:sync-rules` | Đồng bộ tiêu chuẩn thi đua 2026-2027 và thông tin trường vào DB |
| `pnpm db:migrate` | Chạy migration cấu trúc bảng Drizzle |
| `pnpm db:seed` | Seed dữ liệu mẫu (học sinh, lớp, vi phạm, tài khoản) |
| `pnpm db:reset` | Reset sạch sẽ cơ sở dữ liệu và seed lại từ đầu |
| `pnpm build:mobile` | Build tĩnh giao diện web và đồng bộ assets vào Android project |
| `pnpm test` | Chạy bộ kiểm thử tự động Vitest |

---

## Tự động Build App Android APK (GitHub Actions)

Dự án đã tích hợp sẵn GitHub Workflow [`.github/workflows/build-apk.yml`](.github/workflows/build-apk.yml) để đóng gói ứng dụng di động Android (APK) cho Ban nề nếp / Giám thị sử dụng trực tiếp tính năng camera quét mã QR.

### 1. Kích hoạt tự động
- Mỗi khi push code lên nhánh `main` hoặc `master`, GitHub Actions sẽ tự động build file APK.
- Khi tạo Git Tag (ví dụ: `v1.0.0`), GitHub Actions sẽ tự động tạo **GitHub Release** và đính kèm file APK tải về.

### 2. Kích hoạt thủ công (Manual Run)
1. Vào tab **Actions** trên GitHub repository.
2. Chọn workflow **Build Android APK** ở danh sách bên trái.
3. Nhấn nút **Run workflow**.
4. *(Tùy chọn)* Nhập URL backend Cloudflare Workers (ví dụ: `https://nenepos.yourname.workers.dev`) để app kết nối trực tiếp đến backend online.
5. Nhấn **Run workflow**.

### 3. Tải file APK
- Sau khi workflow chạy xong (khoảng 2-3 phút), vào chi tiết lần chạy của workflow.
- Cuộn xuống mục **Artifacts**, nhấn vào **NeNepOS-APK** để tải file `.apk` về cài đặt trên điện thoại Android.

