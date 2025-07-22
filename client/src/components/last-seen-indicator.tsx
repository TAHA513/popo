import { OnlineStatus } from "./online-status";

interface LastSeenIndicatorProps {
  userId: string;
  showInProfile?: boolean;
  className?: string;
}

export function LastSeenIndicator({ userId, showInProfile = false, className = "" }: LastSeenIndicatorProps) {
  if (showInProfile) {
    return (
      <div className={`flex items-center space-x-2 rtl:space-x-reverse ${className}`}>
        <OnlineStatus userId={userId} showText={false} className="w-3 h-3" />
        <OnlineStatus userId={userId} className="text-sm text-gray-600" />
      </div>
    );
  }

  return <OnlineStatus userId={userId} className={className} />;
}