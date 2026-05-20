import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { buildBlockMessage } from '../utils/block-message.util';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret-change-me',
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        isBlocked: true,
        blockReason: true,
        blockedUntil: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    if (user.isBlocked) {
      if (user.blockedUntil && user.blockedUntil.getTime() <= Date.now()) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { isBlocked: false, blockReason: null, blockedUntil: null },
        });
      } else {
        throw new UnauthorizedException(
          buildBlockMessage(user.blockReason, user.blockedUntil),
        );
      }
    }

    return payload;
  }
}
