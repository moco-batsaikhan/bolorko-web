// API Configuration
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.cubingmongolia.mn";

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
    PRODUCT_CATEGORIES: "/products/categories",
    PRODUCTS_BY_CATEGORY: "/products/category",
    CART: "/cart",
  },
  PRODUCTS: {
    ALL: "/products",
    CREATE: "/products",
    UPDATE: "/products",
    DELETE: "/products",
    BY_CATEGORY: "/products/category",
    CATEGORIES: "/products/categories",
    CATEGORIES_CREATE: "/products/categories",
    CATEGORIES_DELETE: "/products/categories",
  },
  ADMIN: {
    ALL_USERS: "/users",
    UPDATE_USER: "/users/admin/update-user",
    DELETE_USER: "/users/admin/delete-user",
  },
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER_DATA: "user_data",
} as const;
