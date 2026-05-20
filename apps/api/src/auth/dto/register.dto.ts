import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'customer@demo.ru',
    description: 'Email пользователя (должен быть уникальным)',
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

  @ApiProperty({
    example: 'Илья Усачёв',
    minLength: 2,
    description: 'Отображаемое имя пользователя',
  })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({
    enum: [UserRole.CUSTOMER, UserRole.CONTRACTOR],
    example: UserRole.CUSTOMER,
    description: 'Роль при регистрации: заказчик или исполнитель',
  })
  @IsEnum(UserRole)
  role: UserRole;
}
