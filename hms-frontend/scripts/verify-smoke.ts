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
  if (fs.existsSync(VITE_CACHE_DIR)) {
    fs.rmSync(VITE_CACHE_DIR, { recursive: true, force: true });
  }
}

async function waitForServer(url: string, timeoutMs = 30000): Promise<void> {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      if (Date.now() - startTime > timeoutMs) {
        reject(new Error(`Timeout waiting for server at ${url}`));
        return;
      }
      http
        .get(url, (res) => {
          if (res.statusCode && res.statusCode < 500) {
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

function runSmokeSuite(): boolean {
  const result = spawnSync(
    'npx',
    ['playwright', 'test', 'e2e/production-readiness-smoke.spec.ts'],
    {
      cwd: FRONTEND_DIR,
      stdio: 'inherit',
      shell: true,
    },
  );
  return result.status === 0;
}

function terminateProcessTree(pid: number) {
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/F', '/T', '/PID', pid.toString()], { shell: true });
  } else {
    try {
      process.kill(-pid, 'SIGTERM');
    } catch {
      try {
        process.kill(pid, 'SIGTERM');
      } catch {
        // ignore
      }
    }
  }
}

async function isBackendUp(): Promise<boolean> {
  return new Promise((resolve) => {
    http
      .get('http://localhost:3000/health', (res) => {
        resolve(res.statusCode === 200);
      })
      .on('error', () => resolve(false));
  });
}

async function main() {
  deleteViteCache();

  const BACKEND_DIR = path.resolve(FRONTEND_DIR, '../hms-backend');
  let backendProcess: ChildProcess | null = null;
  const backendAlreadyUp = await isBackendUp();

  if (!backendAlreadyUp) {
    backendProcess = spawn('npm', ['run', 'start:dev'], {
      cwd: BACKEND_DIR,
      shell: true,
    });
    await waitForServer('http://localhost:3000/health', 90000);
  }

  const viteBin = path.join(FRONTEND_DIR, 'node_modules', 'vite', 'bin', 'vite.js');
  const viteProcess = spawn('node', [viteBin], {
    cwd: FRONTEND_DIR,
    shell: false,
    detached: process.platform !== 'win32',
  });

  await waitForServer('http://localhost:5173', 45000);
  const smokePassed = runSmokeSuite();

  if (viteProcess.pid) {
    terminateProcessTree(viteProcess.pid);
  }
  if (backendProcess?.pid) {
    terminateProcessTree(backendProcess.pid);
  }

  if (!smokePassed) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Smoke verification failed:', err);
  process.exit(1);
});