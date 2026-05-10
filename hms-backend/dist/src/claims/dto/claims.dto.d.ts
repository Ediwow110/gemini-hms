export declare class CreateClaimDto {
    hmoPartnerId: string;
    invoiceId: string;
    loaNumber: string;
    amountClaimed: number;
}
export declare class UpdateClaimStatusDto {
    status: string;
    amountApproved?: number;
    remarks?: string;
}
