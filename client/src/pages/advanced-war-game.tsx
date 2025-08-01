import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import Stats from 'stats.js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Zap, Shield, Target, Clock, Trophy, Flame, Bot, Heart, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GameState {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  world: CANNON.World;
  player: {
    mesh: THREE.Group | THREE.Mesh;
    body: CANNON.Body;
    health: number;
    maxHealth: number;
    ammo: number;
    maxAmmo: number;
    weapon: string;
    kills: number;
    score: number;
  };
  enemies: Array<{
    mesh: THREE.Group | THREE.Mesh;
    body: CANNON.Body;
    health: number;
    maxHealth: number;
    type: string;
    ai: {
      state: 'patrol' | 'chase' | 'attack' | 'retreat';
      target: THREE.Vector3 | null;
      lastShot: number;
      patrolPoints: THREE.Vector3[];
      currentPatrolIndex: number;
    };
  }>;
  bullets: Array<{
    mesh: THREE.Mesh;
    body: CANNON.Body;
    damage: number;
    isPlayerBullet: boolean;
    lifeTime: number;
  }>;
  terrain: THREE.Mesh[];
  buildings: THREE.Mesh[];
  particles: Array<{
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
  }>;
  isPlaying: boolean;
  wave: number;
  gameTime: number;
}

export default function AdvancedWarGame() {
  const { user } = useAuth();
  const { toast } = useToast();
  const mountRef = useRef<HTMLDivElement>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  const mouse = useRef({ x: 0, y: 0, isLocked: false, pitch: 0, yaw: 0 });
  const statsRef = useRef<Stats>();
  
  const [gameStatus, setGameStatus] = useState<'menu' | 'playing' | 'paused' | 'gameOver'>('menu');
  const [playerStats, setPlayerStats] = useState({
    health: 100,
    maxHealth: 100,
    ammo: 100,
    maxAmmo: 100,
    kills: 0,
    score: 0,
    wave: 1
  });

  // Initialize Three.js and Cannon.js
  const initializeGame = useCallback(() => {
    console.log('initializeGame called');
    if (!mountRef.current) {
      console.error('mountRef.current is null');
      return;
    }

    // Clear any existing renderer
    mountRef.current.innerHTML = '';
    console.log('Mount ref cleared');

    // Create enhanced 3D scene
    const scene = new THREE.Scene();
    console.log('Scene created');
    
    // Create realistic sky gradient
    const skyGeometry = new THREE.SphereGeometry(1000, 32, 32);
    const skyMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      uniforms: {
        topColor: { value: new THREE.Color(0x0077ff) },
        bottomColor: { value: new THREE.Color(0xffffff) },
        offset: { value: 33 },
        exponent: { value: 0.6 }
      },
      side: THREE.BackSide
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);
    
    scene.fog = new THREE.Fog(0x1a1a2e, 200, 1500);

    // Get screen dimensions
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    // Create camera for mobile
    const camera = new THREE.PerspectiveCamera(75, canvasWidth / canvasHeight, 0.1, 2000);
    camera.position.set(0, 5, 10);

    // Create renderer for full mobile screen
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(canvasWidth, canvasHeight);
    renderer.setClearColor(0x1a1a2e, 1.0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    
    // Make canvas responsive
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    
    mountRef.current.appendChild(renderer.domElement);

    // Create physics world
    const world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);
    world.broadphase = new CANNON.NaiveBroadphase();

    // Create realistic textured ground
    const groundGeometry = new THREE.PlaneGeometry(400, 400, 100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2d4a3e,
      roughness: 0.8,
      metalness: 0.1
    });
    
    // Add height variation to ground
    const vertices = groundGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      vertices[i + 2] = Math.random() * 2 - 1; // Random height variation
    }
    groundGeometry.attributes.position.needsUpdate = true;
    groundGeometry.computeVertexNormals();
    
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);

    // Create buildings/obstacles
    const buildings: THREE.Mesh[] = [];
    const buildingPositions = [
      { x: 20, z: 10 }, { x: -30, z: 15 }, { x: 40, z: -20 },
      { x: -15, z: -25 }, { x: 60, z: 30 }, { x: -50, z: -10 }
    ];

    buildingPositions.forEach((pos, index) => {
      const height = 15 + Math.random() * 25;
      const width = 8 + Math.random() * 6;
      const depth = 8 + Math.random() * 6;

      // Create realistic building with details
      const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
      const buildingMaterial = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color().setHSL(0.6 + Math.random() * 0.3, 0.4, 0.3 + Math.random() * 0.3),
        roughness: 0.7,
        metalness: 0.1
      });
      const buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);
      buildingMesh.position.set(pos.x, height / 2, pos.z);
      buildingMesh.castShadow = true;
      buildingMesh.receiveShadow = true;
      
      // Add windows
      for (let w = 0; w < 3; w++) {
        for (let h = 0; h < Math.floor(height / 5); h++) {
          const windowGeometry = new THREE.PlaneGeometry(1, 1.5);
          const windowMaterial = new THREE.MeshBasicMaterial({ 
            color: Math.random() > 0.3 ? 0xffff88 : 0x333333,
            transparent: true,
            opacity: 0.8
          });
          const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
          windowMesh.position.set(
            pos.x + width/2 + 0.01,
            height/2 - height/2 + h * 5 + 3,
            pos.z - width/2 + w * 2
          );
          scene.add(windowMesh);
        }
      }
      
      scene.add(buildingMesh);
      buildings.push(buildingMesh);

      // Physics body for building
      const buildingShape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2));
      const buildingBody = new CANNON.Body({ mass: 0 });
      buildingBody.addShape(buildingShape);
      buildingBody.position.set(pos.x, height / 2, pos.z);
      world.addBody(buildingBody);
    });

    // Create detailed player character
    const playerGroup = new THREE.Group();
    
    // Player body
    const bodyGeometry = new THREE.CapsuleGeometry(0.8, 1.5, 8, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2a5d31,
      roughness: 0.6,
      metalness: 0.1
    });
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.castShadow = true;
    playerGroup.add(bodyMesh);
    
    // Player helmet
    const helmetGeometry = new THREE.SphereGeometry(0.6, 16, 8);
    const helmetMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1a4022,
      roughness: 0.3,
      metalness: 0.4
    });
    const helmetMesh = new THREE.Mesh(helmetGeometry, helmetMaterial);
    helmetMesh.position.set(0, 1.2, 0);
    helmetMesh.castShadow = true;
    playerGroup.add(helmetMesh);
    
    // Weapon
    const weaponGeometry = new THREE.BoxGeometry(0.1, 0.1, 2);
    const weaponMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      roughness: 0.2,
      metalness: 0.8
    });
    const weaponMesh = new THREE.Mesh(weaponGeometry, weaponMaterial);
    weaponMesh.position.set(0.5, 0.5, -1);
    weaponMesh.castShadow = true;
    playerGroup.add(weaponMesh);
    
    playerGroup.position.set(0, 2, 0);
    scene.add(playerGroup);

    const playerShape = new CANNON.Cylinder(1, 1, 3, 8);
    const playerBody = new CANNON.Body({ mass: 5 });
    playerBody.addShape(playerShape);
    playerBody.position.set(0, 2, 0);
    playerBody.material = new CANNON.Material({ friction: 0.4, restitution: 0.0 });
    world.addBody(playerBody);

    // Enhanced realistic lighting
    const ambientLight = new THREE.AmbientLight(0x404060, 0.4);
    scene.add(ambientLight);

    // Main sun light
    const sunLight = new THREE.DirectionalLight(0xfff5b4, 1.0);
    sunLight.position.set(100, 150, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 800;
    sunLight.shadow.camera.left = -200;
    sunLight.shadow.camera.right = 200;
    sunLight.shadow.camera.top = 200;
    sunLight.shadow.camera.bottom = -200;
    sunLight.shadow.bias = -0.0001;
    scene.add(sunLight);
    
    // Fill light
    const fillLight = new THREE.DirectionalLight(0x7ec0ee, 0.3);
    fillLight.position.set(-50, 50, -50);
    scene.add(fillLight);
    
    // Atmospheric point lights
    for (let i = 0; i < 5; i++) {
      const pointLight = new THREE.PointLight(
        new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
        0.5,
        50
      );
      pointLight.position.set(
        (Math.random() - 0.5) * 200,
        10 + Math.random() * 20,
        (Math.random() - 0.5) * 200
      );
      scene.add(pointLight);
    }

    // Window resize handling
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      
      // Update canvas style
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
    };
    
    window.addEventListener('resize', handleResize);

    // Initialize game state
    gameStateRef.current = {
      scene,
      camera,
      renderer,
      world,
      player: {
        mesh: playerGroup,
        body: playerBody,
        health: 100,
        maxHealth: 100,
        ammo: 100,
        maxAmmo: 100,
        weapon: 'rifle',
        kills: 0,
        score: 0
      },
      enemies: [],
      bullets: [],
      terrain: [groundMesh],
      buildings,
      particles: [],
      isPlaying: false,
      wave: 1,
      gameTime: 0
    };

    // Stats
    const stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);
    statsRef.current = stats;

    console.log('Game initialized successfully!');
  }, []);

  // Create enemy
  const createEnemy = useCallback((position: THREE.Vector3, type: string = 'soldier') => {
    if (!gameStateRef.current) return;

    const { scene, world } = gameStateRef.current;

    // Enemy types with different characteristics
    const enemyTypes = {
      soldier: { color: 0xff0000, health: 50, speed: 3, damage: 20, size: 1 },
      heavy: { color: 0x800000, health: 100, speed: 1.5, damage: 40, size: 1.5 },
      scout: { color: 0xff4444, health: 30, speed: 5, damage: 15, size: 0.8 },
      commander: { color: 0x660000, health: 150, speed: 2, damage: 50, size: 1.2 }
    };

    const config = enemyTypes[type as keyof typeof enemyTypes] || enemyTypes.soldier;

    // Create detailed enemy robot
    const enemyGroup = new THREE.Group();
    
    // Robot body
    const bodyGeometry = new THREE.CylinderGeometry(config.size * 0.7, config.size, 2 * config.size, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: config.color,
      roughness: 0.3,
      metalness: 0.8,
      emissive: new THREE.Color(config.color).multiplyScalar(0.1)
    });
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.castShadow = true;
    enemyGroup.add(bodyMesh);
    
    // Robot head/sensor
    const headGeometry = new THREE.SphereGeometry(config.size * 0.5, 8, 6);
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff3333,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x331111
    });
    const headMesh = new THREE.Mesh(headGeometry, headMaterial);
    headMesh.position.set(0, config.size * 1.2, 0);
    headMesh.castShadow = true;
    enemyGroup.add(headMesh);
    
    // Glowing eyes
    const eyeGeometry = new THREE.SphereGeometry(0.1, 6, 4);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, config.size * 1.2, config.size * 0.4);
    enemyGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, config.size * 1.2, config.size * 0.4);
    enemyGroup.add(rightEye);
    
    // Weapon attachments
    const weaponGeometry = new THREE.BoxGeometry(0.2, 0.2, 1.5);
    const weaponMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x666666,
      roughness: 0.2,
      metalness: 0.9
    });
    const weaponMesh = new THREE.Mesh(weaponGeometry, weaponMaterial);
    weaponMesh.position.set(config.size * 0.8, 0, 0);
    weaponMesh.castShadow = true;
    enemyGroup.add(weaponMesh);
    
    enemyGroup.position.copy(position);
    scene.add(enemyGroup);

    const enemyShape = new CANNON.Cylinder(config.size, config.size, 3 * config.size, 8);
    const enemyBody = new CANNON.Body({ mass: 5 });
    enemyBody.addShape(enemyShape);
    enemyBody.position.set(position.x, position.y, position.z);
    world.addBody(enemyBody);

    // Create patrol points
    const patrolPoints = [];
    for (let i = 0; i < 4; i++) {
      patrolPoints.push(new THREE.Vector3(
        position.x + (Math.random() - 0.5) * 40,
        position.y,
        position.z + (Math.random() - 0.5) * 40
      ));
    }

    const enemy = {
      mesh: enemyGroup,
      body: enemyBody,
      health: config.health,
      maxHealth: config.health,
      type,
      ai: {
        state: 'patrol' as const,
        target: null,
        lastShot: 0,
        patrolPoints,
        currentPatrolIndex: 0
      }
    };

    gameStateRef.current.enemies.push(enemy);
  }, []);

  // Spawn wave of enemies
  const spawnWave = useCallback(() => {
    if (!gameStateRef.current) return;

    const { wave } = gameStateRef.current;
    const enemyCount = Math.min(3 + wave, 10);

    const spawnPositions = [
      new THREE.Vector3(50, 2, 50),
      new THREE.Vector3(-50, 2, 50),
      new THREE.Vector3(50, 2, -50),
      new THREE.Vector3(-50, 2, -50),
      new THREE.Vector3(0, 2, 60),
      new THREE.Vector3(0, 2, -60),
      new THREE.Vector3(60, 2, 0),
      new THREE.Vector3(-60, 2, 0)
    ];

    for (let i = 0; i < enemyCount; i++) {
      const position = spawnPositions[i % spawnPositions.length];
      const enemyTypes = ['soldier', 'heavy', 'scout', 'commander'];
      const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      createEnemy(position, type);
    }

    toast({
      title: `الموجة ${wave}`,
      description: `تم إنتشار ${enemyCount} من الأعداء!`,
    });
  }, [createEnemy, toast]);

  // Fire bullet
  const fireBullet = useCallback(() => {
    if (!gameStateRef.current) return;

    const { scene, world, camera, player } = gameStateRef.current;

    if (player.ammo <= 0) return;

    // Create enhanced bullet with trail
    const bulletGeometry = new THREE.CylinderGeometry(0.05, 0.08, 0.3, 6);
    const bulletMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffaa00,
      roughness: 0.1,
      metalness: 0.8,
      emissive: 0x664400
    });
    const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);
    
    // Position bullet at camera position
    bulletMesh.position.copy(camera.position);
    scene.add(bulletMesh);

    const bulletShape = new CANNON.Sphere(0.1);
    const bulletBody = new CANNON.Body({ mass: 0.1 });
    bulletBody.addShape(bulletShape);
    bulletBody.position.set(camera.position.x, camera.position.y, camera.position.z);

    // Fire in the direction camera is looking
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.multiplyScalar(50);
    
    bulletBody.velocity = new CANNON.Vec3(direction.x, direction.y, direction.z);
    world.addBody(bulletBody);

    const bullet = {
      mesh: bulletMesh,
      body: bulletBody,
      damage: 25,
      isPlayerBullet: true,
      lifeTime: 0
    };

    gameStateRef.current.bullets.push(bullet);
    player.ammo -= 1;

    setPlayerStats(prev => ({ ...prev, ammo: player.ammo }));
  }, []);

  // Update enemy AI
  const updateEnemyAI = useCallback((enemy: any, deltaTime: number) => {
    if (!gameStateRef.current) return;

    const { player, camera } = gameStateRef.current;
    const playerPosition = camera.position;
    const enemyPosition = enemy.mesh.position;
    const distanceToPlayer = playerPosition.distanceTo(enemyPosition);

    const now = Date.now();

    // AI State Machine
    switch (enemy.ai.state) {
      case 'patrol':
        if (distanceToPlayer < 25) {
          enemy.ai.state = 'chase';
          enemy.ai.target = playerPosition.clone();
        } else {
          // Patrol movement
          const currentPatrolPoint = enemy.ai.patrolPoints[enemy.ai.currentPatrolIndex];
          const distanceToPatrol = enemyPosition.distanceTo(currentPatrolPoint);
          
          if (distanceToPatrol < 3) {
            enemy.ai.currentPatrolIndex = (enemy.ai.currentPatrolIndex + 1) % enemy.ai.patrolPoints.length;
          }
          
          const direction = new THREE.Vector3()
            .subVectors(currentPatrolPoint, enemyPosition)
            .normalize()
            .multiplyScalar(2);
          
          enemy.body.velocity = new CANNON.Vec3(direction.x, enemy.body.velocity.y, direction.z);
        }
        break;

      case 'chase':
        enemy.ai.target = playerPosition.clone();
        if (distanceToPlayer < 15) {
          enemy.ai.state = 'attack';
        } else if (distanceToPlayer > 40) {
          enemy.ai.state = 'patrol';
        } else {
          const direction = new THREE.Vector3()
            .subVectors(playerPosition, enemyPosition)
            .normalize()
            .multiplyScalar(3);
          
          enemy.body.velocity = new CANNON.Vec3(direction.x, enemy.body.velocity.y, direction.z);
        }
        break;

      case 'attack':
        enemy.ai.target = playerPosition.clone();
        
        // Stop moving and shoot
        enemy.body.velocity = new CANNON.Vec3(0, enemy.body.velocity.y, 0);
        
        if (now - enemy.ai.lastShot > 2000) { // Shoot every 2 seconds
          // Create enemy laser bullet
          const bulletGeometry = new THREE.CylinderGeometry(0.04, 0.06, 0.4, 6);
          const bulletMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff2222,
            roughness: 0.1,
            metalness: 0.9,
            emissive: 0x882222
          });
          const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);
          bulletMesh.position.copy(enemyPosition);
          gameStateRef.current.scene.add(bulletMesh);

          const bulletShape = new CANNON.Sphere(0.08);
          const bulletBody = new CANNON.Body({ mass: 0.1 });
          bulletBody.addShape(bulletShape);
          bulletBody.position.set(enemyPosition.x, enemyPosition.y + 1, enemyPosition.z);

          const direction = new THREE.Vector3()
            .subVectors(playerPosition, enemyPosition)
            .normalize()
            .multiplyScalar(30);
          
          bulletBody.velocity = new CANNON.Vec3(direction.x, direction.y, direction.z);
          gameStateRef.current.world.addBody(bulletBody);

          const bullet = {
            mesh: bulletMesh,
            body: bulletBody,
            damage: 20,
            isPlayerBullet: false,
            lifeTime: 0
          };

          gameStateRef.current.bullets.push(bullet);
          enemy.ai.lastShot = now;
        }
        
        if (distanceToPlayer > 20) {
          enemy.ai.state = 'chase';
        }
        break;
    }
  }, []);

  // Game loop
  const gameLoop = useCallback(() => {
    if (!gameStateRef.current || !gameStateRef.current.isPlaying) return;

    const gameState = gameStateRef.current;
    const { scene, camera, renderer, world, player } = gameState;

    if (statsRef.current) statsRef.current.begin();

    // Update physics
    world.step(1/60);

    // Update player position based on physics body
    const playerPos = player.body.position;
    const playerQuat = player.body.quaternion;
    player.mesh.position.set(playerPos.x, playerPos.y, playerPos.z);
    player.mesh.quaternion.set(playerQuat.x, playerQuat.y, playerQuat.z, playerQuat.w);

    // Player movement
    const moveSpeed = 10;
    let moveX = 0, moveZ = 0;

    if (keysPressed.current.has('w')) moveZ -= 1;
    if (keysPressed.current.has('s')) moveZ += 1;
    if (keysPressed.current.has('a')) moveX -= 1;
    if (keysPressed.current.has('d')) moveX += 1;

    if (moveX !== 0 || moveZ !== 0) {
      const direction = new THREE.Vector3(moveX, 0, moveZ).normalize();
      direction.applyQuaternion(camera.quaternion);
      direction.y = 0;
      direction.normalize();
      
      player.body.velocity = new CANNON.Vec3(direction.x * moveSpeed, player.body.velocity.y, direction.z * moveSpeed);
    } else {
      player.body.velocity = new CANNON.Vec3(0, player.body.velocity.y, 0);
    }

    // Camera follows player with proper third-person view
    const currentPlayerPos = player.mesh.position;
    
    // If mouse is not locked, use default third-person camera
    if (!mouse.current.isLocked) {
      camera.position.set(currentPlayerPos.x, currentPlayerPos.y + 8, currentPlayerPos.z + 15);
      camera.lookAt(currentPlayerPos.x, currentPlayerPos.y + 1, currentPlayerPos.z);
    }

    // Update enemies
    gameState.enemies.forEach(enemy => {
      updateEnemyAI(enemy, 1/60);
      const enemyPos = enemy.body.position;
      const enemyQuat = enemy.body.quaternion;
      enemy.mesh.position.set(enemyPos.x, enemyPos.y, enemyPos.z);
      enemy.mesh.quaternion.set(enemyQuat.x, enemyQuat.y, enemyQuat.z, enemyQuat.w);
    });

    // Update bullets
    gameState.bullets = gameState.bullets.filter(bullet => {
      bullet.lifeTime += 1/60;
      const bulletPos = bullet.body.position;
      bullet.mesh.position.set(bulletPos.x, bulletPos.y, bulletPos.z);
      
      // Remove old bullets
      if (bullet.lifeTime > 5) {
        scene.remove(bullet.mesh);
        world.removeBody(bullet.body);
        return false;
      }

      // Check collisions
      let hit = false;

      if (bullet.isPlayerBullet) {
        // Check bullet vs enemies
        gameState.enemies.forEach((enemy, enemyIndex) => {
          const distance = bullet.mesh.position.distanceTo(enemy.mesh.position);
          if (distance < 2 && !hit) {
            hit = true;
            enemy.health -= bullet.damage;
            
            if (enemy.health <= 0) {
              scene.remove(enemy.mesh);
              world.removeBody(enemy.body);
              gameState.enemies.splice(enemyIndex, 1);
              player.kills += 1;
              player.score += 100;
              setPlayerStats(prev => ({ 
                ...prev, 
                kills: player.kills, 
                score: player.score 
              }));
            }
          }
        });
      } else {
        // Check bullet vs player
        const distance = bullet.mesh.position.distanceTo(player.mesh.position);
        if (distance < 2 && !hit) {
          hit = true;
          player.health -= bullet.damage;
          setPlayerStats(prev => ({ ...prev, health: player.health }));
          
          if (player.health <= 0) {
            setGameStatus('gameOver');
            gameState.isPlaying = false;
          }
        }
      }

      if (hit) {
        scene.remove(bullet.mesh);
        world.removeBody(bullet.body);
        return false;
      }

      return true;
    });

    // Check wave completion
    if (gameState.enemies.length === 0) {
      gameState.wave += 1;
      setPlayerStats(prev => ({ ...prev, wave: gameState.wave }));
      setTimeout(() => spawnWave(), 3000);
    }

    // Ammo regeneration
    if (player.ammo < player.maxAmmo) {
      player.ammo = Math.min(player.maxAmmo, player.ammo + 0.5);
      setPlayerStats(prev => ({ ...prev, ammo: Math.floor(player.ammo) }));
    }

    renderer.render(scene, camera);

    if (statsRef.current) statsRef.current.end();

    requestAnimationFrame(gameLoop);
  }, [updateEnemyAI, spawnWave]);

  // Input handling for both desktop and mobile
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      keysPressed.current.add(event.key.toLowerCase());
      
      if (event.key === ' ') {
        event.preventDefault();
        fireBullet();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      keysPressed.current.delete(event.key.toLowerCase());
    };

    // Touch controls for mobile
    const handleTouchStart = (event: TouchEvent) => {
      event.preventDefault();
      const touch = event.touches[0];
      const rect = mountRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      // Check if touch is on movement area (left side)
      if (x < rect.width / 2) {
        // Handle movement based on touch position
        const centerX = rect.width / 4;
        const centerY = rect.height / 2;
        
        if (Math.abs(x - centerX) > Math.abs(y - centerY)) {
          if (x < centerX) keysPressed.current.add('a');
          else keysPressed.current.add('d');
        } else {
          if (y < centerY) keysPressed.current.add('w');
          else keysPressed.current.add('s');
        }
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      event.preventDefault();
      // Clear all movement keys on touch end
      keysPressed.current.delete('w');
      keysPressed.current.delete('a');
      keysPressed.current.delete('s');
      keysPressed.current.delete('d');
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!mouse.current.isLocked || !gameStateRef.current) return;

      const { camera, player } = gameStateRef.current;
      const sensitivity = 0.005;

      // Store current rotation
      if (!mouse.current.pitch) mouse.current.pitch = 0;
      if (!mouse.current.yaw) mouse.current.yaw = 0;

      mouse.current.yaw -= event.movementX * sensitivity;
      mouse.current.pitch -= event.movementY * sensitivity;
      mouse.current.pitch = Math.max(-Math.PI/3, Math.min(Math.PI/3, mouse.current.pitch));

      // Update camera rotation only when mouse is locked
      const playerPos = player.mesh.position;
      const distance = 15;
      
      // Calculate camera position in orbital movement around player
      const x = playerPos.x + distance * Math.sin(mouse.current.yaw) * Math.cos(mouse.current.pitch);
      const y = playerPos.y + 8 + distance * Math.sin(mouse.current.pitch) * 0.5; // Limit vertical movement
      const z = playerPos.z + distance * Math.cos(mouse.current.yaw) * Math.cos(mouse.current.pitch);
      
      camera.position.set(x, y, z);
      camera.lookAt(playerPos.x, playerPos.y + 1, playerPos.z);
    };

    const handleClick = () => {
      if (gameStatus === 'playing') {
        fireBullet();
      }
    };

    const handlePointerLockChange = () => {
      mouse.current.isLocked = document.pointerLockElement === mountRef.current?.firstChild;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, [gameStatus, fireBullet]);

  // Initialize game
  useEffect(() => {
    console.log('Initializing game...');
    try {
      initializeGame();
      console.log('Game initialized successfully');
    } catch (error) {
      console.error('Failed to initialize game:', error);
    }
    
    return () => {
      console.log('Cleaning up game...');
      if (gameStateRef.current?.renderer.domElement.parentNode) {
        gameStateRef.current.renderer.domElement.parentNode.removeChild(
          gameStateRef.current.renderer.domElement
        );
      }
      if (statsRef.current?.dom.parentNode) {
        statsRef.current.dom.parentNode.removeChild(statsRef.current.dom);
      }
    };
  }, [initializeGame]);

  const startGame = () => {
    console.log('Starting game...');
    if (!gameStateRef.current) {
      console.error('Game state not initialized');
      return;
    }
    
    try {
      setGameStatus('playing');
      gameStateRef.current.isPlaying = true;
      
      // Initialize player stats
      setPlayerStats({
        health: 100,
        maxHealth: 100,
        ammo: 100,
        maxAmmo: 100,
        score: 0,
        kills: 0,
        wave: 1
      });
      
      spawnWave();
      gameLoop();

      // Request pointer lock for desktop only
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      console.log('Is mobile device:', isMobile);
      
      if (!isMobile && mountRef.current?.firstChild) {
        console.log('Requesting pointer lock...');
        (mountRef.current.firstChild as HTMLElement).requestPointerLock();
      }
      
      console.log('Game started successfully');
    } catch (error) {
      console.error('Error starting game:', error);
      toast({
        title: "خطأ في بدء اللعبة",
        description: "حدث خطأ أثناء بدء اللعبة. جرب مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const pauseGame = () => {
    if (!gameStateRef.current) return;
    
    if (gameStatus === 'playing') {
      setGameStatus('paused');
      gameStateRef.current.isPlaying = false;
    } else if (gameStatus === 'paused') {
      setGameStatus('playing');
      gameStateRef.current.isPlaying = true;
      gameLoop();
    }
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
                حرب الذكاء الاصطناعي 3D - محرك فيزياء حقيقي
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {gameStatus === 'playing' && (
                <Button onClick={pauseGame} variant="outline" size="sm">
                  إيقاف مؤقت
                </Button>
              )}
              <Badge variant="outline" className="border-red-500 text-red-400">
                الموجة: {playerStats.wave}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Game Stats */}
        {gameStatus !== 'menu' && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-500/30">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-green-400">{playerStats.health}</div>
                <div className="text-xs text-green-300">الصحة</div>
                <Progress value={(playerStats.health / playerStats.maxHealth) * 100} className="mt-1 h-1" />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-500/30">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-blue-400">{playerStats.ammo}</div>
                <div className="text-xs text-blue-300">الذخيرة</div>
                <Progress value={(playerStats.ammo / playerStats.maxAmmo) * 100} className="mt-1 h-1" />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-yellow-500/30">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-yellow-400">{playerStats.score}</div>
                <div className="text-xs text-yellow-300">النقاط</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-500/30">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-red-400">{playerStats.kills}</div>
                <div className="text-xs text-red-300">القتلى</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-500/30">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-purple-400">{playerStats.wave}</div>
                <div className="text-xs text-purple-300">الموجة</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Full Screen Game Container */}
        <div className="fixed inset-0 z-10">
          <div className="relative w-full h-full">
            <div 
              ref={mountRef} 
              className="w-full h-full overflow-hidden bg-black"
              style={{ width: '100vw', height: '100vh' }}
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
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 text-lg"
                      size="lg"
                    >
                      <Target className="w-5 h-5 mr-2" />
                      ادخل المعركة
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {gameStatus === 'paused' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
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

            {gameStatus === 'gameOver' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90">
                <Card className="bg-gradient-to-br from-red-900/50 to-gray-900/30 border-red-500/30">
                  <CardHeader>
                    <CardTitle className="text-center text-red-400 text-xl">
                      انتهت اللعبة!
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-yellow-400 font-bold">{playerStats.score}</div>
                        <div className="text-gray-400">النقاط</div>
                      </div>
                      <div>
                        <div className="text-red-400 font-bold">{playerStats.kills}</div>
                        <div className="text-gray-400">القتلى</div>
                      </div>
                      <div>
                        <div className="text-purple-400 font-bold">{playerStats.wave}</div>
                        <div className="text-gray-400">الموجة</div>
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

            {/* Mobile Touch Controls */}
            {gameStatus === 'playing' && (
              <>
                {/* Movement Joystick */}
                <div className="absolute bottom-8 left-8 w-24 h-24 bg-white/20 rounded-full border-2 border-white/40 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/60 rounded-full shadow-lg"></div>
                </div>

                {/* Fire Button */}
                <div 
                  className="absolute bottom-8 right-8 w-20 h-20 bg-red-600/80 rounded-full border-4 border-red-400/60 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                  onTouchStart={(e) => {
                    e.preventDefault();
                    fireBullet();
                  }}
                  onClick={fireBullet}
                >
                  <Target className="w-8 h-8 text-white" />
                </div>

                {/* Pause Button */}
                <div 
                  className="absolute top-8 right-8 w-12 h-12 bg-gray-700/80 rounded-full border-2 border-gray-500/60 flex items-center justify-center cursor-pointer"
                  onClick={pauseGame}
                >
                  <div className="w-1 h-6 bg-white rounded mx-1"></div>
                  <div className="w-1 h-6 bg-white rounded mx-1"></div>
                </div>

                {/* Mobile HUD */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                  <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2 space-y-1">
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <Heart className="w-4 h-4" />
                      <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
                          style={{ width: `${(playerStats.health / playerStats.maxHealth) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs">{playerStats.health}</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-400 text-sm">
                      <Zap className="w-4 h-4" />
                      <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300"
                          style={{ width: `${(playerStats.ammo / playerStats.maxAmmo) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs">{playerStats.ammo}</span>
                    </div>
                  </div>
                  
                  <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2 text-right">
                    <div className="text-yellow-400 text-lg font-bold">{playerStats.score}</div>
                    <div className="text-gray-300 text-xs">النقاط</div>
                    <div className="text-red-400 text-sm font-bold">{playerStats.kills}</div>
                    <div className="text-gray-300 text-xs">القتلى</div>
                    <div className="text-purple-400 text-sm font-bold">الموجة {playerStats.wave}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Instructions */}
        <Card className="bg-gradient-to-br from-gray-900/50 to-black/30 border-gray-500/30">
          <CardHeader>
            <CardTitle className="text-gray-400 text-center">التحكم والإرشادات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
              <div>
                <h4 className="font-bold text-white mb-2">الحركة:</h4>
                <ul className="space-y-1">
                  <li>• W, A, S, D: الحركة</li>
                  <li>• الماوس: النظر والتصويب</li>
                  <li>• مسافة أو الماوس: إطلاق النار</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-2">اللعبة:</h4>
                <ul className="space-y-1">
                  <li>• تجنب نيران الأعداء</li>
                  <li>• استخدم المباني للاختباء</li>
                  <li>• الذخيرة تتجدد تلقائياً</li>
                  <li>• 4 أنواع أعداء مختلفة</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}