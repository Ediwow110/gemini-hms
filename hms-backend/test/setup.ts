import * as dotenv from 'dotenv';
import * as path from 'path';

// Force load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-e2e-tests-that-is-long-enough';
process.env.REGION_HEALTH_ENABLED = 'true';
