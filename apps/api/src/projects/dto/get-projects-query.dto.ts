import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

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
}
