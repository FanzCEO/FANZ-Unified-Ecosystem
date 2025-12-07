import { motion } from "framer-motion";
import { Gamepad2, Trophy, Star, Coins, Target, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Games() {
  const games = [
    {
      id: 1,
      name: "Creator Challenge",
      description: "Daily challenges for creators to boost engagement",
      icon: Target,
      players: 1250,
      rewards: "100 FAN Coins",
      difficulty: "Easy",
      status: "active"
    },
    {
      id: 2,
      name: "Fan Trivia",
      description: "Test your knowledge about your favorite creators",
      icon: Star,
      players: 3400,
      rewards: "50 FAN Coins",
      difficulty: "Medium",
      status: "active"
    },
    {
      id: 3,
      name: "Prediction League",
      description: "Predict creator milestones and content trends",
      icon: Trophy,
      players: 890,
      rewards: "500 FAN Coins",
      difficulty: "Hard",
      status: "beta"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-4">
            FanzMetaVerse
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Virtual reality experience with immersive creator-fan interactions
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <Card className="bg-slate-800/50 border-slate-700/50 p-6 hover:border-purple-500/50 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <game.icon className="w-8 h-8 text-purple-400" />
                  <Badge variant={game.status === "active" ? "default" : "secondary"}>
                    {game.status}
                  </Badge>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">{game.name}</h3>
                <p className="text-gray-300 mb-4">{game.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Players:</span>
                    <span className="text-purple-300">{game.players.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Rewards:</span>
                    <span className="text-green-400">{game.rewards}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Difficulty:</span>
                    <span className="text-yellow-400">{game.difficulty}</span>
                  </div>
                </div>
                
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Gamepad2 className="w-4 h-4 mr-2" />
                  Play Now
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mt-12"
        >
          <div className="bg-slate-800/50 rounded-lg p-8 border border-slate-700/50">
            <Coins className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">FAN Coins Balance</h3>
            <div className="text-4xl font-bold text-yellow-400 mb-4">2,350</div>
            <p className="text-gray-300 mb-6">Earn coins by playing games and engaging with creators</p>
            <Button size="lg" className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700">
              <Zap className="w-5 h-5 mr-2" />
              Redeem Rewards
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}