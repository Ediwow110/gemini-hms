import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class PhiMaskingInterceptor implements NestInterceptor {
  private maskedFields = [
    'password', 'passwordHash', 'otp', 'pin', 'medicalHistory', 
    'diagnosis', 'labResultValue', 'prescriptionDetails', 'ssn', 'philhealthId'
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map(data => this.mask(data)));
  }

  private mask(data: any): any {
    if (!data) return data;
    if (Array.isArray(data)) return data.map(item => this.mask(item));
    if (typeof data !== 'object') return data;

    const masked = { ...data };
    for (const key in masked) {
      if (this.maskedFields.includes(key)) {
        masked[key] = '***MASKED***';
      } else if (typeof masked[key] === 'object') {
        masked[key] = this.mask(masked[key]);
      }
    }
    return masked;
  }
}
