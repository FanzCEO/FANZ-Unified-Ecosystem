from flask import session, flash
from app import db
from models import (
    Broadcast, BroadcastRecipient, BroadcastMessage, ContactGroup, 
    ContactGroupMember, Client, BroadcastType, BroadcastStatus,
    MessageDeliveryStatus
)
from services.messaging import send_sms_message
from datetime import datetime, timezone
import logging

class BroadcastService:
    """Service for managing broadcast messaging functionality"""
    
    @staticmethod
    def create_broadcast(user_id, title, message_content, broadcast_type=BroadcastType.INDIVIDUAL):
        """Create a new broadcast"""
        try:
            broadcast = Broadcast(
                user_id=user_id,
                title=title,
                message_content=message_content,
                broadcast_type=broadcast_type,
                status=BroadcastStatus.DRAFT
            )
            
            db.session.add(broadcast)
            db.session.commit()
            
            return broadcast
        except Exception as e:
            db.session.rollback()
            logging.error(f"Error creating broadcast: {e}")
            raise e
    
    @staticmethod
    def add_recipients_from_clients(broadcast_id, client_ids):
        """Add recipients from existing clients"""
        try:
            broadcast = Broadcast.query.get(broadcast_id)
            if not broadcast:
                raise Exception("Broadcast not found")
            
            for client_id in client_ids:
                client = Client.query.get(client_id)
                if client and client.user_id == broadcast.user_id:
                    # Check if already added
                    existing = BroadcastRecipient.query.filter_by(
                        broadcast_id=broadcast_id, 
                        client_id=client_id
                    ).first()
                    
                    if not existing:
                        recipient = BroadcastRecipient(
                            broadcast_id=broadcast_id,
                            client_id=client_id,
                            name=client.name,
                            phone_number=client.phone_number,
                            email=client.email
                        )
                        db.session.add(recipient)
            
            # Update recipient count
            total_recipients = BroadcastRecipient.query.filter_by(broadcast_id=broadcast_id).count()
            broadcast.total_recipients = total_recipients
            
            db.session.commit()
            return True
            
        except Exception as e:
            db.session.rollback()
            logging.error(f"Error adding recipients: {e}")
            raise e
    
    @staticmethod
    def add_recipients_from_group(broadcast_id, group_id):
        """Add recipients from a contact group"""
        try:
            group = ContactGroup.query.get(group_id)
            if not group:
                raise Exception("Contact group not found")
            
            client_ids = [member.client_id for member in group.group_members]
            return BroadcastService.add_recipients_from_clients(broadcast_id, client_ids)
            
        except Exception as e:
            logging.error(f"Error adding recipients from group: {e}")
            raise e
    
    @staticmethod
    def add_custom_recipient(broadcast_id, name, phone_number=None, email=None):
        """Add a custom recipient (not an existing client)"""
        try:
            broadcast = Broadcast.query.get(broadcast_id)
            if not broadcast:
                raise Exception("Broadcast not found")
            
            recipient = BroadcastRecipient(
                broadcast_id=broadcast_id,
                name=name,
                phone_number=phone_number,
                email=email
            )
            
            db.session.add(recipient)
            
            # Update recipient count
            broadcast.total_recipients = BroadcastRecipient.query.filter_by(
                broadcast_id=broadcast_id
            ).count() + 1
            
            db.session.commit()
            return recipient
            
        except Exception as e:
            db.session.rollback()
            logging.error(f"Error adding custom recipient: {e}")
            raise e
    
    @staticmethod
    def send_broadcast(broadcast_id, send_immediately=True):
        """Send a broadcast to all recipients"""
        try:
            broadcast = Broadcast.query.get(broadcast_id)
            if not broadcast:
                raise Exception("Broadcast not found")
            
            if broadcast.status != BroadcastStatus.DRAFT:
                raise Exception("Broadcast already sent or in progress")
            
            broadcast.status = BroadcastStatus.SENDING
            broadcast.sent_time = datetime.now(timezone.utc)
            
            recipients = BroadcastRecipient.query.filter_by(broadcast_id=broadcast_id).all()
            
            if broadcast.broadcast_type == BroadcastType.INDIVIDUAL:
                BroadcastService._send_individual_messages(broadcast, recipients)
            else:
                BroadcastService._send_group_message(broadcast, recipients)
            
            broadcast.status = BroadcastStatus.SENT
            db.session.commit()
            
            return True
            
        except Exception as e:
            db.session.rollback()
            broadcast.status = BroadcastStatus.FAILED
            db.session.commit()
            logging.error(f"Error sending broadcast: {e}")
            raise e
    
    @staticmethod
    def _send_individual_messages(broadcast, recipients):
        """Send individual messages to each recipient"""
        sent_count = 0
        failed_count = 0
        
        for recipient in recipients:
            try:
                # Send via SMS if phone number available
                if recipient.phone_number and broadcast.send_via_sms:
                    success = BroadcastService._send_sms_to_recipient(
                        broadcast, recipient, broadcast.message_content
                    )
                    if success:
                        recipient.sms_sent = True
                        recipient.delivery_status = MessageDeliveryStatus.SENT
                        sent_count += 1
                    else:
                        failed_count += 1
                
                # Send via email if email available
                if recipient.email and broadcast.send_via_email:
                    success = BroadcastService._send_email_to_recipient(
                        broadcast, recipient, broadcast.message_content
                    )
                    if success:
                        recipient.email_sent = True
                
                recipient.sent_time = datetime.now(timezone.utc)
                
            except Exception as e:
                logging.error(f"Error sending to recipient {recipient.id}: {e}")
                recipient.delivery_status = MessageDeliveryStatus.FAILED
                failed_count += 1
        
        broadcast.sent_count = sent_count
        broadcast.failed_count = failed_count
    
    @staticmethod
    def _send_group_message(broadcast, recipients):
        """Send as a group message (all recipients can see each other)"""
        # For group messages, we need to create a group conversation
        # This is more complex and would require platform-specific implementations
        
        sent_count = 0
        failed_count = 0
        
        # Create group name if not provided
        if not broadcast.group_name:
            broadcast.group_name = f"Broadcast: {broadcast.title}"
        
        # For now, we'll simulate group messaging by sending individual messages
        # In a real implementation, this would use platform-specific group APIs
        for recipient in recipients:
            try:
                # Add group context to message
                group_message = f"[{broadcast.group_name}]\n{broadcast.message_content}"
                
                if recipient.phone_number and broadcast.send_via_sms:
                    success = BroadcastService._send_sms_to_recipient(
                        broadcast, recipient, group_message
                    )
                    if success:
                        recipient.sms_sent = True
                        recipient.delivery_status = MessageDeliveryStatus.SENT
                        sent_count += 1
                    else:
                        failed_count += 1
                
                recipient.sent_time = datetime.now(timezone.utc)
                
            except Exception as e:
                logging.error(f"Error sending group message to recipient {recipient.id}: {e}")
                recipient.delivery_status = MessageDeliveryStatus.FAILED
                failed_count += 1
        
        broadcast.sent_count = sent_count
        broadcast.failed_count = failed_count
    
    @staticmethod
    def _send_sms_to_recipient(broadcast, recipient, message_content):
        """Send SMS to a recipient"""
        try:
            # Create broadcast message record
            broadcast_msg = BroadcastMessage(
                broadcast_id=broadcast.id,
                recipient_id=recipient.id,
                channel_type='sms',
                message_content=message_content,
                status=MessageDeliveryStatus.PENDING
            )
            db.session.add(broadcast_msg)
            
            # Send actual SMS
            success = send_sms_message(
                recipient.phone_number, 
                message_content, 
                broadcast.user_id
            )
            
            if success:
                broadcast_msg.status = MessageDeliveryStatus.SENT
                broadcast_msg.sent_time = datetime.now(timezone.utc)
                return True
            else:
                broadcast_msg.status = MessageDeliveryStatus.FAILED
                broadcast_msg.error_message = "Failed to send SMS"
                return False
                
        except Exception as e:
            logging.error(f"Error sending SMS: {e}")
            return False
    
    @staticmethod
    def _send_email_to_recipient(broadcast, recipient, message_content):
        """Send email to a recipient (placeholder)"""
        try:
            # Create broadcast message record
            broadcast_msg = BroadcastMessage(
                broadcast_id=broadcast.id,
                recipient_id=recipient.id,
                channel_type='email',
                message_content=message_content,
                status=MessageDeliveryStatus.PENDING
            )
            db.session.add(broadcast_msg)
            
            # TODO: Integrate with actual email service
            # For now, just mark as sent
            broadcast_msg.status = MessageDeliveryStatus.SENT
            broadcast_msg.sent_time = datetime.now(timezone.utc)
            
            return True
            
        except Exception as e:
            logging.error(f"Error sending email: {e}")
            return False
    
    @staticmethod
    def get_user_broadcasts(user_id, limit=50):
        """Get broadcasts for a user"""
        return Broadcast.query.filter_by(user_id=user_id)\
            .order_by(Broadcast.created_at.desc())\
            .limit(limit).all()
    
    @staticmethod
    def get_broadcast_analytics(broadcast_id):
        """Get analytics for a broadcast"""
        broadcast = Broadcast.query.get(broadcast_id)
        if not broadcast:
            return None
        
        recipients = BroadcastRecipient.query.filter_by(broadcast_id=broadcast_id).all()
        messages = BroadcastMessage.query.filter_by(broadcast_id=broadcast_id).all()
        
        analytics = {
            'total_recipients': len(recipients),
            'sent_count': len([r for r in recipients if r.delivery_status == MessageDeliveryStatus.SENT]),
            'delivered_count': len([r for r in recipients if r.delivery_status == MessageDeliveryStatus.DELIVERED]),
            'failed_count': len([r for r in recipients if r.delivery_status == MessageDeliveryStatus.FAILED]),
            'pending_count': len([r for r in recipients if r.delivery_status == MessageDeliveryStatus.PENDING]),
            'sms_sent': len([r for r in recipients if r.sms_sent]),
            'email_sent': len([r for r in recipients if r.email_sent]),
            'messages_sent': len(messages),
            'broadcast': broadcast,
            'recipients': recipients
        }
        
        return analytics
    
    @staticmethod
    def create_contact_group(user_id, name, description=None, color="#007bff"):
        """Create a new contact group"""
        try:
            group = ContactGroup(
                user_id=user_id,
                name=name,
                description=description,
                color=color
            )
            
            db.session.add(group)
            db.session.commit()
            
            return group
            
        except Exception as e:
            db.session.rollback()
            logging.error(f"Error creating contact group: {e}")
            raise e
    
    @staticmethod
    def get_user_contact_groups(user_id):
        """Get all contact groups for a user"""
        return ContactGroup.query.filter_by(user_id=user_id, is_active=True)\
            .order_by(ContactGroup.name).all()
    
    @staticmethod
    def delete_broadcast(broadcast_id, user_id):
        """Delete a broadcast (only if it's a draft)"""
        try:
            broadcast = Broadcast.query.filter_by(id=broadcast_id, user_id=user_id).first()
            if not broadcast:
                raise Exception("Broadcast not found")
            
            if broadcast.status != BroadcastStatus.DRAFT:
                raise Exception("Can only delete draft broadcasts")
            
            db.session.delete(broadcast)
            db.session.commit()
            
            return True
            
        except Exception as e:
            db.session.rollback()
            logging.error(f"Error deleting broadcast: {e}")
            raise e