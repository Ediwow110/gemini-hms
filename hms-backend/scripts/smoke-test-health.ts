import * as speakeasy from 'speakeasy';

async function run() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('1. Logging in...');
  const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenantCode: 'Central Hospital (Main Branch)',
      email: 'admin@hospital.com',
      password: 'Admin@123'
    })
  });
  
  if (!loginRes.ok) {
    throw new Error(`Login failed: ${await loginRes.text()}`);
  }
  
  const { mfaToken, challenge } = await loginRes.json() as any;
  console.log('Login accepted, challenge:', challenge);
  
  console.log('2. Requesting MFA setup...');
  const setupRes = await fetch(`${baseUrl}/api/v1/auth/mfa/setup`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mfaToken}`
    }
  });
  
  if (!setupRes.ok) {
    throw new Error(`MFA setup failed: ${await setupRes.text()}`);
  }
  
  const { secret } = await setupRes.json() as any;
  console.log('MFA Secret retrieved:', secret);
  
  console.log('3. Generating TOTP code...');
  const code = speakeasy.totp({
    secret: secret,
    encoding: 'base32'
  });
  console.log('Generated code:', code);
  
  console.log('4. Verifying MFA code...');
  const verifyRes = await fetch(`${baseUrl}/api/v1/auth/mfa/verify`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mfaToken}`
    },
    body: JSON.stringify({ code, secret })
  });
  
  if (!verifyRes.ok) {
    throw new Error(`MFA verification failed: ${await verifyRes.text()}`);
  }
  
  const { accessToken } = await verifyRes.json() as any;
  console.log('MFA Verification successful! Access token retrieved.');
  
  console.log('5. Auditing Gateway Health...');
  const healthRes = await fetch(`${baseUrl}/api/v1/admin/health`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  if (!healthRes.ok) {
    throw new Error(`Health check failed: ${await healthRes.text()}`);
  }
  
  const healthBody = await healthRes.json();
  console.log('Health Check Response Body:', JSON.stringify(healthBody));
  process.exit(0);
}

run().catch(e => {
  console.error('Error executing smoke test:', e.message);
  process.exit(1);
});
