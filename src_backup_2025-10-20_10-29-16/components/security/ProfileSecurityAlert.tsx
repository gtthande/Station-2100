import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProfileSecurityAlertProps {
  isEmailProtected?: boolean;
  isPhoneProtected?: boolean;
  isBadgeRestricted?: boolean;
  className?: string;
}

export const ProfileSecurityAlert = ({
  isEmailProtected = false,
  isPhoneProtected = false,
  isBadgeRestricted = false,
  className = ""
}: ProfileSecurityAlertProps) => {
  const hasProtectedFields = isEmailProtected || isPhoneProtected || isBadgeRestricted;
  
  if (!hasProtectedFields) return null;

  return (
    <Alert className={`border-amber-200 bg-amber-50 ${className}`}>
      <Shield className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-3 w-3" />
          <span className="text-sm font-medium">Protected Information</span>
        </div>
        <div className="text-xs space-y-1">
          <p>Some profile fields are protected based on your access level:</p>
          <div className="flex flex-wrap gap-1">
            {isEmailProtected && <Badge variant="outline" className="text-xs">Email Protected</Badge>}
            {isPhoneProtected && <Badge variant="outline" className="text-xs">Phone Protected</Badge>}
            {isBadgeRestricted && <Badge variant="outline" className="text-xs">Badge Restricted</Badge>}
          </div>
          <p className="text-xs text-amber-700 mt-2">
            Contact your administrator if you need access to protected information.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
};