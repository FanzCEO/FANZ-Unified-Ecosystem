'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search, Filter, Grid, LayoutList, Flame, Trophy,
  Dumbbell, Gamepad2, Shirt, User, Heart, Star,
  ChevronDown, X, Sparkles, TrendingUp, Play, Users, Eye
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginModal } from '@/components/auth/LoginModal';
import { SignupModal } from '@/components/auth/SignupModal';
import { UserMenu } from '@/components/ui/UserMenu';

// BroFanz Tag Categories
const TAG_CATEGORIES = {
  identity: {
    name: 'Identity',
    icon: User,
    tags: [
      { id: 'masc', name: 'Masc', emoji: '💪' },
      { id: 'bro', name: 'Bro', emoji: '🤙' },
      { id: 'jock', name: 'Jock', emoji: '🏈' },
      { id: 'gym_guy', name: 'Gym Guy', emoji: '🏋️' },
      { id: 'blue_collar', name: 'Blue-Collar', emoji: '🔧' },
      { id: 'dl_bro', name: 'DL Bro', emoji: '🤫' },
      { id: 'trade', name: 'Trade', emoji: '🔥' },
      { id: 'skater', name: 'Skater', emoji: '🛹' },
      { id: 'gamer', name: 'Gamer', emoji: '🎮' },
      { id: 'athlete', name: 'Athlete', emoji: '⚽' },
      { id: 'queer_masc', name: 'Queer Masc', emoji: '🏳️‍🌈' },
      { id: 'bi_bro', name: 'Bi Bro', emoji: '💜' },
    ]
  },
  vibe: {
    name: 'Vibes',
    icon: Sparkles,
    tags: [
      { id: 'chill_bro', name: 'Chill Bro', emoji: '😎' },
      { id: 'locker_room', name: 'Locker Room Energy', emoji: '🚿' },
      { id: 'barbershop', name: 'Barbershop Vibes', emoji: '💈' },
      { id: 'boyfriend_bro', name: 'Boyfriend Bro', emoji: '❤️' },
      { id: 'rough_edges', name: 'Rough Edges', emoji: '🔥' },
      { id: 'goofy_bro', name: 'Goofy Bro', emoji: '😜' },
      { id: 'alpha_energy', name: 'Alpha Energy', emoji: '👑' },
      { id: 'lowkey_cutie', name: 'Low-Key Cutie', emoji: '🥰' },
      { id: 'college_bro', name: 'College Bro', emoji: '🎓' },
      { id: 'street_king', name: 'Street King', emoji: '👟' },
    ]
  },
  style: {
    name: 'Style',
    icon: Shirt,
    tags: [
      { id: 'streetwear', name: 'Streetwear', emoji: '👕' },
      { id: 'athleisure', name: 'Athleisure', emoji: '🩳' },
      { id: 'gym_fits', name: 'Gym Fits', emoji: '🏋️' },
      { id: 'denim_boots', name: 'Denim & Boots', emoji: '👖' },
      { id: 'snapback', name: 'Snapback Vibes', emoji: '🧢' },
      { id: 'inked', name: 'Inked', emoji: '🖋️' },
      { id: 'beard_bro', name: 'Beard Bro', emoji: '🧔' },
      { id: 'clean_cut', name: 'Clean-Cut', emoji: '✨' },
    ]
  },
  lifestyle: {
    name: 'Lifestyle',
    icon: Flame,
    tags: [
      { id: 'fitness', name: 'Fitness', emoji: '💪' },
      { id: 'gaming', name: 'Gaming', emoji: '🎮' },
      { id: 'cars', name: 'Cars & Trucks', emoji: '🚗' },
      { id: 'sports', name: 'Sports', emoji: '🏀' },
      { id: 'college_life', name: 'College Life', emoji: '📚' },
      { id: 'bar_nights', name: 'Bar Nights', emoji: '🍺' },
      { id: 'outdoor', name: 'Outdoor', emoji: '🌲' },
      { id: 'sneakers', name: 'Sneaker Culture', emoji: '👟' },
    ]
  }
};

// Persona badges
const PERSONAS = [
  { id: 'mvp', name: 'The MVP', icon: Trophy, color: 'text-yellow-500' },
  { id: 'gym_captain', name: 'Gym Captain', icon: Dumbbell, color: 'text-[#0099ff]' },
  { id: 'gamer_knight', name: 'Gamer Knight', icon: Gamepad2, color: 'text-purple-500' },
  { id: 'wingman', name: 'The Wingman', icon: Heart, color: 'text-red-500' },
];

// Mock creators data
const MOCK_CREATORS = [
  {
    id: '1',
    username: 'gym_chad',
    displayName: 'Chad Martinez',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    coverImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
    persona: 'gym_captain',
    tags: ['gym_guy', 'fitness', 'masc', 'athleisure'],
    subscriberCount: 12500,
    isVerified: true,
    isLive: false,
    subscriptionPrice: 9.99,
    bio: 'Fitness enthusiast. Gym is life. 💪'
  },
  {
    id: '2',
    username: 'skater_mike',
    displayName: 'Mike Thompson',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
    coverImage: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800',
    persona: 'wingman',
    tags: ['skater', 'streetwear', 'chill_bro', 'outdoor'],
    subscriberCount: 8300,
    isVerified: true,
    isLive: true,
    subscriptionPrice: 7.99,
    bio: 'Skate or die. Living that street life.'
  },
  {
    id: '3',
    username: 'gamer_alex',
    displayName: 'Alex Chen',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300',
    coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
    persona: 'gamer_knight',
    tags: ['gamer', 'gaming', 'college_bro', 'lowkey_cutie'],
    subscriberCount: 15200,
    isVerified: true,
    isLive: false,
    subscriptionPrice: 12.99,
    bio: 'Pro gamer vibes. Late night streams.'
  },
  {
    id: '4',
    username: 'blue_collar_joe',
    displayName: 'Joe Bradley',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300',
    coverImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
    persona: 'mvp',
    tags: ['blue_collar', 'denim_boots', 'rough_edges', 'beard_bro'],
    subscriberCount: 9800,
    isVerified: true,
    isLive: false,
    subscriptionPrice: 8.99,
    bio: 'Working man energy. Real talk only.'
  },
  {
    id: '5',
    username: 'jock_ryan',
    displayName: 'Ryan Williams',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300',
    coverImage: 'https://images.unsplash.com/photo-1461896836934- voices',
    persona: 'mvp',
    tags: ['jock', 'athlete', 'sports', 'alpha_energy'],
    subscriberCount: 22100,
    isVerified: true,
    isLive: true,
    subscriptionPrice: 14.99,
    bio: 'Former college athlete. Keeping it 100.'
  },
  {
    id: '6',
    username: 'trade_marcus',
    displayName: 'Marcus Jones',
    avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=300',
    coverImage: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
    persona: 'gym_captain',
    tags: ['trade', 'masc', 'gym_fits', 'locker_room'],
    subscriberCount: 18700,
    isVerified: true,
    isLive: false,
    subscriptionPrice: 11.99,
    bio: 'Just a regular guy doing regular guy things.'
  },
];

// Featured collections
const COLLECTIONS = [
  { id: 'mvps', name: 'MVPs of the Week', icon: Trophy, count: 24 },
  { id: 'gym_bros', name: 'Gym Bros', icon: Dumbbell, count: 156 },
  { id: 'gamers', name: 'Gamer Night', icon: Gamepad2, count: 89 },
  { id: 'street_kings', name: 'Street Kings', icon: Shirt, count: 67 },
  { id: 'trending', name: 'Trending Now', icon: TrendingUp, count: 42 },
];

export default function ExplorePage() {
  const { isAuthenticated } = useAuth();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('popular');
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSearchQuery('');
  };

  // Filter creators based on selected tags
  const filteredCreators = MOCK_CREATORS.filter(creator => {
    if (selectedTags.length === 0) return true;
    return selectedTags.some(tag => creator.tags.includes(tag));
  });

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1e1e1e]/95 backdrop-blur-md border-b border-[#3a3a3a]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[#0099ff]">BroFanz</span>
              <span className="hidden sm:inline text-xs text-gray-400">Where Bros Run It</span>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search bros..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0d0d0d] border border-[#3a3a3a] rounded-lg
                           text-white placeholder-gray-500 focus:outline-none focus:border-[#0099ff]
                           transition-colors"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors
                          ${showFilters
                            ? 'bg-[#0099ff] border-[#0099ff] text-white'
                            : 'border-[#3a3a3a] text-gray-400 hover:border-[#0099ff] hover:text-white'
                          }`}
              >
                <Filter className="w-5 h-5" />
                <span className="hidden sm:inline">Filters</span>
                {selectedTags.length > 0 && (
                  <span className="bg-[#00ff88] text-black text-xs font-bold px-2 py-0.5 rounded-full">
                    {selectedTags.length}
                  </span>
                )}
              </button>

              <div className="hidden md:flex border border-[#3a3a3a] rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 ${viewMode === 'grid' ? 'bg-[#0099ff] text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 ${viewMode === 'list' ? 'bg-[#0099ff] text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <LayoutList className="w-5 h-5" />
                </button>
              </div>

              {/* Auth Buttons */}
              {isAuthenticated ? (
                <UserMenu />
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowLogin(true)}
                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setShowSignup(true)}
                    className="px-4 py-2 bg-[#0099ff] text-white rounded-lg hover:bg-[#0088ee] transition-colors"
                  >
                    Join
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Active Filters */}
          {selectedTags.length > 0 && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-sm text-gray-400">Active filters:</span>
              {selectedTags.map(tagId => {
                const tag = Object.values(TAG_CATEGORIES)
                  .flatMap(cat => cat.tags)
                  .find(t => t.id === tagId);
                return tag ? (
                  <button
                    key={tagId}
                    onClick={() => toggleTag(tagId)}
                    className="flex items-center gap-1 px-2 py-1 bg-[#0099ff]/20 text-[#0099ff]
                             rounded-full text-sm hover:bg-[#0099ff]/30 transition-colors"
                  >
                    <span>{tag.emoji}</span>
                    <span>{tag.name}</span>
                    <X className="w-3 h-3" />
                  </button>
                ) : null;
              })}
              <button
                onClick={clearFilters}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="border-t border-[#3a3a3a] bg-[#1e1e1e]">
            <div className="max-w-7xl mx-auto px-4 py-4">
              {/* Category Tabs */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {Object.entries(TAG_CATEGORIES).map(([key, category]) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveCategory(activeCategory === key ? null : key)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors
                                ${activeCategory === key
                                  ? 'bg-[#0099ff] text-white'
                                  : 'bg-[#0d0d0d] text-gray-400 hover:text-white border border-[#3a3a3a]'
                                }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{category.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tags Grid */}
              {activeCategory && (
                <div className="flex flex-wrap gap-2">
                  {TAG_CATEGORIES[activeCategory as keyof typeof TAG_CATEGORIES].tags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors
                                ${selectedTags.includes(tag.id)
                                  ? 'bg-[#0099ff] text-white'
                                  : 'bg-[#0d0d0d] text-gray-300 border border-[#3a3a3a] hover:border-[#0099ff]'
                                }`}
                    >
                      <span>{tag.emoji}</span>
                      <span>{tag.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Hero Section */}
        <section className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-[#0099ff]">Explore</span> the Brotherhood
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Discover gym bros, jocks, gamers, and everyday dudes sharing exclusive content.
          </p>
        </section>

        {/* Featured Collections */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-[#00ff88]" />
            Featured Collections
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {COLLECTIONS.map(collection => {
              const Icon = collection.icon;
              return (
                <button
                  key={collection.id}
                  className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#1e1e1e] to-[#0d0d0d]
                           border border-[#3a3a3a] rounded-xl hover:border-[#0099ff] transition-colors
                           whitespace-nowrap group"
                >
                  <Icon className="w-5 h-5 text-[#0099ff] group-hover:text-[#00ff88] transition-colors" />
                  <span className="font-medium">{collection.name}</span>
                  <span className="text-xs text-gray-500">({collection.count})</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Sort Options */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-400">
            Showing <span className="text-white font-medium">{filteredCreators.length}</span> bros
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg px-3 py-1.5 text-sm
                       focus:outline-none focus:border-[#0099ff]"
            >
              <option value="popular">Most Popular</option>
              <option value="newest">Newest</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="online">Online Now</option>
            </select>
          </div>
        </div>

        {/* Creators Grid */}
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {filteredCreators.map(creator => (
            <CreatorCard key={creator.id} creator={creator} viewMode={viewMode} />
          ))}
        </div>

        {/* Empty State */}
        {filteredCreators.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-[#1e1e1e] rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">No bros found</h3>
            <p className="text-gray-400 mb-4">Try adjusting your filters or search query</p>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-[#0099ff] text-white rounded-lg hover:bg-[#0088ee] transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Load More */}
        {filteredCreators.length > 0 && (
          <div className="text-center mt-12">
            <button className="px-8 py-3 border border-[#3a3a3a] text-gray-300 rounded-lg
                             hover:border-[#0099ff] hover:text-white transition-colors">
              Load More Bros
            </button>
          </div>
        )}
      </main>

      {/* CTA Section */}
      <section className="py-16 bg-[#1e1e1e] mt-12">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">
            Ready to <span className="text-[#0099ff]">Join</span> the Brotherhood?
          </h2>
          <p className="text-gray-400 mb-6">
            Get exclusive access to premium content from the best bros on the platform.
          </p>
          <button
            onClick={() => setShowSignup(true)}
            className="px-8 py-3 bg-[#0099ff] text-white rounded-lg text-lg font-semibold
                     hover:bg-[#0088ee] transition-colors"
          >
            Start Your Journey
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d0d0d] border-t border-[#3a3a3a] py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            © 2025 BroFanz. Where the bros come to run the creator economy. 18+ Only.
          </p>
        </div>
      </footer>

      {/* Authentication Modals */}
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToSignup={() => {
          setShowLogin(false);
          setShowSignup(true);
        }}
      />

      <SignupModal
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        onSwitchToLogin={() => {
          setShowSignup(false);
          setShowLogin(true);
        }}
      />
    </div>
  );
}

// Creator Card Component
interface Creator {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  coverImage: string;
  persona: string;
  tags: string[];
  subscriberCount: number;
  isVerified: boolean;
  isLive: boolean;
  subscriptionPrice: number;
  bio: string;
}

function CreatorCard({ creator, viewMode }: { creator: Creator; viewMode: 'grid' | 'list' }) {
  const persona = PERSONAS.find(p => p.id === creator.persona);
  const PersonaIcon = persona?.icon || Star;

  if (viewMode === 'list') {
    return (
      <Link href={`/creator/${creator.username}`}>
        <div className="flex items-center gap-4 p-4 bg-[#1e1e1e] rounded-xl border border-[#3a3a3a]
                      hover:border-[#0099ff] transition-all group">
          {/* Avatar */}
          <div className="relative">
            <img
              src={creator.avatar}
              alt={creator.displayName}
              className="w-16 h-16 rounded-full object-cover"
            />
            {creator.isLive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5
                             bg-red-500 text-xs font-bold rounded-full">LIVE</span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold truncate">{creator.displayName}</h3>
              {creator.isVerified && (
                <svg className="w-4 h-4 text-[#0099ff] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {persona && <PersonaIcon className={`w-4 h-4 ${persona.color} flex-shrink-0`} />}
            </div>
            <p className="text-sm text-gray-400">@{creator.username}</p>
            <div className="flex items-center gap-2 mt-1">
              {creator.tags.slice(0, 3).map(tagId => {
                const tag = Object.values(TAG_CATEGORIES)
                  .flatMap(cat => cat.tags)
                  .find(t => t.id === tagId);
                return tag ? (
                  <span key={tagId} className="text-xs">{tag.emoji}</span>
                ) : null;
              })}
            </div>
          </div>

          {/* Stats & Price */}
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold text-[#00ff88]">${creator.subscriptionPrice}/mo</p>
            <p className="text-sm text-gray-400">{(creator.subscriberCount / 1000).toFixed(1)}K fans</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/creator/${creator.username}`}>
      <div className="bg-[#1e1e1e] rounded-xl border border-[#3a3a3a] overflow-hidden
                    hover:border-[#0099ff] transition-all group">
        {/* Cover Image */}
        <div className="relative h-32 overflow-hidden bg-[#0d0d0d]">
          <img
            src={creator.coverImage}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {creator.isLive && (
            <span className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-xs font-bold rounded-full
                           flex items-center gap-1">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              LIVE
            </span>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1e1e1e] via-transparent to-transparent"></div>
        </div>

        {/* Profile Section */}
        <div className="relative px-4 pb-4">
          {/* Avatar */}
          <div className="absolute -top-8 left-4">
            <img
              src={creator.avatar}
              alt={creator.displayName}
              className="w-16 h-16 rounded-full border-4 border-[#1e1e1e] object-cover bg-[#3a3a3a]"
            />
          </div>

          {/* Name & Badge */}
          <div className="pt-10">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg truncate">{creator.displayName}</h3>
              {creator.isVerified && (
                <svg className="w-5 h-5 text-[#0099ff] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <p className="text-sm text-gray-400">@{creator.username}</p>

            {/* Persona Badge */}
            {persona && (
              <div className="flex items-center gap-1.5 mt-2">
                <PersonaIcon className={`w-4 h-4 ${persona.color}`} />
                <span className="text-xs text-gray-400">{persona.name}</span>
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {creator.tags.slice(0, 4).map(tagId => {
                const tag = Object.values(TAG_CATEGORIES)
                  .flatMap(cat => cat.tags)
                  .find(t => t.id === tagId);
                return tag ? (
                  <span
                    key={tagId}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#0d0d0d]
                             rounded-full text-xs text-gray-300"
                  >
                    <span>{tag.emoji}</span>
                    <span>{tag.name}</span>
                  </span>
                ) : null;
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#3a3a3a]">
              <span className="text-gray-400 text-sm">
                {(creator.subscriberCount / 1000).toFixed(1)}K fans
              </span>
              <span className="text-[#00ff88] font-bold">
                ${creator.subscriptionPrice}/mo
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
