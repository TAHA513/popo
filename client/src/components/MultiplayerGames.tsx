import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Gamepad2, Trophy, Users, Play } from "lucide-react";

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
    id: 'pet-race',
    name: 'سباق الحيوانات',
    emoji: '🏃‍♂️',
    description: 'سباق ممتع بين الحيوانات الأليفة',
    minPlayers: 2,
    maxPlayers: 4,
    duration: '3-5 دقائق',
    difficulty: 'easy'
  },
  {
    id: 'treasure-hunt',
    name: 'البحث عن الكنز',
    emoji: '🗺️',
    description: 'ابحث مع أصدقائك عن الكنوز المخفية',
    minPlayers: 2,
    maxPlayers: 6,
    duration: '10-15 دقيقة',
    difficulty: 'medium'
  },
  {
    id: 'garden-battle',
    name: 'معركة الحدائق',
    emoji: '⚔️',
    description: 'تحدى أصدقائك في معركة استراتيجية',
    minPlayers: 2,
    maxPlayers: 4,
    duration: '5-10 دقائق',
    difficulty: 'hard'
  },
  {
    id: 'feeding-contest',
    name: 'مسابقة الإطعام',
    emoji: '🍎',
    description: 'من يطعم حيوانه الأليف أسرع؟',
    minPlayers: 2,
    maxPlayers: 8,
    duration: '2-3 دقائق',
    difficulty: 'easy'
  },
  {
    id: 'quiz-challenge',
    name: 'تحدي المعرفة',
    emoji: '🧠',
    description: 'أسئلة ممتعة حول الحيوانات والطبيعة',
    minPlayers: 2,
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

  const handleStartGame = (game: Game) => {
    setSelectedGame(game);
    setIsCreatingRoom(true);
    
    // Simulate game room creation
    setTimeout(() => {
      alert(`🎮 تم إنشاء غرفة ${game.name}! ادع أصدقائك للانضمام`);
      setIsCreatingRoom(false);
      setSelectedGame(null);
    }, 2000);
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
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-purple-600 mb-2">🎮 الألعاب الجماعية</h2>
        <p className="text-gray-600">العب مع أصدقائك وحيواناتهم الأليفة</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {multiplayerGames.map((game) => (
          <div key={game.id} className="bg-white rounded-xl p-4 border-2 border-purple-200 hover:border-purple-400 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="text-3xl">{game.emoji}</div>
                <div>
                  <h3 className="font-bold text-gray-800">{game.name}</h3>
                  <p className="text-sm text-gray-600">{game.description}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(game.difficulty)}`}>
                {getDifficultyText(game.difficulty)}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{game.minPlayers}-{game.maxPlayers} لاعبين</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                <Trophy className="w-4 h-4" />
                <span>المدة: {game.duration}</span>
              </div>
            </div>

            <Button
              onClick={() => handleStartGame(game)}
              disabled={isCreatingRoom && selectedGame?.id === game.id}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              {isCreatingRoom && selectedGame?.id === game.id ? (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>إنشاء الغرفة...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Play className="w-4 h-4" />
                  <span>بدء اللعبة</span>
                </div>
              )}
            </Button>
          </div>
        ))}
      </div>

      {/* Online Friends Status */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
        <div className="flex items-center space-x-2 space-x-reverse mb-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h3 className="font-bold text-gray-800">الأصدقاء المتاحون للعب</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-2 space-x-reverse bg-white rounded-lg p-2">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-bold text-sm">أ</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">أحمد</p>
              <p className="text-xs text-green-600">متاح الآن</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 space-x-reverse bg-white rounded-lg p-2">
            <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
              <span className="text-pink-600 font-bold text-sm">ف</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">فاطمة</p>
              <p className="text-xs text-green-600">متاحة الآن</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}