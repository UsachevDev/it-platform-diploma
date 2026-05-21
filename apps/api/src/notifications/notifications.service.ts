import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type CreateNotificationParams = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
};

const RECENT_LIMIT = 30;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Создаёт уведомление. Ошибки не пробрасываются, чтобы сбой
   * уведомления не ломал основную бизнес-операцию.
   */
  async create(params: CreateNotificationParams): Promise<void> {
    try {
      await this.prisma.notification.create({
        data: {
          userId: params.userId,
          type: params.type,
          title: params.title,
          message: params.message,
          link: params.link ?? null,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to create notification for userId=${params.userId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async findForUser(userId: string) {
    const [items, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: RECENT_LIMIT,
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return { items, unreadCount };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { count };
  }

  async markRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      select: { id: true, userId: true },
    });

    if (!notification || notification.userId !== userId) {
      throw new ForbiddenException('Уведомление недоступно');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { message: 'Все уведомления прочитаны' };
  }
}
