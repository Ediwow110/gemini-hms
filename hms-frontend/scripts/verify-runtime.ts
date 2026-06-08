import { spawn, spawnSync, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRONTEND_DIR = path.resolve(__dirname, '..');
const VITE_CACHE_DIR = path.join(FRONTEND_DIR, 'node_modules', '.vite');

function deleteViteCache() {
  console.log('Cleaning Vite cache...');
  if (fs.existsSync(VITE_CACHE_DIR)) {
    try {
      fs.rmSync(VITE_CACHE_DIR, { recursive: true, force: true });
      console.log('Vite dependency cache cleared successfully.');
    } catch (error) {
      console.warn(`Warning: Could not clear Vite cache folder: ${error}`);
    }
  } else {
    console.log('Vite cache folder does not exist. Skipping clean.');
  }
}

async function waitForServer(url: string, timeoutMs = 30000): Promise<void> {
  const startTime = Date.now();
  console.log(`Waiting for Vite dev server at ${url}...`);
  return new Promise((resolve, reject) => {
    const check = () => {
      if (Date.now() - startTime > timeoutMs) {
        reject(new Error(`Timeout waiting for dev server at ${url}`));
        return;
      }
      http
        .get(url, (res) => {
          if (res.statusCode && res.statusCode < 500) {
            console.log('Vite dev server is reachable and active.');
            resolve();
          } else {
            setTimeout(check, 1000);
          }
        })
        .on('error', () => {
          setTimeout(check, 1000);
        });
    };
    check();
  });
}

function runVerification(): boolean {
  console.log('Running Playwright dashboard route smoke checks...');
  const result = spawnSync(
    'npx',
    ['playwright', 'test', 'e2e/runtime-qa-quick.spec.ts', '-g', 'render for key roles'],
    {
      cwd: FRONTEND_DIR,
      stdio: 'inherit',
      shell: true,
    }
  );
  return result.status === 0;
}

function terminateProcessTree(pid: number) {
  console.log(`Stopping dev server (PID: ${pid})...`);
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/F', '/T', '/PID', pid.toString()], { shell: true });
  } else {
    try {
      process.kill(-pid, 'SIGTERM');
    } catch {
      try {
        process.kill(pid, 'SIGTERM');
      } catch (err) {
        console.warn(`Failed to stop pid ${pid}: ${err}`);
      }
    }
  }
}

async function isBackendUp(): Promise<boolean> {
  return new Promise((resolve) => {
    http.get('http://localhost:3000/health', (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

async function main() {
  deleteViteCache();

  const BACKEND_DIR = path.resolve(FRONTEND_DIR, '../hms-backend');
  let backendProcess: ChildProcess | null = null;
  const backendAlreadyUp = await isBackendUp();

  if (!backendAlreadyUp) {
    console.log('Backend not detected. Starting backend server dynamically...');
    backendProcess = spawn('npm', ['run', 'start:dev'], {
      cwd: BACKEND_DIR,
      shell: true,
    });
    
    backendProcess.stdout?.on('data', (data: Buffer | string) => {
      const output = data.toString();
      if (output.includes('running on port') || output.includes('mapped')) {
        console.log(`[Backend Server]: ${output.trim()}`);
      }
    });

    backendProcess.stderr?.on('data', (data: Buffer | string) => {
      console.error(`[Backend Error]: ${data.toString().trim()}`);
    });

    console.log('Waiting for backend server to be ready...');
    try {
      await waitForServer('http://localhost:3000/health', 90000);
      console.log('Backend server is ready.');
    } catch (e) {
      console.error('Backend server failed to start within timeout.');
      if (backendProcess.pid) {
        terminateProcessTree(backendProcess.pid);
      }
      throw e;
    }
  } else {
    console.log('Existing backend server detected at http://localhost:3000.');
  }

  console.log('Starting Vite dev server...');
  const viteBin = path.join(FRONTEND_DIR, 'node_modules', 'vite', 'bin', 'vite.js');
  const viteProcess = spawn('node', [viteBin], {
    cwd: FRONTEND_DIR,
    shell: false,
    detached: process.platform !== 'win32', // detached on Unix to allow group kill
  });

  viteProcess.stdout?.on('data', (data) => {
    const output = data.toString();
    if (output.includes('ready in') || output.includes('Local:')) {
      console.log(`[Vite Server]: ${output.trim()}`);
    }
  });

  viteProcess.stderr?.on('data', (data) => {
    console.error(`[Vite Error]: ${data.toString().trim()}`);
  });

  let success = false;
  try {
    await waitForServer('http://localhost:5173', 45000);
    success = runVerification();
  } catch (error) {
    console.error('Runtime verification orchestration failed:', error);
  } finally {
    if (viteProcess.pid) {
      terminateProcessTree(viteProcess.pid);
    }
    if (backendProcess && backendProcess.pid) {
      console.log('Stopping dynamically started backend server...');
      terminateProcessTree(backendProcess.pid);
    }
  }

  if (success) {
    console.log('\n=============================================');
    console.log('🎉 RUNTIME VERIFICATION SUCCESSFUL!');
    console.log('=============================================\n');
    process.exit(0);
  } else {
    console.error('\n=============================================');
    console.error('❌ RUNTIME VERIFICATION FAILED!');
    console.error('=============================================\n');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unhandled verification error:', err);
  process.exit(1);
});
