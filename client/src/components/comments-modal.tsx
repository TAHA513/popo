import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Send, 
  MessageCircle, 
  Heart, 
  User, 
  Clock,
  Reply,
  Smile
} from "lucide-react";
import { RealTimeTimestamp } from "@/components/real-time-timestamp";
import { Link } from "wouter";

interface Comment {
  id: number;
  content: string;
  authorId: string;
  postId: number;
  parentId?: number;
  createdAt: string;
  likeCount: number;
  author: {
    id: string;
    username: string;
    firstName?: string;
    profileImageUrl?: string;
  };
  replies?: Comment[];
}

interface CommentsModalProps {
  postId: string;
  postType: 'memory' | 'stream';
  isOpen: boolean;
  onClose: () => void;
}

export default function CommentsModal({ postId, postType, isOpen, onClose }: CommentsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Fetch comments
  const { data: comments = [], isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: [`/api/${postType}s/${postId}/comments`],
    enabled: isOpen && !!postId,
    refetchInterval: 5000, // تحديث كل 5 ثواني للتعليقات الجديدة
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: number }) => {
      return await apiRequest(`/api/${postType}s/${postId}/comments`, 'POST', {
        content,
        parentId
      });
    },
    onSuccess: (data) => {
      toast({
        title: "تم إضافة التعليق! 💬",
        description: "تم نشر تعليقك بنجاح",
      });
      setNewComment("");
      setReplyContent("");
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: [`/api/${postType}s/${postId}/comments`] });
      
      // Scroll to bottom to show new comment
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
      }, 100);
    },
    onError: (error) => {
      console.error('Error adding comment:', error);
      toast({
        title: "خطأ في إضافة التعليق",
        description: "حاول مرة أخرى",
        variant: "destructive",
      });
    }
  });

  // Like comment mutation
  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return await apiRequest(`/api/comments/${commentId}/like`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${postType}s/${postId}/comments`] });
    }
  });

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    
    addCommentMutation.mutate({ content: newComment.trim() });
  };

  const handleSubmitReply = (parentId: number) => {
    if (!replyContent.trim()) return;
    
    addCommentMutation.mutate({ 
      content: replyContent.trim(), 
      parentId 
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent, isReply = false) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isReply && replyingTo) {
        handleSubmitReply(replyingTo);
      } else {
        handleSubmitComment();
      }
    }
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'mr-8 border-r-2 border-purple-100 pr-4' : ''} mb-4`}>
      <div className="flex items-start space-x-3 rtl:space-x-reverse">
        <Link href={`/user/${comment.author.id}`}>
          <div className="flex-shrink-0 cursor-pointer hover:scale-105 transition-transform">
            {comment.author.profileImageUrl ? (
              <img
                src={comment.author.profileImageUrl}
                alt={comment.author.firstName || comment.author.username}
                className="w-8 h-8 rounded-full object-cover border border-purple-200"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <Link href={`/user/${comment.author.id}`}>
                <span className="font-semibold text-purple-600 hover:text-purple-800 cursor-pointer text-sm">
                  {comment.author.firstName || comment.author.username}
                </span>
              </Link>
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                <RealTimeTimestamp timestamp={comment.createdAt} />
              </div>
            </div>
            <p className="text-gray-800 text-sm leading-relaxed">{comment.content}</p>
          </div>
          
          <div className="flex items-center space-x-4 rtl:space-x-reverse mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => likeCommentMutation.mutate(comment.id)}
              className="text-xs text-gray-500 hover:text-red-500 p-1"
              disabled={likeCommentMutation.isPending}
            >
              <Heart className="w-3 h-3 mr-1" />
              {comment.likeCount > 0 && comment.likeCount}
            </Button>
            
            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="text-xs text-gray-500 hover:text-purple-500 p-1"
              >
                <Reply className="w-3 h-3 mr-1" />
                رد
              </Button>
            )}
          </div>
          
          {/* Reply input */}
          {replyingTo === comment.id && (
            <div className="mt-3 flex items-center space-x-2 rtl:space-x-reverse">
              <div className="flex-shrink-0">
                {user?.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={user.firstName || user.username || ''}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <Input
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="اكتب ردك..."
                className="flex-1 text-sm"
                onKeyPress={(e) => handleKeyPress(e, true)}
                disabled={addCommentMutation.isPending}
              />
              <Button
                onClick={() => handleSubmitReply(comment.id)}
                disabled={!replyContent.trim() || addCommentMutation.isPending}
                size="sm"
                className="bg-purple-500 hover:bg-purple-600 text-white px-3"
              >
                <Send className="w-3 h-3" />
              </Button>
            </div>
          )}
          
          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map(reply => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MessageCircle className="w-5 h-5 text-purple-500 mr-2" />
              <h3 className="font-semibold text-lg">التعليقات</h3>
              <Badge variant="secondary" className="mr-2">
                {comments.length} تعليق
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-gray-100 rounded-full p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-96 p-4" ref={scrollAreaRef}>
            {commentsLoading ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                جاري تحميل التعليقات...
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map(comment => renderComment(comment))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>لا توجد تعليقات بعد</p>
                <p className="text-sm">كن أول من يعلق على هذا المنشور!</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
        
        {/* Add comment section */}
        <div className="flex-shrink-0 border-t p-4">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="flex-shrink-0">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={user.firstName || user.username || ''}
                  className="w-8 h-8 rounded-full object-cover border border-purple-200"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="أضف تعليقاً..."
              className="flex-1"
              onKeyPress={handleKeyPress}
              disabled={addCommentMutation.isPending}
            />
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || addCommentMutation.isPending}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4"
            >
              {addCommentMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}