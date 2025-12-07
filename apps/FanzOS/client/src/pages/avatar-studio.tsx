import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreatorAvatarBuilder } from "@/components/creator-avatar-builder";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { 
  Sparkles, 
  User, 
  Image, 
  Download, 
  Share2, 
  Crown,
  Palette,
  Camera,
  Wand2
} from "lucide-react";

export default function AvatarStudio() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("create");

  // Get user's existing avatars
  const { data: avatars, isLoading } = useQuery({
    queryKey: [`/api/avatars/user/${user?.id}`],
    enabled: !!user?.id,
  });

  const handleAvatarSave = (avatar: any) => {
    // Avatar saved successfully, could refresh the gallery
    console.log("Avatar saved:", avatar);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center py-8">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign in Required</h2>
            <p className="text-muted-foreground">
              Please sign in to access the Avatar Studio
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
              <Sparkles className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Avatar Studio
            </h1>
            <p className="text-xl text-purple-100 mb-6 max-w-2xl mx-auto">
              Create your perfect digital representation with our advanced avatar builder designed specifically for 18+ verified creators
            </p>
            
            {user.role === 'creator' && (
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-sm">
                <Crown className="h-4 w-4 text-yellow-300" />
                <span>Verified Creator - Advanced Features Unlocked</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-7xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="create" className="flex items-center gap-2" data-testid="tab-create">
              <Wand2 className="h-4 w-4" />
              Create Avatar
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2" data-testid="tab-gallery">
              <Image className="h-4 w-4" />
              My Avatars
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2" data-testid="tab-templates">
              <Palette className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* Avatar Creation */}
          <TabsContent value="create" className="space-y-6">
            <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <User className="h-6 w-6 text-purple-600" />
                      Create Your Avatar
                    </CardTitle>
                    <CardDescription className="text-base mt-1">
                      Design a unique digital representation that captures your personality
                    </CardDescription>
                  </div>
                  
                  {user.role === 'creator' && (
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      Creator Pro
                    </Badge>
                  )}
                </div>
              </CardHeader>
            </Card>

            <CreatorAvatarBuilder
              userId={user.id}
              onSave={handleAvatarSave}
              showAdvanced={user.role === 'creator' && user.isVerified}
            />
          </TabsContent>

          {/* Avatar Gallery */}
          <TabsContent value="gallery" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  My Avatar Collection
                </CardTitle>
                <CardDescription>
                  Manage and download your created avatars
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <div className="aspect-square bg-gray-200 rounded-t-lg" />
                        <CardContent className="p-4 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                          <div className="h-3 bg-gray-200 rounded w-1/2" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : avatars?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {avatars.map((avatar: any) => (
                      <Card key={avatar.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 relative">
                          {avatar.imageUrl ? (
                            <img
                              src={avatar.imageUrl}
                              alt={avatar.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="h-16 w-16 text-purple-400" />
                            </div>
                          )}
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                              <Button size="sm" className="flex-1" data-testid={`download-${avatar.id}`}>
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                              <Button size="sm" variant="outline" className="bg-white/20 border-white/20 text-white hover:bg-white/30" data-testid={`share-${avatar.id}`}>
                                <Share2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <CardContent className="p-3">
                          <h3 className="font-medium text-sm mb-1">{avatar.name}</h3>
                          <p className="text-xs text-muted-foreground mb-2">
                            Created {new Date(avatar.createdAt).toLocaleDateString()}
                          </p>
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {avatar.style}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {avatar.gender}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No avatars yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first avatar to get started
                    </p>
                    <Button onClick={() => setActiveTab("create")} data-testid="create-first-avatar">
                      <Wand2 className="mr-2 h-4 w-4" />
                      Create Avatar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Avatar Templates */}
          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Avatar Templates
                </CardTitle>
                <CardDescription>
                  Start with pre-designed templates and customize them to your liking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Template categories */}
                  {[
                    {
                      name: "Elegant Feminine",
                      description: "Sophisticated and graceful designs",
                      count: 12,
                      preview: "💃",
                      premium: false
                    },
                    {
                      name: "Bold Masculine",
                      description: "Strong and confident styles",
                      count: 10,
                      preview: "💪",
                      premium: false
                    },
                    {
                      name: "Non-Binary Chic",
                      description: "Modern androgynous aesthetics",
                      count: 8,
                      preview: "✨",
                      premium: false
                    },
                    {
                      name: "Glamour Pro",
                      description: "High-end luxury avatars",
                      count: 15,
                      preview: "👑",
                      premium: true
                    },
                    {
                      name: "Fantasy Collection",
                      description: "Creative and imaginative designs",
                      count: 20,
                      preview: "🧚",
                      premium: true
                    },
                    {
                      name: "Professional Series",
                      description: "Business and formal styles",
                      count: 6,
                      preview: "💼",
                      premium: false
                    }
                  ].map((template) => (
                    <Card 
                      key={template.name}
                      className={`cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 ${
                        template.premium ? 'border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50' : ''
                      }`}
                      data-testid={`template-${template.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-4">{template.preview}</div>
                        
                        <h3 className="font-semibold text-lg mb-2 flex items-center justify-center gap-2">
                          {template.name}
                          {template.premium && <Crown className="h-4 w-4 text-yellow-500" />}
                        </h3>
                        
                        <p className="text-sm text-muted-foreground mb-3">
                          {template.description}
                        </p>
                        
                        <Badge variant="outline" className="mb-4">
                          {template.count} templates
                        </Badge>
                        
                        <Button 
                          size="sm" 
                          className="w-full"
                          variant={template.premium ? "default" : "outline"}
                        >
                          {template.premium ? "Unlock Collection" : "Browse Templates"}
                        </Button>
                        
                        {template.premium && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Creator Pro feature
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}