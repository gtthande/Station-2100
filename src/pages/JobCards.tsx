import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobsList } from "@/components/jobs/JobsList";
import { CreateJobDialog } from "@/components/jobs/CreateJobDialog";
import { JobItemsList } from "@/components/jobs/JobItemsList";
import { JobAuthList } from "@/components/jobs/JobAuthList";
import { JobCardInterface } from "@/components/jobs/JobCardInterface";

export default function JobCards() {
  const [createJobOpen, setCreateJobOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Cards</h1>
          <p className="text-muted-foreground">
            Manage aircraft maintenance job cards and work orders
          </p>
        </div>
        <Button onClick={() => setCreateJobOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Job Card
        </Button>
      </div>

      <Tabs defaultValue="interface" className="space-y-4">
        <TabsList>
          <TabsTrigger value="interface">Job Card Interface</TabsTrigger>
          <TabsTrigger value="jobs">Job Cards</TabsTrigger>
          <TabsTrigger value="items">Job Items</TabsTrigger>
          <TabsTrigger value="auth">Authorizations</TabsTrigger>
        </TabsList>

        <TabsContent value="interface" className="space-y-4">
          <JobCardInterface />
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Job Cards</CardTitle>
              <CardDescription>
                View and manage all maintenance job cards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <JobsList onSelectJob={setSelectedJobId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Items</CardTitle>
              <CardDescription>
                Manage parts and materials for job cards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <JobItemsList selectedJobId={selectedJobId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Authorizations</CardTitle>
              <CardDescription>
                Track approvals and job closures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <JobAuthList selectedJobId={selectedJobId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateJobDialog open={createJobOpen} onOpenChange={setCreateJobOpen} />
    </div>
  );
}