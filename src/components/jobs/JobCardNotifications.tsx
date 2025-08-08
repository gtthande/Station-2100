import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, CheckCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  job_id: number;
  tab_type: string;
  message: string;
  created_at: string;
  acknowledged_at?: string;
}

export function JobCardNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { canManageSystem, hasRole } = useUserRoles();
  const { toast } = useToast();

  const canViewNotifications = canManageSystem() || hasRole('supervisor');

  useEffect(() => {
    if (canViewNotifications) {
      loadNotifications();
      
      // Set up real-time subscription for notifications
      const channel = supabase
        .channel('job_notifications')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'job_approval_notifications' 
          },
          () => {
            loadNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [canViewNotifications]);

  const loadNotifications = async () => {
    if (!user || !canViewNotifications) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_approval_notifications')
        .select('*')
        .eq('user_id', user.id)
        .is('acknowledged_at', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeNotification = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('job_approval_notifications')
        .update({
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user.id
        })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications(notifications.filter(n => n.id !== notificationId));
      
      toast({
        title: "Notification Acknowledged",
        description: "Notification has been marked as read"
      });

    } catch (error) {
      console.error('Error acknowledging notification:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge notification",
        variant: "destructive"
      });
    }
  };

  const acknowledgeAll = async () => {
    if (!user || notifications.length === 0) return;

    try {
      const { error } = await supabase
        .from('job_approval_notifications')
        .update({
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user.id
        })
        .eq('user_id', user.id)
        .is('acknowledged_at', null);

      if (error) throw error;

      setNotifications([]);
      
      toast({
        title: "All Notifications Acknowledged",
        description: "All notifications have been marked as read"
      });

    } catch (error) {
      console.error('Error acknowledging all notifications:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge all notifications",
        variant: "destructive"
      });
    }
  };

  if (!canViewNotifications || notifications.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-orange-800">
              Job Card Notifications ({notifications.length})
            </h3>
          </div>
          {notifications.length > 1 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={acknowledgeAll}
              className="text-orange-700 border-orange-300 hover:bg-orange-100"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Mark All Read
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {notifications.map((notification) => (
            <Alert key={notification.id} className="border-orange-200 bg-white">
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <span className="font-medium">Job #{notification.job_id}:</span> {notification.message}
                  <span className="text-xs text-muted-foreground ml-2">
                    {new Date(notification.created_at).toLocaleString()}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => acknowledgeNotification(notification.id)}
                  className="ml-2 text-orange-700 hover:bg-orange-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}