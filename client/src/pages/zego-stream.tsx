import React from 'react';
import { useQuery } from '@tanstack/react-query';
import ZegoLiveStreamer from '@/components/ZegoLiveStreamer';
import { useLocation } from 'wouter';

interface User {
  id: string;
  username: string;
  firstName?: string;
}

export default function ZegoStreamPage(): JSX.Element {
  const [, setLocation] = useLocation();

  // الحصول على بيانات المستخدم الحالي
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">خطأ في المصادقة</h2>
          <p className="text-gray-400 mb-6">يجب تسجيل الدخول أولاً</p>
          <button
            onClick={() => setLocation('/login')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg"
          >
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <ZegoLiveStreamer 
      userId={user.id} 
      userName={user.firstName || user.username} 
    />
  );
}