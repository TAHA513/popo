import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Mic, MicOff, X, Eye, Settings, Users, UserSearch } from 'lucide-react';
import { Stream } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';

interface NewLiveStreamerProps {
  stream: Stream;
  onClose: () => void;
}

export default function NewLiveStreamer({ stream, onClose }: NewLiveStreamerProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [streamStatus, setStreamStatus] = useState<'starting' | 'live' | 'error'>('live');
  const [viewerCount, setViewerCount] = useState(1);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedProfile, setDisplayedProfile] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    
    const startStream = async () => {
      try {
        console.log('🎥 بدء البث المباشر للصاميمر:', user?.username);
        
        // طلب إذن الكاميرا والمايكروفون
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            facingMode: 'user',
            frameRate: { ideal: 30, min: 15 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.autoplay = true;
          videoRef.current.playsInline = true;
          videoRef.current.muted = true; // منع الصدى
          
          setMediaStream(stream);
          setStreamStatus('live');
          
          console.log('✅ تم بدء البث المباشر بنجاح');
          
          // محاكاة زيادة المشاهدين
          setTimeout(() => {
            if (mounted) setViewerCount(3);
          }, 5000);
          setTimeout(() => {
            if (mounted) setViewerCount(7);
          }, 15000);
        }
      } catch (error) {
        console.error('❌ خطأ في بدء البث:', error);
        if (mounted) {
          setStreamStatus('error');
        }
      }
    };

    startStream();

    return () => {
      mounted = false;
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        console.log('🛑 تم إيقاف البث وإغلاق الكاميرا');
      }
    };
  }, [user, stream.id]);

  const toggleVideo = () => {
    if (mediaStream) {
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
        console.log(isVideoEnabled ? '📹 تم إيقاف الفيديو' : '📹 تم تشغيل الفيديو');
      }
    }
  };

  const toggleAudio = () => {
    if (mediaStream) {
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
        console.log(isAudioEnabled ? '🔇 تم كتم الصوت' : '🔊 تم تشغيل الصوت');
      }
    }
  };

  const endStream = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }
    onClose();
    console.log('📱 تم إنهاء البث المباشر');
  };

  // البحث عن المستخدمين
  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ['/api/users/search', searchQuery],
    queryFn: () => fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`).then(res => res.json()),
    enabled: !!searchQuery && searchQuery.length > 2,
  });

  const showUserProfile = (user: any) => {
    setDisplayedProfile(user);
    setShowUserSearch(false);
    setSearchQuery('');
    console.log('👤 عرض ملف المستخدم في البث:', user.username);
  };

  const hideUserProfile = () => {
    setDisplayedProfile(null);
  };

  // شاشة البدء
  if (streamStatus === 'starting') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-pink-900 flex items-center justify-center z-50">
        <div className="text-center text-white max-w-lg mx-4">
          <div className="w-20 h-20 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-8"></div>
          <h2 className="text-3xl font-bold mb-6">🎥 بدء البث المباشر</h2>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-red-500/20 rounded-full p-4 mr-4">
                <Camera className="w-8 h-8 text-red-300" />
              </div>
              <div className="bg-blue-500/20 rounded-full p-4">
                <Mic className="w-8 h-8 text-blue-300" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold mb-4">إذن الوصول مطلوب</h3>
            <p className="text-lg opacity-90 mb-6">
              نحتاج إذن للوصول إلى <span className="font-bold text-red-300">الكاميرا 📹</span> و <span className="font-bold text-blue-300">المايكروفون 🎤</span> لبدء البث المباشر
            </p>
            
            <div className="space-y-3 text-sm opacity-80 mb-6">
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                <span>سيتم استخدام الكاميرا لعرض صورتك للمشاهدين</span>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                <span>سيتم استخدام المايكروفون لنقل صوتك</span>  
              </div>
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                <span>يمكنك التحكم في تشغيل/إيقاف الكاميرا والمايك أثناء البث</span>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <h4 className="text-lg font-semibold mb-2">{stream.title}</h4>
              <p className="text-white/70">{stream.description}</p>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-yellow-200">
            <p className="text-sm">
              <span className="font-bold">💡 ملاحظة:</span> إذا لم تظهر نافذة طلب الإذن، تحقق من أن المتصفح لا يحجب النوافذ المنبثقة
            </p>
          </div>
        </div>
      </div>
    );
  }

  // شاشة الخطأ
  if (streamStatus === 'error') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-red-900 via-gray-900 to-black flex items-center justify-center z-50">
        <div className="text-center text-white max-w-lg mx-4">
          <div className="text-6xl mb-6">🚫</div>
          <h2 className="text-3xl font-bold mb-4">فشل في الوصول للكاميرا والمايكروفون</h2>
          <p className="text-lg opacity-90 mb-8">لم نتمكن من الحصول على إذن الوصول للكاميرا أو المايكروفون</p>
          
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-bold mb-4 text-red-300">حلول مقترحة:</h3>
            <div className="space-y-4 text-right">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</div>
                <div>
                  <p className="font-semibold">تحقق من إعدادات المتصفح</p>
                  <p className="text-sm opacity-75">اضغط على أيقونة القفل 🔒 بجانب العنوان والسماح للكاميرا والمايك</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</div>
                <div>
                  <p className="font-semibold">تأكد من عدم استخدام الكاميرا في تطبيق آخر</p>
                  <p className="text-sm opacity-75">أغلق أي تطبيقات أخرى قد تستخدم الكاميرا (Zoom, Teams, إلخ)</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</div>
                <div>
                  <p className="font-semibold">جرب إعادة تحميل الصفحة</p>
                  <p className="text-sm opacity-75">أحياناً يساعد إعادة تحميل الصفحة في حل المشكلة</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</div>
                <div>
                  <p className="font-semibold">تحقق من اتصال الكاميرا</p>
                  <p className="text-sm opacity-75">تأكد من أن الكاميرا متصلة بشكل صحيح (للكمبيوتر المكتبي)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-4 justify-center">
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-laa-pink hover:bg-pink-600 px-8 py-3"
            >
              🔄 إعادة المحاولة
            </Button>
            <Button 
              onClick={onClose} 
              variant="outline"
              className="border-gray-500 text-gray-300 hover:bg-gray-700 px-8 py-3"
            >
              ❌ إلغاء
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* فيديو البث المباشر */}
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* تراكب إيقاف الفيديو */}
        {!isVideoEnabled && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <div className="text-center text-white">
              <CameraOff className="w-32 h-32 mx-auto mb-6 opacity-60" />
              <h3 className="text-2xl font-bold mb-2">الكاميرا مُوقفة</h3>
              <p className="text-lg opacity-80">المشاهدون لا يرون الفيديو الآن</p>
            </div>
          </div>
        )}

        {/* الهيدر العلوي */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-4 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                onClick={endStream}
                variant="ghost"
                className="bg-red-600/80 hover:bg-red-700 text-white rounded-full w-12 h-12 p-0"
              >
                <X className="w-6 h-6" />
              </Button>
              
              {/* معلومات صاحب البث */}
              {user && (
                <div className="flex items-center bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.profileImageUrl || undefined} />
                    <AvatarFallback className="bg-laa-pink text-white text-sm">
                      {user.username?.[0]?.toUpperCase() || 'أ'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-white">
                    <p className="text-sm font-bold">{user.firstName || user.username}</p>
                    <p className="text-xs opacity-75">صاحب البث</p>
                  </div>
                </div>
              )}
            </div>

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

        {/* أدوات التحكم السفلية */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 z-30">
          <div className="flex items-center justify-between">
            {/* معلومات البث */}
            <div className="flex-1">
              <h2 className="text-white text-2xl font-bold mb-1">{stream.title}</h2>
              {stream.description && (
                <p className="text-white/80 text-lg">{stream.description}</p>
              )}
              <div className="flex items-center mt-3 space-x-4">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-green-400 mr-2" />
                  <span className="text-green-400 text-sm font-bold">{viewerCount} مشاهد</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-red-400 text-sm font-bold">بث مباشر</span>
                </div>
                {/* معلومات إضافية عن صاحب البث */}
                {user && (
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-laa-pink rounded-full mr-2"></div>
                    <span className="text-laa-pink text-sm font-bold">@{user.username}</span>
                  </div>
                )}
              </div>
            </div>

            {/* أزرار التحكم */}
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowUserSearch(!showUserSearch)}
                className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700"
                title="عرض سول مستخدم"
              >
                <UserSearch className="w-7 h-7 text-white" />
              </Button>

              <Button
                onClick={toggleVideo}
                className={`w-16 h-16 rounded-full ${
                  isVideoEnabled 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isVideoEnabled ? (
                  <Camera className="w-7 h-7 text-white" />
                ) : (
                  <CameraOff className="w-7 h-7 text-white" />
                )}
              </Button>

              <Button
                onClick={toggleAudio}
                className={`w-16 h-16 rounded-full ${
                  isAudioEnabled 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isAudioEnabled ? (
                  <Mic className="w-7 h-7 text-white" />
                ) : (
                  <MicOff className="w-7 h-7 text-white" />
                )}
              </Button>

              <Button
                onClick={endStream}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700"
              >
                <X className="w-7 h-7 text-white" />
              </Button>
            </div>
          </div>
        </div>

        {/* واجهة البحث عن المستخدمين */}
        {showUserSearch && (
          <div className="absolute top-20 right-4 bg-black/90 backdrop-blur-md rounded-2xl p-6 w-80 z-40">
            <h3 className="text-white text-xl font-bold mb-4">🔍 البحث عن مستخدم</h3>
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم المستخدم..."
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 mb-4"
            />

            {searchLoading && (
              <div className="text-center py-4">
                <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto"></div>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((user: any) => (
                  <div
                    key={user.id}
                    onClick={() => showUserProfile(user)}
                    className="flex items-center p-3 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                  >
                    <Avatar className="w-10 h-10 mr-3">
                      <AvatarImage src={user.profileImageUrl} />
                      <AvatarFallback className="bg-blue-600 text-white">
                        {user.username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white font-semibold">{user.firstName}</p>
                      <p className="text-gray-400 text-sm">@{user.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={() => setShowUserSearch(false)}
              className="w-full mt-4 bg-gray-700 hover:bg-gray-600"
            >
              إغلاق
            </Button>
          </div>
        )}

        {/* عرض ملف المستخدم */}
        {displayedProfile && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/95 backdrop-blur-lg rounded-3xl p-8 w-96 z-50 border border-white/20">
            <div className="text-center text-white">
              <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-white/30">
                <AvatarImage src={displayedProfile.profileImageUrl} />
                <AvatarFallback className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-2xl">
                  {displayedProfile.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <h2 className="text-3xl font-bold mb-2">{displayedProfile.firstName}</h2>
              <p className="text-xl text-gray-300 mb-4">@{displayedProfile.username}</p>
              
              <div className="bg-white/10 rounded-2xl p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-yellow-400">{displayedProfile.points || 0}</p>
                    <p className="text-sm text-gray-400">النقاط</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-400">
                      {displayedProfile.isOnline ? 'متصل' : 'غير متصل'}
                    </p>
                    <p className="text-sm text-gray-400">الحالة</p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 justify-center">
                <Button
                  onClick={hideUserProfile}
                  className="bg-gray-700 hover:bg-gray-600 px-6 py-2"
                >
                  إغلاق
                </Button>
                <Button
                  onClick={hideUserProfile}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2"
                >
                  إخفاء السول
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* تأثيرات إضافية */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/10 pointer-events-none"></div>
      </div>
    </div>
  );
}