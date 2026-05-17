import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetPatientUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.patientUser;
    return data ? user?.[data] : user;
  },
);
