// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://129.212.228.96";

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
  NEWS: {
    PUBLIC: "/news/public",
    CATEGORIES: "/news/categories/public",
    ADMIN: "/news/admin",
    CREATE: "/news",
    DELETE: "/news",
    UPDATE: "/news",
    CREATE_CATEGORY: "/news/add/categories",
    DELETE_COMMENT: "/news/comments",
  },
  LESSONS: {
    ADMIN: "/lessons/admin",
    PUBLIC: "/lessons/public",
    PUBLIC_DETAIL: "/lessons/public",
    CREATE: "/lessons",
    UPDATE: "/lessons",
    DELETE: "/lessons",
    COMMENTS_CREATE: "/lessons/comments",
    COMMENTS_DELETE: "/lessons/admin/comments",
    VIDEOS_CREATE: "/lessons/videos",
  },
  PRODUCTS: {
    ALL: "/products",
    CREATE: "/products",
    UPDATE: "/products",
    DELETE: "/products",
    BY_CATEGORY: "/products/category",
    APPLY_DISCOUNT: "/products",
    REMOVE_DISCOUNT: "/products",
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
