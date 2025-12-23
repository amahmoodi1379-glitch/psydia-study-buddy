import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/lib/telegram';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backTo?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, showBack = false, backTo, action }: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    haptic.light();
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="sticky top-0 z-40 glass border-b border-border safe-top">
      <div className="flex items-center h-14 px-4 max-w-lg mx-auto">
        {showBack && (
          <button
            onClick={handleBack}
            className="p-2 -mr-2 ml-2 rounded-full hover:bg-secondary/50 transition-colors tap-highlight"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
        
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>

        {action && (
          <div className="mr-2">
            {action}
          </div>
        )}
      </div>
    </header>
  );
}
