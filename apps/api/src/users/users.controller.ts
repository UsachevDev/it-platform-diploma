import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateEmailDto } from './dto/update-email.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';
import { MessageResponseEntity } from '../common/swagger/common.entity';

type AuthRequest = Request & {
  user: {
    sub?: string;
    id?: string;
    email?: string;
    role?: string;
  };
};

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Получить профиль текущего пользователя' })
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Профиль текущего пользователя успешно получен',
    type: UserEntity,
  })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: AuthRequest) {
    const userId = req.user.sub ?? req.user.id;

    return this.usersService.getMe(userId as string);
  }

  @ApiOperation({ summary: 'Обновить профиль текущего пользователя' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Профиль успешно обновлён', type: UserEntity })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@Req() req: AuthRequest, @Body() dto: UpdateUserDto) {
    const userId = req.user.sub ?? req.user.id;

    return this.usersService.updateMe(userId as string, dto);
  }

  @ApiOperation({ summary: 'Сменить email (требуется текущий пароль)' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Email успешно изменён', type: UserEntity })
  @ApiBadRequestResponse({ description: 'Некорректные данные' })
  @ApiUnauthorizedResponse({
    description: 'Пользователь не авторизован или неверный текущий пароль',
  })
  @ApiConflictResponse({ description: 'Email уже занят' })
  @UseGuards(JwtAuthGuard)
  @Patch('me/email')
  updateEmail(@Req() req: AuthRequest, @Body() dto: UpdateEmailDto) {
    const userId = req.user.sub ?? req.user.id;

    return this.usersService.updateEmail(userId as string, dto);
  }

  @ApiOperation({ summary: 'Сменить пароль (требуется текущий пароль)' })
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Пароль успешно изменён',
    type: MessageResponseEntity,
  })
  @ApiBadRequestResponse({ description: 'Некорректные данные' })
  @ApiUnauthorizedResponse({
    description: 'Пользователь не авторизован или неверный текущий пароль',
  })
  @ApiConflictResponse({
    description: 'Новый пароль совпадает с текущим',
  })
  @UseGuards(JwtAuthGuard)
  @Patch('me/password')
  updatePassword(@Req() req: AuthRequest, @Body() dto: UpdatePasswordDto) {
    const userId = req.user.sub ?? req.user.id;

    return this.usersService.updatePassword(userId as string, dto);
  }

  @ApiOperation({ summary: 'Получить публичный профиль пользователя по id' })
  @ApiParam({
    name: 'id',
    example: 'cm1abc123xyz',
    description: 'User id',
  })
  @ApiOkResponse({
    description: 'Публичный профиль пользователя успешно получен',
    type: UserEntity,
  })
  @ApiNotFoundResponse({ description: 'Пользователь не найден' })
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.usersService.getById(id);
  }
}
