import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DollarSign, Calendar, TrendingUp, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import type { LoanProgram, LoanApplication, LoanOffer, LoanRepayment } from "@shared/schema";

const applyFormSchema = z.object({
  programId: z.string().uuid("Please select a loan program"),
  requestedAmount: z.coerce.number().positive("Amount must be greater than 0").finite("Amount must be a valid number"),
  purpose: z.string().min(10, "Please provide a detailed purpose (min 10 characters)"),
  businessPlan: z.string().optional(),
});

type ApplyFormData = z.infer<typeof applyFormSchema>;

export default function CreatorLoanDashboard() {
  const { toast } = useToast();
  const [showApplyForm, setShowApplyForm] = useState(false);

  const { data: programs, isLoading: programsLoading } = useQuery<LoanProgram[]>({
    queryKey: ["/api/loans/programs"],
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery<LoanApplication[]>({
    queryKey: ["/api/loans/applications/creator"],
  });

  const { data: activeOffers, isLoading: offersLoading } = useQuery<(LoanOffer & { repayments?: LoanRepayment[] })[]>({
    queryKey: ["/api/loans/offers/creator"],
  });

  const form = useForm<ApplyFormData>({
    resolver: zodResolver(applyFormSchema),
    defaultValues: {
      programId: "",
      requestedAmount: 0,
      purpose: "",
      businessPlan: "",
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (data: ApplyFormData) => {
      // Validate amount is within program bounds
      const selectedProgram = programs?.find(p => p.id === data.programId);
      if (selectedProgram) {
        const amountCents = Math.round(data.requestedAmount * 100);
        const minCents = selectedProgram.minLoanAmount;
        const maxCents = selectedProgram.maxLoanAmount;
        
        if (amountCents < minCents || amountCents > maxCents) {
          throw new Error(`Amount must be between ${formatCurrency(minCents)} and ${formatCurrency(maxCents)}`);
        }
        
        return apiRequest("/api/loans/applications", "POST", {
          programId: data.programId,
          requestedAmount: amountCents,
          purpose: data.purpose,
          businessPlan: data.businessPlan || null,
        });
      }
      
      throw new Error("Please select a valid loan program");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans/applications/creator"] });
      toast({ title: "Application submitted", description: "Your loan application has been submitted for review." });
      form.reset();
      setShowApplyForm(false);
    },
    onError: (error: any) => {
      toast({ title: "Application failed", description: error.message, variant: "destructive" });
    },
  });

  const acceptOfferMutation = useMutation({
    mutationFn: async (offerId: string) => {
      return apiRequest(`/api/loans/offers/${offerId}/accept`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans/offers/creator"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loans/applications/creator"] });
      toast({ title: "Offer accepted", description: "Loan funds are now in escrow and will be released to you." });
    },
    onError: (error: any) => {
      toast({ title: "Accept failed", description: error.message, variant: "destructive" });
    },
  });

  const rejectOfferMutation = useMutation({
    mutationFn: async (offerId: string) => {
      return apiRequest(`/api/loans/offers/${offerId}/reject`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans/offers/creator"] });
      toast({ title: "Offer rejected", description: "The loan offer has been declined." });
    },
    onError: (error: any) => {
      toast({ title: "Reject failed", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: ApplyFormData) => {
    applyMutation.mutate(data);
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any }> = {
      pending: { variant: "outline", icon: Clock },
      approved: { variant: "default", icon: CheckCircle2 },
      active: { variant: "default", icon: TrendingUp },
      repaid: { variant: "secondary", icon: CheckCircle2 },
      defaulted: { variant: "destructive", icon: XCircle },
      cancelled: { variant: "secondary", icon: XCircle },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} data-testid={`badge-status-${status}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent" data-testid="text-page-title">
              Creator Loan Dashboard
            </h1>
            <p className="text-gray-400 mt-2">Apply for loans and manage repayments</p>
          </div>
          <Button
            onClick={() => setShowApplyForm(!showApplyForm)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            data-testid="button-toggle-apply"
          >
            {showApplyForm ? "Cancel" : "Apply for Loan"}
          </Button>
        </div>

        {showApplyForm && (
          <Card className="bg-gray-800/50 border-cyan-500/20 mb-8" data-testid="card-apply-form">
            <CardHeader>
              <CardTitle className="text-cyan-400">Apply for a Loan</CardTitle>
              <CardDescription>Select a program and submit your application</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="programId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loan Program</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-700 border-gray-600" data-testid="select-program">
                              <SelectValue placeholder="Select a program" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {programs?.map((program) => (
                              <SelectItem key={program.id} value={program.id} data-testid={`option-program-${program.id}`}>
                                {program.name} ({formatCurrency(program.minLoanAmount)} - {formatCurrency(program.maxLoanAmount)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requestedAmount"
                    render={({ field }) => {
                      const selectedProgram = programs?.find(p => p.id === form.watch("programId"));
                      return (
                        <FormItem>
                          <FormLabel>Requested Amount (USD)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="5000.00"
                              className="bg-gray-700 border-gray-600"
                              data-testid="input-amount"
                              {...field}
                            />
                          </FormControl>
                          {selectedProgram && (
                            <p className="text-sm text-gray-400">
                              Range: {formatCurrency(selectedProgram.minLoanAmount)} - {formatCurrency(selectedProgram.maxLoanAmount)}
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loan Purpose</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Explain how you'll use the funds..."
                            className="bg-gray-700 border-gray-600 min-h-[100px]"
                            data-testid="input-purpose"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessPlan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Plan (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Detailed business plan..."
                            className="bg-gray-700 border-gray-600 min-h-[150px]"
                            data-testid="input-business-plan"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={applyMutation.isPending || programsLoading || !programs || programs.length === 0}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                    data-testid="button-submit-application"
                  >
                    {applyMutation.isPending ? "Submitting..." : programsLoading ? "Loading programs..." : programs?.length === 0 ? "No programs available" : "Submit Application"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="programs" className="space-y-6">
          <TabsList className="bg-gray-800 border border-gray-700">
            <TabsTrigger value="programs" data-testid="tab-programs">Available Programs</TabsTrigger>
            <TabsTrigger value="applications" data-testid="tab-applications">My Applications</TabsTrigger>
            <TabsTrigger value="active" data-testid="tab-active">Active Loans</TabsTrigger>
          </TabsList>

          <TabsContent value="programs">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {programsLoading ? (
                <div className="col-span-full text-center py-12 text-gray-400">Loading programs...</div>
              ) : programs?.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-400">No programs available</div>
              ) : (
                programs?.map((program) => (
                  <Card key={program.id} className="bg-gray-800/50 border-cyan-500/20" data-testid={`card-program-${program.id}`}>
                    <CardHeader>
                      <CardTitle className="text-cyan-400">{program.name}</CardTitle>
                      <CardDescription>{program.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Loan Range:</span>
                        <span className="font-semibold" data-testid={`text-range-${program.id}`}>
                          {formatCurrency(program.minLoanAmount)} - {formatCurrency(program.maxLoanAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Interest Rate:</span>
                        <span className="font-semibold" data-testid={`text-interest-${program.id}`}>{program.interestRatePercent}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Term:</span>
                        <span className="font-semibold" data-testid={`text-term-${program.id}`}>{program.termMonths} months</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Platform Fee:</span>
                        <span className="font-semibold">{program.platformFeePercent}%</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="applications">
            <div className="space-y-4">
              {applicationsLoading ? (
                <div className="text-center py-12 text-gray-400">Loading applications...</div>
              ) : applications?.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No applications yet</div>
              ) : (
                applications?.map((app) => (
                  <Card key={app.id} className="bg-gray-800/50 border-cyan-500/20" data-testid={`card-application-${app.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-cyan-400">Loan Application</CardTitle>
                          <CardDescription>Requested {formatCurrency(app.requestedAmount)}</CardDescription>
                        </div>
                        {getStatusBadge(app.status || "pending")}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="text-gray-400">Purpose:</span>
                        <p className="mt-1" data-testid={`text-purpose-${app.id}`}>{app.purpose}</p>
                      </div>
                      {app.businessPlan && (
                        <div>
                          <span className="text-gray-400">Business Plan:</span>
                          <p className="mt-1 text-sm text-gray-300" data-testid={`text-plan-${app.id}`}>{app.businessPlan}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="w-4 h-4" />
                        Applied {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "Unknown"}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="active">
            <div className="space-y-6">
              {offersLoading ? (
                <div className="text-center py-12 text-gray-400">Loading active loans...</div>
              ) : activeOffers?.filter(o => o.status === "active").length === 0 ? (
                <div className="text-center py-12 text-gray-400">No active loans</div>
              ) : (
                activeOffers?.filter(o => o.status === "active").map((offer) => (
                  <Card key={offer.id} className="bg-gray-800/50 border-cyan-500/20" data-testid={`card-loan-${offer.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-cyan-400">Active Loan</CardTitle>
                          <CardDescription>
                            {formatCurrency(offer.offeredAmount)} at {offer.interestRate}% for {offer.termMonths} months
                          </CardDescription>
                        </div>
                        {getStatusBadge(offer.status || "pending")}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-400">Total Amount:</span>
                          <p className="text-xl font-bold text-cyan-400" data-testid={`text-amount-${offer.id}`}>
                            {formatCurrency(offer.offeredAmount)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">Interest Rate:</span>
                          <p className="text-xl font-bold text-cyan-400" data-testid={`text-rate-${offer.id}`}>
                            {offer.interestRate}%
                          </p>
                        </div>
                      </div>

                      {offer.repayments && offer.repayments.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3">Repayment Schedule</h4>
                          <div className="space-y-2">
                            {offer.repayments.slice(0, 5).map((repayment) => (
                              <div
                                key={repayment.id}
                                className="flex items-center justify-between p-3 bg-gray-700/30 rounded"
                                data-testid={`row-repayment-${repayment.id}`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-gray-400">Installment #{repayment.installmentNumber}</span>
                                  {repayment.status === "paid" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                  {repayment.status === "late" && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                                  {repayment.status === "missed" && <XCircle className="w-4 h-4 text-red-500" />}
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold" data-testid={`text-repay-amount-${repayment.id}`}>
                                    {formatCurrency(repayment.amountDue)}
                                  </p>
                                  <p className="text-sm text-gray-400">
                                    Due {new Date(repayment.dueDate).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
