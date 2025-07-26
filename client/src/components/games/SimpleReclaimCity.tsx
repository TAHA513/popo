import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Swords, 
  Shield, 
  Zap, 
  Trophy,
  Target,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Crown
} from "lucide-react";

interface SimpleReclaimCityProps {
  isMultiplayer: boolean;
  playerCount: number;
  onGameEnd: (score: number, pointsWon: number) => void;
}

interface Enemy {
  id: string;
  type: 'robot' | 'hybrid' | 'traitor';
  name: string;
  health: number;
  maxHealth: number;
  icon: string;
}

const SimpleReclaimCity: React.FC<SimpleReclaimCityProps> = ({ 
  isMultiplayer, 
  playerCount, 
  onGameEnd 
}) => {
  const [gamePhase, setGamePhase] = useState<'setup' | 'battle' | 'victory' | 'defeat'>('setup');
  const [playerHealth, setPlayerHealth] = useState(100);
  const [cityProgress, setCityProgress] = useState(0);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [currentWave, setCurrentWave] = useState(1);
  const [totalWaves] = useState(5);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const [enemies, setEnemies] = useState<Enemy[]>([
    {
      id: "enemy1",
      type: "robot",
      name: "روبوت استطلاع",
      health: 50,
      maxHealth: 50,
      icon: "🤖"
    },
    {
      id: "enemy2", 
      type: "hybrid",
      name: "وحش الآلة",
      health: 80,
      maxHealth: 80,
      icon: "👹"
    },
    {
      id: "enemy3",
      type: "traitor",
      name: "القائد الخائن", 
      health: 100,
      maxHealth: 100,
      icon: "🔫"
    }
  ]);

  const [resources, setResources] = useState({
    gold: 500,
    energy: 100,
    tech: 50
  });

  const [abilities, setAbilities] = useState({
    airstrike: 3,
    shield: 2,
    heal: 4
  });

  // Game timer
  useEffect(() => {
    if (gamePhase === 'battle' && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setGamePhase('defeat');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gamePhase, timeRemaining]);

  // Check victory condition
  useEffect(() => {
    if (cityProgress >= 100) {
      setGamePhase('victory');
      onGameEnd(score, Math.floor(score / 10));
    }
  }, [cityProgress, score, onGameEnd]);

  // Check defeat condition
  useEffect(() => {
    if (playerHealth <= 0) {
      setGamePhase('defeat');
      onGameEnd(score, Math.floor(score / 20));
    }
  }, [playerHealth, score, onGameEnd]);

  const startBattle = () => {
    setGamePhase('battle');
  };

  const attackEnemy = (enemyId: string) => {
    setEnemies(prev => prev.map(enemy => {
      if (enemy.id === enemyId && enemy.health > 0) {
        const newHealth = Math.max(0, enemy.health - 25);
        if (newHealth === 0) {
          setScore(s => s + 100);
          setCityProgress(p => Math.min(100, p + 10));
          setResources(r => ({
            ...r,
            gold: r.gold + 50,
            energy: Math.min(100, r.energy + 10)
          }));
        }
        return { ...enemy, health: newHealth };
      }
      return enemy;
    }));
    
    // Enemy counter-attack
    const damage = Math.floor(Math.random() * 15) + 5;
    setPlayerHealth(prev => Math.max(0, prev - damage));
  };

  const useAbility = (abilityType: keyof typeof abilities) => {
    if (abilities[abilityType] > 0) {
      setAbilities(prev => ({
        ...prev,
        [abilityType]: prev[abilityType] - 1
      }));
      
      switch(abilityType) {
        case 'airstrike':
          // Damage all enemies
          setEnemies(prev => prev.map(enemy => ({
            ...enemy,
            health: Math.max(0, enemy.health - 30)
          })));
          setScore(s => s + 150);
          setCityProgress(p => Math.min(100, p + 15));
          break;
        case 'shield':
          // Reduce incoming damage (visual effect only)
          break;
        case 'heal':
          setPlayerHealth(prev => Math.min(100, prev + 40));
          break;
      }
    }
  };

  const nextWave = () => {
    if (currentWave < totalWaves) {
      setCurrentWave(prev => prev + 1);
      // Reset enemies with higher health
      setEnemies(prev => prev.map(enemy => ({
        ...enemy,
        health: enemy.maxHealth + (currentWave * 20),
        maxHealth: enemy.maxHealth + (currentWave * 20)
      })));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (gamePhase === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 text-white p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              🏙️ استعادة المدينة
            </h1>
            <p className="text-gray-300">محاربة الذكاء الاصطناعي واستعادة الحرية</p>
          </div>

          {/* Character Selection */}
          <Card className="bg-slate-800 border-red-700 mb-6 p-6">
            <h3 className="text-xl font-bold mb-4 text-red-400">اختيار المحارب</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button className="h-20 flex flex-col bg-red-600 hover:bg-red-700">
                <div className="text-2xl mb-1">🪖</div>
                <span className="text-xs">جندي</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col border-gray-600">
                <div className="text-2xl mb-1">🔧</div>
                <span className="text-xs">مهندس</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col border-gray-600">
                <div className="text-2xl mb-1">🏥</div>
                <span className="text-xs">طبيب</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col border-gray-600">
                <div className="text-2xl mb-1">🔍</div>
                <span className="text-xs">كشاف</span>
              </Button>
            </div>
          </Card>

          {/* Voice Chat */}
          <Card className="bg-slate-800 border-red-700 mb-6 p-6">
            <h3 className="text-xl font-bold mb-4 text-red-400">إعدادات الصوت</h3>
            <div className="flex items-center justify-center space-x-4 space-x-reverse">
              <Button
                onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                variant={isVoiceEnabled ? "default" : "outline"}
                className={isVoiceEnabled ? "bg-green-600" : ""}
              >
                {isVoiceEnabled ? <Mic className="w-4 h-4 mr-2" /> : <MicOff className="w-4 h-4 mr-2" />}
                {isVoiceEnabled ? "الصوت نشط" : "الصوت معطل"}
              </Button>
              <Button
                onClick={() => setIsMuted(!isMuted)}
                variant={isMuted ? "destructive" : "outline"}
              >
                {isMuted ? <VolumeX className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                {isMuted ? "مكتوم" : "صوت"}
              </Button>
            </div>
          </Card>

          {/* Mission Brief */}
          <Card className="bg-slate-800 border-yellow-600 mb-6 p-6">
            <h3 className="text-xl font-bold mb-4 text-yellow-400">المهمة</h3>
            <div className="text-gray-300 space-y-2">
              <p>🎯 الهدف: تحرير المدينة من سيطرة الذكاء الاصطناعي</p>
              <p>⚔️ الأعداء: روبوتات، وحوش هجينة، خونة بشر</p>
              <p>⏱️ الوقت: 5 دقائق لإنجاز المهمة</p>
              <p>🏆 الفوز: الوصول إلى 100% تقدم تحرير المدينة</p>
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

  if (gamePhase === 'victory') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-green-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-4xl font-bold mb-4 text-green-400">النصر!</h1>
          <p className="text-xl mb-6">تم تحرير المدينة بنجاح!</p>
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <p className="text-lg">النقاط النهائية: <span className="text-yellow-400 font-bold">{score}</span></p>
            <p className="text-lg">العملات المكتسبة: <span className="text-green-400 font-bold">{Math.floor(score / 10)}</span></p>
          </div>
          <Button 
            onClick={() => onGameEnd(score, Math.floor(score / 10))}
            className="bg-green-600 hover:bg-green-700"
          >
            <Trophy className="w-4 h-4 mr-2" />
            جمع المكافآت
          </Button>
        </div>
      </div>
    );
  }

  if (gamePhase === 'defeat') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-rose-900 to-red-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">💀</div>
          <h1 className="text-4xl font-bold mb-4 text-red-400">الهزيمة</h1>
          <p className="text-xl mb-6">فشلت في تحرير المدينة...</p>
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <p className="text-lg">النقاط المحققة: <span className="text-yellow-400 font-bold">{score}</span></p>
            <p className="text-lg">العملات المكتسبة: <span className="text-green-400 font-bold">{Math.floor(score / 20)}</span></p>
          </div>
          <Button 
            onClick={() => onGameEnd(score, Math.floor(score / 20))}
            className="bg-red-600 hover:bg-red-700"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            المحاولة مرة أخرى
          </Button>
        </div>
      </div>
    );
  }

  // Battle Phase
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-red-400">استعادة المدينة</h1>
            <p className="text-gray-300">الموجة {currentWave}/{totalWaves}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-yellow-400">{formatTime(timeRemaining)}</div>
            <div className="text-sm text-gray-300">النقاط: {score}</div>
          </div>
        </div>

        {/* Player Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800 border-red-600 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-red-400 font-bold">الصحة</span>
              <span className="text-red-400">{playerHealth}%</span>
            </div>
            <Progress value={playerHealth} className="h-3" />
          </Card>
          
          <Card className="bg-slate-800 border-green-600 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-400 font-bold">تقدم المدينة</span>
              <span className="text-green-400">{cityProgress}%</span>
            </div>
            <Progress value={cityProgress} className="h-3" />
          </Card>

          <Card className="bg-slate-800 border-yellow-600 p-4">
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-400">{resources.gold}</div>
              <div className="text-xs text-gray-300">ذهب</div>
            </div>
          </Card>

          <Card className="bg-slate-800 border-blue-600 p-4">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">{resources.energy}</div>
              <div className="text-xs text-gray-300">طاقة</div>
            </div>
          </Card>
        </div>

        {/* Enemies */}
        <Card className="bg-slate-800 border-orange-600 mb-6 p-6">
          <h3 className="text-xl font-bold text-orange-400 mb-4">الأعداء</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {enemies.map((enemy) => (
              <div key={enemy.id} className="bg-slate-700 rounded-lg p-4">
                <div className="text-center mb-3">
                  <div className="text-3xl mb-2">{enemy.icon}</div>
                  <h4 className="font-bold text-white">{enemy.name}</h4>
                  <Badge className={`mt-1 ${
                    enemy.type === 'robot' ? 'bg-blue-600' :
                    enemy.type === 'hybrid' ? 'bg-purple-600' : 'bg-red-600'
                  }`}>
                    {enemy.type === 'robot' && 'روبوت'}
                    {enemy.type === 'hybrid' && 'هجين'}
                    {enemy.type === 'traitor' && 'خائن'}
                  </Badge>
                </div>
                
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>الصحة</span>
                    <span>{enemy.health}/{enemy.maxHealth}</span>
                  </div>
                  <Progress value={(enemy.health / enemy.maxHealth) * 100} className="h-2" />
                </div>

                <Button
                  onClick={() => attackEnemy(enemy.id)}
                  disabled={enemy.health <= 0}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  <Swords className="w-4 h-4 mr-2" />
                  {enemy.health > 0 ? 'مهاجمة' : 'مهزوم'}
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Abilities */}
        <Card className="bg-slate-800 border-blue-600 p-6">
          <h3 className="text-xl font-bold text-blue-400 mb-4">القدرات الخاصة</h3>
          <div className="grid grid-cols-3 gap-4">
            <Button
              onClick={() => useAbility('airstrike')}
              disabled={abilities.airstrike === 0}
              className="bg-orange-600 hover:bg-orange-700 h-16"
            >
              <Target className="w-6 h-6 mb-1" />
              ضربة جوية ({abilities.airstrike})
            </Button>
            
            <Button
              onClick={() => useAbility('shield')}
              disabled={abilities.shield === 0}
              className="bg-blue-600 hover:bg-blue-700 h-16"
            >
              <Shield className="w-6 h-6 mb-1" />
              درع واقي ({abilities.shield})
            </Button>
            
            <Button
              onClick={() => useAbility('heal')}
              disabled={abilities.heal === 0}
              className="bg-green-600 hover:bg-green-700 h-16"
            >
              <Zap className="w-6 h-6 mb-1" />
              شفاء ({abilities.heal})
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SimpleReclaimCity;