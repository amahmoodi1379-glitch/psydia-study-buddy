import { cn } from '@/lib/utils';
import { haptic } from '@/lib/telegram';

interface AvatarSelectorProps {
  selectedId: number;
  onSelect: (id: number) => void;
}

// 30 avatar options using emoji combinations
const avatarEmojis = [
  '🧠', '📚', '🎓', '💡', '🔬', '📊', '🎯', '⭐', '🌟', '✨',
  '🦉', '🦋', '🌸', '🌺', '🍀', '🌈', '☀️', '🌙', '🔥', '💎',
  '🎨', '🎭', '🎪', '🎸', '🎻', '🎹', '📝', '📖', '🏆', '🎖️',
];

export function AvatarSelector({ selectedId, onSelect }: AvatarSelectorProps) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {avatarEmojis.map((emoji, index) => (
        <button
          key={index}
          onClick={() => {
            haptic.selection();
            onSelect(index);
          }}
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all tap-highlight',
            selectedId === index
              ? 'bg-primary/20 border-2 border-primary scale-110'
              : 'bg-secondary/50 border border-border hover:bg-secondary'
          )}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

export function Avatar({ avatarId, size = 'md' }: { avatarId: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-base',
    md: 'w-12 h-12 text-xl',
    lg: 'w-16 h-16 text-2xl',
  };

  return (
    <div className={cn(
      'rounded-full bg-secondary/50 border border-border flex items-center justify-center',
      sizeClasses[size]
    )}>
      {avatarEmojis[avatarId] || '🧠'}
    </div>
  );
}
