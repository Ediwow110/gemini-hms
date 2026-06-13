import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PERMISSIONS_KEY } from '../auth/decorators/permissions.decorator';
import { REQUIRE_BRANCH_CONTEXT_KEY } from '../auth/decorators/branch-context.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { BranchGuard } from '../auth/guards/branch.guard';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

describe('BillingController', () => {
  let controller: BillingController;
  let billingService: {
    postPayment: jest.Mock;
    getPaymentHistory: jest.Mock;
    confirmPayment: jest.Mock;
    failPayment: jest.Mock;
    expirePayment: jest.Mock;
  };

  beforeEach(async () => {
    billingService = {
      postPayment: jest.fn(),
      getPaymentHistory: jest.fn(),
      confirmPayment: jest.fn(),
      failPayment: jest.fn(),
      expirePayment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [{ provide: BillingService, useValue: billingService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(BranchGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BillingController>(BillingController);
  });

  it('post payment endpoint requires billing.payment.create permission', () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      BillingController.prototype,
      'postPayment',
    );

    expect(
      Reflect.getMetadata(PERMISSIONS_KEY, descriptor?.value as object),
    ).toEqual({
      mode: 'any',
      permissions: ['billing.payment.create'],
    });
    expect(
      Reflect.getMetadata(
        REQUIRE_BRANCH_CONTEXT_KEY,
        descriptor?.value as object,
      ),
    ).toBe(true);
  });

  it('should reject payment creation without Idempotency-Key header', async () => {
    expect(() =>
      controller.postPayment(
        'tenant-id',
        'user-id',
        'branch-id',
        {
          invoiceId: 'invoice-id',
          cashierSessionId: 'session-id',
          amount: 50,
          paymentMethod: 'CASH',
        },
        '',
      ),
    ).toThrow(BadRequestException);
  });

  it('should reject body idempotencyKey and require header-only contract', async () => {
    const dtoWithBodyKey = {
      invoiceId: 'invoice-id',
      cashierSessionId: 'session-id',
      amount: 50,
      paymentMethod: 'CASH',
      idempotencyKey: 'body-only',
    } as unknown as {
      invoiceId: string;
      cashierSessionId: string;
      amount: number;
      paymentMethod: string;
    };

    expect(() =>
      controller.postPayment(
        'tenant-id',
        'user-id',
        'branch-id',
        dtoWithBodyKey,
        '',
      ),
    ).toThrow('Idempotency-Key must be provided via header only');
  });

  it('should pass header idempotency key into the service', async () => {
    billingService.postPayment.mockResolvedValue({ ok: true });

    await controller.postPayment(
      'tenant-id',
      'user-id',
      'branch-id',
      {
        invoiceId: 'invoice-id',
        cashierSessionId: 'session-id',
        amount: 50,
        paymentMethod: 'CASH',
      },
      'header-key-1',
    );

    expect(billingService.postPayment).toHaveBeenCalledWith(
      'tenant-id',
      'user-id',
      'branch-id',
      {
        invoiceId: 'invoice-id',
        cashierSessionId: 'session-id',
        amount: 50,
        paymentMethod: 'CASH',
      },
      'header-key-1',
    );
  });

  describe('GET /payments (payment history)', () => {
    it('should delegate to getPaymentHistory with parsed page/pageSize', async () => {
      billingService.getPaymentHistory.mockResolvedValue({
        payments: [],
        total: 0,
      });

      await controller.getPaymentHistory('t1', 'b1', '2', '1');

      expect(billingService.getPaymentHistory).toHaveBeenCalledWith(
        't1',
        'b1',
        2,
        1,
      );
    });

    it('should pass undefined when query params are missing', async () => {
      billingService.getPaymentHistory.mockResolvedValue({
        payments: [],
        total: 0,
      });

      await controller.getPaymentHistory('t1', 'b1', undefined, undefined);

      expect(billingService.getPaymentHistory).toHaveBeenCalledWith(
        't1',
        'b1',
        undefined,
        undefined,
      );
    });

    it('requires billing.payment.create permission', () => {
      const descriptor = Object.getOwnPropertyDescriptor(
        BillingController.prototype,
        'getPaymentHistory',
      );
      expect(
        Reflect.getMetadata(PERMISSIONS_KEY, descriptor?.value as object),
      ).toEqual({ mode: 'any', permissions: ['billing.payment.create'] });
    });
  });

  describe('POST /payments/:id/confirm', () => {
    it('should delegate to confirmPayment with DTO', async () => {
      const dto = { gatewayReference: 'GW-001', gatewayProvider: 'QRPH' };
      await controller.confirmPayment('t1', 'u1', 'b1', 'pay-1', dto);

      expect(billingService.confirmPayment).toHaveBeenCalledWith(
        't1',
        'u1',
        'b1',
        'pay-1',
        dto,
      );
    });

    it('requires billing.payment.create permission', () => {
      const descriptor = Object.getOwnPropertyDescriptor(
        BillingController.prototype,
        'confirmPayment',
      );
      expect(
        Reflect.getMetadata(PERMISSIONS_KEY, descriptor?.value as object),
      ).toEqual({ mode: 'any', permissions: ['billing.payment.create'] });
    });
  });

  describe('POST /payments/:id/fail', () => {
    it('should delegate to failPayment with DTO', async () => {
      const dto = { reason: 'Declined' };
      await controller.failPayment('t1', 'u1', 'b1', 'pay-1', dto);

      expect(billingService.failPayment).toHaveBeenCalledWith(
        't1',
        'u1',
        'b1',
        'pay-1',
        dto,
      );
    });
  });

  describe('POST /payments/:id/expire', () => {
    it('should delegate to expirePayment with DTO', async () => {
      const dto = { reason: 'Expired' };
      await controller.expirePayment('t1', 'u1', 'b1', 'pay-1', dto);

      expect(billingService.expirePayment).toHaveBeenCalledWith(
        't1',
        'u1',
        'b1',
        'pay-1',
        dto,
      );
    });
  });
});
