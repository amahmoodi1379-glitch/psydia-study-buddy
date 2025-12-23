import { useState, useEffect } from 'react';
import { Save, Sun, Moon } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { TabBar } from '@/components/TabBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AvatarSelector } from '@/components/AvatarSelector';
import { PageLoading } from '@/components/LoadingSpinner';
import { themeStorage } from '@/lib/storage';
import { haptic } from '@/lib/telegram';
import { api } from '@/api/client';
import { cn } from '@/lib/utils';
import type { User } from '@/api/types';

export default function Settings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarId, setAvatarId] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const userData = await api.user.me();
      setUser(userData);
      setDisplayName(userData.display_name);
      setAvatarId(userData.avatar_id);
      setTheme(themeStorage.get());
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    haptic.selection();
    setTheme(newTheme);
    themeStorage.set(newTheme);
    
    // Also update via API
    api.user.update({ theme: newTheme }).catch(console.error);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      haptic.medium();
      
      await api.user.update({
        display_name: displayName,
        avatar_id: avatarId,
      });

      haptic.success();
    } catch (error) {
      console.error('Failed to save settings:', error);
      haptic.error();
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="تنظیمات" showBack backTo="/profile" />
        <PageLoading />
        <TabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="تنظیمات" showBack backTo="/profile" />

      <main className="px-4 py-4 max-w-lg mx-auto space-y-6">
        {/* Display name */}
        <div className="animate-slide-up">
          <label className="text-sm font-medium mb-2 block">نام نمایشی</label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="نام خود را وارد کنید"
            className="text-right"
          />
        </div>

        {/* Avatar selector */}
        <div className="animate-slide-up" style={{ animationDelay: '50ms' }}>
          <label className="text-sm font-medium mb-3 block">آواتار</label>
          <AvatarSelector selectedId={avatarId} onSelect={setAvatarId} />
        </div>

        {/* Theme selector */}
        <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <label className="text-sm font-medium mb-3 block">تم</label>
          <div className="flex gap-3">
            <button
              onClick={() => handleThemeChange('dark')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition-all tap-highlight',
                theme === 'dark'
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border bg-secondary/30 text-muted-foreground'
              )}
            >
              <Moon className="w-5 h-5" />
              <span className="text-sm font-medium">تاریک</span>
            </button>
            <button
              onClick={() => handleThemeChange('light')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition-all tap-highlight',
                theme === 'light'
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border bg-secondary/30 text-muted-foreground'
              )}
            >
              <Sun className="w-5 h-5" />
              <span className="text-sm font-medium">روشن</span>
            </button>
          </div>
        </div>

        {/* Save button */}
        <div className="pt-4 animate-slide-up" style={{ animationDelay: '150ms' }}>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full gradient-primary text-primary-foreground tap-highlight"
          >
            <Save className="w-4 h-4 ml-2" />
            {isSaving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
          </Button>
        </div>
      </main>

      <TabBar />
    </div>
  );
}
