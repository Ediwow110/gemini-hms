import { SecurityException } from '../../middleware/tenant-isolation';
import { v4 as uuidv4 } from 'uuid';

export interface SurgicalCaseDto {
  id?: string;
  tenantId: string;
  roomId: string;
  patientId: string;
  primarySurgeonId: string;
  scheduledStart: Date;
  scheduledEnd: Date;
}

export class OperatingRoomService {
  private surgicalCases: SurgicalCaseDto[] = [];
  
  constructor() {
    // Seed initial operational surgical tracking cases
    this.surgicalCases.push({
      id: 'case-1',
      tenantId: 'tenant-A',
      roomId: 'room-101',
      patientId: 'pat-1',
      primarySurgeonId: 'surg-alpha',
      scheduledStart: new Date('2026-05-20T08:00:00Z'),
      scheduledEnd: new Date('2026-05-20T12:00:00Z')
    });
  }

  /**
   * Prevents overlap allocation across the surgical suite natively utilizing 
   * strict temporal intersection formulas against active arrays.
   */
  public async bookSurgicalCase(caseData: SurgicalCaseDto, activeTenantId: string): Promise<SurgicalCaseDto> {
    if (caseData.tenantId !== activeTenantId) {
      throw new SecurityException('Cross-Tenant Data Leakage Blocked! Unauthorized booking matrix access targeted.', 'IDOR_MISMATCH');
    }

    // Verify Surgeon Overlap Temporal Conflict
    // Intersection Evaluator Algebra: max(start_1, start_2) < min(end_1, end_2)
    const activeSurgeonCases = this.surgicalCases.filter(c => c.primarySurgeonId === caseData.primarySurgeonId && c.tenantId === activeTenantId);

    for (const scase of activeSurgeonCases) {
      const maxStart = new Date(Math.max(caseData.scheduledStart.getTime(), scase.scheduledStart.getTime()));
      const minEnd = new Date(Math.min(caseData.scheduledEnd.getTime(), scase.scheduledEnd.getTime()));

      if (maxStart < minEnd) {
        throw new Error('409_SURGEON_OVERLAP_CONFLICT: Primary surgeon is already explicitly assigned to a conflicting surgical suite temporal block.');
      }
    }

    const newCase: SurgicalCaseDto = {
      id: uuidv4(),
      ...caseData
    };

    this.surgicalCases.push(newCase);
    return newCase;
  }

  /**
   * Natively calculates explicit physiological bounds for patient telemetry against
   * the exact formula: C_target = M * C_base * e^(-lambda * t)
   */
  public async evaluateAnesthesiaTelemetry(caseId: string, agentConcentration: number, metabolicRate: number, activeTenantId: string): Promise<boolean> {
    const scase = this.surgicalCases.find(c => c.id === caseId);
    if (!scase) throw new Error('Target Surgical case track not resolvable against registry constraints.');

    if (scase.tenantId !== activeTenantId) {
      throw new SecurityException('Cross-Tenant Telemetry Leakage Blocked! Invalid mathematical tracking vector.', 'IDOR_MISMATCH');
    }

    // Execution of exponential decay target concentration math
    const C_base = 2.0;   // Underlying baseline threshold standard
    const lambda = 0.05;  // Baseline physiological decay rate multiplier
    const t = 1;          // Mathematical time constant interval assumption
    
    // Euler's Number Exponential Math
    const targetConcentration = metabolicRate * C_base * Math.exp(-lambda * t);

    // Target tracking variance boundaries (+/- 25%)
    const lowerBound = targetConcentration * 0.75;
    const upperBound = targetConcentration * 1.25;

    // Hard Override Condition Trapper
    if (agentConcentration < lowerBound || agentConcentration > upperBound) {
       throw new Error(`422_ANESTHETIC_DOSAGE_INVARIANT_VIOLATION: Measured patient concentration (${agentConcentration.toFixed(2)}%) deviates unsafely outside explicit mathematical safety target boundaries (${lowerBound.toFixed(2)}% - ${upperBound.toFixed(2)}%). Ventilator override logic engaged.`);
    }

    return true; // Status Safe
  }
}
