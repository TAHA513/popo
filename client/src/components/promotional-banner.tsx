import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

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
      icon: null
    },
    {
      id: 2,
      title: "💎 أرسل هدايا حصرية",
      description: "اشترِ الألبومات الخاصة وأرسل هدايا مميزة",
      action: "استكشف الهدايا",
      gradient: "from-pink-500 via-red-500 to-orange-500",
      icon: null
    },
    {
      id: 3,
      title: "👑 كن عضواً VIP",
      description: "احصل على مميزات حصرية وشارات خاصة",
      action: "ترقية حسابك",
      gradient: "from-yellow-500 via-orange-500 to-red-500",
      icon: null
    },
    {
      id: 4,
      title: "💝 اربح من ألبوماتك",
      description: "حول صورك الخاصة إلى مصدر دخل مع نظام الأرباح",
      action: "ابدأ الربح",
      gradient: "from-green-500 via-teal-500 to-blue-500",
      icon: null
    }
  ];

  const currentBannerData = banners[currentBanner];

  const goToPrevious = () => {
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentBanner((prev) => (prev + 1) % banners.length);
  };

  if (!isVisible) return null;

  return (
    <div className="w-full mb-3 relative">
      <Card className={`overflow-hidden border-0 shadow-md bg-gradient-to-r ${currentBannerData.gradient} text-white relative`}>
        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-1 left-1 z-10 text-white hover:bg-white/20 p-1"
          onClick={() => setIsVisible(false)}
        >
          <X className="w-3 h-3" />
        </Button>

        {/* Navigation Arrows */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-1/2 transform -translate-y-1/2 right-1 z-10 text-white hover:bg-white/20 p-1"
          onClick={goToPrevious}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="absolute top-1/2 transform -translate-y-1/2 left-6 z-10 text-white hover:bg-white/20 p-1"
          onClick={goToNext}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Banner Content */}
        <div className="p-3 px-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-bold mb-1">
                {currentBannerData.title}
              </h3>
              <p className="text-white/90 text-xs">
                {currentBannerData.description}
              </p>
            </div>
            
            <Button 
              className="bg-white text-gray-800 hover:bg-gray-100 font-semibold px-3 py-1 text-xs ml-3"
              onClick={() => {
                console.log(`Banner action clicked: ${currentBannerData.action}`);
              }}
            >
              {currentBannerData.action}
            </Button>
          </div>
        </div>

        {/* Banner Navigation Dots */}
        <div className="absolute bottom-1 right-1/2 transform translate-x-1/2 flex gap-1">
          {banners.map((_, index) => (
            <button
              key={index}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                index === currentBanner ? 'bg-white' : 'bg-white/50'
              }`}
              onClick={() => setCurrentBanner(index)}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}