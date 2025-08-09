
import { useState } from 'react';
import { GradientButton } from '@/components/ui/gradient-button';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield } from 'lucide-react';
import ThemeToggle from '@/components/theme/ThemeToggle';

const ThemeToggleWrapper = () => <ThemeToggle />;

export const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (showForgotPassword) {
        const { error } = await resetPassword(email);
        if (error) {
          toast({
            title: "Reset Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Reset Email Sent!",
            description: "Check your email for password reset instructions.",
          });
          setShowForgotPassword(false);
          setIsLogin(true);
        }
      } else if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Login Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome Back!",
            description: "Successfully logged in to Station-2100",
          });
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast({
            title: "Registration Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Registration Successful!",
            description: "Please check your email to verify your account.",
          });
          setIsLogin(true);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (showForgotPassword) return 'Reset Password';
    return isLogin ? 'Welcome Back' : 'Join Station-2100';
  };

  const getDescription = () => {
    if (showForgotPassword) return 'Enter your email to receive reset instructions';
    return isLogin 
      ? 'Sign in to access your aviation maintenance dashboard' 
      : 'Create your account to get started';
  };

  const fillTestCredentials = () => {
    setEmail('test@station2100.com');
    setPassword('test123');
    setFullName('Test User');
    toast({
      title: "Test Credentials Filled",
      description: "You can now create a test account or modify these credentials",
    });
  };

  return (
    <div className="min-h-screen bg-surface-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          {/* Theme toggle available on login */}
          <ThemeToggleWrapper />
        </div>
        <GlassCard className="p-8">
          <GlassCardHeader className="text-center space-y-4">
            <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <GlassCardTitle className="text-2xl">
              {getTitle()}
            </GlassCardTitle>
            <p className="text-white/70">
              {getDescription()}
            </p>
          </GlassCardHeader>
          
          <GlassCardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && !showForgotPassword && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-white">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    required={!isLogin && !showForgotPassword}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              
              {!showForgotPassword && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
              )}
              
              <GradientButton
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {showForgotPassword ? 'Sending Reset Email...' : (isLogin ? 'Signing In...' : 'Creating Account...')}
                  </>
                ) : (
                  showForgotPassword ? 'Send Reset Email' : (isLogin ? 'Sign In' : 'Create Account')
                )}
              </GradientButton>
            </form>
            
            <div className="mt-6 space-y-3 text-center">
              {!showForgotPassword && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-white/70 hover:text-white transition-colors block w-full"
                  >
                    {isLogin 
                      ? "Don't have an account? Sign up" 
                      : "Already have an account? Sign in"
                    }
                  </button>
                  
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-white/70 hover:text-white transition-colors text-sm"
                    >
                      Forgot your password?
                    </button>
                  )}
                </>
              )}
              
              {showForgotPassword && (
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setIsLogin(true);
                  }}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Back to sign in
                </button>
              )}
              
              <div className="border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={fillTestCredentials}
                  className="text-sm text-white/50 hover:text-white/70 transition-colors"
                >
                  Fill test credentials
                </button>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
};
