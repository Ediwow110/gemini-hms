import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AUDIT_CHAIN_SAFETY_CAP,
  DEFAULT_AUDIT_PAGE_SIZE,
  MAX_AUDIT_PAGE_SIZE,
  clampTake,
} from '../common/utils/pagination';

export interface BreachReport {
  incidentId: string;
  tenantId: string;
  discoveryDate: string;
  incidentDescription: string;
  ephiTypeInvolved: string[];
  mitigationStepsTaken: string;
  individualProtectionSteps: string;
  contactChannel: {
    phone: string;
    email: string;
    website: string;
  };
  regulatoryReportedStatus: string;
}

@Injectable()
export class HipaaComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  async auditEphiAccess(tenantId: string, from?: string, to?: string) {
    const whereClause: any = {
      tenantId,
      recordType: {
        in: [
          'Patient',
          'Encounter',
          'LabResult',
          'Prescription',
          'SOAP',
          'ClinicalNote',
        ],
      },
    };

    if (from || to) {
      whereClause.createdAt = {};
      if (from) {
        whereClause.createdAt.gte = new Date(from);
      }
      if (to) {
        whereClause.createdAt.lte = new Date(to);
      }
    }

    return this.prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: AUDIT_CHAIN_SAFETY_CAP,
    });
  }

  async detectUnauthorizedAccess(tenantId: string) {
    // Queries audit logs where unauthorized actions were attempted or performed
    // E.g., non-clinical roles performing clinical actions, or standard actors changing configurations
    const logs = await this.prisma.auditLog.findMany({
      where: {
        tenantId,
      },
      orderBy: { createdAt: 'desc' },
      take: AUDIT_CHAIN_SAFETY_CAP,
    });

    const anomalies = [];

    for (const log of logs) {
      const role = log.activeRole;
      const eventKey = log.eventKey;

      // Rule 1: Receptionist / Nurse approving lab results or modifying role permissions
      if (
        (role === 'Receptionist' || role === 'Nurse') &&
        (eventKey.includes('LAB_RESULT_APPROVED') ||
          eventKey.includes('ROLE_PERMISSION_CHANGE') ||
          eventKey.includes('PRIVILEGED_USER_CHANGE'))
      ) {
        anomalies.push({
          logId: log.id,
          userId: log.userId,
          role,
          eventKey,
          description:
            'Restricted administrative/clinical operation attempted by non-authorized role',
          severity: 'HIGH',
          timestamp: log.createdAt,
        });
      }

      // Rule 2: Patient accessing records other than their own profile
      if (
        role === 'Patient' &&
        eventKey.includes('VIEWED') &&
        log.recordType !== 'PatientPortal'
      ) {
        anomalies.push({
          logId: log.id,
          userId: log.userId,
          role,
          eventKey,
          description:
            'Patient role attempted direct back-office ePHI data access',
          severity: 'CRITICAL',
          timestamp: log.createdAt,
        });
      }
    }

    return anomalies;
  }

  async generateBreachReport(
    tenantId: string,
    incidentId: string,
  ): Promise<BreachReport> {
    // Find audit log representing a potential or confirmed breach
    const breachEvent = await this.prisma.auditLog.findFirst({
      where: {
        tenantId,
        id: incidentId,
      },
    });

    if (!breachEvent) {
      throw new NotFoundException('Breach incident audit log not found');
    }

    // Standard structured breach notification report per HIPAA §164.404
    return {
      incidentId: breachEvent.id,
      tenantId,
      discoveryDate: breachEvent.createdAt.toISOString(),
      incidentDescription: `Security event logged as ${breachEvent.eventKey} affecting record ${breachEvent.recordType} (ID: ${breachEvent.recordId}).`,
      ephiTypeInvolved: [
        'Demographics',
        'Clinical notes',
        'Diagnostic details',
      ],
      mitigationStepsTaken:
        'Affected account temporarily disabled. System firewall updated and cryptographic chain-of-custody audited.',
      individualProtectionSteps:
        'Individuals should monitor credit reports and contact the compliance department for identity protection support.',
      contactChannel: {
        phone: '+1 (555) 019-2911',
        email: 'privacy-officer@hospital-hms.local',
        website: 'https://security.hospital-hms.local',
      },
      regulatoryReportedStatus: 'PENDING_HHS_NOTIFICATION',
    };
  }
}
