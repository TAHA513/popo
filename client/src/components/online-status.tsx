import { useQuery } from "@tanstack/react-query";

interface OnlineStatusProps {
  userId: string;
  showText?: boolean;
  className?: string;
}

export function OnlineStatus({ userId, showText = true, className = "" }: OnlineStatusProps) {
  const { data: userStatus } = useQuery({
    queryKey: ['/api/users', userId, 'status'],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/status`, {
        credentials: 'include'
      });
      if (!response.ok) return null;
      return response.json();
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  if (!userStatus) {
    return showText ? (
      <span className={`text-sm text-gray-500 ${className}`}>جاري التحقق...</span>
    ) : (
      <div className={`w-3 h-3 bg-gray-400 rounded-full ${className}`}></div>
    );
  }

  if (userStatus.isOnline) {
    return showText ? (
      <div className={`flex items-center text-sm text-green-600 ${className}`}>
        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
        متصل الآن
      </div>
    ) : (
      <div className={`w-3 h-3 bg-green-500 rounded-full animate-pulse ${className}`}></div>
    );
  }

  if (!userStatus.showLastSeen) {
    return showText ? (
      <span className={`text-sm text-gray-500 ${className}`}>غير متاح</span>
    ) : (
      <div className={`w-3 h-3 bg-gray-400 rounded-full ${className}`}></div>
    );
  }

  const lastSeen = new Date(userStatus.lastSeenAt);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));

  let lastSeenText = "";
  let statusColor = "gray";

  if (diffInMinutes < 1) {
    lastSeenText = "نشط منذ لحظات";
    statusColor = "yellow";
  } else if (diffInMinutes < 5) {
    lastSeenText = `نشط منذ ${diffInMinutes} دقائق`;
    statusColor = "yellow";
  } else if (diffInMinutes < 60) {
    lastSeenText = `نشط منذ ${diffInMinutes} دقيقة`;
    statusColor = "orange";
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    lastSeenText = `نشط منذ ${hours} ساعة`;
    statusColor = "orange";
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    lastSeenText = `نشط منذ ${days} يوم`;
    statusColor = "gray";
  }

  const statusColors = {
    yellow: "bg-yellow-500",
    orange: "bg-orange-500", 
    gray: "bg-gray-400"
  };

  return showText ? (
    <div className={`flex items-center text-sm text-gray-600 ${className}`}>
      <div className={`w-2 h-2 ${statusColors[statusColor as keyof typeof statusColors]} rounded-full mr-2`}></div>
      {lastSeenText}
    </div>
  ) : (
    <div className={`w-3 h-3 ${statusColors[statusColor as keyof typeof statusColors]} rounded-full ${className}`}></div>
  );
}