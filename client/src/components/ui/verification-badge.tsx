import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface VerificationBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  badge?: string;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({ 
  className, 
  size = 'md',
  badge = 'LaaBoBo'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6'
  };

  return (
    <div className={cn(
      'relative inline-flex items-center justify-center rounded-full',
      'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700',
      'shadow-lg shadow-blue-500/30',
      'border-2 border-white',
      'transform transition-all duration-200 hover:scale-110',
      sizeClasses[size],
      className
    )}>
      {/* Checkmark SVG */}
      <svg 
        viewBox="0 0 24 24" 
        className="w-3/5 h-3/5 text-white fill-current"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
          className="drop-shadow-sm"
        />
      </svg>
      
      {/* Shine effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/30 to-transparent opacity-50"></div>
      
      {/* Tooltip */}
      <div className={cn(
        'absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2',
        'bg-gray-900 text-white text-xs px-2 py-1 rounded-md',
        'opacity-0 pointer-events-none transition-opacity duration-200',
        'whitespace-nowrap z-50',
        'group-hover:opacity-100'
      )}>
        {badge} موثق ✓
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
};

export default VerificationBadge;