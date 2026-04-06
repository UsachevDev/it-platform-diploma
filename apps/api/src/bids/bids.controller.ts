import {
  Body,
  Controller,
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
@Controller('projects/:id/bids')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  @Post()
  @Roles(UserRole.CONTRACTOR)
  @ApiOperation({ summary: 'Отправить отклик на проект' })
  create(
    @Param('id', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateBidDto,
    @CurrentUser() currentUser: { sub: string; role: UserRole },
  ) {
    return this.bidsService.create(projectId, dto, currentUser);
  }
}
