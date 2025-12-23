import { Play, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { sessionStorage } from '@/lib/storage';
import { haptic } from '@/lib/telegram';
import type { LocalSession } from '@/api/types';

interface ResumeCardProps {
  session: LocalSession;
  onDismiss: () => void;
}

export function ResumeCard({ session, onDismiss }: ResumeCardProps) {
  const navigate = useNavigate();
  const remaining = session.question_ids.length - session.current_index;
  const progress = Math.round((session.current_index / session.question_ids.length) * 100);

  const handleResume = () => {
    haptic.medium();
    navigate('/player');
  };

  const handleDismiss = () => {
    haptic.light();
    sessionStorage.clear();
    onDismiss();
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 animate-slide-up shadow-telegram">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm">ادامه آزمون</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {session.subtopic_name}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 -mt-1 -ml-1 rounded-full hover:bg-secondary/50 transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{remaining} سوال باقی‌مانده</span>
          <span>%{progress}</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full gradient-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Button
        onClick={handleResume}
        className="w-full gradient-primary text-primary-foreground tap-highlight"
        size="sm"
      >
        <Play className="w-4 h-4 ml-2" />
        ادامه
      </Button>
    </div>
  );
}
