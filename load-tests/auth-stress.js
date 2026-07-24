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
const TENANT_CODE = __ENV.TENANT_CODE || 'Central Hospital (Main Branch)';

export default function () {
  const loginPayload = JSON.stringify({
    tenantCode: TENANT_CODE,
    email: 'admin@hospital.com',
    password: 'Password123!',
  });

  // 1. Login (sets access_token, refresh_token, session_id, csrf_token cookies)
  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  const loginSuccess = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'auth cookies set': (r) => r.cookies.access_token && r.cookies.access_token.length > 0,
  });

  if (loginSuccess) {
    const csrfToken = loginRes.json().csrfToken;

    const authParams = {
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
    };

    // 2. Fetch Profile
    const profileRes = http.get(`${BASE_URL}/api/v1/auth/me`, authParams);
    check(profileRes, {
      'profile status is 200': (r) => r.status === 200,
      'has user data': (r) => r.json().id !== undefined,
    });

    sleep(1);

    // 3. Logout
    const logoutRes = http.post(`${BASE_URL}/api/v1/auth/logout`, null, authParams);
    check(logoutRes, {
      'logout status is 204': (r) => r.status === 204,
    });
  }

  sleep(1);
}
