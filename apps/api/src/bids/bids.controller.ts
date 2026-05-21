import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { UpdateBidDto } from './dto/update-bid.dto';
import { AcceptBidResponseEntity, BidEntity } from './entities/bid.entity';
import { MessageResponseEntity } from '../common/swagger/common.entity';

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
  @ApiOkResponse({ description: 'Отклик успешно отправлен', type: BidEntity })
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
  @ApiOkResponse({
    description: 'Список откликов успешно получен',
    type: BidEntity,
    isArray: true,
  })
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
  @ApiOkResponse({
    description: 'Список моих откликов успешно получен',
    type: BidEntity,
    isArray: true,
  })
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
    type: AcceptBidResponseEntity,
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
  @ApiOkResponse({ description: 'Отклик успешно отклонён', type: BidEntity })
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

  @Patch('bids/:id')
  @Roles(UserRole.CONTRACTOR)
  @ApiOperation({
    summary: 'Изменить свой отклик (только PENDING, проект OPEN)',
  })
  @ApiParam({ name: 'id', description: 'UUID отклика' })
  @ApiOkResponse({ description: 'Отклик успешно обновлён', type: BidEntity })
  @ApiBadRequestResponse({ description: 'Некорректные данные отклика' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiForbiddenResponse({
    description: 'Только автор может изменить отклик',
  })
  @ApiConflictResponse({
    description: 'Изменять можно только PENDING-отклик на открытом проекте',
  })
  update(
    @Param('id', ParseUUIDPipe) bidId: string,
    @Body() dto: UpdateBidDto,
    @CurrentUser() currentUser: { sub: string; role: UserRole },
  ) {
    return this.bidsService.update(bidId, dto, currentUser);
  }

  @Delete('bids/:id')
  @Roles(UserRole.CONTRACTOR)
  @ApiOperation({
    summary: 'Удалить свой отклик (только PENDING, проект OPEN)',
  })
  @ApiParam({ name: 'id', description: 'UUID отклика' })
  @ApiOkResponse({
    description: 'Отклик успешно удалён',
    type: MessageResponseEntity,
  })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  @ApiForbiddenResponse({
    description: 'Только автор может удалить отклик',
  })
  @ApiConflictResponse({
    description: 'Удалить можно только PENDING-отклик на открытом проекте',
  })
  remove(
    @Param('id', ParseUUIDPipe) bidId: string,
    @CurrentUser() currentUser: { sub: string; role: UserRole },
  ) {
    return this.bidsService.remove(bidId, currentUser);
  }
}
