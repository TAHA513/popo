import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface RealTimeTimestampProps {
  timestamp: string | Date;
  className?: string;
  prefix?: string;
}

export function RealTimeTimestamp({ timestamp, className = "", prefix = "" }: RealTimeTimestampProps) {
  const [timeAgo, setTimeAgo] = useState("");

  useEffect(() => {
    const updateTimeAgo = () => {
      try {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        let timeText = "";
        if (diffInMinutes < 1) {
          timeText = "منذ لحظات";
        } else if (diffInMinutes < 60) {
          timeText = `منذ ${diffInMinutes} دقيقة`;
        } else if (diffInMinutes < 1440) {
          const hours = Math.floor(diffInMinutes / 60);
          timeText = `منذ ${hours} ساعة`;
        } else if (diffInMinutes < 10080) { // 7 days
          const days = Math.floor(diffInMinutes / 1440);
          timeText = `منذ ${days} يوم`;
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
        setTimeAgo("تاريخ غير صحيح");
      }
    };

    updateTimeAgo();
    
    // Update every minute for recent posts
    const interval = setInterval(updateTimeAgo, 60000);
    
    return () => clearInterval(interval);
  }, [timestamp, prefix]);

  return <span className={className}>{timeAgo}</span>;
}