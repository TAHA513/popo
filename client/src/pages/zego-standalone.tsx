import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuthFixed';
import ZegoStandalone from '@/components/ZegoStandalone';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

export default function ZegoStandalonePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">يجب تسجيل الدخول</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 mb-4">
              يجب تسجيل الدخول أولاً لبدء البث المباشر المستقل
            </p>
            <Button 
              onClick={() => setLocation('/login')}
              className="w-full"
            >
              تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isStreaming) {
    return (
      <ZegoStandalone
        streamTitle={streamTitle}
        onStreamEnd={() => {
          setIsStreaming(false);
          setLocation('/');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-pink-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur border-white/20">
        <CardHeader className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/')}
            className="absolute top-4 left-4 text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <CardTitle className="text-white text-2xl">🔴 بث مباشر مستقل</CardTitle>
          <p className="text-white/80 text-sm">
            بث مباشر عبر ZEGO Cloud - مستقل بالكامل
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-white text-sm font-medium">عنوان البث</label>
            <Input
              type="text"
              placeholder="أدخل عنوان البث..."
              value={streamTitle}
              onChange={(e) => setStreamTitle(e.target.value)}
              className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
            />
          </div>

          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
            <h3 className="text-yellow-400 font-bold text-sm mb-2">ملاحظة مهمة</h3>
            <p className="text-yellow-200 text-xs leading-relaxed">
              هذا البث مستقل تماماً ولا يعتمد على أي خدمات من Replit. 
              يتم البث مباشرة عبر ZEGO Cloud فقط.
            </p>
          </div>

          <Button
            onClick={() => {
              if (streamTitle.trim()) {
                setIsStreaming(true);
              }
            }}
            disabled={!streamTitle.trim()}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 text-lg font-bold"
          >
            🔴 ابدأ البث المستقل
          </Button>

          <div className="text-center text-white/60 text-xs">
            مدعوم بـ ZEGO Cloud - بدون اعتماد على Replit
          </div>
        </CardContent>
      </Card>
    </div>
  );
}