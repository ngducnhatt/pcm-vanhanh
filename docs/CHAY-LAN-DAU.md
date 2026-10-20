# Chạy PCM Vận Hành lần đầu trên Windows + XAMPP

> Tài liệu này dành cho người **cài đặt lần đầu** trên máy Windows của công ty.
> Database dùng **MySQL/MariaDB đi kèm XAMPP**, không dùng Docker, không dùng database cloud.
>
> Kết quả cuối cùng: mở `http://localhost:3000`, đăng nhập bằng tài khoản admin vừa tạo.

---

## 0. Tóm tắt nhanh (TL;DR)

Nếu máy đã có sẵn Node.js 22 LTS và XAMPP, chỉ cần làm đúng 7 bước sau tại thư mục dự án:

```powershell
# 1. Bật MySQL trong XAMPP Control Panel
# 2. Tạo database (hỏi mật khẩu root, để trống nếu chưa đặt)
npm run db:create

# 3. Tạo file cấu hình
Copy-Item .env.example .env
notepad .env    # sửa DATABASE_URL và ADMIN_* cho đúng

# 4. Cài dependency
npm ci

# 5. Tạo bảng + tài khoản admin
npm run db:migrate
npm run db:admin

# 6. Chạy app
npm run dev
```

Mở `http://localhost:3000` → đăng nhập bằng `ADMIN_USERNAME` / `ADMIN_PASSWORD` trong `.env`.

> Lần đầu nên đọc kỹ các mục 1 → 8 để tránh các lỗi thường gặp.

---

## 1. Cần cài những gì?

| Thành phần | Phiên bản | Bắt buộc | Ghi chú |
|---|---|---:|---|
| Windows | 10/11 64-bit | ✅ | Windows Server cũng chạy được |
| **XAMPP** | 8.2.x trở lên | ✅ | Dùng **MySQL/MariaDB** đi kèm; tải tại <https://www.apachefriends.org> |
| **Node.js** | **>= 22.5.0** (khuyến nghị 22 LTS) | ✅ | Tải tại <https://nodejs.org> |
| Git | bất kỳ | ❌ | Chỉ cần nếu clone source từ kho |
| Trình soạn thảo | VS Code / Notepad++ | ❌ | Notepad mặc định cũng đủ |

Kiểm tra sau khi cài:

```powershell
node -v     # phải >= v22.5.0
npm -v
```

> **Lưu ý:** Không cài thêm một MySQL/MariaDB khác cùng lúc với XAMPP nếu cả hai cùng dùng cổng `3306`.
> Nếu máy đang có MySQL service của Windows, hãy tắt nó trước khi bật MySQL trong XAMPP (xem mục 12).

---

## 2. Bật MySQL trong XAMPP

1. Mở `C:\xampp\xampp-control.exe` (chuột phải → **Run as administrator** nếu được).
2. Ở dòng **MySQL**, bấm **Start**.
3. Đợi đến khi cột Status chuyển **Running** và cổng hiển thị `3306`.
4. (Tùy chọn) Bấm **Start** ở dòng **Apache** nếu muốn dùng phpMyAdmin.
5. Kiểm tra phpMyAdmin: mở <http://localhost/phpmyadmin>.
   - Nếu vào được: MySQL + Apache đang chạy tốt.
   - Nếu không vào được: chỉ cần MySQL là đủ để app chạy; phpMyAdmin cần Apache.

Kiểm tra nhanh bằng dòng lệnh:

```powershell
& "C:\xampp\mysql\bin\mysql.exe" -u root -e "SELECT VERSION();"
```

- Nếu hỏi mật khẩu: nhập mật khẩu `root` của bạn (mặc định XAMPP mới cài là **để trống**, chỉ nhấn Enter).
- Kết quả mong đợi: `10.4.x-MariaDB` (hoặc phiên bản MariaDB/MySQL tương đương).

> App **không cần Apache**. Apache chỉ phục vụ phpMyAdmin và các thư mục web khác của XAMPP.
> Next.js tự chạy web ở cổng `3000`.

---

## 3. Lấy source và mở PowerShell đúng thư mục

```powershell
cd C:\Users\<tên-bạn>\Desktop\code\pcm-vanhanh
```

Kiểm tra đang đúng thư mục dự án (phải thấy `package.json`):

```powershell
Get-ChildItem package.json, .env.example, migrations
```

Nếu source lấy từ Git:

```powershell
git clone <địa-chỉ-kho> pcm-vanhanh
cd pcm-vanhanh
```

---

## 4. Tạo database `pcm_vanhanh`

### Cách A — dùng script có sẵn (khuyến nghị)

```powershell
npm run db:create
```

Script sẽ:

- Hỏi mật khẩu user `root` (nhập tối đa 3 lần, để trống nếu chưa đặt mật khẩu).
- Tạo **2 database**:
  - `pcm_vanhanh` — database chính.
  - `pcm_vanhanh_test` — database riêng cho kiểm thử đăng nhập.

Kết quả mong đợi:

```text
Xong! Da co 2 database: pcm_vanhanh, pcm_vanhanh_test (utf8mb4_unicode_ci).
Buoc tiep theo: npm run db:migrate
```

### Cách B — dùng phpMyAdmin

1. Mở <http://localhost/phpmyadmin>.
2. Chọn tab **SQL**.
3. Dán toàn bộ nội dung file `scripts/create-database.sql` rồi bấm **Go**.

Hoặc chạy trực tiếp:

```sql
CREATE DATABASE IF NOT EXISTS pcm_vanhanh
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS pcm_vanhanh_test
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> Tên database phải khớp với `DATABASE_URL` ở bước 5. Mặc định là `pcm_vanhanh`.
> Không dùng lại database cũ tên khác (ví dụ `pcm_opsflow`) vì schema có thể không khớp.

---

## 5. Tạo file `.env`

### 5.1. Sao chép file mẫu

```powershell
Copy-Item .env.example .env
notepad .env
```

Nếu `.env` đã tồn tại (máy đã từng chạy), **sửa trực tiếp** file đó thay vì ghi đè, để không mất cấu hình cũ.

### 5.2. Các biến bắt buộc

```dotenv
DATABASE_URL=mysql://root:@localhost:3306/pcm_vanhanh
PG_POOL_MAX=10
GOOGLE_MAPS_API_KEY=
PUBLIC_DOMAIN=localhost

ADMIN_NAME=Administrator
ADMIN_EMAIL=admin@localhost
ADMIN_USERNAME=admin
ADMIN_PASSWORD=doi-mat-khau-nay
ADMIN_PHONE=0901234567
```

Giải thích:

| Biến | Ý nghĩa |
|---|---|
| `DATABASE_URL` | Chuỗi kết nối MySQL. Cú pháp: `mysql://user:password@host:port/database` |
| `PG_POOL_MAX` | Số connection tối đa trong pool. Tên `PG_*` là di sản, vẫn dùng cho `mysql2`. Dev dùng `10`, production có thể `15`. |
| `GOOGLE_MAPS_API_KEY` | Tùy chọn. Không có key vẫn chạy; API tính km sẽ fallback nội suy theo tên quận. |
| `PUBLIC_DOMAIN` | Chỉ dùng khi deploy qua Caddy. Dev để `localhost`. |
| `ADMIN_*` | Dùng **một lần** bởi `npm run db:admin` để tạo tài khoản admin đầu tiên. |

### 5.3. `DATABASE_URL` theo từng trường hợp

**Root không có mật khẩu (mặc định XAMPP):**

```dotenv
DATABASE_URL=mysql://root:@localhost:3306/pcm_vanhanh
```

**Root có mật khẩu, ví dụ `Abc123`:**

```dotenv
DATABASE_URL=mysql://root:Abc123@localhost:3306/pcm_vanhanh
```

**Mật khẩu có ký tự đặc biệt (`@ : / ? # % &`):**

Phải URL-encode phần mật khẩu. Ví dụ mật khẩu `P@ss#123`:

```powershell
[uri]::EscapeDataString('P@ss#123')
# Kết quả: P%40ss%231
```

Rồi dùng:

```dotenv
DATABASE_URL=mysql://root:P%40ss%231@localhost:3306/pcm_vanhanh
```

> Cách đơn giản nhất là đổi mật khẩu root sang **chỉ chữ và số** nếu được phép.

### 5.4. Lưu file đúng định dạng

- Lưu với encoding **UTF-8** (Notepad trên Windows 10/11 mặc định đã là UTF-8).
- **Không** lưu dạng `UTF-16 LE` hoặc `ANSI`.
- Không thêm dấu cách quanh dấu `=`.
- Không đặt file vào thư mục con; file phải nằm ngay tại thư mục dự án.
- **Không commit `.env`** lên Git: file chứa mật khẩu thật.

Nếu `.env` bị lỗi encoding/BOM, app sẽ báo:

```text
DATABASE_URL is required to connect to MySQL/MariaDB.
```

Khi đó hãy mở file bằng VS Code/Notepad++ và lưu lại với encoding `UTF-8` (không BOM).

---

## 6. Cài dependency

```powershell
npm ci
```

- `npm ci` cài đúng phiên bản trong `package-lock.json`, nhanh và ổn định hơn `npm install`.
- Nếu mạng công ty chặn npm, cấu hình proxy hoặc dùng registry nội bộ trước khi chạy.
- Khi xong, thư mục `node_modules` xuất hiện.

Nếu gặp lỗi `EBADENGINE`: Node.js quá cũ → cài Node.js 22 LTS rồi chạy lại.

---

## 7. Tạo bảng và tài khoản admin

### 7.1. Chạy migration

```powershell
npm run db:migrate
```

Kết quả mong đợi (lần đầu):

```text
[db] applied MySQL migration 0001_initial_schema.sql
[db] applied MySQL migration 0003_auth_accounts.sql
...
[db] applied MySQL migration 0010_foreign_keys.sql
MySQL migrations are up to date.
```

Giải thích:

- App tự đọc các file trong `migrations/` và chạy theo thứ tự.
- Migration đã chạy được ghi vào bảng `schema_migrations`, nên **chạy lại sẽ bỏ qua**, không mất dữ liệu.
- Không có file `0002` là bình thường (lịch sử dự án).
- Migration `0010` bổ sung **khoá ngoại thật** — cần thiết trên MariaDB/XAMPP.

Nếu lỗi:

| Thông báo | Nguyên nhân | Cách xử lý |
|---|---|---|
| `ECONNREFUSED 127.0.0.1:3306` | MySQL chưa chạy | Bật MySQL trong XAMPP Control Panel |
| `ER_ACCESS_DENIED_ERROR` | Sai user/mật khẩu trong `DATABASE_URL` | Sửa lại mật khẩu, nhớ URL-encode ký tự đặc biệt |
| `ER_BAD_DB_ERROR ... pcm_vanhanh` | Chưa tạo database | Làm lại bước 4 |

### 7.2. Tạo admin đầu tiên

```powershell
npm run db:admin
```

Kết quả mong đợi:

```text
Created initial administrator account "admin".
```

Lệnh này đọc `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_PHONE` từ `.env`.

- Nếu tài khoản đã tồn tại: script báo `An admin account already exists; no account data was changed.` và **không đổi mật khẩu cũ**.
- Muốn đặt lại mật khẩu admin, dùng lệnh ở mục 9.

> Mật khẩu hợp lệ theo chính sách hiện tại: từ **1 đến 128 ký tự**, không bắt buộc chữ hoa/số/ký tự đặc biệt.
> Tuy vậy, hãy dùng mật khẩu dài ít nhất 12 ký tự cho tài khoản admin.

---

## 8. Chạy ứng dụng

```powershell
npm run dev
```

Mở trình duyệt: <http://localhost:3000>

- Chưa đăng nhập → tự chuyển về `/login`.
- Đăng nhập bằng `ADMIN_USERNAME` / `ADMIN_PASSWORD` trong `.env`.
- Dừng server: `Ctrl + C` trong PowerShell.

Lần chạy đầu có thể mất 10–30 giây để Next.js biên dịch.

Nếu cổng `3000` đang bị chiếm:

```powershell
npm run dev -- -p 3001
```

Rồi mở `http://localhost:3001`.

---

## 9. Việc cần làm ngay sau lần đăng nhập đầu

1. **Đổi mật khẩu admin**
   - Bấm avatar ở góc phải trên → **Đổi mật khẩu**, hoặc vào **Cài đặt → Bảo mật**.
   - Nhập mật khẩu hiện tại và mật khẩu mới.

2. **Tạo tài khoản nhân viên**
   - Vào **Nhân sự & Vai trò**.
   - Bấm **Tạo tài khoản**, nhập họ tên / tên đăng nhập / email / SĐT / vai trò.
   - Để trống mật khẩu → hệ thống sinh mật khẩu ngẫu nhiên và **chỉ hiển thị một lần**; hãy sao chép gửi cho nhân viên.
   - Có thể gán nhiều vai trò cho một người.

3. **Nhập danh mục sản phẩm**
   - Vào **Kho linh kiện** → thêm sản phẩm thủ công, hoặc:
   ```powershell
   # Chạy thử, không ghi database
   npm run products:scrape -- --cats=cpu --pages=1 --dry-run

   # Ghi thật (ví dụ vài nhóm)
   npm run products:scrape -- --cats=cpu,mainboard,vga,ram --pages=2 --stock=10
   ```

4. **Tạo một đơn thử**
   - Vào **Đơn hàng** → **Tạo đơn**.
   - Chọn sản phẩm, số lượng, bảo hành, tag `kithuat` / `baohanh` nếu cần.
   - Đơn đầu tiên sẽ có mã `HD-001`, các đơn tiếp theo là `HD-002`, `HD-003`...
   - Thử luồng: Kho xuất → Kỹ thuật/Bảo hành → Gán ship → Giao → Thu tiền.
   - Bộ lọc ngày ở header mặc định **Hôm nay**; đổi sang **Tuần này / Tháng này / Tùy chỉnh** khi cần xem khoảng khác.
   - Thử tìm đơn bằng mã `HD-001`, bằng số điện thoại (có/không khoảng trắng) hoặc tên khách. Khi đang tìm kiếm, hệ thống tìm trên toàn bộ thời gian.

5. **Kiểm tra thông báo**
   - Chuông ở header phải hiện thông báo khi đơn chuyển trạng thái.

### Quên mật khẩu admin / không đăng nhập được

Chạy tại thư mục dự án:

```powershell
# Sinh mật khẩu ngẫu nhiên và in ra màn hình
npm run user:password -- admin

# Hoặc đặt mật khẩu cụ thể
npm run user:password -- admin "MatKhauMoi123"
```

Lệnh này cũng:

- Mở khoá tài khoản nếu đang bị khoá do sai mật khẩu.
- Kích hoạt lại tài khoản nếu từng bị vô hiệu hoạt.
- Huỷ toàn bộ phiên đăng nhập cũ.

---

## 10. Chạy lại vào những ngày sau

1. Mở **XAMPP Control Panel** → **Start** dòng **MySQL**.
2. Mở PowerShell tại thư mục dự án.
3. Chạy:

```powershell
npm run dev
```

4. Mở `http://localhost:3000`.
5. Khi không dùng nữa: `Ctrl + C` để dừng app; có thể **Stop** MySQL trong XAMPP.

Không cần chạy lại `db:migrate` / `db:admin` mỗi ngày.
Chỉ chạy lại `npm run db:migrate` khi cập nhật source có migration mới.

---

## 11. Kiểm thử và kiểm tra chất lượng

### 11.1. Test luồng nghiệp vụ (không cần database)

```powershell
npm run test:flow
```

Kiểm tra state machine 14 trạng thái, rollback, điều kiện hoàn tất đơn.

### 11.2. Test đăng nhập (cần database `_test`)

Tạo file `.env.test` từ mẫu:

```powershell
Copy-Item .env.test.example .env.test
notepad .env.test
```

Nội dung:

```dotenv
TEST_DATABASE_URL=mysql://root:@localhost:3306/pcm_vanhanh_test
```

Chạy:

```powershell
npm run test:auth
```

Script **từ chối chạy** nếu tên database không kết thúc bằng `_test` — để tránh xoá nhầm database thật.

### 11.3. Kiểm tra TypeScript và build

```powershell
npm run typecheck
npm run build
```

`npm run build` cũng chạy kiểm tra TypeScript. Build phải thành công trước khi deploy production.

---

## 12. Lỗi thường gặp và cách xử lý

### 12.1. `'mysql' is not recognized as an internal or external command`

- PowerShell chưa có `C:\xampp\mysql\bin` trong `PATH`.
- Cách nhanh: dùng `npm run db:create` (script tự thêm đường dẫn).
- Hoặc thêm tạm trong phiên PowerShell hiện tại:

```powershell
$env:Path = "C:\xampp\mysql\bin;$env:Path"
mysql --version
```

### 12.2. MySQL trong XAMPP không Start được

Kiểm tra cổng `3306` có bị chiếm:

```powershell
netstat -ano | findstr :3306
```

- Nếu có process khác (thường là MySQL service của Windows): mở `services.msc`, tìm **MySQL** / **MariaDB**, bấm **Stop** (và chuyển sang **Manual** nếu không dùng).
- Hoặc đổi cổng MySQL trong XAMPP (`Config → my.ini`, sửa `port=3307`), rồi cập nhật `DATABASE_URL` thành `...:3307/...`.
- Xem log lỗi: `C:\xampp\mysql\data\mysql_error.log`.

### 12.3. `ECONNREFUSED 127.0.0.1:3306`

- MySQL chưa chạy → bật trong XAMPP.
- Hoặc đang dùng sai cổng trong `DATABASE_URL`.
- Kiểm tra: `& "C:\xampp\mysql\bin\mysql.exe" -u root -e "SELECT 1"`.

### 12.4. `ER_ACCESS_DENIED_ERROR` / `Access denied for user 'root'`

- Sai mật khẩu trong `DATABASE_URL`.
- Thử kết nối trực tiếp:

```powershell
& "C:\xampp\mysql\bin\mysql.exe" -u root -p -e "SELECT 1"
```

- Nếu quên mật khẩu root: làm theo hướng dẫn reset mật khẩu của XAMPP/MariaDB (chạy `mysqld --skip-grant-tables`), hoặc cài lại XAMPP nếu là máy dev mới. **Không** sửa mật khẩu bằng cách xoá dữ liệu.
- Nhớ URL-encode ký tự đặc biệt trong `DATABASE_URL`.

### 12.5. `ER_BAD_DB_ERROR: Unknown database 'pcm_vanhanh'`

- Chưa tạo database → làm bước 4.
- Hoặc `DATABASE_URL` ghi sai tên database.

### 12.6. App báo `DATABASE_URL is required`

- File `.env` không nằm đúng thư mục gốc dự án.
- Hoặc `.env` bị lưu dạng UTF-16/BOM khiến dòng đầu không đọc được.
- Hoặc tên file bị đổi thành `.env.txt` (Windows ẩn phần mở rộng).
- Sửa lại file, sau đó **khởi động lại** `npm run dev`.

### 12.7. Đăng nhập báo sai mật khẩu dù `.env` đúng

- `npm run db:admin` chỉ tạo tài khoản **lần đầu**. Nếu admin đã tồn tại, mật khẩu trong `.env` **không được áp dụng lại**.
- Đặt lại mật khẩu:

```powershell
npm run user:password -- admin "MatKhauMoi123"
```

### 12.8. Cổng 3000 đang bị chiếm

```powershell
netstat -ano | findstr :3000
```

- Dừng process đang dùng cổng (nếu là app cũ), hoặc chạy app ở cổng khác:

```powershell
npm run dev -- -p 3001
```

### 12.9. `npm ci` lỗi `EUSAGE` / lockfile không khớp

`npm ci` yêu cầu `package.json` và `package-lock.json` khớp nhau.

```powershell
npm install
npm ci
```

Nếu vẫn lỗi, xoá `node_modules` rồi chạy lại `npm ci` (không xoá `package-lock.json`).

### 12.10. Tiếng Việt bị lỗi font / dấu ?

- Database phải là `utf8mb4` / `utf8mb4_unicode_ci` (script tạo DB đã đúng).
- File `.env` lưu UTF-8.
- Trình duyệt để UTF-8 (mặc định).
- Nếu database cũ tạo sai charset, backup rồi tạo lại database đúng charset.

### 12.11. Migration `0010_foreign_keys.sql` báo lỗi khoá ngoại

- Thường do dữ liệu cũ có bản ghi mồ côi (order trỏ tới user/product không còn tồn tại).
- Với máy dev mới: có thể xoá database và làm lại từ bước 4:

```sql
DROP DATABASE pcm_vanhanh;
CREATE DATABASE pcm_vanhanh CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

- Với dữ liệu thật: **backup trước**, rồi kiểm tra các bảng con:

```sql
SELECT oi.id FROM order_items oi
LEFT JOIN orders o ON o.id = oi.order_id
WHERE o.id IS NULL;

SELECT p.id FROM payments p
LEFT JOIN orders o ON o.id = p.order_id
WHERE o.id IS NULL;
```

Sửa/xoá các bản ghi mồ côi (sau khi đã backup), rồi chạy lại `npm run db:migrate`.

---

## 13. Sao lưu và khôi phục database

### 13.1. Sao lưu

```powershell
New-Item -ItemType Directory -Force .\backups | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"

& "C:\xampp\mysql\bin\mysqldump.exe" -u root -p `
  --result-file=".\backups\pcm_vanhanh-$stamp.sql" `
  pcm_vanhanh
```

- Lệnh sẽ hỏi mật khẩu root.
- Dùng `--result-file` thay vì dấu `>` của PowerShell: dấu `>` của Windows PowerShell 5.1 ghi file UTF-16, có thể làm hỏng file SQL.
- Nên copy file backup sang ổ khác / lưu trữ ngoài máy và thử khôi phục định kỳ.

### 13.2. Khôi phục

```powershell
& "C:\xampp\mysql\bin\mysql.exe" -u root -p pcm_vanhanh `
  -e "source C:/duong/dan/backup.sql"
```

Hoặc dùng phpMyAdmin → chọn database `pcm_vanhanh` → tab **Import** → chọn file `.sql`.

> Dừng app (`Ctrl + C`) trước khi khôi phục để tránh ghi đè dữ liệu đang chạy.

---

## 14. Khi đưa lên máy chủ công ty (production)

Chỉ làm sau khi đã chạy ổn ở máy dev.

1. Sửa `.env`:
   - `ADMIN_PASSWORD` mạnh.
   - `PG_POOL_MAX=15`.
   - `PUBLIC_DOMAIN=<domain thật>`.
2. Build:

```powershell
npm ci
npm run db:migrate
npm run db:admin
npm run build
```

3. Chạy app (chỉ lắng nghe localhost):

```powershell
npm run start -- --hostname 127.0.0.1 --port 3000
```

4. Chạy Caddy reverse proxy (sửa domain trong `Caddyfile` trước):

```powershell
caddy run --config .\Caddyfile
```

5. Mở firewall cho TCP `80`/`443`; **không** mở `3306` ra Internet.
6. Cấu hình Task Scheduler chạy cả MySQL (XAMPP) và app khi khởi động máy.
7. Sao lưu database định kỳ.

### Tạo user MySQL riêng cho app (khuyến nghị)

Không nên dùng `root` cho production. Ví dụ:

```sql
CREATE USER 'pcm_app'@'localhost' IDENTIFIED BY 'MatKhauManh123';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
  ON pcm_vanhanh.* TO 'pcm_app'@'localhost';
FLUSH PRIVILEGES;
```

Rồi đổi `DATABASE_URL`:

```dotenv
DATABASE_URL=mysql://pcm_app:MatKhauManh123@localhost:3306/pcm_vanhanh
```

> App tự chạy migration khi khởi động, nên user cần các quyền `CREATE`, `ALTER`, `INDEX`, `REFERENCES` trên database đó.

---

## 15. Ghi chú bảo mật

- **Không commit `.env`** — file chứa mật khẩu database và admin.
  Nếu repo đã từng track `.env`, chạy một lần:

  ```powershell
  git rm --cached .env
  git commit -m "Remove local .env from repository"
  ```

  Sau đó kiểm tra `.gitignore` đã có `/.env` và `/.env.test`.

- Đổi mật khẩu admin ngay sau lần đăng nhập đầu.
- Không dùng mật khẩu `admin`, `123`, hoặc mật khẩu trùng tên đăng nhập cho production.
- Không mở cổng MySQL `3306` ra Internet.
- Nếu `.env` từng bị đẩy lên Git, hãy **đổi toàn bộ mật khẩu** (database + admin) vì lịch sử Git vẫn lưu giá trị cũ.

---

## 16. Checklist hoàn tất

Đánh dấu khi đã xong:

- [ ] XAMPP MySQL chạy ở cổng `3306`.
- [ ] Đã tạo database `pcm_vanhanh` (và `pcm_vanhanh_test`).
- [ ] `.env` có `DATABASE_URL` đúng, file lưu UTF-8.
- [ ] `npm ci` thành công.
- [ ] `npm run db:migrate` báo `MySQL migrations are up to date.`
- [ ] `npm run db:admin` tạo được admin.
- [ ] `http://localhost:3000` mở được trang đăng nhập.
- [ ] Đăng nhập admin thành công.
- [ ] Đã đổi mật khẩu admin.
- [ ] Đã tạo tài khoản cho nhân viên.
- [ ] Đã tạo thử một đơn hàng (mã đầu tiên là `HD-001`).
- [ ] Đã thử tìm kiếm theo mã HĐ, số điện thoại và bộ lọc ngày.
- [ ] Đã cấu hình backup.

---

## 17. Lệnh tham khảo nhanh

| Lệnh | Công dụng |
|---|---|
| `npm run dev` | Chạy app ở chế độ phát triển (`localhost:3000`) |
| `npm run build` | Build production |
| `npm run start -- --hostname 127.0.0.1 --port 3000` | Chạy bản production |
| `npm run typecheck` | Kiểm tra TypeScript |
| `npm run db:create` | Tạo database chính + database test |
| `npm run db:migrate` | Áp dụng migration còn thiếu |
| `npm run db:admin` | Tạo admin đầu tiên từ `.env` |
| `npm run user:password -- <username> [mật-khẩu]` | Đặt lại mật khẩu, mở khoá, huỷ phiên |
| `npm run test:flow` | Test state machine (không cần DB) |
| `npm run test:auth` | Test đăng nhập (cần DB `_test`) |
| `npm run products:scrape -- --dry-run` | Chạy thử đồng bộ sản phẩm |
| `npm run products:scrape` | Đồng bộ sản phẩm từ pcmarket.vn |

---

*Cập nhật lần cuối: tháng 10/2026. Nếu có thay đổi schema hoặc script, cập nhật lại tài liệu này và `README.md`.*
