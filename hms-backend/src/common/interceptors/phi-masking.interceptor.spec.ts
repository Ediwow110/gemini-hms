import { ExecutionContext, CallHandler } from '@nestjs/common';
import { PhiMaskingInterceptor } from './phi-masking.interceptor';
import { of } from 'rxjs';

describe('PhiMaskingInterceptor', () => {
  let interceptor: PhiMaskingInterceptor;

  beforeEach(() => {
    interceptor = new PhiMaskingInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  const mockExecutionContext = (
    userRoles: string[] | undefined = undefined,
  ) => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: userRoles ? { roles: userRoles } : undefined,
        }),
      }),
    } as ExecutionContext;
  };

  const mockCallHandler = (data: any) => {
    return {
      handle: () => of(data),
    } as CallHandler;
  };

  describe('when user has clinical bypass', () => {
    it('should not mask data for Doctor', (done) => {
      const data = { notes: 'Sensitive note', diagnosisId: '123' };
      interceptor
        .intercept(mockExecutionContext(['Doctor']), mockCallHandler(data))
        .subscribe({
          next: (val) => {
            expect(val.notes).toBe('Sensitive note');
            expect(val.diagnosisId).toBe('123');
            done();
          },
        });
    });

    it('should not mask data for Super Admin', (done) => {
      const data = { notes: 'Sensitive note', patientId: '123' };
      interceptor
        .intercept(mockExecutionContext(['Super Admin']), mockCallHandler(data))
        .subscribe({
          next: (val) => {
            expect(val.notes).toBe('Sensitive note');
            done();
          },
        });
    });
  });

  describe('when user lacks clinical bypass', () => {
    it('should mask actual PHI fields', (done) => {
      const data = {
        notes: 'Sensitive note',
        clinicalNotes: 'Another note',
        diagnosis: 'Flu',
        diagnoses: 'Flu, Cold',
        chiefComplaint: 'Headache',
        historyOfPresentIllness: 'Started yesterday',
        assessment: 'Patient is stable',
        plan: 'Rest',
        remarks: 'Follow up in 2 days',
        resultValues: 'WBC high',
        description: 'Detailed view',
        patientName: 'John Doe',
        phone: '1234567890',
        email: 'john@example.com',
        address: '123 Main St',
      };

      interceptor
        .intercept(
          mockExecutionContext(['Receptionist']),
          mockCallHandler(data),
        )
        .subscribe({
          next: (val) => {
            expect(val.notes).toBe('RESTRICTED PHI');
            expect(val.clinicalNotes).toBe('RESTRICTED PHI');
            expect(val.diagnosis).toBe('RESTRICTED PHI');
            expect(val.diagnoses).toBe('RESTRICTED PHI');
            expect(val.chiefComplaint).toBe('RESTRICTED PHI');
            expect(val.historyOfPresentIllness).toBe('RESTRICTED PHI');
            expect(val.assessment).toBe('RESTRICTED PHI');
            expect(val.plan).toBe('RESTRICTED PHI');
            expect(val.remarks).toBe('RESTRICTED PHI');
            expect(val.resultValues).toBe('RESTRICTED PHI');
            expect(val.description).toBe('RESTRICTED PHI');
            expect(val.patientName).toBe('CONFIDENTIAL - RESTRICTED ACCESS');
            expect(val.email).toBe('CONFIDENTIAL - RESTRICTED ACCESS');
            expect(val.address).toBe('CONFIDENTIAL - RESTRICTED ACCESS');
            expect(val.phone).toBe('1234****890');
            done();
          },
        });
    });

    it('should correctly mask DOB', (done) => {
      const data = {
        dateOfBirth: '1990-05-15T00:00:00Z',
      };

      interceptor
        .intercept(mockExecutionContext([]), mockCallHandler(data))
        .subscribe({
          next: (val) => {
            expect(val.dateOfBirth).toBe('1990-01-01');
            done();
          },
        });
    });

    it('should NOT mask identifier, code, and metadata fields', (done) => {
      const data = {
        id: 'record-123',
        diagnosisId: 'diag-456',
        diagnosisCode: 'ICD-10-J00',
        noteId: 'note-789',
        clinicalNoteId: 'c-note-01',
        patientId: 'pat-111',
        orderId: 'ord-222',
        encounterId: 'enc-333',
        tenantId: 'tenant-abc',
        branchId: 'branch-xyz',
        status: 'ACTIVE',
        version: '1.0',
        type: 'OUTPATIENT',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-02T00:00:00.000Z',
      };

      interceptor
        .intercept(mockExecutionContext([]), mockCallHandler(data))
        .subscribe({
          next: (val) => {
            // All should remain unmasked
            expect(val.id).toBe('record-123');
            expect(val.diagnosisId).toBe('diag-456');
            expect(val.diagnosisCode).toBe('ICD-10-J00');
            expect(val.noteId).toBe('note-789');
            expect(val.clinicalNoteId).toBe('c-note-01');
            expect(val.patientId).toBe('pat-111');
            expect(val.orderId).toBe('ord-222');
            expect(val.encounterId).toBe('enc-333');
            expect(val.tenantId).toBe('tenant-abc');
            expect(val.branchId).toBe('branch-xyz');
            expect(val.status).toBe('ACTIVE');
            expect(val.version).toBe('1.0');
            expect(val.type).toBe('OUTPATIENT');
            expect(val.createdAt).toBe('2023-01-01T00:00:00.000Z');
            expect(val.updatedAt).toBe('2023-01-02T00:00:00.000Z');
            done();
          },
        });
    });

    it('should recursively mask nested objects and arrays', (done) => {
      const data = {
        patientId: '123',
        nested: {
          diagnosisId: 'd-1',
          notes: 'Nested note',
          array: [
            {
              email: 'test@example.com',
              id: 'item-1',
            },
            {
              chiefComplaint: 'Cough',
              status: 'PENDING',
            },
          ],
        },
      };

      interceptor
        .intercept(mockExecutionContext(), mockCallHandler(data))
        .subscribe({
          next: (val) => {
            expect(val.patientId).toBe('123');
            expect(val.nested.diagnosisId).toBe('d-1');
            expect(val.nested.notes).toBe('RESTRICTED PHI');
            expect(val.nested.array[0].email).toBe(
              'CONFIDENTIAL - RESTRICTED ACCESS',
            );
            expect(val.nested.array[0].id).toBe('item-1');
            expect(val.nested.array[1].chiefComplaint).toBe('RESTRICTED PHI');
            expect(val.nested.array[1].status).toBe('PENDING');
            done();
          },
        });
    });

    it('should correctly handle nulls, undefined, and non-object values', (done) => {
      interceptor
        .intercept(mockExecutionContext(), mockCallHandler(null))
        .subscribe({
          next: (val) => {
            expect(val).toBeNull();
          },
        });

      interceptor
        .intercept(mockExecutionContext(), mockCallHandler(123))
        .subscribe({
          next: (val) => {
            expect(val).toBe(123);
            done();
          },
        });
    });
  });
});
