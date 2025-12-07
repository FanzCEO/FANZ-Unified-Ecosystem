// FANZ Main JavaScript
document.addEventListener("DOMContentLoaded", function () {
  // Initialize age verification first
  initializeAgeVerification();

  // Initialize all components
  initializeNavigation();
  initializeFormEnhancements();
  initializeFileUpload();
  initializeStatusUpdates();
  initializeTooltips();
  initializeTables();

  // Start background animations
  startBackgroundAnimations();

  console.log("FANZ initialized successfully");
});

// Age Verification Modal
function initializeAgeVerification() {
  const modal = document.getElementById("ageVerificationModal");
  const yesBtn = document.getElementById("ageVerifyYes");
  const noBtn = document.getElementById("ageVerifyNo");

  // Check if user has already verified age
  const ageVerified = localStorage.getItem("ageVerified");
  if (ageVerified === "true") {
    hideAgeModal();
    return;
  }

  // Show modal on page load
  if (modal) {
    showAgeModal();

    // Handle Yes button
    yesBtn.addEventListener("click", function () {
      localStorage.setItem("ageVerified", "true");
      hideAgeModal();
      // Track age verification for compliance
      if (typeof gtag !== "undefined") {
        gtag("event", "age_verification", {
          age_verified: true,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Handle No button
    noBtn.addEventListener("click", function () {
      // Redirect to a safe site
      window.location.href = "https://www.google.com";
    });
  }
}

function showAgeModal() {
  const modal = document.getElementById("ageVerificationModal");
  if (modal) {
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
}

function hideAgeModal() {
  const modal = document.getElementById("ageVerificationModal");
  if (modal) {
    modal.classList.add("hidden");
    document.body.style.overflow = "auto";
    // Start other animations after verification
    setTimeout(() => {
      startEnhancedAnimations();
    }, 500);
  }
}

function startEnhancedAnimations() {
  // Additional animations after age verification
  const logo = document.querySelector(".main-logo");
  if (logo) {
    logo.style.animationDelay = "0s";
  }
}

// Navigation enhancements
function initializeNavigation() {
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    link.addEventListener("mouseenter", function () {
      this.style.textShadow = "0 0 15px currentColor";
    });

    link.addEventListener("mouseleave", function () {
      this.style.textShadow = "";
    });
  });
}

// Form enhancements
function initializeFormEnhancements() {
  // Add floating labels effect
  const formControls = document.querySelectorAll(".form-control");

  formControls.forEach((control) => {
    control.addEventListener("focus", function () {
      this.parentElement.classList.add("focused");
    });

    control.addEventListener("blur", function () {
      if (!this.value) {
        this.parentElement.classList.remove("focused");
      }
    });

    // Check if already has value on load
    if (control.value) {
      control.parentElement.classList.add("focused");
    }
  });

  // Form validation enhancements
  const forms = document.querySelectorAll("form");
  forms.forEach((form) => {
    form.addEventListener("submit", function (e) {
      if (!validateForm(this)) {
        e.preventDefault();
        showFormErrors();
      }
    });
  });

  // Password strength indicator
  const passwordFields = document.querySelectorAll('input[type="password"]');
  passwordFields.forEach((field) => {
    if (field.name === "password") {
      addPasswordStrengthMeter(field);
    }
  });
}

// File upload enhancements
function initializeFileUpload() {
  const fileInputs = document.querySelectorAll('input[type="file"]');

  fileInputs.forEach((input) => {
    const uploadArea = createUploadArea(input);

    // Drag and drop functionality
    uploadArea.addEventListener("dragover", function (e) {
      e.preventDefault();
      this.classList.add("dragover");
    });

    uploadArea.addEventListener("dragleave", function () {
      this.classList.remove("dragover");
    });

    uploadArea.addEventListener("drop", function (e) {
      e.preventDefault();
      this.classList.remove("dragover");

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        input.files = files;
        updateFilePreview(input, files[0]);
      }
    });

    // File selection change
    input.addEventListener("change", function () {
      if (this.files.length > 0) {
        updateFilePreview(this, this.files[0]);
      }
    });
  });
}

// Status updates and real-time features
function initializeStatusUpdates() {
  // Check for verification status updates
  if (window.location.pathname.includes("verification-status")) {
    setInterval(checkVerificationStatus, 30000); // Check every 30 seconds
  }

  // Auto-refresh admin dashboard
  if (window.location.pathname.includes("admin-dashboard")) {
    setInterval(refreshDashboardStats, 60000); // Refresh every minute
  }
}

// Initialize tooltips
function initializeTooltips() {
  // Bootstrap tooltips
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]'),
  );
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Custom neon tooltips
  const customTooltips = document.querySelectorAll("[data-tooltip]");
  customTooltips.forEach((element) => {
    element.addEventListener("mouseenter", showCustomTooltip);
    element.addEventListener("mouseleave", hideCustomTooltip);
  });
}

// Table enhancements
function initializeTables() {
  const tables = document.querySelectorAll(".table");

  tables.forEach((table) => {
    // Add sorting functionality
    const headers = table.querySelectorAll("th[data-sortable]");
    headers.forEach((header) => {
      header.style.cursor = "pointer";
      header.addEventListener("click", function () {
        sortTable(table, this);
      });
    });

    // Add row hover effects
    const rows = table.querySelectorAll("tbody tr");
    rows.forEach((row) => {
      row.addEventListener("mouseenter", function () {
        this.style.boxShadow = "0 0 15px rgba(0, 255, 255, 0.3)";
      });

      row.addEventListener("mouseleave", function () {
        this.style.boxShadow = "";
      });
    });
  });
}

// Background animations
function startBackgroundAnimations() {
  // Create floating particles
  createFloatingParticles();

  // Start logo animation
  const logo = document.querySelector(".fanz-logo");
  if (logo) {
    logo.classList.add("dripping");
  }
}

// Utility functions
function validateForm(form) {
  let isValid = true;
  const requiredFields = form.querySelectorAll("[required]");

  requiredFields.forEach((field) => {
    if (!field.value.trim()) {
      field.classList.add("is-invalid");
      isValid = false;
    } else {
      field.classList.remove("is-invalid");
    }
  });

  // Email validation
  const emailFields = form.querySelectorAll('input[type="email"]');
  emailFields.forEach((field) => {
    if (field.value && !isValidEmail(field.value)) {
      field.classList.add("is-invalid");
      isValid = false;
    }
  });

  // Password confirmation
  const password = form.querySelector('input[name="password"]');
  const confirmPassword = form.querySelector('input[name="password2"]');
  if (password && confirmPassword && password.value !== confirmPassword.value) {
    confirmPassword.classList.add("is-invalid");
    isValid = false;
  }

  return isValid;
}

function showFormErrors() {
  const invalidFields = document.querySelectorAll(".is-invalid");
  if (invalidFields.length > 0) {
    showAlert("Please correct the highlighted errors", "error");
    invalidFields[0].focus();
  }
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function addPasswordStrengthMeter(field) {
  const meter = document.createElement("div");
  meter.className = "password-strength-meter mt-2";

  // Create strength bar safely
  const strengthBar = document.createElement("div");
  strengthBar.className = "strength-bar";
  const strengthFill = document.createElement("div");
  strengthFill.className = "strength-fill";
  strengthBar.appendChild(strengthFill);

  // Create strength text safely
  const strengthText = document.createElement("div");
  strengthText.className = "strength-text";
  strengthText.textContent = "Enter password";

  meter.appendChild(strengthBar);
  meter.appendChild(strengthText);
  field.parentNode.appendChild(meter);

  field.addEventListener("input", function () {
    const strength = calculatePasswordStrength(this.value);
    updatePasswordMeter(meter, strength);
  });
}

function calculatePasswordStrength(password) {
  let strength = 0;

  if (password.length >= 8) strength += 25;
  if (password.match(/[a-z]/)) strength += 25;
  if (password.match(/[A-Z]/)) strength += 25;
  if (password.match(/[0-9]/)) strength += 15;
  if (password.match(/[^a-zA-Z0-9]/)) strength += 10;

  return Math.min(strength, 100);
}

function updatePasswordMeter(meter, strength) {
  const fill = meter.querySelector(".strength-fill");
  const text = meter.querySelector(".strength-text");

  fill.style.width = strength + "%";

  if (strength < 25) {
    fill.style.background = "#ff4444";
    text.textContent = "Weak";
    text.style.color = "#ff4444";
  } else if (strength < 50) {
    fill.style.background = "#ff8800";
    text.textContent = "Fair";
    text.style.color = "#ff8800";
  } else if (strength < 75) {
    fill.style.background = "#ffff00";
    text.textContent = "Good";
    text.style.color = "#ffff00";
  } else {
    fill.style.background = "#00ff00";
    text.textContent = "Strong";
    text.style.color = "#00ff00";
  }
}

function createUploadArea(input) {
  const uploadArea = document.createElement("div");
  uploadArea.className = "file-upload-area";

  // Create upload icon safely
  const iconDiv = document.createElement("div");
  iconDiv.className = "file-upload-icon";
  const icon = document.createElement("i");
  icon.className = "fas fa-cloud-upload-alt";
  iconDiv.appendChild(icon);

  // Create heading safely
  const heading = document.createElement("h5");
  heading.textContent = "Drop files here or click to browse";

  // Create description safely
  const description = document.createElement("p");
  description.textContent = "Supported formats: JPG, PNG, PDF, GIF";

  uploadArea.appendChild(iconDiv);
  uploadArea.appendChild(heading);
  uploadArea.appendChild(description);

  input.parentNode.insertBefore(uploadArea, input.nextSibling);
  input.style.display = "none";

  uploadArea.addEventListener("click", function () {
    input.click();
  });

  return uploadArea;
}

function updateFilePreview(input, file) {
  const uploadArea = input.nextElementSibling;

  if (file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = function (e) {
      // Clear existing content
      uploadArea.innerHTML = "";

      // Create preview container safely
      const preview = document.createElement("div");
      preview.className = "file-preview";

      // Create image safely
      const img = document.createElement("img");
      img.src = e.target.result;
      img.alt = "Preview";
      img.style.cssText =
        "max-width: 200px; max-height: 200px; border-radius: 10px;";

      // Create filename safely
      const fileName = document.createElement("h6");
      fileName.className = "mt-2";
      fileName.textContent = file.name;

      // Create file size safely
      const fileSize = document.createElement("p");
      fileSize.className = "text-muted";
      fileSize.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;

      preview.appendChild(img);
      preview.appendChild(fileName);
      preview.appendChild(fileSize);
      uploadArea.appendChild(preview);
    };
    reader.readAsDataURL(file);
  } else {
    // Clear existing content
    uploadArea.innerHTML = "";

    // Create preview container safely
    const preview = document.createElement("div");
    preview.className = "file-preview";

    // Create file icon safely
    const iconDiv = document.createElement("div");
    iconDiv.className = "file-upload-icon";
    const icon = document.createElement("i");
    icon.className = "fas fa-file-alt";
    iconDiv.appendChild(icon);

    // Create filename safely
    const fileName = document.createElement("h6");
    fileName.textContent = file.name;

    // Create file size safely
    const fileSize = document.createElement("p");
    fileSize.className = "text-muted";
    fileSize.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;

    preview.appendChild(iconDiv);
    preview.appendChild(fileName);
    preview.appendChild(fileSize);
    uploadArea.appendChild(preview);
  }
}

function checkVerificationStatus() {
  fetch("/api/verification-status")
    .then((response) => response.json())
    .then((data) => {
      if (data.updated) {
        location.reload();
      }
    })
    .catch((error) => console.log("Status check failed:", error));
}

function refreshDashboardStats() {
  fetch("/api/dashboard-stats")
    .then((response) => response.json())
    .then((data) => {
      updateDashboardStats(data);
    })
    .catch((error) => console.log("Stats refresh failed:", error));
}

function updateDashboardStats(stats) {
  Object.keys(stats).forEach((key) => {
    const element = document.querySelector(`[data-stat="${key}"]`);
    if (element) {
      element.textContent = stats[key];
    }
  });
}

function showCustomTooltip(e) {
  const tooltip = document.createElement("div");
  tooltip.className = "custom-tooltip";
  tooltip.textContent = e.target.getAttribute("data-tooltip");

  document.body.appendChild(tooltip);

  const rect = e.target.getBoundingClientRect();
  tooltip.style.left =
    rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + "px";
  tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + "px";

  setTimeout(() => {
    tooltip.style.opacity = "1";
  }, 10);
}

function hideCustomTooltip() {
  const tooltips = document.querySelectorAll(".custom-tooltip");
  tooltips.forEach((tooltip) => {
    tooltip.remove();
  });
}

function sortTable(table, header) {
  const tbody = table.querySelector("tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));
  const columnIndex = Array.from(header.parentNode.children).indexOf(header);
  const isAscending = !header.classList.contains("sort-desc");

  rows.sort((a, b) => {
    const aValue = a.children[columnIndex].textContent.trim();
    const bValue = b.children[columnIndex].textContent.trim();

    if (isAscending) {
      return aValue.localeCompare(bValue, undefined, { numeric: true });
    } else {
      return bValue.localeCompare(aValue, undefined, { numeric: true });
    }
  });

  // Clear all sort classes
  header.parentNode.querySelectorAll("th").forEach((th) => {
    th.classList.remove("sort-asc", "sort-desc");
  });

  // Add appropriate class
  header.classList.add(isAscending ? "sort-asc" : "sort-desc");

  // Reorder rows
  rows.forEach((row) => tbody.appendChild(row));
}

function createFloatingParticles() {
  const particleContainer = document.createElement("div");
  particleContainer.className = "floating-particles";
  particleContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
    `;

  document.body.appendChild(particleContainer);

  for (let i = 0; i < 20; i++) {
    createParticle(particleContainer);
  }
}

function createParticle(container) {
  const particle = document.createElement("div");
  particle.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        background: var(--neon-cyan);
        border-radius: 50%;
        box-shadow: 0 0 6px var(--neon-cyan);
        animation: float ${5 + Math.random() * 10}s ease-in-out infinite;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation-delay: ${Math.random() * 5}s;
    `;

  container.appendChild(particle);

  // Remove and recreate particle after animation
  setTimeout(
    () => {
      if (particle.parentNode) {
        particle.remove();
        createParticle(container);
      }
    },
    (5 + Math.random() * 10) * 1000,
  );
}

// Alert system
function showAlert(message, type = "info", duration = 5000) {
  const alert = document.createElement("div");
  alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
  alert.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        max-width: 400px;
    `;

  // Create message text safely
  const messageSpan = document.createElement("span");
  messageSpan.textContent = message;

  // Create close button safely
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "btn-close";
  closeButton.setAttribute("data-bs-dismiss", "alert");

  alert.appendChild(messageSpan);
  alert.appendChild(closeButton);

  document.body.appendChild(alert);

  // Auto dismiss
  setTimeout(() => {
    if (alert.parentNode) {
      alert.remove();
    }
  }, duration);
}

// Global error handler
window.addEventListener("error", function (e) {
  console.error("JavaScript error:", e.error);
  if (
    window.location.pathname.includes("admin") ||
    window.location.pathname.includes("dashboard")
  ) {
    showAlert("An error occurred. Please refresh the page.", "danger");
  }
});

// CSRF token helper for AJAX requests
function getCSRFToken() {
  const csrfToken = document.querySelector("meta[name=csrf-token]");
  return csrfToken ? csrfToken.getAttribute("content") : "";
}

// Add floating animations to CSS
const floatingAnimationCSS = `
@keyframes float {
    0%, 100% {
        transform: translateY(0px) rotate(0deg);
        opacity: 0.7;
    }
    50% {
        transform: translateY(-20px) rotate(180deg);
        opacity: 1;
    }
}

.custom-tooltip {
    position: absolute;
    background: var(--card-bg);
    color: var(--neon-cyan);
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.8rem;
    border: 1px solid var(--neon-cyan);
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    z-index: 10000;
}

.password-strength-meter {
    margin-top: 8px;
}

.strength-bar {
    height: 4px;
    background: var(--border-color);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 5px;
}

.strength-fill {
    height: 100%;
    width: 0%;
    transition: width 0.3s ease, background 0.3s ease;
    border-radius: 2px;
}

.strength-text {
    font-size: 0.8rem;
    text-align: center;
    transition: color 0.3s ease;
}

th.sort-asc::after {
    content: ' ↑';
    color: var(--neon-cyan);
}

th.sort-desc::after {
    content: ' ↓';
    color: var(--neon-cyan);
}
`;

// Inject additional CSS
const styleElement = document.createElement("style");
styleElement.textContent = floatingAnimationCSS;
document.head.appendChild(styleElement);

// Export functions for global use
window.FanzLab = {
  showAlert,
  validateForm,
  getCSRFToken,
};
