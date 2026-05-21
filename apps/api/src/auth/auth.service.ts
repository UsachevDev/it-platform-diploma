import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UsersRepository } from './repositories/users.repository';
import { JwtPayload } from './types/jwt-payload.type';
import { buildBlockMessage } from './utils/block-message.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();

    const existingUser = await this.usersRepository.findByEmail(email);

    if (existingUser) {
      this.logger.warn(`Register failed: email already exists, email=${email}`);
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.usersRepository.create({
      email,
      passwordHash,
      role: dto.role,
      name: dto.name.trim(),
    });

    this.logger.log(`User registered: userId=${user.id}, email=${user.email}`);

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();

    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      this.logger.warn(`Login failed: user not found, email=${email}`);
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      this.logger.warn(`Login failed: invalid password, email=${email}`);
      throw new UnauthorizedException('Неверный email или пароль');
    }

    if (user.isBlocked) {
      if (user.blockedUntil && user.blockedUntil.getTime() <= Date.now()) {
        await this.usersRepository.unblock(user.id);
      } else {
        this.logger.warn(`Login failed: account blocked, email=${email}`);
        throw new UnauthorizedException(
          buildBlockMessage(user.blockReason, user.blockedUntil),
        );
      }
    }

    this.logger.log(`User logged in: userId=${user.id}, email=${user.email}`);

    return this.buildAuthResponse(user);
  }

  async getMe(userId: string) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      this.logger.warn(`GetMe failed: user not found, userId=${userId}`);
      throw new UnauthorizedException('Пользователь не найден');
    }

    return this.excludePassword(user);
  }

  private async buildAuthResponse(user: User) {
    const accessToken = await this.signToken(user.id, user.email, user.role);

    return {
      accessToken,
      user: this.excludePassword(user),
    };
  }

  private async signToken(
    userId: string,
    email: string,
    role: UserRole,
  ): Promise<string> {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
    };

    return this.jwtService.signAsync(payload);
  }

  private excludePassword(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash, ...safeUser } = user;
    void passwordHash;
    return safeUser;
  }
}
