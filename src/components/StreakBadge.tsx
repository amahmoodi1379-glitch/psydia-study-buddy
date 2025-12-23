import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakBadgeProps {
  current: number;
  best?: number;
  showBest?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StreakBadge({ current, best, showBest = false, size = 'md', className }: StreakBadgeProps) {
  const sizeClasses = {
    sm: 'text-sm gap-1',
    md: 'text-base gap-1.5',
    lg: 'text-lg gap-2',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const isActive = current > 0;

  return (
    <div className={cn('flex items-center', sizeClasses[size], className)}>
      <div className={cn(
        'flex items-center gap-1 px-2 py-1 rounded-full font-bold',
        isActive 
          ? 'gradient-streak text-primary-foreground animate-streak' 
          : 'bg-secondary text-muted-foreground'
      )}>
        <Flame className={iconSizes[size]} />
        <span>{current}</span>
      </div>
      
      {showBest && best !== undefined && best > 0 && (
        <span className="text-xs text-muted-foreground">
          بهترین: {best}
        </span>
      )}
    </div>
  );
}
