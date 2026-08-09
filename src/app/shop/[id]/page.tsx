"use client";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiService, Product } from "@/services/apiService";
import { CART_ENABLED, STOCK_CHECK_ENABLED } from "@/config/featureFlags";
import { API_BASE_URL } from "@/constants/constants";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ShoppingCart,
  Star,
  Package,
  Tag,
  MessageSquare,
  User,
  Send,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useCart } from "@/contexts/CartContext";
import { LoginModal } from "@/components/LoginModal";
import Loading from "@/components/Loading";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const { addToCart, loading: cartLoading } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Rating form state
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  // Cart state
  const [quantity, setQuantity] = useState(1);
  // Өнгө/размер сонголт — тухайн бараанд colors/sizes байгаа үед л ашиглагдана
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productId = parseInt(params.id as string);
        if (isNaN(productId)) {
          setError("Бүтээгдэхүүний ID буруу байна");
          return;
        }

        // For now, we'll use the general products API and filter
        // In a real app, you'd have a specific endpoint for product details
        const products = await apiService.getProducts();
        const productData = products.find((p) => p.id === productId);

        if (!productData) {
          setError("Бүтээгдэхүүн олдсонгүй");
          return;
        }

        console.log(productData);

        setProduct(productData);
        setError(null);
        // Шинэ бараа ачаалагдах бүрт өмнөх сонголтыг цэвэрлэнэ
        setSelectedColor(null);
        setSelectedSize(null);
      } catch (err) {
        setError("Бүтээгдэхүүн ачаалахад алдаа гарлаа");
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  // Format price
  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    if (!numPrice) return "Үнэ асууна уу";
    return new Intl.NumberFormat("mn-MN").format(numPrice) + "₮";
  };

  // FB постын текст доторх URL болон утасны дугаарыг дарж болдог линк болгоно
  const renderDescription = (text: string) => {
    const parts = text.split(/(https?:\/\/[^\s]+|\b\d{8}\b)/g);
    return parts.map((part, i) => {
      if (part.startsWith("http")) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noreferrer"
            className="text-red-600 hover:underline break-all"
          >
            {part}
          </a>
        );
      }
      if (/^\d{8}$/.test(part)) {
        return (
          <a key={i} href={`tel:${part}`} className="text-red-600 hover:underline">
            {part}
          </a>
        );
      }
      return part;
    });
  };

  // Get product images
  const getProductImages = (images: string[] | string | null) => {
    if (!images) return [];

    if (typeof images === "string") {
      if (images === "string") return []; // Invalid data
      const url = images.startsWith("http") ? images : `${API_BASE_URL}${images}`;
      return [url];
    }

    if (Array.isArray(images)) {
      return images.map((img) =>
        img.startsWith("http") ? img : `${API_BASE_URL}${img}`
      );
    }

    return [];
  };

  // colors/sizes байгаа бол сонголт хийгдсэн эсэхийг шалгана
  const validateSelection = () => {
    if (product?.colors && product.colors.length > 0 && !selectedColor) {
      showToast("Өнгөө сонгоно уу", "error");
      return false;
    }
    if (product?.sizes && product.sizes.length > 0 && !selectedSize) {
      showToast("Размерээ сонгоно уу", "error");
      return false;
    }
    return true;
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      showToast("Сагсанд нэмэхийн тулд эхлээд нэвтэрнэ үү", "error");
      setShowLoginModal(true);
      return;
    }

    if (!product) return;
    if (!validateSelection()) return;

    try {
      await addToCart(product.id, quantity, {
        selectedColor: selectedColor ?? undefined,
        selectedSize: selectedSize ?? undefined,
      });
      showToast("Бүтээгдэхүүн сагсанд нэмэгдлээ!", "success");
      // Reset quantity to 1 after adding
      setQuantity(1);
    } catch (error) {
      showToast("Алдаа гарлаа. Дахин оролдоно уу.", "error");
      console.error("Add to cart error:", error);
    }
  };

  // Худалдан авах: сагсыг алгасаад шууд захиалгын мэдээлэл авах алхам руу
  // шилжинэ (CART_ENABLED=false бол ашиглагдана). Нэвтрэлт заавал шаардахгүй.
  const handleBuyNow = () => {
    if (!product) return;
    if (!validateSelection()) return;

    const unitPrice = parseFloat(product.salePrice ?? product.price);
    const buyNowItem = {
      productId: product.id,
      quantity,
      unitPrice,
      name: product.name,
      image: images[0],
      selectedColor,
      selectedSize,
      installmentPaymentAllowed: product.installmentPaymentAllowed,
    };

    try {
      sessionStorage.setItem("buy_now_item", JSON.stringify(buyNowItem));
    } catch (e) {
      console.warn("Could not write buy_now_item to sessionStorage", e);
    }

    router.push("/checkout");
  };

  // Handle rating submission
  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (rating === 0) {
      showToast("Үнэлгээ сонгоно уу", "error");
      return;
    }

    if (!comment.trim()) {
      showToast("Сэтгэгдэл бичнэ үү", "error");
      return;
    }

    try {
      setSubmittingRating(true);

      const response = await fetch(
        `${API_BASE_URL}/products/${product!.id}/ratings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({
            rating,
            comment,
          }),
        }
      );

      if (response.status === 400) {
        const errorData = await response.json();
        if (errorData.message === "You have already rated this product") {
          showToast("Та энэ бүтээгдэхүүнд үнэлгээ өгсөн байна", "error");
          return;
        }
      }

      if (!response.ok) {
        throw new Error("Rating submission failed");
      }

      const newRating = await response.json();

      // Update product with new rating
      if (product) {
        // Ensure the new rating has proper user data
        const ratingWithUser = {
          ...newRating,
          user: newRating.user || {
            id: user?.id || 0,
            name: user?.name || "Хэрэглэгч",
          },
        };
        const updatedProduct = {
          ...product,
          ratings: [...(product.ratings || []), ratingWithUser],
          ratingCount: product.ratingCount + 1,
        };

        // Recalculate average rating
        const totalRating =
          (product.ratings || []).reduce((sum, r) => sum + r.rating, 0) +
          rating;
        updatedProduct.averageRating = (
          totalRating / updatedProduct.ratingCount
        ).toFixed(1);

        setProduct(updatedProduct);
      }

      setRating(0);
      setComment("");
      setShowRatingForm(false);
      showToast("Үнэлгээ амжилттай нэмэгдлээ", "success");
    } catch (err) {
      showToast("Үнэлгээ нэмэхэд алдаа гарлаа", "error");
      console.error("Error submitting rating:", err);
    } finally {
      setSubmittingRating(false);
    }
  };

  // Render star rating for display
  const renderStars = (
    rating: string | number,
    size: "sm" | "md" | "lg" = "md"
  ) => {
    const numRating = typeof rating === "string" ? parseFloat(rating) : rating;
    const stars = [];
    const sizeClass =
      size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5";

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`${sizeClass} ${
            i <= numRating ? "text-yellow-400 fill-current" : "text-gray-300"
          }`}
        />
      );
    }
    return stars;
  };

  // Render interactive star rating for form
  const renderInteractiveStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => setRating(i)}
          className="focus:outline-none"
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              i <= rating
                ? "text-yellow-400 fill-current"
                : "text-gray-300 hover:text-yellow-200"
            }`}
          />
        </button>
      );
    }
    return stars;
  };

  if (loading) {
    return <Loading />;
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {error || "Бүтээгдэхүүн олдсонгүй"}
            </h2>
            <Link
              href="/shop"
              className="inline-flex items-center text-mega-600 hover:text-mega-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Дэлгүүр рүү буцах
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const images = getProductImages(product.images);
  // Нөөцийн хяналт түр хаагдсан тул stock-оос үл хамааран захиалах боломжтой
  const isOutOfStock = STOCK_CHECK_ENABLED && product.stock === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <Link
          href="/shop"
          className="inline-flex items-center text-mega-600 hover:text-mega-700 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Дэлгүүр рүү буцах
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {images.length > 0 ? (
              <>
                {/* Main Image */}
                <div className="aspect-square bg-white rounded-lg overflow-hidden shadow-lg relative">
                  <Image
                    src={images[selectedImageIndex]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                    unoptimized={!images[selectedImageIndex].startsWith(API_BASE_URL ?? "")}
                  />
                </div>

                {/* Thumbnail Images */}
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`aspect-square bg-white rounded-lg overflow-hidden border-2 transition-colors relative ${
                          selectedImageIndex === index
                            ? "border-mega-600"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="120px"
                          unoptimized={!image.startsWith(API_BASE_URL ?? "")}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center shadow-lg">
                <Package className="w-24 h-24 text-gray-400" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category */}
            <div className="flex items-center">
              <Tag className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-sm text-gray-600">
                {product.category?.name || "Ангилалгүй"}
              </span>
            </div>

            {/* Product Name */}
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                {renderStars(product.averageRating)}
                <span className="ml-2 text-sm text-gray-600">
                  {product.averageRating} ({product.ratingCount} үнэлгээ)
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              {product.discountPercentage ? (
                <>
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl font-bold text-red-600">
                      {formatPrice(product.salePrice!)}
                    </span>
                    <span className="bg-red-600 text-white px-2 py-1 rounded text-sm font-bold">
                      -{product.discountPercentage}%
                    </span>
                  </div>
                  <span className="text-lg text-gray-400 line-through">
                    {formatPrice(product.price)}
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            {/* Stock — нөөцийн хяналт түр хаагдсан үед харуулахгүй */}
            {STOCK_CHECK_ENABLED && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Нөөц:</span>
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    product.stock > 10
                      ? "bg-green-100 text-green-800"
                      : product.stock > 0
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {product.stock > 0 ? `${product.stock} ширхэг` : "Дууссан"}
                </span>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Тайлбар</h3>
              {/* whitespace-pre-line: FB постын догол мөр, хоосон мөрийг хэвээр харуулна */}
              <p className="text-gray-600 leading-relaxed whitespace-pre-line break-words">
                {renderDescription(product.description)}
              </p>
            </div>

            {/* Өнгөний сонголт — зөвхөн product.colors байвал харагдана */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Өнгө{selectedColor ? `: ${selectedColor}` : ""}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                        selectedColor === color
                          ? "border-mega-600 bg-mega-50 text-mega-700"
                          : "border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Размерын сонголт — зөвхөн product.sizes байвал харагдана */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Размер{selectedSize ? `: ${selectedSize}` : ""}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[3rem] px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                        selectedSize === size
                          ? "border-mega-600 bg-mega-50 text-mega-700"
                          : "border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4">
              {/* Тоо ширхэг сонголт түр хаагдсан — quantity нь үргэлж 1
                  байна. Буцаахдаа доорх блокийг ердөө ил болгоно. */}
              {/* <div className="flex items-center space-x-4 mb-4">
                <label
                  htmlFor="quantity"
                  className="text-sm font-medium text-gray-900"
                >
                  Тоо ширхэг:
                </label>
                <select
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mega-500 focus:border-transparent"
                  disabled={isOutOfStock}
                >
                  {Array.from(
                    { length: STOCK_CHECK_ENABLED ? Math.min(product.stock, 10) : 10 },
                    (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    )
                  )}
                </select>
              </div> */}

              {/* CART_ENABLED=true үед "Сагсанд нэмэх" товч, false үед сагсыг
                  алгасаад шууд захиалах товч харагдана (featureFlags.ts). */}
              {CART_ENABLED ? (
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || cartLoading}
                  className="w-full flex items-center justify-center px-6 py-3 bg-mega-600 text-white rounded-lg hover:bg-mega-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {cartLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Нэмж байна...
                    </div>
                  ) : isOutOfStock ? (
                    "Дууссан"
                  ) : (
                    "Сагсанд нэмэх"
                  )}
                </button>
              ) : (
                <button
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="w-full flex items-center justify-center px-6 py-3 bg-mega-600 text-white rounded-lg hover:bg-mega-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {isOutOfStock ? "Дууссан" : "Худалдан авах"}
                </button>
              )}

              {product.installmentPaymentAllowed === false && (
                <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Энэ бараанд хэсэгчилсэн төлбөр (Storepay/Pocket) боломжгүй — зөвхөн QPay-ээр
                  төлнө.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Үнэлгээ болон сэтгэгдэл ({product.ratingCount})
              </h2>
              {isAuthenticated && (
                <button
                  onClick={() => setShowRatingForm(!showRatingForm)}
                  className="px-4 py-2 bg-mega-600 text-white rounded-lg hover:bg-mega-700 transition-colors"
                >
                  Үнэлгээ өгөх
                </button>
              )}
            </div>

            {/* Rating Form */}
            {showRatingForm && (
              <form
                onSubmit={handleRatingSubmit}
                className="mb-8 p-6 bg-gray-50 rounded-lg"
              >
                <h3 className="text-lg font-semibold mb-4">Үнэлгээ өгөх</h3>

                <div className="space-y-4">
                  {/* Stars */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Үнэлгээ
                    </label>
                    <div className="flex space-x-1">
                      {renderInteractiveStars()}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Сэтгэгдэл
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Энэ бүтээгдэхүүний талаар сэтгэгдэл бичнэ үү..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500 focus:border-transparent resize-none"
                      disabled={submittingRating}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowRatingForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      disabled={submittingRating}
                    >
                      Болих
                    </button>
                    <button
                      type="submit"
                      disabled={
                        submittingRating || rating === 0 || !comment.trim()
                      }
                      className="flex items-center px-4 py-2 bg-mega-600 text-white rounded-lg hover:bg-mega-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingRating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Илгээж байна...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Үнэлгээ илгээх
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Login Prompt for Non-authenticated Users */}
            {!isAuthenticated && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Үнэлгээ өгөх
                </h3>
                <p className="text-gray-600 mb-4">
                  Үнэлгээ өгөхийн тулд эхлээд нэвтэрнэ үү
                </p>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-mega-600 text-white px-6 py-2 rounded-lg hover:bg-mega-700 transition-colors"
                >
                  Нэвтрэх
                </button>
              </div>
            )}

            {/* Existing Reviews */}
            <div className="space-y-6">
              {product.ratings && product.ratings.length > 0 ? (
                product.ratings.map((ratingItem) => (
                  <div
                    key={ratingItem.id}
                    className="flex space-x-4 pb-6 border-b border-gray-200 last:border-0"
                  >
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">
                          Хэрэглэгч #{ratingItem.userId}
                        </h4>
                        <div className="flex items-center">
                          {renderStars(ratingItem.rating, "sm")}
                        </div>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {ratingItem.review}
                      </p>
                      <span className="text-sm text-gray-500 mt-2 block">
                        {new Date(ratingItem.createdAt).toLocaleDateString(
                          "mn-MN"
                        )}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Үнэлгээ байхгүй байна
                  </h3>
                  <p className="text-gray-600">
                    Энэ бүтээгдэхүүнд анхны үнэлгээгээ өгнө үү!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
}
