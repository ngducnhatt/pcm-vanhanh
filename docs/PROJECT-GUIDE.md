# PCM Vận Hành — Hướng Dẫn Toàn Dự Án (Docs Chi Tiết Từng File)

> Tài liệu này giải thích **toàn bộ dự án `pcm-vanhanh`**, từng file một (trừ `/node_modules`), kèm **sơ đồ luồng hoạt động** bằng Mermaid theo phong cách `README.md`.
> Đối tượng: dev mới onboard, người vận hành, người review kiến trúc.
> Ngôn ngữ: Tiếng Việt. Đường dẫn trong docs viết tương đối từ root dự án.

---

## Mục lục

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Kiến trúc tổng thể](#2-kiến-trúc-tổng-thể)
3. [Luồng hoạt động (sơ đồ)](#3-luồng-hoạt-động-sơ-đồ)
4. [Sơ đồ database](#4-sơ-đồ-database)
5. [Cấu trúc thư mục](#5-cấu-trúc-thư-mục)
6. [Giải thích chi tiết từng file](#6-giải-thích-chi-tiết-từng-file)
7. [Ma trận vai trò & quyền](#7-ma-trận-vai-trò--quyền)
8. [Biến môi trường & Scripts](#8-biến-môi-trường--scripts)
9. [Triển khai & vận hành](#9-triển-khai--vận-hành)

---

## 1. Tổng quan dự án

| Thuộc tính | Giá trị |
|---|---|
| Tên | `pcm-van-hanh` (PCM Vận Hành) |
| Mục đích | Quản lý vận hành cửa hàng linh kiện PC & build PC trên **1 màn hình**: đơn hàng, kho, kỹ thuật, bảo hành, giao hàng, tài khoản |
| Stack | **Next.js 16 App Router + TypeScript + React 19**, Tailwind CSS v4, shadcn/ui (Radix), `mysql2`, `zod`, `tsx` |
| Database production | **MySQL/MariaDB (XAMPP)** chạy trực tiếp trên Windows, không Docker, không Cloud/DBaaS |
| Cổng mặc định | `http://localhost:3000` (dev), production qua Caddy reverse proxy HTTPS |
| Auth | Tên đăng nhập + mật khẩu, hash **PBKDF2-SHA256 210.000 vòng**, session server-side, cookie `pcm_session` httpOnly |
| Trạng thái đơn | **14 trạng thái** (`draft → new → kho_pending → kho_done → kithuat/baohanh → ship_* → completed/cancelled`) |
| Vai trò | **8 roles**: `admin, kinh_doanh, kho, ky_thuat, quan_ly_ky_thuat, bao_hanh, quan_ly_ship, shipper` |

---

## 2. Kiến trúc tổng thể

```mermaid
flowchart TB
    subgraph Client["Browser (Next.js App Router MPA)"]
        LoginPage["app/login/page.tsx<br/>+ components/login-form.tsx"]
        Dashboard["app/(dashboard)/* route riêng<br/>tong-quan, don-hang, kho-linh-kien..."]
        Sidebar["components/dashboard/sidebar.tsx<br/>(Link theo href)"]
        Header["components/dashboard/header.tsx<br/>(router.push)"]
        Shell["components/dashboard/dashboard-shell.tsx<br/>guard + date filter"]
        OrdersHub["components/dashboard/sections/orders-hub.tsx<br/>+ orders/* + warehouse/* + shipping/*"]
    end

    subgraph Edge["Next.js Edge"]
        MW["middleware.ts<br/>chỉ check presence cookie"]
    end

    subgraph Server["Next.js Server (App Router API + lib)"]
        AuthAPI["app/api/auth/*<br/>login / me / change-password"]
        AdminAPI["app/api/admin/*<br/>users / audit-logs / activity"]
        OrderAPI["app/api/orders/*<br/>CRUD + status + payments<br/>+ shipment + export-warehouse"]
        ProductAPI["app/api/products/route.ts"]
        ShipAPI["app/api/shipping/distance/route.ts"]
        NotifAPI["app/api/notifications/*"]
        LibAuth["lib/auth.ts + lib/crypto.ts"]
        LibPerm["lib/permissions.ts"]
        LibSM["lib/state-machine.ts"]
        LibNotif["lib/notifications.ts"]
        LibDB["lib/db.ts (mysql2 pool)"]
    end

    subgraph Data["Dữ liệu"]
        MySQL[("MySQL/MariaDB (XAMPP)<br/>pcm_vanhanh")]
        GMaps["Google Maps Distance Matrix<br/>(tùy chọn, có fallback)"]
    end

    LoginPage --> MW
    Dashboard --> MW
    MW -->|có cookie pcm_session| AuthAPI
    MW -->|chưa có cookie| LoginPage
    OrdersHub --> OrderAPI
    Header --> NotifAPI
    OrderAPI --> LibAuth
    OrderAPI --> LibPerm
    OrderAPI --> LibSM
    OrderAPI --> LibNotif
    AuthAPI --> LibAuth
    AdminAPI --> LibAuth
    LibAuth --> LibDB
    OrderAPI --> LibDB
    LibDB --> MySQL
    ShipAPI --> GMaps
```

**Giải thích kiến trúc:**

1. **Client là MPA (multi-route)**: mỗi mục sidebar là 1 URL riêng (`/tong-quan`, `/don-hang`, `/kho-linh-kien`, `/van-hanh/*`, `/thong-bao`, `/tim-kiem`). `app/(dashboard)/layout.tsx` bọc mọi trang bằng `DashboardShell` (guard auth, sidebar, header, date filter). Route `/` chỉ `redirect("/don-hang")`. Không còn switch `useState` kiểu SPA.
2. **Middleware (Edge)** cực mỏng: chỉ kiểm tra *có hay không* cookie `pcm_session`. Không query DB ở Edge. Xác thực thật nằm ở `lib/auth.ts` (server).
3. **Server API** chia 5 nhóm: `auth`, `admin`, `orders`, `products/users/shipping`, `notifications`. Mỗi route đều gọi `requireUser()` / `requirePermission()` trước khi chạm DB.
4. **lib/** là trái tim nghiệp vụ: `crypto` (hash), `auth` (session + lockout + audit), `permissions` (RBAC), `state-machine` (luồng đơn), `notifications` (fan-out), `db` (pool + adapter kiểu D1).
5. **MySQL** là source of truth duy nhất. Google Maps chỉ dùng để tính km, thất bại thì fallback nội suy theo tên quận.

---

## 3. Luồng hoạt động (sơ đồ)

### 3.1. Vòng đời request (từ click đến DB)

```mermaid
sequenceDiagram
    participant U as User / Component
    participant M as middleware.ts
    participant R as API Route
    participant A as lib/auth.ts
    participant P as lib/permissions.ts
    participant S as lib/state-machine.ts
    participant D as lib/db.ts → MySQL
    participant N as lib/notifications.ts

    U->>M: fetch + Cookie: pcm_session
    alt Thiếu cookie
        M-->>U: page → redirect /login?next=...<br/>api → 401 JSON
    else Có cookie
        M->>R: cho qua (chưa verify)
        R->>A: requireUser() / requirePermission()
        A->>D: SELECT sessions JOIN users/user_roles<br/>check expiry + is_active
        alt Session sai/hết hạn/bị khóa
            A-->>U: 401 + xóa cookie
        else Hợp lệ
            R->>P: can(roles, permission)
            alt Không đủ quyền
                R-->>U: 403
            else Đủ quyền
                R->>S: kiểm tra chuyển trạng thái<br/>canPerformAction / requiresRollbackToKho
                R->>D: SELECT/INSERT/UPDATE ...<br/>(có transaction nếu multi-write)
                R->>N: notifyOrderEvent() (best-effort)
                R-->>U: 200 JSON
            end
        end
    end
```

### 3.2. Luồng đăng nhập (tóm lại từ README §3.1 + code thật)

```mermaid
sequenceDiagram
    participant U as Người dùng
    participant B as Browser (login-form.tsx)
    participant A as POST /api/auth/login
    participant L as lib/auth.ts authenticate()
    participant D as MySQL

    U->>B: Nhập username + password
    B->>A: POST {username, password}
    A->>D: SELECT users WHERE LOWER(username)=?
    D-->>A: user + password_hash + lock info
    A->>A: verifyPassword() PBKDF2 210k vòng<br/>(sai username vẫn băm giả chống timing-leak)
    alt Sai (hoặc tài khoản bị khóa)
        A->>D: failed_login_count++ (khóa 15p sau 5 lần)<br/>INSERT auth_audit_log login_failed
        A-->>B: 401 {reason, lockedUntil}
    else Đúng
        A->>D: reset failed_login_count, last_login_at<br/>INSERT sessions (chỉ lưu SHA-256 token)<br/>INSERT auth_audit_log login_success
        A-->>B: 200 {user} + Set-Cookie: pcm_session (httpOnly, lax, secure nếu prod, 7 ngày)
    end
    B->>B: AuthProvider reload /api/auth/me → redirect về ?next= hoặc /
```

**Điểm bảo mật cần nhớ:** DB chỉ lưu `SHA-256(token)`, lộ DB không replay được cookie. Đổi mật khẩu / đổi username / hạ quyền / vô hiệu hóa → xóa **toàn bộ** sessions của user đó.

### 3.3. State machine đơn hàng (14 trạng thái — giữ nguyên từ README)

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

**Quy tắc code thật (`lib/state-machine.ts` + API):**

- `getNextStatusAfterKhoDone(tags)`: có `kithuat` → `kithuat_pending`; else có `baohanh` → `baohanh_pending`; else → `ship_pending`. Kỹ thuật luôn trước bảo hành.
- `requiresRollbackToKho(status)`: true với mọi status sau `kho_done` (trừ `completed/cancelled`). Khi KD sửa items → snapshot serials cũ vào `order_status_history.snapshot_serials` (JSON) rồi reset về `kho_pending`.
- `shouldCompleteOrder(status, payment_status)`: chỉ khi `ship_done + full` → `completed`. Thanh toán và trạng thái độc lập.
- Mọi chuyển trạng thái dùng `UPDATE ... WHERE status = <cũ>` (optimistic lock). Sai lệch → `409` chống double-submit.

### 3.4. Luồng nghiệp vụ end-to-end (ai làm gì, gọi API nào, mở modal nào)

```mermaid
flowchart LR
    subgraph KD["Kinh doanh"]
        C1["create-order-modal.tsx<br/>POST /api/orders"] --> Q1{"draft hay new?"}
        Q1 -->|is_draft| DRAFT["draft"]
        Q1 -->|mặc định| NEW["new / kho_pending"]
        E1["edit-order-modal.tsx<br/>PUT /api/orders/:id<br/>(có thể rollback)"]
    end

    subgraph KHO["Kho"]
        W1["export-warehouse-modal.tsx<br/>quét barcode Keyboard-Wedge<br/>POST /api/orders/:id/export-warehouse"] --> KDONE["kho_done<br/>+ serials"]
        P1["print-invoice-modal.tsx<br/>window.print() HoDonForm"]
    end

    subgraph KT["Kỹ thuật / Bảo hành"]
        K1["orders-hub: Hoàn thành KT<br/>POST /:id/status {complete_kithuat}"]
        B1["orders-hub: Hoàn thành BH<br/>POST /:id/status {complete_baohanh}"]
    end

    subgraph SHIP["Giao hàng"]
        S1["assign-shipment-modal.tsx<br/>POST /shipping/distance<br/>POST /:id/shipment"] --> ASSIGNED["ship_assigned"]
        S2["orders-hub: Bắt đầu giao<br/>POST /:id/status {start_delivery}"] --> DANGIAO["ship_dangiao"]
        S3["orders-hub: Giao xong<br/>POST /:id/status {complete_delivery}"] --> DONE["ship_done"]
        PAY["collect-payment-modal.tsx<br/>POST /:id/payments {qr/cash/transfer}"] --> FULL{"paid đủ 100%?"}
        FULL -->|ship_done + full| COMP["completed"]
        FULL -->|chưa đủ| PART["partial"]
    end

    NEW --> W1
    DRAFT -->|KD chốt| NEW
    KDONE --> K1
    K1 --> B1
    B1 --> S1
    KDONE --> S1
    E1 -. rollback .-> W1
```

### 3.5. Luồng thông báo (fan-out)

```mermaid
flowchart TD
    Mut["API mutation đơn hàng<br/>(tạo / sửa / xuất kho / đổi status / thu tiền / gán ship / hủy)"] --> Ev["notifyOrderEvent(kind, order, actor)"]
    Ev --> Map["STATUS_ROLE_MAP:<br/>new/kho_pending→kho<br/>kithuat_pending→ky_thuat<br/>baohanh_pending→bao_hanh<br/>ship_pending→quan_ly_ship<br/>ship_assigned/dangiao/done→shipper"]
    Map --> Ins["INSERT notifications<br/>(user_id, order_id, kind, title, message)<br/>best-effort, dedupe, trừ actor"]
    Ins --> Bell["header.tsx chuông + notifications-page.tsx<br/>GET /api/notifications<br/>click → pcm:open-order → orders-hub mở modal"]
```

### 3.6. Luồng deploy production (Windows + XAMPP + Caddy)

```mermaid
flowchart LR
    Dev["PowerShell: npm ci<br/>npm run db:migrate<br/>npm run db:admin<br/>npm run dev"] --> Local["http://localhost:3000<br/>MySQL XAMPP"]
    Prod["PowerShell 1: npm run start -- --hostname 127.0.0.1 --port 3000<br/>PowerShell 2: caddy run --config .\\Caddyfile"] --> Caddy["Caddy :80/:443<br/>reverse_proxy 127.0.0.1:3000<br/>tự xin TLS"]
    Caddy --> Inet["https://domain-thật<br/>(DNS A → IP public, forward 80/443, không mở 3306)"]
```

---

## 4. Sơ đồ database

```mermaid
erDiagram
    users ||--o{ user_roles : "1 user ↔ N roles"
    users ||--o{ sessions : "1 user ↔ N sessions"
    users ||--o{ orders : "sales_user_id"
    users ||--o{ payments : "collected_by"
    users ||--o{ shipments : "shipper_id / assigned_by"
    users ||--o{ auth_audit_log : "actor / target"
    users ||--o{ notifications : "nhận thông báo"
    users ||--o{ order_status_history : "changed_by"

    orders ||--o{ order_items : "1 đơn ↔ N dòng"
    products ||--o{ order_items : "1 SP ↔ N dòng"
    orders ||--o{ order_status_history : "timeline + snapshot serials"
    orders ||--o{ payments : "nhiều lần thu"
    orders ||--o{ shipments : "gán ship (upsert)"
    orders ||--o{ notifications : "theo dõi đơn"
    orders ||--o{ orders : "related_order_id (đơn BH link đơn gốc)"

    users {
        int id PK
        varchar username UK
        varchar password_hash
        varchar name
        varchar email
        varchar phone
        varchar role
        boolean is_active
        int failed_login_count
        datetime locked_until
        datetime last_login_at
    }
    sessions {
        char id PK "sha256(token)"
        int user_id FK
        varchar user_agent
        varchar ip
        datetime expires_at
    }
    products {
        varchar id PK "prd_*"
        varchar sku UK
        varchar name
        decimal unit_price
        int stock_qty
        varchar category
    }
    orders {
        int id PK
        varchar invoice_no UK "số tăng dần từ 1 (đơn cũ: HD-YYYYMMDD-XXX)"
        varchar status "14 trạng thái"
        varchar payment_status "unpaid/partial/full"
        varchar tags "JSON kithuat/baohanh/ship/thu_cu"
        int sales_user_id FK
        int related_order_id FK "đơn BH"
        decimal total_amount
        decimal paid_amount
    }
    order_items {
        int id PK
        int order_id FK
        varchar product_id FK
        int quantity
        decimal unit_price "giá server tra lại"
        int warranty_months
        varchar serial_number
    }
```

**Ghi chú bảng:** `order_status_history (order_id, status, changed_by_user_id, note, snapshot_serials JSON)`, `payments (order_id, method qr/cash/transfer, amount, collected_by_user_id)`, `shipments (order_id UK, shipper_id, address, distance_km, km_source gg_map/manual)`, `auth_audit_log (actor, action, target, detail JSON, ip)`, `notifications (user_id, order_id, kind 9 loại, is_read)`, `schema_migrations (name)`.

---

## 5. Cấu trúc thư mục

```
pcm-vanhanh/
├── app/                        # Next.js App Router (routes + UI shell)
│   ├── layout.tsx              # Root layout + AuthProvider + Toaster
│   ├── page.tsx                # Dashboard shell duy nhất (router section client)
│   ├── globals.css             # CSS THẬT đang dùng (Google Sans + dark-first)
│   ├── login/page.tsx          # Trang /login
│   └── api/                    # REST API server-side
│       ├── auth/               # login / me (logout) / change-password
│       ├── admin/              # users CRUD + reset-password + audit-logs + activity
│       ├── orders/             # CRUD + status + payments + shipment + export-warehouse
│       ├── products/           # GET search + POST tạo SP
│       ├── users/              # GET dropdown nhân sự (chặn shipper/KT/BH xem)
│       ├── shipping/distance/  # Tính km (Google Maps + fallback)
│       └── notifications/      # GET list + POST read
├── components/                 # React components
│   ├── auth-context.tsx, login-form.tsx, user-menu.tsx, change-password-dialog.tsx, theme-provider.tsx
│   ├── dashboard/              # Shell + sections + charts + widgets
│   │   ├── sidebar.tsx, header.tsx
│   │   ├── sections/           # orders-hub (THẬT) + overview + employees + pipeline(kho) + deals/customers/forecasting/reports/settings (MOCK legacy)
│   │   └── charts/
│   ├── orders/                 # create/edit/details/hoadon-form
│   ├── warehouse/              # export-warehouse-modal + print-invoice-modal
│   ├── shipping/               # assign-shipment-modal + collect-payment-modal
│   └── ui/                     # ~50 primitives shadcn/Radix (button/dialog/table/...)
├── lib/                        # Nghiệp vụ lõi (không UI)
│   ├── auth.ts, crypto.ts, db.ts, permissions.ts, state-machine.ts,
│   ├── notifications.ts, nav.ts, types.ts, ui.ts, utils.ts
├── hooks/                      # use-toast.ts, use-mobile.ts
├── migrations/                 # 0001 + 0003..0009 (không có 0002) SQL tiến hóa schema
├── scripts/                    # migrate/create-admin/set-user-password/test-*/scrape/db-create/setup SQL
├── public/                     # Icon, placeholder, fonts Google Sans self-host
├── styles/globals.css          # CSS mẫu shadcn CÒN SÓT, KHÔNG được import (file chết)
├── middleware.ts               # Gate Edge (presence cookie)
├── Caddyfile, next.config.mjs, postcss.config.mjs, components.json, tsconfig.json
├── package.json, setup.ps1, pcm_vanhanh.sql, README.md, AGENTS.md, CLAUDE.md
└── .env, .env.test.example, .gitignore, next-env.d.ts
```

---

## 6. Giải thích chi tiết từng file

### 6.1. Root — config & vận hành

| File | Giải thích chi tiết |
|---|---|
| `package.json` | Khai báo `pcm-van-hanh@0.1.0`, `engines.node >=22.5.0`. Scripts: `dev/build/start/lint`, `db:create` (chạy ps1), `db:migrate`, `db:admin`, `products:scrape`, `test:flow` (không cần DB), `test:auth` (cần DB `_test`), `user:password`. Deps chính: `next@16`, `react@19`, `mysql2`, `zod`, Radix UI (~20 gói), `tailwindcss@4`, `sonner`, `recharts`, `react-hook-form`. DevDeps: `tsx` (chạy TS trực tiếp), `typescript@5`. |
| `tsconfig.json` | `strict: true`, `target ES6`, `jsx: react-jsx`, `moduleResolution: bundler` + plugin `next`. Alias `@/* → ./*`. Include toàn bộ `**/*.ts(x)`, exclude `node_modules`. Build sẽ fail nếu lỗi type (kết hợp `next.config.mjs` không ignore). |
| `next.config.mjs` | Cấu hình tối giản: **không** bỏ qua lỗi TypeScript (`ignoreBuildErrors: false`), `images.unoptimized: true` để khỏi cần Image Optimization server khi self-host. Không có rewrite/headers phức tạp. |
| `postcss.config.mjs` | Chỉ đăng ký `@tailwindcss/postcss` (Tailwind v4). Gói `autoprefixer` vẫn còn trong deps nhưng không dùng trực tiếp. |
| `components.json` | Cấu hình shadcn/ui: style `new-york`, `rsc: true`, `baseColor: neutral`, dùng CSS variables, alias `components/utils/ui/lib/hooks`, icon `lucide`, CSS entry `app/globals.css`. CLI shadcn đọc file này khi add component mới. |
| `Caddyfile` | Template reverse proxy mẫu `app.example.com → 127.0.0.1:3000` + `encode zstd gzip`. Khi deploy thật phải sửa domain. Caddy tự xin TLS khi DNS + forward 80/443 đúng. |
| `middleware.ts` | Gate Edge duy nhất. `config.matcher` loại trừ `_next/static`, ảnh, fonts. Logic: có cookie + vào `/login` → redirect `/`; chưa cookie + `/api/*` (trừ `/api/auth/login`) → `401`; chưa cookie + page → redirect `/login?next=...`. **Không** verify DB ở đây — việc đó do `requireUser()` làm. |
| `.gitignore` | Bỏ qua `node_modules`, `.next/out/build/backups`, log npm/yarn/pnpm, `.vercel`, và `next-env.d.ts` (file gen). Lưu ý: `.env` chứa bí mật nên không commit (repo hiện tại có `.env` local là ngoại lệ môi trường dev). |
| `next-env.d.ts` | File tự sinh của Next (reference `next` types + routes). Không sửa tay. |
| `setup.ps1` | Script setup 7 bước cho Windows + XAMPP: check Node/MySQL → `npm ci` → hỏi pass root 3 lần → tạo DB → sinh `.env` → `db:migrate` + `db:admin` → build → `npm run dev`. Nhắc đổi mật khẩu sau login đầu. |
| `README.md` | Tài liệu gốc: state machine 14 trạng thái, 8 roles, luồng login, schema DB, tính năng (barcode/print/Maps/rollback), hướng dẫn cài đặt + hosting + backup. Docs này mở rộng từ README, không thay thế. |
| `AGENTS.md` / `CLAUDE.md` | `AGENTS.md` chỉ chứa cảnh báo "This is NOT the Next.js you know" (do `next dev` tự chèn, verify tại `node_modules/next/dist/server/lib/generate-agent-files.js`). `CLAUDE.md` chỉ có 1 dòng `@AGENTS.md` (delegate). Không chứa nghiệp vụ. |
| `.env` | (Chỉ liệt kê tên, không lộ giá trị) `DATABASE_URL` (MySQL chính), `PG_POOL_MAX`, `GOOGLE_MAPS_API_KEY`, `PUBLIC_DOMAIN`, `ADMIN_NAME/ADMIN_EMAIL/ADMIN_USERNAME/ADMIN_PASSWORD/ADMIN_PHONE` (seed admin). |
| `.env.test.example` | Mẫu duy nhất `TEST_DATABASE_URL` → DB test riêng `..._test`. `test-auth-flow.ts` từ chối DB không kết thúc `_test` để tránh xóa prod. |
| `pcm_vanhanh.sql` | Dump full phpMyAdmin (~112KB, MariaDB 10.4): 12 bảng + dữ liệu thật (users/roles, orders, audit log). Dùng để backup/khôi phục nhanh, soi dữ liệu mẫu, dựng dev giống prod. **Không** dùng làm migration. |
| `package-lock.json` / `pnpm-lock.yaml` | Lockfile npm + pnpm. Dự án dùng `npm ci` (xem README/setup), `pnpm-lock` còn lại do lịch sử. Cài bằng npm để nhất quán. |

### 6.2. `app/` — shell & style

| File | Giải thích chi tiết |
|---|---|
| `app/layout.tsx` | Root Layout: export `metadata` (title/description/icons light/dark/svg/apple), preload 2 font `google-sans-vietnamese/latin.woff2`, `<html lang="vi">`, bọc `AuthProvider` + `Toaster (sonner)`, import `./globals.css`. Mọi trang đều đi qua đây nên auth + toast có mặt toàn app. |
| `app/page.tsx` | Route gốc `/`: server component chỉ `redirect("/don-hang")`. Không chứa UI/state (đã bỏ kiểu SPA switch `useState`). Guard role thật nằm ở `DashboardShell` + `middleware.ts`. |
| `app/(dashboard)/layout.tsx` | Layout dùng chung mọi trang dashboard: render `<DashboardShell>{children}</DashboardShell>`. Nhờ App Router, shell giữ sidebar/header khi chuyển route. |
| `app/(dashboard)/tong-quan/page.tsx` → `.../don-hang`, `kho-linh-kien`, `nhan-su`, `bao-cao`, `cai-dat`, `khach-hang`, `du-bao`, `thong-bao`, `tim-kiem?q=`, `van-hanh/kinh-doanh|kho|ky-thuat|bao-hanh|van-chuyen|giao-hang|thanh-toan/page.tsx` | Mỗi URL là 1 trang riêng (MPA), có `metadata.title` riêng. Trang đơn hàng dùng `OrdersHubWithDate(queue)` (đọc date filter từ shell); `/tong-quan` dùng `OverviewWithDate()`; `/tim-kiem` là client đọc `?q=`; `/thong-bao` render `NotificationsPage`. |
| `app/don-hang/[invoiceNo]/page.tsx` | **Link duy nhất của từng đơn** (`/don-hang/1`, `/don-hang/2`...): trang công khai, nhân viên đã đăng nhập xem full chi tiết, khách chưa đăng nhập nhập đúng SĐT mới xem được (hóa đơn + trạng thái + thanh toán + vận chuyển đã lược). Middleware + `AuthProvider` cho qua không đá sang `/login`. |
| `app/login/page.tsx` | Route `/login` (24 dòng): render `<LoginForm/>` căn giữa trong `Suspense` (fallback pulse). Đọc `?next=` để redirect sau login (logic nằm trong `LoginForm`). Middleware cho phép anonymous qua, đã login thì bounce về `/`. |
| `app/globals.css` | **CSS thật đang dùng** (199 dòng): import `tailwindcss/tw-animate-css`, 5 `@font-face` self-host Google Sans (+ Mono fallback về Google Sans cho dấu Việt/₫), `@custom-variant dark`, `:root/.dark` dark-first (oklch tối), `@theme inline` map tokens (`background/foreground/card/sidebar/success/warning/danger`, `font-sans/mono`), `@layer base` apply border/background. Sửa theme phải sửa file này. |
| `styles/globals.css` | **File chết/legacy** (125 dòng): mẫu shadcn light-first, font Geist, không có Google Sans/vietnamese, không có tokens `success/warning/danger`. **Không** được import ở `layout.tsx`. Giữ lại tham khảo, không ảnh hưởng runtime. |

### 6.3. `app/api/` — REST API (19 routes)

#### Auth (3 routes)

| File | Method & logic |
|---|---|
| `app/api/auth/login/route.ts` | `POST` public. Validate zod `username/password`. Gọi `authenticate()` (xử lý lockout). Fail → `401 {reason, lockedUntil}`; success → tạo session DB + `Set-Cookie pcm_session` (`httpOnly, lax, secure nếu prod`, 7 ngày) + `{success, user}`. |
| `app/api/auth/me/route.ts` | `GET` đọc session cookie → `{authenticated, user}` hoặc `401` + xóa cookie; `POST` = logout (hủy session hiện tại, audit `logout`, xóa cookie). Cả hai `no-store`. Dùng bởi `AuthProvider` để restore phiên. |
| `app/api/auth/change-password/route.ts` | `POST` tự đổi pass (đăng nhập rồi). Body `{currentPassword, newPassword}` phải khác nhau; verify lại `currentPassword` (chống session bị cướp), sai ghi audit `login_failed`. `checkPasswordPolicy` → `setUserPassword` → xóa hết sessions cũ → cấp lại session thiết bị hiện tại + audit `password_changed`. |

#### Admin (4 routes)

| File | Method & logic |
|---|---|
| `app/api/admin/users/route.ts` | Cần `account:manage` (Admin). `GET` liệt kê cả active/inactive kèm roles `GROUP_CONCAT` + login/lock info. `POST` tạo user: validate tên/username (lowercase)/email/phone/roles/is_active; bỏ trống pass → `generateToken(9)` trả 1 lần `temporaryPassword`; check trùng username/email (`409`); insert `users + user_roles`; audit `user_created`. |
| `app/api/admin/users/[id]/route.ts` | `PATCH` sửa `name/phone/email/username/roles/password/unlock`: check trùng, cấm tự hạ quyền admin của mình, giữ ≥1 admin active, thu hồi sessions nếu đổi pass/username/hạ admin; audit `password_reset/user_unlocked/role_changed/user_updated`. `DELETE` hard-delete: cấm tự xóa, cấm xóa admin cuối, đếm liên kết `orders/history/payments/shipments` (chặn nếu >0 tránh mồ côi), xóa sessions/roles/users + audit `user_deleted`. |
| `app/api/admin/users/[id]/reset-password/route.ts` | `POST` cần `account:manage`. Body tùy chọn `{password}`, không có thì sinh `generateToken(9)`. `setUserPassword` + xóa mọi sessions của nạn nhân + audit `password_reset` + trả `temporaryPassword` 1 lần. |
| `app/api/admin/audit-logs/route.ts` | Cần `audit:read`. `GET` phân trang `limit≤500/offset` từ `auth_audit_log`, parse `detail` JSON → `{logs, total}`. `DELETE ?days=1-3650 (default 90)` dọn log cũ + audit lại hành động dọn. |
| `app/api/admin/activity/route.ts` | Cần `audit:read`. `GET ?role=&from/to=&limit≤200/offset` từ `order_status_history` join `orders/users/user_roles` (lấy invoice + actor), lọc role qua `EXISTS`, lọc ngày sargable → `{items, total}` cho trang giám sát vận hành (`overview.tsx`). |

#### Orders (6 routes — lõi nghiệp vụ)

| File | Method & logic |
|---|---|
| `app/api/orders/route.ts` | `GET`: đăng nhập là được; query `status/role_queue/search/tag/payment_status/shipper_id/from/to/page/limit/scope`. Mặc định `scope=queue`: ép queue theo role thật (`getRoleQueueStatuses`), `kinh_doanh` chỉ thấy đơn mình tạo, `shipper` chỉ thấy đơn được gán; `scope=all` xem toàn công ty. Trả `{orders, page, limit}` kèm sales + shipment tóm tắt. `POST` cần `order:create`: body `customer_name/phone` bắt buộc, `items[]`, `initial_payment{method, amount}`, `is_draft`, `tags/note`; tra giá server từ `products`, validate qty/warranty, chặn cọc vượt tổng, sinh `invoice_no` là số tăng dần từ 1 (`MAX(CAST(invoice_no AS UNSIGNED))+1`, retry chống race; đơn cũ HD-ngày-XXX CAST ra 0 nên dãy mới vẫn bắt đầu từ 1), tạo đơn+items+payment+history trong transaction (`draft` hoặc `kho_pending`); audit + notify (trừ draft). |
| `app/api/orders/[id]/route.ts` | `GET` chi tiết tổng hợp `{order}` (order + items join products + history + payments + shipment join users), chỉ cần login. `PUT` cần `order:edit` + ownership (KD chỉ sửa đơn mình) + `canEditOrder` (chặn khi `completed/cancelled`): nếu đổi items mà `requiresRollbackToKho` thì snapshot serials cũ + reset `kho_pending` + xóa/chèn lại items + tính lại total/payment; luôn ghi history diff + audit + notify. `DELETE` hủy mềm: cần `order:cancel` + ownership + `canCancelOrder` (chặn `completed`); chuyển `cancelled`, xóa `shipments`, ghi history + audit + notify. |
| `app/api/orders/by-invoice/[invoiceNo]/route.ts` | `GET` tra mã hóa đơn → `{id, invoice_no}` (khớp chính xác, fallback không phân biệt hoa/thường). Trang `/don-hang/[invoiceNo]` gọi API này rồi fetch tiếp `/api/orders/[id]` lấy chi tiết đầy đủ. Chưa login → `401`. |
| `app/api/orders/track/[invoiceNo]/route.ts` | `GET` **công khai** cho khách (`?phone=`): nhân viên có session → trả `{order, staff: true}` không cần SĐT; khách thiếu SĐT → `{requirePhone: true}`, sai SĐT → `403`, **đúng SĐT → trả `{order: đầy đủ, verified: true}`** để hiện giao diện y hệt nhân viên (hóa đơn + lịch sử + thanh toán + vận chuyển). |
| `app/api/orders/[id]/status/route.ts` | `POST {action: receive_kho/complete_kithuat/complete_baohanh/start_delivery/complete_delivery, note}`. Phân quyền từng action qua `canPerformAction`. Rẽ nhánh: kho `kho_pending`; KT ghi 2 history (`kithuat_done` → `baohanh_pending`/`ship_pending` theo tags); BH tương tự; ship `ship_assigned→ship_dangiao→ship_done`. Nếu `ship_done + full` → auto `completed`. Update atomic `WHERE status=cũ` (`409` nếu lệch) + audit + notify. |
| `app/api/orders/[id]/payments/route.ts` | `POST {method: qr/cash/transfer, amount>0, note}`. Cần `order:collect_payment` + role `kinh_doanh/shipper/admin`. Chặn thu trên `cancelled/completed`. Transaction: insert `payments` → `SUM` tính lại `paid_amount/payment_status` → auto `completed` nếu đủ; ghi 1-2 history + audit + notify. Trả `{newPaidAmount, newPaymentStatus, newOrderStatus, isAutoCompleted}`. |
| `app/api/orders/[id]/shipment/route.ts` | `POST {shipper_id, address, distance_km 0-5000, km_source, note}`. Cần `order:assign_ship` (`quan_ly_ship/admin`). Validate shipper có role `shipper` + active, đơn phải `ship_pending`. Upsert `shipments`, update atomic `ship_pending→ship_assigned` (`409` nếu lệch) + history + audit + notify (tag cả shipper + sales). |
| `app/api/orders/[id]/export-warehouse/route.ts` | `POST {items: [{id, serial_number}], note}`. Cần `order:export_kho` (`kho/admin`). Bắt buộc đủ serial non-empty, khớp id/số lượng `order_items`, serial unique case-insensitive. Chỉ xuất khi `kho_pending/new`. Update serial từng dòng → `nextStatus=getNextStatusAfterKhoDone(tags)` → ghi 2 history (`kho_done` + chuyển tiếp) + notify nhóm tiếp theo. |

#### Catalog / nhân sự / ship / thông báo

| File | Method & logic |
|---|---|
| `app/api/products/route.ts` | `GET` (login): `?search=&limit 1-200` tìm `sku/name/category LIKE` → `{products}`. `POST` cần `product:manage` (Kho/Admin): zod `sku/name/unit_price≥0/stock_qty≥0/category`, check trùng `sku` (`409`), insert `prd_*` → `201 {success, product}`. |
| `app/api/users/route.ts` | `GET` dropdown nhân sự: login + chặn `shipper/bao_hanh/ky_thuat` (chống lộ PII). `?role=&limit`, join `user_roles`, chỉ `is_active=1` → `{users}` (dùng chọn shipper/sales). |
| `app/api/shipping/distance/route.ts` | `POST {destination, origin default CMT8 Q3}` (login). Có `GOOGLE_MAPS_API_KEY` → gọi Distance Matrix → `{distance_km, duration_text, source: gg_map}`; thất bại/không key → fallback nội suy theo từ khóa quận TP.HCM (2.5–18.5km + jitter) + `is_fallback: true`. |
| `app/api/notifications/route.ts` | `GET` của chính mình (`requireUser`): `?limit≤100/offset/unread=1`, lấy `notifications WHERE user_id=mình` mới nhất + đếm `unread` → `{items, unread}` (`no-store`). Dùng bởi chuông header + trang thông báo. |
| `app/api/notifications/read/route.ts` | `POST` của chính mình: `{all: true}` đánh dấu hết hoặc `{ids: string[≤100]}` theo id (luôn `AND user_id=mình` chống đánh dấu hộ). Thiếu cả hai → `400`. |

### 6.4. `lib/` — nghiệp vụ lõi (10 files)

| File | Giải thích chi tiết |
|---|---|
| `lib/auth.ts` (517 dòng) | Trung tâm xác thực/session. Exports: `authenticate()` (check `locked_until/is_active`, verify hash, tăng counter atomic, lock 15p sau 5 sai), `createSession/validateSessionToken/destroySession`, `getCurrentUser/requireUser/requirePermission`, `getUserById/ByUsername/getUserCredentialsByUsername/getAllUsers/getUsersByRole` (join `user_roles`, ẩn `password_hash`), `checkPasswordPolicy` (1–128 ký tự, không ràng buộc phức tạp), `setUserPassword` (reset lockout), `writeAuditLog` (best-effort). Session TTL 7 ngày, lưu `SHA-256(token)`. Mọi API + Server Component đều gate qua đây. |
| `lib/crypto.ts` (110 dòng) | Hash/token thuần Web Crypto (không thêm dep). `hashPassword/verifyPassword` (`pbkdf2_sha256$210000$salt$hash`, salt 16B, key 32B), `constantTimeEqual` chống timing-leak, `generateToken` (base64url), `hashToken` (SHA-256). `verifyPassword` không throw. Nền tảng cho `auth.ts`. |
| `lib/db.ts` (174 dòng) | Adapter MySQL giả interface D1/Postgres. `getDb(): PostgresDatabase`, `withTransaction(fn)`, `closeDb()`, types `PostgresStatement/PostgresDatabase` (`prepare().bind().all()/first()/run()`, `exec()`). Pool `mysql2/promise` từ `DATABASE_URL`/`PG_POOL_MAX`, `utf8mb4`, `dateStrings`. `initializeMysql()` lấy `GET_LOCK`, tạo `schema_migrations`, auto-apply `migrations/*.sql` trong transaction. `withTransaction` dùng `begin/commit/rollback` cho multi-write nguyên tử. |
| `lib/permissions.ts` (87 dòng) | Ma trận RBAC trung tâm. Type `Permission` (15 quyền: `order:create/edit/cancel/receive_kho/export_kho/complete_kithuat/complete_baohanh/assign_ship/start_delivery/complete_delivery/collect_payment` + `product:manage/report:read/audit:read/account:manage`), `ROLE_PERMISSIONS` (admin=all; `quan_ly_ky_thuat` chỉ `report:read` giám sát, không chặn luồng), `can()`, `canManageAccounts()`, `AuthError/statusFromError`. `requirePermission()` + mọi API dùng `can()` để trả 401/403 đúng. |
| `lib/state-machine.ts` (201 dòng) | Máy trạng thái đơn hàng. `hasTechnicalTag/hasWarrantyTag/hasShippingTag` (normalize không dấu + English), `getNextStatusAfterKhoDone/getNextStatusAfterKithuatDone/getNextStatusAfterBaohanhDone`, `POST_KHO_STATUSES`, `requiresRollbackToKho`, `canEditOrder/canCancelOrder` (trừ `completed/cancelled`), `shouldCompleteOrder` (`ship_done+full`), `canPerformAction` (12 action × role × status, admin bypass), `getRoleQueueStatuses` (hàng đợi mỗi role). Quyết định toàn bộ routing + rollback. |
| `lib/notifications.ts` (133 dòng) | Fan-out thông báo. `NotifyKind` (9 loại: created/edited/rollback/exported/status/payment/shipment/cancelled/completed), `notifyUsers` (insert best-effort, dedupe, trừ actor), `activeUserIdsByRole`, `STATUS_ROLE_MAP` (role phụ trách theo status mới), `notifyOrderEvent` (gom sales + shipper + roles theo status). API đơn hàng gọi sau mỗi mutation. |
| `lib/nav.ts` (147 dòng + href MPA) | Điều hướng theo role. `PRIMARY_NAV` (overview/deals/pipeline/team/reports/settings) và `OPERATION_NAV` (sale/warehouse/technical/warranty/shipping/shipper/accounting-orders) nay **mỗi mục có `href`** (`/tong-quan`, `/don-hang`, `/van-hanh/*`...). Helpers: `defaultSectionFor()`, `primaryNavFor()`, `operationNavFor()`, `canAccessSection()`, `hrefForSection()`, `sectionForPath(pathname)` (highlight sidebar + tiêu đề header), `defaultHrefFor()` (redirect sau login/guard). Sidebar + `DashboardShell` dùng để render menu Link và guard chuyển route (MPA, không còn `onSectionChange` kiểu SPA). |
| `lib/types.ts` (183 dòng) | Hợp đồng type dùng chung. `Role` (8), `OrderStatus` (14), `PaymentStatus/Method`, `KmSource`, interfaces `User/AuthUser/Product/OrderItem/OrderStatusHistory/Payment/Shipment/Order`, `ROLE_LABELS`, `STATUS_LABELS` (label+badge+tone), `PAYMENT_STATUS_LABELS`. `AuthUser` tách riêng để client import type không dính server-only. |
| `lib/ui.ts` (156 dòng) | Design system dùng chung. `Tone` (neutral/success/warning/danger/accent), `TONE_CHIP/TONE_SURFACE/TONE_TEXT/TONE_WASH`, `CHIP_BASE`, `chip()`, `ROLE_META` (label/short/icon mỗi role), `roleChip/roleLabel`, `SURFACE_CARD/FIELD_BASE/LABEL_BASE/SECTION_TITLE/SUBTITLE/TABLE_DIVIDER`. Nguyên tắc: ít viền, phân biệt bằng nền/khoảng cách. |
| `lib/utils.ts` (6 dòng) | `cn(...inputs) = twMerge(clsx(inputs))`. Gộp class Tailwind có điều kiện không xung đột. Dùng khắp UI. |

### 6.5. `components/` — UI nghiệp vụ

#### Auth / shell

| File | Giải thích chi tiết |
|---|---|
| `components/auth-context.tsx` | `AuthProvider` + `useAuth` (`currentUser/roles/isAuthenticated`). Gọi `GET /api/auth/me`, `POST login/logout/change-password`, tự redirect `/login ↔ /`. Cổng phân quyền cho toàn luồng đơn. |
| `components/login-form.tsx` | Form card căn giữa: username/password + show/hide, loading, alert lỗi. Gọi `login()` (tức `POST /api/auth/login`) rồi `router.replace(next)`. Điểm vào luồng. |
| `components/user-menu.tsx` | Dropdown avatar ở header: tên/email/role chip/`@username`. Gọi `logout()` + mở `ChangePasswordDialog`; admin thấy thêm Quản lý tài khoản. |
| `components/change-password-dialog.tsx` | Dialog 3 ô `current/new/confirm` + validate khớp client. Gọi `POST /api/auth/change-password`. Chỉ bảo mật phiên. |
| `components/theme-provider.tsx` | Wrapper mỏng `next-themes ThemeProvider`. Chỉ cấp dark/light toàn app. |

#### Orders (4 files)

| File | Giải thích chi tiết |
|---|---|
| `components/orders/create-order-modal.tsx` | Dialog fullscreen chứa `HoDonForm` editable + tìm kiếm SP, tags (`kithuat/baohanh/ship/thu_cu`), thanh toán (`unpaid/partial/full` + `qr/cash/transfer`). Gọi `GET /api/products` + `POST /api/orders` (`is_draft` cho Lưu nháp). Khởi đầu luồng (`new/draft`). |
| `components/orders/edit-order-modal.tsx` | Giống create nhưng preload từ `order`, thêm ô lý do + banner rollback nếu `requiresRollbackToKho(status)`. Gọi `GET /api/products` + `PUT /api/orders/:id`. KD/Kho/Admin sửa; đơn qua kho bị kéo về `kho_pending`. |
| `components/orders/hoadon-form.tsx` | Presentational thuần túy: mẫu `HÓA ĐƠN ĐẶT HÀNG` PCM (header Cty, khách hàng, bảng STT/SL/đơn giá/BH, số tiền bằng chữ, chữ ký). Export `orderToHoDonLines()` + đọc số tiền Việt. Dùng chung create/edit/details/export/print. Không gọi API. |
| `components/orders/order-detail-tabs.tsx` | Nội dung chi tiết dùng chung, y hệt modal nhân viên: 4 tabs Hóa đơn (`HoDonForm`) / Lịch sử (timeline + badge Rollback + snapshot serials cũ) / Thanh toán (bảng thời gian–phương thức–số tiền–người thu) / Vận chuyển (shipper, SĐT, km, nguồn km, địa chỉ). Modal và trang `/don-hang/:mã` (nhân viên) đều render component này nên hiển thị giống hệt nhau. |
| `components/orders/order-detail-page.tsx` | Khung chi tiết nội bộ (`OrderDetailPage`, helpers `orderHref()`/`copyOrderLink()`): tra `/api/orders/by-invoice/:mã` → fetch chi tiết → render header (mã + badges + Sao chép link + In) + 4 tabs (Hóa đơn/Lịch sử/Thanh toán/Vận chuyển). Dùng cho nhân viên trong trang thống nhất `/don-hang/:mã`; `orders-hub.tsx` dùng `copyOrderLink()` cho nút icon cạnh mỗi mã đơn. |
| `components/orders/order-tracking-page.tsx` | Trang thống nhất `/don-hang/:mã`: check `/api/auth/me` → nhân viên xem ngay `OrderDetailPage`; khách chưa xác thực thấy form nhập SĐT → `/api/orders/track?phone=` đúng → render **cùng `OrderDetailPage` với dữ liệu đầy đủ** (giao diện giống hệt nhân viên), sai → báo lỗi. |
| `lib/order-detail.ts` | Helper dùng chung: `fetchOrderDetail(id)` (order + items + history + payments + shipment, dùng bởi cả `[id]` và `track`), `normalizePhone()/phonesMatch()` (so khớp SĐT, đổi đầu 84/+84 về 0), `toPublicOrder()` (lược đồ rút gọn, hiện chưa dùng vì khách xác thực SĐT đã xem đầy đủ). |

#### Warehouse & shipping (4 files)

| File | Giải thích chi tiết |
|---|---|
| `components/warehouse/export-warehouse-modal.tsx` | Màn hình xuất kho: preview `HoDonForm` + ô quét barcode Keyboard-Wedge (lần 1 dò SKU → chọn dòng, lần 2 gán serial), nút mô phỏng/tự sinh serial, bảng gán serial từng line. Gọi `POST /api/orders/:id/export-warehouse`. Chuyển `new/kho_pending → kho_done`, bắt buộc đủ serial. |
| `components/warehouse/print-invoice-modal.tsx` | Preview in: toolbar In/Đóng, body `HoDonForm`. Không gọi API, dùng `window.print()`. Dùng sau xuất kho / từ OrdersHub. |
| `components/shipping/assign-shipment-modal.tsx` | Form gán shipper: chọn shipper card, địa chỉ, tính km + toggle `gg_map/manual`. Gọi `GET /api/users?role=shipper` + `POST /api/shipping/distance` + `POST /api/orders/:id/shipment`. Chuyển `ship_pending → ship_assigned`, lưu `distance_km/km_source`. |
| `components/shipping/collect-payment-modal.tsx` | Dialog thu COD: tổng/đã thu/còn thiếu, preset Thu hết/50%, chọn `qr/cash/transfer` (+ box VietQR mô phỏng), cảnh báo auto-complete khi `ship_done + thu đủ`. Gọi `POST /api/orders/:id/payments`. Có thể tự `completed`. |

#### Dashboard shell + sections

| File | Giải thích chi tiết |
|---|---|
| `components/dashboard/sidebar.tsx` | Sidebar fixed collapsible (260px/72px): logo PCM + 2 nhóm nav render bằng `<Link href={item.href}>` từ `primaryNavFor()/operationNavFor(roles)`. Active xác định bằng `activeSection` (do shell suy từ `usePathname()`). Không gọi API, lọc menu theo role. |
| `components/dashboard/header.tsx` | Header sticky: tiêu đề section (map từ `activeSection`), `DateRangePicker`, search Enter → `router.push("/tim-kiem?q=")`, chuông dropdown, `UserMenu`. Gọi `GET /api/notifications?limit=6` + `POST /api/notifications/read`, bấm thông báo → `localStorage pcm_open_order` + `router.push("/don-hang")` (OrdersHub tự mở đơn khi mount). Nút Xem tất cả → `<Link href="/thong-bao">`. |
| `components/dashboard/dashboard-shell.tsx` | Shell dùng chung MPA: guard auth (spinner khi `isLoading`, nút Đăng nhập khi chưa login, `router.replace(defaultHrefFor)` khi sai role), `activeSection = sectionForPath(pathname)`, state `sidebarCollapsed/datePreset/dateRange` + `DashboardDateContext` (`useDashboardDate()`). Render `Sidebar + Header + {children}`. Mỗi chuyển Link là 1 route App Router riêng, không còn `activeView` kiểu SPA. |
| `components/dashboard/section-wrappers.tsx` | 2 wrapper client (`OverviewWithDate`, `OrdersHubWithDate`) đọc date filter từ `useDashboardDate()` rồi truyền xuống section. Giúp page server (MPA) vẫn dùng được date của header. |
| `components/dashboard/sections/orders-hub.tsx` | **Trung tâm vận hành chính.** Banner role, tabs admin (all/kho/ky_thuat/baohanh/ship/shipper), search + lọc status/payment, bảng đơn với action theo role (Xuất / Hoàn thành KT-BH / Phân ship / Bắt đầu-Giao xong / Thu tiền / Sửa-Xóa/In). Gọi `GET /api/orders?scope=&role_queue=&...`, `POST /:id/status`, `DELETE /:id`, `GET /:id` trước khi mở modal. Điều phối cả 7 modal. |
| `components/dashboard/sections/overview.tsx` | Nhật ký Hoạt động vận hành (chỉ admin): chip lọc role + phân trang Xem thêm. Gọi `GET /api/admin/activity`. Giám sát, không thao tác đơn. |
| `components/dashboard/sections/employees.tsx` | Quản lý Nhân viên & Vai trò + 2 tabs Danh sách/Audit. Gọi `GET /api/admin/users` (admin) / `GET /api/users` (thường), `GET /api/admin/audit-logs`, `POST/PATCH/DELETE /api/admin/users/:id`. Admin tạo/sửa/khóa/xóa + `temporaryPassword`. Quyết định hàng đợi đơn mỗi role thấy. |
| `components/dashboard/sections/pipeline.tsx` | Thực chất là **Kho hàng** (tên cũ): search + lọc category + bảng SKU/tồn kho/trạng thái + form nhập SP cho `product:manage`. Gọi `GET/POST /api/products`. Cung cấp catalog cho create/edit-order. |
| `components/dashboard/sections/deals.tsx` | **MOCK/demo legacy**, không gọi API (data `deals/productCatalog` cứng, giá lẫn VND/$). Bảng sale + popup chi tiết/nhật ký giả + tạo hóa đơn local. Đã thay bằng `orders-hub`. |
| `components/dashboard/sections/customers.tsx` | **MOCK**: thẻ khách hàng US (`Acme/GlobalTech...`), health-score, tier filter local. Không gọi API, không nối đơn thật. |
| `components/dashboard/sections/forecasting.tsx` | **MOCK** dự báo doanh thu (Recharts Area/Bar, KPI, scenario, riskFactors cứng + `setTimeout` loading). Không gọi API. |
| `components/dashboard/sections/reports.tsx` | **MOCK** Giao dịch thu/chi/hoàn (`GD-240125...`), lọc local + nút Xuất báo cáo giả. Không gọi `payments` thật. |
| `components/dashboard/sections/settings.tsx` | Tabs Hồ sơ (read-only từ `currentUser`, admin mới thấy Thông báo/Tích hợp mock) + Bảo mật mở `ChangePasswordDialog`. `handleSave` chỉ `setTimeout`, không lưu thật. |
| `components/dashboard/notifications-page.tsx` | Trang Tất cả thông báo (nhóm Hôm nay/Hôm qua/Cũ hơn). Gọi `GET /api/notifications?limit=50` + `POST read`, click → đánh dấu đọc + dispatch `pcm:open-order` mở chi tiết đơn. Cầu nối thông báo → đơn. |
| `components/dashboard/search-results.tsx` | Trang kết quả tìm kiếm mock (3 dòng Đơn/Khách/Giao dịch + nút đóng). Không gọi search API thật. |
| `components/dashboard/metric-card.tsx` | Card KPI generic (`title/value/change/icon`, trend up/down). Không gọi API. |
| `components/dashboard/recent-deals.tsx` | List 5 deal mock (`Acme/TechStart...` won/pending/lost). Không gọi API. |
| `components/dashboard/top-performers.tsx` | Bảng xếp hạng 5 sale mock + trophy. Không gọi API. |
| `components/dashboard/date-range-picker.tsx` | Dropdown preset Hôm nay/3/7 ngày/Tùy chỉnh + 2 input date. Không gọi API, chỉ `onChange(preset, range)` để `orders-hub/overview` thêm `from/to`. |
| `components/dashboard/charts/revenue-chart.tsx` | AreaChart mock `revenue vs target` 12 tháng. Trang trí. |
| `components/dashboard/charts/pipeline-overview.tsx` | Progress 4 stage mock (Lead 45%...$4.8M). Không phản ánh status đơn thật. |

### 6.6. `components/ui/` — primitives shadcn/Radix (~50 files, dùng chung)

> Nhóm này là **design primitives**, không chứa nghiệp vụ PCM. Mỗi file là 1 control độc lập. Liệt kê đủ từng file để tra cứu.

| File | Vai trò |
|---|---|
| `accordion.tsx` | Accordion đóng/mở (Radix Accordion). |
| `alert.tsx` | Banner cảnh báo (variants + icon). |
| `alert-dialog.tsx` | Dialog xác nhận nguy hiểm (Xóa/Hủy đơn). |
| `aspect-ratio.tsx` | Khung giữ tỉ lệ ảnh. |
| `avatar.tsx` | Avatar + fallback chữ. |
| `badge.tsx` | Badge/chip nhỏ (dùng cho status/payment/role). |
| `breadcrumb.tsx` | Breadcrumb điều hướng. |
| `button.tsx` | Button mọi biến thể (dùng khắp modals/bảng). |
| `button-group.tsx` | Nhóm nút liền nhau. |
| `calendar.tsx` | Lịch (react-day-picker) cho date picker. |
| `card.tsx` | Card + Header/Content/Footer. |
| `carousel.tsx` | Carousel (embla). |
| `chart.tsx` | Wrapper Recharts + theme/tooltip. |
| `checkbox.tsx` | Checkbox (chọn dòng, tags). |
| `collapsible.tsx` | Vùng thu gọn. |
| `command.tsx` | Command palette (cmdk) cho search chọn SP. |
| `context-menu.tsx` | Menu chuột phải. |
| `dialog.tsx` | Dialog/modal nền cho mọi modal nghiệp vụ. |
| `drawer.tsx` | Drawer trượt (vaul) cho mobile. |
| `dropdown-menu.tsx` | Dropdown (dùng cho UserMenu, action bảng). |
| `empty.tsx` | Trạng thái rỗng (không có đơn/SP). |
| `field.tsx` | Field wrapper cho form. |
| `form.tsx` | Tích hợp react-hook-form + zod. |
| `hover-card.tsx` | Hover preview. |
| `input.tsx` | Ô nhập text/số. |
| `input-group.tsx` | Nhóm input + addon. |
| `input-otp.tsx` | Ô nhập OTP (để sẵn, chưa dùng luồng chính). |
| `item.tsx` | Item list generic. |
| `kbd.tsx` | Hiển thị phím tắt (`<kbd>`). |
| `label.tsx` | Nhãn form. |
| `menubar.tsx` | Menubar desktop. |
| `navigation-menu.tsx` | Nav menu ngang. |
| `pagination.tsx` | Phân trang (dùng cho bảng đơn/audit). |
| `popover.tsx` | Popover (dùng cho date picker, chọn shipper). |
| `progress.tsx` | Thanh tiến trình. |
| `radio-group.tsx` | Radio (chọn payment method, km source). |
| `resizable.tsx` | Panel co giãn. |
| `scroll-area.tsx` | Scrollbar tùy biến. |
| `select.tsx` | Select dropdown (lọc status/payment/role). |
| `separator.tsx` | Đường phân cách. |
| `sheet.tsx` | Sheet trượt (sidebar mobile). |
| `sidebar.tsx` | Primitives sidebar shadcn (phân biệt với `dashboard/sidebar.tsx` là sidebar nghiệp vụ dùng nó). |
| `skeleton.tsx` | Skeleton loading. |
| `slider.tsx` | Slider số. |
| `sonner.tsx` | Toaster Sonner (được `layout.tsx` mount). |
| `spinner.tsx` | Spinner loading. |
| `switch.tsx` | Công tắc (toggle draft/manual km). |
| `table.tsx` | Table (bảng đơn/SP/nhân sự). |
| `tabs.tsx` | Tabs (tabs role trong OrdersHub, tabs chi tiết đơn). |
| `textarea.tsx` | Ô ghi chú (note). |
| `toast.tsx` / `toaster.tsx` | Hệ toast cũ (Radix Toast) — song song với `sonner`; `use-toast` dùng bộ này. |
| `toggle.tsx` / `toggle-group.tsx` | Nút toggle đơn/nhóm. |
| `tooltip.tsx` | Tooltip. |
| `use-mobile.tsx` | Re-export `useIsMobile` cho nhóm ui. |
| `use-toast.ts` | Re-export toast store cho nhóm ui. |

### 6.7. `hooks/`

| File | Giải thích chi tiết |
|---|---|
| `hooks/use-toast.ts` | Store toast global (`memoryState` + `listeners`, `TOAST_LIMIT=1`, `REMOVE_DELAY` lớn). `toast()/update/dismiss` + reducer `ADD/UPDATE/DISMISS/REMOVE_TOAST`. Dùng với `ui/toast.tsx/toaster.tsx`. |
| `hooks/use-mobile.ts` | `useIsMobile()`: `matchMedia(max-width:767px)` + `innerWidth<768`, khởi tạo `undefined` rồi sync trong `useEffect`, cleanup listener. Dùng cho sidebar/modal responsive. |
| `components/ui/use-mobile.tsx` / `components/ui/use-toast.ts` | Re-export 2 hooks trên cho alias shadcn (`@/components/ui/...`). Không logic riêng. |

### 6.8. `migrations/` & `scripts/`

| File | Giải thích chi tiết |
|---|---|
| `migrations/0001_initial_schema.sql` | Dựng lõi: `users` (role đơn NOT NULL), `products`, `orders` (tags JSON, status 14, payment 3), `order_items(serial)`, `history/payments/shipments` + index cơ bản. Nền luồng kho→KT→BH→ship. |
| `migrations/0003_auth_accounts.sql` | Thêm login: mở rộng `users(username/password_hash/must_change_password/last_login/lock...)`, tạo `sessions(id=sha256)` + `auth_audit_log`. (Không có file 0002 trong repo.) |
| `migrations/0004_simplify_password.sql` | Đơn giản hóa pass: drop `must_change_password`, reset lock counters. Từ đây chấp nhận mọi pass 1–128 ký tự. |
| `migrations/0005_order_address_item_warranty.sql` | Thêm `orders.customer_address TEXT` + `order_items.warranty_months INT DEFAULT 36 CHECK≥0`. Phục vụ địa chỉ giao + BH từng linh kiện. |
| `migrations/0006_user_roles.sql` | Đa role: tạo `user_roles(user_id,role)` PK复合 + migrate `INSERT IGNORE ... SELECT id,role FROM users`. Giữ `users.role` tương thích ngược. |
| `migrations/0007_drop_role_not_null.sql` | Nới `users.role` từ `NOT NULL` → `NULL` (nguồn thật ở `user_roles`). Giữ CHECK 8 giá trị role. |
| `migrations/0008_security_indexes.sql` | Index hiệu năng (không đổi schema): `orders(invoice_date/payment_status/created_at)`, `history(created_at)`, `products(name)`. |
| `migrations/0009_notifications.sql` | Tạo `notifications(user_id/order_id/invoice_no/kind/title/message/is_read)` FK cascade + 3 index (`user`, `(user,is_read)`, `order_id`) cho chuông nhanh. |
| `scripts/migrate.ts` | Hiện là **stub**: chỉ check `DATABASE_URL` + `SELECT 1`, in `MySQL migrations are up to date`. Không tự chạy `migrations/*.sql`; tạo schema thật靠 `setup-basic.sql` hoặc chạy SQL tay (`lib/db.ts` có auto-apply khi chạy app). |
| `scripts/create-admin.ts` | Tạo admin đầu từ `ADMIN_*`: check policy + hash PBKDF2. Username/email đã tồn tại + role admin → skip; thuộc non-admin → báo lỗi (tránh ghi đè). |
| `scripts/set-user-password.ts` | CLI `npm run user:password -- <username> [passMoi]` (không truyền thì sinh ngẫu nhiên). Update hash → mở khóa/mở active → xóa sessions → audit `password_reset`. Dùng khi mất admin. |
| `scripts/test-order-flow.ts` | Unit thuần `lib/state-machine` (không cần DB): routing tags sau `kho_done`, `requiresRollbackToKho`, `shouldCompleteOrder`. Fail case nào → `exit(1)`. Chạy `npm run test:flow`. |
| `scripts/test-auth-flow.ts` | Smoke test auth toàn diện, **bắt buộc DB riêng `..._test`** qua `TEST_DATABASE_URL`. Seed 8 roles, check hash/salt/token, policy tối giản, lockout, vòng đời session, `setUserPassword`, `can()`, audit log. Chạy `npm run test:auth`. |
| `scripts/scrape-pcmarket.ts` | Đồng bộ catalog từ `pcmarket.vn` vào `products` (fetch HTML + regex `p-item/p-name/p-price`, upsert theo `sku`). Args `--cats --pages(≤50) --stock --dry-run`, delay 500–800ms, map ~80 category CPU/Main/VGA/RAM/Case/PSU/SSD/Monitor. |
| `scripts/db-create.ps1` | Chỉ tạo DB: hỏi pass root 3 lần → pipe `create-database.sql` vào `mysql`. Tạo 2 DB `pcm_vanhanh` + `pcm_vanhanh_test` (`utf8mb4_unicode_ci`). |
| `scripts/create-database.sql` | 2 lệnh `CREATE DATABASE IF NOT EXISTS` cho `pcm_vanhanh` + `pcm_vanhanh_test`. Dùng via `mysql` hoặc copy/paste phpMyAdmin. |
| `scripts/setup-basic.sql` | Dựng nhanh schema trạng thái cuối (users/user_roles/products/orders/items/history/payments/shipments/sessions/audit/notifications) + indexes + `schema_migrations` + admin mặc định. Chạy app ngay không cần migrate từng bước, không chứa dữ liệu mẫu. |

### 6.9. `public/`

| File | Giải thích chi tiết |
|---|---|
| `public/icon.svg`, `public/icon-light-32x32.png`, `public/icon-dark-32x32.png`, `public/apple-icon.png` | Bộ icon app (SVG + PNG light/dark 32px + Apple touch). Khai báo trong `app/layout.tsx metadata.icons`. |
| `public/placeholder.svg`, `public/placeholder.jpg`, `public/placeholder-logo.svg`, `public/placeholder-logo.png`, `public/placeholder-user.jpg` | Ảnh placeholder mẫu của template (logo, avatar, ảnh chung). Dùng khi thiếu ảnh thật, không ảnh hưởng nghiệp vụ. |
| `public/fonts/google-sans-*.woff2` (5 files) | Fonts self-host: `google-sans-vietnamese.woff2`, `google-sans-latin.woff2`, `google-sans-latin-ext.woff2`, `google-sans-mono-latin.woff2`, `google-sans-mono-latin-ext.woff2`. Được `app/globals.css` `@font-face` + `app/layout.tsx` preload. Đảm bảo tiếng Việt/₫ hiển thị đúng offline. |

---

## 7. Ma trận vai trò & quyền

| Quyền | admin | kinh_doanh | kho | ky_thuat | quan_ly_ky_thuat | bao_hanh | quan_ly_ship | shipper |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `order:create` (tạo đơn) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `order:edit` (sửa đơn) | ✅ | ✅* | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `order:cancel` (hủy đơn) | ✅ | ✅* | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `order:receive_kho` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `order:export_kho` (xuất + serial) | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `order:complete_kithuat` | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `order:complete_baohanh` | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `order:assign_ship` (gán shipper) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| `order:start_delivery` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `order:complete_delivery` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `order:collect_payment` (thu tiền) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `product:manage` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `report:read` / `audit:read` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `account:manage` (tài khoản) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

\* `kinh_doanh` chỉ sửa/hủy **đơn mình tạo** (ownership check ở API). `quan_ly_ky_thuat` chỉ giám sát, không duyệt/không chặn luồng. `shipper` ở `GET /api/users` bị chặn xem danh sách nhân sự.

Hàng đợi mặc định (`getRoleQueueStatuses`): `kho → [new, kho_pending]`, `ky_thuat → [kithuat_pending]`, `bao_hanh → [baohanh_pending]`, `quan_ly_ship → [ship_pending]`, `shipper → [ship_assigned cá nhân]`, `kinh_doanh → đơn mình tạo`, `admin → tất cả`.

---

## 8. Biến môi trường & Scripts

| Biến | Ý nghĩa |
|---|---|
| `DATABASE_URL` | Chuỗi kết nối MySQL chính, vd `mysql://root:pass@localhost:3306/pcm_vanhanh` (pass chỉ chữ+số để khỏi URL-encode). |
| `PG_POOL_MAX` | Số connection pool (`15` ở prod). Tên `PG_*` là di sản adapter Postgres/D1, nhưng giá trị dùng cho `mysql2` pool. |
| `GOOGLE_MAPS_API_KEY` | Key Distance Matrix để tính km. Không có → fallback nội suy, vẫn chạy. |
| `PUBLIC_DOMAIN` | Domain public cho Caddy (tham khảo). |
| `ADMIN_NAME/ADMIN_EMAIL/ADMIN_USERNAME/ADMIN_PASSWORD/ADMIN_PHONE` | Seed admin đầu (`db:admin`). Không có user mẫu/mật khẩu mặc định nào khác. |
| `TEST_DATABASE_URL` (trong `.env.test`) | DB test riêng `..._test`. Script từ chối DB không kết thúc `_test`. |

| Lệnh | Dùng khi nào |
|---|---|
| `npm run dev` | Chạy dev `localhost:3000`. |
| `npm run build` / `npm run start -- --hostname 127.0.0.1 --port 3000` | Build + chạy prod local (trước Caddy). |
| `npm run db:migrate` | Stub check kết nối (schema thật靠 `setup-basic.sql` / auto-apply ở `lib/db.ts`). |
| `npm run db:admin` | Tạo admin đầu từ `ADMIN_*`. |
| `npm run test:flow` | Test state-machine, không cần DB. |
| `npm run test:auth` | Test auth, cần `.env.test` + DB `_test`. |
| `npm run user:password -- admin ["123"]` | Reset pass khi mất admin (mở khóa + xóa sessions). |
| `npm run products:scrape` | Cào `pcmarket.vn` nạp catalog (`--dry-run` để thử). |
| `powershell -File scripts/db-create.ps1` | Chỉ tạo 2 DB (không seed). |
| `caddy run --config .\Caddyfile` | Chạy reverse proxy HTTPS (sau khi sửa domain). |

---

## 9. Triển khai & vận hành

1. **Dev Windows:** cài Node 22 LTS + XAMPP (bật Apache + MySQL) → `Copy-Item .env.example .env` (nếu có)/`notepad .env` → `npm ci` → tạo DB `pcm_vanhanh` (`utf8mb4_unicode_ci`) → `npm run db:migrate` → `npm run db:admin` → `npm run dev` → mở `localhost:3000`.
2. **Test:** tạo `pcm_vanhanh_test` → `Copy-Item .env.test.example .env.test` → điền `TEST_DATABASE_URL` → `npm run test:flow` (nhanh) + `npm run test:auth` (cần DB test).
3. **Prod máy công ty:** `.env` điền `DATABASE_URL`/pass admin mạnh/`PG_POOL_MAX=15`; sửa `Caddyfile` domain thật; `npm ci` → `db:migrate` → `db:admin` → `npm run build`; PowerShell 1 chạy `next start` bind `127.0.0.1:3000`, PowerShell 2 chạy `caddy run`; cấu hình Task Scheduler **At startup** + MySQL khởi động trước app.
4. **Mạng:** DNS `A` → IP public, router forward TCP `80/443` tới máy chủ (IP LAN tĩnh), firewall mở `80/443` (hoặc allow `caddy.exe`), **không** mở `3306` ra Internet, kiểm tra CGNAT, UPS + backup ngoài máy.
5. **Backup:** `New-Item -Force .\backups; mysqldump -u root -p pcm_vanhanh > .\backups\pcm_vanhanh-<stamp>.sql`, lưu bản mã hóa ngoài máy, thử restore định kỳ. Cập nhật code: pull → `npm ci` → `db:migrate` → `build` → restart Next.js.

---

*Hết docs. Nguồn sự thật: code trong `app/`, `lib/`, `components/`, `migrations/`, `scripts/` + `README.md`. Sơ đồ Mermaid render trực tiếp trên GitHub/VS Code.*
