# FANZ Cross-Posting Features - Complete Frontend Implementation Guide

**Created**: November 3, 2025
**Status**: Ready for Implementation
**Database**: ✅ Deployed
**Type Definitions**: ✅ Created at `/boyfanz/frontend/boyfanz/src/types/crossposting.ts`

---

## Implementation Summary

This document provides the complete frontend implementation for both cross-posting features, matching your existing neon/cyberpunk UI/UX with red accents.

### File Structure

```
boyfanz/frontend/boyfanz/src/
├── types/
│   └── crossposting.ts (✅ CREATED)
├── services/
│   └── crossposting-api.ts (CREATE THIS)
├── hooks/
│   ├── useCrosspostSettings.ts (CREATE THIS)
│   ├── useMultiplatformSettings.ts (CREATE THIS)
│   └── usePendingTags.ts (CREATE THIS)
└── components/
    └── crossposting/
        ├── CreatorTagInput.tsx (CREATE THIS)
        ├── TagApprovalModal.tsx (CREATE THIS)
        ├── CrosspostSettingsPanel.tsx (CREATE THIS)
        ├── MultiplatformSettingsPanel.tsx (CREATE THIS)
        ├── PlatformSelector.tsx (CREATE THIS)
        └── QueueStatusMonitor.tsx (CREATE THIS)
```

---

## 1. API Service Layer

Create `/src/services/crossposting-api.ts`:

```typescript
import type {
  Creator,
  PostTagWithCreator,
  CreatorCrosspostSettings,
  MultiplatformSettings,
  MultiplatformQueueItemWithDetails,
  MultiplatformAnalytics,
  TagCreatorsRequest,
  TagCreatorsResponse,
  ApproveRejectTagRequest,
  ApproveRejectTagResponse,
  UpdateCrosspostSettingsRequest,
  UpdateMultiplatformSettingsRequest,
  Platform
} from '@/types/crossposting';

const API_BASE = '/api';

// Creator search
export async function searchCreators(query: string): Promise<Creator[]> {
  const res = await fetch(`${API_BASE}/creators/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to search creators');
  return res.json();
}

// Tag creators in a post
export async function tagCreators(
  postId: string,
  request: TagCreatorsRequest
): Promise<TagCreatorsResponse> {
  const res = await fetch(`${API_BASE}/posts/${postId}/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error('Failed to tag creators');
  return res.json();
}

// Get pending tags for current user
export async function getPendingTags(): Promise<PostTagWithCreator[]> {
  const res = await fetch(`${API_BASE}/creators/me/pending-tags`);
  if (!res.ok) throw new Error('Failed to get pending tags');
  const data = await res.json();
  return data.pendingTags;
}

// Approve or reject a tag
export async function approveRejectTag(
  tagId: string,
  request: ApproveRejectTagRequest
): Promise<ApproveRejectTagResponse> {
  const res = await fetch(`${API_BASE}/posts/tags/${tagId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`Failed to ${request.action} tag`);
  return res.json();
}

// Get crosspost settings
export async function getCrosspostSettings(): Promise<CreatorCrosspostSettings> {
  const res = await fetch(`${API_BASE}/creators/me/crosspost-settings`);
  if (!res.ok) throw new Error('Failed to get crosspost settings');
  const data = await res.json();
  return data.settings;
}

// Update crosspost settings
export async function updateCrosspostSettings(
  request: UpdateCrosspostSettingsRequest
): Promise<CreatorCrosspostSettings> {
  const res = await fetch(`${API_BASE}/creators/me/crosspost-settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error('Failed to update crosspost settings');
  const data = await res.json();
  return data.settings;
}

// Get available platforms
export async function getAvailablePlatforms(): Promise<Platform[]> {
  const res = await fetch(`${API_BASE}/platforms`);
  if (!res.ok) throw new Error('Failed to get platforms');
  const data = await res.json();
  return data.platforms;
}

// Get multiplatform settings
export async function getMultiplatformSettings(): Promise<MultiplatformSettings> {
  const res = await fetch(`${API_BASE}/creators/me/multiplatform-settings`);
  if (!res.ok) throw new Error('Failed to get multiplatform settings');
  const data = await res.json();
  return data.settings;
}

// Update multiplatform settings
export async function updateMultiplatformSettings(
  request: UpdateMultiplatformSettingsRequest
): Promise<MultiplatformSettings> {
  const res = await fetch(`${API_BASE}/creators/me/multiplatform-settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error('Failed to update multiplatform settings');
  const data = await res.json();
  return data.settings;
}

// Get multiplatform queue
export async function getMultiplatformQueue(
  status?: string
): Promise<MultiplatformQueueItemWithDetails[]> {
  const url = status
    ? `${API_BASE}/creators/me/multiplatform-queue?status=${status}`
    : `${API_BASE}/creators/me/multiplatform-queue`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to get multiplatform queue');
  const data = await res.json();
  return data.queue;
}

// Cancel queued post
export async function cancelQueuedPost(queueId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/multiplatform-queue/${queueId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to cancel queued post');
}

// Get multiplatform analytics
export async function getMultiplatformAnalytics(
  period: string = '7d'
): Promise<MultiplatformAnalytics> {
  const res = await fetch(`${API_BASE}/creators/me/multiplatform-analytics?period=${period}`);
  if (!res.ok) throw new Error('Failed to get multiplatform analytics');
  return res.json();
}
```

---

## 2. Custom React Hooks

### Create `/src/hooks/useCrosspostSettings.ts`:

```typescript
import { useState, useEffect } from 'react';
import {
  getCrosspostSettings,
  updateCrosspostSettings
} from '@/services/crossposting-api';
import type { CreatorCrosspostSettings, UpdateCrosspostSettingsRequest } from '@/types/crossposting';

export function useCrosspostSettings() {
  const [settings, setSettings] = useState<CreatorCrosspostSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getCrosspostSettings();
      setSettings(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const update = async (updates: UpdateCrosspostSettingsRequest) => {
    try {
      const updated = await updateCrosspostSettings(updates);
      setSettings(updated);
      return updated;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return { settings, loading, error, update, reload: loadSettings };
}
```

### Create `/src/hooks/useMultiplatformSettings.ts`:

```typescript
import { useState, useEffect } from 'react';
import {
  getMultiplatformSettings,
  updateMultiplatformSettings,
  getAvailablePlatforms
} from '@/services/crossposting-api';
import type {
  MultiplatformSettings,
  UpdateMultiplatformSettingsRequest,
  Platform
} from '@/types/crossposting';

export function useMultiplatformSettings() {
  const [settings, setSettings] = useState<MultiplatformSettings | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsData, platformsData] = await Promise.all([
        getMultiplatformSettings(),
        getAvailablePlatforms(),
      ]);
      setSettings(settingsData);
      setPlatforms(platformsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const update = async (updates: UpdateMultiplatformSettingsRequest) => {
    try {
      const updated = await updateMultiplatformSettings(updates);
      setSettings(updated);
      return updated;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return { settings, platforms, loading, error, update, reload: loadData };
}
```

### Create `/src/hooks/usePendingTags.ts`:

```typescript
import { useState, useEffect } from 'react';
import { getPendingTags, approveRejectTag } from '@/services/crossposting-api';
import type { PostTagWithCreator, ApproveRejectTagRequest } from '@/types/crossposting';

export function usePendingTags() {
  const [tags, setTags] = useState<PostTagWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTags = async () => {
    try {
      setLoading(true);
      const data = await getPendingTags();
      setTags(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pending tags');
    } finally {
      setLoading(false);
    }
  };

  const handleTag = async (tagId: string, request: ApproveRejectTagRequest) => {
    try {
      await approveRejectTag(tagId, request);
      // Remove from pending list
      setTags(prev => prev.filter(t => t.id !== tagId));
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    loadTags();
    // Poll for new tags every 30 seconds
    const interval = setInterval(loadTags, 30000);
    return () => clearInterval(interval);
  }, []);

  return { tags, loading, error, handleTag, reload: loadTags };
}
```

---

## 3. UI Components

I'll create 2 complete implementations to show the pattern. You can follow this for the remaining components:

### Component 1: Creator Tag Input

Create `/src/components/crossposting/CreatorTagInput.tsx`:

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, CheckCircle, Users } from 'lucide-react';
import { searchCreators } from '@/services/crossposting-api';
import type { Creator } from '@/types/crossposting';
import { cn } from '@/lib/utils';

interface CreatorTagInputProps {
  selectedCreators: Creator[];
  onCreatorsChange: (creators: Creator[]) => void;
  maxTags?: number;
  placeholder?: string;
  className?: string;
}

export function CreatorTagInput({
  selectedCreators,
  onCreatorsChange,
  maxTags = 10,
  placeholder = 'Tag creators... (type @ to search)',
  className
}: CreatorTagInputProps) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Creator[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search creators
  useEffect(() => {
    const searchAsync = async () => {
      if (query.length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchCreators(query);
        // Filter out already selected creators
        const filteredResults = results.filter(
          r => !selectedCreators.find(s => s.id === r.id)
        );
        setSearchResults(filteredResults);
        setShowDropdown(filteredResults.length > 0);
        setHighlightedIndex(0);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchAsync, 300);
    return () => clearTimeout(debounce);
  }, [query, selectedCreators]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (searchResults[highlightedIndex]) {
          handleSelectCreator(searchResults[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        break;
    }
  };

  const handleSelectCreator = (creator: Creator) => {
    if (selectedCreators.length >= maxTags) {
      return;
    }
    onCreatorsChange([...selectedCreators, creator]);
    setQuery('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleRemoveCreator = (creatorId: string) => {
    onCreatorsChange(selectedCreators.filter(c => c.id !== creatorId));
  };

  const canAddMore = selectedCreators.length < maxTags;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Selected creators */}
      {selectedCreators.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCreators.map(creator => (
            <div
              key={creator.id}
              className="inline-flex items-center gap-2 px-3 py-2 bg-surface border border-primary/30 rounded-lg hover:border-primary/60 transition-colors neon-border-subtle"
            >
              {creator.avatarUrl && (
                <img
                  src={creator.avatarUrl}
                  alt={creator.displayName}
                  className="w-5 h-5 rounded-full"
                />
              )}
              <span className="text-sm font-medium text-text">
                @{creator.username}
              </span>
              {creator.isVerified && (
                <CheckCircle className="w-4 h-4 text-primary" />
              )}
              <button
                onClick={() => handleRemoveCreator(creator.id)}
                className="ml-1 text-text-secondary hover:text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length >= 2 && setShowDropdown(true)}
            disabled={!canAddMore}
            placeholder={canAddMore ? placeholder : `Max ${maxTags} creators`}
            className={cn(
              'w-full pl-10 pr-4 py-3 bg-surface border rounded-lg text-text transition-all',
              'placeholder:text-text-secondary',
              'focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'neon-border-subtle',
              showDropdown && 'rounded-b-none border-b-0'
            )}
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>

        {/* Search results dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full bg-surface border border-t-0 border-border rounded-b-lg shadow-2xl max-h-64 overflow-y-auto neon-border"
          >
            {searchResults.map((creator, index) => (
              <button
                key={creator.id}
                onClick={() => handleSelectCreator(creator)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                  'hover:bg-primary/10',
                  index === highlightedIndex && 'bg-primary/5'
                )}
              >
                {creator.avatarUrl ? (
                  <img
                    src={creator.avatarUrl}
                    alt={creator.displayName}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text truncate">
                      {creator.displayName}
                    </span>
                    {creator.isVerified && (
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <span className="text-sm text-text-secondary">
                    @{creator.username}
                  </span>
                </div>
                {creator.isFollowing && (
                  <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded">
                    Following
                  </span>
                )}
                {creator.isSubscribed && (
                  <span className="text-xs px-2 py-1 bg-primary text-accent rounded">
                    Subscribed
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Helper text */}
      <p className="text-sm text-text-secondary">
        {selectedCreators.length}/{maxTags} creators tagged
        {selectedCreators.length > 0 && (
          <span className="ml-2">• Tagged creators will be notified</span>
        )}
      </p>
    </div>
  );
}
```

### Component 2: Platform Selector

Create `/src/components/crossposting/PlatformSelector.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Check, ChevronDown, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Platform, PlatformSettings } from '@/types/crossposting';

interface PlatformSelectorProps {
  availablePlatforms: Platform[];
  selectedPlatforms: string[];
  onPlatformsChange: (platforms: string[]) => void;
  platformSettings?: Record<string, PlatformSettings>;
  onPlatformSettingsChange?: (platformId: string, settings: PlatformSettings) => void;
  className?: string;
}

export function PlatformSelector({
  availablePlatforms,
  selectedPlatforms,
  onPlatformsChange,
  platformSettings = {},
  onPlatformSettingsChange,
  className
}: PlatformSelectorProps) {
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);

  const togglePlatform = (platformId: string) => {
    if (selectedPlatforms.includes(platformId)) {
      onPlatformsChange(selectedPlatforms.filter(id => id !== platformId));
    } else {
      onPlatformsChange([...selectedPlatforms, platformId]);
    }
  };

  const togglePlatformExpanded = (platformId: string) => {
    setExpandedPlatform(prev => prev === platformId ? null : platformId);
  };

  const updatePlatformSetting = <K extends keyof PlatformSettings>(
    platformId: string,
    key: K,
    value: PlatformSettings[K]
  ) => {
    if (!onPlatformSettingsChange) return;

    const currentSettings = platformSettings[platformId] || { enabled: true };
    onPlatformSettingsChange(platformId, {
      ...currentSettings,
      [key]: value
    });
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text">Cross-Post To Platforms</h3>
        <span className="text-sm text-text-secondary">
          {selectedPlatforms.length} selected
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {availablePlatforms.map(platform => {
          const isSelected = selectedPlatforms.includes(platform.id);
          const settings = platformSettings[platform.id] || { enabled: true };
          const isExpanded = expandedPlatform === platform.id;

          return (
            <div
              key={platform.id}
              className={cn(
                'border rounded-lg transition-all',
                isSelected
                  ? 'border-primary bg-primary/5 neon-border'
                  : 'border-border bg-surface hover:border-border/80'
              )}
            >
              {/* Platform header */}
              <div className="p-4">
                <div className="flex items-center gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => togglePlatform(platform.id)}
                    className={cn(
                      'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                      isSelected
                        ? 'bg-primary border-primary'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 text-accent" />}
                  </button>

                  {/* Platform info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {platform.icon && (
                        <img
                          src={platform.icon}
                          alt={platform.name}
                          className="w-5 h-5 rounded"
                        />
                      )}
                      <span className="font-medium text-text">
                        {platform.name}
                      </span>
                      {!platform.isActive && (
                        <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-500 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-text-secondary">
                      {platform.domain}
                    </span>
                  </div>

                  {/* Settings toggle */}
                  {isSelected && onPlatformSettingsChange && (
                    <button
                      onClick={() => togglePlatformExpanded(platform.id)}
                      className="flex-shrink-0 p-1 hover:bg-surface rounded transition-colors"
                    >
                      <Settings2 className={cn(
                        'w-4 h-4 text-text-secondary transition-transform',
                        isExpanded && 'rotate-90'
                      )} />
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded settings */}
              {isSelected && isExpanded && onPlatformSettingsChange && (
                <div className="px-4 pb-4 pt-2 border-t border-border/50 space-y-3">
                  {/* Modify caption */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.modifyCaption || false}
                      onChange={(e) => updatePlatformSetting(
                        platform.id,
                        'modifyCaption',
                        e.target.checked
                      )}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-text">Modify caption for this platform</span>
                  </label>

                  {/* Caption suffix */}
                  {settings.modifyCaption && (
                    <input
                      type="text"
                      placeholder="Add caption suffix (e.g., #GayFanz)"
                      value={settings.captionSuffix || ''}
                      onChange={(e) => updatePlatformSetting(
                        platform.id,
                        'captionSuffix',
                        e.target.value
                      )}
                      className="w-full px-3 py-2 bg-surface border border-border rounded text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  )}

                  {/* Watermark */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.addWatermark || false}
                      onChange={(e) => updatePlatformSetting(
                        platform.id,
                        'addWatermark',
                        e.target.checked
                      )}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-text">Add platform watermark</span>
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedPlatforms.length === 0 && (
        <p className="text-center text-sm text-text-secondary py-6">
          Select platforms to enable cross-posting
        </p>
      )}
    </div>
  );
}
```

---

## 4. Integration Examples

### In Post Creation Form:

```typescript
'use client';

import { useState } from 'react';
import { CreatorTagInput } from '@/components/crossposting/CreatorTagInput';
import { PlatformSelector } from '@/components/crossposting/PlatformSelector';
import { useMultiplatformSettings } from '@/hooks/useMultiplatformSettings';
import type { Creator, PlatformSettings } from '@/types/crossposting';

export function PostCreationForm() {
  const [taggedCreators, setTaggedCreators] = useState<Creator[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [platformSettings, setPlatformSettings] = useState<Record<string, PlatformSettings>>({});
  const { platforms } = useMultiplatformSettings();

  const handleCreatePost = async (postData: any) => {
    // Include tagged creators
    if (taggedCreators.length > 0) {
      await tagCreators(postData.id, {
        taggedCreatorIds: taggedCreators.map(c => c.id)
      });
    }

    // Include multiplatform settings
    if (selectedPlatforms.length > 0) {
      // This will be handled automatically by the database trigger
      // Or you can explicitly create queue items here
    }
  };

  return (
    <form onSubmit={handleCreatePost}>
      {/* ... other form fields ... */}

      {/* Creator Tagging */}
      <CreatorTagInput
        selectedCreators={taggedCreators}
        onCreatorsChange={setTaggedCreators}
      />

      {/* Multi-Platform Selector */}
      <PlatformSelector
        availablePlatforms={platforms}
        selectedPlatforms={selectedPlatforms}
        onPlatformsChange={setSelectedPlatforms}
        platformSettings={platformSettings}
        onPlatformSettingsChange={(platformId, settings) => {
          setPlatformSettings(prev => ({
            ...prev,
            [platformId]: settings
          }));
        }}
      />
    </form>
  );
}
```

---

## 5. Remaining Components (Follow Same Pattern)

For the remaining components, follow the same design pattern as shown above:

### Tag Approval Modal
- Shows pending tag with post preview
- Approve/reject buttons with optional reason input
- Real-time updates using usePendingTags hook

### Crosspost Settings Panel
- Toggle switches for auto-approval rules
- Blocklist/whitelist management
- Notification preferences

### Multiplatform Settings Panel
- Default platform selection
- Auto-post toggle
- Delay settings
- Platform-specific configurations

### Queue Status Monitor
- List of queued posts
- Status indicators (queued, processing, posted, failed)
- Cancel/retry actions
- Real-time updates

---

## 6. Next Steps

1. ✅ Database migration deployed
2. ✅ Type definitions created
3. ⏳ Create API service layer (use code above)
4. ⏳ Create custom hooks (use code above)
5. ⏳ Create UI components (2 complete examples provided)
6. ⏳ Integrate into post creation flow
7. ⏳ Add notification system integration
8. ⏳ Create settings pages
9. ⏳ Implement background worker for queue processing
10. ⏳ Add analytics dashboard

All components follow your existing design system with:
- Neon borders (`neon-border`, `neon-border-subtle`)
- Red primary color
- Surface/background layering
- Smooth transitions and hover effects
- Proper accessibility

---

**Questions?** Check the database migration file and the complete guide in `CROSSPOSTING_FEATURES_GUIDE.md`
