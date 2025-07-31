import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Zap, Shield, Sword, Users, Bot, AlertTriangle, Target, Map, Clock, Star, Trophy, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Game Types
interface GameState {
  id: string;
  phase: 'preparation' | 'battle' | 'victory' | 'defeat';
  cityProgress: number;
  playerHealth: number;
  playerEnergy: number;
  playerResources: number;
  aiStrength: number;
  currentWave: number;
  totalWaves: number;
  timeRemaining: number;
  score: number;
  kills: number;
  territoriesControlled: number;
}

interface Territory {
  id: string;
  name: string;
  controlled: 'human' | 'ai' | 'contested';
  strategicValue: number;
  defenseLevel: number;
  resources: number;
}

interface AIEnemy {
  id: string;
  type: 'drone' | 'robot' | 'cyborg' | 'ai_commander';
  health: number;
  maxHealth: number;
  damage: number;
  position: { x: number; y: number };
  isActive: boolean;
}

interface Weapon {
  id: string;
  name: string;
  damage: number;
  range: number;
  energyCost: number;
  cooldown: number;
  icon: string;
}

const TERRITORIES: Territory[] = [
  { id: '1', name: 'المركز التقني', controlled: 'ai', strategicValue: 100, defenseLevel: 90, resources: 50 },
  { id: '2', name: 'الحي السكني', controlled: 'contested', strategicValue: 70, defenseLevel: 40, resources: 30 },
  { id: '3', name: 'المصنع الرئيسي', controlled: 'ai', strategicValue: 90, defenseLevel: 80, resources: 70 },
  { id: '4', name: 'ميناء المدينة', controlled: 'human', strategicValue: 60, defenseLevel: 30, resources: 40 },
  { id: '5', name: 'محطة الطاقة', controlled: 'ai', strategicValue: 95, defenseLevel: 85, resources: 80 },
  { id: '6', name: 'الجامعة', controlled: 'human', strategicValue: 50, defenseLevel: 20, resources: 25 },
];

const WEAPONS: Weapon[] = [
  { id: '1', name: 'بندقية البلازما', damage: 25, range: 100, energyCost: 10, cooldown: 2, icon: '🔫' },
  { id: '2', name: 'قاذف الليزر', damage: 40, range: 150, energyCost: 20, cooldown: 4, icon: '⚡' },
  { id: '3', name: 'قنبلة الكترومغناطيسية', damage: 60, range: 200, energyCost: 35, cooldown: 8, icon: '💥' },
  { id: '4', name: 'صاروخ مضاد للذكاء الاصطناعي', damage: 100, range: 300, energyCost: 50, cooldown: 15, icon: '🚀' },
];

export default function AIWarGame() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Game State
  const [gameState, setGameState] = useState<GameState>({
    id: Date.now().toString(),
    phase: 'preparation',
    cityProgress: 0,
    playerHealth: 100,
    playerEnergy: 100,
    playerResources: 500,
    aiStrength: 100,
    currentWave: 1,
    totalWaves: 10,
    timeRemaining: 300, // 5 minutes
    score: 0,
    kills: 0,
    territoriesControlled: 2,
  });

  const [territories, setTerritories] = useState<Territory[]>(TERRITORIES);
  const [enemies, setEnemies] = useState<AIEnemy[]>([]);
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon>(WEAPONS[0]);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [showBattleLog, setShowBattleLog] = useState(false);
  const [battleLog, setBattleLog] = useState<string[]>([]);

  // Game Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGameRunning && gameState.timeRemaining > 0) {
      interval = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          timeRemaining: prev.timeRemaining - 1
        }));
      }, 1000);
    } else if (gameState.timeRemaining <= 0) {
      endGame('defeat');
    }
    return () => clearInterval(interval);
  }, [isGameRunning, gameState.timeRemaining]);

  // Enemy Spawn System
  useEffect(() => {
    if (isGameRunning && gameState.phase === 'battle') {
      const spawnInterval = setInterval(() => {
        spawnAIEnemies();
      }, 3000);
      return () => clearInterval(spawnInterval);
    }
  }, [isGameRunning, gameState.phase]);

  const spawnAIEnemies = useCallback(() => {
    const enemyTypes: AIEnemy['type'][] = ['drone', 'robot', 'cyborg', 'ai_commander'];
    const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    
    const newEnemy: AIEnemy = {
      id: Date.now().toString(),
      type: randomType,
      health: randomType === 'ai_commander' ? 150 : randomType === 'cyborg' ? 100 : randomType === 'robot' ? 75 : 50,
      maxHealth: randomType === 'ai_commander' ? 150 : randomType === 'cyborg' ? 100 : randomType === 'robot' ? 75 : 50,
      damage: randomType === 'ai_commander' ? 30 : randomType === 'cyborg' ? 20 : randomType === 'robot' ? 15 : 10,
      position: { x: Math.random() * 400, y: Math.random() * 300 },
      isActive: true,
    };

    setEnemies(prev => [...prev, newEnemy]);
    addToBattleLog(`تم رصد ${getEnemyName(randomType)} جديد في المنطقة!`);
  }, []);

  const getEnemyName = (type: AIEnemy['type']) => {
    switch (type) {
      case 'drone': return 'طائرة استطلاع';
      case 'robot': return 'روبوت قتالي';
      case 'cyborg': return 'كائن مدمج';
      case 'ai_commander': return 'قائد ذكي';
      default: return 'عدو';
    }
  };

  const getEnemyIcon = (type: AIEnemy['type']) => {
    switch (type) {
      case 'drone': return '🛸';
      case 'robot': return '🤖';
      case 'cyborg': return '🦾';
      case 'ai_commander': return '👑';
      default: return '⚠️';
    }
  };

  const addToBattleLog = (message: string) => {
    setBattleLog(prev => [message, ...prev.slice(0, 9)]);
  };

  const startGame = () => {
    setIsGameRunning(true);
    setGameState(prev => ({ ...prev, phase: 'battle' }));
    addToBattleLog('بدأت المعركة! استعد لاستعادة السيطرة على الأرض!');
  };

  const attackEnemy = (enemyId: string) => {
    if (gameState.playerEnergy < selectedWeapon.energyCost) {
      toast({
        title: "طاقة غير كافية",
        description: `تحتاج ${selectedWeapon.energyCost} نقطة طاقة لاستخدام ${selectedWeapon.name}`,
        variant: "destructive",
      });
      return;
    }

    setEnemies(prev => prev.map(enemy => {
      if (enemy.id === enemyId) {
        const newHealth = Math.max(0, enemy.health - selectedWeapon.damage);
        if (newHealth === 0) {
          addToBattleLog(`تم القضاء على ${getEnemyName(enemy.type)} بنجاح!`);
          setGameState(prevState => ({
            ...prevState,
            score: prevState.score + enemy.maxHealth,
            kills: prevState.kills + 1,
            cityProgress: Math.min(100, prevState.cityProgress + 2)
          }));
        }
        return { ...enemy, health: newHealth, isActive: newHealth > 0 };
      }
      return enemy;
    }));

    setGameState(prev => ({
      ...prev,
      playerEnergy: Math.max(0, prev.playerEnergy - selectedWeapon.energyCost)
    }));

    // Remove defeated enemies
    setTimeout(() => {
      setEnemies(prev => prev.filter(enemy => enemy.isActive));
    }, 1000);
  };

  const captureTerritory = (territoryId: string) => {
    const territory = territories.find(t => t.id === territoryId);
    if (!territory || territory.controlled === 'human') return;

    if (gameState.playerResources < territory.defenseLevel) {
      toast({
        title: "موارد غير كافية",
        description: `تحتاج ${territory.defenseLevel} مورد لاحتلال ${territory.name}`,
        variant: "destructive",
      });
      return;
    }

    setTerritories(prev => prev.map(t => 
      t.id === territoryId ? { ...t, controlled: 'human' } : t
    ));

    setGameState(prev => ({
      ...prev,
      playerResources: prev.playerResources - territory.defenseLevel + territory.resources,
      territoriesControlled: prev.territoriesControlled + 1,
      cityProgress: Math.min(100, prev.cityProgress + territory.strategicValue / 10),
      score: prev.score + territory.strategicValue * 10
    }));

    addToBattleLog(`تم احتلال ${territory.name} بنجاح! +${territory.resources} موارد`);

    // Check victory condition
    if (gameState.cityProgress >= 100) {
      endGame('victory');
    }
  };

  const endGame = (result: 'victory' | 'defeat') => {
    setIsGameRunning(false);
    setGameState(prev => ({ ...prev, phase: result }));
    
    const message = result === 'victory' 
      ? `انتصار! تم استعادة السيطرة على الأرض! النتيجة: ${gameState.score}`
      : `هزيمة! سيطر الذكاء الاصطناعي على الأرض. النتيجة: ${gameState.score}`;
    
    addToBattleLog(message);
    
    toast({
      title: result === 'victory' ? "انتصار!" : "هزيمة!",
      description: message,
      variant: result === 'victory' ? "default" : "destructive",
    });
  };

  const resetGame = () => {
    setGameState({
      id: Date.now().toString(),
      phase: 'preparation',
      cityProgress: 0,
      playerHealth: 100,
      playerEnergy: 100,
      playerResources: 500,
      aiStrength: 100,
      currentWave: 1,
      totalWaves: 10,
      timeRemaining: 300,
      score: 0,
      kills: 0,
      territoriesControlled: 2,
    });
    setTerritories(TERRITORIES);
    setEnemies([]);
    setIsGameRunning(false);
    setBattleLog([]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4 text-white">يجب تسجيل الدخول</h2>
            <Button onClick={() => window.location.href = '/login'} className="w-full">
              تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black text-white">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-red-500/30 sticky top-0 z-20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="text-white hover:text-red-300 hover:bg-white/10 rounded-full p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold text-red-400 flex items-center gap-2">
                <Bot className="w-6 h-6" />
                حرب الذكاء الاصطناعي
              </h1>
            </div>
            <Badge variant="outline" className="border-red-500 text-red-400">
              المرحلة: {gameState.phase === 'preparation' ? 'الاستعداد' : 
                      gameState.phase === 'battle' ? 'المعركة' : 
                      gameState.phase === 'victory' ? 'النصر' : 'الهزيمة'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Game Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-500/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{gameState.playerHealth}%</div>
              <div className="text-sm text-green-300">صحة اللاعب</div>
              <Progress value={gameState.playerHealth} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-500/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{gameState.playerEnergy}%</div>
              <div className="text-sm text-blue-300">الطاقة</div>
              <Progress value={gameState.playerEnergy} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-yellow-500/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{gameState.playerResources}</div>
              <div className="text-sm text-yellow-300">الموارد</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-500/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{gameState.score}</div>
              <div className="text-sm text-purple-300">النقاط</div>
            </CardContent>
          </Card>
        </div>

        {/* City Liberation Progress */}
        <Card className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border-red-500/30">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <Target className="w-5 h-5" />
              تقدم تحرير المدينة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">السيطرة على المدينة</span>
              <span className="text-lg font-bold text-red-400">{gameState.cityProgress.toFixed(1)}%</span>
            </div>
            <Progress value={gameState.cityProgress} className="h-4" />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>احتلال الذكاء الاصطناعي</span>
              <span>تحرير البشر</span>
            </div>
          </CardContent>
        </Card>

        {/* Game Controls */}
        {gameState.phase === 'preparation' && (
          <Card className="bg-gradient-to-br from-green-900/30 to-blue-900/30 border-green-500/30">
            <CardHeader>
              <CardTitle className="text-green-400 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                الاستعداد للمعركة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-gray-300 text-sm leading-relaxed">
                🔴 <strong>خلفية القصة:</strong> استولى الذكاء الاصطناعي على معظم أنحاء الأرض. أنت جزء من المقاومة البشرية التي تحاول استعادة السيطرة على المدينة.
                <br/><br/>
                🎯 <strong>هدف المهمة:</strong> احتلال المناطق الإستراتيجية والقضاء على قوات الذكاء الاصطناعي لاستعادة 100% من السيطرة على المدينة.
              </div>
              <Button 
                onClick={startGame} 
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-3"
              >
                <Sword className="w-5 h-5 mr-2" />
                بدء المعركة
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Battle Interface */}
        {gameState.phase === 'battle' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Battlefield */}
            <Card className="bg-gradient-to-br from-gray-900/50 to-red-900/30 border-red-500/30">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Map className="w-5 h-5" />
                    ساحة المعركة
                  </span>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4" />
                    {formatTime(gameState.timeRemaining)}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative bg-black/50 rounded-lg p-4 h-64 overflow-hidden">
                  {/* Enemies on battlefield */}
                  {enemies.filter(e => e.isActive).map(enemy => (
                    <div
                      key={enemy.id}
                      className="absolute cursor-pointer transform hover:scale-110 transition-transform"
                      style={{ 
                        left: `${enemy.position.x}px`, 
                        top: `${enemy.position.y}px`,
                        maxWidth: '50px',
                        maxHeight: '50px'
                      }}
                      onClick={() => attackEnemy(enemy.id)}
                    >
                      <div className="bg-red-600/80 rounded-full p-2 border border-red-400">
                        <span className="text-xl">{getEnemyIcon(enemy.type)}</span>
                      </div>
                      <div className="text-xs text-center mt-1">
                        <Progress value={(enemy.health / enemy.maxHealth) * 100} className="h-1" />
                      </div>
                    </div>
                  ))}
                  
                  {enemies.filter(e => e.isActive).length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                        <div>في انتظار موجة جديدة من الأعداء...</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Weapon Selection */}
                <div className="mt-4">
                  <h4 className="text-sm font-bold text-gray-300 mb-2">اختر السلاح:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {WEAPONS.map(weapon => (
                      <Button
                        key={weapon.id}
                        variant={selectedWeapon.id === weapon.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedWeapon(weapon)}
                        className={`text-xs ${selectedWeapon.id === weapon.id ? 'bg-red-600' : ''}`}
                      >
                        <span className="mr-1">{weapon.icon}</span>
                        {weapon.name}
                        <span className="ml-1 text-xs">({weapon.energyCost}⚡)</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Territories Control */}
            <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-blue-400 flex items-center gap-2">
                  <Map className="w-5 h-5" />
                  السيطرة على المناطق
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {territories.map(territory => (
                    <div
                      key={territory.id}
                      className={`p-3 rounded-lg border ${
                        territory.controlled === 'human' 
                          ? 'bg-green-900/30 border-green-500/50' 
                          : territory.controlled === 'ai'
                          ? 'bg-red-900/30 border-red-500/50'
                          : 'bg-yellow-900/30 border-yellow-500/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-sm">{territory.name}</h4>
                          <div className="text-xs text-gray-400">
                            القيمة: {territory.strategicValue} | الدفاع: {territory.defenseLevel}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant="outline" 
                            className={
                              territory.controlled === 'human' 
                                ? 'border-green-500 text-green-400' 
                                : territory.controlled === 'ai'
                                ? 'border-red-500 text-red-400'
                                : 'border-yellow-500 text-yellow-400'
                            }
                          >
                            {territory.controlled === 'human' ? 'بشري' : 
                             territory.controlled === 'ai' ? 'ذكاء اصطناعي' : 'متنازع عليه'}
                          </Badge>
                          {territory.controlled !== 'human' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-1 ml-2 text-xs border-blue-500 text-blue-400 hover:bg-blue-600"
                              onClick={() => captureTerritory(territory.id)}
                              disabled={gameState.playerResources < territory.defenseLevel}
                            >
                              احتلال
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Battle Log */}
        {gameState.phase === 'battle' && (
          <Card className="bg-gradient-to-br from-gray-900/50 to-black/30 border-gray-500/30">
            <CardHeader>
              <CardTitle className="text-gray-400 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  سجل المعركة
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBattleLog(!showBattleLog)}
                >
                  {showBattleLog ? 'إخفاء' : 'عرض'}
                </Button>
              </CardTitle>
            </CardHeader>
            {showBattleLog && (
              <CardContent>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {battleLog.map((log, index) => (
                    <div key={index} className="text-sm text-gray-300 border-l-2 border-gray-600 pl-2">
                      {log}
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Game Over */}
        {(gameState.phase === 'victory' || gameState.phase === 'defeat') && (
          <Card className={`${gameState.phase === 'victory' ? 'bg-gradient-to-br from-green-900/50 to-blue-900/30 border-green-500/30' : 'bg-gradient-to-br from-red-900/50 to-gray-900/30 border-red-500/30'}`}>
            <CardHeader>
              <CardTitle className={`${gameState.phase === 'victory' ? 'text-green-400' : 'text-red-400'} flex items-center gap-2 text-center justify-center`}>
                {gameState.phase === 'victory' ? <Trophy className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                {gameState.phase === 'victory' ? 'انتصار البشرية!' : 'هزيمة المقاومة!'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="text-lg">
                {gameState.phase === 'victory' 
                  ? 'تهانينا! تم استعادة السيطرة على الأرض من الذكاء الاصطناعي!'
                  : 'لقد فشلت المقاومة. الذكاء الاصطناعي يسيطر على الأرض.'}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{gameState.score}</div>
                  <div className="text-sm text-gray-400">النقاط</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{gameState.kills}</div>
                  <div className="text-sm text-gray-400">قتلى الأعداء</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{gameState.territoriesControlled}</div>
                  <div className="text-sm text-gray-400">مناطق محررة</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{gameState.cityProgress.toFixed(1)}%</div>
                  <div className="text-sm text-gray-400">تحرير المدينة</div>
                </div>
              </div>

              <Button 
                onClick={resetGame}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-8"
              >
                <Flame className="w-5 h-5 mr-2" />
                معركة جديدة
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}