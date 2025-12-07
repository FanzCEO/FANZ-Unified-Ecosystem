/**
 * FANZ Social Media Integration System
 * One-click social media connection and profile sync
 */

class SocialMediaIntegration {
  constructor() {
    this.platforms = {
      twitter: {
        name: "Twitter/X",
        icon: "fab fa-twitter",
        color: "#1DA1F2",
        supported: true,
      },
      instagram: {
        name: "Instagram",
        icon: "fab fa-instagram",
        color: "#E4405F",
        supported: true,
      },
      tiktok: {
        name: "TikTok",
        icon: "fab fa-tiktok",
        color: "#000000",
        supported: true,
      },
      youtube: {
        name: "YouTube",
        icon: "fab fa-youtube",
        color: "#FF0000",
        supported: true,
      },
      onlyfans: {
        name: "OnlyFans",
        icon: "fas fa-star",
        color: "#00AFF0",
        supported: true,
      },
      fansly: {
        name: "Fansly",
        icon: "fas fa-heart",
        color: "#FF6B6B",
        supported: true,
      },
      discord: {
        name: "Discord",
        icon: "fab fa-discord",
        color: "#7289DA",
        supported: true,
      },
      telegram: {
        name: "Telegram",
        icon: "fab fa-telegram",
        color: "#0088CC",
        supported: true,
      },
    };

    this.connectedAccounts = new Map();
    this.init();
  }

  init() {
    this.loadConnectedAccounts();
    this.createSocialHub();
    this.bindEvents();
  }

  createSocialHub() {
    // Check if social hub already exists
    if (document.querySelector(".social-media-hub")) return;

    const hubHTML = `
            <div class="social-media-hub card glassmorphism">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">
                        <i class="fas fa-share-alt neon-cyan me-2"></i>
                        Social Media Hub
                    </h5>
                    <button class="btn btn-sm btn-outline-primary" id="sync-all-platforms">
                        <i class="fas fa-sync"></i> Sync All
                    </button>
                </div>
                <div class="card-body">
                    <div class="row g-3" id="social-platforms-grid">
                        ${this.generatePlatformCards()}
                    </div>
                    
                    <div class="mt-4">
                        <h6 class="text-muted mb-3">Quick Actions</h6>
                        <div class="row g-2">
                            <div class="col-md-4">
                                <button class="btn btn-outline-primary w-100" id="cross-post-content">
                                    <i class="fas fa-broadcast-tower me-2"></i>
                                    Cross-Post Content
                                </button>
                            </div>
                            <div class="col-md-4">
                                <button class="btn btn-outline-secondary w-100" id="sync-followers">
                                    <i class="fas fa-users me-2"></i>
                                    Sync Followers
                                </button>
                            </div>
                            <div class="col-md-4">
                                <button class="btn btn-outline-info w-100" id="analytics-overview">
                                    <i class="fas fa-chart-line me-2"></i>
                                    View Analytics
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    // Add to profile or dashboard page
    const container =
      document.querySelector(
        ".fan-dashboard-container, .star-dashboard-container, .profile-container",
      ) || document.querySelector(".container");

    if (container) {
      container.insertAdjacentHTML("beforeend", hubHTML);
    }
  }

  generatePlatformCards() {
    return Object.entries(this.platforms)
      .map(([key, platform]) => {
        const isConnected = this.connectedAccounts.has(key);
        const connectionStatus = isConnected ? "connected" : "disconnected";

        return `
                <div class="col-md-6 col-lg-4">
                    <div class="social-platform-card ${connectionStatus}" data-platform="${key}">
                        <div class="platform-header">
                            <div class="platform-icon" style="color: ${platform.color}">
                                <i class="${platform.icon}"></i>
                            </div>
                            <div class="platform-info">
                                <h6 class="platform-name">${platform.name}</h6>
                                <span class="connection-status">
                                    ${
                                      isConnected
                                        ? '<i class="fas fa-check-circle text-success"></i> Connected'
                                        : '<i class="fas fa-times-circle text-muted"></i> Not Connected'
                                    }
                                </span>
                            </div>
                        </div>
                        
                        <div class="platform-actions mt-3">
                            ${
                              isConnected
                                ? `
                                <button class="btn btn-sm btn-outline-danger disconnect-btn" data-platform="${key}">
                                    <i class="fas fa-unlink"></i> Disconnect
                                </button>
                                <button class="btn btn-sm btn-outline-primary sync-btn" data-platform="${key}">
                                    <i class="fas fa-sync"></i> Sync
                                </button>
                            `
                                : `
                                <button class="btn btn-sm btn-primary connect-btn w-100" data-platform="${key}">
                                    <i class="fas fa-link"></i> Connect ${platform.name}
                                </button>
                            `
                            }
                        </div>
                        
                        ${isConnected ? this.generateAccountStats(key) : ""}
                    </div>
                </div>
            `;
      })
      .join("");
  }

  generateAccountStats(platform) {
    const account = this.connectedAccounts.get(platform);
    if (!account) return "";

    return `
            <div class="account-stats mt-3 pt-3 border-top">
                <div class="row g-2">
                    <div class="col-6">
                        <div class="stat-item">
                            <small class="text-muted">Followers</small>
                            <div class="stat-value">${this.formatNumber(account.followers || 0)}</div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="stat-item">
                            <small class="text-muted">Posts</small>
                            <div class="stat-value">${this.formatNumber(account.posts || 0)}</div>
                        </div>
                    </div>
                </div>
                <div class="last-sync mt-2">
                    <small class="text-muted">
                        <i class="fas fa-clock"></i> 
                        Last synced: ${this.formatTimeAgo(account.lastSync)}
                    </small>
                </div>
            </div>
        `;
  }

  bindEvents() {
    // Connect platform buttons
    document.addEventListener("click", (e) => {
      if (e.target.closest(".connect-btn")) {
        const platform = e.target.closest(".connect-btn").dataset.platform;
        this.connectPlatform(platform);
      }

      if (e.target.closest(".disconnect-btn")) {
        const platform = e.target.closest(".disconnect-btn").dataset.platform;
        this.disconnectPlatform(platform);
      }

      if (e.target.closest(".sync-btn")) {
        const platform = e.target.closest(".sync-btn").dataset.platform;
        this.syncPlatform(platform);
      }

      if (e.target.closest("#sync-all-platforms")) {
        this.syncAllPlatforms();
      }

      if (e.target.closest("#cross-post-content")) {
        this.openCrossPostModal();
      }

      if (e.target.closest("#sync-followers")) {
        this.syncAllFollowers();
      }

      if (e.target.closest("#analytics-overview")) {
        this.showAnalyticsOverview();
      }
    });
  }

  async connectPlatform(platform) {
    try {
      const button = document.querySelector(
        `[data-platform="${platform}"] .connect-btn`,
      );
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
      button.disabled = true;

      // Start OAuth flow
      const authUrl = await this.getOAuthUrl(platform);

      // Open popup window for OAuth
      const popup = window.open(
        authUrl,
        `${platform}_oauth`,
        "width=600,height=700,scrollbars=yes,resizable=yes",
      );

      // Listen for OAuth completion
      const authResult = await this.waitForOAuthCompletion(popup, platform);

      if (authResult.success) {
        await this.completeConnection(platform, authResult.data);
        this.showSuccessMessage(
          `Successfully connected to ${this.platforms[platform].name}!`,
        );
        this.refreshPlatformCard(platform);
      } else {
        throw new Error(authResult.error || "Connection failed");
      }
    } catch (error) {
      console.error("Platform connection error:", error);
      this.showErrorMessage(
        `Failed to connect to ${this.platforms[platform].name}: ${error.message}`,
      );
    } finally {
      const button = document.querySelector(
        `[data-platform="${platform}"] .connect-btn`,
      );
      button.innerHTML = `<i class="fas fa-link"></i> Connect ${this.platforms[platform].name}`;
      button.disabled = false;
    }
  }

  async getOAuthUrl(platform) {
    const response = await fetch(`/api/social/oauth/url/${platform}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to get OAuth URL");
    }

    return data.auth_url;
  }

  waitForOAuthCompletion(popup, platform) {
    return new Promise((resolve, reject) => {
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          // Check if authorization was successful
          this.checkOAuthResult(platform).then(resolve).catch(reject);
        }
      }, 1000);

      // Timeout after 10 minutes
      setTimeout(() => {
        clearInterval(checkClosed);
        if (!popup.closed) {
          popup.close();
        }
        reject(new Error("OAuth timeout"));
      }, 600000);
    });
  }

  async checkOAuthResult(platform) {
    const response = await fetch(`/api/social/oauth/result/${platform}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return await response.json();
  }

  async completeConnection(platform, authData) {
    const response = await fetch("/api/social/connect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        platform: platform,
        auth_data: authData,
      }),
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Failed to complete connection");
    }

    // Update local state
    this.connectedAccounts.set(platform, {
      platform: platform,
      username: result.username,
      followers: result.followers,
      posts: result.posts,
      lastSync: new Date().toISOString(),
      ...result.account_data,
    });

    return result;
  }

  async disconnectPlatform(platform) {
    if (
      !confirm(
        `Are you sure you want to disconnect from ${this.platforms[platform].name}?`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/social/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ platform: platform }),
      });

      const result = await response.json();
      if (result.success) {
        this.connectedAccounts.delete(platform);
        this.refreshPlatformCard(platform);
        this.showSuccessMessage(
          `Disconnected from ${this.platforms[platform].name}`,
        );
      } else {
        throw new Error(result.error || "Disconnection failed");
      }
    } catch (error) {
      console.error("Disconnect error:", error);
      this.showErrorMessage(`Failed to disconnect: ${error.message}`);
    }
  }

  async syncPlatform(platform) {
    try {
      const button = document.querySelector(
        `[data-platform="${platform}"] .sync-btn`,
      );
      const originalText = button.innerHTML;
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...';
      button.disabled = true;

      const response = await fetch("/api/social/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ platform: platform }),
      });

      const result = await response.json();
      if (result.success) {
        // Update account data
        const account = this.connectedAccounts.get(platform);
        if (account) {
          Object.assign(account, result.updated_data);
          account.lastSync = new Date().toISOString();
        }

        this.refreshPlatformCard(platform);
        this.showSuccessMessage(
          `${this.platforms[platform].name} synced successfully`,
        );
      } else {
        throw new Error(result.error || "Sync failed");
      }
    } catch (error) {
      console.error("Sync error:", error);
      this.showErrorMessage(`Sync failed: ${error.message}`);
    } finally {
      const button = document.querySelector(
        `[data-platform="${platform}"] .sync-btn`,
      );
      button.innerHTML = '<i class="fas fa-sync"></i> Sync';
      button.disabled = false;
    }
  }

  async syncAllPlatforms() {
    const connectedPlatforms = Array.from(this.connectedAccounts.keys());

    if (connectedPlatforms.length === 0) {
      this.showInfoMessage("No connected platforms to sync");
      return;
    }

    const button = document.querySelector("#sync-all-platforms");
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...';
    button.disabled = true;

    try {
      const syncPromises = connectedPlatforms.map((platform) =>
        this.syncPlatform(platform),
      );
      await Promise.all(syncPromises);
      this.showSuccessMessage("All platforms synced successfully");
    } catch (error) {
      this.showErrorMessage("Some platforms failed to sync");
    } finally {
      button.innerHTML = originalText;
      button.disabled = false;
    }
  }

  refreshPlatformCard(platform) {
    const card = document.querySelector(`[data-platform="${platform}"]`);
    if (card) {
      const isConnected = this.connectedAccounts.has(platform);
      card.className = `social-platform-card ${isConnected ? "connected" : "disconnected"}`;

      // Update the entire card content
      const newCardHTML = this.generatePlatformCards();
      const parser = new DOMParser();
      const newDoc = parser.parseFromString(newCardHTML, "text/html");
      const newCard = newDoc.querySelector(`[data-platform="${platform}"]`);

      if (newCard) {
        card.outerHTML = newCard.outerHTML;
      }
    }
  }

  openCrossPostModal() {
    // Create and show cross-posting modal
    const modalHTML = `
            <div class="modal fade" id="crossPostModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-broadcast-tower me-2"></i>
                                Cross-Post Content
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="crossPostForm">
                                <div class="mb-3">
                                    <label class="form-label">Content</label>
                                    <textarea class="form-control" rows="4" placeholder="What would you like to share?"></textarea>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Select Platforms</label>
                                    <div class="platform-selection">
                                        ${this.generatePlatformCheckboxes()}
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Schedule</label>
                                    <div class="row g-2">
                                        <div class="col">
                                            <input type="datetime-local" class="form-control" id="scheduleDateTime">
                                        </div>
                                        <div class="col-auto">
                                            <button type="button" class="btn btn-outline-primary" id="scheduleNow">
                                                Post Now
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="submitCrossPost">
                                <i class="fas fa-paper-plane"></i> Post
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    const modal = new bootstrap.Modal(
      document.getElementById("crossPostModal"),
    );
    modal.show();

    // Clean up modal when hidden
    document
      .getElementById("crossPostModal")
      .addEventListener("hidden.bs.modal", function () {
        this.remove();
      });
  }

  generatePlatformCheckboxes() {
    return Array.from(this.connectedAccounts.keys())
      .map((platform) => {
        const platformData = this.platforms[platform];
        return `
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="checkbox" value="${platform}" id="platform_${platform}">
                    <label class="form-check-label" for="platform_${platform}">
                        <i class="${platformData.icon}" style="color: ${platformData.color}"></i>
                        ${platformData.name}
                    </label>
                </div>
            `;
      })
      .join("");
  }

  async loadConnectedAccounts() {
    try {
      const response = await fetch("/api/social/accounts");
      const data = await response.json();

      if (data.success) {
        data.accounts.forEach((account) => {
          this.connectedAccounts.set(account.platform, account);
        });
      }
    } catch (error) {
      console.error("Failed to load connected accounts:", error);
    }
  }

  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  }

  formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
  }

  showSuccessMessage(message) {
    this.showToast(message, "success");
  }

  showErrorMessage(message) {
    this.showToast(message, "danger");
  }

  showInfoMessage(message) {
    this.showToast(message, "info");
  }

  showToast(message, type = "info") {
    const toastHTML = `
            <div class="toast align-items-center text-bg-${type} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;

    let toastContainer = document.querySelector(".toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.className =
        "toast-container position-fixed top-0 end-0 p-3";
      document.body.appendChild(toastContainer);
    }

    toastContainer.insertAdjacentHTML("beforeend", toastHTML);
    const toast = toastContainer.lastElementChild;
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    toast.addEventListener("hidden.bs.toast", () => toast.remove());
  }
}

// Initialize social media integration on dashboard pages
document.addEventListener("DOMContentLoaded", () => {
  if (
    window.location.pathname.includes("dashboard") ||
    window.location.pathname.includes("profile")
  ) {
    const socialIntegration = new SocialMediaIntegration();
    window.socialIntegration = socialIntegration;
  }
});

// Expose for manual initialization
window.SocialMediaIntegration = SocialMediaIntegration;
