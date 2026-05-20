import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

const toBoolean = ({ value }: { value: unknown }): unknown => {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1' || value === 1) return true;
  if (value === 'false' || value === '0' || value === 0) return false;
  return value;
};

export enum ProjectSortBy {
  NEWEST = 'newest',
  BUDGET_ASC = 'budgetAsc',
  BUDGET_DESC = 'budgetDesc',
}

export class GetProjectsQueryDto {
  @ApiPropertyOptional({
    type: Number,
    example: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    type: Number,
    example: 10,
    default: 10,
    maximum: 50,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 10;

  @ApiPropertyOptional({
    enum: ProjectStatus,
    example: ProjectStatus.OPEN,
  })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({
    example: 'mvp',
    description: 'Поиск по title и description',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 30000,
    description: 'Минимальный budgetMin проекта',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  budgetMin?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 100000,
    description: 'Максимальный budgetMax проекта',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  budgetMax?: number;

  @ApiPropertyOptional({
    enum: ProjectSortBy,
    example: ProjectSortBy.NEWEST,
    default: ProjectSortBy.NEWEST,
  })
  @IsOptional()
  @IsEnum(ProjectSortBy)
  sortBy?: ProjectSortBy = ProjectSortBy.NEWEST;

  @ApiPropertyOptional({
    type: Boolean,
    description:
      'Только проекты текущего пользователя (CUSTOMER → созданные, CONTRACTOR → где он принятый исполнитель)',
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  mine?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    description:
      'Только для CONTRACTOR: проекты, на которые пользователь отправил отклик',
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  responded?: boolean;

  @ApiPropertyOptional({
    description: 'Фильтр по ID категории',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
