import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Gift, ArrowLeft } from "lucide-react";

interface SoloGameInterfaceProps {
  gameId: string;
  gameName: string;
  gameEmoji: string;
  onClose: () => void;
}

export default function SoloGameInterface({ gameId, gameName, gameEmoji, onClose }: SoloGameInterfaceProps) {
  const [gamePhase, setGamePhase] = useState<'starting' | 'playing' | 'finished'>('starting');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [clicks, setClicks] = useState(0);
  const [targetClicks] = useState(Math.floor(Math.random() * 15) + 10);
  const [finalScore, setFinalScore] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState(0);

  useEffect(() => {
    if (gamePhase === 'starting') {
      const timer = setTimeout(() => {
        setGamePhase('playing');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gamePhase]);

  useEffect(() => {
    if (gamePhase === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gamePhase === 'playing' && timeLeft === 0) {
      finishGame();
    }
  }, [timeLeft, gamePhase]);

  const handleClick = () => {
    if (gamePhase === 'playing') {
      setClicks(clicks + 1);
      setScore(score + 10);
      
      if (clicks + 1 >= targetClicks) {
        finishGame();
      }
    }
  };

  const finishGame = () => {
    const finalPoints = score + (clicks * 5);
    const coins = Math.floor(finalPoints / 10) + Math.floor(Math.random() * 10) + 5;
    setFinalScore(finalPoints);
    setEarnedCoins(coins);
    setGamePhase('finished');
  };

  if (gamePhase === 'starting') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 w-96 text-center">
          <div className="text-6xl mb-4 animate-bounce">{gameEmoji}</div>
          <h2 className="text-2xl font-bold text-purple-600 mb-4">{gameName}</h2>
          <p className="text-gray-600 mb-4">جاري تحضير اللعبة...</p>
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (gamePhase === 'finished') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 w-96 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold text-green-600 mb-4">تهانينا!</h2>
          
          <div className="space-y-4 mb-6">
            <div className="bg-yellow-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">النقاط النهائية:</span>
                <span className="text-2xl font-bold text-yellow-600">{finalScore}</span>
              </div>
            </div>
            
            <div className="bg-green-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">العملات المكتسبة:</span>
                <span className="text-2xl font-bold text-green-600">{earnedCoins} 💰</span>
              </div>
            </div>
            
            <div className="bg-blue-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">النقرات:</span>
                <span className="text-xl font-bold text-blue-600">{clicks}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => {
                setGamePhase('starting');
                setScore(0);
                setClicks(0);
                setTimeLeft(10);
              }}
              className="w-full bg-green-500 hover:bg-green-600"
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <Star className="w-4 h-4" />
                <span>العب مرة أخرى</span>
              </div>
            </Button>
            
            <Button 
              onClick={onClose}
              variant="outline"
              className="w-full"
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <ArrowLeft className="w-4 h-4" />
                <span>العودة للألعاب</span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-96 text-center relative">
        {/* Header */}
        <div className="mb-6">
          <div className="text-4xl mb-2">{gameEmoji}</div>
          <h2 className="text-xl font-bold text-purple-600">{gameName}</h2>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-purple-100 rounded-lg p-3">
            <div className="text-2xl font-bold text-purple-600">{score}</div>
            <div className="text-xs text-gray-600">النقاط</div>
          </div>
          
          <div className="bg-red-100 rounded-lg p-3">
            <div className="text-2xl font-bold text-red-600">{timeLeft}</div>
            <div className="text-xs text-gray-600">ثانية</div>
          </div>
          
          <div className="bg-green-100 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-600">{clicks}</div>
            <div className="text-xs text-gray-600">نقرات</div>
          </div>
        </div>

        {/* Game Instructions */}
        <div className="mb-6">
          <p className="text-gray-600 text-sm mb-2">
            اضغط على الزر أدناه أسرع ما يمكن!
          </p>
          <p className="text-purple-600 text-sm font-bold">
            الهدف: {targetClicks} نقرة
          </p>
        </div>

        {/* Main Game Button */}
        <Button
          onClick={handleClick}
          className="w-full h-20 text-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-150"
        >
          <div className="flex items-center justify-center space-x-3 space-x-reverse">
            <div className="text-3xl animate-pulse">{gameEmoji}</div>
            <span>اضغط هنا!</span>
          </div>
        </Button>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((clicks / targetClicks) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            التقدم: {clicks}/{targetClicks}
          </p>
        </div>

        {/* Exit Button */}
        <Button
          onClick={onClose}
          variant="outline"
          size="sm"
          className="absolute top-4 right-4"
        >
          ×
        </Button>
      </div>
    </div>
  );
}