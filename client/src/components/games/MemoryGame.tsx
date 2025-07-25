import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trophy, Clock, Star, RotateCcw } from "lucide-react";

interface MemoryGameProps {
  isMultiplayer: boolean;
  playerCount: number;
  onGameEnd: (score: number, coins: number) => void;
}

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function MemoryGame({ isMultiplayer, playerCount, onGameEnd }: MemoryGameProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameActive, setGameActive] = useState(true);
  const [matches, setMatches] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const cardEmojis = ['🐰', '🌸', '⭐', '💎', '🎮', '🏆', '❤️', '🎯'];

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (gameActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      endGame();
    }
  }, [timeLeft, gameActive]);

  useEffect(() => {
    if (flippedCards.length === 2) {
      setAttempts(attempts + 1);
      const [first, second] = flippedCards;
      if (cards[first]?.emoji === cards[second]?.emoji) {
        // Match found
        setTimeout(() => {
          setCards(prev => prev.map((card, index) => 
            index === first || index === second 
              ? { ...card, isMatched: true }
              : card
          ));
          setMatches(matches + 1);
          setScore(score + 100);
          setFlippedCards([]);
          
          // Check if game is complete
          if (matches + 1 === cardEmojis.length) {
            setTimeout(() => endGame(), 500);
          }
        }, 1000);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map((card, index) => 
            index === first || index === second 
              ? { ...card, isFlipped: false }
              : card
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  }, [flippedCards, cards, score, matches]);

  const initializeGame = () => {
    const shuffledEmojis = [...cardEmojis, ...cardEmojis].sort(() => Math.random() - 0.5);
    const newCards = shuffledEmojis.map((emoji, index) => ({
      id: index,
      emoji,
      isFlipped: false,
      isMatched: false
    }));
    setCards(newCards);
  };

  const handleCardClick = (index: number) => {
    if (!gameActive || flippedCards.length === 2 || cards[index].isFlipped || cards[index].isMatched) {
      return;
    }

    setCards(prev => prev.map((card, i) => 
      i === index ? { ...card, isFlipped: true } : card
    ));
    setFlippedCards([...flippedCards, index]);
  };

  const endGame = () => {
    setGameActive(false);
    const finalScore = score + (timeLeft * 10) + (matches * 50);
    const coins = Math.floor(finalScore / 20) + 10;
    setTimeout(() => onGameEnd(finalScore, coins), 1000);
  };

  const resetGame = () => {
    setCards([]);
    setFlippedCards([]);
    setScore(0);
    setTimeLeft(60);
    setGameActive(true);
    setMatches(0);
    setAttempts(0);
    initializeGame();
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      {/* Game Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold">🧠 لعبة الذاكرة</h2>
          {isMultiplayer && (
            <div className="text-sm bg-white bg-opacity-20 px-2 py-1 rounded">
              {playerCount} لاعبين
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <Clock className="w-4 h-4 mx-auto mb-1" />
            <div className="font-bold">{timeLeft}s</div>
          </div>
          <div className="text-center">
            <Star className="w-4 h-4 mx-auto mb-1" />
            <div className="font-bold">{score}</div>
          </div>
          <div className="text-center">
            <Trophy className="w-4 h-4 mx-auto mb-1" />
            <div className="font-bold">{matches}/{cardEmojis.length}</div>
          </div>
          <div className="text-center">
            <div className="w-4 h-4 mx-auto mb-1 text-center">🎯</div>
            <div className="font-bold">{attempts}</div>
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {cards.map((card, index) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(index)}
            className={`
              aspect-square rounded-lg flex items-center justify-center text-2xl cursor-pointer
              transform transition-all duration-300 hover:scale-105
              ${card.isFlipped || card.isMatched 
                ? 'bg-white border-2 border-purple-300 shadow-lg' 
                : 'bg-gradient-to-br from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500'
              }
              ${card.isMatched ? 'ring-2 ring-green-400 bg-green-50' : ''}
              ${!gameActive ? 'cursor-not-allowed opacity-50' : ''}
            `}
          >
            {card.isFlipped || card.isMatched ? (
              <span className="animate-bounce">{card.emoji}</span>
            ) : (
              <div className="w-6 h-6 bg-white bg-opacity-30 rounded-full"></div>
            )}
          </div>
        ))}
      </div>

      {/* Game Controls */}
      <div className="flex space-x-2 space-x-reverse">
        <Button
          onClick={resetGame}
          variant="outline"
          className="flex-1"
        >
          <RotateCcw className="w-4 h-4 ml-2" />
          إعادة تشغيل
        </Button>
        
        {!gameActive && (
          <div className="flex-1 bg-green-100 border border-green-300 rounded-lg p-3 text-center">
            <div className="text-green-700 font-bold">
              انتهت اللعبة! 🎉
            </div>
            <div className="text-sm text-green-600">
              النتيجة النهائية: {score}
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(matches / cardEmojis.length) * 100}%` }}
          />
        </div>
        <div className="text-center text-xs text-gray-600 mt-1">
          التقدم: {matches}/{cardEmojis.length} أزواج
        </div>
      </div>
    </div>
  );
}