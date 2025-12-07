import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { User } from 'lucide-react';

interface MentionUser {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  isVerified: boolean;
}

interface UserMentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  disabled?: boolean;
  'data-testid'?: string;
}

export function UserMentionInput({ 
  value, 
  onChange, 
  placeholder = 'Type @ to mention users...', 
  multiline = false,
  className = '',
  disabled = false,
  'data-testid': testId = 'mention-input'
}: UserMentionInputProps) {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentMention, setCurrentMention] = useState<{ start: number; query: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const mentionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Debounced search for mentions
    const timer = setTimeout(() => {
      if (currentMention && currentMention.query.length >= 2) {
        searchUsers(currentMention.query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [currentMention]);

  const searchUsers = async (query: string) => {
    try {
      setIsLoading(true);
      const users = await apiRequest(`/api/users/search?q=${encodeURIComponent(query)}&limit=5`);
      setMentionUsers(users);
      setShowMentions(users.length > 0);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Error searching users:', error);
      setMentionUsers([]);
      setShowMentions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    
    const cursorPosition = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = newValue.slice(0, cursorPosition);
    
    // Find the last @ symbol before cursor
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex >= 0) {
      // Check if the @ is at start of text or preceded by whitespace
      const charBeforeAt = lastAtIndex === 0 ? ' ' : textBeforeCursor[lastAtIndex - 1];
      
      if (charBeforeAt === ' ' || charBeforeAt === '\n' || lastAtIndex === 0) {
        const queryAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
        
        // Check if there's whitespace in the query (means we've moved past the mention)
        if (!queryAfterAt.includes(' ') && !queryAfterAt.includes('\n')) {
          setCurrentMention({
            start: lastAtIndex,
            query: queryAfterAt
          });
          
          if (queryAfterAt.length >= 2) {
            // Will trigger search via useEffect
          } else {
            setShowMentions(false);
            setMentionUsers([]);
          }
        } else {
          setCurrentMention(null);
          setShowMentions(false);
        }
      } else {
        setCurrentMention(null);
        setShowMentions(false);
      }
    } else {
      setCurrentMention(null);
      setShowMentions(false);
    }
  };

  const insertMention = (user: MentionUser) => {
    if (!currentMention || !inputRef.current) return;
    
    const beforeMention = value.slice(0, currentMention.start);
    const afterCursor = value.slice(inputRef.current.selectionStart || 0);
    
    const newValue = `${beforeMention}@${user.username} ${afterCursor}`;
    onChange(newValue);
    
    // Close mentions dropdown
    setShowMentions(false);
    setCurrentMention(null);
    setMentionUsers([]);
    
    // Focus back to input and position cursor after the mention
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPosition = beforeMention.length + user.username.length + 2; // +2 for @ and space
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showMentions || mentionUsers.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % mentionUsers.length);
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev === 0 ? mentionUsers.length - 1 : prev - 1);
        break;
      
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (mentionUsers[selectedIndex]) {
          insertMention(mentionUsers[selectedIndex]);
        }
        break;
      
      case 'Escape':
        setShowMentions(false);
        setCurrentMention(null);
        break;
    }
  };

  const handleInputBlur = () => {
    // Delay hiding to allow clicking on mentions
    setTimeout(() => {
      setShowMentions(false);
    }, 200);
  };

  const InputComponent = multiline ? Textarea : Input;

  return (
    <div className="relative">
      <InputComponent
        ref={inputRef as any}
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        data-testid={testId}
      />
      
      {showMentions && (
        <Card 
          ref={mentionsRef}
          className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto shadow-lg"
          data-testid="mentions-dropdown"
        >
          {isLoading ? (
            <div className="p-3 text-sm text-gray-500" data-testid="loading-mentions">
              Searching users...
            </div>
          ) : mentionUsers.length > 0 ? (
            mentionUsers.map((user, index) => (
              <div
                key={user.id}
                className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-100 ${
                  index === selectedIndex ? 'bg-gray-100' : ''
                }`}
                onClick={() => insertMention(user)}
                data-testid={`mention-option-${user.username}`}
              >
                {user.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{user.displayName}</div>
                  <div className="text-sm text-gray-600 truncate">@{user.username}</div>
                </div>
                
                {user.isVerified && (
                  <div className="text-blue-500 text-xs">✓</div>
                )}
              </div>
            ))
          ) : (
            <div className="p-3 text-sm text-gray-500" data-testid="no-users-found">
              No users found
            </div>
          )}
        </Card>
      )}
    </div>
  );
}