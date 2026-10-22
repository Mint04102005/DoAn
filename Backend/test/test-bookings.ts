import { ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NestFactory } from '@nestjs/core';
import * as assert from 'assert';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { BookingStatus, Role, SalonStatus } from '@prisma/client';

async function runTests() {
  console.log('🧪 Bắt đầu chạy bộ kiểm thử toàn diện cho API Đặt lịch làm tóc (BE-07.1, BE-07.2, BE-07.3)...\n');

  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(0, '127.0.0.1');
  const server = app.getHttpServer();
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 5005;
  const baseUrl = `http://127.0.0.1:${port}/api/bookings`;

  const jwtService = app.get(JwtService);
  const prisma = app.get(PrismaService);

  // 1. Chuẩn bị User khách hàng 1 (Customer A)
  let customerA = await prisma.user.findFirst({ where: { email: 'customer_a_test@curator.ai' } });
  if (!customerA) {
    customerA = await prisma.user.create({
      data: {
        email: 'customer_a_test@curator.ai',
        password: 'Password@123',
        name: 'Nguyễn Văn Khách A',
        phone: '0911223344',
        gender: 'Nam',
        role: Role.USER,
      },
    });
  }

  // 2. Chuẩn bị User khách hàng 2 (Customer B - dùng kiểm tra quyền 403)
  let customerB = await prisma.user.findFirst({ where: { email: 'customer_b_test@curator.ai' } });
  if (!customerB) {
    customerB = await prisma.user.create({
      data: {
        email: 'customer_b_test@curator.ai',
        password: 'Password@123',
        name: 'Trần Thị Khách B',
        phone: '0922334455',
        gender: 'Nữ',
        role: Role.USER,
      },
    });
  }

  // 3. Chuẩn bị Chủ Salon (Salon Owner)
  let salonOwner = await prisma.user.findFirst({ where: { email: 'owner_booking_test@curator.ai' } });
  if (!salonOwner) {
    salonOwner = await prisma.user.create({
      data: {
        email: 'owner_booking_test@curator.ai',
        password: 'Password@123',
        name: 'Chủ Tiệm Booking Test',
        phone: '0933445566',
        role: Role.SALON_OWNER,
      },
    });
  }

  // 4. Chuẩn bị Salon APPROVED
  let approvedSalon = await prisma.salon.findFirst({ where: { ownerId: salonOwner.id, status: SalonStatus.APPROVED } });
  if (!approvedSalon) {
    approvedSalon = await prisma.salon.create({
      data: {
        ownerId: salonOwner.id,
        name: 'Salon Tiêu Chuẩn Approved',
        address: '100 Phố Huế, Hai Bà Trưng, Hà Nội',
        phone: '0933445566',
        rating: 4.9,
        status: SalonStatus.APPROVED,
        tag: 'Oval, Tròn',
        description: 'Chuyên cắt uốn tạo kiểu Hàn Quốc',
        images: ['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600'],
      },
    });
  }

  // 5. Chuẩn bị Salon PENDING (chưa kích hoạt)
  let pendingSalon = await prisma.salon.findFirst({ where: { ownerId: salonOwner.id, status: SalonStatus.PENDING } });
  if (!pendingSalon) {
    pendingSalon = await prisma.salon.create({
      data: {
        ownerId: salonOwner.id,
        name: 'Salon Đang Chờ Duyệt',
        address: '200 Cầu Giấy, Hà Nội',
        phone: '0933445566',
        status: SalonStatus.PENDING,
      },
    });
  }

  // 6. Chuẩn bị Admin
  let adminUser = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: 'admin_booking_test@curator.ai',
        password: 'Password@123',
        name: 'Admin Booking Test',
        role: Role.ADMIN,
      },
    });
  }

  // JWT Tokens
  const customerAToken = jwtService.sign({ sub: customerA.id, email: customerA.email, role: 'USER' });
  const customerBToken = jwtService.sign({ sub: customerB.id, email: customerB.email, role: 'USER' });
  const ownerToken = jwtService.sign({ sub: salonOwner.id, email: salonOwner.email, role: 'SALON_OWNER' });
  const adminToken = jwtService.sign({ sub: adminUser.id, email: adminUser.email, role: 'ADMIN' });

  let passedCount = 0;
  let failedCount = 0;

  async function testCase(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passedCount++;
    } catch (error: any) {
      console.error(`❌ [FAIL] ${name}`);
      console.error(`   Lý do:`, error.message || error);
      failedCount++;
    }
  }

  let createdBookingId = 0;

  try {
    // =========================================================================
    // BE-07.1: API Tạo đơn đặt lịch hẹn làm tóc mới (POST /api/bookings)
    // =========================================================================

    // 1. Không có JWT -> 401 Unauthorized
    await testCase('1. POST /api/bookings không có JWT -> HTTP 401 Unauthorized', async () => {
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salonId: approvedSalon.id,
          bookingDate: new Date(Date.now() + 86400000).toISOString(),
          notes: 'Uốn tóc layer',
        }),
      });
      assert.strictEqual(res.status, 401);
    });

    // 2. Chủ Salon (Role.SALON_OWNER) cố tình đặt lịch -> 403 Forbidden
    await testCase('2. POST /api/bookings với role SALON_OWNER -> HTTP 403 Forbidden (chỉ Role.USER được đặt lịch)', async () => {
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          salonId: approvedSalon.id,
          bookingDate: new Date(Date.now() + 86400000).toISOString(),
          notes: 'Uốn tóc layer',
        }),
      });
      assert.strictEqual(res.status, 403);
    });

    // 3. Ngày giờ đặt lịch trong quá khứ -> 400 Bad Request
    await testCase('3. POST /api/bookings thời gian trong quá khứ -> HTTP 400 Bad Request', async () => {
      const pastDate = new Date(Date.now() - 3600000).toISOString(); // 1 giờ trước
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerAToken}`,
        },
        body: JSON.stringify({
          salonId: approvedSalon.id,
          bookingDate: pastDate,
          notes: 'Uốn tóc layer',
        }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.ok(JSON.stringify(data).includes('lớn hơn thời điểm hiện tại'));
    });

    // 4. Salon không tồn tại (ID = 999999) -> 404 Not Found
    await testCase('4. POST /api/bookings salonId không tồn tại -> HTTP 404 Not Found', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerAToken}`,
        },
        body: JSON.stringify({
          salonId: 999999,
          bookingDate: futureDate,
          notes: 'Uốn tóc layer',
        }),
      });
      assert.strictEqual(res.status, 404);
    });

    // 5. Salon chưa được kích hoạt / duyệt hoạt động (PENDING) -> 404 Not Found
    await testCase('5. POST /api/bookings salon chưa được phê duyệt (status PENDING) -> HTTP 404 Not Found', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerAToken}`,
        },
        body: JSON.stringify({
          salonId: pendingSalon.id,
          bookingDate: futureDate,
          notes: 'Uốn tóc layer',
        }),
      });
      assert.strictEqual(res.status, 404);
    });

    // 6. Thiếu notes hoặc notes rỗng -> 400 Bad Request
    await testCase('6. POST /api/bookings thiếu notes -> HTTP 400 Bad Request', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerAToken}`,
        },
        body: JSON.stringify({
          salonId: approvedSalon.id,
          bookingDate: futureDate,
        }),
      });
      assert.strictEqual(res.status, 400);
    });

    // 7. Định dạng bookingDate không phải ISO 8601 -> 400 Bad Request
    await testCase('7. POST /api/bookings bookingDate sai định dạng -> HTTP 400 Bad Request', async () => {
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerAToken}`,
        },
        body: JSON.stringify({
          salonId: approvedSalon.id,
          bookingDate: '25-10-2026',
          notes: 'Cắt tóc ngắn',
        }),
      });
      assert.strictEqual(res.status, 400);
    });

    // 8. Tạo đơn đặt lịch hợp lệ -> HTTP 201, status = 'P' (PENDING)
    const validFutureDate = new Date(Date.now() + 2 * 86400000).toISOString();
    await testCase('8. POST /api/bookings thành công -> HTTP 201 Created, status mặc định là P (Chờ duyệt)', async () => {
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerAToken}`,
        },
        body: JSON.stringify({
          salonId: approvedSalon.id,
          bookingDate: validFutureDate,
          notes: 'Cắt tóc layer sóng lơi và nhuộm màu nâu hạt dẻ',
        }),
      });
      assert.strictEqual(res.status, 201);
      const resBody = await res.json();
      const b = resBody.data || resBody;
      assert.ok(b.id, 'Phải có id');
      assert.strictEqual(b.userId, customerA.id);
      assert.strictEqual(b.salonId, approvedSalon.id);
      assert.strictEqual(b.status, 'P');
      assert.strictEqual(b.notes, 'Cắt tóc layer sóng lơi và nhuộm màu nâu hạt dẻ');
      assert.ok(b.salon, 'Phải có thông tin salon');
      assert.strictEqual(b.salon.name, approvedSalon.name);
      createdBookingId = b.id;
    });

    // =========================================================================
    // BE-07.2: API Khách hàng xem danh sách lịch hẹn cá nhân (GET /api/bookings/my-bookings)
    // =========================================================================

    // 9. Không có JWT -> 401 Unauthorized
    await testCase('9. GET /api/bookings/my-bookings không có JWT -> HTTP 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/my-bookings`);
      assert.strictEqual(res.status, 401);
    });

    // 10. Customer A xem danh sách lịch hẹn của chính mình -> chỉ trả về đơn của Customer A
    await testCase('10. GET /api/bookings/my-bookings -> Trả về danh sách đơn của chính tài khoản, include thông tin Salon', async () => {
      const res = await fetch(`${baseUrl}/my-bookings`, {
        headers: {
          Authorization: `Bearer ${customerAToken}`,
        },
      });
      assert.strictEqual(res.status, 200);
      const resBody = await res.json();
      const list = Array.isArray(resBody) ? resBody : resBody.data;
      assert.ok(Array.isArray(list), 'Dữ liệu trả về phải là một mảng');
      assert.ok(list.length >= 1, 'Customer A phải có ít nhất 1 đơn vừa tạo');

      for (const item of list) {
        assert.strictEqual(item.userId, customerA.id, 'Tất cả đơn phải thuộc về Customer A');
        assert.ok(item.salon, 'Phải include thông tin salon');
        assert.ok(item.salon.name || item.salon.salonname);
      }
    });

    // 11. Customer B xem danh sách -> không nhìn thấy đơn của Customer A (Data Isolation)
    await testCase('11. GET /api/bookings/my-bookings với Customer B -> Không nhìn thấy đơn của Customer A (Data Isolation)', async () => {
      const res = await fetch(`${baseUrl}/my-bookings`, {
        headers: {
          Authorization: `Bearer ${customerBToken}`,
        },
      });
      assert.strictEqual(res.status, 200);
      const resBody = await res.json();
      const list = Array.isArray(resBody) ? resBody : resBody.data;
      assert.ok(Array.isArray(list));
      const hasBookingOfA = list.some((b: any) => b.id === createdBookingId);
      assert.strictEqual(hasBookingOfA, false, 'Customer B không được thấy đơn của Customer A');
    });

    // 12. Lọc theo status ('P') và phân trang
    await testCase('12. GET /api/bookings/my-bookings?status=P&page=1&limit=5 -> Lọc chính xác theo status và phân trang', async () => {
      const res = await fetch(`${baseUrl}/my-bookings?status=P&page=1&limit=5`, {
        headers: {
          Authorization: `Bearer ${customerAToken}`,
        },
      });
      assert.strictEqual(res.status, 200);
      const resBody = await res.json();
      const list = Array.isArray(resBody) ? resBody : resBody.data;
      assert.ok(Array.isArray(list));
      assert.ok(list.every((b: any) => b.status === 'P' || b.status === 'PENDING'));
    });

    // =========================================================================
    // BE-07.3: API Xem chi tiết một đơn đặt lịch hẹn (GET /api/bookings/:id)
    // =========================================================================

    // 13. Không có JWT -> 401 Unauthorized
    await testCase('13. GET /api/bookings/:id không có JWT -> HTTP 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/${createdBookingId}`);
      assert.strictEqual(res.status, 401);
    });

    // 14. ID không tồn tại (999999) -> 404 Not Found
    await testCase('14. GET /api/bookings/:id mã đơn không tồn tại -> HTTP 404 Not Found', async () => {
      const res = await fetch(`${baseUrl}/999999`, {
        headers: {
          Authorization: `Bearer ${customerAToken}`,
        },
      });
      assert.strictEqual(res.status, 404);
    });

    // 15. Customer B cố tình truy cập đơn của Customer A -> 403 Forbidden
    await testCase('15. GET /api/bookings/:id User khác cố tình truy cập đơn người khác -> HTTP 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/${createdBookingId}`, {
        headers: {
          Authorization: `Bearer ${customerBToken}`,
        },
      });
      assert.strictEqual(res.status, 403);
    });

    // 16. Khách hàng sở hữu đơn (Customer A) truy cập -> 200 OK
    await testCase('16. GET /api/bookings/:id Khách hàng sở hữu đơn truy cập -> HTTP 200 OK đầy đủ thông tin user & salon', async () => {
      const res = await fetch(`${baseUrl}/${createdBookingId}`, {
        headers: {
          Authorization: `Bearer ${customerAToken}`,
        },
      });
      assert.strictEqual(res.status, 200);
      const detail = await res.json();
      assert.strictEqual(detail.id, createdBookingId);
      assert.strictEqual(detail.user.id, customerA.id);
      assert.strictEqual(detail.user.name, customerA.name);
      assert.strictEqual(detail.salon.id, approvedSalon.id);
      assert.strictEqual(detail.status, 'P');
    });

    // 17. Chủ Salon nhận đơn (Salon Owner) truy cập -> 200 OK
    await testCase('17. GET /api/bookings/:id Chủ Salon nhận đơn truy cập -> HTTP 200 OK', async () => {
      const res = await fetch(`${baseUrl}/${createdBookingId}`, {
        headers: {
          Authorization: `Bearer ${ownerToken}`,
        },
      });
      assert.strictEqual(res.status, 200);
      const detail = await res.json();
      assert.strictEqual(detail.id, createdBookingId);
      assert.strictEqual(detail.salon.ownerId, salonOwner.id);
    });

    // 18. Quản trị viên (Admin) truy cập bất kỳ đơn nào -> 200 OK
    await testCase('18. GET /api/bookings/:id Quản trị viên (Admin) truy cập -> HTTP 200 OK', async () => {
      const res = await fetch(`${baseUrl}/${createdBookingId}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      assert.strictEqual(res.status, 200);
      const detail = await res.json();
      assert.strictEqual(detail.id, createdBookingId);
    });

    // Cleanup: xóa booking test
    await prisma.booking.deleteMany({ where: { id: createdBookingId } });
    console.log('🧹 Đã dọn dẹp dữ liệu kiểm thử thành công.');

  } finally {
    await app.close();
  }

  console.log(`\n========================================`);
  console.log(`KẾT QUẢ KIỂM THỬ: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log(`========================================\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error in tests:', err);
  process.exit(1);
});
