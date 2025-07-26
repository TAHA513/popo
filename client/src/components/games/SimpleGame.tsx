import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

class SimpleGameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private enemies: Phaser.GameObjects.Rectangle[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: any;

  constructor() {
    super({ key: 'SimpleGameScene' });
  }

  create() {
    // Set a bright background
    this.cameras.main.setBackgroundColor('#00BFFF');
    
    // Add large title
    this.add.text(400, 50, 'استعادة المدينة', {
      fontSize: '32px',
      color: '#000000',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    // Add instructions
    this.add.text(400, 100, 'WASD أو الأسهم للحركة', {
      fontSize: '20px',
      color: '#FFFFFF',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    // Create visible ground
    this.add.rectangle(400, 550, 800, 100, 0x228B22);
    
    // Create large buildings
    for (let i = 0; i < 5; i++) {
      const x = i * 150 + 100;
      const height = 200 + Math.random() * 150;
      const building = this.add.rectangle(x, 450 - height/2, 120, height, 0x808080);
      building.setStroke(3, 0x000000);
    }
    
    // Create large blue player
    this.player = this.add.rectangle(400, 450, 40, 40, 0x0000FF);
    this.player.setStroke(2, 0x000000);
    
    // Create red enemy targets
    for (let i = 0; i < 3; i++) {
      const enemy = this.add.rectangle(
        200 + i * 200, 
        350, 
        60, 
        60, 
        0xFF0000
      );
      enemy.setStroke(3, 0x000000);
      this.enemies.push(enemy);
    }
    
    // Setup input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,S,A,D');
    
    // Add game info
    this.add.text(50, 150, 'اللاعب: المربع الأزرق\nالأهداف: المربعات الحمراء\nالمباني: المربعات الرمادية', {
      fontSize: '16px',
      color: '#000000',
      fontFamily: 'Arial'
    });
  }
  
  update() {
    const speed = 3;
    
    // Player movement
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.player.x -= speed;
    }
    if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.player.x += speed;
    }
    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      this.player.y -= speed;
    }
    if (this.cursors.down.isDown || this.wasd.S.isDown) {
      this.player.y += speed;
    }
    
    // Keep player in bounds
    this.player.x = Phaser.Math.Clamp(this.player.x, 20, 780);
    this.player.y = Phaser.Math.Clamp(this.player.y, 120, 500);
    
    // Simple enemy animation
    this.enemies.forEach((enemy, index) => {
      enemy.rotation += 0.02;
      enemy.y = 350 + Math.sin(this.time.now * 0.001 + index) * 20;
    });
  }
}

interface SimpleGameProps {
  onClose: () => void;
}

const SimpleGame: React.FC<SimpleGameProps> = ({ onClose }) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (gameRef.current && !phaserGameRef.current) {
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: gameRef.current,
        backgroundColor: '#00BFFF',
        scene: SimpleGameScene
      };

      phaserGameRef.current = new Phaser.Game(config);
    }

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">🎮 لعبة بسيطة تعمل</h1>
          <button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
          >
            إغلاق
          </button>
        </div>
        
        <div className="bg-white rounded-lg p-4">
          <div ref={gameRef} className="w-full" />
        </div>
        
        <div className="mt-4 text-center">
          <p>استخدم WASD أو الأسهم لتحريك المربع الأزرق</p>
          <p>إذا رأيت المربعات الملونة، فاللعبة تعمل!</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleGame;