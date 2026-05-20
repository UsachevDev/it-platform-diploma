import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BidStatus, Prisma, ProjectStatus, UserRole } from '@prisma/client';
import { buildPaginationMeta } from '../common/utils/pagination.util';
import { PrismaService } from '../prisma/prisma.service';
import { projectSelect } from '../projects/projects.select';
import { safeUserSelect, toSafeUser } from '../users/types/safe-user.type';
import { BlockUserDto } from './dto/block-user.dto';
import { GetAdminUsersQueryDto } from './dto/get-admin-users-query.dto';
import {
  GetAdminBidsQueryDto,
  GetAdminProjectsQueryDto,
} from './dto/get-admin-list-query.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findUsers(query: GetAdminUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (query.role) {
      where.role = query.role;
    }

    if (query.blocked !== undefined) {
      where.isBlocked = query.blocked;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          ...safeUserSelect,
          _count: {
            select: {
              customerProjects: true,
              contractorBids: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map(toSafeUser),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...safeUserSelect,
        _count: {
          select: {
            customerProjects: true,
            contractorBids: true,
          },
        },
        customerProjects: {
          orderBy: { createdAt: 'desc' },
          select: projectSelect,
        },
        contractorBids: {
          orderBy: { createdAt: 'desc' },
          include: {
            project: {
              select: { id: true, title: true, status: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return toSafeUser(user);
  }

  async blockUser(userId: string, adminId: string, dto: BlockUserDto) {
    if (userId === adminId) {
      throw new BadRequestException(
        'Нельзя заблокировать собственный аккаунт',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException(
        'Нельзя блокировать другого администратора',
      );
    }

    const blockedUntil = dto.durationDays
      ? new Date(Date.now() + dto.durationDays * 24 * 60 * 60 * 1000)
      : null;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isBlocked: true,
        blockReason: dto.reason.trim(),
        blockedUntil,
      },
      select: safeUserSelect,
    });

    this.logger.log(
      `User blocked: userId=${userId}, adminId=${adminId}, until=${blockedUntil?.toISOString() ?? 'permanent'}`,
    );

    return toSafeUser(updated);
  }

  async unblockUser(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isBlocked: true },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (!user.isBlocked) {
      throw new ConflictException('Пользователь не заблокирован');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isBlocked: false, blockReason: null, blockedUntil: null },
      select: safeUserSelect,
    });

    this.logger.log(`User unblocked: userId=${userId}, adminId=${adminId}`);

    return toSafeUser(updated);
  }

  async updateUserRole(userId: string, adminId: string, role: UserRole) {
    if (userId === adminId) {
      throw new BadRequestException('Нельзя менять собственную роль');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (user.role === role) {
      throw new ConflictException('У пользователя уже эта роль');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: safeUserSelect,
    });

    this.logger.log(
      `User role changed: userId=${userId}, role=${role}, adminId=${adminId}`,
    );

    return toSafeUser(updated);
  }

  async deleteUser(userId: string, adminId: string) {
    if (userId === adminId) {
      throw new BadRequestException('Нельзя удалить собственный аккаунт');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Нельзя удалить другого администратора');
    }

    await this.prisma.user.delete({ where: { id: userId } });

    this.logger.log(`User deleted: userId=${userId}, adminId=${adminId}`);

    return { message: 'Пользователь удалён' };
  }

  async findProjects(query: GetAdminProjectsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [projects, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: projectSelect,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async cancelProject(projectId: string, adminId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, status: true },
    });

    if (!project) {
      throw new NotFoundException('Проект не найден');
    }

    if (
      project.status === ProjectStatus.CANCELED ||
      project.status === ProjectStatus.DONE
    ) {
      throw new ConflictException('Проект уже завершён или отменён');
    }

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.CANCELED },
      select: projectSelect,
    });

    this.logger.log(
      `Project force-canceled by admin: projectId=${projectId}, adminId=${adminId}`,
    );

    return updated;
  }

  async deleteProject(projectId: string, adminId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Проект не найден');
    }

    await this.prisma.project.delete({ where: { id: projectId } });

    this.logger.log(
      `Project deleted by admin: projectId=${projectId}, adminId=${adminId}`,
    );

    return { message: 'Проект удалён' };
  }

  async findBids(query: GetAdminBidsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.BidWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        {
          coverLetter: { contains: query.search, mode: 'insensitive' },
        },
        {
          project: {
            title: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          contractor: {
            name: { contains: query.search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [bids, total] = await this.prisma.$transaction([
      this.prisma.bid.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          contractor: {
            select: { id: true, name: true, email: true, role: true },
          },
          project: {
            select: { id: true, title: true, status: true },
          },
        },
      }),
      this.prisma.bid.count({ where }),
    ]);

    return {
      data: bids,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async deleteBid(bidId: string, adminId: string) {
    const bid = await this.prisma.bid.findUnique({
      where: { id: bidId },
      select: { id: true },
    });

    if (!bid) {
      throw new NotFoundException('Отклик не найден');
    }

    await this.prisma.bid.delete({ where: { id: bidId } });

    this.logger.log(`Bid deleted by admin: bidId=${bidId}, adminId=${adminId}`);

    return { message: 'Отклик удалён' };
  }

  async getStats() {
    const [
      usersTotal,
      customers,
      contractors,
      blockedUsers,
      projectsTotal,
      openProjects,
      inWorkProjects,
      doneProjects,
      canceledProjects,
      bidsTotal,
      pendingBids,
      acceptedBids,
      rejectedBids,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: UserRole.CUSTOMER } }),
      this.prisma.user.count({ where: { role: UserRole.CONTRACTOR } }),
      this.prisma.user.count({ where: { isBlocked: true } }),
      this.prisma.project.count(),
      this.prisma.project.count({ where: { status: ProjectStatus.OPEN } }),
      this.prisma.project.count({ where: { status: ProjectStatus.IN_WORK } }),
      this.prisma.project.count({ where: { status: ProjectStatus.DONE } }),
      this.prisma.project.count({ where: { status: ProjectStatus.CANCELED } }),
      this.prisma.bid.count(),
      this.prisma.bid.count({ where: { status: BidStatus.PENDING } }),
      this.prisma.bid.count({ where: { status: BidStatus.ACCEPTED } }),
      this.prisma.bid.count({ where: { status: BidStatus.REJECTED } }),
    ]);

    return {
      users: {
        total: usersTotal,
        customers,
        contractors,
        blocked: blockedUsers,
      },
      projects: {
        total: projectsTotal,
        open: openProjects,
        inWork: inWorkProjects,
        done: doneProjects,
        canceled: canceledProjects,
      },
      bids: {
        total: bidsTotal,
        pending: pendingBids,
        accepted: acceptedBids,
        rejected: rejectedBids,
      },
    };
  }
}
