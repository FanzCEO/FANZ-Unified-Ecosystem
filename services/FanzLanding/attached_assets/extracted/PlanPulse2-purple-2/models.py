from datetime import datetime, timedelta
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from app import db
import enum
import json

class UserRole(enum.Enum):
    FAN = "fan"
    STAR = "star"
    MODERATOR = "moderator"
    ADMIN = "admin"
    EXEC = "exec"

class VerificationStatus(enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DENIED = "denied"
    NEEDS_FIX = "needs_fix"

class DocumentType(enum.Enum):
    GOV_ID = "gov_id"
    SELFIE = "selfie"
    W9_W8BEN = "w9_w8ben"
    ADDRESS_PROOF = "address_proof"
    CONTRACTS = "contracts"

class ClusterType(enum.Enum):
    BOYFANZ = "boyfanz"
    GIRLFANZ = "girlfanz"
    PUPFANZ = "pupfanz"
    TRANZFANZ = "tranzfanz"
    TABOOFANZ = "taboofanz"
    DADDYFANZ = "daddyfanz"
    ALLMYFANZ = "allmyfanz"
    RECOVERYFANZ = "recoveryfanz"
    FANZTUBE = "fanztube"
    FANZVARSITY = "fanzvarsity"
    FANZWORK = "fanzwork"
    FANZFLUENCE = "fanzfluence"
    FANZVIP = "fanzvip"
    FANZAI = "fanzai"

class OnboardingStepType(enum.Enum):
    SURVEY = "survey"
    TUTORIAL = "tutorial"
    PROFILE_SETUP = "profile_setup"
    PREFERENCES = "preferences"
    VERIFICATION = "verification"
    CLUSTER_SELECTION = "cluster_selection"
    FEATURE_INTRODUCTION = "feature_introduction"
    GOAL_SETTING = "goal_setting"

class OnboardingStatus(enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"
    PAUSED = "paused"

class ExperienceLevel(enum.Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

# Additional enums for social media features
class PostType(enum.Enum):
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    POLL = "poll"
    QUIZ = "quiz"
    LIVE_STREAM = "live_stream"

class PostStatus(enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    SCHEDULED = "scheduled"
    ARCHIVED = "archived"
    DELETED = "deleted"

class SubscriptionStatus(enum.Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"
    SUSPENDED = "suspended"

class PaymentFrequency(enum.Enum):
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"

class PaymentStatus(enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"

class WithdrawalStatus(enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    PROCESSED = "processed"
    REJECTED = "rejected"
    CANCELLED = "cancelled"

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    
    # Profile information
    first_name = db.Column(db.String(50), nullable=True)
    last_name = db.Column(db.String(50), nullable=True)
    profile_image_url = db.Column(db.String(255), nullable=True)
    
    # Role and status
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.FAN)
    verification_status = db.Column(db.Enum(VerificationStatus), default=VerificationStatus.PENDING)
    active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    
    @property
    def is_active(self):
        """Required by Flask-Login UserMixin"""
        return self.active
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    documents = db.relationship('Document', backref='user', lazy=True, cascade='all, delete-orphan')
    verifications = db.relationship('Verification', backref='user', lazy=True, cascade='all, delete-orphan')
    audit_events = db.relationship('AuditEvent', backref='user', lazy=True, cascade='all, delete-orphan')
    cluster_memberships = db.relationship('ClusterMembership', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def get_full_name(self):
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username
    
    def is_compliance_complete(self):
        """Check if user has completed all required compliance steps"""
        required_docs = [DocumentType.GOV_ID, DocumentType.SELFIE]
        if self.role == UserRole.STAR:
            required_docs.extend([DocumentType.W9_W8BEN, DocumentType.ADDRESS_PROOF, DocumentType.CONTRACTS])
        
        # Query documents directly to avoid type checking issues
        from app import db
        uploaded_docs = [doc.document_type for doc in 
                        db.session.query(Document).filter_by(user_id=self.id, status=VerificationStatus.APPROVED).all()]
        return all(doc_type in uploaded_docs for doc_type in required_docs)
    
    def __repr__(self):
        return f'<User {self.username}>'

class Document(db.Model):
    __tablename__ = 'documents'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Document details
    document_type = db.Column(db.Enum(DocumentType), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    file_hash = db.Column(db.String(64), nullable=False)  # SHA-256 hash
    
    # Status and verification
    status = db.Column(db.Enum(VerificationStatus), default=VerificationStatus.PENDING)
    notes = db.Column(db.Text, nullable=True)
    
    # Forensic information
    ip_address = db.Column(db.String(45), nullable=False)  # IPv6 support
    user_agent = db.Column(db.Text, nullable=False)
    device_fingerprint = db.Column(db.String(255), nullable=True)
    geolocation = db.Column(db.String(255), nullable=True)
    
    # Timestamps
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    verified_at = db.Column(db.DateTime, nullable=True)
    expires_at = db.Column(db.DateTime, nullable=True)
    
    # Encryption metadata
    encryption_key = db.Column(db.String(255), nullable=True)
    is_encrypted = db.Column(db.Boolean, default=False)
    
    def __repr__(self):
        return f'<Document {self.document_type.value} for User {self.user_id}>'

class Verification(db.Model):
    __tablename__ = 'verifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # VerifyMy integration
    verifymy_session_id = db.Column(db.String(255), nullable=True)
    verifymy_status = db.Column(db.String(50), nullable=True)
    verifymy_result = db.Column(db.JSON, nullable=True)
    
    # Verification details
    verification_type = db.Column(db.String(50), nullable=False)  # 'identity', 'liveness', 'document'
    status = db.Column(db.Enum(VerificationStatus), default=VerificationStatus.PENDING)
    confidence_score = db.Column(db.Float, nullable=True)
    
    # Results and metadata
    result_data = db.Column(db.JSON, nullable=True)
    failure_reason = db.Column(db.Text, nullable=True)
    
    # Timestamps
    initiated_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    
    def __repr__(self):
        return f'<Verification {self.verification_type} for User {self.user_id}>'

class ClusterMembership(db.Model):
    __tablename__ = 'cluster_memberships'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Cluster details
    cluster_type = db.Column(db.Enum(ClusterType), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    can_cross_post = db.Column(db.Boolean, default=False)
    
    # Membership details
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_activity = db.Column(db.DateTime, nullable=True)
    
    # Unique constraint to prevent duplicate memberships
    __table_args__ = (db.UniqueConstraint('user_id', 'cluster_type', name='unique_user_cluster'),)
    
    def __repr__(self):
        return f'<ClusterMembership {self.cluster_type.value} for User {self.user_id}>'

class Scene(db.Model):
    __tablename__ = 'scenes'
    
    id = db.Column(db.Integer, primary_key=True)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Scene details
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    content_type = db.Column(db.String(50), nullable=False)  # 'photo', 'video', 'live'
    
    # Publishing status
    is_published = db.Column(db.Boolean, default=False)
    can_publish = db.Column(db.Boolean, default=False)  # Calculated based on participant verification
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    published_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    participants = db.relationship('SceneParticipant', backref='scene', lazy=True, cascade='all, delete-orphan')
    
    creator = db.relationship('User', backref='created_scenes')
    
    def check_readiness(self):
        """Check if all participants are verified and consented"""
        # Query participants directly to avoid type checking issues
        from app import db
        participants = db.session.query(SceneParticipant).filter_by(scene_id=self.id).all()
        for participant in participants:
            if not participant.user.is_verified or not participant.has_consent:
                return False
        return True
    
    def __repr__(self):
        return f'<Scene {self.title}>'

class SceneParticipant(db.Model):
    __tablename__ = 'scene_participants'
    
    id = db.Column(db.Integer, primary_key=True)
    scene_id = db.Column(db.Integer, db.ForeignKey('scenes.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Consent and verification
    has_consent = db.Column(db.Boolean, default=False)
    consent_signature = db.Column(db.Text, nullable=True)
    consent_timestamp = db.Column(db.DateTime, nullable=True)
    consent_ip = db.Column(db.String(45), nullable=True)
    
    # Role in scene
    role = db.Column(db.String(50), nullable=True)  # 'performer', 'cameo', 'voice'
    
    # Timestamps
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User')
    
    # Unique constraint
    __table_args__ = (db.UniqueConstraint('scene_id', 'user_id', name='unique_scene_participant'),)
    
    def __repr__(self):
        return f'<SceneParticipant Scene {self.scene_id} User {self.user_id}>'

class AuditEvent(db.Model):
    __tablename__ = 'audit_events'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Event details
    event_type = db.Column(db.String(100), nullable=False)
    event_description = db.Column(db.Text, nullable=False)
    
    # Context
    resource_type = db.Column(db.String(50), nullable=True)  # 'document', 'verification', 'scene'
    resource_id = db.Column(db.Integer, nullable=True)
    
    # Forensic data
    ip_address = db.Column(db.String(45), nullable=False)
    user_agent = db.Column(db.Text, nullable=False)
    session_id = db.Column(db.String(255), nullable=True)
    
    # Event hash for integrity
    event_hash = db.Column(db.String(64), nullable=False)
    
    # Additional forensic data (JSON)
    forensic_data = db.Column(db.JSON, nullable=True)
    
    # Timestamp (immutable)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f'<AuditEvent {self.event_type}>'

class ContentQuarantine(db.Model):
    __tablename__ = 'content_quarantine'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Content reference
    content_type = db.Column(db.String(50), nullable=False)  # 'scene', 'document', 'message'
    content_id = db.Column(db.Integer, nullable=False)
    
    # Quarantine details
    reason = db.Column(db.String(255), nullable=False)
    quarantined_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    
    # Timestamps
    quarantined_at = db.Column(db.DateTime, default=datetime.utcnow)
    released_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    moderator = db.relationship('User')
    
    def __repr__(self):
        return f'<ContentQuarantine {self.content_type} {self.content_id}>'

class ThemeType(enum.Enum):
    NEON_CYBERPUNK = "neon_cyberpunk"
    DARK_MINIMAL = "dark_minimal"
    RETRO_WAVE = "retro_wave"
    GALAXY = "galaxy"
    CUSTOM = "custom"

class AssetType(enum.Enum):
    BACKGROUND_IMAGE = "background_image"
    LOGO = "logo"
    ICON = "icon"
    DECORATION = "decoration"
    ANIMATION = "animation"

class Theme(db.Model):
    __tablename__ = 'themes'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Theme identification
    name = db.Column(db.String(100), nullable=False, unique=True)
    display_name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    # Theme configuration
    theme_type = db.Column(db.Enum(ThemeType), nullable=False, default=ThemeType.CUSTOM)
    is_active = db.Column(db.Boolean, default=False)
    is_default = db.Column(db.Boolean, default=False)
    is_public = db.Column(db.Boolean, default=True)
    
    # Theme data (JSON configuration)
    color_config = db.Column(db.JSON, nullable=True)
    layout_config = db.Column(db.JSON, nullable=True)
    animation_config = db.Column(db.JSON, nullable=True)
    
    # Creator and permissions
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = db.relationship('User', backref='created_themes')
    assets = db.relationship('ThemeAsset', backref='theme', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'display_name': self.display_name,
            'description': self.description,
            'theme_type': self.theme_type.value,
            'is_active': self.is_active,
            'color_config': self.color_config,
            'layout_config': self.layout_config,
            'animation_config': self.animation_config,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Theme {self.name}>'

class ThemeAsset(db.Model):
    __tablename__ = 'theme_assets'
    
    id = db.Column(db.Integer, primary_key=True)
    theme_id = db.Column(db.Integer, db.ForeignKey('themes.id'), nullable=False)
    
    # Asset details
    asset_type = db.Column(db.Enum(AssetType), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    file_hash = db.Column(db.String(64), nullable=False)
    
    # Asset properties
    width = db.Column(db.Integer, nullable=True)
    height = db.Column(db.Integer, nullable=True)
    mime_type = db.Column(db.String(100), nullable=False)
    
    # Usage configuration
    css_selector = db.Column(db.String(255), nullable=True)  # Where to apply this asset
    css_property = db.Column(db.String(100), nullable=True)  # background-image, background, etc.
    is_active = db.Column(db.Boolean, default=True)
    
    # Upload metadata
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    uploader = db.relationship('User')
    
    def get_url(self):
        """Generate URL for the asset"""
        return f"/static/themes/{self.theme_id}/{self.filename}"
    
    def __repr__(self):
        return f'<ThemeAsset {self.name} for Theme {self.theme_id}>'

class ConsentRecord(db.Model):
    __tablename__ = 'consent_records'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Creator information
    creator_name = db.Column(db.String(255), nullable=False)
    creator_stage_name = db.Column(db.String(255), nullable=True)
    creator_email = db.Column(db.String(120), nullable=False)
    creator_id_type = db.Column(db.String(50), nullable=False)
    creator_id_number = db.Column(db.String(100), nullable=False)
    creator_id_state_country = db.Column(db.String(100), nullable=False)
    creator_dob = db.Column(db.Date, nullable=False)
    
    # Consent details
    compensation_terms = db.Column(db.Text, nullable=True)
    digital_signature = db.Column(db.Text, nullable=False)
    consent_timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Co-star information (optional)
    costar_name = db.Column(db.String(255), nullable=True)
    costar_stage_name = db.Column(db.String(255), nullable=True)
    costar_email = db.Column(db.String(120), nullable=True)
    costar_dob = db.Column(db.Date, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='consent_records')
    
    def __repr__(self):
        return f'<ConsentRecord {self.creator_name}>'

# Personalized Onboarding System Models

class OnboardingProgress(db.Model):
    __tablename__ = 'onboarding_progress'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Progress tracking
    current_step = db.Column(db.String(100), nullable=True)
    steps_completed = db.Column(db.JSON, default=list)  # List of completed step IDs
    total_steps = db.Column(db.Integer, default=0)
    completion_percentage = db.Column(db.Float, default=0.0)
    
    # Status and timing
    status = db.Column(db.Enum(OnboardingStatus), default=OnboardingStatus.NOT_STARTED)
    started_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    last_interaction = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Personalization data
    user_goals = db.Column(db.JSON, default=list)  # List of user goals
    interests = db.Column(db.JSON, default=list)   # List of interests
    experience_level = db.Column(db.Enum(ExperienceLevel), default=ExperienceLevel.BEGINNER)
    preferred_clusters = db.Column(db.JSON, default=list)  # Preferred cluster types
    
    # Journey customization
    personalized_path = db.Column(db.JSON, default=list)  # Custom step sequence
    skipped_steps = db.Column(db.JSON, default=list)      # Steps user skipped
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='onboarding_progress')
    
    def get_completion_percentage(self):
        if self.total_steps == 0:
            return 0.0
        return (len(self.steps_completed) / self.total_steps) * 100
    
    def add_completed_step(self, step_id):
        if not self.steps_completed:
            self.steps_completed = []
        if step_id not in self.steps_completed:
            self.steps_completed.append(step_id)
            self.completion_percentage = self.get_completion_percentage()
            self.last_interaction = datetime.utcnow()
    
    def is_step_completed(self, step_id):
        return step_id in (self.steps_completed or [])
    
    def __repr__(self):
        return f'<OnboardingProgress User:{self.user_id} {self.completion_percentage}%>'

class UserPreferences(db.Model):
    __tablename__ = 'user_preferences'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    
    # Content preferences
    content_interests = db.Column(db.JSON, default=list)     # Types of content interested in
    content_creation_goals = db.Column(db.JSON, default=list) # For creators
    monetization_preferences = db.Column(db.JSON, default=list) # Revenue goals/methods
    
    # Communication preferences
    email_notifications = db.Column(db.Boolean, default=True)
    push_notifications = db.Column(db.Boolean, default=True)
    marketing_emails = db.Column(db.Boolean, default=False)
    newsletter_subscription = db.Column(db.Boolean, default=False)
    
    # Platform behavior preferences
    tutorial_frequency = db.Column(db.String(20), default='normal')  # minimal, normal, detailed
    help_tooltips_enabled = db.Column(db.Boolean, default=True)
    auto_recommendations = db.Column(db.Boolean, default=True)
    privacy_level = db.Column(db.String(20), default='standard')     # public, standard, private
    
    # Onboarding specific preferences
    learning_style = db.Column(db.String(50), nullable=True)         # visual, hands-on, guided, self-directed
    time_availability = db.Column(db.String(20), nullable=True)      # casual, part-time, full-time
    platform_familiarity = db.Column(db.String(20), nullable=True)   # new, some_experience, experienced
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='preferences')
    
    def update_preferences(self, new_preferences):
        """Update preferences from a dictionary"""
        for key, value in new_preferences.items():
            if hasattr(self, key):
                setattr(self, key, value)
        self.updated_at = datetime.utcnow()
    
    def __repr__(self):
        return f'<UserPreferences User:{self.user_id}>'

class OnboardingStep(db.Model):
    __tablename__ = 'onboarding_steps'
    
    id = db.Column(db.Integer, primary_key=True)
    step_id = db.Column(db.String(100), unique=True, nullable=False)  # Unique identifier
    
    # Step configuration
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    step_type = db.Column(db.Enum(OnboardingStepType), nullable=False)
    
    # Step content and behavior
    content = db.Column(db.JSON, default=dict)              # Step-specific content (questions, tutorial data, etc.)
    required = db.Column(db.Boolean, default=True)          # Whether step can be skipped
    role_specific = db.Column(db.JSON, default=list)        # Which roles this applies to
    prerequisites = db.Column(db.JSON, default=list)        # Required previous steps
    
    # Ordering and flow control
    order_index = db.Column(db.Integer, default=0)
    estimated_duration = db.Column(db.Integer, default=60)  # Seconds
    
    # Personalization rules
    show_conditions = db.Column(db.JSON, default=dict)      # When to show this step
    skip_conditions = db.Column(db.JSON, default=dict)      # When to auto-skip
    
    # Status and metadata
    active = db.Column(db.Boolean, default=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @staticmethod
    def get_steps_for_role(role):
        """Get all active steps applicable for a specific role"""
        return OnboardingStep.query.filter(
            OnboardingStep.active == True,
            db.or_(
                OnboardingStep.role_specific == [],
                OnboardingStep.role_specific.contains([role.value])
            )
        ).order_by(OnboardingStep.order_index).all()
    
    def evaluate_conditions(self, user, user_preferences=None):
        """Check if step should be shown based on conditions"""
        if not self.show_conditions:
            return True
        
        # Add logic to evaluate conditions based on user data
        # This can be extended with more complex rule evaluation
        return True
    
    def __repr__(self):
        return f'<OnboardingStep {self.step_id}>'

class UserJourney(db.Model):
    __tablename__ = 'user_journeys'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    journey_id = db.Column(db.String(100), nullable=False)  # Unique journey identifier
    
    # Journey data
    journey_type = db.Column(db.String(50), default='onboarding')  # onboarding, feature_discovery, re-engagement
    steps_sequence = db.Column(db.JSON, default=list)              # Ordered list of steps for this user
    current_step_index = db.Column(db.Integer, default=0)
    
    # Journey progress
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    last_step_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Personalization tracking
    personalization_factors = db.Column(db.JSON, default=dict)  # Factors that influenced this journey
    adaptations_made = db.Column(db.JSON, default=list)        # Dynamic changes made during journey
    
    # Analytics and feedback
    time_spent_per_step = db.Column(db.JSON, default=dict)     # Step_id -> seconds
    user_feedback = db.Column(db.JSON, default=dict)           # User feedback on steps
    completion_quality_score = db.Column(db.Float, nullable=True)  # How thoroughly user completed
    
    # Status
    status = db.Column(db.Enum(OnboardingStatus), default=OnboardingStatus.IN_PROGRESS)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='journeys')
    
    def get_current_step(self):
        """Get the current step object"""
        if self.current_step_index < len(self.steps_sequence or []):
            step_id = self.steps_sequence[self.current_step_index]
            return OnboardingStep.query.filter_by(step_id=step_id).first()
        return None
    
    def advance_to_next_step(self):
        """Move to the next step in the journey"""
        if self.current_step_index < len(self.steps_sequence or []) - 1:
            self.current_step_index += 1
            self.last_step_at = datetime.utcnow()
            return True
        else:
            # Journey completed
            self.completed_at = datetime.utcnow()
            self.status = OnboardingStatus.COMPLETED
            return False
    
    def record_step_time(self, step_id, duration_seconds):
        """Record time spent on a specific step"""
        if not self.time_spent_per_step:
            self.time_spent_per_step = {}
        self.time_spent_per_step[step_id] = duration_seconds
    
    def add_adaptation(self, adaptation_description):
        """Record a dynamic adaptation made to the journey"""
        if not self.adaptations_made:
            self.adaptations_made = []
        self.adaptations_made.append({
            'description': adaptation_description,
            'timestamp': datetime.utcnow().isoformat()
        })
    
    def __repr__(self):
        return f'<UserJourney {self.journey_id} User:{self.user_id}>'

# Platform Gateway Models - Essential Features Only

class PlatformAccess(db.Model):
    __tablename__ = 'platform_access'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    cluster_type = db.Column(db.Enum(ClusterType), nullable=False)
    
    # Access control
    access_granted = db.Column(db.Boolean, default=False)
    verification_required = db.Column(db.Boolean, default=True)
    access_level = db.Column(db.String(20), default='basic')  # basic, premium, vip
    
    # Platform-specific details
    platform_url = db.Column(db.String(500), nullable=True)
    platform_token = db.Column(db.String(256), nullable=True)  # For SSO
    
    # Access tracking
    first_accessed = db.Column(db.DateTime, nullable=True)
    last_accessed = db.Column(db.DateTime, nullable=True)
    access_count = db.Column(db.Integer, default=0)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='platform_access')
    
    def __repr__(self):
        return f'<PlatformAccess User:{self.user_id} Cluster:{self.cluster_type.value}>'
