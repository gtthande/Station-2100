
import { useAuth } from '@/hooks/useAuth';
import { GradientButton } from '@/components/ui/gradient-button';
import { User, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export const UserMenu = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-4">
      <ThemeToggle />
      <div className="flex items-center gap-2 text-foreground/80">
        <User className="w-5 h-5" />
        <span className="text-sm">{user.email}</span>
      </div>
      <GradientButton
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        className="gap-2"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </GradientButton>
    </div>
  );
};
