import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Target, Heart, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GameState {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  world: CANNON.World;
  player: {
    mesh: THREE.Group;
    body: CANNON.Body;
    health: number;
    ammo: number;
  };
  enemies: Array<{
    mesh: THREE.Group;
    body: CANNON.Body;
    health: number;
  }>;
  bullets: Array<{
    mesh: THREE.Mesh;
    body: CANNON.Body;
    lifeTime: number;
  }>;
  isPlaying: boolean;
}

export default function WarGameFixed() {
  const { user } = useAuth();
  const { toast } = useToast();
  const mountRef = useRef<HTMLDivElement>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const animationIdRef = useRef<number | null>(null);
  
  const [gameStatus, setGameStatus] = useState<'menu' | 'playing' | 'gameOver'>('menu');
  const [playerStats, setPlayerStats] = useState({
    health: 100,
    ammo: 30,
    score: 0,
    kills: 0
  });

  const initGame = useCallback(() => {
    console.log('Initializing game...');
    
    if (!mountRef.current) {
      console.error('Mount ref not available');
      return false;
    }

    try {
      // Clear previous content
      mountRef.current.innerHTML = '';

      // Create scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x001122);
      scene.fog = new THREE.Fog(0x001122, 50, 500);

      // Create camera
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.set(0, 8, 12);

      // Create renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      mountRef.current.appendChild(renderer.domElement);

      // Create physics world
      const world = new CANNON.World();
      world.gravity.set(0, -9.82, 0);
      world.broadphase = new CANNON.NaiveBroadphase();

      // Create ground
      const groundGeometry = new THREE.PlaneGeometry(200, 200);
      const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x2a4d3a });
      const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
      groundMesh.rotation.x = -Math.PI / 2;
      groundMesh.receiveShadow = true;
      scene.add(groundMesh);

      const groundShape = new CANNON.Plane();
      const groundBody = new CANNON.Body({ mass: 0 });
      groundBody.addShape(groundShape);
      groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
      world.addBody(groundBody);

      // Create player
      const playerGroup = new THREE.Group();
      
      // Player body
      const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.8, 8);
      const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4CAF50 });
      const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
      bodyMesh.castShadow = true;
      playerGroup.add(bodyMesh);

      // Player head
      const headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBB5 });
      const headMesh = new THREE.Mesh(headGeometry, headMaterial);
      headMesh.position.y = 1.2;
      headMesh.castShadow = true;
      playerGroup.add(headMesh);

      playerGroup.position.set(0, 1, 0);
      scene.add(playerGroup);

      const playerShape = new CANNON.Cylinder(0.5, 0.5, 1.8, 8);
      const playerBody = new CANNON.Body({ mass: 1 });
      playerBody.addShape(playerShape);
      playerBody.position.set(0, 1, 0);
      world.addBody(playerBody);

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 10, 5);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      scene.add(directionalLight);

      // Create game state
      const gameState: GameState = {
        scene,
        camera,
        renderer,
        world,
        player: {
          mesh: playerGroup,
          body: playerBody,
          health: 100,
          ammo: 30
        },
        enemies: [],
        bullets: [],
        isPlaying: false
      };

      gameStateRef.current = gameState;
      console.log('Game initialized successfully!');
      return true;

    } catch (error) {
      console.error('Failed to initialize game:', error);
      toast({
        title: "خطأ في تهيئة اللعبة",
        description: "فشل في تهيئة اللعبة. جرب مرة أخرى.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const createEnemy = useCallback((position: THREE.Vector3) => {
    if (!gameStateRef.current) return;

    const { scene, world } = gameStateRef.current;

    // Create enemy group
    const enemyGroup = new THREE.Group();
    
    // Enemy body
    const bodyGeometry = new THREE.BoxGeometry(1, 1.5, 1);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xFF4444 });
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.castShadow = true;
    enemyGroup.add(bodyMesh);

    // Enemy eyes (glowing)
    const eyeGeometry = new THREE.SphereGeometry(0.1, 6, 6);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x00FF00 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.2, 0.3, 0.5);
    enemyGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.2, 0.3, 0.5);
    enemyGroup.add(rightEye);

    enemyGroup.position.copy(position);
    scene.add(enemyGroup);

    // Physics body
    const enemyShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.75, 0.5));
    const enemyBody = new CANNON.Body({ mass: 1 });
    enemyBody.addShape(enemyShape);
    enemyBody.position.set(position.x, position.y, position.z);
    world.addBody(enemyBody);

    const enemy = {
      mesh: enemyGroup,
      body: enemyBody,
      health: 50
    };

    gameStateRef.current.enemies.push(enemy);
  }, []);

  const spawnEnemies = useCallback(() => {
    console.log('Spawning enemies...');
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const radius = 20 + Math.random() * 10;
      const position = new THREE.Vector3(
        Math.cos(angle) * radius,
        1,
        Math.sin(angle) * radius
      );
      createEnemy(position);
    }
  }, [createEnemy]);

  const gameLoop = useCallback(() => {
    if (!gameStateRef.current || !gameStateRef.current.isPlaying) {
      return;
    }

    const { scene, camera, renderer, world, player, enemies, bullets } = gameStateRef.current;

    // Update physics
    world.step(1/60);

    // Update player position
    player.mesh.position.copy(player.body.position as any);
    player.mesh.quaternion.copy(player.body.quaternion as any);

    // Camera follows player
    const playerPos = player.mesh.position;
    camera.position.set(playerPos.x, playerPos.y + 8, playerPos.z + 12);
    camera.lookAt(playerPos);

    // Update enemies
    enemies.forEach(enemy => {
      enemy.mesh.position.copy(enemy.body.position as any);
      enemy.mesh.quaternion.copy(enemy.body.quaternion as any);
    });

    // Update bullets
    bullets.forEach(bullet => {
      bullet.mesh.position.copy(bullet.body.position as any);
      bullet.lifeTime += 1/60;
    });

    // Remove old bullets
    gameStateRef.current.bullets = bullets.filter(bullet => {
      if (bullet.lifeTime > 3) {
        scene.remove(bullet.mesh);
        world.removeBody(bullet.body);
        return false;
      }
      return true;
    });

    // Render
    renderer.render(scene, camera);

    // Continue loop
    animationIdRef.current = requestAnimationFrame(gameLoop);
  }, []);

  const startGame = useCallback(() => {
    console.log('Starting game...');
    
    if (!gameStateRef.current) {
      console.log('Initializing game first...');
      if (!initGame()) {
        return;
      }
    }

    if (!gameStateRef.current) {
      console.error('Game state still null after init');
      return;
    }

    try {
      gameStateRef.current.isPlaying = true;
      setGameStatus('playing');
      
      // Reset player stats
      setPlayerStats({
        health: 100,
        ammo: 30,
        score: 0,
        kills: 0
      });

      // Spawn enemies
      spawnEnemies();

      // Start game loop
      gameLoop();

      console.log('Game started successfully!');
      toast({
        title: "بدأت اللعبة!",
        description: "استخدم WASD للحركة والماوس للتصويب",
      });

    } catch (error) {
      console.error('Error starting game:', error);
      toast({
        title: "خطأ في بدء اللعبة",
        description: "حدث خطأ أثناء بدء اللعبة. جرب مرة أخرى.",
        variant: "destructive",
      });
    }
  }, [initGame, spawnEnemies, gameLoop, toast]);

  const stopGame = useCallback(() => {
    console.log('Stopping game...');
    
    if (gameStateRef.current) {
      gameStateRef.current.isPlaying = false;
    }
    
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
    
    setGameStatus('menu');
  }, []);

  // Initialize game on mount
  useEffect(() => {
    console.log('Component mounted, initializing game...');
    initGame();
    
    return () => {
      console.log('Component unmounting, cleaning up...');
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (gameStateRef.current && mountRef.current) {
        mountRef.current.innerHTML = '';
      }
    };
  }, [initGame]);

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
              <h1 className="text-xl font-bold text-red-400">
                حرب الذكاء الاصطناعي - إصدار مُحسن
              </h1>
            </div>
            {gameStatus === 'playing' && (
              <Button onClick={stopGame} variant="outline" size="sm">
                إيقاف اللعبة
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Game Stats */}
      {gameStatus === 'playing' && (
        <div className="fixed top-20 left-4 z-30 space-y-2">
          <Card className="bg-black/70 border-green-500/30">
            <CardContent className="p-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-green-400" />
              <div className="text-green-400 font-bold">{playerStats.health}</div>
              <Progress value={playerStats.health} className="w-20 h-2" />
            </CardContent>
          </Card>
          
          <Card className="bg-black/70 border-blue-500/30">
            <CardContent className="p-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400" />
              <div className="text-blue-400 font-bold">{playerStats.ammo}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/70 border-yellow-500/30">
            <CardContent className="p-3">
              <div className="text-yellow-400 font-bold">النقاط: {playerStats.score}</div>
              <div className="text-red-400 font-bold">القتلى: {playerStats.kills}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Game Container */}
      <div className="fixed inset-0 z-10">
        <div className="relative w-full h-full">
          <div 
            ref={mountRef} 
            className="w-full h-full overflow-hidden bg-black"
          />
          
          {gameStatus === 'menu' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/90">
              <Card className="bg-gradient-to-br from-red-900/50 to-orange-900/30 border-red-500/30">
                <CardHeader>
                  <CardTitle className="text-center text-red-400 text-xl">
                    حرب الذكاء الاصطناعي ثلاثية الأبعاد
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="text-gray-300 text-sm">
                    لعبة حرب حقيقية مع محرك فيزياء Three.js + Cannon.js
                    <br />
                    تحكم: WASD للحركة | الماوس للنظر والتصويب
                    <br />
                    إطلاق النار: اضغط بالماوس أو Space
                    <br />
                    عالم ثلاثي الأبعاد مع أعداء ذكيين
                  </div>
                  <Button 
                    onClick={startGame} 
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 text-xl"
                    size="lg"
                  >
                    <Target className="w-6 h-6 mr-3" />
                    ابدأ المعركة الآن!
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}