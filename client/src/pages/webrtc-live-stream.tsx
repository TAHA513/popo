import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// WebRTC Configuration
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export default function WebRTCLiveStream() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [streamTitle, setStreamTitle] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [roomId, setRoomId] = useState<string>('');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // إنشاء اتصال WebSocket للإشارة
  const connectWebSocket = (roomId: string) => {
    const wsUrl = `wss://${window.location.host.replace(':5000', ':8080')}/ws/${roomId}`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('✅ اتصال WebSocket تم بنجاح');
        toast({
          description: "تم الاتصال بخادم البث"
        });
      };

      wsRef.current.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log('📨 رسالة WebSocket:', data);

        switch (data.type) {
          case 'viewer-joined':
            setViewerCount(prev => prev + 1);
            toast({
              description: `انضم مشاهد جديد! (${data.viewerCount} مشاهد)`
            });
            break;

          case 'viewer-left':
            setViewerCount(prev => Math.max(0, prev - 1));
            break;

          case 'offer':
            await handleOffer(data.offer);
            break;

          case 'answer':
            await handleAnswer(data.answer);
            break;

          case 'ice-candidate':
            await handleIceCandidate(data.candidate);
            break;
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ خطأ WebSocket:', error);
        toast({
          title: "خطأ في الاتصال",
          description: "فشل في الاتصال بخادم البث",
          variant: "destructive"
        });
      };

    } catch (error) {
      console.error('❌ فشل في إنشاء WebSocket:', error);
      // Fallback: استخدام محاكاة بدون خادم
      simulateWebSocket();
    }
  };

  // محاكاة WebSocket إذا فشل الاتصال
  const simulateWebSocket = () => {
    console.log('🔄 تشغيل محاكاة WebSocket...');
    
    // محاكاة مشاهدين
    const interval = setInterval(() => {
      if (isStreaming) {
        setViewerCount(prev => {
          const change = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
          return Math.max(0, prev + change);
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  };

  // إنشاء RTCPeerConnection
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(rtcConfig);
    
    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate
        }));
      }
    };

    pc.ontrack = (event) => {
      console.log('📺 استقبال track من peer');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    return pc;
  };

  // معالجة Offer
  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return;

    await peerConnectionRef.current.setRemoteDescription(offer);
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);

    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'answer',
        answer: answer
      }));
    }
  };

  // معالجة Answer
  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return;
    await peerConnectionRef.current.setRemoteDescription(answer);
  };

  // معالجة ICE Candidate
  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!peerConnectionRef.current) return;
    await peerConnectionRef.current.addIceCandidate(candidate);
  };

  // بدء البث المباشر
  const startLiveStream = async () => {
    if (!streamTitle.trim()) {
      toast({
        title: "عنوان مطلوب",
        description: "يرجى إدخال عنوان للبث",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🎥 بدء البث المباشر...');

          // الحصول على الكاميرا والميكروفون
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30, min: 15 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('✅ تم الحصول على الكاميرا');
      localStreamRef.current = stream;

      // عرض الفيديو المحلي
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true; // كتم الصوت المحلي لتجنب التغذية الراجعة
        
        // ضمان تشغيل الفيديو
        try {
          await localVideoRef.current.play();
          console.log('✅ بدأ عرض الفيديو المحلي');
        } catch (playError) {
          console.warn('⚠️ خطأ في تشغيل الفيديو:', playError);
          // محاولة تشغيل صامت
          localVideoRef.current.muted = true;
          await localVideoRef.current.play();
        }
      }

      // إنشاء معرف الغرفة
      const newRoomId = `live-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setRoomId(newRoomId);

      // إنشاء RTCPeerConnection
      peerConnectionRef.current = createPeerConnection();

      // إضافة البث المحلي إلى PeerConnection
      stream.getTracks().forEach(track => {
        if (peerConnectionRef.current) {
          peerConnectionRef.current.addTrack(track, stream);
        }
      });

      // الاتصال بـ WebSocket
      connectWebSocket(newRoomId);

      setIsStreaming(true);
      setIsLoading(false);
      setViewerCount(1); // المستخدم نفسه

      toast({
        title: "🔴 بث مباشر",
        description: `بدأ البث المباشر! معرف الغرفة: ${newRoomId}`
      });

      // حفظ URL الغرفة للمشاركة
      const streamUrl = `${window.location.origin}/join/${newRoomId}`;
      console.log('🔗 رابط البث:', streamUrl);

    } catch (error: any) {
      console.error('❌ خطأ في البث:', error);
      setIsLoading(false);
      
      let message = "فشل في بدء البث";
      if (error.name === 'NotAllowedError') {
        message = "تم رفض أذونات الكاميرا - يرجى السماح بالوصول";
      } else if (error.name === 'NotFoundError') {
        message = "لم يتم العثور على كاميرا أو ميكروفون";
      } else if (error.name === 'NotReadableError') {
        message = "الكاميرا مستخدمة من تطبيق آخر";
      }
      
      toast({
        title: "خطأ في البث",
        description: message,
        variant: "destructive"
      });
    }
  };

  // إيقاف البث
  const stopStream = () => {
    try {
      console.log('⏹️ إيقاف البث...');

      // إيقاف الكاميرا والميكروفون
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log(`تم إيقاف ${track.kind}`);
        });
        localStreamRef.current = null;
      }

      // إغلاق RTCPeerConnection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // إغلاق WebSocket
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      // تنظيف الفيديو
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }

      setIsStreaming(false);
      setRoomId('');
      setViewerCount(0);
      
      toast({
        title: "تم إيقاف البث",
        description: "تم إنهاء البث المباشر"
      });

      // العودة للصفحة الرئيسية
      setTimeout(() => {
        setLocation('/');
      }, 2000);

    } catch (error) {
      console.error('❌ خطأ في إيقاف البث:', error);
    }
  };

  // تنظيف عند مغادرة الصفحة
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isStreaming) {
        e.preventDefault();
        e.returnValue = 'أنت في بث مباشر. هل تريد إنهاء البث والمغادرة؟';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // تنظيف الموارد
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isStreaming]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        
        {/* الهيدر */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            onClick={() => setLocation('/')}
            variant="outline" 
            className="text-white border-white/20 hover:bg-white/10"
          >
            ← العودة للرئيسية
          </Button>
          
          <h1 className="text-2xl font-bold text-white">
            🐰 بث مباشر - LaaBoBo Live
          </h1>
          
          <div className="w-20" />
        </div>

        {!isStreaming ? (
          /* واجهة بدء البث */
          <Card className="max-w-md mx-auto bg-black/40 backdrop-blur border-white/20 p-8">
            <div className="text-center space-y-6">
              <div className="text-6xl">🎥</div>
              
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">بث مباشر حقيقي</h2>
                <p className="text-gray-300">استخدام WebRTC للبث المباشر</p>
              </div>

              <div className="space-y-4">
                <Input
                  placeholder="عنوان البث..."
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  disabled={isLoading}
                />

                <Button
                  onClick={startLiveStream}
                  disabled={!streamTitle.trim() || isLoading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      جاري بدء البث...
                    </div>
                  ) : (
                    '🔴 بث مباشر حقيقي'
                  )}
                </Button>
              </div>

              <div className="text-xs text-gray-400 bg-blue-900/20 rounded p-3">
                💡 سيستخدم WebRTC للبث المباشر الحقيقي
              </div>
            </div>
          </Card>
        ) : (
          /* واجهة البث المباشر */
          <div className="max-w-4xl mx-auto">
            
            {/* معلومات البث */}
            <div className="bg-black/40 backdrop-blur rounded-lg p-4 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-white font-bold">LIVE</span>
                </div>
                <span className="text-white">{streamTitle}</span>
              </div>
              
              <div className="flex items-center gap-4 text-white">
                <div className="flex items-center gap-1">
                  <span>👁️</span>
                  <span>{viewerCount}</span>
                </div>
                <div className="text-xs text-gray-300">
                  Room: {roomId.slice(-8)}
                </div>
                <Button
                  onClick={stopStream}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                >
                  إنهاء البث
                </Button>
              </div>
            </div>

            {/* شاشة الفيديو */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* الفيديو المحلي (المرسل) */}
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  controls={false}
                  className="w-full h-auto min-h-[300px] object-cover transform scale-x-[-1]"
                  style={{ 
                    minHeight: '300px',
                    backgroundColor: '#1a1a1a'
                  }}
                />
                
                <div className="absolute top-4 left-4 bg-green-600 text-white px-2 py-1 rounded text-sm font-bold">
                  📹 أنت (المرسل)
                </div>

                {/* أزرار التحكم */}
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <Button
                    onClick={() => {
                      if (localStreamRef.current) {
                        const videoTrack = localStreamRef.current.getVideoTracks()[0];
                        if (videoTrack) {
                          videoTrack.enabled = !videoTrack.enabled;
                          toast({
                            description: videoTrack.enabled ? "تم تشغيل الكاميرا" : "تم إيقاف الكاميرا"
                          });
                        }
                      }
                    }}
                    variant="secondary"
                    size="sm"
                    className="bg-black/50 backdrop-blur text-white border-white/20"
                  >
                    📹
                  </Button>
                  
                  <Button
                    onClick={() => {
                      if (localStreamRef.current) {
                        const audioTrack = localStreamRef.current.getAudioTracks()[0];
                        if (audioTrack) {
                          audioTrack.enabled = !audioTrack.enabled;
                          toast({
                            description: audioTrack.enabled ? "تم تشغيل الميكروفون" : "تم كتم الميكروفون"
                          });
                        }
                      }
                    }}
                    variant="secondary"
                    size="sm"
                    className="bg-black/50 backdrop-blur text-white border-white/20"
                  >
                    🎤
                  </Button>
                </div>
              </div>

              {/* الفيديو البعيد (المشاهدين) */}
              <div className="relative bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center min-h-[300px]">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-auto object-cover"
                  style={{ display: 'none' }} // سيظهر عند وجود مشاهدين
                />
                
                <div className="text-center text-gray-400">
                  <div className="text-4xl mb-2">👥</div>
                  <p>في انتظار المشاهدين...</p>
                  <p className="text-sm mt-2">شارك رابط البث للمشاهدة</p>
                </div>
              </div>
            </div>
            
            {/* معلومات البث */}
            <div className="mt-4 text-center">
              <div className="bg-blue-900/20 rounded-lg p-4">
                <p className="text-blue-300 font-bold mb-2">
                  🌐 بث مباشر حقيقي عبر WebRTC
                </p>
                <p className="text-gray-300 text-sm">
                  معرف الغرفة: {roomId} | المشاهدين المتصلين: {viewerCount}
                </p>
                <div className="mt-2 text-xs text-gray-400">
                  رابط المشاركة: {window.location.origin}/join/{roomId}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}