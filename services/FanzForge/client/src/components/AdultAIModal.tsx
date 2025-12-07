import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AdultAIAgent from "@/components/AdultAIAgent";

interface AdultAIModalProps {
  projectId?: string;
  trigger?: React.ReactNode;
}

export default function AdultAIModal({ projectId, trigger }: AdultAIModalProps) {
  const [open, setOpen] = useState(false);

  const defaultTrigger = (
    <Button 
      className="px-3 py-1.5 neon-border rounded-md text-sm hover:shadow-lg transition-all"
      data-testid="button-adult-ai-agent"
    >
      <i className="fas fa-robot mr-2 text-red-400"></i>Adult AI Agent
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
              <i className="fas fa-robot text-white text-sm"></i>
            </div>
            <span>Adult AI Agent</span>
          </DialogTitle>
          <DialogDescription>
            Unrestricted AI assistant for adult content platform development.
            No language filters or content restrictions.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 h-full">
          <AdultAIAgent 
            projectId={projectId} 
            onClose={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}