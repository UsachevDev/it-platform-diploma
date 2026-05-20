import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'customer@demo.ru',
    description: 'Email пользователя',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    minLength: 6,
    description: 'Пароль (минимум 6 символов)',
  })
  @IsString()
  @MinLength(6)
  password: string;
}
