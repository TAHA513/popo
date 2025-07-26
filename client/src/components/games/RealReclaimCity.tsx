import React, { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import SimpleAudioManager from "./SimpleAudioManager";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Play, 
  Trophy,
  Crown,
  Star
} from "lucide-react";

interface RealReclaimCityProps {
  isMultiplayer: boolean;
  playerCount: number;
  onGameEnd: (score: number, pointsWon: number) => void;
}

interface GameState {
  phase: 'setup' | 'battle' | 'victory' | 'defeat';
  playerHealth: number;
  cityProgress: number;
  score: number;
  timeRemaining: number;
  enemiesKilled: number;
}

class GameScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private enemies!: Phaser.Physics.Arcade.Group;
  private bullets!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: any;
  private fireKey!: Phaser.Input.Keyboard.Key;
  private gameState: GameState;
  private onStateUpdate: (state: GameState) => void;
  private lastFired: number = 0;
  private cityZones!: Phaser.Physics.Arcade.Group;
  private background!: Phaser.GameObjects.TileSprite;
  private explosions!: Phaser.Physics.Arcade.Group;
  private healthBar!: Phaser.GameObjects.Graphics;
  private progressBar!: Phaser.GameObjects.Graphics;
  private audioManager!: SimpleAudioManager;

  constructor(gameState: GameState, onStateUpdate: (state: GameState) => void) {
    super({ key: 'GameScene' });
    this.gameState = gameState;
    this.onStateUpdate = onStateUpdate;
  }

  preload() {
    // Create colored rectangles as placeholders for sprites
    this.load.image('player', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAABklEQVR4nGIAAAmAApDGjSzpAAAAAElFTkSuQmCC');
    
    // Create simple colored shapes for game objects
    this.createSimpleSprites();
  }

  createSimpleSprites() {
    // Player sprite (blue square)
    const playerGraphics = this.add.graphics();
    playerGraphics.fillStyle(0x00ff00);
    playerGraphics.fillRect(0, 0, 32, 32);
    playerGraphics.generateTexture('player', 32, 32);
    playerGraphics.destroy();

    // Enemy robot (red square)
    const robotGraphics = this.add.graphics();
    robotGraphics.fillStyle(0xff0000);
    robotGraphics.fillRect(0, 0, 24, 24);
    robotGraphics.generateTexture('robot', 24, 24);
    robotGraphics.destroy();

    // Enemy hybrid (purple square)
    const hybridGraphics = this.add.graphics();
    hybridGraphics.fillStyle(0x8000ff);
    hybridGraphics.fillRect(0, 0, 28, 28);
    hybridGraphics.generateTexture('hybrid', 28, 28);
    hybridGraphics.destroy();

    // Enemy traitor (orange square)
    const traitorGraphics = this.add.graphics();
    traitorGraphics.fillStyle(0xff8000);
    traitorGraphics.fillRect(0, 0, 26, 26);
    traitorGraphics.generateTexture('traitor', 26, 26);
    traitorGraphics.destroy();

    // Bullet (yellow circle)
    const bulletGraphics = this.add.graphics();
    bulletGraphics.fillStyle(0xffff00);
    bulletGraphics.fillCircle(3, 3, 3);
    bulletGraphics.generateTexture('bullet', 6, 6);
    bulletGraphics.destroy();

    // Explosion effect (orange circle)
    const explosionGraphics = this.add.graphics();
    explosionGraphics.fillStyle(0xff4400);
    explosionGraphics.fillCircle(15, 15, 15);
    explosionGraphics.generateTexture('explosion', 30, 30);
    explosionGraphics.destroy();

    // City zone (gray rectangle)
    const zoneGraphics = this.add.graphics();
    zoneGraphics.fillStyle(0x666666);
    zoneGraphics.fillRect(0, 0, 80, 80);
    zoneGraphics.generateTexture('zone', 80, 80);
    zoneGraphics.destroy();
  }

  create() {
    // Initialize audio
    this.audioManager = new SimpleAudioManager();
    this.audioManager.play('background');
    
    // Set camera background color to sky blue
    this.cameras.main.setBackgroundColor('#87CEEB');
    
    // Create large visible background
    const backgroundGraphics = this.add.graphics();
    backgroundGraphics.fillStyle(0x87CEEB); // Sky blue
    backgroundGraphics.fillRect(0, 0, 800, 600);
    
    // Add large ground
    const groundGraphics = this.add.graphics();
    groundGraphics.fillStyle(0x228B22); // Green
    groundGraphics.fillRect(0, 500, 800, 100);
    
    // Add large buildings
    for (let i = 0; i < 6; i++) {
      const x = i * 130 + 65;
      const height = 150 + Math.random() * 200;
      const buildingGraphics = this.add.graphics();
      buildingGraphics.fillStyle(0x696969); // Gray
      buildingGraphics.lineStyle(3, 0x000000); // Black border
      buildingGraphics.fillRect(x - 50, 500 - height, 100, height);
      buildingGraphics.strokeRect(x - 50, 500 - height, 100, height);
    }
    
    // Add large title text
    this.add.text(400, 50, 'استعادة المدينة', {
      fontSize: '48px',
      color: '#000000',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    // Add visible controls text
    this.add.text(400, 100, 'WASD للحركة - SPACE للرماية', {
      fontSize: '24px',
      color: '#FFFFFF',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    // Use existing tileSprite for scrolling effect
    this.background = this.add.tileSprite(0, 0, 800, 600, 'zone');
    this.background.setTint(0x87CEEB);
    this.background.setAlpha(0.3); // Make it semi-transparent

    // Create large visible player
    this.player = this.physics.add.sprite(400, 450, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setScale(3); // Much larger player
    this.player.setTint(0x0000FF); // Blue color

    // Create groups
    this.enemies = this.physics.add.group();
    this.bullets = this.physics.add.group();
    this.explosions = this.physics.add.group();
    this.cityZones = this.physics.add.group();

    // Create large visible city zones to liberate
    for (let i = 0; i < 3; i++) {
      const zone = this.cityZones.create(
        150 + (i * 250),
        300,
        'zone'
      );
      zone.setTint(0xFF0000); // Red color for visibility
      zone.setScale(2); // Larger zones
      zone.body.setImmovable(true);
    }

    // Input setup
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,S,A,D');
    this.fireKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Mouse/touch shooting
    this.input.on('pointerdown', this.shootAtPointer, this);

    // Collisions
    this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, undefined, this);
    this.physics.add.overlap(this.player, this.enemies, this.playerHitByEnemy, undefined, this);
    this.physics.add.overlap(this.player, this.cityZones, this.playerTouchZone, undefined, this);

    // UI Elements
    this.createUI();

    // Spawn enemies
    this.spawnEnemies();

    // Game timer
    this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true
    });
  }

  createUI() {
    // Health bar
    this.healthBar = this.add.graphics();
    this.updateHealthBar();

    // Progress bar
    this.progressBar = this.add.graphics();
    this.updateProgressBar();

    // UI Text
    this.add.text(10, 10, 'استعادة المدينة', {
      fontSize: '24px',
      color: '#000000',
      fontFamily: 'Arial'
    });

    this.add.text(10, 40, 'WASD أو الأسهم للحركة | مسطرة أو النقر للرماية', {
      fontSize: '12px',
      color: '#333333',
      fontFamily: 'Arial'
    });
  }

  updateHealthBar() {
    this.healthBar.clear();
    this.healthBar.fillStyle(0x000000);
    this.healthBar.fillRect(10, 70, 204, 24);
    this.healthBar.fillStyle(0xff0000);
    this.healthBar.fillRect(12, 72, (this.gameState.playerHealth / 100) * 200, 20);
  }

  updateProgressBar() {
    this.progressBar.clear();
    this.progressBar.fillStyle(0x000000);
    this.progressBar.fillRect(10, 100, 204, 24);
    this.progressBar.fillStyle(0x00ff00);
    this.progressBar.fillRect(12, 102, (this.gameState.cityProgress / 100) * 200, 20);
  }

  spawnEnemies() {
    // Spawn different enemy types
    const enemyTypes = ['robot', 'hybrid', 'traitor'];
    
    for (let i = 0; i < 3; i++) {
      const enemyType = Phaser.Math.RND.pick(enemyTypes);
      const enemy = this.enemies.create(
        Phaser.Math.Between(50, 750),
        Phaser.Math.Between(50, 150),
        enemyType
      );
      
      enemy.setData('type', enemyType);
      enemy.setData('health', enemyType === 'robot' ? 1 : enemyType === 'hybrid' ? 2 : 3);
      enemy.setScale(1.1);
      
      // Enemy AI movement
      this.physics.moveToObject(enemy, this.player, 50);
    }

    // Continue spawning enemies
    this.time.delayedCall(3000, this.spawnEnemies, [], this);
  }

  shootAtPointer(pointer: Phaser.Input.Pointer) {
    this.shoot(pointer.x, pointer.y);
  }

  shoot(targetX?: number, targetY?: number) {
    const now = this.time.now;
    if (now - this.lastFired < 200) return; // Rate limit
    
    this.lastFired = now;
    
    // Play shoot sound
    this.audioManager.play('shoot');
    
    const bullet = this.bullets.create(this.player.x, this.player.y, 'bullet');
    bullet.setScale(1.5);
    
    if (targetX !== undefined && targetY !== undefined) {
      // Shoot towards target
      this.physics.moveToObject(bullet, { x: targetX, y: targetY }, 400);
    } else {
      // Shoot upward
      bullet.setVelocityY(-400);
    }
    
    // Remove bullet after 2 seconds
    this.time.delayedCall(2000, () => {
      if (bullet.active) bullet.destroy();
    });
  }

  bulletHitEnemy(bullet: any, enemy: any) {
    // Play explosion sound
    this.audioManager.play('explosion');
    
    // Create explosion effect
    const explosion = this.explosions.create(enemy.x, enemy.y, 'explosion');
    explosion.setScale(0.1);
    this.tweens.add({
      targets: explosion,
      scaleX: 1,
      scaleY: 1,
      alpha: 0,
      duration: 300,
      onComplete: () => explosion.destroy()
    });

    // Damage enemy
    const health = enemy.getData('health') - 1;
    enemy.setData('health', health);
    
    if (health <= 0) {
      enemy.destroy();
      this.gameState.enemiesKilled++;
      this.gameState.score += 100;
      this.gameState.cityProgress = Math.min(100, this.gameState.cityProgress + 5);
      
      if (this.gameState.cityProgress >= 100) {
        this.gameState.phase = 'victory';
        this.audioManager.play('victory');
      }
    } else {
      // Enemy takes damage - flash red
      enemy.setTint(0xff0000);
      this.time.delayedCall(100, () => enemy.clearTint());
    }
    
    bullet.destroy();
    this.onStateUpdate(this.gameState);
  }

  playerHitByEnemy(player: any, enemy: any) {
    // Play hit sound
    this.audioManager.play('hit');
    
    // Player takes damage
    this.gameState.playerHealth = Math.max(0, this.gameState.playerHealth - 10);
    
    // Flash player red
    player.setTint(0xff0000);
    this.time.delayedCall(200, () => player.clearTint());
    
    // Check for defeat
    if (this.gameState.playerHealth <= 0) {
      this.gameState.phase = 'defeat';
      this.audioManager.play('defeat');
    }
    
    // Push enemy away
    this.physics.moveToObject(enemy, player, -100);
    
    this.onStateUpdate(this.gameState);
  }

  playerTouchZone(player: any, zone: any) {
    // Liberate zone
    zone.setTint(0x00ff00);
    this.gameState.cityProgress = Math.min(100, this.gameState.cityProgress + 10);
    this.gameState.score += 50;
    
    // Remove zone after liberation
    this.time.delayedCall(500, () => zone.destroy());
    
    this.onStateUpdate(this.gameState);
  }

  updateTimer() {
    this.gameState.timeRemaining--;
    
    if (this.gameState.timeRemaining <= 0) {
      this.gameState.phase = 'defeat';
    }
    
    this.onStateUpdate(this.gameState);
  }

  update() {
    if (this.gameState.phase !== 'battle') return;

    // Player movement
    const speed = 200;
    
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.player.setVelocityX(-speed);
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.player.setVelocityX(speed);
    } else {
      this.player.setVelocityX(0);
    }
    
    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      this.player.setVelocityY(-speed);
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      this.player.setVelocityY(speed);
    } else {
      this.player.setVelocityY(0);
    }

    // Shooting
    if (this.fireKey.isDown) {
      this.shoot();
    }

    // Update UI
    this.updateHealthBar();
    this.updateProgressBar();

    // Scroll background
    this.background.tilePositionY -= 0.5;

    // Update enemy AI
    this.enemies.children.entries.forEach((enemy: any) => {
      if (enemy.active) {
        this.physics.moveToObject(enemy, this.player, 80);
      }
    });
  }
}

const RealReclaimCity: React.FC<RealReclaimCityProps> = ({ 
  isMultiplayer, 
  playerCount, 
  onGameEnd 
}) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<'soldier' | 'engineer' | 'medic' | 'scout'>('soldier');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Pass mute state to audio manager
  useEffect(() => {
    if (phaserGameRef.current && phaserGameRef.current.scene.scenes[0]) {
      const scene = phaserGameRef.current.scene.scenes[0] as any;
      if (scene.audioManager) {
        scene.audioManager.setMuted(isMuted);
      }
    }
  }, [isMuted]);
  
  const [gameState, setGameState] = useState<GameState>({
    phase: 'setup',
    playerHealth: 100,
    cityProgress: 0,
    score: 0,
    timeRemaining: 300, // 5 minutes
    enemiesKilled: 0
  });

  const updateGameState = (newState: GameState) => {
    setGameState(newState);
    
    if (newState.phase === 'victory' || newState.phase === 'defeat') {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
      
      const pointsWon = newState.phase === 'victory' ? 
        Math.floor(newState.score / 5) : Math.floor(newState.score / 10);
      
      setTimeout(() => {
        onGameEnd(newState.score, pointsWon);
      }, 2000);
    }
  };

  const startBattle = () => {
    setGameState(prev => ({ ...prev, phase: 'battle' }));
    
    // Initialize Phaser game
    if (gameRef.current && !phaserGameRef.current) {
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: gameRef.current,
        backgroundColor: '#87CEEB',
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: 800,
          height: 600
        },
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 0, x: 0 },
            debug: false
          }
        },
        scene: new GameScene(gameState, updateGameState)
      };
      
      phaserGameRef.current = new Phaser.Game(config);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, []);

  if (gameState.phase === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 text-white p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              🏙️ استعادة المدينة
            </h1>
            <p className="text-gray-300">لعبة إستراتيجية واقعية - محاربة الذكاء الاصطناعي</p>
            <Badge className="mt-2 bg-green-600">لعبة حقيقية بمحرك Phaser.js</Badge>
          </div>

          {/* Character Selection */}
          <Card className="bg-slate-800 border-red-700 mb-6 p-6">
            <h3 className="text-xl font-bold mb-4 text-red-400">اختيار المحارب</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['soldier', 'engineer', 'medic', 'scout'] as const).map((char) => (
                <Button
                  key={char}
                  onClick={() => setSelectedCharacter(char)}
                  variant={selectedCharacter === char ? "default" : "outline"}
                  className={`h-20 flex flex-col ${
                    selectedCharacter === char 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'border-gray-600 hover:border-red-500'
                  }`}
                >
                  <div className="text-2xl mb-1">
                    {char === 'soldier' && '🪖'}
                    {char === 'engineer' && '🔧'}
                    {char === 'medic' && '🏥'}
                    {char === 'scout' && '🔍'}
                  </div>
                  <span className="text-xs">
                    {char === 'soldier' && 'جندي'}
                    {char === 'engineer' && 'مهندس'}
                    {char === 'medic' && 'طبيب'}
                    {char === 'scout' && 'كشاف'}
                  </span>
                </Button>
              ))}
            </div>
          </Card>

          {/* Game Features */}
          <Card className="bg-slate-800 border-yellow-600 mb-6 p-6">
            <h3 className="text-xl font-bold mb-4 text-yellow-400">مميزات اللعبة الحقيقية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
              <div className="space-y-2">
                <p>🎮 محرك Phaser.js للرسوم الواقعية</p>
                <p>⚔️ قتال حقيقي ضد الذكاء الاصطناعي</p>
                <p>🏃‍♂️ حركة سلسة بالماوس أو لوحة المفاتيح</p>
                <p>💥 مؤثرات الانفجارات والأصوات</p>
              </div>
              <div className="space-y-2">
                <p>🎯 تحرير مناطق المدينة بالفعل</p>
                <p>🤖 أعداء ذكيين ومتنوعين</p>
                <p>📊 إحصائيات حقيقية ونقاط</p>
                <p>🏆 مكافآت حسب الأداء</p>
              </div>
            </div>
          </Card>

          {/* Controls */}
          <Card className="bg-slate-800 border-blue-600 mb-6 p-6">
            <h3 className="text-xl font-bold mb-4 text-blue-400">التحكم</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
              <div>
                <p className="font-bold mb-2">الحركة:</p>
                <p>WASD أو الأسهم للحركة في جميع الاتجاهات</p>
              </div>
              <div>
                <p className="font-bold mb-2">الرماية:</p>
                <p>مسطرة للرماية المستمرة أو النقر بالماوس للرماية الدقيقة</p>
              </div>
            </div>
          </Card>

          {/* Voice Chat */}
          <Card className="bg-slate-800 border-purple-600 mb-6 p-6">
            <h3 className="text-xl font-bold mb-4 text-purple-400">إعدادات الصوت</h3>
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

          {/* Start Game */}
          <div className="text-center">
            <Button
              onClick={startBattle}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-xl px-12 py-4 h-auto"
            >
              <Play className="w-6 h-6 mr-2" />
              بدء المعركة الحقيقية! 🔥
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState.phase === 'victory') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-green-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-4xl font-bold mb-4 text-green-400">النصر المبين!</h1>
          <p className="text-xl mb-6">تم تحرير المدينة من سيطرة الذكاء الاصطناعي!</p>
          <div className="bg-slate-800 rounded-lg p-6 mb-6 space-y-2">
            <p className="text-lg">النقاط النهائية: <span className="text-yellow-400 font-bold">{gameState.score}</span></p>
            <p className="text-lg">الأعداء المقضي عليهم: <span className="text-red-400 font-bold">{gameState.enemiesKilled}</span></p>
            <p className="text-lg">تقدم تحرير المدينة: <span className="text-green-400 font-bold">{gameState.cityProgress}%</span></p>
            <p className="text-lg">العملات المكتسبة: <span className="text-blue-400 font-bold">{Math.floor(gameState.score / 5)}</span></p>
          </div>
          <Button 
            onClick={() => onGameEnd(gameState.score, Math.floor(gameState.score / 5))}
            className="bg-green-600 hover:bg-green-700"
          >
            <Trophy className="w-4 h-4 mr-2" />
            جمع المكافآت والعودة
          </Button>
        </div>
      </div>
    );
  }

  if (gameState.phase === 'defeat') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-rose-900 to-red-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">💀</div>
          <h1 className="text-4xl font-bold mb-4 text-red-400">الهزيمة</h1>
          <p className="text-xl mb-6">فشلت المقاومة في تحرير المدينة...</p>
          <div className="bg-slate-800 rounded-lg p-6 mb-6 space-y-2">
            <p className="text-lg">النقاط المحققة: <span className="text-yellow-400 font-bold">{gameState.score}</span></p>
            <p className="text-lg">الأعداء المقضي عليهم: <span className="text-red-400 font-bold">{gameState.enemiesKilled}</span></p>
            <p className="text-lg">تقدم تحرير المدينة: <span className="text-orange-400 font-bold">{gameState.cityProgress}%</span></p>
            <p className="text-lg">العملات المكتسبة: <span className="text-blue-400 font-bold">{Math.floor(gameState.score / 10)}</span></p>
          </div>
          <Button 
            onClick={() => onGameEnd(gameState.score, Math.floor(gameState.score / 10))}
            className="bg-red-600 hover:bg-red-700"
          >
            <Crown className="w-4 h-4 mr-2" />
            المحاولة مرة أخرى
          </Button>
        </div>
      </div>
    );
  }

  // Battle Phase - Phaser Game
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Game Stats Header */}
      <div className="bg-slate-900 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <Badge className="bg-red-600">الصحة: {gameState.playerHealth}%</Badge>
          <Badge className="bg-green-600">تقدم المدينة: {gameState.cityProgress}%</Badge>
          <Badge className="bg-yellow-600">النقاط: {gameState.score}</Badge>
        </div>
        <div className="flex items-center space-x-4 space-x-reverse">
          <Badge className="bg-blue-600">الوقت: {formatTime(gameState.timeRemaining)}</Badge>
          <Badge className="bg-purple-600">الأعداء: {gameState.enemiesKilled}</Badge>
        </div>
      </div>

      {/* Phaser Game Container */}
      <div className="flex-1 flex items-center justify-center">
        <div ref={gameRef} className="border-2 border-red-600 rounded-lg overflow-hidden" />
      </div>

      {/* Instructions */}
      <div className="bg-slate-900 p-2 text-center text-sm text-gray-400">
        WASD أو الأسهم للحركة | مسطرة أو النقر بالماوس للرماية | اجمع المناطق الرمادية لتحرير المدينة
      </div>
    </div>
  );
};

export default RealReclaimCity;