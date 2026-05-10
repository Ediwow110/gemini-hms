export declare class CreateInventoryItemDto {
    name: string;
    sku?: string;
    category: string;
    unit: string;
    reorderLevel: number;
    price: number;
}
export declare class ReceiveStockDto {
    quantity: number;
    remarks?: string;
    supplierName?: string;
}
