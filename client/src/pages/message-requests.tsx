import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Check, X, Ban, ArrowLeft } from "lucide-react";
import SimpleNavigation from "@/components/simple-navigation";
import BottomNavigation from "@/components/bottom-navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

export default function MessageRequestsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch message requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['/api/messages/requests'],
    queryFn: async () => {
      const response = await fetch('/api/messages/requests', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch requests');
      return response.json();
    }
  });

  // Respond to request mutation
  const respondMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: number, action: string }) => {
      return apiRequest(`/api/messages/requests/${requestId}/respond`, "POST", { action });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages/requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
    },
  });

  const handleRespond = (requestId: number, action: string) => {
    respondMutation.mutate({ requestId, action });
  };

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
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <SimpleNavigation />
      
      <main className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="mb-6 flex items-center space-x-3 rtl:space-x-reverse">
          <Link href="/messages">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">طلبات الرسائل</h1>
        </div>

        {/* Message Requests List */}
        {requests.length === 0 ? (
          <Card className="p-12 text-center">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد طلبات رسائل</h3>
            <p className="text-gray-500">ستظهر هنا طلبات الرسائل الجديدة من مستخدمين آخرين</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request: any) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4 rtl:space-x-reverse flex-1">
                      {/* Sender Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white">
                        {request.sender.profileImageUrl ? (
                          <img 
                            src={request.sender.profileImageUrl} 
                            alt={request.sender.username} 
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <MessageCircle className="w-6 h-6" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 rtl:space-x-reverse mb-1">
                          <h3 className="font-semibold text-gray-800">
                            {request.sender.firstName || request.sender.username}
                          </h3>
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            طلب جديد
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-1">
                          @{request.sender.username}
                        </p>
                        
                        {/* Message Content */}
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {request.initialMessage}
                          </p>
                        </div>
                        
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(request.createdAt).toLocaleDateString('ar')} في {new Date(request.createdAt).toLocaleTimeString('ar', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-2 rtl:space-x-reverse mt-4 pt-4 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRespond(request.id, 'reject')}
                      disabled={respondMutation.isPending}
                      className="text-gray-600 hover:text-red-600 hover:border-red-300"
                    >
                      <X className="w-4 h-4 ml-1" />
                      رفض
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRespond(request.id, 'block')}
                      disabled={respondMutation.isPending}
                      className="text-gray-600 hover:text-red-600 hover:border-red-300"
                    >
                      <Ban className="w-4 h-4 ml-1" />
                      حظر
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={() => handleRespond(request.id, 'accept')}
                      disabled={respondMutation.isPending}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Check className="w-4 h-4 ml-1" />
                      قبول
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}