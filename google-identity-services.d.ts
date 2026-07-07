export {};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient: (
            config: import("@/types/auth/google-oauth").GoogleCodeClientConfig,
          ) => import("@/types/auth/google-oauth").GoogleCodeClient;
        };
        id: {
          initialize: (
            config: import("@/types/auth/google-oauth").GoogleIdConfig,
          ) => void;
          prompt: (
            momentListener?: (notification: GooglePromptMomentNotification) => void,
          ) => void;
          cancel: () => void;
        };
      };
    };
  }

  interface GooglePromptMomentNotification {
    isNotDisplayed: () => boolean;
    isSkippedMoment: () => boolean;
    isDismissedMoment: () => boolean;
    getNotDisplayedReason?: () => string;
    getSkippedReason?: () => string;
    getDismissedReason?: () => string;
  }
}
