/// <reference types="vite/client" />

declare global {
  interface Window {
    OneSignalInitialized?: boolean;
    OneSignalIndexedDBError?: boolean;
    OneSignalForceDisabled?: boolean;
    OneSignal?: {
      isInitialized?: boolean | (() => boolean);
      init?: (...args: any[]) => Promise<any>;
      __FORCE_DISABLED?: boolean;
      [key: string]: any;
    };
  }
}
