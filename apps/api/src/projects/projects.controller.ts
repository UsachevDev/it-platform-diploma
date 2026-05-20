import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { CreateProjectDto } from './dto/create-project.dto';
import { GetProjectsQueryDto } from './dto/get-projects-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  ProjectEntity,
  ProjectsListResponseEntity,
} from './entities/project.entity';
import { ProjectsService } from './projects.service';

type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать проект' })
  @ApiCreatedResponse({
    description: 'Проект успешно создан',
    type: ProjectEntity,
  })
  @ApiBadRequestResponse({ description: 'Некорректные данные проекта' })
  @ApiForbiddenResponse({
    description: 'Только заказчик может создавать проекты',
  })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateProjectDto,
  ) {
    if (req.user.role !== UserRole.CUSTOMER) {
      throw new ForbiddenException('Только заказчик может создавать проекты');
    }

    return this.projectsService.create(req.user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список проектов' })
  @ApiOkResponse({
    description: 'Список проектов успешно получен',
    type: ProjectsListResponseEntity,
  })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  findAll(
    @Query() query: GetProjectsQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.findAll(query, {
      sub: req.user.sub,
      role: req.user.role,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить проект по id' })
  @ApiParam({ name: 'id', description: 'UUID проекта' })
  @ApiOkResponse({ description: 'Проект успешно получен', type: ProjectEntity })
  @ApiBadRequestResponse({ description: 'Некорректный id проекта' })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Обновить проект (только владелец, только статус OPEN)',
  })
  @ApiParam({ name: 'id', description: 'UUID проекта' })
  @ApiOkResponse({ description: 'Проект успешно обновлён', type: ProjectEntity })
  @ApiBadRequestResponse({ description: 'Некорректные данные или статус' })
  @ApiForbiddenResponse({
    description: 'Только владелец проекта может обновлять проект',
  })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, req.user.sub, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Отменить проект (только владелец, только статус OPEN)',
  })
  @ApiParam({ name: 'id', description: 'UUID проекта' })
  @ApiOkResponse({ description: 'Проект успешно отменён', type: ProjectEntity })
  @ApiBadRequestResponse({ description: 'Некорректный статус проекта' })
  @ApiForbiddenResponse({
    description: 'Только владелец проекта может отменять проект',
  })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.cancel(id, req.user.sub);
  }

  @Post(':id/done')
  @ApiOperation({
    summary: 'Завершить проект (только владелец, только статус IN_WORK)',
  })
  @ApiParam({ name: 'id', description: 'UUID проекта' })
  @ApiOkResponse({ description: 'Проект успешно завершён', type: ProjectEntity })
  @ApiBadRequestResponse({ description: 'Некорректный статус проекта' })
  @ApiForbiddenResponse({
    description: 'Только владелец проекта может завершать проект',
  })
  @ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
  markDone(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.markDone(id, req.user.sub);
  }
}
