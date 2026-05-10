import { HrService } from './hr.service';
import { CreateEmployeeDto, CreateDepartmentDto, CreatePayslipDto } from './dto/hr.dto';
export declare class HrController {
    private readonly hrService;
    constructor(hrService: HrService);
    getDepartments(tenantId: string): Promise<({
        _count: {
            employees: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        code: string;
    })[]>;
    createDepartment(tenantId: string, userId: string, dto: CreateDepartmentDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        code: string;
    }>;
    getEmployees(tenantId: string): Promise<({
        department: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            code: string;
        } | null;
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        firstName: string;
        lastName: string;
        jobTitle: string;
        departmentId: string | null;
        joiningDate: Date;
        salary: import("@prisma/client-runtime-utils").Decimal;
        employeeNumber: string;
    })[]>;
    createEmployee(tenantId: string, userId: string, dto: CreateEmployeeDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        firstName: string;
        lastName: string;
        jobTitle: string;
        departmentId: string | null;
        joiningDate: Date;
        salary: import("@prisma/client-runtime-utils").Decimal;
        employeeNumber: string;
    }>;
    generatePayslip(tenantId: string, userId: string, dto: CreatePayslipDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        tenantId: string;
        employeeId: string;
        periodStart: Date;
        periodEnd: Date;
        totalAllowances: import("@prisma/client-runtime-utils").Decimal;
        totalDeductions: import("@prisma/client-runtime-utils").Decimal;
        basicSalary: import("@prisma/client-runtime-utils").Decimal;
        netSalary: import("@prisma/client-runtime-utils").Decimal;
    }>;
}
