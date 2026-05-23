import { Expose } from 'class-transformer';

export class LabParameterDefinitionDto {
  @Expose()
  parameterName: string;

  @Expose()
  code: string;

  @Expose()
  unit?: string;

  @Expose()
  referenceRangeText?: string;

  @Expose()
  minNormal?: number;

  @Expose()
  maxNormal?: number;

  @Expose()
  minCritical?: number;

  @Expose()
  maxCritical?: number;

  @Expose()
  valueType: string = 'NUMERIC';

  @Expose()
  allowedValues?: string;

  @Expose()
  isRequired: boolean = true;

  @Expose()
  displayOrder: number = 0;
}
