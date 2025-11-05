import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  GraduationCap, 
  Clock, 
  Users, 
  Play, 
  CheckCircle,
  Star,
  Filter
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Tutorial {
  id: string;
  title: string;
  summary: string;
  roleTarget: 'fan' | 'creator' | 'admin' | 'all';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  coverImageUrl?: string;
  stepCount: number;
  completedSteps?: number;
  isCompleted?: boolean;
  rating?: number;
  enrollments?: number;
}

export default function TutorialsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Fetch tutorials from API
  const { data: tutorialsData, isLoading } = useQuery<{ tutorials: Tutorial[] }>({
    queryKey: ['/api/tutorials', roleFilter, difficultyFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (difficultyFilter !== 'all') params.set('difficulty', difficultyFilter);
      const queryString = params.toString();
      const url = `/api/tutorials${queryString ? `?${queryString}` : ''}`;
      return fetch(url).then(res => res.json());
    }
  });

  const tutorials = tutorialsData?.tutorials || [];

  // Mock progress data - in production this would come from API
  const mockProgress: { [key: string]: { completedSteps: number; isCompleted: boolean } } = {
    '1': { completedSteps: 3, isCompleted: false },
    '2': { completedSteps: 0, isCompleted: false },
    '3': { completedSteps: 6, isCompleted: true },
    '4': { completedSteps: 0, isCompleted: false },
    '5': { completedSteps: 8, isCompleted: false }
  };

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesSearch = searchQuery === '' || 
      tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutorial.summary.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDifficulty = difficultyFilter === 'all' || tutorial.difficulty === difficultyFilter;
    const matchesRole = roleFilter === 'all' || tutorial.roleTarget === roleFilter || tutorial.roleTarget === 'all';
    
    return matchesSearch && matchesDifficulty && matchesRole;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-600';
      case 'intermediate':
        return 'bg-yellow-600';
      case 'advanced':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'creator':
        return 'text-pink-400 border-pink-600';
      case 'fan':
        return 'text-blue-400 border-blue-600';
      case 'admin':
        return 'text-purple-400 border-purple-600';
      case 'all':
        return 'text-cyan-400 border-cyan-600';
      default:
        return 'text-gray-400 border-gray-600';
    }
  };

  const getProgressPercentage = (tutorial: Tutorial) => {
    if (!tutorial.completedSteps) return 0;
    return Math.round((tutorial.completedSteps / tutorial.stepCount) * 100);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Ghostly Background */}
      <div 
        className="fixed inset-0 opacity-20 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1000 1000\"><defs><radialGradient id=\"g\" cx=\"50%\" cy=\"50%\" r=\"50%\"><stop offset=\"0%\" stop-color=\"%23ff00ff\" stop-opacity=\"0.3\"/><stop offset=\"100%\" stop-color=\"%2300ffff\" stop-opacity=\"0.1\"/></radialGradient></defs><rect width=\"100%\" height=\"100%\" fill=\"url(%23g)\"/></svg>')"
        }}
      />
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
            Tutorials & Learning
          </h1>
          <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4">
            Step-by-step guides to master every aspect of the GirlFanz platform
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search tutorials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-gray-900/50 border-gray-800 text-white"
                data-testid="input-tutorial-search"
              />
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-gray-900/50 border-gray-800 text-white">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800">
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-32 bg-gray-900/50 border-gray-800 text-white">
                  <Users className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800">
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="fan">Fan</SelectItem>
                  <SelectItem value="creator">Creator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4 text-center">
              <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-green-400 mx-auto mb-2" />
              <div className="text-xl sm:text-2xl font-bold text-white">{tutorials.length}</div>
              <div className="text-xs sm:text-sm text-gray-400">Total Tutorials</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {tutorials.filter(t => t.isCompleted).length}
              </div>
              <div className="text-sm text-gray-400">Completed</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4 text-center">
              <Play className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {tutorials.filter(t => (t.completedSteps || 0) > 0 && !t.isCompleted).length}
              </div>
              <div className="text-sm text-gray-400">In Progress</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {Math.round(tutorials.reduce((acc, t) => acc + t.estimatedMinutes, 0) / tutorials.length)}m
              </div>
              <div className="text-sm text-gray-400">Avg Duration</div>
            </CardContent>
          </Card>
        </div>

        {/* Tutorials Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-700 rounded w-full"></div>
                    <div className="h-8 bg-gray-700 rounded"></div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : filteredTutorials.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutorials.map((tutorial) => (
              <Card 
                key={tutorial.id} 
                className="bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-colors cursor-pointer group"
                onClick={() => setLocation(`/tutorials/${tutorial.id}`)}
                data-testid={`tutorial-${tutorial.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {tutorial.isCompleted ? (
                        <CheckCircle className="h-6 w-6 text-green-400" />
                      ) : tutorial.completedSteps && tutorial.completedSteps > 0 ? (
                        <Play className="h-6 w-6 text-yellow-400" />
                      ) : (
                        <GraduationCap className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getRoleColor(tutorial.roleTarget)} variant="outline">
                        {tutorial.roleTarget}
                      </Badge>
                      <Badge className={`${getDifficultyColor(tutorial.difficulty)} text-white`}>
                        {tutorial.difficulty}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardTitle className="text-white group-hover:text-green-400 transition-colors">
                    {tutorial.title}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {tutorial.summary}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {/* Progress Bar */}
                  {tutorial.completedSteps !== undefined && tutorial.completedSteps > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                        <span>Progress</span>
                        <span>{tutorial.completedSteps}/{tutorial.stepCount} steps</span>
                      </div>
                      <Progress 
                        value={getProgressPercentage(tutorial)} 
                        className="h-2"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {tutorial.estimatedMinutes} min
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {tutorial.enrollments?.toLocaleString() || '0'}
                      </div>
                      {tutorial.rating && (
                        <div className="flex items-center text-yellow-400">
                          <Star className="h-4 w-4 fill-current mr-1" />
                          {tutorial.rating}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    className={`w-full ${
                      tutorial.isCompleted 
                        ? 'bg-green-600 hover:bg-green-700'
                        : tutorial.completedSteps && tutorial.completedSteps > 0
                        ? 'bg-yellow-600 hover:bg-yellow-700'
                        : 'bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-700 hover:to-cyan-700'
                    }`}
                    data-testid={`button-start-tutorial-${tutorial.id}`}
                  >
                    {tutorial.isCompleted ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Review Tutorial
                      </>
                    ) : tutorial.completedSteps && tutorial.completedSteps > 0 ? (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Continue Learning
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Start Tutorial
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No tutorials found</h3>
              <p className="text-gray-400 mb-4">
                {searchQuery ? 
                  `No tutorials match your search criteria.` :
                  'No tutorials available for the selected filters.'
                }
              </p>
              <Button 
                onClick={() => {
                  setSearchQuery('');
                  setDifficultyFilter('all');
                  setRoleFilter('all');
                }}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Personalized Recommendations */}
        <Card className="mt-8 bg-gradient-to-r from-green-900/20 to-cyan-900/20 border-green-800/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <GraduationCap className="h-6 w-6 mr-2 text-cyan-400" />
              Recommended for You
            </CardTitle>
            <CardDescription className="text-gray-300">
              Based on your role and current progress, we suggest starting with these tutorials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tutorials.filter(t => t.difficulty === 'beginner').slice(0, 3).map((tutorial) => (
                <Badge 
                  key={tutorial.id}
                  variant="outline" 
                  className="text-green-400 border-green-600 cursor-pointer hover:bg-green-600 hover:text-white transition-colors"
                >
                  {tutorial.title}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}