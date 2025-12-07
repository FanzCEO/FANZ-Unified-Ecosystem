// FANZ Advanced Neon Effects
class NeonEffectsManager {
  constructor() {
    this.initializeEffects();
    this.setupEventListeners();
  }

  initializeEffects() {
    this.createNeonBorderAnimations();
    this.initializeClusterHoverEffects();
    this.setupButtonGlowEffects();
    this.createDynamicBackgroundEffects();
    this.initializeStatusIndicators();
  }

  setupEventListeners() {
    document.addEventListener("DOMContentLoaded", () => {
      this.enhanceExistingElements();
    });
  }

  createNeonBorderAnimations() {
    const style = document.createElement("style");
    style.textContent = `
            @keyframes neon-border-cycle {
                0% { border-color: var(--neon-pink); box-shadow: 0 0 20px rgba(255, 0, 255, 0.5); }
                25% { border-color: var(--neon-cyan); box-shadow: 0 0 20px rgba(0, 255, 255, 0.5); }
                50% { border-color: var(--neon-green); box-shadow: 0 0 20px rgba(0, 255, 0, 0.5); }
                75% { border-color: var(--neon-yellow); box-shadow: 0 0 20px rgba(255, 255, 0, 0.5); }
                100% { border-color: var(--neon-pink); box-shadow: 0 0 20px rgba(255, 0, 255, 0.5); }
            }

            .rainbow-border {
                animation: neon-border-cycle 4s ease-in-out infinite;
            }

            @keyframes text-flicker {
                0%, 100% { opacity: 1; text-shadow: 0 0 5px currentColor, 0 0 10px currentColor; }
                50% { opacity: 0.8; text-shadow: 0 0 20px currentColor, 0 0 30px currentColor; }
            }

            .flicker-text {
                animation: text-flicker 2s ease-in-out infinite;
            }

            @keyframes glow-pulse {
                0%, 100% { box-shadow: 0 0 5px currentColor; }
                50% { box-shadow: 0 0 25px currentColor, 0 0 35px currentColor; }
            }

            .glow-pulse {
                animation: glow-pulse 3s ease-in-out infinite;
            }

            @keyframes slide-glow {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }

            .slide-glow-container {
                position: relative;
                overflow: hidden;
            }

            .slide-glow-container::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                transform: translateX(-100%);
                animation: slide-glow 3s ease-in-out infinite;
                z-index: 1;
            }
        `;
    document.head.appendChild(style);
  }

  initializeClusterHoverEffects() {
    const clusterCards = document.querySelectorAll(".cluster-card");

    clusterCards.forEach((card) => {
      const clusterType = card.dataset.cluster;
      const colors = this.getClusterColors(clusterType);

      card.addEventListener("mouseenter", () => {
        card.style.borderColor = colors.primary;
        card.style.boxShadow = `0 0 30px ${colors.shadow}`;
        card.style.transform = "translateY(-10px) scale(1.02)";

        // Add ripple effect
        this.createRippleEffect(card, colors.primary);
      });

      card.addEventListener("mouseleave", () => {
        card.style.borderColor = "";
        card.style.boxShadow = "";
        card.style.transform = "";
      });
    });
  }

  getClusterColors(clusterType) {
    const colorMap = {
      boyfanz: { primary: "#00ffff", shadow: "rgba(0, 255, 255, 0.3)" },
      girlfanz: { primary: "#ff00ff", shadow: "rgba(255, 0, 255, 0.3)" },
      pupfanz: { primary: "#ff8800", shadow: "rgba(255, 136, 0, 0.3)" },
      tranzfanz: { primary: "#8800ff", shadow: "rgba(136, 0, 255, 0.3)" },
      taboofanz: { primary: "#ff0000", shadow: "rgba(255, 0, 0, 0.3)" },
      daddyfanz: { primary: "#00ff00", shadow: "rgba(0, 255, 0, 0.3)" },
      allmyfanz: { primary: "#ffff00", shadow: "rgba(255, 255, 0, 0.3)" },
      recoveryfanz: { primary: "#00ffaa", shadow: "rgba(0, 255, 170, 0.3)" },
      fanztube: { primary: "#ff4444", shadow: "rgba(255, 68, 68, 0.3)" },
      fanzvarsity: { primary: "#4444ff", shadow: "rgba(68, 68, 255, 0.3)" },
      fanzwork: { primary: "#44ff44", shadow: "rgba(68, 255, 68, 0.3)" },
      fanzfluence: { primary: "#ff44ff", shadow: "rgba(255, 68, 255, 0.3)" },
      fanzvip: { primary: "#ffaa00", shadow: "rgba(255, 170, 0, 0.3)" },
      fanzai: { primary: "#00aaff", shadow: "rgba(0, 170, 255, 0.3)" },
    };

    return (
      colorMap[clusterType] || {
        primary: "#00ffff",
        shadow: "rgba(0, 255, 255, 0.3)",
      }
    );
  }

  createRippleEffect(element, color) {
    const ripple = document.createElement("div");
    ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: ${color};
            transform: scale(0);
            animation: ripple 0.6s linear;
            opacity: 0.5;
            pointer-events: none;
            z-index: 10;
        `;

    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = "50%";
    ripple.style.top = "50%";
    ripple.style.transform = "translate(-50%, -50%) scale(0)";

    element.style.position = "relative";
    element.appendChild(ripple);

    const rippleStyle = document.createElement("style");
    rippleStyle.textContent = `
            @keyframes ripple {
                to {
                    transform: translate(-50%, -50%) scale(4);
                    opacity: 0;
                }
            }
        `;
    document.head.appendChild(rippleStyle);

    setTimeout(() => {
      ripple.remove();
      rippleStyle.remove();
    }, 600);
  }

  setupButtonGlowEffects() {
    const buttons = document.querySelectorAll(".btn");

    buttons.forEach((button) => {
      button.addEventListener("mouseenter", () => {
        button.style.filter = "brightness(1.2)";
        button.style.transform = "translateY(-2px)";
      });

      button.addEventListener("mouseleave", () => {
        button.style.filter = "";
        button.style.transform = "";
      });

      button.addEventListener("click", (e) => {
        this.createClickEffect(e.target);
      });
    });
  }

  createClickEffect(element) {
    element.style.transform = "scale(0.95)";
    element.style.transition = "transform 0.1s ease";

    setTimeout(() => {
      element.style.transform = "";
      element.style.transition = "";
    }, 100);
  }

  createDynamicBackgroundEffects() {
    const backgroundCanvas = document.createElement("canvas");
    backgroundCanvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
            opacity: 0.1;
        `;
    document.body.appendChild(backgroundCanvas);

    const ctx = backgroundCanvas.getContext("2d");
    let particles = [];

    const resizeCanvas = () => {
      backgroundCanvas.width = window.innerWidth;
      backgroundCanvas.height = window.innerHeight;
    };

    const createParticle = () => ({
      x: Math.random() * backgroundCanvas.width,
      y: Math.random() * backgroundCanvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      color: ["#ff00ff", "#00ffff", "#00ff00", "#ffff00"][
        Math.floor(Math.random() * 4)
      ],
      size: Math.random() * 2 + 1,
    });

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < 50; i++) {
        particles.push(createParticle());
      }
    };

    const updateParticles = () => {
      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > backgroundCanvas.width)
          particle.vx *= -1;
        if (particle.y < 0 || particle.y > backgroundCanvas.height)
          particle.vy *= -1;
      });
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);

      particles.forEach((particle) => {
        ctx.shadowBlur = 20;
        ctx.shadowColor = particle.color;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw connections
      particles.forEach((particle, i) => {
        particles.slice(i + 1).forEach((otherParticle) => {
          const distance = Math.sqrt(
            Math.pow(particle.x - otherParticle.x, 2) +
              Math.pow(particle.y - otherParticle.y, 2),
          );

          if (distance < 100) {
            ctx.strokeStyle = `rgba(0, 255, 255, ${0.3 - distance / 300})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
          }
        });
      });
    };

    const animate = () => {
      updateParticles();
      drawParticles();
      requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    initParticles();
    animate();
  }

  initializeStatusIndicators() {
    const statusElements = document.querySelectorAll("[data-status]");

    statusElements.forEach((element) => {
      const status = element.dataset.status;
      this.applyStatusEffect(element, status);
    });
  }

  applyStatusEffect(element, status) {
    const statusEffects = {
      pending: {
        color: "#ff8800",
        animation: "pulse 2s ease-in-out infinite",
      },
      approved: {
        color: "#00ff00",
        animation: "none",
      },
      denied: {
        color: "#ff4444",
        animation: "none",
      },
      needs_fix: {
        color: "#ffff00",
        animation: "flicker 1.5s ease-in-out infinite",
      },
    };

    const effect = statusEffects[status];
    if (effect) {
      element.style.color = effect.color;
      element.style.animation = effect.animation;
      element.style.textShadow = `0 0 10px ${effect.color}`;
    }
  }

  enhanceExistingElements() {
    // Enhance forms
    const forms = document.querySelectorAll("form");
    forms.forEach((form) => this.enhanceForm(form));

    // Enhance cards
    const cards = document.querySelectorAll(".card");
    cards.forEach((card) => this.enhanceCard(card));

    // Enhance tables
    const tables = document.querySelectorAll(".table");
    tables.forEach((table) => this.enhanceTable(table));
  }

  enhanceForm(form) {
    const inputs = form.querySelectorAll(".form-control");
    inputs.forEach((input) => {
      input.addEventListener("focus", () => {
        input.style.boxShadow = "0 0 15px rgba(0, 255, 255, 0.5)";
        input.style.borderColor = "var(--neon-cyan)";
      });

      input.addEventListener("blur", () => {
        if (!input.classList.contains("is-invalid")) {
          input.style.boxShadow = "";
          input.style.borderColor = "";
        }
      });
    });
  }

  enhanceCard(card) {
    card.addEventListener("mouseenter", () => {
      card.style.transition = "all 0.3s ease";
      card.style.transform = "translateY(-5px)";
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  }

  enhanceTable(table) {
    const rows = table.querySelectorAll("tbody tr");
    rows.forEach((row, index) => {
      row.addEventListener("mouseenter", () => {
        row.style.backgroundColor = "rgba(0, 255, 255, 0.1)";
        row.style.boxShadow = "0 0 15px rgba(0, 255, 255, 0.2)";
      });

      row.addEventListener("mouseleave", () => {
        row.style.backgroundColor = "";
        row.style.boxShadow = "";
      });
    });
  }

  // Utility methods
  addGlowEffect(element, color = "var(--neon-cyan)") {
    element.style.boxShadow = `0 0 20px ${color}`;
    element.style.borderColor = color;
  }

  removeGlowEffect(element) {
    element.style.boxShadow = "";
    element.style.borderColor = "";
  }

  addTextGlow(element, color = "currentColor") {
    element.style.textShadow = `0 0 10px ${color}, 0 0 20px ${color}`;
  }

  createLoadingEffect(container) {
    const loader = document.createElement("div");
    loader.className = "neon-loader";

    // Create loader ring safely
    const loaderRing = document.createElement("div");
    loaderRing.className = "loader-ring";

    // Create loader text safely
    const loaderText = document.createElement("div");
    loaderText.className = "loader-text";
    loaderText.textContent = "Loading...";

    loader.appendChild(loaderRing);
    loader.appendChild(loaderText);

    const style = document.createElement("style");
    style.textContent = `
            .neon-loader {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px;
            }
            
            .loader-ring {
                width: 60px;
                height: 60px;
                border: 4px solid transparent;
                border-top: 4px solid var(--neon-cyan);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
            }
            
            .loader-text {
                margin-top: 20px;
                color: var(--neon-cyan);
                font-weight: bold;
                animation: pulse 2s ease-in-out infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;

    document.head.appendChild(style);
    container.appendChild(loader);

    return loader;
  }
}

// Initialize the neon effects manager
const neonEffects = new NeonEffectsManager();

// Export for global use
window.NeonEffects = neonEffects;

// Additional utility functions
window.NeonUtils = {
  showNeonAlert: (message, type = "info") => {
    const alert = document.createElement("div");
    alert.className = `neon-alert neon-alert-${type}`;

    // Create alert content safely
    const content = document.createElement("div");
    content.className = "neon-alert-content";

    // Create icon safely
    const icon = document.createElement("i");
    icon.className = "fas fa-info-circle";

    // Create message span safely
    const messageSpan = document.createElement("span");
    messageSpan.textContent = message;

    // Create close button safely
    const closeButton = document.createElement("button");
    closeButton.className = "neon-alert-close";
    closeButton.textContent = "×";

    content.appendChild(icon);
    content.appendChild(messageSpan);
    content.appendChild(closeButton);
    alert.appendChild(content);

    const alertStyles = `
            .neon-alert {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                background: var(--card-bg);
                border: 2px solid;
                border-radius: 10px;
                padding: 15px;
                box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
                animation: slideIn 0.3s ease;
            }
            
            .neon-alert-info { border-color: var(--neon-cyan); }
            .neon-alert-success { border-color: var(--neon-green); }
            .neon-alert-warning { border-color: var(--neon-yellow); }
            .neon-alert-error { border-color: #ff4444; }
            
            .neon-alert-content {
                display: flex;
                align-items: center;
                gap: 10px;
                color: var(--text-primary);
            }
            
            .neon-alert-close {
                background: none;
                border: none;
                color: var(--text-primary);
                font-size: 1.5rem;
                cursor: pointer;
                margin-left: auto;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;

    if (!document.getElementById("neon-alert-styles")) {
      const styleElement = document.createElement("style");
      styleElement.id = "neon-alert-styles";
      styleElement.textContent = alertStyles;
      document.head.appendChild(styleElement);
    }

    document.body.appendChild(alert);

    const closeBtn = alert.querySelector(".neon-alert-close");
    closeBtn.addEventListener("click", () => {
      alert.style.animation = "slideOut 0.3s ease";
      setTimeout(() => alert.remove(), 300);
    });

    setTimeout(() => {
      if (alert.parentNode) {
        alert.style.animation = "slideOut 0.3s ease";
        setTimeout(() => alert.remove(), 300);
      }
    }, 5000);
  },
};
