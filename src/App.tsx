import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { themeStorage } from '@/lib/storage';
import { initTelegramApp } from '@/lib/telegram';
import AuthGate from "@/components/AuthGate";

// Pages
import ExamHome from "./pages/ExamHome";
import Topics from "./pages/Topics";
import Subtopics from "./pages/Subtopics";
import SubtopicHub from "./pages/SubtopicHub";
import Player from "./pages/Player";
import SessionSummary from "./pages/SessionSummary";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Stats from "./pages/Stats";
import SubjectStats from "./pages/SubjectStats";
import Heatmap from "./pages/Heatmap";
import Bookmarks from "./pages/Bookmarks";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

const App = () => {
  useEffect(() => {
    // Initialize theme
    themeStorage.init();
    
    // Initialize Telegram WebApp
    initTelegramApp();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" />
        <AuthGate>
          <HashRouter>
            <Routes>
              {/* Exam tab routes */}
              <Route path="/" element={<ExamHome />} />
              <Route path="/subjects/:subjectId/topics" element={<Topics />} />
              <Route path="/topics/:topicId/subtopics" element={<Subtopics />} />
              <Route path="/hub/:subtopicId" element={<SubtopicHub />} />
              <Route path="/player" element={<Player />} />
              <Route path="/summary" element={<SessionSummary />} />

              {/* Profile tab routes */}
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/settings" element={<Settings />} />
              <Route path="/profile/stats" element={<Stats />} />
              <Route path="/profile/stats/subject/:subjectId" element={<SubjectStats />} />
              <Route path="/profile/heatmap" element={<Heatmap />} />
              <Route path="/profile/bookmarks" element={<Bookmarks />} />

              {/* Fix: Redirect any unknown routes (including Telegram launch params) to Home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </HashRouter>
        </AuthGate>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
