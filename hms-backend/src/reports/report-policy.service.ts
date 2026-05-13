import { Injectable, BadRequestException } from '@nestjs/common';

export enum ReportRiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  PRIVILEGED = 'PRIVILEGED',
}

export interface FieldPolicy {
  riskLevel: ReportRiskLevel;
  sensitive: boolean;
  maskingRule?: 'REDACT' | 'PARTIAL' | 'NONE';
}

export interface ReportPolicyDefinition {
  reportType: string;
  defaultRiskLevel: ReportRiskLevel;
  fields: Record<string, FieldPolicy>;
}

@Injectable()
export class ReportPolicyService {
  private readonly policies: Record<string, ReportPolicyDefinition> = {
    CASHIER_REVERSAL_RECONCILIATION: {
      reportType: 'CASHIER_REVERSAL_RECONCILIATION',
      defaultRiskLevel: ReportRiskLevel.MEDIUM,
      fields: {
        id: { riskLevel: ReportRiskLevel.LOW, sensitive: false },
        tenantId: { riskLevel: ReportRiskLevel.LOW, sensitive: false },
        branchId: { riskLevel: ReportRiskLevel.LOW, sensitive: false },
        paymentId: { riskLevel: ReportRiskLevel.LOW, sensitive: false },
        invoiceId: { riskLevel: ReportRiskLevel.LOW, sensitive: false },
        approvalRequestId: { riskLevel: ReportRiskLevel.LOW, sensitive: false },
        amount: {
          riskLevel: ReportRiskLevel.HIGH,
          sensitive: true,
          maskingRule: 'NONE',
        },
        type: { riskLevel: ReportRiskLevel.LOW, sensitive: false },
        status: { riskLevel: ReportRiskLevel.LOW, sensitive: false },
        reason: { riskLevel: ReportRiskLevel.MEDIUM, sensitive: false },
        requestedBy: { riskLevel: ReportRiskLevel.MEDIUM, sensitive: false },
        approvedBy: { riskLevel: ReportRiskLevel.MEDIUM, sensitive: false },
        createdAt: { riskLevel: ReportRiskLevel.LOW, sensitive: false },
      },
    },
    AUDIT_EVENTS_SUMMARY: {
      reportType: 'AUDIT_EVENTS_SUMMARY',
      defaultRiskLevel: ReportRiskLevel.PRIVILEGED,
      fields: {
        id: { riskLevel: ReportRiskLevel.LOW, sensitive: false },
        tenantId: { riskLevel: ReportRiskLevel.LOW, sensitive: false },
        branchId: { riskLevel: ReportRiskLevel.LOW, sensitive: false },
        userId: { riskLevel: ReportRiskLevel.MEDIUM, sensitive: false },
        eventKey: { riskLevel: ReportRiskLevel.LOW, sensitive: false },
        recordType: { riskLevel: ReportRiskLevel.LOW, sensitive: false },
        recordId: { riskLevel: ReportRiskLevel.LOW, sensitive: false },
        oldValues: {
          riskLevel: ReportRiskLevel.PRIVILEGED,
          sensitive: true,
          maskingRule: 'NONE',
        },
        newValues: {
          riskLevel: ReportRiskLevel.PRIVILEGED,
          sensitive: true,
          maskingRule: 'NONE',
        },
        createdAt: { riskLevel: ReportRiskLevel.LOW, sensitive: false },
      },
    },
  };

  getPolicyForExport(reportType: string, requestedFields?: string[] | null) {
    const policy = this.policies[reportType];
    if (!policy) {
      throw new BadRequestException(
        `Unknown report type: ${reportType}. Fails closed.`,
      );
    }

    const availableFields = Object.keys(policy.fields);
    const fieldsToExport =
      requestedFields && requestedFields.length > 0
        ? requestedFields
        : availableFields;

    const allowedFields: string[] = [];
    const maskedFields: string[] = [];
    let computedRiskLevel = policy.defaultRiskLevel;

    for (const field of fieldsToExport) {
      const fieldPolicy = policy.fields[field];
      if (!fieldPolicy) {
        throw new BadRequestException(
          `Field '${field}' is not allowlisted for report '${reportType}'.`,
        );
      }

      allowedFields.push(field);

      if (fieldPolicy.maskingRule && fieldPolicy.maskingRule !== 'NONE') {
        maskedFields.push(field);
      }

      // Escalate risk based on fields requested
      computedRiskLevel = this.escalateRisk(
        computedRiskLevel,
        fieldPolicy.riskLevel,
      );
    }

    if (allowedFields.length === 0) {
      throw new BadRequestException('No valid fields requested for export.');
    }

    return {
      riskLevel: computedRiskLevel,
      allowedFields,
      maskedFields,
      fieldPolicySnapshot: policy.fields,
    };
  }

  private escalateRisk(
    currentRisk: ReportRiskLevel,
    newRisk: ReportRiskLevel,
  ): ReportRiskLevel {
    const hierarchy = [
      ReportRiskLevel.LOW,
      ReportRiskLevel.MEDIUM,
      ReportRiskLevel.HIGH,
      ReportRiskLevel.PRIVILEGED,
    ];

    const currentIndex = hierarchy.indexOf(currentRisk);
    const newIndex = hierarchy.indexOf(newRisk);

    return newIndex > currentIndex ? newRisk : currentRisk;
  }
}
