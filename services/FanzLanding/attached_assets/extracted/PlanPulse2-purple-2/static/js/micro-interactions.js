/**
 * FANZ Micro-Interactions and Enhanced UI Effects
 * Delightful animations and responsive feedback
 */

class MicroInteractions {
  constructor() {
    this.isInitialized = false;
    this.animationQueue = [];
    this.observers = new Map();

    this.init();
  }

  init() {
    if (this.isInitialized) return;

    this.setupIntersectionObservers();
    this.enhanceButtons();
    this.enhanceCards();
    this.enhanceForms();
    this.setupRippleEffect();
    this.setupTooltipAnimations();
    this.setupLoadingStates();
    this.setupScrollAnimations();
    this.setupHoverEffects();
    this.setupCursorEffects();

    this.isInitialized = true;
  }

  setupIntersectionObservers() {
    // Fade in animation for elements when they come into view
    const fadeInObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in");
            fadeInObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
      },
    );

    // Apply to relevant elements
    document
      .querySelectorAll(
        ".card, .ai-widget, .social-platform-card, .dashboard-metric",
      )
      .forEach((el) => {
        el.classList.add("fade-in-ready");
        fadeInObserver.observe(el);
      });

    this.observers.set("fadeIn", fadeInObserver);
  }

  enhanceButtons() {
    // Add enhanced button interactions
    document.addEventListener("click", (e) => {
      const button = e.target.closest("button, .btn");
      if (!button) return;

      // Skip if already has animation or is disabled
      if (button.classList.contains("animating") || button.disabled) return;

      this.animateButtonClick(button);
    });

    // Add hover sound effects (visual feedback only)
    document.addEventListener(
      "mouseenter",
      (e) => {
        const button = e.target.closest("button, .btn");
        if (button && !button.disabled) {
          this.animateButtonHover(button);
        }
      },
      true,
    );

    // Enhanced focus states
    document.addEventListener("focusin", (e) => {
      if (e.target.matches("button, .btn, input, textarea, select")) {
        this.animateFocusIn(e.target);
      }
    });

    document.addEventListener("focusout", (e) => {
      if (e.target.matches("button, .btn, input, textarea, select")) {
        this.animateFocusOut(e.target);
      }
    });
  }

  animateButtonClick(button) {
    button.classList.add("animating");

    // Scale and bounce effect
    button.style.transform = "scale(0.95)";
    button.style.transition = "transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)";

    setTimeout(() => {
      button.style.transform = "scale(1.02)";

      setTimeout(() => {
        button.style.transform = "";
        button.classList.remove("animating");
      }, 100);
    }, 100);

    // Add ripple effect
    this.createRipple(button, event);
  }

  animateButtonHover(button) {
    if (button.classList.contains("btn-primary")) {
      button.style.boxShadow = "0 0 20px rgba(0, 255, 255, 0.4)";
    } else if (button.classList.contains("btn-success")) {
      button.style.boxShadow = "0 0 20px rgba(0, 255, 127, 0.4)";
    } else if (button.classList.contains("btn-warning")) {
      button.style.boxShadow = "0 0 20px rgba(255, 215, 0, 0.4)";
    } else if (button.classList.contains("btn-danger")) {
      button.style.boxShadow = "0 0 20px rgba(255, 68, 68, 0.4)";
    }

    button.addEventListener(
      "mouseleave",
      () => {
        button.style.boxShadow = "";
      },
      { once: true },
    );
  }

  animateFocusIn(element) {
    element.style.transition = "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)";
    element.style.transform = "scale(1.02)";

    if (element.matches("input, textarea")) {
      element.style.borderColor = "var(--neon-cyan)";
      element.style.boxShadow = "0 0 15px rgba(0, 255, 255, 0.3)";
    }
  }

  animateFocusOut(element) {
    element.style.transform = "";

    if (element.matches("input, textarea")) {
      element.style.borderColor = "";
      element.style.boxShadow = "";
    }
  }

  enhanceCards() {
    // Add enhanced card interactions
    document.addEventListener(
      "mouseenter",
      (e) => {
        const card = e.target.closest(
          ".card, .ai-widget, .social-platform-card",
        );
        if (card) {
          this.animateCardHover(card);
        }
      },
      true,
    );

    document.addEventListener(
      "mouseleave",
      (e) => {
        const card = e.target.closest(
          ".card, .ai-widget, .social-platform-card",
        );
        if (card) {
          this.animateCardLeave(card);
        }
      },
      true,
    );
  }

  animateCardHover(card) {
    card.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    card.style.transform = "translateY(-8px) scale(1.02)";

    // Enhanced glow effect
    if (card.classList.contains("ai-widget")) {
      card.style.boxShadow =
        "0 20px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(0, 255, 255, 0.4)";
    } else if (card.classList.contains("social-platform-card")) {
      card.style.boxShadow =
        "0 15px 30px rgba(0, 0, 0, 0.3), 0 0 25px rgba(0, 255, 127, 0.3)";
    } else {
      card.style.boxShadow =
        "0 15px 30px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 255, 255, 0.1)";
    }

    // Animate any icons inside
    const icons = card.querySelectorAll("i, .fa-icon");
    icons.forEach((icon) => {
      icon.style.transition = "all 0.3s ease";
      icon.style.transform = "scale(1.1) rotate(5deg)";
    });
  }

  animateCardLeave(card) {
    card.style.transform = "";
    card.style.boxShadow = "";

    // Reset icons
    const icons = card.querySelectorAll("i, .fa-icon");
    icons.forEach((icon) => {
      icon.style.transform = "";
    });
  }

  enhanceForms() {
    // Floating label animation
    document.querySelectorAll("input, textarea").forEach((input) => {
      if (input.placeholder) {
        this.setupFloatingLabel(input);
      }
    });

    // Form validation animations
    document.addEventListener("submit", (e) => {
      const form = e.target;
      if (form.tagName === "FORM") {
        this.animateFormSubmission(form);
      }
    });

    // Input value changes
    document.addEventListener("input", (e) => {
      if (e.target.matches("input, textarea")) {
        this.animateInputChange(e.target);
      }
    });
  }

  setupFloatingLabel(input) {
    const parent = input.parentElement;
    const label = document.createElement("label");
    label.textContent = input.placeholder;
    label.className = "floating-label";

    parent.style.position = "relative";
    parent.appendChild(label);

    const checkFloat = () => {
      if (input.value || input === document.activeElement) {
        label.classList.add("float");
      } else {
        label.classList.remove("float");
      }
    };

    input.addEventListener("focus", checkFloat);
    input.addEventListener("blur", checkFloat);
    input.addEventListener("input", checkFloat);

    checkFloat(); // Initial check
  }

  animateFormSubmission(form) {
    const submitButton = form.querySelector(
      'button[type="submit"], input[type="submit"]',
    );
    if (submitButton) {
      submitButton.style.transform = "scale(0.95)";
      submitButton.style.transition = "transform 0.2s ease";

      // Add loading animation
      const originalText = submitButton.textContent;
      submitButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Processing...';

      setTimeout(() => {
        submitButton.style.transform = "";
        // Note: In real implementation, you'd reset this after form response
      }, 200);
    }
  }

  animateInputChange(input) {
    input.style.transition = "border-color 0.2s ease, box-shadow 0.2s ease";

    if (input.value) {
      input.style.borderColor = "var(--neon-green)";
      input.style.boxShadow = "0 0 10px rgba(0, 255, 127, 0.2)";
    } else {
      input.style.borderColor = "";
      input.style.boxShadow = "";
    }
  }

  setupRippleEffect() {
    // Enhanced ripple effect for all clickable elements
    document.addEventListener("click", (e) => {
      const element = e.target.closest("button, .btn, .card, a, .clickable");
      if (element && !element.classList.contains("no-ripple")) {
        this.createRipple(element, e);
      }
    });
  }

  createRipple(element, event) {
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = document.createElement("div");
    ripple.className = "ripple-effect";
    ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.4);
            transform: scale(0);
            animation: ripple-animation 0.6s linear;
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            pointer-events: none;
            z-index: 1000;
        `;

    // Ensure element has relative positioning
    if (getComputedStyle(element).position === "static") {
      element.style.position = "relative";
    }
    element.style.overflow = "hidden";

    element.appendChild(ripple);

    // Remove ripple after animation
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 600);
  }

  setupTooltipAnimations() {
    // Enhanced tooltip animations
    document
      .querySelectorAll('[data-bs-toggle="tooltip"], [title]')
      .forEach((element) => {
        element.addEventListener("mouseenter", () => {
          this.animateTooltipShow(element);
        });

        element.addEventListener("mouseleave", () => {
          this.animateTooltipHide(element);
        });
      });
  }

  animateTooltipShow(element) {
    // Add glow effect to element
    element.style.transition = "all 0.2s ease";
    element.style.filter =
      "brightness(1.1) drop-shadow(0 0 5px rgba(255, 255, 255, 0.3))";
  }

  animateTooltipHide(element) {
    element.style.filter = "";
  }

  setupLoadingStates() {
    // Enhanced loading animations
    document.addEventListener("click", (e) => {
      const element = e.target.closest("[data-loading-text]");
      if (element) {
        this.animateLoadingState(element);
      }
    });
  }

  animateLoadingState(element) {
    const originalText = element.textContent;
    const loadingText = element.dataset.loadingText || "Loading...";

    element.classList.add("loading");
    element.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i>${loadingText}`;
    element.disabled = true;

    // Simulate loading completion (in real app, this would be triggered by actual completion)
    setTimeout(() => {
      element.classList.remove("loading");
      element.innerHTML = originalText;
      element.disabled = false;
    }, 2000);
  }

  setupScrollAnimations() {
    // Parallax effect for hero sections
    window.addEventListener("scroll", () => {
      this.handleScrollAnimations();
    });

    // Smooth scroll for anchor links
    document.addEventListener("click", (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (link) {
        e.preventDefault();
        const href = link.getAttribute("href");
        const target =
          href && href !== "#" ? document.querySelector(href) : null;
        if (target) {
          this.smoothScrollTo(target);
        }
      }
    });
  }

  handleScrollAnimations() {
    const scrollY = window.scrollY;

    // Parallax for hero sections
    document
      .querySelectorAll(".hero-section, .dashboard-header")
      .forEach((hero) => {
        const speed = 0.5;
        hero.style.transform = `translateY(${scrollY * speed}px)`;
      });

    // Navigation bar animation
    const navbar = document.querySelector(".navbar");
    if (navbar) {
      if (scrollY > 100) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    }

    // Progress indicator
    const scrollProgress =
      (scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    document.documentElement.style.setProperty(
      "--scroll-progress",
      `${scrollProgress}%`,
    );
  }

  smoothScrollTo(target) {
    const start = window.pageYOffset;
    const targetPosition = target.offsetTop - 80; // Account for fixed header
    const distance = targetPosition - start;
    const duration = 1000;
    let startTime = null;

    const animation = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const run = this.easeInOutQuad(timeElapsed, start, distance, duration);
      window.scrollTo(0, run);
      if (timeElapsed < duration) requestAnimationFrame(animation);
    };

    requestAnimationFrame(animation);
  }

  easeInOutQuad(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return (c / 2) * t * t + b;
    t--;
    return (-c / 2) * (t * (t - 2) - 1) + b;
  }

  setupHoverEffects() {
    // Enhanced hover effects for various elements

    // Icon hover effects
    document.addEventListener(
      "mouseenter",
      (e) => {
        if (e.target.matches("i, .fa-icon")) {
          this.animateIconHover(e.target);
        }
      },
      true,
    );

    // Image hover effects
    document.addEventListener(
      "mouseenter",
      (e) => {
        if (e.target.matches("img")) {
          this.animateImageHover(e.target);
        }
      },
      true,
    );

    document.addEventListener(
      "mouseleave",
      (e) => {
        if (e.target.matches("img")) {
          this.animateImageLeave(e.target);
        }
      },
      true,
    );
  }

  animateIconHover(icon) {
    icon.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    icon.style.transform = "scale(1.2) rotate(10deg)";
    icon.style.filter = "brightness(1.2) drop-shadow(0 0 10px currentColor)";
  }

  animateImageHover(img) {
    img.style.transition = "all 0.3s ease";
    img.style.transform = "scale(1.05)";
    img.style.filter = "brightness(1.1) contrast(1.1)";
  }

  animateImageLeave(img) {
    img.style.transform = "";
    img.style.filter = "";
  }

  setupCursorEffects() {
    // Custom cursor effects for interactive elements
    const cursor = document.createElement("div");
    cursor.className = "custom-cursor";
    document.body.appendChild(cursor);

    document.addEventListener("mousemove", (e) => {
      cursor.style.left = e.clientX + "px";
      cursor.style.top = e.clientY + "px";
    });

    document.addEventListener(
      "mouseenter",
      (e) => {
        if (e.target.matches("button, .btn, a, .clickable")) {
          cursor.classList.add("hover");
        }
      },
      true,
    );

    document.addEventListener(
      "mouseleave",
      (e) => {
        if (e.target.matches("button, .btn, a, .clickable")) {
          cursor.classList.remove("hover");
        }
      },
      true,
    );

    document.addEventListener("mousedown", () => {
      cursor.classList.add("click");
    });

    document.addEventListener("mouseup", () => {
      cursor.classList.remove("click");
    });
  }

  // Utility methods for external use
  bounce(element) {
    element.style.animation = "bounce 0.5s ease";
    setTimeout(() => {
      element.style.animation = "";
    }, 500);
  }

  shake(element) {
    element.style.animation = "shake 0.5s ease";
    setTimeout(() => {
      element.style.animation = "";
    }, 500);
  }

  pulse(element) {
    element.style.animation = "pulse 1s ease infinite";
  }

  stopPulse(element) {
    element.style.animation = "";
  }

  flash(element, color = "var(--neon-cyan)") {
    const originalBackground = element.style.backgroundColor;
    element.style.transition = "background-color 0.1s ease";
    element.style.backgroundColor = color;

    setTimeout(() => {
      element.style.backgroundColor = originalBackground;
    }, 100);
  }

  glow(element, intensity = "medium") {
    const glowIntensities = {
      low: "0 0 10px currentColor",
      medium: "0 0 20px currentColor",
      high: "0 0 30px currentColor",
    };

    element.style.boxShadow = glowIntensities[intensity];
    element.style.transition = "box-shadow 0.3s ease";
  }

  removeGlow(element) {
    element.style.boxShadow = "";
  }

  // Animation queue for complex sequences
  queueAnimation(callback, delay = 0) {
    this.animationQueue.push({ callback, delay });
    this.processAnimationQueue();
  }

  processAnimationQueue() {
    if (this.animationQueue.length === 0) return;

    const { callback, delay } = this.animationQueue.shift();

    setTimeout(() => {
      callback();
      this.processAnimationQueue();
    }, delay);
  }

  // Cleanup method
  destroy() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
    this.animationQueue = [];

    // Remove custom cursor
    const cursor = document.querySelector(".custom-cursor");
    if (cursor) cursor.remove();

    this.isInitialized = false;
  }
}

// Initialize micro-interactions
document.addEventListener("DOMContentLoaded", () => {
  const microInteractions = new MicroInteractions();
  window.microInteractions = microInteractions;
});

// Expose for external use
window.MicroInteractions = MicroInteractions;
