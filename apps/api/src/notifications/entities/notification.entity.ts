import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class NotificationEntity {
  @ApiProperty({ example: 'n1o2t3i4-0000-0000-0000-000000000000' })
  id: string;

  @ApiProperty({ example: 'u1s2e3r4-0000-0000-0000-000000000000' })
  userId: string;

  @ApiProperty({ enum: NotificationType, example: NotificationType.BID_RECEIVED })
  type: NotificationType;

  @ApiProperty({ example: 'Новый отклик' })
  title: string;

  @ApiProperty({ example: 'Исполнитель откликнулся на ваш проект.' })
  message: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '/projects/a1b2c3d4-0000-0000-0000-000000000000',
  })
  link: string | null;

  @ApiProperty({ example: false })
  isRead: boolean;

  @ApiProperty({ example: '2026-04-10T10:00:00.000Z' })
  createdAt: Date;
}

export class NotificationsResponseEntity {
  @ApiProperty({ type: [NotificationEntity] })
  items: NotificationEntity[];

  @ApiProperty({ example: 3, description: 'Количество непрочитанных' })
  unreadCount: number;
}

export class UnreadCountEntity {
  @ApiProperty({ example: 3 })
  count: number;
}
