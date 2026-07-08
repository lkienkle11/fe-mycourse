/** Mirrors be/internal/shared/errors/errcode_codes.go */
export const ApiErrorCode = {
  Success: 0,
  Unknown: 9999,

  // Transport / parsing (1xxx)
  InvalidJSON: 1001,

  // Validation (2xxx)
  ValidationFailed: 2001,
  ValidationField: 2002,
  FileTooLarge: 2003,
  ExecutableUploadRejected: 2004,
  MediaMultipartTotalTooLarge: 2005,
  MediaTooManyFilesInRequest: 2006,
  MediaFilesRequired: 2007,
  MediaBatchDeleteTooManyIDs: 2008,
  MediaDuplicateKeysInBatchDelete: 2009,
  DuplicateCertificate: 2010,

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
  InvalidSession: 4007,
  RefreshTokenExpired: 4008,
  RegistrationAbandoned: 4009,
  RegistrationEmailRateLimited: 4010,
  ConfirmationEmailSendFailed: 4011,
  UserBanned: 4012,

  InvalidGoogleCode: 4013,
  GoogleEmailNotVerified: 4014,
  OAuthIdentityConflict: 4015,
  InvalidXCode: 4016,
  XEmailUnavailable: 4017,
  /** FE-local only — invalid OAuth state / expired PKCE cookies (not returned by BE). */
  InvalidOAuthState: 4018,
  XAccountLinkRequired: 4019,
  /** FE-local only — Google OAuth client id / GSI not available in browser. */
  GoogleOAuthNotConfigured: 4020,
  /** FE-local only — browser blocked the OAuth popup window. */
  OAuthPopupBlocked: 4021,
  /** FE-local only — could not start X OAuth (missing callback URL or authorize URL). */
  XOAuthStartFailed: 4022,
  /** FE-local only — could not start Discord OAuth (missing client id or callback URL). */
  DiscordOAuthStartFailed: 4026,

  InvalidDiscordCode: 4023,
  DiscordEmailNotVerified: 4024,
  DiscordEmailUnavailable: 4025,

  // Server (9xxx)
  InternalError: 9001,
  Panic: 9998,

  // Media upstream (90xx)
  B2BucketNotConfigured: 9010,
  BunnyStreamNotConfigured: 9011,
  BunnyCreateFailed: 9012,
  BunnyUploadFailed: 9013,
  BunnyInvalidResponse: 9014,
  BunnyVideoNotFound: 9015,
  BunnyGetVideoFailed: 9016,
  ImageEncodeBusy: 9017,
  ServiceUnavailable: 9018,
} as const;
