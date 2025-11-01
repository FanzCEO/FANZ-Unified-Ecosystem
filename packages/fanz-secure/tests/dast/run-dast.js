#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class DASTRunner {
  constructor() {
    this.config = this.loadConfig();
    this.zapProcess = null;
    this.scanResults = {
      startTime: null,
      endTime: null,
      findings: [],
      summary: {
        high: 0,
        medium: 0,
        low: 0,
        informational: 0
      }
    };
  }

  loadConfig() {
    const configPath = path.join(__dirname, 'zap-config.yaml');
    if (!fs.existsSync(configPath)) {
      throw new Error('DAST configuration file not found');
    }
    
    return {
      zapConfig: configPath,
      apiKey: process.env.ZAP_API_KEY || 'test-api-key',
      zapHost: process.env.ZAP_HOST || 'localhost',
      zapPort: process.env.ZAP_PORT || 8080,
      targetUrl: process.env.TARGET_URL || 'https://staging-api.fanz.com',
      fanzDashUrl: process.env.FANZDASH_URL || 'https://staging-dash.fanz.com',
      fanzDashApiKey: process.env.FANZDASH_API_KEY,
      reportsDir: path.join(__dirname, 'reports'),
      maxScanDuration: parseInt(process.env.MAX_SCAN_DURATION) || 1800 // 30 minutes
    };
  }

  async run() {
    console.log('🔐 Starting FANZ DAST Security Scan...');
    
    try {
      await this.setupReportsDirectory();
      await this.startZAP();
      await this.waitForZAP();
      await this.configureScan();
      await this.runSpider();
      await this.runActiveScan();
      await this.generateReports();
      await this.sendToFanzDash();
      
      console.log('✅ DAST scan completed successfully');
      return this.scanResults;
      
    } catch (error) {
      console.error('❌ DAST scan failed:', error.message);
      await this.sendErrorToFanzDash(error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async setupReportsDirectory() {
    if (!fs.existsSync(this.config.reportsDir)) {
      fs.mkdirSync(this.config.reportsDir, { recursive: true });
    }
  }

  async startZAP() {
    console.log('🚀 Starting OWASP ZAP...');
    
    return new Promise((resolve, reject) => {
      const zapCommand = process.platform === 'win32' ? 'zap.bat' : 'zap.sh';
      const args = [
        '-daemon',
        '-host', this.config.zapHost,
        '-port', this.config.zapPort.toString(),
        '-config', `api.key=${this.config.apiKey}`,
        '-config', 'api.addrs.addr.name=.*',
        '-config', 'api.addrs.addr.regex=true'
      ];

      this.zapProcess = spawn(zapCommand, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
      });

      this.zapProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('ZAP is now listening')) {
          console.log('✅ ZAP started successfully');
          resolve();
        }
      });

      this.zapProcess.stderr.on('data', (data) => {
        console.error('ZAP Error:', data.toString());
      });

      this.zapProcess.on('error', (error) => {
        reject(new Error(`Failed to start ZAP: ${error.message}`));
      });

      // Timeout after 60 seconds
      setTimeout(() => {
        reject(new Error('Timeout waiting for ZAP to start'));
      }, 60000);
    });
  }

  async waitForZAP() {
    console.log('⏳ Waiting for ZAP to be ready...');
    
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(
          `http://${this.config.zapHost}:${this.config.zapPort}/JSON/core/view/version/`,
          {
            params: { apikey: this.config.apiKey },
            timeout: 5000
          }
        );

        if (response.status === 200) {
          console.log('✅ ZAP is ready');
          return;
        }
      } catch (error) {
        // ZAP not ready yet, wait and retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }
    }

    throw new Error('ZAP failed to become ready within timeout period');
  }

  async configureScan() {
    console.log('⚙️ Configuring scan context and authentication...');
    
    try {
      // Create context
      await this.zapRequest('/JSON/context/action/newContext/', {
        contextName: 'FANZ API Context'
      });

      // Include URLs in context
      await this.zapRequest('/JSON/context/action/includeInContext/', {
        contextName: 'FANZ API Context',
        regex: `${this.config.targetUrl}.*`
      });

      // Set up authentication if credentials provided
      if (process.env.TEST_USERNAME && process.env.TEST_PASSWORD) {
        await this.setupAuthentication();
      }

      console.log('✅ Scan configuration completed');
      
    } catch (error) {
      throw new Error(`Failed to configure scan: ${error.message}`);
    }
  }

  async setupAuthentication() {
    try {
      // Configure form-based authentication
      await this.zapRequest('/JSON/authentication/action/setAuthenticationMethod/', {
        contextId: '0',
        authMethodName: 'formBasedAuthentication',
        authMethodConfigParams: `loginUrl=${this.config.targetUrl}/api/auth/login&loginRequestData=email%3D%7B%25username%25%7D%26password%3D%7B%25password%25%7D`
      });

      // Set login indicator
      await this.zapRequest('/JSON/authentication/action/setLoggedInIndicator/', {
        contextId: '0',
        loggedInIndicatorRegex: '\\Qauthenticated\\E.*\\Qtrue\\E'
      });

      // Add user
      await this.zapRequest('/JSON/users/action/newUser/', {
        contextId: '0',
        name: 'testuser'
      });

      // Set user credentials
      await this.zapRequest('/JSON/users/action/setAuthenticationCredentials/', {
        contextId: '0',
        userId: '0',
        authCredentialsConfigParams: `username=${process.env.TEST_USERNAME}&password=${process.env.TEST_PASSWORD}`
      });

      // Enable user
      await this.zapRequest('/JSON/users/action/setUserEnabled/', {
        contextId: '0',
        userId: '0',
        enabled: 'true'
      });

      console.log('✅ Authentication configured');
    } catch (error) {
      console.warn('⚠️ Failed to setup authentication:', error.message);
    }
  }

  async runSpider() {
    console.log('🕷️ Starting spider scan...');
    this.scanResults.startTime = new Date().toISOString();
    
    try {
      const response = await this.zapRequest('/JSON/spider/action/scan/', {
        url: this.config.targetUrl,
        maxChildren: '10',
        recurse: 'true',
        contextName: 'FANZ API Context',
        subtreeOnly: 'false'
      });

      const scanId = response.scan;
      console.log(`📊 Spider scan started with ID: ${scanId}`);

      // Wait for spider to complete
      await this.waitForScanCompletion('spider', scanId, '/JSON/spider/view/status/');
      
      console.log('✅ Spider scan completed');
      
    } catch (error) {
      throw new Error(`Spider scan failed: ${error.message}`);
    }
  }

  async runActiveScan() {
    console.log('🎯 Starting active security scan...');
    
    try {
      const response = await this.zapRequest('/JSON/ascan/action/scan/', {
        url: this.config.targetUrl,
        recurse: 'true',
        inScopeOnly: 'false',
        scanPolicyName: 'Default Policy',
        method: 'POST',
        postData: ''
      });

      const scanId = response.scan;
      console.log(`📊 Active scan started with ID: ${scanId}`);

      // Wait for active scan to complete
      await this.waitForScanCompletion('ascan', scanId, '/JSON/ascan/view/status/');
      
      console.log('✅ Active scan completed');
      
    } catch (error) {
      throw new Error(`Active scan failed: ${error.message}`);
    }
  }

  async waitForScanCompletion(scanType, scanId, statusEndpoint) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < this.config.maxScanDuration * 1000) {
      try {
        const response = await this.zapRequest(statusEndpoint, { scanId });
        const progress = parseInt(response.status);
        
        console.log(`📈 ${scanType} progress: ${progress}%`);
        
        if (progress >= 100) {
          return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        
      } catch (error) {
        console.warn(`⚠️ Error checking ${scanType} status:`, error.message);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    throw new Error(`${scanType} scan timed out after ${this.config.maxScanDuration} seconds`);
  }

  async generateReports() {
    console.log('📄 Generating security reports...');
    this.scanResults.endTime = new Date().toISOString();
    
    try {
      // Get alerts
      const alertsResponse = await this.zapRequest('/JSON/core/view/alerts/');
      this.scanResults.findings = alertsResponse.alerts || [];
      
      // Calculate summary
      this.scanResults.findings.forEach(alert => {
        const risk = alert.risk.toLowerCase();
        if (this.scanResults.summary.hasOwnProperty(risk)) {
          this.scanResults.summary[risk]++;
        }
      });

      // Generate HTML report
      const htmlReport = await this.zapRequest('/OTHER/core/other/htmlreport/');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      fs.writeFileSync(
        path.join(this.config.reportsDir, `fanz-security-scan-${timestamp}.html`),
        htmlReport
      );

      // Generate JSON report
      const jsonReport = await this.zapRequest('/JSON/core/view/alerts/');
      fs.writeFileSync(
        path.join(this.config.reportsDir, `fanz-security-scan-${timestamp}.json`),
        JSON.stringify(jsonReport, null, 2)
      );

      // Generate SARIF report for GitHub integration
      const sarifReport = this.generateSARIF(this.scanResults.findings);
      fs.writeFileSync(
        path.join(this.config.reportsDir, `fanz-security-scan-${timestamp}.sarif`),
        JSON.stringify(sarifReport, null, 2)
      );

      console.log('✅ Reports generated successfully');
      console.log(`📊 Security Summary:
        🔴 High: ${this.scanResults.summary.high}
        🟡 Medium: ${this.scanResults.summary.medium}
        🔵 Low: ${this.scanResults.summary.low}
        ℹ️ Info: ${this.scanResults.summary.informational}`);
        
    } catch (error) {
      throw new Error(`Failed to generate reports: ${error.message}`);
    }
  }

  generateSARIF(findings) {
    return {
      $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
      version: "2.1.0",
      runs: [{
        tool: {
          driver: {
            name: "OWASP ZAP",
            version: "2.12.0",
            informationUri: "https://www.zaproxy.org/"
          }
        },
        results: findings.map(alert => ({
          ruleId: alert.pluginId,
          ruleIndex: 0,
          message: {
            text: alert.alert
          },
          level: this.mapRiskToSarifLevel(alert.risk),
          locations: [{
            physicalLocation: {
              artifactLocation: {
                uri: alert.url
              }
            }
          }],
          properties: {
            confidence: alert.confidence,
            description: alert.description,
            solution: alert.solution,
            reference: alert.reference
          }
        }))
      }]
    };
  }

  mapRiskToSarifLevel(risk) {
    const mapping = {
      'High': 'error',
      'Medium': 'warning',
      'Low': 'note',
      'Informational': 'note'
    };
    return mapping[risk] || 'note';
  }

  async sendToFanzDash() {
    if (!this.config.fanzDashApiKey) {
      console.log('⚠️ FanzDash API key not configured, skipping integration');
      return;
    }

    console.log('📤 Sending results to FanzDash...');
    
    try {
      const payload = {
        scanType: 'DAST',
        timestamp: new Date().toISOString(),
        target: this.config.targetUrl,
        summary: this.scanResults.summary,
        findings: this.scanResults.findings.map(alert => ({
          id: alert.pluginId,
          title: alert.alert,
          severity: alert.risk,
          confidence: alert.confidence,
          description: alert.description,
          solution: alert.solution,
          url: alert.url,
          method: alert.method,
          param: alert.param,
          evidence: alert.evidence
        })),
        duration: this.scanResults.endTime && this.scanResults.startTime 
          ? new Date(this.scanResults.endTime) - new Date(this.scanResults.startTime)
          : null
      };

      await axios.post(
        `${this.config.fanzDashUrl}/api/security/dast-results`,
        payload,
        {
          headers: {
            'X-API-Key': this.config.fanzDashApiKey,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log('✅ Results sent to FanzDash successfully');
      
    } catch (error) {
      console.error('❌ Failed to send results to FanzDash:', error.message);
      // Don't throw error here as this is not critical for the scan itself
    }
  }

  async sendErrorToFanzDash(error) {
    if (!this.config.fanzDashApiKey) {
      return;
    }

    try {
      const payload = {
        scanType: 'DAST',
        timestamp: new Date().toISOString(),
        target: this.config.targetUrl,
        status: 'FAILED',
        error: error.message,
        summary: { high: 0, medium: 0, low: 0, informational: 0 }
      };

      await axios.post(
        `${this.config.fanzDashUrl}/api/security/dast-results`,
        payload,
        {
          headers: {
            'X-API-Key': this.config.fanzDashApiKey,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
    } catch (sendError) {
      console.error('Failed to send error to FanzDash:', sendError.message);
    }
  }

  async zapRequest(endpoint, params = {}) {
    const url = `http://${this.config.zapHost}:${this.config.zapPort}${endpoint}`;
    const requestParams = { apikey: this.config.apiKey, ...params };
    
    const response = await axios.get(url, { 
      params: requestParams,
      timeout: 30000
    });
    
    return response.data;
  }

  async cleanup() {
    console.log('🧹 Cleaning up...');
    
    if (this.zapProcess && !this.zapProcess.killed) {
      console.log('🛑 Stopping ZAP process...');
      
      try {
        // Graceful shutdown
        await this.zapRequest('/JSON/core/action/shutdown/');
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.warn('⚠️ Graceful ZAP shutdown failed, forcing termination');
      }
      
      this.zapProcess.kill('SIGTERM');
      
      // Force kill if still running after 10 seconds
      setTimeout(() => {
        if (!this.zapProcess.killed) {
          this.zapProcess.kill('SIGKILL');
        }
      }, 10000);
    }
  }
}

// CLI interface
if (require.main === module) {
  const dastRunner = new DASTRunner();
  
  dastRunner.run()
    .then(results => {
      console.log('\n🎉 DAST scan completed successfully!');
      
      // Exit with error code if high-risk vulnerabilities found
      if (results.summary.high > 0) {
        console.error(`❌ Found ${results.summary.high} high-risk vulnerabilities`);
        process.exit(1);
      }
      
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 DAST scan failed:', error.message);
      process.exit(1);
    });
}

module.exports = DASTRunner;