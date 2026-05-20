import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UserRefEntity {
  @ApiProperty({ example: 'b1a2c3d4-0000-0000-0000-000000000000' })
  id: string;

  @ApiProperty({ example: 'Илья Усачёв' })
  name: string;

  @ApiProperty({ example: 'customer@demo.ru' })
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CUSTOMER })
  role: UserRole;
}

export class UserEntity {
  @ApiProperty({ example: 'b1a2c3d4-0000-0000-0000-000000000000' })
  id: string;

  @ApiProperty({ example: 'customer@demo.ru' })
  email: string;

  @ApiProperty({ example: 'Илья Усачёв' })
  name: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CUSTOMER })
  role: UserRole;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Frontend-разработчик, 3 года опыта',
  })
  about: string | null;

  @ApiProperty({ type: [String], example: ['React', 'TypeScript'] })
  skills: string[];

  @ApiProperty({ example: false, description: 'Заблокирован ли аккаунт' })
  isBlocked: boolean;

  @ApiProperty({
    type: String,
    nullable: true,
    example: null,
    description: 'Причина блокировки (если заблокирован)',
  })
  blockReason: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: null,
    description: 'Дата окончания блокировки (null — бессрочно)',
  })
  blockedUntil: Date | null;

  @ApiProperty({ example: '2026-04-01T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-01T10:00:00.000Z' })
  updatedAt: Date;
}
