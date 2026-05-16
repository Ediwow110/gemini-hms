import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsNotEmpty()
  @IsUUID()
  patientId: string;

  @IsNotEmpty()
  @IsUUID()
  doctorId: string;

  @IsNotEmpty()
  @IsUUID()
  departmentId: string;

  @IsNotEmpty()
  @IsUUID()
  branchId: string;

  @IsNotEmpty()
  @IsDateString()
  appointmentDate: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
