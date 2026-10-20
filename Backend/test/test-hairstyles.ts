import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as assert from 'assert';
import { AppModule } from '../src/app.module';

async function runTests() {
  console.log('🧪 Bắt đầu chạy bộ kiểm thử cho API GET /api/hairstyles...\n');

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
  const port = typeof address === 'object' && address ? address.port : 5001;
  const baseUrl = `http://127.0.0.1:${port}/api/hairstyles`;

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
    // 1. Gọi API không có query parameters
    await testCase('1. Gọi API không có query parameters -> HTTP 200, phân trang mặc định (page=1, limit=10)', async () => {
      const res = await fetch(baseUrl);
      assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}`);
      const json = await res.json();
      assert.ok(Array.isArray(json.data), 'Data phải là một mảng');
      assert.strictEqual(json.pagination.page, 1, 'Mặc định page phải là 1');
      assert.strictEqual(json.pagination.limit, 10, 'Mặc định limit phải là 10');
      assert.ok(json.pagination.total >= 12, 'Tổng số mẫu tóc phải >= 12');
      assert.strictEqual(json.pagination.totalPages, Math.ceil(json.pagination.total / 10));
      assert.strictEqual(json.data.length, 10, 'Trang 1 với limit 10 phải trả về 10 bản ghi');
    });

    // 2. Gọi API với page=2&limit=5
    await testCase('2. Gọi API với page=2&limit=5 -> HTTP 200, phân trang chính xác', async () => {
      const res = await fetch(`${baseUrl}?page=2&limit=5`);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.pagination.page, 2);
      assert.strictEqual(json.pagination.limit, 5);
      assert.strictEqual(json.data.length, 5);
      assert.strictEqual(json.pagination.totalPages, Math.ceil(json.pagination.total / 5));
    });

    // 3. Lọc riêng theo gender=Nam
    await testCase('3. Lọc riêng theo gender=Nam -> HTTP 200, tất cả kết quả đều là Nam', async () => {
      const res = await fetch(`${baseUrl}?gender=Nam`);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.ok(json.data.length > 0, 'Phải có dữ liệu trả về cho Nam');
      for (const item of json.data) {
        assert.strictEqual(item.gender, 'Nam', `Mẫu tóc ${item.name} phải có gender là Nam`);
      }
    });

    // 4. Lọc riêng theo gender=Nữ
    await testCase('4. Lọc riêng theo gender=Nữ -> HTTP 200, tất cả kết quả đều là Nữ', async () => {
      const res = await fetch(`${baseUrl}?gender=${encodeURIComponent('Nữ')}`);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.ok(json.data.length > 0, 'Phải có dữ liệu trả về cho Nữ');
      for (const item of json.data) {
        assert.strictEqual(item.gender, 'Nữ', `Mẫu tóc ${item.name} phải có gender là Nữ`);
      }
    });

    // 5. Tìm kiếm tên tóc bằng chuỗi đầy đủ
    await testCase('5. Tìm kiếm tên tóc bằng chuỗi đầy đủ -> HTTP 200, tìm thấy chính xác', async () => {
      const queryName = 'Layer Nam Hàn Quốc';
      const res = await fetch(`${baseUrl}?search=${encodeURIComponent(queryName)}`);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.ok(json.data.some((h: any) => h.name === queryName), 'Phải tìm thấy mẫu tóc Layer Nam Hàn Quốc');
    });

    // 6. Tìm kiếm một phần tên tóc
    await testCase('6. Tìm kiếm một phần tên tóc -> HTTP 200, khớp tất cả tên chứa từ khóa', async () => {
      const res = await fetch(`${baseUrl}?search=Layer`);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.ok(json.data.length >= 2, 'Phải có ít nhất 2 mẫu tóc chứa từ khóa Layer');
      for (const item of json.data) {
        assert.ok(item.name.toLowerCase().includes('layer'), `Tên ${item.name} phải chứa Layer`);
      }
    });

    // 7. Kiểm tra tìm kiếm không phân biệt hoa thường
    await testCase('7. Tìm kiếm không phân biệt hoa thường (layer vs LAYER) -> kết quả giống nhau', async () => {
      const resLower = await fetch(`${baseUrl}?search=layer`);
      const resUpper = await fetch(`${baseUrl}?search=LAYER`);
      const jsonLower = await resLower.json();
      const jsonUpper = await resUpper.json();
      assert.strictEqual(jsonLower.pagination.total, jsonUpper.pagination.total, 'Số lượng kết quả chữ thường và chữ hoa phải bằng nhau');
      assert.strictEqual(jsonLower.data.length, jsonUpper.data.length);
    });

    // 8. Kết hợp gender, search, page và limit
    await testCase('8. Kết hợp gender, search, page và limit -> lọc AND chính xác', async () => {
      const res = await fetch(`${baseUrl}?gender=Nam&search=Layer&page=1&limit=10`);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.ok(json.data.length > 0, 'Phải có kết quả thỏa mãn');
      for (const item of json.data) {
        assert.strictEqual(item.gender, 'Nam');
        assert.ok(item.name.toLowerCase().includes('layer'));
      }
    });

    // 9. Không tìm thấy mẫu tóc
    await testCase('9. Không tìm thấy mẫu tóc -> HTTP 200, data = [], total = 0, totalPages = 0', async () => {
      const res = await fetch(`${baseUrl}?search=TenKhongTonTai123456789`);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.data.length, 0);
      assert.strictEqual(json.pagination.total, 0);
      assert.strictEqual(json.pagination.totalPages, 0);
      assert.strictEqual(json.pagination.page, 1);
    });

    // 10. Gửi page=0, limit=0, số âm hoặc giá trị không phải số -> 400 Bad Request
    await testCase('10. Validation: page=0, limit=0, số âm, không phải số -> HTTP 400 Bad Request', async () => {
      const res1 = await fetch(`${baseUrl}?page=0`);
      assert.strictEqual(res1.status, 400, 'page=0 phải trả về 400');

      const res2 = await fetch(`${baseUrl}?limit=0`);
      assert.strictEqual(res2.status, 400, 'limit=0 phải trả về 400');

      const res3 = await fetch(`${baseUrl}?page=-1`);
      assert.strictEqual(res3.status, 400, 'page=-1 phải trả về 400');

      const res4 = await fetch(`${baseUrl}?page=abc`);
      assert.strictEqual(res4.status, 400, 'page=abc phải trả về 400');

      const res5 = await fetch(`${baseUrl}?limit=999`);
      assert.strictEqual(res5.status, 400, 'limit=999 vượt quá 100 phải trả về 400');
    });

    // 11. Gửi gender không được hỗ trợ -> 400 Bad Request
    await testCase('11. Validation: gender không hợp lệ -> HTTP 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}?gender=Unisex`);
      assert.strictEqual(res.status, 400, 'gender không phải Nam hoặc Nữ phải trả về 400');
      const json = await res.json();
      assert.strictEqual(json.statusCode, 400);
    });

    // 12. Gọi API không có JWT và xác nhận vẫn nhận được HTTP 200 nếu request hợp lệ
    await testCase('12. Gọi API công khai không có header Authorization -> HTTP 200', async () => {
      const res = await fetch(baseUrl, {
        headers: {}, // Không truyền token Authorization
      });
      assert.strictEqual(res.status, 200, 'API công khai phải cho phép truy cập không cần token');
    });

    // 13. Kiểm tra dữ liệu trả về không chứa các trường ngoài phạm vi công khai
    await testCase('13. Bảo mật: Dữ liệu trả về chỉ chứa các trường hiển thị công khai', async () => {
      const res = await fetch(`${baseUrl}?limit=1`);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.ok(json.data.length > 0);
      const item = json.data[0];

      // Các trường cho phép hiển thị
      const allowedFields = new Set([
        'id',
        'name',
        'description',
        'gender',
        'faceShapes',
        'hairType',
        'imageUrl',
        'tags',
        'createdAt',
      ]);

      for (const key of Object.keys(item)) {
        assert.ok(
          allowedFields.has(key),
          `Trường ${key} không được phép xuất hiện trong dữ liệu công khai`,
        );
      }

      // Xác nhận các trường nhạy cảm/quan hệ không tồn tại
      assert.strictEqual(item.tryOnHistories, undefined);
      assert.strictEqual(item.password, undefined);
    });

    // ========================================================
    // BỘ KIỂM THỬ CHO BE-03.2: GET /api/hairstyles/:id
    // ========================================================
    console.log('\n--- BẮT ĐẦU KIỂM THỬ CHO API GET /api/hairstyles/:id ---');

    // 14. Lấy chi tiết mẫu tóc thành công với ID hợp lệ
    let testHairstyleId = 1;
    await testCase('14. GET /api/hairstyles/:id hợp lệ -> HTTP 200, trả về đầy đủ thông tin mẫu tóc', async () => {
      const listRes = await fetch(`${baseUrl}?limit=1`);
      const listJson = await listRes.json();
      assert.ok(listJson.data.length > 0, 'Phải có ít nhất 1 mẫu tóc trong database');
      testHairstyleId = listJson.data[0].id;

      const res = await fetch(`${baseUrl}/${testHairstyleId}`);
      assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}`);
      const json = await res.json();
      assert.strictEqual(json.id, testHairstyleId);
      assert.ok(typeof json.name === 'string' && json.name.length > 0, 'Name phải là chuỗi hợp lệ');
      assert.ok(typeof json.imageUrl === 'string' && json.imageUrl.length > 0, 'imageUrl phải tồn tại');
      assert.ok(Array.isArray(json.hairFace), 'hairFace phải là mảng');
      console.log('   Mẫu response thực tế:', JSON.stringify(json, null, 2));
    });

    // 15. Kiểm tra thông tin dáng mặt faceShape và suitabilityScore
    await testCase('15. Chi tiết mẫu tóc -> hairFace chứa thông tin faceShape và suitabilityScore chính xác', async () => {
      const res = await fetch(`${baseUrl}/${testHairstyleId}`);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.ok(Array.isArray(json.hairFace), 'hairFace phải là mảng');
      assert.ok(json.hairFace.length > 0, 'Mẫu tóc seed phải có ít nhất 1 liên kết hairFace');
      for (const item of json.hairFace) {
        assert.ok(typeof item.suitabilityScore === 'number', 'suitabilityScore phải là số');
        assert.ok(item.suitabilityScore > 0 && item.suitabilityScore <= 1.0, 'suitabilityScore phải nằm trong khoảng (0, 1]');
        assert.ok(item.faceShape, 'faceShape phải tồn tại');
        assert.ok(typeof item.faceShape.id === 'number', 'faceShape.id phải là số');
        assert.ok(typeof item.faceShape.name === 'string', 'faceShape.name phải là chuỗi');
      }
    });

    // 16. Mẫu tóc không có dáng mặt liên kết -> trả HTTP 200 với hairFace: []
    await testCase('16. Mẫu tóc không có dáng mặt liên kết -> HTTP 200 với hairFace là mảng rỗng []', async () => {
      const { PrismaService } = await import('../src/prisma/prisma.service');
      const prisma = app.get(PrismaService);
      const isolatedHairstyle = await prisma.hairstyle.create({
        data: {
          name: 'Kiểu tóc thử nghiệm độc lập',
          gender: 'Nam',
          imageUrl: 'https://example.com/test-isolated.png',
        },
      });

      try {
        const res = await fetch(`${baseUrl}/${isolatedHairstyle.id}`);
        assert.strictEqual(res.status, 200);
        const json = await res.json();
        assert.strictEqual(json.id, isolatedHairstyle.id);
        assert.ok(Array.isArray(json.hairFace), 'hairFace phải là một mảng');
        assert.strictEqual(json.hairFace.length, 0, 'hairFace phải là mảng rỗng []');
      } finally {
        await prisma.hairstyle.delete({ where: { id: isolatedHairstyle.id } });
      }
    });

    // 17. ID không tồn tại -> HTTP 404 Not Found
    await testCase('17. GET /api/hairstyles/:id với ID không tồn tại -> HTTP 404 Not Found', async () => {
      const nonExistentId = 9999999;
      const res = await fetch(`${baseUrl}/${nonExistentId}`);
      assert.strictEqual(res.status, 404);
      const json = await res.json();
      assert.strictEqual(json.statusCode, 404);
      assert.strictEqual(json.message, 'Hairstyle not found');
    });

    // 18. ID sai định dạng (chuỗi không phải số) -> HTTP 400 Bad Request
    await testCase('18. GET /api/hairstyles/:id với ID không phải số (abc) -> HTTP 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/abc`);
      assert.strictEqual(res.status, 400);
      const json = await res.json();
      assert.strictEqual(json.statusCode, 400);
    });

    // 19. ID số âm hoặc bằng 0 -> HTTP 400 Bad Request
    await testCase('19. GET /api/hairstyles/:id với ID <= 0 (0, -5) -> HTTP 400 Bad Request', async () => {
      const res0 = await fetch(`${baseUrl}/0`);
      assert.strictEqual(res0.status, 400);
      const json0 = await res0.json();
      assert.strictEqual(json0.statusCode, 400);

      const resNeg = await fetch(`${baseUrl}/-5`);
      assert.strictEqual(resNeg.status, 400);
      const jsonNeg = await resNeg.json();
      assert.strictEqual(jsonNeg.statusCode, 400);
    });

  } finally {
    await app.close();
  }

  console.log(`\n========================================`);
  console.log(`Tổng kết kiểm thử: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log(`========================================\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Lỗi ngoại lệ trong quá trình chạy test:', err);
  process.exit(1);
});
