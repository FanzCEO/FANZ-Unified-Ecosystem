import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { EyeIcon, EyeOffIcon, LogIn, UserPlus } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Welcome Back!",
        description: "You have successfully signed in to FANZ.",
      });
      navigate("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description:
          error.message || "Please check your credentials and try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-background to-cyan-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <Card className="border-2 border-purple-500/20 bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              <LogIn className="w-8 h-8 mx-auto mb-2 text-purple-400" />
              Welcome Back
            </CardTitle>
            <CardDescription className="text-lg">
              Sign in to your FANZ account
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Login Form */}
        <Card className="border-2 border-purple-500/20 bg-card/95 backdrop-blur-sm">
          <CardContent className="pt-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="space-y-4">
                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="your.email@example.com"
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Password */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              data-testid="input-password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                              data-testid="button-toggle-password"
                            >
                              {showPassword ? (
                                <EyeOffIcon className="h-4 w-4" />
                              ) : (
                                <EyeIcon className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                  disabled={loginMutation.isPending}
                  data-testid="button-sign-in"
                >
                  {loginMutation.isPending ? (
                    "Signing In..."
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>

                {/* Registration Links */}
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?
                  </p>

                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="outline"
                      onClick={() => navigate("/register?type=fan")}
                      className="w-full border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10"
                      data-testid="link-register-fan"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Sign Up as FAN
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => navigate("/register?type=star")}
                      className="w-full border-purple-500/20 text-purple-400 hover:bg-purple-500/10"
                      data-testid="link-register-star"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Sign Up as STAR
                    </Button>
                  </div>

                  <Button
                    variant="link"
                    onClick={() => navigate("/")}
                    className="text-muted-foreground hover:text-foreground"
                    data-testid="link-back-home"
                  >
                    Back to Home
                  </Button>
                </div>

                {/* Forgot Password */}
                <div className="text-center">
                  <Button
                    variant="link"
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      toast({
                        title: "Password Reset",
                        description:
                          "Password reset functionality would be implemented here",
                      });
                    }}
                    data-testid="link-forgot-password"
                  >
                    Forgot your password?
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
