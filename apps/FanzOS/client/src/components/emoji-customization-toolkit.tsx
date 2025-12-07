import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, Heart, Fire, Smile, Star, Zap, Plus, Save, Download, Upload } from 'lucide-react';

interface EmojiReaction {
  id: string;
  emoji: string;
  name: string;
  category: string;
  customizable: boolean;
  color?: string;
  animation?: string;
  sound?: string;
  rarity: 'common' | 'rare' | 'legendary';
  unlocked: boolean;
  usageCount: number;
}

interface CustomEmojiDesign {
  baseEmoji: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  animation: string;
  sparkles: boolean;
  glow: boolean;
  bounce: boolean;
}

export function EmojiCustomizationToolkit() {
  const [selectedEmoji, setSelectedEmoji] = useState<EmojiReaction | null>(null);
  const [customDesign, setCustomDesign] = useState<CustomEmojiDesign>({
    baseEmoji: '❤️',
    name: 'Custom Heart',
    primaryColor: '#ff6b9d',
    secondaryColor: '#ffd93d',
    animation: 'pulse',
    sparkles: true,
    glow: false,
    bounce: false
  });
  const [activeCategory, setActiveCategory] = useState('popular');
  const [searchQuery, setSearchQuery] = useState('');

  // Default emoji reactions with customization data
  const [emojiReactions, setEmojiReactions] = useState<EmojiReaction[]>([
    { id: '1', emoji: '❤️', name: 'Love', category: 'popular', customizable: true, rarity: 'common', unlocked: true, usageCount: 1250 },
    { id: '2', emoji: '🔥', name: 'Fire', category: 'popular', customizable: true, rarity: 'common', unlocked: true, usageCount: 980 },
    { id: '3', emoji: '😍', name: 'Heart Eyes', category: 'popular', customizable: true, rarity: 'common', unlocked: true, usageCount: 750 },
    { id: '4', emoji: '💎', name: 'Diamond', category: 'premium', customizable: true, rarity: 'rare', unlocked: true, usageCount: 420 },
    { id: '5', emoji: '🌟', name: 'Superstar', category: 'premium', customizable: true, rarity: 'legendary', unlocked: false, usageCount: 0 },
    { id: '6', emoji: '⚡', name: 'Lightning', category: 'premium', customizable: true, rarity: 'rare', unlocked: true, usageCount: 315 },
    { id: '7', emoji: '🎭', name: 'Drama', category: 'creative', customizable: true, rarity: 'rare', unlocked: true, usageCount: 180 },
    { id: '8', emoji: '🦄', name: 'Unicorn', category: 'fantasy', customizable: true, rarity: 'legendary', unlocked: false, usageCount: 0 },
    { id: '9', emoji: '👑', name: 'Crown', category: 'premium', customizable: true, rarity: 'legendary', unlocked: true, usageCount: 95 },
    { id: '10', emoji: '🎨', name: 'Artist', category: 'creative', customizable: true, rarity: 'common', unlocked: true, usageCount: 220 }
  ]);

  const categories = [
    { id: 'popular', name: 'Popular', icon: Star },
    { id: 'premium', name: 'Premium', icon: Heart },
    { id: 'creative', name: 'Creative', icon: Palette },
    { id: 'fantasy', name: 'Fantasy', icon: Zap }
  ];

  const animations = [
    { id: 'pulse', name: 'Pulse', preview: 'scale-110' },
    { id: 'bounce', name: 'Bounce', preview: 'translate-y-1' },
    { id: 'spin', name: 'Spin', preview: 'rotate-12' },
    { id: 'glow', name: 'Glow', preview: 'shadow-lg' },
    { id: 'shake', name: 'Shake', preview: 'translate-x-1' }
  ];

  const filteredEmojis = emojiReactions.filter(emoji => {
    const matchesCategory = activeCategory === 'all' || emoji.category === activeCategory;
    const matchesSearch = emoji.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         emoji.emoji.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500';
      case 'rare': return 'bg-blue-500';
      case 'legendary': return 'bg-gradient-to-r from-purple-500 to-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const handleSaveCustomEmoji = () => {
    const newEmoji: EmojiReaction = {
      id: Date.now().toString(),
      emoji: customDesign.baseEmoji,
      name: customDesign.name,
      category: 'custom',
      customizable: true,
      rarity: 'rare',
      unlocked: true,
      usageCount: 0,
      color: customDesign.primaryColor,
      animation: customDesign.animation
    };
    
    setEmojiReactions(prev => [...prev, newEmoji]);
    
    // Reset design
    setCustomDesign({
      baseEmoji: '❤️',
      name: 'Custom Emoji',
      primaryColor: '#ff6b9d',
      secondaryColor: '#ffd93d',
      animation: 'pulse',
      sparkles: true,
      glow: false,
      bounce: false
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6" data-testid="emoji-customization-toolkit">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
          Emoji Reaction Toolkit
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Customize your reactions with unique colors, animations, and effects
        </p>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Categories and Search */}
          <div className="lg:w-1/4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-1 gap-2">
                  {categories.map(category => {
                    const Icon = category.icon;
                    return (
                      <TabsTrigger 
                        key={category.id} 
                        value={category.id}
                        className="flex items-center gap-2 justify-start"
                        data-testid={`category-${category.id}`}
                      >
                        <Icon size={16} />
                        {category.name}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </CardContent>
            </Card>

            {/* Search */}
            <Card>
              <CardContent className="pt-6">
                <Label htmlFor="emoji-search">Search Emojis</Label>
                <Input
                  id="emoji-search"
                  placeholder="Search reactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mt-2"
                  data-testid="input-emoji-search"
                />
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <Tabs defaultValue="browse" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="browse">Browse & Customize</TabsTrigger>
                <TabsTrigger value="create">Create New</TabsTrigger>
              </TabsList>

              {/* Browse Tab */}
              <TabsContent value="browse" className="space-y-6">
                {/* Emoji Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  <AnimatePresence>
                    {filteredEmojis.map((emoji) => (
                      <motion.div
                        key={emoji.id}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Card 
                          className={`cursor-pointer transition-all ${
                            selectedEmoji?.id === emoji.id ? 'ring-2 ring-pink-500' : ''
                          } ${emoji.unlocked ? '' : 'opacity-60'}`}
                          onClick={() => setSelectedEmoji(emoji)}
                          data-testid={`emoji-${emoji.id}`}
                        >
                          <CardContent className="p-4 text-center space-y-2">
                            <div className="text-4xl mb-2 relative">
                              <motion.span
                                animate={
                                  selectedEmoji?.id === emoji.id 
                                    ? { scale: [1, 1.2, 1] }
                                    : {}
                                }
                                transition={{ duration: 0.6, repeat: Infinity }}
                              >
                                {emoji.emoji}
                              </motion.span>
                              {!emoji.unlocked && (
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">🔒</span>
                                </div>
                              )}
                            </div>
                            <h3 className="font-semibold text-sm">{emoji.name}</h3>
                            <Badge className={`${getRarityColor(emoji.rarity)} text-white text-xs`}>
                              {emoji.rarity}
                            </Badge>
                            <p className="text-xs text-gray-500">
                              Used {emoji.usageCount.toLocaleString()}x
                            </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Selected Emoji Customization */}
                {selectedEmoji && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8"
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-3xl">{selectedEmoji.emoji}</span>
                          Customize "{selectedEmoji.name}"
                        </CardTitle>
                        <CardDescription>
                          Personalize your reaction with colors, animations, and effects
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Color Customization */}
                          <div className="space-y-4">
                            <h4 className="font-semibold">Colors</h4>
                            <div className="space-y-3">
                              <div>
                                <Label htmlFor="primary-color">Primary Color</Label>
                                <div className="flex items-center gap-2 mt-1">
                                  <Input
                                    id="primary-color"
                                    type="color"
                                    value={customDesign.primaryColor}
                                    onChange={(e) => setCustomDesign(prev => ({ ...prev, primaryColor: e.target.value }))}
                                    className="w-12 h-8"
                                    data-testid="input-primary-color"
                                  />
                                  <Input
                                    value={customDesign.primaryColor}
                                    onChange={(e) => setCustomDesign(prev => ({ ...prev, primaryColor: e.target.value }))}
                                    className="flex-1"
                                    placeholder="#ff6b9d"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="secondary-color">Secondary Color</Label>
                                <div className="flex items-center gap-2 mt-1">
                                  <Input
                                    id="secondary-color"
                                    type="color"
                                    value={customDesign.secondaryColor}
                                    onChange={(e) => setCustomDesign(prev => ({ ...prev, secondaryColor: e.target.value }))}
                                    className="w-12 h-8"
                                    data-testid="input-secondary-color"
                                  />
                                  <Input
                                    value={customDesign.secondaryColor}
                                    onChange={(e) => setCustomDesign(prev => ({ ...prev, secondaryColor: e.target.value }))}
                                    className="flex-1"
                                    placeholder="#ffd93d"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Animation Selection */}
                          <div className="space-y-4">
                            <h4 className="font-semibold">Animation</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {animations.map((anim) => (
                                <Button
                                  key={anim.id}
                                  variant={customDesign.animation === anim.id ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCustomDesign(prev => ({ ...prev, animation: anim.id }))}
                                  className="justify-center"
                                  data-testid={`button-animation-${anim.id}`}
                                >
                                  {anim.name}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Preview */}
                        <div className="bg-gradient-to-r from-pink-50 to-violet-50 dark:from-pink-900/20 dark:to-violet-900/20 p-8 rounded-lg text-center">
                          <h4 className="font-semibold mb-4">Preview</h4>
                          <motion.div
                            className="text-6xl inline-block"
                            animate={{
                              scale: customDesign.animation === 'pulse' ? [1, 1.1, 1] : 1,
                              y: customDesign.bounce ? [0, -10, 0] : 0,
                              rotate: customDesign.animation === 'spin' ? [0, 360] : 0,
                            }}
                            transition={{ duration: 1, repeat: Infinity }}
                            style={{
                              filter: customDesign.glow ? `drop-shadow(0 0 10px ${customDesign.primaryColor})` : 'none'
                            }}
                          >
                            {selectedEmoji.emoji}
                          </motion.div>
                          {customDesign.sparkles && (
                            <div className="mt-2">
                              <motion.span
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="text-yellow-400"
                              >
                                ✨ ✨ ✨
                              </motion.span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 justify-end">
                          <Button variant="outline" data-testid="button-reset-emoji">
                            Reset
                          </Button>
                          <Button 
                            onClick={handleSaveCustomEmoji}
                            className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600"
                            data-testid="button-save-emoji"
                          >
                            <Save size={16} className="mr-2" />
                            Save Custom Emoji
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </TabsContent>

              {/* Create Tab */}
              <TabsContent value="create" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Emoji Reaction</CardTitle>
                    <CardDescription>
                      Design a completely custom emoji reaction from scratch
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Base Emoji Selection */}
                      <div className="space-y-4">
                        <Label htmlFor="base-emoji">Base Emoji</Label>
                        <Input
                          id="base-emoji"
                          value={customDesign.baseEmoji}
                          onChange={(e) => setCustomDesign(prev => ({ ...prev, baseEmoji: e.target.value }))}
                          placeholder="❤️"
                          className="text-2xl text-center"
                          data-testid="input-base-emoji"
                        />
                        
                        <Label htmlFor="emoji-name">Emoji Name</Label>
                        <Input
                          id="emoji-name"
                          value={customDesign.name}
                          onChange={(e) => setCustomDesign(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter emoji name"
                          data-testid="input-emoji-name"
                        />
                      </div>

                      {/* Effects */}
                      <div className="space-y-4">
                        <h4 className="font-semibold">Effects</h4>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="sparkles"
                              checked={customDesign.sparkles}
                              onChange={(e) => setCustomDesign(prev => ({ ...prev, sparkles: e.target.checked }))}
                              data-testid="checkbox-sparkles"
                            />
                            <Label htmlFor="sparkles">Add Sparkles</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="glow"
                              checked={customDesign.glow}
                              onChange={(e) => setCustomDesign(prev => ({ ...prev, glow: e.target.checked }))}
                              data-testid="checkbox-glow"
                            />
                            <Label htmlFor="glow">Glow Effect</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="bounce"
                              checked={customDesign.bounce}
                              onChange={(e) => setCustomDesign(prev => ({ ...prev, bounce: e.target.checked }))}
                              data-testid="checkbox-bounce"
                            />
                            <Label htmlFor="bounce">Bounce Animation</Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Creation Actions */}
                    <div className="flex gap-3 justify-end pt-6 border-t">
                      <Button variant="outline" data-testid="button-import">
                        <Upload size={16} className="mr-2" />
                        Import
                      </Button>
                      <Button variant="outline" data-testid="button-export">
                        <Download size={16} className="mr-2" />
                        Export
                      </Button>
                      <Button 
                        onClick={handleSaveCustomEmoji}
                        className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                        data-testid="button-create-emoji"
                      >
                        <Plus size={16} className="mr-2" />
                        Create Emoji
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </Tabs>
    </div>
  );
}