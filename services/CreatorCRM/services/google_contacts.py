import re
import logging
from typing import List, Dict, Optional, Tuple
from app import db
from models import User, Client, Tag, ClientTag

def normalize_phone_number(phone: str) -> str:
    """
    Normalize phone number to a standard format
    Basic normalization - can be extended to full E.164 formatting
    """
    if not phone:
        return ""
    
    # Remove all non-digits
    digits = re.sub(r'\D', '', phone)
    
    # Handle US numbers
    if len(digits) == 10:
        digits = "1" + digits
    elif len(digits) == 11 and digits.startswith("1"):
        pass
    else:
        return phone  # Return original if not standard US format
    
    # Format as +1XXXXXXXXXX
    return f"+{digits}"

def normalize_email(email: str) -> str:
    """
    Normalize email address
    """
    if not email:
        return ""
    return email.lower().strip()

def find_existing_client(user_id: int, phone: str, email: str, name: str) -> Optional[Client]:
    """
    Find existing client by phone, email, or name
    Priority: phone > email > name
    """
    # First try phone number
    if phone:
        client = Client.query.filter_by(
            user_id=user_id, 
            phone_number=normalize_phone_number(phone)
        ).first()
        if client:
            return client
    
    # Then try email
    if email:
        client = Client.query.filter_by(
            user_id=user_id, 
            email=normalize_email(email)
        ).first()
        if client:
            return client
    
    # Finally try exact name match
    if name:
        client = Client.query.filter_by(
            user_id=user_id, 
            name=name
        ).first()
        if client:
            return client
    
    return None

def get_or_create_tag(user_id: int, tag_name: str) -> Tag:
    """
    Get existing tag or create new one
    """
    tag = Tag.query.filter_by(user_id=user_id, name=tag_name).first()
    if not tag:
        tag = Tag(user_id=user_id, name=tag_name)
        db.session.add(tag)
        db.session.flush()  # Get the ID
    return tag

def apply_tags_to_client(client: Client, tag_names: List[str]) -> None:
    """
    Apply tags to a client (replaces existing tags)
    """
    # Remove existing tags
    ClientTag.query.filter_by(client_id=client.id).delete()
    
    # Add new tags
    for tag_name in tag_names:
        if tag_name.strip():
            tag = get_or_create_tag(client.user_id, tag_name.strip())
            client_tag = ClientTag(client_id=client.id, tag_id=tag.id)
            db.session.add(client_tag)
    
    # Update comma-separated tags string for quick display
    client.tags = ", ".join(tag_names) if tag_names else None

def merge_client_notes(existing_notes: str, new_notes: str) -> str:
    """
    Merge client notes without duplicating content
    """
    if not existing_notes:
        return new_notes or ""
    
    if not new_notes:
        return existing_notes
    
    # Simple deduplication - split by lines and combine unique ones
    existing_lines = set(line.strip() for line in existing_notes.split('\n') if line.strip())
    new_lines = set(line.strip() for line in new_notes.split('\n') if line.strip())
    
    all_lines = existing_lines.union(new_lines)
    return '\n'.join(sorted(all_lines))

def sync_contact(user_id: int, contact_data: Dict) -> Tuple[Client, bool]:
    """
    Sync a single contact, return (client, created)
    contact_data format: {
        "name": "John Doe",
        "phone": "+1234567890", 
        "email": "john@example.com",
        "notes": "Prefers evenings",
        "labels": ["VIP", "Screened"]
    }
    """
    name = contact_data.get('name', '').strip()
    phone = contact_data.get('phone', '').strip()
    email = contact_data.get('email', '').strip()
    notes = contact_data.get('notes', '').strip()
    labels = contact_data.get('labels', [])
    
    if not name and not phone and not email:
        raise ValueError("Contact must have at least name, phone, or email")
    
    # Normalize contact info
    normalized_phone = normalize_phone_number(phone) if phone else None
    normalized_email = normalize_email(email) if email else None
    
    # Find existing client
    existing_client = find_existing_client(user_id, phone, email, name)
    
    if existing_client:
        # Update existing client
        created = False
        client = existing_client
        
        # Update fields if new data is provided
        if name and name != client.name:
            client.name = name
        if normalized_phone and normalized_phone != client.phone_number:
            client.phone_number = normalized_phone
        if normalized_email and normalized_email != client.email:
            client.email = normalized_email
        
        # Merge notes
        if notes:
            client.notes = merge_client_notes(client.notes or "", notes)
    else:
        # Create new client
        created = True
        client = Client(
            user_id=user_id,
            name=name or f"Contact {normalized_phone or normalized_email}",
            phone_number=normalized_phone,
            email=normalized_email,
            notes=notes
        )
        db.session.add(client)
        db.session.flush()  # Get the ID
    
    # Apply tags
    if labels:
        apply_tags_to_client(client, labels)
    
    return client, created

def sync_contacts(user_id: int, contacts_data: List[Dict]) -> Dict[str, int]:
    """
    Sync multiple contacts for a user
    Returns statistics: {"created": N, "updated": N, "errors": N}
    """
    stats = {"created": 0, "updated": 0, "errors": 0}
    
    try:
        for contact_data in contacts_data:
            try:
                client, created = sync_contact(user_id, contact_data)
                if created:
                    stats["created"] += 1
                else:
                    stats["updated"] += 1
                    
            except Exception as e:
                logging.error(f"Error syncing contact {contact_data}: {e}")
                stats["errors"] += 1
                continue
        
        # Commit all changes
        db.session.commit()
        
    except Exception as e:
        logging.error(f"Error in contacts sync: {e}")
        db.session.rollback()
        raise
    
    return stats

def get_user_tags(user_id: int) -> List[Dict]:
    """
    Get all tags for a user with usage counts
    """
    tags = db.session.query(
        Tag.id,
        Tag.name,
        Tag.color,
        Tag.description,
        Tag.created_at,
        db.func.count(ClientTag.id).label('usage_count')
    ).outerjoin(ClientTag).filter(
        Tag.user_id == user_id
    ).group_by(Tag.id).order_by(Tag.name).all()
    
    return [
        {
            "id": tag.id,
            "name": tag.name,
            "color": tag.color,
            "description": tag.description,
            "created_at": tag.created_at.isoformat(),
            "usage_count": tag.usage_count
        }
        for tag in tags
    ]

def update_client_tags(client_id: int, tag_names: List[str]) -> None:
    """
    Update tags for a specific client
    """
    client = Client.query.get(client_id)
    if not client:
        raise ValueError("Client not found")
    
    apply_tags_to_client(client, tag_names)
    db.session.commit()

def update_client_notes(client_id: int, notes: str) -> None:
    """
    Update notes for a specific client
    """
    client = Client.query.get(client_id)
    if not client:
        raise ValueError("Client not found")
    
    client.notes = notes
    db.session.commit()