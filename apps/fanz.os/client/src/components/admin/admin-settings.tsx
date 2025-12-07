import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { 
  CreditCard, Percent, DollarSign, Settings, Globe, Shield, Mail, 
  Users, Video, RefreshCw, Save, AlertTriangle, CheckCircle,
  Trash2, Edit3, Plus, Bell
} from "lucide-react";

interface PaymentProcessorSetting {
  id: string;
  processor: string;
  isEnabled: boolean;
  feePercentage: string;
  feeFixed: string;
  minAmount: string;
  maxAmount?: string;
  testMode: boolean;
  supportedCurrencies: string[];
}

interface PlatformSetting {
  id: string;
  category: string;
  key: string;
  value: string;
  type: string;
  description?: string;
  isPublic: boolean;
}

interface TransactionRefund {
  id: string;
  transactionId: string;
  amount: string;
  reason?: string;
  status: string;
  createdAt: string;
}

export function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("payments");
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  // Fetch platform settings
  const { data: platformSettings = [] } = useQuery<PlatformSetting[]>({
    queryKey: ["/api/admin/settings/platform"],
  });

  // Fetch payment processor settings
  const { data: paymentProcessors = [] } = useQuery<PaymentProcessorSetting[]>({
    queryKey: ["/api/admin/settings/payment-processors"],
  });

  // Fetch recent transactions for refunds
  const { data: recentTransactions = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/transactions/recent"],
  });

  // Fetch refund history
  const { data: refundHistory = [] } = useQuery<TransactionRefund[]>({
    queryKey: ["/api/admin/refunds/history"],
  });

  // Update platform setting mutation
  const updatePlatformSettingMutation = useMutation({
    mutationFn: async ({ key, value, category }: { key: string; value: any; category: string }) => {
      return await apiRequest("PUT", `/api/admin/settings/platform/${key}`, { value, category });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/platform"] });
      toast({ title: "Setting Updated", description: "Platform setting has been updated successfully." });
    },
  });

  // Update payment processor mutation
  const updatePaymentProcessorMutation = useMutation({
    mutationFn: async (processor: PaymentProcessorSetting) => {
      return await apiRequest("PUT", `/api/admin/settings/payment-processors/${processor.processor}`, processor);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/payment-processors"] });
      toast({ title: "Processor Updated", description: "Payment processor settings have been updated." });
    },
  });

  // Process refund mutation
  const processRefundMutation = useMutation({
    mutationFn: async ({ transactionId, amount, reason }: { transactionId: string; amount: string; reason: string }) => {
      return await apiRequest("POST", `/api/admin/refunds`, { transactionId, amount, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/refunds/history"] });
      setShowRefundDialog(false);
      setSelectedTransaction(null);
      setRefundAmount("");
      setRefundReason("");
      toast({ title: "Refund Processed", description: "Refund has been processed successfully." });
    },
  });

  const getSetting = (key: string, defaultValue: any = "") => {
    const setting = platformSettings.find(s => s.key === key);
    return setting ? setting.value : defaultValue;
  };

  const updateSetting = (key: string, value: any, category: string = "general") => {
    updatePlatformSettingMutation.mutate({ key, value, category });
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  return (
    <div className="space-y-6" data-testid="admin-settings">
      <div>
        <h2 className="text-2xl font-bold text-white">Platform Settings</h2>
        <p className="text-gray-400 mt-1">Configure your platform's behavior and payment processing</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-6 w-full bg-gray-800">
          <TabsTrigger value="payments" data-testid="tab-payments">
            <CreditCard className="w-4 h-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="general" data-testid="tab-general">
            <Settings className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="content" data-testid="tab-content">
            <Video className="w-4 h-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">
            <Mail className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          {/* Platform Fees */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Percent className="w-5 h-5 mr-2 text-primary" />
                Platform Fees
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Platform Fee (%)</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      step="0.01"
                      value={getSetting("platform_fee_percentage", "15")}
                      onChange={(e) => updateSetting("platform_fee_percentage", e.target.value, "payments")}
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-platform-fee-percentage"
                    />
                    <Percent className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-400 mt-1">Percentage taken from each transaction</p>
                </div>
                <div>
                  <Label className="text-white">Platform Fee ($)</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={getSetting("platform_fee_fixed", "0.30")}
                      onChange={(e) => updateSetting("platform_fee_fixed", e.target.value, "payments")}
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-platform-fee-fixed"
                    />
                    <DollarSign className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-400 mt-1">Fixed fee added to each transaction</p>
                </div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Fee Preview</h4>
                <p className="text-sm text-gray-300">
                  For a $100 transaction: {formatCurrency((100 * parseFloat(getSetting("platform_fee_percentage", "15")) / 100) + parseFloat(getSetting("platform_fee_fixed", "0.30")))} platform fee
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Processors */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-primary" />
                Payment Processors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {paymentProcessors.map((processor) => (
                <div key={processor.processor} className="border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-semibold text-white capitalize">{processor.processor.replace('_', ' ')}</h4>
                      <Badge variant={processor.isEnabled ? "default" : "secondary"}>
                        {processor.isEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                      {processor.testMode && (
                        <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                          Test Mode
                        </Badge>
                      )}
                    </div>
                    <Switch
                      checked={processor.isEnabled}
                      onCheckedChange={(checked) => 
                        updatePaymentProcessorMutation.mutate({ 
                          ...processor, 
                          isEnabled: checked 
                        })
                      }
                      data-testid={`switch-processor-${processor.processor}`}
                    />
                  </div>
                  
                  {processor.isEnabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white">Processing Fee (%)</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            step="0.01"
                            value={processor.feePercentage}
                            onChange={(e) => 
                              updatePaymentProcessorMutation.mutate({ 
                                ...processor, 
                                feePercentage: e.target.value 
                              })
                            }
                            className="bg-gray-700 border-gray-600 text-white"
                            data-testid={`input-fee-percentage-${processor.processor}`}
                          />
                          <Percent className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-white">Fixed Fee ($)</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={processor.feeFixed}
                            onChange={(e) => 
                              updatePaymentProcessorMutation.mutate({ 
                                ...processor, 
                                feeFixed: e.target.value 
                              })
                            }
                            className="bg-gray-700 border-gray-600 text-white"
                            data-testid={`input-fee-fixed-${processor.processor}`}
                          />
                          <DollarSign className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-white">Minimum Amount ($)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={processor.minAmount}
                          onChange={(e) => 
                            updatePaymentProcessorMutation.mutate({ 
                              ...processor, 
                              minAmount: e.target.value 
                            })
                          }
                          className="bg-gray-700 border-gray-600 text-white"
                          data-testid={`input-min-amount-${processor.processor}`}
                        />
                      </div>
                      <div>
                        <Label className="text-white">Test Mode</Label>
                        <Switch
                          checked={processor.testMode}
                          onCheckedChange={(checked) => 
                            updatePaymentProcessorMutation.mutate({ 
                              ...processor, 
                              testMode: checked 
                            })
                          }
                          data-testid={`switch-test-mode-${processor.processor}`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Transaction Refunds */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center">
                  <RefreshCw className="w-5 h-5 mr-2 text-primary" />
                  Transaction Refunds
                </span>
                <Badge variant="outline" className="text-blue-400 border-blue-400">
                  {refundHistory.length} Total Refunds
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {recentTransactions.slice(0, 10).map((transaction: any) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border border-gray-600 rounded-lg">
                    <div>
                      <p className="font-semibold text-white">{formatCurrency(transaction.amount)}</p>
                      <p className="text-sm text-gray-400">
                        {transaction.type} • {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setRefundAmount(transaction.amount);
                        setShowRefundDialog(true);
                      }}
                      className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                      data-testid={`refund-transaction-${transaction.id}`}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Refund
                    </Button>
                  </div>
                ))}
              </div>
              
              {refundHistory.length > 0 && (
                <>
                  <Separator className="bg-gray-600" />
                  <div>
                    <h4 className="font-semibold text-white mb-3">Recent Refunds</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {refundHistory.slice(0, 5).map((refund) => (
                        <div key={refund.id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                          <div>
                            <p className="text-sm font-semibold text-white">{formatCurrency(refund.amount)}</p>
                            <p className="text-xs text-gray-400">{refund.reason || "No reason provided"}</p>
                          </div>
                          <Badge variant={refund.status === "completed" ? "default" : "secondary"}>
                            {refund.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Platform Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white">Platform Name</Label>
                <Input
                  value={getSetting("platform_name", "FanzLab")}
                  onChange={(e) => updateSetting("platform_name", e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  data-testid="input-platform-name"
                />
              </div>
              <div>
                <Label className="text-white">Platform Description</Label>
                <Textarea
                  value={getSetting("platform_description", "The premier platform for adult content creators")}
                  onChange={(e) => updateSetting("platform_description", e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={3}
                  data-testid="textarea-platform-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Support Email</Label>
                  <Input
                    type="email"
                    value={getSetting("support_email", "support@fanzlab.com")}
                    onChange={(e) => updateSetting("support_email", e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-support-email"
                  />
                </div>
                <div>
                  <Label className="text-white">Contact Phone</Label>
                  <Input
                    value={getSetting("contact_phone", "")}
                    onChange={(e) => updateSetting("contact_phone", e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-contact-phone"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Settings Tab */}
        <TabsContent value="content" className="space-y-6">
          {/* Post Limits */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Video className="w-5 h-5 mr-2 text-primary" />
                Content Posting Limits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Max Word Count per Post</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10000"
                    value={getSetting("max_post_word_count", "5000")}
                    onChange={(e) => updateSetting("max_post_word_count", e.target.value, "content")}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-max-word-count"
                  />
                  <p className="text-sm text-gray-400 mt-1">Maximum words allowed per post</p>
                </div>
                <div>
                  <Label className="text-white">Max Files per Post</Label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={getSetting("max_files_per_post", "10")}
                    onChange={(e) => updateSetting("max_files_per_post", e.target.value, "content")}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-max-files-per-post"
                  />
                  <p className="text-sm text-gray-400 mt-1">Maximum files per single post</p>
                </div>
                <div>
                  <Label className="text-white">Max File Size (MB)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="500"
                    value={getSetting("max_file_size_mb", "100")}
                    onChange={(e) => updateSetting("max_file_size_mb", e.target.value, "content")}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-max-file-size"
                  />
                  <p className="text-sm text-gray-400 mt-1">Maximum size per file in MB</p>
                </div>
                <div>
                  <Label className="text-white">Max Video Duration (minutes)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="120"
                    value={getSetting("max_video_duration_minutes", "30")}
                    onChange={(e) => updateSetting("max_video_duration_minutes", e.target.value, "content")}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-max-video-duration"
                  />
                  <p className="text-sm text-gray-400 mt-1">Maximum video length in minutes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Requirements */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-primary" />
                Creator Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Posts Required Before Feed Visibility</Label>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    value={getSetting("min_posts_for_feed", "5")}
                    onChange={(e) => updateSetting("min_posts_for_feed", e.target.value, "content")}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-min-posts-feed"
                  />
                  <p className="text-sm text-gray-400 mt-1">Posts needed before appearing in main feed</p>
                </div>
                <div>
                  <Label className="text-white">Posts Required Before Subscriptions</Label>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    value={getSetting("min_posts_for_subscription", "10")}
                    onChange={(e) => updateSetting("min_posts_for_subscription", e.target.value, "content")}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-min-posts-subscription"
                  />
                  <p className="text-sm text-gray-400 mt-1">Posts needed before users can subscribe</p>
                </div>
              </div>
              
              <Separator className="bg-gray-600" />
              
              <div>
                <h4 className="font-semibold text-white mb-4">Weekly Posting Requirements</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Minimum Photos per Week</Label>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      value={getSetting("weekly_min_photos", "3")}
                      onChange={(e) => updateSetting("weekly_min_photos", e.target.value, "content")}
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-weekly-min-photos"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Minimum Videos per Week</Label>
                    <Input
                      type="number"
                      min="0"
                      max="20"
                      value={getSetting("weekly_min_videos", "2")}
                      onChange={(e) => updateSetting("weekly_min_videos", e.target.value, "content")}
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-weekly-min-videos"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Minimum Stories per Week</Label>
                    <Input
                      type="number"
                      min="0"
                      max="30"
                      value={getSetting("weekly_min_stories", "5")}
                      onChange={(e) => updateSetting("weekly_min_stories", e.target.value, "content")}
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-weekly-min-stories"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Minimum Live Streams per Week</Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={getSetting("weekly_min_streams", "1")}
                      onChange={(e) => updateSetting("weekly_min_streams", e.target.value, "content")}
                      className="bg-gray-700 border-gray-600 text-white"
                      data-testid="input-weekly-min-streams"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div>
                  <p className="font-semibold text-white">Enforce Weekly Requirements</p>
                  <p className="text-sm text-gray-400">Automatically warn creators who don't meet requirements</p>
                </div>
                <Switch
                  checked={getSetting("enforce_weekly_requirements", "false") === "true"}
                  onCheckedChange={(checked) => updateSetting("enforce_weekly_requirements", checked.toString(), "content")}
                  data-testid="switch-enforce-weekly-requirements"
                />
              </div>
            </CardContent>
          </Card>

          {/* Content Moderation Settings */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Shield className="w-5 h-5 mr-2 text-primary" />
                Content Moderation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-gray-600 rounded-lg">
                  <div>
                    <p className="font-semibold text-white">Auto-Moderate New Posts</p>
                    <p className="text-sm text-gray-400">Automatically scan and moderate new content</p>
                  </div>
                  <Switch
                    checked={getSetting("auto_moderate_posts", "true") === "true"}
                    onCheckedChange={(checked) => updateSetting("auto_moderate_posts", checked.toString(), "content")}
                    data-testid="switch-auto-moderate"
                  />
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-600 rounded-lg">
                  <div>
                    <p className="font-semibold text-white">Require Manual Approval for New Creators</p>
                    <p className="text-sm text-gray-400">New creator posts need manual approval</p>
                  </div>
                  <Switch
                    checked={getSetting("manual_approval_new_creators", "true") === "true"}
                    onCheckedChange={(checked) => updateSetting("manual_approval_new_creators", checked.toString(), "content")}
                    data-testid="switch-manual-approval-new"
                  />
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-600 rounded-lg">
                  <div>
                    <p className="font-semibold text-white">AI Content Detection</p>
                    <p className="text-sm text-gray-400">Detect and flag AI-generated content</p>
                  </div>
                  <Switch
                    checked={getSetting("ai_content_detection", "true") === "true"}
                    onCheckedChange={(checked) => updateSetting("ai_content_detection", checked.toString(), "content")}
                    data-testid="switch-ai-detection"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Settings Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* User Registration Settings */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Users className="w-5 h-5 mr-2 text-primary" />
                Registration & Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Minimum Age Requirement</Label>
                  <Input
                    type="number"
                    min="18"
                    max="25"
                    value={getSetting("min_age_requirement", "18")}
                    onChange={(e) => updateSetting("min_age_requirement", e.target.value, "users")}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-min-age"
                  />
                  <p className="text-sm text-gray-400 mt-1">Minimum age for platform access</p>
                </div>
                <div>
                  <Label className="text-white">Username Min Length</Label>
                  <Input
                    type="number"
                    min="3"
                    max="20"
                    value={getSetting("username_min_length", "3")}
                    onChange={(e) => updateSetting("username_min_length", e.target.value, "users")}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-username-min-length"
                  />
                </div>
                <div>
                  <Label className="text-white">Username Max Length</Label>
                  <Input
                    type="number"
                    min="10"
                    max="50"
                    value={getSetting("username_max_length", "30")}
                    onChange={(e) => updateSetting("username_max_length", e.target.value, "users")}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-username-max-length"
                  />
                </div>
                <div>
                  <Label className="text-white">Max Subscriptions per User</Label>
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    value={getSetting("max_subscriptions_per_user", "100")}
                    onChange={(e) => updateSetting("max_subscriptions_per_user", e.target.value, "users")}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-max-subscriptions"
                  />
                </div>
              </div>
              
              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between p-3 border border-gray-600 rounded-lg">
                  <div>
                    <p className="font-semibold text-white">Email Verification Required</p>
                    <p className="text-sm text-gray-400">Users must verify email before account activation</p>
                  </div>
                  <Switch
                    checked={getSetting("require_email_verification", "true") === "true"}
                    onCheckedChange={(checked) => updateSetting("require_email_verification", checked.toString(), "users")}
                    data-testid="switch-email-verification"
                  />
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-600 rounded-lg">
                  <div>
                    <p className="font-semibold text-white">Phone Verification for Creators</p>
                    <p className="text-sm text-gray-400">Creators must verify phone number</p>
                  </div>
                  <Switch
                    checked={getSetting("require_phone_verification_creators", "true") === "true"}
                    onCheckedChange={(checked) => updateSetting("require_phone_verification_creators", checked.toString(), "users")}
                    data-testid="switch-phone-verification"
                  />
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-600 rounded-lg">
                  <div>
                    <p className="font-semibold text-white">Allow Guest Browsing</p>
                    <p className="text-sm text-gray-400">Allow non-registered users to browse public content</p>
                  </div>
                  <Switch
                    checked={getSetting("allow_guest_browsing", "false") === "true"}
                    onCheckedChange={(checked) => updateSetting("allow_guest_browsing", checked.toString(), "users")}
                    data-testid="switch-guest-browsing"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Creator Verification Settings */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-primary" />
                Creator Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Verification Documents Required</Label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={getSetting("verification_docs_required", "2")}
                    onChange={(e) => updateSetting("verification_docs_required", e.target.value, "users")}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-verification-docs"
                  />
                  <p className="text-sm text-gray-400 mt-1">Number of documents needed for verification</p>
                </div>
                <div>
                  <Label className="text-white">Verification Processing Days</Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={getSetting("verification_processing_days", "7")}
                    onChange={(e) => updateSetting("verification_processing_days", e.target.value, "users")}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-verification-days"
                  />
                  <p className="text-sm text-gray-400 mt-1">Maximum days for verification processing</p>
                </div>
              </div>
              
              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between p-3 border border-gray-600 rounded-lg">
                  <div>
                    <p className="font-semibold text-white">Auto-Approve Verified Creators</p>
                    <p className="text-sm text-gray-400">Automatically approve content from verified creators</p>
                  </div>
                  <Switch
                    checked={getSetting("auto_approve_verified", "true") === "true"}
                    onCheckedChange={(checked) => updateSetting("auto_approve_verified", checked.toString(), "users")}
                    data-testid="switch-auto-approve-verified"
                  />
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-600 rounded-lg">
                  <div>
                    <p className="font-semibold text-white">Require ID Verification</p>
                    <p className="text-sm text-gray-400">All creators must provide government ID</p>
                  </div>
                  <Switch
                    checked={getSetting("require_id_verification", "true") === "true"}
                    onCheckedChange={(checked) => updateSetting("require_id_verification", checked.toString(), "users")}
                    data-testid="switch-id-verification"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security" className="space-y-6">
          {/* Security Policies */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Shield className="w-5 h-5 mr-2 text-primary" />
                Security Policies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Login Attempt Limit</Label>
                  <Input
                    type="number"
                    min="3"
                    max="10"
                    value={getSetting("max_login_attempts", "5")}
                    onChange={(e) => updateSetting("max_login_attempts", e.target.value, "security")}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-max-login-attempts"
                  />
                  <p className="text-sm text-gray-400 mt-1">Failed attempts before account lockout</p>
                </div>
                <div>
                  <Label className="text-white">Account Lockout Duration (minutes)</Label>
                  <Input
                    type="number"
                    min="5"
                    max="1440"
                    value={getSetting("account_lockout_duration", "30")}
                    onChange={(e) => updateSetting("account_lockout_duration", e.target.value, "security")}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-lockout-duration"
                  />
                </div>
                <div>
                  <Label className="text-white">Session Timeout (hours)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="168"
                    value={getSetting("session_timeout_hours", "24")}
                    onChange={(e) => updateSetting("session_timeout_hours", e.target.value, "security")}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-session-timeout"
                  />
                </div>
                <div>
                  <Label className="text-white">Password Min Length</Label>
                  <Input
                    type="number"
                    min="8"
                    max="20"
                    value={getSetting("password_min_length", "8")}
                    onChange={(e) => updateSetting("password_min_length", e.target.value, "security")}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-password-min-length"
                  />
                </div>
              </div>
              
              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between p-3 border border-gray-600 rounded-lg">
                  <div>
                    <p className="font-semibold text-white">Two-Factor Authentication Required</p>
                    <p className="text-sm text-gray-400">Require 2FA for all creator accounts</p>
                  </div>
                  <Switch
                    checked={getSetting("require_2fa", "false") === "true"}
                    onCheckedChange={(checked) => updateSetting("require_2fa", checked.toString(), "security")}
                    data-testid="switch-require-2fa"
                  />
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-600 rounded-lg">
                  <div>
                    <p className="font-semibold text-white">IP Restriction Enabled</p>
                    <p className="text-sm text-gray-400">Block access from certain countries/regions</p>
                  </div>
                  <Switch
                    checked={getSetting("enable_ip_restrictions", "true") === "true"}
                    onCheckedChange={(checked) => updateSetting("enable_ip_restrictions", checked.toString(), "security")}
                    data-testid="switch-ip-restrictions"
                  />
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-600 rounded-lg">
                  <div>
                    <p className="font-semibold text-white">DMCA Protection</p>
                    <p className="text-sm text-gray-400">Automatic DMCA takedown processing</p>
                  </div>
                  <Switch
                    checked={getSetting("enable_dmca_protection", "true") === "true"}
                    onCheckedChange={(checked) => updateSetting("enable_dmca_protection", checked.toString(), "security")}
                    data-testid="switch-dmca-protection"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings Tab */}
        <TabsContent value="notifications" className="space-y-6">
          {/* Email Notifications */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Mail className="w-5 h-5 mr-2 text-primary" />
                Email Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-gray-600 rounded-lg">
                  <div>
                    <p className="font-semibold text-white">Welcome Email</p>
                    <p className="text-sm text-gray-400">Send welcome email to new users</p>
                  </div>
                  <Switch
                    checked={getSetting("send_welcome_email", "true") === "true"}
                    onCheckedChange={(checked) => updateSetting("send_welcome_email", checked.toString(), "notifications")}
                    data-testid="switch-welcome-email"
                  />
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-600 rounded-lg">
                  <div>
                    <p className="font-semibold text-white">New Follower Notifications</p>
                    <p className="text-sm text-gray-400">Notify creators of new followers</p>
                  </div>
                  <Switch
                    checked={getSetting("notify_new_followers", "true") === "true"}
                    onCheckedChange={(checked) => updateSetting("notify_new_followers", checked.toString(), "notifications")}
                    data-testid="switch-new-followers"
                  />
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-600 rounded-lg">
                  <div>
                    <p className="font-semibold text-white">Payment Notifications</p>
                    <p className="text-sm text-gray-400">Send payment success/failure notifications</p>
                  </div>
                  <Switch
                    checked={getSetting("notify_payments", "true") === "true"}
                    onCheckedChange={(checked) => updateSetting("notify_payments", checked.toString(), "notifications")}
                    data-testid="switch-payment-notifications"
                  />
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-600 rounded-lg">
                  <div>
                    <p className="font-semibold text-white">Weekly Creator Reports</p>
                    <p className="text-sm text-gray-400">Send weekly performance reports to creators</p>
                  </div>
                  <Switch
                    checked={getSetting("send_weekly_reports", "true") === "true"}
                    onCheckedChange={(checked) => updateSetting("send_weekly_reports", checked.toString(), "notifications")}
                    data-testid="switch-weekly-reports"
                  />
                </div>
              </div>
              
              <Separator className="bg-gray-600" />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Email Rate Limit (per hour)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    value={getSetting("email_rate_limit", "100")}
                    onChange={(e) => updateSetting("email_rate_limit", e.target.value, "notifications")}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-email-rate-limit"
                  />
                  <p className="text-sm text-gray-400 mt-1">Maximum emails sent per hour</p>
                </div>
                <div>
                  <Label className="text-white">SMS Rate Limit (per day)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={getSetting("sms_rate_limit", "10")}
                    onChange={(e) => updateSetting("sms_rate_limit", e.target.value, "notifications")}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="input-sms-rate-limit"
                  />
                  <p className="text-sm text-gray-400 mt-1">Maximum SMS sent per day</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Push Notifications */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Bell className="w-5 h-5 mr-2 text-primary" />
                Push Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-gray-600 rounded-lg">
                  <div>
                    <p className="font-semibold text-white">New Content Alerts</p>
                    <p className="text-sm text-gray-400">Notify users of new content from subscriptions</p>
                  </div>
                  <Switch
                    checked={getSetting("push_new_content", "true") === "true"}
                    onCheckedChange={(checked) => updateSetting("push_new_content", checked.toString(), "notifications")}
                    data-testid="switch-push-new-content"
                  />
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-600 rounded-lg">
                  <div>
                    <p className="font-semibold text-white">Live Stream Alerts</p>
                    <p className="text-sm text-gray-400">Notify when followed creators go live</p>
                  </div>
                  <Switch
                    checked={getSetting("push_live_streams", "true") === "true"}
                    onCheckedChange={(checked) => updateSetting("push_live_streams", checked.toString(), "notifications")}
                    data-testid="switch-push-live-streams"
                  />
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-600 rounded-lg">
                  <div>
                    <p className="font-semibold text-white">Message Notifications</p>
                    <p className="text-sm text-gray-400">Push notifications for new messages</p>
                  </div>
                  <Switch
                    checked={getSetting("push_messages", "true") === "true"}
                    onCheckedChange={(checked) => updateSetting("push_messages", checked.toString(), "notifications")}
                    data-testid="switch-push-messages"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Process Refund</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white">Transaction Amount</Label>
              <p className="text-2xl font-bold text-white">
                {selectedTransaction && formatCurrency(selectedTransaction.amount)}
              </p>
            </div>
            <div>
              <Label className="text-white">Refund Amount</Label>
              <Input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                data-testid="input-refund-amount"
              />
            </div>
            <div>
              <Label className="text-white">Reason for Refund</Label>
              <Textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Enter reason for refund..."
                rows={3}
                data-testid="textarea-refund-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => 
                selectedTransaction && 
                processRefundMutation.mutate({
                  transactionId: selectedTransaction.id,
                  amount: refundAmount,
                  reason: refundReason
                })
              }
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-process-refund"
            >
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}