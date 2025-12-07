/**
 * Adaptive Footer Positioning with Dynamic Height Detection
 * Ensures footer always stays at the bottom regardless of content height
 */

class AdaptiveFooter {
  constructor() {
    this.footer = null;
    this.mainContent = null;
    this.body = document.body;
    this.html = document.documentElement;
    this.resizeObserver = null;
    this.mutationObserver = null;
    this.isInitialized = false;
    this.minContentHeight = 0;

    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.footer = document.querySelector("footer, .footer");
    this.mainContent = document.querySelector(".main-content, main");

    if (!this.footer || !this.mainContent) {
      console.warn("AdaptiveFooter: Footer or main content not found");
      return;
    }

    this.isInitialized = true;
    this.setupObservers();
    this.calculateAndApplyLayout();

    // Handle window resize
    window.addEventListener("resize", () =>
      this.debounce(() => {
        this.calculateAndApplyLayout();
      }, 100),
    );

    // Handle orientation change on mobile
    window.addEventListener("orientationchange", () => {
      setTimeout(() => this.calculateAndApplyLayout(), 500);
    });

    // Initial calculation after fonts and images load
    window.addEventListener("load", () => {
      setTimeout(() => this.calculateAndApplyLayout(), 100);
    });
  }

  setupObservers() {
    // Observe content changes
    if ("ResizeObserver" in window) {
      this.resizeObserver = new ResizeObserver(() => {
        this.debounce(() => this.calculateAndApplyLayout(), 50);
      });
      this.resizeObserver.observe(this.mainContent);
      this.resizeObserver.observe(this.footer);
    }

    // Observe DOM changes
    if ("MutationObserver" in window) {
      this.mutationObserver = new MutationObserver(() => {
        this.debounce(() => this.calculateAndApplyLayout(), 100);
      });

      this.mutationObserver.observe(this.mainContent, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class"],
      });
    }
  }

  calculateAndApplyLayout() {
    if (!this.isInitialized || !this.footer || !this.mainContent) return;

    // Get current measurements
    const viewportHeight = window.innerHeight;
    const footerHeight = this.getElementHeight(this.footer);
    const headerHeight = this.getHeaderHeight();
    const contentHeight = this.getContentHeight();

    // Calculate available space for content
    const availableSpace = viewportHeight - headerHeight - footerHeight;
    this.minContentHeight = Math.max(availableSpace, 300); // Minimum 300px

    // Apply layout based on content vs available space
    if (contentHeight < availableSpace) {
      this.applyStickToBottom();
    } else {
      this.applyNormalFlow();
    }

    // Set minimum height for main content
    this.mainContent.style.minHeight = `${this.minContentHeight}px`;

    // Add transition for smooth adjustments
    this.addTransitions();
  }

  getElementHeight(element) {
    if (!element) return 0;

    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    const marginTop = parseInt(style.marginTop, 10) || 0;
    const marginBottom = parseInt(style.marginBottom, 10) || 0;

    return rect.height + marginTop + marginBottom;
  }

  getHeaderHeight() {
    const header = document.querySelector("nav, .navbar, header");
    return header ? this.getElementHeight(header) : 80; // Default navbar height
  }

  getContentHeight() {
    // Get all direct children of main content
    const children = Array.from(this.mainContent.children);
    let totalHeight = 0;

    children.forEach((child) => {
      totalHeight += this.getElementHeight(child);
    });

    // Add padding from main content
    const style = window.getComputedStyle(this.mainContent);
    const paddingTop = parseInt(style.paddingTop, 10) || 0;
    const paddingBottom = parseInt(style.paddingBottom, 10) || 0;

    return totalHeight + paddingTop + paddingBottom;
  }

  applyStickToBottom() {
    // Use flexbox to push footer to bottom
    this.body.style.display = "flex";
    this.body.style.flexDirection = "column";
    this.body.style.minHeight = "100vh";

    this.mainContent.style.flex = "1 0 auto";
    this.mainContent.style.display = "flex";
    this.mainContent.style.flexDirection = "column";

    this.footer.style.flex = "0 0 auto";
    this.footer.style.marginTop = "auto";

    // Remove any fixed positioning
    this.footer.style.position = "";
    this.footer.style.bottom = "";
    this.footer.style.left = "";
    this.footer.style.right = "";

    this.body.classList.add("footer-sticky");
  }

  applyNormalFlow() {
    // Reset to normal document flow
    this.body.style.display = "";
    this.body.style.flexDirection = "";
    this.body.style.minHeight = "";

    this.mainContent.style.flex = "";
    this.footer.style.flex = "";
    this.footer.style.marginTop = "";

    this.body.classList.remove("footer-sticky");
  }

  addTransitions() {
    // Add smooth transitions for layout changes
    this.mainContent.style.transition = "min-height 0.3s ease, flex 0.3s ease";
    this.footer.style.transition = "margin-top 0.3s ease, transform 0.3s ease";
  }

  // Utility function for debouncing
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Public API for manual recalculation
  recalculate() {
    if (this.isInitialized) {
      this.calculateAndApplyLayout();
    }
  }

  // Dynamic content change handler
  onContentChange() {
    this.debounce(() => this.calculateAndApplyLayout(), 150)();
  }

  // Cleanup method
  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }

    // Reset styles
    this.body.style.display = "";
    this.body.style.flexDirection = "";
    this.body.style.minHeight = "";

    if (this.mainContent) {
      this.mainContent.style.flex = "";
      this.mainContent.style.minHeight = "";
      this.mainContent.style.transition = "";
    }

    if (this.footer) {
      this.footer.style.flex = "";
      this.footer.style.marginTop = "";
      this.footer.style.transition = "";
    }

    this.body.classList.remove("footer-sticky");
    this.isInitialized = false;
  }

  // Static factory method
  static init() {
    if (!window.adaptiveFooter) {
      window.adaptiveFooter = new AdaptiveFooter();
    }
    return window.adaptiveFooter;
  }

  // Static method for manual recalculation
  static recalculate() {
    if (window.adaptiveFooter) {
      window.adaptiveFooter.recalculate();
    }
  }
}

// Auto-initialize
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", AdaptiveFooter.init);
} else {
  AdaptiveFooter.init();
}

// Global API
window.AdaptiveFooter = AdaptiveFooter;

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = AdaptiveFooter;
}
