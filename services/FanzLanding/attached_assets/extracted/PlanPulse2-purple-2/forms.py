from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileRequired, FileAllowed
from wtforms import StringField, TextAreaField, PasswordField, SelectField, BooleanField, HiddenField, DateField
from wtforms.validators import DataRequired, Email, Length, EqualTo, ValidationError
from wtforms.widgets import TextArea
from models import User, UserRole, ClusterType, DocumentType

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=3, max=80)])
    password = PasswordField('Password', validators=[DataRequired()])
    remember_me = BooleanField('Remember Me')

class RegisterForm(FlaskForm):
    username = StringField('Username', validators=[
        DataRequired(), 
        Length(min=3, max=80, message="Username must be between 3 and 80 characters")
    ])
    email = StringField('Email', validators=[DataRequired(), Email()])
    first_name = StringField('First Name', validators=[Length(max=50)])
    last_name = StringField('Last Name', validators=[Length(max=50)])
    password = PasswordField('Password', validators=[
        DataRequired(),
        Length(min=8, message="Password must be at least 8 characters long")
    ])
    password2 = PasswordField('Confirm Password', validators=[
        DataRequired(),
        EqualTo('password', message='Passwords must match')
    ])
    
    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user:
            raise ValidationError('Please use a different username.')
    
    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user:
            raise ValidationError('Please use a different email address.')

class RoleSelectionForm(FlaskForm):
    role = SelectField('Select Your Role', choices=[
        (UserRole.FAN.value, 'Fan - Enjoy content from creators'),
        (UserRole.STAR.value, 'STAR (Creator) - Create and monetize content'),
        (UserRole.MODERATOR.value, 'Moderator - Help maintain community standards'),
        (UserRole.ADMIN.value, 'Admin - Platform administration'),
        (UserRole.EXEC.value, 'Executive - Business management')
    ], validators=[DataRequired()])

class KYCForm(FlaskForm):
    # Personal Information
    first_name = StringField('First Name', validators=[DataRequired(), Length(max=50)])
    last_name = StringField('Last Name', validators=[DataRequired(), Length(max=50)])
    date_of_birth = DateField('Date of Birth', validators=[DataRequired()])
    
    # Address Information
    street_address = StringField('Street Address', validators=[DataRequired(), Length(max=255)])
    city = StringField('City', validators=[DataRequired(), Length(max=100)])
    state = StringField('State/Province', validators=[DataRequired(), Length(max=100)])
    postal_code = StringField('Postal Code', validators=[DataRequired(), Length(max=20)])
    country = StringField('Country', validators=[DataRequired(), Length(max=100)])
    
    # Tax Information (for STARS)
    ssn_tin = StringField('SSN/TIN', validators=[Length(max=20)])
    
    # Consent checkboxes
    age_consent = BooleanField('I confirm that I am at least 18 years old', validators=[DataRequired()])
    compliance_2257 = BooleanField('I agree to comply with 2257 record-keeping requirements', validators=[DataRequired()])
    platform_policies = BooleanField('I agree to the platform policies and terms of service', validators=[DataRequired()])
    nda_agreement = BooleanField('I agree to the non-disclosure agreement', validators=[DataRequired()])
    ip_assignment = BooleanField('I agree to intellectual property assignment terms', validators=[DataRequired()])
    
    # STAR-specific agreements
    star_contract = BooleanField('I agree to the STAR/STARZ contract terms')
    non_disparagement = BooleanField('I agree to the non-disparagement clause')

class PersonalizedOnboardingSurveyForm(FlaskForm):
    # Goals and interests
    goals = SelectField('What are your main goals on this platform?', choices=[
        ('explore_content', 'Explore and discover new content'),
        ('connect_creators', 'Connect with creators I enjoy'),
        ('create_content', 'Create and share my own content'),
        ('build_audience', 'Build an audience and following'),
        ('monetize_content', 'Monetize my content and skills'),
        ('network_community', 'Network within the community'),
        ('learn_skills', 'Learn new skills and techniques'),
        ('entertainment', 'Pure entertainment and enjoyment')
    ], validators=[DataRequired()])
    
    interests = SelectField('Which content areas interest you most?', choices=[
        ('lifestyle', 'Lifestyle and daily content'),
        ('fitness', 'Fitness and wellness'),
        ('gaming', 'Gaming and streaming'),
        ('education', 'Educational content'),
        ('entertainment', 'Comedy and entertainment'),
        ('music', 'Music and performing arts'),
        ('art', 'Visual arts and creativity'),
        ('technology', 'Technology and reviews'),
        ('fashion', 'Fashion and beauty'),
        ('food', 'Cooking and food'),
        ('travel', 'Travel and adventure'),
        ('business', 'Business and entrepreneurship')
    ], validators=[DataRequired()])
    
    experience_level = SelectField('How would you describe your experience with creator platforms?', choices=[
        ('beginner', 'Complete beginner - this is my first creator platform'),
        ('intermediate', 'Some experience - I\'ve used similar platforms before'),
        ('advanced', 'Very experienced - I\'m familiar with creator economy'),
        ('expert', 'Expert level - I understand the industry deeply')
    ], validators=[DataRequired()])
    
    # Learning preferences
    learning_style = SelectField('How do you prefer to learn new features?', choices=[
        ('visual', 'Visual tutorials and guides'),
        ('hands-on', 'Learning by trying things out myself'),
        ('guided', 'Step-by-step guided tours'),
        ('self-directed', 'Figure it out on my own with minimal help')
    ], validators=[DataRequired()])
    
    time_availability = SelectField('How much time do you plan to spend here?', choices=[
        ('casual', 'Casual - checking in occasionally'),
        ('part-time', 'Part-time - a few hours per week'),
        ('full-time', 'Full-time - this is a major focus for me')
    ], validators=[DataRequired()])
    
    platform_familiarity = SelectField('How familiar are you with adult content platforms?', choices=[
        ('new', 'Very new to this type of platform'),
        ('some_experience', 'Some experience with similar platforms'),
        ('experienced', 'Very experienced with adult content platforms')
    ], validators=[DataRequired()])
    
    # Content preferences (for content consumers)
    content_interests = SelectField('What type of content are you most interested in?', choices=[
        ('photos', 'Photo content and galleries'),
        ('videos', 'Video content and streams'),
        ('live', 'Live streaming and interaction'),
        ('messaging', 'Private messaging and custom content'),
        ('community', 'Community interaction and discussions'),
        ('exclusive', 'Exclusive and premium content')
    ])
    
    # Creator-specific preferences
    content_creation_goals = SelectField('As a creator, what are your main goals?', choices=[
        ('build_following', 'Build a large following'),
        ('high_engagement', 'Create highly engaging content'),
        ('maximize_revenue', 'Maximize revenue potential'),
        ('brand_building', 'Build a personal brand'),
        ('creative_expression', 'Focus on creative expression'),
        ('community_building', 'Build a tight-knit community')
    ])
    
    monetization_preferences = SelectField('Which monetization methods interest you most?', choices=[
        ('subscriptions', 'Monthly subscriptions'),
        ('tips', 'Tips and donations'),
        ('custom_content', 'Custom content requests'),
        ('live_shows', 'Live shows and performances'),
        ('merchandise', 'Merchandise and products'),
        ('multiple', 'Multiple revenue streams')
    ])
    
    # Cluster preferences
    preferred_clusters = SelectField('Which content clusters appeal to you most?', choices=[
        (cluster.value, cluster.value.replace('_', ' ').title()) 
        for cluster in ClusterType
    ])
    
    # Communication preferences
    tutorial_frequency = SelectField('How much guidance do you want during setup?', choices=[
        ('minimal', 'Minimal - just show me the essentials'),
        ('normal', 'Normal - balanced guidance'),
        ('detailed', 'Detailed - comprehensive step-by-step help')
    ], validators=[DataRequired()])
    
    # Hidden fields for forensic data
    ip_address = HiddenField()
    user_agent = HiddenField()
    device_fingerprint = HiddenField()
    geolocation = HiddenField()

class DocumentUploadForm(FlaskForm):
    document_type = SelectField('Document Type', choices=[
        (DocumentType.GOV_ID.value, 'Government Issued ID'),
        (DocumentType.SELFIE.value, 'Selfie/Liveness Photo'),
        (DocumentType.W9_W8BEN.value, 'W-9 or W-8BEN Tax Form'),
        (DocumentType.ADDRESS_PROOF.value, 'Address Verification Document'),
        (DocumentType.CONTRACTS.value, 'Signed Contracts')
    ], validators=[DataRequired()])
    
    document_file = FileField('Upload Document', validators=[
        FileRequired(),
        FileAllowed(['jpg', 'jpeg', 'png', 'pdf', 'gif'], 'Only image files (JPG, PNG, GIF) and PDF files are allowed')
    ])
    
    notes = TextAreaField('Notes (Optional)', validators=[Length(max=500)])

class ClusterSelectionForm(FlaskForm):
    selected_clusters = SelectField('Available Clusters', choices=[
        (ClusterType.BOYFANZ.value, 'BoyFanz - Male-focused content'),
        (ClusterType.GIRLFANZ.value, 'GirlFanz - Female-focused content'),
        (ClusterType.PUPFANZ.value, 'PupFanz - Pet play community'),
        (ClusterType.TRANZFANZ.value, 'TranzFanz - Trans community'),
        (ClusterType.TABOOFANZ.value, 'TabooFanz - Alternative content'),
        (ClusterType.DADDYFANZ.value, 'DaddyFanz - DDLG community'),
        (ClusterType.ALLMYFANZ.value, 'AllMyFanz - General content'),
        (ClusterType.RECOVERYFANZ.value, 'RecoveryFanz - Recovery support'),
        (ClusterType.FANZTUBE.value, 'FanzTube - Video platform'),
        (ClusterType.FANZVARSITY.value, 'FanzVarsity - Educational content'),
        (ClusterType.FANZWORK.value, 'FanzWork - Freelance marketplace'),
        (ClusterType.FANZFLUENCE.value, 'FanzFluence - Social marketing'),
        (ClusterType.FANZVIP.value, 'FanzVIP - Premium membership'),
        (ClusterType.FANZAI.value, 'FanzAI - AI-powered tools')
    ], validators=[DataRequired()])
    
    enable_cross_posting = BooleanField('Enable cross-posting across selected clusters')

class SceneCreationForm(FlaskForm):
    title = StringField('Scene Title', validators=[DataRequired(), Length(max=255)])
    description = TextAreaField('Description', validators=[Length(max=1000)])
    content_type = SelectField('Content Type', choices=[
        ('photo', 'Photo Set'),
        ('video', 'Video Content'),
        ('live', 'Live Stream')
    ], validators=[DataRequired()])
    
    participants = StringField('Co-star Usernames (comma-separated)', validators=[Length(max=500)])

class ConsentForm(FlaskForm):
    scene_id = HiddenField('Scene ID', validators=[DataRequired()])
    consent_agreement = BooleanField('I consent to participate in this scene and confirm all legal requirements are met', validators=[DataRequired()])
    role_in_scene = SelectField('My Role', choices=[
        ('performer', 'Primary Performer'),
        ('cameo', 'Cameo Appearance'),
        ('voice', 'Voice Only')
    ], validators=[DataRequired()])

class QuarantineForm(FlaskForm):
    content_type = SelectField('Content Type', choices=[
        ('scene', 'Scene'),
        ('document', 'Document'),
        ('message', 'Message')
    ], validators=[DataRequired()])
    content_id = StringField('Content ID', validators=[DataRequired()])
    reason = TextAreaField('Quarantine Reason', validators=[DataRequired(), Length(max=255)])

class VerifyMyWebhookForm(FlaskForm):
    session_id = StringField('Session ID', validators=[DataRequired()])
    status = StringField('Status', validators=[DataRequired()])
    result_data = TextAreaField('Result Data')
