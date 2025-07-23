import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';

interface SPANavigationProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

// مكون للتنقل السلس بدون إعادة تحميل الصفحة
export function SPANavigation({ href, children, className, onClick }: SPANavigationProps) {
  const [, setLocation] = useLocation();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) onClick();
    setLocation(href);
  };

  return (
    <Button 
      onClick={handleClick}
      className={className}
    >
      {children}
    </Button>
  );
}

// خطاف للتنقل السلس
export function useSPANavigation() {
  const [, setLocation] = useLocation();

  const navigate = (path: string) => {
    setLocation(path);
  };

  const navigateWithReplace = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.replaceState(null, '', path);
      setLocation(path);
    }
  };

  return { navigate, navigateWithReplace };
}

export default SPANavigation;