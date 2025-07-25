import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Trophy, Zap, Flag, RotateCcw } from "lucide-react";

interface RacingGameProps {
  isMultiplayer: boolean;
  playerCount: number;
  onGameEnd: (score: number, coins: number) => void;
}

interface Player {
  id: number;
  name: string;
  position: number;
  speed: number;
  color: string;
  emoji: string;
}

export default function RacingGame({ isMultiplayer, playerCount, onGameEnd }: RacingGameProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameActive, setGameActive] = useState(false);
  const [raceFinished, setRaceFinished] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [playerSpeed, setPlayerSpeed] = useState(0);
  const [boostCount, setBoostCount] = useState(3);
  const [finalTime, setFinalTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>();

  const trackLength = 100;

  useEffect(() => {
    initializeGame();
    startCountdown();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const initializeGame = () => {
    const gamePlayerCount = isMultiplayer ? playerCount : 4;
    const playerList: Player[] = [
      { id: 1, name: "أنت", position: 0, speed: 0, color: "bg-blue-500", emoji: "🏎️" },
      { id: 2, name: "أحمد", position: 0, speed: 0, color: "bg-red-500", emoji: "🚗" },
      { id: 3, name: "فاطمة", position: 0, speed: 0, color: "bg-green-500", emoji: "🚙" },
      { id: 4, name: "محمد", position: 0, speed: 0, color: "bg-purple-500", emoji: "🚕" },
    ].slice(0, gamePlayerCount);

    setPlayers(playerList);
  };

  const startCountdown = () => {
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          startRace();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startRace = () => {
    setGameActive(true);
    startTimeRef.current = Date.now();
    
    intervalRef.current = setInterval(() => {
      setPlayers(prev => prev.map(player => {
        if (player.id === 1) {
          // Player controlled
          return {
            ...player,
            position: Math.min(player.position + playerSpeed, trackLength),
            speed: playerSpeed
          };
        } else {
          // AI players
          const aiSpeed = Math.random() * 2 + 0.5;
          return {
            ...player,
            position: Math.min(player.position + aiSpeed, trackLength),
            speed: aiSpeed
          };
        }
      }));
    }, 100);
  };

  useEffect(() => {
    const winner = players.find(player => player.position >= trackLength);
    if (winner && !raceFinished) {
      setRaceFinished(true);
      setGameActive(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      
      const raceTime = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
      setFinalTime(raceTime);
      
      const isPlayerWinner = winner.id === 1;
      const score = isPlayerWinner ? 500 + Math.max(0, 10000 - raceTime) : Math.max(100, 300 - Math.floor(raceTime / 100));
      const coins = isPlayerWinner ? 50 : 10;
      
      setTimeout(() => onGameEnd(score, coins), 2000);
    }
  }, [players, raceFinished, onGameEnd]);

  const accelerate = () => {
    if (gameActive && playerSpeed < 3) {
      setPlayerSpeed(prev => Math.min(prev + 0.5, 3));
    }
  };

  const brake = () => {
    if (gameActive && playerSpeed > 0) {
      setPlayerSpeed(prev => Math.max(prev - 0.3, 0));
    }
  };

  const boost = () => {
    if (gameActive && boostCount > 0) {
      setBoostCount(prev => prev - 1);
      setPlayerSpeed(prev => Math.min(prev + 2, 5));
      
      // Boost effect wears off after 2 seconds
      setTimeout(() => {
        setPlayerSpeed(prev => Math.max(prev - 1.5, 0.5));
      }, 2000);
    }
  };

  const resetGame = () => {
    setRaceFinished(false);
    setGameActive(false);
    setCountdown(3);
    setPlayerSpeed(0);
    setBoostCount(3);
    setFinalTime(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
    initializeGame();
    startCountdown();
  };

  const winner = players.find(player => player.position >= trackLength);

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Game Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold">🏁 سباق السرعة</h2>
          {isMultiplayer && (
            <div className="text-sm bg-white bg-opacity-20 px-2 py-1 rounded">
              {playerCount} لاعبين
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <Zap className="w-4 h-4 mx-auto mb-1" />
            <div className="font-bold">{playerSpeed.toFixed(1)} km/h</div>
          </div>
          <div className="text-center">
            <Trophy className="w-4 h-4 mx-auto mb-1" />
            <div className="font-bold">{boostCount} تسارع</div>
          </div>
          <div className="text-center">
            <Flag className="w-4 h-4 mx-auto mb-1" />
            <div className="font-bold">{Math.round((players[0]?.position || 0))}%</div>
          </div>
        </div>
      </div>

      {/* Countdown */}
      {countdown > 0 && !gameActive && (
        <div className="text-center mb-4">
          <div className="text-6xl font-bold text-red-500 animate-pulse">
            {countdown}
          </div>
          <div className="text-xl text-gray-600 mt-2">استعد للسباق!</div>
        </div>
      )}

      {/* Race Track */}
      <div className="bg-gray-100 rounded-lg p-4 mb-4 min-h-64">
        <div className="relative">
          {/* Track */}
          <div className="bg-gray-800 rounded-lg p-2 mb-2">
            <div className="bg-white h-2 rounded-full relative">
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-green-500 rounded-full"></div>
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-red-500 rounded-full"></div>
            </div>
          </div>

          {/* Players */}
          <div className="space-y-3">
            {players.map((player, index) => (
              <div key={player.id} className="relative">
                <div className="flex items-center mb-1">
                  <span className="text-sm font-semibold w-16">{player.name}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-8 relative mx-2">
                    <div
                      className={`absolute top-0 bottom-0 rounded-full transition-all duration-200 ${player.color}`}
                      style={{ width: `${(player.position / trackLength) * 100}%` }}
                    >
                      <div 
                        className="absolute right-0 top-0 bottom-0 flex items-center justify-center text-lg"
                        style={{ 
                          transform: `translateX(50%)`,
                          right: `${(player.position / trackLength) * 100}%`
                        }}
                      >
                        {player.emoji}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 w-12">{Math.round(player.position)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Game Controls */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Button
          onClick={accelerate}
          disabled={!gameActive}
          className="bg-green-500 hover:bg-green-600 h-12"
        >
          <Zap className="w-4 h-4 ml-2" />
          تسارع
        </Button>
        
        <Button
          onClick={brake}
          disabled={!gameActive}
          variant="outline"
          className="h-12"
        >
          🛑 فرامل
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <Button
          onClick={boost}
          disabled={!gameActive || boostCount === 0}
          className="bg-yellow-500 hover:bg-yellow-600 h-12"
        >
          ⚡ دفعة قوية ({boostCount})
        </Button>
        
        <Button
          onClick={resetGame}
          variant="outline"
          className="h-12"
        >
          <RotateCcw className="w-4 h-4 ml-2" />
          إعادة تشغيل
        </Button>
      </div>

      {/* Race Results */}
      {raceFinished && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-700 mb-2">
            🏆 انتهى السباق!
          </div>
          <div className="text-lg text-yellow-600 mb-2">
            الفائز: {winner?.name} {winner?.emoji}
          </div>
          <div className="text-sm text-gray-600">
            زمن السباق: {(finalTime / 1000).toFixed(1)} ثانية
          </div>
        </div>
      )}
    </div>
  );
}