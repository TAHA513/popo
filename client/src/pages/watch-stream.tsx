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
  
  // Redirect to live chat immediately
  useEffect(() => {
    setLocation('/live-chat');
  }, []);
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mb-4"></div>
        <p className="text-lg">جاري التحويل للدردشة المباشرة...</p>
      </div>
    </div>
  );
}

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

        {/* التعليقات المباشرة على الشاشة - مثل TikTok بدون خلفية */}
        <div className="absolute bottom-32 left-4 right-20 z-50 pointer-events-none">
          {comments.length > 0 && (
            <div className="space-y-3 max-h-80 overflow-hidden">
              {comments.slice(-5).map((comment, index) => (
                <div 
                  key={comment.id} 
                  className="animate-fade-in-up opacity-90"
                  style={{
                    animationDelay: `${index * 0.2}s`,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                  }}
                >
                  <div className="text-white text-sm font-medium">
                    <span className="text-pink-400 font-bold">{comment.username}</span>
                    <span className="text-red-400 ml-2">🔴</span>
                  </div>
                  <div className="text-white text-base font-normal mt-1 leading-relaxed">
                    {comment.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* أزرار التفاعل الجانبية */}
        <div className="absolute right-4 bottom-32 z-50 space-y-4">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setLikes(prev => prev + 1)}
            className="w-14 h-14 rounded-full bg-black/50 text-white hover:bg-red-500/50 backdrop-blur-sm flex flex-col items-center justify-center"
          >
            <Heart className="w-6 h-6" />
            <span className="text-xs mt-1">{likes}</span>
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onClick={() => setShowComments(!showComments)}
            className="w-14 h-14 rounded-full bg-black/50 text-white hover:bg-blue-500/50 backdrop-blur-sm flex flex-col items-center justify-center"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs mt-1">{comments.length}</span>
          </Button>

          <Button
            variant="ghost"
            size="lg"
            className="w-14 h-14 rounded-full bg-black/50 text-white hover:bg-green-500/50 backdrop-blur-sm flex flex-col items-center justify-center"
          >
            <Share className="w-6 h-6" />
            <span className="text-xs mt-1">مشاركة</span>
          </Button>

          <Button
            variant="ghost"
            size="lg"
            className="w-14 h-14 rounded-full bg-black/50 text-yellow-400 hover:bg-yellow-500/50 backdrop-blur-sm flex flex-col items-center justify-center"
          >
            <Gift className="w-6 h-6" />
            <span className="text-xs mt-1">هدية</span>
          </Button>
        </div>

        {/* إحصائيات البث السفلية */}
        <div className="absolute bottom-4 left-4 right-20 z-50">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 text-sm font-semibold">{viewerCount} مشاهد</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm font-semibold">{likes} إعجاب</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-semibold">{comments.length} تعليق</span>
              </div>
            </div>
            <h3 className="text-white font-bold">{stream.title}</h3>
            <p className="text-gray-300 text-sm">بث من {stream.hostName}</p>
          </div>
        </div>

        {/* نافذة إضافة تعليق */}
        {showComments && (
          <div className="absolute bottom-20 right-4 w-80 max-w-[90vw] bg-black/90 backdrop-blur-md rounded-xl border border-white/20 flex flex-col z-50 shadow-2xl pointer-events-auto">
            <div className="flex items-center justify-between p-4 border-b border-white/20">
              <h3 className="text-white font-bold flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-400" />
                إضافة تعليق
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">🔴 LIVE</span>
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowComments(false)}
                className="text-white hover:bg-white/20 w-8 h-8 p-0"
              >
                ✕
              </Button>
            </div>

            {user ? (
              <div className="p-4">
                <div className="flex space-x-2 space-x-reverse">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 flex space-x-2 space-x-reverse">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="اكتب تعليقاً..."
                      className="flex-1 bg-white/10 border-white/30 text-white placeholder-gray-400 focus:border-blue-500 focus:bg-white/20"
                      maxLength={200}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newComment.trim() && newComment.length <= 200) {
                          handleSendComment();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendComment}
                      disabled={!newComment.trim() || newComment.length > 200}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  اضغط Enter للإرسال • {200 - newComment.length} حرف متبقي
                </p>
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