import { Injectable, BadRequestException } from '@nestjs/common';

export interface BedAllocation {
  bedId: string;
  patientId: string;
  wardId: string;
  bedNumber: string;
  assignedAt: string;
}

@Injectable()
export class BedManagementService {
  private allocations: Map<string, BedAllocation> = new Map();

  async assignBed(patientId: string, wardId: string, bedNumber: string): Promise<BedAllocation> {
    const bedId = `${wardId}-${bedNumber}`;

    // Verify bed occupancy limits
    if (this.allocations.has(bedId)) {
      throw new BadRequestException(`Bed ${bedNumber} in ward ${wardId} is already occupied.`);
    }

    // Verify patient is not already assigned to a bed
    for (const alloc of this.allocations.values()) {
      if (alloc.patientId === patientId) {
        throw new BadRequestException(`Patient ${patientId} is already assigned to a bed.`);
      }
    }

    const allocation: BedAllocation = {
      bedId,
      patientId,
      wardId,
      bedNumber,
      assignedAt: new Date().toISOString(),
    };

    this.allocations.set(bedId, allocation);
    return allocation;
  }

  async releaseBed(bedId: string): Promise<{ released: boolean; bedId: string }> {
    if (!this.allocations.has(bedId)) {
      throw new BadRequestException(`Bed allocation not found or already vacant.`);
    }

    this.allocations.delete(bedId);
    return { released: true, bedId };
  }

  async getBedOccupancy() {
    const activeAllocations = Array.from(this.allocations.values());
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
