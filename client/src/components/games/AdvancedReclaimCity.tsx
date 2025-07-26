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
  Radio,
  Play,
  Pause,
  RotateCcw,
  Settings,
  UserPlus,
  Trophy,
  Star,
  Coins,
  Battery,
  Cpu,
  Map
} from "lucide-react";

interface AdvancedReclaimCityProps {
  isMultiplayer: boolean;
  playerCount: number;
  onGameEnd: (score: number, pointsWon: number) => void;
}

interface Character {
  id: string;
  name: string;
  class: 'soldier' | 'engineer' | 'medic' | 'scout';
  level: number;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  skills: string[];
  equipment: string[];
}

interface Player {
  id: string;
  name: string;
  character: Character;
  isOnline: boolean;
  isReady: boolean;
  alliance?: string;
}

interface Enemy {
  id: string;
  type: 'robot' | 'hybrid' | 'traitor';
  name: string;
  health: number;
  maxHealth: number;
  damage: number;
  special: string;
  x: number;
  y: number;
  isActive: boolean;
}

interface CityZone {
  id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  liberationProgress: number;
  isLiberated: boolean;
  requiredPlayers: number;
  enemies: Enemy[];
  rewards: {
    xp: number;
    gold: number;
    items: string[];
  };
}

interface GameState {
  phase: 'preparation' | 'battle' | 'victory' | 'defeat';
  wave: number;
  totalWaves: number;
  score: number;
  resources: {
    gold: number;
    energy: number;
    tech: number;
  };
  cityProgress: number;
  timeRemaining: number;
  selectedZone: CityZone | null;
}

const AdvancedReclaimCity: React.FC<AdvancedReclaimCityProps> = ({ 
  isMultiplayer, 
  playerCount, 
  onGameEnd 
}) => {
  const [gameState, setGameState] = useState<GameState>({
    phase: 'preparation',
    wave: 1,
    totalWaves: 10,
    score: 0,
    resources: { gold: 500, energy: 100, tech: 50 },
    cityProgress: 0,
    timeRemaining: 900, // 15 minutes
    selectedZone: null
  });

  const [players, setPlayers] = useState<Player[]>([
    {
      id: "player1",
      name: "القائد الأول",
      character: {
        id: "char1",
        name: "المحارب البطل",
        class: "soldier",
        level: 5,
        health: 100,
        maxHealth: 100,
        energy: 50,
        maxEnergy: 50,
        skills: ["اعتداء قوي", "درع واقي"],
        equipment: ["بندقية هجوم", "درع متطور"]
      },
      isOnline: true,
      isReady: true,
      alliance: "تحالف النصر"
    }
  ]);

  const [cityZones] = useState<CityZone[]>([
    {
      id: "zone1",
      name: "المنطقة التجارية",
      difficulty: "easy",
      liberationProgress: 0,
      isLiberated: false,
      requiredPlayers: 1,
      enemies: [
        {
          id: "enemy1",
          type: "robot",
          name: "روبوت استطلاع",
          health: 50,
          maxHealth: 50,
          damage: 15,
          special: "فحص أمني",
          x: 100,
          y: 150,
          isActive: true
        }
      ],
      rewards: { xp: 100, gold: 150, items: ["ذخيرة", "طقم إسعافات"] }
    },
    {
      id: "zone2", 
      name: "المنطقة الصناعية",
      difficulty: "medium",
      liberationProgress: 0,
      isLiberated: false,
      requiredPlayers: 2,
      enemies: [
        {
          id: "enemy2",
          type: "hybrid",
          name: "وحش الآلة",
          health: 120,
          maxHealth: 120,
          damage: 25,
          special: "هجوم كاسح",
          x: 200,
          y: 200,
          isActive: true
        }
      ],
      rewards: { xp: 200, gold: 300, items: ["سلاح متطور", "درع معزز"] }
    },
    {
      id: "zone3",
      name: "مركز الذكاء الاصطناعي",
      difficulty: "extreme",
      liberationProgress: 0,
      isLiberated: false,
      requiredPlayers: 4,
      enemies: [
        {
          id: "enemy3",
          type: "traitor",
          name: "القائد الخائن",
          health: 200,
          maxHealth: 200,
          damage: 40,
          special: "نظام دفاعي",
          x: 300,
          y: 100,
          isActive: true
        }
      ],
      rewards: { xp: 500, gold: 1000, items: ["مفتاح المدينة", "تقنية متقدمة"] }
    }
  ]);

  const [selectedCharacterClass, setSelectedCharacterClass] = useState<Character['class']>('soldier');
  const [isVoiceChatEnabled, setIsVoiceChatEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [abilities, setAbilities] = useState({
    airstrike: 3,
    shield: 2,
    heal: 4
  });

  const gameTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (gameState.phase === 'battle') {
      gameTimer.current = setInterval(() => {
        setGameState(prev => {
          if (prev.timeRemaining <= 0) {
            return { ...prev, phase: 'defeat' };
          }
          return { ...prev, timeRemaining: prev.timeRemaining - 1 };
        });
      }, 1000);
    }

    return () => {
      if (gameTimer.current) {
        clearInterval(gameTimer.current);
      }
    };
  }, [gameState.phase]);

  const startBattle = () => {
    setGameState(prev => ({
      ...prev,
      phase: 'battle'
    }));
  };

  const selectZone = (zone: CityZone) => {
    if (zone.requiredPlayers <= players.length) {
      setGameState(prev => ({
        ...prev,
        selectedZone: zone
      }));
    }
  };

  const attackZone = () => {
    if (!gameState.selectedZone) return;
    
    const zone = gameState.selectedZone;
    const progress = Math.min(100, zone.liberationProgress + 25);
    
    setGameState(prev => ({
      ...prev,
      selectedZone: {
        ...zone,
        liberationProgress: progress,
        isLiberated: progress >= 100
      },
      cityProgress: prev.cityProgress + 5,
      score: prev.score + 100
    }));

    // Check for victory
    if (progress >= 100) {
      setGameState(prev => ({
        ...prev,
        resources: {
          gold: prev.resources.gold + zone.rewards.gold,
          energy: prev.resources.energy + 20,
          tech: prev.resources.tech + 10
        }
      }));
    }
  };

  const useAbility = (abilityType: keyof typeof abilities) => {
    if (abilities[abilityType] > 0) {
      setAbilities(prev => ({
        ...prev,
        [abilityType]: prev[abilityType] - 1
      }));
      
      // Apply ability effect
      switch(abilityType) {
        case 'airstrike':
          attackZone();
          break;
        case 'shield':
          // Increase defense
          break;
        case 'heal':
          // Heal players
          break;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEnemyIcon = (type: Enemy['type']) => {
    switch(type) {
      case 'robot': return '🤖';
      case 'hybrid': return '👹';
      case 'traitor': return '🔫';
      default: return '⚡';
    }
  };

  const getDifficultyColor = (difficulty: CityZone['difficulty']) => {
    switch(difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-orange-600 bg-orange-100';
      case 'extreme': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (gameState.phase === 'preparation') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 text-white p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              🏙️ استعادة المدينة - نسخة متقدمة
            </h1>
            <p className="text-gray-300">محاربة الذكاء الاصطناعي واستعادة الحرية</p>
          </div>

          {/* Character Selection */}
          <Card className="bg-slate-800 border-red-700 mb-6 p-6">
            <h3 className="text-xl font-bold mb-4 text-red-400">اختيار الشخصية</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['soldier', 'engineer', 'medic', 'scout'] as const).map((classType) => (
                <Button
                  key={classType}
                  onClick={() => setSelectedCharacterClass(classType)}
                  variant={selectedCharacterClass === classType ? "default" : "outline"}
                  className={`h-20 flex flex-col ${
                    selectedCharacterClass === classType 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'border-gray-600 hover:border-red-500'
                  }`}
                >
                  <div className="text-2xl mb-1">
                    {classType === 'soldier' && '🪖'}
                    {classType === 'engineer' && '🔧'}
                    {classType === 'medic' && '🏥'}
                    {classType === 'scout' && '🔍'}
                  </div>
                  <span className="text-xs">
                    {classType === 'soldier' && 'جندي'}
                    {classType === 'engineer' && 'مهندس'}
                    {classType === 'medic' && 'طبيب'}
                    {classType === 'scout' && 'كشاف'}
                  </span>
                </Button>
              ))}
            </div>
          </Card>

          {/* Team Setup */}
          <Card className="bg-slate-800 border-red-700 mb-6 p-6">
            <h3 className="text-xl font-bold mb-4 text-red-400">تشكيل الفريق</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="bg-green-600 hover:bg-green-700 h-16">
                <Users className="w-6 h-6 mr-2" />
                لعب منفرد ⚡
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 h-16">
                <Radio className="w-6 h-6 mr-2" />
                انضمام عشوائي
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700 h-16">
                <UserPlus className="w-6 h-6 mr-2" />
                دعوة أصدقاء
              </Button>
            </div>
          </Card>

          {/* Voice Chat Setup */}
          <Card className="bg-slate-800 border-red-700 mb-6 p-6">
            <h3 className="text-xl font-bold mb-4 text-red-400">إعدادات الصوت</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 space-x-reverse">
                <Button
                  onClick={() => setIsVoiceChatEnabled(!isVoiceChatEnabled)}
                  variant={isVoiceChatEnabled ? "default" : "outline"}
                  className={isVoiceChatEnabled ? "bg-green-600" : ""}
                >
                  {isVoiceChatEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  {isVoiceChatEnabled ? "الصوت نشط" : "الصوت معطل"}
                </Button>
                <Button
                  onClick={() => setIsMuted(!isMuted)}
                  variant={isMuted ? "destructive" : "outline"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  {isMuted ? "مكتوم" : "صوت"}
                </Button>
              </div>
            </div>
          </Card>

          {/* Start Game */}
          <div className="text-center">
            <Button
              onClick={startBattle}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-xl px-12 py-4 h-auto"
            >
              <Play className="w-6 h-6 mr-2" />
              بدء المعركة! 🔥
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Game Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-red-400">استعادة المدينة</h1>
            <p className="text-gray-300">الموجة {gameState.wave}/{gameState.totalWaves}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-yellow-400">{formatTime(gameState.timeRemaining)}</div>
            <div className="text-sm text-gray-300">النقاط: {gameState.score}</div>
          </div>
        </div>

        {/* Resources */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-slate-800 border-yellow-600 p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Coins className="w-6 h-6 text-yellow-400" />
              <div>
                <div className="text-lg font-bold text-yellow-400">{gameState.resources.gold}</div>
                <div className="text-xs text-gray-300">ذهب</div>
              </div>
            </div>
          </Card>
          <Card className="bg-slate-800 border-blue-600 p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Battery className="w-6 h-6 text-blue-400" />
              <div>
                <div className="text-lg font-bold text-blue-400">{gameState.resources.energy}</div>
                <div className="text-xs text-gray-300">طاقة</div>
              </div>
            </div>
          </Card>
          <Card className="bg-slate-800 border-purple-600 p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Cpu className="w-6 h-6 text-purple-400" />
              <div>
                <div className="text-lg font-bold text-purple-400">{gameState.resources.tech}</div>
                <div className="text-xs text-gray-300">تقنية</div>
              </div>
            </div>
          </Card>
        </div>

        {/* City Progress */}
        <Card className="bg-slate-800 border-green-600 mb-6 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-400 font-bold">تقدم تحرير المدينة</span>
            <span className="text-green-400">{gameState.cityProgress}%</span>
          </div>
          <Progress value={gameState.cityProgress} className="h-3" />
        </Card>

        {/* City Zones Map */}
        <Card className="bg-slate-800 border-red-700 mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-red-400">خريطة المدينة</h3>
            <Button
              onClick={() => setShowMap(!showMap)}
              variant="outline"
              className="border-red-600"
            >
              <Map className="w-4 h-4 mr-2" />
              {showMap ? 'إخفاء الخريطة' : 'عرض الخريطة'}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cityZones.map((zone) => (
              <Card
                key={zone.id}
                className={`cursor-pointer transition-all duration-300 ${
                  gameState.selectedZone?.id === zone.id
                    ? 'bg-red-700 border-red-500 scale-105'
                    : zone.isLiberated
                    ? 'bg-green-800 border-green-600'
                    : 'bg-slate-700 border-gray-600 hover:border-red-500'
                } p-4`}
                onClick={() => selectZone(zone)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-white">{zone.name}</h4>
                  <Badge className={getDifficultyColor(zone.difficulty)}>
                    {zone.difficulty === 'easy' && 'سهل'}
                    {zone.difficulty === 'medium' && 'متوسط'}
                    {zone.difficulty === 'hard' && 'صعب'}
                    {zone.difficulty === 'extreme' && 'خطير'}
                  </Badge>
                </div>
                
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>التحرير</span>
                    <span>{zone.liberationProgress}%</span>
                  </div>
                  <Progress value={zone.liberationProgress} className="h-2" />
                </div>

                <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-300 mb-3">
                  <Users className="w-4 h-4" />
                  <span>يتطلب {zone.requiredPlayers} لاعبين</span>
                </div>

                <div className="flex space-x-1 space-x-reverse mb-3">
                  {zone.enemies.map((enemy) => (
                    <span key={enemy.id} className="text-lg">
                      {getEnemyIcon(enemy.type)}
                    </span>
                  ))}
                </div>

                <div className="text-xs text-gray-400">
                  المكافآت: {zone.rewards.xp} XP, {zone.rewards.gold} ذهب
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Battle Actions */}
        {gameState.selectedZone && (
          <Card className="bg-slate-800 border-orange-600 mb-6 p-6">
            <h3 className="text-xl font-bold text-orange-400 mb-4">عمليات القتال</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                onClick={attackZone}
                className="bg-red-600 hover:bg-red-700 h-16"
                disabled={gameState.selectedZone.isLiberated}
              >
                <Swords className="w-6 h-6 mb-1" />
                مهاجمة المنطقة
              </Button>
              
              <Button
                onClick={() => useAbility('airstrike')}
                className="bg-orange-600 hover:bg-orange-700 h-16"
                disabled={abilities.airstrike === 0}
              >
                <Target className="w-6 h-6 mb-1" />
                ضربة جوية ({abilities.airstrike})
              </Button>
              
              <Button
                onClick={() => useAbility('shield')}
                className="bg-blue-600 hover:bg-blue-700 h-16"
                disabled={abilities.shield === 0}
              >
                <Shield className="w-6 h-6 mb-1" />
                درع واقي ({abilities.shield})
              </Button>
              
              <Button
                onClick={() => useAbility('heal')}
                className="bg-green-600 hover:bg-green-700 h-16"
                disabled={abilities.heal === 0}
              >
                <Zap className="w-6 h-6 mb-1" />
                شفاء ({abilities.heal})
              </Button>
            </div>
          </Card>
        )}

        {/* Team Status */}
        <Card className="bg-slate-800 border-blue-600 p-6">
          <h3 className="text-xl font-bold text-blue-400 mb-4">حالة الفريق</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {players.map((player) => (
              <div key={player.id} className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div className={`w-3 h-3 rounded-full ${player.isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="font-bold">{player.name}</span>
                    {player.alliance && (
                      <Badge className="bg-purple-600 text-xs">
                        {player.alliance}
                      </Badge>
                    )}
                  </div>
                  <Badge className="bg-yellow-600">
                    مستوى {player.character.level}
                  </Badge>
                </div>
                
                <div className="text-sm text-gray-300 mb-2">
                  {player.character.name} ({player.character.class === 'soldier' && 'جندي'}
                  {player.character.class === 'engineer' && 'مهندس'}
                  {player.character.class === 'medic' && 'طبيب'}
                  {player.character.class === 'scout' && 'كشاف'})
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>الصحة</span>
                    <span>{player.character.health}/{player.character.maxHealth}</span>
                  </div>
                  <Progress value={(player.character.health / player.character.maxHealth) * 100} className="h-2" />
                  
                  <div className="flex items-center justify-between text-xs">
                    <span>الطاقة</span>
                    <span>{player.character.energy}/{player.character.maxEnergy}</span>
                  </div>
                  <Progress value={(player.character.energy / player.character.maxEnergy) * 100} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedReclaimCity;