import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';

// Hook لإعادة تحميل البيانات عند التنقل بين الصفحات
export function useNavigationRefresh() {
  const [location] = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    // عند تغيير المسار، أعد تحميل البيانات الأساسية
    const refreshCurrentPageData = async () => {
      switch (location) {
        case '/':
        case '/home':
          // إعادة تحميل بيانات الصفحة الرئيسية
          await queryClient.invalidateQueries({ queryKey: ['/api/memories/public'] });
          await queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
          break;
          
        case location.startsWith('/profile') ? location : '':
          // إعادة تحميل بيانات الملف الشخصي
          const userId = location.split('/')[2]; // استخراج userId من URL
          if (userId) {
            await queryClient.invalidateQueries({ queryKey: ['/api/users', userId] });
            await queryClient.invalidateQueries({ queryKey: ['/api/memories/user', userId] });
            await queryClient.invalidateQueries({ queryKey: ['/api/albums/user', userId] });
          }
          break;
          
        case '/messages':
          // إعادة تحميل بيانات المحادثات
          await queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
          break;
          
        case '/explore':
          // إعادة تحميل بيانات الاستكشاف
          await queryClient.invalidateQueries({ queryKey: ['/api/streams'] });
          break;
          
        default:
          // إعادة تحميل عامة للبيانات الأساسية
          await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
          break;
      }
    };

    // تأخير صغير لضمان تحميل المكون أولاً
    const timeoutId = setTimeout(refreshCurrentPageData, 100);
    
    return () => clearTimeout(timeoutId);
  }, [location, queryClient]);
}