import { Test, TestingModule } from '@nestjs/testing';
import { ClinicalWorkflowController } from '../clinical-workflow.controller';
import { ClinicalWorkflowService } from '../clinical-workflow.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestUser } from '../../common/types/authenticated-request.type';
import { Reflector } from '@nestjs/core';

describe('ClinicalWorkflow (Read-Only Contract)', () => {
  let controller: ClinicalWorkflowController;
  let service: ClinicalWorkflowService;

  const mockUser: RequestUser = {
    userId: 'doc-1',
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    roles: ['Doctor'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClinicalWorkflowController],
      providers: [
        {
          provide: ClinicalWorkflowService,
          useValue: {
            getWorkQueue: jest.fn(),
            getPatientSummary: jest.fn(),
            getEncounters: jest.fn(),
            getVitals: jest.fn(),
            getOrders: jest.fn(),
            getLabResults: jest.fn(),
            getPrescriptions: jest.fn(),
            getBillingHandoff: jest.fn(),
            getDashboardSummary: jest.fn(),
            getLabDraftEncodingContext: jest.fn(),
            getValidatedResults: jest.fn(),
            saveVitals: jest.fn(),
            markVitalsEnteredInError: jest.fn(),
            saveTriage: jest.fn(),
            getTriage: jest.fn(),
            markTriageEnteredInError: jest.fn(),
            saveDraftSOAP: jest.fn(),
            getDraftSOAP: jest.fn(),
            signSOAP: jest.fn(),
            createClinicalOrder: jest.fn(),
            cancelClinicalOrder: jest.fn(),
            receiveLabOrder: jest.fn(),
            saveDraftLabResult: jest.fn(),
            validateLabResult: jest.fn(),
            releaseLabResult: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<ClinicalWorkflowController>(
      ClinicalWorkflowController,
    );
    service = module.get<ClinicalWorkflowService>(ClinicalWorkflowService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Read-Only Enforcement', () => {
    it('all read-only endpoints must use GET, and saveVitals is the only intentional mutation (POST)', () => {
      const proto = ClinicalWorkflowController.prototype;
      const methods = Object.getOwnPropertyNames(proto).filter(
        (m) => m !== 'constructor',
      );

      const reflector = new Reflector();

      methods.forEach((methodName) => {
        const method = proto[methodName as keyof typeof proto];
        const httpMethod = reflector.get('method', method);

        // saveVitals, markVitalsEnteredInError, saveTriage, markTriageEnteredInError, saveDraftSOAP, signSOAP, createClinicalOrder, cancelClinicalOrder, and receiveLabOrder are intentional mutation endpoints (POST = 1)
        if (
          methodName === 'saveVitals' ||
          methodName === 'markVitalsEnteredInError' ||
          methodName === 'saveTriage' ||
          methodName === 'markTriageEnteredInError' ||
          methodName === 'saveDraftSOAP' ||
          methodName === 'signSOAP' ||
          methodName === 'createClinicalOrder' ||
          methodName === 'cancelClinicalOrder' ||
          methodName === 'receiveLabOrder' ||
          methodName === 'saveDraftLabResult' ||
          methodName === 'validateLabResult' ||
          methodName === 'releaseLabResult'
        ) {
          expect(httpMethod).toBe(1);
          return;
        }

        // HTTP method 0 = GET in NestJS
        // 1 = POST, 2 = PUT, 3 = DELETE, 4 = PATCH
        expect(httpMethod).toBe(0);
      });
    });
  });

  describe('Endpoint Contract Verification', () => {
    it('getWorkQueue should call service with correct params', async () => {
      await controller.getWorkQueue(mockUser, 'branch-1');
      expect(service['getWorkQueue']).toHaveBeenCalledWith(
        mockUser.tenantId,
        'branch-1',
        mockUser,
      );
    });

    it('getPatientSummary should call service', async () => {
      await controller.getPatientSummary('pat-1', mockUser);
      expect(service['getPatientSummary']).toHaveBeenCalledWith(
        'pat-1',
        mockUser.tenantId,
        mockUser,
      );
    });

    it('getEncounters should call service', async () => {
      await controller.getEncounters('pat-1', mockUser);
      expect(service['getEncounters']).toHaveBeenCalledWith(
        'pat-1',
        mockUser.tenantId,
        mockUser,
      );
    });

    it('getVitals should call service', async () => {
      await controller.getVitals('pat-1', mockUser);
      expect(service['getVitals']).toHaveBeenCalledWith(
        'pat-1',
        mockUser.tenantId,
        mockUser,
      );
    });

    it('getOrders should call service', async () => {
      await controller.getOrders('pat-1', mockUser);
      expect(service['getOrders']).toHaveBeenCalledWith(
        'pat-1',
        mockUser.tenantId,
        mockUser,
      );
    });

    it('getLabResults should call service', async () => {
      await controller.getLabResults('pat-1', mockUser);
      expect(service['getLabResults']).toHaveBeenCalledWith(
        'pat-1',
        mockUser.tenantId,
        mockUser,
      );
    });

    it('getPrescriptions should call service', async () => {
      await controller.getPrescriptions('pat-1', mockUser);
      expect(service['getPrescriptions']).toHaveBeenCalledWith(
        'pat-1',
        mockUser.tenantId,
        mockUser,
      );
    });

    it('getBillingHandoff should call service', async () => {
      await controller.getBillingHandoff('pat-1', mockUser);
      expect(service['getBillingHandoff']).toHaveBeenCalledWith(
        'pat-1',
        mockUser.tenantId,
        mockUser,
      );
    });

    it('getDashboardSummary should call service', async () => {
      await controller.getDashboardSummary(mockUser, 'branch-1');
      expect(service['getDashboardSummary']).toHaveBeenCalledWith(
        mockUser.tenantId,
        'branch-1',
        mockUser,
      );
    });

    it('signSOAP should call service', async () => {
      await controller.signSOAP('pat-1', 'enc-1', mockUser);
      expect(service['signSOAP']).toHaveBeenCalledWith(
        'pat-1',
        'enc-1',
        mockUser.tenantId,
        mockUser,
      );
    });

    it('createClinicalOrder should call service', async () => {
      const dto = {
        orderType: 'LAB',
        items: [{ itemName: 'CBC' }],
      };
      await controller.createClinicalOrder('pat-1', 'enc-1', dto, mockUser);
      expect(service['createClinicalOrder']).toHaveBeenCalledWith(
        'pat-1',
        'enc-1',
        mockUser.tenantId,
        mockUser,
        dto,
      );
    });

    it('cancelClinicalOrder should call service', async () => {
      const dto = { reason: 'Duplicate order' };
      await controller.cancelClinicalOrder(
        'pat-1',
        'enc-1',
        'order-1',
        dto,
        mockUser,
      );
      expect(service['cancelClinicalOrder']).toHaveBeenCalledWith(
        'pat-1',
        'enc-1',
        'order-1',
        mockUser.tenantId,
        mockUser,
        dto,
      );
    });

    it('receiveLabOrder should call service', async () => {
      const dto = { specimenType: 'Whole Blood', collectionMode: 'ROUTINE' };
      await controller.receiveLabOrder('pat-1', 'order-1', dto, mockUser);
      expect(service['receiveLabOrder']).toHaveBeenCalledWith(
        'pat-1',
        'order-1',
        mockUser.tenantId,
        mockUser,
        dto,
      );
    });

    it('saveDraftLabResult should call service', async () => {
      const dto = { results: { WBC: '5.2' }, remarks: 'Normal' };
      await controller.saveDraftLabResult('pat-1', 'order-1', dto, mockUser);
      expect(service['saveDraftLabResult']).toHaveBeenCalledWith(
        'pat-1',
        'order-1',
        mockUser.tenantId,
        mockUser,
        dto,
      );
    });

    it('getLabDraftEncodingContext should call service', async () => {
      await controller.getLabDraftEncodingContext('pat-1', 'order-1', mockUser);
      expect(service['getLabDraftEncodingContext']).toHaveBeenCalledWith(
        'pat-1',
        'order-1',
        mockUser.tenantId,
        mockUser,
      );
    });

    it('getDraftSOAP should call service', async () => {
      await controller.getDraftSOAP('pat-1', 'enc-1', mockUser);
      expect(service['getDraftSOAP']).toHaveBeenCalledWith(
        'pat-1',
        'enc-1',
        mockUser.tenantId,
        mockUser,
      );
    });

    it('getValidatedResults should call service', async () => {
      await controller.getValidatedResults(mockUser);
      expect(service['getValidatedResults']).toHaveBeenCalledWith(
        mockUser.tenantId,
        mockUser.branchId,
        mockUser,
      );
    });

    it('validateLabResult should call service', async () => {
      const dto = { version: 1, remarks: 'Verified' };
      await controller.validateLabResult('pat-1', 'order-1', dto, mockUser);
      expect(service['validateLabResult']).toHaveBeenCalledWith(
        'pat-1',
        'order-1',
        mockUser.tenantId,
        mockUser,
        dto,
      );
    });

    it('releaseLabResult should call service', async () => {
      const dto = { version: 2 };
      await controller.releaseLabResult('pat-1', 'order-1', dto, mockUser);
      expect(service['releaseLabResult']).toHaveBeenCalledWith(
        'pat-1',
        'order-1',
        mockUser.tenantId,
        mockUser,
        dto,
      );
    });
  });
});
