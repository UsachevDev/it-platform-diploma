import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
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
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { MessageResponseEntity } from '../common/swagger/common.entity';
import {
  NotificationEntity,
  NotificationsResponseEntity,
  UnreadCountEntity,
} from './entities/notification.entity';
import { NotificationsService } from './notifications.service';

type AuthenticatedRequest = Request & { user: JwtPayload };

@ApiTags('Notifications')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Уведомления текущего пользователя' })
  @ApiOkResponse({
    description: 'Список уведомлений и счётчик непрочитанных',
    type: NotificationsResponseEntity,
  })
  findAll(@Req() req: AuthenticatedRequest) {
    return this.notificationsService.findForUser(req.user.sub);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Количество непрочитанных уведомлений' })
  @ApiOkResponse({ description: 'Счётчик', type: UnreadCountEntity })
  getUnreadCount(@Req() req: AuthenticatedRequest) {
    return this.notificationsService.getUnreadCount(req.user.sub);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Отметить уведомление прочитанным' })
  @ApiParam({ name: 'id', description: 'UUID уведомления' })
  @ApiOkResponse({ description: 'Уведомление прочитано', type: NotificationEntity })
  @ApiForbiddenResponse({ description: 'Уведомление недоступно' })
  markRead(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.notificationsService.markRead(id, req.user.sub);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Отметить все уведомления прочитанными' })
  @ApiOkResponse({
    description: 'Все уведомления прочитаны',
    type: MessageResponseEntity,
  })
  markAllRead(@Req() req: AuthenticatedRequest) {
    return this.notificationsService.markAllRead(req.user.sub);
  }
}
