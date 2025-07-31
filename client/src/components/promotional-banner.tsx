import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


export default function PromotionalBanner() {
  const [isVisible, setIsVisible] = useState(true);

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
      description: "اشترِ الألبومات الخاصة وأرسل هدايا مميزة لأصدقائك",
      action: "استكشف الهدايا",
      gradient: "from-pink-500 via-red-500 to-orange-500",
      icon: null
    },
    {
      id: 3,
      title: "👑 كن عضواً VIP",
      description: "احصل على مميزات حصرية وشارات خاصة ووصول أولي",
      action: "ترقية حسابك",
      gradient: "from-yellow-500 via-orange-500 to-red-500",
      icon: null
    },
    {
      id: 4,
      title: "💝 اربح من ألبوماتك",
      description: "حول صورك الخاصة إلى مصدر دخل مع نظام الأرباح 40%",
      action: "ابدأ الربح",
      gradient: "from-green-500 via-teal-500 to-blue-500",
      icon: null
    },
    {
      id: 5,
      title: "🎮 ألعاب تفاعلية ممتعة",
      description: "شارك في ألعاب جماعية واربح نقاط ومكافآت يومية",
      action: "العب الآن",
      gradient: "from-indigo-500 via-purple-500 to-pink-500",
      icon: null
    },
    {
      id: 6,
      title: "📱 دردشات صوتية خاصة",
      description: "أرسل رسائل صوتية خاصة وكون محادثات مميزة",
      action: "ابدأ الدردشة",
      gradient: "from-cyan-500 via-blue-500 to-purple-500",
      icon: null
    },
    {
      id: 7,
      title: "🏆 نظام المكافآت اليومية",
      description: "احصل على نقاط مجانية يومياً وجوائز حصرية",
      action: "اجمع النقاط",
      gradient: "from-orange-500 via-red-500 to-pink-500",
      icon: null
    },
    {
      id: 8,
      title: "🎨 إنشاء ذكريات مبدعة",
      description: "شارك لحظاتك المميزة مع مجتمع LaaBoBo الرائع",
      action: "أنشئ ذكرى",
      gradient: "from-teal-500 via-green-500 to-blue-500",
      icon: null
    }
  ];

  const [currentBanner, setCurrentBanner] = useState(0);

  // Rotate banners every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const currentBannerData = banners[currentBanner];

  if (!isVisible) return null;

  return (
    <div className="w-full mb-3 relative">
      <Card className={`overflow-hidden border-0 shadow-md bg-gradient-to-r ${currentBannerData.gradient} text-white relative`}>




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


      </Card>
    </div>
  );
}