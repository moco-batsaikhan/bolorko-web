import { API_BASE_URL, API_ENDPOINTS, STORAGE_KEYS } from "../constants/constants";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface NewsCategory {
  id: number;
  name: string;
  description: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewsComment {
  id: number;
  content: string;
  newsId: number;
  author: NewsAuthor;
  authorId: number;
  createdAt: string;
  updatedAt: string;
}

export interface NewsAuthor {
  id: number;
  name: string;
  email: string;
  roleId: number;
  createdAt: string;
}

export interface NewsArticle {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  imageUrl: string | null;
  isPublished: boolean;
  viewCount: number;
  author: NewsAuthor;
  authorId: number;
  category: NewsCategory | null;
  categoryId: number | null;
  comments: NewsComment[];
  createdAt: string;
  updatedAt: string;
}

export interface NewsResponse {
  data: NewsArticle[];
  total: number;
  pages: number;
}

export interface NewsQueryParams {
  page?: number;
  limit?: number;
  categoryId?: number;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Authentication API
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.AUTH.LOGIN}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await this.handleResponse<LoginResponse>(response);

    console.log("data", data);

    // Store tokens and user data
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));

    return data;
  }

  async register(credentials: RegisterCredentials): Promise<LoginResponse> {
    const registerData = {
      ...credentials,
      role: credentials.role || "USER", // Default role is USER
    };

    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.AUTH.REGISTER}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registerData),
    });

    const data = await this.handleResponse<LoginResponse>(response);

    // Store tokens and user data after successful registration
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));

    return data;
  }

  async logout(): Promise<void> {
    try {
      console.log("log out!");
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) return null;

      const response = await fetch(`${this.baseURL}${API_ENDPOINTS.AUTH.REFRESH}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshToken}`,
        },
      });

      const data = await this.handleResponse<{ access_token: string }>(response);
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token);

      return data.access_token;
    } catch (error) {
      console.error("Token refresh error:", error);
      // If refresh fails, clear all tokens
      this.logout();
      return null;
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.AUTH.CURRENT_USER}`, {
      headers: this.getAuthHeaders(),
    });

    console.log("getCurrentUser: ", response);

    return this.handleResponse<User>(response);
  }

  // News API
  async getNews(params?: NewsQueryParams): Promise<NewsResponse> {
    const queryString = new URLSearchParams();

    if (params?.page) queryString.append("page", params.page.toString());
    if (params?.limit) queryString.append("limit", params.limit.toString());
    if (params?.categoryId) queryString.append("categoryId", params.categoryId.toString());

    const url = `${this.baseURL}${API_ENDPOINTS.NEWS.PUBLIC}${
      queryString.toString() ? "?" + queryString.toString() : ""
    }`;

    const response = await fetch(url, {
      method: "GET",
    });

    return this.handleResponse<NewsResponse>(response);
  }

  async getNewsCategories(): Promise<NewsCategory[]> {
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.NEWS.CATEGORIES}`, {
      method: "GET",
    });

    return this.handleResponse<NewsCategory[]>(response);
  }

  async getNewsDetail(id: number): Promise<NewsArticle> {
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.NEWS.PUBLIC}/${id}`, {
      method: "GET",
    });

    return this.handleResponse<NewsArticle>(response);
  }

  async addNewsComment(newsId: number, content: string): Promise<NewsComment> {
    const response = await fetch(`${this.baseURL}/news/${newsId}/comments`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ content }),
    });

    return this.handleResponse<NewsComment>(response);
  }
}

export const apiService = new ApiService();
