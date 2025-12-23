import { useState } from 'react';
import { 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Bookmark, 
  RefreshCw,
  ChevronDown,
  ChevronUp 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/telegram';
import type { SessionMode } from '@/api/types';

interface SessionModeSelectorProps {
  dueCount: number;
  weakCount: number;
  newCount: number;
  hasSufficientData: boolean;
  selectedMode: SessionMode;
  selectedSize: 10 | 20 | 30;
  onModeChange: (mode: SessionMode) => void;
  onSizeChange: (size: 10 | 20 | 30) => void;
  onStart: () => void;
  isLoading?: boolean;
}

interface ModeOption {
  mode: SessionMode;
  icon: React.ReactNode;
  label: string;
  description: string;
  disabled?: boolean;
}

export function SessionModeSelector({
  dueCount,
  weakCount,
  newCount,
  hasSufficientData,
  selectedMode,
  selectedSize,
  onModeChange,
  onSizeChange,
  onStart,
  isLoading,
}: SessionModeSelectorProps) {
  const [showMoreModes, setShowMoreModes] = useState(false);

  const modes: ModeOption[] = [
    {
      mode: 'daily_mix',
      icon: <Sparkles className="w-4 h-4" />,
      label: 'ترکیب روزانه',
      description: 'ترکیب بهینه از سوالات',
    },
    {
      mode: 'due_only',
      icon: <Clock className="w-4 h-4" />,
      label: 'فقط موعد',
      description: `${dueCount} سوال آماده مرور`,
      disabled: dueCount === 0,
    },
    {
      mode: 'weak_first',
      icon: <AlertTriangle className="w-4 h-4" />,
      label: 'نقاط ضعف',
      description: `${weakCount} سوال نیاز به تمرین`,
      disabled: weakCount === 0,
    },
    {
      mode: 'new_only',
      icon: <Plus className="w-4 h-4" />,
      label: 'فقط جدید',
      description: `${newCount} سوال جدید`,
      disabled: newCount === 0,
    },
    {
      mode: 'bookmarks',
      icon: <Bookmark className="w-4 h-4" />,
      label: 'نشان‌شده‌ها',
      description: 'سوالات ذخیره شده',
    },
    {
      mode: 'review_free',
      icon: <RefreshCw className="w-4 h-4" />,
      label: 'مرور آزاد',
      description: 'بدون محدودیت',
    },
  ];

  const primaryModes = modes.slice(0, 1);
  const secondaryModes = modes.slice(1);

  const sizes: (10 | 20 | 30)[] = [10, 20, 30];

  const handleModeSelect = (mode: SessionMode) => {
    haptic.selection();
    onModeChange(mode);
  };

  const handleSizeSelect = (size: 10 | 20 | 30) => {
    haptic.selection();
    onSizeChange(size);
  };

  return (
    <div className="space-y-4">
      {/* Size selector */}
      <div>
        <label className="text-xs text-muted-foreground mb-2 block">تعداد سوالات</label>
        <div className="flex gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => handleSizeSelect(size)}
              className={cn(
                'flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all tap-highlight',
                selectedSize === size
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Primary mode - Daily Mix CTA */}
      <Button
        onClick={onStart}
        disabled={isLoading}
        className="w-full h-12 gradient-primary text-primary-foreground tap-highlight text-base"
      >
        <Sparkles className="w-5 h-5 ml-2" />
        شروع (پیشنهادی)
      </Button>

      {/* More modes toggle */}
      <button
        onClick={() => {
          haptic.light();
          setShowMoreModes(!showMoreModes);
        }}
        className="flex items-center justify-center gap-2 w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>حالت‌های بیشتر</span>
        {showMoreModes ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {/* Secondary modes */}
      {showMoreModes && (
        <div className="grid grid-cols-2 gap-2 animate-slide-up">
          {secondaryModes.map((mode) => (
            <button
              key={mode.mode}
              onClick={() => !mode.disabled && handleModeSelect(mode.mode)}
              disabled={mode.disabled}
              className={cn(
                'flex flex-col items-start p-3 rounded-lg border text-right transition-all tap-highlight',
                selectedMode === mode.mode && !mode.disabled
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card',
                mode.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className={cn(
                'flex items-center gap-2 mb-1',
                selectedMode === mode.mode ? 'text-primary' : 'text-foreground'
              )}>
                {mode.icon}
                <span className="text-sm font-medium">{mode.label}</span>
              </div>
              <span className="text-xs text-muted-foreground">{mode.description}</span>
            </button>
          ))}
        </div>
      )}

      {/* Start with selected mode if not daily_mix */}
      {showMoreModes && selectedMode !== 'daily_mix' && (
        <Button
          onClick={onStart}
          disabled={isLoading}
          variant="outline"
          className="w-full tap-highlight"
        >
          شروع با حالت انتخابی
        </Button>
      )}
    </div>
  );
}
