import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class PhiMaskingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Default to true (masking enabled) if no user context is found
    let shouldMask = true;

    if (user && user.roles) {
      const roles: string[] = user.roles;
      // Super Admin, Branch Admin, and Doctor bypass masking (shouldMask = false)
      const hasClinicalBypass = roles.some((role) =>
        ['Super Admin', 'Branch Admin', 'Doctor'].includes(role),
      );
      if (hasClinicalBypass) {
        shouldMask = false;
      }
    }

    return next.handle().pipe(
      map((data) => {
        if (!shouldMask || !data) {
          return data;
        }
        return this.maskPayload(data);
      }),
    );
  }

  private maskPayload(val: any): any {
    if (val === null || val === undefined) {
      return val;
    }

    if (Array.isArray(val)) {
      return val.map((item) => this.maskPayload(item));
    }

    if (typeof val === 'object') {
      const maskedObj: Record<string, any> = {};
      for (const key of Object.keys(val)) {
        const lowerKey = key.toLowerCase();

        // 1. Mask Phone Strings
        if (
          (lowerKey.includes('phone') || lowerKey.includes('mobile') || lowerKey.includes('contact')) &&
          typeof val[key] === 'string'
        ) {
          const str = val[key];
          maskedObj[key] = str.length >= 7
            ? str.substring(0, 4) + '****' + str.substring(str.length - 3)
            : '****';
        }
        // 2. Mask Address Strings
        else if (
          (lowerKey.includes('address') || lowerKey.includes('street')) &&
          typeof val[key] === 'string'
        ) {
          maskedObj[key] = 'CONFIDENTIAL - RESTRICTED ACCESS';
        }
        // 3. Mask Dates of Birth (expose year only, reset month/day to Jan 1st)
        else if (
          (lowerKey === 'dob' || lowerKey.includes('birthdate') || lowerKey.includes('dateofbirth')) &&
          val[key]
        ) {
          const d = new Date(val[key]);
          if (!isNaN(d.getTime())) {
            maskedObj[key] = `${d.getFullYear()}-01-01`;
          } else {
            maskedObj[key] = val[key];
          }
        }
        // 4. Mask Diagnoses or Clinical Notes in administrative payloads
        else if (
          (lowerKey === 'notes' || lowerKey === 'chiefcomplaint' || lowerKey === 'description' || lowerKey.includes('diagnosis')) &&
          typeof val[key] === 'string'
        ) {
          maskedObj[key] = 'RESTRICTED PHI';
        }
        // 5. Recursively traverse child objects/arrays
        else {
          maskedObj[key] = this.maskPayload(val[key]);
        }
      }
      return maskedObj;
    }

    return val;
  }
}
