import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateEmailDto } from './dto/update-email.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { safeUserSelect, toSafeUser } from './types/safe-user.type';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: safeUserSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return toSafeUser(user);
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    await this.ensureExists(userId);

    if (dto.skills !== undefined) {
      await this.setUserSkills(userId, dto.skills);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.about !== undefined ? { about: dto.about } : {}),
      },
      select: safeUserSelect,
    });

    return toSafeUser(user);
  }

  /**
   * Заменяет набор навыков пользователя: создаёт недостающие
   * записи Skill и пересобирает связи UserSkill.
   */
  private async setUserSkills(userId: string, skillNames: string[]) {
    const names = Array.from(
      new Set(
        skillNames
          .map((name) => name.trim())
          .filter((name) => name.length > 0),
      ),
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.userSkill.deleteMany({ where: { userId } });

      if (names.length === 0) {
        return;
      }

      await Promise.all(
        names.map((name) =>
          tx.skill.upsert({
            where: { name },
            create: { name },
            update: {},
          }),
        ),
      );

      const skills = await tx.skill.findMany({
        where: { name: { in: names } },
        select: { id: true },
      });

      await tx.userSkill.createMany({
        data: skills.map((skill) => ({ userId, skillId: skill.id })),
        skipDuplicates: true,
      });
    });
  }

  async updateEmail(userId: string, dto: UpdateEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, passwordHash: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordOk = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!passwordOk) {
      this.logger.warn(
        `Update email failed: invalid password, userId=${userId}`,
      );
      throw new UnauthorizedException('Неверный текущий пароль');
    }

    if (user.email === dto.newEmail) {
      return this.getMe(userId);
    }

    const occupied = await this.prisma.user.findUnique({
      where: { email: dto.newEmail },
      select: { id: true },
    });

    if (occupied) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { email: dto.newEmail },
      select: safeUserSelect,
    });

    this.logger.log(`Email updated: userId=${userId}, newEmail=${dto.newEmail}`);

    return toSafeUser(updated);
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordOk = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!passwordOk) {
      this.logger.warn(
        `Update password failed: invalid current password, userId=${userId}`,
      );
      throw new UnauthorizedException('Неверный текущий пароль');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new ConflictException('Новый пароль должен отличаться от текущего');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    this.logger.log(`Password updated: userId=${userId}`);

    return { message: 'Пароль успешно изменён' };
  }

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return toSafeUser(user);
  }

  private async ensureExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }
}
