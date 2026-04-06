import {
  ConflictException,
  ForbiddenException,
  Injectable,
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
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string, dto: CreateBidDto, currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.CONTRACTOR) {
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

    if (project.customerId === currentUser.sub) {
      throw new ForbiddenException(
        'Нельзя отправить отклик на собственный проект',
      );
    }

    if (project.status !== ProjectStatus.OPEN) {
      throw new ConflictException(
        'Отклик можно отправить только на открытый проект',
      );
    }

    const existingBid = await this.prisma.bid.findUnique({
      where: {
        projectId_contractorId: {
          projectId,
          contractorId: currentUser.sub,
        },
      },
    });

    if (existingBid) {
      throw new ConflictException('Вы уже отправили отклик на этот проект');
    }

    return this.prisma.bid.create({
      data: {
        projectId,
        contractorId: currentUser.sub,
        price: dto.price,
        durationDays: dto.durationDays,
        coverLetter: dto.coverLetter.trim(),
        status: BidStatus.PENDING,
      },
    });
  }
}
