import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Rocket, Mail, Lock, User, FileText } from "lucide-react";

const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().min(1, "Display name is required"),
});

const signinSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type SignupFormData = z.infer<typeof signupSchema>;
type SigninFormData = z.infer<typeof signinSchema>;

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState("signin");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      displayName: "",
    },
  });

  const signinForm = useForm<SigninFormData>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupFormData) => {
      return apiRequest("POST", "/api/auth/signup", data);
    },
    onSuccess: () => {
      toast({
        title: "Welcome to Fanz World! 🚀",
        description: "Your account has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      onOpenChange(false);
      signupForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const signinMutation = useMutation({
    mutationFn: async (data: SigninFormData) => {
      return apiRequest("POST", "/api/auth/signin", data);
    },
    onSuccess: () => {
      toast({
        title: "Welcome back! ⚡",
        description: "You've successfully signed in to Fanz World.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      onOpenChange(false);
      signinForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Sign In Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const onSignup = (data: SignupFormData) => {
    signupMutation.mutate(data);
  };

  const onSignin = (data: SigninFormData) => {
    signinMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-900/95 border border-cyber-blue/30 backdrop-blur-xl">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-cyber-blue to-electric-purple rounded-lg flex items-center justify-center shadow-neon-cyan">
              <Rocket className="text-2xl text-black" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-cyber-blue neon-text">
            Enter Fanz World
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 border border-cyber-blue/20">
            <TabsTrigger 
              value="signin" 
              className="data-[state=active]:bg-cyber-blue/20 data-[state=active]:text-cyber-blue data-[state=active]:shadow-neon-cyan"
              data-testid="signin-tab"
            >
              Sign In
            </TabsTrigger>
            <TabsTrigger 
              value="signup" 
              className="data-[state=active]:bg-electric-purple/20 data-[state=active]:text-electric-purple data-[state=active]:shadow-neon-purple"
              data-testid="signup-tab"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4">
            <form onSubmit={signinForm.handleSubmit(onSignin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email" className="text-gray-300 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-cyber-blue" />
                  Email
                </Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="your.email@galaxy.com"
                  className="cyber-input"
                  data-testid="signin-email-input"
                  {...signinForm.register("email")}
                />
                {signinForm.formState.errors.email && (
                  <p className="text-red-400 text-sm">{signinForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signin-password" className="text-gray-300 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyber-blue" />
                  Password
                </Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="••••••••"
                  className="cyber-input"
                  data-testid="signin-password-input"
                  {...signinForm.register("password")}
                />
                {signinForm.formState.errors.password && (
                  <p className="text-red-400 text-sm">{signinForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full neon-button bg-gradient-to-r from-cyber-blue to-electric-purple text-black font-bold py-3 rounded-xl border-cyber-blue hover:shadow-neon-cyan transition-all duration-300"
                disabled={signinMutation.isPending}
                data-testid="signin-submit-button"
              >
                {signinMutation.isPending ? "Entering..." : "Enter Fanz World ⚡"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-username" className="text-gray-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-electric-purple" />
                  Username
                </Label>
                <Input
                  id="signup-username"
                  type="text"
                  placeholder="cyberninja_2025"
                  className="cyber-input"
                  data-testid="signup-username-input"
                  {...signupForm.register("username")}
                />
                {signupForm.formState.errors.username && (
                  <p className="text-red-400 text-sm">{signupForm.formState.errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-displayName" className="text-gray-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-electric-purple" />
                  Display Name
                </Label>
                <Input
                  id="signup-displayName"
                  type="text"
                  placeholder="Cyber Ninja"
                  className="cyber-input"
                  data-testid="signup-displayname-input"
                  {...signupForm.register("displayName")}
                />
                {signupForm.formState.errors.displayName && (
                  <p className="text-red-400 text-sm">{signupForm.formState.errors.displayName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-gray-300 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-electric-purple" />
                  Email
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="your.email@galaxy.com"
                  className="cyber-input"
                  data-testid="signup-email-input"
                  {...signupForm.register("email")}
                />
                {signupForm.formState.errors.email && (
                  <p className="text-red-400 text-sm">{signupForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-gray-300 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-electric-purple" />
                  Password
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  className="cyber-input"
                  data-testid="signup-password-input"
                  {...signupForm.register("password")}
                />
                {signupForm.formState.errors.password && (
                  <p className="text-red-400 text-sm">{signupForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full neon-button bg-gradient-to-r from-electric-purple to-neon-pink text-black font-bold py-3 rounded-xl border-electric-purple hover:shadow-neon-purple transition-all duration-300"
                disabled={signupMutation.isPending}
                data-testid="signup-submit-button"
              >
                {signupMutation.isPending ? "Creating..." : "Join Fanz World 🚀"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm text-gray-400 border-t border-gray-700 pt-4">
          Welcome to the future of social media
        </div>
      </DialogContent>
    </Dialog>
  );
}