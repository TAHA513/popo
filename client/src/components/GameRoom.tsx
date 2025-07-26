import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Trophy, Users, Play, Star, Crown, Gift } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ReclaimCity from "./games/ReclaimCity";


interface GameRoomProps {
  gameType: string;
  gameName: string;
  gameEmoji: string;
  onClose: () => void;
}

interface Player {
  id: string;
  userId: string;
  username: string;
  petName: string;
  level: number;
  pointsSpent: number;
  rank: string;
  isReady: boolean;
}

export default function GameRoom({ gameType, gameName, gameEmoji, onClose }: GameRoomProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [gameRoom, setGameRoom] = useState<any>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isJoining, setIsJoining] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameResults, setGameResults] = useState<any>(null);
  const [entryFee] = useState(0); // لعب مجاني


  useEffect(() => {
    createOrJoinRoom();
  }, [gameType]);

  const createOrJoinRoom = async () => {
    try {
      setIsJoining(true);
      
      // Create mock room data for demo
      const room = {
        id: `room-${Date.now()}`,
        gameType,
        name: `${gameName} - ${user?.username}`,
        description: `غرفة ${gameName} جديدة`,
        maxPlayers: 4,
        entryFee,
        hostId: user?.id
      };
      
      setGameRoom(room);
      
      // Create mock players including current user
      const mockPlayers: Player[] = [
        {
          id: `player-${user?.id}`,
          userId: user?.id || '',
          username: user?.username || 'اللاعب',
          petName: 'أرنوب الصغير',
          level: 5,
          pointsSpent: 1250,
          rank: 'gold',
          isReady: true
        }
      ];
      
      setPlayers(mockPlayers);
      
      toast({
        title: "✅ تم إنشاء الغرفة",
        description: `مرحباً بك في ${gameName}!`,
      });
      
    } catch (error) {
      console.error('Error creating/joining room:', error);
      toast({
        title: "خطأ",
        description: "فشل في الانضمام للعبة",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const loadPlayers = async (roomId: string) => {
    // Mock players data - no API call needed
    const mockPlayers: Player[] = [
      {
        id: `player-${user?.id}`,
        userId: user?.id || '',
        username: user?.username || 'اللاعب',
        petName: 'أرنوب الصغير',
        level: 5,
        pointsSpent: 1250,
        rank: 'gold',
        isReady: true
      },
      {
        id: 'player-2',
        userId: 'bot-1',
        username: 'أحمد العلي',
        petName: 'قطة صغيرة',
        level: 3,
        pointsSpent: 800,
        rank: 'silver',
        isReady: true
      }
    ];
    
    setPlayers(mockPlayers);
  };

  const startGame = async () => {
    if (!gameRoom) return;
    
    try {
      setIsStarting(true);
      
      // Game start simulation
      
      // Simulate game play
      toast({
        title: "🎮 بدأت اللعبة!",
        description: `${gameName} بدأت الآن - حظاً موفقاً!`,
      });
      
      setGameStarted(true);
      
    } catch (error) {
      console.error('Error starting game:', error);
      toast({
        title: "خطأ",
        description: "فشل في بدء اللعبة",
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handleGameEnd = (score: number, coins: number) => {
    // Simulate game results
    const results = players.map((player, index) => ({
      ...player,
      position: index + 1,
      pointsWon: index === 0 ? coins : index === 1 ? Math.floor(coins * 0.7) : index === 2 ? Math.floor(coins * 0.5) : Math.floor(coins * 0.3),
      score: index === 0 ? score : Math.floor(Math.random() * (score * 0.8)) + 200
    })).sort((a, b) => b.score - a.score);
    
    setGameResults(results);
    setGameStarted(false);
    
    toast({
      title: "🏆 انتهت اللعبة!",
      description: `حصلت على ${score} نقطة و ${coins} عملة!`,
    });
  };

  const finishGame = () => {
    handleGameEnd(500, 25);
  };

  const getRankColor = (rank: string) => {
    switch(rank) {
      case 'diamond': return 'text-blue-400';
      case 'platinum': return 'text-gray-300';
      case 'gold': return 'text-yellow-400';
      case 'silver': return 'text-gray-400';
      default: return 'text-amber-600';
    }
  };

  const getRankIcon = (rank: string) => {
    switch(rank) {
      case 'diamond': return <Crown className="w-4 h-4" />;
      case 'platinum': return <Star className="w-4 h-4" />;
      case 'gold': return <Trophy className="w-4 h-4" />;
      default: return <Trophy className="w-4 h-4" />;
    }
  };

  if (isJoining) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 w-96">
          <div className="text-center">
            <div className="text-4xl mb-4">{gameEmoji}</div>
            <h2 className="text-xl font-bold mb-4">جاري الانضمام للعبة...</h2>
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (gameResults) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-96">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">🏆</div>
            <h2 className="text-xl font-bold text-purple-600">نتائج اللعبة</h2>
          </div>
          
          <div className="space-y-3">
            {gameResults.map((player: any, index: number) => (
              <div key={player.id} className={`flex items-center justify-between p-3 rounded-lg ${
                index === 0 ? 'bg-yellow-100 border-2 border-yellow-400' :
                index === 1 ? 'bg-gray-100 border-2 border-gray-400' :
                index === 2 ? 'bg-amber-100 border-2 border-amber-400' :
                'bg-purple-50 border border-purple-200'
              }`}>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="text-2xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                  </div>
                  <div>
                    <p className="font-bold">{player.username}</p>
                    <p className="text-sm text-gray-600">النقاط: {player.score}</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">+{player.pointsWon}</div>
                  <div className="text-xs text-gray-500">نقطة</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 space-y-2">
            <Button onClick={onClose} className="w-full">
              العودة للحديقة
            </Button>
            <Button 
              onClick={() => {
                setGameResults(null);
                createOrJoinRoom();
              }} 
              variant="outline" 
              className="w-full"
            >
              لعب مرة أخرى
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (gameStarted) {
    // استعادة المدينة - اللعبة الاحترافية
    if (gameType === 'reclaim-city') {
      return (
        <div className="fixed inset-0 bg-black z-50">
          <ReclaimCity 
            isMultiplayer={players.length > 1}
            playerCount={players.length}
            onGameEnd={handleGameEnd}
          />
        </div>
      );
    }

    // الألعاب الأخرى - قيد التطوير
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 w-96">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">{gameEmoji}</div>
            <h2 className="text-2xl font-bold mb-4 text-purple-600">{gameName}</h2>
            <p className="text-gray-600 mb-6">🚧 قيد التطوير</p>
            <p className="text-sm text-orange-600 mb-6">ستتم إضافة الألعاب التفاعلية قريباً!</p>
            <Button 
              onClick={() => finishGame()}
              className="mb-4 w-full"
            >
              إنهاء التجربة
            </Button>
            <Button
              onClick={() => setGameStarted(false)}
              variant="outline"
              className="w-full"
            >
              العودة للغرفة
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-96 max-h-[80vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">{gameEmoji}</div>
          <h2 className="text-xl font-bold text-purple-600">{gameName}</h2>
          <p className="text-sm text-green-600 font-medium">✨ لعب مجاني بالكامل!</p>
        </div>

        <div className="mb-6">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center">
            <Users className="w-4 h-4 mr-2" />
            اللاعبون ({players.length}/4)
          </h3>
          
          <div className="space-y-2">
            {players.map((player) => (
              <div key={player.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center">
                    <span className="font-bold text-purple-600">
                      {player.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{player.username}</p>
                    <p className="text-sm text-gray-600">{player.petName} - مستوى {player.level}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className={`flex items-center space-x-1 space-x-reverse ${getRankColor(player.rank)}`}>
                    {getRankIcon(player.rank)}
                    <span className="text-xs font-medium">{player.rank}</span>
                  </div>
                  <div className="text-xs text-gray-500">{player.pointsSpent}💎</div>
                </div>
              </div>
            ))}
            
            {Array.from({ length: 4 - players.length }).map((_, index) => (
              <div key={`empty-${index}`} className="flex items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-lg">
                <span className="text-gray-400">في انتظار لاعب...</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={startGame}
            disabled={players.length < 1 || isStarting}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isStarting ? (
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>جاري البدء...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 space-x-reverse">
                <Play className="w-4 h-4" />
                <span>بدء اللعبة</span>
              </div>
            )}
          </Button>
          
          <Button onClick={onClose} variant="outline" className="w-full">
            الخروج من الغرفة
          </Button>
        </div>
      </div>
    </div>
  );
}