import { ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NestFactory } from '@nestjs/core';
import * as assert from 'assert';
import { AppModule } from '../src/app.module';

async function runTests() {
  console.log('🧪 Bắt đầu chạy bộ kiểm thử cho API BE-05.1, BE-05.2, BE-05.3, BE-05.4 (Salons API)...\n');

  // Khởi động NestJS app trên cổng ngẫu nhiên phục vụ kiểm thử
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
  const port = typeof address === 'object' && address ? address.port : 5002;
  const baseUrl = `http://127.0.0.1:${port}/api/salons`;
  const jwtService = app.get(JwtService);

  // Tạo JWT test
  // User 3 là SALON_OWNER (chủ của Salon 1)
  const ownerToken = jwtService.sign({ sub: 3, email: 'mint@gmail.com', role: 'SALON_OWNER' });
  // User 2 là USER (khách hàng thường)
  const customerToken = jwtService.sign({ sub: 2, email: 'nmtiephd@gmail.com', role: 'USER' });

  console.log(`Server test đang chạy tại: ${baseUrl}\n`);

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
    // 1. Danh sách Salon không có bộ lọc -> HTTP 200, chỉ trả về Salon đã APPROVED
    await testCase('1. GET /api/salons (không có bộ lọc) -> HTTP 200, chỉ trả về Salon đã APPROVED', async () => {
      const res = await fetch(baseUrl);
      assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
      const list = await res.json();
      assert.ok(Array.isArray(list), 'Dữ liệu trả về phải là một mảng');
      assert.ok(list.length >= 1, 'Phải có ít nhất 1 Salon đã được duyệt');
      // Đảm bảo không chứa salon chưa duyệt (Salon 2 có status PENDING)
      const unapproved = list.find((s: any) => s.id === 2 || s.status !== 'APPROVED');
      assert.strictEqual(unapproved, undefined, 'Salon chưa duyệt tuyệt đối không được xuất hiện trong danh sách');
    });

    // 2. Tìm kiếm theo search (tên salon)
    await testCase('2. GET /api/salons?search=Studio -> HTTP 200, tìm kiếm theo tên không phân biệt hoa thường', async () => {
      const res = await fetch(`${baseUrl}?search=studio`);
      assert.strictEqual(res.status, 200);
      const list = await res.json();
      assert.ok(Array.isArray(list));
      assert.ok(list.length >= 1);
      assert.ok(list.every((s: any) => s.name.toLowerCase().includes('studio')));
    });

    // 3. Lọc theo address
    await testCase('3. GET /api/salons?address=Hà Nội -> HTTP 200, lọc theo địa chỉ', async () => {
      const res = await fetch(`${baseUrl}?address=${encodeURIComponent('Hà Nội')}`);
      assert.strictEqual(res.status, 200);
      const list = await res.json();
      assert.ok(Array.isArray(list));
      assert.ok(list.length >= 1);
      assert.ok(list.every((s: any) => s.address.toLowerCase().includes('hà nội')));
    });

    // 4. Lọc theo tag không tồn tại
    await testCase('4. GET /api/salons?tag=TagKhongTonTai -> HTTP 200, trả về mảng rỗng []', async () => {
      const res = await fetch(`${baseUrl}?tag=${encodeURIComponent('TagKhongTonTai')}`);
      assert.strictEqual(res.status, 200);
      const list = await res.json();
      assert.ok(Array.isArray(list));
      assert.strictEqual(list.length, 0, 'Tag không khớp phải trả về []');
    });

    // 5. Response không chứa thông tin nội bộ nhạy cảm (password, token, role nội bộ)
    await testCase('5. Kiểm tra Response bảo mật: không lộ password, token', async () => {
      const res = await fetch(baseUrl);
      const list = await res.json();
      for (const item of list) {
        assert.strictEqual(item.password, undefined);
        assert.strictEqual(item.token, undefined);
        if (item.owner) {
          assert.strictEqual(item.owner.password, undefined);
          assert.strictEqual(item.owner.token, undefined);
        }
      }
    });

    // 6. BE-05.2: GET /api/salons/:id thành công với Salon đã duyệt
    await testCase('6. GET /api/salons/1 -> HTTP 200, đầy đủ thông tin Salon & liên hệ chủ tiệm (phone, email)', async () => {
      const res = await fetch(`${baseUrl}/1`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.id, 1);
      assert.ok(data.owner, 'Phải có thông tin chủ tiệm');
      assert.ok(data.owner.phone, 'Phải có SĐT liên hệ của chủ tiệm');
      assert.ok(data.owner.email, 'Phải có email liên hệ của chủ tiệm');
      assert.strictEqual(data.owner.password, undefined, 'Không được trả về password');
    });

    // 7. BE-05.2: Salon chưa xác thực (status PENDING) không thể xem chi tiết công khai -> 404
    await testCase('7. GET /api/salons/2 (Salon PENDING) -> HTTP 404 Not Found', async () => {
      const res = await fetch(`${baseUrl}/2`);
      assert.strictEqual(res.status, 404, `Expected 404, got ${res.status}`);
      const err = await res.json();
      assert.strictEqual(err.statusCode, 404);
    });

    // 8. BE-05.3: GET /api/salons/owner/me không có token -> 401 Unauthorized
    await testCase('8. GET /api/salons/owner/me (không có token) -> HTTP 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/owner/me`);
      assert.strictEqual(res.status, 401);
    });

    // 9. BE-05.3: GET /api/salons/owner/me với tài khoản khách hàng (role USER) -> 403 Forbidden
    await testCase('9. GET /api/salons/owner/me (tài khoản USER) -> HTTP 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/owner/me`, {
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
      });
      assert.strictEqual(res.status, 403);
    });

    // 10. BE-05.3: GET /api/salons/owner/me với Chủ Salon (role SALON_OWNER) -> 200 OK với Salon của chính mình
    await testCase('10. GET /api/salons/owner/me (tài khoản SALON_OWNER) -> HTTP 200 OK với thông tin salon của chính mình', async () => {
      const res = await fetch(`${baseUrl}/owner/me`, {
        headers: {
          Authorization: `Bearer ${ownerToken}`,
        },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.id, 1);
      assert.strictEqual(data.owner.id, 3);
      assert.strictEqual(data.owner.email, 'mint@gmail.com');
      assert.strictEqual(data.owner.password, undefined);
    });

    // 11. BE-05.4: PUT /api/salons/owner/me không có token -> 401 Unauthorized
    await testCase('11. PUT /api/salons/owner/me (không có token) -> HTTP 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/owner/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salonname: 'Test' }),
      });
      assert.strictEqual(res.status, 401);
    });

    // 12. BE-05.4: PUT /api/salons/owner/me với tài khoản khách hàng -> 403 Forbidden
    await testCase('12. PUT /api/salons/owner/me (tài khoản USER) -> HTTP 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/owner/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({ salonname: 'Test' }),
      });
      assert.strictEqual(res.status, 403);
    });

    // 13. BE-05.4: PUT /api/salons/owner/me validate dữ liệu không hợp lệ -> 400 Bad Request
    await testCase('13. PUT /api/salons/owner/me dữ liệu rỗng/không hợp lệ -> HTTP 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/owner/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ salonname: 'x' }), // ít hơn 2 ký tự
      });
      assert.strictEqual(res.status, 400);
    });

    // 14. BE-05.4: PUT /api/salons/owner/me cập nhật thành công tên, địa chỉ, tag, mô tả
    await testCase('14. PUT /api/salons/owner/me cập nhật thành công tên, địa chỉ, tag thế mạnh, mô tả', async () => {
      const updatePayload = {
        salonname: 'Studio hair Minh Tiệp Pro',
        address: '123 Đường Cầu Giấy, Hà Nội',
        tag: 'Tròn, Oval, Vuông',
        description: 'Salon tóc cao cấp chuyên tạo kiểu phù hợp với từng khuôn mặt',
      };
      const res = await fetch(`${baseUrl}/owner/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify(updatePayload),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.name, 'Studio hair Minh Tiệp Pro');
      assert.strictEqual(data.address, '123 Đường Cầu Giấy, Hà Nội');
      assert.strictEqual(data.tag, 'Tròn, Oval, Vuông');
      assert.deepStrictEqual(data.tags, ['Tròn', 'Oval', 'Vuông']);
      assert.strictEqual(data.description, 'Salon tóc cao cấp chuyên tạo kiểu phù hợp với từng khuôn mặt');
    });

    // 15. BE-05.4: Cập nhật tag dạng array và kiểm tra tính nhất quán
    await testCase('15. PUT /api/salons/owner/me hỗ trợ tag dạng array ["Tròn", "Oval", "Kim Cương"]', async () => {
      const res = await fetch(`${baseUrl}/owner/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          tag: ['Tròn', 'Oval', 'Kim Cương'],
        }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.tag, 'Tròn, Oval, Kim Cương');
      assert.deepStrictEqual(data.tags, ['Tròn', 'Oval', 'Kim Cương']);
    });

    // 16. BE-05.4: Không thể can thiệp sửa status (isVerified) hoặc ownerId từ body
    await testCase('16. PUT /api/salons/owner/me không cho phép sửa status hoặc ownerId (forbidNonWhitelisted -> 400)', async () => {
      const res = await fetch(`${baseUrl}/owner/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          status: 'PENDING',
          ownerId: 999,
        }),
      });
      // Do ValidationPipe có forbidNonWhitelisted: true, việc gửi trường lạ sẽ bị từ chối với 400
      assert.strictEqual(res.status, 400);
    });

    // 17. Đồng bộ tag với bộ lọc GET /api/salons?tag=Kim Cương
    await testCase('17. GET /api/salons?tag=Kim Cương -> HTTP 200, tìm thấy Salon vừa được cập nhật tag', async () => {
      const res = await fetch(`${baseUrl}?tag=${encodeURIComponent('Kim Cương')}`);
      assert.strictEqual(res.status, 200);
      const list = await res.json();
      assert.ok(Array.isArray(list));
      assert.strictEqual(list.length, 1);
      assert.strictEqual(list[0].id, 1);
      assert.strictEqual(list[0].name, 'Studio hair Minh Tiệp Pro');
    });

    // 18. GET /api/salons/owner/me phản ánh đúng dữ liệu mới nhất sau khi cập nhật
    await testCase('18. GET /api/salons/owner/me phản ánh đúng dữ liệu đã lưu trong database', async () => {
      const res = await fetch(`${baseUrl}/owner/me`, {
        headers: {
          Authorization: `Bearer ${ownerToken}`,
        },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.name, 'Studio hair Minh Tiệp Pro');
      assert.strictEqual(data.tag, 'Tròn, Oval, Kim Cương');
    });

  } finally {
    await app.close();
  }

  console.log('\n========================================');
  console.log(`📊 Kết quả kiểm thử: ${passedCount} PASS, ${failedCount} FAIL`);
  console.log('========================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
