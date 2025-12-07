import json
from datetime import datetime, timezone, timedelta
from models import Task, Reminder, CommunicationChannel, Client
from app import db

class TaskService:
    """Service for managing tasks, reminders, and scheduling"""
    
    def __init__(self):
        pass
    
    def create_task(self, user_id, title, description, task_type, task_data=None, 
                   scheduled_at=None, due_at=None, priority=5, category=None, 
                   client_id=None, requires_ai=False):
        """Create a new task"""
        try:
            task = Task(
                user_id=user_id,
                title=title,
                description=description,
                task_type=task_type,
                task_data=json.dumps(task_data or {}),
                scheduled_at=scheduled_at,
                due_at=due_at,
                priority=priority,
                category=category,
                requires_ai_assistance=requires_ai
            )
            
            db.session.add(task)
            db.session.commit()
            
            return task
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def create_reminder(self, user_id, title, description, reminder_type, 
                       scheduled_at, channel_type, client_id=None, 
                       channel_id=None, is_recurring=False, recurrence_config=None):
        """Create a new reminder"""
        try:
            reminder = Reminder(
                user_id=user_id,
                client_id=client_id,
                title=title,
                description=description,
                reminder_type=reminder_type,
                scheduled_at=scheduled_at,
                channel_type=channel_type,
                channel_id=channel_id,
                is_recurring=is_recurring,
                recurrence_config=json.dumps(recurrence_config) if recurrence_config else None
            )
            
            db.session.add(reminder)
            db.session.commit()
            
            return reminder
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def get_pending_tasks(self, user_id, limit=50):
        """Get pending tasks for a user"""
        return Task.query.filter_by(
            user_id=user_id,
            status='pending'
        ).order_by(Task.priority.asc(), Task.scheduled_at.asc()).limit(limit).all()
    
    def get_overdue_tasks(self, user_id):
        """Get overdue tasks"""
        now = datetime.now(timezone.utc)
        return Task.query.filter(
            Task.user_id == user_id,
            Task.status == 'pending',
            Task.due_at < now
        ).order_by(Task.due_at.asc()).all()
    
    def get_scheduled_reminders(self, limit=100):
        """Get reminders that are due to be sent"""
        now = datetime.now(timezone.utc)
        return Reminder.query.filter(
            Reminder.status == 'scheduled',
            Reminder.scheduled_at <= now
        ).limit(limit).all()
    
    def complete_task(self, task_id, user_id, completion_notes=None):
        """Mark a task as completed"""
        try:
            task = Task.query.filter_by(id=task_id, user_id=user_id).first()
            if not task:
                raise ValueError("Task not found")
            
            task.status = 'completed'
            task.completed_at = datetime.now(timezone.utc)
            
            if completion_notes:
                task_data = json.loads(task.task_data or '{}')
                task_data['completion_notes'] = completion_notes
                task.task_data = json.dumps(task_data)
            
            db.session.commit()
            return task
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def cancel_task(self, task_id, user_id, reason=None):
        """Cancel a task"""
        try:
            task = Task.query.filter_by(id=task_id, user_id=user_id).first()
            if not task:
                raise ValueError("Task not found")
            
            task.status = 'cancelled'
            
            if reason:
                task_data = json.loads(task.task_data or '{}')
                task_data['cancellation_reason'] = reason
                task.task_data = json.dumps(task_data)
            
            db.session.commit()
            return task
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def process_scheduled_tasks(self):
        """Process tasks that are scheduled to run now"""
        try:
            now = datetime.now(timezone.utc)
            due_tasks = Task.query.filter(
                Task.status == 'pending',
                Task.scheduled_at <= now
            ).all()
            
            for task in due_tasks:
                try:
                    self._execute_task(task)
                except Exception as e:
                    task.status = 'failed'
                    task.error_message = str(e)
                    task.attempts += 1
                    
                    # Retry logic
                    if task.attempts < task.max_attempts:
                        task.status = 'pending'
                        task.scheduled_at = now + timedelta(minutes=30)  # Retry in 30 minutes
                
                db.session.commit()
                
        except Exception as e:
            print(f"Task processing error: {e}")
    
    def _execute_task(self, task):
        """Execute a specific task based on its type"""
        task.status = 'processing'
        task.started_at = datetime.now(timezone.utc)
        
        task_data = json.loads(task.task_data or '{}')
        
        if task.task_type == 'send_sms':
            self._execute_sms_task(task, task_data)
        elif task.task_type == 'send_email':
            self._execute_email_task(task, task_data)
        elif task.task_type == 'follow_up':
            self._execute_follow_up_task(task, task_data)
        elif task.task_type == 'reminder':
            self._execute_reminder_task(task, task_data)
        else:
            # For AI tasks and others, mark as ready for processing
            if task.requires_ai_assistance:
                # These will be processed by AI service
                return
            else:
                task.status = 'completed'
        
        task.completed_at = datetime.now(timezone.utc)
    
    def _execute_sms_task(self, task, task_data):
        """Execute SMS sending task"""
        from services.multichannel_service import MultiChannelService
        
        channel_service = MultiChannelService()
        
        phone_number = task_data.get('phone_number')
        message = task_data.get('message')
        client_id = task_data.get('client_id')
        
        if phone_number and message:
            channel_service.send_message(
                user_id=task.user_id,
                channel_type='sms',
                recipient=phone_number,
                message=message,
                client_id=client_id
            )
            task.status = 'completed'
        else:
            raise ValueError("Missing required SMS data")
    
    def _execute_email_task(self, task, task_data):
        """Execute email sending task"""
        from services.multichannel_service import MultiChannelService
        
        channel_service = MultiChannelService()
        
        email = task_data.get('email')
        subject = task_data.get('subject')
        message = task_data.get('message')
        client_id = task_data.get('client_id')
        
        if email and message:
            channel_service.send_message(
                user_id=task.user_id,
                channel_type='email',
                recipient=email,
                message=message,
                subject=subject,
                client_id=client_id
            )
            task.status = 'completed'
        else:
            raise ValueError("Missing required email data")
    
    def _execute_follow_up_task(self, task, task_data):
        """Execute follow-up task (create reminder or message)"""
        client_id = task_data.get('client_id')
        action_type = task_data.get('action_type', 'reminder')
        
        if action_type == 'reminder':
            # Create a follow-up reminder
            reminder_time = datetime.now(timezone.utc) + timedelta(hours=24)
            
            self.create_reminder(
                user_id=task.user_id,
                title=f"Follow up with client",
                description=task_data.get('message', 'Follow up on previous conversation'),
                reminder_type='follow_up',
                scheduled_at=reminder_time,
                channel_type='email',
                client_id=client_id
            )
        
        task.status = 'completed'
    
    def _execute_reminder_task(self, task, task_data):
        """Execute reminder task (send notification)"""
        # This creates a reminder record
        self.create_reminder(
            user_id=task.user_id,
            title=task_data.get('title', task.title),
            description=task_data.get('description', task.description),
            reminder_type=task_data.get('reminder_type', 'custom'),
            scheduled_at=datetime.now(timezone.utc),
            channel_type=task_data.get('channel_type', 'email'),
            client_id=task_data.get('client_id')
        )
        
        task.status = 'completed'
    
    def send_due_reminders(self):
        """Send all due reminders"""
        try:
            from services.multichannel_service import MultiChannelService
            
            channel_service = MultiChannelService()
            due_reminders = self.get_scheduled_reminders()
            
            for reminder in due_reminders:
                try:
                    # Get client info if available
                    client = None
                    if reminder.client_id:
                        client = Client.query.get(reminder.client_id)
                    
                    # Determine recipient
                    recipient = None
                    if reminder.channel_type == 'email':
                        recipient = client.email if client else None
                    elif reminder.channel_type in ['sms', 'whatsapp']:
                        recipient = client.phone_number if client else None
                    
                    if recipient:
                        # Send reminder message
                        message = f"{reminder.title}\n\n{reminder.description}"
                        
                        if reminder.channel_type == 'email':
                            subject = f"Reminder: {reminder.title}"
                        else:
                            subject = None
                        
                        channel_service.send_message(
                            user_id=reminder.user_id,
                            channel_type=reminder.channel_type,
                            recipient=recipient,
                            message=message,
                            subject=subject,
                            client_id=reminder.client_id
                        )
                    
                    # Mark reminder as sent
                    reminder.status = 'sent'
                    reminder.sent_at = datetime.now(timezone.utc)
                    
                    # Handle recurring reminders
                    if reminder.is_recurring and reminder.recurrence_config:
                        self._create_next_recurrence(reminder)
                    
                except Exception as e:
                    reminder.status = 'failed'
                    print(f"Reminder sending error: {e}")
                
                db.session.commit()
                
        except Exception as e:
            print(f"Reminder processing error: {e}")
    
    def _create_next_recurrence(self, reminder):
        """Create the next occurrence of a recurring reminder"""
        try:
            recurrence_config = json.loads(reminder.recurrence_config or '{}')
            interval_type = recurrence_config.get('interval_type', 'days')
            interval_value = recurrence_config.get('interval_value', 1)
            
            # Calculate next occurrence
            if interval_type == 'days':
                next_time = reminder.scheduled_at + timedelta(days=interval_value)
            elif interval_type == 'weeks':
                next_time = reminder.scheduled_at + timedelta(weeks=interval_value)
            elif interval_type == 'months':
                next_time = reminder.scheduled_at + timedelta(days=interval_value * 30)
            else:
                return  # Unknown interval type
            
            # Create new reminder
            new_reminder = Reminder(
                user_id=reminder.user_id,
                client_id=reminder.client_id,
                title=reminder.title,
                description=reminder.description,
                reminder_type=reminder.reminder_type,
                scheduled_at=next_time,
                channel_type=reminder.channel_type,
                channel_id=reminder.channel_id,
                is_recurring=True,
                recurrence_config=reminder.recurrence_config,
                is_ai_generated=reminder.is_ai_generated,
                ai_context=reminder.ai_context
            )
            
            db.session.add(new_reminder)
            
        except Exception as e:
            print(f"Recurrence creation error: {e}")
    
    def get_task_statistics(self, user_id):
        """Get task statistics for a user"""
        try:
            stats = {
                'total_tasks': Task.query.filter_by(user_id=user_id).count(),
                'pending_tasks': Task.query.filter_by(user_id=user_id, status='pending').count(),
                'completed_tasks': Task.query.filter_by(user_id=user_id, status='completed').count(),
                'overdue_tasks': len(self.get_overdue_tasks(user_id)),
                'high_priority_tasks': Task.query.filter(
                    Task.user_id == user_id,
                    Task.status == 'pending',
                    Task.priority <= 3
                ).count()
            }
            
            return stats
            
        except Exception as e:
            print(f"Statistics error: {e}")
            return {}
    
    def create_follow_up_sequence(self, user_id, client_id, sequence_config):
        """Create a sequence of follow-up tasks"""
        try:
            tasks = []
            base_time = datetime.now(timezone.utc)
            
            for i, step in enumerate(sequence_config.get('steps', [])):
                delay_hours = step.get('delay_hours', 24)
                scheduled_time = base_time + timedelta(hours=delay_hours)
                
                task = Task(
                    user_id=user_id,
                    title=step.get('title', f'Follow-up Step {i+1}'),
                    description=step.get('description', ''),
                    task_type=step.get('task_type', 'follow_up'),
                    task_data=json.dumps({
                        'client_id': client_id,
                        'message': step.get('message', ''),
                        'channel_type': step.get('channel_type', 'email'),
                        'sequence_step': i + 1
                    }),
                    scheduled_at=scheduled_time,
                    priority=step.get('priority', 5),
                    category='follow_up'
                )
                
                db.session.add(task)
                tasks.append(task)
            
            db.session.commit()
            return tasks
            
        except Exception as e:
            db.session.rollback()
            raise e