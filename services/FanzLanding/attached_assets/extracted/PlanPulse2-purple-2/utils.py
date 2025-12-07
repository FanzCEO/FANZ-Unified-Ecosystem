import os
import hashlib
import secrets
import string
import json
from datetime import datetime
from werkzeug.utils import secure_filename
from cryptography.fernet import Fernet
from flask import request, url_for
from urllib.parse import urlparse
import requests
from config import Config

def generate_secure_filename(original_filename):
    """Generate a secure filename with timestamp and random suffix"""
    name, ext = os.path.splitext(secure_filename(original_filename))
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    random_suffix = ''.join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(8))
    return f"{timestamp}_{random_suffix}{ext}"

def calculate_file_hash(file_path):
    """Calculate SHA-256 hash of a file"""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def get_client_info():
    """Extract client information for forensic purposes"""
    return {
        'ip_address': request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr),
        'user_agent': request.headers.get('User-Agent', ''),
        'timestamp': datetime.utcnow().isoformat(),
        'geolocation': request.headers.get('CF-IPCountry', 'Unknown'),  # Cloudflare country header
        'device_fingerprint': generate_device_fingerprint()
    }

def generate_device_fingerprint():
    """Generate a device fingerprint based on request headers"""
    fingerprint_data = {
        'user_agent': request.headers.get('User-Agent', ''),
        'accept_language': request.headers.get('Accept-Language', ''),
        'accept_encoding': request.headers.get('Accept-Encoding', ''),
        'dnt': request.headers.get('DNT', ''),
    }
    fingerprint_string = json.dumps(fingerprint_data, sort_keys=True)
    return hashlib.sha256(fingerprint_string.encode()).hexdigest()[:32]

def create_audit_event_hash(event_data):
    """Create a hash for audit event integrity"""
    event_string = json.dumps(event_data, sort_keys=True, default=str)
    return hashlib.sha256(event_string.encode()).hexdigest()

def is_safe_url(target):
    """Validate that a redirect URL is safe (prevents open redirect attacks)"""
    if not target:
        return False
    
    # Strip whitespace and decode potential URL encoding tricks
    target = target.strip()
    
    # Block common malicious patterns
    dangerous_patterns = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:']
    if any(target.lower().startswith(pattern) for pattern in dangerous_patterns):
        return False
    
    # Parse the target URL
    ref_url = urlparse(request.host_url)
    test_url = urlparse(target)
    
    # Allow relative URLs (no netloc) but check for suspicious paths
    if not test_url.netloc:
        # Block protocol-relative URLs like //evil.com
        if target.startswith('//'):
            return False
        return True
    
    # For absolute URLs, require exact hostname match
    if test_url.netloc.lower() != ref_url.netloc.lower():
        return False
    
    # Only allow safe schemes for absolute URLs
    safe_schemes = ['http', 'https']
    if test_url.scheme.lower() not in safe_schemes:
        return False
    
    return True

def get_safe_redirect_url(next_url, fallback_endpoint='dashboard'):
    """Get a safe redirect URL or fallback to a safe endpoint"""
    if next_url and is_safe_url(next_url):
        return next_url
    return url_for(fallback_endpoint)

def encrypt_sensitive_data(data, key=None):
    """Encrypt sensitive data using Fernet symmetric encryption"""
    if key is None:
        key = Fernet.generate_key()
    else:
        key = key.encode() if isinstance(key, str) else key
    
    fernet = Fernet(key)
    encrypted_data = fernet.encrypt(data.encode() if isinstance(data, str) else data)
    return encrypted_data, key

def decrypt_sensitive_data(encrypted_data, key):
    """Decrypt sensitive data"""
    fernet = Fernet(key)
    return fernet.decrypt(encrypted_data)

def allowed_file(filename, allowed_extensions=None):
    """Check if file extension is allowed"""
    if allowed_extensions is None:
        allowed_extensions = {'jpg', 'jpeg', 'png', 'gif', 'pdf', 'txt', 'doc', 'docx'}
    
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions

def create_2257_packet(user, documents):
    """Create a 2257 compliance packet with all required documents"""
    packet_data = {
        'user_id': user.id,
        'username': user.username,
        'full_name': user.get_full_name(),
        'email': user.email,
        'created_at': datetime.utcnow().isoformat(),
        'documents': [],
        'compliance_status': user.verification_status.value if user.verification_status else 'pending'
    }
    
    for doc in documents:
        doc_data = {
            'id': doc.id,
            'type': doc.document_type.value,
            'filename': doc.original_filename,
            'file_hash': doc.file_hash,
            'uploaded_at': doc.uploaded_at.isoformat(),
            'verified_at': doc.verified_at.isoformat() if doc.verified_at else None,
            'status': doc.status.value,
            'ip_address': doc.ip_address,
            'device_fingerprint': doc.device_fingerprint
        }
        packet_data['documents'].append(doc_data)
    
    # Create packet hash for integrity
    packet_hash = create_audit_event_hash(packet_data)
    packet_data['packet_hash'] = packet_hash
    
    return packet_data

def initiate_verifymy_session(user_id, verification_type='identity'):
    """Initiate a VerifyMy verification session"""
    try:
        headers = {
            'Authorization': f'Bearer {Config.VERIFYMY_API_KEY}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'user_id': str(user_id),
            'verification_type': verification_type,
            'callback_url': f'{request.url_root}api/verifymy/webhook',
            'metadata': {
                'platform': 'fanzlab',
                'timestamp': datetime.utcnow().isoformat()
            }
        }
        
        response = requests.post(
            f'{Config.VERIFYMY_BASE_URL}/sessions',
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 201:
            return response.json()
        else:
            return {'error': f'VerifyMy API error: {response.status_code}'}
            
    except requests.RequestException as e:
        return {'error': f'VerifyMy API request failed: {str(e)}'}

def process_verifymy_webhook(webhook_data):
    """Process VerifyMy webhook response"""
    try:
        session_id = webhook_data.get('session_id')
        status = webhook_data.get('status')
        result_data = webhook_data.get('result', {})
        
        # Validate webhook signature here if VerifyMy provides one
        
        return {
            'session_id': session_id,
            'status': status,
            'confidence_score': result_data.get('confidence_score'),
            'verification_result': result_data,
            'processed_at': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        return {'error': f'Webhook processing failed: {str(e)}'}

def check_content_readiness(scene):
    """Check if content is ready for publishing based on verification status"""
    if not scene.participants:
        return False, "No participants added to scene"
    
    for participant in scene.participants:
        if not participant.user.is_verified:
            return False, f"Participant {participant.user.username} is not verified"
        
        if not participant.has_consent:
            return False, f"Participant {participant.user.username} has not provided consent"
    
    return True, "Scene is ready for publishing"

def quarantine_content(content_type, content_id, reason, moderator_id):
    """Quarantine content and freeze related payouts"""
    from models import ContentQuarantine, AuditEvent
    from app import db
    
    # Create quarantine record
    quarantine = ContentQuarantine()
    quarantine.content_type = content_type
    quarantine.content_id = content_id
    quarantine.reason = reason
    quarantine.quarantined_by = moderator_id
    db.session.add(quarantine)
    
    # Create audit event
    client_info = get_client_info()
    audit_data = {
        'event_type': 'content_quarantined',
        'content_type': content_type,
        'content_id': content_id,
        'reason': reason,
        'moderator_id': moderator_id,
        **client_info
    }
    
    audit_event = AuditEvent()
    audit_event.user_id = moderator_id
    audit_event.event_type = 'content_quarantined'
    audit_event.event_description = f'Content quarantined: {content_type} {content_id} - {reason}'
    audit_event.resource_type = content_type
    audit_event.resource_id = content_id
    audit_event.ip_address = client_info['ip_address']
    audit_event.user_agent = client_info['user_agent']
    audit_event.event_hash = create_audit_event_hash(audit_data)
    db.session.add(audit_event)
    
    db.session.commit()
    
    # TODO: Implement payout freezing logic here
    # This would integrate with payment gateway APIs
    
    return True

def create_compliance_export(user_id, export_type='subpoena'):
    """Create compliance export package for legal requests"""
    from models import User, Document, Verification, AuditEvent
    
    user = User.query.get(user_id)
    if not user:
        return None
    
    documents = Document.query.filter_by(user_id=user_id).all()
    verifications = Verification.query.filter_by(user_id=user_id).all()
    audit_events = AuditEvent.query.filter_by(user_id=user_id).all()
    
    export_data = {
        'export_type': export_type,
        'exported_at': datetime.utcnow().isoformat(),
        'user_profile': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'full_name': user.get_full_name(),
            'role': user.role.value,
            'verification_status': user.verification_status.value,
            'created_at': user.created_at.isoformat(),
            'last_login': user.last_login.isoformat() if user.last_login else None
        },
        'compliance_documents': create_2257_packet(user, documents),
        'verifications': [
            {
                'id': v.id,
                'type': v.verification_type,
                'status': v.status.value,
                'verifymy_session': v.verifymy_session_id,
                'initiated_at': v.initiated_at.isoformat(),
                'completed_at': v.completed_at.isoformat() if v.completed_at else None
            }
            for v in verifications
        ],
        'audit_trail': [
            {
                'id': ae.id,
                'event_type': ae.event_type,
                'description': ae.event_description,
                'created_at': ae.created_at.isoformat(),
                'ip_address': ae.ip_address,
                'event_hash': ae.event_hash
            }
            for ae in audit_events
        ]
    }
    
    # Create export hash for integrity
    export_hash = create_audit_event_hash(export_data)
    export_data['export_hash'] = export_hash
    
    return export_data

def validate_cluster_access(user, cluster_type):
    """Validate if user has access to a specific cluster"""
    from models import ClusterMembership
    
    membership = ClusterMembership.query.filter_by(
        user_id=user.id,
        cluster_type=cluster_type,
        is_active=True
    ).first()
    
    return membership is not None
