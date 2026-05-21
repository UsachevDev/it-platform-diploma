import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { BidsController } from './bids.controller';
import { BidsService } from './bids.service';

@Module({
  imports: [NotificationsModule],
  controllers: [BidsController],
  providers: [BidsService, PrismaService],
})
export class BidsModule {}
