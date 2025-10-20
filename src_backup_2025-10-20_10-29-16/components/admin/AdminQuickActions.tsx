import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

export default function AdminQuickActions() {
  const [loading, setLoading] = useState<null | "mysql" | "sync">(null);
  const [dryRun, setDryRun] = useState(true);
  const { toast } = useToast();

  const pingMySQL = async () => {
    setLoading("mysql");
    try {
      const res = await fetch("http://localhost:8787/api/admin/mysql/ping");
      const data = await res.json();
      if (data.ok) {
        toast({
          title: "✅ MySQL Connected",
          description: `Version: ${data.details?.version || "Connected successfully"}`,
        });
      } else {
        toast({
          title: "❌ MySQL Error",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "❌ MySQL Connection Failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const syncSupabase = async () => {
    setLoading("sync");
    try {
      const res = await fetch(`http://localhost:8787/api/admin/supabase/sync?dryRun=${dryRun ? "true" : "false"}`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (data.ok) {
        const mode = dryRun ? "(Dry Run)" : "";
        toast({
          title: `✅ Supabase Sync ${mode} Complete`,
          description: `Users: +${data.users?.inserted || 0}/~${data.users?.updated || 0}, Profiles: +${data.profiles?.inserted || 0}/~${data.profiles?.updated || 0}`,
        });
      } else {
        toast({
          title: "❌ Supabase Sync Failed",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "❌ Supabase Sync Error",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-3 p-4 bg-zinc-900/50 rounded-lg border border-zinc-700">
      <div className="flex items-center gap-2 text-sm text-zinc-300">
        <span className="font-medium">Admin Actions:</span>
      </div>
      
      <Button
        onClick={pingMySQL}
        disabled={loading !== null}
        variant="outline"
        size="sm"
        className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-600"
      >
        {loading === "mysql" ? "Checking MySQL..." : "MySQL Connect"}
      </Button>

      <div className="flex items-center gap-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="dry-run"
            checked={dryRun}
            onCheckedChange={(checked) => setDryRun(checked as boolean)}
          />
          <label
            htmlFor="dry-run"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-300"
          >
            Dry-run
          </label>
        </div>
        <Button
          onClick={syncSupabase}
          disabled={loading !== null}
          variant="outline"
          size="sm"
          className="bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-600"
        >
          {loading === "sync" ? (dryRun ? "Simulating..." : "Syncing...") : "Supabase Sync"}
        </Button>
      </div>
    </div>
  );
}
