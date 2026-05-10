import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';
export declare class PatientsController {
    private readonly patientsService;
    constructor(patientsService: PatientsService);
    create(tenantId: string, userId: string, createPatientDto: CreatePatientDto): Promise<{
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
    update(tenantId: string, userId: string, id: string, updatePatientDto: UpdatePatientDto): Promise<{
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
