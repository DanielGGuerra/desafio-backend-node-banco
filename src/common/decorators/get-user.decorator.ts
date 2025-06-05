import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

export const GetUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<{ user: User }>();
    return request.user;
  },
);
