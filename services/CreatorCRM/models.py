from datetime import datetime, timezone
from app import db
from sqlalchemy import String, Text, DateTime, Boolean, Integer, ForeignKey, Enum
from sqlalchemy.orm import relationship
from werkzeug.security import generate_password_hash, check_password_hash
import enum

class DomainStatus(enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    FAILED = "failed"
    EXPIRED = "expired"

class DomainRecordType(enum.Enum):
    MX = "MX"
    TXT = "TXT"
    CNAME = "CNAME"
    A = "A"

class CheckInStatus(enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    MISSED = "missed"
    OVERDUE = "overdue"

class PanicAlertStatus(enum.Enum):
    ACTIVE = "active"
    RESOLVED = "resolved"
    FALSE_ALARM = "false_alarm"

class SafetyLevel(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class BroadcastType(enum.Enum):
    INDIVIDUAL = "individual"  # Send to each recipient separately
    GROUP = "group"           # Send as group message

class BroadcastStatus(enum.Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    SENDING = "sending"
    SENT = "sent"
    FAILED = "failed"

class MessageDeliveryStatus(enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    FAILED = "failed"

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(Integer, primary_key=True)
    username = db.Column(String(64), unique=True, nullable=False)
    email = db.Column(String(120), unique=True, nullable=False)
    password_hash = db.Column(String(256), nullable=False)
    phone_number = db.Column(String(20), unique=True, nullable=True)
    created_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_active = db.Column(Boolean, default=True)
    is_verified = db.Column(Boolean, default=False)
    
    # Professional information
    business_name = db.Column(String(200), nullable=True)
    website = db.Column(String(255), nullable=True)
    
    # Password reset
    reset_token = db.Column(String(100), nullable=True)
    reset_token_expires = db.Column(DateTime, nullable=True)
    
    # Relationships
    clients = relationship("Client", back_populates="user", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="user", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="user", cascade="all, delete-orphan")
    templates = relationship("Template", back_populates="user", cascade="all, delete-orphan")
    tags = relationship("Tag", back_populates="user", cascade="all, delete-orphan")
    workflows = relationship("Workflow", back_populates="user", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    communication_channels = relationship("CommunicationChannel", back_populates="user", cascade="all, delete-orphan")
    media_files = relationship("MediaFile", back_populates="user", cascade="all, delete-orphan")
    ai_assistants = relationship("AIAssistant", back_populates="user", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="user", cascade="all, delete-orphan")
    builtin_emails = relationship("BuiltInEmail", back_populates="user", cascade="all, delete-orphan")
    domains = relationship("Domain", back_populates="user", cascade="all, delete-orphan")
    emergency_contacts = relationship("EmergencyContact", back_populates="user", cascade="all, delete-orphan")
    safety_settings = relationship("SafetySettings", back_populates="user", uselist=False, cascade="all, delete-orphan")
    safety_checkins = relationship("SafetyCheckIn", back_populates="user", cascade="all, delete-orphan")
    panic_alerts = relationship("PanicAlert", back_populates="user", cascade="all, delete-orphan")
    broadcasts = relationship("Broadcast", back_populates="user", cascade="all, delete-orphan")
    contact_groups = relationship("ContactGroup", back_populates="user", cascade="all, delete-orphan")
    
    def set_password(self, password):
        """Set password hash"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check password against hash"""
        return check_password_hash(self.password_hash, password)

class Client(db.Model):
    __tablename__ = 'clients'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    name = db.Column(String(100), nullable=False)
    phone_number = db.Column(String(20), nullable=True)
    email = db.Column(String(120), nullable=True)
    notes = db.Column(Text, nullable=True)
    tags = db.Column(String(500), nullable=True)  # Comma-separated tags
    is_blocked = db.Column(Boolean, default=False)
    created_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_contact = db.Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="clients")
    appointments = relationship("Appointment", back_populates="client", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="client", cascade="all, delete-orphan")
    client_tags = relationship("ClientTag", back_populates="client", cascade="all, delete-orphan")
    media_files = relationship("MediaFile", back_populates="client", cascade="all, delete-orphan")
    ai_interactions = relationship("AIInteraction", back_populates="client", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="client", cascade="all, delete-orphan")
    builtin_emails = relationship("BuiltInEmail", back_populates="client", cascade="all, delete-orphan")

class Appointment(db.Model):
    __tablename__ = 'appointments'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    client_id = db.Column(Integer, ForeignKey('clients.id'), nullable=True)
    title = db.Column(String(200), nullable=False)
    description = db.Column(Text, nullable=True)
    start_time = db.Column(DateTime, nullable=False)
    end_time = db.Column(DateTime, nullable=False)
    location = db.Column(String(200), nullable=True)
    status = db.Column(String(20), default='tentative')  # tentative, confirmed, cancelled, completed
    created_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", back_populates="appointments")
    client = relationship("Client", back_populates="appointments")
    safety_checkins = relationship("SafetyCheckIn", back_populates="appointment", cascade="all, delete-orphan")

class Message(db.Model):
    __tablename__ = 'messages'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    client_id = db.Column(Integer, ForeignKey('clients.id'), nullable=True)
    direction = db.Column(String(10), nullable=False)  # inbound, outbound
    channel_id = db.Column(Integer, ForeignKey('communication_channels.id'), nullable=True)
    channel_type = db.Column(String(20), nullable=False)  # sms, email, whatsapp, viber, signal
    content = db.Column(Text, nullable=False)
    phone_number = db.Column(String(20), nullable=True)
    email_address = db.Column(String(120), nullable=True)
    external_id = db.Column(String(100), nullable=True)  # External message ID (WhatsApp, etc.)
    
    processed = db.Column(Boolean, default=False)
    has_media = db.Column(Boolean, default=False)
    is_ai_generated = db.Column(Boolean, default=False)
    
    # Message metadata (JSON)
    message_metadata = db.Column(Text, nullable=True)  # Platform-specific data
    
    created_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", back_populates="messages")
    client = relationship("Client", back_populates="messages")
    channel = relationship("CommunicationChannel", back_populates="messages")
    media_files = relationship("MediaFile", back_populates="message", cascade="all, delete-orphan")

class Template(db.Model):
    __tablename__ = 'templates'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    name = db.Column(String(100), nullable=False)
    category = db.Column(String(50), nullable=False)  # availability, rates, screening, booking, general
    content = db.Column(Text, nullable=False)
    is_active = db.Column(Boolean, default=True)
    created_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", back_populates="templates")

class CommunicationChannel(db.Model):
    __tablename__ = 'communication_channels'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    channel_type = db.Column(String(20), nullable=False)  # whatsapp, viber, signal, email, sms, voice
    channel_name = db.Column(String(100), nullable=False)  # Display name
    provider = db.Column(String(50), nullable=True)  # twilio, sendgrid, whatsapp_business, etc.
    
    # Configuration (JSON)
    config = db.Column(Text, nullable=True)  # API keys, phone numbers, email settings, etc.
    
    is_active = db.Column(Boolean, default=True)
    is_default = db.Column(Boolean, default=False)  # Default channel for this type
    created_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", back_populates="communication_channels")
    messages = relationship("Message", back_populates="channel")

class MediaFile(db.Model):
    __tablename__ = 'media_files'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    client_id = db.Column(Integer, ForeignKey('clients.id'), nullable=True)
    message_id = db.Column(Integer, ForeignKey('messages.id'), nullable=True)
    task_id = db.Column(Integer, ForeignKey('tasks.id'), nullable=True)
    
    filename = db.Column(String(255), nullable=False)
    original_filename = db.Column(String(255), nullable=False)
    file_type = db.Column(String(50), nullable=False)  # image, video, audio, document
    mime_type = db.Column(String(100), nullable=False)
    file_size = db.Column(Integer, nullable=False)  # bytes
    file_path = db.Column(String(500), nullable=False)  # Storage path
    
    # File metadata (JSON)
    file_metadata = db.Column(Text, nullable=True)  # dimensions, duration, etc.
    
    created_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", back_populates="media_files")
    client = relationship("Client", back_populates="media_files")
    message = relationship("Message", back_populates="media_files")
    task = relationship("Task", back_populates="media_files")

class AIAssistant(db.Model):
    __tablename__ = 'ai_assistants'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    name = db.Column(String(100), nullable=False)
    ai_type = db.Column(String(50), nullable=False)  # documentation, reminder, follow_up, analysis
    
    # Configuration (JSON)
    config = db.Column(Text, nullable=True)  # AI model settings, prompts, etc.
    
    is_active = db.Column(Boolean, default=True)
    created_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", back_populates="ai_assistants")
    interactions = relationship("AIInteraction", back_populates="assistant")

class AIInteraction(db.Model):
    __tablename__ = 'ai_interactions'
    
    id = db.Column(Integer, primary_key=True)
    assistant_id = db.Column(Integer, ForeignKey('ai_assistants.id'), nullable=False)
    client_id = db.Column(Integer, ForeignKey('clients.id'), nullable=True)
    task_id = db.Column(Integer, ForeignKey('tasks.id'), nullable=True)
    
    interaction_type = db.Column(String(50), nullable=False)  # analysis, generation, reminder, follow_up
    input_data = db.Column(Text, nullable=True)  # Input to AI
    output_data = db.Column(Text, nullable=True)  # AI response
    
    # AI metadata (JSON)
    ai_metadata = db.Column(Text, nullable=True)  # tokens used, confidence, etc.
    
    status = db.Column(String(20), default='pending')  # pending, processing, completed, failed
    created_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = db.Column(DateTime, nullable=True)
    
    # Relationships
    assistant = relationship("AIAssistant", back_populates="interactions")
    client = relationship("Client", back_populates="ai_interactions")
    task = relationship("Task", back_populates="ai_interactions")

class Reminder(db.Model):
    __tablename__ = 'reminders'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    client_id = db.Column(Integer, ForeignKey('clients.id'), nullable=True)
    task_id = db.Column(Integer, ForeignKey('tasks.id'), nullable=True)
    
    title = db.Column(String(200), nullable=False)
    description = db.Column(Text, nullable=True)
    reminder_type = db.Column(String(50), nullable=False)  # follow_up, appointment, payment, custom
    
    scheduled_at = db.Column(DateTime, nullable=False)
    channel_type = db.Column(String(20), nullable=False)  # sms, email, whatsapp, push
    channel_id = db.Column(Integer, ForeignKey('communication_channels.id'), nullable=True)
    
    status = db.Column(String(20), default='scheduled')  # scheduled, sent, failed, cancelled
    is_recurring = db.Column(Boolean, default=False)
    recurrence_config = db.Column(Text, nullable=True)  # JSON for recurring pattern
    
    # AI-generated flag
    is_ai_generated = db.Column(Boolean, default=False)
    ai_context = db.Column(Text, nullable=True)  # Context for AI generation
    
    created_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    sent_at = db.Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="reminders")
    client = relationship("Client", back_populates="reminders")
    task = relationship("Task", back_populates="reminders")
    channel = relationship("CommunicationChannel")

class BuiltInEmail(db.Model):
    __tablename__ = 'builtin_emails'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    client_id = db.Column(Integer, ForeignKey('clients.id'), nullable=True)
    
    from_address = db.Column(String(120), nullable=False)
    to_address = db.Column(String(120), nullable=False)
    cc_addresses = db.Column(Text, nullable=True)  # JSON array
    bcc_addresses = db.Column(Text, nullable=True)  # JSON array
    
    subject = db.Column(String(200), nullable=False)
    body_text = db.Column(Text, nullable=True)
    body_html = db.Column(Text, nullable=True)
    
    status = db.Column(String(20), default='draft')  # draft, sent, failed, scheduled
    priority = db.Column(String(10), default='normal')  # low, normal, high
    
    # Metadata
    thread_id = db.Column(String(100), nullable=True)  # For email threading
    message_id = db.Column(String(100), nullable=True)  # Unique message ID
    
    scheduled_at = db.Column(DateTime, nullable=True)  # For scheduled sending
    sent_at = db.Column(DateTime, nullable=True)
    created_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # AI-generated flag
    is_ai_generated = db.Column(Boolean, default=False)
    ai_context = db.Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="builtin_emails")
    client = relationship("Client", back_populates="builtin_emails")
    attachments = relationship("EmailAttachment", back_populates="email")

class EmailAttachment(db.Model):
    __tablename__ = 'email_attachments'
    
    id = db.Column(Integer, primary_key=True)
    email_id = db.Column(Integer, ForeignKey('builtin_emails.id'), nullable=False)
    media_file_id = db.Column(Integer, ForeignKey('media_files.id'), nullable=False)
    
    created_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    email = relationship("BuiltInEmail", back_populates="attachments")
    media_file = relationship("MediaFile")

class Tag(db.Model):
    __tablename__ = 'tags'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    name = db.Column(String(50), nullable=False)
    color = db.Column(String(7), nullable=True)  # Hex color code
    description = db.Column(Text, nullable=True)
    created_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", back_populates="tags")
    client_tags = relationship("ClientTag", back_populates="tag", cascade="all, delete-orphan")
    
    # Unique constraint per user
    __table_args__ = (db.UniqueConstraint('user_id', 'name', name='unique_user_tag'),)

class ClientTag(db.Model):
    __tablename__ = 'client_tags'
    
    id = db.Column(Integer, primary_key=True)
    client_id = db.Column(Integer, ForeignKey('clients.id'), nullable=False)
    tag_id = db.Column(Integer, ForeignKey('tags.id'), nullable=False)
    created_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    client = relationship("Client", back_populates="client_tags")
    tag = relationship("Tag", back_populates="client_tags")
    
    # Unique constraint to prevent duplicate tags per client
    __table_args__ = (db.UniqueConstraint('client_id', 'tag_id', name='unique_client_tag'),)

class Workflow(db.Model):
    __tablename__ = 'workflows'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    name = db.Column(String(100), nullable=False)
    description = db.Column(Text, nullable=True)
    is_active = db.Column(Boolean, default=True)
    trigger_type = db.Column(String(50), nullable=False)  # message_received, appointment_created, client_created, scheduled
    trigger_config = db.Column(Text, nullable=True)  # JSON config for trigger
    created_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", back_populates="workflows")
    rules = relationship("Rule", back_populates="workflow", cascade="all, delete-orphan")
    executions = relationship("WorkflowExecution", back_populates="workflow", cascade="all, delete-orphan")

class Rule(db.Model):
    __tablename__ = 'rules'
    
    id = db.Column(Integer, primary_key=True)
    workflow_id = db.Column(Integer, ForeignKey('workflows.id'), nullable=False)
    name = db.Column(String(100), nullable=False)
    description = db.Column(Text, nullable=True)
    order_index = db.Column(Integer, default=0)  # Order of execution within workflow
    is_active = db.Column(Boolean, default=True)
    
    # Condition configuration (JSON)
    condition_type = db.Column(String(50), nullable=False)  # message_contains, client_has_tag, time_based, etc.
    condition_config = db.Column(Text, nullable=False)  # JSON config for condition
    
    # Action configuration (JSON)
    action_type = db.Column(String(50), nullable=False)  # send_message, add_tag, create_appointment, etc.
    action_config = db.Column(Text, nullable=False)  # JSON config for action
    
    created_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    workflow = relationship("Workflow", back_populates="rules")

class Task(db.Model):
    __tablename__ = 'tasks'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    workflow_id = db.Column(Integer, ForeignKey('workflows.id'), nullable=True)
    rule_id = db.Column(Integer, ForeignKey('rules.id'), nullable=True)
    
    title = db.Column(String(200), nullable=False)
    description = db.Column(Text, nullable=True)
    task_type = db.Column(String(50), nullable=False)  # send_sms, send_email, add_tag, follow_up, ai_analyze, etc.
    task_data = db.Column(Text, nullable=False)  # JSON data for task execution
    
    status = db.Column(String(20), default='pending')  # pending, processing, completed, failed, cancelled
    priority = db.Column(Integer, default=5)  # 1-10, lower number = higher priority
    scheduled_at = db.Column(DateTime, nullable=True)  # For delayed execution
    due_at = db.Column(DateTime, nullable=True)  # Task due date
    
    attempts = db.Column(Integer, default=0)
    max_attempts = db.Column(Integer, default=3)
    error_message = db.Column(Text, nullable=True)
    
    # AI features
    is_ai_generated = db.Column(Boolean, default=False)
    ai_context = db.Column(Text, nullable=True)
    requires_ai_assistance = db.Column(Boolean, default=False)
    
    # Task categorization
    category = db.Column(String(50), nullable=True)  # follow_up, documentation, reminder, analysis
    tags = db.Column(String(500), nullable=True)  # Comma-separated tags
    
    created_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    started_at = db.Column(DateTime, nullable=True)
    completed_at = db.Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="tasks")
    workflow = relationship("Workflow")
    rule = relationship("Rule")
    media_files = relationship("MediaFile", back_populates="task", cascade="all, delete-orphan")
    ai_interactions = relationship("AIInteraction", back_populates="task", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="task", cascade="all, delete-orphan")

class WorkflowExecution(db.Model):
    __tablename__ = 'workflow_executions'
    
    id = db.Column(Integer, primary_key=True)
    workflow_id = db.Column(Integer, ForeignKey('workflows.id'), nullable=False)
    trigger_data = db.Column(Text, nullable=True)  # JSON data that triggered the workflow
    
    status = db.Column(String(20), default='running')  # running, completed, failed
    rules_executed = db.Column(Integer, default=0)
    rules_successful = db.Column(Integer, default=0)
    rules_failed = db.Column(Integer, default=0)
    
    started_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = db.Column(DateTime, nullable=True)
    error_message = db.Column(Text, nullable=True)
    execution_log = db.Column(Text, nullable=True)  # JSON log of execution steps
    
    # Relationships
    workflow = relationship("Workflow", back_populates="executions")

class Domain(db.Model):
    __tablename__ = 'domains'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    domain_name = db.Column(String(255), nullable=False, unique=True)
    
    # Domain status and verification
    status = db.Column(Enum(DomainStatus), default=DomainStatus.PENDING)
    is_email_enabled = db.Column(Boolean, default=False)
    is_primary = db.Column(Boolean, default=False)
    
    # Verification data
    verification_token = db.Column(String(64), nullable=True)
    verification_expires = db.Column(DateTime, nullable=True)
    verified_at = db.Column(DateTime, nullable=True)
    
    # Email configuration
    mx_records_configured = db.Column(Boolean, default=False)
    dkim_enabled = db.Column(Boolean, default=False)
    spf_enabled = db.Column(Boolean, default=False)
    dmarc_enabled = db.Column(Boolean, default=False)
    
    # SSL/TLS configuration
    ssl_enabled = db.Column(Boolean, default=False)
    ssl_certificate = db.Column(Text, nullable=True)
    ssl_expires = db.Column(DateTime, nullable=True)
    
    created_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", back_populates="domains")
    domain_records = relationship("DomainRecord", back_populates="domain", cascade="all, delete-orphan")
    email_accounts = relationship("EmailAccount", back_populates="domain", cascade="all, delete-orphan")

class DomainRecord(db.Model):
    __tablename__ = 'domain_records'
    
    id = db.Column(Integer, primary_key=True)
    domain_id = db.Column(Integer, ForeignKey('domains.id'), nullable=False)
    
    record_type = db.Column(Enum(DomainRecordType), nullable=False)
    name = db.Column(String(255), nullable=False)  # subdomain or @
    value = db.Column(Text, nullable=False)
    priority = db.Column(Integer, nullable=True)  # For MX records
    ttl = db.Column(Integer, default=3600)
    
    # Verification status
    is_verified = db.Column(Boolean, default=False)
    last_checked = db.Column(DateTime, nullable=True)
    
    created_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    domain = relationship("Domain", back_populates="domain_records")

class EmailAccount(db.Model):
    __tablename__ = 'email_accounts'
    
    id = db.Column(Integer, primary_key=True)
    domain_id = db.Column(Integer, ForeignKey('domains.id'), nullable=False)
    user_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    
    email_address = db.Column(String(255), nullable=False, unique=True)
    display_name = db.Column(String(100), nullable=True)
    
    # Email server configuration
    smtp_host = db.Column(String(255), nullable=True)
    smtp_port = db.Column(Integer, default=587)
    smtp_username = db.Column(String(255), nullable=True)
    smtp_password = db.Column(String(255), nullable=True)  # Encrypted
    smtp_use_tls = db.Column(Boolean, default=True)
    
    imap_host = db.Column(String(255), nullable=True)
    imap_port = db.Column(Integer, default=993)
    imap_username = db.Column(String(255), nullable=True)
    imap_password = db.Column(String(255), nullable=True)  # Encrypted
    imap_use_ssl = db.Column(Boolean, default=True)
    
    # Account status
    is_active = db.Column(Boolean, default=True)
    is_default = db.Column(Boolean, default=False)
    last_sync = db.Column(DateTime, nullable=True)
    
    # Email forwarding
    forward_to = db.Column(String(255), nullable=True)
    auto_reply_enabled = db.Column(Boolean, default=False)
    auto_reply_message = db.Column(Text, nullable=True)
    
    created_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    domain = relationship("Domain", back_populates="email_accounts")
    user = relationship("User")

class EmergencyContact(db.Model):
    __tablename__ = 'emergency_contacts'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    
    name = db.Column(String(100), nullable=False)
    relationship_type = db.Column(String(50), nullable=True)  # friend, family, partner, etc.
    phone_number = db.Column(String(20), nullable=False)
    email = db.Column(String(120), nullable=True)
    
    # Contact preferences
    notify_on_checkin_miss = db.Column(Boolean, default=True)
    notify_on_panic = db.Column(Boolean, default=True)
    notify_on_overdue = db.Column(Boolean, default=True)
    is_primary = db.Column(Boolean, default=False)
    
    # Additional info
    notes = db.Column(Text, nullable=True)
    is_active = db.Column(Boolean, default=True)
    
    created_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", back_populates="emergency_contacts")

class SafetySettings(db.Model):
    __tablename__ = 'safety_settings'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Check-in settings
    default_checkin_interval = db.Column(Integer, default=60)  # minutes
    pre_appointment_checkin = db.Column(Boolean, default=True)
    post_appointment_checkin = db.Column(Boolean, default=True)
    auto_checkin_reminders = db.Column(Boolean, default=True)
    
    # Panic settings
    panic_button_enabled = db.Column(Boolean, default=True)
    silent_panic_mode = db.Column(Boolean, default=False)
    auto_location_sharing = db.Column(Boolean, default=False)
    
    # Safety level thresholds
    missed_checkin_alert_minutes = db.Column(Integer, default=15)
    overdue_escalation_minutes = db.Column(Integer, default=60)
    
    # Emergency protocols
    notify_law_enforcement = db.Column(Boolean, default=False)
    emergency_message_template = db.Column(Text, nullable=True)
    safe_word = db.Column(String(50), nullable=True)
    
    created_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", back_populates="safety_settings")

class SafetyCheckIn(db.Model):
    __tablename__ = 'safety_checkins'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    appointment_id = db.Column(Integer, ForeignKey('appointments.id'), nullable=True)
    
    # Check-in details
    checkin_type = db.Column(String(20), nullable=False)  # pre, during, post, manual
    scheduled_time = db.Column(DateTime, nullable=False)
    actual_time = db.Column(DateTime, nullable=True)
    status = db.Column(Enum(CheckInStatus), default=CheckInStatus.PENDING)
    
    # Location data (optional)
    latitude = db.Column(String(20), nullable=True)
    longitude = db.Column(String(20), nullable=True)
    location_name = db.Column(String(200), nullable=True)
    
    # Safety assessment
    safety_level = db.Column(Enum(SafetyLevel), default=SafetyLevel.LOW)
    notes = db.Column(Text, nullable=True)
    safe_word_used = db.Column(Boolean, default=False)
    
    # Notification tracking
    reminder_sent = db.Column(Boolean, default=False)
    alert_sent = db.Column(Boolean, default=False)
    
    created_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", back_populates="safety_checkins")
    appointment = relationship("Appointment", back_populates="safety_checkins")

class PanicAlert(db.Model):
    __tablename__ = 'panic_alerts'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    appointment_id = db.Column(Integer, ForeignKey('appointments.id'), nullable=True)
    
    # Alert details
    alert_time = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    status = db.Column(Enum(PanicAlertStatus), default=PanicAlertStatus.ACTIVE)
    alert_level = db.Column(Enum(SafetyLevel), default=SafetyLevel.CRITICAL)
    is_silent = db.Column(Boolean, default=False)
    
    # Location data
    latitude = db.Column(String(20), nullable=True)
    longitude = db.Column(String(20), nullable=True)
    location_name = db.Column(String(200), nullable=True)
    
    # Additional information
    trigger_method = db.Column(String(50), nullable=True)  # button, sms, voice, etc.
    message = db.Column(Text, nullable=True)
    safe_word_used = db.Column(Boolean, default=False)
    
    # Response tracking
    emergency_contacts_notified = db.Column(Boolean, default=False)
    law_enforcement_notified = db.Column(Boolean, default=False)
    resolution_time = db.Column(DateTime, nullable=True)
    resolution_notes = db.Column(Text, nullable=True)
    
    created_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships  
    user = relationship("User", back_populates="panic_alerts")

class ContactGroup(db.Model):
    __tablename__ = 'contact_groups'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    
    name = db.Column(String(100), nullable=False)
    description = db.Column(Text, nullable=True)
    color = db.Column(String(7), default='#007bff')  # Hex color
    
    is_active = db.Column(Boolean, default=True)
    created_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", back_populates="contact_groups")
    group_members = relationship("ContactGroupMember", back_populates="group", cascade="all, delete-orphan")

class ContactGroupMember(db.Model):
    __tablename__ = 'contact_group_members'
    
    id = db.Column(Integer, primary_key=True)
    group_id = db.Column(Integer, ForeignKey('contact_groups.id'), nullable=False)
    client_id = db.Column(Integer, ForeignKey('clients.id'), nullable=False)
    
    added_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    group = relationship("ContactGroup", back_populates="group_members")
    client = relationship("Client")

class Broadcast(db.Model):
    __tablename__ = 'broadcasts'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Broadcast details
    title = db.Column(String(200), nullable=False)
    message_content = db.Column(Text, nullable=False)
    broadcast_type = db.Column(Enum(BroadcastType), default=BroadcastType.INDIVIDUAL)
    
    # Scheduling
    scheduled_time = db.Column(DateTime, nullable=True)
    sent_time = db.Column(DateTime, nullable=True)
    status = db.Column(Enum(BroadcastStatus), default=BroadcastStatus.DRAFT)
    
    # Channel preferences
    send_via_sms = db.Column(Boolean, default=True)
    send_via_email = db.Column(Boolean, default=False)
    send_via_whatsapp = db.Column(Boolean, default=False)
    
    # Group settings (for group broadcasts)
    group_name = db.Column(String(100), nullable=True)
    allow_replies = db.Column(Boolean, default=True)
    
    # Tracking
    total_recipients = db.Column(Integer, default=0)
    sent_count = db.Column(Integer, default=0)
    delivered_count = db.Column(Integer, default=0)
    failed_count = db.Column(Integer, default=0)
    
    created_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", back_populates="broadcasts")
    recipients = relationship("BroadcastRecipient", back_populates="broadcast", cascade="all, delete-orphan")
    messages = relationship("BroadcastMessage", back_populates="broadcast", cascade="all, delete-orphan")

class BroadcastRecipient(db.Model):
    __tablename__ = 'broadcast_recipients'
    
    id = db.Column(Integer, primary_key=True)
    broadcast_id = db.Column(Integer, ForeignKey('broadcasts.id'), nullable=False)
    client_id = db.Column(Integer, ForeignKey('clients.id'), nullable=True)
    
    # Contact details (for non-client recipients)
    name = db.Column(String(100), nullable=True)
    phone_number = db.Column(String(20), nullable=True)
    email = db.Column(String(120), nullable=True)
    
    # Delivery status
    delivery_status = db.Column(Enum(MessageDeliveryStatus), default=MessageDeliveryStatus.PENDING)
    sent_time = db.Column(DateTime, nullable=True)
    delivered_time = db.Column(DateTime, nullable=True)
    read_time = db.Column(DateTime, nullable=True)
    
    # Channel specific
    sms_sent = db.Column(Boolean, default=False)
    email_sent = db.Column(Boolean, default=False)
    whatsapp_sent = db.Column(Boolean, default=False)
    
    added_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    broadcast = relationship("Broadcast", back_populates="recipients")
    client = relationship("Client")

class BroadcastMessage(db.Model):
    __tablename__ = 'broadcast_messages'
    
    id = db.Column(Integer, primary_key=True)
    broadcast_id = db.Column(Integer, ForeignKey('broadcasts.id'), nullable=False)
    recipient_id = db.Column(Integer, ForeignKey('broadcast_recipients.id'), nullable=False)
    
    # Message details
    channel_type = db.Column(String(20), nullable=False)  # sms, email, whatsapp
    message_content = db.Column(Text, nullable=False)
    external_message_id = db.Column(String(100), nullable=True)  # Provider message ID
    
    # Status tracking
    status = db.Column(Enum(MessageDeliveryStatus), default=MessageDeliveryStatus.PENDING)
    sent_time = db.Column(DateTime, nullable=True)
    delivered_time = db.Column(DateTime, nullable=True)
    error_message = db.Column(Text, nullable=True)
    
    # Reply tracking (for group messages)
    reply_to_message_id = db.Column(Integer, ForeignKey('broadcast_messages.id'), nullable=True)
    is_reply = db.Column(Boolean, default=False)
    
    created_at = db.Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    broadcast = relationship("Broadcast", back_populates="messages")
    recipient = relationship("BroadcastRecipient")
    replies = relationship("BroadcastMessage", remote_side=[id])
