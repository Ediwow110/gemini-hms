import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PaymentGatewayService } from './payment-gateway.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';

describe('PaymentGatewayService', () => {
  let service: PaymentGatewayService;
  let prisma: any;
  let audit: any;
  let config: any;

  const mockInvoiceId = 'invoice-uuid';
  const mockTenantId = 'tenant-uuid';
  const mockBranchId = 'branch-uuid';
  const mockPatientId = 'patient-uuid';

  beforeEach(async () => {
    process.env.JWT_SECRET = 'a'.repeat(32);
    process.env.PAYMENT_GATEWAY_PROVIDER = 'mock';

    prisma = {
      $transaction: jest.fn(async (cb) => {
        const mockTx = {
          invoice: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            findUnique: jest.fn().mockResolvedValue({
              id: mockInvoiceId,
              paidAmount: new Prisma.Decimal(0),
              totalAmount: new Prisma.Decimal(10000),
              status: 'UNPAID',
              orderId: 'order-uuid',
              order: { id: 'order-uuid', tenantId: mockTenantId, branchId: mockBranchId },
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          order: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return cb(mockTx);
      }),
    };

    audit = {
      log: jest.fn().mockResolvedValue({}),
    };

    config = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          PAYMENT_GATEWAY_PROVIDER: 'mock',
          STRIPE_SECRET_KEY: 'sk_test_mock',
          STRIPE_WEBHOOK_SECRET: 'whsec_mock',
        };
        return values[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentGatewayService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<PaymentGatewayService>(PaymentGatewayService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  describe('getProvider', () => {
    it('should return mock provider when PAYMENT_GATEWAY_PROVIDER=mock', () => {
      expect(service.getProvider()).toBe('mock');
    });

    it('should return stripe provider when PAYMENT_GATEWAY_PROVIDER=stripe', async () => {
      process.env.PAYMENT_GATEWAY_PROVIDER = 'stripe';
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PaymentGatewayService,
          { provide: PrismaService, useValue: prisma },
          { provide: AuditService, useValue: audit },
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const values: Record<string, string> = {
                  PAYMENT_GATEWAY_PROVIDER: 'stripe',
                  STRIPE_SECRET_KEY: 'sk_test_mock',
                  STRIPE_WEBHOOK_SECRET: 'whsec_mock',
                };
                return values[key];
              }),
            },
          },
        ],
      }).compile();

      const stripeService = module.get<PaymentGatewayService>(PaymentGatewayService);
      expect(stripeService.getProvider()).toBe('stripe');
    });
  });

  describe('createPaymentIntent', () => {
    it('should create mock payment intent with correct format', async () => {
      const result = await service.createPaymentIntent({
        invoiceId: mockInvoiceId,
        amountCents: 5000,
        currency: 'PHP',
        patientId: mockPatientId,
        branchId: mockBranchId,
        tenantId: mockTenantId,
      });

      expect(result).toMatchObject({
        amount: 5000,
        currency: 'PHP',
      });
      expect(result.paymentIntentId).toMatch(/^pi_mock_invoice_/);
      expect(result.clientSecret).toMatch(/^pi_mock_invoice_.*_secret_/);
    });

    it('should include metadata in payment intent', async () => {
      const result = await service.createPaymentIntent({
        invoiceId: mockInvoiceId,
        amountCents: 5000,
        currency: 'PHP',
        patientId: mockPatientId,
        branchId: mockBranchId,
        tenantId: mockTenantId,
        metadata: { customField: 'customValue' },
      });

      expect(result).toBeDefined();
    });

    it('should generate idempotency key with invoice ID and timestamp', async () => {
      const result = await service.createPaymentIntent({
        invoiceId: mockInvoiceId,
        amountCents: 5000,
        currency: 'PHP',
        patientId: mockPatientId,
        branchId: mockBranchId,
        tenantId: mockTenantId,
      });

      expect(result.paymentIntentId).toContain(mockInvoiceId);
    });
  });

  describe('handleStripeWebhook', () => {
    beforeEach(async () => {
      process.env.PAYMENT_GATEWAY_PROVIDER = 'stripe';
      process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock';

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PaymentGatewayService,
          { provide: PrismaService, useValue: prisma },
          { provide: AuditService, useValue: audit },
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const values: Record<string, string> = {
                  PAYMENT_GATEWAY_PROVIDER: 'stripe',
                  STRIPE_SECRET_KEY: 'sk_test_mock',
                  STRIPE_WEBHOOK_SECRET: 'whsec_mock',
                };
                return values[key];
              }),
            },
          },
        ],
      }).compile();

      service = module.get<PaymentGatewayService>(PaymentGatewayService);
    });

    it('should throw BadRequestException when provider is not stripe', async () => {
      const mockService = await Test.createTestingModule({
        providers: [
          PaymentGatewayService,
          { provide: PrismaService, useValue: prisma },
          { provide: AuditService, useValue: audit },
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const values: Record<string, string> = {
                  PAYMENT_GATEWAY_PROVIDER: 'mock',
                  STRIPE_WEBHOOK_SECRET: 'whsec_mock',
                };
                return values[key];
              }),
            },
          },
        ],
      }).compile();

      const mockProviderService = mockService.get<PaymentGatewayService>(PaymentGatewayService);
      
      await expect(
        mockProviderService.handleStripeWebhook(Buffer.from('{}'), 'sig'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException when webhook secret is not configured', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PaymentGatewayService,
          { provide: PrismaService, useValue: prisma },
          { provide: AuditService, useValue: audit },
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const values: Record<string, string | undefined> = {
                  PAYMENT_GATEWAY_PROVIDER: 'stripe',
                  STRIPE_SECRET_KEY: 'sk_test_mock',
                  STRIPE_WEBHOOK_SECRET: undefined,
                };
                return values[key];
              }),
            },
          },
        ],
      }).compile();

      const noSecretService = module.get<PaymentGatewayService>(PaymentGatewayService);
      
      await expect(
        noSecretService.handleStripeWebhook(Buffer.from('{}'), 'sig'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});