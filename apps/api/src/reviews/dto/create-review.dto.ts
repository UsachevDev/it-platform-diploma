import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    example: 5,
    minimum: 1,
    maximum: 5,
    description: 'Оценка от 1 до 5',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    example: 'Отличная работа, всё в срок и качественно.',
    maxLength: 1000,
    description: 'Текст отзыва',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  comment: string;
}
