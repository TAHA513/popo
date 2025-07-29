import React, { useState, useRef, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Heart, MessageCircle, Share, Gift, Users, ArrowLeft, Volume2, VolumeX, Send, X, CheckCircle, Trash2, Mic, MicOff, Play, Pause, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { apiRequest } from "@/lib/queryClient";

interface Stream {
  id: number;
  title: string;
  hostId: string;
  hostName: string;
  hostProfileImage?: string;
  zegoRoomId: string;
  zegoStreamId: string;
  startedAt: string;
  viewerCount: number;
  isActive: boolean;
}

export default function WatchStreamPage() {
  const params = useParams();
  const id = params.id;
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const streamContainerRef = useRef<HTMLDivElement>(null);
  const [zegoInstance, setZegoInstance] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(1);
  const [likes, setLikes] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [streamDuration, setStreamDuration] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(true);
  const [floatingHearts, setFloatingHearts] = useState<Array<{id: number; x: number; y: number}>>([]);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  
  // حالات التسجيل الصوتي
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null);
  
  // حالات تشغيل الرسائل الصوتية
  const [playingMessageId, setPlayingMessageId] = useState<number | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // جلب الرسائل الحقيقية من قاعدة البيانات
  const { data: realComments, refetch: refetchComments } = useQuery<any[]>({
    queryKey: ['/api/streams', id, 'messages'],
    enabled: !!id,
    refetchInterval: 1000, // تحديث كل ثانية لعرض التعليقات مباشرة
  });

  // جلب بيانات البث
  const { data: stream, isLoading, error } = useQuery<Stream>({
    queryKey: ['/api/streams', id],
    enabled: !!id
  });

  // تحديث التعليقات عند وصول بيانات جديدة
  useEffect(() => {
    if (realComments && realComments.length > 0) {
      const formattedComments = realComments.map(msg => ({
        id: msg.id,
        username: msg.username || msg.firstName || 'مستخدم',
        text: msg.message,
        timestamp: new Date(msg.sentAt).getTime(),
        userId: msg.userId
      }));
      setComments(formattedComments);
    }
  }, [realComments]);

  // حساب مدة البث
  useEffect(() => {
    if (!stream?.startedAt) return;
    
    const startTime = new Date(stream.startedAt).getTime();
    const timer = setInterval(() => {
      const now = Date.now();
      const duration = Math.floor((now - startTime) / 1000);
      setStreamDuration(duration);
    }, 1000);

    return () => clearInterval(timer);
  }, [stream]);

  // إرسال تعليق
  const handleSendComment = async () => {
    if (!newComment.trim() || !user || !id) return;

    try {
      await apiRequest(`/api/streams/${id}/messages`, 'POST', {
        message: newComment.trim()
      });
      setNewComment('');
      refetchComments();
    } catch (error) {
      console.error('خطأ في إرسال التعليق:', error);
    }
  };

  // وظائف التسجيل الصوتي
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      // عداد الوقت - حد أقصى 30 ثانية
      const interval = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 30) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
      setRecordingInterval(interval);

    } catch (error) {
      console.error('خطأ في الوصول للميكروفون:', error);
      alert('يرجى السماح بالوصول للميكروفون لإرسال رسائل صوتية');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
    }
  };

  const sendAudioMessage = async () => {
    if (!audioBlob || !user) return;

    try {
      // محاكاة إرسال الرسالة الصوتية كرسالة نصية مؤقتاً
      await apiRequest(`/api/streams/${id}/messages`, 'POST', {
        message: `🎤 رسالة صوتية (${recordingTime} ثانية)`
      });
      
      // إعادة تعيين حالة التسجيل
      setAudioBlob(null);
      setRecordingTime(0);
      refetchComments();
    } catch (error) {
      console.error('خطأ في إرسال الرسالة الصوتية:', error);
      alert('فشل في إرسال الرسالة الصوتية');
    }
  };

  const cancelRecording = () => {
    setAudioBlob(null);
    setRecordingTime(0);
  };

  // وظائف تشغيل الرسائل الصوتية
  const playVoiceMessage = async (messageId: number, duration: number) => {
    // إيقاف أي تشغيل سابق
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    
    setPlayingMessageId(messageId);
    
    try {
      // إنشاء صوت محاكاة باستخدام Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // ربط العقد الصوتية
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // إعداد نغمة صوتية جميلة ومسموعة
      oscillator.type = 'sine'; // موجة ناعمة
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // تردد أعلى وأوضح
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + duration / 2);
      oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + duration);
      
      // تدرج صوت واضح ومسموع
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + duration / 2);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      // تشغيل الصوت
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
      
      // إيقاف التشغيل بعد انتهاء المدة
      oscillator.onended = () => {
        setPlayingMessageId(null);
        setAudioElement(null);
        audioContext.close();
      };
      
      // حفظ مرجع للصوت الحالي
      setAudioElement(oscillator as any);
      
      // إنهاء التشغيل تلقائياً بعد المدة المحددة
      setTimeout(() => {
        setPlayingMessageId(null);
        setAudioElement(null);
      }, duration * 1000);
      
    } catch (error) {
      console.error('خطأ في تشغيل الرسالة الصوتية:', error);
      // في حالة الفشل، استخدم محاكاة بصرية فقط
      setTimeout(() => {
        setPlayingMessageId(null);
        setAudioElement(null);
      }, duration * 1000);
    }
  };

  const stopVoiceMessage = () => {
    if (audioElement) {
      try {
        if (audioElement.stop) {
          audioElement.stop();
        } else if (audioElement.pause) {
          audioElement.pause();
          audioElement.currentTime = 0;
        }
      } catch (error) {
        console.log('إيقاف التشغيل');
      }
    }
    setPlayingMessageId(null);
    setAudioElement(null);
  };

  // تم إزالة ZegoCloud - هذه صفحة دردشة نصية خالصة
  useEffect(() => {
    // محاكاة عدد المشاهدين
    setViewerCount(Math.floor(Math.random() * 50) + 1);
  }, []);

  // تنسيق مدة البث
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mb-4"></div>
          <p className="text-lg">جاري تحميل الدردشة...</p>
        </div>
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">الدردشة غير متاحة</h2>
          <p className="mb-6">عذراً، لا يمكن العثور على هذه الدردشة أو انتهت الجلسة</p>
          <Button 
            onClick={() => setLocation('/')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            العودة للرئيسية
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* حاوية البث الرئيسية */}
      <div className="absolute inset-0">
        {/* أزرار التحكم العلوية - مختلفة للمضيف والمشاهدين */}
        <div className="absolute top-4 left-4 z-50 flex gap-2">
          {/* زر العودة - فقط للمشاهدين */}
          {user && stream.hostId !== user.id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/')}
              className="bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5 ml-2" />
              عودة
            </Button>
          )}
          
          {/* زر إغلاق الدردشة - فقط للمضيف */}
          {user && stream.hostId === user.id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCloseDialog(true)}
              className="bg-gradient-to-r from-red-500/80 to-pink-600/80 text-white hover:from-red-600/90 hover:to-pink-700/90 backdrop-blur-sm border border-red-400/50 shadow-lg transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center border border-white/30 shadow-inner">
                  <X className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold">إغلاق الدردشة</span>
              </div>
            </Button>
          )}
        </div>

        {/* معلومات الدردشة العلوية */}
        <div className="absolute top-4 right-4 z-50 bg-black/50 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-400 font-bold">دردشة</span>
            <span className="text-white">•</span>
            <span className="text-white">{formatDuration(streamDuration)}</span>
          </div>
        </div>

        {/* منطقة الدردشة الرئيسية مع تصميم مخصص */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6 overflow-y-auto">
          {/* تصميم خلفية مخصصة للدردشة */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full blur-2xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-br from-green-500 to-teal-600 rounded-full blur-3xl animate-pulse delay-2000"></div>
            <div className="absolute bottom-40 right-10 w-28 h-28 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full blur-2xl animate-pulse delay-3000"></div>
          </div>
          
          {/* شخصية متحركة للدردشة */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-10">
            <div className="text-9xl animate-bounce">💬</div>
          </div>
          
          <div className="relative max-w-2xl mx-auto space-y-4 pt-20 pb-40">
            <div className="text-center mb-8">
              <div className="relative inline-block">
                <h2 className="text-3xl font-bold text-white mb-2 relative z-10">
                  🎭 دردشة LaaBoBo المباشرة
                </h2>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 blur-lg opacity-30 animate-pulse"></div>
              </div>
              <p className="text-gray-200 text-lg">انضم للمحادثة مع {stream.hostName}</p>
            </div>
            
            {/* الرسائل مع تصميم محسن */}
            <div className="space-y-4">
              {comments.map((message, index) => (
                <div key={message.id} className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/30 shadow-xl transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-white/30 shadow-lg">
                      {message.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                      <button 
                        onClick={() => {
                          if (message.userId && message.userId !== user?.id) {
                            // حفظ الرابط الحالي في localStorage للعودة إليه
                            localStorage.setItem('previousPage', `/stream/${stream.id}`);
                            setLocation(`/user/${message.userId}`);
                          }
                        }}
                        className="text-blue-300 font-bold text-sm hover:text-blue-200 transition-colors cursor-pointer underline hover:no-underline"
                      >
                        {message.username}
                      </button>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>الآن</span>
                        <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                        <span>مباشر</span>
                      </div>
                    </div>
                  </div>
                  {message.text.includes('🎤 رسالة صوتية') ? (
                    // رسالة صوتية مع زر التشغيل
                    <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl p-4 border border-purple-400/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                            {playingMessageId === message.id ? (
                              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                            ) : (
                              <Mic className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="text-white font-bold">رسالة صوتية</p>
                            <p className="text-purple-200 text-sm">
                              {message.text.match(/\((\d+) ثانية\)/)?.[1] || '5'} ثانية
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {playingMessageId === message.id ? (
                            <Button
                              onClick={stopVoiceMessage}
                              size="sm"
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg"
                            >
                              <Pause className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              onClick={() => playVoiceMessage(message.id, parseInt(message.text.match(/\((\d+) ثانية\)/)?.[1] || '5'))}
                              size="sm"
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg"
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {playingMessageId === message.id && (
                        <div className="mt-3">
                          <div className="w-full bg-white/20 rounded-full h-2">
                            <div className="bg-gradient-to-r from-purple-400 to-blue-500 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                          </div>
                          <p className="text-purple-200 text-xs mt-1 text-center">جاري التشغيل...</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    // رسالة نصية عادية
                    <p className="text-white text-base leading-relaxed bg-black/20 rounded-xl p-3 border border-white/10">{message.text}</p>
                  )}
                </div>
              ))}
              
              {comments.length === 0 && (
                <div className="text-center py-16">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                      <MessageCircle className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
                  </div>
                  <h3 className="text-white text-xl font-bold mb-2">🎉 ابدأ المحادثة الآن!</h3>
                  <p className="text-gray-300 text-lg">كن أول من يشارك في هذه الدردشة المميزة</p>
                </div>
              )}
            </div>
          </div>
        </div>



        {/* أزرار التفاعل الجانبية - فقط للمشاهدين */}
        {user && stream.hostId !== user.id && (
          <div className="absolute right-4 bottom-32 z-50 space-y-3">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => {
                setLikes(prev => prev + 1);
                // إضافة تأثير قلوب متحركة
                const newHeart = {
                  id: Date.now(),
                  x: Math.random() * 100,
                  y: Math.random() * 100
                };
                setFloatingHearts(prev => [...prev, newHeart]);
                // إزالة القلب بعد 3 ثوان
                setTimeout(() => {
                  setFloatingHearts(prev => prev.filter(heart => heart.id !== newHeart.id));
                }, 3000);
              }}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/80 to-pink-600/80 text-white hover:from-red-600/90 hover:to-pink-700/90 backdrop-blur-md border border-white/20 shadow-lg flex flex-col items-center justify-center transition-all duration-300 hover:scale-110"
            >
              <Heart className="w-7 h-7" />
              <span className="text-xs font-bold mt-1">{likes > 999 ? `${(likes/1000).toFixed(1)}K` : likes}</span>
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={() => setShowComments(!showComments)}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/80 to-cyan-600/80 text-white hover:from-blue-600/90 hover:to-cyan-700/90 backdrop-blur-md border border-white/20 shadow-lg flex flex-col items-center justify-center transition-all duration-300 hover:scale-110"
            >
              <MessageCircle className="w-7 h-7" />
              <span className="text-xs font-bold mt-1">رسائل</span>
            </Button>

            <Button
              variant="ghost"
              size="lg"
              className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500/80 to-emerald-600/80 text-white hover:from-green-600/90 hover:to-emerald-700/90 backdrop-blur-md border border-white/20 shadow-lg flex flex-col items-center justify-center transition-all duration-300 hover:scale-110"
            >
              <Share className="w-7 h-7" />
              <span className="text-xs font-bold mt-1">شارك</span>
            </Button>

            <Button
              variant="ghost"
              size="lg"
              className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500/80 to-orange-600/80 text-white hover:from-yellow-600/90 hover:to-orange-700/90 backdrop-blur-md border border-white/20 shadow-lg flex flex-col items-center justify-center transition-all duration-300 hover:scale-110"
            >
              <Gift className="w-7 h-7" />
              <span className="text-xs font-bold mt-1">هدية</span>
            </Button>
          </div>
        )}

        {/* قلوب متحركة */}
        {floatingHearts.map((heart) => (
          <div
            key={heart.id}
            className="absolute pointer-events-none z-40"
            style={{
              left: `${heart.x}%`,
              top: `${heart.y}%`,
              animation: 'float-up 3s ease-out forwards'
            }}
          >
            <div className="text-4xl animate-pulse">❤️</div>
          </div>
        ))}

        {/* أزرار خاصة بمضيف الدردشة - بدون أيقونة القلب */}
        {user && stream.hostId === user.id && (
          <div className="absolute right-4 bottom-32 z-50 space-y-3">            
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setShowComments(!showComments)}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/80 to-cyan-600/80 text-white hover:from-blue-600/90 hover:to-cyan-700/90 backdrop-blur-md border border-white/20 shadow-lg flex flex-col items-center justify-center transition-all duration-300 hover:scale-110"
            >
              <MessageCircle className="w-7 h-7" />
              <span className="text-xs font-bold mt-1">رسائل</span>
            </Button>
          </div>
        )}

        {/* إحصائيات البث السفلية - مختلفة للمضيف والمشاهدين */}
        <div className="absolute bottom-4 left-4 right-20 z-50">
          <div className="bg-gradient-to-r from-black/80 to-gray-900/80 backdrop-blur-lg rounded-2xl p-4 border border-white/20 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 bg-blue-500/20 px-3 py-1 rounded-full">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 text-sm font-bold">{viewerCount}</span>
                <span className="text-blue-200 text-xs">مشاهد</span>
              </div>
              
              {/* إحصائيات الإعجابات - تظهر للجميع بما في ذلك المضيف */}
              <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1 rounded-full">
                <Heart className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm font-bold">{likes}</span>
                <span className="text-red-200 text-xs">إعجاب</span>
              </div>
              
              <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full">
                <MessageCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-bold">{comments.length}</span>
                <span className="text-green-200 text-xs">رسالة</span>
              </div>
            </div>
            <h3 className="text-white font-bold text-lg mb-1">{stream.title}</h3>
            <p className="text-gray-300 text-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              {user && stream.hostId === user.id ? 'أنت تستضيف هذه الدردشة' : `دردشة مباشرة مع ${stream.hostName}`}
            </p>
          </div>
        </div>

        {/* نافذة إضافة تعليق - تصميم محسن */}
        {showComments && (
          <div className="absolute bottom-20 right-2 left-2 sm:right-4 sm:left-auto sm:w-96 md:w-80 bg-gradient-to-br from-black/95 to-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/30 flex flex-col z-50 shadow-2xl pointer-events-auto">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/20 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
              <h3 className="text-white font-bold flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <span className="text-sm sm:text-base">إرسال رسالة</span>
                <div className="flex items-center gap-1 bg-red-500/90 text-white text-xs px-2 sm:px-3 py-1 rounded-full animate-pulse">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-ping"></div>
                  <span className="text-xs">LIVE</span>
                </div>
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowComments(false)}
                className="text-white hover:bg-white/20 w-8 h-8 p-0 rounded-full"
              >
                ✕
              </Button>
            </div>

            {user ? (
              <div className="p-3 sm:p-4">
                <div className="flex space-x-2 space-x-reverse">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 border-2 border-white/30 shadow-lg">
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    {/* واجهة التسجيل الصوتي أو النص */}
                    {isRecording ? (
                      <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 border-2 border-red-400/50 rounded-xl p-4">
                        <div className="flex items-center justify-center gap-3 mb-3">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-red-300 font-bold">جاري التسجيل...</span>
                          <span className="text-white bg-red-500/50 px-2 py-1 rounded-full text-sm">
                            {recordingTime}/30 ثانية
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={stopRecording}
                            size="sm"
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                          >
                            <MicOff className="w-4 h-4 ml-1" />
                            إيقاف التسجيل
                          </Button>
                        </div>
                      </div>
                    ) : audioBlob ? (
                      <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 border-2 border-green-400/50 rounded-xl p-4">
                        <div className="flex items-center justify-center gap-3 mb-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-green-300 font-bold">تم التسجيل بنجاح!</span>
                          <span className="text-white bg-green-500/50 px-2 py-1 rounded-full text-sm">
                            {recordingTime} ثانية
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={cancelRecording}
                            size="sm"
                            variant="outline"
                            className="flex-1 border-gray-500 text-gray-300 hover:bg-gray-700"
                          >
                            <X className="w-4 h-4 ml-1" />
                            إلغاء
                          </Button>
                          <Button
                            onClick={sendAudioMessage}
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Send className="w-4 h-4 ml-1" />
                            إرسال الصوت
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* واجهة الرسائل النصية والصوتية - محسنة للجوال */}
                        <div className="space-y-3">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="اكتب رسالتك هنا..."
                            className="w-full bg-gradient-to-br from-white/10 to-white/5 border-2 border-white/20 rounded-xl p-4 text-white placeholder-gray-300 resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all duration-300"
                            rows={3}
                            maxLength={200}
                          />
                          
                          {/* صف الأزرار - متجاوب مع الجوال */}
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-gray-300 text-xs bg-white/10 px-2 py-1 rounded-full flex-shrink-0">
                              {newComment.length}/200
                            </span>
                            
                            <div className="flex gap-2 flex-1 justify-end">
                              {/* زر التسجيل الصوتي - محسن للجوال */}
                              <Button
                                onClick={startRecording}
                                size="sm"
                                className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white p-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 min-w-[48px] h-12"
                                title="تسجيل رسالة صوتية (أقصى 30 ثانية)"
                              >
                                <Mic className="w-5 h-5" />
                              </Button>
                              
                              {/* زر الإرسال */}
                              <Button
                                onClick={handleSendComment}
                                disabled={!newComment.trim()}
                                size="sm"
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:from-gray-600 disabled:to-gray-600 px-4 py-2 rounded-xl shadow-lg transition-all duration-300 h-12"
                              >
                                <Send className="w-4 h-4 ml-1" />
                                <span className="hidden sm:inline">إرسال مباشر</span>
                                <span className="sm:hidden">إرسال</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center">
                <p className="text-gray-400 text-sm mb-3">
                  يجب تسجيل الدخول لإرسال الرسائل
                </p>
                <Button
                  onClick={() => setLocation('/login')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  تسجيل الدخول
                </Button>
              </div>
            )}
          </div>
        )}

        {/* نافذة حوار إغلاق البث الاحترافية */}
        <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
          <DialogContent className="max-w-md mx-auto bg-gradient-to-br from-gray-900 via-gray-800 to-black border-2 border-red-500/30 shadow-2xl">
            <div className="text-center p-6">
              {/* شعار LaaBoBo مع الأرنب */}
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/20">
                  <span className="text-4xl">🐰</span>
                </div>
                <h3 className="text-2xl font-bold text-white mt-4 mb-2">LaaBoBo</h3>
                <p className="text-gray-300 text-sm">منصة الدردشة المباشرة</p>
              </div>

              {/* رسالة التأكيد */}
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-3">تأكيد إغلاق الدردشة</h2>
                <p className="text-gray-300 text-sm leading-relaxed">
                  هل أنت متأكد من إغلاق هذه الدردشة؟
                </p>
              </div>

              {/* تفاصيل الإجراء */}
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-red-300">
                    <CheckCircle className="w-4 h-4" />
                    <span>سيتم حذف جميع الرسائل نهائياً</span>
                  </div>
                  <div className="flex items-center gap-2 text-red-300">
                    <CheckCircle className="w-4 h-4" />
                    <span>سيتم إنهاء الجلسة للجميع</span>
                  </div>
                  <div className="flex items-center gap-2 text-red-300">
                    <CheckCircle className="w-4 h-4" />
                    <span>لا يمكن استرداد البيانات بعد الحذف</span>
                  </div>
                </div>
              </div>

              {/* أزرار الإجراء */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowCloseDialog(false)}
                  variant="outline"
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      console.log("🛑 Host requesting chat deletion:", { streamId: stream.id, userId: user?.id });
                      
                      await apiRequest(`/api/streams/${stream.id}/end`, 'POST');
                      
                      console.log("✅ Chat deletion successful");
                      setShowCloseDialog(false);
                      setLocation('/');
                    } catch (error: any) {
                      console.error("❌ Failed to delete chat:", error);
                      setShowCloseDialog(false);
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  تأكيد الإغلاق
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}