"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, src, ...props }, ref) => {
  // Import the media URL utility only when used
  const getMediaUrl = React.useMemo(() => {
    const getMediaUrlFn = (storedPath: string): string => {
      if (!storedPath) return '';
      
      if (storedPath.startsWith('http')) {
        return storedPath;
      }
      
      const cleanPath = storedPath.replace(/^\/uploads\//, '');
      
      // في بيئة التطوير، استخدم localhost دائماً
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isDevelopment) {
        return `/api/media/${cleanPath}`;
      }
      
      // في الإنتاج، استخدم API base URL إذا كان متوفر
      const API_BASE = import.meta.env.VITE_API_URL || '';
      if (API_BASE) {
        return `${API_BASE}/api/media/${cleanPath}`;
      }
      
      return `/api/media/${cleanPath}`;
    };
    return getMediaUrlFn;
  }, []);

  return (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn("aspect-square h-full w-full", className)}
      src={src ? getMediaUrl(src) : src}
      {...props}
    />
  );
})
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
