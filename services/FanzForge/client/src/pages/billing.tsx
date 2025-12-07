import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
  current?: boolean;
}

interface PaymentHistory {
  id: string;
  date: string;
  amount: string;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  invoice: string;
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$9',
    period: '/month',
    features: [
      '5 Projects',
      'Basic Templates',
      'Community Support',
      '1GB Storage',
      'Standard Analytics'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    period: '/month',
    features: [
      '25 Projects',
      'All Templates',
      'Priority Support',
      '10GB Storage',
      'Advanced Analytics',
      'Custom Domains',
      'Team Collaboration'
    ],
    popular: true,
    current: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    features: [
      'Unlimited Projects',
      'All Templates + Custom',
      '24/7 Phone Support',
      '100GB Storage',
      'Advanced Analytics + API',
      'Custom Domains',
      'Advanced Team Features',
      'SLA Guarantee',
      'White Label Option'
    ]
  }
];

const paymentHistory: PaymentHistory[] = [
  {
    id: 'inv_001',
    date: '2024-01-15',
    amount: '$29.00',
    status: 'paid',
    description: 'Pro Plan - Monthly Subscription',
    invoice: 'INV-2024-001'
  },
  {
    id: 'inv_002',
    date: '2023-12-15',
    amount: '$29.00',
    status: 'paid',
    description: 'Pro Plan - Monthly Subscription',
    invoice: 'INV-2023-012'
  },
  {
    id: 'inv_003',
    date: '2023-11-15',
    amount: '$29.00',
    status: 'paid',
    description: 'Pro Plan - Monthly Subscription',
    invoice: 'INV-2023-011'
  },
  {
    id: 'inv_004',
    date: '2023-10-15',
    amount: '$29.00',
    status: 'paid',
    description: 'Pro Plan - Monthly Subscription',
    invoice: 'INV-2023-010'
  }
];

export default function Billing() {
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState('pro');

  const handlePlanChange = (planId: string) => {
    setSelectedPlan(planId);
    // Handle plan change logic here
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    // Handle invoice download
    console.log(`Downloading invoice: ${invoiceId}`);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-8">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  onClick={() => setLocation("/")}
                  className="mb-4"
                  data-testid="button-back"
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Back to Dashboard
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Return to your main dashboard</p>
              </TooltipContent>
            </Tooltip>
            
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
                <p className="text-muted-foreground">
                  Manage your subscription, payment methods, and billing history.
                </p>
              </div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-right"
              >
                <div className="text-2xl font-bold text-green-400">$29.00</div>
                <div className="text-sm text-muted-foreground">Current monthly charge</div>
              </motion.div>
            </div>
          </div>

          <Tabs defaultValue="subscription" className="space-y-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="subscription" data-testid="tab-subscription">
                <i className="fas fa-crown mr-2"></i>Subscription
              </TabsTrigger>
              <TabsTrigger value="payment-methods" data-testid="tab-payment-methods">
                <i className="fas fa-credit-card mr-2"></i>Payment Methods
              </TabsTrigger>
              <TabsTrigger value="history" data-testid="tab-history">
                <i className="fas fa-history mr-2"></i>Billing History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="subscription" className="space-y-6">
              {/* Current Plan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Current Subscription</CardTitle>
                    <CardDescription>
                      You are currently subscribed to the Pro plan.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                          <i className="fas fa-crown text-primary"></i>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">Pro Plan</h3>
                          <p className="text-sm text-muted-foreground">
                            Next billing date: February 15, 2024
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">$29</div>
                        <div className="text-sm text-muted-foreground">/month</div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 mt-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" data-testid="button-upgrade-plan">
                            <i className="fas fa-arrow-up mr-2"></i>
                            Upgrade Plan
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Upgrade to a higher tier plan</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" data-testid="button-cancel-subscription">
                            <i className="fas fa-times mr-2"></i>
                            Cancel Subscription
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Cancel your current subscription</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Available Plans */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Available Plans</CardTitle>
                    <CardDescription>
                      Choose the plan that best fits your needs.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      {subscriptionPlans.map((plan, index) => (
                        <motion.div
                          key={plan.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.02, y: -4 }}
                          className={`relative border rounded-lg p-6 ${
                            plan.popular ? 'border-primary shadow-lg shadow-primary/20' : 'border-border'
                          } ${plan.current ? 'bg-primary/5' : 'bg-card'}`}
                        >
                          {plan.popular && (
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                              <Badge className="bg-primary text-primary-foreground">
                                <i className="fas fa-star mr-1"></i>Most Popular
                              </Badge>
                            </div>
                          )}
                          
                          {plan.current && (
                            <div className="absolute -top-3 right-4">
                              <Badge variant="secondary">
                                <i className="fas fa-check mr-1"></i>Current
                              </Badge>
                            </div>
                          )}

                          <div className="text-center mb-6">
                            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                            <div className="flex items-baseline justify-center">
                              <span className="text-3xl font-bold">{plan.price}</span>
                              <span className="text-muted-foreground ml-1">{plan.period}</span>
                            </div>
                          </div>

                          <ul className="space-y-3 mb-6">
                            {plan.features.map((feature, idx) => (
                              <li key={idx} className="flex items-center">
                                <i className="fas fa-check text-green-400 mr-3"></i>
                                <span className="text-sm">{feature}</span>
                              </li>
                            ))}
                          </ul>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                className="w-full"
                                variant={plan.current ? 'secondary' : 'default'}
                                disabled={plan.current}
                                onClick={() => handlePlanChange(plan.id)}
                                data-testid={`button-select-${plan.id}`}
                              >
                                {plan.current ? (
                                  <>
                                    <i className="fas fa-check mr-2"></i>
                                    Current Plan
                                  </>
                                ) : (
                                  <>
                                    <i className="fas fa-arrow-up mr-2"></i>
                                    {plan.price === '$9' ? 'Downgrade' : 'Upgrade'} to {plan.name}
                                  </>
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{plan.current ? 'This is your current plan' : `Switch to the ${plan.name} plan`}</p>
                            </TooltipContent>
                          </Tooltip>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="payment-methods" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                    <CardDescription>
                      Manage your payment methods and billing information.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Primary Payment Method */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center">
                            <i className="fab fa-cc-visa text-white text-sm"></i>
                          </div>
                          <div>
                            <p className="font-medium">Visa ending in 4242</p>
                            <p className="text-sm text-muted-foreground">Expires 12/2027</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">Primary</Badge>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" data-testid="button-edit-payment">
                                <i className="fas fa-edit mr-2"></i>
                                Edit
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit this payment method</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>

                    {/* Add New Payment Method */}
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <i className="fas fa-plus text-3xl text-muted-foreground mb-4"></i>
                      <h3 className="text-lg font-medium mb-2">Add Payment Method</h3>
                      <p className="text-muted-foreground mb-4">
                        Add a new credit card or payment method to your account.
                      </p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button data-testid="button-add-payment-method">
                            <i className="fas fa-credit-card mr-2"></i>
                            Add Payment Method
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add a new credit card or payment method</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Billing Address */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">Billing Address</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>John Doe</p>
                        <p>123 Main Street</p>
                        <p>San Francisco, CA 94102</p>
                        <p>United States</p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" className="mt-3" data-testid="button-edit-address">
                            <i className="fas fa-edit mr-2"></i>
                            Edit Address
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Update your billing address</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Billing History</CardTitle>
                    <CardDescription>
                      View your past invoices and payment history.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {paymentHistory.map((payment, index) => (
                        <motion.div
                          key={payment.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-3 h-3 rounded-full ${
                              payment.status === 'paid' ? 'bg-green-400' : 
                              payment.status === 'pending' ? 'bg-yellow-400' : 'bg-red-400'
                            }`}></div>
                            <div>
                              <p className="font-medium">{payment.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(payment.date).toLocaleDateString()} • {payment.invoice}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="font-medium">{payment.amount}</p>
                              <Badge 
                                variant={payment.status === 'paid' ? 'secondary' : 'destructive'}
                                className="text-xs"
                              >
                                {payment.status}
                              </Badge>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDownloadInvoice(payment.invoice)}
                                  data-testid={`button-download-${payment.id}`}
                                >
                                  <i className="fas fa-download"></i>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Download invoice PDF</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="mt-6 text-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" data-testid="button-load-more">
                            <i className="fas fa-ellipsis-h mr-2"></i>
                            Load More History
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Load more billing history</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
}