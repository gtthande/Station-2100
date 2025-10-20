import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  GitPullRequest, 
  GitPush, 
  Database, 
  ArrowRightLeft, 
  Upload, 
  Terminal,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface SyncLog {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

interface SyncStatus {
  isRunning: boolean;
  currentOperation: string | null;
  lastSync: string | null;
  error: string | null;
}

export default function DevSyncPanel() {
  const { user, loading } = useAuth();
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isRunning: false,
    currentOperation: null,
    lastSync: null,
    error: null
  });
  const [dryRun, setDryRun] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Show loading state while authentication is being checked
  if (loading) {
    return (
      <div className="p-6 rounded-xl border border-neutral-700">
        <div className="text-sm opacity-70">
          Loading Dev Sync Panel...
        </div>
      </div>
    );
  }

  // Role and environment gating
  if (user?.role !== 'admin' || import.meta.env.VITE_ALLOW_SYNC !== '1') {
    return (
      <div className="p-6 rounded-xl border border-neutral-700">
        <div className="text-sm opacity-70">
          Dev Sync Panel is only available to administrators with sync permissions enabled.
        </div>
      </div>
    );
  }

  const addLog = (level: SyncLog['level'], message: string, details?: string) => {
    const log: SyncLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      level,
      message,
      details
    };
    setLogs(prev => [...prev, log]);
  };

  const updateSyncStatus = (updates: Partial<SyncStatus>) => {
    setSyncStatus(prev => ({ ...prev, ...updates }));
  };

  const handleSync = async (operation: string, endpoint: string, method: 'GET' | 'POST' = 'POST') => {
    if (syncStatus.isRunning) {
      addLog('warning', 'Another sync operation is already running');
      return;
    }

    updateSyncStatus({ 
      isRunning: true, 
      currentOperation: operation,
      error: null 
    });

    addLog('info', `Starting ${operation}...`);

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: method === 'POST' ? JSON.stringify({ dryRun }) : undefined,
      });

      const data = await response.json();

      if (response.ok) {
        addLog('success', `${operation} completed successfully`);
        if (data.details) {
          addLog('info', 'Operation details:', JSON.stringify(data.details, null, 2));
        }
        if (data.count) {
          addLog('info', `Synced ${data.count} records`);
        }
        updateSyncStatus({ 
          isRunning: false, 
          currentOperation: null,
          lastSync: new Date().toISOString()
        });
      } else {
        throw new Error(data.error || 'Sync operation failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog('error', `${operation} failed: ${errorMessage}`);
      updateSyncStatus({ 
        isRunning: false, 
        currentOperation: null,
        error: errorMessage
      });
    }
  };

  const getStatusIcon = () => {
    if (syncStatus.isRunning) return <Clock className="h-4 w-4 text-blue-500" />;
    if (syncStatus.error) return <XCircle className="h-4 w-4 text-red-500" />;
    if (syncStatus.lastSync) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  };

  const getLogIcon = (level: SyncLog['level']) => {
    switch (level) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Terminal className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dev & DB Sync Panel</h2>
          <p className="text-muted-foreground">
            GitHub sync, database migrations, and real-time synchronization
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <Badge variant={syncStatus.isRunning ? 'default' : syncStatus.error ? 'destructive' : 'secondary'}>
            {syncStatus.isRunning ? 'Running' : syncStatus.error ? 'Error' : 'Ready'}
          </Badge>
        </div>
      </div>

      {/* Sync Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* GitHub Operations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GitPullRequest className="h-5 w-5 text-blue-500" />
              <span>GitHub Sync</span>
            </CardTitle>
            <CardDescription>Pull and push changes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={() => handleSync('GitHub Pull', '/api/sync/pull', 'POST')}
              disabled={syncStatus.isRunning}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              <GitPullRequest className="h-4 w-4 mr-2" />
              Pull from GitHub
            </Button>
            <Button
              onClick={() => handleSync('GitHub Push', '/api/sync/push', 'POST')}
              disabled={syncStatus.isRunning}
              className="w-full bg-green-500 hover:bg-green-600"
            >
              <GitPush className="h-4 w-4 mr-2" />
              Push to GitHub
            </Button>
          </CardContent>
        </Card>

        {/* Database Operations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-purple-500" />
              <span>Database Sync</span>
            </CardTitle>
            <CardDescription>MySQL ↔ Supabase sync</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={() => handleSync('Test Connection', 'http://localhost:5055/api/sync/test', 'GET')}
              disabled={syncStatus.isRunning}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              <Database className="h-4 w-4 mr-2" />
              Test Connection
            </Button>
            <Button
              onClick={() => handleSync('MySQL → Supabase', 'http://localhost:5055/api/sync/run', 'POST')}
              disabled={syncStatus.isRunning}
              className="w-full bg-purple-500 hover:bg-purple-600"
            >
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              🔄 Sync Now
            </Button>
          </CardContent>
        </Card>

        {/* Migration Operations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-orange-500" />
              <span>Migrations</span>
            </CardTitle>
            <CardDescription>Database schema updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={() => handleSync('Push Migrations', '/api/sync/migrate', 'POST')}
              disabled={syncStatus.isRunning}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              <Upload className="h-4 w-4 mr-2" />
              Push DB Migrations
            </Button>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="dryRun"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="dryRun" className="text-sm text-muted-foreground">
                Dry Run Mode
              </label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Information */}
      {syncStatus.currentOperation && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-500 animate-spin" />
              <span className="font-medium">Currently running: {syncStatus.currentOperation}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {syncStatus.error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-700">
              <XCircle className="h-4 w-4" />
              <span className="font-medium">Error: {syncStatus.error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Terminal className="h-5 w-5" />
            <span>Real-time Logs</span>
          </CardTitle>
          <CardDescription>
            Live sync operation logs and status updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 w-full rounded border bg-black text-green-400 font-mono text-sm">
            <div className="p-4 space-y-1">
              {logs.length === 0 ? (
                <div className="text-gray-500">No logs yet. Start a sync operation to see logs here.</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-2">
                    <div className="flex-shrink-0 mt-0.5">
                      {getLogIcon(log.level)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400 text-xs">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <Badge 
                          variant={log.level === 'error' ? 'destructive' : 
                                  log.level === 'success' ? 'default' : 
                                  log.level === 'warning' ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {log.level.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-green-400 mt-1">{log.message}</div>
                      {log.details && (
                        <div className="text-gray-300 text-xs mt-1 whitespace-pre-wrap">
                          {log.details}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
