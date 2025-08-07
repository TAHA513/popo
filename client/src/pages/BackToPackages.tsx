import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function BackToPackages() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation('/point-packages');
  }, [setLocation]);

  return null;
}