import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<string[]> {
    const skills = await this.prisma.skill.findMany({
      orderBy: { name: 'asc' },
      select: { name: true },
    });

    return skills.map((skill) => skill.name);
  }
}
