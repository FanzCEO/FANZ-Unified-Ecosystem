// Interactive Onboarding Enhancement System
class InteractiveOnboardingHelper {
  constructor() {
    this.currentHighlight = null;
    this.tooltips = new Map();
    this.progressiveDisclosure = new Map();
    this.userInteractions = [];

    this.init();
  }

  init() {
    this.createOverlayElements();
    this.setupEventListeners();
    this.initializeProgressiveDisclosure();
  }

  createOverlayElements() {
    // Create spotlight overlay
    if (!document.getElementById("spotlight-overlay")) {
      const overlay = document.createElement("div");
      overlay.id = "spotlight-overlay";
      overlay.className = "position-fixed w-100 h-100";
      overlay.style.cssText = `
                top: 0; left: 0; 
                background: rgba(0,0,0,0.8); 
                z-index: 9999; 
                display: none;
                pointer-events: none;
            `;
      document.body.appendChild(overlay);
    }

    // Create floating tooltip
    if (!document.getElementById("floating-tooltip")) {
      const tooltip = document.createElement("div");
      tooltip.id = "floating-tooltip";
      tooltip.className = "position-fixed";
      tooltip.style.cssText = `
                background: linear-gradient(135deg, rgba(187, 134, 252, 0.95), rgba(74, 86, 226, 0.95));
                color: white;
                padding: 1rem;
                border-radius: 12px;
                max-width: 320px;
                z-index: 10000;
                display: none;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.2);
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            `;
      document.body.appendChild(tooltip);
    }

    // Create progress indicator
    if (!document.getElementById("onboarding-progress-indicator")) {
      const progress = document.createElement("div");
      progress.id = "onboarding-progress-indicator";
      progress.className = "position-fixed";
      progress.style.cssText = `
                top: 20px; right: 20px;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 1rem;
                border-radius: 12px;
                z-index: 9998;
                display: none;
                min-width: 200px;
            `;
      progress.innerHTML = `
                <div class="d-flex align-items-center mb-2">
                    <i class="fas fa-route me-2"></i>
                    <span class="fw-bold">Onboarding Progress</span>
                </div>
                <div class="progress mb-2" style="height: 6px;">
                    <div class="progress-bar bg-primary" id="progress-fill" style="width: 0%"></div>
                </div>
                <small class="text-muted" id="progress-text">Getting started...</small>
            `;
      document.body.appendChild(progress);
    }
  }

  setupEventListeners() {
    // Track user interactions
    document.addEventListener("click", (e) => {
      this.trackInteraction("click", e.target);

      // Handle interactive hints
      if (e.target.hasAttribute("data-onboarding-hint")) {
        this.showInteractiveHint(e.target);
      }
    });

    // Keyboard shortcuts for onboarding
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "h") {
        e.preventDefault();
        this.toggleHelpMode();
      }
      if (e.key === "Escape") {
        this.hideAllOverlays();
      }
    });

    // Smart hover hints
    let hoverTimeout;
    document.addEventListener("mouseover", (e) => {
      if (e.target.hasAttribute("data-feature-hint")) {
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
          this.showSmartHint(e.target);
        }, 500);
      }
    });

    document.addEventListener("mouseout", (e) => {
      if (e.target.hasAttribute("data-feature-hint")) {
        clearTimeout(hoverTimeout);
        this.hideSmartHint();
      }
    });
  }

  // Progressive Feature Discovery
  initializeProgressiveDisclosure() {
    const userExperience = this.getUserExperienceLevel();
    const completedSteps = this.getCompletedSteps();

    // Hide advanced features for beginners
    if (userExperience === "beginner") {
      this.hideAdvancedFeatures();
      this.enableGuidedMode();
    }

    // Show features based on progress
    this.revealFeaturesBasedOnProgress(completedSteps);
  }

  hideAdvancedFeatures() {
    const advancedElements = document.querySelectorAll(
      '[data-difficulty="advanced"], [data-difficulty="expert"]',
    );
    advancedElements.forEach((element) => {
      element.style.display = "none";
      element.setAttribute("data-hidden-by-onboarding", "true");
    });
  }

  enableGuidedMode() {
    // Add guided tour indicators
    const keyElements = document.querySelectorAll("[data-tour-step]");
    keyElements.forEach((element, index) => {
      if (index < 3) {
        // Show first 3 steps
        this.addGuidedIndicator(element, index + 1);
      }
    });
  }

  addGuidedIndicator(element, stepNumber) {
    const indicator = document.createElement("div");
    indicator.className = "onboarding-step-indicator";
    indicator.style.cssText = `
            position: absolute;
            top: -10px;
            right: -10px;
            background: linear-gradient(135deg, #ff6b6b, #ee5a52);
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            z-index: 1000;
            animation: pulse 2s infinite;
        `;
    indicator.textContent = stepNumber;

    element.style.position = "relative";
    element.appendChild(indicator);

    // Add click handler for guided steps
    element.addEventListener("click", () => {
      this.explainFeature(element);
    });
  }

  // Smart Contextual Hints
  showSmartHint(element) {
    const hintText = element.getAttribute("data-feature-hint");
    const difficulty = element.getAttribute("data-difficulty") || "beginner";
    const tooltip = document.getElementById("floating-tooltip");

    if (!hintText) return;

    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + rect.width / 2 + "px";
    tooltip.style.top = rect.top - 10 + "px";
    tooltip.style.transform = "translate(-50%, -100%)";

    const difficultyIcon = this.getDifficultyIcon(difficulty);
    tooltip.innerHTML = `
            <div class="d-flex align-items-start">
                <div class="me-2">${difficultyIcon}</div>
                <div>
                    <div class="fw-bold mb-1">💡 Quick Tip</div>
                    <div style="font-size: 14px;">${hintText}</div>
                    ${difficulty !== "beginner" ? `<small class="text-white-50 mt-1 d-block">Difficulty: ${difficulty}</small>` : ""}
                </div>
            </div>
        `;

    tooltip.style.display = "block";

    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.hideSmartHint();
    }, 5000);
  }

  hideSmartHint() {
    document.getElementById("floating-tooltip").style.display = "none";
  }

  getDifficultyIcon(difficulty) {
    const icons = {
      beginner: "🌱",
      intermediate: "🌿",
      advanced: "🌳",
      expert: "👑",
    };
    return icons[difficulty] || "💡";
  }

  // Interactive Feature Spotlight
  spotlightFeature(selector, options = {}) {
    const element = document.querySelector(selector);
    if (!element) return;

    const overlay = document.getElementById("spotlight-overlay");
    const tooltip = document.getElementById("floating-tooltip");

    // Show overlay
    overlay.style.display = "block";

    // Create spotlight effect
    const rect = element.getBoundingClientRect();
    const spotlight = document.createElement("div");
    spotlight.style.cssText = `
            position: absolute;
            top: ${rect.top - 10}px;
            left: ${rect.left - 10}px;
            width: ${rect.width + 20}px;
            height: ${rect.height + 20}px;
            border: 3px solid #bb86fc;
            border-radius: 8px;
            box-shadow: 0 0 0 4000px rgba(0, 0, 0, 0.8);
            pointer-events: none;
            z-index: 10000;
        `;
    overlay.appendChild(spotlight);

    // Show explanation tooltip
    tooltip.style.left = rect.left + rect.width / 2 + "px";
    tooltip.style.top = rect.bottom + 20 + "px";
    tooltip.style.transform = "translateX(-50%)";
    tooltip.innerHTML = `
            <div>
                <div class="fw-bold mb-2">${options.title || "Feature Spotlight"}</div>
                <div class="mb-3">${options.description || "This is an important feature to explore."}</div>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-outline-light" onclick="interactiveHelper.hideSpotlight()">Skip</button>
                    <button class="btn btn-sm btn-light" onclick="interactiveHelper.nextSpotlight()">Got it!</button>
                </div>
            </div>
        `;
    tooltip.style.display = "block";

    this.currentHighlight = { element, spotlight, options };
  }

  hideSpotlight() {
    const overlay = document.getElementById("spotlight-overlay");
    overlay.style.display = "none";
    overlay.innerHTML = "";

    document.getElementById("floating-tooltip").style.display = "none";
    this.currentHighlight = null;
  }

  // Adaptive Onboarding Flow
  adaptOnboardingFlow(userBehavior) {
    const patterns = this.analyzeUserBehavior(userBehavior);

    if (patterns.needsMoreGuidance) {
      this.increaseGuidanceLevel();
    } else if (patterns.isExperienced) {
      this.enableAdvancedFeatures();
    }

    if (patterns.strugglingWith) {
      this.offerContextualHelp(patterns.strugglingWith);
    }
  }

  analyzeUserBehavior(behavior) {
    const patterns = {
      needsMoreGuidance: false,
      isExperienced: false,
      strugglingWith: null,
    };

    // Analyze click patterns, time spent, etc.
    const clicks = behavior.filter((b) => b.type === "click");
    const avgTimePerAction =
      behavior.reduce((sum, b) => sum + (b.duration || 0), 0) / behavior.length;

    if (clicks.length < 5 && avgTimePerAction > 30000) {
      // 30+ seconds per action
      patterns.needsMoreGuidance = true;
    }

    if (clicks.length > 20 && avgTimePerAction < 5000) {
      // <5 seconds per action
      patterns.isExperienced = true;
    }

    return patterns;
  }

  // Dynamic Tutorial System
  startInteractiveTutorial(tutorialConfig) {
    const tutorial = {
      steps: tutorialConfig.steps || [],
      currentStep: 0,
      config: tutorialConfig,
    };

    this.runTutorialStep(tutorial);
  }

  runTutorialStep(tutorial) {
    const step = tutorial.steps[tutorial.currentStep];
    if (!step) {
      this.completeTutorial(tutorial);
      return;
    }

    switch (step.type) {
      case "spotlight":
        this.spotlightFeature(step.selector, {
          title: step.title,
          description: step.description,
          onNext: () => this.nextTutorialStep(tutorial),
        });
        break;

      case "interactive":
        this.createInteractiveStep(step, tutorial);
        break;

      case "explanation":
        this.showExplanationStep(step, tutorial);
        break;
    }
  }

  nextTutorialStep(tutorial) {
    this.hideSpotlight();
    tutorial.currentStep++;
    this.runTutorialStep(tutorial);
  }

  // Progress Tracking and Adaptive Suggestions
  updateProgress(completedSteps, totalSteps) {
    const progressIndicator = document.getElementById(
      "onboarding-progress-indicator",
    );
    const progressFill = document.getElementById("progress-fill");
    const progressText = document.getElementById("progress-text");

    const percentage = (completedSteps / totalSteps) * 100;

    progressFill.style.width = percentage + "%";
    progressText.textContent = `${completedSteps} of ${totalSteps} steps completed`;

    if (percentage > 0) {
      progressIndicator.style.display = "block";
    }

    // Adaptive suggestions based on progress
    if (percentage >= 25 && percentage < 50) {
      this.suggestNextActions([
        "Explore content creation tools",
        "Set up your profile",
      ]);
    } else if (percentage >= 50 && percentage < 75) {
      this.suggestNextActions([
        "Connect with other creators",
        "Upload your first content",
      ]);
    } else if (percentage >= 75) {
      this.suggestNextActions([
        "Explore monetization options",
        "Join community discussions",
      ]);
    }
  }

  suggestNextActions(actions) {
    // Create floating action suggestions
    const existing = document.getElementById("action-suggestions");
    if (existing) existing.remove();

    const suggestions = document.createElement("div");
    suggestions.id = "action-suggestions";
    suggestions.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: linear-gradient(135deg, rgba(187, 134, 252, 0.95), rgba(74, 86, 226, 0.95));
            color: white;
            padding: 1rem;
            border-radius: 12px;
            max-width: 300px;
            z-index: 9997;
            backdrop-filter: blur(10px);
        `;

    suggestions.innerHTML = `
            <div class="d-flex align-items-center mb-2">
                <i class="fas fa-lightbulb me-2"></i>
                <span class="fw-bold">Suggested Next Steps</span>
                <button class="btn-close btn-close-white ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
            <ul class="list-unstyled mb-0">
                ${actions.map((action) => `<li class="mb-1">• ${action}</li>`).join("")}
            </ul>
        `;

    document.body.appendChild(suggestions);

    // Auto-hide after 10 seconds
    setTimeout(() => {
      suggestions.remove();
    }, 10000);
  }

  // Utility Methods
  trackInteraction(type, element) {
    this.userInteractions.push({
      type,
      element:
        element.tagName +
        (element.className ? "." + element.className.split(" ").join(".") : ""),
      timestamp: Date.now(),
      stepContext: this.getCurrentOnboardingStep(),
    });
  }

  getCurrentOnboardingStep() {
    // Get current step from the journey system
    return window.journey ? window.journey.currentStepIndex : 0;
  }

  getUserExperienceLevel() {
    // Get from user preferences or default to beginner
    return localStorage.getItem("userExperienceLevel") || "beginner";
  }

  getCompletedSteps() {
    // Get from progress tracking
    return JSON.parse(localStorage.getItem("completedOnboardingSteps") || "[]");
  }

  hideAllOverlays() {
    this.hideSpotlight();
    this.hideSmartHint();
    document
      .querySelectorAll("#action-suggestions")
      .forEach((el) => el.remove());
  }

  toggleHelpMode() {
    const helpMode = !document.body.classList.contains("help-mode");
    document.body.classList.toggle("help-mode", helpMode);

    if (helpMode) {
      this.showHelpModeIndicators();
    } else {
      this.hideHelpModeIndicators();
    }
  }

  showHelpModeIndicators() {
    // Highlight all interactive elements
    const interactiveElements = document.querySelectorAll(
      "[data-feature-hint], [data-onboarding-hint], [data-tour-step]",
    );
    interactiveElements.forEach((element) => {
      element.style.position = "relative";
      const indicator = document.createElement("div");
      indicator.className = "help-mode-indicator";
      indicator.style.cssText = `
                position: absolute;
                top: -5px;
                right: -5px;
                width: 12px;
                height: 12px;
                background: #ff6b6b;
                border-radius: 50%;
                animation: pulse 1.5s infinite;
                z-index: 1000;
            `;
      element.appendChild(indicator);
    });
  }

  hideHelpModeIndicators() {
    document.querySelectorAll(".help-mode-indicator").forEach((indicator) => {
      indicator.remove();
    });
  }
}

// Initialize the interactive onboarding helper
let interactiveHelper;
document.addEventListener("DOMContentLoaded", () => {
  interactiveHelper = new InteractiveOnboardingHelper();

  // Expose global methods for button callbacks
  window.interactiveHelper = interactiveHelper;
});

// CSS Animations
const style = document.createElement("style");
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.7; }
        100% { transform: scale(1); opacity: 1; }
    }
    
    .help-mode .help-mode-indicator {
        animation: pulse 1.5s infinite;
    }
    
    .onboarding-highlight {
        position: relative;
        z-index: 1001;
    }
    
    .onboarding-highlight::before {
        content: '';
        position: absolute;
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        border: 2px solid #bb86fc;
        border-radius: 8px;
        animation: pulse 2s infinite;
        pointer-events: none;
    }
`;
document.head.appendChild(style);
