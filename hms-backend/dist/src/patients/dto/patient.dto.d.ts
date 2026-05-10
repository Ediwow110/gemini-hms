export declare class CreatePatientDto {
    firstName: string;
    lastName: string;
    dob: string;
    contactNumber?: string;
    address?: string;
    gender?: string;
}
export declare class UpdatePatientDto {
    firstName?: string;
    lastName?: string;
    dob?: string;
    contactNumber?: string;
    status?: string;
}
