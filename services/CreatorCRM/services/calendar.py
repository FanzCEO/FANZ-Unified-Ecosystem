from datetime import datetime
from icalendar import Calendar, Event
import pytz

def generate_ical_feed(appointments, user_id):
    """
    Generate iCal feed from appointments
    """
    cal = Calendar()
    cal.add('prodid', f'-//CRM System//Calendar {user_id}//EN')
    cal.add('version', '2.0')
    cal.add('calscale', 'GREGORIAN')
    cal.add('method', 'PUBLISH')
    cal.add('x-wr-calname', f'CRM Calendar - User {user_id}')
    cal.add('x-wr-timezone', 'UTC')
    
    for appointment in appointments:
        event = Event()
        event.add('uid', f'appointment-{appointment.id}@crm-system.local')
        event.add('dtstart', appointment.start_time)
        event.add('dtend', appointment.end_time)
        event.add('summary', appointment.title)
        
        if appointment.description:
            event.add('description', appointment.description)
        
        if appointment.location:
            event.add('location', appointment.location)
        
        event.add('status', appointment.status.upper())
        event.add('created', appointment.created_at)
        event.add('last-modified', appointment.updated_at)
        
        # Add client information if available
        if appointment.client:
            event.add('organizer', f'MAILTO:{appointment.client.email or "noreply@crm-system.local"}')
            event.add('attendee', f'MAILTO:{appointment.client.email or "noreply@crm-system.local"}')
        
        cal.add_component(event)
    
    return cal.to_ical().decode('utf-8')
