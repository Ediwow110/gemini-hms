export declare class CreateDepartmentDto {
    name: string;
    code: string;
}
export declare class CreateEmployeeDto {
    firstName: string;
    lastName: string;
    jobTitle: string;
    departmentId?: string;
    joiningDate: string;
    salary: number;
}
export declare class CreatePayslipDto {
    employeeId: string;
    periodStart: string;
    periodEnd: string;
    totalAllowances: number;
    totalDeductions: number;
}
