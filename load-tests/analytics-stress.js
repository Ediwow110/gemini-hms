import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    analytics_stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 200 }, // ramp up to 200 VUs
        { duration: '2m', target: 200 },  // hold at 200 VUs
        { duration: '30s', target: 0 },   // ramp down to 0 VUs
      ],
      gracefulRampDown: '15s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'], // p95 latency must be under 2000ms (2s)
    http_req_failed: ['rate<0.01'],     // error rate must be under 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TENANT_ID = __ENV.TENANT_ID || '00000000-0000-0000-0000-00000000000e';

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'X-Tenant-ID': TENANT_ID,
    'Authorization': `Bearer ${__ENV.AUTH_TOKEN || 'mock-analyst-token'}`,
  };

  // Run all 5 analytics requests in parallel to simulate realistic dashboard load
  const responses = http.batch([
    ['GET', `${BASE_URL}/api/v1/analytics/revenue`, null, { headers }],
    ['GET', `${BASE_URL}/api/v1/analytics/diagnoses`, null, { headers }],
    ['GET', `${BASE_URL}/api/v1/analytics/occupancy`, null, { headers }],
    ['GET', `${BASE_URL}/api/v1/analytics/wait-time`, null, { headers }],
    ['GET', `${BASE_URL}/api/v1/analytics/claim-rate`, null, { headers }],
  ]);

  check(responses[0], { 'revenue status is 200': (r) => r.status === 200 });
  check(responses[1], { 'diagnoses status is 200': (r) => r.status === 200 });
  check(responses[2], { 'occupancy status is 200': (r) => r.status === 200 });
  check(responses[3], { 'wait-time status is 200': (r) => r.status === 200 });
  check(responses[4], { 'claim-rate status is 200': (r) => r.status === 200 });

  sleep(2);
}
