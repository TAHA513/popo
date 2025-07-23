import React from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';

interface InfiniteScrollEndProps {
  hasContent?: boolean;
  message?: string;
}

export default function InfiniteScrollEnd({ 
  hasContent = true, 
  message = "تم عرض جميع المنشورات المتاحة" 
}: InfiniteScrollEndProps) {
  if (!hasContent) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow mx-4 my-6">
        <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">لا توجد منشورات حالياً</h3>
        <p className="text-gray-500">تحقق مرة أخرى قريباً للاطلاع على المحتوى الجديد</p>
      </div>
    );
  }

  return (
    <div className="text-center py-8 mx-4">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <span className="text-sm font-medium text-gray-700">{message}</span>
      </div>
      <p className="text-xs text-gray-500 mt-2">يمكنك العودة للأعلى أو استكشاف أقسام أخرى</p>
    </div>
  );
}