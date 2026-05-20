import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, ProjectStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateReviewDto } from './dto/create-review.dto';

const reviewUserRef = {
  select: { id: true, name: true, email: true, role: true },
} as const;

const reviewInclude = {
  author: reviewUserRef,
  target: reviewUserRef,
} as const;

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(projectId: string, dto: CreateReviewDto, authorId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        status: true,
        customerId: true,
        selectedContractorId: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Проект не найден');
    }

    if (project.status !== ProjectStatus.DONE) {
      throw new ConflictException(
        'Оставить отзыв можно только по завершённому проекту',
      );
    }

    const isCustomer = project.customerId === authorId;
    const isContractor = project.selectedContractorId === authorId;

    if (!isCustomer && !isContractor) {
      throw new ForbiddenException(
        'Отзыв может оставить только участник проекта',
      );
    }

    const targetId = isCustomer
      ? project.selectedContractorId
      : project.customerId;

    if (!targetId) {
      throw new ConflictException('У проекта нет второго участника');
    }

    const existing = await this.prisma.review.findUnique({
      where: { projectId_authorId: { projectId, authorId } },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Вы уже оставили отзыв по этому проекту');
    }

    const review = await this.prisma.review.create({
      data: {
        projectId,
        authorId,
        targetId,
        rating: dto.rating,
        comment: dto.comment.trim(),
      },
      include: reviewInclude,
    });

    this.logger.log(
      `Review created: projectId=${projectId}, authorId=${authorId}, targetId=${targetId}`,
    );

    await this.notifications.create({
      userId: targetId,
      type: NotificationType.REVIEW_RECEIVED,
      title: 'Новый отзыв',
      message: `${review.author.name} оставил отзыв с оценкой ${dto.rating}/5.`,
      link: `/projects/${projectId}`,
    });

    return review;
  }

  findByProject(projectId: string) {
    return this.prisma.review.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: reviewInclude,
    });
  }

  async findByUser(userId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { targetId: userId },
      orderBy: { createdAt: 'desc' },
      include: reviewInclude,
    });

    const count = reviews.length;
    const averageRating =
      count > 0
        ? Math.round(
            (reviews.reduce((sum, review) => sum + review.rating, 0) / count) *
              10,
          ) / 10
        : null;

    return { averageRating, count, reviews };
  }
}
