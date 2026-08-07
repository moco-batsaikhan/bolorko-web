"use client";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useState, useEffect, useCallback } from "react";
import { apiService, Order } from "@/services/apiService";
import { API_BASE_URL } from "@/constants/constants";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  ArrowLeft,
  Calendar,
  CreditCard,
} from "lucide-react";
import Loading from "@/components/Loading";
import { CART_ENABLED } from "@/config/featureFlags";

export default function OrdersPage() {
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserOrders();
    }
  }, [isAuthenticated, user]);

  const fetchUserOrders = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userOrders = await apiService.getUserOrders(user.id);
      console.log(userOrders);
      setOrders(userOrders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      showToast("Захиалга ачаалахад алдаа гарлаа", "error");
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  // Format price
  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("mn-MN").format(numPrice) + "₮";
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status color and icon
  const getStatusInfo = (status: Order["status"]) => {
    switch (status) {
      case "PENDING":
        return {
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
          icon: <Clock className="w-4 h-4" />,
          text: "Хүлээгдэж байна",
        };
      case "PAID":
        return {
          color: "text-green-600",
          bgColor: "bg-green-100",
          icon: <CheckCircle className="w-4 h-4" />,
          text: "Төлөгдсөн",
        };
      case "SHIPPED":
        return {
          color: "text-blue-600",
          bgColor: "bg-blue-100",
          icon: <Truck className="w-4 h-4" />,
          text: "Хүргэлтэнд гарсан",
        };
      case "DELIVERED":
        return {
          color: "text-green-700",
          bgColor: "bg-green-200",
          icon: <Package className="w-4 h-4" />,
          text: "Хүргэгдсэн",
        };
      case "CANCELLED":
        return {
          color: "text-red-600",
          bgColor: "bg-red-100",
          icon: <XCircle className="w-4 h-4" />,
          text: "Цуцлагдсан",
        };
      default:
        return {
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          icon: <Clock className="w-4 h-4" />,
          text: "Тодорхойгүй",
        };
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Захиалгын түүх боломжгүй байна
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
        <div className="mb-6">
          <Link
            href={CART_ENABLED ? "/cart" : "/shop"}
            className="inline-flex items-center text-mega-600 hover:text-mega-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {CART_ENABLED ? "Сагс руу буцах" : "Дэлгүүр рүү буцах"}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Миний захиалгууд</h1>
          <p className="text-gray-600 mt-2">Таны бүх захиалгын түүх</p>
        </div>

        {orders.length === 0 ? (
          // Empty state
          <div className="text-center py-16">
            <Package className="w-24 h-24 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Захиалга байхгүй байна
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Та одоогоор захиалга хийгээгүй байна. Дэлгүүрээс бүтээгдэхүүн
              сонгож эхэлцгээе.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center bg-mega-600 text-white px-6 py-3 rounded-lg hover:bg-mega-700 transition-colors"
            >
              Дэлгүүр үзэх
            </Link>
          </div>
        ) : (
          // Orders list
          <div className="space-y-6">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              return (
                <div key={order.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      {/* <h3 className="text-lg font-semibold text-gray-900">
                        Захиалга #{order.id}
                      </h3> */}
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}
                      >
                        {statusInfo.icon}
                        <span className="ml-1">{statusInfo.text}</span>
                      </div>
                      <div className="text-lg font-semibold text-gray-900 mt-1">
                        {formatPrice(order.total)}
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  {order.orderItems && order.orderItems.length > 0 ? (
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="font-medium text-gray-900 mb-3">
                        Захиалсан бараа:
                      </h4>
                      <div className="space-y-3">
                        {order.orderItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center space-x-4"
                          >
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center relative overflow-hidden">
                              {item.product.images && item.product.images[0] ? (
                                <Image
                                  className="object-cover rounded-lg"
                                  src={
                                    item.product.images[0].startsWith("http")
                                      ? item.product.images[0]
                                      : `${API_BASE_URL}${item.product.images[0]}`
                                  }
                                  alt={item.product?.name || "Бүтээгдэхүүн"}
                                  fill
                                  sizes="48px"
                                  unoptimized={item.product.images[0].startsWith("http")}
                                />
                              ) : (
                                <Package className="w-6 h-6 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-grow min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {item.product?.name || "Бүтээгдэхүүн"}
                              </p>
                              <p className="text-sm text-gray-500">
                                Тоо ширхэг: {item.quantity} ×{" "}
                                {formatPrice(item.product.price)}
                              </p>
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatPrice(
                                parseFloat(item.product.price) * item.quantity
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-gray-500 text-sm">
                        Захиалгын дэлгэрэнгүй мэдээлэл байхгүй
                      </p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center text-sm text-gray-500">
                      <CreditCard className="w-4 h-4 mr-1" />
                      Нийт дүн: {formatPrice(order.total)}
                    </div>

                    {order.status === "PENDING" && (
                      <div className="text-sm text-amber-600 font-medium">
                        Төлбөр хүлээгдэж байна
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
