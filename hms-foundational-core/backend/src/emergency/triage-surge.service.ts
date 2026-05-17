import { SecurityException } from '../../middleware/tenant-isolation';
import { v4 as uuidv4 } from 'uuid';

export interface EmergencyBayDto {
  id: string;
  tenantId: string;
  bayName: string;
  isIsolationCapable: boolean;
  status: string;
}

export interface ErAdmitDto {
  patientId: string;
  tenantId: string;
  esiLevel: number;
  glasgowComaScale: number;
  requiresIsolation: boolean;
}

export interface TriageRecord {
  id: string;
  patientId: string;
  tenantId: string;
  bayId: string | null;
  esiLevel: number;
  glasgowComaScale: number;
  requiresIsolation: boolean;
  status: string;
}

export class TriageSurgeService {
  public emergencyBays = new Map<string, EmergencyBayDto>();
  public activeAdmissions = new Map<string, TriageRecord>();
  public facilityState = new Map<string, string>(); // Global ER tracker

  constructor() {
    this.emergencyBays.set('bay-standard-1', {
      id: 'bay-standard-1', tenantId: 'tenant-A', bayName: 'Bay 1 (Trauma)', isIsolationCapable: false, status: 'VACANT'
    });
    this.emergencyBays.set('bay-iso-1', {
      id: 'bay-iso-1', tenantId: 'tenant-A', bayName: 'Bay 4 (Negative Pressure Iso)', isIsolationCapable: true, status: 'VACANT'
    });
    this.emergencyBays.set('bay-tenant-B-1', {
      id: 'bay-tenant-B-1', tenantId: 'tenant-B', bayName: 'Bay 1', isIsolationCapable: true, status: 'VACANT'
    });
    
    this.facilityState.set('tenant-A', 'NOMINAL_OPERATIONS');
  }

  /**
   * Directly routes incoming high-acuity streams. Enforces physical isolation capabilities mapped 
   * against strict biological airborne vectors utilizing explicit boolean filters.
   */
  public async admitErPatient(patientData: ErAdmitDto, activeTenantId: string): Promise<TriageRecord> {
    if (patientData.tenantId !== activeTenantId) {
      throw new SecurityException('Cross-Tenant Ingress Blocked! ER Triage unauthorized.', 'IDOR_MISMATCH');
    }

    const availableBays = Array.from(this.emergencyBays.values()).filter(b => b.tenantId === activeTenantId && b.status === 'VACANT');
    
    let allocatedBayId: string | null = null;
    let initialStatus = 'ADMITTED';

    // Biological Isolation Gating Matrix 
    if (patientData.requiresIsolation) {
       const isoBays = availableBays.filter(b => b.isIsolationCapable);
       if (isoBays.length > 0) {
         allocatedBayId = isoBays[0].id;
       } else {
         initialStatus = 'PENDING_QUARANTINE_OVERFLOW';
       }
    } else {
       if (availableBays.length > 0) {
         allocatedBayId = availableBays[0].id;
       } else {
         initialStatus = 'PENDING_TRIAGE_OVERFLOW';
       }
    }

    if (allocatedBayId) {
      const targetBay = this.emergencyBays.get(allocatedBayId);
      if (targetBay) targetBay.status = 'OCCUPIED';
    }

    const newRecord: TriageRecord = {
      id: uuidv4(),
      patientId: patientData.patientId,
      tenantId: activeTenantId,
      bayId: allocatedBayId,
      esiLevel: patientData.esiLevel,
      glasgowComaScale: patientData.glasgowComaScale,
      requiresIsolation: patientData.requiresIsolation,
      status: initialStatus
    };

    this.activeAdmissions.set(newRecord.id, newRecord);
    return newRecord;
  }

  /**
   * Executes massive computational capacity logic utilizing tracking equations:
   * Surge Capacity Index (SCI) = sum(6 - ESI_i) / (B_active * (1 - rho_staff))
   */
  public async calculateSurgeSaturation(activeTenantId: string): Promise<string> {
    const tenantAdmissions = Array.from(this.activeAdmissions.values()).filter(a => a.tenantId === activeTenantId && a.status !== 'DISCHARGED');
    
    const B_active = Array.from(this.emergencyBays.values()).filter(b => b.tenantId === activeTenantId).length || 1;
    const rho_staff = 0.30;
    
    // Summation of exact ESI inversions across global hospital registry
    let esiSum = 0;
    for (const admission of tenantAdmissions) {
      esiSum += (6 - admission.esiLevel);
    }
    
    const denominator = B_active * (1 - rho_staff);
    const SCI = esiSum / denominator;

    let currentState = 'NOMINAL_OPERATIONS';
    
    // Explicit 1.5 Saturation Boundary 
    if (SCI > 1.5) {
      currentState = 'DIVERSION_PROTOCOL_ENGAGED';
      this.facilityState.set(activeTenantId, currentState);
    }

    return currentState;
  }
}
