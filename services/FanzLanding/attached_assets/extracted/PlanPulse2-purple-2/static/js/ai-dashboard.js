/**
 * FANZ AI-Powered Dashboard Widgets
 * Intelligent recommendations and personalized insights
 */

class AIDashboard {
  constructor() {
    this.widgets = new Map();
    this.userRole = null;
    this.aiModels = {
      recommendations: "content-optimizer-v2",
      audience: "audience-analyzer-v1",
      trending: "trend-predictor-v1",
      earnings: "revenue-optimizer-v1",
    };

    this.init();
  }

  init() {
    this.userRole = document.body.dataset.userRole || "fan";
    this.createAIDashboard();
    this.loadAIWidgets();
    this.bindEvents();
    this.startRealTimeUpdates();
  }

  createAIDashboard() {
    // Check if AI dashboard already exists
    if (document.querySelector(".ai-dashboard")) return;

    const dashboardHTML = `
            <div class="ai-dashboard">
                <div class="ai-dashboard-header mb-4">
                    <div class="d-flex justify-content-between align-items-center">
                        <h4 class="mb-0">
                            <i class="fas fa-robot neon-cyan me-2"></i>
                            AI-Powered Insights
                        </h4>
                        <div class="ai-controls">
                            <button class="btn btn-sm btn-outline-primary" id="refresh-ai-data">
                                <i class="fas fa-sync"></i> Refresh
                            </button>
                            <button class="btn btn-sm btn-outline-secondary" id="customize-widgets">
                                <i class="fas fa-cog"></i> Customize
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="ai-widgets-grid" id="ai-widgets-container">
                    ${this.generateRoleBasedWidgets()}
                </div>
            </div>
        `;

    // Insert into dashboard
    const container =
      document.querySelector(
        ".fan-dashboard-container, .star-dashboard-container, .admin-dashboard-container",
      ) || document.querySelector(".container");

    if (container) {
      container.insertAdjacentHTML("beforeend", dashboardHTML);
    }
  }

  generateRoleBasedWidgets() {
    switch (this.userRole) {
      case "star":
        return this.generateCreatorWidgets();
      case "fan":
        return this.generateFanWidgets();
      case "admin":
      case "exec":
        return this.generateAdminWidgets();
      default:
        return this.generateDefaultWidgets();
    }
  }

  generateCreatorWidgets() {
    return `
            <div class="ai-widget content-optimizer" data-widget="content-optimizer">
                <div class="widget-header">
                    <h6><i class="fas fa-magic"></i> Content Optimizer</h6>
                    <div class="ai-status active">
                        <i class="fas fa-circle"></i> AI Active
                    </div>
                </div>
                <div class="widget-content">
                    <div class="loading-state">
                        <div class="ai-thinking">
                            <div class="ai-dots">
                                <span></span><span></span><span></span>
                            </div>
                            <p>AI analyzing your content strategy...</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="ai-widget audience-insights" data-widget="audience-insights">
                <div class="widget-header">
                    <h6><i class="fas fa-users"></i> Audience Insights</h6>
                    <div class="confidence-score">92% Accuracy</div>
                </div>
                <div class="widget-content">
                    <div class="loading-state">
                        <div class="ai-thinking">
                            <div class="ai-dots">
                                <span></span><span></span><span></span>
                            </div>
                            <p>Analyzing audience behavior patterns...</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="ai-widget trending-topics" data-widget="trending-topics">
                <div class="widget-header">
                    <h6><i class="fas fa-fire"></i> Trending Predictions</h6>
                    <div class="update-time">Updated 5m ago</div>
                </div>
                <div class="widget-content">
                    <div class="loading-state">
                        <div class="ai-thinking">
                            <div class="ai-dots">
                                <span></span><span></span><span></span>
                            </div>
                            <p>Predicting trending content...</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="ai-widget earnings-optimizer" data-widget="earnings-optimizer">
                <div class="widget-header">
                    <h6><i class="fas fa-dollar-sign"></i> Revenue Optimizer</h6>
                    <div class="revenue-trend up">
                        <i class="fas fa-arrow-up"></i> +23%
                    </div>
                </div>
                <div class="widget-content">
                    <div class="loading-state">
                        <div class="ai-thinking">
                            <div class="ai-dots">
                                <span></span><span></span><span></span>
                            </div>
                            <p>Optimizing revenue strategies...</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="ai-widget smart-scheduler" data-widget="smart-scheduler">
                <div class="widget-header">
                    <h6><i class="fas fa-calendar-alt"></i> Smart Scheduler</h6>
                    <div class="ai-suggestion">3 optimal times found</div>
                </div>
                <div class="widget-content">
                    <div class="loading-state">
                        <div class="ai-thinking">
                            <div class="ai-dots">
                                <span></span><span></span><span></span>
                            </div>
                            <p>Finding optimal posting times...</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="ai-widget performance-analytics" data-widget="performance-analytics">
                <div class="widget-header">
                    <h6><i class="fas fa-chart-line"></i> Performance AI</h6>
                    <div class="performance-score">A+</div>
                </div>
                <div class="widget-content">
                    <div class="loading-state">
                        <div class="ai-thinking">
                            <div class="ai-dots">
                                <span></span><span></span><span></span>
                            </div>
                            <p>Analyzing performance metrics...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  generateFanWidgets() {
    return `
            <div class="ai-widget content-discovery" data-widget="content-discovery">
                <div class="widget-header">
                    <h6><i class="fas fa-compass"></i> Discover for You</h6>
                    <div class="ai-status active">
                        <i class="fas fa-circle"></i> AI Active
                    </div>
                </div>
                <div class="widget-content">
                    <div class="loading-state">
                        <div class="ai-thinking">
                            <div class="ai-dots">
                                <span></span><span></span><span></span>
                            </div>
                            <p>Finding content you'll love...</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="ai-widget creator-recommendations" data-widget="creator-recommendations">
                <div class="widget-header">
                    <h6><i class="fas fa-star"></i> Recommended Creators</h6>
                    <div class="match-score">95% Match</div>
                </div>
                <div class="widget-content">
                    <div class="loading-state">
                        <div class="ai-thinking">
                            <div class="ai-dots">
                                <span></span><span></span><span></span>
                            </div>
                            <p>Finding creators you'll love...</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="ai-widget trending-creators" data-widget="trending-creators">
                <div class="widget-header">
                    <h6><i class="fas fa-trending-up"></i> Rising Stars</h6>
                    <div class="trend-indicator">Hot</div>
                </div>
                <div class="widget-content">
                    <div class="loading-state">
                        <div class="ai-thinking">
                            <div class="ai-dots">
                                <span></span><span></span><span></span>
                            </div>
                            <p>Identifying rising talent...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  generateAdminWidgets() {
    return `
            <div class="ai-widget platform-insights" data-widget="platform-insights">
                <div class="widget-header">
                    <h6><i class="fas fa-brain"></i> Platform Intelligence</h6>
                    <div class="ai-status active">
                        <i class="fas fa-circle"></i> AI Active
                    </div>
                </div>
                <div class="widget-content">
                    <div class="loading-state">
                        <div class="ai-thinking">
                            <div class="ai-dots">
                                <span></span><span></span><span></span>
                            </div>
                            <p>Analyzing platform metrics...</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="ai-widget user-behavior" data-widget="user-behavior">
                <div class="widget-header">
                    <h6><i class="fas fa-user-chart"></i> User Behavior AI</h6>
                    <div class="prediction-accuracy">89% Accurate</div>
                </div>
                <div class="widget-content">
                    <div class="loading-state">
                        <div class="ai-thinking">
                            <div class="ai-dots">
                                <span></span><span></span><span></span>
                            </div>
                            <p>Analyzing user behavior...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  generateDefaultWidgets() {
    return `
            <div class="ai-widget getting-started" data-widget="getting-started">
                <div class="widget-header">
                    <h6><i class="fas fa-rocket"></i> AI Assistant</h6>
                    <div class="ai-status active">
                        <i class="fas fa-circle"></i> Ready
                    </div>
                </div>
                <div class="widget-content">
                    <div class="welcome-ai">
                        <p>Welcome! I'm your AI assistant ready to help optimize your FanzLab experience.</p>
                        <button class="btn btn-primary btn-sm">Get Started</button>
                    </div>
                </div>
            </div>
        `;
  }

  async loadAIWidgets() {
    const widgets = document.querySelectorAll(".ai-widget");

    // Stagger widget loading for smooth experience
    for (let i = 0; i < widgets.length; i++) {
      setTimeout(() => {
        this.loadWidget(widgets[i]);
      }, i * 500);
    }
  }

  async loadWidget(widgetElement) {
    const widgetType = widgetElement.dataset.widget;

    try {
      const data = await this.fetchAIData(widgetType);
      this.renderWidget(widgetElement, widgetType, data);
      this.widgets.set(widgetType, { element: widgetElement, data: data });
    } catch (error) {
      console.error(`Failed to load AI widget ${widgetType}:`, error);
      this.renderErrorState(widgetElement, error.message);
    }
  }

  async fetchAIData(widgetType) {
    // Simulate AI processing time
    await this.delay(1500 + Math.random() * 1000);

    const response = await fetch(`/api/ai/widgets/${widgetType}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`AI service unavailable`);
    }

    return await response.json();
  }

  renderWidget(element, type, data) {
    const contentDiv = element.querySelector(".widget-content");

    switch (type) {
      case "content-optimizer":
        contentDiv.innerHTML = this.renderContentOptimizer();
        break;
      case "audience-insights":
        contentDiv.innerHTML = this.renderAudienceInsights();
        break;
      case "trending-topics":
        contentDiv.innerHTML = this.renderTrendingTopics();
        break;
      case "earnings-optimizer":
        contentDiv.innerHTML = this.renderEarningsOptimizer();
        break;
      case "smart-scheduler":
        contentDiv.innerHTML = this.renderSmartScheduler();
        break;
      case "performance-analytics":
        contentDiv.innerHTML = this.renderPerformanceAnalytics();
        break;
      case "content-discovery":
        contentDiv.innerHTML = this.renderContentDiscovery();
        break;
      case "creator-recommendations":
        contentDiv.innerHTML = this.renderCreatorRecommendations();
        break;
      case "trending-creators":
        contentDiv.innerHTML = this.renderTrendingCreators();
        break;
      case "platform-insights":
        contentDiv.innerHTML = this.renderPlatformInsights();
        break;
      case "user-behavior":
        contentDiv.innerHTML = this.renderUserBehavior();
        break;
      default:
        contentDiv.innerHTML = "<p>AI widget loaded successfully!</p>";
    }

    // Add entrance animation
    element.classList.add("widget-loaded");
  }

  renderContentOptimizer() {
    return `
            <div class="ai-recommendations">
                <div class="recommendation-item high-priority">
                    <div class="rec-icon">
                        <i class="fas fa-lightbulb neon-yellow"></i>
                    </div>
                    <div class="rec-content">
                        <h6>Post during peak hours</h6>
                        <p>Your audience is most active between 7-9 PM. Posting then could increase engagement by 34%.</p>
                    </div>
                    <div class="rec-action">
                        <button class="btn btn-sm btn-outline-primary">Schedule</button>
                    </div>
                </div>
                
                <div class="recommendation-item medium-priority">
                    <div class="rec-icon">
                        <i class="fas fa-hashtag neon-cyan"></i>
                    </div>
                    <div class="rec-content">
                        <h6>Use trending hashtags</h6>
                        <p>Add #CreatorLife, #FanzLab to reach 2.3K more users.</p>
                    </div>
                    <div class="rec-action">
                        <button class="btn btn-sm btn-outline-secondary">Apply</button>
                    </div>
                </div>
                
                <div class="ai-insight">
                    <i class="fas fa-chart-line neon-green"></i>
                    <span>Following these suggestions could boost engagement by up to 45%</span>
                </div>
            </div>
        `;
  }

  renderAudienceInsights() {
    return `
            <div class="audience-data">
                <div class="audience-metric">
                    <div class="metric-value">18-25</div>
                    <div class="metric-label">Primary Age Group</div>
                    <div class="metric-change">+12% this month</div>
                </div>
                
                <div class="audience-interests">
                    <h6>Top Interests</h6>
                    <div class="interest-tags">
                        <span class="interest-tag">Gaming</span>
                        <span class="interest-tag">Art</span>
                        <span class="interest-tag">Music</span>
                        <span class="interest-tag">Fashion</span>
                    </div>
                </div>
                
                <div class="audience-activity">
                    <h6>Peak Activity</h6>
                    <div class="activity-timeline">
                        <div class="time-slot high">7 PM</div>
                        <div class="time-slot medium">8 PM</div>
                        <div class="time-slot high">9 PM</div>
                        <div class="time-slot low">10 PM</div>
                    </div>
                </div>
            </div>
        `;
  }

  renderTrendingTopics() {
    return `
            <div class="trending-content">
                <div class="trend-item hot">
                    <div class="trend-indicator">
                        <i class="fas fa-fire"></i>
                        <span class="trend-score">🔥 Hot</span>
                    </div>
                    <div class="trend-info">
                        <h6>VR Content Creation</h6>
                        <p>+156% growth, trending for 3 days</p>
                    </div>
                </div>
                
                <div class="trend-item rising">
                    <div class="trend-indicator">
                        <i class="fas fa-trending-up"></i>
                        <span class="trend-score">📈 Rising</span>
                    </div>
                    <div class="trend-info">
                        <h6>AI Art Collaboration</h6>
                        <p>+89% growth, early adopter opportunity</p>
                    </div>
                </div>
                
                <div class="trend-item emerging">
                    <div class="trend-indicator">
                        <i class="fas fa-seedling"></i>
                        <span class="trend-score">🌱 Emerging</span>
                    </div>
                    <div class="trend-info">
                        <h6>Interactive Stories</h6>
                        <p>+34% growth, perfect timing to start</p>
                    </div>
                </div>
            </div>
        `;
  }

  renderEarningsOptimizer() {
    return `
            <div class="earnings-data">
                <div class="revenue-suggestions">
                    <div class="suggestion-item">
                        <div class="suggestion-icon">
                            <i class="fas fa-dollar-sign neon-green"></i>
                        </div>
                        <div class="suggestion-content">
                            <h6>Optimal Pricing Strategy</h6>
                            <p>Consider raising your premium tier to $15. Similar creators see 23% more revenue.</p>
                        </div>
                        <div class="potential-increase">+$340/mo</div>
                    </div>
                    
                    <div class="suggestion-item">
                        <div class="suggestion-icon">
                            <i class="fas fa-gift neon-yellow"></i>
                        </div>
                        <div class="suggestion-content">
                            <h6>Limited Time Offers</h6>
                            <p>Launch a 48-hour flash sale. Your audience responds well to urgency.</p>
                        </div>
                        <div class="potential-increase">+$180/mo</div>
                    </div>
                </div>
                
                <div class="revenue-forecast">
                    <h6>Revenue Prediction</h6>
                    <div class="forecast-chart">
                        <div class="forecast-bar" style="height: 60%">
                            <span>This Month</span>
                            <span>$1,240</span>
                        </div>
                        <div class="forecast-bar predicted" style="height: 85%">
                            <span>Next Month</span>
                            <span>$1,760</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  renderSmartScheduler() {
    return `
            <div class="scheduler-data">
                <div class="optimal-times">
                    <h6>Optimal Posting Times Today</h6>
                    <div class="time-recommendations">
                        <div class="time-slot recommended">
                            <div class="time">7:30 PM</div>
                            <div class="audience">2.1K active</div>
                            <div class="engagement">High engagement</div>
                        </div>
                        
                        <div class="time-slot good">
                            <div class="time">9:15 PM</div>
                            <div class="audience">1.8K active</div>
                            <div class="engagement">Good engagement</div>
                        </div>
                        
                        <div class="time-slot decent">
                            <div class="time">11:00 PM</div>
                            <div class="audience">1.2K active</div>
                            <div class="engagement">Decent engagement</div>
                        </div>
                    </div>
                </div>
                
                <div class="auto-schedule">
                    <button class="btn btn-primary btn-sm w-100">
                        <i class="fas fa-magic"></i> Auto-Schedule Next Post
                    </button>
                </div>
            </div>
        `;
  }

  renderPerformanceAnalytics() {
    return `
            <div class="performance-data">
                <div class="performance-score-card">
                    <div class="score-value">A+</div>
                    <div class="score-breakdown">
                        <div class="score-item">
                            <span>Engagement</span>
                            <span class="score">95%</span>
                        </div>
                        <div class="score-item">
                            <span>Growth</span>
                            <span class="score">88%</span>
                        </div>
                        <div class="score-item">
                            <span>Retention</span>
                            <span class="score">92%</span>
                        </div>
                    </div>
                </div>
                
                <div class="performance-insights">
                    <div class="insight-item">
                        <i class="fas fa-arrow-up neon-green"></i>
                        <span>Engagement up 23% this week</span>
                    </div>
                    <div class="insight-item">
                        <i class="fas fa-star neon-yellow"></i>
                        <span>Top 5% of creators in your category</span>
                    </div>
                </div>
            </div>
        `;
  }

  renderContentDiscovery() {
    return `
            <div class="discovery-content">
                <div class="recommended-content">
                    <div class="content-item">
                        <div class="content-preview">
                            <div class="content-type">Video</div>
                            <div class="content-creator">@ArtistAlice</div>
                        </div>
                        <div class="content-info">
                            <h6>Digital Art Tutorial Series</h6>
                            <p>97% match • Art • Tutorial</p>
                        </div>
                        <div class="match-score">97%</div>
                    </div>
                    
                    <div class="content-item">
                        <div class="content-preview">
                            <div class="content-type">Stream</div>
                            <div class="content-creator">@GamerGuy</div>
                        </div>
                        <div class="content-info">
                            <h6>Late Night Gaming Session</h6>
                            <p>89% match • Gaming • Live</p>
                        </div>
                        <div class="match-score">89%</div>
                    </div>
                </div>
                
                <div class="discovery-actions">
                    <button class="btn btn-outline-primary btn-sm">View More</button>
                    <button class="btn btn-outline-secondary btn-sm">Refine</button>
                </div>
            </div>
        `;
  }

  renderCreatorRecommendations() {
    return `
            <div class="creator-recommendations">
                <div class="creator-item">
                    <div class="creator-avatar">
                        <div class="avatar-placeholder">A</div>
                    </div>
                    <div class="creator-info">
                        <h6>@ArtisticAva</h6>
                        <p>Digital Artist • 12.5K followers</p>
                        <div class="match-reasons">Similar interests, Art style</div>
                    </div>
                    <div class="creator-actions">
                        <button class="btn btn-primary btn-sm">Follow</button>
                    </div>
                </div>
                
                <div class="creator-item">
                    <div class="creator-avatar">
                        <div class="avatar-placeholder">M</div>
                    </div>
                    <div class="creator-info">
                        <h6>@MusicMaven</h6>
                        <p>Music Producer • 8.2K followers</p>
                        <div class="match-reasons">Audio content, Similar audience</div>
                    </div>
                    <div class="creator-actions">
                        <button class="btn btn-primary btn-sm">Follow</button>
                    </div>
                </div>
            </div>
        `;
  }

  renderTrendingCreators() {
    return `
            <div class="trending-creators">
                <div class="trending-item">
                    <div class="trend-rank">#1</div>
                    <div class="creator-info">
                        <h6>@RisingTech</h6>
                        <p>+2.1K followers this week</p>
                    </div>
                    <div class="growth-indicator">🚀 +340%</div>
                </div>
                
                <div class="trending-item">
                    <div class="trend-rank">#2</div>
                    <div class="creator-info">
                        <h6>@NewArtist</h6>
                        <p>+1.8K followers this week</p>
                    </div>
                    <div class="growth-indicator">📈 +280%</div>
                </div>
                
                <div class="trending-item">
                    <div class="trend-rank">#3</div>
                    <div class="creator-info">
                        <h6>@FreshFace</h6>
                        <p>+1.5K followers this week</p>
                    </div>
                    <div class="growth-indicator">⭐ +220%</div>
                </div>
            </div>
        `;
  }

  renderPlatformInsights() {
    return `
            <div class="platform-data">
                <div class="platform-metrics">
                    <div class="metric-card">
                        <h6>Active Users</h6>
                        <div class="metric-value">24.5K</div>
                        <div class="metric-change positive">+12%</div>
                    </div>
                    
                    <div class="metric-card">
                        <h6>Revenue Growth</h6>
                        <div class="metric-value">+34%</div>
                        <div class="metric-change positive">This month</div>
                    </div>
                </div>
                
                <div class="ai-predictions">
                    <h6>AI Predictions</h6>
                    <div class="prediction-item">
                        <i class="fas fa-chart-line neon-green"></i>
                        <span>User growth expected to accelerate by 25% next month</span>
                    </div>
                </div>
            </div>
        `;
  }

  renderUserBehavior() {
    return `
            <div class="behavior-data">
                <div class="behavior-patterns">
                    <h6>Key Patterns Detected</h6>
                    <div class="pattern-item">
                        <i class="fas fa-clock neon-cyan"></i>
                        <span>Peak usage: 7-10 PM</span>
                    </div>
                    <div class="pattern-item">
                        <i class="fas fa-mobile neon-yellow"></i>
                        <span>78% mobile users</span>
                    </div>
                    <div class="pattern-item">
                        <i class="fas fa-heart neon-pink"></i>
                        <span>High engagement on video content</span>
                    </div>
                </div>
                
                <div class="behavior-insights">
                    <div class="insight">
                        <span class="insight-label">Retention Rate</span>
                        <span class="insight-value">87%</span>
                    </div>
                    <div class="insight">
                        <span class="insight-label">Avg Session</span>
                        <span class="insight-value">12m 34s</span>
                    </div>
                </div>
            </div>
        `;
  }

  renderErrorState(element, message) {
    const contentDiv = element.querySelector(".widget-content");
    contentDiv.innerHTML = `
            <div class="ai-error">
                <i class="fas fa-exclamation-triangle neon-orange"></i>
                <p>AI service temporarily unavailable</p>
                <button class="btn btn-sm btn-outline-primary retry-btn">Retry</button>
            </div>
        `;

    // Add retry functionality
    contentDiv.querySelector(".retry-btn").addEventListener("click", () => {
      this.loadWidget(element);
    });
  }

  bindEvents() {
    // Refresh all AI data
    document.addEventListener("click", (e) => {
      if (e.target.closest("#refresh-ai-data")) {
        this.refreshAllWidgets();
      }

      if (e.target.closest("#customize-widgets")) {
        this.openCustomizationModal();
      }
    });
  }

  async refreshAllWidgets() {
    const button = document.querySelector("#refresh-ai-data");
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
    button.disabled = true;

    try {
      await this.loadAIWidgets();
      this.showToast("AI insights refreshed successfully", "success");
    } catch (error) {
      this.showToast("Failed to refresh AI insights", "danger");
    } finally {
      button.innerHTML = originalText;
      button.disabled = false;
    }
  }

  openCustomizationModal() {
    // Implementation for widget customization
    this.showToast("Widget customization coming soon!", "info");
  }

  startRealTimeUpdates() {
    // Update widgets periodically
    setInterval(() => {
      if (document.visibilityState === "visible") {
        this.updateRealTimeMetrics();
      }
    }, 30000); // Update every 30 seconds
  }

  updateRealTimeMetrics() {
    // Update time-sensitive metrics like view counts, earnings, etc.
    const widgets = document.querySelectorAll(".ai-widget[data-widget]");
    widgets.forEach((widget) => {
      const type = widget.dataset.widget;
      if (
        [
          "earnings-optimizer",
          "performance-analytics",
          "platform-insights",
        ].includes(type)
      ) {
        this.updateWidgetMetrics(widget, type);
      }
    });
  }

  updateWidgetMetrics(widget, type) {
    // Simulate real-time metric updates
    const metricElements = widget.querySelectorAll(
      ".metric-value, .score-value, .forecast-bar span:last-child",
    );
    metricElements.forEach((element) => {
      if (
        element.textContent.includes("$") ||
        element.textContent.includes("%")
      ) {
        // Add subtle animation to indicate real-time update
        element.style.animation = "metric-update 0.5s ease";
        setTimeout(() => {
          element.style.animation = "";
        }, 500);
      }
    });
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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

// Initialize AI Dashboard on dashboard pages
document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("dashboard")) {
    // Small delay to ensure other dashboard components load first
    setTimeout(() => {
      const aiDashboard = new AIDashboard();
      window.aiDashboard = aiDashboard;
    }, 1000);
  }
});

// Expose for manual initialization
window.AIDashboard = AIDashboard;
