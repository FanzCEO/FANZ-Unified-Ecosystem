import React, { useState, useEffect } from 'react';
import { motion, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Heart, Star, ThumbsUp, Gift, Zap, Sparkles, 
  Volume2, VolumeX, Play, Pause, Settings, 
  MousePointer2, Smartphone, Monitor, Headphones
} from 'lucide-react';

interface MicroInteraction {
  id: string;
  name: string;
  category: 'buttons' | 'feedback' | 'loading' | 'navigation' | 'forms';
  description: string;
  component: React.ComponentType<any>;
  customizable: boolean;
  premium: boolean;
}

interface InteractionSettings {
  duration: number;
  intensity: number;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  reducedMotion: boolean;
}

// Custom Button Animations
const AnimatedLikeButton = ({ settings }: { settings: InteractionSettings }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleClick = () => {
    setIsLiked(!isLiked);
    
    // Create particle explosion effect
    if (!isLiked) {
      const newParticles = Array.from({ length: 6 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100 - 50,
        y: Math.random() * 100 - 50
      }));
      setParticles(newParticles);
      
      // Clear particles after animation
      setTimeout(() => setParticles([]), 1000);
    }
  };

  return (
    <div className="relative inline-block" data-testid="animated-like-button">
      <motion.button
        className={`relative p-4 rounded-full transition-all ${
          isLiked 
            ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white' 
            : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
        }`}
        onClick={handleClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={isLiked ? { 
          scale: [1, 1.2, 1],
          rotate: [0, -10, 10, 0]
        } : {}}
        transition={{ duration: settings.duration / 1000 }}
      >
        <motion.div
          animate={isLiked ? {
            scale: [1, 1.3, 1],
            rotateY: [0, 180, 360]
          } : {}}
          transition={{ duration: 0.6 }}
        >
          <Heart 
            size={24} 
            className={isLiked ? 'fill-current' : ''}
          />
        </motion.div>
      </motion.button>
      
      {/* Particle effects */}
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute top-1/2 left-1/2 pointer-events-none"
            initial={{ opacity: 1, scale: 0 }}
            animate={{ 
              opacity: 0, 
              scale: 1,
              x: particle.x,
              y: particle.y
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="text-pink-500 text-xl">💖</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const AnimatedStarButton = ({ settings }: { settings: InteractionSettings }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex gap-1" data-testid="animated-star-button">
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          key={star}
          className="p-1"
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          onClick={() => setRating(star)}
          whileHover={{ scale: 1.2, rotate: 15 }}
          whileTap={{ scale: 0.8 }}
          transition={{ duration: settings.duration / 1000 }}
        >
          <motion.div
            animate={
              (hoverRating >= star || rating >= star) ? {
                scale: [1, 1.3, 1],
                rotateZ: [0, 360]
              } : {}
            }
            transition={{ duration: 0.5 }}
          >
            <Star
              size={28}
              className={
                (hoverRating >= star || rating >= star)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }
            />
          </motion.div>
        </motion.button>
      ))}
    </div>
  );
};

const PulsingNotificationDot = ({ settings }: { settings: InteractionSettings }) => {
  return (
    <div className="relative" data-testid="pulsing-notification">
      <Button variant="outline" size="sm">
        <span>Notifications</span>
      </Button>
      <motion.div
        className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.8, 1, 0.8]
        }}
        transition={{
          duration: settings.duration / 500,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
};

const BounceLoader = ({ settings }: { settings: InteractionSettings }) => {
  return (
    <div className="flex gap-2 items-center justify-center p-8" data-testid="bounce-loader">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-3 h-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: settings.duration / 500,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

const HoverCard3D = ({ settings }: { settings: InteractionSettings }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="w-64 h-40 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl overflow-hidden cursor-pointer relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ 
        rotateX: 15,
        rotateY: 15,
        scale: 1.05
      }}
      style={{ 
        perspective: "1000px",
        transformStyle: "preserve-3d"
      }}
      transition={{ duration: settings.duration / 1000 }}
      data-testid="hover-card-3d"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
      <div className="p-6 text-white relative z-10">
        <h3 className="text-xl font-bold mb-2">3D Card Effect</h3>
        <p className="text-purple-100">Hover me for 3D transformation</p>
      </div>
      
      {/* Floating elements */}
      <AnimatePresence>
        {isHovered && (
          <>
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white/60 rounded-full"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + (i % 2) * 20}%`
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ 
                  opacity: 1, 
                  y: -20,
                  rotate: 360
                }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ 
                  duration: 2, 
                  delay: i * 0.1,
                  ease: "easeOut"
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const SwipeGesture = ({ settings }: { settings: InteractionSettings }) => {
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  const x = useMotionValue(0);
  
  useEffect(() => {
    const timeout = setTimeout(() => setSwipeDirection(null), 1000);
    return () => clearTimeout(timeout);
  }, [swipeDirection]);

  return (
    <div className="w-full max-w-sm mx-auto" data-testid="swipe-gesture">
      <motion.div
        className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-6 text-white cursor-grab active:cursor-grabbing"
        style={{ x }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.3}
        onDragEnd={(event, info) => {
          const threshold = 100;
          if (info.offset.x > threshold) {
            setSwipeDirection('right');
          } else if (info.offset.x < -threshold) {
            setSwipeDirection('left');
          }
        }}
        whileDrag={{ scale: 0.95, rotateZ: 5 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        <div className="text-center">
          <Smartphone className="mx-auto mb-2" size={32} />
          <p className="font-semibold">Swipe Me!</p>
          <p className="text-sm text-blue-100">
            {swipeDirection ? `Swiped ${swipeDirection}!` : 'Drag left or right'}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export function MicroInteractionDesignSystem() {
  const [settings, setSettings] = useState<InteractionSettings>({
    duration: 500,
    intensity: 5,
    soundEnabled: true,
    hapticsEnabled: true,
    reducedMotion: false
  });

  const [selectedCategory, setSelectedCategory] = useState('buttons');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile' | 'tablet'>('desktop');

  const microInteractions: MicroInteraction[] = [
    {
      id: 'like-button',
      name: 'Animated Like Button',
      category: 'buttons',
      description: 'Heart animation with particle effects',
      component: AnimatedLikeButton,
      customizable: true,
      premium: false
    },
    {
      id: 'star-rating',
      name: 'Star Rating',
      category: 'feedback',
      description: 'Interactive star rating with hover effects',
      component: AnimatedStarButton,
      customizable: true,
      premium: false
    },
    {
      id: 'notification-dot',
      name: 'Pulsing Notification',
      category: 'feedback',
      description: 'Animated notification indicator',
      component: PulsingNotificationDot,
      customizable: true,
      premium: false
    },
    {
      id: 'bounce-loader',
      name: 'Bounce Loader',
      category: 'loading',
      description: 'Three-dot bouncing loading animation',
      component: BounceLoader,
      customizable: true,
      premium: false
    },
    {
      id: 'hover-card',
      name: '3D Hover Card',
      category: 'navigation',
      description: 'Card with 3D transformation on hover',
      component: HoverCard3D,
      customizable: true,
      premium: true
    },
    {
      id: 'swipe-gesture',
      name: 'Swipe Gesture',
      category: 'forms',
      description: 'Mobile-friendly swipe interaction',
      component: SwipeGesture,
      customizable: true,
      premium: true
    }
  ];

  const filteredInteractions = microInteractions.filter(
    interaction => interaction.category === selectedCategory
  );

  const categories = [
    { id: 'buttons', name: 'Buttons', icon: MousePointer2 },
    { id: 'feedback', name: 'Feedback', icon: Heart },
    { id: 'loading', name: 'Loading', icon: Play },
    { id: 'navigation', name: 'Navigation', icon: Monitor },
    { id: 'forms', name: 'Forms', icon: Smartphone }
  ];

  const deviceModes = [
    { id: 'desktop', name: 'Desktop', icon: Monitor },
    { id: 'tablet', name: 'Tablet', icon: Smartphone },
    { id: 'mobile', name: 'Mobile', icon: Smartphone }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6" data-testid="micro-interaction-design-system">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          Micro Interaction Design System
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Delightful animations and interactions to enhance user experience
        </p>
      </div>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings size={20} />
            Global Settings
          </CardTitle>
          <CardDescription>
            Configure animation behavior across all interactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Duration */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Animation Duration</label>
              <Slider
                value={[settings.duration]}
                onValueChange={(value) => setSettings(prev => ({ ...prev, duration: value[0] }))}
                min={100}
                max={2000}
                step={100}
                className="w-full"
                data-testid="slider-duration"
              />
              <span className="text-xs text-gray-500">{settings.duration}ms</span>
            </div>

            {/* Intensity */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Animation Intensity</label>
              <Slider
                value={[settings.intensity]}
                onValueChange={(value) => setSettings(prev => ({ ...prev, intensity: value[0] }))}
                min={1}
                max={10}
                step={1}
                className="w-full"
                data-testid="slider-intensity"
              />
              <span className="text-xs text-gray-500">Level {settings.intensity}</span>
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-2">
                  {settings.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  Sound Effects
                </label>
              </div>
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, soundEnabled: checked }))}
                data-testid="switch-sound"
              />
            </div>

            {/* Reduced Motion */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Reduced Motion</label>
                <p className="text-xs text-gray-500">Accessibility option</p>
              </div>
              <Switch
                checked={settings.reducedMotion}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, reducedMotion: checked }))}
                data-testid="switch-reduced-motion"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device Preview Mode */}
      <div className="flex gap-2">
        {deviceModes.map(mode => {
          const Icon = mode.icon;
          return (
            <Button
              key={mode.id}
              variant={previewMode === mode.id ? "default" : "outline"}
              size="sm"
              onClick={() => setPreviewMode(mode.id as any)}
              className="flex items-center gap-2"
              data-testid={`button-device-${mode.id}`}
            >
              <Icon size={16} />
              {mode.name}
            </Button>
          );
        })}
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Category Sidebar */}
          <div className="lg:w-1/4">
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
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className="space-y-6">
              {/* Interaction Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredInteractions.map((interaction) => {
                  const Component = interaction.component;
                  return (
                    <motion.div
                      key={interaction.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`
                        ${previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''}
                        ${previewMode === 'tablet' ? 'max-w-md mx-auto' : ''}
                      `}
                    >
                      <Card data-testid={`interaction-${interaction.id}`}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{interaction.name}</CardTitle>
                            <div className="flex gap-2">
                              {interaction.premium && (
                                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400">
                                  Premium
                                </Badge>
                              )}
                              {interaction.customizable && (
                                <Badge variant="secondary">
                                  Customizable
                                </Badge>
                              )}
                            </div>
                          </div>
                          <CardDescription>{interaction.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-8 flex items-center justify-center min-h-32">
                            <Component settings={settings} />
                          </div>
                          
                          {/* Interaction Controls */}
                          <div className="mt-4 pt-4 border-t flex gap-2">
                            <Button size="sm" variant="outline" data-testid={`button-copy-${interaction.id}`}>
                              Copy Code
                            </Button>
                            <Button size="sm" variant="outline" data-testid={`button-customize-${interaction.id}`}>
                              Customize
                            </Button>
                            {interaction.premium && (
                              <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                                <Sparkles size={16} className="mr-1" />
                                Unlock
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Usage Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Usage Analytics</CardTitle>
                  <CardDescription>
                    Track which interactions perform best with your audience
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { name: 'Most Popular', interaction: 'Animated Like Button', usage: 89 },
                      { name: 'Highest Engagement', interaction: '3D Hover Card', usage: 76 },
                      { name: 'Mobile Favorite', interaction: 'Swipe Gesture', usage: 92 }
                    ].map((stat) => (
                      <div key={stat.name} className="text-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                        <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-300 mb-1">
                          {stat.name}
                        </h4>
                        <p className="font-bold text-lg">{stat.interaction}</p>
                        <p className="text-sm text-gray-500">{stat.usage}% engagement</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  );
}