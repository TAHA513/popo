import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SimpleWarTest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const mountRef = useRef<HTMLDivElement>(null);
  const [gameStatus, setGameStatus] = useState<'menu' | 'playing'>('menu');
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);

  const startGame = () => {
    console.log('Starting simple game test...');
    
    try {
      if (!mountRef.current) {
        console.error('Mount ref is null');
        return;
      }

      // Clear any existing content
      mountRef.current.innerHTML = '';

      // Create scene
      const newScene = new THREE.Scene();
      newScene.background = new THREE.Color(0x001122);

      // Create camera
      const newCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      newCamera.position.set(0, 5, 10);

      // Create renderer
      const newRenderer = new THREE.WebGLRenderer({ antialias: true });
      newRenderer.setSize(window.innerWidth, window.innerHeight);
      mountRef.current.appendChild(newRenderer.domElement);

      // Add a simple cube
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const cube = new THREE.Mesh(geometry, material);
      newScene.add(cube);

      // Add lighting
      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(5, 5, 5);
      newScene.add(light);

      // Set state
      setScene(newScene);
      setRenderer(newRenderer);
      setCamera(newCamera);
      
      // Start animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        newRenderer.render(newScene, newCamera);
      };
      animate();

      setGameStatus('playing');
      console.log('Simple game started successfully!');
      
      toast({
        title: "تم بدء اللعبة!",
        description: "اللعبة تعمل بنجاح الآن",
      });

    } catch (error) {
      console.error('Error starting simple game:', error);
      toast({
        title: "خطأ في بدء اللعبة",
        description: "حدث خطأ أثناء بدء اللعبة. جرب مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const stopGame = () => {
    console.log('Stopping game...');
    setGameStatus('menu');
    if (mountRef.current) {
      mountRef.current.innerHTML = '';
    }
    setScene(null);
    setRenderer(null);
    setCamera(null);
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
              <h1 className="text-xl font-bold text-red-400">
                اختبار اللعبة البسيط
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

      {/* Game Container */}
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
                    اختبار اللعبة البسيط
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="text-gray-300 text-sm">
                    هذا اختبار بسيط للتأكد من عمل الزر
                    <br />
                    سيظهر مكعب أحمر دوار في اللعبة
                  </div>
                  <Button 
                    onClick={startGame} 
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 text-lg"
                    size="lg"
                  >
                    <Target className="w-5 h-5 mr-2" />
                    ابدأ الاختبار
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