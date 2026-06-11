import { test, expect } from '@playwright/test';

const baseURL = process.env.STAGING_URL;

test.describe('Parallel Mutation Stress (Concurrency Verification)', () => {
  // Guard for live staging environment
  test.skip(!baseURL, 'Requires live staging environment (STAGING_URL)');

  test('Double-Payment Prevention: Simultaneous requests for same invoice', async ({ request }) => {
    // Setup: Retrieve a pending invoice ID (mocked for planning/scripting)
    const invoiceId = 'staging-test-invoice-id';
    
    console.log(`Executing concurrent payment stress on invoice: ${invoiceId}`);

    // Simulate two cashiers attempting to pay the exact same invoice at the exact same millisecond
    const [response1, response2] = await Promise.all([
      request.post(`${baseURL}/api/v1/billing/payments`, { 
        data: { 
          invoiceId, 
          amount: 100,
          paymentMethod: 'CASH',
          idempotencyKey: `stress-key-1-${Date.now()}`
        } 
      }),
      request.post(`${baseURL}/api/v1/billing/payments`, { 
        data: { 
          invoiceId, 
          amount: 100,
          paymentMethod: 'CASH',
          idempotencyKey: `stress-key-2-${Date.now()}`
        } 
      })
    ]);

    const statuses = [response1.status(), response2.status()].sort();
    
    // Expect exactly one to succeed and one to fail with 409 Conflict (or 400 if state check triggers first)
    // The backend uses row-level locking to ensure only one payment can progress
    expect(statuses[0]).toBeGreaterThanOrEqual(200);
    expect(statuses[0]).toBeLessThan(300);
    expect(statuses[1]).toBe(409); 
    
    console.log(`Concurrency result: Success=${statuses[0]}, Failure=${statuses[1]}`);
  });

  test('Encounter Conflict: Simultaneous updates to same SOAP note', async ({ request }) => {
    const noteId = 'staging-test-note-id';
    const originalVersion = 1;

    console.log(`Executing concurrent SOAP update stress on note: ${noteId}`);

    // Simulate two doctors attempting to save changes to the same clinical note
    // Backend uses optimistic locking (version field)
    const [response1, response2] = await Promise.all([
      request.patch(`${baseURL}/api/v1/clinical/notes/${noteId}`, {
        data: { content: 'Update from Doctor A', version: originalVersion }
      }),
      request.patch(`${baseURL}/api/v1/clinical/notes/${noteId}`, {
        data: { content: 'Update from Doctor B', version: originalVersion }
      })
    ]);

    const statuses = [response1.status(), response2.status()].sort();

    // Exactly one must succeed (version increments), the other must fail (version mismatch)
    expect(statuses[0]).toBe(200);
    expect(statuses[1]).toBe(409);

    console.log(`Optimistic locking result: Success=${statuses[0]}, Failure=${statuses[1]}`);
  });
});
