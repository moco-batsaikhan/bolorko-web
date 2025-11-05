import { API_BASE_URL, API_ENDPOINTS, STORAGE_KEYS } from "../constants/constants";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  password: string;
  roleId: number;
  createdAt: string;
  role: {
    id: number;
    role: string;
  };
}

export interface UpdateUserRequest {
  name: string;
  email: string;
  role: string;
}

export interface UpdateNewsRequest {
  title: string;
  content: string;
  excerpt: string;
  isPublished: boolean;
  categoryId: number;
  image?: File;
}

export interface CreateNewsRequest {
  title: string;
  content: string;
  excerpt: string;
  isPublished: boolean;
  categoryId: number;
  image?: File;
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
}

export interface LessonVideo {
  id: number;
  lessonId: number;
  description: string;
  videoUrl: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LessonComment {
  id: number;
  lessonId: number;
  userId: number;
  comment: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface Lesson {
  id: number;
  title: string;
  description: string;
  image: string;
  price: string;
  isPublished: boolean;
  viewCount: number;
  videos: LessonVideo[];
  comments: LessonComment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateLessonRequest {
  title: string;
  description: string;
  price: number;
  isPublished: boolean;
  image?: File;
}

export interface UpdateLessonRequest {
  title: string;
  description: string;
  price: number;
  isPublished: boolean;
  image?: File;
}

export interface CreateLessonCommentRequest {
  lessonId: number;
  comment: string;
}

export interface CreateLessonVideoRequest {
  lessonId: number;
  description: string;
  videoUrl: string;
  order: number;
}

export interface ProductCategory {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  products?: Product[];
}

export interface ProductRating {
  id: number;
  productId: number;
  userId: number;
  rating: number;
  review?: string;
  createdAt: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  discountPercentage?: string;
  stock: number;
  categoryId?: number;
  status: "ACTIVE" | "INACTIVE";
  images: string[] | string | null;
  averageRating: string;
  ratingCount: number;
  createdAt: string;
  updatedAt?: string;
  category?: ProductCategory;
  ratings?: ProductRating[];
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: number;
  status: "ACTIVE" | "INACTIVE";
  images?: File[];
}

export interface UpdateProductRequest {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: number;
  status: "ACTIVE" | "INACTIVE";
  images?: File[];
}

export interface ApplyDiscountRequest {
  discountPercentage: number;
}

export interface CreateProductCategoryRequest {
  name: string;
  description: string;
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

  // Products Management (Admin)
  async getAllProducts(): Promise<Product[]> {
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.PRODUCTS.ALL}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<Product[]>(response);
  }

  // Public Product API
  async getProducts(): Promise<Product[]> {
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.SHOP.PRODUCTS}`, {
      method: "GET",
    });

    return this.handleResponse<Product[]>(response);
  }

  async getProductCategories(): Promise<ProductCategory[]> {
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.SHOP.PRODUCT_CATEGORIES}`, {
      method: "GET",
    });

    return this.handleResponse<ProductCategory[]>(response);
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    const response = await fetch(
      `${this.baseURL}${API_ENDPOINTS.SHOP.PRODUCTS_BY_CATEGORY}/${categoryId}`,
      {
        method: "GET",
      },
    );

    return this.handleResponse<Product[]>(response);
  }

  // Admin Product Categories Management
  async getAdminProductCategories(): Promise<ProductCategory[]> {
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.PRODUCTS.CATEGORIES}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<ProductCategory[]>(response);
  }

  async getUsers(): Promise<AdminUser[]> {
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.ADMIN.ALL_USERS}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<AdminUser[]>(response);
  }

  async updateUser(id: number, userData: UpdateUserRequest): Promise<AdminUser> {
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.ADMIN.UPDATE_USER}/${id}`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    });

    return this.handleResponse<AdminUser>(response);
  }

  async deleteUser(id: number): Promise<void> {
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.ADMIN.DELETE_USER}/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async getAdminNews(page: number = 1, limit: number = 10): Promise<NewsResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());

    const response = await fetch(
      `${this.baseURL}${API_ENDPOINTS.NEWS.ADMIN}?${queryParams.toString()}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      },
    );

    return this.handleResponse<NewsResponse>(response);
  }

  async deleteNews(id: number): Promise<void> {
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.NEWS.DELETE}/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    console.log(response);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async updateNews(id: number, newsData: UpdateNewsRequest): Promise<NewsArticle> {
    const formData = new FormData();
    formData.append("title", newsData.title);
    formData.append("content", newsData.content);
    formData.append("excerpt", newsData.excerpt);
    formData.append("isPublished", newsData.isPublished.toString());
    formData.append("categoryId", newsData.categoryId.toString());

    if (newsData.image) {
      formData.append("image", newsData.image);
    }

    const authHeaders = this.getAuthHeaders();
    // Remove Content-Type header to let browser set it with boundary for multipart/form-data
    delete authHeaders["Content-Type"];

    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.NEWS.UPDATE}/${id}`, {
      method: "POST",
      headers: authHeaders,
      body: formData,
    });

    return this.handleResponse<NewsArticle>(response);
  }

  async createNews(newsData: CreateNewsRequest): Promise<NewsArticle> {
    const formData = new FormData();
    formData.append("title", newsData.title);
    formData.append("content", newsData.content);
    formData.append("excerpt", newsData.excerpt);
    formData.append("isPublished", newsData.isPublished.toString());
    formData.append("categoryId", newsData.categoryId.toString());

    if (newsData.image) {
      formData.append("image", newsData.image);
    }

    const authHeaders = this.getAuthHeaders();
    // Remove Content-Type header to let browser set it with boundary for multipart/form-data
    delete authHeaders["Content-Type"];

    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.NEWS.CREATE}`, {
      method: "POST",
      headers: authHeaders,
      body: formData,
    });

    return this.handleResponse<NewsArticle>(response);
  }

  async deleteComment(id: number): Promise<void> {
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.NEWS.DELETE_COMMENT}/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async createCategory(categoryData: CreateCategoryRequest): Promise<NewsCategory> {
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.NEWS.CREATE_CATEGORY}`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(categoryData),
    });

    return this.handleResponse<NewsCategory>(response);
  }

  // Lessons Management - Admin
  async getAdminLessons(
    page = 1,
    limit = 10,
  ): Promise<{
    data: Lesson[];
    total: number;
    pages: number;
  }> {
    const response = await fetch(
      `${this.baseURL}${API_ENDPOINTS.LESSONS.ADMIN}?page=${page}&limit=${limit}`,
      {
        headers: this.getAuthHeaders(),
      },
    );

    return this.handleResponse<{
      data: Lesson[];
      total: number;
      pages: number;
    }>(response);
  }

  async createLesson(lessonData: CreateLessonRequest): Promise<Lesson> {
    const formData = new FormData();
    formData.append("title", lessonData.title);
    formData.append("description", lessonData.description);
    formData.append("price", lessonData.price.toString());
    formData.append("isPublished", lessonData.isPublished.toString());

    if (lessonData.image) {
      formData.append("image", lessonData.image);
    }

    const authHeaders = this.getAuthHeaders();
    delete authHeaders["Content-Type"]; // Let browser set it for FormData

    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.LESSONS.CREATE}`, {
      method: "POST",
      headers: authHeaders,
      body: formData,
    });

    return this.handleResponse<Lesson>(response);
  }

  async updateLesson(id: number, lessonData: UpdateLessonRequest): Promise<Lesson> {
    const formData = new FormData();
    formData.append("title", lessonData.title);
    formData.append("description", lessonData.description);
    formData.append("price", lessonData.price.toString());
    formData.append("isPublished", lessonData.isPublished.toString());

    if (lessonData.image) {
      formData.append("image", lessonData.image);
    }

    const authHeaders = this.getAuthHeaders();
    delete authHeaders["Content-Type"];

    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.LESSONS.UPDATE}/${id}`, {
      method: "PATCH",
      headers: authHeaders,
      body: formData,
    });

    return this.handleResponse<Lesson>(response);
  }

  async deleteLesson(id: number): Promise<void> {
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.LESSONS.DELETE}/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async deleteLessonComment(commentId: number): Promise<void> {
    const response = await fetch(
      `${this.baseURL}${API_ENDPOINTS.LESSONS.COMMENTS_DELETE}/${commentId}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  // Lessons - Public/User
  async getPublicLessons(
    page = 1,
    limit = 10,
  ): Promise<{
    data: Lesson[];
    total: number;
    pages: number;
  }> {
    const response = await fetch(
      `${this.baseURL}${API_ENDPOINTS.LESSONS.PUBLIC}?page=${page}&limit=${limit}`,
      {
        method: "GET",
      },
    );

    return this.handleResponse<{
      data: Lesson[];
      total: number;
      pages: number;
    }>(response);
  }

  async createLessonComment(commentData: CreateLessonCommentRequest): Promise<LessonComment> {
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.LESSONS.COMMENTS_CREATE}`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(commentData),
    });

    return this.handleResponse<LessonComment>(response);
  }

  async createLessonVideo(videoData: CreateLessonVideoRequest): Promise<LessonVideo> {
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.LESSONS.VIDEOS_CREATE}`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(videoData),
    });

    return this.handleResponse<LessonVideo>(response);
  }

  async getPublicLessonDetail(id: number): Promise<Lesson> {
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.LESSONS.PUBLIC_DETAIL}/${id}`, {
      method: "GET",
    });

    return this.handleResponse<Lesson>(response);
  }

  // Products Management

  async createProduct(productData: CreateProductRequest): Promise<Product> {
    const formData = new FormData();
    formData.append("name", productData.name);
    formData.append("description", productData.description);
    formData.append("price", productData.price.toString());
    formData.append("stock", productData.stock.toString());
    formData.append("categoryId", productData.categoryId.toString());
    formData.append("status", productData.status);

    if (productData.images && productData.images.length > 0) {
      productData.images.forEach((image) => {
        formData.append("images", image);
      });
    }

    const authHeaders = this.getAuthHeaders();
    delete authHeaders["Content-Type"]; // Let browser set it for FormData

    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.PRODUCTS.CREATE}`, {
      method: "POST",
      headers: authHeaders,
      body: formData,
    });

    return this.handleResponse<Product>(response);
  }

  async updateProduct(id: number, productData: UpdateProductRequest): Promise<Product> {
    const formData = new FormData();
    formData.append("name", productData.name);
    formData.append("description", productData.description);
    formData.append("price", productData.price.toString());
    formData.append("stock", productData.stock.toString());
    formData.append("categoryId", productData.categoryId.toString());
    formData.append("status", productData.status);

    if (productData.images && productData.images.length > 0) {
      productData.images.forEach((image) => {
        formData.append("images", image);
      });
    }

    const authHeaders = this.getAuthHeaders();
    delete authHeaders["Content-Type"];

    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.PRODUCTS.UPDATE}/${id}`, {
      method: "PATCH",
      headers: authHeaders,
      body: formData,
    });

    return this.handleResponse<Product>(response);
  }

  async deleteProduct(id: number): Promise<void> {
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.PRODUCTS.DELETE}/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async applyDiscount(productId: number, discountData: ApplyDiscountRequest): Promise<Product> {
    const response = await fetch(
      `${this.baseURL}${API_ENDPOINTS.PRODUCTS.APPLY_DISCOUNT}/${productId}/discount`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(discountData),
      },
    );

    return this.handleResponse<Product>(response);
  }

  async removeDiscount(productId: number): Promise<Product> {
    const response = await fetch(
      `${this.baseURL}${API_ENDPOINTS.PRODUCTS.REMOVE_DISCOUNT}/${productId}/discount`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      },
    );

    return this.handleResponse<Product>(response);
  }

  async createProductCategory(
    categoryData: CreateProductCategoryRequest,
  ): Promise<ProductCategory> {
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.PRODUCTS.CATEGORIES_CREATE}`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(categoryData),
    });

    return this.handleResponse<ProductCategory>(response);
  }

  async deleteProductCategory(id: number): Promise<void> {
    const response = await fetch(
      `${this.baseURL}${API_ENDPOINTS.PRODUCTS.CATEGORIES_DELETE}/${id}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }
}

export const apiService = new ApiService();
