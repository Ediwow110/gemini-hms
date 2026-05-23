import { Injectable, BadRequestException } from '@nestjs/common';

export interface BedAllocation {
  tenantId: string;
  branchId: string;
  bedId: string;
  patientId: string;
  wardId: string;
  bedNumber: string;
  assignedAt: string;
}

@Injectable()
export class BedManagementService {
  private allocations: Map<string, BedAllocation> = new Map();

  async assignBed(
    tenantId: string,
    branchId: string,
    patientId: string,
    wardId: string,
    bedNumber: string,
  ): Promise<BedAllocation> {
    if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException(
        'In-memory bed management is disabled in production.',
      );
    }
    const scopedBedId = `${tenantId}:${branchId}:${wardId}-${bedNumber}`;

    // Verify bed occupancy limits
    if (this.allocations.has(scopedBedId)) {
      throw new BadRequestException(
        `Bed ${bedNumber} in ward ${wardId} is already occupied.`,
      );
    }

    // Verify patient is not already assigned to a bed within the tenant
    for (const alloc of this.allocations.values()) {
      if (alloc.tenantId === tenantId && alloc.patientId === patientId) {
        throw new BadRequestException(
          `Patient ${patientId} is already assigned to a bed.`,
        );
      }
    }

    const allocation: BedAllocation = {
      tenantId,
      branchId,
      bedId: scopedBedId,
      patientId,
      wardId,
      bedNumber,
      assignedAt: new Date().toISOString(),
    };

    this.allocations.set(scopedBedId, allocation);
    return allocation;
  }

  async releaseBed(
    tenantId: string,
    branchId: string,
    bedId: string, // Actually the wardId-bedNumber combo sent from client
  ): Promise<{ released: boolean; bedId: string }> {
    if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException(
        'In-memory bed management is disabled in production.',
      );
    }
    const scopedBedId = `${tenantId}:${branchId}:${bedId}`;
    if (!this.allocations.has(scopedBedId)) {
      throw new BadRequestException(
        `Bed allocation not found or already vacant.`,
      );
    }

    this.allocations.delete(scopedBedId);
    return { released: true, bedId };
  }

  async getBedOccupancy(tenantId: string, branchId: string) {
    if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException(
        'In-memory bed management is disabled in production.',
      );
    }
    const activeAllocations = Array.from(this.allocations.values()).filter(
      (alloc) => alloc.tenantId === tenantId && alloc.branchId === branchId,
    );
    const totalBeds = 150;
    const occupiedBeds = activeAllocations.length;

    return {
      totalCapacity: totalBeds,
      occupiedCount: occupiedBeds,
      occupancyRate: occupiedBeds / totalBeds,
      activeAllocations,
    };
  }
}
