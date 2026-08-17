import { useEffect, useCallback } from 'react';

// Telegram WebApp types
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
          start_param?: string;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        enableClosingConfirmation: () => void;
        disableClosingConfirmation: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        setBottomBarColor: (color: string) => void;
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        platform: string;
        colorScheme: 'light' | 'dark';
      };
    };
  }
}

export function useTelegram() {
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

  useEffect(() => {
    if (!tg) return;

    // Set KEMP colors
    tg.setHeaderColor('#111310');
    tg.setBackgroundColor('#111310');
    tg.setBottomBarColor('#111310');

    // Expand to full height
    tg.expand();

    // Enable closing confirmation to prevent accidental exit during gameplay
    tg.enableClosingConfirmation();

    // Tell Telegram we're ready
    tg.ready();
  }, [tg]);

  const hapticImpact = useCallback(
    (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
      tg?.HapticFeedback?.impactOccurred(style);
    },
    [tg]
  );

  const hapticSuccess = useCallback(() => {
    tg?.HapticFeedback?.notificationOccurred('success');
  }, [tg]);

  const hapticError = useCallback(() => {
    tg?.HapticFeedback?.notificationOccurred('error');
  }, [tg]);

  const hapticWarning = useCallback(() => {
    tg?.HapticFeedback?.notificationOccurred('warning');
  }, [tg]);

  const closeApp = useCallback(() => {
    tg?.close();
  }, [tg]);

  return {
    tg,
    isInTelegram: !!tg,
    user: tg?.initDataUnsafe?.user ?? null,
    hapticImpact,
    hapticSuccess,
    hapticError,
    hapticWarning,
    closeApp,
  };
}
