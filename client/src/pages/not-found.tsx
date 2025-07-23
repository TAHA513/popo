import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  // إخفاء صفحة 404 والتوجيه إلى الصفحة الرئيسية
  if (typeof window !== 'undefined') {
    window.location.replace('/');
  }
  
  return null;
}
