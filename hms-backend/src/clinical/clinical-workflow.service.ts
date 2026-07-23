import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NumberingService } from '../numbering/numbering.service';
import { ClinicalScopePolicy } from './clinical-workflow.policy';
import { AuditService } from '../audit/audit.service';
import { SaveVitalsDto } from './dto/save-vitals.dto';
import { MarkVitalsErrorDto } from './dto/mark-vitals-error.dto';
import { SaveTriageDto } from './dto/save-triage.dto';
import { MarkTriageErrorDto } from './dto/mark-triage-error.dto';
import { SaveDraftSoapDto } from './dto/save-draft-soap.dto';
import { CreateClinicalOrderDto } from './dto/create-clinical-order.dto';
import { CancelClinicalOrderDto } from './dto/cancel-clinical-order.dto';
import { ReceiveLabOrderDto } from './dto/receive-lab-order.dto';
import { SaveDraftLabResultDto } from './dto/save-draft-lab-result.dto';
import { ValidateLabResultDto } from './dto/validate-lab-result.dto';
import { ReleaseLabResultDto } from './dto/release-lab-result.dto';
import { LabParameterDefinitionDto } from './dto/lab-parameter-definition.dto';
import type { RequestUser } from '../common/types/authenticated-request.type';
import {
  ClinicalWorkQueueDto,
  PatientClinicalSummaryDto,
  EncounterSummaryDto,
  VitalsSummaryDto,
  ClinicalOrderSummaryDto,
  LabResultSummaryDto,
  PrescriptionSummaryDto,
  BillingHandoffSummaryDto,
  ClinicalDashboardSummaryDto,
  TriageSummaryDto,
  SoapDraftSummaryDto,
  LabSpecimenSummaryDto,
  LabResultDraftSummaryDto,
  LabResultDraftContextDto,
  LabValidationSummaryDto,
  ValidatedResultSummaryDto,
  ReleasedResultSummaryDto,
  ReleasedResultQueueDto,
  LabTestDefinitionSummaryDto,
} from './dto/workflow-summaries.dto';

@Injectable()
export class ClinicalWorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly numbering: NumberingService,
  ) {}

  private getAuthorizedBranchId(user: RequestUser): string | undefined {
    if (user.roles?.includes('Super Admin')) {
      return undefined;
    }

    if (!user.branchId) {
      throw new ForbiddenException('access_denied: missing_branch_context');
    }

    return user.branchId;
  }

  async getWorkQueue(
    tenantId: string,
    branchId: string,
    user: RequestUser,
  ): Promise<ClinicalWorkQueueDto[]> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);
    ClinicalScopePolicy.authorizeBranch(user, branchId);

    const queueEntries = await this.prisma.queueEntry.findMany({
      where: {
        tenantId,
        branchId,
        status: { in: ['WAITING', 'CALLING', 'SERVING'] },
      },
      orderBy: { createdAt: 'asc' },
    });

    return queueEntries.map((q) => ({
      id: q.id,
      patientId: q.patientId || '',
      patientName: q.patientName || 'Anonymous',
      patientNumber: 'N/A', // Masked for queue
      queueNumber: q.queueNumber,
      category: q.category,
      serviceType: q.serviceType,
      status: q.status,
      waitTimeMinutes: Math.floor(
        (new Date().getTime() - q.createdAt.getTime()) / 60000,
      ),
      timestamp: q.createdAt,
      branchId: q.branchId,
      tenantId: q.tenantId,
      accessLabel: 'Workflow',
      isReadOnly: true,
    }));
  }

  async getPatientSummary(
    patientId: string,
    tenantId: string,
    user: RequestUser,
  ): Promise<PatientClinicalSummaryDto | null> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);
    ClinicalScopePolicy.authorizePatientAccess(user, patientId);
    const branchId = this.getAuthorizedBranchId(user);

    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId },
    });

    if (!patient) return null;

    const [recentEncounters, activePrescriptions, pendingLabs] =
      await Promise.all([
        this.prisma.encounter.count({
          where: {
            tenantId,
            patientId,
            branchId,
            archivedAt: null,
          },
        }),
        this.prisma.prescription.count({
          where: {
            tenantId,
            patientId,
            branchId,
            deletedAt: null,
          },
        }),
        this.prisma.labResult.count({
          where: {
            tenantId,
            ...(branchId
              ? { order: { patientId, branchId } }
              : { order: { patientId } }),
            status: { notIn: ['COMPLETED', 'RELEASED'] },
            archivedAt: null,
          },
        }),
      ]);

    return {
      id: patient.id,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientNumber: patient.patientNumber,
      dob: patient.dob,
      recentEncounters,
      activePrescriptions,
      pendingLabResults: pendingLabs,
      status: patient.status,
      timestamp: new Date(),
      accessLabel: 'Clinical Summary',
      isReadOnly: true,
    };
  }

  async getEncounters(
    patientId: string,
    tenantId: string,
    user: RequestUser,
  ): Promise<EncounterSummaryDto[]> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);
    ClinicalScopePolicy.authorizePatientAccess(user, patientId);

    const where: any = { patientId, tenantId, archivedAt: null };
    if (!user.roles?.includes('Super Admin') && user.branchId) {
      where.branchId = user.branchId;
    }

    const encounters = await this.prisma.encounter.findMany({
      where,
      include: {
        doctor: true,
        clinicalNotes: { take: 1 },
        diagnoses: true,
      },
      orderBy: { encounteredAt: 'desc' },
      take: 10,
    });

    return encounters.map((e) => {
      const isVisible = ClinicalScopePolicy.filterSensitiveContent(
        user,
        'ENCOUNTER',
        e.status === 'FINISHED',
      );

      const primaryDiagnosis = e.diagnoses.find((d) => d.isPrimary);
      const diagnosisLabel = primaryDiagnosis
        ? `${primaryDiagnosis.icd10Code} - ${primaryDiagnosis.description}`
        : undefined;

      return {
        id: e.id,
        patientId: e.patientId,
        doctorId: e.doctorId || undefined,
        doctorName: e.doctor ? `${e.doctor.email}` : 'Unknown',
        encounteredAt: e.encounteredAt,
        timestamp: e.createdAt,
        type: e.type || 'OUTPATIENT',
        status: e.status,
        chiefComplaint: isVisible ? e.chiefComplaint : '[REDACTED]',
        diagnosis: isVisible ? diagnosisLabel : '[REDACTED]',
        hasNotes: e.clinicalNotes.length > 0,
        branchId: e.branchId,
        tenantId: e.tenantId,
        accessLabel: isVisible ? 'Clinical' : 'Internal',
        isReadOnly: true,
      };
    });
  }

  async getVitals(
    patientId: string,
    tenantId: string,
    user: RequestUser,
  ): Promise<VitalsSummaryDto[]> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);
    ClinicalScopePolicy.authorizePatientAccess(user, patientId);
    const branchId = this.getAuthorizedBranchId(user);

    const vitals = await this.prisma.vitals.findMany({
      where: {
        tenantId,
        encounter: { patientId, archivedAt: null, branchId },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return vitals.map((v) => ({
      id: v.id,
      encounterId: v.encounterId,
      patientId,
      temperature: v.temperature ? Number(v.temperature) : undefined,
      systolicBp: v.systolicBp || undefined,
      diastolicBp: v.diastolicBp || undefined,
      heartRate: v.heartRate || undefined,
      respiratoryRate: v.respiratory || undefined,
      weightKg: v.weightKg ? Number(v.weightKg) : undefined,
      recordedAt: v.createdAt,
      timestamp: v.createdAt,
      status: v.status,
      accessLabel: 'Clinical Vitals',
      isReadOnly: true,
    }));
  }

  async saveVitals(
    patientId: string,
    tenantId: string,
    user: RequestUser,
    dto: SaveVitalsDto,
  ): Promise<VitalsSummaryDto> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);
    ClinicalScopePolicy.authorizePatientAccess(user, patientId);

    if (!user.roles?.includes('Super Admin') && !user.branchId) {
      throw new ForbiddenException('access_denied: missing_branch_context');
    }

    const hasVital =
      dto.systolicBp != null ||
      dto.diastolicBp != null ||
      dto.temperature != null ||
      dto.heartRate != null ||
      dto.respiratoryRate != null;
    if (!hasVital) {
      throw new BadRequestException(
        'validation_error: at_least_one_vital_required',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const encounter = await tx.encounter.findFirst({
        where: {
          patientId,
          tenantId,
          archivedAt: null,
          status: {
            notIn: ['FINISHED', 'CANCELLED', 'CLOSED', 'ENTERED_IN_ERROR'],
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!encounter) {
        throw new BadRequestException(
          'no_active_encounter: patient_has_no_open_encounter',
        );
      }

      ClinicalScopePolicy.authorizeBranch(user, encounter.branchId);

      const vitals = await tx.vitals.create({
        data: {
          tenantId,
          encounterId: encounter.id,
          temperature: dto.temperature,
          systolicBp: dto.systolicBp,
          diastolicBp: dto.diastolicBp,
          heartRate: dto.heartRate,
          respiratory: dto.respiratoryRate,
          createdBy: user.userId!,
        },
      });

      await this.audit.log(
        {
          tenantId,
          userId: user.userId!,
          eventKey: 'VITALS_SAVED',
          recordType: 'Vitals',
          recordId: vitals.id,
          newValues: {
            encounterId: encounter.id,
            patientId,
            recordedFields: Object.keys(dto).filter(
              (k) => (dto as any)[k] !== undefined,
            ),
          },
        },
        tx,
        encounter.branchId,
      );

      return {
        id: vitals.id,
        encounterId: vitals.encounterId,
        patientId,
        temperature: vitals.temperature
          ? Number(vitals.temperature)
          : undefined,
        systolicBp: vitals.systolicBp || undefined,
        diastolicBp: vitals.diastolicBp || undefined,
        heartRate: vitals.heartRate || undefined,
        respiratoryRate: vitals.respiratory || undefined,
        recordedAt: vitals.createdAt,
        timestamp: vitals.createdAt,
        status: vitals.status,
        recordedBy: user.userId,
        accessLabel: 'Clinical Vitals',
        isReadOnly: true,
      };
    });
  }

  async markVitalsEnteredInError(
    patientId: string,
    vitalsId: string,
    tenantId: string,
    user: RequestUser,
    dto: MarkVitalsErrorDto,
  ): Promise<void> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);
    ClinicalScopePolicy.authorizePatientAccess(user, patientId);

    if (!user.roles?.includes('Super Admin') && !user.branchId) {
      throw new ForbiddenException('access_denied: missing_branch_context');
    }

    await this.prisma.$transaction(async (tx) => {
      const vitals = await tx.vitals.findFirst({
        where: { id: vitalsId, tenantId },
        include: { encounter: true },
      });

      if (!vitals) {
        throw new NotFoundException('vitals_not_found');
      }

      if (vitals.encounter.patientId !== patientId) {
        throw new BadRequestException('patient_mismatch');
      }

      ClinicalScopePolicy.authorizeBranch(user, vitals.encounter.branchId);

      if (vitals.status !== 'ACTIVE') {
        throw new BadRequestException('vitals_not_active');
      }

      await tx.vitals.update({
        where: { id: vitalsId },
        data: {
          status: 'ENTERED_IN_ERROR',
          errorReason: dto.reason,
          errorById: user.userId!,
          errorAt: new Date(),
        },
      });

      await this.audit.log(
        {
          tenantId,
          userId: user.userId!,
          eventKey: 'VITALS_ENTERED_IN_ERROR',
          recordType: 'Vitals',
          recordId: vitals.id,
          newValues: {
            status: 'ENTERED_IN_ERROR',
            reason: dto.reason,
          },
        },
        tx,
        vitals.encounter.branchId,
      );
    });
  }

  async saveTriage(
    patientId: string,
    tenantId: string,
    user: RequestUser,
    dto: SaveTriageDto,
  ): Promise<void> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);
    ClinicalScopePolicy.authorizePatientAccess(user, patientId);

    if (!user.roles?.includes('Super Admin') && !user.branchId) {
      throw new ForbiddenException('access_denied: missing_branch_context');
    }

    const hasTriageData =
      dto.acuityLevel ||
      dto.chiefComplaintSummary ||
      dto.arrivalMode ||
      dto.painScore !== undefined ||
      dto.infectiousRiskFlag !== undefined ||
      dto.fallRiskFlag !== undefined ||
      dto.pregnancyFlag !== undefined ||
      dto.notes;

    if (!hasTriageData) {
      throw new BadRequestException(
        'validation_error: at_least_one_triage_field_required',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Check for active encounter first
      const encounter = await tx.encounter.findFirst({
        where: {
          patientId,
          tenantId,
          branchId: user.branchId || undefined,
          archivedAt: null,
          status: {
            notIn: ['FINISHED', 'CANCELLED', 'CLOSED', 'ENTERED_IN_ERROR'],
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // 2. Check for active queue entry if no encounter
      const queueEntry = await tx.queueEntry.findFirst({
        where: {
          patientId,
          tenantId,
          branchId: user.branchId || undefined,
          status: { in: ['WAITING', 'CALLING', 'SERVING'] },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!encounter && !queueEntry) {
        throw new BadRequestException(
          'no_active_workflow: patient_has_no_active_encounter_or_queue_entry',
        );
      }

      const branchId = encounter?.branchId || queueEntry!.branchId;
      ClinicalScopePolicy.authorizeBranch(user, branchId);

      const triage = await tx.triage.create({
        data: {
          tenantId,
          branchId,
          patientId,
          encounterId: encounter?.id,
          queueEntryId: queueEntry?.id,
          acuityLevel: dto.acuityLevel,
          chiefComplaintSummary: dto.chiefComplaintSummary,
          arrivalMode: dto.arrivalMode,
          painScore: dto.painScore,
          infectiousRiskFlag: dto.infectiousRiskFlag ?? false,
          fallRiskFlag: dto.fallRiskFlag ?? false,
          pregnancyFlag: dto.pregnancyFlag ?? false,
          notes: dto.notes,
          recordedById: user.userId!,
        },
      });

      await this.audit.log(
        {
          tenantId,
          userId: user.userId!,
          eventKey: 'TRIAGE_SAVED',
          recordType: 'Triage',
          recordId: triage.id,
          newValues: {
            patientId,
            encounterId: encounter?.id,
            queueEntryId: queueEntry?.id,
            acuityLevel: dto.acuityLevel,
            recordedFields: Object.keys(dto).filter(
              (k) => (dto as any)[k] !== undefined,
            ),
          },
        },
        tx,
        branchId,
      );
    });
  }

  async getTriage(
    patientId: string,
    tenantId: string,
    user: RequestUser,
  ): Promise<TriageSummaryDto[]> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);
    ClinicalScopePolicy.authorizePatientAccess(user, patientId);
    const branchId = this.getAuthorizedBranchId(user);

    const triageRecords = await this.prisma.triage.findMany({
      where: {
        tenantId,
        patientId,
        branchId,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return triageRecords.map((t) => ({
      id: t.id,
      patientId: t.patientId,
      encounterId: t.encounterId || undefined,
      queueEntryId: t.queueEntryId || undefined,
      acuityLevel: t.acuityLevel || undefined,
      chiefComplaintSummary: t.chiefComplaintSummary || undefined,
      arrivalMode: t.arrivalMode || undefined,
      painScore: t.painScore || undefined,
      infectiousRiskFlag: t.infectiousRiskFlag,
      fallRiskFlag: t.fallRiskFlag,
      pregnancyFlag: t.pregnancyFlag,
      notes: t.notes || undefined,
      status: t.status,
      recordedAt: t.createdAt,
      timestamp: t.createdAt,
      recordedBy: t.recordedById,
      accessLabel: 'Clinical Triage',
      isReadOnly: true,
    }));
  }

  async markTriageEnteredInError(
    patientId: string,
    triageId: string,
    tenantId: string,
    user: RequestUser,
    dto: MarkTriageErrorDto,
  ): Promise<void> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);
    ClinicalScopePolicy.authorizePatientAccess(user, patientId);

    if (!user.roles?.includes('Super Admin') && !user.branchId) {
      throw new ForbiddenException('access_denied: missing_branch_context');
    }

    await this.prisma.$transaction(async (tx) => {
      const triage = await tx.triage.findFirst({
        where: { id: triageId, tenantId },
      });

      if (!triage) {
        throw new NotFoundException('triage_not_found');
      }

      if (triage.patientId !== patientId) {
        throw new BadRequestException('patient_mismatch');
      }

      ClinicalScopePolicy.authorizeBranch(user, triage.branchId);

      if (triage.status !== 'ACTIVE') {
        throw new BadRequestException('triage_not_active');
      }

      await tx.triage.update({
        where: { id: triageId },
        data: {
          status: 'ENTERED_IN_ERROR',
          errorReason: dto.reason,
          errorById: user.userId!,
          errorAt: new Date(),
        },
      });

      await this.audit.log(
        {
          tenantId,
          userId: user.userId!,
          eventKey: 'TRIAGE_ENTERED_IN_ERROR',
          recordType: 'Triage',
          recordId: triage.id,
          newValues: {
            triageId: triage.id,
            patientId,
            encounterId: triage.encounterId,
            branchId: triage.branchId,
            oldStatus: 'ACTIVE',
            newStatus: 'ENTERED_IN_ERROR',
            reasonCode: dto.reason,
          },
        },
        tx,
        triage.branchId,
      );
    });
  }

  async getOrders(
    patientId: string,
    tenantId: string,
    user: RequestUser,
  ): Promise<ClinicalOrderSummaryDto[]> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);
    ClinicalScopePolicy.authorizePatientAccess(user, patientId);
    const branchId = this.getAuthorizedBranchId(user);

    const orders = await this.prisma.order.findMany({
      where: { patientId, tenantId, branchId, deletedAt: null },
      include: {
        _count: { select: { items: true } },
        clinicalItems: {
          select: {
            id: true,
            itemName: true,
            notes: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      patientId: o.patientId,
      status: o.status,
      itemCount: o._count.items,
      items: o.clinicalItems.map((ci) => ({
        id: ci.id,
        itemName: ci.itemName,
        notes: ci.notes,
        status: ci.status,
        createdAt: ci.createdAt,
      })),
      orderType: 'GENERAL',
      cancelledReason: o.cancelledReason || undefined,
      cancelledById: o.cancelledById || undefined,
      cancelledAt: o.cancelledAt || undefined,
      createdAt: o.createdAt,
      timestamp: o.createdAt,
      accessLabel: 'Order',
      isReadOnly: true,
    }));
  }

  async getLabResults(
    patientId: string,
    tenantId: string,
    user: RequestUser,
  ): Promise<LabResultSummaryDto[]> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);
    ClinicalScopePolicy.authorizePatientAccess(user, patientId);
    const branchId = this.getAuthorizedBranchId(user);

    const where: any = {
      tenantId,
      order: branchId ? { patientId, branchId } : { patientId },
      deletedAt: null,
      archivedAt: null,
    };

    // If patient or cashier, only see released results
    if (user.roles?.includes('Patient') || user.roles?.includes('Cashier')) {
      where.status = 'RELEASED';
    }

    const labs = await this.prisma.labResult.findMany({
      where,
      include: { order: true },
      orderBy: { createdAt: 'desc' },
    });

    return labs.map((l) => ({
      id: l.id,
      orderId: l.orderId,
      orderNumber: l.order.orderNumber,
      patientId,
      status: l.status,
      isReleased: l.status === 'RELEASED',
      releasedAt: l.releasedAt || l.lockedAt || undefined,
      timestamp: l.createdAt,
      accessLabel: l.status === 'RELEASED' ? 'Released' : 'Internal',
      isReadOnly: true,
    }));
  }

  async getPrescriptions(
    patientId: string,
    tenantId: string,
    user: RequestUser,
  ): Promise<PrescriptionSummaryDto[]> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);
    ClinicalScopePolicy.authorizePatientAccess(user, patientId);
    const branchId = this.getAuthorizedBranchId(user);

    const prescriptions = await this.prisma.prescription.findMany({
      where: { patientId, tenantId, branchId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return prescriptions.map((p) => ({
      id: p.id,
      encounterId: p.encounterId,
      patientId: p.patientId,
      medicationName: p.medicationName,
      dosage: p.dosage,
      frequency: p.frequency,
      duration: p.duration,
      status: p.status,
      prescribedAt: p.createdAt,
      timestamp: p.createdAt,
      prescribedBy: p.prescribedById,
      accessLabel: 'Clinical Prescription',
      isReadOnly: true,
    }));
  }

  async getBillingHandoff(
    patientId: string,
    tenantId: string,
    user: RequestUser,
  ): Promise<BillingHandoffSummaryDto[]> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);
    ClinicalScopePolicy.authorizePatientAccess(user, patientId);
    const branchId = this.getAuthorizedBranchId(user);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        order: branchId ? { patientId, branchId } : { patientId },
        deletedAt: null,
        archivedAt: null,
      },
      include: { order: true },
      orderBy: { createdAt: 'desc' },
    });

    return invoices.map((i) => ({
      id: i.id,
      orderId: i.orderId,
      orderNumber: i.order.orderNumber,
      patientId,
      totalAmount: Number(i.totalAmount),
      status: i.status,
      createdAt: i.createdAt,
      timestamp: i.createdAt,
      accessLabel: 'Billing Handoff',
      isReadOnly: true,
    }));
  }

  async getDashboardSummary(
    tenantId: string,
    branchId: string,
    user: RequestUser,
  ): Promise<ClinicalDashboardSummaryDto> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);
    ClinicalScopePolicy.authorizeBranch(user, branchId);

    const activePatients = await this.prisma.queueEntry.count({
      where: { tenantId, branchId, status: 'WAITING' },
    });

    const waitingForDoctor = await this.prisma.queueEntry.count({
      where: {
        tenantId,
        branchId,
        serviceType: 'DOCTOR',
        status: { in: ['WAITING', 'CALLING'] },
      },
    });

    const pendingLabs = await this.prisma.labResult.count({
      where: {
        tenantId,
        order: { branchId },
        status: { notIn: ['COMPLETED', 'RELEASED'] },
        archivedAt: null,
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedToday = await this.prisma.encounter.count({
      where: {
        tenantId,
        branchId,
        status: 'FINISHED',
        encounteredAt: { gte: today },
        archivedAt: null,
      },
    });

    return {
      branchId,
      activePatients,
      pendingTriage: activePatients, // Placeholder
      waitingForDoctor,
      pendingLabResults: pendingLabs,
      completedEncountersToday: completedToday,
      timestamp: new Date(),
      accessLabel: 'Operational Dashboard',
      isReadOnly: true,
    };
  }

  async saveDraftSOAP(
    patientId: string,
    encounterId: string,
    tenantId: string,
    user: RequestUser,
    dto: SaveDraftSoapDto,
  ): Promise<SoapDraftSummaryDto> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);
    ClinicalScopePolicy.authorizePatientAccess(user, patientId);

    // Verify authorized roles (Doctor, Branch Admin, Super Admin)
    const allowedRoles = ['Doctor', 'Branch Admin', 'Super Admin'];
    const hasAllowedRole = user.roles?.some((role) =>
      allowedRoles.includes(role),
    );
    if (!hasAllowedRole) {
      throw new ForbiddenException('access_denied: unauthorized_role');
    }

    // Branch scoping validation: if branch-scoped user, throw ForbiddenException if branchId is missing
    if (!user.roles?.includes('Super Admin') && !user.branchId) {
      throw new ForbiddenException('access_denied: missing_branch_context');
    }

    // Validate that at least one of the SOAP sections has non-empty text content
    const hasContent = (val?: string) =>
      val !== undefined && val !== null && val.trim().length > 0;
    const isValid =
      hasContent(dto.subjective) ||
      hasContent(dto.objective) ||
      hasContent(dto.assessment) ||
      hasContent(dto.plan);
    if (!isValid) {
      throw new BadRequestException(
        'validation_error: at_least_one_section_required',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Fetch encounter
      const encounter = await tx.encounter.findUnique({
        where: { id: encounterId },
      });

      if (!encounter) {
        throw new NotFoundException('encounter_not_found');
      }

      // Check route consistency
      if (encounter.tenantId !== tenantId) {
        throw new ForbiddenException(
          'access_denied: tenant_isolation_violation',
        );
      }
      if (encounter.patientId !== patientId) {
        throw new BadRequestException('validation_error: patient_id_mismatch');
      }

      // Encounter must be active/open/draft-compatible
      if (encounter.archivedAt) {
        throw new BadRequestException('validation_error: encounter_archived');
      }
      if (
        ['FINISHED', 'CANCELLED', 'CLOSED', 'ENTERED_IN_ERROR'].includes(
          encounter.status,
        )
      ) {
        throw new BadRequestException('validation_error: encounter_not_active');
      }

      // Verify branch scope matches encounter branch
      ClinicalScopePolicy.authorizeBranch(user, encounter.branchId);

      // Check for existing ClinicalNote of type SOAP
      const existingNote = await tx.clinicalNote.findFirst({
        where: {
          encounterId: encounter.id,
          noteType: 'SOAP',
          deletedAt: null,
        },
      });

      if (existingNote && existingNote.lockedAt) {
        throw new BadRequestException('validation_error: note_is_locked');
      }

      let note;
      if (existingNote) {
        note = await tx.clinicalNote.update({
          where: { id: existingNote.id },
          data: {
            subjective:
              dto.subjective !== undefined
                ? dto.subjective
                : existingNote.subjective,
            objective:
              dto.objective !== undefined
                ? dto.objective
                : existingNote.objective,
            assessment:
              dto.assessment !== undefined
                ? dto.assessment
                : existingNote.assessment,
            plan: dto.plan !== undefined ? dto.plan : existingNote.plan,
            updatedBy: user.userId!,
            version: { increment: 1 },
          },
        });
      } else {
        note = await tx.clinicalNote.create({
          data: {
            tenantId,
            encounterId: encounter.id,
            noteType: 'SOAP',
            content: '',
            authorId: user.userId!,
            subjective: dto.subjective || null,
            objective: dto.objective || null,
            assessment: dto.assessment || null,
            plan: dto.plan || null,
            createdBy: user.userId!,
            updatedBy: user.userId!,
          },
        });
      }

      // Log audit event in the same transaction (NO full SOAP text in audit logs)
      await this.audit.log(
        {
          tenantId,
          userId: user.userId!,
          eventKey: 'SOAP_DRAFT_SAVED',
          recordType: 'ClinicalNote',
          recordId: note.id,
          newValues: {
            patientId,
            encounterId: encounter.id,
            branchId: encounter.branchId,
            recordedFields: Object.keys(dto).filter(
              (k) => (dto as any)[k] !== undefined && (dto as any)[k] !== null,
            ),
            noteType: 'SOAP',
            status: 'DRAFT',
          },
        },
        tx,
        encounter.branchId,
      );

      return {
        id: note.id,
        encounterId: note.encounterId,
        patientId,
        subjective: note.subjective || undefined,
        objective: note.objective || undefined,
        assessment: note.assessment || undefined,
        plan: note.plan || undefined,
        noteType: 'SOAP',
        status: 'DRAFT',
        lockedAt: note.lockedAt || undefined,
        lockedBy: note.lockedBy || undefined,
        recordedAt: note.createdAt,
        timestamp: note.createdAt,
        recordedBy: note.authorId || user.userId!,
        accessLabel: 'Clinical SOAP Draft',
        isReadOnly: true,
      };
    });
  }

  async signSOAP(
    patientId: string,
    encounterId: string,
    tenantId: string,
    user: RequestUser,
  ): Promise<SoapDraftSummaryDto> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);
    ClinicalScopePolicy.authorizePatientAccess(user, patientId);

    // Verify authorized roles (Doctor, Branch Admin, Super Admin)
    const allowedRoles = ['Doctor', 'Branch Admin', 'Super Admin'];
    const hasAllowedRole = user.roles?.some((role) =>
      allowedRoles.includes(role),
    );
    if (!hasAllowedRole) {
      throw new ForbiddenException('access_denied: unauthorized_role');
    }

    // Branch scoping validation
    if (!user.roles?.includes('Super Admin') && !user.branchId) {
      throw new ForbiddenException('access_denied: missing_branch_context');
    }

    return this.prisma.$transaction(async (tx) => {
      // Fetch encounter
      const encounter = await tx.encounter.findUnique({
        where: { id: encounterId },
      });

      if (!encounter) {
        throw new NotFoundException('encounter_not_found');
      }

      // Check route consistency
      if (encounter.tenantId !== tenantId) {
        throw new ForbiddenException(
          'access_denied: tenant_isolation_violation',
        );
      }
      if (encounter.patientId !== patientId) {
        throw new BadRequestException('validation_error: patient_id_mismatch');
      }

      // Encounter must be active
      if (encounter.archivedAt) {
        throw new BadRequestException('validation_error: encounter_archived');
      }
      if (
        ['FINISHED', 'CANCELLED', 'CLOSED', 'ENTERED_IN_ERROR'].includes(
          encounter.status,
        )
      ) {
        throw new BadRequestException('validation_error: encounter_not_active');
      }

      // Verify branch scope matches encounter branch
      ClinicalScopePolicy.authorizeBranch(user, encounter.branchId);

      // Find existing SOAP note
      const existingNote = await tx.clinicalNote.findFirst({
        where: {
          encounterId: encounter.id,
          noteType: 'SOAP',
          deletedAt: null,
        },
      });

      if (!existingNote) {
        throw new BadRequestException(
          'validation_error: no_draft_soap_to_sign',
        );
      }

      if (existingNote.lockedAt) {
        throw new BadRequestException('validation_error: note_already_signed');
      }

      // Lock/sign the note
      const signedNote = await tx.clinicalNote.update({
        where: { id: existingNote.id },
        data: {
          lockedAt: new Date(),
          lockedBy: user.userId!,
          updatedBy: user.userId!,
          version: { increment: 1 },
        },
      });

      // Log audit event (metadata only — no full SOAP text)
      await this.audit.log(
        {
          tenantId,
          userId: user.userId!,
          eventKey: 'SOAP_SIGNED',
          recordType: 'ClinicalNote',
          recordId: signedNote.id,
          newValues: {
            patientId,
            encounterId: encounter.id,
            branchId: encounter.branchId,
            noteType: 'SOAP',
            oldStatus: 'DRAFT',
            newStatus: 'SIGNED',
            signedAt: signedNote.lockedAt?.toISOString(),
          },
        },
        tx,
        encounter.branchId,
      );

      return {
        id: signedNote.id,
        encounterId: signedNote.encounterId,
        patientId,
        subjective: signedNote.subjective || undefined,
        objective: signedNote.objective || undefined,
        assessment: signedNote.assessment || undefined,
        plan: signedNote.plan || undefined,
        noteType: 'SOAP',
        status: 'SIGNED',
        lockedAt: signedNote.lockedAt || undefined,
        lockedBy: signedNote.lockedBy || undefined,
        recordedAt: signedNote.createdAt,
        timestamp: signedNote.createdAt,
        recordedBy: signedNote.authorId || user.userId!,
        accessLabel: 'Clinical SOAP Signed',
        isReadOnly: true,
      };
    });
  }

  async createClinicalOrder(
    patientId: string,
    encounterId: string,
    tenantId: string,
    user: RequestUser,
    dto: CreateClinicalOrderDto,
  ): Promise<ClinicalOrderSummaryDto> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);
    ClinicalScopePolicy.authorizePatientAccess(user, patientId);

    const allowedRoles = ['Doctor', 'Branch Admin', 'Super Admin'];
    const hasAllowedRole = user.roles?.some((role) =>
      allowedRoles.includes(role),
    );
    if (!hasAllowedRole) {
      throw new ForbiddenException('access_denied: unauthorized_role');
    }

    if (!user.roles?.includes('Super Admin') && !user.branchId) {
      throw new ForbiddenException('access_denied: missing_branch_context');
    }

    return this.prisma.$transaction(async (tx) => {
      const encounter = await tx.encounter.findUnique({
        where: { id: encounterId },
      });

      if (!encounter) {
        throw new NotFoundException('encounter_not_found');
      }

      if (encounter.tenantId !== tenantId) {
        throw new ForbiddenException(
          'access_denied: tenant_isolation_violation',
        );
      }
      if (encounter.patientId !== patientId) {
        throw new BadRequestException('validation_error: patient_id_mismatch');
      }

      if (encounter.archivedAt) {
        throw new BadRequestException('validation_error: encounter_archived');
      }
      if (
        ['FINISHED', 'CANCELLED', 'CLOSED', 'ENTERED_IN_ERROR'].includes(
          encounter.status,
        )
      ) {
        throw new BadRequestException('validation_error: encounter_not_active');
      }

      ClinicalScopePolicy.authorizeBranch(user, encounter.branchId);

      const priority = dto.priority || 'ROUTINE';
      const orderNumber = await this.numbering.generateNumber(
        tenantId,
        'CLINICAL_ORDER',
        encounter.branchId,
        tx,
      );

      const itemCreateData = await Promise.all(
        dto.items.map(async (item) => {
          let resolvedDefinitionId: string | undefined;
          if (item.catalogCode) {
            const definition = await tx.labTestDefinition.findFirst({
              where: {
                tenantId,
                code: item.catalogCode,
                isActive: true,
              },
              select: { id: true },
            });
            if (definition) {
              resolvedDefinitionId = definition.id;
            } else {
              throw new BadRequestException(
                'validation_error: invalid_lab_test_catalog_code',
              );
            }
          }
          return {
            tenantId,
            itemName: item.itemName,
            labTestDefinitionId: resolvedDefinitionId ?? null,
            notes: item.notes || null,
            status: 'PENDING',
          };
        }),
      );

      const order = await tx.order.create({
        data: {
          tenantId,
          branchId: encounter.branchId,
          patientId,
          encounterId: encounter.id,
          orderNumber,
          status: 'PENDING',
          orderType: dto.orderType,
          priority,
          clinicalIndication: dto.clinicalIndication || null,
          requestedById: user.userId!,
          requestedAt: new Date(),
          createdById: user.userId!,
          updatedById: user.userId!,
          clinicalItems: {
            create: itemCreateData,
          },
        },
        include: {
          clinicalItems: {
            select: {
              id: true,
              itemName: true,
              labTestDefinitionId: true,
              notes: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });

      await this.audit.log(
        {
          tenantId,
          userId: user.userId!,
          eventKey: 'CLINICAL_ORDER_CREATED',
          recordType: 'Order',
          recordId: order.id,
          newValues: {
            patientId,
            encounterId: encounter.id,
            branchId: encounter.branchId,
            orderId: order.id,
            orderType: dto.orderType,
            priority,
            itemCount: order.clinicalItems.length,
            status: 'PENDING',
          },
        },
        tx,
        encounter.branchId,
      );

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        patientId: order.patientId,
        status: order.status,
        itemCount: order.clinicalItems.length,
        items: order.clinicalItems.map((item) => ({
          id: item.id,
          itemName: item.itemName,
          notes: item.notes,
          status: item.status,
          createdAt: item.createdAt,
        })),
        orderType: dto.orderType,
        createdAt: order.createdAt,
        timestamp: order.createdAt,
        accessLabel: 'Clinical Order',
        isReadOnly: true,
      };
    });
  }

  async cancelClinicalOrder(
    patientId: string,
    encounterId: string,
    orderId: string,
    tenantId: string,
    user: RequestUser,
    dto: CancelClinicalOrderDto,
  ): Promise<ClinicalOrderSummaryDto> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);
    ClinicalScopePolicy.authorizePatientAccess(user, patientId);

    const allowedRoles = ['Doctor', 'Branch Admin', 'Super Admin'];
    const hasAllowedRole = user.roles?.some((role) =>
      allowedRoles.includes(role),
    );
    if (!hasAllowedRole) {
      throw new ForbiddenException('access_denied: unauthorized_role');
    }

    if (!user.roles?.includes('Super Admin') && !user.branchId) {
      throw new ForbiddenException('access_denied: missing_branch_context');
    }

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { encounter: true },
      });

      if (!order) {
        throw new NotFoundException('order_not_found');
      }

      if (order.tenantId !== tenantId) {
        throw new ForbiddenException(
          'access_denied: tenant_isolation_violation',
        );
      }

      if (order.patientId !== patientId) {
        throw new BadRequestException('validation_error: patient_id_mismatch');
      }

      if (order.encounterId !== encounterId) {
        throw new BadRequestException(
          'validation_error: encounter_id_mismatch',
        );
      }

      ClinicalScopePolicy.authorizeBranch(user, order.branchId);

      const cancellableStatuses = ['DRAFT', 'PENDING', 'REQUESTED'];
      if (!cancellableStatuses.includes(order.status)) {
        throw new BadRequestException(
          'validation_error: order_not_cancellable',
        );
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          cancelledReason: dto.reason,
          cancelledById: user.userId!,
          cancelledAt: new Date(),
          updatedById: user.userId!,
        },
        include: {
          clinicalItems: {
            select: {
              id: true,
              itemName: true,
              notes: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });

      await this.audit.log(
        {
          tenantId,
          userId: user.userId!,
          eventKey: 'CLINICAL_ORDER_CANCELLED',
          recordType: 'Order',
          recordId: order.id,
          newValues: {
            patientId,
            encounterId,
            branchId: order.branchId,
            orderId: order.id,
            oldStatus: order.status,
            newStatus: 'CANCELLED',
            reasonCode: dto.reason.substring(0, 100),
          },
        },
        tx,
        order.branchId,
      );

      return {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        patientId: updatedOrder.patientId,
        status: updatedOrder.status,
        itemCount: updatedOrder.clinicalItems.length,
        items: updatedOrder.clinicalItems.map((ci) => ({
          id: ci.id,
          itemName: ci.itemName,
          notes: ci.notes,
          status: ci.status,
          createdAt: ci.createdAt,
        })),
        orderType: updatedOrder.orderType || 'GENERAL',
        cancelledReason: updatedOrder.cancelledReason || undefined,
        cancelledById: updatedOrder.cancelledById || undefined,
        cancelledAt: updatedOrder.cancelledAt || undefined,
        createdAt: updatedOrder.createdAt,
        timestamp: updatedOrder.createdAt,
        accessLabel: 'Clinical Order',
        isReadOnly: true,
      };
    });
  }

  async receiveLabOrder(
    patientId: string,
    orderId: string,
    tenantId: string,
    user: RequestUser,
    dto: ReceiveLabOrderDto,
  ): Promise<LabSpecimenSummaryDto> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);
    ClinicalScopePolicy.authorizePatientAccess(user, patientId);

    const allowedRoles = ['Lab Technician', 'Branch Admin', 'Super Admin'];
    const hasAllowedRole = user.roles?.some((role) =>
      allowedRoles.includes(role),
    );
    if (!hasAllowedRole) {
      throw new ForbiddenException('access_denied: unauthorized_role');
    }

    if (!user.roles?.includes('Super Admin') && !user.branchId) {
      throw new ForbiddenException('access_denied: missing_branch_context');
    }

    const collectionMode = dto.collectionMode || 'ROUTINE';
    const validModes = ['ROUTINE', 'STAT', 'URGENT'];
    if (!validModes.includes(collectionMode)) {
      throw new BadRequestException(
        'validation_error: invalid_collection_mode',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new NotFoundException('order_not_found');
      }

      if (order.tenantId !== tenantId) {
        throw new ForbiddenException(
          'access_denied: tenant_isolation_violation',
        );
      }

      if (order.patientId !== patientId) {
        throw new BadRequestException('validation_error: patient_id_mismatch');
      }

      ClinicalScopePolicy.authorizeBranch(user, order.branchId);

      if (order.orderType !== 'LAB') {
        throw new BadRequestException('validation_error: not_a_lab_order');
      }

      const receivableStatuses = ['PENDING', 'REQUESTED', 'ORDERED'];
      if (!receivableStatuses.includes(order.status)) {
        throw new BadRequestException('validation_error: order_not_receivable');
      }

      const existing = await tx.labSpecimen.findUnique({
        where: { orderId },
      });
      if (existing) {
        throw new BadRequestException(
          'validation_error: specimen_already_received',
        );
      }

      const specimen = await tx.labSpecimen.create({
        data: {
          tenantId,
          branchId: order.branchId,
          patientId,
          orderId,
          specimenType: dto.specimenType,
          accessionNumber: dto.accessionNumber || null,
          collectionMode,
          receivedById: user.userId!,
          receivedAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'RECEIVED',
          updatedById: user.userId!,
        },
      });

      await this.audit.log(
        {
          tenantId,
          userId: user.userId!,
          eventKey: 'LAB_ORDER_RECEIVED',
          recordType: 'LabSpecimen',
          recordId: specimen.id,
          newValues: {
            patientId,
            orderId,
            branchId: order.branchId,
            specimenType: dto.specimenType,
            accessionNumber: dto.accessionNumber || null,
            collectionMode,
            oldStatus: order.status,
            newStatus: 'RECEIVED',
            receivedById: user.userId!,
            receivedAt: specimen.receivedAt,
          },
        },
        tx,
        order.branchId,
      );

      return {
        id: specimen.id,
        orderId: specimen.orderId,
        specimenType: specimen.specimenType,
        accessionNumber: specimen.accessionNumber || undefined,
        collectionMode: specimen.collectionMode,
        collectedAt: specimen.collectedAt || undefined,
        receivedAt: specimen.receivedAt,
        receivedById: specimen.receivedById,
        status: specimen.status,
        createdAt: specimen.createdAt,
        timestamp: specimen.createdAt,
        accessLabel: 'Lab Specimen',
        isReadOnly: true,
      };
    });
  }

  async saveDraftLabResult(
    patientId: string,
    orderId: string,
    tenantId: string,
    user: RequestUser,
    dto: SaveDraftLabResultDto,
  ): Promise<LabResultDraftSummaryDto> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);
    ClinicalScopePolicy.authorizePatientAccess(user, patientId);

    const allowedRoles = ['Lab Technician', 'Branch Admin', 'Super Admin'];
    const hasAllowedRole = user.roles?.some((role) =>
      allowedRoles.includes(role),
    );
    if (!hasAllowedRole) {
      throw new ForbiddenException('access_denied: unauthorized_role');
    }

    if (!user.roles?.includes('Super Admin') && !user.branchId) {
      throw new ForbiddenException('access_denied: missing_branch_context');
    }

    const finalStatuses = ['APPROVED', 'RELEASED', 'AMENDED'];

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new NotFoundException('order_not_found');
      }

      if (order.tenantId !== tenantId) {
        throw new ForbiddenException(
          'access_denied: tenant_isolation_violation',
        );
      }

      if (order.patientId !== patientId) {
        throw new BadRequestException('validation_error: patient_id_mismatch');
      }

      ClinicalScopePolicy.authorizeBranch(user, order.branchId);

      if (order.orderType !== 'LAB') {
        throw new BadRequestException('validation_error: not_a_lab_order');
      }

      if (order.status === 'CANCELLED') {
        throw new BadRequestException('validation_error: order_is_cancelled');
      }

      // Verify specimen has been received
      const specimen = await tx.labSpecimen.findUnique({
        where: { orderId },
      });

      if (!specimen) {
        throw new BadRequestException(
          'validation_error: specimen_not_received',
        );
      }

      if (specimen.tenantId !== tenantId) {
        throw new ForbiddenException(
          'access_denied: tenant_isolation_violation',
        );
      }

      if (specimen.status !== 'RECEIVED') {
        throw new BadRequestException(
          'validation_error: specimen_not_in_received_status',
        );
      }

      // Check existing LabResult
      const existingResult = await tx.labResult.findUnique({
        where: { orderId },
      });

      let result;
      const isNew = !existingResult;
      const oldStatus = existingResult?.status || 'PENDING_COLLECTION';

      if (existingResult) {
        if (finalStatuses.includes(existingResult.status)) {
          throw new BadRequestException(
            'validation_error: result_already_finalized',
          );
        }
        if (existingResult.lockedAt) {
          throw new BadRequestException('validation_error: result_is_locked');
        }

        const updateResult = await tx.labResult.updateMany({
          where: {
            id: existingResult.id,
            version: existingResult.version,
            status: 'ENCODED',
          },
          data: {
            status: 'ENCODED',
            results: dto.results,
            remarks: dto.remarks || null,
            lastEditedById: user.userId!,
            lastEditedAt: new Date(),
            updatedById: user.userId!,
            version: { increment: 1 },
          },
        });

        if (updateResult.count !== 1) {
          throw new ConflictException(
            'conflict_error: result_modified_by_another_user',
          );
        }

        result = await tx.labResult.findUniqueOrThrow({
          where: { id: existingResult.id },
        });
      } else {
        const now = new Date();
        result = await tx.labResult.create({
          data: {
            tenantId,
            orderId,
            status: 'ENCODED',
            results: dto.results,
            remarks: dto.remarks || null,
            encodedById: user.userId!,
            encodedAt: now,
            lastEditedById: user.userId!,
            lastEditedAt: now,
            createdById: user.userId!,
            updatedById: user.userId!,
          },
        });
      }

      // Audit log: metadata only, no raw result payload
      await this.audit.log(
        {
          tenantId,
          userId: user.userId!,
          eventKey: 'LAB_RESULT_DRAFT_SAVED',
          recordType: 'LabResult',
          recordId: result.id,
          newValues: {
            patientId,
            orderId,
            branchId: order.branchId,
            oldStatus,
            newStatus: 'ENCODED',
            hasRemarks: !!dto.remarks,
            fieldCount: Object.keys(dto.results || {}).length,
            isNew,
          },
        },
        tx,
        order.branchId,
      );

      return {
        id: result.id,
        orderId: result.orderId,
        status: result.status,
        version: result.version,
        results: result.results as Record<string, any> | undefined,
        remarks: result.remarks || undefined,
        encodedById: result.encodedById || undefined,
        encodedAt: result.encodedAt || undefined,
        lastEditedById: result.lastEditedById || undefined,
        lastEditedAt: result.lastEditedAt || undefined,
        createdAt: result.createdAt,
        timestamp: result.createdAt,
        accessLabel: 'Lab Result Draft',
        isReadOnly: true,
      };
    });
  }

  async validateLabResult(
    patientId: string,
    orderId: string,
    tenantId: string,
    user: RequestUser,
    dto: ValidateLabResultDto,
  ): Promise<LabValidationSummaryDto> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);
    ClinicalScopePolicy.authorizePatientAccess(user, patientId);

    const allowedRoles = ['Lab Technician', 'Branch Admin', 'Super Admin'];
    const hasAllowedRole = user.roles?.some((role) =>
      allowedRoles.includes(role),
    );
    if (!hasAllowedRole) {
      throw new ForbiddenException('access_denied: unauthorized_role');
    }

    if (!user.roles?.includes('Super Admin') && !user.branchId) {
      throw new ForbiddenException('access_denied: missing_branch_context');
    }

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new NotFoundException('order_not_found');
      }

      if (order.tenantId !== tenantId) {
        throw new ForbiddenException(
          'access_denied: tenant_isolation_violation',
        );
      }

      if (order.patientId !== patientId) {
        throw new BadRequestException('validation_error: patient_id_mismatch');
      }

      ClinicalScopePolicy.authorizeBranch(user, order.branchId);

      if (order.orderType !== 'LAB') {
        throw new BadRequestException('validation_error: not_a_lab_order');
      }

      if (order.status === 'CANCELLED') {
        throw new BadRequestException('validation_error: order_is_cancelled');
      }

      const existingResult = await tx.labResult.findUnique({
        where: { orderId },
      });

      if (!existingResult) {
        throw new BadRequestException(
          'validation_error: result_not_encoded_yet',
        );
      }

      if (existingResult.tenantId !== tenantId) {
        throw new ForbiddenException(
          'access_denied: tenant_isolation_violation',
        );
      }

      if (existingResult.status !== 'ENCODED') {
        throw new BadRequestException(
          'validation_error: result_must_be_in_encoded_status',
        );
      }

      if (existingResult.lockedAt) {
        throw new BadRequestException('validation_error: result_is_locked');
      }

      if (existingResult.archivedAt) {
        throw new BadRequestException('validation_error: result_is_archived');
      }

      if (existingResult.version !== dto.version) {
        throw new ConflictException(
          'conflict_error: result_modified_by_another_user',
        );
      }

      const now = new Date();

      const updateResult = await tx.labResult.updateMany({
        where: {
          id: existingResult.id,
          version: existingResult.version,
          status: 'ENCODED',
        },
        data: {
          status: 'VALIDATED',
          validatedById: user.userId!,
          validatedAt: now,
          remarks:
            dto.remarks !== undefined ? dto.remarks : existingResult.remarks,
          updatedById: user.userId!,
          version: { increment: 1 },
        },
      });

      if (updateResult.count !== 1) {
        throw new ConflictException(
          'conflict_error: result_modified_by_another_user',
        );
      }

      const result = await tx.labResult.findUniqueOrThrow({
        where: { id: existingResult.id },
      });

      await this.audit.log(
        {
          tenantId,
          userId: user.userId!,
          eventKey: 'LAB_RESULT_VALIDATED',
          recordType: 'LabResult',
          recordId: result.id,
          newValues: {
            patientId,
            orderId,
            branchId: order.branchId,
            oldStatus: 'ENCODED',
            newStatus: 'VALIDATED',
            hasRemarks: !!dto.remarks,
            oldVersion: existingResult.version,
            newVersion: result.version,
          },
        },
        tx,
        order.branchId,
      );

      return {
        id: result.id,
        orderId: result.orderId,
        status: result.status,
        version: result.version,
        results: result.results as Record<string, any> | undefined,
        remarks: result.remarks || undefined,
        encodedById: result.encodedById || undefined,
        encodedAt: result.encodedAt || undefined,
        validatedById: result.validatedById || undefined,
        validatedAt: result.validatedAt || undefined,
        createdAt: result.createdAt,
        timestamp: result.createdAt,
        accessLabel: 'Lab Validation',
        isReadOnly: true,
      };
    });
  }

  async releaseLabResult(
    patientId: string,
    orderId: string,
    tenantId: string,
    user: RequestUser,
    dto: ReleaseLabResultDto,
  ): Promise<ReleasedResultSummaryDto> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);
    ClinicalScopePolicy.authorizePatientAccess(user, patientId);

    const allowedRoles = ['Branch Admin', 'Super Admin'];
    const hasAllowedRole = user.roles?.some((role) =>
      allowedRoles.includes(role),
    );
    if (!hasAllowedRole) {
      throw new ForbiddenException('access_denied: unauthorized_role');
    }

    if (!user.roles?.includes('Super Admin') && !user.branchId) {
      throw new ForbiddenException('access_denied: missing_branch_context');
    }

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new NotFoundException('order_not_found');
      }

      if (order.tenantId !== tenantId) {
        throw new ForbiddenException(
          'access_denied: tenant_isolation_violation',
        );
      }

      if (order.patientId !== patientId) {
        throw new BadRequestException('validation_error: patient_id_mismatch');
      }

      ClinicalScopePolicy.authorizeBranch(user, order.branchId);

      if (order.orderType !== 'LAB') {
        throw new BadRequestException('validation_error: not_a_lab_order');
      }

      if (order.status === 'CANCELLED') {
        throw new BadRequestException('validation_error: order_is_cancelled');
      }

      const specimen = await tx.labSpecimen.findUnique({
        where: { orderId },
      });

      if (!specimen) {
        throw new BadRequestException(
          'validation_error: specimen_not_received',
        );
      }

      if (specimen.status !== 'RECEIVED') {
        throw new BadRequestException(
          'validation_error: specimen_not_in_received_status',
        );
      }

      const existingResult = await tx.labResult.findUnique({
        where: { orderId },
      });

      if (!existingResult) {
        throw new BadRequestException('validation_error: result_not_found');
      }

      if (existingResult.tenantId !== tenantId) {
        throw new ForbiddenException(
          'access_denied: tenant_isolation_violation',
        );
      }

      if (existingResult.status !== 'VALIDATED') {
        throw new BadRequestException(
          'validation_error: result_must_be_validated',
        );
      }

      if (existingResult.archivedAt) {
        throw new BadRequestException('validation_error: result_is_archived');
      }

      if (existingResult.deletedAt) {
        throw new BadRequestException('validation_error: result_is_deleted');
      }

      if (existingResult.version !== dto.version) {
        throw new ConflictException(
          'conflict_error: result_modified_by_another_user',
        );
      }

      const now = new Date();

      const updateResult = await tx.labResult.updateMany({
        where: {
          id: existingResult.id,
          version: existingResult.version,
          status: 'VALIDATED',
        },
        data: {
          status: 'RELEASED',
          releasedById: user.userId!,
          releasedAt: now,
          updatedById: user.userId!,
          version: { increment: 1 },
        },
      });

      if (updateResult.count !== 1) {
        throw new ConflictException(
          'conflict_error: result_modified_by_another_user',
        );
      }

      const result = await tx.labResult.findUniqueOrThrow({
        where: { id: existingResult.id },
      });

      await this.audit.log(
        {
          tenantId,
          userId: user.userId!,
          eventKey: 'LAB_RESULT_RELEASED',
          recordType: 'LabResult',
          recordId: result.id,
          newValues: {
            patientId,
            orderId,
            branchId: order.branchId,
            oldStatus: 'VALIDATED',
            newStatus: 'RELEASED',
            oldVersion: existingResult.version,
            newVersion: result.version,
            releasedById: user.userId!,
            releasedAt: now,
          },
        },
        tx,
        order.branchId,
      );

      return {
        id: result.id,
        orderId: result.orderId,
        status: result.status,
        version: result.version,
        results: result.results as Record<string, any> | undefined,
        remarks: result.remarks || undefined,
        validatedById: result.validatedById || undefined,
        validatedAt: result.validatedAt || undefined,
        releasedById: result.releasedById || undefined,
        releasedAt: result.releasedAt || undefined,
        createdAt: result.createdAt,
        timestamp: result.createdAt,
        accessLabel: 'Released — For Clinical Visibility',
        isReadOnly: true,
      };
    });
  }

  async getValidatedResults(
    tenantId: string,
    branchId: string | undefined,
    user: RequestUser,
  ): Promise<ValidatedResultSummaryDto[]> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);

    const allowedRoles = ['Lab Technician', 'Branch Admin', 'Super Admin'];
    const hasAllowedRole = user.roles?.some((role) =>
      allowedRoles.includes(role),
    );
    if (!hasAllowedRole) {
      throw new ForbiddenException('access_denied: unauthorized_role');
    }

    if (!user.roles?.includes('Super Admin') && !branchId) {
      throw new ForbiddenException('access_denied: missing_branch_context');
    }

    const results: any = await this.prisma.labResult.findMany({
      where: {
        status: 'VALIDATED',
        archivedAt: null,
        deletedAt: null,
        tenantId,
        ...(user.roles?.includes('Super Admin') ? {} : { order: { branchId } }),
      },
      include: {
        order: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                patientNumber: true,
              },
            },
            labSpecimen: {
              select: {
                id: true,
                specimenType: true,
                accessionNumber: true,
              },
            },
            clinicalItems: {
              take: 1,
              select: { itemName: true },
            },
          },
        },
      },
      orderBy: { validatedAt: { sort: 'desc', nulls: 'last' } },
    });

    return results.map((r: any) => ({
      id: r.id,
      orderId: r.orderId,
      orderNumber: r.order?.orderNumber || '',
      patientId: r.order?.patient?.id || '',
      patientName: r.order?.patient
        ? `${r.order.patient.firstName || ''} ${r.order.patient.lastName || ''}`.trim()
        : '[REDACTED]',
      patientNumber: r.order?.patient?.patientNumber || '',
      specimenId: r.order?.labSpecimen?.id || '',
      specimenType: r.order?.labSpecimen?.specimenType || '',
      accessionNumber: r.order?.labSpecimen?.accessionNumber || undefined,
      panelName: r.order?.clinicalItems?.[0]?.itemName || undefined,
      validatedAt: r.validatedAt || new Date(),
      validatedById: r.validatedById || undefined,
      version: r.version,
      status: r.status,
      timestamp: r.updatedAt,
      accessLabel: 'Validated — Pending Release',
      isReadOnly: true,
    }));
  }

  async getReleasedResults(
    tenantId: string,
    branchId: string | undefined,
    user: RequestUser,
  ): Promise<ReleasedResultQueueDto[]> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);

    const allowedRoles = ['Lab Technician', 'Branch Admin', 'Super Admin'];
    const hasAllowedRole = user.roles?.some((role) =>
      allowedRoles.includes(role),
    );
    if (!hasAllowedRole) {
      throw new ForbiddenException('access_denied: unauthorized_role');
    }

    if (!user.roles?.includes('Super Admin') && !branchId) {
      throw new ForbiddenException('access_denied: missing_branch_context');
    }

    const results: any = await this.prisma.labResult.findMany({
      where: {
        status: 'RELEASED',
        archivedAt: null,
        deletedAt: null,
        tenantId,
        ...(user.roles?.includes('Super Admin') ? {} : { order: { branchId } }),
      },
      include: {
        order: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                patientNumber: true,
              },
            },
            labSpecimen: {
              select: {
                id: true,
                specimenType: true,
                accessionNumber: true,
              },
            },
            clinicalItems: {
              take: 1,
              select: { itemName: true },
            },
          },
        },
      },
      orderBy: { releasedAt: { sort: 'desc', nulls: 'last' } },
    });

    // Fire-and-forget audit — don't block the read if audit write fails
    try {
      await this.audit.log(
        {
          tenantId,
          userId: user.userId!,
          eventKey: 'LAB_RELEASED_QUEUE_VIEWED',
          recordType: 'LabResult',
          recordId: 'QUEUE',
          newValues: {
            branchScope: branchId || 'ALL',
            count: results.length,
            action: 'PHI_QUEUE_READ',
          },
        },
        undefined,
        branchId,
      );
    } catch {
      console.error(
        '[Audit] LAB_RELEASED_QUEUE_VIEWED failed: audit write error',
      );
    }

    return results.map((r: any) => ({
      id: r.id,
      orderId: r.orderId,
      orderNumber: r.order?.orderNumber || '',
      patientId: r.order?.patient?.id || '',
      patientName: r.order?.patient
        ? `${r.order.patient.firstName || ''} ${r.order.patient.lastName || ''}`.trim()
        : '[REDACTED]',
      patientNumber: r.order?.patient?.patientNumber || '',
      specimenId: r.order?.labSpecimen?.id || '',
      specimenType: r.order?.labSpecimen?.specimenType || '',
      accessionNumber: r.order?.labSpecimen?.accessionNumber || undefined,
      panelName: r.order?.clinicalItems?.[0]?.itemName || undefined,
      validatedAt: r.validatedAt || new Date(),
      validatedById: r.validatedById || undefined,
      releasedAt: r.releasedAt || new Date(),
      releasedById: r.releasedById || undefined,
      version: r.version,
      status: r.status,
      timestamp: r.updatedAt,
      accessLabel: 'Released — For Clinical Visibility',
      isReadOnly: true,
    }));
  }

  async getReleasedLabResultDetail(
    patientId: string,
    orderId: string,
    tenantId: string,
    user: RequestUser,
  ): Promise<ReleasedResultSummaryDto> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);
    ClinicalScopePolicy.authorizePatientAccess(user, patientId);

    const allowedRoles = [
      'Doctor',
      'Nurse',
      'Lab Technician',
      'Branch Admin',
      'Super Admin',
    ];
    const hasAllowedRole = user.roles?.some((role) =>
      allowedRoles.includes(role),
    );
    if (!hasAllowedRole) {
      throw new ForbiddenException('access_denied: unauthorized_role');
    }

    if (!user.roles?.includes('Super Admin') && !user.branchId) {
      throw new ForbiddenException('access_denied: missing_branch_context');
    }

    const labResult = await this.prisma.labResult.findFirst({
      where: { orderId, order: { tenantId }, archivedAt: null },
      include: {
        order: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                patientNumber: true,
              },
            },
          },
        },
      },
    });

    if (!labResult) {
      throw new NotFoundException('lab_result_not_found');
    }

    if (labResult.tenantId !== tenantId) {
      throw new ForbiddenException('access_denied: tenant_isolation_violation');
    }

    if (labResult.order?.patientId !== patientId) {
      throw new BadRequestException('validation_error: patient_id_mismatch');
    }

    if (labResult.order?.tenantId !== tenantId) {
      throw new ForbiddenException('access_denied: tenant_isolation_violation');
    }

    ClinicalScopePolicy.authorizeBranch(user, labResult.order?.branchId);

    if (labResult.order?.orderType !== 'LAB') {
      throw new BadRequestException('validation_error: not_a_lab_order');
    }

    if (labResult.order?.status === 'CANCELLED') {
      throw new BadRequestException('validation_error: order_is_cancelled');
    }

    if (labResult.status !== 'RELEASED') {
      throw new BadRequestException('validation_error: result_not_released');
    }

    if (labResult.archivedAt) {
      throw new BadRequestException('validation_error: result_is_archived');
    }

    if (labResult.deletedAt) {
      throw new BadRequestException('validation_error: result_is_deleted');
    }

    // PHI read audit: metadata only, no raw results/remarks
    // Fire-and-forget — don't block the read if audit write fails
    try {
      await this.audit.log(
        {
          tenantId,
          userId: user.userId!,
          eventKey: 'LAB_RESULT_RELEASED_READ',
          recordType: 'LabResult',
          recordId: labResult.id,
          newValues: {
            patientId,
            orderId,
            branchId: labResult.order?.branchId,
            status: labResult.status,
            accessedById: user.userId!,
            accessedAt: new Date().toISOString(),
            accessedByRole: user.roles?.join(',') || 'unknown',
          },
        },
        undefined,
        labResult.order?.branchId,
      );
    } catch {
      console.error(
        '[Audit] LAB_RESULT_RELEASED_READ failed: audit write error',
      );
    }

    return {
      id: labResult.id,
      orderId: labResult.orderId,
      status: labResult.status,
      version: labResult.version,
      results: (labResult.results as Record<string, any>) || undefined,
      remarks: labResult.remarks || undefined,
      validatedById: labResult.validatedById || undefined,
      validatedAt: labResult.validatedAt || undefined,
      releasedById: labResult.releasedById || undefined,
      releasedAt: labResult.releasedAt || undefined,
      createdAt: labResult.createdAt,
      timestamp: labResult.updatedAt,
      accessLabel: 'Released — For Clinical Visibility',
      isReadOnly: true,
    };
  }

  async getLabDraftEncodingContext(
    patientId: string,
    orderId: string,
    tenantId: string,
    user: RequestUser,
  ): Promise<LabResultDraftContextDto> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);
    ClinicalScopePolicy.authorizePatientAccess(user, patientId);

    const allowedRoles = ['Lab Technician', 'Branch Admin', 'Super Admin'];
    const hasAllowedRole = user.roles?.some((role) =>
      allowedRoles.includes(role),
    );
    if (!hasAllowedRole) {
      throw new ForbiddenException('access_denied: unauthorized_role');
    }

    if (!user.roles?.includes('Super Admin') && !user.branchId) {
      throw new ForbiddenException('access_denied: missing_branch_context');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            patientNumber: true,
            dob: true,
          },
        },
        clinicalItems: {
          select: {
            id: true,
            itemName: true,
            notes: true,
            status: true,
            createdAt: true,
          },
        },
        labSpecimen: true,
        labResult: true,
      },
    });

    if (!order) {
      throw new NotFoundException('order_not_found');
    }

    if (order.tenantId !== tenantId) {
      throw new ForbiddenException('access_denied: tenant_isolation_violation');
    }

    if (order.patientId !== patientId) {
      throw new BadRequestException('validation_error: patient_id_mismatch');
    }

    ClinicalScopePolicy.authorizeBranch(user, order.branchId);

    if (order.orderType !== 'LAB') {
      throw new BadRequestException('validation_error: not_a_lab_order');
    }

    if (order.status === 'CANCELLED') {
      throw new BadRequestException('validation_error: order_is_cancelled');
    }

    if (!order.labSpecimen) {
      throw new BadRequestException('validation_error: specimen_not_received');
    }

    if (order.labSpecimen.tenantId !== tenantId) {
      throw new ForbiddenException('access_denied: tenant_isolation_violation');
    }

    const panelName =
      order.clinicalItems.length > 0
        ? order.clinicalItems[0].itemName
        : undefined;

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      orderPriority: order.priority || undefined,
      patientId: order.patient.id,
      patientName: `${order.patient.firstName} ${order.patient.lastName}`,
      patientNumber: order.patient.patientNumber,
      dob: order.patient.dob,
      panelName,
      testItems: order.clinicalItems.map((ci) => ({
        id: ci.id,
        itemName: ci.itemName,
        notes: ci.notes,
        status: ci.status,
        createdAt: ci.createdAt,
      })),
      specimenId: order.labSpecimen.id,
      specimenType: order.labSpecimen.specimenType,
      accessionNumber: order.labSpecimen.accessionNumber || undefined,
      collectionMode: order.labSpecimen.collectionMode,
      receivedAt: order.labSpecimen.receivedAt,
      draftResultId: order.labResult?.id || undefined,
      draftStatus: order.labResult?.status || undefined,
      draftVersion: order.labResult?.version || undefined,
      draftResults:
        (order.labResult?.results as Record<string, any>) || undefined,
      draftRemarks: order.labResult?.remarks || undefined,
      draftLastEditedById: order.labResult?.lastEditedById || undefined,
      draftLastEditedAt: order.labResult?.lastEditedAt || undefined,
      requestedById: order.requestedById || undefined,
      requestedAt: order.requestedAt || undefined,
      encounterId: order.encounterId || undefined,
      priority: order.priority || undefined,
      timestamp: new Date(),
      accessLabel: 'Lab Draft Encoding Context',
      isReadOnly: true,
    };
  }

  async getDraftSOAP(
    patientId: string,
    encounterId: string,
    tenantId: string,
    user: RequestUser,
  ): Promise<SoapDraftSummaryDto | null> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);
    ClinicalScopePolicy.authorizePatientAccess(user, patientId);

    // Verify authorized roles (Doctor, Branch Admin, Super Admin)
    const allowedRoles = ['Doctor', 'Branch Admin', 'Super Admin'];
    const hasAllowedRole = user.roles?.some((role) =>
      allowedRoles.includes(role),
    );
    if (!hasAllowedRole) {
      throw new ForbiddenException('access_denied: unauthorized_role');
    }

    // Branch scoping validation: if branch-scoped user, throw ForbiddenException if branchId is missing
    if (!user.roles?.includes('Super Admin') && !user.branchId) {
      throw new ForbiddenException('access_denied: missing_branch_context');
    }

    const encounter = await this.prisma.encounter.findFirst({
      where: { id: encounterId, archivedAt: null },
    });

    if (!encounter) {
      throw new NotFoundException('encounter_not_found');
    }

    // Check route consistency
    if (encounter.tenantId !== tenantId) {
      throw new ForbiddenException('access_denied: tenant_isolation_violation');
    }
    if (encounter.patientId !== patientId) {
      throw new BadRequestException('validation_error: patient_id_mismatch');
    }

    // Verify branch scope matches encounter branch
    ClinicalScopePolicy.authorizeBranch(user, encounter.branchId);

    const note = await this.prisma.clinicalNote.findFirst({
      where: {
        encounterId: encounter.id,
        noteType: 'SOAP',
        deletedAt: null,
      },
    });

    if (!note) {
      return null;
    }

    const isSigned = note.lockedAt !== null;

    return {
      id: note.id,
      encounterId: note.encounterId,
      patientId,
      subjective: note.subjective || undefined,
      objective: note.objective || undefined,
      assessment: note.assessment || undefined,
      plan: note.plan || undefined,
      noteType: 'SOAP',
      status: isSigned ? 'SIGNED' : 'DRAFT',
      lockedAt: note.lockedAt || undefined,
      lockedBy: note.lockedBy || undefined,
      recordedAt: note.createdAt,
      timestamp: note.createdAt,
      recordedBy: note.authorId || user.userId!,
      accessLabel: isSigned ? 'Clinical SOAP Signed' : 'Clinical SOAP Draft',
      isReadOnly: true,
    };
  }

  async getParameterDefinitions(
    orderId: string,
    tenantId: string,
    branchId: string | undefined,
    user: RequestUser,
  ): Promise<LabParameterDefinitionDto[]> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);

    const allowedRoles = ['Lab Technician', 'Branch Admin', 'Super Admin'];
    const hasAllowedRole = user.roles?.some((role) =>
      allowedRoles.includes(role),
    );
    if (!hasAllowedRole) {
      throw new ForbiddenException('access_denied: unauthorized_role');
    }

    if (!user.roles?.includes('Super Admin') && !user.branchId) {
      throw new ForbiddenException('access_denied: missing_branch_context');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        clinicalItems: true,
      },
    });

    if (!order) {
      throw new NotFoundException('order_not_found');
    }

    if (order.tenantId !== tenantId) {
      throw new ForbiddenException('access_denied: tenant_isolation_violation');
    }

    ClinicalScopePolicy.authorizeBranch(user, order.branchId);

    if (order.orderType !== 'LAB') {
      throw new BadRequestException('validation_error: not_a_lab_order');
    }

    const clinicalItem = order.clinicalItems?.[0];

    // Strategy 1: Use stable LabTestDefinition linkage if available
    if (clinicalItem?.labTestDefinitionId) {
      const definition = await this.prisma.labTestDefinition.findFirst({
        where: {
          id: clinicalItem.labTestDefinitionId,
          tenantId,
          isActive: true,
        },
        include: {
          parameters: {
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
          },
        },
      });

      if (definition?.parameters?.length) {
        return definition.parameters.map((p) => ({
          parameterName: p.parameterName,
          code: p.code,
          unit: p.unit || undefined,
          referenceRangeText: p.referenceRangeText || undefined,
          minNormal: p.minNormal || undefined,
          maxNormal: p.maxNormal || undefined,
          minCritical: p.minCritical || undefined,
          maxCritical: p.maxCritical || undefined,
          valueType: p.valueType,
          allowedValues: p.allowedValues || undefined,
          isRequired: p.isRequired,
          displayOrder: p.displayOrder,
        }));
      }
      // Stable link exists but definition is inactive/missing — return empty (do not fallback to name matching for linked items)
      return [];
    }

    // Strategy 2: Legacy free-text name matching (carryover from Phase 14A)
    const panelName = clinicalItem?.itemName?.trim() || undefined;

    if (!panelName) {
      return [];
    }

    const definitions = await this.prisma.labTestDefinition.findMany({
      where: {
        tenantId,
        isActive: true,
        name: { equals: panelName, mode: 'insensitive' },
      },
      include: {
        parameters: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!definitions.length || !definitions[0].parameters.length) {
      return [];
    }

    return definitions[0].parameters.map((p) => ({
      parameterName: p.parameterName,
      code: p.code,
      unit: p.unit || undefined,
      referenceRangeText: p.referenceRangeText || undefined,
      minNormal: p.minNormal || undefined,
      maxNormal: p.maxNormal || undefined,
      minCritical: p.minCritical || undefined,
      maxCritical: p.maxCritical || undefined,
      valueType: p.valueType,
      allowedValues: p.allowedValues || undefined,
      isRequired: p.isRequired,
      displayOrder: p.displayOrder,
    }));
  }

  async getLabTestDefinitions(
    tenantId: string,
    user: RequestUser,
  ): Promise<LabTestDefinitionSummaryDto[]> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);

    const allowedRoles = [
      'Doctor',
      'Nurse',
      'Lab Technician',
      'Branch Admin',
      'Super Admin',
    ];
    const hasAllowedRole = user.roles?.some((role) =>
      allowedRoles.includes(role),
    );
    if (!hasAllowedRole) {
      throw new ForbiddenException('access_denied: unauthorized_role');
    }

    const definitions = await this.prisma.labTestDefinition.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    return definitions.map((def) => ({
      code: def.code,
      name: def.name,
      description: def.description || undefined,
      isActive: def.isActive,
      timestamp: def.updatedAt,
      accessLabel: 'Lab Test Catalog',
      isReadOnly: true,
    }));
  }
}
