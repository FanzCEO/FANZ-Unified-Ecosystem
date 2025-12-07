// Adaptive Role-Specific Onboarding System
class AdaptiveOnboardingManager {
  constructor() {
    this.userRole = null;
    this.experienceLevel = null;
    this.progressiveFeatures = new Map();
    this.roleSpecificFlows = new Map();
    this.adaptationRules = new Map();

    this.init();
  }

  init() {
    this.detectUserRole();
    this.setupRoleSpecificFlows();
    this.initializeProgressiveDisclosure();
    this.setupAdaptationRules();
  }

  detectUserRole() {
    // Get role from page data or API
    this.userRole = document.body.dataset.userRole || "fan";
    this.experienceLevel =
      localStorage.getItem("experienceLevel") || "beginner";

    console.log(
      `Initializing adaptive onboarding for ${this.userRole} with ${this.experienceLevel} experience`,
    );
  }

  setupRoleSpecificFlows() {
    // Define specific flows for each role
    this.roleSpecificFlows.set("fan", {
      primaryGoals: [
        "discover_content",
        "interact_creators",
        "enjoy_community",
      ],
      keyFeatures: ["browse", "follow", "tip", "message"],
      onboardingPath: [
        "welcome",
        "discovery_tour",
        "interaction_guide",
        "preferences",
      ],
      urgentSteps: ["verification_setup"],
      optionalSteps: ["cluster_selection"],
    });

    this.roleSpecificFlows.set("star", {
      primaryGoals: ["create_content", "build_audience", "monetize"],
      keyFeatures: ["upload", "analytics", "monetization", "promotion"],
      onboardingPath: [
        "welcome",
        "creator_introduction",
        "profile_setup",
        "content_upload",
        "monetization_setup",
      ],
      urgentSteps: ["verification_setup", "goal_setting"],
      optionalSteps: ["advanced_features", "cluster_selection"],
    });

    this.roleSpecificFlows.set("moderator", {
      primaryGoals: ["moderate_content", "manage_community", "enforce_rules"],
      keyFeatures: ["moderation_tools", "reporting", "user_management"],
      onboardingPath: [
        "welcome",
        "moderation_training",
        "tools_overview",
        "policy_review",
      ],
      urgentSteps: ["verification_setup", "compliance_training"],
      optionalSteps: [],
    });

    this.roleSpecificFlows.set("admin", {
      primaryGoals: [
        "platform_management",
        "user_oversight",
        "system_monitoring",
      ],
      keyFeatures: [
        "admin_panel",
        "analytics",
        "user_management",
        "system_settings",
      ],
      onboardingPath: [
        "welcome",
        "admin_overview",
        "system_training",
        "responsibility_briefing",
      ],
      urgentSteps: ["verification_setup", "security_briefing"],
      optionalSteps: [],
    });
  }

  initializeProgressiveDisclosure() {
    // Progressive feature revelation based on experience level
    const featureComplexity = {
      beginner: ["basic_navigation", "profile_setup", "simple_interactions"],
      intermediate: [
        "content_creation",
        "basic_monetization",
        "community_features",
      ],
      advanced: ["analytics_dashboard", "advanced_settings", "api_access"],
      expert: ["admin_tools", "bulk_operations", "custom_integrations"],
    };

    // Hide features beyond user's experience level
    this.hideAdvancedFeatures(featureComplexity);
    this.setupFeatureUnlocking();
  }

  hideAdvancedFeatures(complexity) {
    const userLevelIndex = [
      "beginner",
      "intermediate",
      "advanced",
      "expert",
    ].indexOf(this.experienceLevel);

    // Hide features that are too advanced
    Object.keys(complexity).forEach((level, index) => {
      if (index > userLevelIndex) {
        complexity[level].forEach((featureClass) => {
          const elements = document.querySelectorAll(
            `[data-feature-complexity="${featureClass}"]`,
          );
          elements.forEach((el) => {
            el.style.display = "none";
            el.setAttribute("data-hidden-by-progressive-disclosure", "true");
          });
        });
      }
    });
  }

  setupFeatureUnlocking() {
    // Unlock features as user progresses
    this.progressiveFeatures.set("content_creation_unlocked", {
      condition: () => this.hasCompletedSteps(["profile_setup", "preferences"]),
      action: () => this.revealFeature("content-creation-tools"),
      message: "🎉 Content creation tools are now available!",
    });

    this.progressiveFeatures.set("monetization_unlocked", {
      condition: () =>
        this.hasCompletedSteps(["content_upload", "verification_setup"]),
      action: () => this.revealFeature("monetization-settings"),
      message: "💰 Monetization features unlocked!",
    });

    this.progressiveFeatures.set("analytics_unlocked", {
      condition: () =>
        this.hasCreatedContent() && this.experienceLevel !== "beginner",
      action: () => this.revealFeature("analytics-dashboard"),
      message: "📊 Analytics dashboard is now available!",
    });
  }

  setupAdaptationRules() {
    // Rules for adapting the onboarding based on user behavior
    this.adaptationRules.set("struggling_with_uploads", {
      trigger: { failedUploads: 3, timeSpent: ">300s" },
      adaptation: () => this.offerSimplifiedUpload(),
      message: "Having trouble with uploads? Try our simplified uploader!",
    });

    this.adaptationRules.set("fast_learner", {
      trigger: { stepsCompleted: ">5", averageTime: "<60s" },
      adaptation: () => this.offerAdvancedFeatures(),
      message: "You're a quick learner! Want to explore advanced features?",
    });

    this.adaptationRules.set("needs_more_guidance", {
      trigger: { timeOnStep: ">300s", helpClicks: ">2" },
      adaptation: () => this.offerPersonalizedHelp(),
      message: "Need more help? Let us guide you step by step!",
    });
  }

  // Role-specific customization methods
  customizeOnboardingForRole() {
    const roleFlow = this.roleSpecificFlows.get(this.userRole);
    if (!roleFlow) return;

    // Customize welcome message
    this.customizeWelcomeMessage(roleFlow);

    // Show role-specific features prominently
    this.highlightRoleFeatures(roleFlow.keyFeatures);

    // Customize call-to-action buttons
    this.customizeActionButtons(roleFlow);

    // Set up role-specific shortcuts
    this.setupRoleShortcuts(roleFlow);
  }

  customizeWelcomeMessage(roleFlow) {
    const welcomeMessages = {
      fan: {
        title: "Welcome to FANZ - Discover Amazing Content!",
        subtitle:
          "Connect with incredible creators and enjoy exclusive content",
        cta: "Start Exploring",
      },
      star: {
        title: "Welcome to FANZ - Your Creative Journey Starts Here!",
        subtitle:
          "Build your audience, monetize your content, and grow your brand",
        cta: "Start Creating",
      },
      moderator: {
        title: "Welcome to FANZ - Community Guardian",
        subtitle:
          "Help maintain a safe and welcoming environment for all users",
        cta: "Begin Training",
      },
      admin: {
        title: "Welcome to FANZ - Platform Administrator",
        subtitle: "Manage and oversee the platform operations",
        cta: "Access Admin Panel",
      },
    };

    const message = welcomeMessages[this.userRole];
    if (message) {
      this.updateWelcomeContent(message);
    }
  }

  updateWelcomeContent(message) {
    const titleElement = document.querySelector(".onboarding-title");
    const subtitleElement = document.querySelector(".onboarding-subtitle");
    const ctaButton = document.querySelector(".onboarding-cta");

    if (titleElement) titleElement.textContent = message.title;
    if (subtitleElement) subtitleElement.textContent = message.subtitle;
    if (ctaButton) ctaButton.textContent = message.cta;
  }

  highlightRoleFeatures(keyFeatures) {
    keyFeatures.forEach((feature) => {
      const elements = document.querySelectorAll(`[data-feature="${feature}"]`);
      elements.forEach((el) => {
        el.classList.add("role-highlight");
        this.addFeatureBadge(el, "Key Feature");
      });
    });
  }

  addFeatureBadge(element, text) {
    const badge = document.createElement("span");
    badge.className = "feature-badge role-specific";
    badge.textContent = text;
    badge.style.cssText = `
            position: absolute;
            top: -8px;
            right: -8px;
            background: linear-gradient(135deg, #ff6b6b, #ee5a52);
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
            z-index: 10;
        `;

    element.style.position = "relative";
    element.appendChild(badge);
  }

  customizeActionButtons(roleFlow) {
    const actionTexts = {
      fan: {
        primary: "Discover Content",
        secondary: "Browse Creators",
      },
      star: {
        primary: "Create Content",
        secondary: "Set Up Profile",
      },
      moderator: {
        primary: "Start Training",
        secondary: "Review Guidelines",
      },
      admin: {
        primary: "Admin Dashboard",
        secondary: "System Overview",
      },
    };

    const texts = actionTexts[this.userRole];
    if (texts) {
      const primaryBtn = document.querySelector(".btn-primary");
      const secondaryBtn = document.querySelector(".btn-secondary");

      if (primaryBtn) primaryBtn.textContent = texts.primary;
      if (secondaryBtn) secondaryBtn.textContent = texts.secondary;
    }
  }

  // Experience-based adaptations
  adaptForExperienceLevel() {
    switch (this.experienceLevel) {
      case "beginner":
        this.enableBeginnerMode();
        break;
      case "intermediate":
        this.enableIntermediateMode();
        break;
      case "advanced":
        this.enableAdvancedMode();
        break;
      case "expert":
        this.enableExpertMode();
        break;
    }
  }

  enableBeginnerMode() {
    // Show extra guidance and tooltips
    this.addBeginnerHints();
    this.enableStepByStepMode();
    this.showProgressEncouragement();
  }

  addBeginnerHints() {
    const hints = {
      ".btn-primary": "Click here to proceed to the next step",
      ".profile-upload": "Upload a profile picture to personalize your account",
      ".preferences-section":
        "Customize these settings to improve your experience",
    };

    Object.entries(hints).forEach(([selector, hint]) => {
      const element = document.querySelector(selector);
      if (element) {
        element.setAttribute("data-beginner-hint", hint);
        element.addEventListener("mouseenter", (e) => {
          this.showBeginnerTooltip(e.target, hint);
        });
      }
    });
  }

  enableIntermediateMode() {
    // Show optional features and shortcuts
    this.revealOptionalFeatures();
    this.addShortcutHints();
  }

  enableAdvancedMode() {
    // Show advanced features and customization options
    this.revealAdvancedFeatures();
    this.enableQuickSetup();
  }

  enableExpertMode() {
    // Minimal guidance, maximum control
    this.hideBasicTutorials();
    this.enableBulkActions();
    this.showExpertShortcuts();
  }

  // Adaptive learning system
  learnFromUserBehavior(behavior) {
    // Analyze user interaction patterns
    const patterns = this.analyzeBehaviorPatterns(behavior);

    // Adapt interface based on learning
    if (patterns.preferenceForVisualLearning) {
      this.emphasizeVisualElements();
    }

    if (patterns.quickNavigator) {
      this.addNavigationShortcuts();
    }

    if (patterns.detailOriented) {
      this.showAdditionalDetails();
    }

    // Update user's inferred experience level
    if (patterns.suggestedLevel !== this.experienceLevel) {
      this.suggestLevelUpgrade(patterns.suggestedLevel);
    }
  }

  analyzeBehaviorPatterns(behavior) {
    const totalActions = behavior.length;
    const visualActions = behavior.filter(
      (b) => b.type === "click" && b.element.includes("visual"),
    ).length;
    const averageTime =
      behavior.reduce((sum, b) => sum + (b.duration || 0), 0) / totalActions;
    const helpRequests = behavior.filter(
      (b) => b.type === "help_request",
    ).length;

    return {
      preferenceForVisualLearning: visualActions / totalActions > 0.6,
      quickNavigator: averageTime < 5000, // Less than 5 seconds per action
      detailOriented: helpRequests > 3,
      suggestedLevel: this.inferExperienceLevel(behavior),
    };
  }

  inferExperienceLevel(behavior) {
    const quickActions = behavior.filter((b) => b.duration < 5000).length;
    const totalActions = behavior.length;
    const successRate =
      behavior.filter((b) => b.successful).length / totalActions;

    if (quickActions / totalActions > 0.8 && successRate > 0.9) {
      return "expert";
    } else if (quickActions / totalActions > 0.6 && successRate > 0.7) {
      return "advanced";
    } else if (successRate > 0.5) {
      return "intermediate";
    } else {
      return "beginner";
    }
  }

  // Utility methods
  hasCompletedSteps(stepIds) {
    const completedSteps = JSON.parse(
      localStorage.getItem("completedOnboardingSteps") || "[]",
    );
    return stepIds.every((stepId) => completedSteps.includes(stepId));
  }

  hasCreatedContent() {
    return localStorage.getItem("hasCreatedContent") === "true";
  }

  revealFeature(featureSelector) {
    const elements = document.querySelectorAll(
      `[data-feature="${featureSelector}"]`,
    );
    elements.forEach((el) => {
      el.style.display = "block";
      el.removeAttribute("data-hidden-by-progressive-disclosure");

      // Add reveal animation
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";

      setTimeout(() => {
        el.style.transition = "all 0.5s ease";
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }, 100);
    });
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `adaptive-notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === "success" ? "#4caf50" : "#2196f3"};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  // Public API methods
  adaptOnboarding() {
    this.customizeOnboardingForRole();
    this.adaptForExperienceLevel();
  }

  updateUserProgress(stepId, success = true) {
    const completedSteps = JSON.parse(
      localStorage.getItem("completedOnboardingSteps") || "[]",
    );
    if (success && !completedSteps.includes(stepId)) {
      completedSteps.push(stepId);
      localStorage.setItem(
        "completedOnboardingSteps",
        JSON.stringify(completedSteps),
      );
    }

    // Check for feature unlocks
    this.checkFeatureUnlocks();
  }

  checkFeatureUnlocks() {
    this.progressiveFeatures.forEach((unlock, key) => {
      if (unlock.condition()) {
        unlock.action();
        this.showNotification(unlock.message, "success");
        this.progressiveFeatures.delete(key); // Don't trigger again
      }
    });
  }
}

// Initialize adaptive onboarding when page loads
let adaptiveManager;
document.addEventListener("DOMContentLoaded", () => {
  adaptiveManager = new AdaptiveOnboardingManager();
  adaptiveManager.adaptOnboarding();

  // Expose for external use
  window.adaptiveOnboarding = adaptiveManager;
});

// Style for adaptive elements
const adaptiveStyles = document.createElement("style");
adaptiveStyles.textContent = `
    .role-highlight {
        border: 2px solid #bb86fc !important;
        box-shadow: 0 0 15px rgba(187, 134, 252, 0.3) !important;
    }
    
    .feature-badge.role-specific {
        animation: pulse 2s infinite;
    }
    
    .adaptive-notification {
        animation: slideInRight 0.3s ease;
    }
    
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .beginner-mode .tutorial-element {
        border: 2px dashed #4caf50;
        position: relative;
    }
    
    .beginner-mode .tutorial-element::after {
        content: '👆 Click here';
        position: absolute;
        top: -30px;
        left: 50%;
        transform: translateX(-50%);
        background: #4caf50;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        animation: bounce 1s infinite;
    }
    
    @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
        40% { transform: translateX(-50%) translateY(-10px); }
        60% { transform: translateX(-50%) translateY(-5px); }
    }
`;
document.head.appendChild(adaptiveStyles);
