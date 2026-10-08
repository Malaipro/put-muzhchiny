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
        ready?: () => void;
        expand?: () => void;
        close?: () => void;
        enableClosingConfirmation?: () => void;
        disableClosingConfirmation?: () => void;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        setBottomBarColor?: (color: string) => void;
        HapticFeedback?: {
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
  // The SDK also creates WebApp in an ordinary browser. Non-empty initData is
  // the reliable client-side signal that Telegram actually launched the app.
  const isInTelegram = Boolean(tg?.initData);

  useEffect(() => {
    if (!tg || !isInTelegram) return;

    // Set KEMP colors
    tg.setHeaderColor?.('#111310');
    tg.setBackgroundColor?.('#111310');
    tg.setBottomBarColor?.('#111310');

    // Expand to full height
    tg.expand?.();

    // Enable closing confirmation to prevent accidental exit during gameplay
    tg.enableClosingConfirmation?.();

    // Tell Telegram we're ready
    tg.ready?.();
  }, [isInTelegram, tg]);

  const hapticImpact = useCallback(
    (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
      if (isInTelegram) tg?.HapticFeedback?.impactOccurred(style);
    },
    [isInTelegram, tg]
  );

  const hapticSuccess = useCallback(() => {
    if (isInTelegram) tg?.HapticFeedback?.notificationOccurred('success');
  }, [isInTelegram, tg]);

  const hapticError = useCallback(() => {
    if (isInTelegram) tg?.HapticFeedback?.notificationOccurred('error');
  }, [isInTelegram, tg]);

  const hapticWarning = useCallback(() => {
    if (isInTelegram) tg?.HapticFeedback?.notificationOccurred('warning');
  }, [isInTelegram, tg]);

  const closeApp = useCallback(() => {
    if (isInTelegram) tg?.close?.();
  }, [isInTelegram, tg]);

  return {
    tg,
    isInTelegram,
    // Cosmetic display only. Never use initDataUnsafe as proof of identity.
    user: tg?.initDataUnsafe?.user ?? null,
    hapticImpact,
    hapticSuccess,
    hapticError,
    hapticWarning,
    closeApp,
  };
}
