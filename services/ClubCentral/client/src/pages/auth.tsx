import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, Crown, Users, Eye, EyeOff, ArrowLeft } from "lucide-react";

interface AuthFormData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  rememberMe?: boolean;
}

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [userType, setUserType] = useState<'creator' | 'fan'>('fan');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    rememberMe: false,
  });
  
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (data: AuthFormData) => {
      const res = await apiRequest("POST", "/api/login", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data.user);
      // Force a full page reload to ensure auth state is properly updated
      window.location.reload();
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: AuthFormData) => {
      const res = await apiRequest("POST", "/api/register", { ...data, userType });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data.user);
      // Force a full page reload to ensure auth state is properly updated
      window.location.reload();
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/forgot-password", { email });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Reset link sent",
        description: "Check your email for password reset instructions",
      });
      setMode('login');
    },
    onError: (error: Error) => {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'login') {
      loginMutation.mutate(formData);
    } else if (mode === 'register') {
      if (!formData.firstName) {
        toast({
          title: "Missing information",
          description: "First name is required",
          variant: "destructive",
        });
        return;
      }
      registerMutation.mutate(formData);
    } else if (mode === 'forgot') {
      forgotPasswordMutation.mutate(formData.email);
    }
  };

  const handleInputChange = (field: keyof AuthFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending || forgotPasswordMutation.isPending;

  return (
    <div className="min-h-screen bg-black text-white cyber-grid relative overflow-hidden">
      {/* Scanning line animation */}
      <div className="scan-line"></div>
      
      {/* Header */}
      <header className="border-b border-border/20 backdrop-blur-sm bg-black/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="text-secondary hover:text-secondary/80">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-primary neon-text" data-testid="text-logo">
              FANZClub
            </h1>
            <div className="w-20" /> {/* Spacer */}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card className="neon-card border-border/30" data-testid="card-auth">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-primary neon-text flex items-center justify-center gap-2">
                {mode === 'login' && (
                  <>
                    <Lock className="w-6 h-6" />
                    Sign In
                  </>
                )}
                {mode === 'register' && (
                  <>
                    <User className="w-6 h-6" />
                    Create Account
                  </>
                )}
                {mode === 'forgot' && (
                  <>
                    <Mail className="w-6 h-6" />
                    Reset Password
                  </>
                )}
              </CardTitle>
              
              {mode === 'register' && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    type="button"
                    variant={userType === 'fan' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUserType('fan')}
                    className={userType === 'fan' ? 'gradient-bg' : 'border-border text-gray-300'}
                    data-testid="button-user-type-fan"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Fan
                  </Button>
                  <Button
                    type="button"
                    variant={userType === 'creator' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUserType('creator')}
                    className={userType === 'creator' ? 'gradient-bg' : 'border-border text-gray-300'}
                    data-testid="button-user-type-creator"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Creator
                  </Button>
                </div>
              )}
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-white">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        required
                        placeholder="John"
                        className="bg-input border-border text-white mt-2"
                        value={formData.firstName}
                        onChange={handleInputChange('firstName')}
                        data-testid="input-first-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-white">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        className="bg-input border-border text-white mt-2"
                        value={formData.lastName}
                        onChange={handleInputChange('lastName')}
                        data-testid="input-last-name"
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="email" className="text-white">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="your@email.com"
                    className="bg-input border-border text-white mt-2 neon-border-animated"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    data-testid="input-email"
                  />
                </div>
                
                {mode !== 'forgot' && (
                  <div>
                    <Label htmlFor="password" className="text-white">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        className="bg-input border-border text-white mt-2 pr-10"
                        value={formData.password}
                        onChange={handleInputChange('password')}
                        data-testid="input-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                        data-testid="button-toggle-password"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    {mode === 'register' && (
                      <p className="text-xs text-gray-400 mt-1">
                        Must be at least 6 characters
                      </p>
                    )}
                  </div>
                )}
                
                {mode === 'login' && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="rememberMe"
                        checked={formData.rememberMe}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ ...prev, rememberMe: checked as boolean }))
                        }
                        data-testid="checkbox-remember-me"
                      />
                      <Label htmlFor="rememberMe" className="text-sm text-gray-300">
                        Remember me
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      className="text-primary hover:text-primary/80 p-0 h-auto"
                      onClick={() => setMode('forgot')}
                      data-testid="button-forgot-password"
                    >
                      Forgot password?
                    </Button>
                  </div>
                )}
                
                <Button
                  type="submit"
                  className="w-full gradient-bg hover:opacity-90 transition-all duration-300 neon-glow"
                  disabled={isLoading}
                  data-testid="button-submit"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                      Processing...
                    </div>
                  ) : (
                    <>
                      {mode === 'login' && 'Sign In'}
                      {mode === 'register' && 'Create Account'}
                      {mode === 'forgot' && 'Send Reset Link'}
                    </>
                  )}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                {mode === 'login' && (
                  <p className="text-gray-400">
                    Don't have an account?{' '}
                    <Button
                      variant="link"
                      className="text-primary hover:text-primary/80 p-0 h-auto"
                      onClick={() => setMode('register')}
                      data-testid="button-switch-to-register"
                    >
                      Sign up
                    </Button>
                  </p>
                )}
                {mode === 'register' && (
                  <p className="text-gray-400">
                    Already have an account?{' '}
                    <Button
                      variant="link"
                      className="text-primary hover:text-primary/80 p-0 h-auto"
                      onClick={() => setMode('login')}
                      data-testid="button-switch-to-login"
                    >
                      Sign in
                    </Button>
                  </p>
                )}
                {mode === 'forgot' && (
                  <p className="text-gray-400">
                    Remember your password?{' '}
                    <Button
                      variant="link"
                      className="text-primary hover:text-primary/80 p-0 h-auto"
                      onClick={() => setMode('login')}
                      data-testid="button-back-to-login"
                    >
                      Sign in
                    </Button>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Security Note */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Your data is encrypted and secure. We never share your information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}