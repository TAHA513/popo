import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Bell, Gift, Heart, MessageSquare, UserPlus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Notifications() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all notifications
  const { data: notifications = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/notifications'],
    refetchInterval: 30000,
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    }
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", "/api/notifications/mark-all-read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
      toast({
        title: "تم تحديث الإشعارات",
        description: "تم وضع علامة مقروء على جميع الإشعارات",
      });
    }
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'gift': return <Gift className="w-5 h-5 text-purple-500" />;
      case 'like': return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment': return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'follow': return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'memory': return <Star className="w-5 h-5 text-yellow-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleNotificationClick = (notification: any) => {
    console.log('Notification clicked:', notification); // Debug log
    
    // Mark as read if not already read
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'gift':
      case 'like':
      case 'comment':
        // For likes and comments, go to the person's profile who sent it
        console.log('fromUser data:', notification.fromUser); // Debug log
        if (notification.fromUser?.id) {
          console.log('Navigating to user profile:', notification.fromUser.id);
          setLocation(`/user/${notification.fromUser.id}`);
        } else if (notification.relatedId) {
          console.log('Navigating to memory:', notification.relatedId);
          setLocation(`/memory/${notification.relatedId}`);
        }
        break;
      case 'follow':
        if (notification.fromUser?.id) {
          setLocation(`/user/${notification.fromUser.id}`);
        }
        break;
      case 'message':
        setLocation('/messages');
        break;
      default:
        break;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">يجب تسجيل الدخول أولاً</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/')}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold">الإشعارات</h1>
            </div>
            
            {Array.isArray(notifications) && notifications.some((n: any) => !n.isRead) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
              >
                قراءة الكل
              </Button>
            )}
          </div>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 opacity-60"></div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto p-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
          </div>
        ) : !Array.isArray(notifications) || notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">لا توجد إشعارات</h3>
            <p className="text-gray-500">ستظهر إشعاراتك هنا عند وصولها</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Array.isArray(notifications) && notifications.map((notification: any) => (
              <Card
                key={notification.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  !notification.isRead ? 'bg-purple-50 border-purple-200' : 'bg-white'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <Badge variant="secondary" className="bg-red-500 text-white">
                            جديد
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      
                      <p className="text-xs text-gray-400">
                        {new Date(notification.createdAt).toLocaleDateString('ar', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}