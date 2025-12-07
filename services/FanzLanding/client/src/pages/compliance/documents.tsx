import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  Shield,
  Check,
  ChevronRight,
  CloudUpload,
  X,
  AlertCircle,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const documentUploadSchema = z.object({
  documentType: z.enum([
    "government_id",
    "selfie",
    "w9_form",
    "address_verification",
    "contract",
  ]),
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 16 * 1024 * 1024,
      "File size must be less than 16MB",
    ),
  notes: z.string().optional(),
});

type DocumentUploadForm = z.infer<typeof documentUploadSchema>;

interface UploadedDocument {
  id: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  status: "pending" | "verified" | "rejected";
}

export default function DocumentUpload() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<
    UploadedDocument[]
  >([]);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm<DocumentUploadForm>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {
      documentType: "government_id",
      notes: "",
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: DocumentUploadForm) => {
      const formData = new FormData();
      formData.append("file", data.file);
      formData.append("documentType", data.documentType);
      if (data.notes) formData.append("notes", data.notes);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/compliance/documents", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Document upload failed");
      }
      const result = await response.json();

      clearInterval(progressInterval);
      setUploadProgress(100);

      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "Document Uploaded Successfully",
        description:
          "Your document has been uploaded and is being processed for verification.",
      });

      // Add to uploaded documents list
      const newDoc: UploadedDocument = {
        id: data.id || Date.now().toString(),
        documentType: form.getValues("documentType"),
        fileName: previewFile?.name || "Unknown",
        fileSize: previewFile?.size || 0,
        uploadedAt: new Date().toISOString(),
        status: "pending",
      };

      setUploadedDocuments((prev) => [...prev, newDoc]);

      // Reset form
      form.reset();
      setPreviewFile(null);
      setPreviewUrl(null);
      setUploadProgress(0);
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const handleFileSelect = useCallback(
    (file: File) => {
      // Validate file
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "application/pdf",
      ];
      const maxSize = 16 * 1024 * 1024; // 16MB

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload JPG, PNG, GIF, or PDF files only.",
          variant: "destructive",
        });
        return;
      }

      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "File size must be less than 16MB.",
          variant: "destructive",
        });
        return;
      }

      setPreviewFile(file);
      form.setValue("file", file);

      // Create preview URL for images
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    },
    [form, toast],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = () => {
    setPreviewFile(null);
    setPreviewUrl(null);
    form.setValue("file", undefined as any);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const onSubmit = (data: DocumentUploadForm) => {
    uploadMutation.mutate(data);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      government_id: "Government ID",
      selfie: "Selfie/Liveness Photo",
      w9_form: "W-9 Tax Form",
      address_verification: "Address Verification",
      contract: "Signed Contract",
    };
    return labels[type] || type;
  };

  const requiredDocuments = [
    { type: "government_id", label: "Government Issued ID", required: true },
    { type: "selfie", label: "Selfie/Liveness Photo", required: true },
    { type: "w9_form", label: "W-9 or W-8BEN Tax Form", required: true },
    {
      type: "address_verification",
      label: "Address Verification",
      required: true,
    },
    { type: "contract", label: "Signed Contracts", required: false },
  ];

  const uploadedTypes = uploadedDocuments.map((doc) => doc.documentType);
  const requiredUploaded = requiredDocuments.filter(
    (doc) => doc.required && uploadedTypes.includes(doc.type),
  );
  const completionPercentage =
    (requiredUploaded.length /
      requiredDocuments.filter((doc) => doc.required).length) *
    100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-background to-cyan-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Progress Header */}
        <Card className="border-2 border-purple-500/20 bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              <Upload className="w-8 h-8 mx-auto mb-2 text-purple-400" />
              Document Upload
            </CardTitle>
            <CardDescription className="text-lg">
              Upload required documents for verification and compliance
            </CardDescription>

            {/* Progress Steps */}
            <div className="flex justify-center items-center space-x-8 mt-6">
              <div className="flex flex-col items-center text-green-400">
                <div className="w-10 h-10 rounded-full bg-green-500 border-2 border-green-500 flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
                <span className="text-sm mt-1">Personal Info</span>
              </div>

              <ChevronRight className="text-muted-foreground" />

              <div className="flex flex-col items-center text-purple-400">
                <div className="w-10 h-10 rounded-full bg-purple-500 border-2 border-purple-500 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-sm mt-1">Documents</span>
              </div>

              <ChevronRight className="text-muted-foreground" />

              <div className="flex flex-col items-center text-muted-foreground">
                <div className="w-10 h-10 rounded-full border-2 border-muted-foreground flex items-center justify-center">
                  <span>3</span>
                </div>
                <span className="text-sm mt-1">Review</span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Upload Progress</span>
                <span>{Math.round(completionPercentage)}% Complete</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Form */}
          <div className="lg:col-span-2">
            <Card className="border-2 border-purple-500/20 bg-card/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <CloudUpload className="w-5 h-5 mr-2" />
                  Upload Document
                </CardTitle>
                <CardDescription>
                  All documents are encrypted with AES-256 and securely stored
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="documentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Type *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select document type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="government_id">
                                Government Issued ID
                              </SelectItem>
                              <SelectItem value="selfie">
                                Selfie/Liveness Photo
                              </SelectItem>
                              <SelectItem value="w9_form">
                                W-9 or W-8BEN Tax Form
                              </SelectItem>
                              <SelectItem value="address_verification">
                                Address Verification
                              </SelectItem>
                              <SelectItem value="contract">
                                Signed Contract
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* File Upload Area */}
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
                        isDragOver
                          ? "border-cyan-400 bg-cyan-400/5"
                          : previewFile
                            ? "border-green-400 bg-green-400/5"
                            : "border-border hover:border-purple-400 hover:bg-purple-400/5"
                      }`}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() =>
                        document.getElementById("file-input")?.click()
                      }
                      data-testid="upload-area"
                    >
                      <input
                        id="file-input"
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(file);
                        }}
                        className="hidden"
                      />

                      {previewFile ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-center space-x-4">
                            {previewUrl ? (
                              <img
                                src={previewUrl}
                                alt="Preview"
                                className="w-32 h-32 object-cover rounded-lg border-2 border-green-400"
                              />
                            ) : (
                              <FileText className="w-16 h-16 text-green-400" />
                            )}
                            <div className="text-left">
                              <div className="font-medium text-green-400">
                                {previewFile.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatFileSize(previewFile.size)}
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFile();
                                }}
                                className="mt-2"
                              >
                                <X className="w-4 h-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <CloudUpload className="w-16 h-16 mx-auto text-purple-400" />
                          <div>
                            <h3 className="text-lg font-medium">
                              Drop your file here or click to browse
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Supported formats: JPG, PNG, PDF, GIF (Max 16MB)
                            </p>
                          </div>
                          <Button type="button" variant="outline">
                            Choose File
                          </Button>
                        </div>
                      )}
                    </div>

                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} />
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Optional notes about this document"
                              className="min-h-[80px]"
                              {...field}
                              data-testid="textarea-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                      disabled={uploadMutation.isPending || !previewFile}
                      data-testid="button-upload-document"
                    >
                      {uploadMutation.isPending ? (
                        "Uploading Document..."
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Document
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Required Documents & Uploaded Files */}
          <div className="space-y-6">
            {/* Required Documents */}
            <Card className="border-2 border-yellow-500/20 bg-yellow-500/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Required Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {requiredDocuments.map((doc) => {
                    const isUploaded = uploadedTypes.includes(doc.type);
                    return (
                      <div
                        key={doc.type}
                        className={`flex items-center space-x-3 p-3 rounded-lg border ${
                          isUploaded
                            ? "bg-green-500/10 border-green-500/20"
                            : "bg-background/50 border-border"
                        }`}
                      >
                        {isUploaded ? (
                          <Check className="w-5 h-5 text-green-400" />
                        ) : doc.required ? (
                          <AlertCircle className="w-5 h-5 text-yellow-400" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                        )}
                        <div className="flex-1">
                          <div
                            className={`text-sm font-medium ${isUploaded ? "text-green-400" : "text-foreground"}`}
                          >
                            {doc.label}
                          </div>
                          {doc.required && (
                            <div className="text-xs text-muted-foreground">
                              Required
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Uploaded Files */}
            {uploadedDocuments.length > 0 && (
              <Card className="border-2 border-green-500/20 bg-green-500/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Uploaded Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {uploadedDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-background/50 rounded-lg border"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {getDocumentTypeLabel(doc.documentType)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {doc.fileName} • {formatFileSize(doc.fileSize)}
                          </div>
                        </div>
                        <Badge
                          variant={
                            doc.status === "verified"
                              ? "default"
                              : doc.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                          className={
                            doc.status === "verified"
                              ? "bg-green-500/20 text-green-400"
                              : doc.status === "rejected"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-yellow-500/20 text-yellow-400"
                          }
                        >
                          {doc.status === "verified"
                            ? "Verified"
                            : doc.status === "rejected"
                              ? "Rejected"
                              : "Pending"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Continue Button */}
        {completionPercentage >= 100 && (
          <Card className="border-2 border-green-500/20 bg-green-500/5">
            <CardContent className="pt-6 text-center">
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <Check className="w-6 h-6 text-green-400" />
                  <span className="text-lg font-semibold text-green-400">
                    All Required Documents Uploaded
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your documents are being processed. You can now proceed to the
                  final verification step.
                </p>
                <Button
                  onClick={() => navigate("/compliance/verification-status")}
                  className="bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-700 hover:to-cyan-700"
                  data-testid="button-continue-verification"
                >
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Continue to Verification Status
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Notice */}
        <Card className="border-2 border-green-500/20 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <Shield className="w-8 h-8 text-green-400 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-2">
                  Document Security
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your documents are processed with bank-level security measures
                  and stored in our encrypted FanzHubVault.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>
                      Forensic tracking (IP, timestamp, device fingerprint)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>SHA-256 file hashing for integrity</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>Immutable audit trail</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>2257 compliance ready</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
