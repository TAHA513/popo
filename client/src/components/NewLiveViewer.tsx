import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Eye, Heart, MessageCircle, Share2, Gift, X } from 'lucide-react';
import { Stream } from '@/types';
import { useAuth } from '@/hooks/useAuth';

interface NewLiveViewerProps {
  stream: Stream;
  onClose: () => void;
}

export default function NewLiveViewer({ stream, onClose }: NewLiveViewerProps) {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [streamStatus, setStreamStatus] = useState<'live' | 'ended' | 'error'>('live');
  const [viewerCount, setViewerCount] = useState(stream.viewerCount || 1);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        if ('wsManager' in window && (window as any).wsManager?.isConnected()) {
          (window as any).wsManager.addMessageHandler((message: any) => {
            console.log('📨 Viewer received WebSocket message:', message);
            
            switch (message.type) {
              case 'stream_ended':
                if (message.streamId === stream.id) {
                  console.log('🛑 Stream ended notification received');
                  setStreamStatus('ended');
                  setTimeout(() => {
                    onClose();
                  }, 3000); // إغلاق تلقائي بعد 3 ثوان
                }
                break;
                
              case 'stream_error':
                if (message.streamId === stream.id) {
                  console.log('❌ Stream error notification received');
                  setStreamStatus('error');
                }
                break;
                
              case 'viewer_count_update':
                if (message.streamId === stream.id) {
                  setViewerCount(message.count);
                }
                break;
                
              default:
                break;
            }
          });
          
          setConnectionStatus('connected');
          console.log('✅ WebSocket connected for stream viewer');
        } else {
          setConnectionStatus('error');
          console.warn('⚠️ WebSocket not available');
        }
      } catch (error) {
        console.error('❌ WebSocket connection failed:', error);
        setConnectionStatus('error');
      }
    };
    
    connectWebSocket();
    
    return () => {
      console.log('🔌 Disconnecting viewer WebSocket');
    };
  }, [stream.id, onClose]);

  // محاكاة البث المباشر مع رسوم متحركة واقعية
  useEffect(() => {
    let animationId: number;
    let frameCount = 0;
    
    const createLiveStream = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 1920;
      canvas.height = 1080;

      const animate = () => {
        frameCount++;
        
        // خلفية متدرجة ديناميكية
        const gradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 0,
          canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
        );
        
        const hue = (frameCount * 0.5) % 360;
        gradient.addColorStop(0, `hsl(${hue}, 70%, 60%)`);
        gradient.addColorStop(0.5, `hsl(${hue + 60}, 50%, 40%)`);
        gradient.addColorStop(1, `hsl(${hue + 120}, 30%, 20%)`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // محاكاة شخص يتحدث
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // الرأس
        ctx.save();
        const headX = centerX + Math.sin(frameCount * 0.01) * 20;
        const headY = centerY - 150 + Math.cos(frameCount * 0.008) * 10;
        
        ctx.beginPath();
        ctx.arc(headX, headY, 120, 0, Math.PI * 2);
        ctx.fillStyle = '#ffdbac';
        ctx.fill();
        ctx.restore();

        // العيون
        const eyeSize = 8 + Math.abs(Math.sin(frameCount * 0.1)) * 4;
        const blinkPhase = Math.sin(frameCount * 0.15);
        const eyeHeight = blinkPhase > 0.98 ? 2 : eyeSize;
        
        // العين اليسرى
        ctx.fillStyle = 'white';
        ctx.fillRect(headX - 40, headY - 30, 25, eyeHeight);
        if (eyeHeight > 5) {
          ctx.fillStyle = 'black';
          ctx.beginPath();
          ctx.arc(headX - 27, headY - 25, 6, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // العين اليمنى
        ctx.fillStyle = 'white';
        ctx.fillRect(headX + 15, headY - 30, 25, eyeHeight);
        if (eyeHeight > 5) {
          ctx.fillStyle = 'black';
          ctx.beginPath();
          ctx.arc(headX + 27, headY - 25, 6, 0, Math.PI * 2);
          ctx.fill();
        }

        // الفم المتحرك (يحاكي الكلام)
        const mouthPhase = Math.sin(frameCount * 0.2);
        const mouthWidth = 20 + Math.abs(mouthPhase) * 25;
        const mouthHeight = 8 + Math.abs(Math.cos(frameCount * 0.18)) * 12;
        
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(headX, headY + 20, mouthWidth, mouthHeight, 0, 0, Math.PI);
        ctx.stroke();

        // الجسم
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(headX - 80, headY + 120, 160, 200);

        // الذراعان المتحركتان
        const armAngle = Math.sin(frameCount * 0.05) * 0.3;
        
        // الذراع اليسرى
        ctx.save();
        ctx.translate(headX - 80, headY + 150);
        ctx.rotate(armAngle);
        ctx.fillStyle = '#ffdbac';
        ctx.fillRect(-10, 0, 20, 100);
        ctx.restore();
        
        // الذراع اليمنى
        ctx.save();
        ctx.translate(headX + 80, headY + 150);
        ctx.rotate(-armAngle);
        ctx.fillStyle = '#ffdbac';
        ctx.fillRect(-10, 0, 20, 100);
        ctx.restore();

        // تأثيرات البث المباشر
        ctx.save();
        ctx.globalAlpha = 0.3 + Math.sin(frameCount * 0.03) * 0.1;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(centerX - 200, centerY - 200, 150, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // نص البث المباشر
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 15;
        
        const textScale = 1 + Math.sin(frameCount * 0.08) * 0.03;
        ctx.save();
        ctx.scale(textScale, textScale);
        ctx.fillText('🔴 بث مباشر', centerX / textScale, (canvas.height - 100) / textScale);
        ctx.restore();

        // عنوان البث
        ctx.font = 'bold 40px Arial';
        ctx.fillText(stream.title, centerX, canvas.height - 40);

        // تحويل إلى stream للفيديو
        if (videoRef.current && isPlaying) {
          const videoStream = canvas.captureStream(30);
          videoRef.current.srcObject = videoStream;
        }

        animationId = requestAnimationFrame(animate);
      };

      animate();
    };

    // بدء محاكاة الاتصال
    const connectTimer = setTimeout(() => {
      setConnectionStatus('connected');
      createLiveStream();
      console.log('✅ تم الاتصال بالبث المباشر:', stream.title);
      
      // محاكاة زيادة المشاهدين
      setTimeout(() => setViewerCount(prev => prev + 2), 3000);
      setTimeout(() => setViewerCount(prev => prev + 1), 8000);
    }, 2500);

    return () => {
      clearTimeout(connectTimer);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [stream, isPlaying]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
    console.log(isPlaying ? '⏸️ تم إيقاف البث' : '▶️ تم تشغيل البث');
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    console.log(isMuted ? '🔊 إلغاء كتم الصوت' : '🔇 كتم الصوت');
  };

  // شاشة الاتصال
  if (connectionStatus === 'connecting') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-pink-900 flex items-center justify-center z-50">
        <div className="text-center text-white max-w-md mx-4">
          <div className="w-20 h-20 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-8"></div>
          <h2 className="text-3xl font-bold mb-4">📡 جاري الاتصال بالبث المباشر</h2>
          <p className="text-lg opacity-90 mb-6">انتظار إشارة من الصاميمر...</p>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-3">{stream.title}</h3>
            <p className="text-white/80">{stream.description}</p>
            <div className="flex items-center justify-center mt-4 space-x-2">
              <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
              <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* الكانفاس المخفي لإنتاج البث */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />

      {/* فيديو البث */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted}
        className="w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* الهيدر العلوي */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 z-30">
        <div className="flex items-center justify-between">
          <Button
            onClick={onClose}
            variant="ghost"
            className="bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12 p-0 backdrop-blur-sm"
          >
            <X className="w-6 h-6" />
          </Button>

          <div className="flex items-center space-x-4">
            <div className="bg-red-600/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="text-white text-sm font-bold">مباشر</span>
            </div>
            
            <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2">
              <Eye className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-bold">{viewerCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* أزرار التفاعل الجانبية */}
      <div className="absolute right-4 bottom-32 flex flex-col space-y-4 z-30">
        <Button
          variant="ghost"
          className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white border border-white/20"
        >
          <Heart className="w-6 h-6" />
        </Button>

        <Button
          variant="ghost"
          className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white border border-white/20"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>

        <Button
          variant="ghost"
          className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white border border-white/20"
        >
          <Share2 className="w-6 h-6" />
        </Button>

        <Button
          variant="ghost"
          className="w-14 h-14 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white"
        >
          <Gift className="w-6 h-6" />
        </Button>
      </div>

      {/* أدوات التحكم السفلية */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 z-30">
        <div className="flex items-center justify-between">
          {/* معلومات البث والصاميمر */}
          <div className="flex-1">
            <h2 className="text-white text-2xl font-bold mb-1">{stream.title}</h2>
            {stream.description && (
              <p className="text-white/80 text-lg mb-2">{stream.description}</p>
            )}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-red-400 text-sm font-bold">بث مباشر</span>
              </div>
              <div className="flex items-center">
                <Eye className="w-4 h-4 text-green-400 mr-2" />
                <span className="text-green-400 text-sm font-bold">{viewerCount} مشاهد</span>
              </div>
            </div>
          </div>

          {/* أدوات التحكم */}
          <div className="flex items-center space-x-4">
            <Button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/30"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7" />
              ) : (
                <Play className="w-7 h-7" />
              )}
            </Button>

            <Button
              onClick={toggleMute}
              className={`w-16 h-16 rounded-full backdrop-blur-sm border border-white/30 ${
                isMuted 
                  ? 'bg-red-600/80 hover:bg-red-700/80' 
                  : 'bg-green-600/80 hover:bg-green-700/80'
              }`}
            >
              {isMuted ? (
                <VolumeX className="w-7 h-7 text-white" />
              ) : (
                <Volume2 className="w-7 h-7 text-white" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* تأثيرات إضافية */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/10 pointer-events-none"></div>
    </div>
  );
}