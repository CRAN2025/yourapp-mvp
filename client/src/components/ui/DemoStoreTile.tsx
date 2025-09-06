import React from 'react';
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
  onClick
}) => {
  const handleClick = () => {
    // Fire telemetry event
    try {
      // TODO: Add analytics tracking for demo_store_click
      console.log('Demo store tile click:', { slug });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }

    if (onClick) {
      onClick();
    } else {
      window.location.href = `/demo/${slug}`;
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={cn(
        "group cursor-pointer transition-all duration-300 ease-out",
        "hover:scale-[1.02] hover:-translate-y-1",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
        "rounded-2xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.08)]",
        "hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)]",
        "overflow-hidden border border-gray-100",
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Visit ${storeName} demo store`}
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
      <div className="p-5 space-y-3">
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
        <div className="pt-2">
          <div className="text-center">
            <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700 transition-colors">
              Explore Store →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoStoreTile;