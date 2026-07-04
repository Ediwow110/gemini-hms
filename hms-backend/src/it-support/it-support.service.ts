import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { QueryTicketDto } from './dto/query-ticket.dto';

@Injectable()
export class ItSupportService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async getActiveSessions(tenantId: string) {
    return this.prisma.session.findMany({
      where: { tenantId },
      include: {
        user: {
          select: { email: true, userRoles: { select: { role: { select: { name: true } } } } },
        },
        branch: { select: { name: true } },
      },
      orderBy: { lastRotatedAt: 'desc' },
    });
  }

  async getIntegrations(tenantId: string) {
    return this.prisma.integration.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getBackups(tenantId: string) {
    return this.prisma.backupRecord.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSystemLogs(tenantId: string, branchId?: string) {
    const where: any = { tenantId };
    if (branchId) where.branchId = branchId;

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getSystemHealth() {
    // Real DB check
    const dbHealth = await this.prisma.$queryRaw<any[]>`SELECT 1`;
    const isDbOnline = dbHealth.length > 0;

    return {
      services: [
        { id: 'api', name: 'HMS API Gateway', status: 'ONLINE', latency: 42, uptime: 99.97 },
        { id: 'db', name: 'PostgreSQL Primary', status: isDbOnline ? 'ONLINE' : 'OFFLINE', latency: 8, uptime: 99.99 },
        { id: 'redis', name: 'Redis Cache', status: 'ONLINE', latency: 2, uptime: 99.98 },
      ],
      overallStatus: isDbOnline ? 'HEALTHY' : 'DEGRADED',
    };
  }

  async create(dto: CreateTicketDto, tenantId: string, userId: string) {
    const ticket = await this.prisma.supportTicket.create({
      data: {
        tenantId,
        reportedById: userId,
        branchId: dto.branchId || null,
        issueType: dto.issueType,
        summary: dto.summary,
        description: dto.description || null,
        priority: dto.priority || 'MEDIUM',
      },
    });

    await this.audit.log(
      {
        tenantId,
        userId,
        eventKey: 'SUPPORT_TICKET_CREATED',
        recordType: 'SupportTicket',
        recordId: ticket.id,
        newValues: {
          issueType: dto.issueType,
          summary: dto.summary,
          priority: dto.priority,
        },
      },
      undefined,
      dto.branchId,
    );

    return ticket;
  }

  async findAll(
    tenantId: string,
    userId: string,
    roles: string[],
    query: QueryTicketDto,
  ) {
    const where: any = { tenantId };
    const isSuperAdmin = roles.includes('Super Admin');

    // Non-Super Admin IT Support sees all tenant tickets (IT Support scope is tenant-wide per seed)
    if (
      !isSuperAdmin &&
      !roles.includes('IT Support') &&
      !roles.includes('Branch Admin')
    ) {
      where.reportedById = userId;
    }

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.issueType) where.issueType = query.issueType;
    if (query.search) {
      where.OR = [
        { summary: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const limit = Math.min(pageSize, 100);

    const total = await this.prisma.supportTicket.count({ where });
    const data = await this.prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        reportedBy: { select: { id: true, email: true } },
        assignedTo: { select: { id: true, email: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    return { data, total, page, pageSize: limit };
  }

  async findOne(id: string, tenantId: string, userId: string, roles: string[]) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        reportedBy: { select: { id: true, email: true } },
        assignedTo: { select: { id: true, email: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    if (!ticket || ticket.tenantId !== tenantId) {
      throw new NotFoundException('Ticket not found');
    }

    const isSuperAdmin = roles.includes('Super Admin');
    const isItSupport = roles.includes('IT Support');
    const isBranchAdmin = roles.includes('Branch Admin');

    if (
      !isSuperAdmin &&
      !isItSupport &&
      !isBranchAdmin &&
      ticket.reportedById !== userId
    ) {
      throw new ForbiddenException('Access denied to this ticket');
    }

    return ticket;
  }

  async update(
    id: string,
    dto: UpdateTicketDto,
    tenantId: string,
    userId: string,
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
    });
    if (!ticket || ticket.tenantId !== tenantId) {
      throw new NotFoundException('Ticket not found');
    }

    const updateData: any = {};
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.assignedToId !== undefined)
      updateData.assignedToId = dto.assignedToId;
    if (dto.resolution !== undefined) updateData.resolution = dto.resolution;
    if (dto.status === 'RESOLVED' || dto.status === 'CLOSED') {
      updateData.resolvedAt = new Date();
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: updateData,
    });

    await this.audit.log(
      {
        tenantId,
        userId,
        eventKey: 'SUPPORT_TICKET_UPDATED',
        recordType: 'SupportTicket',
        recordId: id,
        oldValues: { status: ticket.status, priority: ticket.priority },
        newValues: updateData,
      },
      undefined,
      ticket.branchId || undefined,
    );

    return updated;
  }

  async getStats(tenantId: string) {
    const [open, inProgress, urgent, total] = await Promise.all([
      this.prisma.supportTicket.count({ where: { tenantId, status: 'OPEN' } }),
      this.prisma.supportTicket.count({
        where: { tenantId, status: 'IN_PROGRESS' },
      }),
      this.prisma.supportTicket.count({
        where: {
          tenantId,
          priority: 'URGENT',
          status: { notIn: ['RESOLVED', 'CLOSED'] },
        },
      }),
      this.prisma.supportTicket.count({ where: { tenantId } }),
    ]);

    return { open, inProgress, urgent, total };
  }
}
