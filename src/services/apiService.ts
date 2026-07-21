import {
  API_BASE_URL,
  API_ENDPOINTS,
  STORAGE_KEYS,
} from "../constants/constants";

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

export interface CartItem {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  createdAt: string;
  product: Product;
}

export interface Cart {
  id: number;
  userId: number;
  createdAt: string;
  cartItems: CartItem[];
}

export interface CartTotal {
  totalItems: number;
  totalPrice: number;
  discountAmount: number;
  finalPrice: number;
}

export interface AddToCartRequest {
  productId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: string;
  unitPrice?: string;
  createdAt: string;
  product: Product;
}

export interface ShippingAddress {
  fullName?: string;
  phone?: string;
  addressLine?: string;
  city?: string;
  note?: string;
}

export interface Order {
  id: number;
  userId: number;
  total: string;
  status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  createdAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
    roleId: number;
    createdAt: string;
  };
  orderItems: OrderItem[];
  shippingAddress?: ShippingAddress;
}

// userId илгээхгүй — сервер нэвтэрсэн хэрэглэгчийг token-оос уншина,
// token-гүй бол зочны захиалга (userId=null) болно
export interface CreateOrderRequest {
  orderItems: {
    productId: number;
    quantity: number;
  }[];
  shippingAddress: {
    fullName: string;
    phone: string;
    city: string;
    addressLine: string;
    note?: string;
  };
}

export interface UpdateOrderStatusRequest {
  status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";
}

export interface ProductCategory {
  id: number;
  name: string;
  description: string;
  parentId?: number | null;
  parent?: ProductCategory | null;
  children?: ProductCategory[];
  image?: string | null;
  isFeatured?: boolean;
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
  // Хямдарсан үнэ (null бол хямдралгүй); price нь үндсэн үнэ хэвээрээ
  salePrice?: string | null;
  // Virtual талбар: salePrice тавигдсан үед хэдэн хувь хямдарсныг бүхэл тоогоор буцаана
  discountPercentage?: number | null;
  stock: number;
  categoryId?: number | null;
  status: "ACTIVE" | "INACTIVE";
  type?: "PRODUCT" | "INFO";
  isFeatured?: boolean;
  images: string[] | string | null;
  averageRating: string;
  ratingCount: number;
  // Facebook sync талбарууд
  facebookPostId?: string | null;
  permalinkUrl?: string | null;
  postedAt?: string | null;
  lastSyncedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  category?: ProductCategory | null;
  ratings?: ProductRating[];
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId?: number;
  status: "ACTIVE" | "INACTIVE";
  images?: File[];
}

export interface UpdateProductRequest {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId?: number;
  status: "ACTIVE" | "INACTIVE";
  images?: File[];
}

export interface FacebookSyncResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
}

export interface CreateProductCategoryRequest {
  name: string;
  description: string;
  parentId?: number;
  image?: File;
  isFeatured?: boolean;
}

export interface Banner {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  link: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBannerRequest {
  title: string;
  description?: string;
  link?: string;
  image: File;
  sortOrder: number;
  isActive: boolean;
}

export interface UpdateBannerRequest {
  title: string;
  description?: string;
  link?: string;
  image?: File;
  sortOrder: number;
  isActive: boolean;
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

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private getAuthHeaders(isMultipart: boolean = false): Record<string, string> {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const headers: Record<string, string> = {};

    if (!isMultipart) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }
    return response.json();
  }

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

    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));

    return data;
  }

  async register(credentials: RegisterCredentials): Promise<LoginResponse> {
    const registerData = {
      ...credentials,
      role: credentials.role || "USER",
    };

    const response = await fetch(
      `${this.baseURL}${API_ENDPOINTS.AUTH.REGISTER}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerData),
      }
    );

    const data = await this.handleResponse<LoginResponse>(response);

    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));

    return data;
  }

  /**
   * Token-г backend дээр баталгаажуулна.
   * - Хүчинтэй бол шинэ хэрэглэгчийн мэдээлэл буцаана
   * - 401/403 (хуучирсан, өөр backend-ийн token) бол null буцаана
   * - Сүлжээ/серверийн бусад алдаанд exception шиднэ
   */
  async validateSession(): Promise<User | null> {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) return null;

    const response = await fetch(
      `${this.baseURL}${API_ENDPOINTS.AUTH.CURRENT_USER}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );

    if (response.status === 401 || response.status === 403) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
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

      const response = await fetch(
        `${this.baseURL}${API_ENDPOINTS.AUTH.REFRESH}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${refreshToken}`,
          },
        }
      );

      const data = await this.handleResponse<{ access_token: string }>(
        response
      );
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token);

      return data.access_token;
    } catch (error) {
      console.error("Token refresh error:", error);
      this.logout();
      return null;
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(
      `${this.baseURL}${API_ENDPOINTS.AUTH.CURRENT_USER}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    console.log("getCurrentUser: ", response);

    return this.handleResponse<User>(response);
  }

  async updateProfile(payload: {
    name: string;
    email: string;
    roleId?: number;
  }): Promise<User> {
    const response = await fetch(`${this.baseURL}/users/profile`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const updated = await this.handleResponse<User>(response);

    try {
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updated));
    } catch (e) {
      // ignore localStorage errors
    }

    return updated;
  }

  async changePassword(payload: {
    oldPassword: string;
    newPassword: string;
  }): Promise<{ message?: string } | void> {
    const response = await fetch(`${this.baseURL}/users/change-password`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `HTTP error! status: ${response.status}`);
    }

    return response.json().catch(() => undefined);
  }

  async getAllProducts(): Promise<Product[]> {
    const response = await fetch(
      `${this.baseURL}${API_ENDPOINTS.PRODUCTS.ALL}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );

    return this.handleResponse<Product[]>(response);
  }

  // search/categoryId/type шүүлтүүрүүд хослож болно.
  // Үндсэн категори өгвөл дэд категориудын бараа автоматаар хамрагдана.
  async getProducts(params?: {
    type?: "PRODUCT" | "INFO";
    categoryId?: number;
    search?: string;
  }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.type) query.append("type", params.type);
    if (params?.categoryId) query.append("categoryId", params.categoryId.toString());
    if (params?.search?.trim()) query.append("search", params.search.trim());

    const url = `${this.baseURL}${API_ENDPOINTS.SHOP.PRODUCTS}${
      query.toString() ? `?${query.toString()}` : ""
    }`;

    const response = await fetch(url, {
      method: "GET",
    });

    return this.handleResponse<Product[]>(response);
  }

  async getFeaturedProducts(): Promise<Product[]> {
    const response = await fetch(`${this.baseURL}/products/featured`, {
      method: "GET",
    });

    return this.handleResponse<Product[]>(response);
  }

  async featureProduct(id: number): Promise<Product> {
    const response = await fetch(`${this.baseURL}/products/${id}/feature`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<Product>(response);
  }

  async unfeatureProduct(id: number): Promise<Product> {
    const response = await fetch(`${this.baseURL}/products/${id}/feature`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<Product>(response);
  }

  // Үндсэн категориудыг дэд категориудтай нь nested байдлаар буцаана
  async getMainCategories(): Promise<ProductCategory[]> {
    const response = await fetch(`${this.baseURL}/products/categories/main`, {
      method: "GET",
    });

    return this.handleResponse<ProductCategory[]>(response);
  }

  async getProductCategories(): Promise<ProductCategory[]> {
    const response = await fetch(
      `${this.baseURL}${API_ENDPOINTS.SHOP.PRODUCT_CATEGORIES}`,
      {
        method: "GET",
      }
    );

    return this.handleResponse<ProductCategory[]>(response);
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    const response = await fetch(
      `${this.baseURL}${API_ENDPOINTS.SHOP.PRODUCTS_BY_CATEGORY}/${categoryId}`,
      {
        method: "GET",
      }
    );

    return this.handleResponse<Product[]>(response);
  }

  async getAdminProductCategories(): Promise<ProductCategory[]> {
    const response = await fetch(
      `${this.baseURL}${API_ENDPOINTS.PRODUCTS.CATEGORIES}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );

    return this.handleResponse<ProductCategory[]>(response);
  }

  async getUsers(): Promise<AdminUser[]> {
    const response = await fetch(
      `${this.baseURL}${API_ENDPOINTS.ADMIN.ALL_USERS}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );

    return this.handleResponse<AdminUser[]>(response);
  }

  async updateUser(
    id: number,
    userData: UpdateUserRequest
  ): Promise<AdminUser> {
    const response = await fetch(
      `${this.baseURL}${API_ENDPOINTS.ADMIN.UPDATE_USER}/${id}`,
      {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData),
      }
    );

    return this.handleResponse<AdminUser>(response);
  }

  async deleteUser(id: number): Promise<void> {
    const response = await fetch(
      `${this.baseURL}${API_ENDPOINTS.ADMIN.DELETE_USER}/${id}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async createProduct(productData: CreateProductRequest): Promise<Product> {
    const formData = new FormData();
    formData.append("name", productData.name);
    formData.append("description", productData.description);
    formData.append("price", productData.price.toString());
    formData.append("stock", productData.stock.toString());
    if (productData.categoryId) {
      formData.append("categoryId", productData.categoryId.toString());
    }
    formData.append("status", productData.status);

    if (productData.images && productData.images.length > 0) {
      productData.images.forEach((image) => {
        formData.append("images", image);
      });
    }

    const authHeaders = this.getAuthHeaders();
    delete authHeaders["Content-Type"];

    const response = await fetch(
      `${this.baseURL}${API_ENDPOINTS.PRODUCTS.CREATE}`,
      {
        method: "POST",
        headers: authHeaders,
        body: formData,
      }
    );

    return this.handleResponse<Product>(response);
  }

  async updateProduct(
    id: number,
    productData: UpdateProductRequest
  ): Promise<Product> {
    const formData = new FormData();
    formData.append("name", productData.name);
    formData.append("description", productData.description);
    formData.append("price", productData.price.toString());
    formData.append("stock", productData.stock.toString());
    if (productData.categoryId) {
      formData.append("categoryId", productData.categoryId.toString());
    }
    formData.append("status", productData.status);

    if (productData.images && productData.images.length > 0) {
      productData.images.forEach((image) => {
        formData.append("images", image);
      });
    }

    const authHeaders = this.getAuthHeaders();
    delete authHeaders["Content-Type"];

    const response = await fetch(
      `${this.baseURL}${API_ENDPOINTS.PRODUCTS.UPDATE}/${id}`,
      {
        method: "PATCH",
        headers: authHeaders,
        body: formData,
      }
    );

    return this.handleResponse<Product>(response);
  }

  async deleteProduct(id: number): Promise<void> {
    const response = await fetch(
      `${this.baseURL}${API_ENDPOINTS.PRODUCTS.DELETE}/${id}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  // Барааны зарим талбарыг JSON-оор хэсэгчлэн шинэчилнэ (inline засварт зориулсан)
  async patchProduct(
    id: number,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      stock: number;
      categoryId: number | null;
      status: "ACTIVE" | "INACTIVE";
      salePrice: number | null;
    }>
  ): Promise<Product> {
    const response = await fetch(
      `${this.baseURL}${API_ENDPOINTS.PRODUCTS.UPDATE}/${id}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );

    return this.handleResponse<Product>(response);
  }

  // Хямдрал тавих (salePrice: тоо) эсвэл болиулах (salePrice: null)
  async setSalePrice(id: number, salePrice: number | null): Promise<Product> {
    return this.patchProduct(id, { salePrice });
  }

  async syncFacebookProducts(): Promise<FacebookSyncResult> {
    const response = await fetch(`${this.baseURL}/products/sync-facebook`, {
      method: "POST",
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<FacebookSyncResult>(response);
  }

  // Онцолсон категориуд (дэд категориудтайгаа) — нүүрний "Онцлох ангилал" хэсэгт
  async getFeaturedCategories(): Promise<ProductCategory[]> {
    const response = await fetch(`${this.baseURL}/products/categories/featured`, {
      method: "GET",
    });

    return this.handleResponse<ProductCategory[]>(response);
  }

  private buildCategoryFormData(
    categoryData: Partial<CreateProductCategoryRequest>
  ): FormData {
    const formData = new FormData();
    if (categoryData.name !== undefined) formData.append("name", categoryData.name);
    if (categoryData.description !== undefined) {
      formData.append("description", categoryData.description);
    }
    if (categoryData.parentId) {
      formData.append("parentId", categoryData.parentId.toString());
    }
    if (categoryData.isFeatured !== undefined) {
      formData.append("isFeatured", categoryData.isFeatured.toString());
    }
    if (categoryData.image) {
      formData.append("image", categoryData.image);
    }
    return formData;
  }

  async createProductCategory(
    categoryData: CreateProductCategoryRequest
  ): Promise<ProductCategory> {
    const response = await fetch(
      `${this.baseURL}${API_ENDPOINTS.PRODUCTS.CATEGORIES_CREATE}`,
      {
        method: "POST",
        headers: this.getAuthHeaders(true),
        body: this.buildCategoryFormData(categoryData),
      }
    );

    return this.handleResponse<ProductCategory>(response);
  }

  async updateProductCategory(
    id: number,
    categoryData: Partial<CreateProductCategoryRequest>
  ): Promise<ProductCategory> {
    const response = await fetch(
      `${this.baseURL}${API_ENDPOINTS.PRODUCTS.CATEGORIES}/${id}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(true),
        body: this.buildCategoryFormData(categoryData),
      }
    );

    return this.handleResponse<ProductCategory>(response);
  }

  async deleteProductCategory(id: number): Promise<void> {
    const response = await fetch(
      `${this.baseURL}${API_ENDPOINTS.PRODUCTS.CATEGORIES_DELETE}/${id}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async addToCart(
    userId: number,
    productData: AddToCartRequest
  ): Promise<Cart> {
    const response = await fetch(`${this.baseURL}/cart/${userId}/add`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(productData),
    });

    return this.handleResponse<Cart>(response);
  }

  async getUserCart(userId: number): Promise<Cart> {
    const response = await fetch(`${this.baseURL}/cart/${userId}`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<Cart>(response);
  }

  async getCartTotal(userId: number): Promise<CartTotal> {
    const response = await fetch(`${this.baseURL}/cart/${userId}/total`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<CartTotal>(response);
  }

  async updateCartItemQuantity(
    userId: number,
    itemId: number,
    quantityData: UpdateCartItemRequest
  ): Promise<Cart> {
    const response = await fetch(
      `${this.baseURL}/cart/${userId}/items/${itemId}`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(quantityData),
      }
    );

    return this.handleResponse<Cart>(response);
  }

  async removeCartItem(userId: number, itemId: number): Promise<void> {
    const response = await fetch(
      `${this.baseURL}/cart/${userId}/items/${itemId}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async clearCart(userId: number): Promise<void> {
    const response = await fetch(`${this.baseURL}/cart/${userId}/clear`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    const response = await fetch(`${this.baseURL}/orders`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(orderData),
    });

    return this.handleResponse<Order>(response);
  }

  async getAllOrders(): Promise<Order[]> {
    const response = await fetch(`${this.baseURL}/orders`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<Order[]>(response);
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    const response = await fetch(`${this.baseURL}/orders/my-orders/${userId}`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<Order[]>(response);
  }

  async updateOrderStatus(
    orderId: number,
    statusData: UpdateOrderStatusRequest
  ): Promise<Order> {
    const response = await fetch(`${this.baseURL}/orders/${orderId}`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(statusData),
    });

    return this.handleResponse<Order>(response);
  }

  async markOrderAsPaid(orderId: number): Promise<Order> {
    const response = await fetch(
      `${this.baseURL}/orders/${orderId}/mark-paid`,
      {
        method: "PATCH",
        headers: this.getAuthHeaders(),
      }
    );

    return this.handleResponse<Order>(response);
  }

  async getBanners(): Promise<Banner[]> {
    const response = await fetch(`${this.baseURL}/banners`, {
      method: "GET",
    });

    return this.handleResponse<Banner[]>(response);
  }

  async getActiveBanners(): Promise<Banner[]> {
    const response = await fetch(`${this.baseURL}/banners/active`, {
      method: "GET",
    });

    return this.handleResponse<Banner[]>(response);
  }

  private async patchBannerJson(
    id: number,
    bannerData: UpdateBannerRequest
  ): Promise<Banner> {
    const response = await fetch(`${this.baseURL}/banners/${id}`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        title: bannerData.title,
        description: bannerData.description ?? undefined,
        link: bannerData.link ?? undefined,
        sortOrder: bannerData.sortOrder,
        isActive: bannerData.isActive,
      }),
    });

    return this.handleResponse<Banner>(response);
  }

  async createBanner(bannerData: CreateBannerRequest): Promise<Banner> {
    const formData = new FormData();
    formData.append("title", bannerData.title);
    if (bannerData.description) formData.append("description", bannerData.description);
    if (bannerData.link) formData.append("link", bannerData.link);
    formData.append("sortOrder", bannerData.sortOrder.toString());
    formData.append("isActive", bannerData.isActive.toString());
    formData.append("image", bannerData.image);

    const response = await fetch(`${this.baseURL}/banners`, {
      method: "POST",
      headers: this.getAuthHeaders(true),
      body: formData,
    });

    // Fallback: parse-form-data pipe ажиллаагүй хуучин backend дээр
    // sortOrder/isActive нь multipart-аар string очиж 400 буцаадаг —
    // тэдгээргүйгээр үүсгээд JSON PATCH-аар нөхөж тохируулна
    if (response.status === 400) {
      const fallbackForm = new FormData();
      fallbackForm.append("title", bannerData.title);
      if (bannerData.description) fallbackForm.append("description", bannerData.description);
      if (bannerData.link) fallbackForm.append("link", bannerData.link);
      fallbackForm.append("image", bannerData.image);

      const fallbackResponse = await fetch(`${this.baseURL}/banners`, {
        method: "POST",
        headers: this.getAuthHeaders(true),
        body: fallbackForm,
      });

      const created = await this.handleResponse<Banner>(fallbackResponse);
      return this.patchBannerJson(created.id, bannerData);
    }

    return this.handleResponse<Banner>(response);
  }

  async updateBanner(
    id: number,
    bannerData: UpdateBannerRequest
  ): Promise<Banner> {
    if (bannerData.image) {
      const formData = new FormData();
      formData.append("title", bannerData.title);
      if (bannerData.description) formData.append("description", bannerData.description);
      if (bannerData.link) formData.append("link", bannerData.link);
      formData.append("sortOrder", bannerData.sortOrder.toString());
      formData.append("isActive", bannerData.isActive.toString());
      formData.append("image", bannerData.image);

      const response = await fetch(`${this.baseURL}/banners/${id}`, {
        method: "PATCH",
        headers: this.getAuthHeaders(true),
        body: formData,
      });

      if (response.status !== 400) {
        return this.handleResponse<Banner>(response);
      }

      // Fallback: хуучин backend — зөвхөн зургийг multipart-аар солиод
      // үлдсэнийг JSON-оор явуулна
      const imageForm = new FormData();
      imageForm.append("image", bannerData.image);

      const imageResponse = await fetch(`${this.baseURL}/banners/${id}`, {
        method: "PATCH",
        headers: this.getAuthHeaders(true),
        body: imageForm,
      });

      await this.handleResponse<Banner>(imageResponse);
    }

    return this.patchBannerJson(id, bannerData);
  }

  async deleteBanner(id: number): Promise<void> {
    const response = await fetch(`${this.baseURL}/banners/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }
}

// Backend-ийн "Insufficient stock" (400) алдааг таних helper
export function isInsufficientStockError(error: unknown): boolean {
  return (
    error instanceof Error && /insufficient stock|нөөц/i.test(error.message)
  );
}

export const apiService = new ApiService();
