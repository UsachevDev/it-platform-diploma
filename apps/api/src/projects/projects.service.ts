import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProjectStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { GetProjectsQueryDto } from './dto/get-projects-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { projectSelect } from './projects.select';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(customerId: string, dto: CreateProjectDto) {
    if (dto.budgetMax < dto.budgetMin) {
      throw new BadRequestException('budgetMax не может быть меньше budgetMin');
    }

    return this.prisma.project.create({
      data: {
        customerId,
        title: dto.title,
        description: dto.description,
        budgetMin: dto.budgetMin,
        budgetMax: dto.budgetMax,
        status: ProjectStatus.OPEN,
      },
      select: projectSelect,
    });
  }

  async findAll(query: GetProjectsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        {
          title: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: projectSelect,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    return this.getProjectOrThrow(id);
  }

  async update(id: string, userId: string, dto: UpdateProjectDto) {
    const project = await this.getProjectOrThrow(id);

    this.checkProjectOwner(project.customerId, userId);
    this.ensureProjectStatus(project.status, [ProjectStatus.OPEN]);

    const nextBudgetMin = dto.budgetMin ?? project.budgetMin;
    const nextBudgetMax = dto.budgetMax ?? project.budgetMax;

    if (
      nextBudgetMin !== null &&
      nextBudgetMax !== null &&
      nextBudgetMax < nextBudgetMin
    ) {
      throw new BadRequestException('budgetMax не может быть меньше budgetMin');
    }

    return this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.budgetMin !== undefined && { budgetMin: dto.budgetMin }),
        ...(dto.budgetMax !== undefined && { budgetMax: dto.budgetMax }),
      },
      select: projectSelect,
    });
  }

  async cancel(id: string, userId: string) {
    const project = await this.getProjectOrThrow(id);

    this.checkProjectOwner(project.customerId, userId);
    this.ensureProjectStatus(project.status, [ProjectStatus.OPEN]);

    return this.prisma.project.update({
      where: { id },
      data: {
        status: ProjectStatus.CANCELED,
      },
      select: projectSelect,
    });
  }

  async markDone(id: string, userId: string) {
    const project = await this.getProjectOrThrow(id);

    this.checkProjectOwner(project.customerId, userId);
    this.ensureProjectStatus(project.status, [ProjectStatus.IN_WORK]);

    return this.prisma.project.update({
      where: { id },
      data: {
        status: ProjectStatus.DONE,
      },
      select: projectSelect,
    });
  }

  private async getProjectOrThrow(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: projectSelect,
    });

    if (!project) {
      throw new NotFoundException('Проект не найден');
    }

    return project;
  }

  private checkProjectOwner(customerId: string, userId: string) {
    if (customerId !== userId) {
      throw new ForbiddenException(
        'Только владелец проекта может выполнять это действие',
      );
    }
  }

  private ensureProjectStatus(
    currentStatus: ProjectStatus,
    allowedStatuses: ProjectStatus[],
  ) {
    if (!allowedStatuses.includes(currentStatus)) {
      throw new BadRequestException(
        `Действие недоступно для статуса ${currentStatus}`,
      );
    }
  }
}
