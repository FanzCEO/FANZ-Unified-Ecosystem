import os
import uuid
import json
from datetime import datetime, timezone
from PIL import Image
import magic
from werkzeug.utils import secure_filename
from models import MediaFile
from app import db

class MediaService:
    """Service for handling media uploads and management"""
    
    def __init__(self):
        self.upload_folder = 'uploads'
        self.allowed_extensions = {
            'image': {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'},
            'video': {'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'},
            'audio': {'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'},
            'document': {'pdf', 'doc', 'docx', 'txt', 'rtf', 'xls', 'xlsx', 'ppt', 'pptx'}
        }
        self.max_file_size = 50 * 1024 * 1024  # 50MB
        
        # Ensure upload directory exists
        os.makedirs(self.upload_folder, exist_ok=True)
        
    def is_allowed_file(self, filename):
        """Check if file extension is allowed"""
        if '.' not in filename:
            return False
        
        extension = filename.rsplit('.', 1)[1].lower()
        for file_type, extensions in self.allowed_extensions.items():
            if extension in extensions:
                return True
        return False
    
    def get_file_type(self, filename):
        """Determine file type from extension"""
        if '.' not in filename:
            return 'unknown'
        
        extension = filename.rsplit('.', 1)[1].lower()
        for file_type, extensions in self.allowed_extensions.items():
            if extension in extensions:
                return file_type
        return 'unknown'
    
    def generate_unique_filename(self, original_filename):
        """Generate unique filename while preserving extension"""
        extension = ''
        if '.' in original_filename:
            extension = '.' + original_filename.rsplit('.', 1)[1].lower()
        
        unique_id = str(uuid.uuid4())
        return f"{unique_id}{extension}"
    
    def save_file(self, file, user_id, client_id=None, message_id=None, task_id=None):
        """Save uploaded file and create database record"""
        try:
            # Validate file
            if not file or file.filename == '':
                raise ValueError("No file provided")
            
            if not self.is_allowed_file(file.filename):
                raise ValueError("File type not allowed")
            
            # Check file size
            file.seek(0, 2)  # Seek to end
            file_size = file.tell()
            file.seek(0)  # Reset to beginning
            
            if file_size > self.max_file_size:
                raise ValueError(f"File too large. Maximum size is {self.max_file_size // (1024*1024)}MB")
            
            # Generate secure filename
            original_filename = secure_filename(file.filename)
            unique_filename = self.generate_unique_filename(original_filename)
            
            # Determine file paths
            file_type = self.get_file_type(original_filename)
            type_folder = os.path.join(self.upload_folder, file_type)
            os.makedirs(type_folder, exist_ok=True)
            
            file_path = os.path.join(type_folder, unique_filename)
            
            # Save file
            file.save(file_path)
            
            # Get MIME type
            mime_type = magic.from_file(file_path, mime=True)
            
            # Extract metadata
            metadata = self.extract_metadata(file_path, file_type)
            
            # Create database record
            media_file = MediaFile(
                user_id=user_id,
                client_id=client_id,
                message_id=message_id,
                task_id=task_id,
                filename=unique_filename,
                original_filename=original_filename,
                file_type=file_type,
                mime_type=mime_type,
                file_size=file_size,
                file_path=file_path,
                file_metadata=json.dumps(metadata)
            )
            
            db.session.add(media_file)
            db.session.commit()
            
            return media_file
            
        except Exception as e:
            db.session.rollback()
            # Clean up file if it was saved
            if 'file_path' in locals() and os.path.exists(file_path):
                os.remove(file_path)
            raise e
    
    def extract_metadata(self, file_path, file_type):
        """Extract metadata from file based on type"""
        metadata = {}
        
        try:
            if file_type == 'image':
                with Image.open(file_path) as img:
                    metadata['width'] = img.width
                    metadata['height'] = img.height
                    metadata['format'] = img.format
                    metadata['mode'] = img.mode
                    
                    # Extract EXIF data if available
                    if hasattr(img, '_getexif') and img._getexif():
                        exif = img._getexif()
                        if exif:
                            metadata['exif'] = dict(exif)
            
            elif file_type == 'video':
                # For video files, you might want to use ffprobe or similar
                # For now, just basic info
                metadata['type'] = 'video'
                
            elif file_type == 'audio':
                # For audio files, you might want to use mutagen or similar
                metadata['type'] = 'audio'
                
            elif file_type == 'document':
                metadata['type'] = 'document'
                
        except Exception as e:
            metadata['extraction_error'] = str(e)
        
        metadata['processed_at'] = datetime.now(timezone.utc).isoformat()
        return metadata
    
    def get_file_url(self, media_file):
        """Generate URL for accessing the file"""
        return f"/media/{media_file.id}/{media_file.filename}"
    
    def delete_file(self, media_file_id, user_id):
        """Delete file and database record"""
        try:
            media_file = MediaFile.query.filter_by(
                id=media_file_id, 
                user_id=user_id
            ).first()
            
            if not media_file:
                raise ValueError("File not found")
            
            # Delete physical file
            if os.path.exists(media_file.file_path):
                os.remove(media_file.file_path)
            
            # Delete database record
            db.session.delete(media_file)
            db.session.commit()
            
            return True
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def get_user_files(self, user_id, file_type=None, limit=50, offset=0):
        """Get user's files with optional filtering"""
        query = MediaFile.query.filter_by(user_id=user_id)
        
        if file_type:
            query = query.filter_by(file_type=file_type)
        
        query = query.order_by(MediaFile.created_at.desc())
        query = query.offset(offset).limit(limit)
        
        return query.all()
    
    def get_client_files(self, user_id, client_id, limit=20):
        """Get files associated with a specific client"""
        return MediaFile.query.filter_by(
            user_id=user_id,
            client_id=client_id
        ).order_by(MediaFile.created_at.desc()).limit(limit).all()
    
    def resize_image(self, media_file, width, height=None):
        """Resize image and save as new file"""
        if media_file.file_type != 'image':
            raise ValueError("Not an image file")
        
        try:
            with Image.open(media_file.file_path) as img:
                if height is None:
                    # Maintain aspect ratio
                    ratio = width / img.width
                    height = int(img.height * ratio)
                
                resized_img = img.resize((width, height), Image.Resampling.LANCZOS)
                
                # Generate new filename
                base_name = os.path.splitext(media_file.filename)[0]
                extension = os.path.splitext(media_file.filename)[1]
                new_filename = f"{base_name}_{width}x{height}{extension}"
                
                # Save resized image
                type_folder = os.path.dirname(media_file.file_path)
                new_file_path = os.path.join(type_folder, new_filename)
                resized_img.save(new_file_path)
                
                return new_file_path
                
        except Exception as e:
            raise e