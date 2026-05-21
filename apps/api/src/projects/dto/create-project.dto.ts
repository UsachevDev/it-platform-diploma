import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateProjectDto {
  @ApiProperty({
    example: 'Разработка MVP веб-платформы',
    minLength: 3,
    maxLength: 120,
  })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @Length(3, 120)
  title: string;

  @ApiProperty({
    example:
      'Нужно разработать платформу для заказчиков и исполнителей IT-проектов',
    minLength: 10,
    maxLength: 5000,
  })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @Length(10, 5000)
  description: string;

  @ApiProperty({
    example: 30000,
    minimum: 0,
    maximum: 100000000,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100000000)
  budgetMin: number;

  @ApiProperty({
    example: 70000,
    minimum: 0,
    maximum: 100000000,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100000000)
  budgetMax: number;

  @ApiProperty({
    example: 'e1f2a3b4-0000-0000-0000-000000000000',
    required: false,
    description: 'ID категории проекта',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
