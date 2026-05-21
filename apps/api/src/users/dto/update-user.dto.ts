import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'Илья Усачев',
    description: 'Имя пользователя',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    example: 'Frontend developer, NestJS learner',
    description: 'Краткая информация о пользователе',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  about?: string;

  @ApiPropertyOptional({
    example: ['Next.js', 'TypeScript', 'NestJS', 'PostgreSQL'],
    description: 'Навыки пользователя',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  @ArrayMaxSize(30)
  skills?: string[];
}
