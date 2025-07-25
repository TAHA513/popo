import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Star, Skull, Crown } from "lucide-react";
import BattleRoyaleGame from "./games/BattleRoyaleGame";

interface SoloGameInterfaceProps {
  gameId: string;
  gameName: string;
  onBack: () => void;
}

export default function SoloGameInterface({ gameId, gameName, onBack }: SoloGameInterfaceProps) {
  const [gameResult, setGameResult] = useState<{
    score: number;
    coins: number;
    kills: number;
    rank: number;
  } | null>(null);

  const handleGameEnd = (score: number, coins: number, kills: number, rank: number) => {
    setGameResult({
      score,
      coins,
      kills,
      rank
    });
  };

  const playAgain = () => {
    setGameResult(null);
  };

  if (gameResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button 
              onClick={onBack}
              variant="outline" 
              className="text-white border-white/20 hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              العودة
            </Button>
          </div>

          {/* Game Results */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 text-center text-white">
            <div className="text-8xl mb-6">
              {gameResult.rank === 1 ? '👑' : gameResult.rank <= 3 ? '🏆' : gameResult.rank <= 10 ? '🥉' : '💀'}
            </div>
            
            <h2 className="text-3xl font-bold mb-4">
              {gameResult.rank === 1 ? 'Victory Royale!' : `المركز #${gameResult.rank}`}
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-red-500 bg-opacity-20 rounded-lg p-4">
                <Skull className="w-8 h-8 mx-auto mb-2 text-red-400" />
                <div className="text-2xl font-bold">{gameResult.kills}</div>
                <div className="text-sm opacity-80">القتلى</div>
              </div>
              
              <div className="bg-blue-500 bg-opacity-20 rounded-lg p-4">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                <div className="text-2xl font-bold">#{gameResult.rank}</div>
                <div className="text-sm opacity-80">الترتيب</div>
              </div>
              
              <div className="bg-yellow-500 bg-opacity-20 rounded-lg p-4">
                <Star className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
                <div className="text-2xl font-bold">{gameResult.score.toLocaleString()}</div>
                <div className="text-sm opacity-80">النقاط</div>
              </div>
              
              <div className="bg-green-500 bg-opacity-20 rounded-lg p-4">
                <Crown className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <div className="text-2xl font-bold">{gameResult.coins}</div>
                <div className="text-sm opacity-80">العملات</div>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={playAgain}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3"
              >
                لعب مرة أخرى 🔥
              </Button>
              
              <Button 
                onClick={onBack}
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                العودة إلى القائمة
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Button 
            onClick={onBack}
            variant="outline" 
            className="text-white border-white/20 hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            العودة
          </Button>
          
          <h1 className="text-xl font-bold text-white">🎮 {gameName}</h1>
          <div></div>
        </div>
      </div>

      {/* Battle Royale Game */}
      <BattleRoyaleGame 
        isMultiplayer={false}
        playerCount={1}
        onGameEnd={handleGameEnd}
      />
    </div>
  );
}