import { useState, useEffect } from 'react';
import { 
  Settings, 
  BarChart3, 
  Grid3X3, 
  Bookmark, 
  ChevronLeft,
  Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { TabBar } from '@/components/TabBar';
import { PageHeader } from '@/components/PageHeader';
import { StreakBadge } from '@/components/StreakBadge';
import { Avatar } from '@/components/AvatarSelector';
import { PageLoading } from '@/components/LoadingSpinner';
import { haptic } from '@/lib/telegram';
import { api } from '@/api/client';
import type { User, Activity7DResponse } from '@/api/types';
import { cn } from '@/lib/utils';

interface QuickLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

function QuickLink({ to, icon, label }: QuickLinkProps) {
  return (
    <Link
      to={to}
      onClick={() => haptic.light()}
      className="flex items-center justify-between p-4 bg-card rounded-xl border border-border tap-highlight"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center">
          {icon}
        </div>
        <span className="font-medium text-sm">{label}</span>
      </div>
      <ChevronLeft className="w-5 h-5 text-muted-foreground" />
    </Link>
  );
}

export default function Profile() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [activity, setActivity] = useState<Activity7DResponse | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [userData, activityData] = await Promise.all([
        api.user.me(),
        api.stats.activity7d(),
      ]);
      setUser(userData);
      setActivity(activityData);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="پروفایل" />
        <PageLoading />
        <TabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <PageHeader 
        title="پروفایل" 
        action={
          <Link to="/profile/settings" onClick={() => haptic.light()}>
            <Settings className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
          </Link>
        }
      />

      <main className="px-4 py-4 max-w-lg mx-auto space-y-6">
        {/* User info */}
        {user && (
          <div className="bg-card rounded-xl border border-border p-4 animate-slide-up">
            <div className="flex items-center gap-4">
              <Avatar avatarId={user.avatar_id} size="lg" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold">{user.display_name}</h2>
                <p className="text-sm text-muted-foreground">عضویت از {new Date(user.created_at).toLocaleDateString('fa-IR')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats overview */}
        <div className="grid grid-cols-3 gap-3 animate-slide-up" style={{ animationDelay: '50ms' }}>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <StreakBadge current={activity?.streak_current || 0} size="md" className="justify-center mb-1" />
            <div className="text-xs text-muted-foreground">استریک</div>
          </div>
          
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <div className="text-xl font-bold text-primary mb-1">{activity?.streak_best || 0}</div>
            <div className="text-xs text-muted-foreground">بهترین استریک</div>
          </div>
          
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <div className="text-xl font-bold mb-1">{user?.total_answered || 0}</div>
            <div className="text-xs text-muted-foreground">کل پاسخ‌ها</div>
          </div>
        </div>

        {/* Activity chart (simplified) */}
        {activity && (
          <div className="bg-card rounded-xl border border-border p-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <h3 className="text-sm font-medium mb-3">فعالیت ۷ روز اخیر</h3>
            <div className="flex items-end justify-between gap-1 h-16">
              {activity.days.map((day, index) => {
                const maxCount = Math.max(...activity.days.map(d => d.count), 1);
                const height = (day.count / maxCount) * 100;
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center">
                    <div 
                      className={cn(
                        'w-full rounded-t transition-all',
                        day.count > 0 ? 'gradient-primary' : 'bg-secondary'
                      )}
                      style={{ height: `${Math.max(height, 8)}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground mt-1">
                      {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'][index % 7]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="space-y-2 animate-slide-up" style={{ animationDelay: '150ms' }}>
          <QuickLink
            to="/profile/stats"
            icon={<BarChart3 className="w-5 h-5 text-primary" />}
            label="آمار و عملکرد"
          />
          <QuickLink
            to="/profile/heatmap"
            icon={<Grid3X3 className="w-5 h-5 text-success" />}
            label="نقشه پیشرفت"
          />
          <QuickLink
            to="/profile/bookmarks"
            icon={<Bookmark className="w-5 h-5 text-warning" />}
            label="نشان‌شده‌ها"
          />
        </div>
      </main>

      <TabBar />
    </div>
  );
}
