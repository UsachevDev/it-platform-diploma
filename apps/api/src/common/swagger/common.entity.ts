import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaEntity {
  @ApiProperty({ example: 1, description: 'Текущая страница' })
  page: number;

  @ApiProperty({ example: 10, description: 'Размер страницы' })
  limit: number;

  @ApiProperty({ example: 42, description: 'Всего записей' })
  total: number;

  @ApiProperty({ example: 5, description: 'Всего страниц' })
  totalPages: number;
}

export class MessageResponseEntity {
  @ApiProperty({ example: 'Операция выполнена успешно' })
  message: string;
}
