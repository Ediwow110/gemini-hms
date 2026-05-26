import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common';
import { NursingService } from './nursing.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequireAnyPermission } from '../auth/decorators/permissions.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { CreateNurseTaskDto } from './dto/create-nurse-task.dto';
import { UpdateNurseTaskDto } from './dto/update-nurse-task.dto';
import { QueryNurseTaskDto } from './dto/query-nurse-task.dto';
import { NurseTaskResponseDto } from './dto/nurse-task-response.dto';
import type { RequestUser } from '../common/types/authenticated-request.type';

@Controller('api/v1/nursing/tasks')
@UseGuards(RolesGuard, PermissionsGuard)
export class NursingController {
  constructor(private readonly nursingService: NursingService) {}

  @Get()
  @Roles('Nurse', 'Branch Admin', 'Super Admin')
  @RequireAnyPermission('nurse.task.view')
  async listTasks(
    @Query(new ValidationPipe({ transform: true })) query: QueryNurseTaskDto,
    @GetUser() user: RequestUser,
  ): Promise<NurseTaskResponseDto[]> {
    return this.nursingService.listTasks(
      user.tenantId,
      user.branchId || '',
      query,
      user,
    );
  }

  @Get(':id')
  @Roles('Nurse', 'Branch Admin', 'Super Admin')
  @RequireAnyPermission('nurse.task.view')
  async getTask(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: RequestUser,
  ): Promise<NurseTaskResponseDto> {
    return this.nursingService.getTask(user.tenantId, id, user);
  }

  @Post()
  @Roles('Nurse', 'Branch Admin', 'Super Admin')
  @RequireAnyPermission('nurse.task.manage')
  async createTask(
    @Body(new ValidationPipe({ transform: true })) dto: CreateNurseTaskDto,
    @GetUser() user: RequestUser,
  ): Promise<NurseTaskResponseDto> {
    return this.nursingService.createTask(
      user.tenantId,
      user.branchId || '',
      dto,
      user,
    );
  }

  @Patch(':id')
  @Roles('Nurse', 'Branch Admin', 'Super Admin')
  @RequireAnyPermission('nurse.task.manage', 'nurse.task.update')
  async updateTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateNurseTaskDto,
    @GetUser() user: RequestUser,
  ): Promise<NurseTaskResponseDto> {
    return this.nursingService.updateTask(user.tenantId, id, dto, user);
  }

  @Patch(':id/start')
  @Roles('Nurse', 'Branch Admin', 'Super Admin')
  @RequireAnyPermission('nurse.task.update')
  async startTask(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: RequestUser,
  ): Promise<NurseTaskResponseDto> {
    return this.nursingService.startTask(user.tenantId, id, user);
  }

  @Patch(':id/complete')
  @Roles('Nurse', 'Branch Admin', 'Super Admin')
  @RequireAnyPermission('nurse.task.update')
  async completeTask(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: RequestUser,
  ): Promise<NurseTaskResponseDto> {
    return this.nursingService.completeTask(user.tenantId, id, user);
  }

  @Patch(':id/cancel')
  @Roles('Nurse', 'Branch Admin', 'Super Admin')
  @RequireAnyPermission('nurse.task.manage')
  async cancelTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string | undefined,
    @GetUser() user: RequestUser,
  ): Promise<NurseTaskResponseDto> {
    return this.nursingService.cancelTask(user.tenantId, id, user, reason);
  }

  @Patch(':id/reopen')
  @Roles('Nurse', 'Branch Admin', 'Super Admin')
  @RequireAnyPermission('nurse.task.manage')
  async reopenTask(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: RequestUser,
  ): Promise<NurseTaskResponseDto> {
    return this.nursingService.reopenTask(user.tenantId, id, user);
  }
}
