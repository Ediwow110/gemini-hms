import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import type { RequestUser } from '../common/types/authenticated-request.type';
import { PatientMergeRequestService } from './patient-merge-request.service';
import {
  CreatePatientMergeRequestDto,
  ApproveMergeRequestDto,
  RejectMergeRequestDto,
} from './dto/patient-merge.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@UseGuards(PermissionsGuard)
@Controller('api/v1/patients/merge-requests')
export class PatientMergeRequestController {
  constructor(
    private readonly patientMergeRequestService: PatientMergeRequestService,
  ) {}

  @Post()
  @RequirePermissions('patient.merge.request')
  async create(
    @GetUser() actor: RequestUser,
    @Body() dto: CreatePatientMergeRequestDto,
  ) {
    const tenantId = actor.tenantId;
    const userId = actor.userId!;
    const branchId = actor.branchId;

    return this.patientMergeRequestService.createMergeRequest(
      tenantId,
      userId,
      branchId,
      dto,
    );
  }

  @Post(':requestId/approve')
  @RequirePermissions('patient.merge.approve')
  async approve(
    @GetUser() actor: RequestUser,
    @Param('requestId') requestId: string,
    @Body() dto: ApproveMergeRequestDto,
  ) {
    const tenantId = actor.tenantId;
    const userId = actor.userId!;

    return this.patientMergeRequestService.approveMergeRequest(
      tenantId,
      userId,
      requestId,
      dto,
    );
  }

  @Post(':requestId/reject')
  @RequirePermissions('patient.merge.approve')
  async reject(
    @GetUser() actor: RequestUser,
    @Param('requestId') requestId: string,
    @Body() dto: RejectMergeRequestDto,
  ) {
    const tenantId = actor.tenantId;
    const userId = actor.userId!;

    return this.patientMergeRequestService.rejectMergeRequest(
      tenantId,
      userId,
      requestId,
      dto,
    );
  }

  @Get()
  @RequirePermissions('patient.merge.request')
  async list(
    @GetUser() actor: RequestUser,
    @Query() query: { status?: string; skip?: string; take?: string },
  ) {
    const tenantId = actor.tenantId;

    const skip = query.skip ? parseInt(query.skip, 10) : undefined;
    const take = query.take ? parseInt(query.take, 10) : undefined;

    return this.patientMergeRequestService.listMergeRequests(tenantId, {
      status: query.status,
      skip,
      take,
    });
  }

  @Get(':requestId')
  @RequirePermissions('patient.merge.request')
  async getOne(
    @GetUser() actor: RequestUser,
    @Param('requestId') requestId: string,
  ) {
    const tenantId = actor.tenantId;

    return this.patientMergeRequestService.getMergeRequest(tenantId, requestId);
  }
}
