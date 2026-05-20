import { ApiProperty } from '@nestjs/swagger';
import { UserRefEntity } from '../../users/entities/user.entity';

export class ReviewEntity {
  @ApiProperty({ example: 'r1e2v3i4-0000-0000-0000-000000000000' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-000000000000' })
  projectId: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  rating: number;

  @ApiProperty({ example: 'Отличная работа, рекомендую.' })
  comment: string;

  @ApiProperty({ example: '2026-04-10T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ type: UserRefEntity, description: 'Автор отзыва' })
  author: UserRefEntity;

  @ApiProperty({ type: UserRefEntity, description: 'Получатель отзыва' })
  target: UserRefEntity;
}

export class UserReviewsResponseEntity {
  @ApiProperty({
    type: Number,
    nullable: true,
    example: 4.8,
    description: 'Средняя оценка (null — отзывов ещё нет)',
  })
  averageRating: number | null;

  @ApiProperty({ example: 12, description: 'Количество полученных отзывов' })
  count: number;

  @ApiProperty({ type: [ReviewEntity] })
  reviews: ReviewEntity[];
}
