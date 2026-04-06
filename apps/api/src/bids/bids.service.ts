import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BidStatus, ProjectStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBidDto } from './dto/create-bid.dto';

type CurrentUser = {
  sub: string;
  role: UserRole;
};

@Injectable()
export class BidsService {
  private readonly logger = new Logger(BidsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private getUserId(currentUser: CurrentUser) {
    if (!currentUser?.sub) {
      throw new ForbiddenException('Не удалось определить пользователя');
    }

    return currentUser.sub;
  }

  async create(projectId: string, dto: CreateBidDto, currentUser: CurrentUser) {
    const userId = this.getUserId(currentUser);

    if (currentUser.role !== UserRole.CONTRACTOR) {
      this.logger.warn(
        `Create bid failed: non-contractor tried to create bid, userId=${userId}`,
      );
      throw new ForbiddenException(
        'Только исполнитель может отправлять отклики',
      );
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Проект не найден');
    }

    if (project.customerId === userId) {
      this.logger.warn(
        `Create bid failed: own project, projectId=${projectId}, userId=${userId}`,
      );
      throw new ForbiddenException(
        'Нельзя отправить отклик на собственный проект',
      );
    }

    if (project.status !== ProjectStatus.OPEN) {
      this.logger.warn(
        `Create bid failed: project is not open, projectId=${projectId}, userId=${userId}`,
      );
      throw new ConflictException(
        'Отклик можно отправить только на открытый проект',
      );
    }

    const existingBid = await this.prisma.bid.findUnique({
      where: {
        projectId_contractorId: {
          projectId,
          contractorId: userId,
        },
      },
    });

    if (existingBid) {
      this.logger.warn(
        `Create bid failed: duplicate bid, projectId=${projectId}, userId=${userId}`,
      );
      throw new ConflictException('Вы уже отправили отклик на этот проект');
    }

    const bid = await this.prisma.bid.create({
      data: {
        projectId,
        contractorId: userId,
        price: dto.price,
        durationDays: dto.durationDays,
        coverLetter: dto.coverLetter.trim(),
        status: BidStatus.PENDING,
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    this.logger.log(
      `Bid created: bidId=${bid.id}, projectId=${projectId}, userId=${userId}`,
    );

    return bid;
  }

  async findProjectBids(projectId: string, currentUser: CurrentUser) {
    const userId = this.getUserId(currentUser);

    if (currentUser.role !== UserRole.CUSTOMER) {
      throw new ForbiddenException(
        'Только заказчик может смотреть отклики по проекту',
      );
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        customerId: true,
        title: true,
        status: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Проект не найден');
    }

    if (project.customerId !== userId) {
      throw new ForbiddenException(
        'Вы не можете просматривать отклики чужого проекта',
      );
    }

    const bids = await this.prisma.bid.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        contractor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    this.logger.log(
      `Project bids requested: projectId=${projectId}, userId=${userId}, count=${bids.length}`,
    );

    return bids;
  }

  async findMyBids(currentUser: CurrentUser) {
    const userId = this.getUserId(currentUser);

    if (currentUser.role !== UserRole.CONTRACTOR) {
      throw new ForbiddenException(
        'Только исполнитель может смотреть свои отклики',
      );
    }

    const bids = await this.prisma.bid.findMany({
      where: {
        contractorId: userId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            description: true,
            budgetMin: true,
            budgetMax: true,
            status: true,
            createdAt: true,
            customerId: true,
            selectedContractorId: true,
          },
        },
      },
    });

    this.logger.log(
      `My bids requested: userId=${userId}, count=${bids.length}`,
    );

    return bids;
  }

  async acceptBid(bidId: string, currentUser: CurrentUser) {
    const userId = this.getUserId(currentUser);

    if (currentUser.role !== UserRole.CUSTOMER) {
      this.logger.warn(
        `Accept bid failed: non-customer tried to accept bid, userId=${userId}, bidId=${bidId}`,
      );
      throw new ForbiddenException('Только заказчик может принимать отклики');
    }

    const bid = await this.prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        project: true,
      },
    });

    if (!bid) {
      throw new NotFoundException('Отклик не найден');
    }

    if (bid.project.customerId !== userId) {
      throw new ForbiddenException(
        'Вы не можете принимать отклики по чужому проекту',
      );
    }

    if (bid.project.status !== ProjectStatus.OPEN) {
      throw new ConflictException(
        'Исполнителя можно выбрать только для открытого проекта',
      );
    }

    if (bid.status !== BidStatus.PENDING) {
      throw new ConflictException(
        'Можно принять только отклик со статусом PENDING',
      );
    }

    const [, acceptedBid, updatedProject] = await this.prisma.$transaction([
      this.prisma.bid.updateMany({
        where: {
          projectId: bid.projectId,
          id: { not: bid.id },
          status: BidStatus.PENDING,
        },
        data: {
          status: BidStatus.REJECTED,
        },
      }),
      this.prisma.bid.update({
        where: { id: bid.id },
        data: {
          status: BidStatus.ACCEPTED,
        },
        include: {
          contractor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.project.update({
        where: { id: bid.projectId },
        data: {
          selectedContractorId: bid.contractorId,
          status: ProjectStatus.IN_WORK,
        },
        select: {
          id: true,
          title: true,
          status: true,
          selectedContractorId: true,
        },
      }),
    ]);

    this.logger.log(
      `Bid accepted: bidId=${bidId}, projectId=${bid.projectId}, customerId=${userId}, contractorId=${bid.contractorId}`,
    );

    return {
      message: 'Исполнитель выбран, проект переведён в IN_WORK',
      bid: acceptedBid,
      project: updatedProject,
    };
  }

  async rejectBid(bidId: string, currentUser: CurrentUser) {
    const userId = this.getUserId(currentUser);

    if (currentUser.role !== UserRole.CUSTOMER) {
      this.logger.warn(
        `Reject bid failed: non-customer tried to reject bid, userId=${userId}, bidId=${bidId}`,
      );
      throw new ForbiddenException('Только заказчик может отклонять отклики');
    }

    const bid = await this.prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        project: true,
      },
    });

    if (!bid) {
      throw new NotFoundException('Отклик не найден');
    }

    if (bid.project.customerId !== userId) {
      throw new ForbiddenException(
        'Вы не можете отклонять отклики по чужому проекту',
      );
    }

    if (bid.project.status !== ProjectStatus.OPEN) {
      throw new ConflictException(
        'Отклонять отклики можно только у открытого проекта',
      );
    }

    if (bid.status !== BidStatus.PENDING) {
      throw new ConflictException(
        'Можно отклонить только отклик со статусом PENDING',
      );
    }

    const rejectedBid = await this.prisma.bid.update({
      where: { id: bidId },
      data: {
        status: BidStatus.REJECTED,
      },
      include: {
        contractor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    this.logger.log(
      `Bid rejected: bidId=${bidId}, projectId=${bid.projectId}, customerId=${userId}`,
    );

    return rejectedBid;
  }
}
