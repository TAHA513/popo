import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Key, Check, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function MFAStatus() {
  const { data: mfaStatus, isLoading } = useQuery({
    queryKey: ['/api/mfa/status'],
    queryFn: async () => {
      const response = await fetch('/api/mfa/status');
      if (!response.ok) throw new Error('Failed to fetch MFA status');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin" />
        <span className="text-sm text-gray-500">جاري فحص الحالة...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-full ${mfaStatus?.mfaEnabled ? 'bg-green-100 dark:bg-green-900' : 'bg-yellow-100 dark:bg-yellow-900'}`}>
        <Shield className={`w-4 h-4 ${mfaStatus?.mfaEnabled ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">التحقق بخطوتين</span>
          <Badge variant={mfaStatus?.mfaEnabled ? "default" : "secondary"} className="text-xs">
            {mfaStatus?.mfaEnabled ? (
              <><Check className="w-3 h-3 mr-1" /> مفعل</>
            ) : (
              <><X className="w-3 h-3 mr-1" /> غير مفعل</>
            )}
          </Badge>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {mfaStatus?.mfaEnabled 
            ? "حسابك محمي بالتحقق بخطوتين" 
            : "احم حسابك بطبقة أمان إضافية"
          }
        </p>
      </div>
      {!mfaStatus?.mfaEnabled && (
        <Button 
          size="sm" 
          onClick={() => window.location.href = '/mfa-setup'}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <Key className="w-4 h-4 mr-1" />
          تفعيل الآن
        </Button>
      )}
    </div>
  );
}