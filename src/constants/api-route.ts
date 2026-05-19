// Public routes
export const API_PUBLIC_ROUTES = {
  auth: {
    login: "/api/v1/auth/login",
    register: "/api/v1/auth/register",
    confirm: "/api/v1/auth/confirm",
    refresh: "/api/v1/auth/refresh",
    logout: "/api/v1/auth/logout",
  },
} as const;

// Required authentication
export const API_PRIVATE_ROUTES = {
  user: {
    getMe: "/api/v1/me",
  },
} as const;
