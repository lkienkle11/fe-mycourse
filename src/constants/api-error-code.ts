/** Mirrors be/pkg/errcode/codes.go */
export const ApiErrorCode = {
  Success: 0,

  // Transport / parsing (1xxx)
  InvalidJSON: 1001,

  // Validation (2xxx)
  ValidationFailed: 2001,
  ValidationField: 2002,

  // Client / HTTP-shaped (3xxx)
  BadRequest: 3001,
  Unauthorized: 3002,
  Forbidden: 3003,
  NotFound: 3004,
  Conflict: 3005,
  TooManyRequests: 3006,

  // Auth (4xxx)
  EmailAlreadyExists: 4001,
  InvalidCredentials: 4002,
  WeakPassword: 4003,
  EmailNotConfirmed: 4004,
  UserDisabled: 4005,
  InvalidConfirmToken: 4006,
  RegistrationAbandoned: 4009,
  RegistrationEmailRateLimited: 4010,
  ConfirmationEmailSendFailed: 4011,

  // Server (9xxx)
  InternalError: 9001,
  Panic: 9998,
  Unknown: 9999,
} as const;
