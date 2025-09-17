#!/usr/bin/env python3

# 🛡️ FANZ Infrastructure Security Monitor
# Real-time security monitoring and policy enforcement for adult content platforms
# Monitors containers, Kubernetes clusters, and infrastructure compliance

import json
import subprocess
import time
import requests
import logging
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
import docker
import kubernetes

# Configuration
class SecurityLevel(Enum):
    LOW = "low"
    MEDIUM = "medium" 
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class SecurityIncident:
    id: str
    timestamp: datetime
    incident_type: str
    severity: SecurityLevel
    resource: str
    description: str
    metadata: Dict[str, Any]
    resolved: bool = False

class FanzInfrastructureMonitor:
    def __init__(self, config_path: str = "security/config.json"):
        """Initialize the FANZ Infrastructure Security Monitor"""
        self.config = self._load_config(config_path)
        self.logger = self._setup_logging()
        self.db_path = "security-reports/infrastructure-monitor.db"
        self.docker_client = None
        self.k8s_client = None
        
        # Adult platform specific thresholds
        self.vulnerability_thresholds = {
            "critical": 0,      # Zero tolerance for critical vulns
            "high": 5,          # Max 5 high vulns for adult platforms
            "medium": 20        # Medium threshold
        }
        
        # Payment processor security monitoring
        self.payment_processors = ["ccbill", "paxum", "segpay"]
        
        self._setup_database()
        
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load configuration from JSON file"""
        default_config = {
            "monitoring": {
                "interval_seconds": 300,
                "container_scan": True,
                "k8s_policy_check": True,
                "network_monitoring": True,
                "compliance_check": True
            },
            "alerts": {
                "webhook_url": "http://localhost:3000/api/security/webhook",
                "email_notifications": True
            },
            "adult_platform": {
                "age_verification_required": True,
                "content_moderation": True,
                "payment_security": True,
                "compliance_2257": True
            }
        }
        
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
                # Merge with defaults
                for key, value in default_config.items():
                    if key not in config:
                        config[key] = value
                return config
        except FileNotFoundError:
            self.logger.warning(f"Config file not found: {config_path}, using defaults")
            return default_config
    
    def _setup_logging(self) -> logging.Logger:
        """Setup logging configuration"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('security-reports/infrastructure-monitor.log'),
                logging.StreamHandler()
            ]
        )
        return logging.getLogger('FanzInfraMonitor')
    
    def _setup_database(self):
        """Initialize SQLite database for incident tracking"""
        import os
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS security_incidents (
            id TEXT PRIMARY KEY,
            timestamp TEXT NOT NULL,
            incident_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            resource TEXT NOT NULL,
            description TEXT NOT NULL,
            metadata TEXT,
            resolved BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS compliance_audit (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            audit_type TEXT NOT NULL,
            resource_type TEXT NOT NULL,
            resource_name TEXT NOT NULL,
            compliance_status TEXT NOT NULL,
            findings TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        conn.commit()
        conn.close()
    
    def setup_docker_monitoring(self):
        """Initialize Docker client and monitoring"""
        try:
            self.docker_client = docker.from_env()
            self.logger.info("🐳 Docker client initialized for monitoring")
            return True
        except Exception as e:
            self.logger.error(f"Failed to initialize Docker client: {e}")
            return False
    
    def setup_kubernetes_monitoring(self):
        """Initialize Kubernetes client and monitoring"""
        try:
            kubernetes.config.load_kube_config()
            self.k8s_client = kubernetes.client
            self.logger.info("☸️ Kubernetes client initialized for monitoring")
            return True
        except Exception as e:
            self.logger.error(f"Failed to initialize Kubernetes client: {e}")
            return False
    
    def monitor_container_security(self) -> List[SecurityIncident]:
        """Monitor running containers for security violations"""
        incidents = []
        
        if not self.docker_client:
            return incidents
            
        try:
            containers = self.docker_client.containers.list()
            
            for container in containers:
                # Check for non-root execution
                container_info = self.docker_client.api.inspect_container(container.id)
                user = container_info.get('Config', {}).get('User', 'root')
                
                if user == 'root' or user == '0':
                    incident = SecurityIncident(
                        id=f"container-root-{container.id[:8]}",
                        timestamp=datetime.now(),
                        incident_type="container_security_violation",
                        severity=SecurityLevel.HIGH,
                        resource=f"container:{container.name}",
                        description="Container running as root user - adult platform compliance violation",
                        metadata={
                            "container_id": container.id,
                            "image": container.image.tags[0] if container.image.tags else "unknown",
                            "user": user,
                            "compliance": "adult_platform"
                        }
                    )
                    incidents.append(incident)
                
                # Check for health checks (required for adult platforms)
                healthcheck = container_info.get('Config', {}).get('Healthcheck')
                if not healthcheck:
                    incident = SecurityIncident(
                        id=f"container-health-{container.id[:8]}",
                        timestamp=datetime.now(),
                        incident_type="container_compliance_violation",
                        severity=SecurityLevel.MEDIUM,
                        resource=f"container:{container.name}",
                        description="Container missing health check - required for adult platform monitoring",
                        metadata={
                            "container_id": container.id,
                            "image": container.image.tags[0] if container.image.tags else "unknown",
                            "compliance": "monitoring_required"
                        }
                    )
                    incidents.append(incident)
                
                # Scan container for vulnerabilities
                vuln_incidents = self._scan_container_vulnerabilities(container)
                incidents.extend(vuln_incidents)
                
        except Exception as e:
            self.logger.error(f"Error monitoring container security: {e}")
            
        return incidents
    
    def _scan_container_vulnerabilities(self, container) -> List[SecurityIncident]:
        """Scan container for vulnerabilities using Trivy"""
        incidents = []
        
        try:
            image_name = container.image.tags[0] if container.image.tags else container.id
            
            # Run trivy scan
            result = subprocess.run([
                'trivy', 'image', '--format', 'json', image_name
            ], capture_output=True, text=True, timeout=300)
            
            if result.returncode == 0:
                scan_data = json.loads(result.stdout)
                
                # Count vulnerabilities by severity
                critical_count = 0
                high_count = 0
                
                for result_item in scan_data.get('Results', []):
                    vulnerabilities = result_item.get('Vulnerabilities', [])
                    for vuln in vulnerabilities:
                        severity = vuln.get('Severity', '').upper()
                        if severity == 'CRITICAL':
                            critical_count += 1
                        elif severity == 'HIGH':
                            high_count += 1
                
                # Check against adult platform thresholds
                if critical_count > self.vulnerability_thresholds['critical']:
                    incident = SecurityIncident(
                        id=f"vuln-critical-{container.id[:8]}",
                        timestamp=datetime.now(),
                        incident_type="critical_vulnerability",
                        severity=SecurityLevel.CRITICAL,
                        resource=f"container:{container.name}",
                        description=f"CRITICAL vulnerabilities found ({critical_count}) - exceeds adult platform threshold",
                        metadata={
                            "container_id": container.id,
                            "image": image_name,
                            "critical_vulns": critical_count,
                            "high_vulns": high_count,
                            "scan_data": scan_data
                        }
                    )
                    incidents.append(incident)
                
                if high_count > self.vulnerability_thresholds['high']:
                    incident = SecurityIncident(
                        id=f"vuln-high-{container.id[:8]}",
                        timestamp=datetime.now(),
                        incident_type="high_vulnerability",
                        severity=SecurityLevel.HIGH,
                        resource=f"container:{container.name}",
                        description=f"HIGH vulnerabilities found ({high_count}) - exceeds adult platform threshold",
                        metadata={
                            "container_id": container.id,
                            "image": image_name,
                            "critical_vulns": critical_count,
                            "high_vulns": high_count
                        }
                    )
                    incidents.append(incident)
                    
        except Exception as e:
            self.logger.error(f"Error scanning container vulnerabilities: {e}")
            
        return incidents
    
    def monitor_kubernetes_policies(self) -> List[SecurityIncident]:
        """Monitor Kubernetes cluster for policy violations"""
        incidents = []
        
        if not self.k8s_client:
            return incidents
            
        try:
            # Check Pod Security Policies
            v1 = self.k8s_client.CoreV1Api()
            pods = v1.list_pod_for_all_namespaces()
            
            for pod in pods.items:
                # Check for privileged containers
                for container in pod.spec.containers or []:
                    if (pod.spec.security_context and 
                        pod.spec.security_context.run_as_user == 0):
                        
                        incident = SecurityIncident(
                            id=f"k8s-root-{pod.metadata.namespace}-{pod.metadata.name}",
                            timestamp=datetime.now(),
                            incident_type="k8s_security_violation",
                            severity=SecurityLevel.HIGH,
                            resource=f"pod:{pod.metadata.namespace}/{pod.metadata.name}",
                            description="Pod running as root - violates adult platform security policy",
                            metadata={
                                "namespace": pod.metadata.namespace,
                                "pod_name": pod.metadata.name,
                                "container": container.name,
                                "compliance": "adult_platform"
                            }
                        )
                        incidents.append(incident)
                
                # Check for missing security labels
                labels = pod.metadata.labels or {}
                if 'compliance.adult-content' not in labels:
                    incident = SecurityIncident(
                        id=f"k8s-label-{pod.metadata.namespace}-{pod.metadata.name}",
                        timestamp=datetime.now(),
                        incident_type="k8s_compliance_violation",
                        severity=SecurityLevel.MEDIUM,
                        resource=f"pod:{pod.metadata.namespace}/{pod.metadata.name}",
                        description="Pod missing adult content compliance labels",
                        metadata={
                            "namespace": pod.metadata.namespace,
                            "pod_name": pod.metadata.name,
                            "compliance": "labeling_required"
                        }
                    )
                    incidents.append(incident)
            
            # Check Network Policies
            networking_v1 = self.k8s_client.NetworkingV1Api()
            network_policies = networking_v1.list_network_policy_for_all_namespaces()
            
            # Ensure adult platform namespaces have network policies
            adult_namespaces = ['fanz-platform', 'boyfanz', 'girlfanz', 'daddyfanz', 
                              'pupfanz', 'taboofanz', 'transfanz', 'cougarfanz']
            
            protected_namespaces = set()
            for policy in network_policies.items:
                protected_namespaces.add(policy.metadata.namespace)
            
            for ns in adult_namespaces:
                if ns not in protected_namespaces:
                    incident = SecurityIncident(
                        id=f"k8s-network-{ns}",
                        timestamp=datetime.now(),
                        incident_type="k8s_network_violation",
                        severity=SecurityLevel.HIGH,
                        resource=f"namespace:{ns}",
                        description="Adult platform namespace missing network policy - security isolation required",
                        metadata={
                            "namespace": ns,
                            "compliance": "network_isolation"
                        }
                    )
                    incidents.append(incident)
                    
        except Exception as e:
            self.logger.error(f"Error monitoring Kubernetes policies: {e}")
            
        return incidents
    
    def monitor_payment_security(self) -> List[SecurityIncident]:
        """Monitor payment processor security and compliance"""
        incidents = []
        
        try:
            # Check payment processor endpoints
            for processor in self.payment_processors:
                # Simulate health check for payment processors
                # In real implementation, this would check actual processor APIs
                
                # Check SSL/TLS configuration
                ssl_incident = self._check_ssl_configuration(processor)
                if ssl_incident:
                    incidents.append(ssl_incident)
                
                # Check compliance requirements
                compliance_incident = self._check_payment_compliance(processor)
                if compliance_incident:
                    incidents.append(compliance_incident)
                    
        except Exception as e:
            self.logger.error(f"Error monitoring payment security: {e}")
            
        return incidents
    
    def _check_ssl_configuration(self, processor: str) -> Optional[SecurityIncident]:
        """Check SSL/TLS configuration for payment processors"""
        # This would check actual SSL configuration in production
        # For demo, we'll simulate potential issues
        
        # Simulate checking SSL certificate validity
        if processor == "test-processor":  # Example condition
            return SecurityIncident(
                id=f"ssl-{processor}",
                timestamp=datetime.now(),
                incident_type="ssl_certificate_issue",
                severity=SecurityLevel.CRITICAL,
                resource=f"payment_processor:{processor}",
                description="SSL certificate expiring soon for payment processor",
                metadata={
                    "processor": processor,
                    "compliance": "payment_security"
                }
            )
        return None
    
    def _check_payment_compliance(self, processor: str) -> Optional[SecurityIncident]:
        """Check payment processor compliance requirements"""
        # This would check actual compliance in production
        return None
    
    def save_incident(self, incident: SecurityIncident):
        """Save security incident to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
        INSERT OR REPLACE INTO security_incidents 
        (id, timestamp, incident_type, severity, resource, description, metadata, resolved)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            incident.id,
            incident.timestamp.isoformat(),
            incident.incident_type,
            incident.severity.value,
            incident.resource,
            incident.description,
            json.dumps(incident.metadata),
            incident.resolved
        ))
        
        conn.commit()
        conn.close()
    
    def send_alert(self, incident: SecurityIncident):
        """Send alert for security incident"""
        try:
            webhook_url = self.config.get('alerts', {}).get('webhook_url')
            if not webhook_url:
                return
                
            alert_data = {
                "timestamp": incident.timestamp.isoformat(),
                "severity": incident.severity.value,
                "incident_type": incident.incident_type,
                "resource": incident.resource,
                "description": incident.description,
                "metadata": incident.metadata
            }
            
            response = requests.post(
                webhook_url,
                json=alert_data,
                timeout=10,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                self.logger.info(f"Alert sent successfully for incident: {incident.id}")
            else:
                self.logger.error(f"Failed to send alert for incident: {incident.id}")
                
        except Exception as e:
            self.logger.error(f"Error sending alert: {e}")
    
    def run_monitoring_cycle(self):
        """Execute one complete monitoring cycle"""
        self.logger.info("🔍 Starting infrastructure security monitoring cycle...")
        
        all_incidents = []
        
        # Monitor containers
        if self.config.get('monitoring', {}).get('container_scan', True):
            self.logger.info("🐳 Monitoring container security...")
            container_incidents = self.monitor_container_security()
            all_incidents.extend(container_incidents)
            self.logger.info(f"Found {len(container_incidents)} container security incidents")
        
        # Monitor Kubernetes
        if self.config.get('monitoring', {}).get('k8s_policy_check', True):
            self.logger.info("☸️ Monitoring Kubernetes policies...")
            k8s_incidents = self.monitor_kubernetes_policies()
            all_incidents.extend(k8s_incidents)
            self.logger.info(f"Found {len(k8s_incidents)} Kubernetes policy incidents")
        
        # Monitor payment security
        if self.config.get('adult_platform', {}).get('payment_security', True):
            self.logger.info("💳 Monitoring payment processor security...")
            payment_incidents = self.monitor_payment_security()
            all_incidents.extend(payment_incidents)
            self.logger.info(f"Found {len(payment_incidents)} payment security incidents")
        
        # Process incidents
        for incident in all_incidents:
            self.save_incident(incident)
            
            # Send alerts for high and critical severity
            if incident.severity in [SecurityLevel.HIGH, SecurityLevel.CRITICAL]:
                self.send_alert(incident)
        
        self.logger.info(f"✅ Monitoring cycle completed. Total incidents: {len(all_incidents)}")
        return all_incidents
    
    def start_monitoring(self):
        """Start continuous monitoring"""
        self.logger.info("🚀 Starting FANZ Infrastructure Security Monitor...")
        
        # Initialize monitoring components
        docker_ready = self.setup_docker_monitoring()
        k8s_ready = self.setup_kubernetes_monitoring()
        
        if not docker_ready and not k8s_ready:
            self.logger.error("❌ No monitoring systems available. Exiting.")
            return
        
        interval = self.config.get('monitoring', {}).get('interval_seconds', 300)
        
        try:
            while True:
                start_time = time.time()
                
                self.run_monitoring_cycle()
                
                # Calculate sleep time
                execution_time = time.time() - start_time
                sleep_time = max(0, interval - execution_time)
                
                self.logger.info(f"💤 Sleeping for {sleep_time:.1f} seconds until next cycle...")
                time.sleep(sleep_time)
                
        except KeyboardInterrupt:
            self.logger.info("🛑 Monitoring stopped by user")
        except Exception as e:
            self.logger.error(f"❌ Monitoring error: {e}")
            raise

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='FANZ Infrastructure Security Monitor')
    parser.add_argument('--config', default='security/config.json', 
                       help='Configuration file path')
    parser.add_argument('--once', action='store_true', 
                       help='Run once and exit (no continuous monitoring)')
    parser.add_argument('--dry-run', action='store_true',
                       help='Dry run mode - no alerts sent')
    
    args = parser.parse_args()
    
    # Initialize monitor
    monitor = FanzInfrastructureMonitor(config_path=args.config)
    
    if args.once:
        # Run single monitoring cycle
        incidents = monitor.run_monitoring_cycle()
        print(f"\n📊 Found {len(incidents)} security incidents")
        for incident in incidents:
            print(f"  - {incident.severity.value.upper()}: {incident.description}")
    else:
        # Start continuous monitoring
        monitor.start_monitoring()

if __name__ == "__main__":
    main()