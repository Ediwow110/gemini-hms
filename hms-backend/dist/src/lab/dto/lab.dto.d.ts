export declare class EncodeLabResultDto {
    results: Record<string, any>;
    remarks?: string;
}
export declare class ApproveLabResultDto {
    pathologistRemarks?: string;
}
export declare class AmendLabResultDto {
    newResults?: Record<string, any>;
    reason: string;
}
