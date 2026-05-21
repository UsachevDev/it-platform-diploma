import { ApiProperty } from '@nestjs/swagger';

export class CategoryEntity {
  @ApiProperty({ example: 'e1f2a3b4-0000-0000-0000-000000000000' })
  id: string;

  @ApiProperty({ example: 'Веб-разработка' })
  name: string;

  @ApiProperty({ example: 'web' })
  slug: string;

  @ApiProperty({ example: '2026-04-01T10:00:00.000Z' })
  createdAt: Date;
}
