import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/order.dto';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private numbering: NumberingService,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    branchId: string,
    dto: CreateOrderDto,
  ) {
    // 1. Validate items (must have at least one)
    if (dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // 2. Verify patient exists and belongs to this tenant
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, tenantId },
    });

    if (!patient) {
      throw new BadRequestException('Patient not found or access denied');
    }

    // 3. Calculate total amount
    const totalAmount = dto.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // 4. START TRANSACTION (Section 13 Boundary)
    return this.prisma.$transaction(async (tx) => {
      // 5. Generate Order Number
      const orderNumber = await this.numbering.generateNumber(
        tenantId,
        'ORDER',
        branchId,
        tx,
      );

      // 6. Create Order
      const order = await tx.order.create({
        data: {
          tenantId,
          branchId,
          patientId: dto.patientId,
          orderNumber,
          status: 'PENDING_PAYMENT',
        },
      });

      // 7. Generate Invoice Number
      const invoiceNumber = await this.numbering.generateNumber(
        tenantId,
        'INVOICE',
        branchId,
        tx,
      );

      // 8. Create Invoice (Automatically linked to order)
      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          orderId: order.id,
          invoiceNumber,
          totalAmount: totalAmount,
          paidAmount: 0,
          status: 'UNPAID',
        },
      });

      // 9. Log Audit Event (ORDER_CREATED)
      await this.audit.log({
        tenantId,
        userId,
        eventKey: 'ORDER_CREATED',
        recordType: 'Order',
        recordId: order.id,
        newValues: { order, invoice, itemsCount: dto.items.length },
      });

      return { order, invoice };
    });
  }

  async findAll(tenantId: string, branchId: string) {
    return this.prisma.order.findMany({
      where: { tenantId, branchId },
      include: {
        patient: true,
        invoice: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, branchId: string, id: string) {
    return this.prisma.order.findFirst({
      where: { id, tenantId, branchId },
      include: {
        patient: true,
        invoice: {
          include: {
            payments: true,
          },
        },
      },
    });
  }
}
