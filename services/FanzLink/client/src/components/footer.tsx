import { Button } from "@/components/ui/button";
import { Link as LinkIcon, HelpCircle, Shield, FileText, Rocket } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white dark:bg-dark-card border-t border-gray-200 dark:border-dark-border py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <LinkIcon className="text-white" data-testid="footer-logo-icon" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="footer-brand-name">
              FanzLink
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            The ultimate FanzLink platform for creators
          </p>
          
          <div className="flex justify-center space-x-6 mb-8">
            <a 
              href="#" 
              className="text-gray-500 hover:text-fanz-purple transition-colors duration-200"
              data-testid="link-help"
            >
              <HelpCircle className="mr-2 h-4 w-4 inline" />Help
            </a>
            <a 
              href="#" 
              className="text-gray-500 hover:text-fanz-purple transition-colors duration-200"
              data-testid="link-privacy"
            >
              <Shield className="mr-2 h-4 w-4 inline" />Privacy
            </a>
            <a 
              href="#" 
              className="text-gray-500 hover:text-fanz-purple transition-colors duration-200"
              data-testid="link-terms"
            >
              <FileText className="mr-2 h-4 w-4 inline" />Terms
            </a>
          </div>
          
          <Button 
            className="w-full max-w-md bg-gradient-primary text-white py-4 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 mb-6"
            data-testid="button-create-fanzlink"
          >
            <Rocket className="mr-2 h-4 w-4" />
            Create Your FanzLink
          </Button>
          
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; 2024 FanzLink. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
