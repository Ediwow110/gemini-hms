declare class OrderItemDto {
    serviceName: string;
    price: number;
    quantity: number;
}
export declare class CreateOrderDto {
    patientId: string;
    branchId: string;
    items: OrderItemDto[];
}
export {};
