import { cn } from '@/lib/utils';

interface CountBadgeProps {
  count: number;
  label: string;
  variant?: 'due' | 'weak' | 'new' | 'default';
  insufficientData?: boolean;
  className?: string;
}

const variantClasses = {
  due: 'text-warning',
  weak: 'text-destructive',
  new: 'text-info',
  default: 'text-foreground',
};

export function CountBadge({ count, label, variant = 'default', insufficientData, className }: CountBadgeProps) {
  return (
    <div className={cn('text-center', className)}>
      {insufficientData ? (
        <div className="text-lg font-bold text-muted-foreground">—</div>
      ) : (
        <div className={cn('text-lg font-bold', variantClasses[variant])}>
          {count}
        </div>
      )}
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
