import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProjectStatus } from '@prisma/client';
import { buildPaginationMeta } from '../common/utils/pagination.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import {
  GetProjectsQueryDto,
  ProjectSortBy,
} from './dto/get-projects-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { projectSelect } from './projects.select';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(customerId: string, dto: CreateProjectDto) {
    if (dto.budgetMax < dto.budgetMin) {
      this.logger.warn(
        `Create project failed: invalid budget range, customerId=${customerId}`,
      );
      throw new BadRequestException('budgetMax не может быть меньше budgetMin');
    }

    const project = await this.prisma.project.create({
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

    this.logger.log(
      `Project created: projectId=${project.id}, customerId=${customerId}`,
    );

    return project;
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

    if (query.budgetMin !== undefined) {
      where.budgetMin = {
        gte: query.budgetMin,
      };
    }

    if (query.budgetMax !== undefined) {
      where.budgetMax = {
        lte: query.budgetMax,
      };
    }

    const orderBy = this.getProjectsOrderBy(query.sortBy);

    const [projects, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: projectSelect,
      }),
      this.prisma.project.count({ where }),
    ]);

    this.logger.log(
      `Projects list requested: page=${page}, limit=${limit}, total=${total}`,
    );

    return {
      data: projects,
      meta: buildPaginationMeta(page, limit, total),
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
      this.logger.warn(
        `Update project failed: invalid budget range, projectId=${id}, userId=${userId}`,
      );
      throw new BadRequestException('budgetMax не может быть меньше budgetMin');
    }

    const updatedProject = await this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.budgetMin !== undefined && { budgetMin: dto.budgetMin }),
        ...(dto.budgetMax !== undefined && { budgetMax: dto.budgetMax }),
      },
      select: projectSelect,
    });

    this.logger.log(`Project updated: projectId=${id}, userId=${userId}`);

    return updatedProject;
  }

  async cancel(id: string, userId: string) {
    const project = await this.getProjectOrThrow(id);

    this.checkProjectOwner(project.customerId, userId);
    this.ensureProjectStatus(project.status, [ProjectStatus.OPEN]);

    const canceledProject = await this.prisma.project.update({
      where: { id },
      data: {
        status: ProjectStatus.CANCELED,
      },
      select: projectSelect,
    });

    this.logger.log(`Project canceled: projectId=${id}, userId=${userId}`);

    return canceledProject;
  }

  async markDone(id: string, userId: string) {
    const project = await this.getProjectOrThrow(id);

    this.checkProjectOwner(project.customerId, userId);
    this.ensureProjectStatus(project.status, [ProjectStatus.IN_WORK]);

    const doneProject = await this.prisma.project.update({
      where: { id },
      data: {
        status: ProjectStatus.DONE,
      },
      select: projectSelect,
    });

    this.logger.log(`Project marked done: projectId=${id}, userId=${userId}`);

    return doneProject;
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

  private getProjectsOrderBy(
    sortBy?: ProjectSortBy,
  ): Prisma.ProjectOrderByWithRelationInput[] {
    switch (sortBy) {
      case ProjectSortBy.BUDGET_ASC:
        return [{ budgetMin: 'asc' }, { createdAt: 'desc' }];
      case ProjectSortBy.BUDGET_DESC:
        return [{ budgetMax: 'desc' }, { createdAt: 'desc' }];
      case ProjectSortBy.NEWEST:
      default:
        return [{ createdAt: 'desc' }];
    }
  }
}
