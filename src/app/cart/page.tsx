"use client";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { CartItem, apiService } from "@/services/apiService";
import { API_BASE_URL } from "@/constants/constants";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import Loading from "@/components/Loading";
import { useRouter } from "next/navigation";
import { CART_ENABLED } from "@/config/featureFlags";

export default function CartPage() {
  const { isAuthenticated, user } = useAuth();
  const { cart, loading, updateQuantity, removeItem, clearCart, refreshCart } =
    useCart();
  const { showToast } = useToast();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      console.log(cart);
      refreshCart();
    }
  }, [isAuthenticated, refreshCart]);

  // Handle quantity update
  const handleQuantityUpdate = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    setIsUpdating(itemId);
    try {
      await updateQuantity(itemId, newQuantity);
      showToast("Тоо ширхэг шинэчлэгдлээ", "success");
    } catch {
      showToast("Алдаа гарлаа", "error");
    } finally {
      setIsUpdating(null);
    }
  };

  // Handle item removal
  const handleRemoveItem = async (itemId: number) => {
    try {
      await removeItem(itemId);
      showToast("Бүтээгдэхүүн хасагдлаа", "success");
    } catch {
      showToast("Алдаа гарлаа", "error");
    }
  };

  // Handle clear cart
  const handleClearCart = async () => {
    if (window.confirm("Та сагсаа бүрэн хоослохыг хүсэж байна уу?")) {
      try {
        await clearCart();
        showToast("Сагс хоосолагдлаа", "success");
      } catch {
        showToast("Алдаа гарлаа", "error");
      }
    }
  };

  // Navigate to checkout (collect address/payment there)
  const handleCreateOrder = async () => {
    if (!user || !cart || cart.cartItems.length === 0) {
      showToast("Сагс хоосон байна эсвэл хэрэглэгч олдсонгүй", "error");
      return;
    }

    // send user to checkout page where address + payment are collected
    router.push("/checkout");
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("mn-MN").format(price) + "₮";
  };

  // Сагсны урсгал түр хаагдсан (CART_ENABLED=false) — доорх код хэвээр
  // үлдсэн тул буцаахдаа зөвхөн флагийг true болгоно
  if (!CART_ENABLED) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Сагсны үйлчилгээ түр ажиллахгүй байна
            </h2>
            <p className="text-gray-600 mb-6">
              Одоогоор бүтээгдэхүүнийг шууд захиалах боломжтой.
            </p>
            <Link
              href="/shop"
              className="bg-mega-600 text-white px-6 py-3 rounded-lg hover:bg-mega-700 transition-colors"
            >
              Дэлгүүр рүү очих
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Сагс боломжгүй байна
            </h2>
            <p className="text-gray-600 mb-6">
              Энэ хэсэг одоогоор боломжгүй байна.
            </p>
            <Link
              href="/"
              className="bg-mega-600 text-white px-6 py-3 rounded-lg hover:bg-mega-700 transition-colors"
            >
              Нүүр хуудас руу буцах
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!cart || cart.cartItems.length === 0 ? (
          // Empty cart
          <div className="text-center py-16">
            <ShoppingCart className="w-24 h-24 text-gray-400 mx-auto mb-6" />
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">
              Таны сагс хоосон байна
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Та дэлгүүрээс бүтээгдэхүүн сонгож, сагсандаа нэмж эхэлцгээе.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center bg-mega-600 text-white px-6 py-3 rounded-lg hover:bg-mega-700 transition-colors"
            >
              Дэлгүүр үзэх
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        ) : (
          // Cart with items
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Таны сагс ({cart.cartItems.length})
                  </h1>
                  {cart.cartItems.length > 0 && (
                    <button
                      onClick={handleClearCart}
                      className="text-red-600 hover:text-red-700 flex items-center text-sm"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Бүгдийг устгах
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {cart.cartItems.map((item: CartItem) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 p-4 border border-gray-200 rounded-lg"
                    >
                      {/* Product Image */}
                      <div className="w-full sm:w-20 h-44 sm:h-20 flex-shrink-0 relative">
                        <Image
                          src={
                            item.product.images?.[0]
                              ? item.product.images[0].startsWith("http")
                                ? item.product.images[0]
                                : `${API_BASE_URL}${item.product.images[0]}`
                              : "/imgs/placeholder.jpg"
                          }
                          alt={item.product.name}
                          fill
                          className="object-cover rounded-lg"
                          sizes="(max-width: 640px) 100vw, 80px"
                          unoptimized={!!item.product.images?.[0]?.startsWith("http")}
                        />
                      </div>

                      {/* Info + Controls */}
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between min-w-0">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {item.product.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatPrice(
                              parseFloat(item.product.salePrice ?? item.product.price)
                            )}{" "}
                            / ш
                            {item.product.discountPercentage && (
                              <span className="ml-2 text-xs text-gray-400 line-through">
                                {formatPrice(parseFloat(item.product.price))}
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="mt-3 sm:mt-0 flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleQuantityUpdate(item.id, item.quantity - 1)
                              }
                              disabled={
                                item.quantity <= 1 || isUpdating === item.id
                              }
                              className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-full"
                            >
                              <Minus className="w-4 h-4" />
                            </button>

                            <span className="w-10 text-center font-medium">
                              {isUpdating === item.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-mega-600 mx-auto"></div>
                              ) : (
                                item.quantity
                              )}
                            </span>

                            <button
                              onClick={() =>
                                handleQuantityUpdate(item.id, item.quantity + 1)
                              }
                              disabled={isUpdating === item.id}
                              className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-full"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="text-right">
                            <div className="font-semibold text-gray-900">
                              {formatPrice(
                                parseFloat(item.product.salePrice ?? item.product.price) *
                                  item.quantity
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-600 hover:text-red-700 p-2"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Захиалгын мэдээлэл
                </h2>

                {(() => {
                  const subtotal = cart.cartItems.reduce(
                    (total, item) =>
                      total +
                      parseFloat(item.product.salePrice ?? item.product.price) *
                        item.quantity,
                    0
                  );
                  // Хүргэлтийн төлбөр захиалгын дүнд нэмэгдэхгүй
                  const totalAmount = subtotal;

                  return (
                    <>
                      <div className="space-y-3 border-b border-gray-200 pb-4 mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Нийт:</span>
                          <span className="font-medium">
                            {formatPrice(subtotal)}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between text-lg font-semibold text-gray-900 mb-6">
                        <span>Нийт дүн:</span>
                        <span>{formatPrice(totalAmount)}</span>
                      </div>
                    </>
                  );
                })()}

                <button
                  onClick={handleCreateOrder}
                  disabled={isCreatingOrder}
                  className="w-full bg-mega-600 text-white py-3 px-4 rounded-lg hover:bg-mega-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isCreatingOrder ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Захиалж байна...
                    </div>
                  ) : (
                    "Захиалах"
                  )}
                </button>

                <Link
                  href="/shop"
                  className="w-full border border-mega-600 text-mega-600 py-3 px-4 rounded-lg hover:bg-mega-50 transition-colors text-center block font-medium mt-3"
                >
                  Дэлгүүр үргэлжлүүлэх
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
