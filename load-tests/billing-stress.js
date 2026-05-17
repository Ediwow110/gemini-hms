import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    billing_stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 500 }, // ramp up to 500 VUs
        { duration: '3m', target: 500 }, // hold at 500 VUs
        { duration: '1m', target: 0 },   // ramp down to 0 VUs
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'], // p95 latency must be under 1000ms (1s)
    http_req_failed: ['rate<0.005'],    // error rate must be under 0.5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TENANT_ID = __ENV.TENANT_ID || '00000000-0000-0000-0000-00000000000e';

export default function () {
  // Setup headers with auth (mock admin key or local test auth flow)
  // For the purpose of the load test simulation, we assume authorization is provided or mocked.
  const headers = {
    'Content-Type': 'application/json',
    'X-Tenant-ID': TENANT_ID,
    'Authorization': `Bearer ${__ENV.AUTH_TOKEN || 'mock-admin-token'}`,
  };

  // 1. Create Invoice
  const invoicePayload = JSON.stringify({
    patientId: '11111111-1111-4111-8111-111111111111',
    branchId: '123e4567-e89b-12d3-a456-426614174001',
    items: [
      { catalogItemId: 'consultation-id', quantity: 1, unitPrice: 150.0 }
    ],
  });

  const invoiceRes = http.post(`${BASE_URL}/api/v1/billing/invoices`, invoicePayload, { headers });
  const invoiceCreated = check(invoiceRes, {
    'invoice status is 201': (r) => r.status === 201,
    'has invoice id': (r) => r.json().id !== undefined,
  });

  if (invoiceCreated) {
    const invoiceId = invoiceRes.json().id;

    // 2. Add Payment
    const paymentPayload = JSON.stringify({
      invoiceId: invoiceId,
      amount: 150.0,
      paymentMethod: 'CASH',
    });

    const paymentRes = http.post(`${BASE_URL}/api/v1/billing/payments`, paymentPayload, { headers });
    check(paymentRes, {
      'payment status is 201': (r) => r.status === 201,
    });

    sleep(1);

    // 3. Verify Balance
    const getInvoiceRes = http.get(`${BASE_URL}/api/v1/billing/invoices/${invoiceId}`, { headers });
    check(getInvoiceRes, {
      'get invoice status is 200': (r) => r.status === 200,
      'invoice balance is 0': (r) => r.json().outstandingBalance === 0,
    });
  }

  sleep(1);
}
