import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Star, Gift, Crown, Heart, Sparkles } from "lucide-react";

export default function PromotionalBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [currentBanner, setCurrentBanner] = useState(0);

  const banners = [
    {
      id: 1,
      title: "🌟 انضم لمجتمع LaaBoBo الآن!",
      description: "اكتشف عالماً مليئاً بالألبومات الخاصة والهدايا المميزة",
      action: "ابدأ الآن",
      gradient: "from-purple-500 via-pink-500 to-blue-500",
      icon: <Star className="w-6 h-6" />
    },
    {
      id: 2,
      title: "💎 أرسل هدايا حصرية",
      description: "اشترِ الألبومات الخاصة وأرسل هدايا مميزة لأصدقائك",
      action: "استكشف الهدايا",
      gradient: "from-pink-500 via-red-500 to-orange-500",
      icon: <Gift className="w-6 h-6" />
    },
    {
      id: 3,
      title: "👑 كن عضواً VIP",
      description: "احصل على مميزات حصرية وشارات خاصة في المنصة",
      action: "ترقية حسابك",
      gradient: "from-yellow-500 via-orange-500 to-red-500",
      icon: <Crown className="w-6 h-6" />
    },
    {
      id: 4,
      title: "💝 اربح من ألبوماتك",
      description: "حول صورك الخاصة إلى مصدر دخل مع نظام الأرباح 40%",
      action: "ابدأ الربح",
      gradient: "from-green-500 via-teal-500 to-blue-500",
      icon: <Heart className="w-6 h-6" />
    }
  ];

  const currentBannerData = banners[currentBanner];

  // Auto-rotate banner every 5 seconds
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isVisible, banners.length]);

  if (!isVisible) return null;

  return (
    <div className="w-full mb-6 relative">
      <Card className={`overflow-hidden border-0 shadow-xl bg-gradient-to-r ${currentBannerData.gradient} text-white relative`}>
        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 left-2 z-10 text-white hover:bg-white/20 p-1"
          onClick={() => setIsVisible(false)}
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Banner Content */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
              {currentBannerData.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold mb-1">
                {currentBannerData.title}
              </h3>
              <p className="text-white/90 text-sm">
                {currentBannerData.description}
              </p>
            </div>
          </div>
          
          <Button 
            className="bg-white text-gray-800 hover:bg-gray-100 font-semibold px-6"
            onClick={() => {
              // Add action logic here
              console.log(`Banner action clicked: ${currentBannerData.action}`);
            }}
          >
            {currentBannerData.action}
          </Button>
        </div>

        {/* Banner Navigation Dots */}
        <div className="absolute bottom-2 right-1/2 transform translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentBanner ? 'bg-white' : 'bg-white/50'
              }`}
              onClick={() => setCurrentBanner(index)}
            />
          ))}
        </div>

        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-white/5 rounded-full animate-pulse delay-1000"></div>
          <Sparkles className="absolute top-1/2 right-8 w-6 h-6 text-white/30 animate-bounce" />
        </div>
      </Card>


    </div>
  );
}