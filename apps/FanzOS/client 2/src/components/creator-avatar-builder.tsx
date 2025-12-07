import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Palette, 
  User, 
  Eye, 
  Shirt, 
  Crown, 
  Sparkles,
  Download,
  Share,
  Save,
  RefreshCw,
  Zap,
  Heart,
  Camera,
  Wand2
} from "lucide-react";

interface AvatarFeatures {
  // Basic Info
  gender: 'feminine' | 'masculine' | 'non-binary';
  bodyType: 'slim' | 'athletic' | 'curvy' | 'plus-size' | 'muscular';
  
  // Face Features
  skinTone: number; // 0-100
  faceShape: 'oval' | 'round' | 'square' | 'heart' | 'diamond';
  eyeShape: 'almond' | 'round' | 'hooded' | 'monolid' | 'upturned' | 'downturned';
  eyeColor: string;
  eyebrowStyle: 'natural' | 'arched' | 'straight' | 'bold' | 'thin';
  noseShape: 'straight' | 'button' | 'roman' | 'wide' | 'narrow';
  lipShape: 'full' | 'thin' | 'heart' | 'wide' | 'pouty';
  lipColor: string;
  
  // Hair
  hairStyle: string;
  hairColor: string;
  hairLength: 'short' | 'medium' | 'long' | 'bald';
  
  // Body Features (18+ appropriate)
  bustSize: number; // 0-100
  waistSize: number; // 0-100
  hipSize: number; // 0-100
  height: number; // 0-100
  muscleTone: number; // 0-100
  
  // Style & Clothing
  outfit: string;
  accessories: string[];
  makeup: {
    foundation: number;
    eyeshadow: string;
    eyeliner: number;
    mascara: number;
    blush: number;
    highlighter: number;
  };
  
  // Personality Expression
  pose: 'confident' | 'playful' | 'seductive' | 'casual' | 'professional';
  expression: 'smile' | 'smirk' | 'wink' | 'pout' | 'serious' | 'flirty';
  confidence: number; // 0-100
}

interface CreatorAvatarBuilderProps {
  userId: string;
  initialAvatar?: Partial<AvatarFeatures>;
  onSave?: (avatar: AvatarFeatures) => void;
  showAdvanced?: boolean;
}

const SKIN_TONES = [
  { value: 0, label: 'Very Light', color: '#FDBCB4' },
  { value: 20, label: 'Light', color: '#EDBAA6' },
  { value: 40, label: 'Medium Light', color: '#D08B5B' },
  { value: 60, label: 'Medium', color: '#AE7242' },
  { value: 80, label: 'Dark', color: '#8D5524' },
  { value: 100, label: 'Very Dark', color: '#6B3410' }
];

const HAIR_STYLES = {
  feminine: [
    'Long Wavy', 'Straight Bob', 'Curly Pixie', 'Beach Waves', 'High Ponytail',
    'Braided Crown', 'Loose Curls', 'Side Swept', 'Messy Bun', 'Pin Curls'
  ],
  masculine: [
    'Crew Cut', 'Pompadour', 'Fade', 'Buzz Cut', 'Undercut',
    'Quiff', 'Slicked Back', 'Textured Crop', 'Beard Combo', 'Long Hair'
  ],
  'non-binary': [
    'Asymmetric Cut', 'Shaved Sides', 'Colorful Pixie', 'Androgynous Bob',
    'Punk Style', 'Natural Afro', 'Braided Mohawk', 'Flowing Locks'
  ]
};

const OUTFIT_CATEGORIES = {
  casual: ['Crop Top & Jeans', 'Hoodie & Shorts', 'Sundress', 'Tank & Leggings'],
  glamour: ['Evening Gown', 'Cocktail Dress', 'Suit & Tie', 'Designer Outfit'],
  fitness: ['Sports Bra & Shorts', 'Gym Outfit', 'Yoga Wear', 'Swimwear'],
  artistic: ['Bohemian Style', 'Vintage Look', 'Alternative Fashion', 'Creative Wear'],
  professional: ['Business Suit', 'Blazer & Skirt', 'Professional Dress', 'Smart Casual']
};

export function CreatorAvatarBuilder({
  userId,
  initialAvatar,
  onSave,
  showAdvanced = true
}: CreatorAvatarBuilderProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [avatar, setAvatar] = useState<AvatarFeatures>({
    gender: 'feminine',
    bodyType: 'athletic',
    skinTone: 40,
    faceShape: 'oval',
    eyeShape: 'almond',
    eyeColor: '#8B4513',
    eyebrowStyle: 'natural',
    noseShape: 'straight',
    lipShape: 'full',
    lipColor: '#FF6B9D',
    hairStyle: 'Long Wavy',
    hairColor: '#8B4513',
    hairLength: 'long',
    bustSize: 50,
    waistSize: 40,
    hipSize: 60,
    height: 50,
    muscleTone: 30,
    outfit: 'Crop Top & Jeans',
    accessories: [],
    makeup: {
      foundation: 30,
      eyeshadow: '#C8A2C8',
      eyeliner: 20,
      mascara: 40,
      blush: 20,
      highlighter: 30
    },
    pose: 'confident',
    expression: 'smile',
    confidence: 75,
    ...initialAvatar
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [isGenerating, setIsGenerating] = useState(false);

  // Save avatar mutation
  const saveAvatarMutation = useMutation({
    mutationFn: async (avatarData: AvatarFeatures) => {
      const response = await apiRequest('POST', '/api/avatar/save', {
        userId,
        avatar: avatarData
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Avatar Saved!",
        description: "Your creator avatar has been saved successfully.",
      });
      onSave?.(avatar);
    },
    onError: (error: Error) => {
      toast({
        title: "Save Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate avatar image mutation
  const generateAvatarMutation = useMutation({
    mutationFn: async (avatarData: AvatarFeatures) => {
      const response = await apiRequest('POST', '/api/avatar/generate', {
        userId,
        avatar: avatarData,
        format: 'png',
        resolution: '512x512'
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.imageUrl) {
        // Display generated avatar
        renderAvatarPreview(data.imageUrl);
      }
    },
  });

  const updateFeature = (category: string, feature: string, value: any) => {
    if (category === 'makeup') {
      setAvatar(prev => ({
        ...prev,
        makeup: {
          ...prev.makeup,
          [feature]: value
        }
      }));
    } else {
      setAvatar(prev => ({
        ...prev,
        [feature]: value
      }));
    }
  };

  const generateAvatar = () => {
    setIsGenerating(true);
    generateAvatarMutation.mutate(avatar);
    setTimeout(() => setIsGenerating(false), 2000);
  };

  const renderAvatarPreview = (imageUrl?: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (imageUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = imageUrl;
    } else {
      // Draw a placeholder preview based on current settings
      drawPlaceholderAvatar(ctx, canvas.width, canvas.height);
    }
  };

  const drawPlaceholderAvatar = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);
    
    // Skin tone
    const skinColor = SKIN_TONES.find(tone => Math.abs(tone.value - avatar.skinTone) < 10)?.color || '#EDBAA6';
    
    // Head (circle)
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(width / 2, height * 0.3, width * 0.15, 0, 2 * Math.PI);
    ctx.fill();
    
    // Body outline
    ctx.fillStyle = skinColor;
    ctx.fillRect(width * 0.35, height * 0.45, width * 0.3, height * 0.55);
    
    // Hair color indicator
    ctx.fillStyle = avatar.hairColor;
    ctx.fillRect(width * 0.35, height * 0.15, width * 0.3, height * 0.15);
    
    // Outfit color (simplified)
    ctx.fillStyle = '#4A90E2';
    ctx.fillRect(width * 0.3, height * 0.5, width * 0.4, height * 0.4);
    
    // Text overlay
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Preview', width / 2, height - 10);
  };

  useEffect(() => {
    renderAvatarPreview();
  }, [avatar]);

  const randomizeAvatar = () => {
    const genders: Array<'feminine' | 'masculine' | 'non-binary'> = ['feminine', 'masculine', 'non-binary'];
    const randomGender = genders[Math.floor(Math.random() * genders.length)];
    
    setAvatar({
      ...avatar,
      gender: randomGender,
      skinTone: Math.floor(Math.random() * 100),
      eyeColor: `hsl(${Math.floor(Math.random() * 360)}, 70%, 45%)`,
      hairColor: `hsl(${Math.floor(Math.random() * 360)}, 60%, 40%)`,
      hairStyle: HAIR_STYLES[randomGender][Math.floor(Math.random() * HAIR_STYLES[randomGender].length)],
      bustSize: Math.floor(Math.random() * 100),
      waistSize: Math.floor(Math.random() * 100),
      hipSize: Math.floor(Math.random() * 100),
      confidence: Math.floor(Math.random() * 100)
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Avatar Preview */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Avatar Preview
          </CardTitle>
          <CardDescription>
            Your custom creator avatar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={300}
              height={400}
              className="w-full border rounded-lg bg-gray-50"
              data-testid="avatar-canvas"
            />
            {isGenerating && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                <div className="text-white text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Generating...</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={generateAvatar}
              disabled={generateAvatarMutation.isPending}
              className="bg-gradient-to-r from-purple-500 to-pink-500"
              data-testid="generate-avatar"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Generate
            </Button>
            <Button
              onClick={randomizeAvatar}
              variant="outline"
              data-testid="randomize-avatar"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Random
            </Button>
          </div>
          
          <Button
            onClick={() => saveAvatarMutation.mutate(avatar)}
            disabled={saveAvatarMutation.isPending}
            className="w-full"
            data-testid="save-avatar"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Avatar
          </Button>
        </CardContent>
      </Card>

      {/* Avatar Customization */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Customize Your Avatar
          </CardTitle>
          <CardDescription>
            Create your unique digital representation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic" data-testid="tab-basic">Basic</TabsTrigger>
              <TabsTrigger value="face" data-testid="tab-face">Face</TabsTrigger>
              <TabsTrigger value="body" data-testid="tab-body">Body</TabsTrigger>
              <TabsTrigger value="style" data-testid="tab-style">Style</TabsTrigger>
              <TabsTrigger value="personality" data-testid="tab-personality">Vibe</TabsTrigger>
            </TabsList>

            {/* Basic Features */}
            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Gender Expression</Label>
                    <Select
                      value={avatar.gender}
                      onValueChange={(value: 'feminine' | 'masculine' | 'non-binary') =>
                        updateFeature('basic', 'gender', value)
                      }
                    >
                      <SelectTrigger data-testid="select-gender">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feminine">Feminine</SelectItem>
                        <SelectItem value="masculine">Masculine</SelectItem>
                        <SelectItem value="non-binary">Non-Binary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Body Type</Label>
                    <Select
                      value={avatar.bodyType}
                      onValueChange={(value) => updateFeature('basic', 'bodyType', value)}
                    >
                      <SelectTrigger data-testid="select-body-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slim">Slim</SelectItem>
                        <SelectItem value="athletic">Athletic</SelectItem>
                        <SelectItem value="curvy">Curvy</SelectItem>
                        <SelectItem value="plus-size">Plus Size</SelectItem>
                        <SelectItem value="muscular">Muscular</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Skin Tone</Label>
                    <div className="space-y-2">
                      <Slider
                        value={[avatar.skinTone]}
                        onValueChange={([value]) => updateFeature('basic', 'skinTone', value)}
                        max={100}
                        step={10}
                        data-testid="slider-skin-tone"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        {SKIN_TONES.map((tone) => (
                          <div
                            key={tone.value}
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: tone.color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Hair Style</Label>
                    <Select
                      value={avatar.hairStyle}
                      onValueChange={(value) => updateFeature('basic', 'hairStyle', value)}
                    >
                      <SelectTrigger data-testid="select-hair-style">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HAIR_STYLES[avatar.gender].map((style) => (
                          <SelectItem key={style} value={style}>
                            {style}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Face Features */}
            <TabsContent value="face" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Face Shape</Label>
                    <Select
                      value={avatar.faceShape}
                      onValueChange={(value) => updateFeature('face', 'faceShape', value)}
                    >
                      <SelectTrigger data-testid="select-face-shape">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="oval">Oval</SelectItem>
                        <SelectItem value="round">Round</SelectItem>
                        <SelectItem value="square">Square</SelectItem>
                        <SelectItem value="heart">Heart</SelectItem>
                        <SelectItem value="diamond">Diamond</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Eye Shape</Label>
                    <Select
                      value={avatar.eyeShape}
                      onValueChange={(value) => updateFeature('face', 'eyeShape', value)}
                    >
                      <SelectTrigger data-testid="select-eye-shape">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="almond">Almond</SelectItem>
                        <SelectItem value="round">Round</SelectItem>
                        <SelectItem value="hooded">Hooded</SelectItem>
                        <SelectItem value="monolid">Monolid</SelectItem>
                        <SelectItem value="upturned">Upturned</SelectItem>
                        <SelectItem value="downturned">Downturned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Eye Color</Label>
                    <input
                      type="color"
                      value={avatar.eyeColor}
                      onChange={(e) => updateFeature('face', 'eyeColor', e.target.value)}
                      className="w-full h-10 rounded border"
                      data-testid="input-eye-color"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Lip Shape</Label>
                    <Select
                      value={avatar.lipShape}
                      onValueChange={(value) => updateFeature('face', 'lipShape', value)}
                    >
                      <SelectTrigger data-testid="select-lip-shape">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full</SelectItem>
                        <SelectItem value="thin">Thin</SelectItem>
                        <SelectItem value="heart">Heart</SelectItem>
                        <SelectItem value="wide">Wide</SelectItem>
                        <SelectItem value="pouty">Pouty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Lip Color</Label>
                    <input
                      type="color"
                      value={avatar.lipColor}
                      onChange={(e) => updateFeature('face', 'lipColor', e.target.value)}
                      className="w-full h-10 rounded border"
                      data-testid="input-lip-color"
                    />
                  </div>

                  <div>
                    <Label>Hair Color</Label>
                    <input
                      type="color"
                      value={avatar.hairColor}
                      onChange={(e) => updateFeature('face', 'hairColor', e.target.value)}
                      className="w-full h-10 rounded border"
                      data-testid="input-hair-color"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Body Features */}
            <TabsContent value="body" className="space-y-6">
              {showAdvanced && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">
                      Adult Creator Features
                    </span>
                  </div>
                  <p className="text-xs text-purple-700">
                    These features are available for verified 18+ creators to create authentic avatars
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Height</Label>
                    <Slider
                      value={[avatar.height]}
                      onValueChange={([value]) => updateFeature('body', 'height', value)}
                      max={100}
                      data-testid="slider-height"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Petite</span>
                      <span>Tall</span>
                    </div>
                  </div>

                  <div>
                    <Label>Muscle Tone</Label>
                    <Slider
                      value={[avatar.muscleTone]}
                      onValueChange={([value]) => updateFeature('body', 'muscleTone', value)}
                      max={100}
                      data-testid="slider-muscle-tone"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Soft</span>
                      <span>Toned</span>
                    </div>
                  </div>
                </div>

                {showAdvanced && (
                  <div className="space-y-4">
                    <div>
                      <Label>Bust Size</Label>
                      <Slider
                        value={[avatar.bustSize]}
                        onValueChange={([value]) => updateFeature('body', 'bustSize', value)}
                        max={100}
                        data-testid="slider-bust-size"
                      />
                    </div>

                    <div>
                      <Label>Waist Size</Label>
                      <Slider
                        value={[avatar.waistSize]}
                        onValueChange={([value]) => updateFeature('body', 'waistSize', value)}
                        max={100}
                        data-testid="slider-waist-size"
                      />
                    </div>

                    <div>
                      <Label>Hip Size</Label>
                      <Slider
                        value={[avatar.hipSize]}
                        onValueChange={([value]) => updateFeature('body', 'hipSize', value)}
                        max={100}
                        data-testid="slider-hip-size"
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Style & Clothing */}
            <TabsContent value="style" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Outfit Category</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {Object.keys(OUTFIT_CATEGORIES).map((category) => (
                      <Button
                        key={category}
                        variant="outline"
                        size="sm"
                        onClick={() => updateFeature('style', 'outfit', OUTFIT_CATEGORIES[category as keyof typeof OUTFIT_CATEGORIES][0])}
                        className="justify-start"
                        data-testid={`outfit-category-${category}`}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Makeup Intensity</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label htmlFor="foundation">Foundation</Label>
                      <Slider
                        value={[avatar.makeup.foundation]}
                        onValueChange={([value]) => updateFeature('makeup', 'foundation', value)}
                        max={100}
                        data-testid="slider-foundation"
                      />
                    </div>
                    <div>
                      <Label htmlFor="blush">Blush</Label>
                      <Slider
                        value={[avatar.makeup.blush]}
                        onValueChange={([value]) => updateFeature('makeup', 'blush', value)}
                        max={100}
                        data-testid="slider-blush"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Personality & Expression */}
            <TabsContent value="personality" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Pose</Label>
                    <Select
                      value={avatar.pose}
                      onValueChange={(value) => updateFeature('personality', 'pose', value)}
                    >
                      <SelectTrigger data-testid="select-pose">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confident">Confident</SelectItem>
                        <SelectItem value="playful">Playful</SelectItem>
                        <SelectItem value="seductive">Seductive</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Expression</Label>
                    <Select
                      value={avatar.expression}
                      onValueChange={(value) => updateFeature('personality', 'expression', value)}
                    >
                      <SelectTrigger data-testid="select-expression">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="smile">Smile</SelectItem>
                        <SelectItem value="smirk">Smirk</SelectItem>
                        <SelectItem value="wink">Wink</SelectItem>
                        <SelectItem value="pout">Pout</SelectItem>
                        <SelectItem value="serious">Serious</SelectItem>
                        <SelectItem value="flirty">Flirty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Confidence Level</Label>
                    <Slider
                      value={[avatar.confidence]}
                      onValueChange={([value]) => updateFeature('personality', 'confidence', value)}
                      max={100}
                      data-testid="slider-confidence"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Shy</span>
                      <span>Bold</span>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <Heart className="h-4 w-4 text-pink-500" />
                      Avatar Personality
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Your avatar reflects a {avatar.pose}, {avatar.expression} personality with {avatar.confidence}% confidence.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}