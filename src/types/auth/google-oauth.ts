export type GoogleCodeClientConfig = {
  client_id: string;
  scope: string;
  ux_mode?: "popup" | "redirect";
  callback: (response: GoogleCodeClientResponse) => void;
  error_callback?: (error: GoogleCodeClientError) => void;
};

export type GoogleCodeClient = {
  requestCode: () => void;
};

export type GoogleCodeClientResponse = {
  code?: string;
  error?: string;
};

export type GoogleCodeClientError = {
  type?: string;
  message?: string;
};

export type GoogleIdConfig = {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: "signin" | "signup" | "use";
};

export type GoogleCredentialResponse = {
  credential?: string;
  select_by?: string;
};
