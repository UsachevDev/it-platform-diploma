import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RolesGuard } from './guards/roles.guard';
import { UsersRepository } from './repositories/users.repository';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    UsersRepository,
    RolesGuard,
    {
      provide: JwtService,
      useFactory: () =>
        new JwtService({
          secret: process.env.JWT_SECRET || 'dev-secret-change-me',
          signOptions: {
            expiresIn: '7d',
          },
        }),
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
