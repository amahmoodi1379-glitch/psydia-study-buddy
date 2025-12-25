import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/telegram';
import type { ReportType } from '@/api/types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (type: ReportType, message?: string) => Promise<void>;
  isSubmitting: boolean;
}

const reportTypes: { type: ReportType; label: string }[] = [
  { type: 'wrong_answer', label: 'پاسخ نادرست' },
  { type: 'unclear_question', label: 'سوال نامفهوم' },
  { type: 'typo', label: 'غلط املایی' },
  { type: 'other', label: 'سایر' },
];

export function ReportModal({ isOpen, onClose, onSubmit, isSubmitting }: ReportModalProps) {
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedType) return;
    haptic.medium();
    await onSubmit(selectedType, message || undefined);
    setSelectedType(null);
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card rounded-t-2xl border-t border-border p-4 pb-safe animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">گزارش مشکل</h3>
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-secondary/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Report types */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {reportTypes.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => {
                haptic.selection();
                setSelectedType(type);
              }}
              className={cn(
                'py-3 px-4 rounded-lg border text-sm font-medium transition-all tap-highlight',
                selectedType === type
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border bg-secondary/30 text-foreground hover:bg-secondary/50'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Message input */}
        <Textarea
          placeholder="توضیحات بیشتر (اختیاری)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mb-4 min-h-[80px] resize-none"
        />

        {/* Submit button */}
        <Button
          onClick={handleSubmit}
          disabled={!selectedType || isSubmitting}
          className="w-full gradient-primary text-primary-foreground tap-highlight"
        >
          <Send className="w-4 h-4 ml-2" />
          ارسال گزارش
        </Button>
      </div>
    </div>
  );
}
