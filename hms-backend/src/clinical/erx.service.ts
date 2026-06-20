import {
  Injectable,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface DrugInteractionWarning {
  drugs: string[];
  severity: 'CONTRAINDICATED' | 'MAJOR' | 'MODERATE' | 'NONE';
  explanation: string;
}

@Injectable()
export class ErxService {
  constructor(private readonly prisma: PrismaService) {}

  async screenDrugInteractions(
    _tenantId: string,
    _patientId: string,
    medications: string[],
  ): Promise<DrugInteractionWarning[]> {
    const warnings: DrugInteractionWarning[] = [];
    const medsLower = medications.map((m) => m.toLowerCase());

    // 1. Sildenafil + Nitroglycerin
    if (
      medsLower.some((m) => m.includes('sildenafil') || m.includes('viagra')) &&
      medsLower.some((m) => m.includes('nitroglycerin') || m.includes('nitro'))
    ) {
      warnings.push({
        drugs: ['Sildenafil', 'Nitroglycerin'],
        severity: 'CONTRAINDICATED',
        explanation:
          'Co-administration can cause severe, life-threatening hypotension.',
      });
    }

    // 2. Warfarin + Aspirin
    if (
      medsLower.some((m) => m.includes('warfarin') || m.includes('coumadin')) &&
      medsLower.some((m) => m.includes('aspirin'))
    ) {
      warnings.push({
        drugs: ['Warfarin', 'Aspirin'],
        severity: 'MAJOR',
        explanation:
          'Co-administration significantly increases the risk of serious gastrointestinal bleeding.',
      });
    }

    return warnings;
  }

  /**
   * Transmit a prescription to an external pharmacy network (e.g. Surescripts).
   *
   * This is an honest, gated stub. The full Surescripts / NCPDP integration is
   * not yet implemented in this release. Callers receive a 501-equivalent
   * error so the production API never reports a fake TRANSMITTED status that
   * a downstream pharmacy would never actually receive.
   */
  async transmitPrescription(
    tenantId: string,
    prescriptionId: string,
  ): Promise<never> {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: { patient: true },
    });

    if (!prescription || prescription.tenantId !== tenantId) {
      throw new NotFoundException('Prescription not found');
    }

    throw new NotImplementedException(
      'External e-prescription transmission (Surescripts / NCPDP) is not yet ' +
        'implemented in this release. The prescription record exists, but no ' +
        'pharmacy network has received it. Do not surface a TRANSMITTED status ' +
        'to clinical staff until the real provider integration is wired.',
    );
  }

  /**
   * Track the status of a previously transmitted prescription.
   *
   * This is an honest, gated stub. The full Surescripts state-machine
   * integration is not yet implemented in this release. Callers receive a
   * 501-equivalent error rather than a fabricated TRANSMITTED / RECEIVED /
   * DISPENSED status.
   */
  async getTransmissionStatus(
    _tenantId: string,
    _transmissionId: string,
  ): Promise<never> {
    throw new NotImplementedException(
      'External e-prescription transmission status (Surescripts / NCPDP) is ' +
        'not yet implemented in this release. No transmission records can be ' +
        'queried until the real provider integration is wired.',
    );
  }
}
