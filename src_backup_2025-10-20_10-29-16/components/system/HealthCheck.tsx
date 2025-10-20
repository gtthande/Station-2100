import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database, Shield, Clock } from 'lucide-react';
import { checkSupabaseHealth, testRLS } from '@/api/supabase-check';
import { useAuth } from '@/hooks/useAuth';

interface HealthStatus {
  status: string;
  services?: {
    database: string;
    auth: string;
    timestamp: string;
  };
  error?: string;
  timestamp?: string;
}

interface RLSTestResult {
  status: string;
  canAccessOwnProfile?: boolean;
  profileId?: string;
  error?: string;
}

export const HealthCheck = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [rlsTest, setRlsTest] = useState<RLSTestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const runHealthCheck = async () => {
    setLoading(true);
    try {
      // Check Supabase health
      const healthResult = await checkSupabaseHealth();
      setHealth(healthResult);

      // Test RLS if user is authenticated
      if (user?.id) {
        const rlsResult = await testRLS(user.id);
        setRlsTest(rlsResult);
      }
    } catch (error) {
      console.error('Health check failed:', error);
      setHealth({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, [user?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'RLS working':
        return 'bg-green-500';
      case 'unhealthy':
      case 'failed':
      case 'RLS test failed':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Supabase Health Check
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={runHealthCheck}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Health */}
        {health && (
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(health.status)}`} />
              <span className="font-medium">Overall Status</span>
            </div>
            <Badge variant={health.status === 'healthy' ? 'default' : 'destructive'}>
              {health.status}
            </Badge>
          </div>
        )}

        {/* Service Details */}
        {health?.services && (
          <div className="grid gap-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span>PostgreSQL Database</span>
              </div>
              <Badge variant={health.services.database === 'connected' ? 'default' : 'destructive'}>
                {health.services.database}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Authentication</span>
              </div>
              <Badge variant={health.services.auth === 'connected' ? 'default' : 'destructive'}>
                {health.services.auth}
              </Badge>
            </div>
          </div>
        )}

        {/* RLS Test Results */}
        {rlsTest && user && (
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Row Level Security</span>
            </div>
            <Badge variant={rlsTest.status === 'RLS working' ? 'default' : 'destructive'}>
              {rlsTest.status}
            </Badge>
          </div>
        )}

        {/* Error Display */}
        {health?.error && (
          <div className="p-3 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">
              <strong>Error:</strong> {health.error}
            </p>
          </div>
        )}

        {/* Timestamp */}
        {health?.timestamp && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            Last checked: {new Date(health.timestamp).toLocaleString()}
          </div>
        )}

        {/* Connection Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Database:</strong> PostgreSQL via Supabase</p>
          <p><strong>Auth:</strong> Supabase Auth with JWT tokens</p>
          <p><strong>Storage:</strong> Supabase Storage</p>
          <p><strong>Realtime:</strong> Supabase Realtime channels</p>
        </div>
      </CardContent>
    </Card>
  );
};