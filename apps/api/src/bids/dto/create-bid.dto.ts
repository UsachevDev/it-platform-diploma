import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBidDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  price: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationDays: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  coverLetter: string;
}
