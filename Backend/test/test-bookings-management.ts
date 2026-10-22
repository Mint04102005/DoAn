import { ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NestFactory } from '@nestjs/core';
import * as assert from 'assert';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { BookingStatus, Role, SalonStatus } from '@prisma/client';

async function runTests() {
  console.log('🧪 Bắt đầu chạy bộ kiểm thử toàn diện cho Quản lý Lịch hẹn (BE-07.4, BE-07.5, BE-07.6)...\n');

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
  const port = typeof address === 'object' && address ? address.port : 5006;
  const baseUrl = `http://127.0.0.1:${port}/api/bookings`;

  const jwtService = app.get(JwtService);
  const prisma = app.get(PrismaService);

  // 1. Chuẩn bị User khách hàng 1 (Customer A)
  let customerA = await prisma.user.findFirst({ where: { email: 'customer_mgmt_a@curator.ai' } });
  if (!customerA) {
    customerA = await prisma.user.create({
      data: {
        email: 'customer_mgmt_a@curator.ai',
        password: 'Password@123',
        name: 'Trần Văn Khách A',
        phone: '0988112233',
        gender: 'Nam',
        role: Role.USER,
      },
    });
  }

  // 2. Chuẩn bị User khách hàng 2 (Customer B)
  let customerB = await prisma.user.findFirst({ where: { email: 'customer_mgmt_b@curator.ai' } });
  if (!customerB) {
    customerB = await prisma.user.create({
      data: {
        email: 'customer_mgmt_b@curator.ai',
        password: 'Password@123',
        name: 'Lê Thị Khách B',
        phone: '0988223344',
        gender: 'Nữ',
        role: Role.USER,
      },
    });
  }

  // 3. Chuẩn bị Chủ Salon 1 (Owner 1)
  let salonOwner1 = await prisma.user.findFirst({ where: { email: 'owner_mgmt_1@curator.ai' } });
  if (!salonOwner1) {
    salonOwner1 = await prisma.user.create({
      data: {
        email: 'owner_mgmt_1@curator.ai',
        password: 'Password@123',
        name: 'Chủ Tiệm Quản Lý 1',
        phone: '0988334455',
        role: Role.SALON_OWNER,
      },
    });
  }

  // 4. Chuẩn bị Salon 1 thuộc Owner 1
  let salon1 = await prisma.salon.findFirst({ where: { ownerId: salonOwner1.id } });
  if (!salon1) {
    salon1 = await prisma.salon.create({
      data: {
        ownerId: salonOwner1.id,
        name: 'Salon Minh Tiệp Luxury',
        address: '88 Phố Huế, Hai Bà Trưng, Hà Nội',
        phone: '0988334455',
        rating: 4.9,
        status: SalonStatus.APPROVED,
        tag: 'Oval, Vuông',
        description: 'Chuyên tạo mẫu tóc layer chuyên nghiệp',
        images: ['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600'],
      },
    });
  }

  // 5. Chuẩn bị Chủ Salon 2 (Owner 2 - không có salon hoặc có salon khác)
  let salonOwner2 = await prisma.user.findFirst({ where: { email: 'owner_mgmt_2@curator.ai' } });
  if (!salonOwner2) {
    salonOwner2 = await prisma.user.create({
      data: {
        email: 'owner_mgmt_2@curator.ai',
        password: 'Password@123',
        name: 'Chủ Tiệm Không Có Salon',
        phone: '0988445566',
        role: Role.SALON_OWNER,
      },
    });
  }

  // 6. Chuẩn bị Salon 2 thuộc Owner 3 (để test data isolation giữa các salon)
  let salonOwner3 = await prisma.user.findFirst({ where: { email: 'owner_mgmt_3@curator.ai' } });
  if (!salonOwner3) {
    salonOwner3 = await prisma.user.create({
      data: {
        email: 'owner_mgmt_3@curator.ai',
        password: 'Password@123',
        name: 'Chủ Tiệm Salon 2',
        phone: '0988556677',
        role: Role.SALON_OWNER,
      },
    });
  }
  let salon2 = await prisma.salon.findFirst({ where: { ownerId: salonOwner3.id } });
  if (!salon2) {
    salon2 = await prisma.salon.create({
      data: {
        ownerId: salonOwner3.id,
        name: 'Salon Khác Cô Lập',
        address: '99 Cầu Giấy, Hà Nội',
        phone: '0988556677',
        rating: 4.8,
        status: SalonStatus.APPROVED,
      },
    });
  }

  // JWT Tokens
  const customerAToken = jwtService.sign({ sub: customerA.id, email: customerA.email, role: 'USER' });
  const customerBToken = jwtService.sign({ sub: customerB.id, email: customerB.email, role: 'USER' });
  const owner1Token = jwtService.sign({ sub: salonOwner1.id, email: salonOwner1.email, role: 'SALON_OWNER' });
  const owner2Token = jwtService.sign({ sub: salonOwner2.id, email: salonOwner2.email, role: 'SALON_OWNER' });

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

  // Dọn dẹp booking test cũ của test suite này nếu có
  await prisma.booking.deleteMany({
    where: {
      userId: { in: [customerA.id, customerB.id] },
    },
  });

  try {
    // =========================================================================
    // I. BE-07.4 — API KHÁCH HÀNG CHỦ ĐỘNG HỦY LỊCH HẸN (PATCH /api/bookings/:id/cancel)
    // =========================================================================

    // Tạo booking P còn hơn 2 tiếng (hẹn sau 24 tiếng)
    const bookingFutureP = await prisma.booking.create({
      data: {
        userId: customerA.id,
        salonId: salon1.id,
        bookingTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: BookingStatus.PENDING,
        notes: 'Uốn xoăn layer',
      },
    });

    // Tạo booking C còn hơn 2 tiếng (hẹn sau 10 tiếng)
    const bookingFutureC = await prisma.booking.create({
      data: {
        userId: customerA.id,
        salonId: salon1.id,
        bookingTime: new Date(Date.now() + 10 * 60 * 60 * 1000),
        status: BookingStatus.CONFIRMED,
        notes: 'Nhuộm nâu tây',
      },
    });

    // Tạo booking còn dưới 2 tiếng (ví dụ sau 1 tiếng)
    const bookingLessThan2Hours = await prisma.booking.create({
      data: {
        userId: customerA.id,
        salonId: salon1.id,
        bookingTime: new Date(Date.now() + 60 * 60 * 1000), // 1 tiếng nữa
        status: BookingStatus.CONFIRMED,
        notes: 'Gội sấy',
      },
    });

    // Tạo booking đã qua thời gian hẹn (1 tiếng trước)
    const bookingInPast = await prisma.booking.create({
      data: {
        userId: customerA.id,
        salonId: salon1.id,
        bookingTime: new Date(Date.now() - 60 * 60 * 1000), // 1 tiếng trước
        status: BookingStatus.PENDING,
        notes: 'Cắt mái',
      },
    });

    // Tạo booking trạng thái COMPLETED (D)
    const bookingCompleted = await prisma.booking.create({
      data: {
        userId: customerA.id,
        salonId: salon1.id,
        bookingTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
        status: BookingStatus.COMPLETED,
        notes: 'Cắt tóc',
      },
    });

    // Tạo booking trạng thái CANCELLED (X)
    const bookingAlreadyCancelled = await prisma.booking.create({
      data: {
        userId: customerA.id,
        salonId: salon1.id,
        bookingTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
        status: BookingStatus.CANCELLED,
        notes: 'Đã hủy trước đó',
      },
    });

    // 1. Không có JWT -> 401 Unauthorized
    await testCase('1. PATCH /api/bookings/:id/cancel không có JWT -> HTTP 401', async () => {
      const res = await fetch(`${baseUrl}/${bookingFutureP.id}/cancel`, {
        method: 'PATCH',
      });
      assert.strictEqual(res.status, 401);
    });

    // 2. Role không phải USER (Chủ Salon gọi) -> 403 Forbidden
    await testCase('2. PATCH /api/bookings/:id/cancel với role SALON_OWNER -> HTTP 403 (chỉ Role.USER được hủy)', async () => {
      const res = await fetch(`${baseUrl}/${bookingFutureP.id}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${owner1Token}` },
      });
      assert.strictEqual(res.status, 403);
    });

    // 3. Booking không tồn tại -> 404 Not Found
    await testCase('3. PATCH /api/bookings/:id/cancel booking không tồn tại (ID 999999) -> HTTP 404', async () => {
      const res = await fetch(`${baseUrl}/999999/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${customerAToken}` },
      });
      assert.strictEqual(res.status, 404);
    });

    // 4. Booking của người khác (Customer B cố hủy của Customer A) -> 403 Forbidden
    await testCase('4. PATCH /api/bookings/:id/cancel cố tình hủy đơn của người khác -> HTTP 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/${bookingFutureP.id}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${customerBToken}` },
      });
      assert.strictEqual(res.status, 403);
    });

    // 5. Booking còn dưới 2 tiếng -> 400 Bad Request
    await testCase('5. PATCH /api/bookings/:id/cancel còn dưới 2 tiếng trước giờ hẹn -> HTTP 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/${bookingLessThan2Hours.id}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${customerAToken}` },
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.ok(JSON.stringify(data).includes('ít nhất 2 tiếng'));
    });

    // 6. Booking đã qua thời gian hẹn -> 400 Bad Request
    await testCase('6. PATCH /api/bookings/:id/cancel booking đã qua giờ hẹn -> HTTP 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/${bookingInPast.id}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${customerAToken}` },
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.ok(JSON.stringify(data).includes('qua thời gian hẹn'));
    });

    // 7. Booking ở trạng thái COMPLETED (D) -> 400 Bad Request
    await testCase('7. PATCH /api/bookings/:id/cancel booking trạng thái COMPLETED (D) -> HTTP 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/${bookingCompleted.id}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${customerAToken}` },
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.ok(JSON.stringify(data).includes('hoàn thành'));
    });

    // 8. Booking ở trạng thái CANCELLED (X) -> 400 Bad Request (từ chối hủy lần nữa)
    await testCase('8. PATCH /api/bookings/:id/cancel booking trạng thái CANCELLED (X) -> HTTP 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/${bookingAlreadyCancelled.id}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${customerAToken}` },
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.ok(JSON.stringify(data).includes('được hủy trước đó'));
    });

    // 9. Khách hàng hủy booking P còn đủ 2 tiếng -> thành công, status cập nhật thành X
    await testCase('9. PATCH /api/bookings/:id/cancel booking P còn hơn 2 tiếng -> Thành công HTTP 200, status thành X', async () => {
      const res = await fetch(`${baseUrl}/${bookingFutureP.id}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${customerAToken}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      const b = data.data || data;
      assert.strictEqual(b.status, 'X');

      // Kiểm tra DB
      const dbRecord = await prisma.booking.findUnique({ where: { id: bookingFutureP.id } });
      assert.strictEqual(dbRecord?.status, BookingStatus.CANCELLED);
    });

    // 10. Khách hàng hủy booking C còn đủ 2 tiếng -> thành công, status cập nhật thành X
    await testCase('10. PATCH /api/bookings/:id/cancel booking C còn hơn 2 tiếng -> Thành công HTTP 200, status thành X', async () => {
      const res = await fetch(`${baseUrl}/${bookingFutureC.id}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${customerAToken}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      const b = data.data || data;
      assert.strictEqual(b.status, 'X');

      // Kiểm tra DB
      const dbRecord = await prisma.booking.findUnique({ where: { id: bookingFutureC.id } });
      assert.strictEqual(dbRecord?.status, BookingStatus.CANCELLED);
    });

    // 11. Concurrency: Hai request hủy đồng thời không gây lỗi sai trạng thái
    await testCase('11. PATCH /api/bookings/:id/cancel xử lý đồng thời (Concurrency safe)', async () => {
      // Tạo booking mới
      const concurrentBooking = await prisma.booking.create({
        data: {
          userId: customerA.id,
          salonId: salon1.id,
          bookingTime: new Date(Date.now() + 30 * 60 * 60 * 1000),
          status: BookingStatus.PENDING,
          notes: 'Test concurrency cancel',
        },
      });

      // Bắn 2 request hủy cùng lúc
      const [res1, res2] = await Promise.all([
        fetch(`${baseUrl}/${concurrentBooking.id}/cancel`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${customerAToken}` },
        }),
        fetch(`${baseUrl}/${concurrentBooking.id}/cancel`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${customerAToken}` },
        }),
      ]);

      const statuses = [res1.status, res2.status].sort();
      // Phải có đúng 1 request thành công 200, request còn lại bị từ chối 400
      assert.deepStrictEqual(statuses, [200, 400], 'Đúng 1 request được 200 và 1 request nhận 400');
    });

    // =========================================================================
    // II. BE-07.5 — API KIỂM TRA KHUNG GIỜ KHẢ DỤNG CỦA SALON
    // (GET /api/bookings/salon/:salonId/availability?date=YYYY-MM-DD)
    // =========================================================================

    const testDate = '2026-11-15';
    // Múi giờ Việt Nam UTC+7:
    // '2026-11-15T09:00:00+07:00' = '2026-11-15T02:00:00.000Z'
    // '2026-11-15T14:30:00+07:00' = '2026-11-15T07:30:00.000Z'
    // '2026-11-15T16:00:00+07:00' = '2026-11-15T09:00:00.000Z' (COMPLETED)
    // '2026-11-15T18:00:00+07:00' = '2026-11-15T11:00:00.000Z' (CANCELLED)

    // Tạo booking P trên salon 1 ngày testDate
    await prisma.booking.create({
      data: {
        userId: customerA.id,
        salonId: salon1.id,
        bookingTime: new Date(`${testDate}T09:00:00+07:00`),
        status: BookingStatus.PENDING,
        notes: 'Lịch P sáng',
      },
    });

    // Tạo booking C trên salon 1 ngày testDate
    await prisma.booking.create({
      data: {
        userId: customerA.id,
        salonId: salon1.id,
        bookingTime: new Date(`${testDate}T14:30:00+07:00`),
        status: BookingStatus.CONFIRMED,
        notes: 'Lịch C chiều',
      },
    });

    // Tạo booking D trên salon 1 ngày testDate (không được tính là bận)
    await prisma.booking.create({
      data: {
        userId: customerA.id,
        salonId: salon1.id,
        bookingTime: new Date(`${testDate}T16:00:00+07:00`),
        status: BookingStatus.COMPLETED,
        notes: 'Lịch D hoàn thành',
      },
    });

    // Tạo booking X trên salon 1 ngày testDate (không được tính là bận)
    await prisma.booking.create({
      data: {
        userId: customerA.id,
        salonId: salon1.id,
        bookingTime: new Date(`${testDate}T18:00:00+07:00`),
        status: BookingStatus.CANCELLED,
        notes: 'Lịch X đã hủy',
      },
    });

    // Tạo booking P trên salon 2 ngày testDate (cô lập salon khác)
    await prisma.booking.create({
      data: {
        userId: customerA.id,
        salonId: salon2.id,
        bookingTime: new Date(`${testDate}T10:00:00+07:00`),
        status: BookingStatus.PENDING,
        notes: 'Lịch P salon 2',
      },
    });

    // Tạo booking P ở ranh giới ngày hôm sau (2026-11-16 00:05:00 UTC+7)
    await prisma.booking.create({
      data: {
        userId: customerA.id,
        salonId: salon1.id,
        bookingTime: new Date('2026-11-16T00:05:00+07:00'),
        status: BookingStatus.PENDING,
        notes: 'Ranh giới ngày hôm sau',
      },
    });

    // 12. Ngày sai định dạng hoặc không hợp lệ -> 400 Bad Request
    await testCase('12. GET availability ngày sai định dạng (25-10-2026) -> HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/salon/${salon1.id}/availability?date=25-10-2026`);
      assert.strictEqual(res.status, 400);
    });

    await testCase('13. GET availability ngày không tồn tại (2026-02-31) -> HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/salon/${salon1.id}/availability?date=2026-02-31`);
      assert.strictEqual(res.status, 400);
    });

    // 14. Salon không tồn tại -> 404 Not Found
    await testCase('14. GET availability salon không tồn tại (ID 999999) -> HTTP 404', async () => {
      const res = await fetch(`${baseUrl}/salon/999999/availability?date=${testDate}`);
      assert.strictEqual(res.status, 404);
    });

    // 15. Truy vấn availability hợp lệ -> Chỉ lấy P và C của chính salon, không lấy D, X hay salon khác
    await testCase('15. GET availability ngày có booking -> Trả về đúng bookedSlots (chỉ P & C, không lấy D & X, không nhầm salon khác)', async () => {
      const res = await fetch(`${baseUrl}/salon/${salon1.id}/availability?date=${testDate}`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.salonId, salon1.id);
      assert.strictEqual(data.date, testDate);
      assert.ok(Array.isArray(data.bookedSlots));
      // Chỉ có đúng 2 slot: 09:00 (P) và 14:30 (C)
      assert.strictEqual(data.bookedSlots.length, 2);

      const statuses = data.bookedSlots.map((s: any) => s.status).sort();
      assert.deepStrictEqual(statuses, ['C', 'P']);

      // Không chứa D (16:00) và X (18:00)
      const hasCompletedOrCancelled = data.bookedSlots.some((s: any) => s.status === 'D' || s.status === 'X');
      assert.strictEqual(hasCompletedOrCancelled, false);

      // Không chứa booking của salon 2 (10:00)
      const hasOtherSalon = data.bookedSlots.some((s: any) => s.notes?.includes('salon 2'));
      assert.strictEqual(hasOtherSalon, false);

      // Không chứa booking của ngày hôm sau (16-11)
      const hasNextDay = data.bookedSlots.some((s: any) => s.bookingDate.includes('2026-11-16T00:05'));
      assert.strictEqual(hasNextDay, false);
    });

    // 16. Ngày không có booking -> trả về bookedSlots = []
    await testCase('16. GET availability ngày không có lịch -> bookedSlots = []', async () => {
      const res = await fetch(`${baseUrl}/salon/${salon1.id}/availability?date=2026-12-01`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.salonId, salon1.id);
      assert.strictEqual(data.date, '2026-12-01');
      assert.deepStrictEqual(data.bookedSlots, []);
    });

    // =========================================================================
    // III. BE-07.6 — API CHỦ SALON QUẢN LÝ DANH SÁCH LỊCH HẸN (GET /api/bookings/salon)
    // =========================================================================

    // 17. Không có JWT -> 401 Unauthorized
    await testCase('17. GET /api/bookings/salon không có JWT -> HTTP 401', async () => {
      const res = await fetch(`${baseUrl}/salon`);
      assert.strictEqual(res.status, 401);
    });

    // 18. User Role 2 (Khách hàng) gọi -> 403 Forbidden
    await testCase('18. GET /api/bookings/salon với role USER -> HTTP 403 Forbidden (chỉ Role 3)', async () => {
      const res = await fetch(`${baseUrl}/salon`, {
        headers: { Authorization: `Bearer ${customerAToken}` },
      });
      assert.strictEqual(res.status, 403);
    });

    // 19. Chủ Salon không có Salon nào trên hệ thống (Owner 2) -> 404 Not Found
    await testCase('19. GET /api/bookings/salon với Chủ Salon chưa có salon -> HTTP 404 Not Found', async () => {
      const res = await fetch(`${baseUrl}/salon`, {
        headers: { Authorization: `Bearer ${owner2Token}` },
      });
      assert.strictEqual(res.status, 404);
      const data = await res.json();
      assert.ok(JSON.stringify(data).includes('Không tìm thấy thông tin Salon'));
    });

    // 20. Chủ Salon 1 xem danh sách -> Trả về đúng booking của Salon 1, đầy đủ thông tin khách hàng & an toàn bảo mật
    await testCase('20. GET /api/bookings/salon -> Trả về danh sách đúng của salon hiện tại, có user phone, gender, username và không lộ hash', async () => {
      const res = await fetch(`${baseUrl}/salon`, {
        headers: { Authorization: `Bearer ${owner1Token}` },
      });
      assert.strictEqual(res.status, 200);
      const result = await res.json();
      assert.ok(Array.isArray(result.data));
      assert.ok(result.total >= 2);
      assert.ok(result.pagination);
      assert.strictEqual(result.pagination.page, 1);

      // Kiểm tra bảo mật và thông tin khách hàng
      for (const item of result.data) {
        assert.strictEqual(item.salonId, salon1.id, 'Tất cả booking phải thuộc salon 1');
        assert.strictEqual(item.password, undefined);
        assert.strictEqual(item.passwordHash, undefined);
        assert.ok(item.user);
        assert.ok(item.user.phone);
        assert.ok(item.user.gender);
        assert.ok(item.user.username || item.user.name);
        assert.strictEqual(item.user.password, undefined);
      }
    });

    // 21. Cố tình truyền salonId hoặc ownerId giả mạo trên query -> Bị chặn (400) hoặc bỏ qua, tuyệt đối không thể truy cập salon khác
    await testCase('21. GET /api/bookings/salon?salonId=... -> Không thể xem salon khác (Data Isolation)', async () => {
      const res = await fetch(`${baseUrl}/salon?salonId=${salon2.id}&ownerId=${salonOwner3.id}`, {
        headers: { Authorization: `Bearer ${owner1Token}` },
      });
      assert.ok(
        res.status === 400 || res.status === 200,
        `Status ${res.status} không hợp lệ (phải là 400 do forbidNonWhitelisted hoặc 200 nhưng chỉ chứa salon 1)`,
      );
      if (res.status === 200) {
        const result = await res.json();
        for (const item of result.data) {
          assert.strictEqual(item.salonId, salon1.id, 'Vẫn phải thuộc salon 1 của chính mình');
        }
      }
    });

    // 22. Lọc theo status (status=P)
    await testCase('22. GET /api/bookings/salon?status=P -> Lọc chính xác các đơn Chờ duyệt', async () => {
      const res = await fetch(`${baseUrl}/salon?status=P`, {
        headers: { Authorization: `Bearer ${owner1Token}` },
      });
      assert.strictEqual(res.status, 200);
      const result = await res.json();
      assert.ok(Array.isArray(result.data));
      assert.ok(result.data.length >= 1);
      for (const item of result.data) {
        assert.strictEqual(item.status, 'P');
      }
    });

    // 23. Lọc theo date (date=2026-11-15)
    await testCase('23. GET /api/bookings/salon?date=2026-11-15 -> Lọc chính xác theo ngày hẹn theo múi giờ Việt Nam', async () => {
      const res = await fetch(`${baseUrl}/salon?date=2026-11-15`, {
        headers: { Authorization: `Bearer ${owner1Token}` },
      });
      assert.strictEqual(res.status, 200);
      const result = await res.json();
      assert.ok(Array.isArray(result.data));
      // Các booking ngày 15-11 thuộc salon 1
      assert.ok(result.data.length >= 1);
      for (const item of result.data) {
        assert.ok(item.bookingDate.includes('2026-11-15') || item.booking_date.includes('2026-11-15'));
      }
    });

    // 24. Kết hợp status, date và pagination
    await testCase('24. GET /api/bookings/salon?status=P&date=2026-11-15&page=1&limit=2 -> Kết hợp bộ lọc và phân trang chuẩn', async () => {
      const res = await fetch(`${baseUrl}/salon?status=P&date=2026-11-15&page=1&limit=2`, {
        headers: { Authorization: `Bearer ${owner1Token}` },
      });
      assert.strictEqual(res.status, 200);
      const result = await res.json();
      assert.ok(Array.isArray(result.data));
      assert.ok(result.data.length <= 2);
      assert.strictEqual(result.pagination.limit, 2);
      for (const item of result.data) {
        assert.strictEqual(item.status, 'P');
      }
    });

    // Cleanup: xóa các dữ liệu booking test đã tạo
    await prisma.booking.deleteMany({
      where: {
        userId: { in: [customerA.id, customerB.id] },
      },
    });
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
