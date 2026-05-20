import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

const trimAndLower = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class UpdateEmailDto {
  @ApiProperty({ example: 'new@example.com' })
  @Transform(trimAndLower)
  @IsEmail()
  newEmail: string;

  @ApiProperty({ example: 'Current password' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;
}
