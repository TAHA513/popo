import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RealTimeTimestamp } from "@/components/real-time-timestamp";
import { useLocation } from "wouter";
import { 
  ArrowLeft, 
  Send, 
  Heart, 
  MessageCircle,
  Smile,
  User
} from "lucide-react";

interface Comment {
  id: number;
  userId: string;
  memoryId: number;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    firstName?: string;
    profileImageUrl?: string;
  };
}

interface Memory {
  id: number;
  caption: string;
  mediaUrls: string[];
  author?: {
    username: string;
    profileImageUrl?: string;
  };
}

export default function CommentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [comments, setComments] = useState<Comment[]>([]);
  const [memory, setMemory] = useState<Memory | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // استخراج معرف المنشور من الرابط
  const memoryId = window.location.pathname.split('/comments/')[1];

  useEffect(() => {
    if (memoryId) {
      fetchMemoryAndComments();
    }
  }, [memoryId]);

  const fetchMemoryAndComments = async () => {
    console.log('🔄 بدء جلب البيانات للذكرى:', memoryId);
    try {
      // جلب المنشور
      console.log('📝 جلب معلومات المنشور...');
      const memoryResponse = await fetch(`/api/memories/${memoryId}`);
      console.log('📝 استجابة المنشور:', memoryResponse.status);
      if (memoryResponse.ok) {
        const memoryData = await memoryResponse.json();
        console.log('📝 بيانات المنشور:', memoryData);
        setMemory(memoryData);
      }

      // جلب التعليقات
      console.log('💬 جلب التعليقات...');
      const commentsResponse = await fetch(`/api/memories/${memoryId}/comments`);
      console.log('💬 استجابة التعليقات:', commentsResponse.status);
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json();
        console.log('💬 بيانات التعليقات:', commentsData);
        setComments(commentsData);
      } else {
        console.error('فشل في جلب التعليقات');
        setComments([]);
      }
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
    } finally {
      console.log('✅ انتهى التحميل');
      setIsLoading(false);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;
    if (!user) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "يرجى تسجيل الدخول لإضافة تعليق",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/memories/${memoryId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      });

      if (response.ok) {
        const newCommentData = await response.json();
        setComments(prev => [newCommentData, ...prev]); // أضافة التعليق في المقدمة
        setNewComment("");
        toast({
          title: "تم إضافة التعليق ✅",
          description: "تم نشر تعليقك بنجاح"
        });
        
        // تحديث قائمة التعليقات
        fetchMemoryAndComments();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في إضافة التعليق');
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة التعليق",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>جاري تحميل التعليقات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-lg border-b border-purple-500/20">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="text-white hover:bg-white/10 rounded-full p-2"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          
          <div className="text-center">
            <h1 className="text-lg font-bold text-white">التعليقات</h1>
            <p className="text-purple-300 text-sm">{comments.length} تعليق</p>
          </div>
          
          <div className="w-10"></div>
        </div>
      </div>

      {/* Memory Info - Text Only */}
      {memory && (
        <div className="p-4 border-b border-purple-500/20">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={memory.author?.profileImageUrl} />
              <AvatarFallback className="bg-purple-500">
                {memory.author?.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-white font-semibold">@{memory.author?.username || 'مستخدم'}</p>
              <p className="text-purple-300 text-sm">
                {new Date(memory.createdAt).toLocaleDateString('ar')}
              </p>
              {memory.caption && (
                <p className="text-white/90 text-sm leading-relaxed mt-2">
                  {memory.caption}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="flex-1 p-4 pb-24">
        {comments.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <p className="text-purple-300 text-lg">لا توجد تعليقات بعد</p>
            <p className="text-purple-400 text-sm mt-2">كن أول من يعلق على هذا المنشور</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3">
                <button 
                  onClick={() => {
                    console.log('Navigating to profile:', comment.userId);
                    setLocation(`/user/${comment.userId}`);
                  }}
                  className="transition-all hover:scale-105"
                >
                  <Avatar className="w-8 h-8 hover:opacity-80 transition-opacity cursor-pointer">
                    <AvatarImage src={comment.author?.profileImageUrl} />
                    <AvatarFallback className="bg-purple-500 text-xs">
                      {comment.author?.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>
                <div className="flex-1">
                  <div className="bg-purple-500/10 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        onClick={() => {
                          console.log('Navigating to username profile:', comment.userId);
                          setLocation(`/user/${comment.userId}`);
                        }}
                        className="font-semibold text-purple-300 text-sm hover:text-purple-200 transition-colors cursor-pointer"
                      >
                        {comment.author?.username || 'مستخدم'}
                      </button>
                      <span className="text-purple-400 text-xs">
                        <RealTimeTimestamp timestamp={comment.createdAt} />
                      </span>
                    </div>
                    <p className="text-white text-sm leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comment Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-purple-500/20 p-4">
        {user ? (
          <div className="flex items-end gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.profileImageUrl || undefined} />
              <AvatarFallback className="bg-purple-500">
                {user.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="اكتب تعليقك هنا..."
                className="min-h-[40px] max-h-[120px] bg-purple-500/10 border-purple-500/30 text-white placeholder:text-purple-400 resize-none"
                dir="rtl"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submitComment();
                  }
                }}
              />
            </div>
            <Button
              onClick={submitComment}
              disabled={!newComment.trim() || isSubmitting}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-full"
            >
              {isSubmitting ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-purple-300 mb-3">يجب تسجيل الدخول للتعليق</p>
            <Button
              onClick={() => window.location.href = '/login'}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              تسجيل الدخول
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}