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
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi chạy seed database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
