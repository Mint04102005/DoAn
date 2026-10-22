import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, SalonStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { pageResult, paginate } from '../common/pagination.dto';
import {
  LogsQueryDto,
  ReviewSalonDto,
  SalonsQueryDto,
  UsersQueryDto,
  WriteHairstyleDto,
} from './admin.dto';

const publicUser = {
  id: true,
  email: true,
  name: true,
  phone: true,
  gender: true,
  dob: true,
  address: true,
  avatarUrl: true,
  role: true,
  isLocked: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const [
      pendingApprovalsCount,
      totalUsersCount,
      totalSalonsCount,
      lockedUsersCount,
      totalTryOnsCount,
      totalRecommendationsCount,
    ] = await this.prisma.$transaction([
      this.prisma.salon.count({ where: { status: 'PENDING' } }),
      this.prisma.user.count(),
      this.prisma.salon.count(),
      this.prisma.user.count({ where: { isLocked: true } }),
      this.prisma.tryOnHistory.count(),
      this.prisma.recommendationLog.count(),
    ]);
    return {
      pendingApprovalsCount,
      totalUsersCount,
      totalSalonsCount,
      lockedUsersCount,
      totalTryOnsCount,
      totalRecommendationsCount,
    };
  }

  async users(query: UsersQueryDto) {
    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.status ? { isLocked: query.status === 'locked' } : {}),
      ...(query.search?.trim()
        ? {
            OR: ['name', 'email', 'phone'].map((field) => ({
              [field]: { contains: query.search.trim(), mode: 'insensitive' },
            })),
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: { ...publicUser, salons: true },
        ...paginate(query),
        orderBy: { id: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    return pageResult(data, total, query);
  }

  async user(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { ...publicUser, salons: true },
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }

  async lock(adminId: number, id: number, isLocked: boolean) {
    return this.prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id },
        select: publicUser,
      });
      if (!target) throw new NotFoundException('Không tìm thấy người dùng');
      if (isLocked && (id === adminId || target.role === Role.ADMIN))
        throw new BadRequestException(
          'Không được khóa tài khoản quản trị viên',
        );
      const user = await tx.user.update({
        where: { id },
        data: { isLocked },
        select: publicUser,
      });
      await tx.auditLog.create({
        data: {
          adminId,
          action: isLocked ? 'LOCK_USER' : 'UNLOCK_USER',
          targetEntity: `User:${id}`,
        },
      });
      return user;
    });
  }

  async salons(query: SalonsQueryDto) {
    const where: Prisma.SalonWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search?.trim()
        ? { name: { contains: query.search.trim(), mode: 'insensitive' } }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.salon.findMany({
        where,
        include: { owner: { select: publicUser } },
        ...paginate(query),
        orderBy: { id: 'desc' },
      }),
      this.prisma.salon.count({ where }),
    ]);
    return pageResult(data, total, query);
  }

  async salon(id: number) {
    const salon = await this.prisma.salon.findUnique({
      where: { id },
      include: { owner: { select: publicUser } },
    });
    if (!salon) throw new NotFoundException('Không tìm thấy salon');
    return salon;
  }

  async review(adminId: number, id: number, dto: ReviewSalonDto) {
    return this.prisma.$transaction(async (tx) => {
      const target = await tx.salon.findUnique({
        where: { id },
        include: { owner: { select: publicUser } },
      });
      if (!target) throw new NotFoundException('Không tìm thấy salon');
      if (
        dto.status === 'APPROVED' &&
        (target.owner.isLocked || target.owner.role !== Role.SALON_OWNER)
      )
        throw new BadRequestException('Chủ salon không đủ điều kiện hoạt động');
      const changed = await tx.salon.updateMany({
        where: { id, status: SalonStatus.PENDING },
        data: { status: dto.status },
      });
      if (!changed.count) throw new ConflictException('Yêu cầu đã được xử lý');
      await tx.auditLog.create({
        data: {
          adminId,
          action: dto.status === 'APPROVED' ? 'APPROVE_SALON' : 'REJECT_SALON',
          targetEntity: `Salon:${id}`,
          details: dto.reason,
        },
      });
      return tx.salon.findUnique({ where: { id } });
    });
  }

  async logs(query: LogsQueryDto) {
    let since: Date | undefined;
    if (query.dateRange === 'today') {
      const day = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
      since = new Date(`${day}T00:00:00+07:00`);
    } else if (query.dateRange)
      since = new Date(
        Date.now() - (query.dateRange === '7d' ? 7 : 30) * 86400000,
      );
    const where: Prisma.AuditLogWhereInput = {
      ...(query.adminId ? { adminId: query.adminId } : {}),
      ...(since ? { createdAt: { gte: since } } : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              {
                action: { contains: query.search.trim(), mode: 'insensitive' },
              },
              {
                targetEntity: {
                  contains: query.search.trim(),
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        ...paginate(query),
        include: { admin: { select: { id: true, name: true } } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return pageResult(data, total, query);
  }

  async writeHairstyle(adminId: number, dto: WriteHairstyleDto, id?: number) {
    const ids = dto.rules.map((rule) => rule.faceShapeId);
    if (new Set(ids).size !== ids.length)
      throw new BadRequestException('Dáng mặt bị trùng trong quy tắc');
    if (!dto.name.trim())
      throw new BadRequestException('Tên kiểu tóc không được rỗng');
    return this.prisma.$transaction(async (tx) => {
      const shapes = await tx.faceShape.findMany({
        where: { id: { in: ids } },
      });
      if (shapes.length !== ids.length)
        throw new BadRequestException('Dáng mặt không tồn tại');
      if (id && !(await tx.hairstyle.findUnique({ where: { id } })))
        throw new NotFoundException('Không tìm thấy kiểu tóc');
      const data = {
        name: dto.name.trim(),
        gender: dto.gender,
        description: dto.description ?? null,
        hairType: dto.hairType ?? null,
        imageUrl: dto.imageUrl,
        tags: dto.tags,
        faceShapes: shapes.map((shape) => shape.name),
      };
      const hair = id
        ? await tx.hairstyle.update({ where: { id }, data })
        : await tx.hairstyle.create({ data });
      await tx.hairFace.deleteMany({ where: { hairstyleId: hair.id } });
      if (dto.rules.length)
        await tx.hairFace.createMany({
          data: dto.rules.map((rule) => ({ hairstyleId: hair.id, ...rule })),
        });
      await tx.auditLog.create({
        data: {
          adminId,
          action: id ? 'UPDATE_HAIRSTYLE' : 'CREATE_HAIRSTYLE',
          targetEntity: `Hairstyle:${hair.id}`,
        },
      });
      return tx.hairstyle.findUnique({
        where: { id: hair.id },
        include: { hairFace: true },
      });
    });
  }

  async deleteHairstyle(adminId: number, id: number) {
    return this.prisma.$transaction(async (tx) => {
      if (!(await tx.hairstyle.findUnique({ where: { id } })))
        throw new NotFoundException('Không tìm thấy kiểu tóc');
      await tx.hairstyle.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          adminId,
          action: 'DELETE_HAIRSTYLE',
          targetEntity: `Hairstyle:${id}`,
        },
      });
      return { message: 'Đã xóa kiểu tóc; lịch sử thử tóc được giữ lại' };
    });
  }

  async createFaceShape(adminId: number, name: string) {
    return this.prisma.$transaction(async (tx) => {
      const shape = await tx.faceShape.upsert({
        where: { name },
        create: { name },
        update: {},
      });
      await tx.auditLog.create({
        data: {
          adminId,
          action: 'ENSURE_FACE_SHAPE',
          targetEntity: `FaceShape:${shape.id}`,
        },
      });
      return shape;
    });
  }
}
