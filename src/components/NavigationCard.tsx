import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { haptic } from '@/lib/telegram';
import { cn } from '@/lib/utils';

interface NavigationCardProps {
  to: string;
  emoji?: string;
  title: string;
  subtitle?: string;
  count?: number;
  style?: React.CSSProperties;
  countLabel?: string;
  className?: string;
}

export function NavigationCard({ 
  to, 
  emoji, 
  title, 
  subtitle, 
  count, 
  countLabel,
  className,
  style,
}: NavigationCardProps) {
  return (
    <Link
      to={to}
      onClick={() => haptic.light()}
      style={style}
      className={cn(
        'flex items-center gap-3 p-4 bg-card rounded-xl border border-border',
        'tap-highlight shadow-telegram transition-colors hover:bg-card/80',
        className
      )}
    >
      {emoji && (
        <div className="text-2xl w-10 h-10 flex items-center justify-center bg-secondary/50 rounded-lg shrink-0">
          {emoji}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm truncate">{title}</h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>
        )}
      </div>

      {count !== undefined && (
        <div className="text-left shrink-0">
          <div className="text-sm font-semibold text-primary">{count}</div>
          {countLabel && (
            <div className="text-xs text-muted-foreground">{countLabel}</div>
          )}
        </div>
      )}

      <ChevronLeft className="w-5 h-5 text-muted-foreground shrink-0" />
    </Link>
  );
}
