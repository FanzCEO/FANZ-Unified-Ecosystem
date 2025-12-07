import { useState, useEffect } from "react";
import type { TourStep } from "@/components/OnboardingTour";

const TOUR_STORAGE_KEY = "fanz-forge-tour-completed";

export function useTour() {
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourCompleted, setTourCompleted] = useState(false);

  useEffect(() => {
    // Check if tour was already completed
    const completed = localStorage.getItem(TOUR_STORAGE_KEY) === "true";
    setTourCompleted(completed);
    
    // Start tour automatically for new users after a short delay
    if (!completed) {
      const timer = setTimeout(() => {
        setIsTourActive(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const startTour = () => {
    setIsTourActive(true);
  };

  const completeTour = () => {
    setIsTourActive(false);
    setTourCompleted(true);
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
  };

  const skipTour = () => {
    setIsTourActive(false);
    setTourCompleted(true);
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
  };

  const resetTour = () => {
    setTourCompleted(false);
    localStorage.removeItem(TOUR_STORAGE_KEY);
  };

  return {
    isTourActive,
    tourCompleted,
    startTour,
    completeTour,
    skipTour,
    resetTour
  };
}

// Define tour steps for the home page
export const homeTourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to FANZ Forge! 🚀",
    content: "Let's take a quick tour to show you how to build amazing creator economy apps with AI-powered tools.",
    target: "[data-testid='button-new-project']",
    position: "bottom"
  },
  {
    id: "new-project",
    title: "Create New Projects",
    content: "Start here to create a new project. Choose from our specialized templates for creator platforms, admin panels, and marketplaces.",
    target: "[data-testid='button-new-project']",
    position: "bottom",
    action: "none"
  },
  {
    id: "templates",
    title: "Browse Templates",
    content: "Explore our collection of pre-built templates designed specifically for the creator economy. Each template includes compliance tools and payment processing.",
    target: "[data-testid='button-browse-templates']",
    position: "bottom"
  },
  {
    id: "ai-agent",
    title: "AI Assistant",
    content: "Get help from our AI agent for development questions, code generation, and building custom features for your creator platform.",
    target: "[data-testid='button-ai-agent']",
    position: "bottom"
  },
  {
    id: "quick-templates",
    title: "Quick Start Templates",
    content: "These are our most popular templates to get you started quickly. Each includes everything you need for a production-ready creator app.",
    target: "[data-testid='card-template-paywall']",
    position: "right"
  },
  {
    id: "user-menu",
    title: "Your Account",
    content: "Access your profile, billing settings, and account preferences from here. Manage your subscription and view your usage statistics.",
    target: "[data-testid='dropdown-user-menu']",
    position: "left"
  },
  {
    id: "navigation",
    title: "Navigation Menu",
    content: "Use the navigation menu to access marketplace, analytics, and other features. Everything you need to manage your creator apps.",
    target: "[data-testid='nav-marketplace']",
    position: "bottom"
  },
  {
    id: "chat-support",
    title: "Get Support",
    content: "Need help? Click the chat bubble to get instant support from our team or AI assistant. We're here to help you succeed!",
    target: "[data-testid='button-toggle-chat']",
    position: "left"
  }
];