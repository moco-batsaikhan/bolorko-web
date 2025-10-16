// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://0.0.0.0:3000";

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    CURRENT_USER: "/auth/me",
  },
  USER: {
    ORDERS: "/user/orders",
  },
  SHOP: {
    PRODUCTS: "/products",
    CART: "/cart",
  },
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: "ADMIN",
  USER: "USER",
  MODERATOR: "MODERATOR",
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER_DATA: "user_data",
} as const;
