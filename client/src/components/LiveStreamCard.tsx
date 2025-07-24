import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Heart, MessageCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { useToast } from "@/hooks/use-toast";

interface LiveStreamCardProps {
  stream: any;
  onStreamEnd?: (streamId: string) => void;
}

export default function LiveStreamCard({ stream, onStreamEnd }: LiveStreamCardProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleWatchStream = () => {
    // Store the stream being viewed for the viewer component
    localStorage.setItem('viewingStreamID', stream.streamId || `stream_${stream.id}`);
    localStorage.setItem('viewingStreamData', JSON.stringify(stream));
    
    if (stream?.isPublisher) {
      setLocation('/simple-live-streaming');
    } else {
      setLocation('/zego-viewer');
    }
  };

  const handleEndStream = async () => {
    try {
      const response = await fetch(`/api/streams/${stream.streamId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Clean up local storage
        localStorage.removeItem('currentStreamID');
        localStorage.removeItem('isPublisher');
        
        onStreamEnd?.(stream.id);
        
        toast({
          title: "تم إنهاء البث",
          description: "تم إنهاء البث المباشر بنجاح",
        });
      } else {
        throw new Error('فشل في إنهاء البث');
      }
    } catch (error) {
      console.error('Error ending stream:', error);
      toast({
        title: "خطأ",
        description: "فشل في إنهاء البث",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="border-0 shadow-sm bg-white rounded-xl overflow-hidden">
      <CardContent className="p-4">
        <div className="relative">
          {/* Stream Preview */}
          <div className="w-full h-48 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-2xl">{stream.hostAvatar || '🐰'}</span>
                </div>
                <h3 className="font-bold text-lg line-clamp-1">{stream.title}</h3>
                <p className="text-sm opacity-90">{stream.hostName}</p>
              </div>
            </div>
            
            {/* Live Badge */}
            <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
              مباشر
            </div>
            
            {/* Viewer Count */}
            <div className="absolute top-3 right-3 bg-black/50 text-white px-2 py-1 rounded-full text-xs flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              {stream.viewerCount || 1}
            </div>
          </div>
          
          {/* Stream Info */}
          <div className="mt-4">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-lg">{stream.hostAvatar || '🐰'}</span>
              </div>
              <div className="mr-3 rtl:ml-3 flex-1">
                <h4 className="font-semibold line-clamp-1">{stream.title}</h4>
                <p className="text-sm text-gray-600">{stream.hostName}</p>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2 rtl:space-x-reverse">
              <Button 
                onClick={handleWatchStream}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm flex-1"
              >
                {stream?.isPublisher ? 'العودة للبث' : 'مشاهدة'}
              </Button>
              
              {stream?.isPublisher && (
                <Button 
                  onClick={handleEndStream}
                  variant="outline"
                  className="px-3 py-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                >
                  إنهاء
                </Button>
              )}
            </div>
            
            {/* Engagement Stats */}
            <div className="flex items-center space-x-4 rtl:space-x-reverse text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Heart className="w-4 h-4" />
                <span>{stream?.likes || Math.floor(Math.random() * 50) + 10}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4" />
                <span>{stream?.comments || Math.floor(Math.random() * 30) + 5}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}