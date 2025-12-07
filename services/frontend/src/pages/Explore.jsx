import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, TrendingUp, Clock, Users, Star, CheckCircle, Video, Camera, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ExplorePage = () => {
  const navigate = useNavigate();
  const [creators, setCreators] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({});
  const [activeFilters, setActiveFilters] = useState({
    category: '',
    gender: '',
    age: '',
    priceMin: 0,
    priceMax: 999,
    verified: false,
    sortBy: 'popular'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadCreators();
  }, [activeFilters, activeTab]);

  const loadInitialData = async () => {
    try {
      const [categoriesRes, filtersRes] = await Promise.all([
        fetch('/api/v1/explore/categories'),
        fetch('/api/v1/explore/filters')
      ]);
      
      const categoriesData = await categoriesRes.json();
      const filtersData = await filtersRes.json();
      
      setCategories(categoriesData.categories || []);
      setFilters(filtersData || {});
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const loadCreators = async () => {
    setLoading(true);
    try {
      let endpoint = '/api/v1/explore/creators';
      
      if (activeTab === 'featured') {
        endpoint = '/api/v1/explore/creators/featured';
      } else if (activeTab === 'trending') {
        endpoint = '/api/v1/explore/creators/trending';
      } else if (activeTab === 'new') {
        endpoint = '/api/v1/explore/creators/new';
      } else if (activeTab === 'online') {
        endpoint = '/api/v1/explore/creators/online';
      }
      
      const params = new URLSearchParams({
        ...activeFilters,
        limit: 24
      });
      
      const response = await fetch(`${endpoint}?${params}`);
      const data = await response.json();
      
      setCreators(data.creators || data.featured || data.trending || data.new_creators || data.online || []);
    } catch (error) {
      console.error('Failed to load creators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/v1/explore/search/creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, filters: activeFilters })
      });
      
      const data = await response.json();
      setCreators(data.results || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (categoryId) => {
    setActiveFilters(prev => ({ ...prev, category: categoryId }));
  };

  const handleFilterChange = (filterKey, value) => {
    setActiveFilters(prev => ({ ...prev, [filterKey]: value }));
  };

  const clearFilters = () => {
    setActiveFilters({
      category: '',
      gender: '',
      age: '',
      priceMin: 0,
      priceMax: 999,
      verified: false,
      sortBy: 'popular'
    });
  };

  const CreatorCard = ({ creator }) => (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
      onClick={() => navigate(`/creator/${creator.username}`)}
    >
      {/* Cover Image */}
      <div className="relative h-32 bg-gradient-to-br from-purple-400 to-pink-400">
        {creator.cover_url && (
          <img src={creator.cover_url} alt="" className="w-full h-full object-cover" />
        )}
        {creator.is_online && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            Online
          </div>
        )}
      </div>
      
      {/* Profile Info */}
      <div className="p-4">
        <div className="flex items-start -mt-12 mb-3">
          <div className="relative">
            <img 
              src={creator.avatar_url || '/default-avatar.png'} 
              alt={creator.display_name}
              className="w-20 h-20 rounded-full border-4 border-white object-cover"
            />
            {creator.is_verified && (
              <CheckCircle className="absolute bottom-0 right-0 w-6 h-6 text-blue-500 bg-white rounded-full" />
            )}
          </div>
        </div>
        
        <h3 className="font-semibold text-lg flex items-center gap-2">
          {creator.display_name}
          {creator.is_verified && (
            <CheckCircle className="w-5 h-5 text-blue-500" />
          )}
        </h3>
        <p className="text-gray-500 text-sm">@{creator.username}</p>
        
        <p className="text-gray-600 text-sm mt-2 line-clamp-2">{creator.bio}</p>
        
        {/* Stats */}
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{creator.subscriber_count || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Camera className="w-4 h-4" />
            <span>{creator.photo_count || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Video className="w-4 h-4" />
            <span>{creator.video_count || 0}</span>
          </div>
        </div>
        
        {/* Price */}
        <div className="mt-4 flex items-center justify-between">
          {creator.is_free || creator.subscription_price === 0 ? (
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              FREE
            </span>
          ) : (
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
              ${creator.subscription_price}/month
            </span>
          )}
          
          <button 
            className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm hover:bg-purple-700 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/creator/${creator.username}`);
            }}
          >
            View Profile
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Explore Creators</h1>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-xl mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search creators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
            </div>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-5 h-5" />
              Filters
              {Object.values(activeFilters).filter(v => v).length > 0 && (
                <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                  {Object.values(activeFilters).filter(v => v).length}
                </span>
              )}
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex items-center gap-6 mt-4 border-t pt-4">
            {[
              { id: 'all', label: 'All', icon: Users },
              { id: 'featured', label: 'Featured', icon: Star },
              { id: 'trending', label: 'Trending', icon: TrendingUp },
              { id: 'new', label: 'New', icon: Clock },
              { id: 'online', label: 'Online Now', icon: MessageCircle }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Categories Bar */}
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 overflow-x-auto">
            <button
              onClick={() => handleCategorySelect('')}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                !activeFilters.category 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              All Categories
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  activeFilters.category === category.id 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {category.icon && <span className="mr-2">{category.icon}</span>}
                {category.name}
                {category.creator_count > 0 && (
                  <span className="ml-2 text-xs opacity-75">({category.creator_count})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-64 bg-white rounded-lg p-6 h-fit">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Filters</h3>
                <button 
                  onClick={clearFilters}
                  className="text-sm text-purple-600 hover:underline"
                >
                  Clear all
                </button>
              </div>
              
              {/* Gender Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Gender</label>
                <select 
                  value={activeFilters.gender}
                  onChange={(e) => handleFilterChange('gender', e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">All</option>
                  {filters.genders?.map(gender => (
                    <option key={gender} value={gender}>{gender}</option>
                  ))}
                </select>
              </div>
              
              {/* Age Range Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Age Range</label>
                <select 
                  value={activeFilters.age}
                  onChange={(e) => handleFilterChange('age', e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">All</option>
                  {filters.age_ranges?.map(age => (
                    <option key={age} value={age}>{age}</option>
                  ))}
                </select>
              </div>
              
              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Price Range</label>
                <div className="flex gap-2">
                  <input 
                    type="number"
                    placeholder="Min"
                    value={activeFilters.priceMin}
                    onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                    className="w-1/2 p-2 border rounded-lg"
                  />
                  <input 
                    type="number"
                    placeholder="Max"
                    value={activeFilters.priceMax}
                    onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                    className="w-1/2 p-2 border rounded-lg"
                  />
                </div>
              </div>
              
              {/* Verified Only */}
              <div className="mb-6">
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    checked={activeFilters.verified}
                    onChange={(e) => handleFilterChange('verified', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Verified creators only</span>
                </label>
              </div>
              
              {/* Sort By */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Sort By</label>
                <select 
                  value={activeFilters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  {filters.sort_options?.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          {/* Creators Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg h-96 animate-pulse">
                    <div className="h-32 bg-gray-200"></div>
                    <div className="p-4">
                      <div className="w-20 h-20 rounded-full bg-gray-200 -mt-12 mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : creators.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {creators.map(creator => (
                  <CreatorCard key={creator.id} creator={creator} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No creators found</h3>
                <p className="text-gray-500">Try adjusting your filters or search query</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;