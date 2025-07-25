import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crosshair, Shield, Heart, Zap, Target, Users, Skull } from "lucide-react";

interface BattleRoyaleGameProps {
  isMultiplayer: boolean;
  playerCount: number;
  onGameEnd: (score: number, coins: number, kills: number, rank: number) => void;
}

interface Player {
  id: number;
  name: string;
  x: number;
  y: number;
  health: number;
  armor: number;
  weapon: string;
  kills: number;
  alive: boolean;
  isPlayer: boolean;
}

interface Weapon {
  name: string;
  damage: number;
  range: number;
  fireRate: number;
  emoji: string;
}

const weapons: Weapon[] = [
  { name: 'AK-47', damage: 40, range: 150, fireRate: 600, emoji: '🔫' },
  { name: 'M4A1', damage: 35, range: 180, fireRate: 750, emoji: '🎯' },
  { name: 'AWP', damage: 100, range: 300, fireRate: 150, emoji: '🎯' },
  { name: 'Shotgun', damage: 80, range: 50, fireRate: 300, emoji: '💥' },
  { name: 'Pistol', damage: 25, range: 80, fireRate: 400, emoji: '🔫' }
];

export default function BattleRoyaleGame({ isMultiplayer, playerCount, onGameEnd }: BattleRoyaleGameProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [gamePhase, setGamePhase] = useState<'lobby' | 'dropping' | 'playing' | 'finished'>('lobby');
  const [playersAlive, setPlayersAlive] = useState(100);
  const [circleRadius, setCircleRadius] = useState(500);
  const [circleCenter, setCircleCenter] = useState({ x: 250, y: 250 });
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon>(weapons[4]); // Start with pistol
  const [ammo, setAmmo] = useState(30);
  const [kills, setKills] = useState(0);
  const [rank, setRank] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();

  // Initialize game
  useEffect(() => {
    initializeGame();
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, []);

  // Game timer
  useEffect(() => {
    if (gamePhase === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
        // Shrink circle every 30 seconds
        if (timeLeft % 30 === 0 && circleRadius > 50) {
          setCircleRadius(prev => Math.max(prev - 50, 50));
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gamePhase === 'playing') {
      endGame();
    }
  }, [timeLeft, gamePhase, circleRadius]);

  // Start game loop
  useEffect(() => {
    if (gamePhase === 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gamePhase, players]);

  const initializeGame = () => {
    const totalPlayers = isMultiplayer ? Math.min(playerCount * 25, 100) : 100;
    const newPlayers: Player[] = [];
    
    // Create player
    const player: Player = {
      id: 1,
      name: "أنت",
      x: Math.random() * 400 + 50,
      y: Math.random() * 400 + 50,
      health: 100,
      armor: 0,
      weapon: "Pistol",
      kills: 0,
      alive: true,
      isPlayer: true
    };
    newPlayers.push(player);
    setCurrentPlayer(player);

    // Create AI enemies
    for (let i = 2; i <= totalPlayers; i++) {
      newPlayers.push({
        id: i,
        name: `العدو ${i}`,
        x: Math.random() * 400 + 50,
        y: Math.random() * 400 + 50,
        health: 100,
        armor: Math.random() > 0.7 ? 50 : 0,
        weapon: weapons[Math.floor(Math.random() * weapons.length)].name,
        kills: 0,
        alive: true,
        isPlayer: false
      });
    }

    setPlayers(newPlayers);
    setPlayersAlive(totalPlayers);
  };

  const startGame = () => {
    setGamePhase('dropping');
    setGameStarted(true);
    
    setTimeout(() => {
      setGamePhase('playing');
    }, 3000);
  };

  const gameLoop = useCallback(() => {
    // Update AI players
    setPlayers(prev => prev.map(player => {
      if (!player.isPlayer && player.alive) {
        // Simple AI movement and combat
        const newX = player.x + (Math.random() - 0.5) * 4;
        const newY = player.y + (Math.random() - 0.5) * 4;
        
        // Keep players in bounds
        const boundedX = Math.max(50, Math.min(450, newX));
        const boundedY = Math.max(50, Math.min(450, newY));

        // Check if outside circle (take damage)
        const distanceFromCenter = Math.sqrt(
          Math.pow(boundedX - circleCenter.x, 2) + Math.pow(boundedY - circleCenter.y, 2)
        );
        
        let newHealth = player.health;
        if (distanceFromCenter > circleRadius) {
          newHealth = Math.max(0, player.health - 2);
        }

        // Random combat with other players
        if (Math.random() < 0.002) { // 0.2% chance per frame
          const nearbyPlayers = prev.filter(p => 
            p.alive && p.id !== player.id && 
            Math.sqrt(Math.pow(p.x - boundedX, 2) + Math.pow(p.y - boundedY, 2)) < 80
          );
          
          if (nearbyPlayers.length > 0) {
            const target = nearbyPlayers[0];
            if (!target.isPlayer) {
              // AI vs AI combat
              newHealth = Math.max(0, newHealth - 20);
            }
          }
        }

        return {
          ...player,
          x: boundedX,
          y: boundedY,
          health: newHealth,
          alive: newHealth > 0
        };
      }
      return player;
    }));

    // Update players alive count
    setPlayersAlive(prev => {
      const alive = players.filter(p => p.alive).length;
      if (alive <= 1 && gamePhase === 'playing') {
        endGame();
      }
      return alive;
    });

    if (gamePhase === 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  }, [players, gamePhase, circleRadius, circleCenter]);

  const movePlayer = (direction: string) => {
    if (!currentPlayer || !currentPlayer.alive) return;

    setCurrentPlayer(prev => {
      if (!prev) return prev;
      
      let newX = prev.x;
      let newY = prev.y;
      
      switch (direction) {
        case 'up': newY = Math.max(50, prev.y - 8); break;
        case 'down': newY = Math.min(450, prev.y + 8); break;
        case 'left': newX = Math.max(50, prev.x - 8); break;
        case 'right': newX = Math.min(450, prev.x + 8); break;
      }

      // Check circle damage
      const distanceFromCenter = Math.sqrt(
        Math.pow(newX - circleCenter.x, 2) + Math.pow(newY - circleCenter.y, 2)
      );
      
      let newHealth = prev.health;
      if (distanceFromCenter > circleRadius) {
        newHealth = Math.max(0, prev.health - 1);
      }

      const updated = { ...prev, x: newX, y: newY, health: newHealth, alive: newHealth > 0 };
      
      // Update in players array
      setPlayers(players => players.map(p => p.id === 1 ? updated : p));
      
      return updated;
    });
  };

  const shoot = () => {
    if (!currentPlayer || ammo <= 0 || !currentPlayer.alive) return;
    
    setAmmo(prev => prev - 1);
    
    // Find nearest enemy
    const nearbyEnemies = players.filter(p => 
      !p.isPlayer && p.alive && 
      Math.sqrt(Math.pow(p.x - currentPlayer.x, 2) + Math.pow(p.y - currentPlayer.y, 2)) < selectedWeapon.range
    );

    if (nearbyEnemies.length > 0) {
      const target = nearbyEnemies[0];
      const damage = selectedWeapon.damage;
      
      setPlayers(prev => prev.map(p => {
        if (p.id === target.id) {
          const newHealth = Math.max(0, p.health - damage);
          const isKilled = newHealth === 0;
          
          if (isKilled) {
            setKills(k => k + 1);
          }
          
          return { ...p, health: newHealth, alive: newHealth > 0 };
        }
        return p;
      }));
    }
  };

  const pickupWeapon = (weapon: Weapon) => {
    setSelectedWeapon(weapon);
    setAmmo(60);
  };

  const endGame = () => {
    setGamePhase('finished');
    const finalRank = playersAlive;
    setRank(finalRank);
    
    const scoreMultiplier = finalRank <= 3 ? (4 - finalRank) * 500 : 100;
    const killBonus = kills * 200;
    const survivalBonus = Math.floor((300 - timeLeft) * 10);
    const finalScore = scoreMultiplier + killBonus + survivalBonus;
    const coins = Math.floor(finalScore / 10) + (finalRank === 1 ? 100 : finalRank <= 3 ? 50 : 20);
    
    setTimeout(() => {
      onGameEnd(finalScore, coins, kills, finalRank);
    }, 3000);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gamePhase !== 'playing') return;
      
      switch (e.key) {
        case 'w':
        case 'W':
        case 'ArrowUp':
          movePlayer('up');
          break;
        case 's':
        case 'S':
        case 'ArrowDown':
          movePlayer('down');
          break;
        case 'a':
        case 'A':
        case 'ArrowLeft':
          movePlayer('left');
          break;
        case 'd':
        case 'D':
        case 'ArrowRight':
          movePlayer('right');
          break;
        case ' ':
          e.preventDefault();
          shoot();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gamePhase, currentPlayer, ammo, selectedWeapon, players]);

  if (gamePhase === 'lobby') {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 text-white rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">⚔️</div>
          <h1 className="text-3xl font-bold mb-4">LaaBoBo Battle Royale</h1>
          <p className="text-lg mb-6">معركة البقاء الأقوى - 100 لاعب في المعركة النهائية!</p>
          
          <div className="grid grid-cols-3 gap-4 mb-8 text-sm">
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <Users className="w-6 h-6 mx-auto mb-2" />
              <div className="font-bold">100 لاعب</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <Target className="w-6 h-6 mx-auto mb-2" />
              <div className="font-bold">5 أسلحة</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <Skull className="w-6 h-6 mx-auto mb-2" />
              <div className="font-bold">آخر ناجي يفوز</div>
            </div>
          </div>

          <Button 
            onClick={startGame}
            size="lg"
            className="bg-red-600 hover:bg-red-700 text-white text-xl px-12 py-4"
          >
            ابدأ المعركة! 🔥
          </Button>
        </div>
      </div>
    );
  }

  if (gamePhase === 'dropping') {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-blue-400 to-green-400 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-8xl mb-4 animate-bounce">🪂</div>
          <h2 className="text-4xl font-bold mb-4">الهبوط في المعركة...</h2>
          <div className="text-xl">استعد للقتال!</div>
        </div>
      </div>
    );
  }

  if (gamePhase === 'finished') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 w-96 text-center">
          <div className="text-6xl mb-4">
            {rank === 1 ? '👑' : rank <= 3 ? '🏆' : rank <= 10 ? '🥉' : '💀'}
          </div>
          <h2 className="text-2xl font-bold mb-4">
            {rank === 1 ? 'Victory Royale!' : `المركز #${rank}`}
          </h2>
          
          <div className="space-y-3 mb-6">
            <div className="bg-yellow-100 rounded-lg p-3">
              <div className="text-gray-700">القتلى: <span className="font-bold text-red-600">{kills}</span></div>
            </div>
            <div className="bg-blue-100 rounded-lg p-3">
              <div className="text-gray-700">الترتيب: <span className="font-bold text-blue-600">#{rank}/100</span></div>
            </div>
            <div className="bg-green-100 rounded-lg p-3">
              <div className="text-gray-700">الناجون: <span className="font-bold text-green-600">{playersAlive}</span></div>
            </div>
          </div>
          
          <p className="text-gray-600">جاري حساب المكافآت...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {/* Game HUD */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Player Stats */}
        <div className="bg-black bg-opacity-80 text-white rounded-lg p-3">
          <div className="flex items-center space-x-2 space-x-reverse mb-2">
            <Heart className="w-4 h-4 text-red-500" />
            <span>{currentPlayer?.health || 0}/100</span>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse mb-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <span>{currentPlayer?.armor || 0}/100</span>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Skull className="w-4 h-4 text-yellow-500" />
            <span>{kills} قتلى</span>
          </div>
        </div>

        {/* Game Info */}
        <div className="bg-black bg-opacity-80 text-white rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-500">{playersAlive}</div>
          <div className="text-sm">لاعبين أحياء</div>
          <div className="text-lg font-bold">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
        </div>

        {/* Weapon Info */}
        <div className="bg-black bg-opacity-80 text-white rounded-lg p-3">
          <div className="flex items-center space-x-2 space-x-reverse mb-1">
            <span className="text-xl">{selectedWeapon.emoji}</span>
            <span className="font-bold">{selectedWeapon.name}</span>
          </div>
          <div className="text-sm">الضرر: {selectedWeapon.damage}</div>
          <div className="text-sm">الذخيرة: {ammo}</div>
        </div>
      </div>

      {/* Game Area */}
      <div className="relative bg-green-200 rounded-lg overflow-hidden" style={{ height: '500px' }}>
        {/* Safe Zone Circle */}
        <div 
          className="absolute border-4 border-blue-500 border-opacity-50 rounded-full pointer-events-none"
          style={{
            width: circleRadius * 2,
            height: circleRadius * 2,
            left: circleCenter.x - circleRadius,
            top: circleCenter.y - circleRadius,
            background: 'rgba(0, 100, 255, 0.1)'
          }}
        />

        {/* Players */}
        {players.filter(p => p.alive).map(player => (
          <div
            key={player.id}
            className={`absolute w-4 h-4 rounded-full ${
              player.isPlayer ? 'bg-blue-600 ring-2 ring-white' : 'bg-red-600'
            } flex items-center justify-center text-xs font-bold text-white`}
            style={{
              left: player.x - 8,
              top: player.y - 8,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {player.isPlayer ? '👤' : '🔫'}
          </div>
        ))}

        {/* Weapon Spawns */}
        {weapons.map((weapon, index) => (
          <Button
            key={index}
            onClick={() => pickupWeapon(weapon)}
            className="absolute bg-yellow-500 hover:bg-yellow-600 w-8 h-8 p-0 text-lg"
            style={{
              left: 50 + (index * 80),
              top: 50,
            }}
          >
            {weapon.emoji}
          </Button>
        ))}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <h3 className="font-bold text-white">التحكم</h3>
          <div className="grid grid-cols-3 gap-1">
            <div></div>
            <Button onClick={() => movePlayer('up')} className="bg-gray-700 hover:bg-gray-600">↑</Button>
            <div></div>
            <Button onClick={() => movePlayer('left')} className="bg-gray-700 hover:bg-gray-600">←</Button>
            <Button onClick={() => movePlayer('down')} className="bg-gray-700 hover:bg-gray-600">↓</Button>
            <Button onClick={() => movePlayer('right')} className="bg-gray-700 hover:bg-gray-600">→</Button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-bold text-white">القتال</h3>
          <Button 
            onClick={shoot}
            disabled={ammo <= 0}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            <Crosshair className="w-4 h-4 mr-2" />
            أطلق النار (مسافة)
          </Button>
          <div className="text-sm text-gray-300">استخدم WASD أو الأسهم للحركة</div>
        </div>
      </div>
    </div>
  );
}