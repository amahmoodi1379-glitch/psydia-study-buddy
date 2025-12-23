import type { StatusLabel } from '@/api/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: StatusLabel;
  size?: 'sm' | 'md';
  className?: string;
}

const statusConfig: Record<StatusLabel, { label: string; className: string }> = {
  beginner: {
    label: 'مبتدی',
    className: 'bg-bucket-beginner/20 text-bucket-beginner border-bucket-beginner/30',
  },
  in_progress: {
    label: 'در حال پیشرفت',
    className: 'bg-bucket-progress/20 text-bucket-progress border-bucket-progress/30',
  },
  almost: {
    label: 'تقریباً تسلط',
    className: 'bg-bucket-almost/20 text-bucket-almost border-bucket-almost/30',
  },
  mastered: {
    label: 'تسلط کامل',
    className: 'bg-bucket-mastered/20 text-bucket-mastered border-bucket-mastered/30',
  },
};

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span className={cn(
      'inline-flex items-center rounded-full border font-medium',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}
