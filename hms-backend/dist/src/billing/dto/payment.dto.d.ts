export declare class CreatePaymentDto {
    invoiceId: string;
    cashierSessionId: string;
    amount: number;
    paymentMethod: string;
    idempotencyKey: string;
}
export declare class OpenSessionDto {
    branchId: string;
    openingBalance: number;
}
export declare class CloseSessionDto {
    actualClosingBalance: number;
    remarks?: string;
}
