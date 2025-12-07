from flask import render_template, request, redirect, url_for, flash, jsonify, make_response, session
from app import app, db
from models import (
    User, Client, Appointment, Message, Template, Tag, ClientTag,
    Workflow, Rule, Task, WorkflowExecution, CommunicationChannel,
    Domain, DomainRecord, EmailAccount, EmergencyContact, SafetySettings,
    SafetyCheckIn, PanicAlert, CheckInStatus, PanicAlertStatus, SafetyLevel,
    Broadcast, BroadcastRecipient, BroadcastMessage, ContactGroup,
    BroadcastType, BroadcastStatus, MessageDeliveryStatus
)
from services.calendar import generate_ical_feed
from services.messaging import send_sms_message
from services.multichannel_service import MultiChannelService
from services.google_contacts import sync_contacts, get_user_tags, update_client_tags, update_client_notes, get_or_create_tag
from services.workflow_engine import workflow_engine, trigger_workflows, execute_workflow
from services.auth_service import AuthService
from services.domain_service import DomainService
from services.broadcast_service import BroadcastService
from datetime import datetime, timezone
import logging
import json

@app.route('/')
def dashboard():
    # Check if user is authenticated
    try:
        current_user = AuthService.get_current_user()
        if not current_user:
            # If no user is authenticated, show a landing page instead of redirecting
            return render_template('landing.html')
        
        user_id = current_user.id
    except Exception as e:
        # If there's any authentication error, show landing page
        logging.error(f"Authentication error: {e}")
        return render_template('landing.html')
    
    # Get recent statistics
    total_clients = Client.query.filter_by(user_id=user_id).count()
    total_appointments = Appointment.query.filter_by(user_id=user_id).count()
    pending_appointments = Appointment.query.filter_by(user_id=user_id, status='tentative').count()
    unread_messages = Message.query.filter_by(user_id=user_id, processed=False).count()
    
    # Get recent appointments
    recent_appointments = Appointment.query.filter_by(user_id=user_id)\
        .order_by(Appointment.start_time.desc()).limit(5).all()
    
    # Get recent messages
    recent_messages = Message.query.filter_by(user_id=user_id)\
        .order_by(Message.created_at.desc()).limit(5).all()
    
    # Get active communication channels count
    active_channels = CommunicationChannel.query.filter_by(user_id=user_id, is_active=True).count()
    
    return render_template('dashboard.html',
                           current_user=current_user, 
                         total_clients=total_clients,
                         total_appointments=total_appointments,
                         pending_appointments=pending_appointments,
                         unread_messages=unread_messages,
                         recent_appointments=recent_appointments,
                         recent_messages=recent_messages,
                         active_channels=active_channels)

# Authentication Routes
@app.route('/signup', methods=['GET', 'POST'])
def signup():
    """User registration"""
    if request.method == 'POST':
        try:
            username = request.form.get('username', '').strip()
            email = request.form.get('email', '').strip()
            password = request.form.get('password', '')
            confirm_password = request.form.get('confirm_password', '')
            business_name = request.form.get('business_name', '').strip()
            website = request.form.get('website', '').strip()
            
            # Validation
            if not username or not email or not password:
                flash('Please fill in all required fields.', 'error')
                return render_template('auth/signup.html')
                
            if password != confirm_password:
                flash('Passwords do not match.', 'error')
                return render_template('auth/signup.html')
                
            if len(password) < 8:
                flash('Password must be at least 8 characters long.', 'error')
                return render_template('auth/signup.html')
            
            # Register user
            user = AuthService.register_user(
                username=username,
                email=email,
                password=password,
                business_name=business_name if business_name else None,
                website=website if website else None
            )
            
            # Send verification email (placeholder)
            AuthService.send_verification_email(user)
            
            # Auto-login after registration
            AuthService.login_user(user)
            
            flash('Account created successfully! Welcome to Creator CRM.', 'success')
            return redirect(url_for('dashboard'))
            
        except Exception as e:
            flash(str(e), 'error')
            return render_template('auth/signup.html')
    
    return render_template('auth/signup.html')

@app.route('/signin', methods=['GET', 'POST'])
def signin():
    """User login"""
    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')
        remember_me = request.form.get('remember_me') == 'on'
        
        if not email or not password:
            flash('Please enter both email and password.', 'error')
            return render_template('auth/signin.html')
        
        user = AuthService.authenticate_user(email, password)
        
        if user:
            AuthService.login_user(user)
            
            # Set session as permanent if remember me is checked
            if remember_me:
                session.permanent = True
            
            flash(f'Welcome back, {user.username}!', 'success')
            
            # Redirect to next page or dashboard
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('dashboard'))
        else:
            flash('Invalid email or password.', 'error')
    
    return render_template('auth/signin.html')

@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    """Forgot password request"""
    if request.method == 'POST':
        try:
            email = request.form.get('email', '').strip()
            
            if not email:
                flash('Please enter your email address.', 'error')
                return render_template('auth/forgot_password.html')
            
            # Generate reset token (always show success for security)
            token = AuthService.generate_reset_token(email)
            
            if token:
                # Send reset email
                AuthService.send_reset_email(email, token)
            
            # Always show success message for security (don't reveal if email exists)
            flash('If your email address is in our system, you will receive a password reset link shortly.', 'info')
            return redirect(url_for('signin'))
            
        except Exception as e:
            logging.error(f"Forgot password error: {e}")
            flash('An error occurred. Please try again.', 'error')
    
    return render_template('auth/forgot_password.html')

@app.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    """Reset password with token"""
    if request.method == 'POST':
        try:
            password = request.form.get('password', '')
            confirm_password = request.form.get('confirm_password', '')
            
            # Validation
            if not password or not confirm_password:
                flash('Please fill in all fields.', 'error')
                return render_template('auth/reset_password.html', token=token)
            
            if password != confirm_password:
                flash('Passwords do not match.', 'error')
                return render_template('auth/reset_password.html', token=token)
            
            if len(password) < 8:
                flash('Password must be at least 8 characters long.', 'error')
                return render_template('auth/reset_password.html', token=token)
            
            # Reset password
            success, message = AuthService.reset_password(token, password)
            
            if success:
                flash('Password reset successfully! You can now sign in with your new password.', 'success')
                return redirect(url_for('signin'))
            else:
                flash(message, 'error')
                return render_template('auth/reset_password.html', token=token)
                
        except Exception as e:
            logging.error(f"Reset password error: {e}")
            flash('An error occurred. Please try again.', 'error')
    
    # Verify token is valid before showing form
    user = User.query.filter_by(reset_token=token).first()
    if not user or (user.reset_token_expires and user.reset_token_expires < datetime.now(timezone.utc)):
        flash('Invalid or expired reset link. Please request a new password reset.', 'error')
        return redirect(url_for('forgot_password'))
    
    return render_template('auth/reset_password.html', token=token)

# Broadcast Messaging Routes
@app.route('/broadcasts')
@AuthService.login_required
def broadcasts():
    """List all broadcasts for the user"""
    user = AuthService.get_current_user()
    broadcasts = BroadcastService.get_user_broadcasts(user.id)
    
    return render_template('broadcasts/list.html',
                         current_user=user,
                         broadcasts=broadcasts)

@app.route('/broadcasts/create', methods=['GET', 'POST'])
@AuthService.login_required
def create_broadcast():
    """Create a new broadcast"""
    user = AuthService.get_current_user()
    
    if request.method == 'POST':
        try:
            title = request.form.get('title', '').strip()
            message_content = request.form.get('message_content', '').strip()
            broadcast_type = request.form.get('broadcast_type', 'individual')
            
            if not title or not message_content:
                flash('Please fill in all required fields.', 'error')
                return render_template('broadcasts/create.html', current_user=user)
            
            # Convert string to enum
            b_type = BroadcastType.INDIVIDUAL if broadcast_type == 'individual' else BroadcastType.GROUP
            
            broadcast = BroadcastService.create_broadcast(
                user_id=user.id,
                title=title,
                message_content=message_content,
                broadcast_type=b_type
            )
            
            flash('Broadcast created successfully!', 'success')
            return redirect(url_for('edit_broadcast', broadcast_id=broadcast.id))
            
        except Exception as e:
            flash(f'Error creating broadcast: {str(e)}', 'error')
    
    return render_template('broadcasts/create.html', current_user=user)

@app.route('/broadcasts/<int:broadcast_id>/edit', methods=['GET', 'POST'])
@AuthService.login_required
def edit_broadcast(broadcast_id):
    """Edit a broadcast and manage recipients"""
    user = AuthService.get_current_user()
    broadcast = Broadcast.query.filter_by(id=broadcast_id, user_id=user.id).first()
    
    if not broadcast:
        flash('Broadcast not found.', 'error')
        return redirect(url_for('broadcasts'))
    
    if request.method == 'POST':
        action = request.form.get('action')
        
        if action == 'update_broadcast':
            try:
                broadcast.title = request.form.get('title', '').strip()
                broadcast.message_content = request.form.get('message_content', '').strip()
                broadcast.broadcast_type = BroadcastType.INDIVIDUAL if request.form.get('broadcast_type') == 'individual' else BroadcastType.GROUP
                
                # Channel preferences
                broadcast.send_via_sms = 'send_via_sms' in request.form
                broadcast.send_via_email = 'send_via_email' in request.form
                
                db.session.commit()
                flash('Broadcast updated successfully!', 'success')
                
            except Exception as e:
                flash(f'Error updating broadcast: {str(e)}', 'error')
        
        elif action == 'add_recipients':
            try:
                selected_clients = request.form.getlist('selected_clients')
                if selected_clients:
                    BroadcastService.add_recipients_from_clients(
                        broadcast_id, 
                        [int(id) for id in selected_clients]
                    )
                    flash(f'Added {len(selected_clients)} recipients.', 'success')
                else:
                    flash('No recipients selected.', 'error')
                    
            except Exception as e:
                flash(f'Error adding recipients: {str(e)}', 'error')
        
        elif action == 'add_custom_recipient':
            try:
                name = request.form.get('recipient_name', '').strip()
                phone = request.form.get('recipient_phone', '').strip()
                email = request.form.get('recipient_email', '').strip()
                
                if name and (phone or email):
                    BroadcastService.add_custom_recipient(
                        broadcast_id, name, phone if phone else None, email if email else None
                    )
                    flash('Custom recipient added.', 'success')
                else:
                    flash('Please provide name and at least one contact method.', 'error')
                    
            except Exception as e:
                flash(f'Error adding custom recipient: {str(e)}', 'error')
        
        return redirect(url_for('edit_broadcast', broadcast_id=broadcast_id))
    
    # Get data for the template
    clients = Client.query.filter_by(user_id=user.id).all()
    recipients = BroadcastRecipient.query.filter_by(broadcast_id=broadcast_id).all()
    contact_groups = BroadcastService.get_user_contact_groups(user.id)
    
    return render_template('broadcasts/edit.html',
                         current_user=user,
                         broadcast=broadcast,
                         clients=clients,
                         recipients=recipients,
                         contact_groups=contact_groups)

@app.route('/broadcasts/<int:broadcast_id>/send', methods=['POST'])
@AuthService.login_required
def send_broadcast(broadcast_id):
    """Send a broadcast"""
    user = AuthService.get_current_user()
    broadcast = Broadcast.query.filter_by(id=broadcast_id, user_id=user.id).first()
    
    if not broadcast:
        flash('Broadcast not found.', 'error')
        return redirect(url_for('broadcasts'))
    
    try:
        BroadcastService.send_broadcast(broadcast_id)
        flash('Broadcast sent successfully!', 'success')
        
    except Exception as e:
        flash(f'Error sending broadcast: {str(e)}', 'error')
    
    return redirect(url_for('broadcast_analytics', broadcast_id=broadcast_id))

@app.route('/broadcasts/<int:broadcast_id>/analytics')
@AuthService.login_required
def broadcast_analytics(broadcast_id):
    """View broadcast analytics"""
    user = AuthService.get_current_user()
    broadcast = Broadcast.query.filter_by(id=broadcast_id, user_id=user.id).first()
    
    if not broadcast:
        flash('Broadcast not found.', 'error')
        return redirect(url_for('broadcasts'))
    
    analytics = BroadcastService.get_broadcast_analytics(broadcast_id)
    
    return render_template('broadcasts/analytics.html',
                         current_user=user,
                         analytics=analytics)

@app.route('/broadcasts/<int:broadcast_id>/delete', methods=['POST'])
@AuthService.login_required
def delete_broadcast(broadcast_id):
    """Delete a broadcast"""
    user = AuthService.get_current_user()
    
    try:
        BroadcastService.delete_broadcast(broadcast_id, user.id)
        flash('Broadcast deleted successfully.', 'success')
        
    except Exception as e:
        flash(f'Error deleting broadcast: {str(e)}', 'error')
    
    return redirect(url_for('broadcasts'))

# Contact Groups Routes
@app.route('/contact-groups')
@AuthService.login_required
def contact_groups():
    """Manage contact groups"""
    user = AuthService.get_current_user()
    groups = BroadcastService.get_user_contact_groups(user.id)
    
    return render_template('broadcasts/contact_groups.html',
                         current_user=user,
                         groups=groups)

@app.route('/contact-groups/create', methods=['POST'])
@AuthService.login_required
def create_contact_group():
    """Create a new contact group"""
    user = AuthService.get_current_user()
    
    try:
        name = request.form.get('name', '').strip()
        description = request.form.get('description', '').strip()
        color = request.form.get('color', '#007bff')
        
        if not name:
            flash('Group name is required.', 'error')
        else:
            BroadcastService.create_contact_group(
                user_id=user.id,
                name=name,
                description=description if description else None,
                color=color
            )
            flash('Contact group created successfully!', 'success')
            
    except Exception as e:
        flash(f'Error creating contact group: {str(e)}', 'error')
    
    return redirect(url_for('contact_groups'))

@app.route('/signout')
def signout():
    """User logout"""
    user = AuthService.get_current_user()
    if user:
        AuthService.logout_user()
        flash(f'Goodbye, {user.username}! You have been signed out.', 'info')
    return redirect(url_for('signin'))

# Domain Management Routes
@app.route('/domains')
@AuthService.login_required
def domains():
    """Domain management page"""
    user = AuthService.get_current_user()
    domains = Domain.query.filter_by(user_id=user.id).all()
    
    return render_template('domains/list.html', 
                         current_user=user,
                         domains=domains)

@app.route('/domains/add', methods=['GET', 'POST'])
@AuthService.login_required
def add_domain():
    """Add a new domain"""
    user = AuthService.get_current_user()
    
    if request.method == 'POST':
        try:
            domain_name = request.form.get('domain_name', '').strip().lower()
            
            if not domain_name:
                flash('Please enter a domain name.', 'error')
                return render_template('domains/add.html', current_user=user)
            
            # Basic domain validation
            if not '.' in domain_name or domain_name.startswith('.') or domain_name.endswith('.'):
                flash('Please enter a valid domain name (e.g., example.com).', 'error')
                return render_template('domains/add.html', current_user=user)
            
            domain_service = DomainService()
            domain = domain_service.add_domain(user.id, domain_name)
            
            flash(f'Domain {domain_name} has been added successfully! Please configure your DNS records.', 'success')
            return redirect(url_for('domain_setup', domain_id=domain.id))
            
        except Exception as e:
            flash(str(e), 'error')
            return render_template('domains/add.html', current_user=user)
    
    return render_template('domains/add.html', current_user=user)

@app.route('/domains/<int:domain_id>/setup')
@AuthService.login_required
def domain_setup(domain_id):
    """Domain setup and DNS configuration"""
    user = AuthService.get_current_user()
    domain = Domain.query.filter_by(id=domain_id, user_id=user.id).first()
    
    if not domain:
        flash('Domain not found.', 'error')
        return redirect(url_for('domains'))
    
    domain_service = DomainService()
    instructions = domain_service.get_domain_instructions(domain_id)
    
    return render_template('domains/setup.html',
                         current_user=user,
                         domain=domain,
                         instructions=instructions)

@app.route('/domains/<int:domain_id>/verify', methods=['POST'])
@AuthService.login_required
def verify_domain(domain_id):
    """Verify domain ownership"""
    user = AuthService.get_current_user()
    domain = Domain.query.filter_by(id=domain_id, user_id=user.id).first()
    
    if not domain:
        flash('Domain not found.', 'error')
        return redirect(url_for('domains'))
    
    try:
        domain_service = DomainService()
        success = domain_service.verify_domain(domain_id)
        
        if success:
            flash(f'Domain {domain.domain_name} has been verified successfully!', 'success')
        else:
            flash('Domain verification failed. Please check your DNS records and try again.', 'error')
            
    except Exception as e:
        flash(f'Verification error: {str(e)}', 'error')
    
    return redirect(url_for('domain_setup', domain_id=domain_id))

@app.route('/domains/<int:domain_id>/check-dns')
@AuthService.login_required
def check_dns_propagation(domain_id):
    """Check DNS propagation status"""
    user = AuthService.get_current_user()
    domain = Domain.query.filter_by(id=domain_id, user_id=user.id).first()
    
    if not domain:
        return jsonify({'error': 'Domain not found'}), 404
    
    try:
        domain_service = DomainService()
        status = domain_service.check_dns_propagation(domain_id)
        return jsonify(status)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/clients')
def clients():
    user_id = 1  # In production, get from authentication
    clients = Client.query.filter_by(user_id=user_id).order_by(Client.created_at.desc()).all()
    return render_template('clients.html', clients=clients)

@app.route('/clients/add', methods=['POST'])
def add_client():
    user_id = 1  # In production, get from authentication
    
    name = request.form.get('name')
    phone_number = request.form.get('phone_number')
    email = request.form.get('email')
    notes = request.form.get('notes')
    tags = request.form.get('tags')
    
    if not name:
        flash('Name is required', 'error')
        return redirect(url_for('clients'))
    
    client = Client(
        user_id=user_id,
        name=name,
        phone_number=phone_number,
        email=email,
        notes=notes,
        tags=tags
    )
    
    db.session.add(client)
    db.session.commit()
    
    # Trigger workflows for client created
    try:
        trigger_workflows(
            'client_created',
            user_id,
            client=client,
            user=User.query.get(user_id)
        )
    except Exception as e:
        logging.error(f"Error triggering client_created workflows: {e}")
    
    flash('Client added successfully', 'success')
    return redirect(url_for('clients'))

@app.route('/clients/<int:client_id>/toggle_block', methods=['POST'])
def toggle_client_block(client_id):
    user_id = 1  # In production, get from authentication
    
    client = Client.query.filter_by(id=client_id, user_id=user_id).first()
    if not client:
        flash('Client not found', 'error')
        return redirect(url_for('clients'))
    
    client.is_blocked = not client.is_blocked
    db.session.commit()
    
    status = 'blocked' if client.is_blocked else 'unblocked'
    flash(f'Client {status} successfully', 'success')
    return redirect(url_for('clients'))

@app.route('/appointments')
def appointments():
    user_id = 1  # In production, get from authentication
    appointments = Appointment.query.filter_by(user_id=user_id)\
        .order_by(Appointment.start_time.desc()).all()
    clients = Client.query.filter_by(user_id=user_id).all()
    return render_template('appointments.html', appointments=appointments, clients=clients)

@app.route('/appointments/add', methods=['POST'])
def add_appointment():
    user_id = 1  # In production, get from authentication
    
    try:
        title = request.form.get('title')
        client_id = request.form.get('client_id')
        start_time = datetime.fromisoformat(request.form.get('start_time'))
        end_time = datetime.fromisoformat(request.form.get('end_time'))
        location = request.form.get('location')
        description = request.form.get('description')
        
        if not title or not start_time or not end_time:
            flash('Title, start time, and end time are required', 'error')
            return redirect(url_for('appointments'))
        
        appointment = Appointment(
            user_id=user_id,
            client_id=int(client_id) if client_id else None,
            title=title,
            description=description,
            start_time=start_time,
            end_time=end_time,
            location=location,
            status='confirmed'
        )
        
        db.session.add(appointment)
        db.session.commit()
        
        # Trigger workflows for appointment created
        try:
            trigger_workflows(
                'appointment_created',
                user_id,
                appointment=appointment,
                client=Client.query.get(appointment.client_id) if appointment.client_id else None,
                user=User.query.get(user_id)
            )
        except Exception as e:
            logging.error(f"Error triggering appointment_created workflows: {e}")
        
        flash('Appointment added successfully', 'success')
        
    except Exception as e:
        logging.error(f"Error adding appointment: {e}")
        flash('Error adding appointment', 'error')
    
    return redirect(url_for('appointments'))

@app.route('/appointments/<int:appointment_id>/status', methods=['POST'])
def update_appointment_status(appointment_id):
    user_id = 1  # In production, get from authentication
    
    appointment = Appointment.query.filter_by(id=appointment_id, user_id=user_id).first()
    if not appointment:
        flash('Appointment not found', 'error')
        return redirect(url_for('appointments'))
    
    new_status = request.form.get('status')
    if new_status in ['tentative', 'confirmed', 'cancelled', 'completed']:
        appointment.status = new_status
        appointment.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        
        # Trigger workflows for appointment status changes
        if new_status == 'confirmed':
            try:
                trigger_workflows(
                    'appointment_confirmed',
                    user_id,
                    appointment=appointment,
                    client=Client.query.get(appointment.client_id) if appointment.client_id else None,
                    user=User.query.get(user_id)
                )
            except Exception as e:
                logging.error(f"Error triggering appointment_confirmed workflows: {e}")
        
        flash(f'Appointment status updated to {new_status}', 'success')
    else:
        flash('Invalid status', 'error')
    
    return redirect(url_for('appointments'))

@app.route('/templates')
def templates():
    user_id = 1  # In production, get from authentication
    templates = Template.query.filter_by(user_id=user_id).order_by(Template.category, Template.name).all()
    return render_template('templates.html', templates=templates)

@app.route('/templates/add', methods=['POST'])
def add_template():
    user_id = 1  # In production, get from authentication
    
    name = request.form.get('name')
    category = request.form.get('category')
    content = request.form.get('content')
    
    if not name or not category or not content:
        flash('All fields are required', 'error')
        return redirect(url_for('templates'))
    
    template = Template(
        user_id=user_id,
        name=name,
        category=category,
        content=content
    )
    
    db.session.add(template)
    db.session.commit()
    flash('Template added successfully', 'success')
    return redirect(url_for('templates'))

@app.route('/messages')
def messages():
    user_id = 1  # In production, get from authentication
    messages = Message.query.filter_by(user_id=user_id)\
        .order_by(Message.created_at.desc()).all()
    
    # Get communication channels for dropdown
    channels = CommunicationChannel.query.filter_by(user_id=user_id, is_active=True).all()
    
    return render_template('messages.html', messages=messages, channels=channels)

@app.route('/messages/<int:message_id>/mark_processed', methods=['POST'])
def mark_message_processed(message_id):
    user_id = 1  # In production, get from authentication
    
    message = Message.query.filter_by(id=message_id, user_id=user_id).first()
    if message:
        message.processed = True
        db.session.commit()
        flash('Message marked as processed', 'success')
    else:
        flash('Message not found', 'error')
    
    return redirect(url_for('messages'))

@app.route('/calendar/ical')
def calendar_ical():
    user_id = request.args.get('user_id', 1, type=int)
    
    appointments = Appointment.query.filter_by(user_id=user_id)\
        .filter(Appointment.status.in_(['confirmed', 'tentative'])).all()
    
    ical_content = generate_ical_feed(appointments, user_id)
    
    response = make_response(ical_content)
    response.headers['Content-Type'] = 'text/calendar'
    response.headers['Content-Disposition'] = f'attachment; filename=calendar_{user_id}.ics'
    return response

# Tags API Endpoints
@app.route('/tags', methods=['GET'])
def get_tags():
    """Get all tags for a user"""
    user_id = request.args.get('user_id', 1, type=int)
    try:
        tags = get_user_tags(user_id)
        return jsonify({"tags": tags, "success": True})
    except Exception as e:
        logging.error(f"Error getting tags: {e}")
        return jsonify({"error": "Failed to get tags", "success": False}), 500

@app.route('/tags', methods=['POST'])
def create_or_update_tag():
    """Create or update a tag"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided", "success": False}), 400
        
        user_id = data.get('user_id', 1)
        name = data.get('name')
        color = data.get('color')
        description = data.get('description')
        
        if not name:
            return jsonify({"error": "Tag name is required", "success": False}), 400
        
        # Get or create tag
        tag = get_or_create_tag(user_id, name)
        
        # Update additional fields if provided
        if color:
            tag.color = color
        if description:
            tag.description = description
        
        db.session.commit()
        
        return jsonify({
            "tag": {
                "id": tag.id,
                "name": tag.name,
                "color": tag.color,
                "description": tag.description,
                "created_at": tag.created_at.isoformat()
            },
            "success": True
        })
        
    except Exception as e:
        logging.error(f"Error creating/updating tag: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to create/update tag", "success": False}), 500

@app.route('/tags/apply', methods=['POST'])
def apply_tags_to_client():
    """Apply tags to a client"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided", "success": False}), 400
        
        client_id = data.get('client_id')
        tag_names = data.get('tags', [])
        
        if not client_id:
            return jsonify({"error": "Client ID is required", "success": False}), 400
        
        # Verify client exists
        client = Client.query.get(client_id)
        if not client:
            return jsonify({"error": "Client not found", "success": False}), 404
        
        update_client_tags(client_id, tag_names)
        
        return jsonify({
            "message": f"Tags applied to client {client.name}",
            "client_id": client_id,
            "tags": tag_names,
            "success": True
        })
        
    except Exception as e:
        logging.error(f"Error applying tags: {e}")
        return jsonify({"error": "Failed to apply tags", "success": False}), 500

@app.route('/tags/note', methods=['POST'])
def update_client_note():
    """Update notes for a client"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided", "success": False}), 400
        
        client_id = data.get('client_id')
        notes = data.get('notes', '')
        
        if not client_id:
            return jsonify({"error": "Client ID is required", "success": False}), 400
        
        # Verify client exists
        client = Client.query.get(client_id)
        if not client:
            return jsonify({"error": "Client not found", "success": False}), 404
        
        update_client_notes(client_id, notes)
        
        return jsonify({
            "message": f"Notes updated for client {client.name}",
            "client_id": client_id,
            "notes": notes,
            "success": True
        })
        
    except Exception as e:
        logging.error(f"Error updating notes: {e}")
        return jsonify({"error": "Failed to update notes", "success": False}), 500

# Google Contacts Integration
@app.route('/integrations/google/contacts/sync', methods=['POST'])
def sync_google_contacts():
    """Sync contacts from Google Contacts format"""
    try:
        user_id = request.args.get('user_id', 1, type=int)
        data = request.get_json()
        
        if not data or 'contacts' not in data:
            return jsonify({"error": "No contacts data provided", "success": False}), 400
        
        contacts = data['contacts']
        if not isinstance(contacts, list):
            return jsonify({"error": "Contacts must be a list", "success": False}), 400
        
        # Sync contacts
        stats = sync_contacts(user_id, contacts)
        
        return jsonify({
            "message": "Contacts synced successfully",
            "stats": stats,
            "success": True
        })
        
    except Exception as e:
        logging.error(f"Error syncing contacts: {e}")
        return jsonify({"error": "Failed to sync contacts", "success": False}), 500

# Workflow Management Endpoints
@app.route('/workflows')
def workflows():
    """Workflow management page"""
    user_id = 1  # In production, get from authentication
    workflows = Workflow.query.filter_by(user_id=user_id).order_by(Workflow.created_at.desc()).all()
    return render_template('workflows.html', workflows=workflows)

@app.route('/workflows/api', methods=['GET'])
def get_workflows():
    """Get all workflows for a user"""
    user_id = request.args.get('user_id', 1, type=int)
    try:
        workflows = Workflow.query.filter_by(user_id=user_id).order_by(Workflow.created_at.desc()).all()
        
        result = []
        for workflow in workflows:
            rules_count = Rule.query.filter_by(workflow_id=workflow.id).count()
            executions_count = WorkflowExecution.query.filter_by(workflow_id=workflow.id).count()
            
            result.append({
                "id": workflow.id,
                "name": workflow.name,
                "description": workflow.description,
                "trigger_type": workflow.trigger_type,
                "is_active": workflow.is_active,
                "rules_count": rules_count,
                "executions_count": executions_count,
                "created_at": workflow.created_at.isoformat(),
                "updated_at": workflow.updated_at.isoformat()
            })
        
        return jsonify({"workflows": result, "success": True})
    except Exception as e:
        logging.error(f"Error getting workflows: {e}")
        return jsonify({"error": "Failed to get workflows", "success": False}), 500

@app.route('/workflows/api', methods=['POST'])
def create_workflow():
    """Create a new workflow"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided", "success": False}), 400
        
        user_id = data.get('user_id', 1)
        name = data.get('name')
        description = data.get('description', '')
        trigger_type = data.get('trigger_type')
        trigger_config = data.get('trigger_config', {})
        
        if not name or not trigger_type:
            return jsonify({"error": "Name and trigger type are required", "success": False}), 400
        
        workflow = Workflow(
            user_id=user_id,
            name=name,
            description=description,
            trigger_type=trigger_type,
            trigger_config=json.dumps(trigger_config)
        )
        
        db.session.add(workflow)
        db.session.commit()
        
        return jsonify({
            "workflow": {
                "id": workflow.id,
                "name": workflow.name,
                "description": workflow.description,
                "trigger_type": workflow.trigger_type,
                "is_active": workflow.is_active,
                "created_at": workflow.created_at.isoformat()
            },
            "success": True
        })
        
    except Exception as e:
        logging.error(f"Error creating workflow: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to create workflow", "success": False}), 500

@app.route('/workflows/api/<int:workflow_id>', methods=['PUT'])
def update_workflow(workflow_id):
    """Update a workflow"""
    try:
        workflow = Workflow.query.get(workflow_id)
        if not workflow:
            return jsonify({"error": "Workflow not found", "success": False}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided", "success": False}), 400
        
        # Update fields if provided
        if 'name' in data:
            workflow.name = data['name']
        if 'description' in data:
            workflow.description = data['description']
        if 'is_active' in data:
            workflow.is_active = data['is_active']
        if 'trigger_config' in data:
            workflow.trigger_config = json.dumps(data['trigger_config'])
        
        workflow.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        
        return jsonify({
            "workflow": {
                "id": workflow.id,
                "name": workflow.name,
                "description": workflow.description,
                "trigger_type": workflow.trigger_type,
                "is_active": workflow.is_active,
                "updated_at": workflow.updated_at.isoformat()
            },
            "success": True
        })
        
    except Exception as e:
        logging.error(f"Error updating workflow: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to update workflow", "success": False}), 500

@app.route('/workflows/api/<int:workflow_id>/rules', methods=['GET'])
def get_workflow_rules(workflow_id):
    """Get rules for a workflow"""
    try:
        workflow = Workflow.query.get(workflow_id)
        if not workflow:
            return jsonify({"error": "Workflow not found", "success": False}), 404
        
        rules = Rule.query.filter_by(workflow_id=workflow_id).order_by(Rule.order_index).all()
        
        result = []
        for rule in rules:
            result.append({
                "id": rule.id,
                "name": rule.name,
                "description": rule.description,
                "order_index": rule.order_index,
                "is_active": rule.is_active,
                "condition_type": rule.condition_type,
                "condition_config": json.loads(rule.condition_config),
                "action_type": rule.action_type,
                "action_config": json.loads(rule.action_config),
                "created_at": rule.created_at.isoformat()
            })
        
        return jsonify({"rules": result, "success": True})
        
    except Exception as e:
        logging.error(f"Error getting workflow rules: {e}")
        return jsonify({"error": "Failed to get rules", "success": False}), 500

@app.route('/workflows/api/<int:workflow_id>/rules', methods=['POST'])
def create_rule(workflow_id):
    """Create a new rule for a workflow"""
    try:
        workflow = Workflow.query.get(workflow_id)
        if not workflow:
            return jsonify({"error": "Workflow not found", "success": False}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided", "success": False}), 400
        
        name = data.get('name')
        condition_type = data.get('condition_type')
        condition_config = data.get('condition_config', {})
        action_type = data.get('action_type')
        action_config = data.get('action_config', {})
        
        if not all([name, condition_type, action_type]):
            return jsonify({"error": "Name, condition type, and action type are required", "success": False}), 400
        
        # Get the highest order index and add 1
        max_order = db.session.query(db.func.max(Rule.order_index)).filter_by(workflow_id=workflow_id).scalar() or 0
        
        rule = Rule(
            workflow_id=workflow_id,
            name=name,
            description=data.get('description', ''),
            order_index=max_order + 1,
            condition_type=condition_type,
            condition_config=json.dumps(condition_config),
            action_type=action_type,
            action_config=json.dumps(action_config)
        )
        
        db.session.add(rule)
        db.session.commit()
        
        return jsonify({
            "rule": {
                "id": rule.id,
                "name": rule.name,
                "description": rule.description,
                "order_index": rule.order_index,
                "condition_type": rule.condition_type,
                "action_type": rule.action_type,
                "created_at": rule.created_at.isoformat()
            },
            "success": True
        })
        
    except Exception as e:
        logging.error(f"Error creating rule: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to create rule", "success": False}), 500

@app.route('/workflows/api/<int:workflow_id>/execute', methods=['POST'])
def execute_workflow_manually(workflow_id):
    """Execute a workflow manually with provided context"""
    try:
        data = request.get_json() or {}
        context = data.get('context', {})
        
        result = execute_workflow(workflow_id, context)
        return jsonify(result)
        
    except Exception as e:
        logging.error(f"Error executing workflow: {e}")
        return jsonify({"error": "Failed to execute workflow", "success": False}), 500

@app.route('/tasks/api', methods=['GET'])
def get_tasks():
    """Get tasks for a user"""
    user_id = request.args.get('user_id', 1, type=int)
    status = request.args.get('status', None)
    limit = request.args.get('limit', 50, type=int)
    
    try:
        query = Task.query.filter_by(user_id=user_id)
        
        if status:
            query = query.filter_by(status=status)
        
        tasks = query.order_by(Task.created_at.desc()).limit(limit).all()
        
        result = []
        for task in tasks:
            result.append({
                "id": task.id,
                "task_type": task.task_type,
                "status": task.status,
                "priority": task.priority,
                "attempts": task.attempts,
                "max_attempts": task.max_attempts,
                "scheduled_at": task.scheduled_at.isoformat() if task.scheduled_at else None,
                "created_at": task.created_at.isoformat(),
                "started_at": task.started_at.isoformat() if task.started_at else None,
                "completed_at": task.completed_at.isoformat() if task.completed_at else None,
                "error_message": task.error_message
            })
        
        return jsonify({"tasks": result, "success": True})
        
    except Exception as e:
        logging.error(f"Error getting tasks: {e}")
        return jsonify({"error": "Failed to get tasks", "success": False}), 500

# Omnichannel Communication Routes

@app.route('/channels')
def channels():
    """Manage communication channels"""
    user_id = 1  # In production, get from authentication
    channels = CommunicationChannel.query.filter_by(user_id=user_id).all()
    
    # Available channel types including new integrations
    available_channels = {
        'sms': {'name': 'SMS (Twilio)', 'icon': 'message-square', 'category': 'messaging'},
        'whatsapp': {'name': 'WhatsApp Personal', 'icon': 'message-circle', 'category': 'messaging'},
        'telegram': {'name': 'Telegram Bot', 'icon': 'send', 'category': 'messaging'},
        'discord': {'name': 'Discord', 'icon': 'hash', 'category': 'messaging'},
        'email': {'name': 'Personal Email', 'icon': 'mail', 'category': 'messaging'},
        'facebook_messenger': {'name': 'Facebook Messenger', 'icon': 'facebook', 'category': 'social'},
        'instagram': {'name': 'Instagram Direct', 'icon': 'instagram', 'category': 'social'},
        'x_twitter': {'name': 'X (Twitter) DMs', 'icon': 'twitter', 'category': 'social'},
        'reddit': {'name': 'Reddit Messages', 'icon': 'message-circle', 'category': 'social'},
        'bluesky': {'name': 'BlueSky Messages', 'icon': 'cloud', 'category': 'social'},
        'twitch': {'name': 'Twitch Chat/Whispers', 'icon': 'twitch', 'category': 'social'},
        'tiktok': {'name': 'TikTok Messages', 'icon': 'video', 'category': 'social'},
        'snapchat': {'name': 'Snapchat Messages', 'icon': 'camera', 'category': 'social'},
        'linkedin': {'name': 'LinkedIn Messages', 'icon': 'linkedin', 'category': 'professional'},
        'slack': {'name': 'Slack Messages', 'icon': 'slack', 'category': 'professional'},
        'teams': {'name': 'Microsoft Teams', 'icon': 'users', 'category': 'professional'},
        'zoom': {'name': 'Zoom Chat', 'icon': 'video', 'category': 'professional'},
        'wechat': {'name': 'WeChat Messages', 'icon': 'message-circle', 'category': 'messaging'},
        'line': {'name': 'Line Messages', 'icon': 'message-circle', 'category': 'messaging'},
        'element_matrix': {'name': 'Element (Matrix)', 'icon': 'grid', 'category': 'messaging'},
        'mattermost': {'name': 'Mattermost', 'icon': 'message-square', 'category': 'professional'},
        'rocketchat': {'name': 'RocketChat', 'icon': 'message-square', 'category': 'professional'},
        'getstream': {'name': 'GetStream Chat & Video', 'icon': 'video', 'category': 'video'},
        'agora_video': {'name': 'Agora Video Calls', 'icon': 'video', 'category': 'video'},
        'daily_video': {'name': 'Daily.co Video', 'icon': 'video', 'category': 'video'},
        'twilio_video': {'name': 'Twilio Video', 'icon': 'video', 'category': 'video'},
        'rentmen': {'name': 'Rent.men Messages', 'icon': 'user', 'category': 'specialized'}
    }
    
    return render_template('channels.html', channels=channels, available_channels=available_channels)

@app.route('/channels/add', methods=['GET', 'POST'])
def add_channel():
    """Add new communication channel"""
    user_id = 1  # In production, get from authentication
    
    if request.method == 'POST':
        try:
            channel_type = request.form.get('channel_type')
            channel_name = request.form.get('channel_name')
            
            # Build config from form data
            config = {}
            for key, value in request.form.items():
                if key.startswith('config_') and value:
                    config_key = key.replace('config_', '')
                    config[config_key] = value
            
            # Initialize multichannel service
            multichannel_service = MultiChannelService()
            
            # Setup channel based on type
            if channel_type == 'sms':
                channel = multichannel_service.setup_sms_channel(user_id, config)
            elif channel_type == 'whatsapp':
                channel = multichannel_service.setup_whatsapp_personal(user_id, config)
            elif channel_type == 'telegram':
                channel = multichannel_service.setup_telegram_bot(user_id, config)
            elif channel_type == 'discord':
                channel = multichannel_service.setup_discord_channel(user_id, config)
            elif channel_type == 'email':
                channel = multichannel_service.setup_email_channel(user_id, config)
            elif channel_type == 'facebook_messenger':
                channel = multichannel_service.setup_facebook_messenger(user_id, config)
            elif channel_type == 'instagram':
                channel = multichannel_service.setup_instagram_messaging(user_id, config)
            elif channel_type == 'x_twitter':
                channel = multichannel_service.setup_x_twitter_dms(user_id, config)
            elif channel_type == 'reddit':
                channel = multichannel_service.setup_reddit_messaging(user_id, config)
            elif channel_type == 'bluesky':
                channel = multichannel_service.setup_bluesky_messaging(user_id, config)
            elif channel_type == 'twitch':
                channel = multichannel_service.setup_twitch_messaging(user_id, config)
            elif channel_type == 'tiktok':
                channel = multichannel_service.setup_tiktok_messaging(user_id, config)
            elif channel_type == 'rentmen':
                channel = multichannel_service.setup_rentmen_integration(user_id, config)
            # New integrations
            elif channel_type == 'slack':
                channel = multichannel_service.setup_slack_integration(user_id, config)
            elif channel_type == 'teams':
                channel = multichannel_service.setup_teams_integration(user_id, config)
            elif channel_type == 'zoom':
                channel = multichannel_service.setup_zoom_integration(user_id, config)
            elif channel_type == 'wechat':
                channel = multichannel_service.setup_wechat_integration(user_id, config)
            elif channel_type == 'line':
                channel = multichannel_service.setup_line_integration(user_id, config)
            elif channel_type == 'snapchat':
                channel = multichannel_service.setup_snapchat_integration(user_id, config)
            elif channel_type == 'linkedin':
                channel = multichannel_service.setup_linkedin_integration(user_id, config)
            elif channel_type == 'element_matrix':
                channel = multichannel_service.setup_element_matrix_integration(user_id, config)
            elif channel_type == 'mattermost':
                channel = multichannel_service.setup_mattermost_integration(user_id, config)
            elif channel_type == 'rocketchat':
                channel = multichannel_service.setup_rocketchat_integration(user_id, config)
            # Video integrations
            elif channel_type == 'getstream':
                channel = multichannel_service.setup_getstream_integration(user_id, config)
            elif channel_type == 'agora_video':
                channel = multichannel_service.setup_agora_video_integration(user_id, config)
            elif channel_type == 'daily_video':
                channel = multichannel_service.setup_daily_video_integration(user_id, config)
            elif channel_type == 'twilio_video':
                channel = multichannel_service.setup_twilio_video_integration(user_id, config)
            else:
                flash(f'Unsupported channel type: {channel_type}', 'error')
                return redirect(url_for('channels'))
            
            flash(f'{channel_name or channel_type} channel added successfully!', 'success')
            return redirect(url_for('channels'))
            
        except Exception as e:
            logging.error(f"Error adding channel: {e}")
            flash(f'Error adding channel: {str(e)}', 'error')
            return redirect(url_for('channels'))
    
    # GET request - show form
    channel_type = request.args.get('type')
    return render_template('add_channel.html', channel_type=channel_type)

@app.route('/channels/<int:channel_id>/toggle', methods=['POST'])
def toggle_channel(channel_id):
    """Toggle channel active status"""
    user_id = 1  # In production, get from authentication
    
    channel = CommunicationChannel.query.filter_by(id=channel_id, user_id=user_id).first()
    if not channel:
        flash('Channel not found', 'error')
        return redirect(url_for('channels'))
    
    channel.is_active = not channel.is_active
    db.session.commit()
    
    status = 'activated' if channel.is_active else 'deactivated'
    flash(f'Channel {status} successfully', 'success')
    return redirect(url_for('channels'))

@app.route('/channels/<int:channel_id>/delete', methods=['POST'])
def delete_channel(channel_id):
    """Delete communication channel"""
    user_id = 1  # In production, get from authentication
    
    channel = CommunicationChannel.query.filter_by(id=channel_id, user_id=user_id).first()
    if not channel:
        flash('Channel not found', 'error')
        return redirect(url_for('channels'))
    
    db.session.delete(channel)
    db.session.commit()
    
    flash('Channel deleted successfully', 'success')
    return redirect(url_for('channels'))

@app.route('/send_message', methods=['POST'])
def send_message():
    """Send message through selected channel"""
    user_id = 1  # In production, get from authentication
    
    try:
        channel_type = request.form.get('channel_type')
        recipient = request.form.get('recipient')
        message_content = request.form.get('message')
        client_id = request.form.get('client_id')
        subject = request.form.get('subject')  # For email
        
        if not all([channel_type, recipient, message_content]):
            flash('Channel type, recipient, and message are required', 'error')
            return redirect(url_for('messages'))
        
        # Initialize multichannel service
        multichannel_service = MultiChannelService()
        
        # Send message
        message_record = multichannel_service.send_message(
            user_id=user_id,
            channel_type=channel_type,
            recipient=recipient,
            message=message_content,
            client_id=int(client_id) if client_id else None,
            subject=subject
        )
        
        flash('Message sent successfully!', 'success')
        
    except Exception as e:
        logging.error(f"Error sending message: {e}")
        flash(f'Error sending message: {str(e)}', 'error')
    
    return redirect(url_for('messages'))

# Webhook routes for incoming messages

@app.route('/webhook/telegram/<int:channel_id>', methods=['POST'])
def telegram_webhook(channel_id):
    """Handle Telegram webhook"""
    try:
        user_id = 1  # In production, get from channel configuration
        
        webhook_data = request.get_json()
        if not webhook_data:
            return 'No data', 400
        
        multichannel_service = MultiChannelService()
        multichannel_service.process_incoming_telegram(webhook_data, user_id)
        
        return 'OK', 200
        
    except Exception as e:
        logging.error(f"Telegram webhook error: {e}")
        return 'Error', 500

@app.route('/webhook/facebook/<int:channel_id>', methods=['GET', 'POST'])
def facebook_webhook(channel_id):
    """Handle Facebook Messenger webhook"""
    if request.method == 'GET':
        # Webhook verification
        verify_token = request.args.get('hub.verify_token')
        challenge = request.args.get('hub.challenge')
        
        # In production, verify token against stored config
        if verify_token == 'your_verify_token':
            return challenge
        return 'Forbidden', 403
    
    try:
        user_id = 1  # In production, get from channel configuration
        
        webhook_data = request.get_json()
        if not webhook_data:
            return 'No data', 400
        
        # Process incoming Facebook Messenger message
        # (Implementation would go here)
        
        return 'OK', 200
        
    except Exception as e:
        logging.error(f"Facebook webhook error: {e}")
        return 'Error', 500

@app.route('/webhook/instagram/<int:channel_id>', methods=['POST'])
def instagram_webhook(channel_id):
    """Handle Instagram webhook"""
    try:
        user_id = 1  # In production, get from channel configuration
        
        webhook_data = request.get_json()
        if not webhook_data:
            return 'No data', 400
        
        # Process incoming Instagram message
        # (Implementation would go here)
        
        return 'OK', 200
        
    except Exception as e:
        logging.error(f"Instagram webhook error: {e}")
        return 'Error', 500

@app.route('/webhook/twitter/<int:channel_id>', methods=['POST'])
def twitter_webhook(channel_id):
    """Handle Twitter/X webhook"""
    try:
        user_id = 1  # In production, get from channel configuration
        
        webhook_data = request.get_json()
        if not webhook_data:
            return 'No data', 400
        
        # Process incoming Twitter DM
        # (Implementation would go here)
        
        return 'OK', 200
        
    except Exception as e:
        logging.error(f"Twitter webhook error: {e}")
        return 'Error', 500

@app.route('/webhook/rentmen/<int:channel_id>', methods=['POST'])
def rentmen_webhook(channel_id):
    """Handle Rent.men webhook"""
    try:
        user_id = 1  # In production, get from channel configuration
        
        webhook_data = request.get_json()
        if not webhook_data:
            return 'No data', 400
        
        # Process incoming Rent.men message
        # (Implementation would go here)
        
        return 'OK', 200
        
    except Exception as e:
        logging.error(f"Rent.men webhook error: {e}")
        return 'Error', 500
