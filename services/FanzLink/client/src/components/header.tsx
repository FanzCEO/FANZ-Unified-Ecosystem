import { Button } from "@/components/ui/button";
import { Moon, Sun, Settings, Link as LinkIcon } from "lucide-react";
import { useTheme } from "next-themes";

export function Header() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-dark-card/80 backdrop-blur-lg border-b border-gray-200 dark:border-dark-border">
      <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <LinkIcon className="text-white text-sm" data-testid="logo-icon" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white" data-testid="brand-name">
            FanzLink
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="bg-gray-100 dark:bg-dark-border hover:bg-gray-200 dark:hover:bg-gray-600"
            data-testid="button-theme-toggle"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          
          <Button className="bg-gradient-primary text-white hover:shadow-lg transition-all duration-200" data-testid="button-settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>
    </header>
  );
}
