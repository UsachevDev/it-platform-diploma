import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

type RequestWithUser = Request & {
  user?: {
    sub?: string;
    id?: string;
    email?: string;
    role?: string;
  };
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
