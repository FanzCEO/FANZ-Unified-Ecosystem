import json
import logging
import re
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Tuple
from app import db
from models import (
    User, Client, Message, Appointment, Template, Tag, ClientTag,
    Workflow, Rule, Task, WorkflowExecution
)
from services.messaging import send_sms_message, get_template_by_category
from services.google_contacts import get_or_create_tag, apply_tags_to_client

class ConditionEvaluator:
    """Evaluate different types of conditions"""
    
    @staticmethod
    def message_contains(context: Dict, config: Dict) -> bool:
        """Check if message contains specific text"""
        message = context.get('message')
        if not message:
            return False
        
        text_to_find = config.get('text', '').lower()
        case_sensitive = config.get('case_sensitive', False)
        
        # Handle both model objects and dictionaries
        if hasattr(message, 'content'):
            message_content = message.content
        elif isinstance(message, dict) and 'content' in message:
            message_content = message['content']
        else:
            return False
        
        if not case_sensitive:
            message_content = message_content.lower()
        
        return text_to_find in message_content
    
    @staticmethod
    def message_matches_regex(context: Dict, config: Dict) -> bool:
        """Check if message matches regex pattern"""
        message = context.get('message')
        if not message:
            return False
        
        pattern = config.get('pattern', '')
        flags = re.IGNORECASE if not config.get('case_sensitive', False) else 0
        
        # Handle both model objects and dictionaries
        if hasattr(message, 'content'):
            message_content = message.content
        elif isinstance(message, dict) and 'content' in message:
            message_content = message['content']
        else:
            return False
        
        try:
            return bool(re.search(pattern, message_content, flags))
        except re.error:
            logging.error(f"Invalid regex pattern: {pattern}")
            return False
    
    @staticmethod
    def client_has_tag(context: Dict, config: Dict) -> bool:
        """Check if client has specific tag"""
        client = context.get('client')
        if not client:
            return False
        
        tag_name = config.get('tag_name', '')
        if not tag_name:
            return False
        
        # Get client ID and user ID
        if hasattr(client, 'id'):
            client_id = client.id
            user_id = client.user_id
        elif isinstance(client, dict):
            client_id = client.get('id')
            user_id = client.get('user_id')
        else:
            return False
        
        if not client_id or not user_id:
            return False
        
        # Check if client has the tag
        from models import Tag, ClientTag
        tag = Tag.query.filter_by(user_id=user_id, name=tag_name).first()
        if not tag:
            return False
        
        client_tag = ClientTag.query.filter_by(client_id=client_id, tag_id=tag.id).first()
        return client_tag is not None
    
    @staticmethod
    def client_is_new(context: Dict, config: Dict) -> bool:
        """Check if client was created recently"""
        client = context.get('client')
        if not client:
            return False
        
        hours_threshold = config.get('hours', 24)
        threshold_time = datetime.now(timezone.utc) - timedelta(hours=hours_threshold)
        
        # Handle both model objects and dictionaries
        if hasattr(client, 'created_at'):
            created_at = client.created_at
        elif isinstance(client, dict) and 'created_at' in client:
            created_at_str = client['created_at']
            if isinstance(created_at_str, str):
                created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
            else:
                created_at = created_at_str
        else:
            return False
        
        return created_at > threshold_time
    
    @staticmethod
    def time_based(context: Dict, config: Dict) -> bool:
        """Check time-based conditions"""
        current_time = datetime.now(timezone.utc)
        
        condition_type = config.get('type', 'time_of_day')
        
        if condition_type == 'time_of_day':
            # Check if current time falls within specified hours
            start_hour = config.get('start_hour', 0)
            end_hour = config.get('end_hour', 23)
            current_hour = current_time.hour
            
            if start_hour <= end_hour:
                return start_hour <= current_hour <= end_hour
            else:  # Overnight range (e.g., 22:00 to 6:00)
                return current_hour >= start_hour or current_hour <= end_hour
        
        elif condition_type == 'day_of_week':
            # Check if current day is in specified days (0=Monday, 6=Sunday)
            allowed_days = config.get('days', [0, 1, 2, 3, 4, 5, 6])
            return current_time.weekday() in allowed_days
        
        elif condition_type == 'date_range':
            # Check if current date falls within range
            start_date = config.get('start_date')
            end_date = config.get('end_date')
            
            if start_date:
                start_date = datetime.fromisoformat(start_date).replace(tzinfo=timezone.utc)
                if current_time < start_date:
                    return False
            
            if end_date:
                end_date = datetime.fromisoformat(end_date).replace(tzinfo=timezone.utc)
                if current_time > end_date:
                    return False
            
            return True
        
        return False
    
    @staticmethod
    def message_channel(context: Dict, config: Dict) -> bool:
        """Check message channel (sms, email, etc.)"""
        message = context.get('message')
        if not message:
            return False
        
        expected_channel = config.get('channel', 'sms')
        return message.channel == expected_channel
    
    @staticmethod
    def appointment_status(context: Dict, config: Dict) -> bool:
        """Check appointment status"""
        appointment = context.get('appointment')
        if not appointment:
            return False
        
        expected_status = config.get('status', 'confirmed')
        return appointment.status == expected_status

class ActionExecutor:
    """Execute different types of actions"""
    
    @staticmethod
    def send_message(context: Dict, config: Dict) -> Dict[str, Any]:
        """Send SMS message to client"""
        client = context.get('client')
        user_id = context.get('user_id')
        
        # Get phone number from client
        if hasattr(client, 'phone_number'):
            phone_number = client.phone_number
        elif isinstance(client, dict) and 'phone_number' in client:
            phone_number = client['phone_number']
        else:
            phone_number = None
        
        if not client or not phone_number:
            return {"success": False, "error": "No client or phone number"}
        
        message_text = config.get('message', '')
        if not message_text:
            # Try to get template
            template_category = config.get('template_category')
            if template_category and user_id:
                message_text = get_template_by_category(user_id, template_category)
            else:
                return {"success": False, "error": "No message text provided"}
        
        # Replace placeholders
        message_text = ActionExecutor._replace_placeholders(message_text, context)
        
        # Send SMS
        message_sid = send_sms_message(phone_number, message_text)
        
        if message_sid:
            # Log outbound message
            from models import Message
            message = Message()
            message.user_id = user_id
            message.client_id = client.id if hasattr(client, 'id') else client.get('id')
            message.direction = 'outbound'
            message.channel = 'sms'
            message.content = message_text
            message.phone_number = phone_number
            message.twilio_sid = message_sid
            message.processed = True
            db.session.add(message)
            return {"success": True, "message_sid": message_sid}
        else:
            return {"success": False, "error": "Failed to send SMS"}
    
    @staticmethod
    def add_tag(context: Dict, config: Dict) -> Dict[str, Any]:
        """Add tag to client"""
        client = context.get('client')
        user_id = context.get('user_id')
        
        if not client:
            return {"success": False, "error": "No client"}
        
        tag_name = config.get('tag_name', '')
        if not tag_name:
            return {"success": False, "error": "No tag name provided"}
        
        try:
            # Get or create tag
            if not user_id:
                return {"success": False, "error": "No user ID provided"}
                
            tag = get_or_create_tag(user_id, tag_name)
            
            # Get client ID
            client_id = client.id if hasattr(client, 'id') else client.get('id')
            if not client_id:
                return {"success": False, "error": "No client ID found"}
            
            # Check if client already has this tag
            from models import ClientTag
            existing = ClientTag.query.filter_by(client_id=client_id, tag_id=tag.id).first()
            if not existing:
                client_tag = ClientTag()
                client_tag.client_id = client_id
                client_tag.tag_id = tag.id
                db.session.add(client_tag)
                
                # Update comma-separated tags string on client object
                if hasattr(client, 'tags'):
                    current_tags = client.tags.split(', ') if client.tags else []
                    if tag_name not in current_tags:
                        current_tags.append(tag_name)
                        client.tags = ', '.join(current_tags)
                else:
                    # If client is a dict, we can't update tags directly
                    pass
                
                return {"success": True, "tag_added": tag_name}
            else:
                return {"success": True, "tag_exists": tag_name}
        
        except Exception as e:
            logging.error(f"Error adding tag: {e}")
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def remove_tag(context: Dict, config: Dict) -> Dict[str, Any]:
        """Remove tag from client"""
        client = context.get('client')
        user_id = context.get('user_id')
        
        if not client:
            return {"success": False, "error": "No client"}
        
        tag_name = config.get('tag_name', '')
        if not tag_name:
            return {"success": False, "error": "No tag name provided"}
        
        try:
            tag = Tag.query.filter_by(user_id=user_id, name=tag_name).first()
            if tag:
                client_tag = ClientTag.query.filter_by(client_id=client.id, tag_id=tag.id).first()
                if client_tag:
                    db.session.delete(client_tag)
                    
                    # Update comma-separated tags string
                    current_tags = client.tags.split(', ') if client.tags else []
                    if tag_name in current_tags:
                        current_tags.remove(tag_name)
                        client.tags = ', '.join(current_tags) if current_tags else None
                    
                    return {"success": True, "tag_removed": tag_name}
            
            return {"success": True, "tag_not_found": tag_name}
        
        except Exception as e:
            logging.error(f"Error removing tag: {e}")
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def update_notes(context: Dict, config: Dict) -> Dict[str, Any]:
        """Update or append to client notes"""
        client = context.get('client')
        if not client:
            return {"success": False, "error": "No client"}
        
        notes_text = config.get('notes', '')
        if not notes_text:
            return {"success": False, "error": "No notes text provided"}
        
        # Replace placeholders
        notes_text = ActionExecutor._replace_placeholders(notes_text, context)
        
        action_type = config.get('action', 'append')  # append, replace
        
        try:
            if action_type == 'replace':
                client.notes = notes_text
            else:  # append
                if client.notes:
                    client.notes += f"\n{notes_text}"
                else:
                    client.notes = notes_text
            
            return {"success": True, "notes_updated": True}
        
        except Exception as e:
            logging.error(f"Error updating notes: {e}")
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def create_task(context: Dict, config: Dict) -> Dict[str, Any]:
        """Create a delayed task"""
        user_id = context.get('user_id')
        if not user_id:
            return {"success": False, "error": "No user ID"}
        
        task_type = config.get('task_type', '')
        task_data = config.get('task_data', {})
        delay_hours = config.get('delay_hours', 0)
        delay_minutes = config.get('delay_minutes', 0)
        
        if not task_type:
            return {"success": False, "error": "No task type provided"}
        
        scheduled_at = None
        if delay_hours > 0 or delay_minutes > 0:
            scheduled_at = datetime.now(timezone.utc) + timedelta(
                hours=delay_hours, minutes=delay_minutes
            )
        
        try:
            from models import Task
            task = Task()
            task.user_id = user_id
            task.task_type = task_type
            task.task_data = json.dumps(task_data)
            task.scheduled_at = scheduled_at
            db.session.add(task)
            
            return {"success": True, "task_created": task_type}
        
        except Exception as e:
            logging.error(f"Error creating task: {e}")
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def _replace_placeholders(text: str, context: Dict) -> str:
        """Replace placeholders in text with context values"""
        client = context.get('client')
        message = context.get('message')
        appointment = context.get('appointment')
        
        # Helper function to get value from object or dict
        def get_value(obj, key, default=''):
            if not obj:
                return default
            if hasattr(obj, key):
                return getattr(obj, key) or default
            elif isinstance(obj, dict):
                return obj.get(key, default)
            return default
        
        replacements = {
            '{client_name}': get_value(client, 'name'),
            '{client_phone}': get_value(client, 'phone_number'),
            '{client_email}': get_value(client, 'email'),
            '{message_content}': get_value(message, 'content'),
            '{current_time}': datetime.now().strftime('%Y-%m-%d %H:%M'),
            '{current_date}': datetime.now().strftime('%Y-%m-%d'),
        }
        
        if appointment:
            replacements.update({
                '{appointment_title}': get_value(appointment, 'title'),
                '{appointment_time}': get_value(appointment, 'start_time'),
                '{appointment_location}': get_value(appointment, 'location'),
            })
            
            # Format datetime if it's a datetime object
            if hasattr(appointment, 'start_time') and hasattr(appointment.start_time, 'strftime'):
                replacements['{appointment_time}'] = appointment.start_time.strftime('%Y-%m-%d %H:%M')
            elif isinstance(appointment, dict) and 'start_time' in appointment:
                start_time_str = appointment['start_time']
                if isinstance(start_time_str, str):
                    try:
                        start_time = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
                        replacements['{appointment_time}'] = start_time.strftime('%Y-%m-%d %H:%M')
                    except:
                        replacements['{appointment_time}'] = start_time_str
        
        result = text
        for placeholder, value in replacements.items():
            result = result.replace(placeholder, str(value))
        
        return result

class WorkflowEngine:
    """Main workflow execution engine"""
    
    def __init__(self):
        self.condition_evaluator = ConditionEvaluator()
        self.action_executor = ActionExecutor()
        
        # Map condition types to evaluator methods
        self.condition_methods = {
            'message_contains': self.condition_evaluator.message_contains,
            'message_matches_regex': self.condition_evaluator.message_matches_regex,
            'client_has_tag': self.condition_evaluator.client_has_tag,
            'client_is_new': self.condition_evaluator.client_is_new,
            'time_based': self.condition_evaluator.time_based,
            'message_channel': self.condition_evaluator.message_channel,
            'appointment_status': self.condition_evaluator.appointment_status,
        }
        
        # Map action types to executor methods
        self.action_methods = {
            'send_message': self.action_executor.send_message,
            'add_tag': self.action_executor.add_tag,
            'remove_tag': self.action_executor.remove_tag,
            'update_notes': self.action_executor.update_notes,
            'create_task': self.action_executor.create_task,
        }
    
    def trigger_workflows(self, trigger_type: str, user_id: int, context: Dict) -> List[Dict]:
        """Trigger all active workflows for a specific trigger type"""
        workflows = Workflow.query.filter_by(
            user_id=user_id,
            trigger_type=trigger_type,
            is_active=True
        ).all()
        
        results = []
        for workflow in workflows:
            try:
                result = self.execute_workflow(workflow.id, context)
                results.append(result)
            except Exception as e:
                logging.error(f"Error executing workflow {workflow.id}: {e}")
                results.append({
                    "workflow_id": workflow.id,
                    "success": False,
                    "error": str(e)
                })
        
        return results
    
    def execute_workflow(self, workflow_id: int, context: Dict) -> Dict:
        """Execute a specific workflow"""
        workflow = Workflow.query.get(workflow_id)
        if not workflow:
            return {"success": False, "error": "Workflow not found"}
        
        if not workflow.is_active:
            return {"success": False, "error": "Workflow is inactive"}
        
        # Create execution record
        from models import WorkflowExecution
        execution = WorkflowExecution()
        execution.workflow_id = workflow_id
        execution.trigger_data = json.dumps(context, default=str)
        db.session.add(execution)
        db.session.flush()  # Get the ID
        
        try:
            # Execute rules in order
            rules = Rule.query.filter_by(
                workflow_id=workflow_id,
                is_active=True
            ).order_by(Rule.order_index).all()
            
            execution_log = []
            rules_executed = 0
            rules_successful = 0
            rules_failed = 0
            
            for rule in rules:
                rule_result = self.execute_rule(rule, context)
                execution_log.append({
                    "rule_id": rule.id,
                    "rule_name": rule.name,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "result": rule_result
                })
                
                rules_executed += 1
                if rule_result.get("success", False):
                    rules_successful += 1
                else:
                    rules_failed += 1
            
            # Update execution record
            execution.status = 'completed'
            execution.rules_executed = rules_executed
            execution.rules_successful = rules_successful
            execution.rules_failed = rules_failed
            execution.completed_at = datetime.now(timezone.utc)
            execution.execution_log = json.dumps(execution_log)
            
            db.session.commit()
            
            return {
                "success": True,
                "workflow_id": workflow_id,
                "execution_id": execution.id,
                "rules_executed": rules_executed,
                "rules_successful": rules_successful,
                "rules_failed": rules_failed
            }
        
        except Exception as e:
            execution.status = 'failed'
            execution.error_message = str(e)
            execution.completed_at = datetime.now(timezone.utc)
            db.session.commit()
            
            logging.error(f"Workflow execution failed: {e}")
            return {"success": False, "error": str(e)}
    
    def execute_rule(self, rule: Rule, context: Dict) -> Dict:
        """Execute a single rule"""
        try:
            # Parse condition and action configs
            condition_config = json.loads(rule.condition_config)
            action_config = json.loads(rule.action_config)
            
            # Evaluate condition
            condition_method = self.condition_methods.get(rule.condition_type)
            if not condition_method:
                return {"success": False, "error": f"Unknown condition type: {rule.condition_type}"}
            
            condition_result = condition_method(context, condition_config)
            
            if not condition_result:
                return {
                    "success": True,
                    "condition_met": False,
                    "action_executed": False,
                    "message": "Condition not met, action skipped"
                }
            
            # Execute action
            action_method = self.action_methods.get(rule.action_type)
            if not action_method:
                return {"success": False, "error": f"Unknown action type: {rule.action_type}"}
            
            action_result = action_method(context, action_config)
            
            return {
                "success": True,
                "condition_met": True,
                "action_executed": action_result.get("success", False),
                "action_result": action_result
            }
        
        except Exception as e:
            logging.error(f"Rule execution error: {e}")
            return {"success": False, "error": str(e)}

# Global workflow engine instance
workflow_engine = WorkflowEngine()

def trigger_workflows(trigger_type: str, user_id: int, **kwargs) -> List[Dict]:
    """Convenience function to trigger workflows"""
    context = {"user_id": user_id, **kwargs}
    return workflow_engine.trigger_workflows(trigger_type, user_id, context)

def execute_workflow(workflow_id: int, context: Dict) -> Dict:
    """Convenience function to execute a specific workflow"""
    return workflow_engine.execute_workflow(workflow_id, context)