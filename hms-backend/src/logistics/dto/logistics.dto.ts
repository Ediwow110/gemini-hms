import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import {
  ShipmentStatus,
  DeliveryJobStatus,
  InstallStatus,
} from '@prisma/client';

export class CreateShipmentDto {
  @IsUUID()
  salesOrderId: string;

  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @IsString()
  @IsOptional()
  carrier?: string;
}

export class UpdateShipmentStatusDto {
  @IsEnum(ShipmentStatus)
  status: ShipmentStatus;

  @IsString()
  @IsOptional()
  note?: string;
}

export class CreateDeliveryJobDto {
  @IsUUID()
  shipmentId: string;

  @IsUUID()
  assignedUserId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateDeliveryJobStatusDto {
  @IsEnum(DeliveryJobStatus)
  status: DeliveryJobStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateInstallationJobStatusDto {
  @IsEnum(InstallStatus)
  status: InstallStatus;

  @IsString()
  @IsOptional()
  note?: string;
}
