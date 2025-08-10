import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Send, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  X,
  Phone,
  Video,
  MoreVertical,
  UserCheck,
  Gift,
  UserPlus,
  Settings,
  MessageSquare,
  Info,
  UserX,
  Shield,
  FolderOpen,
  Image,
  Eye,
  Lock,
  Unlock
} from "lucide-react";
import SimpleNavigation from "@/components/simple-navigation";
import BottomNavigation from "@/components/bottom-navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GiftShop } from "@/components/gift-shop";
import { InvitePeopleModal } from "@/components/invite-people-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: number;
  senderId: string;
  recipientId: string;
  content: string;
  messageType: 'text' | 'voice';
  isRead: boolean;
  createdAt: string;
}

// Component لعرض رسائل الألبومات المدفوعة
function PremiumAlbumMessage({ message, currentUserId }: { message: Message; currentUserId?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [albumData, setAlbumData] = useState<any>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [giftDetails, setGiftDetails] = useState<any>(null);
  const { toast } = useToast();

  // جلب بيانات الهدايا
  const { data: gifts } = useQuery({
    queryKey: ['/api/gifts/characters'],
  });

  // استخراج معرف الألبوم من النص
  const albumId = message.content.match(/\/premium-albums\/(\d+)/)?.[1];
  
  // استخراج بيانات الألبوم من النص
  const titleMatch = message.content.match(/🎁 ألبوم مدفوع: (.+)/);
  const priceMatch = message.content.match(/💰 السعر: (\d+) نقطة/);
  
  const albumTitle = titleMatch?.[1] || 'ألبوم مدفوع';
  const albumPrice = priceMatch?.[1] || '0';
  
  // احسب السعر الحقيقي بناءً على تفاصيل الهدية
  const realPrice = giftDetails && albumData ? 
    (giftDetails.pointCost * albumData.requiredGiftAmount) : parseInt(albumPrice);
  
  const giftDisplayInfo = giftDetails && albumData ? 
    `${giftDetails.emoji} ${giftDetails.name} × ${albumData.requiredGiftAmount}` : 
    `💰 ${albumPrice} نقطة`;

  // التحقق من الوصول للألبوم
  const checkAccess = async () => {
    if (!albumId) {
      console.log('❌ No albumId provided');
      return;
    }
    
    console.log('🔍 Checking access for album:', albumId);
    
    try {
      // جلب بيانات الألبوم
      console.log('📡 Fetching album data...');
      const albumResponse = await fetch(`/api/premium-albums/${albumId}`, {
        credentials: 'include'
      });
      
      console.log('📨 Album response:', albumResponse.status, albumResponse.statusText);
      
      if (albumResponse.ok) {
        const albumData = await albumResponse.json();
        console.log('📄 Album data received:', albumData);
        setAlbumData(albumData);
        
        // سيتم تحديث تفاصيل الهدية في useEffect منفصل
        
        // إذا كان المستخدم الحالي هو منشئ الألبوم، يمكنه الوصول مجاناً
        if (albumData.creatorId === currentUserId) {
          console.log('✅ User is album creator, granting access');
          setHasAccess(true);
          return;
        }
        
        // محاولة الوصول للمحتوى للتحقق من الإذن
        console.log('🔍 Checking media access...');
        const mediaResponse = await fetch(`/api/premium-albums/${albumId}/media`, {
          credentials: 'include'
        });
        
        console.log('📨 Media response:', mediaResponse.status, mediaResponse.statusText);
        
        // إذا نجح الوصول للمحتوى = لديه إذن، إذا فشل = لا يملك إذن
        const hasMediaAccess = mediaResponse.ok;
        console.log('🎯 Final access result:', hasMediaAccess);
        setHasAccess(hasMediaAccess);
      } else {
        console.error('❌ Failed to fetch album data');
        setHasAccess(false);
      }
    } catch (error) {
      console.error('❌ خطأ في التحقق من الوصول:', error);
      setHasAccess(false);
    }
  };

  // Effect منفصل لتحديث تفاصيل الهدية عند تغير البيانات
  useEffect(() => {
    if (gifts && Array.isArray(gifts) && albumData?.requiredGiftId) {
      const gift = gifts.find((g: any) => g.id === albumData.requiredGiftId);
      if (gift) {
        setGiftDetails(gift);
        console.log('🎁 Gift details updated:', gift);
      }
    }
  }, [gifts, albumData]);

  useEffect(() => {
    checkAccess();
  }, [albumId, currentUserId]);

  const handlePayment = async () => {
    if (!albumId || !albumData) {
      console.log('❌ Missing albumId or albumData:', { albumId, albumData });
      return;
    }
    
    console.log('💰 Starting payment process for album:', albumId);
    setShowPaymentDialog(true);
  };

  const confirmPayment = async () => {
    setShowPaymentDialog(false);
    
    if (!albumId || !albumData) {
      console.log('❌ Missing albumId or albumData:', { albumId, albumData });
      return;
    }
    
    console.log('🔄 Sending purchase request...');
    
    try {
      const response = await apiRequest('POST', `/api/premium-albums/${albumId}/purchase`, {});
      
      console.log('📨 Purchase response:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Purchase successful:', data);
        setHasAccess(true);
        
        const giftInfo = data.giftSent ? 
          `${data.giftSent.emoji} ${data.giftSent.name} × ${data.giftSent.amount}` : 
          'الهدية المطلوبة';
          
        toast({
          title: "✅ تم الشراء بنجاح",
          description: `تم إرسال ${giftInfo} بنجاح! النقاط المتبقية: ${data.remainingPoints}`,
        });

        // فتح الألبوم مباشرة بعد الشراء الناجح
        setTimeout(() => {
          setIsExpanded(true);
        }, 500);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'خطأ غير معروف' }));
        console.error('❌ Purchase failed:', response.status, errorData);
        toast({
          title: "❌ خطأ في الدفع",
          description: errorData.message || "فشل في معالجة عملية الدفع",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('❌ Payment error:', error);
      const errorMessage = error.message || "فشل في معالجة عملية الدفع";
      toast({
        title: "❌ خطأ في الدفع",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Payment Confirmation Dialog */}
      {showPaymentDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ direction: 'rtl' }}>
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="font-bold text-lg text-gray-800 mb-2">شراء ألبوم مدفوع</h3>
              <p className="text-gray-600 mb-1"><strong>{albumTitle}</strong></p>
              <div className="text-center mb-4">
                <p className="text-gray-700 font-medium mb-2">الهدية المطلوبة:</p>
                {giftDetails && albumData ? (
                  <div>
                    <p className="text-orange-600 font-bold text-xl">
                      {giftDetails.emoji} {giftDetails.name} × {albumData.requiredGiftAmount}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      التكلفة: {giftDetails.pointCost * albumData.requiredGiftAmount} نقطة
                    </p>
                  </div>
                ) : (
                  <p className="text-orange-600 font-bold text-xl">💰 {albumPrice} نقطة</p>
                )}
              </div>
              
              <p className="text-sm text-gray-500 mb-6">
                ستذهب النقاط إلى منشئ الألبوم وستتمكن من الوصول إلى محتوياته
              </p>
              
              <div className="flex space-x-3 space-x-reverse">
                <Button
                  onClick={() => setShowPaymentDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={confirmPayment}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-pink-600 text-white"
                >
                  شراء الآن
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-orange-50 to-pink-50 p-3 rounded-lg border border-orange-200">
        <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-pink-600 rounded-lg flex items-center justify-center">
          <FolderOpen className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 space-x-reverse">
            <h4 className="font-medium text-gray-800">{albumTitle}</h4>
            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
              {giftDetails && albumData ? 
                `${giftDetails.emoji} ${giftDetails.name} × ${albumData.requiredGiftAmount}` : 
                `💰 ${albumPrice} نقطة`
              }
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {hasAccess 
              ? "يمكنك عرض محتويات الألبوم" 
              : albumData && albumData.creatorId === currentUserId 
                ? "أنت منشئ هذا الألبوم - يمكنك عرضه مجاناً"
                : "ادفع لفتح محتويات الألبوم"
            }
          </p>
        </div>
        <div className="flex flex-col items-center space-y-1">
          {hasAccess || (albumData && albumData.creatorId === currentUserId) ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (albumId) {
                  window.location.href = `/premium-albums/${albumId}`;
                }
              }}
              className="text-green-600 hover:bg-green-50"
            >
              <Unlock className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="ghost" 
              size="sm"
              onClick={() => setShowPaymentDialog(true)}
              className="text-orange-600 hover:bg-orange-50 flex flex-col items-center"
              title={`ادفع ${giftDetails && albumData ? 
                `${giftDetails.emoji} ${giftDetails.name} × ${albumData.requiredGiftAmount}` : 
                `💰 ${albumPrice} نقطة`} لفتح الألبوم`}
            >
              <Lock className="w-4 h-4" />
              <span className="text-xs mt-1">ادفع</span>
            </Button>
          )}
        </div>
      </div>

      {/* عرض محتويات الألبوم */}
      {isExpanded && (hasAccess || message.senderId === currentUserId) && albumData && (
        <AlbumContentViewer albumId={albumId!} albumData={albumData} onClose={() => setIsExpanded(false)} />
      )}
    </div>
  );
}

// Component لعرض محتويات الألبوم
function AlbumContentViewer({ albumId, albumData, onClose }: { 
  albumId: string; 
  albumData: any; 
  onClose: () => void; 
}) {
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlbumMedia = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/premium-albums/${albumId}/media`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setMediaItems(data);
      }
    } catch (error) {
      console.error('خطأ في جلب محتويات الألبوم:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbumMedia();
  }, [albumId]);

  return (
    <div className="bg-gray-50 rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">محتويات الألبوم</span>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="text-sm text-gray-600">
        📸 {mediaItems.length} محتوى مرئي
      </div>
      
      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-500">جاري التحميل...</p>
        </div>
      ) : mediaItems.length > 0 ? (
        <div className="space-y-3">
          {mediaItems.map((item, index) => (
            <MediaViewer key={index} item={item} index={index} />
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          <Eye className="w-8 h-8 mx-auto mb-2" />
          <p>لا توجد محتويات في الألبوم بعد</p>
        </div>
      )}
    </div>
  );
}

// Component لعرض الوسائط بحجم كامل
function MediaViewer({ item, index }: { item: any; index: number }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <>
      <div 
        className="relative rounded-lg overflow-hidden bg-white border cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setIsFullscreen(true)}
      >
        {item.mediaType === 'image' ? (
          <img 
            src={item.mediaUrl} 
            alt={item.caption || `محتوى ${index + 1}`}
            className="w-full h-48 object-cover"
          />
        ) : item.mediaType === 'video' ? (
          <video 
            src={item.mediaUrl} 
            className="w-full h-48 object-cover"
            poster={item.thumbnailUrl}
          />
        ) : (
          <div className="w-full h-48 flex items-center justify-center bg-gray-100">
            <Image className="w-8 h-8 text-gray-400" />
          </div>
        )}
        
        {item.caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-sm p-3">
            {item.caption}
          </div>
        )}
        
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          انقر للعرض الكامل
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-screen w-full h-full flex items-center justify-center p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white hover:bg-black hover:bg-opacity-70 z-10"
            >
              <X className="w-6 h-6" />
            </Button>
            
            {item.mediaType === 'image' ? (
              <img 
                src={item.mediaUrl} 
                alt={item.caption || `محتوى ${index + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            ) : item.mediaType === 'video' ? (
              <video 
                src={item.mediaUrl} 
                className="max-w-full max-h-full object-contain"
                controls
                autoPlay
                poster={item.thumbnailUrl}
              />
            ) : null}
            
            {item.caption && (
              <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 text-white p-4 rounded">
                {item.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  
  // Extract user ID from URL /messages/chat/:userId
  const otherUserId = location.split('/messages/chat/')[1];
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Message states
  const [newMessage, setNewMessage] = useState("");
  
  // Gift system states
  const [showGiftShop, setShowGiftShop] = useState(false);
  
  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Block status state
  const [isBlocked, setIsBlocked] = useState(false);
  
  // Premium albums state
  const [showAlbumsDialog, setShowAlbumsDialog] = useState(false);
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Voice playback states
  const [playingMessageId, setPlayingMessageId] = useState<number | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Validate user ID
  if (!otherUserId) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        <SimpleNavigation />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">خطأ في الرابط</h1>
          <p className="text-gray-600">لم يتم العثور على معرف المستخدم في الرابط</p>
          <Button onClick={() => setLocation('/messages')} className="mt-4">
            العودة إلى الرسائل
          </Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  // Fetch other user info
  const { data: otherUser } = useQuery({
    queryKey: [`/api/users/${otherUserId}`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${otherUserId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: [`/api/messages/${otherUserId}`],
    queryFn: async () => {
      const response = await fetch(`/api/messages/${otherUserId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    refetchInterval: 2000 // Refresh every 2 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { recipientId: string; content: string; messageType?: string }) => {
      return await apiRequest('/api/messages/send', 'POST', messageData);
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${otherUserId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
    },
    onError: (error: any) => {
      // عرض رسالة الخطأ من السيرفر بتصميم جميل وبسيط
      if (error?.message) {
        toast({
          description: (
            <div className="flex items-center gap-3">
              <div className="text-2xl">🚫</div>
              <div className="text-sm font-medium">{error.message}</div>
            </div>
          ),
          className: "border-0 bg-blue-50 text-blue-900 shadow-lg rounded-xl",
        });
      }
    }
  });

  // Check block status
  const { data: blockStatus } = useQuery({
    queryKey: [`/api/users/${otherUserId}/block-status`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${otherUserId}/block-status`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch block status');
      return response.json();
    }
  });

  // Update block status when data changes
  useEffect(() => {
    if (blockStatus?.isBlocked !== undefined) {
      setIsBlocked(blockStatus.isBlocked);
    }
  }, [blockStatus]);

  // Fetch user's premium albums
  const { data: premiumAlbums = [] } = useQuery({
    queryKey: ['/api/premium-albums/my-albums'],
    queryFn: async () => {
      const response = await fetch('/api/premium-albums/my-albums', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch albums');
      return response.json();
    },
    enabled: !!user,
  });

  // Mark messages as read
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/messages/${otherUserId}/read`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
    }
  });

  // Block/Unblock user mutation
  const blockUserMutation = useMutation({
    mutationFn: async (block: boolean) => {
      return await apiRequest(`/api/users/${otherUserId}/${block ? 'block' : 'unblock'}`, 'POST');
    },
    onSuccess: (data, block) => {
      setIsBlocked(block);
      toast({
        title: block ? "تم حظر المستخدم" : "تم إلغاء حظر المستخدم",
        description: block ? "لن تتلقى رسائل من هذا المستخدم" : "يمكنك الآن تلقي رسائل من هذا المستخدم",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${otherUserId}/block-status`] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء العملية",
        variant: "destructive"
      });
    }
  });

  // Handle send album
  const handleSendAlbum = async (album: any) => {
    console.log('🎁 محاولة إرسال الألبوم:', album);
    console.log('🔧 بيانات المستلم:', otherUserId);
    
    try {
      const albumMessage = `🎁 ألبوم مدفوع: ${album.title}\n💰 السعر: ${album.requiredGiftAmount} نقطة\n📱 انقر للوصول: /premium-albums/${album.id}`;
      
      console.log('📨 رسالة الألبوم:', albumMessage);
      console.log('🔄 إرسال باستخدام mutation...');
      
      const result = await sendMessageMutation.mutateAsync({
        recipientId: otherUserId,
        content: albumMessage,
        messageType: 'text'
      });

      console.log('✅ نتيجة الإرسال:', result);
      setShowAlbumsDialog(false);
      
      toast({
        title: "تم إرسال الألبوم",
        description: `تم إرسال ألبوم "${album.title}" بنجاح`,
      });
    } catch (error: any) {
      console.error('❌ خطأ في إرسال الألبوم:', error);
      toast({
        title: "خطأ في الإرسال",
        description: error.message || "فشل في إرسال الألبوم",
        variant: "destructive",
      });
    }
  };

  // Handle send message
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    sendMessageMutation.mutate({
      recipientId: otherUserId,
      content: newMessage.trim()
    });
  };

  // Handle send voice message
  const handleSendVoiceMessage = () => {
    if (!audioBlob) {
      toast({
        title: "خطأ",
        description: "لا توجد رسالة صوتية للإرسال",
        variant: "destructive"
      });
      return;
    }
    
    // Check file size (limit to 1MB to avoid server issues)
    if (audioBlob.size > 1 * 1024 * 1024) {
      toast({
        title: "ملف كبير جداً",
        description: "الرسالة الصوتية كبيرة جداً. حاول تسجيل رسالة أقصر",
        variant: "destructive"
      });
      return;
    }
    
    // Convert audio blob to base64 for transmission
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const base64Audio = reader.result as string;
        
        sendMessageMutation.mutate({
          recipientId: otherUserId,
          content: base64Audio, // Store base64 audio data as content
          messageType: 'voice'
        }, {
          onSuccess: () => {
            // Clear the audio blob after successful sending
            setAudioBlob(null);
            toast({
              title: "تم الإرسال",
              description: "تم إرسال الرسالة الصوتية بنجاح",
            });
          },
          onError: (error) => {
            console.error('Voice message send error:', error);
            toast({
              title: "فشل الإرسال",
              description: "حدث خطأ أثناء إرسال الرسالة الصوتية. حاول مرة أخرى",
              variant: "destructive"
            });
          }
        });
      } catch (error) {
        console.error('FileReader error:', error);
        toast({
          title: "خطأ في المعالجة",
          description: "حدث خطأ أثناء معالجة الملف الصوتي",
          variant: "destructive"
        });
      }
    };
    
    reader.onerror = () => {
      toast({
        title: "خطأ في القراءة",
        description: "لا يمكن قراءة الملف الصوتي",
        variant: "destructive"
      });
    };
    
    reader.readAsDataURL(audioBlob);
  };

  // Handle voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000, // Lower sample rate to reduce file size
          channelCount: 1,   // Mono audio
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      // Use lower bitrate to reduce file size
      const options = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 32000 // Lower bitrate for smaller files
      };
      
      let recorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        // Fallback to default if the options are not supported
        recorder = new MediaRecorder(stream);
      }
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setAudioBlob(e.data);
        }
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      
      const interval = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 15) { // Reduced max recording time to 15 seconds
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      
      setRecordingInterval(interval);
    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: "خطأ في التسجيل",
        description: "لا يمكن الوصول إلى الميكروفون أو المتصفح لا يدعم التسجيل",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream?.getTracks().forEach(track => track.stop());
    }
    
    if (recordingInterval) {
      clearInterval(recordingInterval);
      setRecordingInterval(null);
    }
    
    setIsRecording(false);
    setRecordingTime(0);
    setMediaRecorder(null);
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
  };

  // Handle voice message playback
  const playVoiceMessage = (messageId: number, audioData: string) => {
    // If already playing this message, pause it
    if (playingMessageId === messageId && audioElement && !audioElement.paused) {
      audioElement.pause();
      setPlayingMessageId(null);
      return;
    }

    // Stop any currently playing audio
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    // Create new audio element and play
    const audio = new Audio(audioData);
    audio.onplay = () => setPlayingMessageId(messageId);
    audio.onended = () => setPlayingMessageId(null);
    audio.onerror = () => {
      setPlayingMessageId(null);
      toast({
        title: "خطأ في التشغيل", 
        description: "لا يمكن تشغيل الرسالة الصوتية",
        variant: "destructive"
      });
    };

    setAudioElement(audio);
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
      toast({
        title: "خطأ في التشغيل",
        description: "لا يمكن تشغيل الرسالة الصوتية", 
        variant: "destructive"
      });
    });
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when page loads
  useEffect(() => {
    if (messages.length > 0) {
      markAsReadMutation.mutate();
    }
  }, [messages.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        <SimpleNavigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg">جاري التحميل...</div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20 md:pb-0">
      {/* No SimpleNavigation - Custom header only */}
      
      {/* Chat Header */}
      <div className="bg-white shadow-sm border-b p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3 space-x-reverse">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/messages')}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div 
            className="flex items-center space-x-2 space-x-reverse cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
            onClick={() => setLocation(`/user/${otherUser?.id}`)}
          >
            <div className="relative">
              <img
                src={otherUser?.profileImageUrl || '/uploads/default-avatar.png'}
                alt={otherUser?.username || 'User'}
                className="w-10 h-10 rounded-full object-cover"
              />
              {/* Online status indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h2 className="font-semibold text-gray-800 hover:text-purple-600 transition-colors">
                {otherUser?.firstName || otherUser?.username || 'مستخدم'}
              </h2>
              <div className="flex items-center space-x-1 space-x-reverse">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-sm text-green-600 font-medium">متصل الآن</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">

          
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2 text-pink-600 hover:bg-pink-50"
            onClick={() => {
              console.log('Gift button clicked!');
              setShowGiftShop(true);
            }}
          >
            <Gift className="w-5 h-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => {
                toast({
                  title: "معلومات المحادثة",
                  description: "عرض معلومات تفصيلية عن المحادثة",
                });
              }}>
                <Info className="w-4 h-4 ml-2" />
                معلومات المحادثة
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => {
                toast({
                  title: "إعدادات الدردشة",
                  description: "تخصيص إعدادات المحادثة",
                });
              }}>
                <Settings className="w-4 h-4 ml-2" />
                إعدادات الدردشة
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Block/Unblock User Option */}
              <DropdownMenuItem 
                onClick={() => blockUserMutation.mutate(!isBlocked)}
                disabled={blockUserMutation.isPending}
                className={isBlocked ? "text-green-600" : "text-red-600"}
              >
                {isBlocked ? (
                  <>
                    <Shield className="w-4 h-4 ml-2" />
                    إلغاء حظر المستخدم
                  </>
                ) : (
                  <>
                    <UserX className="w-4 h-4 ml-2" />
                    حظر المستخدم
                  </>
                )}
              </DropdownMenuItem>
              

              <DropdownMenuItem onClick={() => {
                toast({
                  title: "أرشيف الرسائل",
                  description: "عرض الرسائل المؤرشفة",
                });
              }}>
                <MessageSquare className="w-4 h-4 ml-2" />
                أرشيف الرسائل
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500">لا توجد رسائل بعد</div>
            <div className="text-sm text-gray-400 mt-2">ابدأ المحادثة بإرسال رسالة</div>
          </div>
        ) : (
          messages.map((message: Message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderId === user?.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-800 border'
                }`}
              >
                {message.messageType === 'voice' ? (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Button
                      onClick={() => playVoiceMessage(message.id, message.content)}
                      variant="ghost"
                      size="sm"
                      className={`p-1 ${
                        message.senderId === user?.id
                          ? 'text-white hover:bg-white/20'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {playingMessageId === message.id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <div className="flex-1">
                      <div className={`text-xs ${
                        message.senderId === user?.id ? 'text-purple-200' : 'text-gray-500'
                      }`}>
                        رسالة صوتية
                      </div>
                      <div className={`w-16 h-1 rounded-full mt-1 ${
                        message.senderId === user?.id ? 'bg-white/30' : 'bg-gray-300'
                      }`}>
                        <div className={`h-full rounded-full ${
                          message.senderId === user?.id ? 'bg-white' : 'bg-purple-600'
                        } w-0`}></div>
                      </div>
                    </div>
                  </div>
                ) : message.content.includes('🎁 ألبوم مدفوع:') ? (
                  <PremiumAlbumMessage 
                    message={message} 
                    currentUserId={user?.id} 
                  />
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs ${
                    message.senderId === user?.id ? 'text-purple-200' : 'text-gray-500'
                  }`}>
                    {new Date(message.createdAt).toLocaleTimeString('ar', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {message.senderId === user?.id && (
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border-2 ${
                      message.isRead 
                        ? 'bg-green-600 text-white border-green-500' 
                        : 'bg-blue-600 text-white border-blue-500'
                    }`}>
                      <span className="text-xs">
                        {message.isRead ? '✓✓' : '✓'}
                      </span>
                      <span className="text-xs">
                        {message.isRead ? 'مقروءة' : 'مرسلة'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t p-4">
        {audioBlob ? (
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="flex-1 bg-purple-50 rounded-lg p-3">
              <div className="text-sm text-purple-800">
                {sendMessageMutation.isPending ? "جاري الإرسال..." : "رسالة صوتية جاهزة للإرسال"}
              </div>
            </div>
            <Button 
              onClick={() => setAudioBlob(null)} 
              variant="ghost" 
              size="sm"
              disabled={sendMessageMutation.isPending}
            >
              <X className="w-4 h-4" />
            </Button>
            <Button 
              onClick={handleSendVoiceMessage} 
              className="bg-purple-600" 
              disabled={sendMessageMutation.isPending}
            >
              {sendMessageMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        ) : isRecording ? (
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="flex-1 bg-red-50 rounded-lg p-3 flex items-center space-x-2 space-x-reverse">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-800 text-sm">جاري التسجيل... {recordingTime}s / 15s</span>
            </div>
            <Button onClick={cancelRecording} variant="ghost" size="sm">
              <X className="w-4 h-4" />
            </Button>
            <Button onClick={stopRecording} className="bg-red-600">
              <MicOff className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 space-x-reverse">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button onClick={startRecording} variant="ghost" size="sm">
              <Mic className="w-5 h-5" />
            </Button>
            <Dialog open={showAlbumsDialog} onOpenChange={setShowAlbumsDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" title="إرسال ألبوم مدفوع" className="relative">
                  <FolderOpen className="w-5 h-5 text-orange-600" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">💰</span>
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-center">
                    <div className="flex items-center justify-center space-x-2 space-x-reverse">
                      <FolderOpen className="w-6 h-6 text-orange-600" />
                      <span>الألبومات المدفوعة</span>
                      <span className="text-yellow-500">💰</span>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {premiumAlbums.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-r from-orange-400 to-pink-600 rounded-full flex items-center justify-center">
                        <FolderOpen className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-gray-600 font-medium mb-1">لا توجد ألبومات مدفوعة</p>
                      <p className="text-sm text-gray-500 mb-4">أنشئ ألبومات مدفوعة لمشاركتها مع أصدقائك</p>
                      <Button
                        variant="outline"
                        className="mt-3 border-orange-500 text-orange-600 hover:bg-orange-50"
                        onClick={() => {
                          setShowAlbumsDialog(false);
                          setLocation('/premium-albums');
                        }}
                      >
                        <span className="ml-2">💰</span>
                        إنشاء ألبوم مدفوع
                      </Button>
                    </div>
                  ) : (
                    premiumAlbums.map((album: any) => (
                      <div
                        key={album.id}
                        className="flex items-center p-3 border-2 border-orange-200 rounded-lg hover:bg-orange-50 cursor-pointer transition-colors"
                        onClick={() => handleSendAlbum(album)}
                      >
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-pink-600 rounded-lg flex items-center justify-center relative">
                          <FolderOpen className="w-6 h-6 text-white" />
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                            <span className="text-xs">💰</span>
                          </span>
                        </div>
                        <div className="flex-1 mr-3">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <h3 className="font-medium text-gray-800">{album.title}</h3>
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">مدفوع</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            📷 {album.totalPhotos || 0} محتوى • 💰 {album.requiredGiftAmount} نقطة
                          </p>
                        </div>
                        <div className="text-orange-600">
                          <Send className="w-4 h-4" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Button 
              onClick={handleSendMessage} 
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Gift Shop Modal */}
      {showGiftShop && otherUser && (
        <GiftShop
          isOpen={showGiftShop}
          onClose={() => {
            console.log('Closing gift shop');
            setShowGiftShop(false);
          }}
          receiverId={otherUser.id}
          receiverName={otherUser.firstName || otherUser.username}
          onGiftSent={(gift) => {
            console.log('Gift sent:', gift);
            setShowGiftShop(false);
          }}
        />
      )}

      {/* Invite People Modal */}
      <InvitePeopleModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        currentChatUserId={otherUserId}
      />

      <BottomNavigation />
    </div>
  );
}