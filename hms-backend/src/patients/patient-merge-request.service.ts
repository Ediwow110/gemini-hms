import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreatePatientMergeRequestDto,
  ApproveMergeRequestDto,
  RejectMergeRequestDto,
} from './dto/patient-merge.dto';

@Injectable()
export class PatientMergeRequestService {
  private readonly logger = new Logger(PatientMergeRequestService.name);

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createMergeRequest(
    tenantId: string,
    userId: string,
    branchId: string | undefined,
    dto: CreatePatientMergeRequestDto,
  ) {
    try {
      // Validate sourcePatientId !== targetPatientId
      if (dto.sourcePatientId === dto.targetPatientId) {
        throw new BadRequestException(
          'Source and target patients must be different',
        );
      }

      // Validate both patients exist and belong to tenantId
      const [sourcePatient, targetPatient] = await Promise.all([
        this.prisma.patient.findFirst({
          where: { id: dto.sourcePatientId, tenantId },
        }),
        this.prisma.patient.findFirst({
          where: { id: dto.targetPatientId, tenantId },
        }),
      ]);

      if (!sourcePatient) {
        throw new NotFoundException('Source patient not found');
      }

      if (!targetPatient) {
        throw new NotFoundException('Target patient not found');
      }

      // Validate patients are not soft-deleted/inactive
      if (sourcePatient.status !== 'ACTIVE') {
        throw new BadRequestException('Source patient is not active');
      }

      if (targetPatient.status !== 'ACTIVE') {
        throw new BadRequestException('Target patient is not active');
      }

      // Create PatientMergeRequest with status=PENDING
      const mergeRequest = await this.prisma.patientMergeRequest.create({
        data: {
          tenantId,
          branchId,
          requesterId: userId,
          sourcePatientId: dto.sourcePatientId,
          targetPatientId: dto.targetPatientId,
          status: 'PENDING',
          reason: dto.reason,
        },
      });

      // Audit: eventKey='PATIENT_MERGE_REQUESTED', metadata only (no PHI)
      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'PATIENT_MERGE_REQUESTED',
          recordType: 'PatientMergeRequest',
          recordId: mergeRequest.id,
          newValues: {
            id: mergeRequest.id,
            status: mergeRequest.status,
            sourcePatientId: mergeRequest.sourcePatientId,
            targetPatientId: mergeRequest.targetPatientId,
          },
        },
        undefined,
        branchId,
      );

      return mergeRequest;
    } catch (error) {
      this.logger.error(
        `Error creating merge request: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async approveMergeRequest(
    tenantId: string,
    userId: string,
    requestId: string,
    dto: ApproveMergeRequestDto,
  ) {
    try {
      // Validate request exists and status=PENDING
      const request = await this.prisma.patientMergeRequest.findFirst({
        where: { id: requestId, tenantId },
      });

      if (!request) {
        throw new NotFoundException('Merge request not found');
      }

      if (request.status !== 'PENDING') {
        throw new BadRequestException(
          `Cannot approve request with status ${request.status}`,
        );
      }

      // Validate userId !== request.requesterId (no self-approval)
      if (userId === request.requesterId) {
        throw new ForbiddenException('Cannot approve your own merge request');
      }

      // Update status=APPROVED, approverId=userId, updatedAt=now
      const updated = await this.prisma.patientMergeRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          approverId: userId,
          remarks: dto.remarks,
          updatedAt: new Date(),
        },
      });

      // Audit: eventKey='PATIENT_MERGE_APPROVED', metadata only
      await this.audit.log({
        tenantId,
        userId,
        eventKey: 'PATIENT_MERGE_APPROVED',
        recordType: 'PatientMergeRequest',
        recordId: requestId,
        newValues: {
          id: updated.id,
          status: updated.status,
          approverId: updated.approverId,
        },
      });

      return updated;
    } catch (error) {
      this.logger.error(
        `Error approving merge request: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async rejectMergeRequest(
    tenantId: string,
    userId: string,
    requestId: string,
    dto: RejectMergeRequestDto,
  ) {
    try {
      // Validate request exists and status=PENDING
      const request = await this.prisma.patientMergeRequest.findFirst({
        where: { id: requestId, tenantId },
      });

      if (!request) {
        throw new NotFoundException('Merge request not found');
      }

      if (request.status !== 'PENDING') {
        throw new BadRequestException(
          `Cannot reject request with status ${request.status}`,
        );
      }

      // Validate userId !== request.requesterId
      if (userId === request.requesterId) {
        throw new ForbiddenException('Cannot reject your own merge request');
      }

      // Update status=REJECTED, approverId=userId, remarks=dto.reason, updatedAt=now
      const updated = await this.prisma.patientMergeRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          approverId: userId,
          remarks: dto.reason,
          updatedAt: new Date(),
        },
      });

      // Audit: eventKey='PATIENT_MERGE_REJECTED', metadata only
      await this.audit.log({
        tenantId,
        userId,
        eventKey: 'PATIENT_MERGE_REJECTED',
        recordType: 'PatientMergeRequest',
        recordId: requestId,
        newValues: {
          id: updated.id,
          status: updated.status,
          approverId: updated.approverId,
        },
      });

      return updated;
    } catch (error) {
      this.logger.error(
        `Error rejecting merge request: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getMergeRequest(tenantId: string, requestId: string) {
    try {
      const request = await this.prisma.patientMergeRequest.findFirst({
        where: { id: requestId, tenantId },
      });

      if (!request) {
        throw new NotFoundException('Merge request not found');
      }

      return request;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error fetching merge request: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async listMergeRequests(
    tenantId: string,
    filters?: { status?: string; skip?: number; take?: number },
  ) {
    try {
      const skip = filters?.skip || 0;
      const take = filters?.take || 20;

      const where: any = { tenantId };

      if (filters?.status) {
        where.status = filters.status;
      }

      const [data, total] = await Promise.all([
        this.prisma.patientMergeRequest.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.patientMergeRequest.count({ where }),
      ]);

      return { data, total };
    } catch (error) {
      this.logger.error(
        `Error listing merge requests: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
