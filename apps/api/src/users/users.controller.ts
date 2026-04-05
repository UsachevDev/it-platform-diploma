import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

type AuthRequest = Request & {
  user: {
    sub?: string;
    id?: string;
    email?: string;
    role?: string;
  };
};

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Current user profile returned successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: AuthRequest) {
    const userId = req.user.sub ?? req.user.id;

    return this.usersService.getMe(userId as string);
  }

  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Profile updated successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@Req() req: AuthRequest, @Body() dto: UpdateUserDto) {
    const userId = req.user.sub ?? req.user.id;

    return this.usersService.updateMe(userId as string, dto);
  }

  @ApiOperation({ summary: 'Get public user profile by id' })
  @ApiParam({
    name: 'id',
    example: 'cm1abc123xyz',
    description: 'User id',
  })
  @ApiOkResponse({ description: 'User profile returned successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.usersService.getById(id);
  }
}
