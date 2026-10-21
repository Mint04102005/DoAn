import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as assert from 'assert';
import { AppModule } from '../src/app.module';

async function runTests() {
  console.log('🧪 Bắt đầu chạy bộ kiểm thử cho API BE-05.1 & BE-05.2 (Salons API)...\n');

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

    // 4. Lọc theo tag
    await testCase('4. GET /api/salons?tag=Tròn -> HTTP 200, trả về mảng rỗng nếu không có dữ liệu tag tương ứng', async () => {
      const res = await fetch(`${baseUrl}?tag=${encodeURIComponent('Tròn')}`);
      assert.strictEqual(res.status, 200);
      const list = await res.json();
      assert.ok(Array.isArray(list));
      assert.strictEqual(list.length, 0, 'Tag không khớp phải trả về []');
    });

    // 5. Kết hợp cả 3 bộ lọc theo logic AND
    await testCase('5. GET /api/salons?search=Studio&address=Hà Nội&tag=Tròn -> kết hợp AND (trả về [] vì tag không khớp)', async () => {
      const res = await fetch(
        `${baseUrl}?search=Studio&address=${encodeURIComponent('Hà Nội')}&tag=${encodeURIComponent('Tròn')}`,
      );
      assert.strictEqual(res.status, 200);
      const list = await res.json();
      assert.ok(Array.isArray(list));
      assert.strictEqual(list.length, 0);
    });

    // 6. Kết hợp search + address đều khớp
    await testCase('6. GET /api/salons?search=Studio&address=Hà Nội -> kết hợp AND trả về Salon 1', async () => {
      const res = await fetch(`${baseUrl}?search=Studio&address=${encodeURIComponent('Hà Nội')}`);
      assert.strictEqual(res.status, 200);
      const list = await res.json();
      assert.ok(Array.isArray(list));
      assert.strictEqual(list.length, 1);
      assert.strictEqual(list[0].id, 1);
    });

    // 7. Salon có status PENDING (chưa xác thực) không xuất hiện trong danh sách
    await testCase('7. Đảm bảo Salon 2 (PENDING) không xuất hiện dù tìm kiếm đúng tên và địa chỉ', async () => {
      const res = await fetch(`${baseUrl}?search=Studio&address=HaNOI`);
      assert.strictEqual(res.status, 200);
      const list = await res.json();
      const salon2 = list.find((s: any) => s.id === 2);
      assert.strictEqual(salon2, undefined, 'Salon 2 (PENDING) không được xuất hiện');
    });

    // 8. Trim khoảng trắng và bỏ qua query parameter rỗng
    await testCase('8. GET /api/salons?search=  &address=   -> bỏ qua khoảng trắng thừa, tương đương không filter', async () => {
      const res = await fetch(`${baseUrl}?search=%20%20&address=%20%20%20`);
      assert.strictEqual(res.status, 200);
      const list = await res.json();
      assert.ok(list.length >= 1);
    });

    // 9. Không có kết quả lọc -> trả về 200 OK với mảng rỗng []
    await testCase('9. GET /api/salons?search=NonExistentSalonNameXYZ -> HTTP 200 với mảng []', async () => {
      const res = await fetch(`${baseUrl}?search=NonExistentSalonNameXYZ`);
      assert.strictEqual(res.status, 200);
      const list = await res.json();
      assert.deepStrictEqual(list, []);
    });

    // 10. Response không chứa thông tin nội bộ nhạy cảm (password, token, role nội bộ)
    await testCase('10. Kiểm tra Response bảo mật: không lộ password, token', async () => {
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

    // 11. BE-05.2: GET /api/salons/:id thành công với Salon đã duyệt
    await testCase('11. GET /api/salons/1 -> HTTP 200, đầy đủ thông tin Salon & liên hệ chủ tiệm (phone, email)', async () => {
      const res = await fetch(`${baseUrl}/1`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.id, 1);
      assert.strictEqual(data.name, 'Studio hair');
      assert.ok(data.owner, 'Phải có thông tin chủ tiệm');
      assert.ok(data.owner.phone, 'Phải có SĐT liên hệ của chủ tiệm');
      assert.ok(data.owner.email, 'Phải có email liên hệ của chủ tiệm');
      assert.strictEqual(data.owner.password, undefined, 'Không được trả về password');
    });

    // 12. BE-05.2: Salon chưa xác thực (status PENDING) không thể xem chi tiết công khai -> 404
    await testCase('12. GET /api/salons/2 (Salon PENDING) -> HTTP 404 Not Found', async () => {
      const res = await fetch(`${baseUrl}/2`);
      assert.strictEqual(res.status, 404, `Expected 404, got ${res.status}`);
      const err = await res.json();
      assert.strictEqual(err.statusCode, 404);
    });

    // 13. BE-05.2: Salon không tồn tại -> 404 Not Found
    await testCase('13. GET /api/salons/99999 (Salon không tồn tại) -> HTTP 404 Not Found', async () => {
      const res = await fetch(`${baseUrl}/99999`);
      assert.strictEqual(res.status, 404);
    });

    // 14. BE-05.2: ID sai định dạng -> HTTP 400 Bad Request (tránh lỗi 500)
    await testCase('14. GET /api/salons/abc (ID chữ) -> HTTP 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/abc`);
      assert.strictEqual(res.status, 400);
    });

    // 15. BE-05.2: ID âm hoặc 0 -> HTTP 400 Bad Request
    await testCase('15. GET /api/salons/-1 -> HTTP 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/-1`);
      assert.strictEqual(res.status, 400);
    });

    // 16. Các API khác vẫn hoạt động bình thường (ví dụ /api/face-shapes)
    await testCase('16. Kiểm tra API khác (/api/face-shapes) không bị ảnh hưởng', async () => {
      const res = await fetch(`http://127.0.0.1:${port}/api/face-shapes`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data));
      assert.ok(data.length >= 5);
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
