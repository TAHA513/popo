import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Swords, 
  Shield, 
  Zap, 
  Users, 
  Crown, 
  Target,
  MapPin,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio
} from "lucide-react";

interface ReclaimCityProps {
  isMultiplayer: boolean;
  playerCount: number;
  onGameEnd: (score: number, pointsWon: number) => void;
}

interface Player {
  id: string;
  name: string;
  health: number;
  energy: number;
  weapons: string[];
  isOnline: boolean;
}

interface Enemy {
  id: string;
  type: 'robot' | 'hybrid' | 'traitor';
  name: string;
  health: number;
  maxHealth: number;
  damage: number;
  x: number;
  y: number;
}

interface GameState {
  wave: number;
  score: number;
  resources: {
    gold: number;
    energy: number;
    tech: number;
  };
  cityProgress: number;
  timeRemaining: number;
}

const ReclaimCity: React.FC<ReclaimCityProps> = ({ 
  isMultiplayer, 
  playerCount, 
  onGameEnd 
}) => {
  const [gameState, setGameState] = useState<GameState>({
    wave: 1,
    score: 0,
    resources: { gold: 100, energy: 50, tech: 10 },
    cityProgress: 0,
    timeRemaining: 300 // 5 minutes
  });

  const [players, setPlayers] = useState<Player[]>([
    {
      id: "player1",
      name: "القائد الأول",
      health: 100,
      energy: 100,
      weapons: ["بندقية ليزر", "درع طاقة"],
      isOnline: true
    }
  ]);

  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [voiceActive, setVoiceActive] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [gamePhase, setGamePhase] = useState<'preparation' | 'battle' | 'victory' | 'defeat'>('preparation');
  const gameLoopRef = useRef<NodeJS.Timeout>();

  // Initialize multiplayer players
  useEffect(() => {
    if (isMultiplayer && playerCount > 1) {
      const multiPlayers = Array.from({ length: playerCount }, (_, i) => ({
        id: `player${i + 1}`,
        name: `القائد ${i + 1}`,
        health: 100,
        energy: 100,
        weapons: ["بندقية ليزر", "درع طاقة"],
        isOnline: true
      }));
      setPlayers(multiPlayers);
    }
  }, [isMultiplayer, playerCount]);

  // Game timer and wave system
  useEffect(() => {
    if (gamePhase === 'battle') {
      gameLoopRef.current = setInterval(() => {
        setGameState(prev => {
          const newTime = prev.timeRemaining - 1;
          
          if (newTime <= 0) {
            if (prev.cityProgress >= 100) {
              setGamePhase('victory');
            } else {
              setGamePhase('defeat');
            }
            return prev;
          }

          // Spawn enemies periodically
          if (newTime % 15 === 0) {
            spawnWave();
          }

          return { ...prev, timeRemaining: newTime };
        });
      }, 1000);
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gamePhase]);

  const spawnWave = () => {
    const enemyTypes: Enemy['type'][] = ['robot', 'hybrid', 'traitor'];
    const enemyNames = {
      robot: ['روبوت مدمر', 'آلة قتالية', 'دورية آلية'],
      hybrid: ['وحش هجين', 'مخلوق طافر', 'زاحف سام'],
      traitor: ['خائن مسلح', 'جندي منشق', 'عميل مزدوج']
    };

    const newEnemies: Enemy[] = Array.from({ length: Math.min(3 + gameState.wave, 8) }, (_, i) => {
      const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      const names = enemyNames[type];
      const maxHealth = 50 + (gameState.wave * 10);
      
      return {
        id: `enemy_${Date.now()}_${i}`,
        type,
        name: names[Math.floor(Math.random() * names.length)],
        health: maxHealth,
        maxHealth,
        damage: 10 + (gameState.wave * 2),
        x: Math.random() * 400,
        y: Math.random() * 300
      };
    });

    setEnemies(prev => [...prev, ...newEnemies]);
  };

  const attackEnemy = (enemyId: string) => {
    setEnemies(prev => prev.map(enemy => {
      if (enemy.id === enemyId) {
        const newHealth = Math.max(0, enemy.health - 25);
        
        if (newHealth === 0) {
          // Enemy defeated - gain resources and score
          setGameState(prevState => ({
            ...prevState,
            score: prevState.score + 10,
            resources: {
              gold: prevState.resources.gold + 5,
              energy: prevState.resources.energy + 3,
              tech: prevState.resources.tech + 1
            },
            cityProgress: Math.min(100, prevState.cityProgress + 2)
          }));
          
          // Remove defeated enemy after short delay
          setTimeout(() => {
            setEnemies(prev => prev.filter(e => e.id !== enemyId));
          }, 500);
        }
        
        return { ...enemy, health: newHealth };
      }
      return enemy;
    }));

    // Add attack animation effect
    setSelectedTarget(enemyId);
    setTimeout(() => setSelectedTarget(null), 300);
  };

  const useSpecialAbility = (abilityType: 'airstrike' | 'shield' | 'heal') => {
    const costs = { airstrike: 30, shield: 20, heal: 15 };
    const cost = costs[abilityType];

    if (gameState.resources.energy >= cost) {
      setGameState(prev => ({
        ...prev,
        resources: { ...prev.resources, energy: prev.resources.energy - cost }
      }));

      switch (abilityType) {
        case 'airstrike':
          // Damage all enemies
          setEnemies(prev => prev.map(enemy => ({
            ...enemy,
            health: Math.max(0, enemy.health - 40)
          })));
          break;
        case 'shield':
          // Heal all players
          setPlayers(prev => prev.map(player => ({
            ...player,
            health: Math.min(100, player.health + 30)
          })));
          break;
        case 'heal':
          // Full team heal
          setPlayers(prev => prev.map(player => ({
            ...player,
            health: 100,
            energy: 100
          })));
          break;
      }
    }
  };

  const startBattle = () => {
    setGamePhase('battle');
    spawnWave();
    if (isMultiplayer) {
      setVoiceActive(true);
    }
  };

  const finishGame = () => {
    const finalScore = gameState.score + (gameState.cityProgress * 10);
    const pointsWon = Math.floor(finalScore / 10);
    onGameEnd(finalScore, pointsWon);
  };

  // Game Over Check
  useEffect(() => {
    if (gamePhase === 'victory' || gamePhase === 'defeat') {
      setTimeout(() => {
        finishGame();
      }, 3000);
    }
  }, [gamePhase]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (gamePhase === 'preparation') {
    return (
      <div className="w-full h-full bg-gradient-to-b from-red-900 to-black text-white p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-red-400">🏙️ استعادة المدينة</h1>
          <p className="text-lg text-gray-300">استعد للمعركة ضد الذكاء الاصطناعي!</p>
        </div>

        {/* Team Status */}
        <Card className="bg-black/50 border-red-500 p-4 mb-6">
          <h3 className="text-xl font-bold mb-4 text-red-400">🛡️ فريق المقاومة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {players.map((player, index) => (
              <div key={player.id} className="flex items-center space-x-3 bg-gray-800 p-3 rounded">
                <Crown className="w-6 h-6 text-yellow-400" />
                <div className="flex-1">
                  <p className="font-bold">{player.name}</p>
                  <div className="flex space-x-2">
                    <Badge variant="secondary">صحة: {player.health}%</Badge>
                    <Badge variant="outline">طاقة: {player.energy}%</Badge>
                  </div>
                </div>
                {isMultiplayer && (
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Mission Briefing */}
        <Card className="bg-black/50 border-blue-500 p-4 mb-6">
          <h3 className="text-xl font-bold mb-4 text-blue-400">📋 مهمة استعادة المدينة</h3>
          <div className="bg-red-900/30 border border-red-500 rounded p-3 mb-4">
            <p className="text-red-300 text-sm font-bold">⚠️ تحذير: الذكاء الاصطناعي سيطر على المدينة!</p>
          </div>
          <ul className="space-y-2 text-gray-300">
            <li>🎯 تحرير المناطق المحتلة من سيطرة الذكاء الاصطناعي</li>
            <li>⚔️ القضاء على جيش الروبوتات والمخلوقات الهجينة</li>
            <li>🛡️ التعاون مع فريق المقاومة لحماية الناجين</li>
            <li>🏗️ جمع الموارد لبناء مدينة ذكية جديدة آمنة</li>
            <li>🔥 مواجهة البشر الخونة المتحالفين مع الآلات</li>
          </ul>
          <div className="mt-4 p-3 bg-blue-900/30 border border-blue-400 rounded">
            <p className="text-blue-300 text-sm">
              <strong>الهدف النهائي:</strong> الوصول لنسبة تحرير 100% خلال الوقت المحدد
            </p>
          </div>
        </Card>

        {/* Voice Chat Setup */}
        {isMultiplayer && (
          <Card className="bg-black/50 border-green-500 p-4 mb-6">
            <h3 className="text-xl font-bold mb-4 text-green-400">🎤 نظام التواصل الصوتي</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Radio className="w-6 h-6 text-green-400" />
                <span>جاهز للاتصال مع الفريق</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={micMuted ? "destructive" : "secondary"}
                  size="sm"
                  onClick={() => setMicMuted(!micMuted)}
                >
                  {micMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Button
                  variant={voiceActive ? "destructive" : "secondary"}
                  size="sm"
                  onClick={() => setVoiceActive(!voiceActive)}
                >
                  {voiceActive ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Alliance & Invitation System */}
        <Card className="bg-black/50 border-yellow-500 p-4 mb-6">
          <h3 className="text-xl font-bold mb-4 text-yellow-400">👑 نظام التحالفات</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <p className="text-gray-300 text-sm">ادع أصدقاءك للانضمام للمقاومة:</p>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    alert("تم نسخ رابط الدعوة!");
                  }}
                  className="flex-1"
                >
                  📋 نسخ رابط الدعوة
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const shareData = {
                      title: 'استعادة المدينة - LaaBoBo',
                      text: 'انضم لي في مقاومة الذكاء الاصطناعي!',
                      url: window.location.href
                    };
                    if (navigator.share) {
                      navigator.share(shareData);
                    }
                  }}
                  className="flex-1"
                >
                  📤 مشاركة
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-gray-300 text-sm">مكافآت التحالف:</p>
              <div className="text-xs space-y-1">
                <div className="text-green-400">• +50 نقطة لكل صديق منضم</div>
                <div className="text-blue-400">• +25% موارد إضافية في الفريق</div>
                <div className="text-purple-400">• فتح قدرات خاصة جماعية</div>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex flex-col space-y-4">
          <Button 
            onClick={startBattle}
            size="lg"
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-xl"
          >
            🚀 بدء المعركة ({playerCount} مقاتل)
          </Button>
          
          {isMultiplayer && (
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2">
                في انتظار اللاعبين الآخرين... ({playerCount}/8)
              </p>
              <div className="flex justify-center space-x-2">
                <Button variant="outline" size="sm">
                  🎮 دعوة أصدقاء
                </Button>
                <Button variant="outline" size="sm">
                  🔀 البحث عن لاعبين
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gamePhase === 'battle') {
    return (
      <div className="w-full h-full bg-gradient-to-b from-gray-900 to-red-900 text-white p-4">
        {/* Game HUD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-black/70 p-4">
            <h3 className="font-bold mb-2">⏱️ الوقت المتبقي</h3>
            <p className="text-2xl text-red-400">{formatTime(gameState.timeRemaining)}</p>
          </Card>
          
          <Card className="bg-black/70 p-4">
            <h3 className="font-bold mb-2">🏆 النقاط</h3>
            <p className="text-2xl text-yellow-400">{gameState.score}</p>
          </Card>
          
          <Card className="bg-black/70 p-4">
            <h3 className="font-bold mb-2">🏙️ تقدم التحرير</h3>
            <Progress value={gameState.cityProgress} className="mt-2" />
            <p className="text-sm mt-1">{gameState.cityProgress}%</p>
          </Card>
        </div>

        {/* Resources */}
        <div className="flex justify-center space-x-6 mb-6">
          <Badge variant="secondary" className="text-lg p-2">
            💰 ذهب: {gameState.resources.gold}
          </Badge>
          <Badge variant="secondary" className="text-lg p-2">
            ⚡ طاقة: {gameState.resources.energy}
          </Badge>
          <Badge variant="secondary" className="text-lg p-2">
            🔬 تقنية: {gameState.resources.tech}
          </Badge>
        </div>

        {/* Battle Area */}
        <Card className="bg-black/50 border-2 border-red-500 p-4 mb-6 min-h-[300px]">
          <h3 className="text-xl font-bold mb-4 text-center">⚔️ ساحة المعركة - الموجة {gameState.wave}</h3>
          
          {enemies.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {enemies.map((enemy) => (
                <div
                  key={enemy.id}
                  className={`bg-red-800/50 border rounded-lg p-3 cursor-pointer transition-all ${
                    selectedTarget === enemy.id ? 'border-yellow-400 bg-yellow-400/20' : 'border-red-400'
                  } ${enemy.health === 0 ? 'opacity-50 bg-gray-600' : 'hover:bg-red-700/50'}`}
                  onClick={() => enemy.health > 0 && attackEnemy(enemy.id)}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">
                      {enemy.type === 'robot' ? '🤖' : enemy.type === 'hybrid' ? '👹' : '🔫'}
                    </div>
                    <p className="font-bold text-sm">{enemy.name}</p>
                    <Progress 
                      value={(enemy.health / enemy.maxHealth) * 100} 
                      className="mt-2 h-2"
                    />
                    <p className="text-xs mt-1">{enemy.health}/{enemy.maxHealth}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-lg text-gray-400">انتظار الموجة التالية...</p>
              <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mt-4"></div>
            </div>
          )}
        </Card>

        {/* Special Abilities & Upgrades */}
        <Card className="bg-black/50 border-purple-500 p-4 mb-6">
          <h3 className="text-lg font-bold mb-3 text-purple-400">⚡ قدرات خاصة وترقيات</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Combat Abilities */}
            <div>
              <h4 className="text-sm font-bold text-red-400 mb-2">🔥 قدرات قتالية</h4>
              <div className="space-y-2">
                <Button
                  onClick={() => useSpecialAbility('airstrike')}
                  disabled={gameState.resources.energy < 30}
                  className="w-full bg-red-600 hover:bg-red-700 text-xs"
                  size="sm"
                >
                  💥 ضربة جوية (30 طاقة)
                </Button>
                <Button
                  onClick={() => useSpecialAbility('shield')}
                  disabled={gameState.resources.energy < 20}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-xs"
                  size="sm"
                >
                  🛡️ درع جماعي (20 طاقة)
                </Button>
                <Button
                  onClick={() => useSpecialAbility('heal')}
                  disabled={gameState.resources.energy < 15}
                  className="w-full bg-green-600 hover:bg-green-700 text-xs"
                  size="sm"
                >
                  ❤️ شفاء شامل (15 طاقة)
                </Button>
              </div>
            </div>

            {/* Building & Upgrades */}
            <div>
              <h4 className="text-sm font-bold text-yellow-400 mb-2">🏗️ البناء والتطوير</h4>
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    if (gameState.resources.gold >= 50 && gameState.resources.tech >= 5) {
                      setGameState(prev => ({
                        ...prev,
                        resources: {
                          ...prev.resources,
                          gold: prev.resources.gold - 50,
                          tech: prev.resources.tech - 5
                        },
                        cityProgress: Math.min(100, prev.cityProgress + 10)
                      }));
                    }
                  }}
                  disabled={gameState.resources.gold < 50 || gameState.resources.tech < 5}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-xs"
                  size="sm"
                >
                  🏢 بناء قاعدة (50 ذهب، 5 تقنية)
                </Button>
                <Button
                  onClick={() => {
                    if (gameState.resources.gold >= 30) {
                      setGameState(prev => ({
                        ...prev,
                        resources: {
                          ...prev.resources,
                          gold: prev.resources.gold - 30,
                          energy: Math.min(100, prev.resources.energy + 20)
                        }
                      }));
                    }
                  }}
                  disabled={gameState.resources.gold < 30}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-xs"
                  size="sm"
                >
                  🔋 مولد طاقة (30 ذهب)
                </Button>
                <Button
                  onClick={() => {
                    if (gameState.resources.tech >= 8) {
                      setGameState(prev => ({
                        ...prev,
                        resources: {
                          ...prev.resources,
                          tech: prev.resources.tech - 8
                        }
                      }));
                      // Upgrade all players
                      setPlayers(prev => prev.map(player => ({
                        ...player,
                        weapons: [...player.weapons, "سلاح متقدم"]
                      })));
                    }
                  }}
                  disabled={gameState.resources.tech < 8}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-xs"
                  size="sm"
                >
                  🔧 ترقية الأسلحة (8 تقنية)
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Voice Chat Status */}
        {isMultiplayer && voiceActive && (
          <Card className="bg-green-900/50 border-green-500 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Radio className="w-5 h-5 text-green-400" />
                <span className="text-sm">متصل صوتياً مع {playerCount} لاعبين</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={micMuted ? "destructive" : "secondary"}
                  size="sm"
                  onClick={() => setMicMuted(!micMuted)}
                >
                  {micMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  }

  // Victory/Defeat Screen
  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black text-white p-8 text-center">
      <div className="max-w-md mx-auto">
        {gamePhase === 'victory' ? (
          <>
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-3xl font-bold mb-4 text-green-400">انتصار باهر!</h2>
            <p className="text-lg mb-6">تم تحرير المدينة بنجاح!</p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">💥</div>
            <h2 className="text-3xl font-bold mb-4 text-red-400">المقاومة مستمرة</h2>
            <p className="text-lg mb-6">لم تستطع تحرير المدينة بالكامل</p>
          </>
        )}
        
        <Card className="bg-black/50 p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">📊 نتائج المعركة</h3>
          <div className="space-y-2">
            <p>النقاط النهائية: <span className="text-yellow-400">{gameState.score}</span></p>
            <p>تقدم التحرير: <span className="text-blue-400">{gameState.cityProgress}%</span></p>
            <p>الموجة المكتملة: <span className="text-purple-400">{gameState.wave}</span></p>
            <p>النقاط المكتسبة: <span className="text-green-400">{Math.floor(gameState.score / 10)}</span></p>
          </div>
        </Card>

        <p className="text-gray-400 mb-4">سيتم العودة للغرفة تلقائياً...</p>
      </div>
    </div>
  );
};

export default ReclaimCity;