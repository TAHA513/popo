import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Gamepad2, ArrowLeft, Play } from "lucide-react";
import { useLocation } from "wouter";
import RealReclaimCity from "@/components/games/RealReclaimCity";

export default function GamingHall() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [gameStarted, setGameStarted] = useState(false);

  if (gameStarted) {
    return <RealReclaimCity onGameEnd={() => setGameStarted(false)} isMultiplayer={false} playerCount={1} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <Button 
              onClick={() => setLocation('/')}
              variant="ghost"
              className="flex items-center space-x-2 space-x-reverse"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>العودة</span>
            </Button>
            
            <div className="text-center">
              <h1 className="text-xl font-bold text-purple-600">🎮 صالة الألعاب</h1>
            </div>
            
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Main Game Card */}
        <div className="bg-white rounded-2xl p-6 border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all duration-300">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🏙️</div>
            <h2 className="text-2xl font-bold text-purple-600 mb-2">استعادة المدينة</h2>
            <p className="text-gray-600 mb-4">لعبة إستراتيجية تعاونية ضد الذكاء الاصطناعي</p>
            
            <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full inline-block mb-4 font-medium">
              ✨ متاح الآن - مجاني بالكامل!
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-bold text-purple-600 mb-2">🎯 هدف اللعبة:</h3>
              <p className="text-sm text-gray-700">حرر المدينة من سيطرة الذكاء الاصطناعي خلال 5 دقائق</p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-bold text-blue-600 mb-2">🎮 كيفية اللعب:</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• استخدم WASD أو الأسهم للحركة</li>
                <li>• اضغط المسطرة أو انقر بالماوس للرماية</li>
                <li>• دمر الأعداء واحتل المناطق</li>
                <li>• احذر من صحتك ووقتك</li>
              </ul>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4">
              <h3 className="font-bold text-red-600 mb-2">⚡ مميزات اللعبة:</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• محرك Phaser.js للرسوم التفاعلية</li>
                <li>• أعداء ذكيين مع ذكاء اصطناعي</li>
                <li>• مؤثرات بصرية وصوتية</li>
                <li>• نظام نقاط ومكافآت</li>
              </ul>
            </div>
          </div>

          <Button
            onClick={() => setGameStarted(true)}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-4 text-lg font-bold rounded-xl"
          >
            <div className="flex items-center justify-center space-x-3 space-x-reverse">
              <Play className="w-6 h-6" />
              <span>🚀 بدء المعركة الحقيقية!</span>
            </div>
          </Button>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">اللعبة تستخدم محرك Phaser.js للحصول على تجربة ألعاب حقيقية</p>
          </div>
        </div>

        {/* Coming Soon Games */}
        <div className="mt-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">ألعاب قادمة قريباً</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "سباق الحيوانات", emoji: "🏃‍♂️" },
              { name: "البحث عن الكنز", emoji: "🗺️" },
              { name: "معركة الحدائق", emoji: "⚔️" },
              { name: "تحدي المعرفة", emoji: "🧠" }
            ].map((game, index) => (
              <div key={index} className="bg-gray-100 rounded-lg p-4 text-center opacity-60">
                <div className="text-3xl mb-2">{game.emoji}</div>
                <h4 className="text-sm font-medium text-gray-600">{game.name}</h4>
                <p className="text-xs text-gray-500 mt-1">قريباً</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}