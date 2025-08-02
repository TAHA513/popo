import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserPlus, X } from "lucide-react";

interface User {
  id: string;
  username: string;
  firstName: string;
  profileImageUrl: string;
}

interface InvitePeopleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentChatUserId: string;
}

export function InvitePeopleModal({ isOpen, onClose, currentChatUserId }: InvitePeopleModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // Search for users (excluding current user and chat partner)
  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ['/api/users/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to search users');
      const results = await response.json();
      
      // Filter out current user and chat partner
      return results.filter((u: User) => 
        u.id !== user?.id && u.id !== currentChatUserId
      );
    },
    enabled: searchQuery.length > 2
  });

  // Create group chat invitation
  const inviteUsersMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      return await apiRequest('/api/group-rooms/create', 'POST', {
        title: `دردشة جماعية`,
        description: `دردشة جماعية مع ${userIds.length + 1} أشخاص`,
        participantIds: [currentChatUserId, ...userIds],
        giftRequired: {
          name: "رسالة بسيطة",
          price: 10,
          icon: "💬"
        },
        entryPrice: 10
      });
    },
    onSuccess: (data) => {
      toast({
        title: "تم إنشاء الدردشة الجماعية",
        description: "تم دعوة الأشخاص بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/group-rooms/available'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الدعوة",
        description: error.message || "حدث خطأ أثناء دعوة الأشخاص",
        variant: "destructive"
      });
    }
  });

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleInvite = () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "لا يوجد أشخاص محددون",
        description: "يرجى اختيار شخص واحد على الأقل للدعوة",
        variant: "destructive"
      });
      return;
    }

    inviteUsersMutation.mutate(selectedUsers);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">دعوة أشخاص</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="ابحث عن أشخاص..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search Results */}
          <div className="max-h-60 overflow-y-auto space-y-2">
            {searchLoading ? (
              <div className="text-center py-4 text-gray-500">جاري البحث...</div>
            ) : searchQuery.length > 2 && searchResults.length === 0 ? (
              <div className="text-center py-4 text-gray-500">لا توجد نتائج</div>
            ) : searchQuery.length <= 2 ? (
              <div className="text-center py-4 text-gray-500">اكتب 3 أحرف على الأقل للبحث</div>
            ) : (
              searchResults.map((searchUser: User) => (
                <div
                  key={searchUser.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedUsers.includes(searchUser.id)
                      ? 'bg-purple-50 border-purple-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => toggleUserSelection(searchUser.id)}
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Avatar className="w-10 h-10">
                      <AvatarImage 
                        src={searchUser.profileImageUrl || '/uploads/default-avatar.png'} 
                        alt={searchUser.username}
                      />
                      <AvatarFallback>
                        {(searchUser.firstName || searchUser.username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {searchUser.firstName || searchUser.username}
                      </div>
                      <div className="text-sm text-gray-500">@{searchUser.username}</div>
                    </div>
                  </div>
                  
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedUsers.includes(searchUser.id)
                      ? 'bg-purple-600 border-purple-600'
                      : 'border-gray-300'
                  }`}>
                    {selectedUsers.includes(searchUser.id) && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Selected Users Count */}
          {selectedUsers.length > 0 && (
            <div className="text-sm text-gray-600 text-center">
              تم اختيار {selectedUsers.length} شخص
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2 space-x-reverse">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={inviteUsersMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleInvite}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              disabled={selectedUsers.length === 0 || inviteUsersMutation.isPending}
            >
              {inviteUsersMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 ml-2" />
                  دعوة ({selectedUsers.length})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}