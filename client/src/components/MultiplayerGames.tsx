import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Star, ArrowLeft, Sword, Target, Crown, Skull } from "lucide-react";
import GameRoom from "./GameRoom";
import SoloGameInterface from "./SoloGameInterface";

interface MultiplayerGamesProps {
  onBack: () => void;
}

const games = [
  {
    id: 'battle-royale',
    name: 'LaaBoBo Battle Royale',
    emoji: '⚔️',
    description: 'معركة البقاء الأقوى - 100 لاعب في معركة نهائية مثيرة مع أسلحة وقتال حقيقي مثل PUBG',
    minPlayers: 1,
    maxPlayers: 100,
    difficulty: 'محترف',
    duration: '5-8 دقائق',
    reward: '200-1000+ نقطة',
    features: ['قتال بالأسلحة', 'منطقة آمنة متقلصة', 'معدات وذخيرة', 'ترتيب من 100 لاعب', 'نظام دردشة صوتية']
  }
];

export default function MultiplayerGames({ onBack }: MultiplayerGamesProps) {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<'solo' | 'multiplayer' | null>(null);

  if (selectedGame && gameMode) {
    const game = games.find(g => g.id === selectedGame);
    if (!game) return null;

    if (gameMode === 'solo') {
      return (
        <SoloGameInterface 
          gameId={selectedGame}
          gameName={game.name}
          onBack={() => {
            setSelectedGame(null);
            setGameMode(null);
          }}
        />
      );
    }

    return (
      <GameRoom
        gameType={selectedGame}
        gameName={game.name}
        onBack={() => {
          setSelectedGame(null);
          setGameMode(null);
        }}
      />
    );
  }

  if (selectedGame) {
    const game = games.find(g => g.id === selectedGame);
    if (!game) return null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-black p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button 
              onClick={() => setSelectedGame(null)}
              variant="outline" 
              className="text-white border-white/20 hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              العودة
            </Button>
          </div>

          {/* Game Details */}
          <div className="bg-white bg-opacity-5 backdrop-blur-sm rounded-2xl p-8 mb-6">
            <div className="text-center mb-8">
              <div className="text-8xl mb-4">{game.emoji}</div>
              <h1 className="text-4xl font-bold text-white mb-4">{game.name}</h1>
              <p className="text-xl text-gray-300 mb-6">{game.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-red-500 bg-opacity-20 rounded-lg p-4 text-white">
                  <Users className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-bold">{game.minPlayers}-{game.maxPlayers}</div>
                  <div className="text-sm opacity-80">لاعبين</div>
                </div>
                
                <div className="bg-blue-500 bg-opacity-20 rounded-lg p-4 text-white">
                  <Clock className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-bold">{game.duration}</div>
                  <div className="text-sm opacity-80">المدة</div>
                </div>
                
                <div className="bg-purple-500 bg-opacity-20 rounded-lg p-4 text-white">
                  <Star className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-bold">{game.difficulty}</div>
                  <div className="text-sm opacity-80">الصعوبة</div>
                </div>
                
                <div className="bg-yellow-500 bg-opacity-20 rounded-lg p-4 text-white">
                  <Crown className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-bold">{game.reward}</div>
                  <div className="text-sm opacity-80">المكافأة</div>
                </div>
              </div>

              {/* Game Features */}
              <div className="bg-black bg-opacity-30 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center justify-center">
                  <Target className="w-5 h-5 mr-2" />
                  مميزات اللعبة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {game.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-white">
                      <Sword className="w-4 h-4 text-red-400 mr-3" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mode Selection */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white mb-6">اختر نمط اللعب</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Solo Mode */}
                  <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 text-white cursor-pointer hover:scale-105 transition-transform"
                       onClick={() => setGameMode('solo')}>
                    <div className="text-center">
                      <Skull className="w-12 h-12 mx-auto mb-4" />
                      <h4 className="text-2xl font-bold mb-2">لعب منفرد</h4>
                      <p className="text-sm opacity-90 mb-4">
                        تحدى 99 منافس ذكي واثبت مهاراتك في المعركة
                      </p>
                      <Badge className="bg-white bg-opacity-20">
                        1 ضد 99 بوت
                      </Badge>
                    </div>
                  </div>

                  {/* Multiplayer Mode */}
                  <div className="bg-gradient-to-br from-red-600 to-orange-600 rounded-xl p-6 text-white cursor-pointer hover:scale-105 transition-transform"
                       onClick={() => setGameMode('multiplayer')}>
                    <div className="text-center">
                      <Users className="w-12 h-12 mx-auto mb-4" />
                      <h4 className="text-2xl font-bold mb-2">لعب جماعي</h4>
                      <p className="text-sm opacity-90 mb-4">
                        شارك أصدقاءك في معركة ملحمية مع دردشة صوتية
                      </p>
                      <Badge className="bg-white bg-opacity-20">
                        حتى 100 لاعب
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto">
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
          
          <h1 className="text-3xl font-bold text-white">🎮 الألعاب القوية</h1>
          <div></div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 gap-6">
          {games.map((game) => (
            <div 
              key={game.id}
              onClick={() => setSelectedGame(game.id)}
              className="bg-white bg-opacity-5 backdrop-blur-sm rounded-2xl p-8 cursor-pointer hover:bg-opacity-10 transition-all duration-300 border border-white/10 hover:border-white/20"
            >
              <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 md:space-x-reverse">
                {/* Game Icon and Info */}
                <div className="text-center md:text-right flex-1">
                  <div className="text-6xl mb-4">{game.emoji}</div>
                  <h3 className="text-2xl font-bold text-white mb-2">{game.name}</h3>
                  <p className="text-gray-300 mb-4">{game.description}</p>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                    <Badge className="bg-red-500 bg-opacity-20 text-red-300 border-red-400">
                      <Users className="w-3 h-3 mr-1" />
                      {game.minPlayers}-{game.maxPlayers} لاعب
                    </Badge>
                    <Badge className="bg-blue-500 bg-opacity-20 text-blue-300 border-blue-400">
                      <Clock className="w-3 h-3 mr-1" />
                      {game.duration}
                    </Badge>
                    <Badge className="bg-purple-500 bg-opacity-20 text-purple-300 border-purple-400">
                      <Star className="w-3 h-3 mr-1" />
                      {game.difficulty}
                    </Badge>
                  </div>
                  
                  <div className="text-yellow-400 font-bold text-lg">
                    💰 {game.reward}
                  </div>
                </div>

                {/* Play Button */}
                <div className="flex-shrink-0">
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white text-xl px-8 py-4 shadow-lg"
                  >
                    ادخل المعركة! 🔥
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-gray-400">
          <p className="text-sm">
            🎯 لعبة باتل رويال قوية مع قتال حقيقي وأسلحة متنوعة - مثل PUBG تماماً!
          </p>
        </div>
      </div>
    </div>
  );
}