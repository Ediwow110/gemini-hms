export class ClinicalWorkQueueDto {
  id: string;
  patientId: string;
  patientName: string;
  patientNumber: string;
  queueNumber: string;
  category: string; // REGULAR, PRIORITY, EMERGENCY
  serviceType: string; // RECEPTION, CASHIER, LABORATORY, DOCTOR
  status: string; // WAITING, CALLING, SERVING, COMPLETED, CANCELLED
  waitTimeMinutes: number;
  timestamp: Date;
  branchId: string;
  tenantId: string;
  accessLabel: string = 'Workflow';
  isReadOnly: boolean = true;
}

export class PatientClinicalSummaryDto {
  id: string; // Matches patientId
  patientId: string;
  patientName: string;
  patientNumber: string;
  dob: Date;
  gender?: string;
  recentEncounters: number;
  activePrescriptions: number;
  pendingLabResults: number;
  bloodType?: string;
  allergies?: string[];
  status: string = 'ACTIVE';
  timestamp: Date = new Date();
  accessLabel: string = 'Clinical Summary';
  isReadOnly: boolean = true;
}

export class EncounterSummaryDto {
  id: string;
  patientId: string;
  doctorId?: string;
  doctorName?: string;
  encounteredAt: Date;
  timestamp: Date; // For metadata consistency
  type: string;
  status: string;
  chiefComplaint: string;
  diagnosis?: string;
  hasNotes: boolean;
  branchId: string;
  tenantId: string;
  accessLabel: string; // Clinical, Internal, etc.
  isReadOnly: boolean = true;
}

export class VitalsSummaryDto {
  id: string;
  encounterId: string;
  patientId: string;
  temperature?: number;
  systolicBp?: number;
  diastolicBp?: number;
  heartRate?: number;
  respiratoryRate?: number;
  weightKg?: number;
  recordedAt: Date;
  timestamp: Date;
  status: string = 'RECORDED';
  recordedBy?: string;
  accessLabel: string = 'Clinical Vitals';
  isReadOnly: boolean = true;
}

export class ClinicalOrderItemSummaryDto {
  id: string;
  itemName: string;
  notes: string | null;
  status: string;
  createdAt: Date;
}

export class ClinicalOrderSummaryDto {
  id: string;
  orderNumber: string;
  patientId: string;
  status: string;
  itemCount: number;
  items: ClinicalOrderItemSummaryDto[];
  orderType: string; // LAB, PHARMACY, SERVICE
  cancelledReason?: string;
  cancelledById?: string;
  cancelledAt?: Date;
  createdAt: Date;
  timestamp: Date;
  accessLabel: string = 'Order';
  isReadOnly: boolean = true;
}

export class LabResultSummaryDto {
  id: string;
  orderId: string;
  orderNumber: string;
  patientId: string;
  status: string; // PENDING_COLLECTION, IN_PROGRESS, PARTIAL, COMPLETED, RELEASED
  isReleased: boolean;
  releasedAt?: Date;
  timestamp: Date;
  approvedBy?: string;
  accessLabel: string; // Internal, Released
  isReadOnly: boolean = true;
}

export class PrescriptionSummaryDto {
  id: string;
  encounterId: string;
  patientId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  status: string;
  prescribedAt: Date;
  timestamp: Date;
  prescribedBy: string;
  accessLabel: string = 'Clinical Prescription';
  isReadOnly: boolean = true;
}

export class BillingHandoffSummaryDto {
  id: string;
  orderId: string;
  orderNumber: string;
  patientId: string;
  totalAmount: number;
  status: string; // UNPAID, PARTIAL, PAID
  createdAt: Date;
  timestamp: Date;
  accessLabel: string = 'Billing Handoff';
  isReadOnly: boolean = true;
}

export class ClinicalDashboardSummaryDto {
  branchId: string;
  activePatients: number;
  pendingTriage: number;
  waitingForDoctor: number;
  pendingLabResults: number;
  completedEncountersToday: number;
  timestamp: Date = new Date();
  accessLabel: string = 'Operational Dashboard';
  isReadOnly: boolean = true;
}

export class TriageSummaryDto {
  id: string;
  patientId: string;
  encounterId?: string;
  queueEntryId?: string;
  acuityLevel?: string;
  chiefComplaintSummary?: string;
  arrivalMode?: string;
  painScore?: number;
  infectiousRiskFlag: boolean;
  fallRiskFlag: boolean;
  pregnancyFlag: boolean;
  notes?: string;
  status: string; // ACTIVE, ENTERED_IN_ERROR
  recordedAt: Date;
  timestamp: Date;
  recordedBy: string;
  accessLabel: string = 'Clinical Triage';
  isReadOnly: boolean = true;
}

export class LabSpecimenSummaryDto {
  id: string;
  orderId: string;
  specimenType: string;
  accessionNumber?: string;
  collectionMode: string;
  collectedAt?: Date;
  receivedAt: Date;
  receivedById: string;
  status: string;
  createdAt: Date;
  timestamp: Date;
  accessLabel: string = 'Lab Specimen';
  isReadOnly: boolean = true;
}

export class LabResultDraftSummaryDto {
  id: string;
  orderId: string;
  status: string;
  version: number;
  results?: Record<string, any>;
  remarks?: string;
  encodedById?: string;
  encodedAt?: Date;
  validatedById?: string;
  validatedAt?: Date;
  lastEditedById?: string;
  lastEditedAt?: Date;
  createdAt: Date;
  timestamp: Date;
  accessLabel: string = 'Lab Result Draft';
  isReadOnly: boolean = true;
}

export class ValidatedResultSummaryDto {
  id: string;
  orderId: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  patientNumber: string;
  specimenId: string;
  specimenType: string;
  accessionNumber?: string;
  panelName?: string;
  validatedAt: Date;
  validatedById?: string;
  version: number;
  status: string = 'VALIDATED';
  timestamp: Date;
  accessLabel: string = 'Validated — Pending Release';
  isReadOnly: boolean = true;
}

export class LabValidationSummaryDto {
  id: string;
  orderId: string;
  status: string;
  version: number;
  results?: Record<string, any>;
  remarks?: string;
  encodedById?: string;
  encodedAt?: Date;
  validatedById?: string;
  validatedAt?: Date;
  createdAt: Date;
  timestamp: Date;
  accessLabel: string = 'Lab Validation';
  isReadOnly: boolean = true;
}

export class ReleasedResultSummaryDto {
  id: string;
  orderId: string;
  status: string;
  version: number;
  results?: Record<string, any>;
  remarks?: string;
  validatedById?: string;
  validatedAt?: Date;
  releasedById?: string;
  releasedAt?: Date;
  createdAt: Date;
  timestamp: Date;
  accessLabel: string = 'Released — For Clinical Visibility';
  isReadOnly: boolean = true;
}

export class ReleasedResultQueueDto {
  id: string;
  orderId: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  patientNumber: string;
  specimenId: string;
  specimenType: string;
  accessionNumber?: string;
  panelName?: string;
  validatedAt: Date;
  validatedById?: string;
  releasedAt: Date;
  releasedById?: string;
  version: number;
  status: string = 'RELEASED';
  timestamp: Date;
  accessLabel: string = 'Released — For Clinical Visibility';
  isReadOnly: boolean = true;
}

export class LabResultDraftContextDto {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  orderPriority?: string;
  patientId: string;
  patientName: string;
  patientNumber: string;
  dob: Date;
  panelName?: string;
  testItems: ClinicalOrderItemSummaryDto[];
  specimenId: string;
  specimenType: string;
  accessionNumber?: string;
  collectionMode: string;
  receivedAt: Date;
  draftResultId?: string;
  draftStatus?: string;
  draftVersion?: number;
  draftResults?: Record<string, any>;
  draftRemarks?: string;
  draftLastEditedById?: string;
  draftLastEditedAt?: Date;
  requestedById?: string;
  requestedAt?: Date;
  encounterId?: string;
  priority?: string;
  timestamp: Date;
  accessLabel: string = 'Lab Draft Encoding Context';
  isReadOnly: boolean = true;
}

export class SoapDraftSummaryDto {
  id: string;
  encounterId: string;
  patientId: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  noteType: string = 'SOAP';
  status: string = 'DRAFT';
  lockedAt?: Date;
  lockedBy?: string;
  recordedAt: Date;
  timestamp: Date;
  recordedBy: string;
  accessLabel: string = 'Clinical SOAP Draft';
  isReadOnly: boolean = true;
}

export class LabTestDefinitionSummaryDto {
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  timestamp: Date;
  accessLabel: string = 'Lab Test Catalog';
  isReadOnly: boolean = true;
}
