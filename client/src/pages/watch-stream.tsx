import React, { useState, useRef, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, MessageCircle, Share, Gift, Users, ArrowLeft, Volume2, VolumeX, Send } from 'lucide-react';
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

  // الاتصال التلقائي بـ ZegoCloud لمشاهدة البث مباشرة
  useEffect(() => {
    if (!stream || !user || !streamContainerRef.current || zegoInstance || isConnected) {
      return;
    }

    const connectToStream = async () => {
      try {
        console.log('🔄 بدء الاتصال التلقائي بالبث...');
        const config = await apiRequest('/api/zego-config', 'GET');
        if (!config.appId || !stream.zegoRoomId) return;

        const viewerUserId = String(user.id);
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          parseInt(config.appId),
          config.appSign,
          stream.zegoRoomId,
          viewerUserId,
          user.username || 'Viewer'
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        setZegoInstance(zp);

        // الانضمام التلقائي للبث
        await zp.joinRoom({
          container: streamContainerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.LiveStreaming,
            config: {
              role: ZegoUIKitPrebuilt.Audience,
            }
          },
          turnOnMicrophoneWhenJoining: false,
          turnOnCameraWhenJoining: false,
          showMyCameraToggleButton: false,
          showMyMicrophoneToggleButton: false,
          showAudioVideoSettingsButton: false,
          showScreenSharingButton: false,
          showTextChat: false,
          showUserList: false,
          showRemoveUserButton: false,
          showPinButton: false,
          showLayoutButton: false,
          showLeaveRoomConfirmDialog: false,
          enableVideoAutoplay: true,
          enableAudioAutoplay: true,
          autoStart: true, // البدء التلقائي
          layout: "Grid",
          maxUsers: 50,
          videoResolutionDefault: ZegoUIKitPrebuilt.VideoResolution_720P,
          facingMode: "user",
          preJoinViewConfig: {
            title: '', // إخفاء شاشة ما قبل الانضمام
          },
          onJoinRoom: () => {
            console.log('✅ Viewer joined room successfully!');
            console.log('Room ID:', stream.zegoRoomId);
            console.log('User ID:', viewerUserId);
            console.log('📡 Expecting stream from host');
            setIsConnected(true);
          },
          onRoomStreamUpdate: (roomID: string, updateType: string, streamList: any[]) => {
            console.log('🔄 Stream update:', { roomID, updateType, streamList });
            if (updateType === 'ADD' && streamList.length > 0) {
              console.log('🎥 Stream available from host!');
            }
          },
          onLeaveRoom: () => {
            setIsConnected(false);
          }
        });

      } catch (error) {
        console.error('❌ Error connecting to stream:', error);
      }
    };

    // الاتصال التلقائي والفوري
    connectToStream();

    return () => {
      if (zegoInstance) {
        try {
          zegoInstance.destroy();
        } catch (error) {
          console.error('Error destroying zego instance:', error);
        }
      }
    };
  }, [stream, user]); // التشغيل التلقائي بمجرد توفر البيانات

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
          <p className="text-lg">جاري تحميل البث...</p>
        </div>
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">البث غير متاح</h2>
          <p className="mb-6">عذراً، لا يمكن العثور على هذا البث أو انتهى البث</p>
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
        {/* زر العودة */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/')}
          className="absolute top-4 left-4 z-50 bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
        >
          <ArrowLeft className="w-5 h-5 ml-2" />
          عودة
        </Button>

        {/* معلومات البث العلوية */}
        <div className="absolute top-4 right-4 z-50 bg-black/50 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-400 font-bold">مباشر</span>
            <span className="text-white">•</span>
            <span className="text-white">{formatDuration(streamDuration)}</span>
          </div>
        </div>

        {/* حاوية ZegoCloud للبث */}
        <div 
          ref={streamContainerRef} 
          className="absolute inset-0 w-full h-full bg-black"
          style={{ zIndex: 1 }}
        />

        {/* التعليقات المباشرة على الشاشة - تصميم محسن */}
        <div className="absolute bottom-32 left-4 right-20 z-50 pointer-events-none">
          {comments.length > 0 && (
            <div className="space-y-2 max-h-80 overflow-hidden">
              {comments.slice(-6).map((comment, index) => (
                <div 
                  key={comment.id} 
                  className="animate-fade-in-up transform transition-all duration-500"
                  style={{
                    animationDelay: `${index * 0.15}s`,
                    opacity: 1 - (index * 0.1)
                  }}
                >
                  <div className="bg-black/60 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20 shadow-lg max-w-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-pink-300 font-bold text-sm">{comment.username}</span>
                      <span className="text-white/60 text-xs">LIVE</span>
                    </div>
                    <div className="text-white text-sm font-medium leading-relaxed break-words">
                      {comment.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* أزرار التفاعل الجانبية - تصميم محسن */}
        <div className="absolute right-4 bottom-32 z-50 space-y-3">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setLikes(prev => prev + 1)}
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
            <span className="text-xs font-bold mt-1">{comments.length}</span>
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

        {/* إحصائيات البث السفلية - تصميم محسن */}
        <div className="absolute bottom-4 left-4 right-20 z-50">
          <div className="bg-gradient-to-r from-black/80 to-gray-900/80 backdrop-blur-lg rounded-2xl p-4 border border-white/20 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 bg-blue-500/20 px-3 py-1 rounded-full">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 text-sm font-bold">{viewerCount}</span>
                <span className="text-blue-200 text-xs">مشاهد</span>
              </div>
              <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1 rounded-full">
                <Heart className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm font-bold">{likes}</span>
                <span className="text-red-200 text-xs">إعجاب</span>
              </div>
              <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full">
                <MessageCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-bold">{comments.length}</span>
                <span className="text-green-200 text-xs">تعليق</span>
              </div>
            </div>
            <h3 className="text-white font-bold text-lg mb-1">{stream.title}</h3>
            <p className="text-gray-300 text-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              بث مباشر من {stream.hostName}
            </p>
          </div>
        </div>

        {/* نافذة إضافة تعليق - تصميم محسن */}
        {showComments && (
          <div className="absolute bottom-20 right-4 w-80 max-w-[90vw] bg-gradient-to-br from-black/95 to-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/30 flex flex-col z-50 shadow-2xl pointer-events-auto">
            <div className="flex items-center justify-between p-4 border-b border-white/20 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
              <h3 className="text-white font-bold flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <span>محادثة مباشرة</span>
                <div className="flex items-center gap-1 bg-red-500/90 text-white text-xs px-3 py-1 rounded-full animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                  LIVE
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
              <div className="p-4">
                <div className="flex space-x-2 space-x-reverse">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 border-2 border-white/30 shadow-lg">
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="شارك رأيك في البث المباشر..."
                      className="w-full bg-gradient-to-br from-white/10 to-white/5 border-2 border-white/20 rounded-xl p-4 text-white placeholder-gray-300 resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all duration-300"
                      rows={3}
                      maxLength={200}
                    />
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-gray-300 text-xs bg-white/10 px-2 py-1 rounded-full">{newComment.length}/200</span>
                      <Button
                        onClick={handleSendComment}
                        disabled={!newComment.trim()}
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:from-gray-600 disabled:to-gray-600 px-4 py-2 rounded-xl shadow-lg transition-all duration-300"
                      >
                        <Send className="w-4 h-4 ml-1" />
                        إرسال مباشر
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center">
                <p className="text-gray-400 text-sm mb-3">
                  يجب تسجيل الدخول للتعليق
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
      </div>
    </div>
  );
}