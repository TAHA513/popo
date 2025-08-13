import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Heart, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';

interface Comment {
  id: number;
  content: string;
  userId: string;
  memoryId: number;
  createdAt: string;
  likeCount?: number;
  author: {
    id: string;
    username: string;
    firstName?: string;
    profileImageUrl?: string;
  };
}

interface VideoCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  memoryId: number;
  memoryAuthor?: {
    username: string;
    profileImageUrl?: string;
  };
}

export default function VideoCommentsModal({ 
  isOpen, 
  onClose, 
  memoryId, 
  memoryAuthor 
}: VideoCommentsModalProps) {
  const [newComment, setNewComment] = useState('');
  const [showDeleteMenu, setShowDeleteMenu] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ['/api/memories', memoryId, 'comments'],
    enabled: isOpen && !!memoryId,
    queryFn: async () => {
      const response = await fetch(`/api/memories/${memoryId}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json();
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/memories/${memoryId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
        }),
      });
      if (!response.ok) throw new Error('Failed to add comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/memories', memoryId, 'comments'] });
      setNewComment('');
    },
  });

  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to like comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/memories', memoryId, 'comments'] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to delete comment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/memories', memoryId, 'comments'] });
      setShowDeleteMenu(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close delete menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-delete-menu]')) {
        setShowDeleteMenu(null);
      }
    };

    if (showDeleteMenu !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDeleteMenu]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-end">
      {/* Modal Container - slides up from bottom */}
      <div className="w-full bg-white dark:bg-gray-900 rounded-t-xl max-h-[70vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            التعليقات
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>لا توجد تعليقات بعد</p>
              <p className="text-sm mt-2">كن أول من يعلق!</p>
            </div>
          ) : (
            comments.map((comment: Comment) => {
              console.log('Rendering comment:', { 
                id: comment.id, 
                userId: comment.userId, 
                currentUser: user?.id, 
                canDelete: user?.id === comment.userId 
              });
              return (
              <div key={comment.id} className="flex space-x-3 rtl:space-x-reverse">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                    {comment.author.profileImageUrl ? (
                      <img
                        src={comment.author.profileImageUrl}
                        alt={comment.author.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-xs font-medium">
                        {comment.author.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <span className="font-medium text-sm text-gray-900 dark:text-white">
                      {comment.author.firstName || comment.author.username}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: ar,
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                      {comment.content}
                    </p>
                    
                    {/* Delete button in center - only show for user's own comments */}
                    {user?.id === comment.userId && (
                      <div className="relative mr-2" data-delete-menu>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Delete menu button clicked for comment:', comment.id);
                            setShowDeleteMenu(showDeleteMenu === comment.id ? null : comment.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {showDeleteMenu === comment.id && (
                          <div className="absolute right-0 top-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-[1000] min-w-[120px] animate-in fade-in-0 zoom-in-95 duration-200">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                deleteCommentMutation.mutate(comment.id);
                              }}
                              disabled={deleteCommentMutation.isPending}
                              className="w-full px-3 py-2 text-right text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2 rtl:space-x-reverse rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-3 h-3 flex-shrink-0" />
                              <span className="font-medium">
                                {deleteCommentMutation.isPending ? 'حذف...' : 'حذف'}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center mt-2 space-x-4 rtl:space-x-reverse">
                    <button
                      onClick={() => likeCommentMutation.mutate(comment.id)}
                      className="flex items-center space-x-1 rtl:space-x-reverse text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                      <span className="text-xs">{comment.likeCount || 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
            })
          )}
        </div>

        {/* Comment Input */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="flex-1">
              <Input
                ref={inputRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="اكتب تعليقاً..."
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                disabled={addCommentMutation.isPending}
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={!newComment.trim() || addCommentMutation.isPending}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {addCommentMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}