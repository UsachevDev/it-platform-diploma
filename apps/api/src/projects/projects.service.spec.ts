import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ProjectStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from './projects.service';
import { ProjectSortBy } from './dto/get-projects-query.dto';

describe('ProjectsService', () => {
  let service: ProjectsService;

  const prismaMock = {
    project: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const makeProject = (overrides: Record<string, unknown> = {}) =>
    ({
      id: 'project-1',
      title: 'Test project',
      description: 'Project description long enough',
      budgetMin: 10000,
      budgetMax: 50000,
      status: ProjectStatus.OPEN,
      customerId: 'customer-1',
      selectedContractorId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProjectsService(prismaMock as unknown as PrismaService);
  });

  it('should create project successfully', async () => {
    const createdProject = makeProject();

    prismaMock.project.create.mockResolvedValue(createdProject);

    const result = await service.create('customer-1', {
      title: 'Test project',
      description: 'Project description long enough',
      budgetMin: 10000,
      budgetMax: 50000,
    });

    expect(prismaMock.project.create).toHaveBeenCalledWith({
      data: {
        customerId: 'customer-1',
        title: 'Test project',
        description: 'Project description long enough',
        budgetMin: 10000,
        budgetMax: 50000,
        status: ProjectStatus.OPEN,
      },
      select: expect.any(Object),
    });

    expect(result.status).toBe(ProjectStatus.OPEN);
  });

  it('should throw BadRequestException when create has invalid budget range', async () => {
    await expect(
      service.create('customer-1', {
        title: 'Test project',
        description: 'Project description long enough',
        budgetMin: 60000,
        budgetMax: 50000,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should return paginated projects list with filters', async () => {
    const projects = [makeProject(), makeProject({ id: 'project-2' })];

    prismaMock.project.findMany.mockResolvedValue(projects);
    prismaMock.project.count.mockResolvedValue(2);
    prismaMock.$transaction.mockResolvedValue([projects, 2]);

    const result = await service.findAll({
      page: 2,
      limit: 2,
      search: 'test',
      status: ProjectStatus.OPEN,
      budgetMin: 10000,
      budgetMax: 70000,
      sortBy: ProjectSortBy.BUDGET_ASC,
    });

    expect(prismaMock.project.findMany).toHaveBeenCalledWith({
      where: {
        status: ProjectStatus.OPEN,
        OR: [
          {
            title: {
              contains: 'test',
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: 'test',
              mode: 'insensitive',
            },
          },
        ],
        budgetMin: {
          gte: 10000,
        },
        budgetMax: {
          lte: 70000,
        },
      },
      skip: 2,
      take: 2,
      orderBy: [{ budgetMin: 'asc' }, { createdAt: 'desc' }],
      select: expect.any(Object),
    });

    expect(result.data).toEqual(projects);
    expect(result.meta).toBeDefined();
  });

  it('should throw NotFoundException in findOne when project does not exist', async () => {
    prismaMock.project.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing-project')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should update project successfully for owner in OPEN status', async () => {
    prismaMock.project.findUnique.mockResolvedValue(makeProject());
    prismaMock.project.update.mockResolvedValue(
      makeProject({
        title: 'Updated title',
        budgetMin: 15000,
        budgetMax: 55000,
      }),
    );

    const result = await service.update('project-1', 'customer-1', {
      title: 'Updated title',
      budgetMin: 15000,
      budgetMax: 55000,
    });

    expect(prismaMock.project.update).toHaveBeenCalledWith({
      where: { id: 'project-1' },
      data: {
        title: 'Updated title',
        budgetMin: 15000,
        budgetMax: 55000,
      },
      select: expect.any(Object),
    });

    expect(result.title).toBe('Updated title');
  });

  it('should throw ForbiddenException when non-owner updates project', async () => {
    prismaMock.project.findUnique.mockResolvedValue(makeProject());

    await expect(
      service.update('project-1', 'another-user', {
        title: 'Updated title',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw BadRequestException when update called for non-OPEN project', async () => {
    prismaMock.project.findUnique.mockResolvedValue(
      makeProject({ status: ProjectStatus.IN_WORK }),
    );

    await expect(
      service.update('project-1', 'customer-1', {
        title: 'Updated title',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when update has invalid budget range', async () => {
    prismaMock.project.findUnique.mockResolvedValue(makeProject());

    await expect(
      service.update('project-1', 'customer-1', {
        budgetMin: 70000,
        budgetMax: 50000,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should cancel project successfully', async () => {
    prismaMock.project.findUnique.mockResolvedValue(makeProject());
    prismaMock.project.update.mockResolvedValue(
      makeProject({ status: ProjectStatus.CANCELED }),
    );

    const result = await service.cancel('project-1', 'customer-1');

    expect(result.status).toBe(ProjectStatus.CANCELED);
  });

  it('should throw BadRequestException when cancel called for non-OPEN project', async () => {
    prismaMock.project.findUnique.mockResolvedValue(
      makeProject({ status: ProjectStatus.DONE }),
    );

    await expect(service.cancel('project-1', 'customer-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should mark project as done successfully', async () => {
    prismaMock.project.findUnique.mockResolvedValue(
      makeProject({ status: ProjectStatus.IN_WORK }),
    );
    prismaMock.project.update.mockResolvedValue(
      makeProject({ status: ProjectStatus.DONE }),
    );

    const result = await service.markDone('project-1', 'customer-1');

    expect(result.status).toBe(ProjectStatus.DONE);
  });

  it('should throw BadRequestException when markDone called for non-IN_WORK project', async () => {
    prismaMock.project.findUnique.mockResolvedValue(makeProject());

    await expect(service.markDone('project-1', 'customer-1')).rejects.toThrow(
      BadRequestException,
    );
  });
});
