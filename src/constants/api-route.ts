export const API_PUBLIC_ROUTES = {
  auth: {
    login: "/auth/login",
    signup: "/auth/signup",
  },
} as const;

export const API_PRIVATE_ROUTES = {
  user: {
    get: "/user/get",
    update: "/user/update",
    delete: "/user/delete",
  },
} as const;
