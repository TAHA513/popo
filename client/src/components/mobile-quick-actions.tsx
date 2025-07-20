import { Button } from "@/components/ui/button";
import { Plus, Users, Gift, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function MobileQuickActions() {
  return (
    <div className="px-4 pb-4">
      <div className="grid grid-cols-2 gap-3">
        <Link href="/start-stream">
          <Button className="mobile-button bg-laa-pink text-white hover:bg-laa-pink/90 w-full">
            <Plus className="w-4 h-4 mr-2" />
            بدء البث
          </Button>
        </Link>
        
        <Button
          variant="outline"
          className="mobile-button border-laa-pink text-laa-pink hover:bg-laa-pink/10 w-full"
        >
          <Users className="w-4 h-4 mr-2" />
          المتابعون
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mt-3">
        <Button
          variant="outline"
          className="mobile-button border-laa-purple text-laa-purple hover:bg-laa-purple/10 w-full"
        >
          <Gift className="w-4 h-4 mr-2" />
          الهدايا
        </Button>
        
        <Button
          variant="outline"
          className="mobile-button border-laa-blue text-laa-blue hover:bg-laa-blue/10 w-full"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          الإحصائيات
        </Button>
      </div>
    </div>
  );
}