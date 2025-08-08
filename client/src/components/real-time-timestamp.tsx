import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface RealTimeTimestampProps {
  timestamp: string | Date;
  className?: string;
  prefix?: string;
}

export function RealTimeTimestamp({ timestamp, className = "", prefix = "" }: RealTimeTimestampProps) {
  const [timeAgo, setTimeAgo] = useState("");
  const { isRTL } = useLanguage();

  useEffect(() => {
    const updateTimeAgo = () => {
      try {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        let timeText = "";
        if (diffInMinutes < 1) {
          timeText = isRTL ? "منذ لحظات" : "moments ago";
        } else if (diffInMinutes < 60) {
          timeText = isRTL ? `منذ ${diffInMinutes} دقيقة` : `${diffInMinutes} min ago`;
        } else if (diffInMinutes < 1440) {
          const hours = Math.floor(diffInMinutes / 60);
          timeText = isRTL ? `منذ ${hours} ساعة` : `${hours}h ago`;
        } else if (diffInMinutes < 10080) { // 7 days
          const days = Math.floor(diffInMinutes / 1440);
          timeText = isRTL ? `منذ ${days} يوم` : `${days}d ago`;
        } else {
          // For older posts, show actual date in Gregorian calendar
          timeText = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }

        setTimeAgo(prefix + timeText);
      } catch (error) {
        setTimeAgo(isRTL ? "تاريخ غير صحيح" : "Invalid date");
      }
    };

    updateTimeAgo();
    
    // Update every minute for recent posts
    const interval = setInterval(updateTimeAgo, 60000);
    
    return () => clearInterval(interval);
  }, [timestamp, prefix]);

  return <span className={className}>{timeAgo}</span>;
}