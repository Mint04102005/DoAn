import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ChangePasswordDto } from '../users/dto/change-password.dto';
import { UpdateProfileDto } from '../users/dto/update-profile.dto';
import { UsersService } from '../users/users.service';
import {
  CreateFaceShapeDto,
  LockUserDto,
  LogsQueryDto,
  ReviewSalonDto,
  SalonsQueryDto,
  UsersQueryDto,
  WriteHairstyleDto,
} from './admin.dto';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly users: UsersService,
  ) {}

  @Get('dashboard') summary() {
    return this.admin.summary();
  }
  @Get('users') listUsers(@Query() query: UsersQueryDto) {
    return this.admin.users(query);
  }
  @Get('users/:id') user(@Param('id', ParseIntPipe) id: number) {
    return this.admin.user(id);
  }
  @Patch('users/:id/lock') lock(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LockUserDto,
  ) {
    return this.admin.lock(user.id, id, dto.isLocked);
  }
  @Get('salons') salons(@Query() query: SalonsQueryDto) {
    return this.admin.salons(query);
  }
  @Get('salons/:id') salon(@Param('id', ParseIntPipe) id: number) {
    return this.admin.salon(id);
  }
  @Patch('salons/:id/review') review(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewSalonDto,
  ) {
    return this.admin.review(user.id, id, dto);
  }
  @Get('logs') logs(@Query() query: LogsQueryDto) {
    return this.admin.logs(query);
  }
  @Get('profile') profile(@CurrentUser() user: { id: number }) {
    return this.users.getMe(user.id);
  }
  @Patch('profile') updateProfile(
    @CurrentUser() user: { id: number },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.users.updateProfile(user.id, dto);
  }
  @Patch('change-password') password(
    @CurrentUser() user: { id: number },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.users.changePassword(user.id, dto);
  }
  @Post('hairstyles') createHair(
    @CurrentUser() user: { id: number },
    @Body() dto: WriteHairstyleDto,
  ) {
    return this.admin.writeHairstyle(user.id, dto);
  }
  @Put('hairstyles/:id') updateHair(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: WriteHairstyleDto,
  ) {
    return this.admin.writeHairstyle(user.id, dto, id);
  }
  @Delete('hairstyles/:id') deleteHair(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.admin.deleteHairstyle(user.id, id);
  }
  @Post('face-shapes') faceShape(
    @CurrentUser() user: { id: number },
    @Body() dto: CreateFaceShapeDto,
  ) {
    return this.admin.createFaceShape(user.id, dto.name);
  }
}
