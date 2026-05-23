import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DataRetentionService {
  constructor(private readonly prisma: PrismaService) {}

  async enforceRetention() {
    const sixYearsAgo = new Date();
    sixYearsAgo.setFullYear(sixYearsAgo.getFullYear() - 6);

    const archiveReason = 'HIPAA 6-Year Retention Archival Policy';
    const now = new Date();

    // 1. Patient Archival
    const patients = await this.prisma.patient.updateMany({
      where: {
        createdAt: { lt: sixYearsAgo },
        archivedAt: null,
      },
      data: {
        archivedAt: now,
        archiveReason,
      },
    });

    // 2. Encounter Archival
    const encounters = await this.prisma.encounter.updateMany({
      where: {
        createdAt: { lt: sixYearsAgo },
        archivedAt: null,
      },
      data: {
        archivedAt: now,
        archiveReason,
      },
    });

    // 3. LabResult Archival
    const labResults = await this.prisma.labResult.updateMany({
      where: {
        createdAt: { lt: sixYearsAgo },
        archivedAt: null,
      },
      data: {
        archivedAt: now,
        archiveReason,
      },
    });

    // 4. Invoice Archival
    const invoices = await this.prisma.invoice.updateMany({
      where: {
        createdAt: { lt: sixYearsAgo },
        archivedAt: null,
      },
      data: {
        archivedAt: now,
        archiveReason,
      },
    });

    // 5. Payment Archival
    const payments = await this.prisma.payment.updateMany({
      where: {
        createdAt: { lt: sixYearsAgo },
        archivedAt: null,
      },
      data: {
        archivedAt: now,
        archiveReason,
      },
    });

    return {
      archivedPatientsCount: patients.count,
      archivedEncountersCount: encounters.count,
      archivedLabResultsCount: labResults.count,
      archivedInvoicesCount: invoices.count,
      archivedPaymentsCount: payments.count,
    };
  }

  async getRetentionStatus() {
    const [
      activePatients,
      archivedPatients,
      activeEncounters,
      archivedEncounters,
      activeLabResults,
      archivedLabResults,
      activeInvoices,
      archivedInvoices,
      activePayments,
      archivedPayments,
    ] = await Promise.all([
      this.prisma.patient.count({ where: { archivedAt: null } }),
      this.prisma.patient.count({ where: { NOT: { archivedAt: null } } }),
      this.prisma.encounter.count({ where: { archivedAt: null } }),
      this.prisma.encounter.count({ where: { NOT: { archivedAt: null } } }),
      this.prisma.labResult.count({ where: { archivedAt: null } }),
      this.prisma.labResult.count({ where: { NOT: { archivedAt: null } } }),
      this.prisma.invoice.count({ where: { archivedAt: null } }),
      this.prisma.invoice.count({ where: { NOT: { archivedAt: null } } }),
      this.prisma.payment.count({ where: { archivedAt: null } }),
      this.prisma.payment.count({ where: { NOT: { archivedAt: null } } }),
    ]);

    return {
      patients: { active: activePatients, archived: archivedPatients },
      encounters: { active: activeEncounters, archived: archivedEncounters },
      labResults: { active: activeLabResults, archived: archivedLabResults },
      invoices: { active: activeInvoices, archived: archivedInvoices },
      payments: { active: activePayments, archived: archivedPayments },
    };
  }

  async archiveRecord(entityType: string, recordId: string) {
    const archiveReason = 'Manual compliance-triggered data retention archival';
    const now = new Date();

    switch (entityType.toLowerCase()) {
      case 'patient': {
        const item = await this.prisma.patient.findUnique({
          where: { id: recordId },
        });
        if (!item) throw new NotFoundException('Patient record not found');
        return this.prisma.patient.update({
          where: { id: recordId },
          data: { archivedAt: now, archiveReason },
        });
      }
      case 'encounter': {
        const item = await this.prisma.encounter.findUnique({
          where: { id: recordId },
        });
        if (!item) throw new NotFoundException('Encounter record not found');
        return this.prisma.encounter.update({
          where: { id: recordId },
          data: { archivedAt: now, archiveReason },
        });
      }
      case 'labresult': {
        const item = await this.prisma.labResult.findUnique({
          where: { id: recordId },
        });
        if (!item) throw new NotFoundException('LabResult record not found');
        return this.prisma.labResult.update({
          where: { id: recordId },
          data: { archivedAt: now, archiveReason },
        });
      }
      case 'invoice': {
        const item = await this.prisma.invoice.findUnique({
          where: { id: recordId },
        });
        if (!item) throw new NotFoundException('Invoice record not found');
        return this.prisma.invoice.update({
          where: { id: recordId },
          data: { archivedAt: now, archiveReason },
        });
      }
      case 'payment': {
        const item = await this.prisma.payment.findUnique({
          where: { id: recordId },
        });
        if (!item) throw new NotFoundException('Payment record not found');
        return this.prisma.payment.update({
          where: { id: recordId },
          data: { archivedAt: now, archiveReason },
        });
      }
      default:
        throw new BadRequestException(
          `Archiving for entity type '${entityType}' is not supported`,
        );
    }
  }
}
