import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { InventoryService } from '../inventory/inventory.service';
import { DispensePrescriptionDto } from './dto/dispense-prescription.dto';
import {
  PharmacyPrescriptionQueueDto,
  DispenseResultDto,
} from './dto/pharmacy-queue.dto';
import { ClinicalScopePolicy } from '../clinical/clinical-workflow.policy';
import { PrescriptionStatus } from '@prisma/client';
import type { RequestUser } from '../common/types/authenticated-request.type';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  clampTake,
} from '../common/utils/pagination';

@Injectable()
export class PharmacyService {
  private readonly logger = new Logger(PharmacyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly inventoryService: InventoryService,
  ) {}

  async getDrugCatalog(
    tenantId: string,
    branchId: string | undefined,
    user: RequestUser,
  ) {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);

    const effectiveBranchId = user.roles?.includes('Super Admin')
      ? branchId
      : user.branchId;

    if (!effectiveBranchId) {
      throw new ForbiddenException('access_denied: missing_branch_context');
    }

    const items = await this.prisma.inventoryItem.findMany({
      where: {
        tenantId,
        category: 'DRUG',
        status: 'ACTIVE',
      },
      include: {
        branchStocks: {
          where: { branchId: effectiveBranchId },
        },
      },
      orderBy: { name: 'asc' },
    });

    return items.map((item) => ({
      id: item.id,
      name: item.name,
      sku: item.sku || item.id,
      type: item.category,
      quantity: item.branchStocks[0]?.quantity || 0,
      reorderLevel: item.branchStocks[0]?.reorderLevel || item.reorderLevel,
      unit: item.unit,
      currentStock: item.currentStock,
      price: item.price,
    }));
  }

  async getPrescriptionQueue(
    tenantId: string,
    branchId: string | undefined,
    user: RequestUser,
    status?: string,
  ): Promise<PharmacyPrescriptionQueueDto[]> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);

    const effectiveBranchId = user.roles?.includes('Super Admin')
      ? branchId
      : user.branchId;

    if (!effectiveBranchId) {
      throw new ForbiddenException('access_denied: missing_branch_context');
    }

    const where: any = {
      tenantId,
      branchId: effectiveBranchId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    const prescriptions = await this.prisma.prescription.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            patientNumber: true,
          },
        },
        prescribedBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_PAGE_SIZE,
    });

    return prescriptions.map((p) => ({
      id: p.id,
      encounterId: p.encounterId,
      patientId: p.patientId,
      patientName: `${p.patient.firstName} ${p.patient.lastName}`,
      patientNumber: p.patient.patientNumber,
      medicationName: p.medicationName,
      dosage: p.dosage,
      frequency: p.frequency,
      duration: p.duration,
      notes: p.notes || undefined,
      status: p.status,
      version: p.version,
      prescribedAt: p.createdAt,
      prescribedBy: p.prescribedById,
      prescribedByName: p.prescribedBy.email,
      timestamp: p.createdAt,
      accessLabel: 'Pharmacy Queue',
      isReadOnly: true,
    }));
  }

  async dispenseMedication(
    prescriptionId: string,
    tenantId: string,
    user: RequestUser,
    dto: DispensePrescriptionDto,
  ): Promise<DispenseResultDto> {
    ClinicalScopePolicy.authorizeTenant(user, tenantId);

    const allowedRoles = ['Pharmacist', 'Branch Admin', 'Super Admin'];
    const hasAllowedRole = user.roles?.some((role) =>
      allowedRoles.includes(role),
    );
    if (!hasAllowedRole) {
      throw new ForbiddenException('access_denied: unauthorized_role');
    }

    if (!user.branchId && !user.roles?.includes('Super Admin')) {
      throw new ForbiddenException('access_denied: missing_branch_context');
    }

    const prescription = await this.prisma.prescription.findFirst({
      where: { id: prescriptionId, tenantId },
    });

    if (!prescription) {
      throw new NotFoundException('prescription_not_found');
    }

    if (prescription.status !== PrescriptionStatus.ACTIVE) {
      throw new ConflictException(
        `prescription_status_invalid: Cannot dispense a ${prescription.status.toLowerCase()} prescription`,
      );
    }

    const effectiveBranchId = user.branchId || prescription.branchId;
    if (!effectiveBranchId) {
      throw new ForbiddenException('access_denied: missing_branch_context');
    }
    if (
      prescription.branchId !== effectiveBranchId &&
      !user.roles?.includes('Super Admin')
    ) {
      throw new ForbiddenException('access_denied: branch_isolation_violation');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.prescription.updateMany({
        where: {
          id: prescriptionId,
          version: dto.version,
          status: PrescriptionStatus.ACTIVE,
        },
        data: {
          status: PrescriptionStatus.DISPENSED,
          dispensedById: user.userId,
          dispensedAt: new Date(),
          version: { increment: 1 },
        },
      });

      if (updated.count === 0) {
        const existing = await tx.prescription.findUnique({
          where: { id: prescriptionId },
        });
        if (!existing) {
          throw new NotFoundException('prescription_not_found');
        }
        if (existing.status !== PrescriptionStatus.ACTIVE) {
          throw new ConflictException(
            `prescription_status_invalid: Already ${existing.status.toLowerCase()}`,
          );
        }
        throw new ConflictException(
          'version_conflict: Prescription was modified by another user',
        );
      }

      const stockResult = await this.inventoryService.dispenseItem(
        tenantId,
        effectiveBranchId,
        user.userId!,
        dto.inventoryItemId,
        dto.quantity,
        prescriptionId,
        tx,
      );

      await this.audit.log(
        {
          tenantId,
          userId: user.userId!,
          eventKey: 'PRESCRIPTION_DISPENSED',
          recordType: 'Prescription',
          recordId: prescriptionId,
          oldValues: {
            status: prescription.status,
            version: prescription.version,
          },
          newValues: {
            status: PrescriptionStatus.DISPENSED,
            version: prescription.version + 1,
            dispensedById: user.userId,
            dispensedAt: new Date(),
            inventoryItemId: dto.inventoryItemId,
            quantity: dto.quantity,
            newStock: stockResult.quantity,
          },
        },
        tx,
        effectiveBranchId,
      );

      const updatedPrescription = await tx.prescription.findUnique({
        where: { id: prescriptionId },
      });

      return {
        id: updatedPrescription!.id,
        status: updatedPrescription!.status,
        version: updatedPrescription!.version,
        dispensedById: updatedPrescription!.dispensedById || undefined,
        dispensedAt: updatedPrescription!.dispensedAt || undefined,
        medicationName: updatedPrescription!.medicationName,
        dosage: updatedPrescription!.dosage,
        inventoryItemId: dto.inventoryItemId,
        quantity: dto.quantity,
        timestamp: new Date(),
        accessLabel: 'Dispense Result',
        isReadOnly: true,
      };
    });
  }
}
