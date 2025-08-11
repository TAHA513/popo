import { Download } from 'lucide-react';

export function AppShortcut() {
  const handleAddToHomeScreen = () => {
    const userAgent = navigator.userAgent;
    const isAndroid = /Android/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/i.test(userAgent);
    const isChrome = /Chrome/i.test(userAgent);
    const isSafari = /Safari/i.test(userAgent) && !isChrome;
    
    let message = '';
    
    if (isIOS && isSafari) {
      message = `📱 إضافة اختصار LaaBoBo للشاشة الرئيسية:

⚠️ ملاحظة: لا يمكن تثبيت تطبيق حقيقي، لكن يمكنك إضافة اختصار:

1️⃣ اضغط زر المشاركة ⬆️ (أسفل الشاشة)
2️⃣ اختر "إضافة إلى الشاشة الرئيسية"  
3️⃣ اضغط "إضافة"

✅ ستجد اختصار LaaBoBo على شاشتك الرئيسية للوصول السريع!`;
    } else if (isAndroid && isChrome) {
      message = `📱 إضافة اختصار LaaBoBo للشاشة الرئيسية:

⚠️ ملاحظة: لا يمكن تثبيت تطبيق حقيقي، لكن يمكنك إضافة اختصار:

1️⃣ اضغط النقاط الثلاث ⋮ (أعلى يمين المتصفح)
2️⃣ اختر "إضافة إلى الشاشة الرئيسية"
3️⃣ اضغط "إضافة"

✅ ستجد اختصار LaaBoBo على شاشتك للوصول السريع!`;
    } else if (isChrome) {
      message = `💻 إضافة اختصار LaaBoBo:

⚠️ ملاحظة: لا يمكن تثبيت تطبيق حقيقي، لكن يمكنك:

1️⃣ احفظ هذا الرابط في المفضلة:
${window.location.href}

2️⃣ أو أنشئ اختصاراً على سطح المكتب

✅ وصول سريع لـ LaaBoBo!`;
    } else {
      message = `🔗 حفظ رابط LaaBoBo:

⚠️ ملاحظة: لا يمكن تثبيت تطبيق حقيقي، لكن يمكنك:

📋 انسخ هذا الرابط:
${window.location.href}

• احفظه في المفضلة
• أرسله لنفسك
• أنشئ اختصاراً

✅ وصول مباشر لـ LaaBoBo!`;
    }
    
    alert(message);
  };

  // إخفاء الزر إذا كان التطبيق مفتوح كـ standalone (من الشاشة الرئيسية)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return null;
  }

  return (
    <button
      onClick={handleAddToHomeScreen}
      className="relative flex items-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-all duration-200 border border-white/30 hover:border-white/50 shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95"
      title="إضافة اختصار للشاشة الرئيسية"
    >
      <Download className="w-6 h-6" />
      <div className="text-right">
        <div className="text-sm font-bold leading-tight">إضافة للشاشة</div>
        <div className="text-xs opacity-90 leading-tight">وصول سريع</div>
      </div>
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-bounce flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full"></div>
      </div>
    </button>
  );
}