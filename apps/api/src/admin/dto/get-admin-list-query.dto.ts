import { ApiPropertyOptional } from '@nestjs/swagger';
import { BidStatus, ProjectStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

class BaseAdminListQuery {
  @ApiPropertyOptional({ type: Number, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ type: Number, default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({ description: 'Поиск' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  search?: string;
}

export class GetAdminProjectsQueryDto extends BaseAdminListQuery {
  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}

export class GetAdminBidsQueryDto extends BaseAdminListQuery {
  @ApiPropertyOptional({ enum: BidStatus })
  @IsOptional()
  @IsEnum(BidStatus)
  status?: BidStatus;
}
