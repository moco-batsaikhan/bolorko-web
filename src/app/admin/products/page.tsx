"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Package, Tag, Eye, EyeOff, Percent, X, Save } from "lucide-react";
import {
  apiService,
  Product,
  ProductCategory,
  CreateProductRequest,
  UpdateProductRequest,
  ApplyDiscountRequest,
  CreateProductCategoryRequest,
} from "@/services/apiService";
import { useToast } from "@/contexts/ToastContext";
import { API_BASE_URL } from "@/constants/constants";

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
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
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
  const [discountData, setDiscountData] = useState<ApplyDiscountRequest>({
    discountPercentage: 0,
  });
  const [categoryFormData, setCategoryFormData] = useState<CreateProductCategoryRequest>({
    name: "",
    description: "",
  });

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
      const newPreviews = filesToAdd.map((file) => URL.createObjectURL(file));
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

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      await apiService.applyDiscount(selectedProduct.id, discountData);
      showToast("Discount applied successfully!", "success");
      setShowDiscountModal(false);
      setSelectedProduct(null);
      setDiscountData({ discountPercentage: 0 });
      fetchData();
    } catch (error) {
      console.error("Error applying discount:", error);
      showToast("Failed to apply discount", "error");
    }
  };

  const handleRemoveDiscount = async (productId: number) => {
    try {
      await apiService.removeDiscount(productId);
      showToast("Discount removed successfully!", "success");
      fetchData();
    } catch (error) {
      console.error("Error removing discount:", error);
      showToast("Failed to remove discount", "error");
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createProductCategory(categoryFormData);
      showToast("Category created successfully!", "success");
      setShowCategoryModal(false);
      setCategoryFormData({ name: "", description: "" });
      fetchData();
    } catch (error) {
      console.error("Error creating category:", error);
      showToast("Failed to create category", "error");
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

  const openDiscountModal = (product: Product) => {
    setSelectedProduct(product);
    setShowDiscountModal(true);
  };

  const openImageModal = (product: Product) => {
    setSelectedProduct(product);
    setShowImageModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Package className="text-blue-600" />
          Products Management
        </h1>
        <div className="flex gap-3">
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
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800">{category.name}</h3>
                  <p className="text-gray-600 text-sm">{category.description}</p>
                </div>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Products Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Products</h2>
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
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
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
                                onError={(e) => {
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
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">
                            {product.description.substring(0, 50)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.category?.name || "No Category"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${product.price}
                        {product.originalPrice && (
                          <div className="text-xs text-gray-500 line-through">
                            ${product.originalPrice}
                          </div>
                        )}
                        {product.discountPercentage && (
                          <div className="text-xs text-green-600">
                            {product.discountPercentage}% off
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
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
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
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
                        onClick={() => openDiscountModal(product)}
                        className="text-green-600 hover:text-green-900 p-1"
                        title="Apply Discount"
                      >
                        <Percent size={16} />
                      </button>
                      {product.discountPercentage && (
                        <button
                          onClick={() => handleRemoveDiscount(product.id)}
                          className="text-orange-600 hover:text-orange-900 p-1"
                          title="Remove Discount"
                        >
                          <X size={16} />
                        </button>
                      )}
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
                  previewImages.forEach((url) => URL.revokeObjectURL(url));
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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                    onChange={(e) =>
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
                    onChange={(e) =>
                      setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: parseInt(e.target.value) })
                    }
                  >
                    <option value={0}>Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.status}
                    onChange={(e) =>
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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                    onChange={(e) =>
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
                    onChange={(e) =>
                      setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: parseInt(e.target.value) })
                    }
                  >
                    <option value={0}>Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.status}
                    onChange={(e) =>
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
                              onError={(e) => {
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
                            onError={(e) => {
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

      {/* Discount Modal */}
      {showDiscountModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-lg w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Apply Discount</h2>
              <button
                onClick={() => {
                  setShowDiscountModal(false);
                  setSelectedProduct(null);
                  setDiscountData({ discountPercentage: 0 });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleApplyDiscount} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product: {selectedProduct.name}
                </label>
                <p className="text-sm text-gray-600">Current Price: ${selectedProduct.price}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Percentage
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="99"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={discountData.discountPercentage}
                  onChange={(e) =>
                    setDiscountData({
                      ...discountData,
                      discountPercentage: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDiscountModal(false);
                    setSelectedProduct(null);
                    setDiscountData({ discountPercentage: 0 });
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Percent size={16} />
                  Apply Discount
                </button>
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
                      onError={(e) => {
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
                    onError={(e) => {
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
              <h2 className="text-2xl font-bold text-gray-800">Create New Category</h2>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setCategoryFormData({ name: "", description: "" });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={categoryFormData.name}
                  onChange={(e) =>
                    setCategoryFormData({ ...categoryFormData, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={categoryFormData.description}
                  onChange={(e) =>
                    setCategoryFormData({ ...categoryFormData, description: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setCategoryFormData({ name: "", description: "" });
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
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
