import { Button } from "@/components/ui/button";
import { Search, Bell, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function MobileHeader() {
  const { user } = useAuth();

  return (
    <header className="laa-gradient-bg safe-top">
      <div className="px-4 py-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">LaaBoBo Live</h1>
              <p className="text-white/80 text-sm">مرحباً {user?.firstName || 'بك'}!</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 touch-target"
            >
              <Bell className="w-5 h-5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 touch-target"
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* User Points Display */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">نقاطك</p>
              <p className="text-white font-bold text-lg">{user?.points || 0}</p>
            </div>
            <div className="text-white">
              💎
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}