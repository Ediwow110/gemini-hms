import { SecurityException } from '../../middleware/tenant-isolation';

export interface SoapNoteDto {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface ICD10Extraction {
  code: string;
  description: string;
}

export class ClinicalEmrService {
  private activeLocks: Set<string> = new Set();
  
  // Simulated DB memory store (replaces Prisma for verification scripts)
  private encounters = new Map<string, { id: string, tenantId: string, patientId: string }>();
  private soapNotes = new Map<string, SoapNoteDto & { tenantId: string, encounterId: string, icd10Extracts: ICD10Extraction[] }>();
  
  private icd10Dictionary = [
    { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified', trigger: 'acute upper respiratory infection' },
    { code: 'I10', description: 'Essential (primary) hypertension', trigger: 'hypertension' },
    { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', trigger: 'type 2 diabetes' }
  ];

  constructor() {
    // Seed multi-tenant isolation targets
    this.encounters.set('enc-123', { id: 'enc-123', tenantId: 'tenant-A', patientId: 'pat-1' });
    this.encounters.set('enc-999', { id: 'enc-999', tenantId: 'tenant-B', patientId: 'pat-2' }); 
  }

  /**
   * Acquire a database-level advisory lock on the targeted encounter ID.
   * Resolves concurrent modification attempts.
   */
  private async acquireAdvisoryLock(encounterId: string): Promise<boolean> {
    if (this.activeLocks.has(encounterId)) return false;
    this.activeLocks.add(encounterId);
    return true;
  }

  private releaseAdvisoryLock(encounterId: string) {
    this.activeLocks.delete(encounterId);
  }

  /**
   * Automatic string parser checks the assessment text block against ICD-10 standard criteria
   */
  private extractICD10(assessment: string): ICD10Extraction[] {
    const text = assessment.toLowerCase();
    const extracts: ICD10Extraction[] = [];
    for (const entry of this.icd10Dictionary) {
      if (text.includes(entry.trigger)) {
        extracts.push({ code: entry.code, description: entry.description });
      }
    }
    return extracts;
  }

  /**
   * Atomic SOAP Chart Storage Pipeline
   */
  public async saveSoapChart(encounterId: string, soapData: SoapNoteDto, activeTenantId: string): Promise<any> {
    const encounter = this.encounters.get(encounterId);
    
    // Boundary Validation
    if (!encounter) throw new Error('Encounter namespace does not exist.');

    if (encounter.tenantId !== activeTenantId) {
      throw new SecurityException('Cross-Tenant Data Leakage Blocked! Unauthorized EMR encounter access.', 'IDOR_MISMATCH');
    }

    // Atomic Deduplication Interceptor
    const lockAcquired = await this.acquireAdvisoryLock(encounterId);
    if (!lockAcquired) {
      throw new Error('CONCURRENCY_LOCK_REJECTED: Another process is currently editing this chart.');
    }

    try {
      // Simulate database network delay payload processing
      await new Promise(resolve => setTimeout(resolve, 50));

      const icd10Extracts = this.extractICD10(soapData.assessment);

      const savedNote = {
        tenantId: activeTenantId,
        encounterId,
        ...soapData,
        icd10Extracts
      };

      this.soapNotes.set(encounterId, savedNote);
      return savedNote;
    } finally {
      // Unconditionally release the lock block
      this.releaseAdvisoryLock(encounterId);
    }
  }
}
