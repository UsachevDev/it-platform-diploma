import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { CreateReviewDto } from './dto/create-review.dto';
import {
  ReviewEntity,
  UserReviewsResponseEntity,
} from './entities/review.entity';
import { ReviewsService } from './reviews.service';

type AuthenticatedRequest = Request & { user: JwtPayload };

@ApiTags('Reviews')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Пользователь не авторизован' })
@UseGuards(JwtAuthGuard)
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('projects/:id/reviews')
  @ApiOperation({ summary: 'Оставить отзыв по завершённому проекту' })
  @ApiParam({ name: 'id', description: 'UUID проекта' })
  @ApiCreatedResponse({ description: 'Отзыв создан', type: ReviewEntity })
  @ApiForbiddenResponse({ description: 'Отзыв доступен только участнику' })
  @ApiConflictResponse({
    description: 'Проект не завершён или отзыв уже оставлен',
  })
  create(
    @Param('id', new ParseUUIDPipe()) projectId: string,
    @Body() dto: CreateReviewDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reviewsService.create(projectId, dto, req.user.sub);
  }

  @Get('projects/:id/reviews')
  @ApiOperation({ summary: 'Отзывы по проекту' })
  @ApiParam({ name: 'id', description: 'UUID проекта' })
  @ApiOkResponse({
    description: 'Список отзывов проекта',
    type: ReviewEntity,
    isArray: true,
  })
  findByProject(@Param('id', new ParseUUIDPipe()) projectId: string) {
    return this.reviewsService.findByProject(projectId);
  }

  @Get('users/:id/reviews')
  @ApiOperation({ summary: 'Отзывы о пользователе и средний рейтинг' })
  @ApiParam({ name: 'id', description: 'UUID пользователя' })
  @ApiOkResponse({
    description: 'Отзывы и агрегированный рейтинг',
    type: UserReviewsResponseEntity,
  })
  findByUser(@Param('id', new ParseUUIDPipe()) userId: string) {
    return this.reviewsService.findByUser(userId);
  }
}
