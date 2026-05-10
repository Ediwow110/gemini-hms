import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';
import { AuditService } from '../audit/audit.service';
import { NumberingService } from '../numbering/numbering.service';
export declare class PatientsService {
    private prisma;
    private audit;
    private numbering;
    constructor(prisma: PrismaService, audit: AuditService, numbering: NumberingService);
    create(tenantId: string, userId: string, dto: CreatePatientDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        firstName: string;
        lastName: string;
        dob: Date;
        patientNumber: string;
    }>;
    findAll(tenantId: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        firstName: string;
        lastName: string;
        dob: Date;
        patientNumber: string;
    }[]>;
    findOne(tenantId: string, id: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        firstName: string;
        lastName: string;
        dob: Date;
        patientNumber: string;
    }>;
    update(tenantId: string, userId: string, id: string, dto: UpdatePatientDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        firstName: string;
        lastName: string;
        dob: Date;
        patientNumber: string;
    }>;
}
