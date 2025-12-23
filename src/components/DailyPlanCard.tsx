import { Sparkles, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/lib/telegram';

interface DailyPlanCardProps {
  lastSubtopic: { id: string; name: string } | null;
}

export function DailyPlanCard({ lastSubtopic }: DailyPlanCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    haptic.medium();
    if (lastSubtopic) {
      navigate(`/hub/${lastSubtopic.id}`);
    } else {
      navigate('/');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full bg-card rounded-xl border border-border p-4 text-right tap-highlight animate-slide-up shadow-telegram"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">برنامه امروز</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lastSubtopic ? lastSubtopic.name : 'یک زیرموضوع انتخاب کنید'}
            </p>
          </div>
        </div>
        <ChevronLeft className="w-5 h-5 text-muted-foreground" />
      </div>
    </button>
  );
}
