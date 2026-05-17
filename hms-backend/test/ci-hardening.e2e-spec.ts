import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('CI/CD Hardening (e2e)', () => {
  it('should verify that npm audit passes without critical vulnerabilities', () => {
    // Run npm audit at the backend level
    const backendPath = path.resolve(__dirname, '../');
    let auditPassed = true;
    try {
      execSync('npm audit --audit-level=critical', { cwd: backendPath, stdio: 'pipe' });
    } catch (error: any) {
      // If there are critical vulnerabilities, npm audit exits with non-zero code
      auditPassed = false;
      console.error('Audit failed output:', error.stdout?.toString());
    }
    expect(auditPassed).toBe(true);
  });

  it('should verify that npx prisma validate passes successfully', () => {
    const backendPath = path.resolve(__dirname, '../');
    let prismaValidated = true;
    try {
      execSync('npx prisma validate', { cwd: backendPath, stdio: 'pipe' });
    } catch (error: any) {
      prismaValidated = false;
      console.error('Prisma validation failed output:', error.stderr?.toString());
    }
    expect(prismaValidated).toBe(true);
  });

  it('should verify that required production env vars are documented in .env.example', () => {
    const envExamplePath = path.resolve(__dirname, '../.env.example');
    expect(fs.existsSync(envExamplePath)).toBe(true);

    const content = fs.readFileSync(envExamplePath, 'utf8');
    
    // Core environment variables that MUST be documented
    const requiredKeys = ['DATABASE_URL', 'JWT_SECRET'];
    
    requiredKeys.forEach((key) => {
      expect(content).toContain(key);
    });
  });
});
