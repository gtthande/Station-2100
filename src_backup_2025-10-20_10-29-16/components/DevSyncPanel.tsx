import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, RefreshCw, CheckCircle, XCircle } from "lucide-react";

interface SyncStatus {
  status: "idle" | "testing" | "syncing" | "success" | "error";
  message?: string;
  details?: any;
}

export default function DevSyncPanel() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ status: "idle" });

  const testConnection = async () => {
    setSyncStatus({ status: "testing", message: "Testing database connections..." });
    
    try {
      const response = await fetch("http://localhost:5055/api/sync/test");
      const data = await response.json();
      
      if (data.ok) {
        setSyncStatus({
          status: "success",
          message: "✅ Both databases connected successfully",
          details: data
        });
      } else {
        setSyncStatus({
          status: "error",
          message: `❌ Connection failed: ${data.error}`,
          details: data
        });
      }
    } catch (error) {
      setSyncStatus({
        status: "error",
        message: `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  };

  const runSync = async () => {
    setSyncStatus({ status: "syncing", message: "Syncing data from MySQL to Supabase..." });
    
    try {
      const response = await fetch("http://localhost:5055/api/sync/run", { 
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.ok) {
        setSyncStatus({
          status: "success",
          message: `✅ Successfully synced ${data.count} records`,
          details: data
        });
      } else {
        setSyncStatus({
          status: "error",
          message: `❌ Sync failed: ${data.error}`,
          details: data
        });
      }
    } catch (error) {
      setSyncStatus({
        status: "error",
        message: `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus.status) {
      case "testing":
      case "syncing":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (syncStatus.status) {
      case "success":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "testing":
      case "syncing":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Developer Sync Panel
        </CardTitle>
        <CardDescription>
          Test database connections and sync data between MySQL and Supabase
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={testConnection}
            disabled={syncStatus.status === "testing" || syncStatus.status === "syncing"}
            variant="outline"
            className="flex items-center gap-2"
          >
            {syncStatus.status === "testing" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            Test Connection
          </Button>
          
          <Button 
            onClick={runSync}
            disabled={syncStatus.status === "testing" || syncStatus.status === "syncing"}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            {syncStatus.status === "syncing" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            🔄 Sync Now
          </Button>
        </div>

        {/* Status Display */}
        {syncStatus.status !== "idle" && (
          <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon()}
              <Badge variant={syncStatus.status === "success" ? "default" : syncStatus.status === "error" ? "destructive" : "secondary"}>
                {syncStatus.status.toUpperCase()}
              </Badge>
            </div>
            
            {syncStatus.message && (
              <p className="text-sm font-medium mb-2">{syncStatus.message}</p>
            )}
            
            {syncStatus.details && (
              <div className="text-xs text-gray-600 space-y-1">
                {syncStatus.details.mysql && (
                  <div>
                    <strong>MySQL:</strong> {syncStatus.details.mysql.timestamp || 'Connected'}
                  </div>
                )}
                {syncStatus.details.supabase && (
                  <div>
                    <strong>Supabase:</strong> {syncStatus.details.supabase.records || 0} records
                  </div>
                )}
                {syncStatus.details.count && (
                  <div>
                    <strong>Synced:</strong> {syncStatus.details.count} records
                  </div>
                )}
                {syncStatus.details.details && (
                  <div>
                    <strong>Tables:</strong> {Object.entries(syncStatus.details.details).map(([table, count]) => `${table}: ${count}`).join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• <strong>Test Connection:</strong> Verifies both MySQL and Supabase connections</p>
          <p>• <strong>Sync Now:</strong> Upserts data from MySQL to Supabase (profiles, businesses, users, job_cards)</p>
          <p>• Only available to authenticated admin users</p>
        </div>
      </CardContent>
    </Card>
  );
}
