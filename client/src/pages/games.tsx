import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Users, GamepadIcon, ArrowLeft, Trophy, Zap, Crown } from "lucide-react";
import { useLocation } from "wouter";
import CharacterSelector from "@/components/CharacterSelector";

export default function Games() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showCharacters, setShowCharacters] = useState(false);
  const [activeSection, setActiveSection] = useState('characters');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <Button 
              onClick={() => setLocation('/explore')}
              variant="ghost"
              className="flex items-center space-x-2 space-x-reverse"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>العودة للاستكشاف</span>
            </Button>
            
            <div className="text-center">
              <h1 className="text-xl font-bold text-purple-600">🎮 منطقة الألعاب</h1>
            </div>
            
            <div className="w-32"></div>
          </div>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 opacity-60"></div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className="flex bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
          <Button 
            onClick={() => setActiveSection('characters')}
            variant={activeSection === 'characters' ? 'default' : 'ghost'}
            className={`flex-1 rounded-none ${
              activeSection === 'characters' 
                ? 'bg-purple-500 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="w-4 h-4 ml-2" />
            الشخصيات
          </Button>
          
          <Button 
            onClick={() => setActiveSection('multiplayer')}
            variant={activeSection === 'multiplayer' ? 'default' : 'ghost'}
            className={`flex-1 rounded-none ${
              activeSection === 'multiplayer' 
                ? 'bg-purple-500 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <GamepadIcon className="w-4 h-4 ml-2" />
            الألعاب الجماعية
          </Button>
          
          <Button 
            onClick={() => setActiveSection('rankings')}
            variant={activeSection === 'rankings' ? 'default' : 'ghost'}
            className={`flex-1 rounded-none ${
              activeSection === 'rankings' 
                ? 'bg-purple-500 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Trophy className="w-4 h-4 ml-2" />
            التصنيفات
          </Button>
        </div>

        {/* Content Sections */}
        {activeSection === 'characters' && (
          <div>
            <CharacterSelector />
          </div>
        )}

        {activeSection === 'multiplayer' && (
          <div className="space-y-6">
            {/* Game Rooms */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <GamepadIcon className="w-6 h-6 ml-2 text-purple-500" />
                الألعاب المتاحة
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 1, name: "لعبة الذاكرة", players: "2-4 لاعبين", emoji: "🧠", difficulty: "سهل" },
                  { id: 2, name: "سباق الألغاز", players: "2-6 لاعبين", emoji: "🧩", difficulty: "متوسط" },
                  { id: 3, name: "مغامرة السرعة", players: "2-8 لاعبين", emoji: "⚡", difficulty: "صعب" },
                  { id: 4, name: "البحث عن الكنز", players: "4-10 لاعبين", emoji: "🏴‍☠️", difficulty: "متوسط" },
                ].map((game) => (
                  <div key={game.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <span className="text-3xl">{game.emoji}</span>
                        <div>
                          <h3 className="font-bold text-gray-800">{game.name}</h3>
                          <p className="text-sm text-gray-600">{game.players}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        game.difficulty === 'سهل' ? 'bg-green-100 text-green-800' :
                        game.difficulty === 'متوسط' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {game.difficulty}
                      </span>
                    </div>
                    
                    <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white">
                      انضم للعبة
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Voice Chat Info */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl p-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">🎤 المحادثة الصوتية</h2>
                <p className="text-lg opacity-90 mb-4">
                  تحدث مع فريقك أثناء اللعب واستمتع بتجربة أكثر تفاعلية
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <div className="text-2xl mb-2">🗣️</div>
                    <h3 className="font-bold mb-1">صوت واضح</h3>
                    <p>جودة صوت عالية للتواصل</p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <div className="text-2xl mb-2">🤝</div>
                    <h3 className="font-bold mb-1">عمل جماعي</h3>
                    <p>تنسيق أفضل مع الفريق</p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <div className="text-2xl mb-2">🎮</div>
                    <h3 className="font-bold mb-1">متعة أكبر</h3>
                    <p>تجربة لعب اجتماعية</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'rankings' && (
          <div className="space-y-6">
            {/* Top Players */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Trophy className="w-6 h-6 ml-2 text-yellow-500" />
                أفضل اللاعبين
              </h2>
              
              <div className="space-y-3">
                {[
                  { rank: 1, name: "محمد الصقر", points: 2850, badge: "👑", level: "أسطوري" },
                  { rank: 2, name: "فاطمة النجمة", points: 2420, badge: "🥈", level: "محترف" },
                  { rank: 3, name: "أحمد البطل", points: 2180, badge: "🥉", level: "محترف" },
                  { rank: 4, name: "نور القمر", points: 1950, badge: "⭐", level: "متقدم" },
                  { rank: 5, name: "خالد السريع", points: 1720, badge: "💫", level: "متقدم" },
                ].map((player) => (
                  <div key={player.rank} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <span className="text-2xl font-bold text-purple-600">#{player.rank}</span>
                      <span className="text-2xl">{player.badge}</span>
                      <div>
                        <h3 className="font-bold text-gray-800">{player.name}</h3>
                        <p className="text-sm text-gray-600">{player.level}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-purple-600">{player.points}</div>
                      <div className="text-xs text-gray-500">نقطة</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* User Stats */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">📊 إحصائياتك</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{user?.points || 0}</div>
                  <div className="text-sm opacity-80">النقاط</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">127</div>
                  <div className="text-sm opacity-80">الترتيب</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">24</div>
                  <div className="text-sm opacity-80">المباريات</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">18</div>
                  <div className="text-sm opacity-80">الانتصارات</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}