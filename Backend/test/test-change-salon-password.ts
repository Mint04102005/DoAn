import { ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NestFactory } from '@nestjs/core';
import * as assert from 'assert';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

async function runTests() {
  console.log('🧪 Bắt đầu chạy bộ kiểm thử toàn diện cho API Đổi mật khẩu Chủ Salon (BE-05.5: PATCH /api/salons/owner/me/password)...\n');

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
  const port = typeof address === 'object' && address ? address.port : 5003;
  const baseUrl = `http://127.0.0.1:${port}/api/salons/owner/me/password`;
  const loginUrl = `http://127.0.0.1:${port}/api/auth/login`;

  const jwtService = app.get(JwtService);
  const prisma = app.get(PrismaService);

  // Tìm hoặc tạo một tài khoản SALON_OWNER riêng cho test để không ảnh hưởng dữ liệu cố định
  const testOwnerEmail = 'test_owner_password@curator.ai';
  let initialPassword = 'OldPassword@123';
  let ownerUser = await prisma.user.findUnique({ where: { email: testOwnerEmail } });

  if (!ownerUser) {
    const hashedPassword = await bcrypt.hash(initialPassword, 10);
    ownerUser = await prisma.user.create({
      data: {
        email: testOwnerEmail,
        password: hashedPassword,
        name: 'Test Salon Owner',
        role: 'SALON_OWNER',
        salons: {
          create: {
            name: 'Test Salon Security',
            address: '456 Test Street',
            phone: '0988776655',
            status: 'APPROVED',
          },
        },
      },
    });
  } else {
    // Đặt lại mật khẩu ban đầu
    const hashedPassword = await bcrypt.hash(initialPassword, 10);
    await prisma.user.update({
      where: { id: ownerUser.id },
      data: { password: hashedPassword },
    });
  }

  // Tokens
  // Lấy hoặc tạo user với Role.USER
  let customerUser = await prisma.user.findFirst({ where: { role: 'USER' } });
  if (!customerUser) {
    customerUser = await prisma.user.create({
      data: {
        email: 'test_customer_rbac@curator.ai',
        password: 'Password@123',
        name: 'Test Customer RBAC',
        role: 'USER',
      },
    });
  }

  // Lấy hoặc tạo user với Role.ADMIN
  let adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: 'test_admin_rbac@curator.ai',
        password: 'Password@123',
        name: 'Test Admin RBAC',
        role: 'ADMIN',
      },
    });
  }

  const ownerToken = jwtService.sign({ sub: ownerUser.id, email: ownerUser.email, role: 'SALON_OWNER' });
  const customerToken = jwtService.sign({ sub: customerUser.id, email: customerUser.email, role: 'USER' });
  const adminToken = jwtService.sign({ sub: adminUser.id, email: adminUser.email, role: 'ADMIN' });
  const nonExistentUserToken = jwtService.sign({ sub: 999999, email: 'ghost@curator.ai', role: 'SALON_OWNER' });

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

  try {
    // 1. Không có token -> 401 Unauthorized
    await testCase('1. PATCH /api/salons/owner/me/password (không có JWT) -> HTTP 401 Unauthorized', async () => {
      const res = await fetch(baseUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: initialPassword,
          newPassword: 'NewSecurePassword@456',
          confirmPassword: 'NewSecurePassword@456',
        }),
      });
      assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
    });

    // 2. Token không hợp lệ -> 401 Unauthorized
    await testCase('2. PATCH /api/salons/owner/me/password (JWT giả mạo/hỏng) -> HTTP 401 Unauthorized', async () => {
      const res = await fetch(baseUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer invalid.token.payload',
        },
        body: JSON.stringify({
          currentPassword: initialPassword,
          newPassword: 'NewSecurePassword@456',
          confirmPassword: 'NewSecurePassword@456',
        }),
      });
      assert.strictEqual(res.status, 401, `Expected 401, got ${res.status}`);
    });

    // 3. User thường (Role.USER) gọi -> 403 Forbidden
    await testCase('3. PATCH /api/salons/owner/me/password (Role.USER) -> HTTP 403 Forbidden', async () => {
      const res = await fetch(baseUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          currentPassword: initialPassword,
          newPassword: 'NewSecurePassword@456',
          confirmPassword: 'NewSecurePassword@456',
        }),
      });
      assert.strictEqual(res.status, 403, `Expected 403, got ${res.status}`);
    });

    // 4. Admin (Role.ADMIN) gọi -> 403 Forbidden
    await testCase('4. PATCH /api/salons/owner/me/password (Role.ADMIN) -> HTTP 403 Forbidden', async () => {
      const res = await fetch(baseUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          currentPassword: initialPassword,
          newPassword: 'NewSecurePassword@456',
          confirmPassword: 'NewSecurePassword@456',
        }),
      });
      assert.strictEqual(res.status, 403, `Expected 403, got ${res.status}`);
    });

    // 5. Tài khoản không tồn tại trên hệ thống -> 401 Unauthorized (JwtStrategy)
    await testCase('5. PATCH /api/salons/owner/me/password (User không tồn tại) -> HTTP 401', async () => {
      const res = await fetch(baseUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${nonExistentUserToken}`,
        },
        body: JSON.stringify({
          currentPassword: initialPassword,
          newPassword: 'NewSecurePassword@456',
          confirmPassword: 'NewSecurePassword@456',
        }),
      });
      assert.strictEqual(res.status, 401);
    });

    // 6. Thiếu trường bắt buộc (currentPassword) -> 400 Bad Request
    await testCase('6. Thiếu currentPassword -> HTTP 400 Bad Request', async () => {
      const res = await fetch(baseUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          newPassword: 'NewSecurePassword@456',
          confirmPassword: 'NewSecurePassword@456',
        }),
      });
      assert.strictEqual(res.status, 400);
    });

    // 7. Mật khẩu mới ngắn hơn 8 ký tự -> 400 Bad Request
    await testCase('7. Mật khẩu mới ngắn hơn 8 ký tự -> HTTP 400 Bad Request', async () => {
      const res = await fetch(baseUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          currentPassword: initialPassword,
          newPassword: '12345',
          confirmPassword: '12345',
        }),
      });
      assert.strictEqual(res.status, 400);
    });

    // 8. Mật khẩu xác nhận không khớp -> 400 Bad Request
    await testCase('8. Mật khẩu mới và confirmPassword không khớp -> HTTP 400 Bad Request', async () => {
      const res = await fetch(baseUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          currentPassword: initialPassword,
          newPassword: 'NewSecurePassword@456',
          confirmPassword: 'DifferentPassword@789',
        }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.ok(
        JSON.stringify(data).includes('không trùng khớp'),
        'Thông báo lỗi phải chỉ ra mật khẩu xác nhận không khớp',
      );
    });

    // 9. Nhập sai mật khẩu hiện tại -> 400 Bad Request
    await testCase('9. Nhập sai currentPassword -> HTTP 400 Bad Request', async () => {
      const res = await fetch(baseUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          currentPassword: 'WrongCurrentPassword@999',
          newPassword: 'NewSecurePassword@456',
          confirmPassword: 'NewSecurePassword@456',
        }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.ok(
        JSON.stringify(data).includes('hiện tại không chính xác'),
        'Thông báo lỗi phải chỉ ra mật khẩu hiện tại không đúng',
      );
    });

    // 10. Mật khẩu mới trùng với mật khẩu hiện tại -> 400 Bad Request
    await testCase('10. Mật khẩu mới trùng với mật khẩu hiện tại -> HTTP 400 Bad Request', async () => {
      const res = await fetch(baseUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          currentPassword: initialPassword,
          newPassword: initialPassword,
          confirmPassword: initialPassword,
        }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.ok(
        JSON.stringify(data).includes('không được trùng'),
        'Thông báo lỗi phải chỉ ra mật khẩu mới không được trùng mật khẩu cũ',
      );
    });

    // 11. Đổi mật khẩu thành công với thông tin hợp lệ -> HTTP 200
    const newValidPassword = 'FreshSalonOwnerPassword@2026';
    await testCase('11. Đổi mật khẩu thành công -> HTTP 200 và response an toàn', async () => {
      const res = await fetch(baseUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          currentPassword: initialPassword,
          newPassword: newValidPassword,
          confirmPassword: newValidPassword,
        }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.message, 'Đổi mật khẩu thành công');
      // Không để lộ password, hash hay token
      assert.strictEqual(data.password, undefined);
      assert.strictEqual(data.passwordHash, undefined);
      assert.strictEqual(data.currentPassword, undefined);
      assert.strictEqual(data.newPassword, undefined);
    });

    // 12. Kiểm tra trực tiếp Database: password đã được hash, không phải plaintext
    await testCase('12. Kiểm tra Database: mật khẩu được hash bằng bcrypt, không phải plaintext', async () => {
      const updatedUser = await prisma.user.findUnique({ where: { id: ownerUser!.id } });
      assert.ok(updatedUser, 'User phải tồn tại trong DB');
      assert.notStrictEqual(updatedUser.password, newValidPassword, 'Database tuyệt đối không lưu plaintext');
      assert.ok(updatedUser.password.startsWith('$2'), 'Mật khẩu phải là bcrypt hash ($2a$ hoặc $2b$)');

      const isBcryptMatch = await bcrypt.compare(newValidPassword, updatedUser.password);
      assert.strictEqual(isBcryptMatch, true, 'Bcrypt phải so khớp chính xác với mật khẩu mới');
    });

    // 13. Đăng nhập bằng mật khẩu cũ -> Thất bại HTTP 401
    await testCase('13. Đăng nhập với mật khẩu cũ sau khi đổi -> HTTP 401 Unauthorized', async () => {
      const res = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testOwnerEmail,
          password: initialPassword,
        }),
      });
      assert.strictEqual(res.status, 401);
    });

    // 14. Đăng nhập bằng mật khẩu mới -> Thành công HTTP 200/201
    await testCase('14. Đăng nhập với mật khẩu mới -> Thành công với JWT mới', async () => {
      const res = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testOwnerEmail,
          password: newValidPassword,
        }),
      });
      assert.ok(res.status === 200 || res.status === 201, `Status mong đợi 200/201, nhận ${res.status}`);
      const data = await res.json();
      assert.ok(data.accessToken, 'Phải nhận được accessToken mới');
      assert.strictEqual(data.user.email, testOwnerEmail);
    });

    // Cleanup: xóa test user
    await prisma.salon.deleteMany({ where: { ownerId: ownerUser.id } });
    await prisma.user.delete({ where: { id: ownerUser.id } });
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
