import os
import json
from datetime import datetime, timezone, timedelta
from openai import OpenAI
from models import AIAssistant, AIInteraction, Client, Message, Task, Reminder
from app import db

class AIService:
    """AI-powered assistant for documentation, reminders, and automation"""
    
    def __init__(self):
        self.openai_client = None
        if os.environ.get('OPENAI_API_KEY'):
            self.openai_client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))
    
    def setup_ai_assistant(self, user_id, ai_type, config):
        """Setup AI assistant for a user"""
        try:
            assistant = AIAssistant(
                user_id=user_id,
                name=config.get('name', f'{ai_type.title()} Assistant'),
                ai_type=ai_type,
                config=json.dumps(config)
            )
            
            db.session.add(assistant)
            db.session.commit()
            
            return assistant
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def analyze_conversation(self, user_id, client_id, limit=20):
        """Analyze recent conversation with a client using AI"""
        if not self.openai_client:
            return {'error': 'OpenAI API key not configured'}
        
        try:
            # Get recent messages
            messages = Message.query.filter_by(
                user_id=user_id,
                client_id=client_id
            ).order_by(Message.created_at.desc()).limit(limit).all()
            
            if not messages:
                return {'analysis': 'No messages found for analysis'}
            
            # Prepare conversation for AI analysis
            conversation = []
            for msg in reversed(messages):
                direction = "Client" if msg.direction == 'inbound' else "You"
                conversation.append(f"{direction}: {msg.content}")
            
            conversation_text = "\n".join(conversation)
            
            # AI analysis prompt
            prompt = f"""
            Analyze this conversation between a creator and their client. Provide insights on:
            1. Client sentiment and satisfaction level
            2. Key topics discussed
            3. Potential follow-up actions needed
            4. Suggested responses or next steps
            5. Any red flags or concerns
            
            Conversation:
            {conversation_text}
            
            Respond in JSON format with keys: sentiment, topics, follow_ups, suggestions, concerns
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-5",  # the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            
            analysis = json.loads(response.choices[0].message.content or '{}')
            
            # Save interaction
            interaction = AIInteraction(
                assistant_id=self.get_or_create_assistant(user_id, 'analysis').id,
                client_id=client_id,
                interaction_type='analysis',
                input_data=conversation_text,
                output_data=json.dumps(analysis),
                status='completed'
            )
            
            db.session.add(interaction)
            db.session.commit()
            
            return analysis
            
        except Exception as e:
            print(f"AI analysis error: {e}")
            return {'error': str(e)}
    
    def generate_follow_up_suggestions(self, user_id, client_id):
        """Generate AI-powered follow-up suggestions"""
        if not self.openai_client:
            return []
        
        try:
            # Get client info and recent interactions
            client = Client.query.get(client_id)
            recent_messages = Message.query.filter_by(
                user_id=user_id,
                client_id=client_id
            ).order_by(Message.created_at.desc()).limit(10).all()
            
            if not client or not recent_messages:
                return []
            
            # Prepare context
            context = f"""
            Client: {client.name}
            Tags: {client.tags or 'None'}
            Notes: {client.notes or 'None'}
            Last contact: {client.last_contact}
            
            Recent conversation:
            """
            
            for msg in reversed(recent_messages):
                direction = "Client" if msg.direction == 'inbound' else "You"
                context += f"\n{direction}: {msg.content}"
            
            prompt = f"""
            Based on this client information and conversation history, suggest 3-5 specific follow-up actions.
            Consider the business context of adult content creation and client relationship management.
            
            {context}
            
            Provide suggestions in JSON format: [{{"action": "description", "priority": "high/medium/low", "timing": "when to do it"}}]
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-5",  # the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            
            suggestions = json.loads(response.choices[0].message.content or '{}')
            return suggestions.get('suggestions', [])
            
        except Exception as e:
            print(f"Follow-up generation error: {e}")
            return []
    
    def auto_generate_documentation(self, user_id, client_id):
        """Automatically generate client documentation based on interactions"""
        if not self.openai_client:
            return None
        
        try:
            client = Client.query.get(client_id)
            messages = Message.query.filter_by(
                user_id=user_id,
                client_id=client_id
            ).order_by(Message.created_at.asc()).all()
            
            if not client or not messages:
                return None
            
            # Prepare full conversation history
            conversation = []
            for msg in messages:
                direction = "Client" if msg.direction == 'inbound' else "Creator"
                date = msg.created_at.strftime("%Y-%m-%d %H:%M")
                conversation.append(f"[{date}] {direction}: {msg.content}")
            
            conversation_text = "\n".join(conversation)
            
            prompt = f"""
            Create comprehensive client documentation based on all interactions. Include:
            
            1. Client Profile Summary
            2. Communication Preferences
            3. Services Discussed/Provided
            4. Important Dates and Events
            5. Payment History (if mentioned)
            6. Personal Notes and Preferences
            7. Future Opportunities
            
            Client: {client.name}
            Current tags: {client.tags or 'None'}
            Current notes: {client.notes or 'None'}
            
            All interactions:
            {conversation_text}
            
            Respond in JSON format with structured documentation.
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-5",  # the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            
            documentation = json.loads(response.choices[0].message.content or '{}')
            
            # Save as AI interaction
            interaction = AIInteraction(
                assistant_id=self.get_or_create_assistant(user_id, 'documentation').id,
                client_id=client_id,
                interaction_type='generation',
                input_data=f"Documentation generation for {client.name}",
                output_data=json.dumps(documentation),
                status='completed'
            )
            
            db.session.add(interaction)
            db.session.commit()
            
            return documentation
            
        except Exception as e:
            print(f"Documentation generation error: {e}")
            return None
    
    def create_smart_reminder(self, user_id, client_id, context, reminder_type='follow_up'):
        """Create AI-generated smart reminders"""
        if not self.openai_client:
            return None
        
        try:
            client = Client.query.get(client_id)
            if not client:
                return None
            
            prompt = f"""
            Create a smart reminder for client follow-up based on this context.
            
            Client: {client.name}
            Context: {context}
            Reminder type: {reminder_type}
            
            Generate:
            1. Appropriate reminder title
            2. Detailed description
            3. Suggested timing (hours from now)
            4. Recommended channel (email, sms, whatsapp, etc.)
            
            Consider the personal nature of creator-client relationships.
            
            Respond in JSON format: {{"title": "", "description": "", "hours_from_now": 24, "channel": "email"}}
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-5",  # the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            
            reminder_data = json.loads(response.choices[0].message.content or '{}')
            
            # Calculate scheduled time
            scheduled_at = datetime.now(timezone.utc) + timedelta(hours=reminder_data.get('hours_from_now', 24))
            
            # Create reminder
            reminder = Reminder(
                user_id=user_id,
                client_id=client_id,
                title=reminder_data.get('title', 'Follow up with client'),
                description=reminder_data.get('description', ''),
                reminder_type=reminder_type,
                scheduled_at=scheduled_at,
                channel_type=reminder_data.get('channel', 'email'),
                is_ai_generated=True,
                ai_context=context
            )
            
            db.session.add(reminder)
            db.session.commit()
            
            return reminder
            
        except Exception as e:
            print(f"Smart reminder creation error: {e}")
            return None
    
    def generate_response_suggestions(self, user_id, message_content, client_id=None):
        """Generate AI-powered response suggestions for incoming messages"""
        if not self.openai_client:
            return []
        
        try:
            context = ""
            if client_id:
                client = Client.query.get(client_id)
                if client:
                    context = f"Client: {client.name}\nTags: {client.tags}\nNotes: {client.notes}\n\n"
            
            prompt = f"""
            {context}Incoming message: "{message_content}"
            
            Generate 3 professional response options suitable for creator-client communication:
            1. A warm, personal response
            2. A professional, brief response  
            3. A detailed, helpful response
            
            Consider the context of adult content creation and maintain appropriate boundaries.
            
            Respond in JSON format: [{{"type": "warm", "text": "response"}}, ...]
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-5",  # the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            
            suggestions = json.loads(response.choices[0].message.content or '{}')
            return suggestions.get('responses', [])
            
        except Exception as e:
            print(f"Response suggestion error: {e}")
            return []
    
    def analyze_client_patterns(self, user_id):
        """Analyze patterns across all clients for insights"""
        if not self.openai_client:
            return {}
        
        try:
            # Get all clients and their message counts
            clients = Client.query.filter_by(user_id=user_id).all()
            
            client_data = []
            for client in clients:
                message_count = Message.query.filter_by(client_id=client.id).count()
                last_message = Message.query.filter_by(client_id=client.id).order_by(Message.created_at.desc()).first()
                
                client_data.append({
                    'name': client.name,
                    'tags': client.tags,
                    'message_count': message_count,
                    'last_contact': last_message.created_at.isoformat() if last_message else None,
                    'is_blocked': client.is_blocked
                })
            
            prompt = f"""
            Analyze these client patterns and provide business insights:
            
            {json.dumps(client_data, indent=2)}
            
            Provide insights on:
            1. Most engaged clients
            2. Clients needing attention
            3. Communication patterns
            4. Revenue opportunities
            5. Risk assessments
            
            Respond in JSON format with actionable insights.
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-5",  # the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            
            insights = json.loads(response.choices[0].message.content or '{}')
            
            # Save insights as AI interaction
            interaction = AIInteraction(
                assistant_id=self.get_or_create_assistant(user_id, 'analysis').id,
                interaction_type='analysis',
                input_data="Client pattern analysis",
                output_data=json.dumps(insights),
                status='completed'
            )
            
            db.session.add(interaction)
            db.session.commit()
            
            return insights
            
        except Exception as e:
            print(f"Pattern analysis error: {e}")
            return {}
    
    def get_or_create_assistant(self, user_id, ai_type):
        """Get existing AI assistant or create new one"""
        assistant = AIAssistant.query.filter_by(
            user_id=user_id,
            ai_type=ai_type,
            is_active=True
        ).first()
        
        if not assistant:
            assistant = AIAssistant(
                user_id=user_id,
                name=f"{ai_type.title()} Assistant",
                ai_type=ai_type,
                config=json.dumps({
                    'model': 'gpt-5',
                    'temperature': 0.7,
                    'max_tokens': 1000
                })
            )
            db.session.add(assistant)
            db.session.flush()
        
        return assistant
    
    def process_automated_tasks(self):
        """Process all pending AI-assisted tasks"""
        try:
            # Get tasks that require AI assistance
            ai_tasks = Task.query.filter_by(
                requires_ai_assistance=True,
                status='pending'
            ).all()
            
            for task in ai_tasks:
                try:
                    if task.task_type == 'ai_analyze':
                        self._process_analysis_task(task)
                    elif task.task_type == 'ai_generate_documentation':
                        self._process_documentation_task(task)
                    elif task.task_type == 'ai_follow_up':
                        self._process_follow_up_task(task)
                    
                    task.status = 'completed'
                    task.completed_at = datetime.now(timezone.utc)
                    
                except Exception as e:
                    task.status = 'failed'
                    task.error_message = str(e)
                    task.attempts += 1
                
                db.session.commit()
                
        except Exception as e:
            print(f"Automated task processing error: {e}")
    
    def _process_analysis_task(self, task):
        """Process AI analysis task"""
        task_data = json.loads(task.task_data)
        client_id = task_data.get('client_id')
        
        if client_id:
            analysis = self.analyze_conversation(task.user_id, client_id)
            task.task_data = json.dumps({**task_data, 'analysis_result': analysis})
    
    def _process_documentation_task(self, task):
        """Process documentation generation task"""
        task_data = json.loads(task.task_data)
        client_id = task_data.get('client_id')
        
        if client_id:
            documentation = self.auto_generate_documentation(task.user_id, client_id)
            task.task_data = json.dumps({**task_data, 'documentation': documentation})
    
    def _process_follow_up_task(self, task):
        """Process follow-up suggestion task"""
        task_data = json.loads(task.task_data)
        client_id = task_data.get('client_id')
        
        if client_id:
            suggestions = self.generate_follow_up_suggestions(task.user_id, client_id)
            task.task_data = json.dumps({**task_data, 'suggestions': suggestions})
    
    def schedule_ai_analysis(self, user_id, client_id, delay_hours=0):
        """Schedule AI analysis for a client"""
        try:
            scheduled_at = datetime.now(timezone.utc) + timedelta(hours=delay_hours)
            
            task = Task(
                user_id=user_id,
                title=f"AI Analysis for Client",
                description="Automated conversation analysis and insights",
                task_type='ai_analyze',
                task_data=json.dumps({'client_id': client_id}),
                scheduled_at=scheduled_at,
                requires_ai_assistance=True,
                is_ai_generated=True,
                category='analysis'
            )
            
            db.session.add(task)
            db.session.commit()
            
            return task
            
        except Exception as e:
            db.session.rollback()
            raise e