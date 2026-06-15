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
    const patientUser = request.patientUser;

    // Default to true (masking enabled) if no user context is found
    let shouldMask = true;

    // Bypass masking for Patient Portal users viewing their own data
    if (patientUser) {
      shouldMask = false;
    } else if (user && user.roles) {
      const roles: string[] = user.roles;
      // Super Admin, Branch Admin, Doctor, Nurse, and Cashier bypass masking
      const hasClinicalBypass = roles.some((role) =>
        ['Super Admin', 'Branch Admin', 'Doctor', 'Nurse', 'Cashier'].includes(
          role,
        ),
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

        // 0. Exempt technical metadata, codes, and identifiers
        if (
          lowerKey === 'id' ||
          lowerKey.endsWith('id') ||
          lowerKey.endsWith('code') ||
          lowerKey === 'status' ||
          lowerKey === 'version' ||
          lowerKey === 'type' ||
          lowerKey === 'createdat' ||
          lowerKey === 'updatedat'
        ) {
          maskedObj[key] = val[key];
          continue;
        }

        // 1. Mask Phone Strings
        if (
          (lowerKey === 'phone' ||
            lowerKey === 'phonenumber' ||
            lowerKey === 'mobile' ||
            lowerKey === 'mobilenumber' ||
            lowerKey === 'contact' ||
            lowerKey === 'contactnumber') &&
          typeof val[key] === 'string'
        ) {
          const str = val[key];
          maskedObj[key] =
            str.length >= 7
              ? str.substring(0, 4) + '****' + str.substring(str.length - 3)
              : '****';
        }
        // 2. Mask Address and Identity Strings
        else if (
          (lowerKey === 'address' ||
            lowerKey === 'street' ||
            lowerKey === 'email' ||
            lowerKey === 'patientname' ||
            lowerKey === 'fullname' ||
            lowerKey === 'firstname' ||
            lowerKey === 'lastname') &&
          typeof val[key] === 'string'
        ) {
          maskedObj[key] = 'CONFIDENTIAL - RESTRICTED ACCESS';
        }
        // 3. Mask Dates of Birth (expose year only, reset month/day to Jan 1st)
        else if (
          (lowerKey === 'dob' ||
            lowerKey === 'birthdate' ||
            lowerKey === 'dateofbirth') &&
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
          new Set([
            'notes',
            'clinicalnotes',
            'chiefcomplaint',
            'historyofpresentillness',
            'assessment',
            'plan',
            'remarks',
            'resultvalues',
            'diagnosis',
            'diagnoses',
            'description',
          ]).has(lowerKey) &&
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
