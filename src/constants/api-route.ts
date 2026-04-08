// Public routes
export const API_PUBLIC_ROUTES = {
  auth: {
    login: "/api/v1/auth/login",
    signup: "/api/v1/auth/signup",
    refresh: "/api/v1/auth/refresh",
  },
} as const;

// Required authentication
export const API_PRIVATE_ROUTES = {
  user: {
    getMe: "/api/v1/me",
  },
} as const;
