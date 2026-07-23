import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  private shipmentScope(tenantId: string, branchId: string) {
    return {
      tenantId,
      salesOrder: {
        quote: {
          rfq: { branchId },
        },
      },
    };
  }

  private deliveryJobScope(tenantId: string, branchId: string) {
    return {
      tenantId,
      shipment: this.shipmentScope(tenantId, branchId),
    };
  }

  async createShipment(
    tenantId: string,
    branchId: string,
    userId: string,
    dto: CreateShipmentDto,
  ) {
    const order = await this.prisma.salesOrder.findFirst({
      where: {
        id: dto.salesOrderId,
        tenantId,
        quote: { rfq: { branchId } },
      },
    });

    if (!order) throw new NotFoundException('Sales order not found');

    const shipment = await this.prisma.shipment.create({
      data: {
        tenantId,
        salesOrderId: dto.salesOrderId,
        trackingNumber: dto.trackingNumber,
        carrier: dto.carrier,
        status: ShipmentStatus.PENDING,
      },
    });

    await this.audit.log(
      {
        tenantId,
        userId,
        eventKey: 'SHIPMENT_CREATED',
        recordType: 'Shipment',
        recordId: shipment.id,
        newValues: shipment,
      },
      undefined,
      branchId,
    );

    return shipment;
  }

  async updateShipmentStatus(
    tenantId: string,
    branchId: string,
    userId: string,
    id: string,
    dto: UpdateShipmentStatusDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.findFirst({
        where: { id, ...this.shipmentScope(tenantId, branchId) },
      });

      if (!shipment) throw new NotFoundException('Shipment not found');

      const updated = await tx.shipment.update({
        where: { id, tenantId },
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

      if (dto.status === ShipmentStatus.DELIVERED) {
        await tx.salesOrder.update({
          where: { id: shipment.salesOrderId, tenantId },
          data: { status: OrderStatus.DELIVERED },
        });
      } else if (dto.status === ShipmentStatus.SHIPPED) {
        await tx.salesOrder.update({
          where: { id: shipment.salesOrderId, tenantId },
          data: { status: OrderStatus.SHIPPED },
        });
      }

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'SHIPMENT_STATUS_UPDATED',
          recordType: 'Shipment',
          recordId: id,
          newValues: { status: dto.status, note: dto.note },
        },
        tx,
        branchId,
      );

      return updated;
    });
  }

  async findAllShipments(tenantId: string, branchId: string) {
    return this.prisma.shipment.findMany({
      where: this.shipmentScope(tenantId, branchId),
      include: {
        salesOrder: {
          include: {
            quote: {
              include: {
                rfq: { include: { branch: true } },
              },
            },
          },
        },
        deliveryJobs: {
          include: {
            assignedUser: { select: { id: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findShipment(tenantId: string, branchId: string, id: string) {
    return this.prisma.shipment.findFirst({
      where: { id, ...this.shipmentScope(tenantId, branchId) },
      include: {
        salesOrder: {
          include: {
            quote: {
              include: { rfq: { include: { branch: true } } },
            },
          },
        },
        deliveryJobs: {
          include: {
            assignedUser: { select: { id: true, email: true } },
          },
        },
      },
    });
  }

  async findEligibleTechnicians(tenantId: string, branchId: string) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        userBranches: { some: { branchId, isActive: true } },
        userRoles: {
          some: {
            status: 'ACTIVE',
            role: {
              tenantId,
              name: 'Field Technician',
              status: 'ACTIVE',
              archivedAt: null,
            },
          },
        },
      },
      select: { id: true, email: true },
      orderBy: { email: 'asc' },
    });
  }

  async createDeliveryJob(
    tenantId: string,
    branchId: string,
    userId: string,
    dto: CreateDeliveryJobDto,
  ) {
    const [shipment, technician] = await Promise.all([
      this.prisma.shipment.findFirst({
        where: {
          id: dto.shipmentId,
          ...this.shipmentScope(tenantId, branchId),
        },
      }),
      this.prisma.user.findFirst({
        where: {
          id: dto.assignedUserId,
          tenantId,
          status: 'ACTIVE',
          userBranches: { some: { branchId, isActive: true } },
          userRoles: {
            some: {
              status: 'ACTIVE',
              role: {
                tenantId,
                name: 'Field Technician',
                status: 'ACTIVE',
                archivedAt: null,
              },
            },
          },
        },
        select: { id: true },
      }),
    ]);

    if (!shipment) throw new NotFoundException('Shipment not found');
    if (!technician) {
      throw new NotFoundException('Eligible field technician not found');
    }

    const existingJob = await this.prisma.deliveryJob.findFirst({
      where: {
        tenantId,
        shipmentId: dto.shipmentId,
        status: {
          in: [DeliveryJobStatus.ASSIGNED, DeliveryJobStatus.IN_PROGRESS],
        },
      },
      select: { id: true },
    });
    if (existingJob) {
      throw new ConflictException(
        'Shipment already has an active delivery job',
      );
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

    await this.audit.log(
      {
        tenantId,
        userId,
        eventKey: 'DELIVERY_JOB_CREATED',
        recordType: 'DeliveryJob',
        recordId: job.id,
        newValues: job,
      },
      undefined,
      branchId,
    );

    return job;
  }

  async updateDeliveryJobStatus(
    tenantId: string,
    branchId: string,
    userId: string,
    id: string,
    dto: UpdateDeliveryJobStatusDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const job = await tx.deliveryJob.findFirst({
        where: { id, ...this.deliveryJobScope(tenantId, branchId) },
      });

      if (!job) throw new NotFoundException('Delivery job not found');

      const updatedJob = await tx.deliveryJob.update({
        where: { id, tenantId },
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
          notes: dto.notes ?? job.notes,
        },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'DELIVERY_JOB_STATUS_UPDATED',
          recordType: 'DeliveryJob',
          recordId: id,
          newValues: { status: dto.status, notes: dto.notes },
        },
        tx,
        branchId,
      );

      return updatedJob;
    });
  }

  async findTechnicianJobs(tenantId: string, branchId: string, userId: string) {
    const [deliveries, installations] = await Promise.all([
      this.prisma.deliveryJob.findMany({
        where: {
          assignedUserId: userId,
          ...this.deliveryJobScope(tenantId, branchId),
        },
        include: {
          shipment: {
            include: {
              salesOrder: {
                include: {
                  quote: {
                    include: {
                      rfq: { include: { branch: true } },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { status: 'asc' },
      }),
      this.prisma.installationJob.findMany({
        where: {
          tenantId,
          assignedUserId: userId,
          asset: {
            salesOrder: { quote: { rfq: { branchId } } },
          },
        },
        include: {
          asset: {
            include: {
              salesOrder: {
                include: {
                  quote: {
                    include: {
                      rfq: { include: { branch: true } },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { status: 'asc' },
      }),
    ]);

    return {
      deliveries: deliveries.map((delivery) => {
        const rfq = delivery.shipment.salesOrder.quote.rfq;
        return {
          id: delivery.id,
          type: 'DELIVERY',
          status: delivery.status,
          customer: rfq.title,
          address: rfq.branch.name,
          shipmentId: delivery.shipmentId,
          orderId: delivery.shipment.salesOrderId,
        };
      }),
      installations: installations.map((installation) => {
        const rfq = installation.asset.salesOrder.quote.rfq;
        return {
          id: installation.id,
          type: 'INSTALLATION',
          status: installation.status,
          customer: rfq.title,
          address: rfq.branch.name,
          assetId: installation.assetId,
          assetModel: installation.asset.model,
        };
      }),
    };
  }
}
