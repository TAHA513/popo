import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { Video, Mic, MicOff, VideoOff, Radio } from 'lucide-react';

// استيراد ZegoUIKitPrebuilt بطريقة آمنة
const ZegoUIKitPrebuilt = (window as any).ZegoUIKitPrebuilt;

export default function TestStreamTransmissionPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<'host' | 'viewer' | null>(null);
  const [roomId, setRoomId] = useState('test_room_123');
  const [zegoInstance, setZegoInstance] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  const connectAsHost = async () => {
    try {
      addLog('🔄 بدء الاتصال كمذيع...');
      
      const config = await apiRequest('/api/zego-config', 'GET');
      addLog(`✅ تم تحميل التكوين: AppID=${config.appId}`);

      if (!ZegoUIKitPrebuilt) {
        throw new Error('ZegoUIKitPrebuilt غير متاح');
      }

      const userId = `host_${user?.id || 'test'}`;
      const userName = `Host_${user?.username || 'Test'}`;
      
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        parseInt(config.appId),
        config.appSign,
        roomId,
        userId,
        userName
      );

      addLog(`🎯 معرف المستخدم: ${userId}`);
      addLog(`🏠 معرف الغرفة: ${roomId}`);

      const zp = ZegoUIKitPrebuilt.create(kitToken);
      setZegoInstance(zp);

      await zp.joinRoom({
        container: containerRef.current!,
        scenario: {
          mode: ZegoUIKitPrebuilt.LiveStreaming,
          config: {
            role: ZegoUIKitPrebuilt.Host,
            // إضافة معرف البث الذي سيستخدمه المشاهدون
            liveStreamingMode: ZegoUIKitPrebuilt.LiveStreamingMode_RealTime,
          }
        },
        turnOnMicrophoneWhenJoining: true,
        turnOnCameraWhenJoining: true,
        showMyCameraToggleButton: true,
        showMyMicrophoneToggleButton: true,
        showLeaveRoomConfirmDialog: false,
        onJoinRoom: () => {
          addLog('✅ انضم المذيع للغرفة بنجاح!');
          addLog('🎥 البث جاري الآن...');
          setIsConnected(true);
        },
        onUserJoin: (users: any[]) => {
          users.forEach(u => addLog(`👥 انضم مستخدم جديد: ${u.userName}`));
        },
        onLiveStart: () => {
          addLog('🔴 بدأ البث المباشر!');
        },
        onRoomStreamUpdate: (roomID: string, updateType: string, streamList: any[]) => {
          addLog(`🔄 تحديث البث: ${updateType} - عدد البثوث: ${streamList.length}`);
          if (updateType === 'ADD') {
            streamList.forEach(stream => {
              addLog(`➕ بث جديد: UserID=${stream.user.userID}, StreamID=${stream.streamID}`);
            });
          }
        }
      });

    } catch (error: any) {
      addLog(`❌ خطأ: ${error.message}`);
    }
  };

  const connectAsViewer = async () => {
    try {
      addLog('🔄 بدء الاتصال كمشاهد...');
      
      const config = await apiRequest('/api/zego-config', 'GET');
      addLog(`✅ تم تحميل التكوين: AppID=${config.appId}`);

      if (!ZegoUIKitPrebuilt) {
        throw new Error('ZegoUIKitPrebuilt غير متاح');
      }

      const userId = `viewer_${user?.id || 'test'}`;
      const userName = `Viewer_${user?.username || 'Test'}`;
      
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        parseInt(config.appId),
        config.appSign,
        roomId,
        userId,
        userName
      );

      addLog(`🎯 معرف المستخدم: ${userId}`);
      addLog(`🏠 معرف الغرفة: ${roomId}`);

      const zp = ZegoUIKitPrebuilt.create(kitToken);
      setZegoInstance(zp);

      await zp.joinRoom({
        container: containerRef.current!,
        scenario: {
          mode: ZegoUIKitPrebuilt.LiveStreaming,
          config: {
            role: ZegoUIKitPrebuilt.Audience,
            liveStreamingMode: ZegoUIKitPrebuilt.LiveStreamingMode_RealTime,
          }
        },
        turnOnMicrophoneWhenJoining: false,
        turnOnCameraWhenJoining: false,
        showMyCameraToggleButton: false,
        showMyMicrophoneToggleButton: false,
        showLeaveRoomConfirmDialog: false,
        enableVideoAutoplay: true,
        enableAudioAutoplay: true,
        onJoinRoom: () => {
          addLog('✅ انضم المشاهد للغرفة بنجاح!');
          addLog('👀 في انتظار البث من المذيع...');
          setIsConnected(true);
        },
        onUserJoin: (users: any[]) => {
          users.forEach(u => addLog(`👥 مستخدم آخر انضم: ${u.userName}`));
        },
        onRoomStreamUpdate: (roomID: string, updateType: string, streamList: any[]) => {
          addLog(`🔄 تحديث البث: ${updateType} - عدد البثوث: ${streamList.length}`);
          if (updateType === 'ADD' && streamList.length > 0) {
            addLog('🎥 تم استقبال البث من المذيع!');
            streamList.forEach(stream => {
              addLog(`📡 بث مستقبل: UserID=${stream.user.userID}, StreamID=${stream.streamID}`);
            });
          }
        }
      });

    } catch (error: any) {
      addLog(`❌ خطأ: ${error.message}`);
    }
  };

  const disconnect = () => {
    if (zegoInstance) {
      zegoInstance.destroy();
      setZegoInstance(null);
      setIsConnected(false);
      addLog('🔌 تم قطع الاتصال');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="p-6">
          <h2 className="text-xl mb-4">يجب تسجيل الدخول</h2>
          <Button onClick={() => setLocation('/login')}>تسجيل الدخول</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">🧪 اختبار نقل البث</h1>
        
        {!mode && (
          <div className="flex justify-center gap-4 mb-8">
            <Button 
              onClick={() => setMode('host')} 
              size="lg" 
              className="bg-red-600 hover:bg-red-700"
            >
              <Radio className="mr-2" />
              المذيع (Host)
            </Button>
            <Button 
              onClick={() => setMode('viewer')} 
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Video className="mr-2" />
              المشاهد (Viewer)
            </Button>
          </div>
        )}

        {mode && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Card className="bg-gray-800 p-4">
                <h2 className="text-xl font-bold mb-4">
                  {mode === 'host' ? '🎥 واجهة المذيع' : '👀 واجهة المشاهد'}
                </h2>
                
                <div className="mb-4">
                  <label className="block text-sm mb-2">معرف الغرفة:</label>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 rounded"
                    disabled={isConnected}
                  />
                </div>

                <div className="flex gap-2 mb-4">
                  {!isConnected ? (
                    <Button 
                      onClick={mode === 'host' ? connectAsHost : connectAsViewer}
                      className={mode === 'host' ? 'bg-red-600' : 'bg-blue-600'}
                    >
                      ابدأ {mode === 'host' ? 'البث' : 'المشاهدة'}
                    </Button>
                  ) : (
                    <Button onClick={disconnect} variant="destructive">
                      قطع الاتصال
                    </Button>
                  )}
                  
                  <Button onClick={() => setMode(null)} variant="outline">
                    تغيير الوضع
                  </Button>
                </div>

                <div 
                  ref={containerRef} 
                  className="w-full h-96 bg-black rounded overflow-hidden"
                />
              </Card>
            </div>

            <div>
              <Card className="bg-gray-800 p-4 h-full">
                <h3 className="text-lg font-bold mb-2">📋 السجلات:</h3>
                <div className="h-96 overflow-y-auto bg-black p-2 rounded font-mono text-xs">
                  {logs.map((log, i) => (
                    <div key={i} className={
                      log.includes('✅') ? 'text-green-400' :
                      log.includes('❌') ? 'text-red-400' :
                      log.includes('🔄') ? 'text-blue-400' :
                      log.includes('🎥') || log.includes('📡') ? 'text-yellow-400' :
                      'text-gray-300'
                    }>
                      {log}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <Card className="bg-yellow-900/50 p-4 inline-block">
            <h3 className="font-bold mb-2">📝 تعليمات الاختبار:</h3>
            <ol className="text-left text-sm space-y-1">
              <li>1. افتح هذه الصفحة في متصفحين مختلفين</li>
              <li>2. في المتصفح الأول: اختر "المذيع" وابدأ البث</li>
              <li>3. في المتصفح الثاني: اختر "المشاهد" وابدأ المشاهدة</li>
              <li>4. استخدم نفس معرف الغرفة في كلا المتصفحين</li>
              <li>5. راقب السجلات لمعرفة حالة الاتصال</li>
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}