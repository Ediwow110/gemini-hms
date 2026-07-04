import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import * as crypto from 'crypto';

export interface RequestContextData {
  requestId: string;
  method: string;
  path: string;
  ip: string;
  userId?: string;
  tenantId?: string;
  startTime: number;
}

@Injectable()
export class RequestContextService implements OnModuleDestroy {
  private readonly als = new AsyncLocalStorage<RequestContextData>();

  getStore(): RequestContextData | undefined {
    return this.als.getStore();
  }

  getRequestId(): string {
    return this.als.getStore()?.requestId ?? 'no-request-id';
  }

  run(data: Omit<RequestContextData, 'startTime'>, cb: () => void): void {
    this.als.run({ ...data, startTime: Date.now() }, cb);
  }

  onModuleDestroy() {
    this.als.disable();
  }
}
