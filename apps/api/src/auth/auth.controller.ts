import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { Roles } from './decorators/roles.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtPayload } from './types/jwt-payload.type';

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Регистрация пользователя' })
  @ApiOkResponse({ description: 'Пользователь успешно зарегистрирован' })
  @ApiBadRequestResponse({ description: 'Некорректные данные' })
  @ApiConflictResponse({
    description: 'Пользователь с таким email уже существует',
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Вход в систему' })
  @ApiOkResponse({ description: 'Пользователь успешно авторизован' })
  @ApiBadRequestResponse({ description: 'Некорректные данные' })
  @ApiUnauthorizedResponse({ description: 'Неверный email или пароль' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.CONTRACTOR)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Получить профиль текущего пользователя' })
  @ApiOkResponse({ description: 'Профиль пользователя успешно получен' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  getMe(@Req() req: AuthenticatedRequest) {
    return this.authService.getMe(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @Get('customer-only')
  @ApiOperation({ summary: 'Тестовый роут только для заказчика' })
  @ApiOkResponse({ description: 'Доступ разрешён' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiForbiddenResponse({ description: 'Недостаточно прав' })
  customerOnly(@Req() req: AuthenticatedRequest) {
    return {
      message: 'Доступ разрешён только заказчику',
      user: req.user,
    };
  }
}
