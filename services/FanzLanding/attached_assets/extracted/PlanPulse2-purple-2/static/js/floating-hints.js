/**
 * Floating Navigation Hints System
 * Provides contextual navigation guidance for complex pages
 */

class FloatingHints {
  constructor() {
    this.hints = new Map();
    this.activeHints = new Set();
    this.isEnabled = localStorage.getItem("floatingHints") !== "disabled";
    this.init();
  }

  init() {
    if (!this.isEnabled) return;

    this.createHintContainer();
    this.loadPageHints();
    this.bindEvents();

    // Show hints after a short delay
    setTimeout(() => this.showRelevantHints(), 1500);
  }

  createHintContainer() {
    if (document.getElementById("floating-hints-container")) return;

    const container = document.createElement("div");
    container.id = "floating-hints-container";
    container.className = "floating-hints-container";
    container.setAttribute("role", "region");
    container.setAttribute("aria-label", "Navigation hints");
    document.body.appendChild(container);
  }

  loadPageHints() {
    const currentPath = window.location.pathname;

    // Define hints for different pages
    const pageHints = {
      "/about": [
        {
          id: "about-clusters",
          title: "Explore Content Clusters",
          description:
            "Scroll down to see all 14 specialized clusters available",
          target: "#clusters",
          icon: "fa-network-wired",
          position: "top-right",
          delay: 2000,
        },
        {
          id: "about-features",
          title: "Platform Features",
          description: "Learn about our enterprise-grade security and tools",
          target: "#features",
          icon: "fa-star",
          position: "bottom-right",
          delay: 4000,
        },
      ],
      "/dashboard": [
        {
          id: "dashboard-upload",
          title: "Upload Content",
          description: "Start earning by uploading your first content",
          target: ".upload-section",
          icon: "fa-upload",
          position: "top-left",
          delay: 1000,
        },
        {
          id: "dashboard-analytics",
          title: "View Analytics",
          description: "Track your performance and earnings",
          target: ".analytics-section",
          icon: "fa-chart-line",
          position: "top-right",
          delay: 3000,
        },
      ],
      "/": [
        {
          id: "home-register",
          title: "Join the Platform",
          description: "Create your account to start earning as a creator",
          target: ".hero-actions",
          icon: "fa-user-plus",
          position: "bottom-center",
          delay: 3000,
        },
      ],
    };

    if (pageHints[currentPath]) {
      pageHints[currentPath].forEach((hint) => {
        this.hints.set(hint.id, hint);
      });
    }
  }

  showRelevantHints() {
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY;

    this.hints.forEach((hint) => {
      if (this.activeHints.has(hint.id)) return;
      if (this.isHintDismissed(hint.id)) return;

      const targetElement = document.querySelector(hint.target);
      if (!targetElement) return;

      const targetRect = targetElement.getBoundingClientRect();
      const targetTop = targetRect.top + scrollY;

      // Show hint when target is approaching viewport or visible
      if (
        targetTop - scrollY < viewportHeight + 200 &&
        targetTop - scrollY > -200
      ) {
        setTimeout(() => this.showHint(hint), hint.delay || 0);
      }
    });
  }

  showHint(hintData) {
    if (this.activeHints.has(hintData.id) || this.isHintDismissed(hintData.id))
      return;

    const hint = this.createHintElement(hintData);
    const container = document.getElementById("floating-hints-container");
    container.appendChild(hint);

    this.activeHints.add(hintData.id);

    // Animate in
    requestAnimationFrame(() => {
      hint.classList.add("show");
    });

    // Auto-hide after 8 seconds if not interacted with
    setTimeout(() => {
      if (hint.parentNode && !hint.classList.contains("persistent")) {
        this.hideHint(hintData.id);
      }
    }, 8000);
  }

  createHintElement(hintData) {
    const hint = document.createElement("div");
    hint.className = `floating-hint ${hintData.position}`;
    hint.id = `hint-${hintData.id}`;
    hint.setAttribute("role", "tooltip");
    hint.setAttribute("aria-live", "polite");

    hint.innerHTML = `
            <div class="hint-content">
                <div class="hint-header">
                    <i class="fas ${hintData.icon} hint-icon"></i>
                    <h6 class="hint-title">${hintData.title}</h6>
                    <button class="hint-close" aria-label="Dismiss hint" title="Dismiss">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <p class="hint-description">${hintData.description}</p>
                ${
                  hintData.target
                    ? `
                    <button class="hint-action" data-target="${hintData.target}">
                        <i class="fas fa-arrow-right me-1"></i>Take me there
                    </button>
                `
                    : ""
                }
            </div>
            <div class="hint-pulse"></div>
        `;

    // Bind events
    const closeBtn = hint.querySelector(".hint-close");
    closeBtn.addEventListener("click", () => this.dismissHint(hintData.id));

    const actionBtn = hint.querySelector(".hint-action");
    if (actionBtn) {
      actionBtn.addEventListener("click", () =>
        this.navigateToTarget(hintData.target, hintData.id),
      );
    }

    // Make hint draggable for better UX
    this.makeDraggable(hint);

    return hint;
  }

  navigateToTarget(target, hintId) {
    const element = document.querySelector(target);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      // Highlight target briefly
      element.style.outline = "2px solid var(--neon-cyan)";
      element.style.outlineOffset = "4px";
      setTimeout(() => {
        element.style.outline = "";
        element.style.outlineOffset = "";
      }, 2000);

      this.dismissHint(hintId);
    }
  }

  dismissHint(hintId) {
    const hint = document.getElementById(`hint-${hintId}`);
    if (hint) {
      hint.classList.add("hiding");
      setTimeout(() => {
        hint.remove();
        this.activeHints.delete(hintId);
      }, 300);
    }

    // Remember dismissal
    this.setHintDismissed(hintId);
  }

  hideHint(hintId) {
    const hint = document.getElementById(`hint-${hintId}`);
    if (hint && !hint.classList.contains("persistent")) {
      hint.classList.add("hiding");
      setTimeout(() => {
        hint.remove();
        this.activeHints.delete(hintId);
      }, 300);
    }
  }

  makeDraggable(element) {
    let isDragging = false;
    let startX, startY, initialX, initialY;

    const header = element.querySelector(".hint-header");
    header.style.cursor = "move";

    header.addEventListener("mousedown", startDrag);

    function startDrag(e) {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = element.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;

      element.classList.add("dragging");

      document.addEventListener("mousemove", drag);
      document.addEventListener("mouseup", stopDrag);
    }

    function drag(e) {
      if (!isDragging) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      element.style.left = `${initialX + deltaX}px`;
      element.style.top = `${initialY + deltaY}px`;
      element.style.position = "fixed";
    }

    function stopDrag() {
      isDragging = false;
      element.classList.remove("dragging");
      document.removeEventListener("mousemove", drag);
      document.removeEventListener("mouseup", stopDrag);
    }
  }

  bindEvents() {
    // Show/hide hints on scroll
    let scrollTimeout;
    window.addEventListener("scroll", () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => this.showRelevantHints(), 100);
    });

    // Keyboard accessibility
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.hideAllHints();
      }
    });

    // Settings toggle
    window.addEventListener("toggleFloatingHints", () => {
      this.isEnabled = !this.isEnabled;
      localStorage.setItem(
        "floatingHints",
        this.isEnabled ? "enabled" : "disabled",
      );

      if (!this.isEnabled) {
        this.hideAllHints();
      } else {
        this.showRelevantHints();
      }
    });
  }

  hideAllHints() {
    this.activeHints.forEach((hintId) => {
      this.hideHint(hintId);
    });
  }

  isHintDismissed(hintId) {
    const dismissed = localStorage.getItem("dismissedHints");
    return dismissed && dismissed.split(",").includes(hintId);
  }

  setHintDismissed(hintId) {
    const dismissed = localStorage.getItem("dismissedHints") || "";
    const dismissedList = dismissed ? dismissed.split(",") : [];

    if (!dismissedList.includes(hintId)) {
      dismissedList.push(hintId);
      localStorage.setItem("dismissedHints", dismissedList.join(","));
    }
  }

  // Public API
  static init() {
    if (window.floatingHints) return;
    window.floatingHints = new FloatingHints();
  }

  static addHint(hintData) {
    if (window.floatingHints) {
      window.floatingHints.hints.set(hintData.id, hintData);
      window.floatingHints.showRelevantHints();
    }
  }

  static removeHint(hintId) {
    if (window.floatingHints) {
      window.floatingHints.dismissHint(hintId);
    }
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", FloatingHints.init);
} else {
  FloatingHints.init();
}

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = FloatingHints;
}
