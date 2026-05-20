import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminService } from './admin.service';
import { BlockUserDto } from './dto/block-user.dto';
import {
  GetAdminBidsQueryDto,
  GetAdminProjectsQueryDto,
} from './dto/get-admin-list-query.dto';
import { GetAdminUsersQueryDto } from './dto/get-admin-users-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
@ApiForbiddenResponse({ description: 'Доступ только для администратора' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Статистика платформы' })
  @ApiOkResponse({ description: 'Агрегированная статистика' })
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Список пользователей' })
  @ApiOkResponse({ description: 'Список пользователей' })
  findUsers(@Query() query: GetAdminUsersQueryDto) {
    return this.adminService.findUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Детальная информация о пользователе' })
  @ApiParam({ name: 'id', description: 'UUID пользователя' })
  @ApiOkResponse({ description: 'Профиль с проектами и откликами' })
  getUserDetail(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Post('users/:id/block')
  @ApiOperation({ summary: 'Заблокировать пользователя (причина + срок)' })
  @ApiParam({ name: 'id', description: 'UUID пользователя' })
  @ApiOkResponse({ description: 'Пользователь заблокирован' })
  blockUser(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: BlockUserDto,
    @CurrentUser() currentUser: { sub: string },
  ) {
    return this.adminService.blockUser(id, currentUser.sub, dto);
  }

  @Post('users/:id/unblock')
  @ApiOperation({ summary: 'Разблокировать пользователя' })
  @ApiParam({ name: 'id', description: 'UUID пользователя' })
  @ApiOkResponse({ description: 'Пользователь разблокирован' })
  unblockUser(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() currentUser: { sub: string },
  ) {
    return this.adminService.unblockUser(id, currentUser.sub);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Изменить роль пользователя' })
  @ApiParam({ name: 'id', description: 'UUID пользователя' })
  @ApiOkResponse({ description: 'Роль изменена' })
  updateUserRole(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() currentUser: { sub: string },
  ) {
    return this.adminService.updateUserRole(id, currentUser.sub, dto.role);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Удалить пользователя' })
  @ApiParam({ name: 'id', description: 'UUID пользователя' })
  @ApiOkResponse({ description: 'Пользователь удалён' })
  deleteUser(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() currentUser: { sub: string },
  ) {
    return this.adminService.deleteUser(id, currentUser.sub);
  }

  @Get('projects')
  @ApiOperation({ summary: 'Все проекты платформы' })
  @ApiOkResponse({ description: 'Список проектов' })
  findProjects(@Query() query: GetAdminProjectsQueryDto) {
    return this.adminService.findProjects(query);
  }

  @Post('projects/:id/cancel')
  @ApiOperation({ summary: 'Принудительно отменить проект (модерация)' })
  @ApiParam({ name: 'id', description: 'UUID проекта' })
  @ApiOkResponse({ description: 'Проект отменён' })
  cancelProject(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() currentUser: { sub: string },
  ) {
    return this.adminService.cancelProject(id, currentUser.sub);
  }

  @Delete('projects/:id')
  @ApiOperation({ summary: 'Удалить проект' })
  @ApiParam({ name: 'id', description: 'UUID проекта' })
  @ApiOkResponse({ description: 'Проект удалён' })
  deleteProject(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() currentUser: { sub: string },
  ) {
    return this.adminService.deleteProject(id, currentUser.sub);
  }

  @Get('bids')
  @ApiOperation({ summary: 'Все отклики платформы' })
  @ApiOkResponse({ description: 'Список откликов' })
  findBids(@Query() query: GetAdminBidsQueryDto) {
    return this.adminService.findBids(query);
  }

  @Delete('bids/:id')
  @ApiOperation({ summary: 'Удалить отклик' })
  @ApiParam({ name: 'id', description: 'UUID отклика' })
  @ApiOkResponse({ description: 'Отклик удалён' })
  deleteBid(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() currentUser: { sub: string },
  ) {
    return this.adminService.deleteBid(id, currentUser.sub);
  }
}
