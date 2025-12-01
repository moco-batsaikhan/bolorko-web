"use client";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useState, useEffect } from "react";
import { apiService, Product, ProductCategory } from "@/services/apiService";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart,
  Star,
  Filter,
  ChevronDown,
  Package,
  Tag,
  Eye,
  Heart,
} from "lucide-react";
import Loading from "@/components/Loading";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch products data
  const fetchProducts = async (categoryId?: number) => {
    try {
      setLoading(true);
      let productsData;

      if (categoryId) {
        productsData = await apiService.getProductsByCategory(categoryId);
      } else {
        productsData = await apiService.getProducts();
      }

      setProducts(productsData);
      setError(null);
    } catch (err) {
      setError("Бүтээгдэхүүн ачаалахад алдаа гарлаа");
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const categoriesData = await apiService.getProductCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  // Handle category filter
  const handleCategoryFilter = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setShowCategoryDropdown(false);
    fetchProducts(categoryId || undefined);
  };

  // Format price
  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return new Intl.NumberFormat("mn-MN").format(numPrice) + "₮";
  };

  // Calculate discount price
  const getDiscountedPrice = (
    originalPrice: string,
    discountPercentage: string
  ) => {
    const original = parseFloat(originalPrice);
    const discount = parseFloat(discountPercentage);
    return original - (original * discount) / 100;
  };

  // Render star rating
  const renderStars = (rating: string) => {
    const numRating = parseFloat(rating);
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= numRating ? "text-yellow-400 fill-current" : "text-gray-300"
          }`}
        />
      );
    }
    return stars;
  };

  // Get product image URL
  const getProductImageUrl = (images: string[] | string | null) => {
    if (!images) return null;

    if (typeof images === "string") {
      if (images === "string") return null; // Invalid data
      return images.startsWith("http")
        ? images
        : `https://api.cubingmongolia.mn${images}`;
    }

    if (Array.isArray(images) && images.length > 0) {
      const firstImage = images[0];
      return firstImage.startsWith("http")
        ? firstImage
        : `https://api.cubingmongolia.mn${firstImage}`;
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white py-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-48 -translate-y-48 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-48 translate-y-48 blur-3xl"></div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-4 h-4 bg-blue-400 rounded-full opacity-40 animate-pulse"></div>
          <div className="absolute top-32 right-20 w-3 h-3 bg-purple-400 rounded-full opacity-50 animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/4 w-2 h-2 bg-indigo-400 rounded-full opacity-45 animate-pulse delay-500"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Icon */}
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-xl">
                <ShoppingCart className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-white drop-shadow-2xl">
              Дэлгүүр
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto leading-relaxed">
              MEGA клубын албан ёсны дэлгүүр.
              <span className="font-semibold">
                {" "}
                Рубикийн шоо болон хэрэгсэл
              </span>
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">
                  {products.length}+
                </div>
                <div className="text-white opacity-75">Бүтээгдэхүүн</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">
                  {products.reduce(
                    (total, product) => total + product.stock,
                    0
                  )}
                  +
                </div>
                <div className="text-white opacity-75">Нөөцөд</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="flex items-center">
              <Filter className="w-5 h-5 mr-2 text-mega-600" />
              <h3 className="text-lg font-semibold text-gray-900">Ангилал</h3>
            </div>
            <div className="relative ml-4">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="mr-2">
                  {selectedCategory
                    ? categories.find((c) => c.id === selectedCategory)?.name
                    : "Бүх ангилал"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showCategoryDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showCategoryDropdown && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => handleCategoryFilter(null)}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                      selectedCategory === null
                        ? "bg-mega-50 text-mega-600"
                        : ""
                    }`}
                  >
                    Бүх ангилал
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryFilter(category.id)}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                        selectedCategory === category.id
                          ? "bg-mega-50 text-mega-600"
                          : ""
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <Loading />
        ) : (
          <>
            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {products.map((product) => {
                const imageUrl = getProductImageUrl(product.images);
                const hasDiscount =
                  product.originalPrice && product.discountPercentage;
                const discountedPrice = hasDiscount
                  ? getDiscountedPrice(
                      product.originalPrice!,
                      product.discountPercentage!
                    )
                  : null;

                return (
                  <Link
                    href={`/shop/${product.id}`}
                    key={product.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group block"
                  >
                    {/* Product Image */}
                    <div className="relative h-48 overflow-hidden">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                          <Package className="w-16 h-16 text-gray-400" />
                        </div>
                      )}

                      {/* Discount Badge */}
                      {hasDiscount && (
                        <div className="absolute top-2 left-2">
                          <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                            -{product.discountPercentage}%
                          </span>
                        </div>
                      )}

                      {/* Stock Badge */}
                      <div className="absolute top-2 right-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            product.stock > 10
                              ? "bg-green-500 text-white"
                              : product.stock > 0
                              ? "bg-yellow-500 text-white"
                              : "bg-red-500 text-white"
                          }`}
                        >
                          {product.stock > 0
                            ? `${product.stock} ширхэг`
                            : "Дууссан"}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex space-x-2">
                          <button className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors">
                            <Eye className="w-5 h-5 text-gray-600" />
                          </button>
                          <button className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors">
                            <Heart className="w-5 h-5 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      {/* Category */}
                      <div className="flex items-center mb-2">
                        <Tag className="w-3 h-3 mr-1 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {product.category?.name || "Категори"}
                        </span>
                      </div>

                      {/* Product Name */}
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-mega-600 transition-colors">
                        {product.name}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {product.description}
                      </p>

                      {/* Rating */}
                      <div className="flex items-center mb-3">
                        <div className="flex items-center mr-2">
                          {renderStars(product.averageRating)}
                        </div>
                        <span className="text-sm text-gray-500">
                          ({product.ratingCount} үнэлгээ)
                        </span>
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          {hasDiscount ? (
                            <div>
                              <span className="text-lg font-bold text-red-600">
                                {formatPrice(discountedPrice!.toString())}
                              </span>
                              <span className="text-sm text-gray-500 line-through ml-2">
                                {formatPrice(product.originalPrice!)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-lg font-bold text-gray-900">
                              {formatPrice(product.price)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Add to Cart Button */}
                      {/* <button
                        disabled={product.stock === 0}
                        className="w-full flex items-center justify-center px-4 py-2 bg-mega-600 text-white rounded-lg hover:bg-mega-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {product.stock === 0 ? "Дууссан" : "Сагсанд нэмэх"}
                      </button> */}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Empty State */}
            {products.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Package className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Бүтээгдэхүүн олдсонгүй
                </h3>
                <p className="text-gray-600">
                  Энэ ангиллаар бүтээгдэхүүн байхгүй байна.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
