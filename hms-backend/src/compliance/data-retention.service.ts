import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const RETENTION_CLASSES = {
  FINANCIAL: {
    durationYears: 10,
    eventPrefixes: [
      'PAYMENT_',
      'REFUND_',
      'VOID_',
      'RECEIPT_',
      'SESSION_',
      'INVOICE_',
    ],
  },
  CLINICAL: {
    durationYears: 10,
    eventPrefixes: [
      'VITALS_',
      'SOAP_',
      'LAB_',
      'TRIAGE_',
      'ORDER_',
      'PRESCRIPTION_',
      'DIAGNOSIS_',
    ],
  },
  ADMINISTRATIVE: {
    durationYears: 3,
    eventPrefixes: ['ADMIN_', 'ROLE_', 'USER_', 'CATALOG_', 'MERGE_'],
  },
  SECURITY: {
    durationYears: 5,
    eventPrefixes: [
      'BREAK_GLASS_',
      'SENSITIVE_',
      'SECURITY_',
      'LOGIN_',
      'MFA_',
    ],
  },
  EXPORT: {
    durationYears: 1,
    eventPrefixes: ['EXPORTED', 'DOWNLOADED', 'REPORT_EXPORTED'],
  },
  TRANSIENT: {
    durationDays: 90,
    eventPrefixes: ['READ_ACCESS_'],
  },
};

@Injectable()
export class DataRetentionService {
  constructor(private readonly prisma: PrismaService) {}

  async enforceRetention() {
    const sixYearsAgo = new Date();
    sixYearsAgo.setFullYear(sixYearsAgo.getFullYear() - 6);

    const archiveReason = 'HIPAA 6-Year Retention Archival Policy';
    const now = new Date();

    const patients = await this.prisma.patient.updateMany({
      where: { createdAt: { lt: sixYearsAgo }, archivedAt: null },
      data: { archivedAt: now, archiveReason },
    });

    const encounters = await this.prisma.encounter.updateMany({
      where: { createdAt: { lt: sixYearsAgo }, archivedAt: null },
      data: { archivedAt: now, archiveReason },
    });

    const labResults = await this.prisma.labResult.updateMany({
      where: { createdAt: { lt: sixYearsAgo }, archivedAt: null },
      data: { archivedAt: now, archiveReason },
    });

    const invoices = await this.prisma.invoice.updateMany({
      where: { createdAt: { lt: sixYearsAgo }, archivedAt: null },
      data: { archivedAt: now, archiveReason },
    });

    const payments = await this.prisma.payment.updateMany({
      where: { createdAt: { lt: sixYearsAgo }, archivedAt: null },
      data: { archivedAt: now, archiveReason },
    });

    return {
      archivedPatientsCount: patients.count,
      archivedEncountersCount: encounters.count,
      archivedLabResultsCount: labResults.count,
      archivedInvoicesCount: invoices.count,
      archivedPaymentsCount: payments.count,
    };
  }

  async getAuditRetentionStatus() {
    const results: Record<string, { active: number; retentionYears: number }> =
      {};
    for (const [className, config] of Object.entries(RETENTION_CLASSES)) {
      const durationYears =
        'durationYears' in config
          ? config.durationYears
          : (config as any).durationDays / 365;
      const total = await this.prisma.auditLog.count({
        where: {
          OR: config.eventPrefixes.map((prefix) => ({
            eventKey: { startsWith: prefix },
          })),
        },
      });
      results[className.toLowerCase()] = {
        active: total,
        retentionYears: Math.ceil(durationYears),
      };
    }
    return results;
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
      auditStatus,
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
      this.getAuditRetentionStatus(),
    ]);

    return {
      patients: { active: activePatients, archived: archivedPatients },
      encounters: { active: activeEncounters, archived: archivedEncounters },
      labResults: { active: activeLabResults, archived: archivedLabResults },
      invoices: { active: activeInvoices, archived: archivedInvoices },
      payments: { active: activePayments, archived: archivedPayments },
      auditLogs: auditStatus,
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
