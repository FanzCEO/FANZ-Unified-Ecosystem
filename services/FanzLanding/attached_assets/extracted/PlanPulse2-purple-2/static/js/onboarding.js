/**
 * FANZ Interactive Onboarding System
 * Provides guided tours and interactive tutorials for new users
 */

class OnboardingTour {
  constructor() {
    this.currentStep = 0;
    this.steps = [];
    this.isActive = false;
    this.userRole = null;
    this.overlay = null;
    this.tooltip = null;

    this.init();
  }

  init() {
    this.createOverlay();
    this.createTooltip();
    this.bindEvents();
  }

  createOverlay() {
    this.overlay = document.createElement("div");
    this.overlay.className = "onboarding-overlay";
    this.overlay.innerHTML = `
            <div class="spotlight"></div>
        `;
    document.body.appendChild(this.overlay);
  }

  createTooltip() {
    this.tooltip = document.createElement("div");
    this.tooltip.className = "onboarding-tooltip";
    this.tooltip.innerHTML = `
            <div class="tooltip-header">
                <h4 class="tooltip-title"></h4>
                <button class="tooltip-close" aria-label="Skip tour">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="tooltip-body">
                <p class="tooltip-text"></p>
                <div class="tooltip-progress">
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                    <span class="step-counter"></span>
                </div>
            </div>
            <div class="tooltip-footer">
                <button class="btn-secondary tooltip-skip">Skip Tour</button>
                <div class="navigation-buttons">
                    <button class="btn-outline tooltip-prev" disabled>
                        <i class="fas fa-chevron-left"></i> Previous
                    </button>
                    <button class="btn-primary tooltip-next">
                        Next <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        `;
    document.body.appendChild(this.tooltip);
  }

  bindEvents() {
    // Navigation buttons
    this.tooltip
      .querySelector(".tooltip-next")
      .addEventListener("click", () => this.nextStep());
    this.tooltip
      .querySelector(".tooltip-prev")
      .addEventListener("click", () => this.prevStep());
    this.tooltip
      .querySelector(".tooltip-close")
      .addEventListener("click", () => this.endTour());
    this.tooltip
      .querySelector(".tooltip-skip")
      .addEventListener("click", () => this.endTour());

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
      if (!this.isActive) return;

      switch (e.key) {
        case "ArrowRight":
        case "Enter":
          e.preventDefault();
          this.nextStep();
          break;
        case "ArrowLeft":
          e.preventDefault();
          this.prevStep();
          break;
        case "Escape":
          e.preventDefault();
          this.endTour();
          break;
      }
    });

    // Prevent clicks on overlay
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) {
        this.endTour();
      }
    });
  }

  // Tour definitions for different user roles
  getTourSteps(role) {
    const baseTour = [
      {
        target: ".navbar-brand",
        title: "Welcome to FANZ!",
        text: "This is your gateway to the ultimate creator economy platform. Let's take a quick tour!",
        position: "bottom",
      },
      {
        target: ".navbar-nav",
        title: "Navigation Menu",
        text: "Access all platform features from this navigation menu. Everything you need is just a click away.",
        position: "bottom",
      },
    ];

    switch (role) {
      case "fan":
        return baseTour.concat([
          {
            target: ".quick-actions-card",
            title: "Quick Actions",
            text: "These shortcuts help you discover content, join clusters, and connect with creators quickly.",
            position: "top",
          },
          {
            target: ".cluster-grid",
            title: "Content Clusters",
            text: "Explore specialized communities! Each cluster offers unique content and creator experiences.",
            position: "top",
          },
          {
            target: ".profile-avatar",
            title: "Your Profile",
            text: "Click here to customize your profile, manage settings, and track your activity.",
            position: "left",
          },
        ]);

      case "star":
        return baseTour.concat([
          {
            target: ".creator-tools",
            title: "Creator Tools",
            text: "Access powerful tools to create, manage, and monetize your content across multiple clusters.",
            position: "top",
          },
          {
            target: ".upload-hub",
            title: "Content Upload",
            text: "Upload and manage your content here. Drag & drop files, set pricing, and manage your library.",
            position: "top",
          },
          {
            target: ".analytics-widget",
            title: "Analytics Dashboard",
            text: "Track your performance, earnings, and audience engagement with real-time analytics.",
            position: "top",
          },
        ]);

      case "admin":
      case "exec":
        return baseTour.concat([
          {
            target: ".admin-controls",
            title: "Admin Controls",
            text: "Manage platform settings, users, content moderation, and compliance from this section.",
            position: "top",
          },
          {
            target: ".theme-manager",
            title: "Theme Manager",
            text: "Customize the platform's appearance with our powerful theme management system.",
            position: "top",
          },
        ]);

      default:
        return baseTour;
    }
  }

  startTour(role = "fan") {
    this.userRole = role;
    this.steps = this.getTourSteps(role);
    this.currentStep = 0;
    this.isActive = true;

    document.body.classList.add("onboarding-active");
    this.showStep(0);

    // Track tour start
    this.trackEvent("tour_started", { role: role });
  }

  showStep(stepIndex) {
    if (stepIndex >= this.steps.length) {
      this.endTour();
      return;
    }

    const step = this.steps[stepIndex];
    const target = document.querySelector(step.target);

    if (!target) {
      // Skip this step if target doesn't exist
      this.nextStep();
      return;
    }

    // Update tooltip content
    this.tooltip.querySelector(".tooltip-title").textContent = step.title;
    this.tooltip.querySelector(".tooltip-text").textContent = step.text;
    this.tooltip.querySelector(".step-counter").textContent =
      `${stepIndex + 1} of ${this.steps.length}`;

    // Update progress bar
    const progress = ((stepIndex + 1) / this.steps.length) * 100;
    this.tooltip.querySelector(".progress-fill").style.width = `${progress}%`;

    // Update navigation buttons
    this.tooltip.querySelector(".tooltip-prev").disabled = stepIndex === 0;
    const nextBtn = this.tooltip.querySelector(".tooltip-next");
    nextBtn.textContent =
      stepIndex === this.steps.length - 1 ? "Finish" : "Next";

    // Position tooltip and spotlight
    this.positionTooltip(target, step.position);
    this.positionSpotlight(target);

    // Show elements
    this.overlay.classList.add("active");
    this.tooltip.classList.add("active");

    // Scroll target into view
    target.scrollIntoView({ behavior: "smooth", block: "center" });

    // Add highlight to target
    target.classList.add("onboarding-highlight");

    // Remove highlight from previous target
    document.querySelectorAll(".onboarding-highlight").forEach((el) => {
      if (el !== target) el.classList.remove("onboarding-highlight");
    });
  }

  positionTooltip(target, position = "bottom") {
    const rect = target.getBoundingClientRect();
    const tooltip = this.tooltip;
    const offset = 20;

    // Reset classes
    tooltip.className = "onboarding-tooltip active";

    switch (position) {
      case "top":
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - offset}px`;
        tooltip.style.transform = "translate(-50%, -100%)";
        tooltip.classList.add("position-top");
        break;

      case "bottom":
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.bottom + offset}px`;
        tooltip.style.transform = "translate(-50%, 0)";
        tooltip.classList.add("position-bottom");
        break;

      case "left":
        tooltip.style.left = `${rect.left - offset}px`;
        tooltip.style.top = `${rect.top + rect.height / 2}px`;
        tooltip.style.transform = "translate(-100%, -50%)";
        tooltip.classList.add("position-left");
        break;

      case "right":
        tooltip.style.left = `${rect.right + offset}px`;
        tooltip.style.top = `${rect.top + rect.height / 2}px`;
        tooltip.style.transform = "translate(0, -50%)";
        tooltip.classList.add("position-right");
        break;
    }

    // Ensure tooltip stays within viewport
    this.adjustTooltipPosition();
  }

  adjustTooltipPosition() {
    const tooltip = this.tooltip;
    const rect = tooltip.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    // Adjust horizontal position
    if (rect.right > viewport.width) {
      const overflow = rect.right - viewport.width + 20;
      tooltip.style.left = `${parseInt(tooltip.style.left) - overflow}px`;
    }
    if (rect.left < 0) {
      tooltip.style.left = "20px";
    }

    // Adjust vertical position
    if (rect.bottom > viewport.height) {
      const overflow = rect.bottom - viewport.height + 20;
      tooltip.style.top = `${parseInt(tooltip.style.top) - overflow}px`;
    }
    if (rect.top < 0) {
      tooltip.style.top = "20px";
    }
  }

  positionSpotlight(target) {
    const rect = target.getBoundingClientRect();
    const spotlight = this.overlay.querySelector(".spotlight");
    const padding = 10;

    spotlight.style.left = `${rect.left - padding}px`;
    spotlight.style.top = `${rect.top - padding}px`;
    spotlight.style.width = `${rect.width + padding * 2}px`;
    spotlight.style.height = `${rect.height + padding * 2}px`;
  }

  nextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.showStep(this.currentStep);
    } else {
      this.endTour();
    }
  }

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.showStep(this.currentStep);
    }
  }

  endTour() {
    this.isActive = false;
    document.body.classList.remove("onboarding-active");
    this.overlay.classList.remove("active");
    this.tooltip.classList.remove("active");

    // Remove all highlights
    document.querySelectorAll(".onboarding-highlight").forEach((el) => {
      el.classList.remove("onboarding-highlight");
    });

    // Mark tour as completed
    this.markTourCompleted();

    // Track tour completion
    this.trackEvent("tour_completed", {
      role: this.userRole,
      steps_completed: this.currentStep + 1,
      total_steps: this.steps.length,
    });
  }

  markTourCompleted() {
    fetch("/api/onboarding/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tour_type: "initial",
        role: this.userRole,
      }),
    });

    localStorage.setItem("fanzlab_tour_completed", "true");
  }

  trackEvent(event, data) {
    fetch("/api/analytics/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: event,
        data: data,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  // Check if user should see tour
  static shouldShowTour() {
    return !localStorage.getItem("fanzlab_tour_completed");
  }
}

// Auto-start tour for new users
document.addEventListener("DOMContentLoaded", () => {
  // Only start tour if user hasn't completed it and we're on dashboard
  if (
    OnboardingTour.shouldShowTour() &&
    window.location.pathname.includes("dashboard")
  ) {
    const userRole = document.body.dataset.userRole || "fan";

    // Delay to ensure page is fully loaded
    setTimeout(() => {
      const tour = new OnboardingTour();
      tour.startTour(userRole);
    }, 1000);
  }
});

// Expose globally for manual triggers
window.OnboardingTour = OnboardingTour;
