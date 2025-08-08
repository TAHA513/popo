import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, ArrowLeft, Users } from "lucide-react";
import { useLocation } from "wouter";

export default function StartChatPage() {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const [, setLocation] = useLocation();
  const [chatTitle, setChatTitle] = useState(t('stream.quick_chat'));
  const [chatDescription, setChatDescription] = useState(t('stream.text_only'));
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const createChat = async () => {
    if (!chatTitle.trim()) {
      setError(t('validation.title_required'));
      return;
    }

    if (!user) {
      alert(t('stream.login_required'));
      setLocation("/login");
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      console.log("💬 Creating new chat room...");
      
      const streamData = {
        title: chatTitle,
        description: chatDescription,
        category: t('stream.quick_category')
      };

      console.log("📨 Sending chat creation request:", streamData);
      
      const response = await apiRequest('/api/streams', 'POST', streamData);
      
      console.log("✅ Chat created successfully:", response);
      
      if (response.success && response.data) {
        const chatId = response.data.id;
        console.log("🎯 Redirecting to chat:", chatId);
        
        // التوجه مباشرة للدردشة
        setLocation(`/stream/${chatId}`);
      } else {
        throw new Error(t('stream.creation_failed'));
      }
      
    } catch (error: any) {
      console.error("❌ Chat creation failed:", error);
      
      let errorMessage = t('stream.creation_failed');
      
      if (error.status === 401) {
        errorMessage = t('stream.login_required');
        setLocation("/login");
        return;
      } else if (error.status === 403) {
        errorMessage = t('stream.no_permission');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-black to-blue-900 text-white relative">
      {/* خلفية متدرجة */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-transparent to-blue-500/20"></div>
      
      {/* زر العودة */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLocation('/')}
        className="absolute top-4 left-4 z-50 bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
      >
        <ArrowLeft className="w-5 h-5 ml-2" />
        {t('nav.back')}
      </Button>

      <div className="relative z-10 p-6 pt-20">
        <div className="max-w-md mx-auto">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">💬 {t('stream.create_new_chat')}</h1>
            <p className="text-gray-300">{t('stream.text_only_desc')}</p>
          </div>

          {/* Chat Creation Form */}
          <Card className="bg-black/40 backdrop-blur-lg border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white text-xl">{t('stream.chat_details')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Chat Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">{t('stream.chat_title')}</label>
                <Input
                  value={chatTitle}
                  onChange={(e) => setChatTitle(e.target.value)}
                  placeholder={t('stream.title_placeholder')}
                  className="bg-white/10 border-white/30 text-white placeholder:text-gray-400 focus:border-green-400"
                />
              </div>

              {/* Chat Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">{t('stream.chat_description')}</label>
                <Textarea
                  value={chatDescription}
                  onChange={(e) => setChatDescription(e.target.value)}
                  placeholder={t('stream.description_placeholder')}
                  className="bg-white/10 border-white/30 text-white placeholder:text-gray-400 focus:border-green-400"
                  rows={3}
                />
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
                  {error}
                </div>
              )}

              {/* Create Chat Button */}
              <Button
                onClick={createChat}
                disabled={isCreating}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isCreating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{t('stream.creating')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-6 h-6" />
                    <span>{t('stream.create_button')}</span>
                  </div>
                )}
              </Button>

              {/* Info Text */}
              <div className="text-center text-sm text-gray-400 bg-white/5 rounded-lg p-3">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">{t('stream.text_only_desc')}</span>
                </div>
                <p>{t('stream.participants_can_join')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}