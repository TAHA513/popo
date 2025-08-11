import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

export function AppShortcut() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    const url = window.location.href;
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // إخفاء الزر إذا كان التطبيق مفتوح كـ standalone (من الشاشة الرئيسية)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return null;
  }

  return (
    <button
      onClick={handleCopyLink}
      className="relative flex items-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-all duration-200 border border-white/30 hover:border-white/50 shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95"
      title="نسخ رابط LaaBoBo"
    >
      {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
      <div className="text-right">
        <div className="text-sm font-bold leading-tight">
          {copied ? "تم النسخ!" : "نسخ الرابط"}
        </div>
        <div className="text-xs opacity-90 leading-tight">
          {copied ? "احفظه أو شاركه" : "للحفظ والمشاركة"}
        </div>
      </div>
      {!copied && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full animate-pulse flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      )}
    </button>
  );
}