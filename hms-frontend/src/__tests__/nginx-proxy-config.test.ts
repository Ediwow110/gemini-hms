import { describe, it, expect } from 'vitest';
import nginxConf from '../../nginx.conf?raw';

describe('nginx proxy config', () => {
  it('rewrites /api/marketplace to /marketplace for backend parity', () => {
    expect(nginxConf).toMatch(/location\s+~\s+\^\/api\/marketplace/);
    expect(nginxConf).toContain(
      'rewrite ^/api/marketplace(.*)$ /marketplace$1 break;',
    );
    expect(nginxConf).toContain('proxy_pass http://backend:3000;');
  });

  it('rewrites /api/metrics and /api/ledger paths like vite dev proxy', () => {
    expect(nginxConf).toContain('rewrite ^/api/metrics(.*)$ /metrics$1 break;');
    expect(nginxConf).toContain('rewrite ^/api/ledger(.*)$ /ledger$1 break;');
  });

  it('proxies standard /api/ routes to backend', () => {
    expect(nginxConf).toContain('location /api/ {');
    expect(nginxConf).toContain('proxy_pass http://backend:3000/api/;');
  });
});