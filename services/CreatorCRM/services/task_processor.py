import json
import logging
from datetime import datetime, timezone
from app import db
from models import Task, User, Client, Message, Appointment
from services.messaging import send_sms_message
from services.google_contacts import get_or_create_tag, apply_tags_to_client

class TaskProcessor:
    """Process background tasks"""
    
    def __init__(self):
        self.task_handlers = {
            'send_sms': self.handle_send_sms,
            'send_email': self.handle_send_email,
            'add_tag': self.handle_add_tag,
            'remove_tag': self.handle_remove_tag,
            'create_appointment': self.handle_create_appointment,
            'update_notes': self.handle_update_notes,
        }
    
    def process_pending_tasks(self, limit: int = 10) -> int:
        """Process pending tasks"""
        now = datetime.now(timezone.utc)
        
        # Get pending tasks that are ready to run
        tasks = Task.query.filter(
            Task.status == 'pending',
            db.or_(
                Task.scheduled_at.is_(None),
                Task.scheduled_at <= now
            )
        ).order_by(Task.priority, Task.created_at).limit(limit).all()
        
        processed_count = 0
        
        for task in tasks:
            try:
                success = self.process_task(task)
                processed_count += 1
                
                if success:
                    logging.info(f"Task {task.id} completed successfully")
                else:
                    logging.warning(f"Task {task.id} failed")
                    
            except Exception as e:
                logging.error(f"Error processing task {task.id}: {e}")
                self.fail_task(task, str(e))
        
        db.session.commit()
        return processed_count
    
    def process_task(self, task: Task) -> bool:
        """Process a single task"""
        task.status = 'processing'
        task.started_at = datetime.now(timezone.utc)
        task.attempts += 1
        
        try:
            # Parse task data
            task_data = json.loads(task.task_data)
            
            # Get task handler
            handler = self.task_handlers.get(task.task_type)
            if not handler:
                self.fail_task(task, f"Unknown task type: {task.task_type}")
                return False
            
            # Execute task
            result = handler(task_data, task.user_id)
            
            if result.get('success', False):
                task.status = 'completed'
                task.completed_at = datetime.now(timezone.utc)
                return True
            else:
                error_msg = result.get('error', 'Task failed')
                if task.attempts >= task.max_attempts:
                    self.fail_task(task, error_msg)
                else:
                    task.status = 'pending'  # Retry later
                return False
                
        except Exception as e:
            error_msg = str(e)
            if task.attempts >= task.max_attempts:
                self.fail_task(task, error_msg)
            else:
                task.status = 'pending'  # Retry later
            return False
    
    def fail_task(self, task: Task, error_msg: str):
        """Mark task as failed"""
        task.status = 'failed'
        task.error_message = error_msg
        task.completed_at = datetime.now(timezone.utc)
        logging.error(f"Task {task.id} failed: {error_msg}")
    
    def handle_send_sms(self, task_data: dict, user_id: int) -> dict:
        """Send SMS message"""
        try:
            phone_number = task_data.get('phone_number')
            message = task_data.get('message')
            
            if not phone_number or not message:
                return {"success": False, "error": "Missing phone number or message"}
            
            message_sid = send_sms_message(phone_number, message)
            
            if message_sid:
                # Log the outbound message
                client = Client.query.filter_by(user_id=user_id, phone_number=phone_number).first()
                if client:
                    message_record = Message(
                        user_id=user_id,
                        client_id=client.id,
                        direction='outbound',
                        channel='sms',
                        content=message,
                        phone_number=phone_number,
                        twilio_sid=message_sid,
                        processed=True
                    )
                    db.session.add(message_record)
                
                return {"success": True, "message_sid": message_sid}
            else:
                return {"success": False, "error": "Failed to send SMS"}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def handle_send_email(self, task_data: dict, user_id: int) -> dict:
        """Send email (placeholder - would need email service integration)"""
        return {"success": False, "error": "Email sending not implemented"}
    
    def handle_add_tag(self, task_data: dict, user_id: int) -> dict:
        """Add tag to client"""
        try:
            client_id = task_data.get('client_id')
            tag_name = task_data.get('tag_name')
            
            if not client_id or not tag_name:
                return {"success": False, "error": "Missing client_id or tag_name"}
            
            client = Client.query.get(client_id)
            if not client or client.user_id != user_id:
                return {"success": False, "error": "Client not found"}
            
            # Get or create tag and apply to client
            tag = get_or_create_tag(user_id, tag_name)
            
            # Check if client already has this tag
            from models import ClientTag
            existing = ClientTag.query.filter_by(client_id=client_id, tag_id=tag.id).first()
            if not existing:
                client_tag = ClientTag(client_id=client_id, tag_id=tag.id)
                db.session.add(client_tag)
                
                # Update client's tags string
                current_tags = client.tags.split(', ') if client.tags else []
                if tag_name not in current_tags:
                    current_tags.append(tag_name)
                    client.tags = ', '.join(current_tags)
            
            return {"success": True, "tag_added": tag_name}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def handle_remove_tag(self, task_data: dict, user_id: int) -> dict:
        """Remove tag from client"""
        try:
            client_id = task_data.get('client_id')
            tag_name = task_data.get('tag_name')
            
            if not client_id or not tag_name:
                return {"success": False, "error": "Missing client_id or tag_name"}
            
            client = Client.query.get(client_id)
            if not client or client.user_id != user_id:
                return {"success": False, "error": "Client not found"}
            
            from models import Tag, ClientTag
            tag = Tag.query.filter_by(user_id=user_id, name=tag_name).first()
            if tag:
                client_tag = ClientTag.query.filter_by(client_id=client_id, tag_id=tag.id).first()
                if client_tag:
                    db.session.delete(client_tag)
                    
                    # Update client's tags string
                    current_tags = client.tags.split(', ') if client.tags else []
                    if tag_name in current_tags:
                        current_tags.remove(tag_name)
                        client.tags = ', '.join(current_tags) if current_tags else None
            
            return {"success": True, "tag_removed": tag_name}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def handle_create_appointment(self, task_data: dict, user_id: int) -> dict:
        """Create appointment"""
        try:
            client_id = task_data.get('client_id')
            title = task_data.get('title', 'Appointment')
            start_time_str = task_data.get('start_time')
            duration_minutes = task_data.get('duration_minutes', 60)
            location = task_data.get('location', '')
            
            if not client_id or not start_time_str:
                return {"success": False, "error": "Missing client_id or start_time"}
            
            client = Client.query.get(client_id)
            if not client or client.user_id != user_id:
                return {"success": False, "error": "Client not found"}
            
            start_time = datetime.fromisoformat(start_time_str)
            end_time = start_time + timedelta(minutes=duration_minutes)
            
            appointment = Appointment(
                user_id=user_id,
                client_id=client_id,
                title=title,
                start_time=start_time,
                end_time=end_time,
                location=location,
                status='tentative'
            )
            
            db.session.add(appointment)
            return {"success": True, "appointment_id": appointment.id}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def handle_update_notes(self, task_data: dict, user_id: int) -> dict:
        """Update client notes"""
        try:
            client_id = task_data.get('client_id')
            notes = task_data.get('notes', '')
            action = task_data.get('action', 'append')  # append or replace
            
            if not client_id:
                return {"success": False, "error": "Missing client_id"}
            
            client = Client.query.get(client_id)
            if not client or client.user_id != user_id:
                return {"success": False, "error": "Client not found"}
            
            if action == 'replace':
                client.notes = notes
            else:  # append
                if client.notes:
                    client.notes += f"\n{notes}"
                else:
                    client.notes = notes
            
            return {"success": True, "notes_updated": True}
            
        except Exception as e:
            return {"success": False, "error": str(e)}

# Global task processor instance
task_processor = TaskProcessor()

def process_tasks(limit: int = 10) -> int:
    """Convenience function to process tasks"""
    return task_processor.process_pending_tasks(limit)