import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, 
  Heart, 
  MessageCircle, 
  Share2, 
  Gift, 
  Eye, 
  User
} from "lucide-react";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import BottomNavigation from "@/components/bottom-navigation";

export default function SimpleHome() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  
  const handleLike = (id: string) => {
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="p-4">
          <div className="flex items-center justify-between">
            {/* Logo - Left Side */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="text-2xl animate-bounce">🐰</div>
              <h1 className="text-xl font-bold text-laa-pink">LaaBoBo</h1>
            </div>
            
            {/* Create Memory Button - Right Side */}
            <Button 
              onClick={() => {
                setLocation('/create-memory');
              }}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 rtl:space-x-reverse shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-bold">إنشاء ذكرى</span>
            </Button>
          </div>
        </div>
        {/* Colored Line */}
        <div className="h-0.5 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 opacity-60"></div>
      </div>

      <div className="max-w-md mx-auto">
        {/* محتوى فارغ - تم إزالة نظام البث */}
        <div className="p-4">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🐰</span>
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">مرحباً بك في LaaBoBo!</h3>
            <p className="text-gray-500 text-sm">استكشف الذكريات والمحتوى المميز</p>
            <div className="mt-4 flex flex-col space-y-3">
              <Button 
                onClick={() => setLocation('/explore')}
                className="bg-laa-pink hover:bg-laa-pink/90 text-white"
              >
                استكشف الذكريات
              </Button>
              <div className="flex space-x-2 rtl:space-x-reverse">
                <Button 
                  onClick={() => setLocation('/simple-live')}
                  className="bg-red-500 hover:bg-red-600 text-white flex-1"
                >
                  🔴 بث سريع
                </Button>
                <Button 
                  onClick={() => setLocation('/live-status')}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white flex-1"
                >
                  👁️ البثوث المباشرة
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}