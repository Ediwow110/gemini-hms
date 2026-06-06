import axios from 'axios';

let csrfToken: string | null = null;

export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

export function getCsrfToken(): string | null {
  return csrfToken;
}

const UNSAFE_METHODS = ['post', 'put', 'patch', 'delete'];

export const apiClient = axios.create({
  // apiClient baseURL includes `/api`; service methods should call `/v1/...`
  // Use relative URL in dev to go through Vite proxy; absolute in prod
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (config.method && UNSAFE_METHODS.includes(config.method)) {
    const token = getCsrfToken();
    if (token) {
      config.headers['X-CSRF-Token'] = token;
    }
  }
  return config;
});

apiClient.interceptors.response.use((response) => {
  if (response.data?.csrfToken) {
    setCsrfToken(response.data.csrfToken);
  }
  return response;
});
