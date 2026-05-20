import { ApiProperty } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';
import { PaginationMetaEntity } from '../../common/swagger/common.entity';
import { UserRefEntity } from '../../users/entities/user.entity';

export class ProjectCountEntity {
  @ApiProperty({ example: 3, description: 'Количество откликов на проект' })
  bids: number;
}

export class ProjectCategoryEntity {
  @ApiProperty({ example: 'e1f2a3b4-0000-0000-0000-000000000000' })
  id: string;

  @ApiProperty({ example: 'Веб-разработка' })
  name: string;

  @ApiProperty({ example: 'web' })
  slug: string;
}

export class ProjectEntity {
  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-000000000000' })
  id: string;

  @ApiProperty({ example: 'b1a2c3d4-0000-0000-0000-000000000000' })
  customerId: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'e1f2a3b4-0000-0000-0000-000000000000',
    description: 'ID категории проекта',
  })
  categoryId: string | null;

  @ApiProperty({ example: 'Разработка MVP веб-платформы' })
  title: string;

  @ApiProperty({ example: 'Нужно разработать платформу для IT-проектов' })
  description: string;

  @ApiProperty({ type: Number, nullable: true, example: 30000 })
  budgetMin: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 70000 })
  budgetMax: number | null;

  @ApiProperty({ enum: ProjectStatus, example: ProjectStatus.OPEN })
  status: ProjectStatus;

  @ApiProperty({
    type: String,
    nullable: true,
    example: null,
    description: 'ID выбранного исполнителя (если назначен)',
  })
  selectedContractorId: string | null;

  @ApiProperty({ example: '2026-04-01T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-01T10:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ type: UserRefEntity })
  customer: UserRefEntity;

  @ApiProperty({ type: UserRefEntity, nullable: true })
  selectedContractor: UserRefEntity | null;

  @ApiProperty({ type: ProjectCategoryEntity, nullable: true })
  category: ProjectCategoryEntity | null;

  @ApiProperty({ type: ProjectCountEntity })
  _count: ProjectCountEntity;
}

export class ProjectsListResponseEntity {
  @ApiProperty({ type: [ProjectEntity] })
  data: ProjectEntity[];

  @ApiProperty({ type: PaginationMetaEntity })
  meta: PaginationMetaEntity;
}
