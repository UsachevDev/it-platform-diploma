import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CategoriesService } from './categories.service';
import { CategoryEntity } from './entities/category.entity';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Список категорий проектов' })
  @ApiOkResponse({
    description: 'Список категорий',
    type: CategoryEntity,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  findAll() {
    return this.categoriesService.findAll();
  }
}
