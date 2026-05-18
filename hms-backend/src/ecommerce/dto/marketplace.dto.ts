export class CreateCartItemDto {
  itemId!: string;
  quantity!: number;
}

export class SubmitOrderDto {
  cartItems!: CreateCartItemDto[];
  purchaseOrderNumber?: string;
}

export class ApproveOrderDto {
  orderId!: string;
  purchaseOrderNumber!: string;
  creditPoolId?: string;
}

export class CreateRFQDto {
  itemId!: string;
  warrantyTier!: '1-Year' | '5-Year' | 'Lifetime';
  siteReadinessDetails!: string;
  leasingOption?: string;
}

export class CourierTelemetryPayload {
  orderId!: string;
  currentTemperature!: number;
  latitude!: number;
  longitude!: number;
  timestamp!: string;
}
