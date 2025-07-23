import { Badge } from "@/components/ui/badge";

interface SupporterBadgeProps {
  level: number;
  totalGiftsSent?: number;
  className?: string;
  showText?: boolean;
}

export interface SupporterLevelConfig {
  level: number;
  name: string;
  nameAr: string;
  emoji: string;
  color: string;
  bgColor: string;
  minGifts: number;
  borderColor: string;
}

export const SUPPORTER_LEVELS: SupporterLevelConfig[] = [
  { level: 0, name: "New User", nameAr: "مستخدم جديد", emoji: "👤", color: "text-gray-600", bgColor: "bg-gray-100", borderColor: "border-gray-300", minGifts: 0 },
  { level: 1, name: "Fan", nameAr: "معجب", emoji: "❤️", color: "text-pink-600", bgColor: "bg-pink-100", borderColor: "border-pink-300", minGifts: 100 },
  { level: 2, name: "Super Fan", nameAr: "معجب كبير", emoji: "💖", color: "text-red-600", bgColor: "bg-red-100", borderColor: "border-red-300", minGifts: 500 },
  { level: 3, name: "Supporter", nameAr: "داعم", emoji: "🌟", color: "text-yellow-600", bgColor: "bg-yellow-100", borderColor: "border-yellow-300", minGifts: 1000 },
  { level: 4, name: "VIP Supporter", nameAr: "داعم مميز", emoji: "⭐", color: "text-orange-600", bgColor: "bg-orange-100", borderColor: "border-orange-300", minGifts: 2500 },
  { level: 5, name: "Elite Supporter", nameAr: "داعم نخبة", emoji: "💎", color: "text-blue-600", bgColor: "bg-blue-100", borderColor: "border-blue-300", minGifts: 5000 },
  { level: 6, name: "Diamond Supporter", nameAr: "داعم ألماسي", emoji: "💠", color: "text-cyan-600", bgColor: "bg-cyan-100", borderColor: "border-cyan-300", minGifts: 10000 },
  { level: 7, name: "Platinum Supporter", nameAr: "داعم بلاتيني", emoji: "🔷", color: "text-indigo-600", bgColor: "bg-indigo-100", borderColor: "border-indigo-300", minGifts: 20000 },
  { level: 8, name: "Royal Supporter", nameAr: "داعم ملكي", emoji: "👑", color: "text-purple-600", bgColor: "bg-purple-100", borderColor: "border-purple-300", minGifts: 50000 },
  { level: 9, name: "Legendary Supporter", nameAr: "داعم أسطوري", emoji: "🏆", color: "text-amber-600", bgColor: "bg-amber-100", borderColor: "border-amber-300", minGifts: 100000 },
  { level: 10, name: "Ultimate Supporter", nameAr: "داعم مطلق", emoji: "🌈", color: "text-gradient", bgColor: "bg-gradient-to-r from-pink-100 to-purple-100", borderColor: "border-gradient", minGifts: 250000 },
];

export function getSupporterLevel(totalGiftsSent: number): SupporterLevelConfig {
  for (let i = SUPPORTER_LEVELS.length - 1; i >= 0; i--) {
    if (totalGiftsSent >= SUPPORTER_LEVELS[i].minGifts) {
      return SUPPORTER_LEVELS[i];
    }
  }
  return SUPPORTER_LEVELS[0];
}

export function SupporterBadge({ level, totalGiftsSent = 0, className = "", showText = true }: SupporterBadgeProps) {
  const supporterConfig = getSupporterLevel(totalGiftsSent);
  const isArabic = document.documentElement.lang === 'ar';
  
  if (level === 0 && totalGiftsSent < 100) {
    return null; // Don't show badge for new users
  }

  return (
    <Badge 
      className={`
        ${supporterConfig.bgColor} 
        ${supporterConfig.color} 
        ${supporterConfig.borderColor}
        border-2 font-bold text-xs px-2 py-1 
        ${supporterConfig.level === 10 ? 'animate-pulse shadow-lg' : ''}
        ${className}
      `}
      style={{
        background: supporterConfig.level === 10 
          ? 'linear-gradient(45deg, #ec4899, #8b5cf6, #06b6d4)' 
          : undefined,
        color: supporterConfig.level === 10 ? 'white' : undefined
      }}
    >
      <span className="mr-1">{supporterConfig.emoji}</span>
      {showText && (
        <span className="font-semibold">
          {isArabic ? supporterConfig.nameAr : supporterConfig.name}
          {supporterConfig.level > 0 && ` ${supporterConfig.level}`}
        </span>
      )}
    </Badge>
  );
}

export default SupporterBadge;