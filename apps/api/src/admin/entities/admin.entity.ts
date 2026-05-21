import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaEntity } from '../../common/swagger/common.entity';
import { BidEntity } from '../../bids/entities/bid.entity';
import { ProjectEntity } from '../../projects/entities/project.entity';
import { UserEntity } from '../../users/entities/user.entity';

export class AdminUserCountEntity {
  @ApiProperty({ example: 4, description: 'Создано проектов (как заказчик)' })
  customerProjects: number;

  @ApiProperty({ example: 7, description: 'Отправлено откликов (как исполнитель)' })
  contractorBids: number;
}

export class AdminUserEntity extends UserEntity {
  @ApiProperty({ type: AdminUserCountEntity })
  _count: AdminUserCountEntity;
}

export class AdminUsersListResponseEntity {
  @ApiProperty({ type: [AdminUserEntity] })
  data: AdminUserEntity[];

  @ApiProperty({ type: PaginationMetaEntity })
  meta: PaginationMetaEntity;
}

export class AdminUserDetailEntity extends AdminUserEntity {
  @ApiProperty({ type: [ProjectEntity] })
  customerProjects: ProjectEntity[];

  @ApiProperty({ type: [BidEntity] })
  contractorBids: BidEntity[];
}

class AdminStatsUsersEntity {
  @ApiProperty({ example: 120 })
  total: number;

  @ApiProperty({ example: 70 })
  customers: number;

  @ApiProperty({ example: 48 })
  contractors: number;

  @ApiProperty({ example: 2 })
  blocked: number;
}

class AdminStatsProjectsEntity {
  @ApiProperty({ example: 85 })
  total: number;

  @ApiProperty({ example: 30 })
  open: number;

  @ApiProperty({ example: 25 })
  inWork: number;

  @ApiProperty({ example: 20 })
  done: number;

  @ApiProperty({ example: 10 })
  canceled: number;
}

class AdminStatsBidsEntity {
  @ApiProperty({ example: 240 })
  total: number;

  @ApiProperty({ example: 90 })
  pending: number;

  @ApiProperty({ example: 100 })
  accepted: number;

  @ApiProperty({ example: 50 })
  rejected: number;
}

export class AdminStatsEntity {
  @ApiProperty({ type: AdminStatsUsersEntity })
  users: AdminStatsUsersEntity;

  @ApiProperty({ type: AdminStatsProjectsEntity })
  projects: AdminStatsProjectsEntity;

  @ApiProperty({ type: AdminStatsBidsEntity })
  bids: AdminStatsBidsEntity;
}
