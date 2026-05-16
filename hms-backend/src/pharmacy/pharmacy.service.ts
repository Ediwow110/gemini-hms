import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { DispenseItemDto } from './dto/dispense-item.dto';
import { PrescriptionStatus, StockMovementType } from '@prisma/client';

@Injectable()
export class PharmacyService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createPrescription(
    tenantId: string,
    userId: string,
    dto: CreatePrescriptionDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Verify Patient & Encounter exist in tenant scope
      const patient = await tx.patient.findFirst({
        where: { id: dto.patientId, tenantId },
      });
      if (!patient) throw new NotFoundException('Patient not found');

      const encounter = await tx.encounter.findFirst({
        where: { id: dto.encounterId, tenantId, patientId: dto.patientId },
      });
      if (!encounter) throw new NotFoundException('Encounter not found');

      // 2. Create Prescription
      const prescription = await tx.prescription.create({
        data: {
          tenantId,
          branchId: dto.branchId,
          patientId: dto.patientId,
          encounterId: dto.encounterId,
          doctorId: userId,
          notes: dto.notes,
          status: PrescriptionStatus.ACTIVE,
          createdBy: userId,
          updatedBy: userId,
          items: {
            create: dto.items.map((item) => ({
              tenantId,
              branchId: dto.branchId,
              medicationId: item.medicationId,
              dosage: item.dosage,
              frequency: item.frequency,
              durationDays: item.durationDays,
              quantityPrescribed: item.quantityPrescribed,
              createdBy: userId,
              updatedBy: userId,
            })),
          },
        },
        include: { items: true },
      });

      // 3. Audit
      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'pharmacy.prescription.create',
          recordType: 'Prescription',
          recordId: prescription.id,
          newValues: prescription,
        },
        tx,
      );

      return prescription;
    });
  }

  async dispenseItem(
    tenantId: string,
    userId: string,
    itemId: string,
    dto: DispenseItemDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch Item with Medication and linked InventoryItem
      const item = await tx.prescriptionItem.findFirst({
        where: { id: itemId, tenantId },
        include: {
          medication: {
            include: { inventoryItem: true },
          },
        },
      });

      if (!item) throw new NotFoundException('Prescription item not found');

      // 2. Over-Dispense Guard (Golden Rule #1)
      if (dto.quantity + item.quantityDispensed > item.quantityPrescribed) {
        throw new ConflictException('over_dispense_not_allowed');
      }

      // 3. Inventory Integration (Golden Rule #2)
      const invItem = item.medication.inventoryItem;
      if (invItem) {
        // Verify stock in the branch
        if (invItem.totalQuantity < dto.quantity) {
          throw new ConflictException('insufficient_stock');
        }

        // Deduct stock via movement
        await tx.stockMovement.create({
          data: {
            tenantId,
            branchId: dto.branchId,
            inventoryItemId: invItem.id,
            movementType: StockMovementType.ISSUE,
            quantityChange: -dto.quantity,
            reason: `Dispensed for Prescription Item ${itemId}`,
            createdBy: userId,
            updatedBy: userId,
          },
        });

        // Update total quantity
        await tx.inventoryItem.update({
          where: { id: invItem.id },
          data: {
            totalQuantity: { decrement: dto.quantity },
            updatedBy: userId,
          },
        });
      }

      // 4. Create Dispense Log
      const dispenseLog = await tx.dispenseLog.create({
        data: {
          tenantId,
          branchId: dto.branchId,
          prescriptionItemId: itemId,
          pharmacistId: userId,
          quantityDispensed: dto.quantity,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // 5. Update Prescription Item
      const updatedItem = await tx.prescriptionItem.update({
        where: { id: itemId },
        data: {
          quantityDispensed: { increment: dto.quantity },
          updatedBy: userId,
        },
      });

      // 6. Check if Prescription is fully completed
      const allItems = await tx.prescriptionItem.findMany({
        where: { prescriptionId: item.prescriptionId },
      });
      const allDone = allItems.every((i) =>
        i.id === itemId
          ? i.quantityDispensed + dto.quantity >= i.quantityPrescribed
          : i.quantityDispensed >= i.quantityPrescribed,
      );

      if (allDone) {
        await tx.prescription.update({
          where: { id: item.prescriptionId },
          data: { status: PrescriptionStatus.COMPLETED },
        });
      }

      // 7. Transactional Audit
      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'pharmacy.medication.dispensed',
          recordType: 'PrescriptionItem',
          recordId: itemId,
          newValues: {
            dispenseLogId: dispenseLog.id,
            quantityDispensed: dto.quantity,
            totalDispensed: updatedItem.quantityDispensed,
          },
        },
        tx,
      );

      return dispenseLog;
    });
  }
}
