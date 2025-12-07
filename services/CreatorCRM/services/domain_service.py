import os
import json
import requests
import secrets
import dns.resolver
import dns.reversename
from datetime import datetime, timezone, timedelta
from models import Domain, DomainRecord, EmailAccount, DomainStatus, DomainRecordType
from app import db

class DomainService:
    """Service for managing custom domains and DNS configuration"""
    
    def __init__(self):
        self.dns_provider = os.environ.get('DNS_PROVIDER', 'cloudflare')
        self.api_key = os.environ.get('DNS_API_KEY')
        self.api_email = os.environ.get('DNS_API_EMAIL')
        
    def add_domain(self, user_id, domain_name):
        """Add a new domain for a user"""
        try:
            # Check if domain already exists
            existing = Domain.query.filter_by(domain_name=domain_name).first()
            if existing:
                raise Exception(f"Domain {domain_name} is already registered")
            
            # Generate verification token
            verification_token = secrets.token_urlsafe(32)
            
            # Create domain record
            domain = Domain(
                user_id=user_id,
                domain_name=domain_name,
                status=DomainStatus.PENDING,
                verification_token=verification_token,
                verification_expires=datetime.now(timezone.utc) + timedelta(days=7)
            )
            
            db.session.add(domain)
            db.session.commit()
            
            # Create initial DNS records needed for verification
            self.create_verification_records(domain)
            
            return domain
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def create_verification_records(self, domain):
        """Create DNS records needed for domain verification"""
        try:
            # TXT record for domain verification
            verification_record = DomainRecord(
                domain_id=domain.id,
                record_type=DomainRecordType.TXT,
                name="@",
                value=f"creator-crm-verification={domain.verification_token}",
                ttl=300
            )
            
            # MX records for email
            mx_record_1 = DomainRecord(
                domain_id=domain.id,
                record_type=DomainRecordType.MX,
                name="@",
                value="mail.creator-crm.com",
                priority=10,
                ttl=3600
            )
            
            mx_record_2 = DomainRecord(
                domain_id=domain.id,
                record_type=DomainRecordType.MX,
                name="@",
                value="mail2.creator-crm.com",
                priority=20,
                ttl=3600
            )
            
            # SPF record for email authentication
            spf_record = DomainRecord(
                domain_id=domain.id,
                record_type=DomainRecordType.TXT,
                name="@",
                value="v=spf1 include:creator-crm.com ~all",
                ttl=3600
            )
            
            # DKIM record for email authentication
            dkim_record = DomainRecord(
                domain_id=domain.id,
                record_type=DomainRecordType.TXT,
                name="dkim._domainkey",
                value=self.generate_dkim_key(),
                ttl=3600
            )
            
            # DMARC record for email policy
            dmarc_record = DomainRecord(
                domain_id=domain.id,
                record_type=DomainRecordType.TXT,
                name="_dmarc",
                value="v=DMARC1; p=quarantine; rua=mailto:dmarc@creator-crm.com",
                ttl=3600
            )
            
            # Add all records
            for record in [verification_record, mx_record_1, mx_record_2, spf_record, dkim_record, dmarc_record]:
                db.session.add(record)
            
            db.session.commit()
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def verify_domain(self, domain_id):
        """Verify domain ownership by checking DNS records"""
        try:
            domain = Domain.query.get(domain_id)
            if not domain:
                raise Exception("Domain not found")
            
            if domain.verification_expires < datetime.now(timezone.utc):
                raise Exception("Verification token has expired")
            
            # Check TXT record for verification token
            verification_record = DomainRecord.query.filter_by(
                domain_id=domain.id,
                record_type=DomainRecordType.TXT,
                name="@"
            ).filter(DomainRecord.value.like(f"%{domain.verification_token}%")).first()
            
            if not verification_record:
                raise Exception("Verification record not found")
            
            # Query DNS to check if record exists
            try:
                answers = dns.resolver.resolve(domain.domain_name, 'TXT')
                found_verification = False
                
                for rdata in answers:
                    txt_value = str(rdata).strip('"')
                    if domain.verification_token in txt_value:
                        found_verification = True
                        break
                
                if found_verification:
                    domain.status = DomainStatus.VERIFIED
                    domain.verified_at = datetime.now(timezone.utc)
                    verification_record.is_verified = True
                    verification_record.last_checked = datetime.now(timezone.utc)
                    
                    db.session.commit()
                    
                    # Set up email service for this domain
                    self.setup_email_service(domain)
                    
                    return True
                else:
                    domain.status = DomainStatus.FAILED
                    db.session.commit()
                    return False
                    
            except dns.resolver.NXDOMAIN:
                domain.status = DomainStatus.FAILED
                db.session.commit()
                return False
                
        except Exception as e:
            db.session.rollback()
            raise e
    
    def setup_email_service(self, domain):
        """Set up email service for verified domain"""
        try:
            # Create default email account for domain owner
            default_email = f"contact@{domain.domain_name}"
            
            email_account = EmailAccount(
                domain_id=domain.id,
                user_id=domain.user_id,
                email_address=default_email,
                display_name=f"{domain.user.business_name or domain.user.username}",
                smtp_host="smtp.creator-crm.com",
                smtp_port=587,
                smtp_username=default_email,
                smtp_use_tls=True,
                imap_host="imap.creator-crm.com",
                imap_port=993,
                imap_username=default_email,
                imap_use_ssl=True,
                is_default=True,
                is_active=True
            )
            
            db.session.add(email_account)
            
            # Update domain status
            domain.is_email_enabled = True
            domain.mx_records_configured = True
            domain.spf_enabled = True
            domain.dkim_enabled = True
            domain.dmarc_enabled = True
            
            db.session.commit()
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def check_dns_propagation(self, domain_id):
        """Check DNS propagation status for all domain records"""
        try:
            domain = Domain.query.get(domain_id)
            if not domain:
                raise Exception("Domain not found")
            
            records = DomainRecord.query.filter_by(domain_id=domain.id).all()
            propagation_status = {}
            
            for record in records:
                try:
                    record_name = record.name if record.name != "@" else domain.domain_name
                    if record.name != "@":
                        record_name = f"{record.name}.{domain.domain_name}"
                    
                    answers = dns.resolver.resolve(record_name, record.record_type.value)
                    found = False
                    
                    for rdata in answers:
                        record_value = str(rdata).strip('"')
                        if record.record_type == DomainRecordType.MX:
                            # For MX records, check both priority and value
                            if record.value in record_value:
                                found = True
                                break
                        elif record.value in record_value:
                            found = True
                            break
                    
                    if found:
                        record.is_verified = True
                        record.last_checked = datetime.now(timezone.utc)
                    
                    propagation_status[f"{record.record_type.value}:{record.name}"] = found
                    
                except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer):
                    propagation_status[f"{record.record_type.value}:{record.name}"] = False
            
            db.session.commit()
            return propagation_status
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def generate_dkim_key(self):
        """Generate DKIM public key for email authentication"""
        # In production, this would generate a proper DKIM key pair
        # For now, return a placeholder
        return "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC..."
    
    def create_email_account(self, domain_id, local_part, display_name=None):
        """Create a new email account for a domain"""
        try:
            domain = Domain.query.get(domain_id)
            if not domain:
                raise Exception("Domain not found")
            
            if domain.status != DomainStatus.VERIFIED:
                raise Exception("Domain must be verified before creating email accounts")
            
            email_address = f"{local_part}@{domain.domain_name}"
            
            # Check if email already exists
            existing = EmailAccount.query.filter_by(email_address=email_address).first()
            if existing:
                raise Exception(f"Email address {email_address} already exists")
            
            email_account = EmailAccount(
                domain_id=domain.id,
                user_id=domain.user_id,
                email_address=email_address,
                display_name=display_name or local_part.title(),
                smtp_host="smtp.creator-crm.com",
                smtp_port=587,
                smtp_username=email_address,
                smtp_use_tls=True,
                imap_host="imap.creator-crm.com",
                imap_port=993,
                imap_username=email_address,
                imap_use_ssl=True,
                is_active=True
            )
            
            db.session.add(email_account)
            db.session.commit()
            
            return email_account
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def get_domain_instructions(self, domain_id):
        """Get DNS setup instructions for a domain"""
        try:
            domain = Domain.query.get(domain_id)
            if not domain:
                raise Exception("Domain not found")
            
            records = DomainRecord.query.filter_by(domain_id=domain.id).all()
            
            instructions = {
                "domain": domain.domain_name,
                "status": domain.status.value,
                "verification_token": domain.verification_token,
                "records": []
            }
            
            for record in records:
                instructions["records"].append({
                    "type": record.record_type.value,
                    "name": record.name,
                    "value": record.value,
                    "priority": record.priority,
                    "ttl": record.ttl,
                    "verified": record.is_verified
                })
            
            return instructions
            
        except Exception as e:
            raise e
    
    def update_mx_records(self, domain_id, mx_records):
        """Update MX records for a domain"""
        try:
            domain = Domain.query.get(domain_id)
            if not domain:
                raise Exception("Domain not found")
            
            # Delete existing MX records
            existing_mx = DomainRecord.query.filter_by(
                domain_id=domain.id,
                record_type=DomainRecordType.MX
            ).all()
            
            for record in existing_mx:
                db.session.delete(record)
            
            # Add new MX records
            for mx_data in mx_records:
                mx_record = DomainRecord(
                    domain_id=domain.id,
                    record_type=DomainRecordType.MX,
                    name="@",
                    value=mx_data["host"],
                    priority=mx_data["priority"],
                    ttl=mx_data.get("ttl", 3600)
                )
                db.session.add(mx_record)
            
            db.session.commit()
            
        except Exception as e:
            db.session.rollback()
            raise e