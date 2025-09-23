#!/usr/bin/env tsx

/**
 * Station-2100 Watchdog Script
 * Monitors the dev server and automatically restarts it if it becomes unresponsive
 * Cross-platform compatible (Windows PowerShell and Unix)
 */

import fetch from 'node-fetch';
import { spawn, exec } from 'child_process';
import { platform } from 'os';
import fs from 'fs';
import path from 'path';

const SYNC_PING_URL = 'http://localhost:8080/__sync/ping';
const CHECK_INTERVAL = 10000; // 10 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds between retries
const LOG_FILE = 'watchdog.log';

interface WatchdogLog {
  timestamp: string;
  event: 'start' | 'healthy' | 'unhealthy' | 'restart' | 'error';
  message: string;
  details?: any;
}

class Station2100Watchdog {
  private isRunning = false;
  private restartCount = 0;
  private lastHealthyTime = Date.now();

  constructor() {
    this.log('start', 'Station-2100 Watchdog started');
  }

  private log(event: WatchdogLog['event'], message: string, details?: any) {
    const logEntry: WatchdogLog = {
      timestamp: new Date().toISOString(),
      event,
      message,
      details
    };

    const logLine = `[${logEntry.timestamp}] ${event.toUpperCase()}: ${message}${details ? ` | ${JSON.stringify(details)}` : ''}\n`;
    
    // Console output with colors
    const colors = {
      start: '\x1b[36m',    // Cyan
      healthy: '\x1b[32m',  // Green
      unhealthy: '\x1b[33m', // Yellow
      restart: '\x1b[35m',  // Magenta
      error: '\x1b[31m',    // Red
      reset: '\x1b[0m'      // Reset
    };

    console.log(`${colors[event]}${logLine.trim()}${colors.reset}`);

    // Append to log file
    try {
      fs.appendFileSync(LOG_FILE, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private async checkServerHealth(): Promise<boolean> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(SYNC_PING_URL, {
          method: 'GET',
          timeout: 5000,
        });

        if (response.ok) {
          const data = await response.json() as any;
          if (data.ok) {
            this.lastHealthyTime = Date.now();
            return true;
          }
        }

        if (attempt < MAX_RETRIES) {
          this.log('unhealthy', `Attempt ${attempt}/${MAX_RETRIES} failed, retrying in ${RETRY_DELAY}ms`);
          await this.sleep(RETRY_DELAY);
        }
      } catch (error) {
        if (attempt < MAX_RETRIES) {
          this.log('unhealthy', `Attempt ${attempt}/${MAX_RETRIES} failed: ${error instanceof Error ? error.message : String(error)}`);
          await this.sleep(RETRY_DELAY);
        }
      }
    }

    return false;
  }

  private async killNodeProcesses(): Promise<void> {
    return new Promise((resolve) => {
      const isWindows = platform() === 'win32';
      
      if (isWindows) {
        // Windows: Kill node.exe and vite processes
        exec('taskkill /F /IM node.exe /T 2>nul & taskkill /F /IM vite.exe /T 2>nul', (error) => {
          // Ignore errors - processes might not exist
          resolve();
        });
      } else {
        // Unix: Kill node and vite processes
        exec('pkill -f "node.*vite" 2>/dev/null || pkill -f "vite" 2>/dev/null || true', (error) => {
          // Ignore errors - processes might not exist
          resolve();
        });
      }
    });
  }

  private async startDevServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.log('restart', `Starting dev server (restart #${++this.restartCount})`);
      
      const isWindows = platform() === 'win32';
      const command = isWindows ? 'npm.cmd' : 'npm';
      const args = ['run', 'dev'];

      const child = spawn(command, args, {
        stdio: 'pipe',
        shell: isWindows,
        detached: false
      });

      // Wait for server to start
      let serverStarted = false;
      const startTimeout = setTimeout(() => {
        if (!serverStarted) {
          child.kill();
          reject(new Error('Dev server startup timeout'));
        }
      }, 30000); // 30 second timeout

      // Monitor output for startup confirmation
      child.stdout?.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Local:') && output.includes('8080')) {
          serverStarted = true;
          clearTimeout(startTimeout);
          this.log('restart', 'Dev server started successfully');
          resolve();
        }
      });

      child.stderr?.on('data', (data) => {
        const error = data.toString();
        if (error.includes('EADDRINUSE')) {
          this.log('error', 'Port 8080 is already in use, killing existing processes');
          this.killNodeProcesses().then(() => {
            // Retry after killing processes
            setTimeout(() => this.startDevServer().then(resolve).catch(reject), 2000);
          });
        }
      });

      child.on('error', (error) => {
        clearTimeout(startTimeout);
        reject(error);
      });

      child.on('exit', (code) => {
        if (!serverStarted) {
          clearTimeout(startTimeout);
          reject(new Error(`Dev server exited with code ${code}`));
        }
      });
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async start(): Promise<void> {
    this.isRunning = true;
    this.log('start', 'Watchdog monitoring started');

    while (this.isRunning) {
      try {
        const isHealthy = await this.checkServerHealth();
        
        if (isHealthy) {
          console.log('✅ Watchdog: server healthy');
        } else {
          this.log('unhealthy', 'Server is not responding, attempting restart');
          
          try {
            await this.killNodeProcesses();
            await this.sleep(2000); // Wait for processes to be killed
            await this.startDevServer();
            await this.sleep(5000); // Wait for server to fully start
          } catch (error) {
            this.log('error', `Failed to restart server: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      } catch (error) {
        this.log('error', `Watchdog error: ${error instanceof Error ? error.message : String(error)}`);
      }

      await this.sleep(CHECK_INTERVAL);
    }
  }

  public stop(): void {
    this.isRunning = false;
    this.log('start', 'Watchdog stopped');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down watchdog...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down watchdog...');
  process.exit(0);
});

// Start the watchdog
const watchdog = new Station2100Watchdog();
watchdog.start().catch((error) => {
  console.error('Fatal watchdog error:', error);
  process.exit(1);
});
