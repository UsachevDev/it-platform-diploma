import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../../users/entities/user.entity';

export class AuthResponseEntity {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT для авторизации (заголовок Authorization: Bearer)',
  })
  accessToken: string;

  @ApiProperty({ type: UserEntity })
  user: UserEntity;
}
