import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BidsService } from './bids.service';
import { CreateBidDto } from './dto/create-bid.dto';

@ApiTags('Bids')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  @Post('projects/:id/bids')
  @Roles(UserRole.CONTRACTOR)
  @ApiOperation({ summary: 'Отправить отклик на проект' })
  @ApiParam({ name: 'id', description: 'UUID проекта' })
  @ApiOkResponse({ description: 'Отклик успешно отправлен' })
  @ApiBadRequestResponse({ description: 'Некорректные данные отклика' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiForbiddenResponse({
    description: 'Только исполнитель может создать отклик',
  })
  @ApiConflictResponse({
    description: 'Отклик уже существует или проект недоступен',
  })
  create(
    @Param('id', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateBidDto,
    @CurrentUser() currentUser: { sub: string; role: UserRole },
  ) {
    return this.bidsService.create(projectId, dto, currentUser);
  }

  @Get('projects/:id/bids')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({
    summary: 'Получить отклики по проекту (только владелец проекта)',
  })
  @ApiParam({ name: 'id', description: 'UUID проекта' })
  @ApiOkResponse({ description: 'Список откликов успешно получен' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiForbiddenResponse({
    description: 'Только владелец проекта может просматривать отклики',
  })
  findProjectBids(
    @Param('id', ParseUUIDPipe) projectId: string,
    @CurrentUser() currentUser: { sub: string; role: UserRole },
  ) {
    return this.bidsService.findProjectBids(projectId, currentUser);
  }

  @Get('bids/my')
  @Roles(UserRole.CONTRACTOR)
  @ApiOperation({ summary: 'Получить мои отклики' })
  @ApiOkResponse({ description: 'Список моих откликов успешно получен' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiForbiddenResponse({
    description: 'Только исполнитель может просматривать свои отклики',
  })
  findMyBids(@CurrentUser() currentUser: { sub: string; role: UserRole }) {
    return this.bidsService.findMyBids(currentUser);
  }

  @Post('bids/:id/accept')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Принять отклик и выбрать исполнителя' })
  @ApiParam({ name: 'id', description: 'UUID отклика' })
  @ApiOkResponse({
    description:
      'Отклик принят, исполнитель выбран, проект переведён в IN_WORK',
  })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiForbiddenResponse({ description: 'Только заказчик может принять отклик' })
  @ApiConflictResponse({
    description: 'Отклик или проект в неподходящем статусе',
  })
  acceptBid(
    @Param('id', ParseUUIDPipe) bidId: string,
    @CurrentUser() currentUser: { sub: string; role: UserRole },
  ) {
    return this.bidsService.acceptBid(bidId, currentUser);
  }

  @Post('bids/:id/reject')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Отклонить отклик' })
  @ApiParam({ name: 'id', description: 'UUID отклика' })
  @ApiOkResponse({ description: 'Отклик успешно отклонён' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiForbiddenResponse({
    description: 'Только заказчик может отклонить отклик',
  })
  @ApiConflictResponse({
    description: 'Отклик или проект в неподходящем статусе',
  })
  rejectBid(
    @Param('id', ParseUUIDPipe) bidId: string,
    @CurrentUser() currentUser: { sub: string; role: UserRole },
  ) {
    return this.bidsService.rejectBid(bidId, currentUser);
  }
}
