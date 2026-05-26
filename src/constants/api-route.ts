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
  taxonomy: {
    levels: "/api/v1/taxonomy/levels",
    topics: "/api/v1/taxonomy/topics",
    outcomes: "/api/v1/taxonomy/outcomes",
    skills: "/api/v1/taxonomy/skills",
    tags: "/api/v1/taxonomy/tags",
    byId: "/api/v1/taxonomy/:segment/:id",
  },
} as const;
