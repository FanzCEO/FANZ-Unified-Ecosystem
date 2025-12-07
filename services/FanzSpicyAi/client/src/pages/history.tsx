import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/navbar";

export default function History() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();

  const { data: history, isLoading } = useQuery({
    queryKey: ["/api/content-history"],
  }) as { data: any[] | undefined, isLoading: boolean };

  const filteredHistory = history?.filter((item: any) => {
    const matchesSearch = item.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         JSON.parse(item.generatedContent).content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    return matchesSearch && matchesType;
  }) || [];

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Content copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy content to clipboard.",
        variant: "destructive",
      });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'title': return 'bg-primary/20 text-primary';
      case 'description': return 'bg-secondary/20 text-secondary';
      case 'script': return 'bg-accent/20 text-accent';
      case 'social_post': return 'bg-destructive/20 text-destructive';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl sm:text-4xl font-black gradient-text mb-2" data-testid="history-title">
            Content History
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            View and manage all your generated content
          </p>
        </div>

        {/* Filters */}
        <Card className="bg-card border-border mb-6 md:mb-8" data-testid="filters-card">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-12 text-base"
                  data-testid="input-search"
                />
              </div>
              <div className="sm:w-48">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger data-testid="select-type-filter" className="h-12">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="title">Titles</SelectItem>
                    <SelectItem value="description">Descriptions</SelectItem>
                    <SelectItem value="script">Scripts</SelectItem>
                    <SelectItem value="social_post">Social Posts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content List */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-4" data-testid="loading-state">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
                      <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredHistory.length > 0 ? (
            filteredHistory.map((item: any) => {
              const content = JSON.parse(item.generatedContent);
              const isExpanded = expandedItems[item.id];
              
              return (
                <Card key={item.id} className="bg-card border-border hover-glow" data-testid={`history-item-${item.id}`}>
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={getTypeColor(item.type)} data-testid={`badge-type-${item.type}`}>
                            {item.type.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString()}
                          </span>
                          <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                            {item.creditsUsed} credit{item.creditsUsed !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <CardTitle className="text-white text-lg font-semibold">
                          {item.prompt}
                        </CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(item.id)}
                        data-testid={`button-toggle-${item.id}`}
                      >
                        <i className={`fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {/* Preview */}
                    <div className="mb-4">
                      <p className="text-muted-foreground line-clamp-2">
                        {content.content}
                      </p>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="space-y-4 border-t border-border pt-4" data-testid={`expanded-content-${item.id}`}>
                        {/* Main Content */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-white">Generated Content</h4>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(content.content)}
                              data-testid={`button-copy-content-${item.id}`}
                            >
                              <i className="fas fa-copy mr-1"></i>
                              Copy
                            </Button>
                          </div>
                          <div className="bg-muted/20 p-4 rounded-lg">
                            <p className="text-white whitespace-pre-wrap">{content.content}</p>
                          </div>
                        </div>

                        {/* Additional Fields */}
                        {content.title && (
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <h5 className="font-medium text-white">Title</h5>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(content.title)}
                                data-testid={`button-copy-title-${item.id}`}
                              >
                                <i className="fas fa-copy mr-1"></i>
                                Copy
                              </Button>
                            </div>
                            <div className="bg-muted/20 p-3 rounded-lg">
                              <p className="text-white">{content.title}</p>
                            </div>
                          </div>
                        )}

                        {content.description && (
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <h5 className="font-medium text-white">Description</h5>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(content.description)}
                                data-testid={`button-copy-description-${item.id}`}
                              >
                                <i className="fas fa-copy mr-1"></i>
                                Copy
                              </Button>
                            </div>
                            <div className="bg-muted/20 p-3 rounded-lg">
                              <p className="text-white">{content.description}</p>
                            </div>
                          </div>
                        )}

                        {/* Tags */}
                        {content.tags && content.tags.length > 0 && (
                          <div>
                            <h5 className="font-medium text-white mb-2">SEO Tags</h5>
                            <div className="flex flex-wrap gap-2">
                              {content.tags.map((tag: string, index: number) => (
                                <span
                                  key={index}
                                  className="bg-primary/20 text-primary px-2 py-1 rounded-full text-sm"
                                  data-testid={`tag-${item.id}-${index}`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Metadata */}
                        {content.metadata && (
                          <div className="border-t border-border pt-4">
                            <h5 className="font-medium text-white mb-2">Content Metadata</h5>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Word Count:</span>
                                <span className="text-white ml-2">{content.metadata.wordCount}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Read Time:</span>
                                <span className="text-white ml-2">{content.metadata.estimatedReadTime} min</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="bg-card border-border" data-testid="empty-state">
              <CardContent className="text-center py-12">
                <i className="fas fa-file-alt text-4xl text-muted-foreground mb-4"></i>
                <h3 className="text-xl font-semibold text-white mb-2">No Content Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || typeFilter !== "all" 
                    ? "Try adjusting your search or filters" 
                    : "You haven't generated any content yet"}
                </p>
                <Button 
                  className="bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                  onClick={() => window.location.href = "/generator"}
                  data-testid="button-generate-content"
                >
                  Generate Content
                  <i className="fas fa-magic ml-2"></i>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
