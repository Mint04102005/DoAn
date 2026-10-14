# Curl Curator AI — NestJS Backend API

Hệ thống API backend cho ứng dụng gợi ý kiểu tóc và quản lý salon `curl-curator-ai`, xây dựng trên nền tảng **NestJS**, **Prisma ORM**, **PostgreSQL** và xác thực **JWT**.

---

## 1. Cấu trúc thư mục

```
Backend/
├── prisma/
│   └── schema.prisma         # Định nghĩa PostgreSQL schema (User, Salon, Hairstyle, Booking, TryOnHistory, RecommendationLog, AuditLog)
├── src/
│   ├── auth/                 # Module xác thực & phân quyền (JWT, bcrypt, Roles)
│   │   ├── decorators/       # @Roles(...), @CurrentUser()
│   │   ├── dto/              # RegisterDto, LoginDto
│   │   ├── guards/           # JwtAuthGuard, RolesGuard
│   │   ├── strategies/       # JwtStrategy
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── prisma/               # Global PrismaService & PrismaModule
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── app.module.ts         # Root module kết nối Config, Prisma, Auth
│   └── main.ts               # Khởi động ứng dụng, bật CORS (http://localhost:3000), tiền tố /api
├── .env                      # Biến môi trường
├── nest-cli.json             # Cấu hình Nest CLI
├── package.json              # Dependencies
└── tsconfig.json             # TypeScript compiler options
```

---

## 2. Hướng dẫn cài đặt & Khởi chạy

### Bước 1: Cài đặt thư viện dependencies
```bash
cd Backend
npm install
```

### Bước 2: Cấu hình cơ sở dữ liệu PostgreSQL
Mở file `.env` và kiểm tra chuỗi kết nối:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/curl_curator_db?schema=public"
JWT_SECRET="curl-curator-super-secret-key-2026"
JWT_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:3000"
```

### Bước 3: Đồng bộ Database Schema bằng Prisma
```bash
# Tạo migration và đồng bộ PostgreSQL
npx prisma migrate dev --name init

# Sinh Prisma Client
npx prisma generate
```

### Bước 4: Khởi chạy ứng dụng NestJS
```bash
# Chế độ phát triển (watch mode)
npm run start:dev

# Chế độ production
npm run build
npm run start:prod
```

Server sẽ lắng nghe tại: `http://localhost:5000/api`.

---

## 3. Danh sách Endpoints Xác thực

| Phương thức | Đường dẫn | Phân quyền | Mô tả |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Đăng ký tài khoản (hỗ trợ `role`: `USER`, `SALON_OWNER`) |
| `POST` | `/api/auth/login` | Public | Đăng nhập bằng email & password, trả về `accessToken` JWT |
| `GET` | `/api/auth/profile` | Bearer Token | Lấy thông tin tài khoản đang đăng nhập |
| `GET` | `/api/auth/admin/dashboard` | `ADMIN` | Endpoint mẫu kiểm tra bảo vệ phân quyền Admin |
| `GET` | `/api/auth/salon/management` | `SALON_OWNER` \| `ADMIN` | Endpoint mẫu kiểm tra bảo vệ phân quyền Chủ salon |
