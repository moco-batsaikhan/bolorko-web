"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/contexts/ToastContext";
import { apiService, Order } from "@/services/apiService";
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Search,
  Filter,
  Calendar,
  CreditCard,
  User,
} from "lucide-react";

export default function AdminOrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const allOrders = await apiService.getAllOrders();
      console.log("orders: ", allOrders);
      setOrders(allOrders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      showToast("Захиалга ачаалахад алдаа гарлаа", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle order status update
  const handleStatusUpdate = async (
    orderId: number,
    newStatus: Order["status"]
  ) => {
    setUpdatingOrderId(orderId);
    try {
      await apiService.updateOrderStatus(orderId, { status: newStatus });
      await fetchOrders(); // Refresh orders
      showToast("Захиалгын төлөв амжилттай шинэчлэгдлээ", "success");
    } catch (error) {
      console.error("Failed to update order status:", error);
      showToast("Төлөв шинэчлэхэд алдаа гарлаа", "error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Handle mark as paid
  const handleMarkAsPaid = async (orderId: number) => {
    setUpdatingOrderId(orderId);
    try {
      await apiService.markOrderAsPaid(orderId);
      await fetchOrders(); // Refresh orders
      showToast("Захиалга төлөгдсөн гэж тэмдэглэгдлээ", "success");
    } catch (error) {
      console.error("Failed to mark order as paid:", error);
      showToast("Төлбөр тэмдэглэхэд алдаа гарлаа", "error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

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
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status info
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

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toString().includes(searchTerm) ||
      order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mega-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Захиалгын удирдлага
        </h2>
        <p className="text-gray-600">
          Бүх захиалгыг хянах болон удирдах ({orders.length} захиалга)
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Захиалгын дугаар, хэрэглэгчийн нэр эсвэл имэйлээр хайх..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mega-500 focus:border-mega-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mega-500 focus:border-mega-500 appearance-none"
            >
              <option value="ALL">Бүх төлөв</option>
              <option value="PENDING">Хүлээгдэж байна</option>
              <option value="PAID">Төлөгдсөн</option>
              <option value="SHIPPED">Хүргэлтэнд гарсан</option>
              <option value="DELIVERED">Хүргэгдсөн</option>
              <option value="CANCELLED">Цуцлагдсан</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm || statusFilter !== "ALL"
              ? "Хайлтын үр дүн олдсонгүй"
              : "Захиалга байхгүй"}
          </h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== "ALL"
              ? "Өөр хайлтын нөхцөл ашиглан дахин оролдоно уу."
              : "Одоогоор захиалга байхгүй байна."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Захиалга
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Хэрэглэгч
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дүн
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Төлөв
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Огноо
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Үйлдэл
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const statusInfo = getStatusInfo(order.status);
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              #{order.id}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.orderItems.length} бүтээгдэхүүн
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {order.user?.name || "Тодорхойгүй"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.user?.email || ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CreditCard className="w-5 h-5 text-gray-400 mr-3" />
                          <div className="text-sm font-medium text-gray-900">
                            {formatPrice(order.total)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}
                        >
                          {statusInfo.icon}
                          <span className="ml-1">{statusInfo.text}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                          <div className="text-sm text-gray-900">
                            {formatDate(order.createdAt)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Status Update Dropdown */}
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleStatusUpdate(
                                order.id,
                                e.target.value as Order["status"]
                              )
                            }
                            disabled={updatingOrderId === order.id}
                            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white disabled:opacity-50"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="PENDING">Хүлээгдэж байна</option>
                            <option value="PAID">Төлөгдсөн</option>
                            <option value="SHIPPED">Хүргэлтэнд гарсан</option>
                            <option value="DELIVERED">Хүргэгдсөн</option>
                            <option value="CANCELLED">Цуцлагдсан</option>
                          </select>

                          {/* Mark as Paid Button */}
                          {order.status === "PENDING" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsPaid(order.id);
                              }}
                              disabled={updatingOrderId === order.id}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {updatingOrderId === order.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                "Төлөгдсөн"
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Modal / Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-11/12 md:w-3/4 lg:w-2/3 max-h-[90vh] overflow-auto rounded-lg shadow-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Захиалгын дэлгэрэнгүй #{selectedOrder.id}
                </h3>
                <p className="text-sm text-gray-500">
                  Огноо: {formatDate(selectedOrder.createdAt)}
                </p>
              </div>
              <div className="ml-4 flex items-center space-x-3">
                <button
                  onClick={() => {
                    const json = JSON.stringify(selectedOrder, null, 2);
                    const blob = new Blob([json], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    window.open(url, "_blank");
                  }}
                  className="text-sm text-mega-600 hover:underline"
                >
                  Raw JSON
                </button>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Хаах
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded p-4">
                <h4 className="font-medium text-gray-800">Хэрэглэгч</h4>
                <div className="text-sm text-gray-700 mt-2">
                  <div>
                    <strong>Нэр:</strong> {selectedOrder.user?.name || "-"}
                  </div>
                  <div>
                    <strong>Имэйл:</strong> {selectedOrder.user?.email || "-"}
                  </div>
                  <div>
                    <strong>Хэрэглэгчийн ID:</strong> {selectedOrder.userId}
                  </div>
                </div>
              </div>

              <div className="border rounded p-4">
                <h4 className="font-medium text-gray-800">Хүргэлтийн хаяг</h4>
                <div className="text-sm text-gray-700 mt-2">
                  <div>
                    <strong>Бүтэн нэр:</strong>{" "}
                    {selectedOrder.shippingAddress?.fullName || "-"}
                  </div>
                  <div>
                    <strong>Утас:</strong>{" "}
                    {selectedOrder.shippingAddress?.phone || "-"}
                  </div>
                  <div>
                    <strong>Хаяг:</strong>{" "}
                    {selectedOrder.shippingAddress?.addressLine || "-"}
                  </div>
                  <div>
                    <strong>Хот:</strong>{" "}
                    {selectedOrder.shippingAddress?.city || "-"}
                  </div>
                  <div>
                    <strong>Тайлбар:</strong>{" "}
                    {selectedOrder.shippingAddress?.note || "-"}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-medium text-gray-800">
                Захиалгын бүтээгдэхүүнүүд
              </h4>
              <div className="mt-3 space-y-3">
                {selectedOrder.orderItems.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded p-3 flex flex-col md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-start space-x-4">
                      <div>
                        {Array.isArray(item.product?.images) &&
                        item.product?.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={String(item.product.images[0])}
                            alt={item.product?.name}
                            className="w-20 h-20 object-cover rounded"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-100 flex items-center justify-center rounded text-gray-400">
                            No image
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {item.product?.name || "-"}
                          {(item.selectedColor || item.selectedSize) && (
                            <span className="text-gray-500 font-normal">
                              {" "}
                              ({[item.selectedColor, item.selectedSize]
                                .filter(Boolean)
                                .join(", ")})
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {item.product?.description || "-"}
                        </div>
                        <div className="text-sm text-gray-800 mt-1">
                          Нэгж үнэ:{" "}
                          {formatPrice(
                            item.unitPrice ||
                              item.price ||
                              item.product?.price ||
                              "0"
                          )}
                        </div>
                        <div className="text-sm text-gray-800">
                          Тоо ширхэг: {item.quantity}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 md:mt-0 text-right">
                      <div className="text-sm text-gray-700">
                        Нийт:{" "}
                        {formatPrice(
                          (
                            parseFloat(
                              String(
                                item.unitPrice ||
                                  item.price ||
                                  item.product?.price ||
                                  0
                              )
                            ) * item.quantity
                          ).toFixed(2)
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const productJson = JSON.stringify(
                            item.product || {},
                            null,
                            2
                          );
                          const blob = new Blob([productJson], {
                            type: "application/json",
                          });
                          const url = URL.createObjectURL(blob);
                          window.open(url, "_blank");
                        }}
                        className="mt-2 inline-block text-sm text-mega-600 hover:underline"
                      >
                        Бүтээгдэхүүний дэлгэрэнгүй үзэх
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                <div>
                  <strong>Өгөгдсөн нийт дүн:</strong>{" "}
                  {formatPrice(selectedOrder.total)}
                </div>
                <div>
                  <strong>Төлөв:</strong>{" "}
                  {getStatusInfo(selectedOrder.status).text}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-gray-100 rounded"
                >
                  Хаах
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
