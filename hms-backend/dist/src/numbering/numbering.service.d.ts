import { PrismaService } from '../prisma/prisma.service';
export declare class NumberingService {
    private prisma;
    constructor(prisma: PrismaService);
    generateNumber(tenantId: string, entityType: string, branchId?: string): Promise<string>;
}
