import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestUser } from '../../common/types/authenticated-request.type';

export const GetUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (data) {
      return request.user[data];
    }
    return request.user as RequestUser;
  },
);
