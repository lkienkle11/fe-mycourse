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
