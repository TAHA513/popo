import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Zap, Shield, Target, Clock, Trophy, Flame, Bot, Heart, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Real Game Types with Physics
interface Player {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  weapon: Weapon;
  direction: number; // in radians
  speed: number;
  score: number;
  kills: number;
}

interface Enemy {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  type: 'drone' | 'robot' | 'tank' | 'commander';
  direction: number;
  isActive: boolean;
  lastShot: number;
  target: { x: number; y: number } | null;
  pathIndex: number;
  aiState: 'patrol' | 'chase' | 'attack' | 'retreat';
}

interface Bullet {
  id: string;
  x: number;
  y: number;
  direction: number;
  speed: number;
  damage: number;
  isPlayerBullet: boolean;
  trail: { x: number; y: number }[];
}

interface Weapon {
  name: string;
  damage: number;
  fireRate: number; // shots per second
  bulletSpeed: number;
  energyCost: number;
  range: number;
  icon: string;
}

interface GameMap {
  width: number;
  height: number;
  obstacles: { x: number; y: number; width: number; height: number }[];
  spawnPoints: { x: number; y: number }[];
}

const WEAPONS: Weapon[] = [
  { name: 'بندقية البلازما', damage: 25, fireRate: 3, bulletSpeed: 8, energyCost: 5, range: 200, icon: '🔫' },
  { name: 'ليزر عالي الطاقة', damage: 40, fireRate: 2, bulletSpeed: 12, energyCost: 10, range: 250, icon: '⚡' },
  { name: 'مدفع الأيونات', damage: 60, fireRate: 1, bulletSpeed: 6, energyCost: 15, range: 180, icon: '💥' },
  { name: 'صاروخ موجه', damage: 100, fireRate: 0.5, bulletSpeed: 4, energyCost: 25, range: 300, icon: '🚀' },
];

const GAME_MAP: GameMap = {
  width: 800,
  height: 600,
  obstacles: [
    { x: 150, y: 100, width: 60, height: 60 },
    { x: 300, y: 180, width: 80, height: 40 },
    { x: 500, y: 120, width: 50, height: 80 },
    { x: 650, y: 250, width: 70, height: 50 },
    { x: 200, y: 350, width: 90, height: 60 },
    { x: 450, y: 400, width: 60, height: 70 },
  ],
  spawnPoints: [
    { x: 50, y: 50 }, { x: 750, y: 50 }, { x: 750, y: 550 }, 
    { x: 50, y: 550 }, { x: 400, y: 50 }, { x: 400, y: 550 }
  ]
};

export default function RealAIWarGame() {
  const { user } = useAuth();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef({ x: 0, y: 0, down: false });
  const lastShotRef = useRef(0);

  // Game State
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameOver' | 'victory'>('menu');
  const [player, setPlayer] = useState<Player>({
    x: 100,
    y: 300,
    health: 100,
    maxHealth: 100,
    energy: 100,
    maxEnergy: 100,
    weapon: WEAPONS[0],
    direction: 0,
    speed: 3,
    score: 0,
    kills: 0
  });

  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [wave, setWave] = useState(1);
  const [enemiesKilled, setEnemiesKilled] = useState(0);
  const [gameTime, setGameTime] = useState(0);

  // Utility Functions
  const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  };

  const angle = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    return Math.atan2(to.y - from.y, to.x - from.x);
  };

  const isColliding = (obj1: any, obj2: any, size1 = 20, size2 = 20) => {
    return distance(obj1, obj2) < (size1 + size2) / 2;
  };

  const checkObstacleCollision = (x: number, y: number, size = 20) => {
    for (const obstacle of GAME_MAP.obstacles) {
      if (x - size/2 < obstacle.x + obstacle.width &&
          x + size/2 > obstacle.x &&
          y - size/2 < obstacle.y + obstacle.height &&
          y + size/2 > obstacle.y) {
        return true;
      }
    }
    return false;
  };

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        mouseRef.current.x = e.clientX - rect.left;
        mouseRef.current.y = e.clientY - rect.top;
      }
    };

    const handleMouseDown = () => {
      mouseRef.current.down = true;
    };

    const handleMouseUp = () => {
      mouseRef.current.down = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Spawn Enemies
  const spawnEnemyWave = useCallback(() => {
    const newEnemies: Enemy[] = [];
    const enemyCount = Math.min(3 + wave, 8);
    
    for (let i = 0; i < enemyCount; i++) {
      const spawnPoint = GAME_MAP.spawnPoints[Math.floor(Math.random() * GAME_MAP.spawnPoints.length)];
      const enemyTypes: Enemy['type'][] = ['drone', 'robot', 'tank', 'commander'];
      const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      
      let health, speed, damage;
      switch (type) {
        case 'drone':
          health = 30; speed = 2; damage = 15; break;
        case 'robot':
          health = 50; speed = 1.5; damage = 20; break;
        case 'tank':
          health = 80; speed = 1; damage = 30; break;
        case 'commander':
          health = 120; speed = 1.2; damage = 25; break;
      }

      newEnemies.push({
        id: `enemy_${Date.now()}_${i}`,
        x: spawnPoint.x,
        y: spawnPoint.y,
        health,
        maxHealth: health,
        speed,
        damage,
        type,
        direction: Math.random() * Math.PI * 2,
        isActive: true,
        lastShot: 0,
        target: null,
        pathIndex: 0,
        aiState: 'patrol'
      });
    }
    
    setEnemies(prev => [...prev, ...newEnemies]);
  }, [wave]);

  // Player Shooting
  const shootBullet = useCallback(() => {
    const now = Date.now();
    const timeSinceLastShot = now - lastShotRef.current;
    const shotInterval = 1000 / player.weapon.fireRate;

    if (timeSinceLastShot >= shotInterval && player.energy >= player.weapon.energyCost) {
      const direction = angle(player, mouseRef.current);
      const bulletId = `bullet_${now}`;
      
      setBullets(prev => [...prev, {
        id: bulletId,
        x: player.x,
        y: player.y,
        direction,
        speed: player.weapon.bulletSpeed,
        damage: player.weapon.damage,
        isPlayerBullet: true,
        trail: []
      }]);

      setPlayer(prev => ({
        ...prev,
        energy: Math.max(0, prev.energy - prev.weapon.energyCost),
        direction
      }));

      lastShotRef.current = now;
    }
  }, [player]);

  // Enemy AI
  const updateEnemyAI = useCallback((enemy: Enemy, playerPos: { x: number; y: number }) => {
    const distToPlayer = distance(enemy, playerPos);
    const now = Date.now();

    // AI State Machine
    switch (enemy.aiState) {
      case 'patrol':
        if (distToPlayer < 150) {
          enemy.aiState = 'chase';
          enemy.target = playerPos;
        } else {
          // Random patrol movement
          if (!enemy.target || distance(enemy, enemy.target) < 30) {
            enemy.target = {
              x: Math.random() * GAME_MAP.width,
              y: Math.random() * GAME_MAP.height
            };
          }
        }
        break;

      case 'chase':
        enemy.target = playerPos;
        if (distToPlayer < 80) {
          enemy.aiState = 'attack';
        } else if (distToPlayer > 200) {
          enemy.aiState = 'patrol';
        }
        break;

      case 'attack':
        enemy.target = playerPos;
        if (distToPlayer < 100 && now - enemy.lastShot > 1500) {
          // Enemy shoots
          const direction = angle(enemy, playerPos);
          setBullets(prev => [...prev, {
            id: `enemy_bullet_${now}_${enemy.id}`,
            x: enemy.x,
            y: enemy.y,
            direction,
            speed: 4,
            damage: enemy.damage,
            isPlayerBullet: false,
            trail: []
          }]);
          enemy.lastShot = now;
        }
        if (distToPlayer > 120) {
          enemy.aiState = 'chase';
        }
        break;
    }

    // Move towards target
    if (enemy.target) {
      const targetAngle = angle(enemy, enemy.target);
      const newX = enemy.x + Math.cos(targetAngle) * enemy.speed;
      const newY = enemy.y + Math.sin(targetAngle) * enemy.speed;

      if (!checkObstacleCollision(newX, newY)) {
        enemy.x = Math.max(20, Math.min(GAME_MAP.width - 20, newX));
        enemy.y = Math.max(20, Math.min(GAME_MAP.height - 20, newY));
        enemy.direction = targetAngle;
      }
    }

    return enemy;
  }, []);

  // Game Update Loop
  const updateGame = useCallback(() => {
    if (gameState !== 'playing') return;

    // Update player movement
    setPlayer(prev => {
      let newX = prev.x;
      let newY = prev.y;
      let newEnergy = Math.min(prev.maxEnergy, prev.energy + 0.2); // Energy regeneration

      if (keysRef.current.has('w') || keysRef.current.has('arrowup')) {
        newY = Math.max(20, prev.y - prev.speed);
      }
      if (keysRef.current.has('s') || keysRef.current.has('arrowdown')) {
        newY = Math.min(GAME_MAP.height - 20, prev.y + prev.speed);
      }
      if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) {
        newX = Math.max(20, prev.x - prev.speed);
      }
      if (keysRef.current.has('d') || keysRef.current.has('arrowright')) {
        newX = Math.min(GAME_MAP.width - 20, prev.x + prev.speed);
      }

      // Check obstacle collision
      if (checkObstacleCollision(newX, newY)) {
        newX = prev.x;
        newY = prev.y;
      }

      return { ...prev, x: newX, y: newY, energy: newEnergy };
    });

    // Shooting
    if (mouseRef.current.down || keysRef.current.has(' ')) {
      shootBullet();
    }

    // Update enemies
    setEnemies(prev => prev.map(enemy => updateEnemyAI(enemy, player)).filter(enemy => enemy.health > 0));

    // Update bullets
    setBullets(prev => {
      return prev
        .map(bullet => {
          const newX = bullet.x + Math.cos(bullet.direction) * bullet.speed;
          const newY = bullet.y + Math.sin(bullet.direction) * bullet.speed;
          
          // Add to trail
          bullet.trail.push({ x: bullet.x, y: bullet.y });
          if (bullet.trail.length > 5) bullet.trail.shift();

          return { ...bullet, x: newX, y: newY };
        })
        .filter(bullet => 
          bullet.x > 0 && bullet.x < GAME_MAP.width && 
          bullet.y > 0 && bullet.y < GAME_MAP.height
        );
    });

    // Collision Detection
    setBullets(prev => {
      const remainingBullets: Bullet[] = [];
      
      for (const bullet of prev) {
        let bulletHit = false;

        if (bullet.isPlayerBullet) {
          // Check bullet vs enemies
          setEnemies(prevEnemies => 
            prevEnemies.map(enemy => {
              if (isColliding(bullet, enemy, 5, 25) && !bulletHit) {
                bulletHit = true;
                const newHealth = enemy.health - bullet.damage;
                if (newHealth <= 0) {
                  setPlayer(prevPlayer => ({
                    ...prevPlayer,
                    score: prevPlayer.score + 100,
                    kills: prevPlayer.kills + 1
                  }));
                  setEnemiesKilled(prev => prev + 1);
                }
                return { ...enemy, health: Math.max(0, newHealth) };
              }
              return enemy;
            })
          );
        } else {
          // Check bullet vs player
          if (isColliding(bullet, player, 5, 20) && !bulletHit) {
            bulletHit = true;
            setPlayer(prev => ({
              ...prev,
              health: Math.max(0, prev.health - bullet.damage)
            }));
          }
        }

        if (!bulletHit) {
          remainingBullets.push(bullet);
        }
      }

      return remainingBullets;
    });

    // Check wave completion
    if (enemies.length === 0 && enemiesKilled >= wave * 3) {
      setTimeout(() => {
        setWave(prev => prev + 1);
        setEnemiesKilled(0);
        spawnEnemyWave();
        toast({
          title: `موجة ${wave + 1}`,
          description: "موجة جديدة من الأعداء!",
        });
      }, 2000);
    }

    // Check game over
    if (player.health <= 0) {
      setGameState('gameOver');
    }

    // Update game time
    setGameTime(prev => prev + 1);
  }, [gameState, player, enemies, shootBullet, updateEnemyAI, spawnEnemyWave, wave, enemiesKilled, toast]);

  // Game Loop
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(updateGame, 1000 / 60); // 60 FPS
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameState, updateGame]);

  // Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Clear canvas
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (gameState === 'playing') {
        // Draw obstacles
        ctx.fillStyle = '#444';
        for (const obstacle of GAME_MAP.obstacles) {
          ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }

        // Draw bullets
        for (const bullet of bullets) {
          // Draw trail
          ctx.strokeStyle = bullet.isPlayerBullet ? '#00ff00' : '#ff0000';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let i = 0; i < bullet.trail.length - 1; i++) {
            const alpha = i / bullet.trail.length;
            ctx.globalAlpha = alpha;
            if (i === 0) {
              ctx.moveTo(bullet.trail[i].x, bullet.trail[i].y);
            } else {
              ctx.lineTo(bullet.trail[i].x, bullet.trail[i].y);
            }
          }
          ctx.stroke();
          ctx.globalAlpha = 1;

          // Draw bullet
          ctx.fillStyle = bullet.isPlayerBullet ? '#00ff00' : '#ff0000';
          ctx.beginPath();
          ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw enemies
        for (const enemy of enemies) {
          if (!enemy.isActive) continue;

          // Enemy body
          ctx.save();
          ctx.translate(enemy.x, enemy.y);
          ctx.rotate(enemy.direction);
          
          ctx.fillStyle = '#ff4444';
          ctx.fillRect(-15, -10, 30, 20);
          
          // Enemy weapon
          ctx.fillStyle = '#888';
          ctx.fillRect(15, -2, 10, 4);
          
          ctx.restore();

          // Health bar
          ctx.fillStyle = '#333';
          ctx.fillRect(enemy.x - 20, enemy.y - 25, 40, 5);
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(enemy.x - 20, enemy.y - 25, (enemy.health / enemy.maxHealth) * 40, 5);

          // Enemy type indicator
          ctx.fillStyle = '#fff';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          const typeEmoji = enemy.type === 'drone' ? '🛸' : 
                           enemy.type === 'robot' ? '🤖' : 
                           enemy.type === 'tank' ? '🚗' : '👑';
          ctx.fillText(typeEmoji, enemy.x, enemy.y - 30);
        }

        // Draw player
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.direction);
        
        // Player body
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(-12, -8, 24, 16);
        
        // Player weapon
        ctx.fillStyle = '#aaa';
        ctx.fillRect(12, -1, 8, 2);
        
        ctx.restore();

        // Player health bar
        ctx.fillStyle = '#333';
        ctx.fillRect(player.x - 20, player.y - 25, 40, 5);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(player.x - 20, player.y - 25, (player.health / player.maxHealth) * 40, 5);

        // Crosshair
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(mouseRef.current.x - 10, mouseRef.current.y);
        ctx.lineTo(mouseRef.current.x + 10, mouseRef.current.y);
        ctx.moveTo(mouseRef.current.x, mouseRef.current.y - 10);
        ctx.lineTo(mouseRef.current.x, mouseRef.current.y + 10);
        ctx.stroke();
      }

      requestAnimationFrame(render);
    };

    render();
  }, [gameState, player, enemies, bullets]);

  const startGame = () => {
    setGameState('playing');
    setPlayer(prev => ({ ...prev, health: prev.maxHealth, energy: prev.maxEnergy }));
    setEnemies([]);
    setBullets([]);
    setWave(1);
    setEnemiesKilled(0);
    setGameTime(0);
    spawnEnemyWave();
  };

  const pauseGame = () => {
    setGameState(gameState === 'paused' ? 'playing' : 'paused');
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
                حرب الذكاء الاصطناعي - نسخة حقيقية
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {gameState === 'playing' && (
                <Button onClick={pauseGame} variant="outline" size="sm">
                  {gameState === 'paused' ? 'استكمال' : 'إيقاف مؤقت'}
                </Button>
              )}
              <Badge variant="outline" className="border-red-500 text-red-400">
                الموجة: {wave}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Game Stats */}
        {gameState !== 'menu' && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-500/30">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-green-400">{player.health}</div>
                <div className="text-xs text-green-300">الصحة</div>
                <Progress value={(player.health / player.maxHealth) * 100} className="mt-1 h-1" />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-500/30">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-blue-400">{Math.round(player.energy)}</div>
                <div className="text-xs text-blue-300">الطاقة</div>
                <Progress value={(player.energy / player.maxEnergy) * 100} className="mt-1 h-1" />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-yellow-500/30">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-yellow-400">{player.score}</div>
                <div className="text-xs text-yellow-300">النقاط</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-500/30">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-red-400">{player.kills}</div>
                <div className="text-xs text-red-300">القتلى</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-500/30">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-purple-400">{enemies.length}</div>
                <div className="text-xs text-purple-300">الأعداء</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Game Canvas */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="border-2 border-red-500/50 rounded-lg bg-black cursor-crosshair"
              style={{ imageRendering: 'pixelated' }}
            />
            
            {gameState === 'menu' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg">
                <Card className="bg-gradient-to-br from-red-900/50 to-orange-900/30 border-red-500/30">
                  <CardHeader>
                    <CardTitle className="text-center text-red-400 text-xl">
                      حرب الذكاء الاصطناعي الحقيقية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <div className="text-gray-300 text-sm">
                      لعبة حرب حقيقية مع ذكاء اصطناعي متطور
                      <br />
                      تحكم: WASD أو الأسهم للحركة
                      <br />
                      إطلاق النار: اضغط بالماوس أو Space
                      <br />
                      الهدف: صمد أمام موجات الذكاء الاصطناعي
                    </div>
                    <Button onClick={startGame} className="bg-red-600 hover:bg-red-700">
                      <Target className="w-4 h-4 mr-2" />
                      ابدأ الحرب
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {gameState === 'paused' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
                <Card className="bg-gradient-to-br from-gray-900/50 to-black/30 border-gray-500/30">
                  <CardContent className="p-6 text-center">
                    <h3 className="text-xl font-bold text-gray-300 mb-4">اللعبة متوقفة</h3>
                    <Button onClick={pauseGame} className="bg-blue-600 hover:bg-blue-700">
                      استكمال اللعب
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {gameState === 'gameOver' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg">
                <Card className="bg-gradient-to-br from-red-900/50 to-gray-900/30 border-red-500/30">
                  <CardHeader>
                    <CardTitle className="text-center text-red-400 text-xl">
                      انتهت اللعبة!
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-yellow-400 font-bold">{player.score}</div>
                        <div className="text-gray-400">النقاط</div>
                      </div>
                      <div>
                        <div className="text-red-400 font-bold">{player.kills}</div>
                        <div className="text-gray-400">القتلى</div>
                      </div>
                      <div>
                        <div className="text-purple-400 font-bold">{wave}</div>
                        <div className="text-gray-400">الموجة</div>
                      </div>
                      <div>
                        <div className="text-blue-400 font-bold">{Math.round(gameTime / 60)}</div>
                        <div className="text-gray-400">الثواني</div>
                      </div>
                    </div>
                    <Button onClick={startGame} className="bg-red-600 hover:bg-red-700">
                      <Flame className="w-4 h-4 mr-2" />
                      لعبة جديدة
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Weapon Selection */}
        {gameState === 'playing' && (
          <Card className="bg-gradient-to-br from-gray-900/50 to-black/30 border-gray-500/30">
            <CardHeader>
              <CardTitle className="text-gray-400 text-center">الأسلحة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {WEAPONS.map((weapon, index) => (
                  <Button
                    key={index}
                    variant={player.weapon.name === weapon.name ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPlayer(prev => ({ ...prev, weapon }))}
                    className={`text-xs ${player.weapon.name === weapon.name ? 'bg-red-600' : ''}`}
                  >
                    <span className="mr-1">{weapon.icon}</span>
                    {weapon.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Controls Help */}
        <div className="mt-4 text-center text-gray-400 text-sm">
          <div>التحكم: WASD أو الأسهم للحركة | الماوس أو Space لإطلاق النار</div>
          <div>نصيحة: استخدم العوائق للاختباء من نيران الأعداء!</div>
        </div>
      </div>
    </div>
  );
}