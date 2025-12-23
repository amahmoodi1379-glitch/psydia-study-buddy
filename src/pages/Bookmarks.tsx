import { useState, useEffect } from 'react';
import { Bookmark, ChevronLeft } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { TabBar } from '@/components/TabBar';
import { PageLoading } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { haptic } from '@/lib/telegram';
import { api } from '@/api/client';
import type { BookmarkListResponse, BookmarkItem } from '@/api/types';

export default function Bookmarks() {
  const [isLoading, setIsLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await api.bookmarks.list(1);
      setBookmarks(data.items);
      setHasMore(data.has_more);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore) return;
    
    try {
      const nextPage = page + 1;
      const data = await api.bookmarks.list(nextPage);
      setBookmarks(prev => [...prev, ...data.items]);
      setHasMore(data.has_more);
      setPage(nextPage);
    } catch (error) {
      console.error('Failed to load more bookmarks:', error);
    }
  };

  const handleRemoveBookmark = async (questionId: string) => {
    try {
      haptic.light();
      await api.bookmarks.toggle({ question_id: questionId });
      setBookmarks(prev => prev.filter(b => b.question_id !== questionId));
      haptic.success();
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
      haptic.error();
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="نشان‌شده‌ها" showBack backTo="/profile" />

      <main className="px-4 py-4 max-w-lg mx-auto">
        {isLoading ? (
          <PageLoading />
        ) : bookmarks.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="سوال نشان‌شده‌ای ندارید"
            description="سوالات مهم را نشان‌گذاری کنید تا بعداً به آنها دسترسی داشته باشید"
          />
        ) : (
          <div className="space-y-3">
            {bookmarks.map((bookmark, index) => (
              <div
                key={bookmark.question_id}
                className="bg-card rounded-xl border border-border p-4 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2 mb-2">{bookmark.stem_text}</p>
                    <p className="text-xs text-muted-foreground">{bookmark.subtopic_name}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveBookmark(bookmark.question_id)}
                    className="p-2 rounded-full text-warning hover:bg-warning/10 transition-colors shrink-0"
                  >
                    <Bookmark className="w-5 h-5 fill-current" />
                  </button>
                </div>
              </div>
            ))}

            {hasMore && (
              <button
                onClick={loadMore}
                className="w-full py-3 text-sm text-primary hover:underline"
              >
                بارگذاری بیشتر
              </button>
            )}
          </div>
        )}
      </main>

      <TabBar />
    </div>
  );
}
