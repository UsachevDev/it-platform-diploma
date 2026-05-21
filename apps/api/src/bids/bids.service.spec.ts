import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { BidStatus, ProjectStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BidsService } from './bids.service';

describe('BidsService', () => {
  let service: BidsService;

  const prismaMock = {
    project: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    bid: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const notificationsMock = {
    create: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BidsService(
      prismaMock as unknown as PrismaService,
      notificationsMock as unknown as NotificationsService,
    );
  });

  describe('create', () => {
    it('should create bid successfully', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: 'project-1',
        customerId: 'customer-1',
        status: ProjectStatus.OPEN,
      });

      prismaMock.bid.findUnique.mockResolvedValue(null);
      prismaMock.bid.create.mockResolvedValue({
        id: 'bid-1',
        projectId: 'project-1',
        contractorId: 'contractor-1',
        price: 50000,
        durationDays: 10,
        coverLetter: 'Готов выполнить проект',
        status: BidStatus.PENDING,
        project: {
          id: 'project-1',
          title: 'Project',
          status: ProjectStatus.OPEN,
        },
      });

      const result = await service.create(
        'project-1',
        {
          price: 50000,
          durationDays: 10,
          coverLetter: '  Готов выполнить проект  ',
        },
        {
          sub: 'contractor-1',
          role: UserRole.CONTRACTOR,
        },
      );

      expect(prismaMock.bid.create).toHaveBeenCalledWith({
        data: {
          projectId: 'project-1',
          contractorId: 'contractor-1',
          price: 50000,
          durationDays: 10,
          coverLetter: 'Готов выполнить проект',
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

      expect(result.status).toBe(BidStatus.PENDING);
    });

    it('should throw ConflictException if contractor already sent bid to project', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: 'project-1',
        customerId: 'customer-1',
        status: ProjectStatus.OPEN,
      });

      prismaMock.bid.findUnique.mockResolvedValue({
        id: 'bid-1',
        projectId: 'project-1',
        contractorId: 'contractor-1',
      });

      await expect(
        service.create(
          'project-1',
          {
            price: 50000,
            durationDays: 10,
            coverLetter: 'Готов выполнить проект',
          },
          {
            sub: 'contractor-1',
            role: UserRole.CONTRACTOR,
          },
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException if customer tries to create bid', async () => {
      await expect(
        service.create(
          'project-1',
          {
            price: 50000,
            durationDays: 10,
            coverLetter: 'Хочу откликнуться',
          },
          {
            sub: 'customer-1',
            role: UserRole.CUSTOMER,
          },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if project does not exist', async () => {
      prismaMock.project.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          'project-404',
          {
            price: 50000,
            durationDays: 10,
            coverLetter: 'Готов выполнить проект',
          },
          {
            sub: 'contractor-1',
            role: UserRole.CONTRACTOR,
          },
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if contractor tries to bid on own project', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: 'project-1',
        customerId: 'contractor-1',
        status: ProjectStatus.OPEN,
      });

      await expect(
        service.create(
          'project-1',
          {
            price: 50000,
            durationDays: 10,
            coverLetter: 'Готов выполнить проект',
          },
          {
            sub: 'contractor-1',
            role: UserRole.CONTRACTOR,
          },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if project is not OPEN', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: 'project-1',
        customerId: 'customer-1',
        status: ProjectStatus.CANCELED,
      });

      await expect(
        service.create(
          'project-1',
          {
            price: 50000,
            durationDays: 10,
            coverLetter: 'Готов выполнить проект',
          },
          {
            sub: 'contractor-1',
            role: UserRole.CONTRACTOR,
          },
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('acceptBid', () => {
    it('should accept bid, reject other pending bids and move project to IN_WORK', async () => {
      prismaMock.bid.findUnique.mockResolvedValue({
        id: 'bid-1',
        projectId: 'project-1',
        contractorId: 'contractor-1',
        status: BidStatus.PENDING,
        project: {
          id: 'project-1',
          customerId: 'customer-1',
          status: ProjectStatus.OPEN,
        },
      });

      prismaMock.bid.updateMany.mockResolvedValue({ count: 2 });

      const acceptedBid = {
        id: 'bid-1',
        projectId: 'project-1',
        contractorId: 'contractor-1',
        status: BidStatus.ACCEPTED,
        contractor: {
          id: 'contractor-1',
          name: 'Contractor',
          email: 'contractor@test.com',
          role: UserRole.CONTRACTOR,
        },
      };

      const updatedProject = {
        id: 'project-1',
        title: 'Test project',
        status: ProjectStatus.IN_WORK,
        selectedContractorId: 'contractor-1',
      };

      prismaMock.bid.update.mockResolvedValue(acceptedBid);
      prismaMock.project.update.mockResolvedValue(updatedProject);
      prismaMock.$transaction.mockResolvedValue([
        { count: 2 },
        acceptedBid,
        updatedProject,
      ]);

      const result = await service.acceptBid('bid-1', {
        sub: 'customer-1',
        role: UserRole.CUSTOMER,
      });

      expect(result).toEqual({
        message: 'Исполнитель выбран, проект переведён в IN_WORK',
        bid: acceptedBid,
        project: updatedProject,
      });
    });

    it('should throw ForbiddenException if contractor tries to accept bid', async () => {
      await expect(
        service.acceptBid('bid-1', {
          sub: 'contractor-1',
          role: UserRole.CONTRACTOR,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if bid not found', async () => {
      prismaMock.bid.findUnique.mockResolvedValue(null);

      await expect(
        service.acceptBid('bid-404', {
          sub: 'customer-1',
          role: UserRole.CUSTOMER,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if customer is not project owner', async () => {
      prismaMock.bid.findUnique.mockResolvedValue({
        id: 'bid-1',
        projectId: 'project-1',
        contractorId: 'contractor-1',
        status: BidStatus.PENDING,
        project: {
          id: 'project-1',
          customerId: 'another-customer',
          status: ProjectStatus.OPEN,
        },
      });

      await expect(
        service.acceptBid('bid-1', {
          sub: 'customer-1',
          role: UserRole.CUSTOMER,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if bid is not PENDING', async () => {
      prismaMock.bid.findUnique.mockResolvedValue({
        id: 'bid-1',
        projectId: 'project-1',
        contractorId: 'contractor-1',
        status: BidStatus.ACCEPTED,
        project: {
          id: 'project-1',
          customerId: 'customer-1',
          status: ProjectStatus.OPEN,
        },
      });

      await expect(
        service.acceptBid('bid-1', {
          sub: 'customer-1',
          role: UserRole.CUSTOMER,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if project is not OPEN', async () => {
      prismaMock.bid.findUnique.mockResolvedValue({
        id: 'bid-1',
        projectId: 'project-1',
        contractorId: 'contractor-1',
        status: BidStatus.PENDING,
        project: {
          id: 'project-1',
          customerId: 'customer-1',
          status: ProjectStatus.IN_WORK,
        },
      });

      await expect(
        service.acceptBid('bid-1', {
          sub: 'customer-1',
          role: UserRole.CUSTOMER,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('rejectBid', () => {
    it('should reject bid successfully', async () => {
      prismaMock.bid.findUnique.mockResolvedValue({
        id: 'bid-1',
        projectId: 'project-1',
        contractorId: 'contractor-1',
        status: BidStatus.PENDING,
        project: {
          id: 'project-1',
          customerId: 'customer-1',
          status: ProjectStatus.OPEN,
        },
      });

      prismaMock.bid.update.mockResolvedValue({
        id: 'bid-1',
        status: BidStatus.REJECTED,
        contractor: {
          id: 'contractor-1',
          name: 'Contractor',
          email: 'contractor@test.com',
          role: UserRole.CONTRACTOR,
        },
        project: {
          id: 'project-1',
          title: 'Project',
          status: ProjectStatus.OPEN,
        },
      });

      const result = await service.rejectBid('bid-1', {
        sub: 'customer-1',
        role: UserRole.CUSTOMER,
      });

      expect(result.status).toBe(BidStatus.REJECTED);
    });

    it('should throw ForbiddenException if contractor tries to reject bid', async () => {
      await expect(
        service.rejectBid('bid-1', {
          sub: 'contractor-1',
          role: UserRole.CONTRACTOR,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if bid not found', async () => {
      prismaMock.bid.findUnique.mockResolvedValue(null);

      await expect(
        service.rejectBid('bid-404', {
          sub: 'customer-1',
          role: UserRole.CUSTOMER,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if customer is not project owner', async () => {
      prismaMock.bid.findUnique.mockResolvedValue({
        id: 'bid-1',
        projectId: 'project-1',
        contractorId: 'contractor-1',
        status: BidStatus.PENDING,
        project: {
          id: 'project-1',
          customerId: 'another-customer',
          status: ProjectStatus.OPEN,
        },
      });

      await expect(
        service.rejectBid('bid-1', {
          sub: 'customer-1',
          role: UserRole.CUSTOMER,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if bid is not PENDING', async () => {
      prismaMock.bid.findUnique.mockResolvedValue({
        id: 'bid-1',
        projectId: 'project-1',
        contractorId: 'contractor-1',
        status: BidStatus.REJECTED,
        project: {
          id: 'project-1',
          customerId: 'customer-1',
          status: ProjectStatus.OPEN,
        },
      });

      await expect(
        service.rejectBid('bid-1', {
          sub: 'customer-1',
          role: UserRole.CUSTOMER,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if project is not OPEN', async () => {
      prismaMock.bid.findUnique.mockResolvedValue({
        id: 'bid-1',
        projectId: 'project-1',
        contractorId: 'contractor-1',
        status: BidStatus.PENDING,
        project: {
          id: 'project-1',
          customerId: 'customer-1',
          status: ProjectStatus.IN_WORK,
        },
      });

      await expect(
        service.rejectBid('bid-1', {
          sub: 'customer-1',
          role: UserRole.CUSTOMER,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
