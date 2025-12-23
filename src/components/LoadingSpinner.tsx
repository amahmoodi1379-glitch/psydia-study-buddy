import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <Loader2 className={cn('animate-spin text-primary', sizeClasses[size], className)} />
  );
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export function FullPageLoading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-muted-foreground">در حال بارگذاری...</p>
      </div>
    </div>
  );
}
