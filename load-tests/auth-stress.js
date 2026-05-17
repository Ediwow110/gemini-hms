import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    auth_stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 1000 }, // ramp up to 1000 VUs
        { duration: '3m', target: 1000 }, // hold at 1000 VUs
        { duration: '1m', target: 0 },    // ramp down to 0 VUs
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // p95 latency must be under 500ms
    http_req_failed: ['rate<0.01'],    // error rate must be under 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TENANT_ID = __ENV.TENANT_ID || '00000000-0000-0000-0000-00000000000e';

export default function () {
  const loginPayload = JSON.stringify({
    tenantId: TENANT_ID,
    email: 'admin@hospital.com',
    password: 'Password123!',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': TENANT_ID,
    },
  };

  // 1. Login
  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, loginPayload, params);
  const loginSuccess = check(loginRes, {
    'login status is 201': (r) => r.status === 201,
    'has access token': (r) => r.json().accessToken !== undefined,
  });

  if (loginSuccess) {
    const token = loginRes.json().accessToken;
    const authParams = {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': TENANT_ID,
        'Authorization': `Bearer ${token}`,
      },
    };

    // 2. Fetch Profile
    const profileRes = http.get(`${BASE_URL}/api/v1/auth/profile`, authParams);
    check(profileRes, {
      'profile status is 200': (r) => r.status === 200,
    });

    sleep(1);

    // 3. Logout
    const logoutRes = http.post(`${BASE_URL}/api/v1/auth/logout`, null, authParams);
    check(logoutRes, {
      'logout status is 201': (r) => r.status === 201 || r.status === 200,
    });
  }

  sleep(1);
}
