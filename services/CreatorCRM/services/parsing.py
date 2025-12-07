import re
import logging
from datetime import datetime, timedelta
from dateparser import parse
from typing import Dict, Optional, Tuple

def extract_booking_info(message_text: str) -> Dict:
    """
    Extract booking information from natural language text
    Returns dict with parsed date, time, duration, and location
    """
    result = {
        'datetime': None,
        'duration': None,
        'location': None,
        'confidence': 'low'
    }
    
    try:
        # Clean the message
        text = message_text.lower().strip()
        
        # Extract duration patterns (90m, 2h, 1 hour, etc.)
        duration_match = re.search(r'(\d+)\s*(m|min|minutes?|h|hr|hours?)', text)
        if duration_match:
            value, unit = duration_match.groups()
            value = int(value)
            if unit.startswith('m'):
                result['duration'] = value
            elif unit.startswith('h'):
                result['duration'] = value * 60
        
        # Extract location hints
        location_patterns = [
            r'(?:at|in|downtown|uptown|midtown|near)\s+([a-zA-Z\s]+?)(?:\s|$|[,.])',
            r'(?:hotel|motel|my place|your place|incall|outcall)',
        ]
        
        for pattern in location_patterns:
            location_match = re.search(pattern, text)
            if location_match:
                result['location'] = location_match.group(1).strip() if location_match.groups() else location_match.group(0)
                break
        
        # Parse datetime using dateparser with future bias
        parsed_datetime = parse(text, settings={
            'PREFER_DATES_FROM': 'future',
            'RETURN_AS_TIMEZONE_AWARE': False,
            'RELATIVE_BASE': datetime.now()
        })
        
        if parsed_datetime:
            # Check if the parsed date is in the past, if so, assume next week
            if parsed_datetime < datetime.now():
                parsed_datetime += timedelta(weeks=1)
            
            result['datetime'] = parsed_datetime
            
            # Determine confidence based on what we found
            confidence_factors = 0
            if result['datetime']:
                confidence_factors += 1
            if result['duration']:
                confidence_factors += 1
            if result['location']:
                confidence_factors += 1
            
            if confidence_factors >= 2:
                result['confidence'] = 'high'
            elif confidence_factors >= 1:
                result['confidence'] = 'medium'
        
        logging.info(f"Parsed booking info: {result}")
        return result
        
    except Exception as e:
        logging.error(f"Error parsing booking info: {e}")
        return result

def detect_message_intent(message_text: str) -> str:
    """
    Detect the intent of the message
    Returns: availability, rates, screening, booking, general
    """
    text = message_text.lower()
    
    # Booking patterns
    booking_patterns = [
        r'\b(book|schedule|appointment|meet|session)\b',
        r'\b(friday|saturday|sunday|monday|tuesday|wednesday|thursday)\b',
        r'\b(\d{1,2}:\d{2}|\d{1,2}\s*(am|pm))\b',
        r'\b(tonight|tomorrow|today|next week)\b'
    ]
    
    # Availability patterns
    availability_patterns = [
        r'\b(available|free|open)\b',
        r'\b(when|what time)\b',
        r'\b(schedule|calendar)\b'
    ]
    
    # Rates patterns
    rates_patterns = [
        r'\b(rate|price|cost|fee|charge)\b',
        r'\b(how much|what do you charge)\b',
        r'\b(donation|tribute)\b'
    ]
    
    # Screening patterns
    screening_patterns = [
        r'\b(screen|verify|reference)\b',
        r'\b(new client|first time)\b'
    ]
    
    # Check patterns and count matches
    intent_scores = {
        'booking': sum(1 for pattern in booking_patterns if re.search(pattern, text)),
        'availability': sum(1 for pattern in availability_patterns if re.search(pattern, text)),
        'rates': sum(1 for pattern in rates_patterns if re.search(pattern, text)),
        'screening': sum(1 for pattern in screening_patterns if re.search(pattern, text))
    }
    
    # Return intent with highest score, or 'general' if no clear intent
    max_score = max(intent_scores.values())
    if max_score > 0:
        return max(intent_scores.items(), key=lambda x: x[1])[0]
    
    return 'general'

def should_auto_reply(message_text: str, client_is_blocked: bool = False) -> Tuple[bool, str | None]:
    """
    Determine if message should get auto-reply and what type
    Returns (should_reply, reply_type)
    """
    if client_is_blocked:
        return False, None
    
    # Don't auto-reply to very short messages or confirmations
    if len(message_text.strip()) < 5:
        return False, None
    
    # Don't auto-reply to simple confirmations
    confirmation_patterns = [r'^\s*(y|yes|n|no|ok|okay|k|thanks?)\s*$']
    for pattern in confirmation_patterns:
        if re.match(pattern, message_text.lower()):
            return False, None
    
    # Determine reply type based on intent
    intent = detect_message_intent(message_text)
    return True, intent
