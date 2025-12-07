import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { registrationSchema, type RegistrationForm } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { EyeIcon, EyeOffIcon, UserPlus, Shield, Star } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Register() {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userType, setUserType] = useState<"fan" | "star" | null>(null);
  const { toast } = useToast();

  // Check URL parameters for user type
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get("type") as "fan" | "star" | null;
    if (type === "fan" || type === "star") {
      setUserType(type);
    }
  }, []);

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      role: userType === "star" ? "star" : "fanz",
      terms: false,
      ageConsent: false,
    },
  });

  // Update role when userType changes
  useEffect(() => {
    if (userType) {
      form.setValue("role", userType === "star" ? "star" : "fanz");
    }
  }, [userType, form]);

  const registerMutation = useMutation({
    mutationFn: async (data: RegistrationForm) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Registration failed");
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Account Created!",
        description:
          variables.role === "star"
            ? "Now let's complete your identity verification for 2257 compliance."
            : "Welcome to FANZ! You can now access the platform with content blurred until verification.",
      });

      // Redirect STAR creators to compliance flow
      if (variables.role === "star") {
        navigate("/compliance/kyc");
      } else {
        // FAN users get immediate platform access with blurred content
        navigate("/?verified=false");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegistrationForm) => {
    registerMutation.mutate(data);
  };

  const selectedRole = form.watch("role");

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-background to-cyan-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <Card className="border-2 border-purple-500/20 bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              <UserPlus className="w-8 h-8 mx-auto mb-2 text-purple-400" />
              {userType === "star"
                ? "Become a STAR Creator"
                : userType === "fan"
                  ? "Join as FAN"
                  : "Join FANZ"}
            </CardTitle>
            <CardDescription className="text-lg">
              {userType === "star"
                ? "Complete your professional creator registration with full 2257 compliance"
                : userType === "fan"
                  ? "Get immediate access to the platform with verification options"
                  : "Start your creator economy journey across 14 specialized clusters"}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Registration Form */}
        <Card className="border-2 border-purple-500/20 bg-card/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">Create Your Account</CardTitle>
            <CardDescription>
              Join the professional creator platform with enterprise security
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your first name"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-first-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your last name"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-last-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Username */}
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                            @
                          </span>
                          <Input
                            placeholder="Choose a unique username"
                            className="pl-8"
                            {...field}
                            data-testid="input-username"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                      <p className="text-sm text-muted-foreground">
                        Your username will be your unique identifier across all
                        clusters
                      </p>
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email address"
                          {...field}
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
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a strong password"
                            {...field}
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
                      <p className="text-sm text-muted-foreground">
                        Password must be at least 8 characters with uppercase,
                        lowercase, numbers, and symbols
                      </p>
                    </FormItem>
                  )}
                />

                {/* Confirm Password */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            {...field}
                            data-testid="input-confirm-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            data-testid="button-toggle-confirm-password"
                          >
                            {showConfirmPassword ? (
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

                {/* Role Selection - Only show if not specified via URL */}
                {!userType && (
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Your Role</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          data-testid="select-role"
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose your role in the platform" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="fanz">
                              FANZ (Fan) - Enjoy and support creators
                            </SelectItem>
                            <SelectItem value="star">
                              STAR (Creator) - Create and monetize content
                            </SelectItem>
                            <SelectItem value="moderator">
                              Moderator - Help maintain community standards
                            </SelectItem>
                            <SelectItem value="admin">
                              Administrator - Platform administration
                            </SelectItem>
                            <SelectItem value="executive">
                              Executive - Business management
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Show selected role when specified via URL */}
                {userType && (
                  <div className="bg-background/50 rounded-lg p-4 border">
                    <h4 className="font-semibold mb-2">Account Type</h4>
                    <div className="flex items-center space-x-2">
                      {userType === "star" ? (
                        <>
                          <Star className="w-5 h-5 text-purple-400" />
                          <span className="text-purple-400 font-medium">
                            STAR Creator
                          </span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5 text-cyan-400" />
                          <span className="text-cyan-400 font-medium">
                            FAN User
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* STAR Role Notice */}
                {(selectedRole === "star" || userType === "star") && (
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Shield className="w-5 h-5 text-purple-400 mt-1" />
                      <div>
                        <h4 className="text-sm font-medium text-purple-300">
                          STAR Creator Requirements
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          As a STAR creator, you'll need to complete identity
                          verification and 2257 compliance documentation. This
                          ensures full legal protection and enables content
                          monetization across all platform clusters.
                        </p>
                        <div className="mt-2 text-xs text-purple-300">
                          ✓ Identity verification with government ID
                          <br />
                          ✓ Age verification (18+ required)
                          <br />
                          ✓ USC 2257 compliance forms
                          <br />✓ Digital signature and consent agreements
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Terms and Conditions */}
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="terms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-terms"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm">
                            I agree to the{" "}
                            <a
                              href="/terms"
                              className="text-purple-400 hover:text-purple-300 underline"
                            >
                              Terms of Service
                            </a>{" "}
                            and{" "}
                            <a
                              href="/privacy"
                              className="text-purple-400 hover:text-purple-300 underline"
                            >
                              Privacy Policy
                            </a>
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ageConsent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-age-consent"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm">
                            I confirm that I am at least 18 years old
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                  disabled={registerMutation.isPending}
                  data-testid="button-create-account"
                >
                  {registerMutation.isPending ? (
                    "Creating Account..."
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create Account
                    </>
                  )}
                </Button>

                {/* Login Link */}
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Button
                      variant="link"
                      className="text-purple-400 hover:text-purple-300 p-0"
                      onClick={() => navigate("/login")}
                      data-testid="link-login"
                    >
                      Sign In
                    </Button>
                  </p>

                  {userType && (
                    <p className="text-sm text-muted-foreground">
                      Want to choose a different account type?{" "}
                      <Button
                        variant="link"
                        className="text-cyan-400 hover:text-cyan-300 p-0"
                        onClick={() => navigate("/")}
                        data-testid="link-back-home"
                      >
                        Back to Account Selection
                      </Button>
                    </p>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* What's Next Preview */}
        <Card className="border-2 border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center">
              <span className="mr-2">🚀</span>
              What's Next?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-cyan-400">👤</span>
                <span>Choose your role and verify identity</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">🔐</span>
                <span>Complete compliance verification</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-purple-400">🌐</span>
                <span>Access 14 specialized platform clusters</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-pink-400">⭐</span>
                <span>Start creating or enjoying content</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
