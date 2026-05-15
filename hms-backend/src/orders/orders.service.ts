import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, OrderItemType } from './dto/order.dto';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';
import { Prisma } from '@prisma/client';

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

    // 3. START TRANSACTION (Section 13 Boundary)
    return this.prisma.$transaction(async (tx) => {
      // 4. Resolve Trusted Prices and Items
      const lineItems: any[] = [];
      let calculatedTotal = new Prisma.Decimal(0);
      let hasLabTest = false;

      for (const itemDto of dto.items) {
        let trustedItem: { name: string; price: Prisma.Decimal };

        if (itemDto.itemType === OrderItemType.SERVICE) {
          const service = await tx.serviceCatalog.findFirst({
            where: { id: itemDto.itemId, tenantId, status: 'ACTIVE' },
          });
          if (!service) {
            throw new BadRequestException(
              `Service item ${itemDto.itemId} not found or inactive`,
            );
          }
          trustedItem = { name: service.name, price: service.price };
          if (service.category === 'LAB_TEST') {
            hasLabTest = true;
          }
        } else if (itemDto.itemType === OrderItemType.INVENTORY) {
          const inventory = await tx.inventoryItem.findFirst({
            where: { id: itemDto.itemId, tenantId, status: 'ACTIVE' },
          });
          if (!inventory) {
            throw new BadRequestException(
              `Inventory item ${itemDto.itemId} not found or inactive`,
            );
          }
          trustedItem = { name: inventory.name, price: inventory.price };
        } else {
          throw new BadRequestException(
            `Invalid item type: ${itemDto.itemType as string}`,
          );
        }

        const quantity = new Prisma.Decimal(itemDto.quantity);
        const lineTotal = trustedItem.price.mul(quantity);
        calculatedTotal = calculatedTotal.add(lineTotal);

        lineItems.push({
          tenantId,
          itemType: itemDto.itemType,
          itemId: itemDto.itemId,
          name: trustedItem.name,
          quantity: itemDto.quantity,
          unitPrice: trustedItem.price,
          lineTotal,
        });
      }

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
          items: {
            create: lineItems,
          },
          labResult: hasLabTest
            ? {
                create: {
                  tenantId,
                  status: 'PENDING_COLLECTION',
                },
              }
            : undefined,
        },
        include: {
          items: true,
          labResult: true,
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
          totalAmount: calculatedTotal,
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
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, branchId: string, id: string) {
    return this.prisma.order.findFirst({
      where: { id, tenantId, branchId },
      include: {
        patient: true,
        items: true,
        invoice: {
          include: {
            payments: true,
          },
        },
      },
    });
  }
}
