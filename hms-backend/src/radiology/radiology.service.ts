import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateRadiologyOrderDto } from './dto/create-radiology-order.dto';
import { DraftRadiologyReportDto } from './dto/draft-radiology-report.dto';
import { AmendRadiologyReportDto } from './dto/amend-radiology-report.dto';
import { RadiologyOrderStatus, RadiologyReportStatus } from '@prisma/client';

@Injectable()
export class RadiologyService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createOrder(
    tenantId: string,
    userId: string,
    dto: CreateRadiologyOrderDto,
  ) {
    // 1. Verify Patient exists in tenant scope
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, tenantId },
    });
    if (!patient) throw new NotFoundException('Patient not found');

    // 2. Create Order
    return this.prisma.radiologyOrder.create({
      data: {
        tenantId,
        branchId: dto.branchId,
        patientId: dto.patientId,
        encounterId: dto.encounterId,
        orderingDoctorId: userId,
        modality: dto.modality,
        clinicalNotes: dto.clinicalNotes,
        status: RadiologyOrderStatus.PENDING,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async draftReport(
    tenantId: string,
    userId: string,
    orderId: string,
    dto: DraftRadiologyReportDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch Order
      const order = await tx.radiologyOrder.findFirst({
        where: { id: orderId, tenantId },
        include: { report: true },
      });

      if (!order) throw new NotFoundException('Radiology order not found');
      if (order.status === RadiologyOrderStatus.CANCELLED) {
        throw new ConflictException('Cannot draft report for cancelled order');
      }
      if (order.report) {
        // If report exists, check if it's approved
        if (order.report.status === RadiologyReportStatus.APPROVED) {
          throw new ConflictException('report_locked');
        }
        // Update existing draft
        return tx.radiologyReport.update({
          where: { id: order.report.id },
          data: {
            findings: dto.findings,
            conclusion: dto.conclusion,
            dicomStudyUid: dto.dicomStudyUid,
            updatedBy: userId,
          },
        });
      }

      // 2. Create Report
      const report = await tx.radiologyReport.create({
        data: {
          tenantId,
          branchId: order.branchId,
          radiologyOrderId: orderId,
          radiologistId: userId,
          findings: dto.findings,
          conclusion: dto.conclusion,
          dicomStudyUid: dto.dicomStudyUid,
          status: RadiologyReportStatus.DRAFT,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // 3. Update Order Status to IN_PROGRESS
      await tx.radiologyOrder.update({
        where: { id: orderId },
        data: {
          status: RadiologyOrderStatus.IN_PROGRESS,
          updatedBy: userId,
        },
      });

      return report;
    });
  }

  async approveReport(tenantId: string, userId: string, reportId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch Report
      const report = await tx.radiologyReport.findFirst({
        where: { id: reportId, tenantId },
      });

      if (!report) throw new NotFoundException('Radiology report not found');
      if (report.status === RadiologyReportStatus.APPROVED) {
        throw new ConflictException('Report already approved');
      }

      // 2. Update Report Status to APPROVED
      const updatedReport = await tx.radiologyReport.update({
        where: { id: reportId },
        data: {
          status: RadiologyReportStatus.APPROVED,
          updatedBy: userId,
        },
      });

      // 3. Update Order Status to COMPLETED
      await tx.radiologyOrder.update({
        where: { id: report.radiologyOrderId },
        data: {
          status: RadiologyOrderStatus.COMPLETED,
          updatedBy: userId,
        },
      });

      // 4. Audit
      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'RADIOLOGY_REPORT_APPROVED',
          recordType: 'RadiologyReport',
          recordId: reportId,
          newValues: { status: RadiologyReportStatus.APPROVED },
        },
        tx,
      );

      return updatedReport;
    });
  }

  async amendReport(
    tenantId: string,
    userId: string,
    reportId: string,
    dto: AmendRadiologyReportDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch Report (Must be APPROVED to amend)
      const report = await tx.radiologyReport.findFirst({
        where: { id: reportId, tenantId },
      });

      if (!report) throw new NotFoundException('Radiology report not found');
      if (
        report.status !== RadiologyReportStatus.APPROVED &&
        report.status !== RadiologyReportStatus.AMENDED
      ) {
        throw new ConflictException(
          'Only approved or amended reports can be amended',
        );
      }

      // 2. Save current state to Version
      await tx.radiologyReportVersion.create({
        data: {
          tenantId,
          branchId: report.branchId,
          radiologyReportId: reportId,
          previousFindings: report.findings,
          previousConclusion: report.conclusion,
          reasonForAmendment: dto.reasonForAmendment,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // 3. Update Report with new findings and AMENDED status
      const updatedReport = await tx.radiologyReport.update({
        where: { id: reportId },
        data: {
          findings: dto.findings,
          conclusion: dto.conclusion,
          status: RadiologyReportStatus.AMENDED,
          updatedBy: userId,
        },
      });

      // 4. Audit
      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'RADIOLOGY_REPORT_AMENDED',
          recordType: 'RadiologyReport',
          recordId: reportId,
          newValues: {
            status: RadiologyReportStatus.AMENDED,
            reason: dto.reasonForAmendment,
          },
        },
        tx,
      );

      return updatedReport;
    });
  }
}
