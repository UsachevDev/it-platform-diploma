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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateBidDto } from './dto/create-bid.dto';
import { BidsService } from './bids.service';

@ApiTags('Bids')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  @Post('projects/:id/bids')
  @Roles(UserRole.CONTRACTOR)
  @ApiOperation({ summary: 'Отправить отклик на проект' })
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
  findProjectBids(
    @Param('id', ParseUUIDPipe) projectId: string,
    @CurrentUser() currentUser: { sub: string; role: UserRole },
  ) {
    return this.bidsService.findProjectBids(projectId, currentUser);
  }

  @Get('bids/my')
  @Roles(UserRole.CONTRACTOR)
  @ApiOperation({ summary: 'Получить мои отклики' })
  findMyBids(@CurrentUser() currentUser: { sub: string; role: UserRole }) {
    return this.bidsService.findMyBids(currentUser);
  }

  @Post('bids/:id/accept')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Принять отклик и выбрать исполнителя' })
  acceptBid(
    @Param('id', ParseUUIDPipe) bidId: string,
    @CurrentUser() currentUser: { sub: string; role: UserRole },
  ) {
    return this.bidsService.acceptBid(bidId, currentUser);
  }

  @Post('bids/:id/reject')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Отклонить отклик' })
  rejectBid(
    @Param('id', ParseUUIDPipe) bidId: string,
    @CurrentUser() currentUser: { sub: string; role: UserRole },
  ) {
    return this.bidsService.rejectBid(bidId, currentUser);
  }
}
