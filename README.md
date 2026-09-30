# PCM Vận Hành

Hệ thống quản lý vận hành cho cửa hàng linh kiện máy tính & build PC: đơn hàng, kho, kỹ thuật, bảo hành, giao hàng và tài khoản nhân viên — trên một màn hình duy nhất.

| | |
|---|---|
| Tên dự án | `pcm-van-hanh` |
| Database production khuyến nghị | PostgreSQL |
| Cổng mặc định | `http://localhost:3000` |

Dự án Web App phát triển bằng **Next.js (App Router, TypeScript)**, chạy self-host trên máy tính công ty với Node.js và PostgreSQL cài trực tiếp trên Windows. Không cần Docker, Cloudflare D1 hay dịch vụ database bên ngoài.

---

## 1. Trục Dữ Liệu Trung Tâm & State Machine (14 Trạng Thái)

Đơn hàng di chuyển tuần tự qua nhiều bộ phận chuyên trách, mỗi bộ phận có hàng đợi riêng, quyền thao tác riêng, và ghi chú riêng.

```mermaid
flowchart TD
    draft["1. draft (Nháp KD)"] --> new["2. new (Mới tạo)"]
    new --> kho_pending["3. kho_pending (Chờ kho xuất)"]
    draft --> kho_pending
    kho_pending --> kho_done["4. kho_done (Kho đã xuất + gắn serial)"]

    kho_done -->|Có tag 'kithuat'| kithuat_pending["5. kithuat_pending (Chờ kỹ thuật)"]
    kithuat_pending --> kithuat_done["6. kithuat_done (Kỹ thuật hoàn thành)"]

    kho_done -->|Không có 'kithuat', có 'baohanh'| baohanh_pending["7. baohanh_pending (Chờ bảo hành)"]
    kithuat_done -->|Có tag 'baohanh'| baohanh_pending
    baohanh_pending --> baohanh_done["8. baohanh_done (Bảo hành xong)"]

    kho_done -->|Không có tag KT & BH| ship_pending["9. ship_pending (Chờ gán shipper)"]
    kithuat_done -->|Không có tag BH| ship_pending
    baohanh_done --> ship_pending

    ship_pending --> ship_assigned["10. ship_assigned (Đã gán shipper & km)"]
    ship_assigned --> ship_dangiao["11. ship_dangiao (Đang giao hàng)"]
    ship_dangiao --> ship_done["12. ship_done (Đã giao hàng)"]

    ship_done -->|ship_done VÀ payment_status = full| completed["13. completed (Hoàn tất)"]

    draft -.-> cancelled["14. cancelled (Đã hủy)"]
    kho_pending -.-> cancelled
    kithuat_pending -.-> cancelled
    ship_pending -.-> cancelled
    ship_dangiao -.-> cancelled

    subgraph RollbackRule["Cơ Chế Rollback Tự Động"]
        kho_done -.->|Kinh doanh sửa số lượng / linh kiện| kho_pending
        kithuat_pending -.->|Kinh doanh sửa số lượng / linh kiện| kho_pending
        ship_pending -.->|Kinh doanh sửa số lượng / linh kiện| kho_pending
        ship_dangiao -.->|Kinh doanh sửa số lượng / linh kiện| kho_pending
    end
```

### Quy tắc chuyển trạng thái & nghiệp vụ
1. **Sau `kho_done`**:
   - Nếu đơn có tag `kithuat` → sang `kithuat_pending`.
   - Nếu đơn không có tag `kithuat` nhưng có tag `baohanh` → sang `baohanh_pending`.
   - Nếu có cả 2: **Kỹ thuật xử lý trước, bảo hành xử lý sau**.
   - Nếu không có tag nào → chuyển thẳng sang `ship_pending`.
2. **Cơ chế Rollback**:
   - Khi Kinh doanh sửa đơn (đổi số lượng / thêm-bớt linh kiện) sau khi đơn đã ở `kho_done` trở đi, hệ thống **tự động set lại status về `kho_pending`** để kho chuẩn bị lại hàng.
   - Serial cũ đã gán được **lưu lại dưới dạng JSON snapshot trong `order_status_history`** (không xóa) để phục vụ kiểm đếm thu hồi và đối chiếu.
3. **Sửa / Hủy đơn**:
   - Kinh doanh có thể sửa hoặc hủy đơn ở **bất kỳ thời điểm nào trước `completed`**.
4. **Trạng thái đơn và thanh toán độc lập**:
   - `order.status` và `payment_status` ("unpaid" | "partial" | "full") là độc lập nhau. Đơn hàng có thể đang `ship_dangiao` mà chưa thanh toán đủ tiền.
   - Khi Shipper giao xong (`ship_done`) **VÀ** thanh toán đạt `full` → hệ thống tự động hoàn tất sang `completed`.

---

## 2. Vai Trò (8 Roles) & Quyền Hạn

| Vai trò | Mã role | Mô tả & Chức năng chuyên biệt |
|---|---|---|
| **Admin** | `admin` | Toàn quyền kiểm soát, xem tất cả các hàng đợi, **quản lý tài khoản người dùng**, cấu hình hệ thống |
| **Kinh doanh** | `kinh_doanh` | Tạo đơn (chọn linh kiện, tồn kho realtime, cho đặt hàng khi hết, chọn tag), chọn phương thức thanh toán, sửa/hủy đơn trước `completed` |
| **Kho** | `kho` | Hàng đợi `kho_pending`. Màn hình xuất kho với máy quét mã vạch (Keyboard Wedge mode), gán serial từng linh kiện, in phiếu xuất kho |
| **Kỹ thuật** | `ky_thuat` | Hàng đợi `kithuat_pending`. Lắp ráp, đi dây, cài Win & test máy. Tích hoàn thành + ghi chú → chuyển `kithuat_done` |
| **Quản lý kỹ thuật** | `quan_ly_ky_thuat` | **Chỉ giám sát/điều phối tiến độ, KHÔNG DUYỆT, KHÔNG CHẶN LUỒNG**, xem danh sách như kỹ thuật viên |
| **Bảo hành** | `bao_hanh` | Hàng đợi `baohanh_pending`. Kiểm tra linh kiện lỗi, xem đơn gốc liên kết (`related_order_id`), tích hoàn thành + ghi chú → chuyển `baohanh_done` |
| **Quản lý ship** | `quan_ly_ship` | Hàng đợi `ship_pending`. Chọn shipper, tính khoảng cách (Google Maps API + nhập tay override) → chuyển `ship_assigned` |
| **Shipper** | `shipper` | Hàng đợi cá nhân. Bắt đầu giao (`ship_dangiao`) → Giao xong (`ship_done`). Thu tiền COD (QR / Tiền mặt / CK) → kích hoạt `completed` khi đủ 100% |

---

## 3. Hệ Thống Đăng Nhập & Quản Lý Tài Khoản

### 3.1. Luồng đăng nhập

```mermaid
sequenceDiagram
    participant U as Người dùng
    participant B as Browser
    participant A as /api/auth/login
    participant D as PostgreSQL

    U->>B: Nhập tên đăng nhập + mật khẩu
    B->>A: POST /api/auth/login
    A->>D: SELECT user theo username (không phân biệt hoa/thường)
    D-->>A: user + password_hash
    A->>A: verifyPassword() (PBKDF2-SHA256, 210.000 vòng)
    alt Sai thông tin
        A->>D: Tăng failed_login_count (khoá 15 phút sau 5 lần)
        A->>D: Ghi auth_audit_log (login_failed)
        A-->>B: 401 + thông báo
    else Đúng
        A->>D: Xoá bộ đếm lỗi, cập nhật last_login_at
        A->>D: INSERT sessions (lưu SHA-256 của token)
        A->>D: Ghi auth_audit_log (login_success)
        A-->>B: 200 + Set-Cookie: pcm_session (httpOnly)
    end
    B->>B: Lưu phiên, điều hướng về trang được yêu cầu
```

### 3.2. Cơ chế bảo mật

| Cơ chế | Chi tiết |
|---|---|
| Mật khẩu | **PBKDF2-SHA256**, 210.000 vòng, salt ngẫu nhiên 16 byte (`lib/crypto.ts`). Không thêm dependency, chạy bằng Web Crypto trong Node.js |
| Phiên đăng nhập | Token ngẫu nhiên 32 byte, cookie `pcm_session` cờ `httpOnly` + `sameSite=lax` + `secure` (production), hạn 7 ngày |
| Lưu trữ phiên | Database **chỉ lưu SHA-256 của token** → lộ database cũng không dùng lại được cookie |
| Chống dò mật khẩu | Sai 5 lần → khoá 15 phút. Sai tên đăng nhập cũng phải băm mật khẩu giả để không lộ ra sự khác biệt thời gian phản hồi |
| Chính sách mật khẩu | **Không ràng buộc độ phức tạp.** Chỉ chặn mật khẩu rỗng và quá 128 ký tự — nhân viên dùng mật khẩu ngắn vẫn đăng nhập được |
| Đổi mật khẩu | Tự do, không bắt buộc. Mỗi tài khoản tự đổi trong menu tài khoản trên header |
| Thu hồi phiên | Đổi mật khẩu, đổi vai trò, đổi tên đăng nhập, vô hiệu hoạt → xoá **toàn bộ** phiên của tài khoản đó |
| Chống tự khoá | Admin không thể tự vô hiệu hoạt / tự hạ quyền, hệ thống luôn giữ ≥ 1 tài khoản Admin hoạt động |
| Nhật ký | Mọi thao tác đăng nhập và quản trị tài khoản được ghi vào `auth_audit_log` |
| Bảo vệ route | `middleware.ts` chặn mọi trang/API khi thiếu cookie → redirect `/login` hoặc trả 401. Xác thực thật diễn ra server-side qua `requireUser()` |

> Middleware chạy ở edge runtime nên chỉ kiểm tra **sự hiện diện** của cookie. Việc tra cứu `sessions`, kiểm tra hạn và `is_active` được thực hiện ở server (`lib/auth.ts`) cho mọi API route.

### 3.3. Tài khoản quản trị ban đầu

Không có tài khoản mẫu hoặc mật khẩu mặc định. Khi triển khai PostgreSQL lần đầu, `db:admin` tạo duy nhất tài khoản admin theo `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_USERNAME` và `ADMIN_PASSWORD` trong `.env`. Các tài khoản nhân viên được tạo sau khi đăng nhập với tư cách admin.

### 3.4. Mục "Nhân viên & Vai trò" (gộp cả quản lý tài khoản)

Một mục duy nhất trên thanh điều hướng, dùng chung cho **danh sách nhân viên** và **tài khoản đăng nhập**:

- **Mọi người đã đăng nhập** thấy: thống kê nhân sự, danh sách nhân viên kèm vai trò, tìm kiếm và lọc theo vai trò. Đây là dữ liệu thật từ bảng `users`, không phải dữ liệu mẫu.
- **Chỉ `admin`** thấy thêm: nút *Tạo tài khoản*, cột thao tác (sửa hồ sơ, đổi vai trò, đặt lại mật khẩu, khoá / mở khoá / vô hiệu hoạt) và tab *Nhật ký đăng nhập & quản trị*.

Các thao tác quản trị:

1. **Tạo tài khoản** — họ tên, tên đăng nhập (chữ thường không dấu), email, SĐT, vai trò. Bỏ trống mật khẩu → hệ thống sinh mật khẩu ngẫu nhiên, **hiển thị đúng 1 lần**.
2. **Sửa hồ sơ / đổi vai trò** — đổi tên đăng nhập hoặc hạ vai trò sẽ buộc đăng nhập lại.
3. **Khoá & mở khoá** — vô hiệu hoạt (soft delete) hoặc gỡ khoá sau khi bị khoá do sai mật khẩu.
4. **Đặt lại mật khẩu** — sinh mật khẩu ngẫu nhiên, huỷ mọi phiên đang hoạt động của tài khoản đó.
5. **Nhật ký** — xem toàn bộ đăng nhập / thao tác quản trị gần đây.

Người dùng tự đổi mật khẩu bất cứ lúc nào qua menu tài khoản trên header hoặc tab "Bảo mật" trong Cài đặt.

### 3.5. API

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| `POST` | `/api/auth/login` | công khai | Đăng nhập, trả cookie phiên |
| `GET` | `/api/auth/me` | đăng nhập | Thông tin người dùng hiện tại |
| `POST` | `/api/auth/me` | đăng nhập | Đăng xuất (xoá phiên + cookie) |
| `POST` | `/api/auth/change-password` | đăng nhập | Tự đổi mật khẩu |
| `GET` | `/api/admin/users` | `account:manage` | Danh sách tài khoản (kể cả đã khoá) |
| `POST` | `/api/admin/users` | `account:manage` | Tạo tài khoản mới |
| `PATCH` | `/api/admin/users/[id]` | `account:manage` | Sửa hồ sơ, đổi vai trò, khoá/mở khoá |
| `DELETE` | `/api/admin/users/[id]` | `account:manage` | Vô hiệu hoạt tài khoản |
| `POST` | `/api/admin/users/[id]/reset-password` | `account:manage` | Đặt lại mật khẩu |
| `GET` | `/api/admin/audit-logs` | `audit:read` | Nhật ký đăng nhập & quản trị |

### 3.6. Đặt lại mật khẩu bằng CLI

Dùng khi không còn tài khoản Admin nào đăng nhập được:

```bash
# Sinh mật khẩu ngẫu nhiên
npm run user:password -- admin

# Đặt mật khẩu cụ thể (không giới hạn độ phức tạp)
npm run user:password -- admin "123"
```

Lệnh này cũng mở khoá tài khoản, kích hoạt lại tài khoản bị vô hiệu hoạt và huỷ mọi phiên đang hoạt động.

---

## 4. Cấu Trúc Database (PostgreSQL)

- **users**: `id, name, phone, email, role, is_active, created_at` + `username, password_hash, last_login_at, failed_login_count, locked_until, updated_at`
- **sessions**: `id (sha256 token), user_id, user_agent, ip, created_at, last_seen_at, expires_at`
- **auth_audit_log**: `id, actor_user_id, actor_name, action, target_user_id, target_name, detail, ip, created_at`
- **products**: `id, sku, name, unit_price, stock_qty, category, created_at`
- **orders**: `id, invoice_no, invoice_date, customer_name, customer_phone, customer_address, customer_email, tags, note, sales_user_id, status, payment_status, related_order_id, total_amount, paid_amount, created_at, updated_at`
- **order_items**: `id, order_id, product_id, quantity, unit_price, warranty_months, serial_number, created_at`
- **order_status_history**: `id, order_id, status, changed_by_user_id, note, snapshot_serials, created_at`
- **payments**: `id, order_id, method ("qr" | "cash" | "transfer"), amount, collected_by_user_id, paid_at`
- **shipments**: `id, order_id, shipper_id, assigned_by_user_id, address, distance_km, km_source ("gg_map" | "manual"), created_at`
- **schema_migrations**: `name, applied_at` (theo dõi migration PostgreSQL đã chạy)

---

## 5. Tính Năng Nổi Bật

1. **Đăng Nhập & Quản Lý Tài Khoản Thật**:
   - Đăng nhập bằng tên đăng nhập + mật khẩu (PBKDF2, phiên server-side, cookie httpOnly).
   - Admin tạo / sửa / khoá tài khoản, đổi vai trò, đặt lại mật khẩu và theo dõi nhật ký.
2. **Quét Mã Vạch Chuẩn Keyboard Wedge**:
   - Hỗ trợ máy quét mã vạch cầm tay (USB/Bluetooth HID keyboard).
   - Tự động nhận diện mã sản phẩm, điền Serial Number và chuyển dòng tiếp theo.
   - Cung cấp các nút bấm mô phỏng quét mã vạch giả lập để kiểm thử ngay trên trình duyệt mà không cần máy quét vật lý.
3. **In Phiếu Xuất Kho & Bàn Giao Thiết Bị (Print View)**:
   - Layout A4 / Máy in nhiệt chuẩn công nghiệp với thông tin linh kiện, serials, điều khoản bảo hành và 5 chữ ký đối chiếu.
4. **Tích Hợp Google Maps Distance Matrix API**:
   - Tự động ước lượng và tính km giao hàng, hỗ trợ ô nhập tay override khi cần điều chỉnh thực tế.
5. **Cơ Chế Rollback & Snapshot Serials An Toàn**:
   - Khi kinh doanh sửa đơn sau xuất kho, toàn bộ serials cũ được đóng gói vào snapshot JSON trong lịch sử trước khi rollback về kho.

---

## 6. Hướng Dẫn Cài Đặt & Chạy Thử

### Chạy local trên Windows (không dùng Docker)

Cài Node.js 22 LTS và PostgreSQL 17 trực tiếp trên Windows. Cài PostgreSQL từ trang chính thức và ghi nhớ mật khẩu quản trị `postgres`; giữ dịch vụ PostgreSQL tự khởi động cùng Windows.

Mở PowerShell tại thư mục dự án:

```powershell
Copy-Item .env.example .env
notepad .env
npm ci
```

Trong `.env`, cấu hình `DATABASE_URL` tới PostgreSQL local, ví dụ `postgresql://pcm_app:yourpassword@localhost:5432/pcm_vanhanh`. Dùng mật khẩu chỉ gồm chữ và số để tránh cần URL-encode ký tự đặc biệt. Điền `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_USERNAME` và `ADMIN_PASSWORD`.

Mở SQL Shell (psql) từ PostgreSQL, kết nối bằng tài khoản `postgres`, rồi tạo role/database:

```sql
CREATE ROLE pcm_app LOGIN;
\password pcm_app
CREATE DATABASE pcm_vanhanh OWNER pcm_app;
\q
```

Khi nhập mật khẩu cho `pcm_app`, dùng mật khẩu khớp với `DATABASE_URL`. Trong PowerShell:

```powershell
npm run db:migrate
npm run db:admin
npm run dev
```

Mở `http://localhost:3000`; dừng server bằng `Ctrl+C`. Mọi dữ liệu nghiệp vụ được lưu trong PostgreSQL.

#### Chạy kiểm thử

`npm run test:flow` kiểm thử quy tắc chuyển trạng thái, không cần database. Kiểm thử đăng nhập cần PostgreSQL database riêng, tuyệt đối không dùng database production:

```sql
CREATE DATABASE pcm_vanhanh_test OWNER pcm_app;
```

Đặt `TEST_DATABASE_URL` trong `.env.test` trỏ tới `pcm_vanhanh_test`, sau đó chạy `npm run test:auth`. Script từ chối database không có tên kết thúc bằng `_test`.

```powershell
Copy-Item .env.test.example .env.test
notepad .env.test
npm run test:auth
```

### Hosting trên máy công ty, truy cập từ xa

Production chạy trực tiếp trên Windows: PostgreSQL lưu dữ liệu, Next.js phục vụ web và Caddy chạy native làm reverse proxy HTTPS. Nhân viên tại máy chủ mở `http://localhost:3000`; nhân viên ngoài công ty truy cập `https://<domain>` qua Internet/4G.

#### Chuẩn bị truy cập Internet

- Máy chủ phải luôn bật và có Internet hoạt động. Nhân viên truy cập từ xa cần Internet/4G; nếu đường Internet của máy công ty bị ngắt thì họ không thể kết nối.
- Cần domain/subdomain riêng; tạo DNS `A` record trỏ tới IP public của công ty. Nếu IP public thay đổi, cấu hình DDNS hoặc đăng ký IP tĩnh.
- Đặt IP LAN tĩnh cho máy chủ; trên router/firewall chỉ chuyển tiếp TCP `80` và `443` tới máy đó. Không mở cổng PostgreSQL `5432`; Next.js chỉ chạy trên `127.0.0.1:3000`.
- Mở Windows Firewall cho inbound TCP `80` và `443` (hoặc cho phép `caddy.exe` khi Windows hỏi).
- Kiểm tra nhà mạng không dùng CGNAT và cho phép port forwarding. Nếu bị CGNAT, cần yêu cầu IP public hoặc thuê VPS làm reverse proxy/tunnel. Máy chạy 24/7 một mình chưa đủ để truy cập từ Internet.
- Duy trì cập nhật hệ điều hành, UPS nếu có thể, và backup database sang thiết bị/lưu trữ khác.

#### Chạy production

Trong `.env`, đặt `DATABASE_URL`, mật khẩu admin mạnh, `PG_POOL_MAX=15` và domain public. Thay `app.example.com` trong `Caddyfile` bằng domain thật:

```caddy
app.example.com {
  encode zstd gzip
  reverse_proxy 127.0.0.1:3000
}
```

Khởi tạo hoặc cập nhật ứng dụng:

```powershell
npm ci
npm run db:migrate
npm run db:admin
npm run build
```

Mở PowerShell thứ nhất tại thư mục dự án và chạy Next.js:

```powershell
npm run start -- --hostname 127.0.0.1 --port 3000
```

Cài Caddy Windows từ `https://caddyserver.com/download`, mở PowerShell thứ hai tại thư mục dự án:

```powershell
caddy run --config .\Caddyfile
```

Khi DNS và port forwarding đúng, Caddy tự xin chứng chỉ TLS. Để chạy sau khi Windows khởi động lại, cấu hình hai lệnh trên bằng Windows Task Scheduler (trigger **At startup**), và đảm bảo dịch vụ PostgreSQL đã khởi động trước app.

#### Sao lưu và cập nhật

Sao lưu database thủ công bằng PostgreSQL client:

```powershell
New-Item -ItemType Directory -Force .\backups
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
pg_dump --host localhost --username pcm_app --dbname pcm_vanhanh --format custom --file ".\backups\pcm_vanhanh-$stamp.dump"
```

`pg_dump` sẽ hỏi mật khẩu database. Lưu thêm bản sao mã hóa ngoài máy chủ và thử khôi phục định kỳ. Khi cập nhật code, lấy source mới, chạy `npm ci`, `npm run db:migrate`, `npm run build`, rồi khởi động lại Next.js.
