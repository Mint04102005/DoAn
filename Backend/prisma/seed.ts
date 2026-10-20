import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu kiểm tra và khởi tạo dữ liệu mẫu (Seed)...');

  // Kiểm tra tài khoản ADMIN đã tồn tại hay chưa
  const existingAdmin = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
  });

  if (!existingAdmin) {
    const defaultAdminEmail = 'admin@curator.ai';
    const defaultPassword = 'Admin@123456';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const admin = await prisma.user.create({
      data: {
        email: defaultAdminEmail,
        password: hashedPassword,
        name: 'System Administrator',
        phone: '0901234567',
        role: Role.ADMIN,
      },
    });

    console.log(`✅ Đã tạo tài khoản Quản trị viên mặc định thành công:`);
    console.log(`   - Email: ${admin.email}`);
    console.log(`   - Password: ${defaultPassword}`);
    console.log(`   - Role: ${admin.role}`);
  } else {
    console.log(`ℹ️ Tài khoản Quản trị viên (ADMIN) đã tồn tại: ${existingAdmin.email}`);
  }

  // Khởi tạo dữ liệu mẫu cho Hairstyles nếu chưa có
  const hairstyleCount = await prisma.hairstyle.count();
  if (hairstyleCount === 0) {
    console.log('💇 Bắt đầu khởi tạo dữ liệu mẫu cho Hairstyles...');
    await prisma.hairstyle.createMany({
      data: [
        {
          name: 'Layer Nam Hàn Quốc',
          description: 'Kiểu tóc layer nam nhẹ nhàng, trẻ trung chuẩn phong cách Hàn',
          gender: 'Nam',
          faceShapes: ['Oval', 'Tròn'],
          hairType: 'Thẳng',
          imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500',
          tags: ['layer', 'han-quoc', 'hot'],
        },
        {
          name: 'Side Part 7/3 Cổ Điển',
          description: 'Tóc side part lịch lãm, phong độ cho phái mạnh công sở',
          gender: 'Nam',
          faceShapes: ['Vuông', 'Oval'],
          hairType: 'Dày',
          imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500',
          tags: ['side-part', 'classic', 'lich-lam'],
        },
        {
          name: 'Undercut Hiện Đại',
          description: 'Cắt gọn hai bên, vuốt ngược năng động và nam tính',
          gender: 'Nam',
          faceShapes: ['Tròn', 'Dài'],
          hairType: 'Cứng',
          imageUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=500',
          tags: ['undercut', 'modern'],
        },
        {
          name: 'Mullet Layer Nam',
          description: 'Phong cách cá tính, phần đuôi tóc dài sành điệu',
          gender: 'Nam',
          faceShapes: ['Trái Tim', 'Oval'],
          hairType: 'Mỏng',
          imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500',
          tags: ['mullet', 'trendy'],
        },
        {
          name: 'Buzz Cut Tối Giản',
          description: 'Đầu đinh cắt sát gọn gàng, mạnh mẽ và mát mẻ',
          gender: 'Nam',
          faceShapes: ['Vuông'],
          hairType: 'Bất kỳ',
          imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
          tags: ['buzzcut', 'simple'],
        },
        {
          name: 'Pompadour Quý Tộc',
          description: 'Mái bồng cao cổ điển mang lại vẻ ngoài cuốn hút',
          gender: 'Nam',
          faceShapes: ['Oval', 'Tròn'],
          hairType: 'Dày',
          imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500',
          tags: ['pompadour'],
        },
        {
          name: 'French Crop Năng Động',
          description: 'Mái bằng tỉa textured cá tính dễ vào nếp',
          gender: 'Nam',
          faceShapes: ['Tròn'],
          hairType: 'Thẳng',
          imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
          tags: ['crop', 'modern'],
        },
        {
          name: 'Layer Nữ Bồng Bềnh',
          description: 'Tỉa layer nữ tự nhiên, bồng bềnh thanh thoát',
          gender: 'Nữ',
          faceShapes: ['Tròn', 'Oval', 'Trái Tim'],
          hairType: 'Mỏng',
          imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500',
          tags: ['layer', 'nu', 'bong-benh'],
        },
        {
          name: 'Bob Ngắn Cá Tính',
          description: 'Tóc bob ngang cằm tôn dáng mặt, hiện đại và trẻ trung',
          gender: 'Nữ',
          faceShapes: ['Oval', 'Tròn'],
          hairType: 'Thẳng',
          imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500',
          tags: ['bob', 'short', 'tre-trung'],
        },
        {
          name: 'Uốn Gợn Sóng Nước',
          description: 'Lọn sóng lơi quyến rũ, nữ tính và dịu dàng',
          gender: 'Nữ',
          faceShapes: ['Dài', 'Trái Tim'],
          hairType: 'Dày',
          imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500',
          tags: ['wavy', 'curly'],
        },
        {
          name: 'Pixie Nữ Quyền Lực',
          description: 'Tóc ngắn pixie nổi bật, thời thượng và phá cách',
          gender: 'Nữ',
          faceShapes: ['Oval'],
          hairType: 'Cứng',
          imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500',
          tags: ['pixie', 'short'],
        },
        {
          name: 'Hime Cut Độc Đáo',
          description: 'Tóc công chúa phong cách Nhật Bản sắc sảo',
          gender: 'Nữ',
          faceShapes: ['Dài', 'Oval'],
          hairType: 'Thẳng',
          imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500',
          tags: ['hime', 'japanese'],
        },
      ],
    });
    console.log('✅ Đã tạo thành công 12 mẫu tóc mẫu cho Hairstyles!');
  } else {
    console.log(`ℹ️ Đã có ${hairstyleCount} mẫu tóc trong cơ sở dữ liệu.`);
  }

  // Khởi tạo các dáng mặt FaceShape nếu chưa có
  const faceShapeNames = ['Oval', 'Tròn', 'Vuông', 'Trái Tim', 'Dài'];
  for (const name of faceShapeNames) {
    await prisma.faceShape.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('✅ Đã kiểm tra/khởi tạo danh sách FaceShape (Oval, Tròn, Vuông, Trái Tim, Dài).');

  // Khởi tạo liên kết HairFace cho các kiểu tóc
  const hairFaceCount = await prisma.hairFace.count();
  if (hairFaceCount === 0) {
    console.log('🔗 Đang khởi tạo bảng liên kết HairFace & độ phù hợp...');
    const allHairstyles = await prisma.hairstyle.findMany();
    const allFaceShapes = await prisma.faceShape.findMany();
    const faceShapeMap = new Map(allFaceShapes.map((fs) => [fs.name, fs.id]));

    for (const h of allHairstyles) {
      if (h.faceShapes && h.faceShapes.length > 0) {
        let score = 0.95;
        for (const shapeName of h.faceShapes) {
          const fsId = faceShapeMap.get(shapeName);
          if (fsId) {
            await prisma.hairFace.upsert({
              where: {
                hairstyleId_faceShapeId: {
                  hairstyleId: h.id,
                  faceShapeId: fsId,
                },
              },
              update: {},
              create: {
                hairstyleId: h.id,
                faceShapeId: fsId,
                suitabilityScore: score,
              },
            });
            score = Math.max(0.7, +(score - 0.1).toFixed(2));
          }
        }
      }
    }
    console.log('✅ Đã khởi tạo thành công dữ liệu bảng liên kết HairFace!');
  } else {
    console.log(`ℹ️ Đã có ${hairFaceCount} bản ghi trong bảng HairFace.`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi chạy seed database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
