import { useCallback, useEffect, useState } from "react";
import { api, getToken } from "@/api/client";
import { getInitData } from "@/lib/telegram";
import { FullPageLoading } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";

type Status = "checking" | "ok" | "needs_telegram" | "error";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("checking");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

  const runAuth = useCallback(
    async (signal?: { cancelled: boolean }) => {
      const shouldCancel = () => signal?.cancelled;

      // Mock Mode: اگر BASE_URL خالیه، اصلاً auth لازم نیست
      if (!baseUrl) {
        if (!shouldCancel()) setStatus("ok");
        return;
      }

      // اگر توکن داریم، برو جلو
      const token = getToken();
      if (token) {
        if (!shouldCancel()) setStatus("ok");
        return;
      }

      // داخل تلگرام نیستیم یا initData نداریم
      const initData = getInitData();
      if (!initData) {
        if (!shouldCancel()) setStatus("needs_telegram");
        return;
      }

      try {
        await api.auth.telegram(initData);
        if (!shouldCancel()) setStatus("ok");
      } catch (e: any) {
        if (!shouldCancel()) {
          setErrorMsg(e?.message || "Auth failed");
          setStatus("error");
        }
      }
    },
    [baseUrl]
  );

  useEffect(() => {
    const signal = { cancelled: false };

    runAuth(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [runAuth]);

  const handleRetry = () => {
    setErrorMsg("");
    setStatus("checking");
    runAuth();
  };

  if (status === "checking") return <FullPageLoading />;

  if (status === "needs_telegram") {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-3 text-center">
          <h1 className="text-lg font-semibold">psydia</h1>
          <p className="text-sm text-muted-foreground">
            لطفاً از داخل تلگرام دوباره باز کن
          </p>
          <p className="text-xs text-muted-foreground">
            (برای تست روی مرورگر: VITE_API_BASE_URL را خالی بگذار تا Mock Mode فعال شود.)
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-4 text-center">
          <h1 className="text-lg font-semibold">خطا در ورود</h1>
          <p className="text-sm text-muted-foreground">{errorMsg}</p>
          <Button onClick={handleRetry}>تلاش دوباره</Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
