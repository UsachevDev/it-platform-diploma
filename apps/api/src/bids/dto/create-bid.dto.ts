import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBidDto {
  @ApiProperty({
    example: 50000,
    minimum: 1,
    description: 'Предлагаемая цена за выполнение проекта, ₽',
  })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  price: number;

  @ApiProperty({
    example: 14,
    minimum: 1,
    description: 'Срок выполнения в днях',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationDays: number;

  @ApiProperty({
    example: 'Имею опыт в разработке подобных платформ, готов взяться.',
    maxLength: 1000,
    description: 'Сопроводительное сообщение для заказчика',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  coverLetter: string;
}
