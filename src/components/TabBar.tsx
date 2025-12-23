import { BookOpen, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/telegram';

interface TabItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const TabItem = ({ to, icon, label, isActive }: TabItemProps) => (
  <Link
    to={to}
    onClick={() => haptic.selection()}
    className={cn(
      'flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors',
      isActive ? 'text-primary' : 'text-muted-foreground'
    )}
  >
    <div className={cn(
      'p-1.5 rounded-xl transition-all',
      isActive && 'bg-primary/15'
    )}>
      {icon}
    </div>
    <span className="text-xs font-medium">{label}</span>
  </Link>
);

export function TabBar() {
  const location = useLocation();
  const path = location.pathname;

  const isExamTab = path === '/' || path.startsWith('/exam') || path.startsWith('/subjects') || 
                    path.startsWith('/topics') || path.startsWith('/subtopics') || 
                    path.startsWith('/hub') || path.startsWith('/player') || path.startsWith('/summary');
  const isProfileTab = path.startsWith('/profile');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border safe-bottom">
      <div className="flex items-center h-16 max-w-lg mx-auto">
        <TabItem
          to="/"
          icon={<BookOpen className="w-5 h-5" />}
          label="آزمون"
          isActive={isExamTab}
        />
        <TabItem
          to="/profile"
          icon={<User className="w-5 h-5" />}
          label="پروفایل"
          isActive={isProfileTab}
        />
      </div>
    </nav>
  );
}
