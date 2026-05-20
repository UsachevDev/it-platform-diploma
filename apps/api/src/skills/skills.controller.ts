import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SkillsService } from './skills.service';

@ApiTags('Skills')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  @ApiOperation({ summary: 'Справочник навыков (для автоподсказок)' })
  @ApiOkResponse({
    description: 'Список названий навыков',
    type: String,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  findAll() {
    return this.skillsService.findAll();
  }
}
