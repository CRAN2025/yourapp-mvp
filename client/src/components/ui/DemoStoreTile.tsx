import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DemoStoreTileProps {
  slug: string;
  storeName: string;
  ownerName: string;
  category: string;
  country: string;
  description: string;
  productCount: number;
  imageUrl?: string;
  className?: string;
  onClick?: () => void;
  isLoading?: boolean;
}

const DemoStoreTile: React.FC<DemoStoreTileProps> = ({
  slug,
  storeName,
  ownerName,
  category,
  country,
  description,
  productCount,
  imageUrl,
  className,
  onClick,
  isLoading = false
}) => {
  const [isPrefetched, setIsPrefetched] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Fire telemetry event
    try {
      console.log('Demo store tile click:', { slug });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }

    if (onClick) {
      onClick();
    } else {
      // Add UTM params for tracking
      const url = new URL(`/demo/${slug}`, window.location.origin);
      url.searchParams.set('utm_source', 'landing');
      url.searchParams.set('utm_medium', 'demo_tile');
      url.searchParams.set('utm_campaign', 'explore_store');
      
      window.location.href = url.toString();
    }
  };

  const handleMouseEnter = () => {
    // Prefetch demo route on hover
    if (!isPrefetched) {
      try {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = `/demo/${slug}`;
        document.head.appendChild(link);
        setIsPrefetched(true);
      } catch (error) {
        console.warn('Prefetch failed:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          "rounded-2xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.08)]",
          "overflow-hidden border border-gray-100 animate-pulse",
          className
        )}
      >
        {/* Skeleton Image */}
        <div className="aspect-[4/3] w-full bg-gray-200" />
        
        {/* Skeleton Content */}
        <div className="p-5 space-y-3">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
          
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="flex justify-between">
              <div className="h-3 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
          
          <div className="pt-2 border-t border-gray-100">
            <div className="h-6 bg-gray-200 rounded-md w-20" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <a
      href={`/demo/${slug}?utm_source=landing&utm_medium=demo_tile&utm_campaign=explore_store`}
      className={cn(
        "group block cursor-pointer transition-all duration-300 ease-out",
        "hover:scale-[1.01] motion-reduce:hover:scale-100",
        "hover:shadow-lg motion-reduce:hover:shadow-[0_2px_10px_rgba(0,0,0,0.08)]",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
        "rounded-2xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.08)]",
        "overflow-hidden border border-gray-100",
        className
      )}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      aria-label={`Explore ${storeName} demo store`}
      data-testid={`demo-store-tile-${slug}`}
    >
      {/* Store Image/Banner */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${storeName} preview`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <div className="text-4xl font-bold text-gray-300">
              {storeName.charAt(0)}
            </div>
          </div>
        )}
        
        {/* Demo Badge */}
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-white/90 text-gray-700 border-0 shadow-sm">
            Demo
          </Badge>
        </div>
      </div>

      {/* Store Info */}
      <div className="p-5 space-y-3 flex flex-col h-full">
        {/* Store Name */}
        <div className="space-y-1">
          <h3 className="text-[17px] font-semibold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
            {storeName}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Store Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Users className="h-3 w-3" />
            <span>{ownerName}</span>
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              <span>{country}</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Package className="h-3 w-3" />
              <span>{productCount} products</span>
            </div>
          </div>
        </div>

        {/* Category Tag */}
        <div className="pt-2 border-t border-gray-100">
          <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
            {category}
          </div>
        </div>

        {/* Call to Action */}
        <div className="pt-2 mt-auto">
          <div className="text-center">
            <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700 transition-colors">
              Explore Store →
            </span>
          </div>
        </div>
      </div>
    </a>
  );
};

export default DemoStoreTile;