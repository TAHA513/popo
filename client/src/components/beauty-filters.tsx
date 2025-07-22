import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import React from 'react';
import { Sparkles, Eye, Zap, Sun, Moon, Heart, Star, Wand2 } from 'lucide-react';

interface BeautyFilter {
  id: string;
  name: string;
  nameAr: string;
  icon: React.ReactNode;
  cssFilter: string;
  intensity: number;
  premium: boolean;
}

interface BeautyFiltersProps {
  isStreaming?: boolean;
  onFilterChange?: (filterId: string, intensity: number) => void;
  language?: 'en' | 'ar';
}

const defaultFilters: BeautyFilter[] = [
  {
    id: 'smooth',
    name: 'Smooth Skin',
    nameAr: 'نعومة البشرة',
    icon: <Sparkles className="w-4 h-4" />,
    cssFilter: 'blur(0.5px) contrast(1.1)',
    intensity: 0,
    premium: false
  },
  {
    id: 'brighten',
    name: 'Brighten',
    nameAr: 'إشراق',
    icon: <Sun className="w-4 h-4" />,
    cssFilter: 'brightness(1.2) contrast(1.05)',
    intensity: 0,
    premium: false
  },
  {
    id: 'eyes',
    name: 'Eye Enhancement',
    nameAr: 'تحسين العيون',
    icon: <Eye className="w-4 h-4" />,
    cssFilter: 'saturate(1.3) contrast(1.1)',
    intensity: 0,
    premium: true
  },
  {
    id: 'glow',
    name: 'Golden Glow',
    nameAr: 'توهج ذهبي',
    icon: <Star className="w-4 h-4" />,
    cssFilter: 'sepia(0.2) saturate(1.2) brightness(1.1)',
    intensity: 0,
    premium: true
  },
  {
    id: 'soft',
    name: 'Soft Focus',
    nameAr: 'تركيز ناعم',
    icon: <Moon className="w-4 h-4" />,
    cssFilter: 'blur(0.3px) opacity(0.95)',
    intensity: 0,
    premium: false
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    nameAr: 'حيوي',
    icon: <Zap className="w-4 h-4" />,
    cssFilter: 'saturate(1.4) contrast(1.15)',
    intensity: 0,
    premium: true
  },
  {
    id: 'romantic',
    name: 'Romantic Pink',
    nameAr: 'وردي رومانسي',
    icon: <Heart className="w-4 h-4" />,
    cssFilter: 'hue-rotate(350deg) saturate(1.1)',
    intensity: 0,
    premium: true
  },
  {
    id: 'magic',
    name: 'Magic Touch',
    nameAr: 'لمسة سحرية',
    icon: <Wand2 className="w-4 h-4" />,
    cssFilter: 'contrast(1.2) brightness(1.1) saturate(1.2) blur(0.2px)',
    intensity: 0,
    premium: true
  }
];

export default function BeautyFilters({ 
  isStreaming = false, 
  onFilterChange,
  language = 'en' 
}: BeautyFiltersProps) {
  const [filters, setFilters] = useState<BeautyFilter[]>(defaultFilters);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isRTL = language === 'ar';

  // Apply filters to video stream
  useEffect(() => {
    if (videoRef.current && isStreaming) {
      const activeFilters = filters.filter(f => f.intensity > 0);
      if (activeFilters.length > 0) {
        const combinedFilter = activeFilters
          .map(f => `${f.cssFilter.replace(/[\d.]+/g, (match) => 
            (parseFloat(match) * (f.intensity / 100) + 1).toString()
          )}`)
          .join(' ');
        
        videoRef.current.style.filter = combinedFilter;
      } else {
        videoRef.current.style.filter = 'none';
      }
    }
  }, [filters, isStreaming]);

  const handleFilterIntensity = (filterId: string, intensity: number[]) => {
    const newIntensity = intensity[0];
    setFilters(prev => prev.map(f => 
      f.id === filterId ? { ...f, intensity: newIntensity } : f
    ));
    onFilterChange?.(filterId, newIntensity);
  };

  const resetFilters = () => {
    setFilters(prev => prev.map(f => ({ ...f, intensity: 0 })));
    setSelectedFilter(null);
  };

  const getFilterName = (filter: BeautyFilter) => {
    return isRTL ? filter.nameAr : filter.name;
  };

  // Enable for both streaming and memory creation
  if (!isStreaming && onFilterChange === undefined) {
    return null;
  }

  return (
    <Card className="w-full max-w-lg mx-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Sparkles className="w-6 h-6 text-pink-500" strokeWidth={2.5} />
          <span>{isRTL ? 'فلاتر التجميل' : 'Beauty Filters'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter Grid */}
        <div className="grid grid-cols-2 gap-3">
          {filters.map((filter) => (
            <div key={filter.id} className="space-y-2">
              <Button
                variant={selectedFilter === filter.id ? "default" : "outline"}
                size="sm"
                className={`w-full h-auto p-3 ${isRTL ? 'flex-row-reverse' : ''}`}
                onClick={() => setSelectedFilter(filter.id === selectedFilter ? null : filter.id)}
              >
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-8 h-8 flex items-center justify-center text-lg">
                    {React.cloneElement(filter.icon as React.ReactElement, { 
                      className: "w-6 h-6", 
                      strokeWidth: 2.5 
                    })}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-medium">{getFilterName(filter)}</div>
                    {filter.premium && (
                      <Badge variant="secondary" className="text-xs">
                        {isRTL ? 'مميز' : 'Premium'}
                      </Badge>
                    )}
                  </div>
                </div>
              </Button>
              
              {selectedFilter === filter.id && (
                <div className="space-y-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                  <div className={`flex items-center justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span>{isRTL ? 'الشدة' : 'Intensity'}</span>
                    <span className="text-pink-500 font-medium">{filter.intensity}%</span>
                  </div>
                  <Slider
                    value={[filter.intensity]}
                    onValueChange={(value) => handleFilterIntensity(filter.id, value)}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Control Buttons */}
        <div className={`flex gap-2 pt-3 border-t ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetFilters}
            className="flex-1"
          >
            <Wand2 className="w-5 h-5 mr-2" strokeWidth={2.5} />
            {isRTL ? 'إعادة تعيين' : 'Reset All'}
          </Button>
          <Button 
            size="sm" 
            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            <Sparkles className="w-5 h-5 mr-2" strokeWidth={2.5} />
            {isRTL ? 'تطبيق الفلاتر' : 'Apply Filters'}
          </Button>
        </div>

        {/* Preview Info */}
        <div className="text-xs text-gray-500 text-center pt-2">
          {isRTL 
            ? 'يتم تطبيق الفلاتر على البث المباشر في الوقت الفعلي'
            : 'Filters are applied to your live stream in real-time'
          }
        </div>
      </CardContent>
    </Card>
  );
}

// Advanced filter component for premium users
export function AdvancedBeautyFilters({ language = 'en' }: { language?: 'en' | 'ar' }) {
  const isRTL = language === 'ar';
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Star className="w-5 h-5 text-yellow-500" />
          <span>{isRTL ? 'فلاتر متقدمة' : 'Advanced Filters'}</span>
          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500">
            {isRTL ? 'قريباً' : 'Coming Soon'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Sparkles className="w-4 h-4 text-pink-500" />
            <span>{isRTL ? 'تنعيم البشرة بالذكاء الاصطناعي' : 'AI-Powered Skin Smoothing'}</span>
          </div>
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Eye className="w-4 h-4 text-blue-500" />
            <span>{isRTL ? 'تحسين العيون التلقائي' : 'Automatic Eye Enhancement'}</span>
          </div>
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Zap className="w-4 h-4 text-purple-500" />
            <span>{isRTL ? 'فلاتر ثلاثية الأبعاد' : '3D Beauty Filters'}</span>
          </div>
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Wand2 className="w-4 h-4 text-green-500" />
            <span>{isRTL ? 'مكياج افتراضي' : 'Virtual Makeup'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}