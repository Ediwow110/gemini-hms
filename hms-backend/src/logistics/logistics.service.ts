import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ShipmentStatus, DeliveryJobStatus, OrderStatus } from '@prisma/client';
import {
  CreateShipmentDto,
  UpdateShipmentStatusDto,
  CreateDeliveryJobDto,
  UpdateDeliveryJobStatusDto,
} from './dto/logistics.dto';

@Injectable()
export class LogisticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async createShipment(
    tenantId: string,
    userId: string,
    dto: CreateShipmentDto,
  ) {
    const order = await this.prisma.salesOrder.findFirst({
      where: { id: dto.salesOrderId, tenantId },
    });

    if (!order) {
      throw new NotFoundException('Sales order not found');
    }

    const shipment = await this.prisma.shipment.create({
      data: {
        tenantId,
        salesOrderId: dto.salesOrderId,
        trackingNumber: dto.trackingNumber,
        carrier: dto.carrier,
        status: ShipmentStatus.PENDING,
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      eventKey: 'SHIPMENT_CREATED',
      recordType: 'Shipment',
      recordId: shipment.id,
      newValues: shipment,
    });

    return shipment;
  }

  async updateShipmentStatus(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdateShipmentStatusDto,
  ) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { id, tenantId },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    const updatedShipment = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.shipment.update({
        where: { id },
        data: {
          status: dto.status,
          shippedAt:
            dto.status === ShipmentStatus.SHIPPED
              ? new Date()
              : shipment.shippedAt,
          deliveredAt:
            dto.status === ShipmentStatus.DELIVERED
              ? new Date()
              : shipment.deliveredAt,
        },
      });

      // Update SalesOrder status if shipment is delivered
      if (dto.status === ShipmentStatus.DELIVERED) {
        await tx.salesOrder.update({
          where: { id: shipment.salesOrderId },
          data: { status: OrderStatus.DELIVERED },
        });
      } else if (dto.status === ShipmentStatus.SHIPPED) {
        await tx.salesOrder.update({
          where: { id: shipment.salesOrderId },
          data: { status: OrderStatus.SHIPPED },
        });
      }

      return updated;
    });

    await this.audit.log({
      tenantId,
      userId,
      eventKey: 'SHIPMENT_STATUS_UPDATED',
      recordType: 'Shipment',
      recordId: id,
      newValues: { status: dto.status, note: dto.note },
    });

    return updatedShipment;
  }

  async findAllShipments(tenantId: string) {
    return this.prisma.shipment.findMany({
      where: { tenantId },
      include: { salesOrder: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findShipment(tenantId: string, id: string) {
    return this.prisma.shipment.findFirst({
      where: { id, tenantId },
      include: {
        salesOrder: {
          include: {
            quote: {
              include: { rfq: true },
            },
          },
        },
        deliveryJobs: {
          include: { assignedUser: true },
        },
      },
    });
  }

  // Delivery Jobs
  async createDeliveryJob(
    tenantId: string,
    userId: string,
    dto: CreateDeliveryJobDto,
  ) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { id: dto.shipmentId, tenantId },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    const job = await this.prisma.deliveryJob.create({
      data: {
        tenantId,
        shipmentId: dto.shipmentId,
        assignedUserId: dto.assignedUserId,
        status: DeliveryJobStatus.ASSIGNED,
        notes: dto.notes,
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      eventKey: 'DELIVERY_JOB_CREATED',
      recordType: 'DeliveryJob',
      recordId: job.id,
      newValues: job,
    });

    return job;
  }

  async updateDeliveryJobStatus(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdateDeliveryJobStatusDto,
  ) {
    const job = await this.prisma.deliveryJob.findFirst({
      where: { id, tenantId },
    });

    if (!job) {
      throw new NotFoundException('Delivery job not found');
    }

    // Security: Only assigned technician or admin can update
    // For now, we allow any user with the permission (handled in controller)

    const updatedJob = await this.prisma.deliveryJob.update({
      where: { id },
      data: {
        status: dto.status,
        startedAt:
          dto.status === DeliveryJobStatus.IN_PROGRESS
            ? new Date()
            : job.startedAt,
        completedAt:
          dto.status === DeliveryJobStatus.COMPLETED
            ? new Date()
            : job.completedAt,
        notes: dto.notes || job.notes,
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      eventKey: 'DELIVERY_JOB_STATUS_UPDATED',
      recordType: 'DeliveryJob',
      recordId: id,
      newValues: { status: dto.status, notes: dto.notes },
    });

    return updatedJob;
  }

  async findTechnicianJobs(tenantId: string, userId: string) {
    // Both delivery and installation jobs
    const [deliveries, installations] = await Promise.all([
      this.prisma.deliveryJob.findMany({
        where: { tenantId, assignedUserId: userId },
        include: { shipment: { include: { salesOrder: true } } },
        orderBy: { status: 'asc' },
      }),
      this.prisma.installationJob.findMany({
        where: { tenantId, assignedUserId: userId },
        include: { asset: true },
        orderBy: { status: 'asc' },
      }),
    ]);

    return {
      deliveries: deliveries.map((d) => ({
        id: d.id,
        type: 'DELIVERY',
        status: d.status,
        customer: 'Hospital', // Should ideally come from Order/RFQ
        address: 'Radiology Dept',
        shipmentId: d.shipmentId,
        orderId: d.shipment.salesOrderId,
      })),
      installations: installations.map((i) => ({
        id: i.id,
        type: 'INSTALLATION',
        status: i.status,
        customer: 'Hospital',
        address: 'Radiology Dept',
        assetId: i.assetId,
        assetModel: i.asset.model,
      })),
    };
  }
}
