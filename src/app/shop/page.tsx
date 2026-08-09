"use client";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { apiService, Product, ProductCategory } from "@/services/apiService";
import { API_BASE_URL } from "@/constants/constants";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Star, Filter, Package, Tag, Eye, Heart, Search, X } from "lucide-react";
import Loading from "@/components/Loading";
import { STOCK_CHECK_ENABLED } from "@/config/featureFlags";

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category");
  const [products, setProducts] = useState<Product[]>([]);
  const [mainCategories, setMainCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  // Хоёр шатлалт сонголт: үндсэн болон дэд ангилал
  const [selectedMain, setSelectedMain] = useState<number | null>(
    initialCategory ? Number(initialCategory) : null,
  );
  const [selectedSub, setSelectedSub] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Fetch products data (search/categoryId/type нэг query-гээр хослоно)
  const fetchProducts = async (categoryId?: number, search?: string) => {
    try {
      setLoading(true);
      const productsData = await apiService.getProducts({
        type: "PRODUCT",
        categoryId,
        search,
      });

      setProducts(productsData);
      setError(null);
    } catch (err) {
      setError("Бүтээгдэхүүн ачаалахад алдаа гарлаа");
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  // Хайлтын оролтыг 400ms хойшлуулж backend руу илгээнэ
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const effectiveCategory = selectedSub ?? selectedMain;

  // Ангилал эсвэл хайлт өөрчлөгдөх бүрд шинээр татна
  useEffect(() => {
    fetchProducts(effectiveCategory ?? undefined, debouncedSearch || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCategory, debouncedSearch]);

  // Fetch categories (nested: main + children)
  const fetchCategories = async () => {
    try {
      const categoriesData = await apiService.getMainCategories();
      setMainCategories(categoriesData);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  // URL параметр өөрчлөгдөхөд (header-ийн хайлт/ангиллаас) төлөвийг синк хийнэ
  useEffect(() => {
    const catParam = searchParams.get("category");
    const searchParam = searchParams.get("search") || "";

    setSearchQuery(searchParam);
    setDebouncedSearch(searchParam);

    const catId = catParam ? Number(catParam) : null;
    if (!catId) {
      setSelectedMain(null);
      setSelectedSub(null);
      return;
    }

    if (mainCategories.length === 0) {
      // Ангиллууд ачаалагдаагүй байхад id-г шууд ашиглана
      setSelectedMain(catId);
      setSelectedSub(null);
      return;
    }

    const main = mainCategories.find(c => c.id === catId);
    if (main) {
      setSelectedMain(catId);
      setSelectedSub(null);
    } else {
      const parent = mainCategories.find(c => c.children?.some(child => child.id === catId));
      if (parent) {
        setSelectedMain(parent.id);
        setSelectedSub(catId);
      }
    }
  }, [searchParams, mainCategories]);

  // Initial data fetch
  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Үндсэн ангилал солиход дэд ангилал шинээр эхэлнэ
  const handleMainChange = (mainId: number | null) => {
    setSelectedMain(mainId);
    setSelectedSub(null);
  };

  const handleSubChange = (subId: number | null) => {
    setSelectedSub(subId);
  };

  const selectedMainCategory = mainCategories.find(c => c.id === selectedMain);
  const subCategories = selectedMainCategory?.children || [];

  // Format price
  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    if (!numPrice) return "Үнэ асууна уу";
    return new Intl.NumberFormat("mn-MN").format(numPrice) + "₮";
  };

  // Render star rating
  const renderStars = (rating: string) => {
    const numRating = parseFloat(rating);
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${i <= numRating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
        />,
      );
    }
    return stars;
  };

  // Get product image URL
  const getProductImageUrl = (images: string[] | string | null) => {
    if (!images) return null;

    if (typeof images === "string") {
      if (images === "string") return null; // Invalid data
      return images.startsWith("http") ? images : `${API_BASE_URL}${images}`;
    }

    if (Array.isArray(images) && images.length > 0) {
      const firstImage = images[0];
      return firstImage.startsWith("http") ? firstImage : `${API_BASE_URL}${firstImage}`;
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-red-700 via-red-600 to-red-500 text-white py-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-48 -translate-y-48 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-48 translate-y-48 blur-3xl"></div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-4 h-4 bg-white rounded-full opacity-40 animate-pulse"></div>
          <div className="absolute top-32 right-20 w-3 h-3 bg-white rounded-full opacity-50 animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/4 w-2 h-2 bg-white rounded-full opacity-45 animate-pulse delay-500"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Icon */}
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4 shadow-xl">
                <ShoppingCart className="w-10 h-10 text-red-600" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-white drop-shadow-2xl">
              Дэлгүүр
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto leading-relaxed">
              Bolorko албан ёсны дэлгүүр.
              <span className="font-semibold"> Хувцас болон аяллын хэрэгсэл</span>
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{products.length}+</div>
                <div className="text-white opacity-75">Бүтээгдэхүүн</div>
              </div>
              {/* <div className="text-center">
                <div className="text-3xl font-bold text-white">
                  {products.reduce(
                    (total, product) => total + product.stock,
                    0
                  )}
                  +
                </div>
                <div className="text-white opacity-75">Нөөцөд</div>
              </div> */}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search + Category Filter: үндсэн → дэд ангилал */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Хайлт */}
            <div className="relative flex-1 sm:max-w-md">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Бараа хайх..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Хайлт цэвэрлэх"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex items-center">
              <Filter className="w-5 h-5 mr-2 text-mega-600" />
              <h3 className="text-lg font-semibold text-gray-900">Ангилал</h3>
            </div>

            <select
              value={selectedMain ?? ""}
              onChange={e => handleMainChange(e.target.value ? Number(e.target.value) : null)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500 cursor-pointer"
            >
              <option value="">Бүх ангилал</option>
              {mainCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {subCategories.length > 0 && (
              <select
                value={selectedSub ?? ""}
                onChange={e => handleSubChange(e.target.value ? Number(e.target.value) : null)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500 cursor-pointer"
              >
                <option value="">Бүх дэд ангилал</option>
                {subCategories.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            )}
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
              {products.map(product => {
                const imageUrl = getProductImageUrl(product.images);

                return (
                  <Link
                    href={`/shop/${product.id}`}
                    key={product.id}
                    className="card-3d bg-white rounded-lg overflow-hidden group block"
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
                          unoptimized={!imageUrl.startsWith(API_BASE_URL ?? "")}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                          <Package className="w-16 h-16 text-gray-400" />
                        </div>
                      )}

                      {/* Discount Badge */}
                      {product.discountPercentage && (
                        <div className="absolute top-2 left-2">
                          <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                            -{product.discountPercentage}%
                          </span>
                        </div>
                      )}

                      {/* Stock Badge — нөөцийн хяналт түр хаагдсан үед харуулахгүй */}
                      {STOCK_CHECK_ENABLED && (
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
                            {product.stock > 0 ? `${product.stock} ширхэг` : "Дууссан"}
                          </span>
                        </div>
                      )}

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
                          {product.category?.name || "Ангилалгүй"}
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
                      <div className="flex items-baseline gap-2 mb-4">
                        <span
                          className={`text-lg font-bold ${
                            product.discountPercentage ? "text-red-600" : "text-gray-900"
                          }`}
                        >
                          {formatPrice(product.salePrice ?? product.price)}
                        </span>
                        {product.discountPercentage && (
                          <span className="text-sm text-gray-400 line-through">
                            {formatPrice(product.price)}
                          </span>
                        )}
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
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Бүтээгдэхүүн олдсонгүй</h3>
                <p className="text-gray-600">Энэ ангиллаар бүтээгдэхүүн байхгүй байна.</p>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loading />
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
