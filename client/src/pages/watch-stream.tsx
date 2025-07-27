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
    refetchInterval: 2000, // تحديث كل ثانيتين لعرض التعليقات مباشرة
  });

  // جلب بيانات البث
  const { data: stream, isLoading, error } = useQuery<Stream>({
    queryKey: ['/api/streams', id],
    enabled: !!id
  });

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

  // تحديث الإحصائيات
  useEffect(() => {
    const statsTimer = setInterval(() => {
      setViewerCount(prev => Math.max(1, prev + Math.floor(Math.random() * 3) - 1));
      setLikes(prev => prev + Math.floor(Math.random() * 2));
    }, 5000);

    return () => clearInterval(statsTimer);
  }, []);

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
    } else {
      // إضافة تعليقات تجريبية إذا لم توجد تعليقات حقيقية
      setComments([
        { id: 1, username: 'أحمد محمد', text: 'بث رائع! أحب المحتوى 🎉', timestamp: Date.now() - 120000 },
        { id: 2, username: 'فاطمة علي', text: 'مرحباً من مصر 🇪🇬', timestamp: Date.now() - 90000 },
        { id: 3, username: 'محمد سعد', text: 'استمر كذا! ممتاز', timestamp: Date.now() - 60000 },
      ]);
    }
  }, [realComments]);

  // WebSocket للتعليقات المباشرة
  useEffect(() => {
    if (!id || !user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('💬 اتصال WebSocket للتعليقات متصل');
      // الانضمام لغرفة البث
      ws.send(JSON.stringify({
        type: 'join_stream',
        streamId: parseInt(id),
        userId: user.id
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'chat_message') {
          console.log('💬 تعليق جديد وصل:', data);
          const newComment = {
            id: data.message?.id || Date.now(),
            username: data.user?.username || data.user?.firstName || 'مستخدم',
            text: data.message?.message || data.text || '',
            timestamp: new Date(data.message?.sentAt || Date.now()).getTime(),
            userId: data.message?.userId || data.user?.id
          };
          
          setComments(prev => {
            // تجنب التعليقات المكررة
            const exists = prev.find(c => c.id === newComment.id || 
              (c.text === newComment.text && c.userId === newComment.userId));
            if (exists) return prev;
            
            return [...prev, newComment];
          });
        }
      } catch (error) {
        console.error('خطأ في معالجة رسالة WebSocket:', error);
      }
    };

    ws.onclose = () => {
      console.log('💬 اتصال WebSocket للتعليقات منقطع');
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'leave_stream',
          streamId: parseInt(id),
          userId: user.id
        }));
      }
      ws.close();
    };
  }, [id, user]);

  // إضافة تعليق جديد عبر WebSocket
  const addComment = () => {
    if (!newComment.trim() || !user || !id) return;
    
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'chat_message',
          streamId: parseInt(id),
          userId: user.id,
          text: newComment.trim(),
          user: {
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            profileImageUrl: user.profileImageUrl
          }
        }));
        
        // إضافة التعليق محلياً أيضاً
        const localComment = {
          id: Date.now(),
          username: user.username || 'مستخدم',
          text: newComment.trim(),
          timestamp: Date.now(),
          userId: user.id
        };
        setComments(prev => [...prev, localComment]);
        setNewComment('');
        
        ws.close();
      };
    } catch (error) {
      console.error('خطأ في إرسال التعليق:', error);
    }
  };

  // تحديد وقت التعليق
  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = Math.floor((now - timestamp) / 1000);
    
    if (diff < 60) return 'الآن';
    if (diff < 3600) return `${Math.floor(diff / 60)} د`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} س`;
    return `${Math.floor(diff / 86400)} ي`;
  };

  // الاتصال بـ ZegoCloud لمشاهدة البث
  useEffect(() => {
    if (!stream || !user || !streamContainerRef.current || zegoInstance || isConnected) {
      console.log('🚫 Connection blocked:', { hasStream: !!stream, hasUser: !!user, hasContainer: !!streamContainerRef.current, hasInstance: !!zegoInstance, isConnected });
      return;
    }

    const connectToStream = async () => {
      try {
        console.log('🔗 Connecting to stream as viewer...');
        
        const config = await apiRequest('/api/zego-config', 'GET');
        if (!config.appId || !stream.zegoRoomId) return;

        // إنشاء token للمشاهدة - نفس الغرفة التي ينشئها المذيع
        const viewerUserId = `viewer_${user.id}_${Date.now()}`;
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          parseInt(config.appId),
          config.appSign,
          stream.zegoRoomId, // نفس معرف الغرفة
          viewerUserId,
          user.username || 'مشاهد'
        );

        console.log('🔗 Viewer joining room:', {
          roomId: stream.zegoRoomId,
          streamId: stream.zegoStreamId,
          viewerId: viewerUserId
        });

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        setZegoInstance(zp);

        // الانضمام للبث كمشاهد - نفس الغرفة بالضبط
        await zp.joinRoom({
          container: streamContainerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.LiveStreaming,
            config: {
              role: ZegoUIKitPrebuilt.Audience,
            }
          },
          // إعدادات المشاهد
          turnOnMicrophoneWhenJoining: false,
          turnOnCameraWhenJoining: false,
          showMyCameraToggleButton: false,
          showMyMicrophoneToggleButton: false,
          showAudioVideoSettingsButton: false,
          showScreenSharingButton: false,
          showTextChat: true,
          showUserCount: true,
          showUserList: true,
          showRemoveUserButton: false,
          showPinButton: true,
          showLayoutButton: true,
          showLeaveRoomConfirmDialog: false,
          
          // إعدادات الفيديو المهمة للمشاهدة
          enableVideoAutoplay: true,
          enableAudioAutoplay: true,
          
          // callbacks مهمة
          onJoinRoom: () => {
            console.log('✅ Viewer joined room successfully');
            setIsConnected(true);
          },
          onLeaveRoom: () => {
            console.log('❌ Viewer left room');
            setIsConnected(false);
          },
          onRemoteStreamAdd: (streamList: any[]) => {
            console.log('📺 Remote streams available:', streamList);
            setIsConnected(true);
          },
          onRemoteStreamRemove: (streamList: any[]) => {
            console.log('📺 Remote streams removed:', streamList);
          }
        });

      } catch (error) {
        console.error('❌ Error connecting to stream:', error);
      }
    };

    connectToStream();

    // تنظيف الاتصال عند المغادرة
    return () => {
      if (zegoInstance) {
        try {
          zegoInstance.destroy();
        } catch (error) {
          console.error('Error destroying zego instance:', error);
        }
      }
    };
  }, [stream, user]);

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

  // معالجة حالات التحميل والأخطاء
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
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400 mb-2">تجربة الوصول المباشر للبث رقم: {id}</p>
              <p className="text-xs text-gray-500">خطأ: {error?.message || 'البث غير موجود'}</p>
            </div>
            <Button 
              onClick={() => setLocation('/')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              العودة للرئيسية
            </Button>
            <Button 
              onClick={() => setLocation('/simple-stream')}
              variant="outline"
              className="bg-green-600 hover:bg-green-700 text-white border-green-600"
            >
              إنشاء بث جديد
            </Button>
          </div>
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
          className="w-full h-full bg-gradient-to-br from-purple-900 to-blue-900"
          style={{ position: 'relative', width: '100%', height: '100vh' }}
        >
          {/* شاشة تحميل أثناء الاتصال */}
          {!isConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600 z-10">
              <div className="text-center">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl animate-pulse">
                  {stream.hostProfileImage ? (
                    <img 
                      src={stream.hostProfileImage} 
                      alt={stream.hostName}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-purple-600">
                      {stream.hostName?.[0]?.toUpperCase() || 'S'}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2">{stream.hostName}</h3>
                <p className="text-sm opacity-80 mb-4">{stream.title}</p>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                <p className="text-sm mt-2">جاري الاتصال بالبث...</p>
              </div>
            </div>
          )}
        </div>

        {/* أزرار التفاعل الجانبية */}
        <div className="absolute right-4 bottom-32 z-50 space-y-4">
          {/* إعجاب */}
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setLikes(prev => prev + 1)}
            className="w-14 h-14 rounded-full bg-black/50 text-white hover:bg-red-500/50 backdrop-blur-sm flex flex-col items-center justify-center"
          >
            <Heart className="w-6 h-6" />
            <span className="text-xs mt-1">{likes}</span>
          </Button>

          {/* تعليق */}
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setShowComments(!showComments)}
            className="w-14 h-14 rounded-full bg-black/50 text-white hover:bg-blue-500/50 backdrop-blur-sm flex flex-col items-center justify-center"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs mt-1">{comments.length}</span>
          </Button>

          {/* مشاركة */}
          <Button
            variant="ghost"
            size="lg"
            className="w-14 h-14 rounded-full bg-black/50 text-white hover:bg-green-500/50 backdrop-blur-sm flex flex-col items-center justify-center"
          >
            <Share className="w-6 h-6" />
            <span className="text-xs mt-1">مشاركة</span>
          </Button>

          {/* هدية */}
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

        {/* نافذة التعليقات */}
        {showComments && (
          <div className="absolute bottom-20 right-4 w-80 max-w-[90vw] h-96 bg-black/90 backdrop-blur-md rounded-xl border border-white/20 flex flex-col z-50 shadow-2xl">
            {/* رأس التعليقات */}
            <div className="flex items-center justify-between p-4 border-b border-white/20">
              <h3 className="text-white font-bold flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-400" />
                التعليقات المباشرة
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">🔴 LIVE</span>
                <span className="text-purple-300 text-sm">({comments.length})</span>
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

            {/* قائمة التعليقات */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-64">
              {comments.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد تعليقات بعد</p>
                  <p className="text-sm mt-1">كن أول من يعلق!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex items-start space-x-3 space-x-reverse group hover:bg-white/10 rounded-lg p-3 transition-all duration-200 animate-fadeIn border-r-2 border-purple-500/30">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-lg ring-2 ring-white/20">
                        {comment.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 space-x-reverse mb-1">
                          <span className="text-white text-sm font-semibold truncate bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{comment.username}</span>
                          <span className="text-gray-400 text-xs flex-shrink-0">{getTimeAgo(comment.timestamp)}</span>
                          <span className="text-green-400 text-xs">🟢 مباشر</span>
                        </div>
                        <p className="text-gray-100 text-sm leading-relaxed break-words bg-black/20 rounded-lg px-3 py-2">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* إضافة تعليق */}
            {user ? (
              <div className="p-4 border-t border-white/20">
                <div className="flex space-x-2 space-x-reverse">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 flex space-x-2 space-x-reverse">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="اكتب تعليقاً..."
                      className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400 rounded-lg"
                      onKeyPress={(e) => e.key === 'Enter' && addComment()}
                      maxLength={200}
                    />
                    <Button
                      onClick={addComment}
                      disabled={!newComment.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 disabled:opacity-50"
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
              <div className="p-4 border-t border-white/20 text-center">
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