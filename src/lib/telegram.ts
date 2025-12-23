// Telegram Mini App helpers

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    auth_date: number;
    hash: string;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  colorScheme: 'light' | 'dark';
  platform: string;
  version: string;
}

// Check if running in Telegram
export const isTelegram = (): boolean => {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp?.initData;
};

// Get Telegram WebApp instance
export const getTelegramWebApp = (): TelegramWebApp | null => {
  if (!isTelegram()) return null;
  return window.Telegram!.WebApp!;
};

// Get init data for auth
export const getInitData = (): string => {
  const webApp = getTelegramWebApp();
  return webApp?.initData || '';
};

// Initialize Telegram WebApp
export const initTelegramApp = (): void => {
  const webApp = getTelegramWebApp();
  if (!webApp) return;

  // Signal that app is ready
  webApp.ready();
  
  // Expand to full height
  webApp.expand();
  
  // Set colors to match our theme
  webApp.setHeaderColor('#161b22');
  webApp.setBackgroundColor('#0d1117');
};

// Haptic feedback helpers
export const haptic = {
  light: () => {
    getTelegramWebApp()?.HapticFeedback.impactOccurred('light');
  },
  medium: () => {
    getTelegramWebApp()?.HapticFeedback.impactOccurred('medium');
  },
  heavy: () => {
    getTelegramWebApp()?.HapticFeedback.impactOccurred('heavy');
  },
  success: () => {
    getTelegramWebApp()?.HapticFeedback.notificationOccurred('success');
  },
  error: () => {
    getTelegramWebApp()?.HapticFeedback.notificationOccurred('error');
  },
  warning: () => {
    getTelegramWebApp()?.HapticFeedback.notificationOccurred('warning');
  },
  selection: () => {
    getTelegramWebApp()?.HapticFeedback.selectionChanged();
  },
};

// Back button helpers
export const backButton = {
  show: (callback: () => void) => {
    const webApp = getTelegramWebApp();
    if (!webApp) return;
    webApp.BackButton.onClick(callback);
    webApp.BackButton.show();
  },
  hide: () => {
    const webApp = getTelegramWebApp();
    if (!webApp) return;
    webApp.BackButton.hide();
  },
};

// Main button helpers
export const mainButton = {
  show: (text: string, callback: () => void) => {
    const webApp = getTelegramWebApp();
    if (!webApp) return;
    webApp.MainButton.setText(text);
    webApp.MainButton.onClick(callback);
    webApp.MainButton.show();
  },
  hide: () => {
    const webApp = getTelegramWebApp();
    if (!webApp) return;
    webApp.MainButton.hide();
  },
  showProgress: () => {
    const webApp = getTelegramWebApp();
    if (!webApp) return;
    webApp.MainButton.showProgress();
  },
  hideProgress: () => {
    const webApp = getTelegramWebApp();
    if (!webApp) return;
    webApp.MainButton.hideProgress();
  },
};

// Get user info from Telegram
export const getTelegramUser = () => {
  const webApp = getTelegramWebApp();
  return webApp?.initDataUnsafe.user || null;
};

// Get theme from Telegram
export const getTelegramTheme = (): 'light' | 'dark' => {
  const webApp = getTelegramWebApp();
  return webApp?.colorScheme || 'dark';
};
