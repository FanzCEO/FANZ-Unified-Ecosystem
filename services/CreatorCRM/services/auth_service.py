from flask import session, request, redirect, url_for, flash
from functools import wraps
from models import User
from app import db
import secrets
from datetime import datetime, timedelta

class AuthService:
    """Service for user authentication and session management"""
    
    @staticmethod
    def login_required(f):
        """Decorator to require authentication"""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user = AuthService.get_current_user()
            if not current_user:
                flash('Please sign in to access this page.', 'error')
                return redirect(url_for('signin'))
            return f(*args, **kwargs)
        return decorated_function
    
    @staticmethod
    def get_current_user():
        """Get the currently logged in user"""
        try:
            if 'user_id' in session and session['user_id']:
                user = User.query.get(session['user_id'])
                if user:
                    return user
            return None
        except Exception as e:
            # If there's any error, clear the session and return None
            session.clear()
            return None
    
    @staticmethod
    def login_user(user):
        """Log in a user"""
        session['user_id'] = user.id
        session['username'] = user.username
        session.permanent = True
    
    @staticmethod
    def logout_user():
        """Log out the current user"""
        session.pop('user_id', None)
        session.pop('username', None)
    
    @staticmethod
    def register_user(username, email, password, business_name=None, website=None):
        """Register a new user"""
        try:
            # Check if user already exists
            if User.query.filter_by(email=email).first():
                raise Exception("Email address is already registered")
            
            if User.query.filter_by(username=username).first():
                raise Exception("Username is already taken")
            
            # Create new user
            user = User(
                username=username,
                email=email,
                business_name=business_name,
                website=website,
                is_verified=False
            )
            user.set_password(password)
            
            db.session.add(user)
            db.session.commit()
            
            return user
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    @staticmethod
    def authenticate_user(email, password):
        """Authenticate a user with email and password"""
        user = User.query.filter_by(email=email).first()
        
        if user and user.check_password(password):
            return user
        
        return None
    
    @staticmethod
    def send_verification_email(user):
        """Send email verification (placeholder)"""
        # In production, this would send an actual email
        # For now, just mark as verified for demo purposes
        user.is_verified = True
        db.session.commit()
        return True
    
    @staticmethod
    def verify_email(user_id, token):
        """Verify email address with token"""
        # In production, this would verify the token
        user = User.query.get(user_id)
        if user:
            user.is_verified = True
            db.session.commit()
            return True
        return False
    
    @staticmethod
    def generate_reset_token(email):
        """Generate a password reset token for a user"""
        user = User.query.filter_by(email=email).first()
        if not user:
            return None
        
        # Generate secure token
        token = secrets.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8')
        
        # Set token and expiration (24 hours)
        user.reset_token = token
        user.reset_token_expires = datetime.utcnow() + timedelta(hours=24)
        
        db.session.commit()
        return token
    
    @staticmethod
    def reset_password(token, new_password):
        """Reset password using reset token"""
        user = User.query.filter_by(reset_token=token).first()
        
        if not user:
            return False, "Invalid reset token"
        
        # Check if token has expired
        if user.reset_token_expires < datetime.utcnow():
            return False, "Reset token has expired"
        
        # Reset password and clear token
        user.set_password(new_password)
        user.reset_token = None
        user.reset_token_expires = None
        
        db.session.commit()
        return True, "Password reset successfully"
    
    @staticmethod
    def send_reset_email(email, token):
        """Send password reset email (placeholder implementation)"""
        # In production, this would send an actual email with the reset link
        # For demo purposes, we'll just mark it as sent
        # The reset link would be: /reset-password/{token}
        return True