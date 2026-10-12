import { useEffect, useCallback, useState } from 'react';
import {
  hasTelegramLaunchContext,
  loadTelegramSdk,
  signalTelegramReadyFallback,
} from '../lib/telegramSdk';

export function useTelegram() {
  const [tg, setTg] = useState(() => window.Telegram?.WebApp ?? null);
  const launchContext = hasTelegramLaunchContext();
  const isInTelegram = Boolean(tg?.initData || launchContext);

  useEffect(() => {
    let active = true;

    if (launchContext) signalTelegramReadyFallback();

    void loadTelegramSdk().then((webApp) => {
      if (active && webApp) setTg(webApp);
    });

    return () => {
      active = false;
    };
  }, [launchContext]);

  useEffect(() => {
    if (!tg || !isInTelegram) return;

    const safeCall = (callback: (() => void) | undefined) => {
      try {
        callback?.();
      } catch {
        // Older Telegram clients may expose methods they cannot execute.
      }
    };

    safeCall(() => tg.setHeaderColor?.('#111310'));
    safeCall(() => tg.setBackgroundColor?.('#111310'));
    safeCall(() => tg.setBottomBarColor?.('#111310'));
    safeCall(() => tg.expand?.());
    safeCall(() => tg.enableClosingConfirmation?.());
    safeCall(() => tg.ready?.());
  }, [isInTelegram, tg]);

  const hapticImpact = useCallback(
    (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
      try {
        if (isInTelegram) tg?.HapticFeedback?.impactOccurred(style);
      } catch {
        // Haptics are optional and must never interrupt gameplay.
      }
    },
    [isInTelegram, tg]
  );

  const hapticSuccess = useCallback(() => {
    try {
      if (isInTelegram) tg?.HapticFeedback?.notificationOccurred('success');
    } catch {
      // Haptics are optional and must never interrupt gameplay.
    }
  }, [isInTelegram, tg]);

  const hapticError = useCallback(() => {
    try {
      if (isInTelegram) tg?.HapticFeedback?.notificationOccurred('error');
    } catch {
      // Haptics are optional and must never interrupt gameplay.
    }
  }, [isInTelegram, tg]);

  const hapticWarning = useCallback(() => {
    try {
      if (isInTelegram) tg?.HapticFeedback?.notificationOccurred('warning');
    } catch {
      // Haptics are optional and must never interrupt gameplay.
    }
  }, [isInTelegram, tg]);

  const closeApp = useCallback(() => {
    try {
      if (isInTelegram) tg?.close?.();
    } catch {
      // Closing through Telegram is optional.
    }
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
