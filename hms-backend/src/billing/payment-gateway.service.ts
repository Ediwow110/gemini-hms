import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Prisma } from '@prisma/client';

export type PaymentGatewayProvider = 'stripe' | 'xendit' | 'mock';

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

export interface CreatePaymentIntentParams {
  invoiceId: string;
  amountCents: number;
  currency: string;
  patientId: string;
  branchId: string;
  tenantId: string;
  metadata?: Record<string, string>;
}

export interface WebhookHandlerResult {
  success: boolean;
  invoiceId?: string;
  amount?: number;
  currency?: string;
  error?: string;
}

@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);
  private readonly provider: PaymentGatewayProvider;
  private stripe: Stripe | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {
    this.provider = (this.configService.get<string>(
      'PAYMENT_GATEWAY_PROVIDER',
    ) || 'mock') as PaymentGatewayProvider;
    this.initializeProvider();
  }

  private initializeProvider(): void {
    if (this.provider === 'stripe') {
      const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
      const apiVersion =
        this.configService.get<string>('STRIPE_API_VERSION') || '2023-10-16';

      if (!secretKey) {
        throw new Error(
          'STRIPE_SECRET_KEY is required when PAYMENT_GATEWAY_PROVIDER=stripe',
        );
      }

      this.stripe = new Stripe(secretKey, {
        apiVersion: apiVersion as Stripe.LatestApiVersion,
        typescript: true,
      });

      this.logger.log('Stripe payment gateway initialized');
    } else if (this.provider === 'xendit') {
      this.logger.log(
        'Xendit payment gateway selected (not yet implemented, will use mock)',
      );
    } else {
      this.logger.log('Mock payment gateway initialized (development only)');
    }
  }

  getProvider(): PaymentGatewayProvider {
    return this.provider;
  }

  async createPaymentIntent(
    params: CreatePaymentIntentParams,
  ): Promise<PaymentIntentResult> {
    const idempotencyKey = `invoice_${params.invoiceId}_${Date.now()}`;

    switch (this.provider) {
      case 'stripe':
        return this.createStripePaymentIntent(params, idempotencyKey);
      case 'xendit':
        throw new BadRequestException(
          'Xendit payment gateway not yet implemented',
        );
      case 'mock':
      default:
        return this.createMockPaymentIntent(params, idempotencyKey);
    }
  }

  private async createStripePaymentIntent(
    params: CreatePaymentIntentParams,
    idempotencyKey: string,
  ): Promise<PaymentIntentResult> {
    if (!this.stripe) {
      throw new InternalServerErrorException('Stripe client not initialized');
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create(
        {
          amount: params.amountCents,
          currency: params.currency.toLowerCase(),
          automatic_payment_methods: {
            enabled: true,
          },
          metadata: {
            invoiceId: params.invoiceId,
            patientId: params.patientId,
            branchId: params.branchId,
            tenantId: params.tenantId,
            ...params.metadata,
          },
        },
        {
          idempotencyKey,
        },
      );

      this.logger.log(
        `Created Stripe PaymentIntent: ${paymentIntent.id} for invoice ${params.invoiceId}`,
      );

      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      };
    } catch (error) {
      this.logger.error(`Failed to create Stripe PaymentIntent: ${error}`);
      throw new InternalServerErrorException('Failed to create payment intent');
    }
  }

  private async createMockPaymentIntent(
    params: CreatePaymentIntentParams,
    idempotencyKey: string,
  ): Promise<PaymentIntentResult> {
    // Mock payment intent for development
    const mockPaymentIntentId = `pi_mock_${idempotencyKey}`;
    const mockClientSecret = `${mockPaymentIntentId}_secret_${Date.now()}`;

    this.logger.log(
      `Created mock PaymentIntent: ${mockPaymentIntentId} for invoice ${params.invoiceId}`,
    );

    return {
      clientSecret: mockClientSecret,
      paymentIntentId: mockPaymentIntentId,
      amount: params.amountCents,
      currency: params.currency,
    };
  }

  async handleStripeWebhook(
    rawBody: Buffer,
    signature: string,
  ): Promise<WebhookHandlerResult> {
    if (this.provider !== 'stripe') {
      throw new BadRequestException(
        'Webhook handler only available for Stripe provider',
      );
    }

    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    if (!webhookSecret) {
      throw new InternalServerErrorException(
        'STRIPE_WEBHOOK_SECRET not configured',
      );
    }

    let event: Stripe.Event;

    try {
      event = this.stripe!.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err}`);
      throw new BadRequestException('Webhook signature verification failed');
    }

    this.logger.log(`Received Stripe webhook: ${event.type} (${event.id})`);

    // Handle payment_intent.succeeded event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      return this.handlePaymentIntentSucceeded(paymentIntent);
    }

    // Handle other events as needed
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      return this.handlePaymentIntentFailed(paymentIntent);
    }

    return { success: true };
  }

  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<WebhookHandlerResult> {
    const invoiceId = paymentIntent.metadata.invoiceId;
    const tenantId = paymentIntent.metadata.tenantId;
    const branchId = paymentIntent.metadata.branchId;

    if (!invoiceId || !tenantId || !branchId) {
      this.logger.error('Missing required metadata in payment intent');
      return { success: false, error: 'Missing required metadata' };
    }

    try {
      // Atomically update invoice status to PAID
      const result = await this.prisma.$transaction(async (tx) => {
        // Lock the invoice row
        const invoiceLock = await tx.invoice.updateMany({
          where: {
            id: invoiceId,
            order: { tenantId, branchId },
            status: { not: 'PAID' },
            archivedAt: null,
          },
          data: { updatedAt: new Date() },
        });

        if (invoiceLock.count === 0) {
          throw new BadRequestException(
            'Invoice not found, already paid, or access denied',
          );
        }

        // Get current invoice state
        const invoice = await tx.invoice.findUnique({
          where: { id: invoiceId },
          include: { order: true },
        });

        if (!invoice) {
          throw new BadRequestException('Invoice not found');
        }

        // Calculate new paid amount
        const currentPaid = new Prisma.Decimal(invoice.paidAmount);
        const totalAmount = new Prisma.Decimal(invoice.totalAmount);
        const paymentAmount = new Prisma.Decimal(paymentIntent.amount / 100); // Stripe amount is in cents

        const newPaidAmount = currentPaid.add(paymentAmount);

        if (newPaidAmount.gt(totalAmount)) {
          throw new BadRequestException('Payment would overpay the invoice');
        }

        const newStatus = newPaidAmount.equals(totalAmount)
          ? 'PAID'
          : 'PARTIALLY_PAID';

        // Update invoice
        const updatedInvoice = await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            paidAmount: newPaidAmount,
            status: newStatus,
          },
        });

        // Update order status if fully paid
        if (newStatus === 'PAID') {
          await tx.order.updateMany({
            where: { id: invoice.orderId, tenantId, branchId },
            data: { status: 'PAID' },
          });
        }

        // Log audit event
        await this.audit.log(
          {
            tenantId,
            userId: paymentIntent.metadata.userId || 'system',
            eventKey: 'PAYMENT_POSTED',
            recordType: 'Payment',
            recordId: paymentIntent.id,
            newValues: {
              gatewayProvider: 'stripe',
              gatewayReference: paymentIntent.id,
              gatewayStatus: 'succeeded',
              amount: paymentAmount.toString(),
              currency: paymentIntent.currency.toUpperCase(),
              invoiceId,
              invoiceStatus: newStatus,
              branchId,
            },
          },
          tx,
          branchId,
        );

        return {
          invoiceId,
          amount: paymentAmount.toNumber(),
          currency: paymentIntent.currency.toUpperCase(),
          newStatus,
        };
      });

      this.logger.log(
        `Invoice ${invoiceId} updated to ${result.newStatus} via Stripe webhook`,
      );
      return { success: true, ...result };
    } catch (error) {
      this.logger.error(`Failed to process payment_intent.succeeded: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<WebhookHandlerResult> {
    const invoiceId = paymentIntent.metadata.invoiceId;
    const tenantId = paymentIntent.metadata.tenantId;
    const branchId = paymentIntent.metadata.branchId;

    if (!invoiceId || !tenantId || !branchId) {
      return { success: false, error: 'Missing required metadata' };
    }

    try {
      await this.audit.log(
        {
          tenantId,
          userId: paymentIntent.metadata.userId || 'system',
          eventKey: 'PAYMENT_GATEWAY_FAILED',
          recordType: 'Payment',
          recordId: paymentIntent.id,
          newValues: {
            gatewayProvider: 'stripe',
            gatewayReference: paymentIntent.id,
            gatewayStatus: 'failed',
            errorMessage:
              paymentIntent.last_payment_error?.message || 'Unknown error',
            invoiceId,
            branchId,
          },
        },
        undefined,
        branchId,
      );

      this.logger.warn(
        `Payment failed for invoice ${invoiceId}: ${paymentIntent.last_payment_error?.message}`,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to process payment_intent.payment_failed: ${error}`,
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
