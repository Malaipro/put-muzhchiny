export interface TelegramWebApp {
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
}

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
    TelegramWebviewProxy?: {
      postEvent: (eventType: string, eventData: string) => void;
    };
  }
}

type ExternalWithNotify = External & {
  notify?: (payload: string) => void;
};

const SDK_URL = 'https://telegram.org/js/telegram-web-app.js?64';
const SDK_TIMEOUT_MS = 3000;

let sdkPromise: Promise<TelegramWebApp | null> | null = null;

function hasTelegramLaunchParams(): boolean {
  const launchUrl = `${window.location.search}&${window.location.hash}`;
  return /(?:^|[?#&])tgWebApp(?:Data|Version|Platform)=/.test(launchUrl);
}

export function hasTelegramLaunchContext(): boolean {
  const external = window.external as ExternalWithNotify | undefined;
  return Boolean(
    window.Telegram?.WebApp?.initData
      || window.TelegramWebviewProxy
      || external?.notify
      || hasTelegramLaunchParams(),
  );
}

// Telegram's official SDK sends this same event. Calling it directly keeps the
// native loading placeholder from covering the app if telegram.org is blocked.
export function signalTelegramReadyFallback(): void {
  try {
    if (window.TelegramWebviewProxy) {
      window.TelegramWebviewProxy.postEvent('web_app_ready', '{}');
      return;
    }

    const external = window.external as ExternalWithNotify | undefined;
    if (external?.notify) {
      external.notify(JSON.stringify({ eventType: 'web_app_ready', eventData: {} }));
      return;
    }

    if (hasTelegramLaunchParams() && window.parent !== window) {
      window.parent.postMessage(
        JSON.stringify({ eventType: 'web_app_ready', eventData: {} }),
        '*',
      );
    }
  } catch {
    // The web application must stay usable even if a native bridge is stale.
  }
}

export function loadTelegramSdk(): Promise<TelegramWebApp | null> {
  const current = window.Telegram?.WebApp ?? null;
  if (current) return Promise.resolve(current);
  if (!hasTelegramLaunchContext()) return Promise.resolve(null);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      script.onload = null;
      script.onerror = null;
      resolve(window.Telegram?.WebApp ?? null);
    };

    const timeoutId = window.setTimeout(() => {
      script.remove();
      finish();
    }, SDK_TIMEOUT_MS);

    script.src = SDK_URL;
    script.async = true;
    script.dataset.telegramSdk = 'true';
    script.onload = finish;
    script.onerror = finish;
    document.head.appendChild(script);
  });

  return sdkPromise;
}
