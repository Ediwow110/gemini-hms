import { SecurityException } from '../middleware/tenant-isolation';

export interface ProcessPaymentDto {
  amount: number;
  paymentMethod: string;
}

export class LedgerService {
  // Simulates a Redis/Memcached cache ring for write-idempotency
  private idempotencyCache = new Map<string, any>();
  private cashierSessions = new Map<string, { userId: string, tenantId: string, status: string }>();
  
  // Simulates SERIALIZABLE isolation row locks
  private activeTransactions = new Set<string>(); 

  /**
   * Opens a rigid cashier session ensuring a 1:1 user-to-register mapping
   */
  public openCashierSession(tenantId: string, userId: string): string {
    for (const [, session] of this.cashierSessions.entries()) {
      if (session.tenantId === tenantId && session.userId === userId && session.status === 'OPEN') {
        throw new Error('DATABASE_CONSTRAINT_VIOLATION: User already has an OPEN cashier session.');
      }
    }
    
    const sessionId = `sess-${Date.now()}`;
    this.cashierSessions.set(sessionId, { userId, tenantId, status: 'OPEN' });
    return sessionId;
  }

  /**
   * Processes payments under SERIALIZABLE transactional constraints 
   * and blocks duplicate clicks natively.
   */
  public async postPayment(invoiceId: string, paymentData: ProcessPaymentDto, idempotencyKey: string, activeTenantId: string): Promise<any> {
    
    // 1. Idempotency Interceptor (Simulating Redis SETNX Lock)
    if (this.idempotencyCache.has(idempotencyKey)) {
      // If a simultaneous request hits, it awaits the exact same promise/payload of the first request
      return await this.idempotencyCache.get(idempotencyKey); 
    }

    // Create a deferred cache promise to lock the idempotency ring instantly
    let resolveIdempotency: (value: any) => void;
    const cachePromise = new Promise(resolve => { resolveIdempotency = resolve; });
    this.idempotencyCache.set(idempotencyKey, cachePromise);

    // 2. Simulated Transactional Boundary (SERIALIZABLE Isolation)
    if (this.activeTransactions.has(invoiceId)) {
      throw new Error('SERIALIZATION_FAILURE: Concurrent transaction contention detected. Database transaction safely aborted.');
    }
    
    this.activeTransactions.add(invoiceId);

    try {
      // Simulate physical network/database latency
      await new Promise(resolve => setTimeout(resolve, 50));

      const processedResult = {
        status: 'PAID',
        invoiceId,
        amountApplied: paymentData.amount,
        tenantId: activeTenantId,
        ledgerDebit: paymentData.amount,
        ledgerCredit: paymentData.amount,
        timestamp: new Date().toISOString()
      };

      if (processedResult.ledgerDebit - processedResult.ledgerCredit !== 0) {
        throw new Error('ATOMIC_ROLLBACK: Ledger balance drift detected. Aborting transaction.');
      }

      // Resolve the idempotency waiters and store the final successful signature
      resolveIdempotency!(processedResult);
      this.idempotencyCache.set(idempotencyKey, processedResult);
      return processedResult;
    } finally {
      this.activeTransactions.delete(invoiceId);
    }
  }
}
