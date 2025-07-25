import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useLocation } from "wouter";
import BottomNavigation from "@/components/bottom-navigation";

export default function SimpleExplore() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
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
              onClick={() => setLocation('/create-memory')}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 rtl:space-x-reverse shadow-lg"
            >
              <span className="text-sm font-bold">إنشاء ذكرى</span>
            </Button>
          </div>
        </div>
        {/* Colored Line */}
        <div className="h-0.5 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 opacity-60"></div>
      </div>

      <div className="max-w-sm mx-auto">
        {/* الصفحة فارغة - المحتوى في الصفحة الرئيسية */}
        <div className="p-4">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              صفحة الاستكشاف
            </h3>
            <p className="text-gray-500 mb-4">
              المحتوى متوفر في الصفحة الرئيسية
            </p>
            <Button 
              onClick={() => setLocation('/')}
              className="bg-laa-pink hover:bg-laa-pink/90"
            >
              العودة للصفحة الرئيسية
            </Button>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}