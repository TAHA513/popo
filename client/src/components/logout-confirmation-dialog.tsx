import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogoutConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function LogoutConfirmationDialog({ 
  open, 
  onOpenChange, 
  onConfirm 
}: LogoutConfirmationDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]" 
         onClick={() => onOpenChange(false)}>
      <div className="bg-gradient-to-br from-purple-900/95 to-pink-900/95 backdrop-blur-md rounded-2xl p-6 border border-white/20 max-w-sm w-full mx-4 shadow-2xl text-white"
           onClick={(e) => e.stopPropagation()}>
        
        {/* LaaBoBo Logo */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">L</span>
          </div>
        </div>
        
        {/* Title */}
        <h2 className="text-white text-xl font-bold text-center mb-2">
          LaaBoBo
        </h2>
        
        {/* Description */}
        <p className="text-white/80 text-base text-center mb-6">
          هل تريد تسجيل الخروج من LaaBoBo؟
        </p>
        
        {/* Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={() => onOpenChange(false)}
            className="flex-1 bg-white/10 text-white border-white/30 hover:bg-white/20"
            variant="outline"
          >
            إلغاء
          </Button>
          <Button 
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white border-0"
          >
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </div>
    </div>
  );
}