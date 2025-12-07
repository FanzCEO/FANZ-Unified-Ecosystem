from flask import request, make_response
from app import app, db
from models import User, Client, Message, Appointment
from services.parsing import extract_booking_info, detect_message_intent, should_auto_reply
from services.messaging import create_twiml_response, get_template_by_category
from services.workflow_engine import trigger_workflows
from datetime import datetime, timezone, timedelta
import logging

@app.route('/webhooks/twilio/sms', methods=['POST'])
def twilio_sms_webhook():
    """
    Handle incoming SMS messages from Twilio
    """
    try:
        # Get message data from Twilio
        from_number = request.form.get('From')
        to_number = request.form.get('To')
        message_body = request.form.get('Body')
        message_sid = request.form.get('MessageSid')
        
        logging.info(f"Received SMS from {from_number}: {message_body}")
        
        if not all([from_number, to_number, message_body]):
            logging.error("Missing required fields in SMS webhook")
            return make_response("", 400)
        
        # For demo purposes, use user_id=1. In production, map phone number to user
        user_id = 1
        user = User.query.get(user_id)
        if not user:
            logging.error(f"User {user_id} not found")
            return make_response("", 404)
        
        # Find or create client
        client = Client.query.filter_by(user_id=user_id, phone_number=from_number).first()
        if not client:
            # Extract name from first message if possible
            name = f"Client {from_number[-4:]}"
            client = Client(
                user_id=user_id,
                name=name,
                phone_number=from_number
            )
            db.session.add(client)
            db.session.flush()  # Get the ID
        
        # Update last contact
        client.last_contact = datetime.now(timezone.utc)
        
        # Save the message
        message = Message(
            user_id=user_id,
            client_id=client.id,
            direction='inbound',
            channel='sms',
            content=message_body,
            phone_number=from_number,
            twilio_sid=message_sid
        )
        db.session.add(message)
        
        # Check if client is blocked
        if client.is_blocked:
            db.session.commit()
            logging.info(f"Message from blocked client {from_number} - no response sent")
            return make_response("", 200)
        
        # Determine if we should auto-reply
        should_reply, reply_type = should_auto_reply(message_body or "", client.is_blocked)
        
        response_message = None
        
        if should_reply:
            # Check for booking intent with high confidence
            booking_info = extract_booking_info(message_body or "")
            
            if reply_type == 'booking' and booking_info['confidence'] == 'high':
                # Create tentative appointment
                if booking_info['datetime']:
                    end_time = booking_info['datetime']
                    if booking_info['duration']:
                        end_time += timedelta(minutes=booking_info['duration'])
                    else:
                        end_time += timedelta(hours=1)  # Default 1 hour
                    
                    appointment = Appointment(
                        user_id=user_id,
                        client_id=client.id,
                        title=f"Appointment with {client.name}",
                        start_time=booking_info['datetime'],
                        end_time=end_time,
                        location=booking_info['location'],
                        status='tentative'
                    )
                    db.session.add(appointment)
                    
                    # Format confirmation message
                    date_str = booking_info['datetime'].strftime('%a %b %d @ %I:%M %p')
                    duration_str = f" for {booking_info['duration']}m" if booking_info['duration'] else ""
                    location_str = f" at {booking_info['location']}" if booking_info['location'] else ""
                    
                    response_message = f"Holding {date_str}{duration_str}{location_str} — reply Y to confirm or N to change."
            
            # If no booking response, use template
            if not response_message:
                response_message = get_template_by_category(user_id, reply_type)
        
        # Commit all changes
        db.session.commit()
        
        # Trigger workflows for message received
        try:
            trigger_workflows(
                'message_received',
                user_id,
                message=message,
                client=client,
                user=user
            )
        except Exception as e:
            logging.error(f"Error triggering workflows: {e}")
        
        # Send TwiML response
        if response_message:
            twiml_response = create_twiml_response(response_message)
            logging.info(f"Sending auto-reply: {response_message}")
            return make_response(twiml_response, 200, {'Content-Type': 'application/xml'})
        else:
            # No auto-reply, just acknowledge receipt
            return make_response("", 200)
            
    except Exception as e:
        logging.error(f"Error processing SMS webhook: {e}")
        db.session.rollback()
        return make_response("", 500)

@app.route('/webhooks/twilio/sms/status', methods=['POST'])
def twilio_sms_status():
    """
    Handle SMS delivery status updates from Twilio
    """
    try:
        message_sid = request.form.get('MessageSid')
        message_status = request.form.get('MessageStatus')
        
        logging.info(f"SMS status update: {message_sid} - {message_status}")
        
        # Update message status in database if needed
        message = Message.query.filter_by(twilio_sid=message_sid).first()
        if message:
            # Could add a status field to track delivery
            logging.info(f"Updated status for message {message.id}")
        
        return make_response("", 200)
        
    except Exception as e:
        logging.error(f"Error processing SMS status webhook: {e}")
        return make_response("", 500)
