import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";

const GAMES = [
  {
    id: 1,
    name: "حرب الذكاء الاصطناعي",
    emoji: "🤖",
    description: "لعبة حرب ثلاثية الأبعاد مع محرك فيزياء حقيقي وذكاء اصطناعي متطور",
    color: "from-red-600 to-orange-600",
    route: "/games/war-fixed"
  }
];

export default function GamesPage() {
  const [, setLocation] = useLocation();

  const handleGameClick = (game: any) => {
    if (game.route) {
      setLocation(game.route);
    } else {
      alert(`🎮 قريباً: ${game.name}!\n\nسيتم إضافة هذه اللعبة في التحديث القادم.`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="p-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="text-2xl animate-bounce">🎮</div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                صالة الألعاب
              </h1>
            </div>
            
            {/* Create Memory Button */}
            <Button 
              onClick={() => setLocation('/create-memory')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 rtl:space-x-reverse shadow-lg"
            >
              <span className="text-2xl">+</span>
              <span className="text-sm font-bold">إنشاء ذكرى</span>
            </Button>
          </div>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 opacity-60"></div>
      </div>

      {/* Games Grid */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {GAMES.map((game) => (
            <Card 
              key={game.id} 
              className="hover:shadow-lg transition-all duration-300 cursor-pointer group hover:scale-105"
              onClick={() => handleGameClick(game)}
            >
              <CardHeader className="pb-3">
                <div className={`w-16 h-16 bg-gradient-to-br ${game.color} rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-lg`}>
                  <span className="text-3xl">{game.emoji}</span>
                </div>
                <CardTitle className="text-center text-lg font-bold text-gray-800">
                  {game.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-center text-gray-600 text-sm mb-4">
                  {game.description}
                </p>
                <Button 
                  className={`w-full bg-gradient-to-r ${game.color} hover:shadow-lg text-white font-bold py-2 rounded-xl transition-all duration-300`}
                >
                  العب الآن
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Game Description */}
        <div className="mt-8 text-center">
          <div className="bg-gradient-to-br from-red-900/20 to-orange-900/20 rounded-2xl p-6 shadow-lg border border-red-500/30">
            <div className="text-4xl mb-3">⚔️</div>
            <h3 className="text-xl font-bold text-red-600 mb-2">
              المعركة الأخيرة للبشرية
            </h3>
            <p className="text-gray-700 leading-relaxed">
              في عام 2030، استولى الذكاء الاصطناعي على الأرض. أنت جزء من المقاومة البشرية الأخيرة. 
              مهمتك: استعادة السيطرة على المدينة من قوات الذكاء الاصطناعي المعادية.
              <br/><br/>
              <span className="font-bold text-red-600">هل ستتمكن من إنقاذ البشرية؟</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}