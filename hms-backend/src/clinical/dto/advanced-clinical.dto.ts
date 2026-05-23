import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';

export class ScreenInteractionsDto {
  @IsUUID('4')
  @IsNotEmpty()
  patientId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsString({ each: true })
  medications: string[];
}

export class AssignBedDto {
  @IsUUID('4')
  @IsNotEmpty()
  patientId: string;

  @IsString()
  @IsNotEmpty()
  wardId: string;

  @IsString()
  @IsNotEmpty()
  bedNumber: string;
}
