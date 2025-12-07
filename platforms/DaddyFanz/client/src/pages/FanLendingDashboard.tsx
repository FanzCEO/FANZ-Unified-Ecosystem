import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DollarSign, Calendar, TrendingUp, Clock, CheckCircle2, XCircle, AlertCircle, User } from "lucide-react";
import type { LoanApplication, LoanOffer, LoanRepayment } from "@shared/schema";

const createOfferFormSchema = (maxAmountCents?: number) => z.object({
  offeredAmount: z.coerce.number()
    .positive("Amount must be greater than 0")
    .finite("Amount must be a valid number")
    .refine(
      (val) => !maxAmountCents || (val * 100) <= maxAmountCents,
      (val) => ({ message: `Offer cannot exceed requested amount of $${((maxAmountCents || 0) / 100).toFixed(2)}` })
    ),
  interestRate: z.coerce.number().min(0, "Interest rate must be 0 or higher").max(100, "Interest rate cannot exceed 100%"),
  termMonths: z.coerce.number().int().min(1, "Term must be at least 1 month").max(60, "Term cannot exceed 60 months"),
});

type OfferFormData = z.infer<ReturnType<typeof createOfferFormSchema>>;

export default function FanLendingDashboard() {
  const { toast } = useToast();
  const [selectedApplication, setSelectedApplication] = useState<LoanApplication | null>(null);

  const { data: opportunities, isLoading: opportunitiesLoading } = useQuery<LoanApplication[]>({
    queryKey: ["/api/loans/applications/all"],
  });

  const { data: myOffers, isLoading: offersLoading } = useQuery<(LoanOffer & { repayments?: LoanRepayment[] })[]>({
    queryKey: ["/api/loans/offers/lender"],
  });

  const offerFormSchema = useMemo(
    () => createOfferFormSchema(selectedApplication?.requestedAmount),
    [selectedApplication?.requestedAmount]
  );

  const form = useForm<OfferFormData>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      offeredAmount: 0,
      interestRate: 0,
      termMonths: 12,
    },
  });

  // Reset form validation when selected application changes
  useEffect(() => {
    if (selectedApplication) {
      form.trigger();
    }
  }, [selectedApplication, form]);

  const makeOfferMutation = useMutation({
    mutationFn: async (data: OfferFormData) => {
      if (!selectedApplication) {
        throw new Error("No application selected");
      }

      const amountCents = Math.round(data.offeredAmount * 100);
      const requestedCents = selectedApplication.requestedAmount;

      if (amountCents > requestedCents) {
        throw new Error(`Offer cannot exceed requested amount of ${formatCurrency(requestedCents)}`);
      }

      return apiRequest("/api/loans/offers", "POST", {
        applicationId: selectedApplication.id,
        creatorId: selectedApplication.creatorId,
        offeredAmount: amountCents,
        interestRate: data.interestRate.toString(),
        termMonths: data.termMonths,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans/offers/lender"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loans/applications/all"] });
      toast({ title: "Offer submitted", description: "Your loan offer has been sent to the creator." });
      form.reset();
      setSelectedApplication(null);
    },
    onError: (error: any) => {
      toast({ title: "Offer failed", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: OfferFormData) => {
    makeOfferMutation.mutate(data);
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

  const calculateMonthlyPayment = (principal: number, interestRate: number, months: number) => {
    if (interestRate === 0) {
      return principal / months;
    }
    const monthlyRate = interestRate / 100 / 12;
    const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    return payment;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent" data-testid="text-page-title">
            Lending Dashboard
          </h1>
          <p className="text-gray-400 mt-2">Support creators and earn returns on your investments</p>
        </div>

        <Tabs defaultValue="opportunities" className="space-y-6">
          <TabsList className="bg-gray-800 border border-gray-700">
            <TabsTrigger value="opportunities" data-testid="tab-opportunities">Lending Opportunities</TabsTrigger>
            <TabsTrigger value="my-offers" data-testid="tab-my-offers">My Offers</TabsTrigger>
            <TabsTrigger value="active" data-testid="tab-active">Active Loans</TabsTrigger>
          </TabsList>

          <TabsContent value="opportunities">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {opportunitiesLoading ? (
                <div className="col-span-full text-center py-12 text-gray-400">Loading opportunities...</div>
              ) : opportunities?.filter(app => app.status === "pending").length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-400">No lending opportunities available</div>
              ) : (
                opportunities?.filter(app => app.status === "pending").map((app) => (
                  <Card key={app.id} className="bg-gray-800/50 border-cyan-500/20" data-testid={`card-opportunity-${app.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-cyan-400 text-lg">Creator Loan Request</CardTitle>
                          <CardDescription className="mt-1">
                            Requesting {formatCurrency(app.requestedAmount)}
                          </CardDescription>
                        </div>
                        {getStatusBadge(app.status || "pending")}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <span className="text-gray-400 text-sm">Purpose:</span>
                        <p className="mt-1 text-sm" data-testid={`text-purpose-${app.id}`}>{app.purpose}</p>
                      </div>

                      {app.businessPlan && (
                        <div>
                          <span className="text-gray-400 text-sm">Business Plan:</span>
                          <p className="mt-1 text-xs text-gray-300 line-clamp-3" data-testid={`text-plan-${app.id}`}>
                            {app.businessPlan}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="w-4 h-4" />
                        Applied {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "Unknown"}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <User className="w-4 h-4" />
                        Creator ID: {app.creatorId.substring(0, 8)}...
                      </div>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => {
                              setSelectedApplication(app);
                              form.reset({
                                offeredAmount: app.requestedAmount / 100,
                                interestRate: 5,
                                termMonths: 12,
                              });
                            }}
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                            data-testid={`button-make-offer-${app.id}`}
                          >
                            Make Offer
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-800 border-cyan-500/20">
                          <DialogHeader>
                            <DialogTitle className="text-cyan-400">Make a Loan Offer</DialogTitle>
                            <DialogDescription>
                              Creator is requesting {selectedApplication ? formatCurrency(selectedApplication.requestedAmount) : "$0.00"}
                            </DialogDescription>
                          </DialogHeader>

                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                              <FormField
                                control={form.control}
                                name="offeredAmount"
                                render={({ field }) => {
                                  const maxAmount = selectedApplication ? selectedApplication.requestedAmount / 100 : 0;
                                  return (
                                    <FormItem>
                                      <FormLabel>Offer Amount (USD)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          placeholder="5000.00"
                                          className="bg-gray-700 border-gray-600"
                                          data-testid="input-offer-amount"
                                          {...field}
                                        />
                                      </FormControl>
                                      <p className="text-sm text-gray-400">
                                        Maximum: {formatCurrency(selectedApplication?.requestedAmount || 0)}
                                      </p>
                                      <FormMessage />
                                    </FormItem>
                                  );
                                }}
                              />

                              <FormField
                                control={form.control}
                                name="interestRate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Interest Rate (%)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.1"
                                        placeholder="5.0"
                                        className="bg-gray-700 border-gray-600"
                                        data-testid="input-interest-rate"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="termMonths"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Term (Months)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        placeholder="12"
                                        className="bg-gray-700 border-gray-600"
                                        data-testid="input-term-months"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {form.watch("offeredAmount") > 0 && form.watch("termMonths") > 0 && (
                                <div className="p-4 bg-gray-700/30 rounded space-y-2">
                                  <h4 className="font-semibold text-cyan-400">Loan Summary</h4>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Principal:</span>
                                    <span>{formatCurrency(Math.round(form.watch("offeredAmount") * 100))}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Monthly Payment:</span>
                                    <span>
                                      {formatCurrency(
                                        Math.round(
                                          calculateMonthlyPayment(
                                            form.watch("offeredAmount"),
                                            form.watch("interestRate"),
                                            form.watch("termMonths")
                                          ) * 100
                                        )
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Total Return:</span>
                                    <span>
                                      {formatCurrency(
                                        Math.round(
                                          calculateMonthlyPayment(
                                            form.watch("offeredAmount"),
                                            form.watch("interestRate"),
                                            form.watch("termMonths")
                                          ) * form.watch("termMonths") * 100
                                        )
                                      )}
                                    </span>
                                  </div>
                                </div>
                              )}

                              <Button
                                type="submit"
                                disabled={makeOfferMutation.isPending}
                                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                                data-testid="button-submit-offer"
                              >
                                {makeOfferMutation.isPending ? "Submitting..." : "Submit Offer"}
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="my-offers">
            <div className="space-y-4">
              {offersLoading ? (
                <div className="text-center py-12 text-gray-400">Loading offers...</div>
              ) : myOffers?.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No offers yet</div>
              ) : (
                myOffers?.map((offer) => (
                  <Card key={offer.id} className="bg-gray-800/50 border-cyan-500/20" data-testid={`card-offer-${offer.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-cyan-400">Loan Offer</CardTitle>
                          <CardDescription>
                            {formatCurrency(offer.offeredAmount)} at {offer.interestRate}% for {offer.termMonths} months
                          </CardDescription>
                        </div>
                        {getStatusBadge(offer.status || "pending")}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-400">Offered Amount:</span>
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
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <User className="w-4 h-4" />
                        Creator ID: {offer.creatorId.substring(0, 8)}...
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="w-4 h-4" />
                        Offered {offer.createdAt ? new Date(offer.createdAt).toLocaleDateString() : "Unknown"}
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
              ) : myOffers?.filter(o => o.status === "active").length === 0 ? (
                <div className="text-center py-12 text-gray-400">No active loans</div>
              ) : (
                myOffers?.filter(o => o.status === "active").map((offer) => (
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
                          <span className="text-gray-400">Principal:</span>
                          <p className="text-xl font-bold text-cyan-400" data-testid={`text-principal-${offer.id}`}>
                            {formatCurrency(offer.offeredAmount)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">Expected Return:</span>
                          <p className="text-xl font-bold text-green-400">
                            {formatCurrency(
                              Math.round(
                                calculateMonthlyPayment(
                                  offer.offeredAmount / 100,
                                  parseFloat(offer.interestRate),
                                  offer.termMonths
                                ) * offer.termMonths * 100
                              )
                            )}
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
                                  <span className="text-gray-400">Payment #{repayment.installmentNumber}</span>
                                  {repayment.status === "paid" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                  {repayment.status === "late" && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                                  {repayment.status === "missed" && <XCircle className="w-4 h-4 text-red-500" />}
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold" data-testid={`text-repay-amount-${repayment.id}`}>
                                    {formatCurrency(repayment.amountDue)}
                                  </p>
                                  <p className="text-sm text-gray-400">
                                    {repayment.status === "paid" && repayment.paidAt
                                      ? `Paid ${new Date(repayment.paidAt).toLocaleDateString()}`
                                      : `Due ${new Date(repayment.dueDate).toLocaleDateString()}`}
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
