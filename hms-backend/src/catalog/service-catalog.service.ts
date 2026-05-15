import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateServiceDto,
  UpdateServiceDto,
  ServiceStatus,
} from './dto/service-catalog.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ServiceCatalogService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(tenantId: string, userId: string, dto: CreateServiceDto) {
    const existing = await this.prisma.serviceCatalog.findFirst({
      where: { tenantId, code: dto.code },
    });

    if (existing) {
      throw new ConflictException(
        `Service with code ${dto.code} already exists`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const service = await tx.serviceCatalog.create({
        data: {
          tenantId,
          ...dto,
        },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'SERVICE_CATALOG_CREATED',
          recordType: 'ServiceCatalog',
          recordId: service.id,
          newValues: service,
        },
        tx,
      );

      return service;
    });
  }

  async findAll(tenantId: string, status?: ServiceStatus) {
    return this.prisma.serviceCatalog.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const service = await this.prisma.serviceCatalog.findFirst({
      where: { id, tenantId },
    });

    if (!service) {
      throw new NotFoundException(`Service catalog item ${id} not found`);
    }

    return service;
  }

  async update(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdateServiceDto,
  ) {
    const existing = await this.findOne(tenantId, id);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.serviceCatalog.update({
        where: { id },
        data: dto,
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'SERVICE_CATALOG_UPDATED',
          recordType: 'ServiceCatalog',
          recordId: id,
          oldValues: existing,
          newValues: updated,
        },
        tx,
      );

      return updated;
    });
  }

  async deactivate(tenantId: string, userId: string, id: string) {
    const existing = await this.findOne(tenantId, id);

    if (existing.status === (ServiceStatus.INACTIVE as string)) {
      return existing;
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.serviceCatalog.update({
        where: { id },
        data: { status: ServiceStatus.INACTIVE },
      });

      await this.audit.log(
        {
          tenantId,
          userId,
          eventKey: 'SERVICE_CATALOG_DEACTIVATED',
          recordType: 'ServiceCatalog',
          recordId: id,
          oldValues: existing,
          newValues: updated,
        },
        tx,
      );

      return updated;
    });
  }
}
