import os
import logging
from twilio.rest import Client

TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.environ.get("TWILIO_PHONE_NUMBER")

def send_sms_message(to_phone_number: str, message: str) -> str | None:
    """
    Send SMS message via Twilio
    Returns message SID if successful, None if failed
    """
    try:
        if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER]):
            logging.warning("Twilio credentials not configured")
            return None
            
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        
        twilio_message = client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=to_phone_number
        )
        
        logging.info(f"SMS sent successfully with SID: {twilio_message.sid}")
        return twilio_message.sid
        
    except Exception as e:
        logging.error(f"Failed to send SMS: {e}")
        return None

def create_twiml_response(message: str) -> str:
    """
    Create TwiML response for Twilio webhook
    """
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>{message}</Message>
</Response>"""

def get_template_by_category(user_id: int, category: str) -> str:
    """
    Get template content by category for auto-replies
    """
    from models import Template
    
    template = Template.query.filter_by(
        user_id=user_id, 
        category=category, 
        is_active=True
    ).first()
    
    if template:
        return template.content
    
    # Default responses if no template found
    defaults = {
        'availability': "Thank you for your message. I'll check my availability and get back to you soon.",
        'rates': "Thank you for your inquiry. I'll send you my rates and package information shortly.",
        'screening': "Thank you for your interest. Please provide some additional information for screening purposes.",
        'booking': "Thank you for booking. I'll confirm the details and send you further instructions.",
        'general': "Thank you for your message. I'll respond as soon as possible."
    }
    
    return defaults.get(category, defaults['general'])
