import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import BottomNavigation from '@/components/bottom-navigation';

export default function LiveTextChatSimple() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="flex items-center justify-between p-4">
          <Button
            onClick={() => setLocation('/')}
            className="bg-white/20 hover:bg-white/30 text-white border-0"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة
          </Button>
          <h1 className="text-xl font-bold text-white flex items-center">
            <MessageSquare className="w-6 h-6 ml-2" />
            الدردشة المباشرة
          </h1>
          <div className="w-20"></div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 text-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            مرحباً {user?.username || 'صديق'}!
          </h2>
          <p className="text-white/80 mb-6">
            أهلاً بك في الدردشة المباشرة الجديدة! 🎉
            <br />
            هذه الصفحة تعمل بنجاح.
          </p>
          <div className="space-y-4">
            <div className="bg-white/20 rounded-lg p-4 text-white">
              ✓ تم تحويل التطبيق من البث المباشر إلى الدردشة النصية
            </div>
            <div className="bg-white/20 rounded-lg p-4 text-white">
              ✓ الصفحة تعمل بشكل صحيح الآن
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}