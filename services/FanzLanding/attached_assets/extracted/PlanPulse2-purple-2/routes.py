import os
import json
import logging
from datetime import datetime
from functools import wraps
from flask import render_template, request, redirect, url_for, flash, jsonify, send_file
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.utils import secure_filename
from app import app, db
from models import *
from forms import *
from utils import *
import hashlib
from PIL import Image
import uuid

# Configure logging
logger = logging.getLogger(__name__)

# Role-based access decorator
def require_role(*required_roles):
    """Decorator to require specific user roles."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                return redirect(url_for('login'))
            
            if current_user.role not in required_roles:
                flash('You do not have permission to access this page.', 'error')
                return redirect(url_for('index'))
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Landing page
@app.route('/')
def index():
    """Main landing page - redirect authenticated users to portal"""
    if current_user.is_authenticated:
        return redirect(url_for('portal'))
    return render_template('index.html')

@app.route('/about')
def about():
    """Detailed platform information and features page"""
    return render_template('about.html')

# Authentication routes
@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user and user.check_password(form.password.data):
            login_user(user, remember=form.remember_me.data)
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            # Create audit event
            client_info = get_client_info()
            audit_event = AuditEvent()
            audit_event.user_id = user.id
            audit_event.event_type = 'user_login'
            audit_event.event_description = f'User {user.username} logged in'
            audit_event.ip_address = client_info['ip_address']
            audit_event.user_agent = client_info['user_agent']
            audit_event.event_hash = create_audit_event_hash({
                'user_id': user.id,
                'event': 'login',
                **client_info
            })
            db.session.add(audit_event)
            db.session.commit()
            
            next_page = request.args.get('next')
            return redirect(get_safe_redirect_url(next_page, 'portal'))
        flash('Invalid username or password', 'error')
    
    return render_template('auth/login.html', form=form)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    form = RegisterForm()
    if form.validate_on_submit():
        client_info = get_client_info()
        
        user = User()
        user.username = form.username.data
        user.email = form.email.data
        user.first_name = form.first_name.data
        user.last_name = form.last_name.data
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        
        # Create audit event
        audit_event = AuditEvent()
        audit_event.user_id = user.id
        audit_event.event_type = 'user_registration'
        audit_event.event_description = f'User {user.username} registered'
        audit_event.ip_address = client_info['ip_address']
        audit_event.user_agent = client_info['user_agent']
        audit_event.event_hash = create_audit_event_hash({
            'user_id': user.id,
            'event': 'registration',
            **client_info
        })
        db.session.add(audit_event)
        db.session.commit()
        
        flash('Registration successful! Please select your role.', 'success')
        login_user(user)
        return redirect(url_for('role_selection'))
    
    return render_template('auth/register.html', form=form)

@app.route('/role-selection', methods=['GET', 'POST'])
@login_required
def role_selection():
    if current_user.role != UserRole.FAN:  # Default role
        return redirect(url_for('dashboard'))
    
    form = RoleSelectionForm()
    if form.validate_on_submit():
        current_user.role = UserRole(form.role.data)
        db.session.commit()
        
        flash(f'Role selected: {current_user.role.value.title()}', 'success')
        
        # Redirect based on role requirements
        if current_user.role == UserRole.STAR:
            return redirect(url_for('kyc_form'))
        else:
            return redirect(url_for('cluster_selection'))
    
    return render_template('auth/role_selection.html', form=form)

@app.route('/logout')
@login_required
def logout():
    # Create audit event
    client_info = get_client_info()
    audit_event = AuditEvent()
    audit_event.user_id = current_user.id
    audit_event.event_type = 'user_logout'
    audit_event.event_description = f'User {current_user.username} logged out'
    audit_event.ip_address = client_info['ip_address']
    audit_event.user_agent = client_info['user_agent']
    audit_event.event_hash = create_audit_event_hash({
        'user_id': current_user.id,
        'event': 'logout',
        **client_info
    })
    db.session.add(audit_event)
    db.session.commit()
    
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

# Compliance routes
@app.route('/kyc-form', methods=['GET', 'POST'])
@login_required
def kyc_form():
    form = KYCForm()
    if form.validate_on_submit():
        client_info = get_client_info()
        
        # Update user profile
        current_user.first_name = form.first_name.data
        current_user.last_name = form.last_name.data
        
        # Create verification record
        verification = Verification()
        verification.user_id = current_user.id
        verification.verification_type = 'kyc_form'
        verification.status = VerificationStatus.PENDING
        db.session.add(verification)
        
        # Create audit event
        audit_event = AuditEvent()
        audit_event.user_id = current_user.id
        audit_event.event_type = 'kyc_form_submitted'
        audit_event.event_description = f'KYC form submitted by {current_user.username}'
        audit_event.ip_address = client_info['ip_address']
        audit_event.user_agent = client_info['user_agent']
        audit_event.event_hash = create_audit_event_hash({
            'user_id': current_user.id,
            'event': 'kyc_submission',
            **client_info
        })
        db.session.add(audit_event)
        db.session.commit()
        
        flash('KYC information submitted successfully!', 'success')
        return redirect(url_for('document_upload'))
    
    return render_template('compliance/kyc_form.html', form=form)

@app.route('/compliance/star-consent-form', methods=['GET', 'POST'])
@login_required
@require_role(UserRole.STAR, UserRole.ADMIN, UserRole.EXEC)
def star_consent_form():
    """STAR Consent Form for adult content creation"""
    form = ConsentForm()
    
    if form.validate_on_submit():
        # Create consent record
        consent_record = ConsentRecord()
        consent_record.user_id = current_user.id
        consent_record.creator_name = request.form.get('creator_name')
        consent_record.creator_stage_name = request.form.get('creator_stage_name')
        consent_record.creator_email = request.form.get('creator_email')
        consent_record.creator_id_type = request.form.get('creator_id_type')
        consent_record.creator_id_number = request.form.get('creator_id_number')
        consent_record.creator_id_state_country = request.form.get('creator_id_state_country')
        consent_record.creator_dob = datetime.strptime(request.form.get('creator_dob'), '%Y-%m-%d').date()
        consent_record.compensation_terms = request.form.get('compensation_terms')
        consent_record.digital_signature = request.form.get('digital_signature')
        consent_record.consent_timestamp = datetime.utcnow()
        
        # Handle co-star information if provided
        costar_name = request.form.get('costar_name')
        if costar_name:
            consent_record.costar_name = costar_name
            consent_record.costar_stage_name = request.form.get('costar_stage_name')
            consent_record.costar_email = request.form.get('costar_email')
            costar_dob = request.form.get('costar_dob')
            if costar_dob:
                consent_record.costar_dob = datetime.strptime(costar_dob, '%Y-%m-%d').date()
        
        # Handle file uploads
        creator_id_file = request.files.get('creator_id_picture')
        if creator_id_file and creator_id_file.filename:
            filename = secure_filename(f"creator_id_{uuid.uuid4().hex}_{creator_id_file.filename}")
            upload_folder = app.config.get('UPLOAD_FOLDER', 'uploads')
            if not os.path.exists(upload_folder):
                os.makedirs(upload_folder)
            file_path = os.path.join(upload_folder, filename)
            creator_id_file.save(file_path)
            consent_record.creator_id_file_path = filename
        
        costar_id_file = request.files.get('costar_id_picture')
        if costar_id_file and costar_id_file.filename:
            filename = secure_filename(f"costar_id_{uuid.uuid4().hex}_{costar_id_file.filename}")
            upload_folder = app.config.get('UPLOAD_FOLDER', 'uploads')
            if not os.path.exists(upload_folder):
                os.makedirs(upload_folder)
            file_path = os.path.join(upload_folder, filename)
            costar_id_file.save(file_path)
            consent_record.costar_id_file_path = filename
        
        # Create audit event
        client_info = get_client_info()
        audit_event = AuditEvent()
        audit_event.user_id = current_user.id
        audit_event.event_type = 'consent_form_submitted'
        audit_event.event_description = f'STAR consent form submitted by {current_user.username}'
        audit_event.ip_address = client_info['ip_address']
        audit_event.user_agent = client_info['user_agent']
        audit_event.forensic_data = json.dumps({
            'consent_type': 'star_consent',
            'creator_name': consent_record.creator_name,
            'has_costar': bool(costar_name),
            'form_hash': hashlib.sha256(str(consent_record.__dict__).encode()).hexdigest()
        })
        audit_event.event_hash = create_audit_event_hash({
            'user_id': current_user.id,
            'event': 'star_consent_submission',
            **client_info
        })
        
        db.session.add(consent_record)
        db.session.add(audit_event)
        db.session.commit()
        
        flash('STAR Consent Form submitted successfully! Your form is now under review.', 'success')
        return redirect(url_for('dashboard'))
    
    # Pass current time for date field
    current_time = datetime.utcnow()
    return render_template('compliance/star_consent_form.html', form=form, current_time=current_time)

@app.route('/document-upload', methods=['GET', 'POST'])
@login_required
def document_upload():
    form = DocumentUploadForm()
    if form.validate_on_submit():
        if 'document_file' not in request.files:
            flash('No file selected', 'error')
            return redirect(url_for('document_upload'))
        
        file = request.files['document_file']
        if file.filename == '':
            flash('No file selected', 'error')
            return redirect(url_for('document_upload'))
        
        if file and allowed_file(file.filename):
            client_info = get_client_info()
            
            # Generate secure filename
            filename = generate_secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            # Calculate file hash
            file_hash = calculate_file_hash(file_path)
            
            # Create document record
            document = Document()
            document.user_id = current_user.id
            document.document_type = DocumentType(form.document_type.data)
            document.filename = filename
            document.original_filename = file.filename
            document.file_path = file_path
            document.file_size = os.path.getsize(file_path)
            document.file_hash = file_hash
            document.ip_address = client_info['ip_address']
            document.user_agent = client_info['user_agent']
            document.device_fingerprint = client_info['device_fingerprint']
            document.geolocation = client_info['geolocation']
            
            if form.notes.data:
                document.notes = form.notes.data
            
            db.session.add(document)
            
            # Create audit event
            audit_event = AuditEvent()
            audit_event.user_id = current_user.id
            audit_event.event_type = 'document_uploaded'
            audit_event.event_description = f'Document uploaded: {document.document_type.value}'
            audit_event.resource_type = 'document'
            audit_event.resource_id = document.id
            audit_event.ip_address = client_info['ip_address']
            audit_event.user_agent = client_info['user_agent']
            audit_event.event_hash = create_audit_event_hash({
                'user_id': current_user.id,
                'document_type': document.document_type.value,
                'file_hash': file_hash,
                **client_info
            })
            db.session.add(audit_event)
            db.session.commit()
            
            flash(f'{document.document_type.value} uploaded successfully!', 'success')
            
            # Initiate VerifyMy verification for identity documents
            if document.document_type in [DocumentType.GOV_ID, DocumentType.SELFIE]:
                verifymy_result = initiate_verifymy_session(current_user.id)
                if 'error' not in verifymy_result:
                    verification = Verification()
                    verification.user_id = current_user.id
                    verification.verification_type = 'identity'
                    verification.verifymy_session_id = verifymy_result.get('session_id')
                    verification.status = VerificationStatus.PENDING
                    db.session.add(verification)
                    db.session.commit()
                    flash('Identity verification initiated with VerifyMy', 'info')
            
            return redirect(url_for('verification_status'))
    
    return render_template('compliance/document_upload.html', form=form)

@app.route('/verification-status')
@login_required
def verification_status():
    documents = Document.query.filter_by(user_id=current_user.id).all()
    verifications = Verification.query.filter_by(user_id=current_user.id).all()
    
    # Check if compliance is complete
    is_complete = current_user.is_compliance_complete()
    
    return render_template('compliance/verification_status.html', 
                         documents=documents, 
                         verifications=verifications,
                         is_complete=is_complete)

# Cluster management
@app.route('/cluster-selection', methods=['GET', 'POST'])
@login_required
def cluster_selection():
    form = ClusterSelectionForm()
    
    if form.validate_on_submit():
        cluster_type = ClusterType(form.selected_clusters.data)
        
        # Check if membership already exists
        existing_membership = ClusterMembership.query.filter_by(
            user_id=current_user.id,
            cluster_type=cluster_type
        ).first()
        
        if not existing_membership:
            membership = ClusterMembership(
                user_id=current_user.id,
                cluster_type=cluster_type,
                can_cross_post=form.enable_cross_posting.data
            )
            db.session.add(membership)
            db.session.commit()
            
            flash(f'Successfully joined {cluster_type.value}!', 'success')
        else:
            flash(f'Already a member of {cluster_type.value}', 'info')
        
        return redirect(url_for('dashboard'))
    
    # Get current memberships
    memberships = ClusterMembership.query.filter_by(
        user_id=current_user.id,
        is_active=True
    ).all()
    
    return render_template('clusters/cluster_selection.html', 
                         form=form, 
                         memberships=memberships)

# Dashboard routes
@app.route('/portal')
@login_required
def portal():
    """Platform gateway portal - main hub for accessing all platforms"""
    return render_template('portal.html')

@app.route('/dashboard')
@login_required
def dashboard():
    """Main dashboard - redirect to portal for streamlined experience"""
    return redirect(url_for('portal'))

@app.route('/dashboard/legacy')
@login_required
def dashboard_legacy():
    """Legacy dashboard - route to appropriate dashboard based on role"""
    if current_user.role == UserRole.FAN:
        return redirect(url_for('fan_dashboard'))
    elif current_user.role == UserRole.STAR:
        return redirect(url_for('star_dashboard'))
    elif current_user.role == UserRole.ADMIN:
        return redirect(url_for('admin_dashboard'))
    elif current_user.role == UserRole.EXEC:
        return redirect(url_for('exec_dashboard'))
    else:
        return redirect(url_for('fan_dashboard'))

@app.route('/fan-dashboard')
@login_required
def fan_dashboard():
    memberships = ClusterMembership.query.filter_by(
        user_id=current_user.id,
        is_active=True
    ).all()
    
    return render_template('dashboards/fan_dashboard.html', 
                         memberships=memberships)

@app.route('/star-dashboard')
@login_required
def star_dashboard():
    if current_user.role != UserRole.STAR:
        flash('Access denied', 'error')
        return redirect(url_for('dashboard'))
    
    scenes = Scene.query.filter_by(creator_id=current_user.id).all()
    memberships = ClusterMembership.query.filter_by(
        user_id=current_user.id,
        is_active=True
    ).all()
    
    # Check compliance status
    compliance_complete = current_user.is_compliance_complete()
    
    return render_template('dashboards/star_dashboard.html', 
                         scenes=scenes,
                         memberships=memberships,
                         compliance_complete=compliance_complete)

@app.route('/admin-dashboard')
@login_required
def admin_dashboard():
    if current_user.role not in [UserRole.ADMIN, UserRole.EXEC]:
        flash('Access denied', 'error')
        return redirect(url_for('dashboard'))
    
    # Get verification queue
    pending_documents = Document.query.filter_by(
        status=VerificationStatus.PENDING
    ).limit(10).all()
    
    pending_verifications = Verification.query.filter_by(
        status=VerificationStatus.PENDING
    ).limit(10).all()
    
    # Get recent audit events
    recent_events = AuditEvent.query.order_by(
        AuditEvent.created_at.desc()
    ).limit(20).all()
    
    return render_template('dashboards/admin_dashboard.html',
                         pending_documents=pending_documents,
                         pending_verifications=pending_verifications,
                         recent_events=recent_events)

@app.route('/exec-dashboard')
@login_required
def exec_dashboard():
    if current_user.role != UserRole.EXEC:
        flash('Access denied', 'error')
        return redirect(url_for('dashboard'))
    
    # Get platform statistics
    total_users = User.query.count()
    verified_users = User.query.filter_by(is_verified=True).count()
    total_scenes = Scene.query.count()
    published_scenes = Scene.query.filter_by(is_published=True).count()
    
    # Get cluster statistics
    cluster_stats = []
    for cluster_type in ClusterType:
        member_count = ClusterMembership.query.filter_by(
            cluster_type=cluster_type,
            is_active=True
        ).count()
        cluster_stats.append({
            'name': cluster_type.value,
            'members': member_count
        })
    
    stats = {
        'total_users': total_users,
        'verified_users': verified_users,
        'total_scenes': total_scenes,
        'published_scenes': published_scenes,
        'verification_rate': (verified_users / total_users * 100) if total_users > 0 else 0,
        'cluster_stats': cluster_stats
    }
    
    return render_template('dashboards/exec_dashboard.html', stats=stats)

# Content management
@app.route('/create-scene', methods=['GET', 'POST'])
@login_required
def create_scene():
    if current_user.role != UserRole.STAR:
        flash('Only STARs can create scenes', 'error')
        return redirect(url_for('dashboard'))
    
    form = SceneCreationForm()
    if form.validate_on_submit():
        scene = Scene(
            creator_id=current_user.id,
            title=form.title.data,
            description=form.description.data,
            content_type=form.content_type.data
        )
        db.session.add(scene)
        db.session.flush()  # Get the scene ID
        
        # Add participants if specified
        if form.participants.data:
            participant_usernames = [u.strip() for u in form.participants.data.split(',')]
            for username in participant_usernames:
                user = User.query.filter_by(username=username).first()
                if user:
                    participant = SceneParticipant(
                        scene_id=scene.id,
                        user_id=user.id
                    )
                    db.session.add(participant)
        
        db.session.commit()
        flash('Scene created successfully!', 'success')
        return redirect(url_for('star_dashboard'))
    
    return render_template('media/upload_hub.html', form=form)

@app.route('/scene/<int:scene_id>/consent', methods=['GET', 'POST'])
@login_required
def scene_consent(scene_id):
    scene = Scene.query.get_or_404(scene_id)
    participant = SceneParticipant.query.filter_by(
        scene_id=scene_id,
        user_id=current_user.id
    ).first()
    
    if not participant:
        flash('You are not a participant in this scene', 'error')
        return redirect(url_for('dashboard'))
    
    form = ConsentForm()
    form.scene_id.data = scene_id
    
    if form.validate_on_submit():
        client_info = get_client_info()
        
        participant.has_consent = True
        participant.role = form.role_in_scene.data
        participant.consent_timestamp = datetime.utcnow()
        participant.consent_ip = client_info['ip_address']
        participant.consent_signature = f"Digital consent by {current_user.username}"
        
        # Create audit event
        audit_event = AuditEvent(
            user_id=current_user.id,
            event_type='scene_consent_given',
            event_description=f'Consent given for scene: {scene.title}',
            resource_type='scene',
            resource_id=scene.id,
            ip_address=client_info['ip_address'],
            user_agent=client_info['user_agent'],
            event_hash=create_audit_event_hash({
                'user_id': current_user.id,
                'scene_id': scene.id,
                'consent': True,
                **client_info
            })
        )
        db.session.add(audit_event)
        db.session.commit()
        
        # Check if scene is ready for publishing
        is_ready, message = check_content_readiness(scene)
        scene.can_publish = is_ready
        db.session.commit()
        
        flash('Consent recorded successfully!', 'success')
        return redirect(url_for('dashboard'))
    
    return render_template('compliance/consent_form.html', 
                         form=form, 
                         scene=scene, 
                         participant=participant)

# Security and moderation
@app.route('/security-dashboard')
@login_required
def security_dashboard():
    if current_user.role not in [UserRole.ADMIN, UserRole.MODERATOR, UserRole.EXEC]:
        flash('Access denied', 'error')
        return redirect(url_for('dashboard'))
    
    # Get quarantined content
    quarantined_content = ContentQuarantine.query.filter_by(
        is_active=True
    ).limit(20).all()
    
    # Get verification queue
    verification_queue = {
        'pending': Document.query.filter_by(status=VerificationStatus.PENDING).count(),
        'needs_fix': Document.query.filter_by(status=VerificationStatus.NEEDS_FIX).count()
    }
    
    return render_template('security/security_dashboard.html',
                         quarantined_content=quarantined_content,
                         verification_queue=verification_queue)

@app.route('/quarantine-content', methods=['POST'])
@login_required
def quarantine_content_route():
    if current_user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        flash('Access denied', 'error')
        return redirect(url_for('dashboard'))
    
    form = QuarantineForm()
    if form.validate_on_submit():
        success = quarantine_content(
            form.content_type.data,
            int(form.content_id.data),
            form.reason.data,
            current_user.id
        )
        
        if success:
            flash('Content quarantined successfully', 'success')
        else:
            flash('Failed to quarantine content', 'error')
    
    return redirect(url_for('security_dashboard'))

@app.route('/approve-document/<int:document_id>')
@login_required
def approve_document(document_id):
    if current_user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        flash('Access denied', 'error')
        return redirect(url_for('dashboard'))
    
    document = Document.query.get_or_404(document_id)
    document.status = VerificationStatus.APPROVED
    document.verified_at = datetime.utcnow()
    
    # Check if user should be marked as verified
    if document.user.is_compliance_complete():
        document.user.is_verified = True
        document.user.verification_status = VerificationStatus.APPROVED
    
    # Create audit event
    client_info = get_client_info()
    audit_event = AuditEvent(
        user_id=current_user.id,
        event_type='document_approved',
        event_description=f'Document approved: {document.document_type.value} for user {document.user.username}',
        resource_type='document',
        resource_id=document.id,
        ip_address=client_info['ip_address'],
        user_agent=client_info['user_agent'],
        event_hash=create_audit_event_hash({
            'moderator_id': current_user.id,
            'document_id': document.id,
            'action': 'approved',
            **client_info
        })
    )
    db.session.add(audit_event)
    db.session.commit()
    
    flash('Document approved successfully', 'success')
    return redirect(url_for('admin_dashboard'))

@app.route('/deny-document/<int:document_id>')
@login_required
def deny_document(document_id):
    if current_user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
        flash('Access denied', 'error')
        return redirect(url_for('dashboard'))
    
    document = Document.query.get_or_404(document_id)
    document.status = VerificationStatus.DENIED
    
    # Create audit event
    client_info = get_client_info()
    audit_event = AuditEvent(
        user_id=current_user.id,
        event_type='document_denied',
        event_description=f'Document denied: {document.document_type.value} for user {document.user.username}',
        resource_type='document',
        resource_id=document.id,
        ip_address=client_info['ip_address'],
        user_agent=client_info['user_agent'],
        event_hash=create_audit_event_hash({
            'moderator_id': current_user.id,
            'document_id': document.id,
            'action': 'denied',
            **client_info
        })
    )
    db.session.add(audit_event)
    db.session.commit()
    
    flash('Document denied', 'warning')
    return redirect(url_for('admin_dashboard'))

# Export and compliance
@app.route('/export-compliance/<int:user_id>')
@login_required
def export_compliance(user_id):
    if current_user.role not in [UserRole.ADMIN, UserRole.EXEC]:
        flash('Access denied', 'error')
        return redirect(url_for('dashboard'))
    
    export_data = create_compliance_export(user_id, 'admin_export')
    if not export_data:
        flash('User not found', 'error')
        return redirect(url_for('admin_dashboard'))
    
    # Create audit event
    client_info = get_client_info()
    audit_event = AuditEvent(
        user_id=current_user.id,
        event_type='compliance_export',
        event_description=f'Compliance data exported for user ID {user_id}',
        resource_type='user',
        resource_id=user_id,
        ip_address=client_info['ip_address'],
        user_agent=client_info['user_agent'],
        event_hash=create_audit_event_hash({
            'admin_id': current_user.id,
            'exported_user_id': user_id,
            'export_type': 'admin_export',
            **client_info
        })
    )
    db.session.add(audit_event)
    db.session.commit()
    
    return jsonify(export_data)

# API endpoints
@app.route('/api/verifymy/webhook', methods=['POST'])
def verifymy_webhook():
    """Handle VerifyMy webhook responses"""
    webhook_data = request.get_json()
    
    if not webhook_data:
        return jsonify({'error': 'No data received'}), 400
    
    result = process_verifymy_webhook(webhook_data)
    
    if 'error' in result:
        return jsonify(result), 400
    
    # Update verification record
    verification = Verification.query.filter_by(
        verifymy_session_id=result['session_id']
    ).first()
    
    if verification:
        verification.verifymy_status = result['status']
        verification.verifymy_result = result['verification_result']
        verification.confidence_score = result.get('confidence_score')
        verification.completed_at = datetime.utcnow()
        
        # Update status based on VerifyMy result
        if result['status'] == 'approved':
            verification.status = VerificationStatus.APPROVED
            # Check if user should be marked as verified
            if verification.user.is_compliance_complete():
                verification.user.is_verified = True
                verification.user.verification_status = VerificationStatus.APPROVED
        else:
            verification.status = VerificationStatus.DENIED
        
        db.session.commit()
    
    return jsonify({'status': 'processed'})

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return render_template('errors/404.html'), 404

@app.errorhandler(403)
def forbidden_error(error):
    return render_template('errors/403.html'), 403

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return render_template('errors/500.html'), 500

# Context processors for templates
@app.context_processor
def inject_user():
    return dict(current_user=current_user)

@app.context_processor
def inject_enums():
    return dict(
        UserRole=UserRole,
        VerificationStatus=VerificationStatus,
        DocumentType=DocumentType,
        ClusterType=ClusterType
    )


# ===============================================
# API ROUTES FOR ADVANCED FEATURES
# ===============================================

@app.route('/api/scenes', methods=['POST'])
@login_required
@require_role(UserRole.STAR)
def api_create_scene():
    """API endpoint for creating scenes."""
    try:
        if not request.form.get('title') or not request.form.get('cluster'):
            return jsonify({'success': False, 'error': 'Title and cluster are required'})
        
        # Create new scene
        scene = Scene(
            title=request.form.get('title'),
            description=request.form.get('description', ''),
            cluster_type=ClusterType(request.form.get('cluster')),
            creator_id=current_user.id,
            tags=request.form.get('tags', '').split(',') if request.form.get('tags') else [],
            price=float(request.form.get('price', 0.0))
        )
        
        # Handle file uploads
        thumbnail = request.files.get('thumbnail')
        video = request.files.get('video')
        
        if thumbnail:
            thumbnail_filename = secure_filename(f"{scene.id}_thumb_{thumbnail.filename}")
            thumbnail_path = os.path.join('uploads/thumbnails', thumbnail_filename)
            thumbnail.save(thumbnail_path)
            scene.thumbnail_url = thumbnail_path
        
        if video:
            video_filename = secure_filename(f"{scene.id}_video_{video.filename}")
            video_path = os.path.join('uploads/videos', video_filename)
            video.save(video_path)
            scene.video_url = video_path
        
        db.session.add(scene)
        db.session.commit()
        
        return jsonify({'success': True, 'scene_id': scene.id})
        
    except Exception as e:
        logger.error(f"Error creating scene: {e}")
        return jsonify({'success': False, 'error': 'Failed to create scene'})


@app.route('/api/scenes/<scene_id>', methods=['DELETE'])
@login_required
@require_role(UserRole.STAR)
def api_delete_scene(scene_id):
    """API endpoint for deleting scenes."""
    try:
        scene = Scene.query.filter_by(id=scene_id, creator_id=current_user.id).first()
        if not scene:
            return jsonify({'success': False, 'error': 'Scene not found'})
        
        # Remove files if they exist
        if scene.thumbnail_url and os.path.exists(scene.thumbnail_url):
            os.remove(scene.thumbnail_url)
        if scene.video_url and os.path.exists(scene.video_url):
            os.remove(scene.video_url)
        
        db.session.delete(scene)
        db.session.commit()
        
        return jsonify({'success': True})
        
    except Exception as e:
        logger.error(f"Error deleting scene: {e}")
        return jsonify({'success': False, 'error': 'Failed to delete scene'})


@app.route('/api/analytics')
@login_required
@require_role(UserRole.STAR)
def api_analytics_data():
    """API endpoint for analytics data."""
    try:
        time_range = int(request.args.get('range', 30))
        
        # Mock analytics data - replace with real queries
        analytics_data = {
            'chart_labels': ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'],
            'revenue_data': [100, 150, 120, 200, 180],
            'views_data': [500, 750, 600, 1000, 900],
            'cluster_labels': ['GirlFanz', 'BoyFanz', 'PupFanz', 'TranzFanz'],
            'cluster_data': [45, 25, 15, 15],
            'metrics': {
                'total_revenue': 750,
                'total_views': 3750,
                'total_likes': 450,
                'unique_fans': 89,
                'revenue_change': 15.2,
                'views_change': 23.1,
                'engagement_change': 8.7,
                'fans_change': 12.3
            }
        }
        
        return jsonify(analytics_data)
        
    except Exception as e:
        logger.error(f"Error fetching analytics: {e}")
        return jsonify({'error': 'Failed to fetch analytics data'}), 500


@app.route('/api/moderation/<content_id>/<action>', methods=['POST'])
@login_required
@require_role(UserRole.ADMIN, UserRole.MODERATOR)
def api_moderation_action(content_id, action):
    """API endpoint for content moderation actions."""
    try:
        if action not in ['approve', 'reject', 'flag']:
            return jsonify({'success': False, 'error': 'Invalid action'})
        
        # Find the content item (this would be a real model in production)
        # For now, just return success
        
        return jsonify({'success': True, 'message': f'Content {action}d successfully'})
        
    except Exception as e:
        logger.error(f"Error performing moderation action: {e}")
        return jsonify({'success': False, 'error': 'Failed to perform action'})


@app.route('/api/moderation/settings', methods=['POST'])
@login_required
@require_role(UserRole.ADMIN)
def api_moderation_settings():
    """API endpoint for updating moderation settings."""
    try:
        settings = request.get_json()
        
        # Update moderation settings (mock implementation)
        # In production, save to database
        
        return jsonify({'success': True, 'message': 'Settings updated successfully'})
        
    except Exception as e:
        logger.error(f"Error updating moderation settings: {e}")
        return jsonify({'success': False, 'error': 'Failed to update settings'})


@app.route('/api/moderation/queue')
@login_required
@require_role(UserRole.ADMIN, UserRole.MODERATOR)
def api_moderation_queue():
    """API endpoint for fetching moderation queue."""
    try:
        # Mock queue data - replace with real database queries
        queue_data = {
            'queue': [
                {
                    'id': '1',
                    'title': 'Seductive Scene',
                    'creator': {'username': 'star_user'},
                    'status': 'pending',
                    'ai_score': 85,
                    'ai_flags': ['suggestive'],
                    'created_at': datetime.now(),
                    'type': 'video'
                }
            ]
        }
        
        return jsonify(queue_data)
        
    except Exception as e:
        logger.error(f"Error fetching moderation queue: {e}")
        return jsonify({'error': 'Failed to fetch queue'}), 500


# ===============================================
# ADVANCED FEATURE ROUTES
# ===============================================

@app.route('/scene-manager')
@login_required
@require_role(UserRole.STAR)
def scene_manager():
    """Advanced scene management interface."""
    scenes = Scene.query.filter_by(creator_id=current_user.id).order_by(Scene.created_at.desc()).all()
    
    return render_template('advanced/scene_manager.html', 
                         scenes=scenes,
                         total_scenes=len(scenes),
                         total_views=sum(s.views or 0 for s in scenes),
                         total_earnings=sum(s.earnings or 0 for s in scenes),
                         total_likes=sum(s.likes or 0 for s in scenes))


@app.route('/analytics-dashboard')
@login_required
@require_role(UserRole.STAR, UserRole.ADMIN)
def analytics_dashboard():
    """Comprehensive analytics dashboard."""
    # Mock data for template rendering
    analytics_data = {
        'total_revenue': 2450.75,
        'total_views': 15750,
        'total_likes': 1250,
        'unique_fans': 324,
        'revenue_change': 18.5,
        'views_change': 12.3,
        'engagement_change': 8.9,
        'fans_change': 15.2,
        'chart_labels': ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        'revenue_data': [500, 750, 650, 900],
        'views_data': [2000, 4000, 3500, 6250],
        'cluster_labels': ['GirlFanz', 'BoyFanz', 'PupFanz', 'TranzFanz', 'DaddyFanz'],
        'cluster_data': [35, 25, 15, 15, 10],
        'top_scenes': [
            {'title': 'Seductive Sunset', 'cluster': 'girlfanz', 'views': 2500, 'revenue': 450, 'engagement_rate': 85},
            {'title': 'Midnight Desires', 'cluster': 'boyfanz', 'views': 1800, 'revenue': 380, 'engagement_rate': 78},
            {'title': 'Forbidden Fantasy', 'cluster': 'taboofanz', 'views': 1200, 'revenue': 320, 'engagement_rate': 92}
        ],
        'top_fan': {'username': 'devoted_fan_69', 'engagement_score': 1250},
        'top_spender': {'username': 'premium_lover', 'total_spent': 850},
        'peak_hours': {'start': '8:00 PM', 'end': '11:00 PM', 'timezone': 'EST'},
        'top_region': {'name': 'North America', 'percentage': 45},
        'ai_insights': {
            'content_optimization': 'Your Friday evening posts receive 40% more engagement. Consider scheduling premium content during this time.',
            'engagement_tips': 'Fans respond most to personal messages and behind-the-scenes content. Increase these by 25%.',
            'revenue_forecast': 'Based on current trends, expect 22% revenue growth next month with consistent posting.'
        }
    }
    
    return render_template('advanced/analytics_dashboard.html', **analytics_data)


@app.route('/ai-moderation')
@login_required
@require_role(UserRole.ADMIN, UserRole.MODERATOR)
def ai_moderation():
    """AI-powered content moderation dashboard."""
    # Mock data for moderation dashboard
    moderation_data = {
        'ai_moderation_active': True,
        'approved_content': 1245,
        'pending_review': 23,
        'flagged_content': 12,
        'total_scanned': 1280,
        'approval_rate': 97.2,
        'avg_review_time': '2.5 min',
        'flag_accuracy': 89.5,
        'current_sensitivity': 7,
        'auto_approval_enabled': True,
        'auto_approval_threshold': 85,
        'model_accuracy': 94.2,
        'false_positives': 3.8,
        'false_negatives': 2.0,
        'last_training_date': '2025-08-28',
        'review_queue': [
            {
                'id': '1',
                'title': 'Steamy Shower Scene',
                'creator': type('obj', (object,), {'username': 'seductive_star'})(),
                'status': 'pending',
                'ai_score': 78,
                'ai_flags': ['nudity', 'suggestive'],
                'created_at': datetime.now(),
                'type': 'video',
                'thumbnail_url': '/static/img/placeholder.jpg'
            },
            {
                'id': '2',
                'title': 'Intimate Confession',
                'creator': type('obj', (object,), {'username': 'passionate_creator'})(),
                'status': 'flagged',
                'ai_score': 45,
                'ai_flags': ['explicit', 'adult'],
                'created_at': datetime.now() - timedelta(hours=2),
                'type': 'text'
            }
        ],
        'content_categories': [
            {'id': 1, 'name': 'Artistic Nudity', 'enabled': True},
            {'id': 2, 'name': 'Suggestive Content', 'enabled': True},
            {'id': 3, 'name': 'Adult Themes', 'enabled': True},
            {'id': 4, 'name': 'Explicit Content', 'enabled': False}
        ]
    }
    
    return render_template('advanced/ai_moderation.html', **moderation_data)

# =======================
# THEME MANAGEMENT SYSTEM
# =======================

@app.route('/admin/themes')
@login_required
def theme_manager():
    """Main theme management interface - Shopify/WordPress/Webflow style"""
    if current_user.role not in [UserRole.ADMIN, UserRole.EXEC]:
        flash('Access denied. Admin privileges required.', 'error')
        return redirect(url_for('dashboard'))
    
    themes = Theme.query.all()
    active_theme = Theme.query.filter_by(is_active=True).first()
    
    return render_template('admin/theme_manager.html', 
                         themes=themes, 
                         active_theme=active_theme)

@app.route('/admin/themes/editor/<int:theme_id>')
@login_required
def visual_theme_editor(theme_id):
    """Visual drag-and-drop theme editor - Webflow style"""
    if current_user.role not in [UserRole.ADMIN, UserRole.EXEC]:
        flash('Access denied. Admin privileges required.', 'error')
        return redirect(url_for('dashboard'))
    
    theme = Theme.query.get_or_404(theme_id)
    components = get_available_components()
    
    return render_template('admin/visual_editor.html', 
                         theme=theme, 
                         components=components)

@app.route('/admin/themes/create', methods=['GET', 'POST'])
@login_required
def create_theme():
    """Create new theme"""
    if current_user.role not in [UserRole.ADMIN, UserRole.EXEC]:
        flash('Access denied. Admin privileges required.', 'error')
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        data = request.get_json()
        
        theme = Theme()
        theme.name = data.get('name')
        theme.display_name = data.get('display_name')
        theme.description = data.get('description')
        theme.theme_type = ThemeType(data.get('theme_type', 'custom'))
        theme.created_by = current_user.id
        
        # Default configuration
        theme.color_config = {
            'primary': '#00D4FF',
            'secondary': '#FF007F',
            'accent': '#FFD700',
            'background': '#000000',
            'text_primary': '#ffffff',
            'text_secondary': '#e5e5e5'
        }
        
        theme.layout_config = {
            'container_width': '1200px',
            'sidebar_width': '250px',
            'header_height': '80px',
            'footer_height': '200px'
        }
        
        theme.animation_config = {
            'transitions': True,
            'hover_effects': True,
            'loading_animations': True
        }
        
        db.session.add(theme)
        db.session.commit()
        
        return jsonify({'success': True, 'theme_id': theme.id})
    
    return render_template('admin/create_theme.html')

@app.route('/admin/themes/<int:theme_id>/activate', methods=['POST'])
@login_required
def activate_theme(theme_id):
    """Activate a theme"""
    if current_user.role not in [UserRole.ADMIN, UserRole.EXEC]:
        return jsonify({'error': 'Access denied'}), 403
    
    # Deactivate all themes
    Theme.query.update({'is_active': False})
    
    # Activate selected theme
    theme = Theme.query.get_or_404(theme_id)
    theme.is_active = True
    
    db.session.commit()
    
    return jsonify({'success': True})

@app.route('/admin/themes/<int:theme_id>/upload-asset', methods=['POST'])
@login_required
def upload_theme_asset(theme_id):
    """Upload assets for theme (images, backgrounds, etc.)"""
    if current_user.role not in [UserRole.ADMIN, UserRole.EXEC]:
        return jsonify({'error': 'Access denied'}), 403
    
    theme = Theme.query.get_or_404(theme_id)
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename, ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp']):
        # Generate unique filename
        file_ext = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}.{file_ext}"
        
        # Create theme directory if it doesn't exist
        theme_dir = os.path.join('static', 'themes', str(theme_id))
        os.makedirs(theme_dir, exist_ok=True)
        
        file_path = os.path.join(theme_dir, unique_filename)
        file.save(file_path)
        
        # Get file info
        file_size = os.path.getsize(file_path)
        file_hash = get_file_hash(file_path)
        
        # Get image dimensions if it's an image
        width, height = None, None
        try:
            with Image.open(file_path) as img:
                width, height = img.size
        except:
            pass
        
        # Create asset record
        asset = ThemeAsset()
        asset.theme_id = theme_id
        asset.asset_type = AssetType(request.form.get('asset_type', 'background_image'))
        asset.name = request.form.get('name', file.filename)
        asset.filename = unique_filename
        asset.original_filename = file.filename
        asset.file_path = file_path
        asset.file_size = file_size
        asset.file_hash = file_hash
        asset.width = width
        asset.height = height
        asset.mime_type = file.content_type
        asset.css_selector = request.form.get('css_selector')
        asset.css_property = request.form.get('css_property', 'background-image')
        asset.uploaded_by = current_user.id
        
        db.session.add(asset)
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'asset_id': asset.id,
            'asset_url': asset.get_url(),
            'width': width,
            'height': height
        })
    
    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/admin/themes/marketplace')
@login_required
def theme_marketplace():
    """Theme marketplace - Shopify style theme store"""
    if current_user.role not in [UserRole.ADMIN, UserRole.EXEC]:
        flash('Access denied. Admin privileges required.', 'error')
        return redirect(url_for('dashboard'))
    
    # Get predefined themes
    predefined_themes = get_predefined_themes()
    user_themes = Theme.query.filter_by(created_by=current_user.id).all()
    
    return render_template('admin/theme_marketplace.html', 
                         predefined_themes=predefined_themes,
                         user_themes=user_themes)

@app.route('/api/themes/<int:theme_id>/css')
def get_theme_css(theme_id):
    """Generate dynamic CSS for theme"""
    theme = Theme.query.get_or_404(theme_id)
    css_content = generate_theme_css(theme)
    
    response = app.response_class(
        response=css_content,
        status=200,
        mimetype='text/css'
    )
    
    return response

def get_available_components():
    """Get available drag-and-drop components"""
    return [
        {'name': 'Header', 'type': 'header', 'icon': 'fas fa-heading'},
        {'name': 'Navigation', 'type': 'navigation', 'icon': 'fas fa-bars'},
        {'name': 'Hero Section', 'type': 'hero', 'icon': 'fas fa-star'},
        {'name': 'Text Block', 'type': 'text', 'icon': 'fas fa-paragraph'},
        {'name': 'Image', 'type': 'image', 'icon': 'fas fa-image'},
        {'name': 'Gallery', 'type': 'gallery', 'icon': 'fas fa-images'},
        {'name': 'Button', 'type': 'button', 'icon': 'fas fa-square'},
        {'name': 'Form', 'type': 'form', 'icon': 'fas fa-wpforms'},
        {'name': 'Footer', 'type': 'footer', 'icon': 'fas fa-grip-lines'},
        {'name': 'Social Links', 'type': 'social', 'icon': 'fas fa-share-alt'},
        {'name': 'Video', 'type': 'video', 'icon': 'fas fa-play'},
        {'name': 'Card Grid', 'type': 'card_grid', 'icon': 'fas fa-th'},
        {'name': 'Testimonial', 'type': 'testimonial', 'icon': 'fas fa-quote-left'},
        {'name': 'Pricing Table', 'type': 'pricing', 'icon': 'fas fa-table'},
        {'name': 'Contact Info', 'type': 'contact', 'icon': 'fas fa-address-card'}
    ]

def get_predefined_themes():
    """Get predefined theme templates"""
    return [
        {
            'name': 'Neon Cyberpunk',
            'description': 'Dark cyberpunk theme with neon effects',
            'preview_image': '/static/theme-previews/neon-cyberpunk.jpg',
            'config': {
                'color_config': {
                    'primary': '#00D4FF',
                    'secondary': '#FF007F', 
                    'accent': '#FFD700',
                    'background': '#000000',
                    'text_primary': '#ffffff',
                    'text_secondary': '#e5e5e5'
                }
            }
        },
        {
            'name': 'Galaxy Dreams',
            'description': 'Space-themed with cosmic gradients',
            'preview_image': '/static/theme-previews/galaxy.jpg',
            'config': {
                'color_config': {
                    'primary': '#6366f1',
                    'secondary': '#a855f7',
                    'accent': '#ec4899',
                    'background': '#0f0f23',
                    'text_primary': '#ffffff',
                    'text_secondary': '#d1d5db'
                }
            }
        },
        {
            'name': 'Retro Wave',
            'description': '80s inspired synthwave aesthetics',
            'preview_image': '/static/theme-previews/retro-wave.jpg',
            'config': {
                'color_config': {
                    'primary': '#ff0080',
                    'secondary': '#00ffff',
                    'accent': '#ffff00',
                    'background': '#120458',
                    'text_primary': '#ffffff',
                    'text_secondary': '#e5e5e5'
                }
            }
        }
    ]

def generate_theme_css(theme):
    """Generate dynamic CSS from theme configuration"""
    if not theme.color_config:
        return ""
    
    colors = theme.color_config
    layout = theme.layout_config or {}
    
    css = f"""
/* Dynamic Theme CSS - {theme.display_name} */
:root {{
    --primary: {colors.get('primary', '#00D4FF')};
    --secondary: {colors.get('secondary', '#FF007F')};
    --accent: {colors.get('accent', '#FFD700')};
    --background: {colors.get('background', '#000000')};
    --text-primary: {colors.get('text_primary', '#ffffff')};
    --text-secondary: {colors.get('text_secondary', '#e5e5e5')};
    
    --container-width: {layout.get('container_width', '1200px')};
    --sidebar-width: {layout.get('sidebar_width', '250px')};
    --header-height: {layout.get('header_height', '80px')};
    --footer-height: {layout.get('footer_height', '200px')};
}}

body {{
    background: var(--background);
    color: var(--text-primary);
}}

.btn-primary {{
    background: var(--primary);
    border-color: var(--primary);
}}

.btn-secondary {{
    background: var(--secondary);
    border-color: var(--secondary);
}}

/* Apply theme assets as backgrounds */
"""
    
    # Add asset-based CSS
    assets = ThemeAsset.query.filter_by(theme_id=theme.id, is_active=True).all()
    for asset in assets:
        if asset.css_selector and asset.css_property:
            css += f"""
{asset.css_selector} {{
    {asset.css_property}: url('{asset.get_url()}');
}}
"""
    
    return css

def allowed_file(filename, extensions):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in extensions

def get_file_hash(file_path):
    """Get SHA-256 hash of file"""
    hash_sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_sha256.update(chunk)
    return hash_sha256.hexdigest()

# API Routes for Onboarding System
@app.route('/api/onboarding/complete', methods=['POST'])
@login_required
def complete_onboarding():
    """Mark onboarding tour as completed for user"""
    try:
        data = request.get_json()
        tour_type = data.get('tour_type', 'initial')
        role = data.get('role', current_user.role.value)
        
        # Create audit event for onboarding completion
        client_info = get_client_info()
        audit_event = AuditEvent()
        audit_event.user_id = current_user.id
        audit_event.event_type = 'onboarding_completed'
        audit_event.event_description = f'User completed {tour_type} onboarding tour for role {role}'
        audit_event.ip_address = client_info['ip_address']
        audit_event.user_agent = client_info['user_agent']
        audit_event.event_hash = create_audit_event_hash({
            'user_id': current_user.id,
            'event': 'onboarding_completed',
            'tour_type': tour_type,
            'role': role,
            **client_info
        })
        db.session.add(audit_event)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Onboarding completed'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analytics/track', methods=['POST'])
@login_required
def track_analytics_event():
    """Track user analytics events for onboarding and interactions"""
    try:
        data = request.get_json()
        event_type = data.get('event')
        event_data = data.get('data', {})
        timestamp = data.get('timestamp')
        
        # Create audit event for analytics tracking
        client_info = get_client_info()
        audit_event = AuditEvent()
        audit_event.user_id = current_user.id
        audit_event.event_type = f'analytics_{event_type}'
        audit_event.event_description = f'Analytics event: {event_type}'
        audit_event.ip_address = client_info['ip_address']
        audit_event.user_agent = client_info['user_agent']
        audit_event.event_hash = create_audit_event_hash({
            'user_id': current_user.id,
            'event': event_type,
            'data': event_data,
            'timestamp': timestamp,
            **client_info
        })
        db.session.add(audit_event)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Event tracked'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/onboarding/status')
@login_required
def get_onboarding_status():
    """Get onboarding completion status for current user"""
    try:
        # Check if user has completed onboarding based on audit events
        completed_events = AuditEvent.query.filter_by(
            user_id=current_user.id,
            event_type='onboarding_completed'
        ).all()
        
        completed_tours = []
        for event in completed_events:
            # Extract tour type from description if available
            tour_type = 'initial'  # default
            if 'initial' in event.event_description:
                tour_type = 'initial'
            elif 'advanced' in event.event_description:
                tour_type = 'advanced'
            
            completed_tours.append({
                'tour_type': tour_type,
                'completed_at': event.created_at.isoformat(),
                'role': current_user.role.value
            })
        
        return jsonify({
            'user_id': current_user.id,
            'role': current_user.role.value,
            'completed_tours': completed_tours,
            'should_show_initial': len([t for t in completed_tours if t['tour_type'] == 'initial']) == 0
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Social Media Integration API Routes
@app.route('/api/social/accounts')
@login_required
def get_social_accounts():
    """Get user's connected social media accounts"""
    try:
        # For demo purposes, return sample data
        # In production, this would query a SocialAccount model
        sample_accounts = [
            {
                'platform': 'twitter',
                'username': '@creator_demo',
                'followers': 15420,
                'posts': 342,
                'lastSync': '2025-09-01T19:30:00Z',
                'is_verified': True
            },
            {
                'platform': 'instagram', 
                'username': 'creator.demo',
                'followers': 28750,
                'posts': 156,
                'lastSync': '2025-09-01T18:15:00Z',
                'is_verified': False
            }
        ]
        
        return jsonify({
            'success': True,
            'accounts': sample_accounts
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/social/oauth/url/<platform>')
@login_required
def get_oauth_url(platform):
    """Get OAuth authorization URL for social media platform"""
    try:
        # OAuth URLs for different platforms
        oauth_urls = {
            'twitter': 'https://api.twitter.com/oauth/authenticate',
            'instagram': 'https://api.instagram.com/oauth/authorize',
            'tiktok': 'https://www.tiktok.com/auth/authorize',
            'youtube': 'https://accounts.google.com/oauth2/v2/auth',
            'discord': 'https://discord.com/api/oauth2/authorize',
            'telegram': 'https://oauth.telegram.org/auth',
            'onlyfans': 'https://onlyfans.com/api/2/oauth/authorize',
            'fansly': 'https://fansly.com/oauth/authorize'
        }
        
        if platform not in oauth_urls:
            return jsonify({'error': 'Unsupported platform'}), 400
        
        # In production, you would:
        # 1. Generate state parameter for security
        # 2. Store state in session/database
        # 3. Build proper OAuth URL with client_id, redirect_uri, etc.
        
        # For demo purposes, return a mock URL
        auth_url = f"{oauth_urls[platform]}?client_id=demo&redirect_uri=http://localhost:5000/api/social/oauth/callback/{platform}&state=demo_state"
        
        return jsonify({
            'success': True,
            'auth_url': auth_url,
            'platform': platform
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/social/oauth/result/<platform>')
@login_required
def check_oauth_result(platform):
    """Check OAuth authorization result"""
    try:
        # In production, this would check the actual OAuth callback result
        # For demo purposes, simulate successful authorization
        
        demo_account_data = {
            'twitter': {
                'username': '@new_creator',
                'user_id': '123456789',
                'followers': 1250,
                'access_token': 'demo_token_twitter'
            },
            'instagram': {
                'username': 'new.creator',
                'user_id': '987654321', 
                'followers': 890,
                'access_token': 'demo_token_instagram'
            },
            'tiktok': {
                'username': 'newcreator',
                'user_id': '567890123',
                'followers': 2340,
                'access_token': 'demo_token_tiktok'
            }
        }
        
        if platform in demo_account_data:
            return jsonify({
                'success': True,
                'data': demo_account_data[platform]
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Platform authorization failed'
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/social/connect', methods=['POST'])
@login_required
def connect_social_account():
    """Complete social media account connection"""
    try:
        data = request.get_json()
        platform = data.get('platform')
        auth_data = data.get('auth_data', {})
        
        # In production, you would:
        # 1. Validate the auth_data
        # 2. Exchange authorization code for access token
        # 3. Fetch user profile from the platform API
        # 4. Store account data in SocialAccount model
        
        # Create audit event for social account connection
        client_info = get_client_info()
        audit_event = AuditEvent()
        audit_event.user_id = current_user.id
        audit_event.event_type = 'social_account_connected'
        audit_event.event_description = f'Connected {platform} account: {auth_data.get("username", "unknown")}'
        audit_event.ip_address = client_info['ip_address']
        audit_event.user_agent = client_info['user_agent']
        audit_event.event_hash = create_audit_event_hash({
            'user_id': current_user.id,
            'event': 'social_connect',
            'platform': platform,
            **client_info
        })
        db.session.add(audit_event)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'{platform.title()} account connected successfully',
            'username': auth_data.get('username', 'unknown'),
            'followers': auth_data.get('followers', 0),
            'posts': 0,
            'account_data': auth_data
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/social/disconnect', methods=['POST'])
@login_required
def disconnect_social_account():
    """Disconnect social media account"""
    try:
        data = request.get_json()
        platform = data.get('platform')
        
        # In production, you would:
        # 1. Revoke access tokens
        # 2. Delete SocialAccount record
        # 3. Clean up any cached data
        
        # Create audit event for social account disconnection
        client_info = get_client_info()
        audit_event = AuditEvent()
        audit_event.user_id = current_user.id
        audit_event.event_type = 'social_account_disconnected'
        audit_event.event_description = f'Disconnected {platform} account'
        audit_event.ip_address = client_info['ip_address']
        audit_event.user_agent = client_info['user_agent']
        audit_event.event_hash = create_audit_event_hash({
            'user_id': current_user.id,
            'event': 'social_disconnect',
            'platform': platform,
            **client_info
        })
        db.session.add(audit_event)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'{platform.title()} account disconnected'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/social/sync', methods=['POST'])
@login_required
def sync_social_account():
    """Sync data from social media platform"""
    try:
        data = request.get_json()
        platform = data.get('platform')
        
        # In production, you would:
        # 1. Use stored access tokens to fetch latest data
        # 2. Update follower counts, post counts, etc.
        # 3. Sync profile information
        # 4. Import recent posts/content
        
        # For demo, simulate updated data
        import random
        updated_data = {
            'followers': random.randint(1000, 50000),
            'posts': random.randint(50, 500),
            'profile_updated': True,
            'sync_timestamp': datetime.utcnow().isoformat()
        }
        
        # Create audit event for sync
        client_info = get_client_info()
        audit_event = AuditEvent()
        audit_event.user_id = current_user.id
        audit_event.event_type = 'social_account_synced'
        audit_event.event_description = f'Synced {platform} account data'
        audit_event.ip_address = client_info['ip_address']
        audit_event.user_agent = client_info['user_agent']
        audit_event.event_hash = create_audit_event_hash({
            'user_id': current_user.id,
            'event': 'social_sync',
            'platform': platform,
            **client_info
        })
        db.session.add(audit_event)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'updated_data': updated_data,
            'message': f'{platform.title()} account synced'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/social/cross-post', methods=['POST'])
@login_required
def cross_post_content():
    """Cross-post content to multiple social media platforms"""
    try:
        data = request.get_json()
        content = data.get('content', '')
        platforms = data.get('platforms', [])
        schedule_time = data.get('schedule_time')
        
        if not content or not platforms:
            return jsonify({'error': 'Content and platforms are required'}), 400
        
        # In production, you would:
        # 1. Validate content for each platform's requirements
        # 2. Format content appropriately for each platform
        # 3. Use platform APIs to post content
        # 4. Handle scheduling if specified
        # 5. Store post records for tracking
        
        # Create audit event for cross-posting
        client_info = get_client_info()
        audit_event = AuditEvent()
        audit_event.user_id = current_user.id
        audit_event.event_type = 'content_cross_posted'
        audit_event.event_description = f'Cross-posted content to {len(platforms)} platforms: {", ".join(platforms)}'
        audit_event.ip_address = client_info['ip_address']
        audit_event.user_agent = client_info['user_agent']
        audit_event.event_hash = create_audit_event_hash({
            'user_id': current_user.id,
            'event': 'cross_post',
            'platforms': platforms,
            'content_length': len(content),
            **client_info
        })
        db.session.add(audit_event)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Content posted to {len(platforms)} platforms',
            'platforms': platforms,
            'scheduled': bool(schedule_time)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# AI Dashboard Widget API Routes
@app.route('/api/ai/widgets/<widget_type>')
@login_required
def get_ai_widget_data(widget_type):
    """Get AI-powered widget data based on widget type"""
    try:
        # Simulate AI processing and return intelligent data
        # In production, this would integrate with actual AI/ML services
        
        widget_data = {
            'content-optimizer': {
                'recommendations': [
                    {
                        'type': 'posting_time',
                        'priority': 'high',
                        'title': 'Optimal posting time',
                        'description': 'Your audience is most active at 7-9 PM',
                        'impact': '34% engagement increase',
                        'action': 'schedule_post'
                    },
                    {
                        'type': 'hashtags',
                        'priority': 'medium', 
                        'title': 'Trending hashtags',
                        'description': 'Use #CreatorLife, #FanzLab',
                        'impact': '2.3K additional reach',
                        'action': 'apply_hashtags'
                    }
                ],
                'engagement_boost': 45
            },
            
            'audience-insights': {
                'demographics': {
                    'primary_age': '18-25',
                    'age_growth': '+12%',
                    'interests': ['Gaming', 'Art', 'Music', 'Fashion'],
                    'peak_hours': ['7 PM', '8 PM', '9 PM'],
                    'device_preference': 'mobile'
                },
                'activity_patterns': {
                    'best_days': ['Friday', 'Saturday', 'Sunday'],
                    'engagement_rate': '8.5%',
                    'retention_rate': '87%'
                }
            },
            
            'trending-topics': {
                'trends': [
                    {
                        'topic': 'VR Content Creation',
                        'status': 'hot',
                        'growth': '+156%',
                        'duration': '3 days',
                        'opportunity_score': 95
                    },
                    {
                        'topic': 'AI Art Collaboration', 
                        'status': 'rising',
                        'growth': '+89%',
                        'duration': '1 day',
                        'opportunity_score': 78
                    },
                    {
                        'topic': 'Interactive Stories',
                        'status': 'emerging',
                        'growth': '+34%',
                        'duration': '6 hours',
                        'opportunity_score': 62
                    }
                ]
            },
            
            'earnings-optimizer': {
                'revenue_suggestions': [
                    {
                        'type': 'pricing',
                        'current': '$10',
                        'suggested': '$15',
                        'reasoning': 'Similar creators earn 23% more',
                        'potential_increase': '+$340/mo'
                    },
                    {
                        'type': 'promotion',
                        'strategy': 'flash_sale',
                        'duration': '48 hours',
                        'reasoning': 'Your audience responds to urgency',
                        'potential_increase': '+$180/mo'
                    }
                ],
                'forecast': {
                    'current_month': 1240,
                    'next_month': 1760,
                    'confidence': '89%'
                }
            },
            
            'smart-scheduler': {
                'optimal_times': [
                    {
                        'time': '7:30 PM',
                        'audience_size': '2.1K',
                        'engagement_level': 'high',
                        'score': 95
                    },
                    {
                        'time': '9:15 PM',
                        'audience_size': '1.8K', 
                        'engagement_level': 'good',
                        'score': 82
                    },
                    {
                        'time': '11:00 PM',
                        'audience_size': '1.2K',
                        'engagement_level': 'decent',
                        'score': 68
                    }
                ],
                'auto_schedule_available': True
            },
            
            'performance-analytics': {
                'overall_score': 'A+',
                'metrics': {
                    'engagement': 95,
                    'growth': 88,
                    'retention': 92
                },
                'insights': [
                    {
                        'type': 'positive',
                        'message': 'Engagement up 23% this week',
                        'icon': 'arrow-up'
                    },
                    {
                        'type': 'achievement',
                        'message': 'Top 5% of creators in your category',
                        'icon': 'star'
                    }
                ]
            },
            
            'content-discovery': {
                'recommendations': [
                    {
                        'type': 'video',
                        'creator': '@ArtistAlice',
                        'title': 'Digital Art Tutorial Series',
                        'match_score': 97,
                        'tags': ['Art', 'Tutorial'],
                        'reason': 'Similar interests'
                    },
                    {
                        'type': 'stream',
                        'creator': '@GamerGuy',
                        'title': 'Late Night Gaming Session',
                        'match_score': 89,
                        'tags': ['Gaming', 'Live'],
                        'reason': 'Audience overlap'
                    }
                ]
            },
            
            'creator-recommendations': {
                'creators': [
                    {
                        'username': '@ArtisticAva',
                        'category': 'Digital Artist',
                        'followers': '12.5K',
                        'match_reasons': ['Similar interests', 'Art style'],
                        'match_score': 95
                    },
                    {
                        'username': '@MusicMaven',
                        'category': 'Music Producer', 
                        'followers': '8.2K',
                        'match_reasons': ['Audio content', 'Similar audience'],
                        'match_score': 87
                    }
                ]
            },
            
            'trending-creators': {
                'creators': [
                    {
                        'rank': 1,
                        'username': '@RisingTech',
                        'growth': '+2.1K followers',
                        'period': 'this week',
                        'growth_percentage': '+340%'
                    },
                    {
                        'rank': 2,
                        'username': '@NewArtist',
                        'growth': '+1.8K followers',
                        'period': 'this week', 
                        'growth_percentage': '+280%'
                    },
                    {
                        'rank': 3,
                        'username': '@FreshFace',
                        'growth': '+1.5K followers',
                        'period': 'this week',
                        'growth_percentage': '+220%'
                    }
                ]
            },
            
            'platform-insights': {
                'metrics': {
                    'active_users': '24.5K',
                    'user_growth': '+12%',
                    'revenue_growth': '+34%',
                    'engagement_rate': '7.8%'
                },
                'predictions': [
                    {
                        'metric': 'user_growth',
                        'prediction': '+25% acceleration next month',
                        'confidence': '87%'
                    }
                ]
            },
            
            'user-behavior': {
                'patterns': [
                    {
                        'pattern': 'Peak usage: 7-10 PM',
                        'icon': 'clock'
                    },
                    {
                        'pattern': '78% mobile users',
                        'icon': 'mobile'
                    },
                    {
                        'pattern': 'High engagement on video content',
                        'icon': 'heart'
                    }
                ],
                'metrics': {
                    'retention_rate': '87%',
                    'avg_session': '12m 34s',
                    'bounce_rate': '23%'
                }
            }
        }
        
        if widget_type not in widget_data:
            return jsonify({'error': 'Unknown widget type'}), 400
        
        # Create audit event for AI widget access
        client_info = get_client_info()
        audit_event = AuditEvent()
        audit_event.user_id = current_user.id
        audit_event.event_type = 'ai_widget_accessed'
        audit_event.event_description = f'Accessed AI widget: {widget_type}'
        audit_event.ip_address = client_info['ip_address']
        audit_event.user_agent = client_info['user_agent']
        audit_event.event_hash = create_audit_event_hash({
            'user_id': current_user.id,
            'event': 'ai_widget_access',
            'widget_type': widget_type,
            **client_info
        })
        db.session.add(audit_event)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'widget_type': widget_type,
            'data': widget_data[widget_type],
            'generated_at': datetime.utcnow().isoformat(),
            'ai_model': f'fanzlab-ai-{widget_type}-v2'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/recommendation/apply', methods=['POST'])
@login_required  
def apply_ai_recommendation():
    """Apply an AI recommendation action"""
    try:
        data = request.get_json()
        rec_type = data.get('type')
        rec_data = data.get('data', {})
        
        # In production, this would:
        # 1. Validate the recommendation
        # 2. Apply the suggested action (schedule post, update settings, etc.)
        # 3. Track the application and later measure effectiveness
        
        # Create audit event for recommendation application
        client_info = get_client_info()
        audit_event = AuditEvent()
        audit_event.user_id = current_user.id
        audit_event.event_type = 'ai_recommendation_applied'
        audit_event.event_description = f'Applied AI recommendation: {rec_type}'
        audit_event.ip_address = client_info['ip_address']
        audit_event.user_agent = client_info['user_agent']
        audit_event.event_hash = create_audit_event_hash({
            'user_id': current_user.id,
            'event': 'ai_recommendation_applied',
            'recommendation_type': rec_type,
            **client_info
        })
        db.session.add(audit_event)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'AI recommendation applied: {rec_type}',
            'applied_at': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =======================
# ONBOARDING ROUTES
# =======================

@app.route('/onboarding')
@login_required
def onboarding():
    """Enhanced onboarding page with role-specific tours"""
    # Get user's role for customized onboarding
    user_role = current_user.role.value if current_user.role else 'fan'
    
    return render_template('onboarding.html', user_role=user_role)

@app.route('/onboarding/survey')
@login_required
def onboarding_survey():
    """Personalized onboarding survey page"""
    from forms import PersonalizedOnboardingSurveyForm
    
    form = PersonalizedOnboardingSurveyForm()
    user_role = current_user.role.value if current_user.role else 'fan'
    
    return render_template('onboarding/personalized_survey.html', 
                         form=form, 
                         user_role=user_role)

@app.route('/onboarding/journey')
@login_required
def onboarding_journey():
    """Interactive personalized onboarding journey"""
    user_role = current_user.role.value if current_user.role else 'fan'
    
    return render_template('onboarding/interactive_journey.html', 
                         user_role=user_role)

# =======================
# ENHANCED PERSONALIZED ONBOARDING API
# =======================

@app.route('/api/onboarding/initialize', methods=['POST'])
@login_required
def initialize_personalized_onboarding():
    """Initialize personalized onboarding for the current user"""
    try:
        # Check if user already has onboarding progress
        progress = OnboardingProgress.query.filter_by(user_id=current_user.id).first()
        
        if not progress:
            # Create new onboarding progress
            progress = OnboardingProgress()
            progress.user_id = current_user.id
            progress.status = OnboardingStatus.NOT_STARTED
            db.session.add(progress)
        
        # Create user preferences if they don't exist
        preferences = UserPreferences.query.filter_by(user_id=current_user.id).first()
        if not preferences:
            preferences = UserPreferences()
            preferences.user_id = current_user.id
            db.session.add(preferences)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'progress': {
                'status': progress.status.value,
                'completion_percentage': progress.completion_percentage,
                'current_step': progress.current_step,
                'steps_completed': progress.steps_completed or [],
                'user_goals': progress.user_goals or [],
                'interests': progress.interests or [],
                'experience_level': progress.experience_level.value,
                'preferred_clusters': progress.preferred_clusters or []
            },
            'preferences': {
                'learning_style': preferences.learning_style,
                'time_availability': preferences.time_availability,
                'platform_familiarity': preferences.platform_familiarity,
                'tutorial_frequency': preferences.tutorial_frequency
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/onboarding/survey', methods=['POST'])
@login_required  
def process_onboarding_survey():
    """Process onboarding survey responses and generate personalized journey"""
    try:
        data = request.get_json()
        
        # Get or create onboarding progress
        progress = OnboardingProgress.query.filter_by(user_id=current_user.id).first()
        if not progress:
            progress = OnboardingProgress()
            progress.user_id = current_user.id
            db.session.add(progress)
        
        # Get or create user preferences
        preferences = UserPreferences.query.filter_by(user_id=current_user.id).first()
        if not preferences:
            preferences = UserPreferences()
            preferences.user_id = current_user.id
            db.session.add(preferences)
        
        # Update progress with survey data
        if 'goals' in data:
            progress.user_goals = data['goals']
        if 'interests' in data:
            progress.interests = data['interests']
        if 'experience_level' in data:
            progress.experience_level = ExperienceLevel(data['experience_level'])
        if 'preferred_clusters' in data:
            progress.preferred_clusters = data['preferred_clusters']
        
        # Update preferences
        if 'learning_style' in data:
            preferences.learning_style = data['learning_style']
        if 'time_availability' in data:
            preferences.time_availability = data['time_availability']
        if 'platform_familiarity' in data:
            preferences.platform_familiarity = data['platform_familiarity']
        if 'tutorial_frequency' in data:
            preferences.tutorial_frequency = data['tutorial_frequency']
        if 'content_interests' in data:
            preferences.content_interests = data['content_interests']
        if 'content_creation_goals' in data:
            preferences.content_creation_goals = data['content_creation_goals']
        if 'monetization_preferences' in data:
            preferences.monetization_preferences = data['monetization_preferences']
        
        # Generate personalized journey
        journey = create_personalized_journey(current_user, progress, preferences)
        
        # Update progress status
        progress.status = OnboardingStatus.IN_PROGRESS
        progress.started_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'journey_id': journey.journey_id,
            'personalized_path': journey.steps_sequence,
            'total_steps': len(journey.steps_sequence),
            'current_step': journey.get_current_step().step_id if journey.get_current_step() else None,
            'personalization_factors': journey.personalization_factors
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/onboarding/step/<step_id>', methods=['GET'])
@login_required
def get_onboarding_step(step_id):
    """Get details for a specific onboarding step"""
    try:
        step = OnboardingStep.query.filter_by(step_id=step_id, active=True).first()
        if not step:
            return jsonify({'error': 'Step not found'}), 404
        
        # Get user preferences to customize step content
        preferences = UserPreferences.query.filter_by(user_id=current_user.id).first()
        
        # Check if step should be shown based on conditions
        if not step.evaluate_conditions(current_user, preferences):
            return jsonify({'error': 'Step not applicable for user'}), 403
        
        return jsonify({
            'success': True,
            'step': {
                'step_id': step.step_id,
                'title': step.title,
                'description': step.description,
                'step_type': step.step_type.value,
                'content': step.content,
                'required': step.required,
                'estimated_duration': step.estimated_duration,
                'role_specific': step.role_specific
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/onboarding/step/<step_id>/complete', methods=['POST'])
@login_required
def complete_onboarding_step(step_id):
    """Mark a specific onboarding step as completed"""
    try:
        data = request.get_json()
        
        # Get user's current journey
        journey = UserJourney.query.filter_by(
            user_id=current_user.id,
            status=OnboardingStatus.IN_PROGRESS
        ).first()
        
        if not journey:
            return jsonify({'error': 'No active onboarding journey found'}), 404
        
        # Get progress record
        progress = OnboardingProgress.query.filter_by(user_id=current_user.id).first()
        if not progress:
            return jsonify({'error': 'No onboarding progress found'}), 404
        
        # Add step to completed steps
        progress.add_completed_step(step_id)
        
        # Record time spent on step
        time_spent = data.get('time_spent', 0)
        journey.record_step_time(step_id, time_spent)
        
        # Record user feedback if provided
        if 'feedback' in data:
            if not journey.user_feedback:
                journey.user_feedback = {}
            journey.user_feedback[step_id] = data['feedback']
        
        # Advance journey to next step
        has_next_step = journey.advance_to_next_step()
        
        if not has_next_step:
            # Journey completed
            progress.status = OnboardingStatus.COMPLETED
            progress.completed_at = datetime.utcnow()
        
        db.session.commit()
        
        # Get next step if available
        next_step = journey.get_current_step() if has_next_step else None
        
        return jsonify({
            'success': True,
            'completed': not has_next_step,
            'next_step': next_step.step_id if next_step else None,
            'completion_percentage': progress.get_completion_percentage()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/onboarding/progress', methods=['GET'])
@login_required
def get_onboarding_progress():
    """Get current onboarding progress for the user"""
    try:
        progress = OnboardingProgress.query.filter_by(user_id=current_user.id).first()
        if not progress:
            return jsonify({'error': 'No onboarding progress found'}), 404
        
        # Get current journey
        journey = UserJourney.query.filter_by(
            user_id=current_user.id,
            status=OnboardingStatus.IN_PROGRESS
        ).first()
        
        current_step = None
        if journey:
            current_step_obj = journey.get_current_step()
            if current_step_obj:
                current_step = {
                    'step_id': current_step_obj.step_id,
                    'title': current_step_obj.title,
                    'description': current_step_obj.description,
                    'step_type': current_step_obj.step_type.value
                }
        
        return jsonify({
            'success': True,
            'progress': {
                'status': progress.status.value,
                'completion_percentage': progress.get_completion_percentage(),
                'steps_completed': progress.steps_completed or [],
                'skipped_steps': progress.skipped_steps or [],
                'total_steps': progress.total_steps,
                'current_step': current_step,
                'started_at': progress.started_at.isoformat() if progress.started_at else None,
                'completed_at': progress.completed_at.isoformat() if progress.completed_at else None
            },
            'journey': {
                'journey_id': journey.journey_id if journey else None,
                'steps_sequence': journey.steps_sequence if journey else [],
                'current_step_index': journey.current_step_index if journey else 0,
                'personalization_factors': journey.personalization_factors if journey else {}
            } if journey else None
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def create_personalized_journey(user, progress, preferences):
    """Create a personalized onboarding journey based on user data"""
    # Generate unique journey ID
    journey_id = f"onboarding_{user.id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    
    # Get base steps for user's role
    base_steps = OnboardingStep.get_steps_for_role(user.role)
    
    # Apply personalization logic
    personalized_steps = []
    personalization_factors = {
        'role': user.role.value,
        'experience_level': progress.experience_level.value if progress.experience_level else 'beginner',
        'learning_style': preferences.learning_style if preferences else 'guided',
        'goals': progress.user_goals or [],
        'interests': progress.interests or []
    }
    
    # Add core steps based on role
    for step in base_steps:
        if step.evaluate_conditions(user, preferences):
            personalized_steps.append(step.step_id)
    
    # Add interest-based steps
    if progress.interests:
        for interest in progress.interests:
            interest_steps = OnboardingStep.query.filter(
                OnboardingStep.content['tags'].astext.contains(interest),
                OnboardingStep.active == True
            ).all()
            for step in interest_steps:
                if step.step_id not in personalized_steps:
                    personalized_steps.append(step.step_id)
    
    # Create journey record
    journey = UserJourney()
    journey.user_id = user.id
    journey.journey_id = journey_id
    journey.journey_type = 'onboarding'
    journey.steps_sequence = personalized_steps
    journey.personalization_factors = personalization_factors
    journey.status = OnboardingStatus.IN_PROGRESS
    
    db.session.add(journey)
    
    # Update progress with total steps
    progress.total_steps = len(personalized_steps)
    progress.personalized_path = personalized_steps
    
    return journey

# =======================
# PLATFORM GATEWAY API
# =======================

@app.route('/api/platforms', methods=['GET'])
@login_required
def get_available_platforms():
    """Get platforms available to the user"""
    try:
        platforms = []
        
        # Get user's platform access
        user_access = PlatformAccess.query.filter_by(user_id=current_user.id).all()
        access_map = {access.cluster_type: access for access in user_access}
        
        # Define all available platform clusters
        platform_info = {
            ClusterType.GIRLFANZ: {
                'name': 'GirlFanz',
                'description': 'Platform for female creators and their content',
                'icon': 'fas fa-venus',
                'color': '#ff69b4',
                'url': 'https://girlfanz.myfanz.network',
                'features': ['Photo sharing', 'Video content', 'Live streaming', 'Premium subscriptions']
            },
            ClusterType.BOYFANZ: {
                'name': 'BoyFanz',
                'description': 'Platform for male creators and their content',
                'icon': 'fas fa-mars',
                'color': '#1e90ff',
                'url': 'https://boyfanz.myfanz.network',
                'features': ['Photo sharing', 'Video content', 'Live streaming', 'Premium subscriptions']
            },
            ClusterType.PUPFANZ: {
                'name': 'PupFanz',
                'description': 'Specialized community for pup play and kink content',
                'icon': 'fas fa-paw',
                'color': '#8b4513',
                'url': 'https://pupfanz.myfanz.network',
                'features': ['Community forums', 'Event listings', 'Educational content', 'Safe space']
            },
            ClusterType.TRANZFANZ: {
                'name': 'TranzFanz',
                'description': 'Inclusive platform for transgender creators',
                'icon': 'fas fa-transgender',
                'color': '#ff1493',
                'url': 'https://tranzfanz.com',
                'features': ['Supportive community', 'Educational resources', 'Content creation', 'Advocacy']
            }
        }
        
        for cluster_type, info in platform_info.items():
            access = access_map.get(cluster_type)
            
            platform_data = {
                'cluster_type': cluster_type.value,
                'name': info['name'],
                'description': info['description'],
                'icon': info['icon'],
                'color': info['color'],
                'url': info['url'],
                'features': info['features'],
                'has_access': access is not None and access.access_granted,
                'verification_required': True,
                'access_level': access.access_level if access else None,
                'last_accessed': access.last_accessed.isoformat() if access and access.last_accessed else None
            }
            
            platforms.append(platform_data)
        
        return jsonify({
            'success': True,
            'platforms': platforms
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/platforms/<cluster_type>/access', methods=['POST'])
@login_required
def request_platform_access(cluster_type):
    """Request access to a specific platform"""
    try:
        # Validate cluster type
        try:
            cluster = ClusterType(cluster_type)
        except ValueError:
            return jsonify({'error': 'Invalid platform'}), 400
        
        # Check if user already has access
        existing_access = PlatformAccess.query.filter_by(
            user_id=current_user.id,
            cluster_type=cluster
        ).first()
        
        if existing_access:
            if existing_access.access_granted:
                return jsonify({'error': 'Access already granted'}), 400
        else:
            # Create new access request
            existing_access = PlatformAccess()
            existing_access.user_id = current_user.id
            existing_access.cluster_type = cluster
            db.session.add(existing_access)
        
        # For this demo, auto-grant access if user is verified
        if current_user.kyc_verified:
            existing_access.access_granted = True
            existing_access.verification_required = False
            message = f'Access granted to {cluster.value}!'
        else:
            existing_access.access_granted = False
            existing_access.verification_required = True
            message = f'Access request submitted for {cluster.value}. Verification required.'
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': message,
            'access_granted': existing_access.access_granted,
            'verification_required': existing_access.verification_required
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/platforms/<cluster_type>/enter', methods=['POST'])
@login_required
def enter_platform(cluster_type):
    """Enter a specific platform (SSO)"""
    try:
        # Validate cluster type
        try:
            cluster = ClusterType(cluster_type)
        except ValueError:
            return jsonify({'error': 'Invalid platform'}), 400
        
        # Check user access
        access = PlatformAccess.query.filter_by(
            user_id=current_user.id,
            cluster_type=cluster
        ).first()
        
        if not access or not access.access_granted:
            return jsonify({'error': 'Access denied. Please request access first.'}), 403
        
        # Update access tracking
        access.last_accessed = datetime.utcnow()
        access.access_count += 1
        if not access.first_accessed:
            access.first_accessed = datetime.utcnow()
        
        # Generate SSO token (simplified for demo)
        import secrets
        sso_token = secrets.token_urlsafe(32)
        access.platform_token = sso_token
        
        db.session.commit()
        
        # In production, this would redirect to the actual platform with SSO
        platform_urls = {
            ClusterType.GIRLFANZ: f'https://girlfanz.myfanz.network/sso?token={sso_token}',
            ClusterType.BOYFANZ: f'https://boyfanz.myfanz.network/sso?token={sso_token}',
            ClusterType.PUPFANZ: f'https://pupfanz.myfanz.network/sso?token={sso_token}',
            ClusterType.TRANZFANZ: f'https://tranzfanz.myfanz.network/sso?token={sso_token}'
        }
        
        return jsonify({
            'success': True,
            'platform_url': platform_urls.get(cluster, '#'),
            'sso_token': sso_token,
            'message': f'Redirecting to {cluster.value}...'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# =======================
# LEGAL PAGES ROUTES
# =======================

@app.route('/faq')
def faq():
    """Frequently Asked Questions page"""
    return render_template('faq.html')

@app.route('/terms')
def terms():
    """Terms of Service page"""
    return render_template('terms.html', current_date=datetime.now().strftime('%B %d, %Y'))

@app.route('/privacy')
def privacy():
    """Privacy Policy page"""
    return render_template('privacy.html', current_date=datetime.now().strftime('%B %d, %Y'))

@app.route('/dmca')
def dmca():
    """DMCA Notice & Takedown Policy page"""
    return render_template('dmca.html', current_date=datetime.now().strftime('%B %d, %Y'))

@app.route('/usc2257')
def usc2257():
    """USC 2257 Compliance Statement page"""
    return render_template('usc2257.html', current_date=datetime.now().strftime('%B %d, %Y'))

@app.route('/legal')
def legal():
    """Legal page redirector - redirects to terms"""
    return redirect(url_for('terms'))
