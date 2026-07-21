"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Package,
  Tag,
  Eye,
  EyeOff,
  X,
  Save,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Star,
  Percent,
  Search,
  Check,
} from "lucide-react";
import {
  apiService,
  Product,
  ProductCategory,
  CreateProductRequest,
  UpdateProductRequest,
  CreateProductCategoryRequest,
} from "@/services/apiService";
import { useToast } from "@/contexts/ToastContext";
import { API_BASE_URL } from "@/constants/constants";
import Loading from "@/components/Loading";

export default function AdminProducts() {
  // Helper function to convert relative URL to full URL
  const getFullImageUrl = (imageUrl: string): string => {
    if (!imageUrl) return "";
    // If already a full URL, return as is
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }
    // If relative URL, prepend base URL
    return `${API_BASE_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
  };

  // Helper function to safely get image URL
  const getImageUrl = (images: string[] | string | null): string => {
    if (!images) return "";
    if (Array.isArray(images) && images.length > 0) {
      return getFullImageUrl(images[0]);
    }
    if (typeof images === "string") {
      return getFullImageUrl(images);
    }
    return "";
  };

  // Helper function to get image count
  const getImageCount = (images: string[] | string | null): number => {
    if (!images) return 0;
    if (Array.isArray(images)) {
      return images.length;
    }
    return 1;
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [salePriceInput, setSalePriceInput] = useState("");
  const [savingSale, setSavingSale] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Inline засвар: мөр бүрийн өөрчилсөн үнэ/хямдрал/нөөц
  const [rowEdits, setRowEdits] = useState<
    Record<number, { price: string; salePrice: string; stock: string }>
  >({});
  const [savingRowId, setSavingRowId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [quickFilter, setQuickFilter] = useState<"all" | "needsAttention" | "sale" | "info">("all");
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const { showToast } = useToast();

  const defaultFormData: CreateProductRequest = {
    name: "",
    description: "",
    price: 0,
    stock: 0,
    categoryId: 0,
    status: "ACTIVE",
    images: [],
  };

  const [formData, setFormData] = useState<CreateProductRequest>(defaultFormData);
  const [categoryFormData, setCategoryFormData] = useState<CreateProductCategoryRequest>({
    name: "",
    description: "",
  });
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState<string | null>(null);
  const [categoryIsFeatured, setCategoryIsFeatured] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsResponse, categoriesResponse] = await Promise.all([
        apiService.getAllProducts(),
        apiService.getAdminProductCategories(),
      ]);
      setProducts(productsResponse);
      setCategories(categoriesResponse);
    } catch (error) {
      console.error("Error fetching data:", error);
      showToast("Failed to fetch data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Limit maximum images to 10
      const maxImages = 10;
      const currentImageCount = selectedFiles.length;
      const availableSlots = maxImages - currentImageCount;

      if (availableSlots <= 0) {
        showToast(`Maximum ${maxImages} images allowed`, "error");
        return;
      }

      const filesToAdd = files.slice(0, availableSlots);
      if (filesToAdd.length < files.length) {
        showToast(
          `Only ${filesToAdd.length} images added. Maximum ${maxImages} images allowed.`,
          "error",
        );
      }

      const newFiles = [...selectedFiles, ...filesToAdd];
      setSelectedFiles(newFiles);
      setFormData({ ...formData, images: newFiles });

      // Create preview URLs for new files only
      const newPreviews = filesToAdd.map(file => URL.createObjectURL(file));
      const allPreviews = [...previewImages, ...newPreviews];
      setPreviewImages(allPreviews);

      // Clear the input value to allow selecting the same files again
      e.target.value = "";
    }
  };

  const removePreviewImage = (indexToRemove: number) => {
    const newFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
    const newPreviews = previewImages.filter((_, index) => index !== indexToRemove);

    // Revoke the URL to prevent memory leaks
    URL.revokeObjectURL(previewImages[indexToRemove]);

    setSelectedFiles(newFiles);
    setPreviewImages(newPreviews);
    setFormData({ ...formData, images: newFiles });
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createProduct(formData);
      showToast("Product created successfully!", "success");
      setShowCreateModal(false);
      setFormData(defaultFormData);
      setPreviewImages([]);
      fetchData();
    } catch (error) {
      console.error("Error creating product:", error);
      showToast("Failed to create product", "error");
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const updateData: UpdateProductRequest = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        stock: formData.stock,
        categoryId: formData.categoryId,
        status: formData.status,
        images: formData.images,
      };

      await apiService.updateProduct(selectedProduct.id, updateData);
      showToast("Product updated successfully!", "success");
      setShowEditModal(false);
      setSelectedProduct(null);
      setFormData(defaultFormData);
      setPreviewImages([]);
      fetchData();
    } catch (error) {
      console.error("Error updating product:", error);
      showToast("Failed to update product", "error");
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await apiService.deleteProduct(productId);
      showToast("Product deleted successfully!", "success");
      fetchData();
    } catch (error) {
      console.error("Error deleting product:", error);
      showToast("Failed to delete product", "error");
    }
  };

  const handleRowEdit = (
    productId: number,
    field: "price" | "salePrice" | "stock",
    value: string,
  ) => {
    setRowEdits(prev => {
      const product = products.find(p => p.id === productId);
      const current = prev[productId] || {
        price: product ? String(parseFloat(product.price) || 0) : "0",
        salePrice: product?.salePrice ? String(parseFloat(product.salePrice)) : "",
        stock: product ? String(product.stock) : "0",
      };
      return { ...prev, [productId]: { ...current, [field]: value } };
    });
  };

  const isRowDirty = (product: Product) => {
    const edit = rowEdits[product.id];
    if (!edit) return false;
    const currentSale = product.salePrice ? parseFloat(product.salePrice) : null;
    const editedSale = edit.salePrice.trim() ? parseFloat(edit.salePrice) : null;
    return (
      parseFloat(edit.price || "0") !== (parseFloat(product.price) || 0) ||
      parseInt(edit.stock || "0") !== product.stock ||
      editedSale !== currentSale
    );
  };

  const handleRowSave = async (product: Product) => {
    const edit = rowEdits[product.id];
    if (!edit) return;

    const price = parseFloat(edit.price);
    const stock = parseInt(edit.stock);
    const salePrice = edit.salePrice.trim() ? parseFloat(edit.salePrice) : null;

    if (isNaN(price) || price < 0) {
      showToast("Үнэ буруу байна", "error");
      return;
    }
    if (isNaN(stock) || stock < 0) {
      showToast("Нөөц буруу байна", "error");
      return;
    }
    if (salePrice !== null && (isNaN(salePrice) || salePrice <= 0)) {
      showToast("Хямдрал үнэ буруу байна", "error");
      return;
    }
    if (salePrice !== null && salePrice >= price) {
      showToast("Хямдрал үнэ үндсэн үнээс бага байх ёстой", "error");
      return;
    }

    setSavingRowId(product.id);
    try {
      const updated = await apiService.patchProduct(product.id, { price, stock, salePrice });
      setProducts(prev => prev.map(p => (p.id === product.id ? { ...p, ...updated } : p)));
      setRowEdits(prev => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
      showToast(`"${product.name}" хадгалагдлаа`, "success");
    } catch (error) {
      console.error("Error saving row:", error);
      showToast("Хадгалахад алдаа гарлаа", "error");
    } finally {
      setSavingRowId(null);
    }
  };

  const handleRowCancel = (productId: number) => {
    setRowEdits(prev => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const handleToggleStatus = async (product: Product) => {
    const newStatus = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await apiService.patchProduct(product.id, { status: newStatus });
      setProducts(prev => prev.map(p => (p.id === product.id ? { ...p, status: newStatus } : p)));
      showToast(newStatus === "ACTIVE" ? "Идэвхтэй боллоо" : "Идэвхгүй боллоо", "success");
    } catch (error) {
      console.error("Error toggling status:", error);
      showToast("Төлөв өөрчлөхөд алдаа гарлаа", "error");
    }
  };

  // Хайлт + шүүлтүүр
  const filteredProducts = products.filter(product => {
    if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (quickFilter === "needsAttention") {
      return parseFloat(product.price) <= 0 || product.stock <= 0;
    }
    if (quickFilter === "sale") {
      return !!product.discountPercentage;
    }
    if (quickFilter === "info") {
      return product.type === "INFO";
    }
    return true;
  });

  const needsAttentionCount = products.filter(p => parseFloat(p.price) <= 0 || p.stock <= 0).length;

  const openSaleModal = (product: Product) => {
    // Үндсэн үнэгүй бараанд хямдрал тавих боломжгүй
    if (parseFloat(product.price) <= 0) {
      showToast("Эхлээд барааны үндсэн үнийг оруулна уу", "error");
      return;
    }
    setSelectedProduct(product);
    setSalePriceInput(product.salePrice ? String(parseFloat(product.salePrice)) : "");
    setShowSaleModal(true);
  };

  const handleSetSalePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const value = parseFloat(salePriceInput);
    if (!value || value <= 0) {
      showToast("Хямдарсан үнээ оруулна уу", "error");
      return;
    }
    if (value >= parseFloat(selectedProduct.price)) {
      showToast("Хямдарсан үнэ үндсэн үнээс бага байх ёстой", "error");
      return;
    }

    setSavingSale(true);
    try {
      await apiService.setSalePrice(selectedProduct.id, value);
      showToast("Хямдрал тавигдлаа", "success");
      setShowSaleModal(false);
      setSelectedProduct(null);
      fetchData();
    } catch (error) {
      console.error("Error setting sale price:", error);
      showToast(error instanceof Error ? error.message : "Хямдрал тавихад алдаа гарлаа", "error");
    } finally {
      setSavingSale(false);
    }
  };

  const handleRemoveSale = async () => {
    if (!selectedProduct) return;

    setSavingSale(true);
    try {
      await apiService.setSalePrice(selectedProduct.id, null);
      showToast("Хямдрал болиулагдлаа", "success");
      setShowSaleModal(false);
      setSelectedProduct(null);
      fetchData();
    } catch (error) {
      console.error("Error removing sale price:", error);
      showToast("Хямдрал болиулахад алдаа гарлаа", "error");
    } finally {
      setSavingSale(false);
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      if (product.isFeatured) {
        await apiService.unfeatureProduct(product.id);
        showToast("Онцлохоо болиуллаа", "success");
      } else {
        await apiService.featureProduct(product.id);
        showToast("Бараа онцлогдлоо — нүүр хуудсанд харагдана", "success");
      }
      // Жагсаалтыг дахин татахгүйгээр локал төлвийг шинэчилнэ
      setProducts(prev =>
        prev.map(p => (p.id === product.id ? { ...p, isFeatured: !p.isFeatured } : p)),
      );
    } catch (error) {
      console.error("Error toggling featured:", error);
      showToast("Онцлох төлөв өөрчлөхөд алдаа гарлаа", "error");
    }
  };

  const handleFacebookSync = async () => {
    setSyncing(true);
    try {
      const result = await apiService.syncFacebookProducts();
      showToast(
        `Sync дууслаа: нийт ${result.total}, шинээр ${result.created}, шинэчилсэн ${result.updated}, алгассан ${result.skipped}`,
        "success",
      );
      fetchData();
    } catch (error) {
      console.error("Facebook sync error:", error);
      showToast(
        error instanceof Error ? error.message : "Facebook sync хийхэд алдаа гарлаа",
        "error",
      );
    } finally {
      setSyncing(false);
    }
  };

  const resetCategoryForm = () => {
    setCategoryFormData({ name: "", description: "" });
    setCategoryImageFile(null);
    setCategoryImagePreview(null);
    setCategoryIsFeatured(false);
    setEditingCategory(null);
  };

  const openEditCategoryModal = (category: ProductCategory) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description,
      parentId: category.parentId ?? undefined,
    });
    setCategoryIsFeatured(!!category.isFeatured);
    setCategoryImageFile(null);
    setCategoryImagePreview(category.image ? getFullImageUrl(category.image) : null);
    setShowCategoryModal(true);
  };

  const handleCategoryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Зургийн хэмжээ 5MB-аас хэтэрч болохгүй", "error");
      return;
    }

    setCategoryImageFile(file);
    setCategoryImagePreview(URL.createObjectURL(file));
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await apiService.updateProductCategory(editingCategory.id, {
          name: categoryFormData.name,
          description: categoryFormData.description,
          image: categoryImageFile || undefined,
          isFeatured: categoryIsFeatured,
        });
        showToast("Ангилал шинэчлэгдлээ", "success");
      } else {
        await apiService.createProductCategory({
          ...categoryFormData,
          image: categoryImageFile || undefined,
          isFeatured: categoryIsFeatured,
        });
        showToast("Ангилал үүслээ", "success");
      }
      setShowCategoryModal(false);
      resetCategoryForm();
      fetchData();
    } catch (error) {
      console.error("Error saving category:", error);
      showToast(
        error instanceof Error ? error.message : "Ангилал хадгалахад алдаа гарлаа",
        "error"
      );
    }
  };

  const handleToggleCategoryFeatured = async (category: ProductCategory) => {
    try {
      await apiService.updateProductCategory(category.id, {
        isFeatured: !category.isFeatured,
      });
      showToast(
        category.isFeatured
          ? "Ангилал онцлохоо болилоо"
          : "Ангилал онцлогдлоо — нүүр хуудсанд харагдана",
        "success"
      );
      fetchData();
    } catch (error) {
      console.error("Error toggling category featured:", error);
      showToast("Онцлох төлөв өөрчлөхөд алдаа гарлаа", "error");
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      await apiService.deleteProductCategory(categoryId);
      showToast("Category deleted successfully!", "success");
      fetchData();
    } catch (error) {
      console.error("Error deleting category:", error);
      showToast("Failed to delete category", "error");
    }
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      stock: product.stock,
      categoryId: product.categoryId || 0,
      status: product.status,
      images: [],
    });
    setShowEditModal(true);
  };

  const openImageModal = (product: Product) => {
    setSelectedProduct(product);
    setShowImageModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Package className="text-blue-600" />
          Products Management
        </h1>
        <div className="flex gap-3">
          <button
            onClick={handleFacebookSync}
            disabled={syncing}
            className="bg-[#1877F2] hover:bg-[#0f5cc4] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            title="Facebook хуудасны постуудаас бараа татах"
          >
            <RefreshCw size={20} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Sync хийж байна..." : "Facebook-ээс sync"}
          </button>
          <button
            onClick={() => setShowCategoryModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Tag size={20} />
            Add Category
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Add Product
          </button>
        </div>
      </div>

      {/* Categories Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories
            .filter(category => !category.parentId)
            .map(category => {
              const children = categories.filter(c => c.parentId === category.id);
              return (
                <div key={category.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {category.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getFullImageUrl(category.image)}
                          alt={category.name}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">{category.name}</h3>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {category.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center flex-shrink-0">
                      <button
                        onClick={() => handleToggleCategoryFeatured(category)}
                        className={`p-1 transition-colors ${
                          category.isFeatured
                            ? "text-yellow-500 hover:text-yellow-600"
                            : "text-gray-300 hover:text-yellow-500"
                        }`}
                        title={
                          category.isFeatured
                            ? "Онцлохоо болиулах"
                            : "Онцлох (нүүрэнд гаргах)"
                        }
                      >
                        <Star size={16} className={category.isFeatured ? "fill-current" : ""} />
                      </button>
                      <button
                        onClick={() => openEditCategoryModal(category)}
                        className="text-indigo-600 hover:text-indigo-900 p-1"
                        title="Засах (зураг солих г.м.)"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title={
                          children.length > 0 ? "Эхлээд дэд ангиллуудыг нь устгана" : "Устгах"
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Дэд ангиллууд */}
                  {children.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                      {children.map(child => (
                        <span
                          key={child.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-700"
                        >
                          {child.name}
                          <button
                            onClick={() => handleDeleteCategory(child.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title="Дэд ангилал устгах"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Products Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Products{" "}
              <span className="text-sm font-normal text-gray-400">({filteredProducts.length})</span>
            </h2>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Хайлт */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Барааны нэрээр хайх..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                />
              </div>

              {/* Шүүлтүүр */}
              <div className="flex gap-2">
                <button
                  onClick={() => setQuickFilter("all")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    quickFilter === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Бүгд
                </button>
                <button
                  onClick={() => setQuickFilter("needsAttention")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    quickFilter === "needsAttention"
                      ? "bg-amber-500 text-white"
                      : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                  }`}
                  title="Үнэ эсвэл нөөц тохируулаагүй бараанууд"
                >
                  ⚠ Засах шаардлагатай ({needsAttentionCount})
                </button>
                <button
                  onClick={() => setQuickFilter("sale")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    quickFilter === "sale"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Хямдралтай
                </button>
                <button
                  onClick={() => setQuickFilter("info")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    quickFilter === "info"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  INFO
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            💡 Үнэ болон нөөцийг хүснэгтэн дээр шууд засаад Enter эсвэл ✓ дарж хадгална
          </p>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Хямдрал үнэ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map(product => (
                  <tr
                    key={product.id}
                    className={`hover:bg-gray-50 ${isRowDirty(product) ? "bg-yellow-50" : ""}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 relative group">
                          {getImageUrl(product.images) ? (
                            <>
                              {/* Main cover image */}
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                className="h-10 w-10 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                src={getImageUrl(product.images)}
                                alt={product.name}
                                onClick={() => openImageModal(product)}
                                onError={e => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "";
                                  target.style.display = "none";
                                }}
                              />
                              {/* Image count badge */}
                              {getImageCount(product.images) > 1 && (
                                <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                  {getImageCount(product.images)}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                              <Package size={16} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            {product.facebookPostId && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#1877F2] text-white">
                                FB
                              </span>
                            )}
                            {product.type === "INFO" && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                                INFO
                              </span>
                            )}
                            {product.permalinkUrl && (
                              <a
                                href={product.permalinkUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-gray-400 hover:text-[#1877F2] transition-colors"
                                title="Facebook дээр үзэх"
                                onClick={e => e.stopPropagation()}
                              >
                                <ExternalLink size={13} />
                              </a>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.description.substring(0, 50)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.category?.name || (
                        <span className="text-gray-400 italic">Ангилалгүй</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {parseFloat(product.price) <= 0 && !isRowDirty(product) && (
                          <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
                        )}
                        <input
                          type="number"
                          min="0"
                          value={
                            rowEdits[product.id]?.price ?? String(parseFloat(product.price) || 0)
                          }
                          onChange={e => handleRowEdit(product.id, "price", e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") handleRowSave(product);
                            if (e.key === "Escape") handleRowCancel(product.id);
                          }}
                          className={`w-28 px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            parseFloat(product.price) <= 0 && !isRowDirty(product)
                              ? "border-amber-300 bg-amber-50"
                              : "border-gray-200"
                          }`}
                        />
                        <span className="text-xs text-gray-400">₮</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          placeholder="—"
                          value={
                            rowEdits[product.id]?.salePrice ??
                            (product.salePrice ? String(parseFloat(product.salePrice)) : "")
                          }
                          onChange={e => handleRowEdit(product.id, "salePrice", e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") handleRowSave(product);
                            if (e.key === "Escape") handleRowCancel(product.id);
                          }}
                          className={`w-28 px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            product.discountPercentage
                              ? "border-green-300 bg-green-50"
                              : "border-gray-200"
                          }`}
                          title="Хоосон үлдээвэл хямдралгүй. Утга оруулаад Enter дарж хадгална"
                        />
                        <span className="text-xs text-gray-400">₮</span>
                      </div>
                      {product.discountPercentage && (
                        <div className="text-xs text-green-600 mt-1">
                          -{product.discountPercentage}%
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {product.stock <= 0 && !isRowDirty(product) && (
                          <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
                        )}
                        <input
                          type="number"
                          min="0"
                          value={rowEdits[product.id]?.stock ?? String(product.stock)}
                          onChange={e => handleRowEdit(product.id, "stock", e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") handleRowSave(product);
                            if (e.key === "Escape") handleRowCancel(product.id);
                          }}
                          className={`w-20 px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            product.stock <= 0 && !isRowDirty(product)
                              ? "border-amber-300 bg-amber-50"
                              : "border-gray-200"
                          }`}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(product)}
                        className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full transition-opacity hover:opacity-70 cursor-pointer ${
                          product.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                        title="Дарж идэвхтэй/идэвхгүй болгоно"
                      >
                        {product.status === "ACTIVE" ? (
                          <>
                            <Eye size={12} className="mr-1" /> Active
                          </>
                        ) : (
                          <>
                            <EyeOff size={12} className="mr-1" /> Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {isRowDirty(product) && (
                        <>
                          <button
                            onClick={() => handleRowSave(product)}
                            disabled={savingRowId === product.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                            title="Өөрчлөлтийг хадгалах (Enter)"
                          >
                            {savingRowId === product.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            ) : (
                              <Check size={14} />
                            )}
                            Хадгалах
                          </button>
                          <button
                            onClick={() => handleRowCancel(product.id)}
                            className="text-gray-400 hover:text-gray-600 p-1"
                            title="Болих (Esc)"
                          >
                            <X size={14} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleToggleFeatured(product)}
                        className={`p-1 transition-colors ${
                          product.isFeatured
                            ? "text-yellow-500 hover:text-yellow-600"
                            : "text-gray-300 hover:text-yellow-500"
                        }`}
                        title={product.isFeatured ? "Онцлохоо болиулах" : "Онцлох (нүүрэнд гаргах)"}
                      >
                        <Star size={16} className={product.isFeatured ? "fill-current" : ""} />
                      </button>
                      <button
                        onClick={() => openSaleModal(product)}
                        className={`p-1 transition-colors ${
                          product.discountPercentage
                            ? "text-green-600 hover:text-green-800"
                            : "text-gray-400 hover:text-green-600"
                        }`}
                        title={
                          product.discountPercentage
                            ? `Хямдралтай (-${product.discountPercentage}%) — засах`
                            : "Хямдрал тавих"
                        }
                      >
                        <Percent size={16} />
                      </button>
                      <button
                        onClick={() => openImageModal(product)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="View Images"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => openEditModal(product)}
                        className="text-indigo-600 hover:text-indigo-900 p-1"
                        title="Edit Product"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete Product"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Create New Product</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData(defaultFormData);
                  // Clean up preview URLs
                  previewImages.forEach(url => URL.revokeObjectURL(url));
                  setPreviewImages([]);
                  setSelectedFiles([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.price}
                    onChange={e =>
                      setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.stock}
                    onChange={e =>
                      setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-gray-400 font-normal">(заавал биш)</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.categoryId || 0}
                    onChange={e =>
                      setFormData({ ...formData, categoryId: parseInt(e.target.value) })
                    }
                  >
                    <option value={0}>Ангилалгүй</option>
                    {categories
                      .filter(c => !c.parentId)
                      .map(main => [
                        <option key={main.id} value={main.id}>
                          {main.name}
                        </option>,
                        ...categories
                          .filter(c => c.parentId === main.id)
                          .map(child => (
                            <option key={child.id} value={child.id}>
                              {"   — "}
                              {child.name}
                            </option>
                          )),
                      ])}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.status}
                    onChange={e =>
                      setFormData({ ...formData, status: e.target.value as "ACTIVE" | "INACTIVE" })
                    }
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Images
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>• Select multiple images at once (max: 10 images)</p>
                    <p>• First image will be the cover image</p>
                    <p>• Supported formats: JPG, PNG, GIF, WebP</p>
                    <p>• Hover over images to remove individual images</p>
                  </div>
                </div>
                {previewImages.length > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-gray-600">
                        {previewImages.length} / 10 image(s) selected
                      </p>
                      {previewImages.length >= 10 ? (
                        <span className="text-xs text-orange-500 font-medium">Maximum reached</span>
                      ) : (
                        <p className="text-xs text-gray-500">First image will be the cover</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {previewImages.map((url, index) => (
                        <div key={index} className="relative group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-20 h-20 object-cover rounded border"
                          />
                          {/* Cover badge */}
                          {index === 0 && (
                            <div className="absolute -top-1 -left-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded-sm">
                              Cover
                            </div>
                          )}
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => removePreviewImage(index)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                          {/* Order number */}
                          <div className="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white text-xs px-1 rounded-tl">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Tip: You can drag and drop files to reorder them (cover image first)
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData(defaultFormData);
                    setPreviewImages([]);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Save size={16} />
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Edit Product</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedProduct(null);
                  setFormData(defaultFormData);
                  setPreviewImages([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.price}
                    onChange={e =>
                      setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.stock}
                    onChange={e =>
                      setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-gray-400 font-normal">(заавал биш)</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.categoryId || 0}
                    onChange={e =>
                      setFormData({ ...formData, categoryId: parseInt(e.target.value) })
                    }
                  >
                    <option value={0}>Ангилалгүй</option>
                    {categories
                      .filter(c => !c.parentId)
                      .map(main => [
                        <option key={main.id} value={main.id}>
                          {main.name}
                        </option>,
                        ...categories
                          .filter(c => c.parentId === main.id)
                          .map(child => (
                            <option key={child.id} value={child.id}>
                              {"   — "}
                              {child.name}
                            </option>
                          )),
                      ])}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.status}
                    onChange={e =>
                      setFormData({ ...formData, status: e.target.value as "ACTIVE" | "INACTIVE" })
                    }
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Product Images
                </label>

                {/* Show current images */}
                {selectedProduct.images && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">
                      Current images (will be replaced if new images are uploaded):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(selectedProduct.images) ? (
                        selectedProduct.images.map((imageUrl, index) => (
                          <div key={index} className="relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getFullImageUrl(imageUrl)}
                              alt={`Current ${index + 1}`}
                              className="w-16 h-16 object-cover rounded border"
                              onError={e => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                              }}
                            />
                            {index === 0 && (
                              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1 rounded">
                                Cover
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getFullImageUrl(selectedProduct.images)}
                            alt="Current"
                            className="w-16 h-16 object-cover rounded border"
                            onError={e => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                            }}
                          />
                          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1 rounded">
                            Cover
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload New Images (Optional)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="text-xs text-gray-500 mt-1 space-y-1">
                  <p>
                    Leave empty to keep current images. Upload new images to replace all current
                    images.
                  </p>
                  <p>
                    Maximum 10 images allowed. Hover over new images to remove individual images.
                  </p>
                </div>

                {previewImages.length > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-gray-600">
                        New images preview ({previewImages.length} / 10):
                      </p>
                      {previewImages.length >= 10 ? (
                        <span className="text-xs text-orange-500 font-medium">Maximum reached</span>
                      ) : (
                        <p className="text-xs text-gray-500">Will replace all current images</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {previewImages.map((url, index) => (
                        <div key={index} className="relative group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-20 h-20 object-cover rounded border"
                          />
                          {index === 0 && (
                            <div className="absolute -top-1 -left-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded-sm">
                              New Cover
                            </div>
                          )}
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => removePreviewImage(index)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                          {/* Order number */}
                          <div className="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white text-xs px-1 rounded-tl">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedProduct(null);
                    setFormData(defaultFormData);
                    setPreviewImages([]);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Save size={16} />
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sale Price Modal */}
      {showSaleModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-lg w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Хямдрал тохируулах</h2>
              <button
                onClick={() => {
                  setShowSaleModal(false);
                  setSelectedProduct(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSetSalePrice} className="space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-700">{selectedProduct.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Үндсэн үнэ:{" "}
                  {new Intl.NumberFormat("mn-MN").format(parseFloat(selectedProduct.price))}₮
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Хямдарсан үнэ (₮)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={parseFloat(selectedProduct.price) - 1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={salePriceInput}
                  onChange={e => setSalePriceInput(e.target.value)}
                  placeholder="Жишээ: 75000"
                />
                {salePriceInput &&
                  parseFloat(salePriceInput) > 0 &&
                  parseFloat(salePriceInput) < parseFloat(selectedProduct.price) && (
                    <p className="text-xs text-green-600 mt-1">
                      Хямдрал: -
                      {Math.round(
                        (1 - parseFloat(salePriceInput) / parseFloat(selectedProduct.price)) * 100,
                      )}
                      %
                    </p>
                  )}
              </div>

              <div className="flex justify-between items-center">
                {selectedProduct.discountPercentage ? (
                  <button
                    type="button"
                    onClick={handleRemoveSale}
                    disabled={savingSale}
                    className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    Хямдрал болиулах
                  </button>
                ) : (
                  <span></span>
                )}

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSaleModal(false);
                      setSelectedProduct(null);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Болих
                  </button>
                  <button
                    type="submit"
                    disabled={savingSale}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {savingSale ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Percent size={16} className="mr-2" />
                    )}
                    Хадгалах
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Gallery Modal */}
      {showImageModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Product Images - {selectedProduct.name}
              </h2>
              <button
                onClick={() => {
                  setShowImageModal(false);
                  setSelectedProduct(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.isArray(selectedProduct.images) ? (
                selectedProduct.images.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getFullImageUrl(imageUrl)}
                      alt={`${selectedProduct.name} - Image ${index + 1}`}
                      className="w-full h-32 object-cover rounded border hover:shadow-lg transition-shadow"
                      onError={e => {
                        const target = e.target as HTMLImageElement;
                        target.src = "";
                        target.style.display = "none";
                      }}
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        {index === 0 ? "Cover" : `Image ${index + 1}`}
                      </span>
                    </div>
                  </div>
                ))
              ) : selectedProduct.images ? (
                <div className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getFullImageUrl(selectedProduct.images)}
                    alt={selectedProduct.name}
                    className="w-full h-32 object-cover rounded border hover:shadow-lg transition-shadow"
                    onError={e => {
                      const target = e.target as HTMLImageElement;
                      target.src = "";
                      target.style.display = "none";
                    }}
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                      Cover
                    </span>
                  </div>
                </div>
              ) : (
                <div className="col-span-full text-center py-12">
                  <Package size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No images available for this product</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Total Images: {getImageCount(selectedProduct.images)}
              </p>
              <button
                onClick={() => {
                  setShowImageModal(false);
                  openEditModal(selectedProduct);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Edit size={16} />
                Edit Product Images
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-lg w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingCategory ? "Ангилал засах" : "Шинэ ангилал үүсгэх"}
              </h2>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  resetCategoryForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={categoryFormData.name}
                  onChange={e => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                />
              </div>

              <div className={editingCategory ? "hidden" : ""}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Харьяалагдах үндсэн ангилал{" "}
                  <span className="text-gray-400 font-normal">(заавал биш)</span>
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={categoryFormData.parentId || 0}
                  onChange={e =>
                    setCategoryFormData({
                      ...categoryFormData,
                      parentId: parseInt(e.target.value) || undefined,
                    })
                  }
                >
                  <option value={0}>— Үндсэн ангилал болгох —</option>
                  {categories
                    .filter(c => !c.parentId)
                    .map(main => (
                      <option key={main.id} value={main.id}>
                        {main.name}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Сонговол тухайн үндсэн ангиллын дэд ангилал болно
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={categoryFormData.description}
                  onChange={e =>
                    setCategoryFormData({ ...categoryFormData, description: e.target.value })
                  }
                />
              </div>

              {/* Ангиллын зураг */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ангиллын зураг <span className="text-gray-400 font-normal">(заавал биш)</span>
                </label>
                <div className="aspect-[4/3] max-h-40 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden relative">
                  {categoryImagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={categoryImagePreview}
                      alt="Category preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-gray-400 text-sm">
                      Зураг сонгоно уу (5MB хүртэл)
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleCategoryImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Нүүр хуудасны ангиллын картад харагдана
                </p>
              </div>

              {/* Онцлох */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={categoryIsFeatured}
                  onChange={e => setCategoryIsFeatured(e.target.checked)}
                  className="w-4 h-4 accent-red-600"
                />
                <span className="text-sm font-medium text-gray-700">
                  Онцлох (нүүр хуудасны ангиллын хэсэгт харагдана)
                </span>
              </label>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    resetCategoryForm();
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Tag size={16} />
                  {editingCategory ? "Хадгалах" : "Ангилал үүсгэх"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
