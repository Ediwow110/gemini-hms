import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto, ReceiveStockDto } from './dto/inventory.dto';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    getCatalog(tenantId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        price: import("@prisma/client-runtime-utils").Decimal;
        sku: string | null;
        category: string;
        unit: string;
        reorderLevel: number;
        currentStock: number;
    }[]>;
    createItem(tenantId: string, userId: string, dto: CreateInventoryItemDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        price: import("@prisma/client-runtime-utils").Decimal;
        sku: string | null;
        category: string;
        unit: string;
        reorderLevel: number;
        currentStock: number;
    }>;
    receiveStock(tenantId: string, userId: string, id: string, dto: ReceiveStockDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        price: import("@prisma/client-runtime-utils").Decimal;
        sku: string | null;
        category: string;
        unit: string;
        reorderLevel: number;
        currentStock: number;
    }>;
    getLogs(tenantId: string, id: string): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        quantity: number;
        remarks: string | null;
        type: string;
        inventoryItemId: string;
        previousStock: number;
        newStock: number;
        referenceType: string | null;
        referenceId: string | null;
    }[]>;
    dispenseStock(tenantId: string, userId: string, id: string, quantity: number, orderId?: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        price: import("@prisma/client-runtime-utils").Decimal;
        sku: string | null;
        category: string;
        unit: string;
        reorderLevel: number;
        currentStock: number;
    }>;
    getLowStockAlerts(tenantId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        price: import("@prisma/client-runtime-utils").Decimal;
        sku: string | null;
        category: string;
        unit: string;
        reorderLevel: number;
        currentStock: number;
    }[]>;
}
