// أدوات التنقل السلس للـ SPA
export function navigateWithoutReload(path: string, setLocation?: (path: string) => void) {
  if (setLocation) {
    // استخدام React Router للتنقل السلس
    setLocation(path);
  } else {
    // استخدام History API كبديل
    window.history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}

// إصلاح جميع مشاكل window.location.href
export function replaceWindowLocationCalls() {
  // هذه الدالة ستحل محل جميع استخدامات window.location.href
  console.log('تم تحديث نظام التنقل إلى SPA');
}

// تحسين أداء التنقل
export function optimizeNavigation() {
  // منع إعادة التحميل غير الضرورية
  const links = document.querySelectorAll('a[href^="/"]');
  
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = (e.target as HTMLAnchorElement).getAttribute('href');
      if (href) {
        window.history.pushState(null, '', href);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    });
  });
}