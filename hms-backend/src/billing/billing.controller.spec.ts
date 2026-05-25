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
  let billingService: { postPayment: jest.Mock };

  beforeEach(async () => {
    billingService = {
      postPayment: jest.fn(),
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
});
