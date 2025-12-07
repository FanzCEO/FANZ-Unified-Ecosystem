import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  BarChart3,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  X,
  Edit2,
  Trash2,
  Share2,
  MessageSquare,
  Award
} from "lucide-react";

export default function Polls() {
  const { user } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [pollDuration, setPollDuration] = useState("24");
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [allowSuggestions, setAllowSuggestions] = useState(false);

  // Mock polls data
  const activePolls = [
    {
      id: "poll1",
      question: "What content would you like to see more of?",
      options: [
        { text: "Behind the scenes", votes: 234, percentage: 45 },
        { text: "Tutorials", votes: 156, percentage: 30 },
        { text: "Q&A sessions", votes: 89, percentage: 17 },
        { text: "Personal vlogs", votes: 42, percentage: 8 },
      ],
      totalVotes: 521,
      endsAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      isActive: true,
    },
    {
      id: "poll2",
      question: "Best time for live streams?",
      options: [
        { text: "Morning (8-12 PM)", votes: 67, percentage: 22 },
        { text: "Afternoon (12-5 PM)", votes: 134, percentage: 44 },
        { text: "Evening (5-9 PM)", votes: 89, percentage: 29 },
        { text: "Night (9 PM+)", votes: 15, percentage: 5 },
      ],
      totalVotes: 305,
      endsAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
      isActive: true,
    },
  ];

  const endedPolls = [
    {
      id: "poll3",
      question: "Should I create a monthly newsletter?",
      options: [
        { text: "Yes, I'd subscribe!", votes: 456, percentage: 72 },
        { text: "Maybe, depends on content", votes: 123, percentage: 19 },
        { text: "No thanks", votes: 56, percentage: 9 },
      ],
      totalVotes: 635,
      endedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      isActive: false,
    },
  ];

  const stats = {
    totalPolls: activePolls.length + endedPolls.length,
    totalVotes: [...activePolls, ...endedPolls].reduce((sum, poll) => sum + poll.totalVotes, 0),
    avgVotesPerPoll: Math.floor(([...activePolls, ...endedPolls].reduce((sum, poll) => sum + poll.totalVotes, 0)) / (activePolls.length + endedPolls.length)),
    activePolls: activePolls.length,
  };

  const topVoters = [
    { name: "Sarah M.", votes: 45, avatar: "SM" },
    { name: "Mike R.", votes: 38, avatar: "MR" },
    { name: "Jessica L.", votes: 32, avatar: "JL" },
    { name: "David K.", votes: 28, avatar: "DK" },
    { name: "Emma W.", votes: 24, avatar: "EW" },
  ];

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const getTimeRemaining = (endsAt: Date) => {
    const diff = endsAt.getTime() - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-400 bg-clip-text text-transparent mb-2">
              Polls & Engagement
            </h1>
            <p className="text-gray-400">Create polls and gather feedback from your community</p>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Poll
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border-blue-800/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Polls</p>
                <h3 className="text-3xl font-bold text-white">{stats.totalPolls}</h3>
              </div>
              <BarChart3 className="h-10 w-10 text-blue-500" />
            </div>
            <p className="mt-2 text-gray-400 text-sm">{stats.activePolls} active now</p>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Votes</p>
                <h3 className="text-3xl font-bold text-white">{stats.totalVotes}</h3>
              </div>
              <Users className="h-10 w-10 text-cyan-500" />
            </div>
            <div className="mt-2 flex items-center text-green-400 text-sm">
              <TrendingUp className="h-4 w-4 mr-1" />
              +18% this week
            </div>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Avg Votes</p>
                <h3 className="text-3xl font-bold text-white">{stats.avgVotesPerPoll}</h3>
              </div>
              <BarChart3 className="h-10 w-10 text-purple-500" />
            </div>
            <p className="mt-2 text-gray-400 text-sm">Per poll</p>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Engagement</p>
                <h3 className="text-3xl font-bold text-white">64%</h3>
              </div>
              <Award className="h-10 w-10 text-yellow-500" />
            </div>
            <p className="mt-2 text-gray-400 text-sm">Participation rate</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Polls List */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="bg-zinc-900 border border-zinc-800 mb-6">
                <TabsTrigger value="active" className="data-[state=active]:bg-blue-600">
                  <Clock className="h-4 w-4 mr-2" />
                  Active ({activePolls.length})
                </TabsTrigger>
                <TabsTrigger value="ended" className="data-[state=active]:bg-blue-600">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Ended ({endedPolls.length})
                </TabsTrigger>
              </TabsList>

              {/* Active Polls */}
              <TabsContent value="active" className="space-y-6">
                {activePolls.map((poll) => (
                  <Card key={poll.id} className="bg-zinc-900 border-zinc-800 p-6 hover:border-blue-600/50 transition-all">
                    {/* Poll Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2">{poll.question}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {poll.totalVotes} votes
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-cyan-400" />
                            {getTimeRemaining(poll.endsAt)} left
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-red-400">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Poll Options */}
                    <div className="space-y-3">
                      {poll.options.map((option, index) => (
                        <div key={index} className="relative">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-white font-medium">{option.text}</span>
                            <span className="text-sm text-gray-400">
                              {option.votes} votes ({option.percentage}%)
                            </span>
                          </div>
                          <div className="relative h-10 bg-zinc-800 rounded-lg overflow-hidden">
                            <div
                              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-cyan-600 transition-all duration-500"
                              style={{ width: `${option.percentage}%` }}
                            />
                            <div className="relative h-full flex items-center px-4">
                              <span className="text-sm font-medium text-white z-10">
                                {option.percentage}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Poll Footer */}
                    <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Created {new Date(poll.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="border-zinc-700 text-sm">
                          <BarChart3 className="h-3 w-3 mr-1" />
                          View Analytics
                        </Button>
                        <Button size="sm" variant="outline" className="border-zinc-700 text-sm">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Discuss
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              {/* Ended Polls */}
              <TabsContent value="ended" className="space-y-6">
                {endedPolls.map((poll) => (
                  <Card key={poll.id} className="bg-zinc-900 border-zinc-800 p-6 opacity-75">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">{poll.question}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {poll.totalVotes} votes
                          </span>
                          <span className="px-2 py-1 bg-gray-900 text-gray-400 rounded text-xs">
                            Ended
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {poll.options.map((option, index) => (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-white">{option.text}</span>
                            <span className="text-sm text-gray-400">{option.percentage}%</span>
                          </div>
                          <div className="h-8 bg-zinc-800 rounded-lg overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-gray-600 to-gray-700"
                              style={{ width: `${option.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Voters */}
            <Card className="bg-zinc-900 border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Top Voters</h3>
                <Award className="h-5 w-5 text-yellow-500" />
              </div>

              <div className="space-y-4">
                {topVoters.map((voter, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center font-bold text-sm">
                        {voter.avatar}
                      </div>
                      {index < 3 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center text-xs font-bold text-black">
                          {index + 1}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{voter.name}</p>
                      <p className="text-xs text-gray-400">{voter.votes} votes</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-cyan-400">{voter.votes}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Tips */}
            <Card className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border-blue-800/30 p-6">
              <h4 className="font-semibold text-white mb-3 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-blue-500" />
                Poll Tips
              </h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-2">•</span>
                  <span>Ask clear, specific questions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-2">•</span>
                  <span>Keep polls short (24-48 hours)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-2">•</span>
                  <span>Use results to guide content</span>
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-2">•</span>
                  <span>Share results with community</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Poll Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Create New Poll
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Question */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Question</label>
              <Input
                placeholder="What would you like to ask your fans?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            {/* Options */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Answer Options</label>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                    {options.length > 2 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeOption(index)}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 10 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  className="mt-3 border-zinc-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              )}
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
              <div className="grid grid-cols-4 gap-3">
                {["12", "24", "48", "72"].map((hours) => (
                  <button
                    key={hours}
                    onClick={() => setPollDuration(hours)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      pollDuration === hours
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
                    }`}
                  >
                    <span className="block text-lg font-semibold">{hours}h</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-white">Multiple Choice</p>
                  <p className="text-xs text-gray-400">Allow fans to select multiple options</p>
                </div>
                <input
                  type="checkbox"
                  checked={multipleChoice}
                  onChange={(e) => setMultipleChoice(e.target.checked)}
                  className="w-5 h-5 accent-blue-600"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-white">Allow Suggestions</p>
                  <p className="text-xs text-gray-400">Let fans suggest additional options</p>
                </div>
                <input
                  type="checkbox"
                  checked={allowSuggestions}
                  onChange={(e) => setAllowSuggestions(e.target.checked)}
                  className="w-5 h-5 accent-blue-600"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-zinc-700"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600">
                <Plus className="mr-2 h-4 w-4" />
                Create Poll
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
