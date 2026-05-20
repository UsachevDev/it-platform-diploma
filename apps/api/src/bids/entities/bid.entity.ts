import { ApiProperty } from '@nestjs/swagger';
import { BidStatus, ProjectStatus } from '@prisma/client';
import { PaginationMetaEntity } from '../../common/swagger/common.entity';
import { UserRefEntity } from '../../users/entities/user.entity';

export class BidProjectRefEntity {
  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-000000000000' })
  id: string;

  @ApiProperty({ example: 'Разработка MVP веб-платформы' })
  title: string;

  @ApiProperty({ enum: ProjectStatus, example: ProjectStatus.OPEN })
  status: ProjectStatus;
}

export class BidEntity {
  @ApiProperty({ example: 'c1d2e3f4-0000-0000-0000-000000000000' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-000000000000' })
  projectId: string;

  @ApiProperty({ example: 'd1e2f3a4-0000-0000-0000-000000000000' })
  contractorId: string;

  @ApiProperty({ example: 50000, description: 'Предложенная цена, ₽' })
  price: number;

  @ApiProperty({ example: 14, description: 'Срок выполнения, дней' })
  durationDays: number;

  @ApiProperty({ example: 'Готов взяться, есть релевантный опыт.' })
  coverLetter: string;

  @ApiProperty({ enum: BidStatus, example: BidStatus.PENDING })
  status: BidStatus;

  @ApiProperty({ example: '2026-04-02T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-02T12:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({
    type: UserRefEntity,
    required: false,
    description: 'Исполнитель (в ответах по проекту)',
  })
  contractor?: UserRefEntity;

  @ApiProperty({
    type: BidProjectRefEntity,
    required: false,
    description: 'Проект (в ответах «мои отклики»)',
  })
  project?: BidProjectRefEntity;
}

export class BidsListResponseEntity {
  @ApiProperty({ type: [BidEntity] })
  data: BidEntity[];

  @ApiProperty({ type: PaginationMetaEntity })
  meta: PaginationMetaEntity;
}

export class AcceptBidResponseEntity {
  @ApiProperty({ example: 'Исполнитель выбран, проект переведён в IN_WORK' })
  message: string;

  @ApiProperty({ type: BidEntity })
  bid: BidEntity;

  @ApiProperty({ type: BidProjectRefEntity })
  project: BidProjectRefEntity;
}
