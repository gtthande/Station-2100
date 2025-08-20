import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRotableReports } from '@/hooks/useRotableReports';
import { useRotableRoles } from '@/hooks/useRotableRoles';
import { FeatureGate } from '@/components/auth/FeatureGate';
import { 
  BarChart3, 
  Calendar, 
  History, 
  Clock, 
  Package, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Download,
  Printer
} from 'lucide-react';
import { format } from 'date-fns';

export const ReportsTab = () => {
  const { 
    stockReport, 
    llpForecast, 
    installationHistory, 
    repairTurnaround, 
    isLoading 
  } = useRotableReports();
  const { canAccessReports } = useRotableRoles();

  if (!canAccessReports) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-white/60">Access denied. You need Manager or Auditor role to view reports.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white/60">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Reports & Analytics</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Printer className="w-4 h-4" />
            Print
          </Button>
        </div>
      </div>

      <Tabs defaultValue="stock" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white/5 border border-white/10">
          <TabsTrigger value="stock" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Package className="w-4 h-4 mr-2" />
            Stock Status
          </TabsTrigger>
          <TabsTrigger value="forecast" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Calendar className="w-4 h-4 mr-2" />
            LLP Forecast
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <History className="w-4 h-4 mr-2" />
            Installation History
          </TabsTrigger>
          <TabsTrigger value="turnaround" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Clock className="w-4 h-4 mr-2" />
            Repair Turnaround
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="w-5 h-5" />
                Rotable Stock Status Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stockReport.length === 0 ? (
                <p className="text-white/60 text-center py-8">No stock data available</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4 mb-4 text-sm font-medium text-white/80 border-b border-white/10 pb-2">
                    <div>Part Details</div>
                    <div>Status</div>
                    <div>Condition</div>
                    <div>Location</div>
                  </div>
                  {stockReport.map((item) => (
                    <div key={item.part_id} className="grid grid-cols-4 gap-4 py-3 border-b border-white/5">
                      <div>
                        <p className="text-white font-medium">{item.part_number}</p>
                        <p className="text-white/60 text-sm">{item.serial_number}</p>
                        <p className="text-white/50 text-xs">{item.manufacturer}</p>
                      </div>
                      <div>
                        <Badge 
                          variant={item.status === 'serviceable' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div>
                        <Badge 
                          variant={item.condition === 'Serviceable' ? 'default' : 'destructive'}
                        >
                          {item.condition}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-white/80">{item.location || 'Not specified'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                LLP Expiry Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              {llpForecast.length === 0 ? (
                <p className="text-white/60 text-center py-8">No LLP tracking data available</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-5 gap-4 mb-4 text-sm font-medium text-white/80 border-b border-white/10 pb-2">
                    <div>Part Details</div>
                    <div>Aircraft</div>
                    <div>Current Usage</div>
                    <div>Next Due</div>
                    <div>Priority</div>
                  </div>
                  {llpForecast.map((item) => (
                    <div key={item.part_id} className="grid grid-cols-5 gap-4 py-3 border-b border-white/5">
                      <div>
                        <p className="text-white font-medium">{item.part_number}</p>
                        <p className="text-white/60 text-sm">{item.serial_number}</p>
                      </div>
                      <div>
                        <p className="text-white/80">{item.aircraft_tail_number}</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-white/80">{item.current_hours}h / {item.current_cycles}c</p>
                        {item.hours_limit && (
                          <p className="text-white/60">Limit: {item.hours_limit}h</p>
                        )}
                      </div>
                      <div>
                        {item.next_inspection_due ? (
                          <p className="text-white/80">
                            {format(new Date(item.next_inspection_due), 'MMM dd, yyyy')}
                          </p>
                        ) : (
                          <p className="text-white/50">Not set</p>
                        )}
                      </div>
                      <div>
                        <Badge 
                          variant={
                            item.priority === 'critical' ? 'destructive' : 
                            item.priority === 'warning' ? 'secondary' : 'outline'
                          }
                          className="gap-1"
                        >
                          {item.priority === 'critical' && <AlertTriangle className="w-3 h-3" />}
                          {item.days_until_due} days
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <History className="w-5 h-5" />
                Installation History Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              {installationHistory.length === 0 ? (
                <p className="text-white/60 text-center py-8">No installation history available</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-5 gap-4 mb-4 text-sm font-medium text-white/80 border-b border-white/10 pb-2">
                    <div>Part Details</div>
                    <div>Aircraft</div>
                    <div>Installation Date</div>
                    <div>Usage at Install</div>
                    <div>Performed By</div>
                  </div>
                  {installationHistory.map((item, index) => (
                    <div key={index} className="grid grid-cols-5 gap-4 py-3 border-b border-white/5">
                      <div>
                        <p className="text-white font-medium">{item.part_number}</p>
                        <p className="text-white/60 text-sm">{item.serial_number}</p>
                      </div>
                      <div>
                        <p className="text-white/80">{item.aircraft_id}</p>
                      </div>
                      <div>
                        <p className="text-white/80">
                          {format(new Date(item.installation_date), 'MMM dd, yyyy')}
                        </p>
                        {item.removal_date && (
                          <p className="text-white/60 text-sm">
                            Removed: {format(new Date(item.removal_date), 'MMM dd, yyyy')}
                          </p>
                        )}
                      </div>
                      <div className="text-sm">
                        <p className="text-white/80">{item.flight_hours_at_install}h</p>
                        <p className="text-white/60">{item.flight_cycles_at_install}c</p>
                      </div>
                      <div>
                        <p className="text-white/80">{item.performed_by}</p>
                        {item.reason_for_removal && (
                          <p className="text-white/60 text-xs">{item.reason_for_removal}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="turnaround" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Repair Turnaround Time Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              {repairTurnaround.length === 0 ? (
                <p className="text-white/60 text-center py-8">No repair records available</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-6 gap-4 mb-4 text-sm font-medium text-white/80 border-b border-white/10 pb-2">
                    <div>Part Details</div>
                    <div>Facility</div>
                    <div>Sent Date</div>
                    <div>Expected Return</div>
                    <div>Turnaround</div>
                    <div>Status</div>
                  </div>
                  {repairTurnaround.map((item, index) => (
                    <div key={index} className="grid grid-cols-6 gap-4 py-3 border-b border-white/5">
                      <div>
                        <p className="text-white font-medium">{item.part_number}</p>
                        <p className="text-white/60 text-sm">{item.serial_number}</p>
                      </div>
                      <div>
                        <p className="text-white/80">{item.facility}</p>
                      </div>
                      <div>
                        <p className="text-white/80">
                          {format(new Date(item.sent_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div>
                        {item.expected_return && (
                          <p className="text-white/80">
                            {format(new Date(item.expected_return), 'MMM dd, yyyy')}
                          </p>
                        )}
                      </div>
                      <div>
                        <Badge variant={item.turnaround_days > 30 ? 'destructive' : 'default'}>
                          {item.turnaround_days} days
                        </Badge>
                        {item.cost && (
                          <p className="text-white/60 text-xs mt-1">${item.cost.toFixed(2)}</p>
                        )}
                      </div>
                      <div>
                        <Badge 
                          variant={item.status === 'returned' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};