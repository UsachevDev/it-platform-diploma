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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { CreateProjectDto } from './dto/create-project.dto';
import { GetProjectsQueryDto } from './dto/get-projects-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
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
  findAll(@Query() query: GetProjectsQueryDto) {
    return this.projectsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить проект по id' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Обновить проект (только владелец, только статус OPEN)',
  })
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
  markDone(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.projectsService.markDone(id, req.user.sub);
  }
}
