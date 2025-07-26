import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Gamepad2, Trophy, Users, Play, UserPlus, Shuffle, Heart } from "lucide-react";
import GameRoom from "./GameRoom";


interface Game {
  id: string;
  name: string;
  emoji: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  duration: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const multiplayerGames: Game[] = [
  {
    id: 'reclaim-city',
    name: 'استعادة المدينة',
    emoji: '🏙️',
    description: 'لعبة إستراتيجية تعاونية ضد الذكاء الاصطناعي',
    minPlayers: 1,
    maxPlayers: 8,
    duration: '5-10 دقائق',
    difficulty: 'hard'
  },
  {
    id: 'solo-training',
    name: 'تدريب منفرد',
    emoji: '🎯',
    description: 'تدرب مع حيوانك الأليف بمفردك',
    minPlayers: 1,
    maxPlayers: 1,
    duration: '2-5 دقائق',
    difficulty: 'easy'
  },
  {
    id: 'pet-race',
    name: 'سباق الحيوانات',
    emoji: '🏃‍♂️',
    description: 'سباق ممتع بين الحيوانات الأليفة',
    minPlayers: 1,
    maxPlayers: 4,
    duration: '3-5 دقائق',
    difficulty: 'easy'
  },
  {
    id: 'treasure-hunt',
    name: 'البحث عن الكنز',
    emoji: '🗺️',
    description: 'ابحث عن الكنوز المخفية',
    minPlayers: 1,
    maxPlayers: 6,
    duration: '10-15 دقيقة',
    difficulty: 'medium'
  },
  {
    id: 'garden-battle',
    name: 'معركة الحدائق',
    emoji: '⚔️',
    description: 'معركة استراتيجية ممتعة',
    minPlayers: 1,
    maxPlayers: 4,
    duration: '5-10 دقائق',
    difficulty: 'hard'
  },
  {
    id: 'feeding-contest',
    name: 'مسابقة الإطعام',
    emoji: '🍎',
    description: 'أطعم حيوانك الأليف بسرعة',
    minPlayers: 1,
    maxPlayers: 8,
    duration: '2-3 دقائق',
    difficulty: 'easy'
  },
  {
    id: 'quiz-challenge',
    name: 'تحدي المعرفة',
    emoji: '🧠',
    description: 'أسئلة ممتعة حول الحيوانات والطبيعة',
    minPlayers: 1,
    maxPlayers: 10,
    duration: '5-8 دقائق',
    difficulty: 'medium'
  },
  {
    id: 'dance-party',
    name: 'حفلة الرقص',
    emoji: '💃',
    description: 'ارقص مع حيوانك الأليف وأصدقائك',
    minPlayers: 1,
    maxPlayers: 12,
    duration: '3-5 دقائق',
    difficulty: 'easy'
  }
];

export default function MultiplayerGames() {
  const { user } = useAuth();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [showGameRoom, setShowGameRoom] = useState(false);
  const [gameMode, setGameMode] = useState<'solo' | 'random' | 'friends' | null>(null);
  const [showModeSelection, setShowModeSelection] = useState(false);


  const handleStartGame = (game: Game) => {
    setSelectedGame(game);
    setShowModeSelection(true);
  };

  const handleModeSelection = (mode: 'solo' | 'random' | 'friends') => {
    setGameMode(mode);
    setShowModeSelection(false);
    
    // Enable "Reclaim City" game, disable others
    if (selectedGame?.id === 'reclaim-city') {
      setShowGameRoom(true);
    } else {
      // Other games still in development
      alert(`🚧 لعبة "${selectedGame?.name}" قيد التطوير\n\n✅ متاح الآن: "استعادة المدينة"\n⏳ ألعاب أخرى قريباً!`);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch(difficulty) {
      case 'easy': return 'سهل';
      case 'medium': return 'متوسط';
      case 'hard': return 'صعب';
      default: return 'غير محدد';
    }
  };

  return (
    <>

      {/* Game Room */}
      {showGameRoom && selectedGame && (
        <GameRoom
          gameType={selectedGame.id}
          gameName={selectedGame.name}
          gameEmoji={selectedGame.emoji}
          onClose={() => {
            setShowGameRoom(false);
            setSelectedGame(null);
            setGameMode(null);
          }}
        />
      )}

      {/* Game Mode Selection Modal */}
      {showModeSelection && selectedGame && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">{selectedGame.emoji}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{selectedGame.name}</h3>
              <p className="text-gray-600">اختر طريقة اللعب</p>
            </div>

            <div className="space-y-3">
              {/* Solo Mode */}
              <Button
                onClick={() => handleModeSelection('solo')}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white p-4 h-auto"
              >
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Gamepad2 className="w-6 h-6" />
                  </div>
                  <div className="text-right flex-1">
                    <h4 className="font-bold">لعب منفرد ⚡</h4>
                    <p className="text-sm opacity-90">ابدأ فوراً بدون انتظار!</p>
                  </div>
                </div>
              </Button>

              {/* Random Match */}
              <Button
                onClick={() => handleModeSelection('random')}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white p-4 h-auto"
              >
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Shuffle className="w-6 h-6" />
                  </div>
                  <div className="text-right flex-1">
                    <h4 className="font-bold">مباراة عشوائية</h4>
                    <p className="text-sm opacity-90">العب مع لاعبين عشوائيين</p>
                  </div>
                </div>
              </Button>

              {/* Friends Mode */}
              <Button
                onClick={() => handleModeSelection('friends')}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white p-4 h-auto"
              >
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6" />
                  </div>
                  <div className="text-right flex-1">
                    <h4 className="font-bold">لعب مع الأصدقاء</h4>
                    <p className="text-sm opacity-90">ادع أصدقائك للعب معك</p>
                  </div>
                </div>
              </Button>
            </div>

            <Button
              onClick={() => {
                setShowModeSelection(false);
                setSelectedGame(null);
              }}
              variant="outline"
              className="w-full mt-4"
            >
              إلغاء
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="text-center bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
          <h2 className="text-3xl font-bold text-purple-600 mb-2">🎮 مركز الألعاب الجماعية</h2>
          <p className="text-gray-600">العب بمفردك أو مع الأصدقاء أو لاعبين عشوائيين</p>
          <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full inline-block mt-3 font-medium">
            ✨ جميع الألعاب مجانية بالكامل!
          </div>
          
          {/* Game Mode Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-white rounded-xl p-3 border border-green-200">
              <div className="text-green-600 font-bold text-lg">128</div>
              <div className="text-xs text-gray-600">ألعاب منفردة</div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-blue-200">
              <div className="text-blue-600 font-bold text-lg">64</div>
              <div className="text-xs text-gray-600">مباريات عشوائية</div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-purple-200">
              <div className="text-purple-600 font-bold text-lg">92</div>
              <div className="text-xs text-gray-600">ألعاب الأصدقاء</div>
            </div>
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {multiplayerGames.map((game) => (
            <div key={game.id} className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-purple-400 hover:shadow-lg transition-all duration-300 relative">
              {/* Free Badge */}
              <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                مجاني
              </div>
              
              <div className="text-center mb-4">
                <div className="text-5xl mb-3">{game.emoji}</div>
                <h3 className="font-bold text-lg text-gray-800 mb-2">{game.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{game.description}</p>
                
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getDifficultyColor(game.difficulty)}`}>
                  {getDifficultyText(game.difficulty)}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-center space-x-2 space-x-reverse text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{game.minPlayers}-{game.maxPlayers} لاعبين</span>
                </div>
                <div className="flex items-center justify-center space-x-2 space-x-reverse text-sm text-gray-600">
                  <Trophy className="w-4 h-4" />
                  <span>{game.duration}</span>
                </div>
              </div>

              {/* Game Modes Preview */}
              <div className="grid grid-cols-3 gap-1 mb-4">
                <div className="bg-green-100 rounded-lg p-2 text-center">
                  <Gamepad2 className="w-4 h-4 text-green-600 mx-auto mb-1" />
                  <div className="text-xs text-green-700">منفرد</div>
                </div>
                <div className="bg-blue-100 rounded-lg p-2 text-center">
                  <Shuffle className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                  <div className="text-xs text-blue-700">عشوائي</div>
                </div>
                <div className="bg-purple-100 rounded-lg p-2 text-center">
                  <Heart className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                  <div className="text-xs text-purple-700">أصدقاء</div>
                </div>
              </div>

              <div className="space-y-2">
                {/* Play Button - Enable for Reclaim City only */}
                <Button
                  onClick={() => handleStartGame(game)}
                  disabled={game.id !== 'reclaim-city'}
                  className={`w-full rounded-xl py-3 ${game.id === 'reclaim-city' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Play className="w-4 h-4" />
                    <span>
                      {game.id === 'reclaim-city' ? '🎮 العب الآن!' : 'قريباً ⏳'}
                    </span>
                  </div>
                </Button>
                
                {game.id === 'reclaim-city' && (
                  <div className="bg-red-100 border border-red-300 rounded-lg p-2 text-center">
                    <p className="text-red-700 text-xs font-bold">✨ متاح الآن!</p>
                    <p className="text-red-600 text-xs">استعد لمحاربة الذكاء الاصطناعي!</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Online Friends */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center space-x-3 space-x-reverse mb-4">
            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="font-bold text-lg text-gray-800">الأصدقاء المتاحون للعب</h3>
            <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-bold">5 متاح</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { name: 'أحمد العلي', initial: 'أ', color: 'purple', status: 'يلعب سباق الحيوانات' },
              { name: 'فاطمة محمد', initial: 'ف', color: 'pink', status: 'متاحة للعب' },
              { name: 'محمد سعد', initial: 'م', color: 'blue', status: 'في البحث عن الكنز' },
              { name: 'عائشة أحمد', initial: 'ع', color: 'green', status: 'متاحة للعب' },
              { name: 'علي حسن', initial: 'ع', color: 'yellow', status: 'في تحدي المعرفة' }
            ].map((friend, index) => (
              <div key={index} className="flex items-center space-x-3 space-x-reverse bg-white rounded-xl p-3 border border-gray-200 hover:border-purple-300 transition-colors">
                <div className={`w-10 h-10 bg-${friend.color}-100 rounded-full flex items-center justify-center`}>
                  <span className={`text-${friend.color}-600 font-bold text-sm`}>{friend.initial}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{friend.name}</p>
                  <p className={`text-xs ${friend.status.includes('متاح') ? 'text-green-600' : 'text-orange-600'}`}>
                    {friend.status}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  disabled
                >
                  قريباً
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}