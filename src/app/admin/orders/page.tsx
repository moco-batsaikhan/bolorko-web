"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import { useToast } from "@/contexts/ToastContext";
import {
  apiService,
  Order,
  OrderStatus,
  OrderSource,
  OrderPaymentStatus,
  Product,
  ManualOrderItem,
  getApiErrorMessage,
} from "@/services/apiService";
import {
  Package,
  Clock,
  CheckCircle,
  PackageCheck,
  Truck,
  XCircle,
  Search,
  Calendar,
  CreditCard,
  User,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Loading from "@/components/Loading";

const PAGE_SIZE = 20;

interface StatusMeta {
  label: string;
  color: string;
  bgColor: string;
  icon: ReactNode;
}

// Backend-ийн бодит OrderStatus enum-той нэг мөр тохирно.
const STATUS_META: Record<OrderStatus, StatusMeta> = {
  PENDING: {
    label: "Хүлээгдэж байна",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    icon: <Clock className="w-4 h-4" />,
  },
  PAID: {
    label: "Баталгаажсан",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    icon: <CheckCircle className="w-4 h-4" />,
  },
  PROCESSING: {
    label: "Бэлтгэж байна",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    icon: <Package className="w-4 h-4" />,
  },
  SHIPPED: {
    label: "Хүргэгдэж байна",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    icon: <Truck className="w-4 h-4" />,
  },
  COMPLETED: {
    label: "Хүргэгдсэн",
    color: "text-green-700",
    bgColor: "bg-green-200",
    icon: <PackageCheck className="w-4 h-4" />,
  },
  CANCELLED: {
    label: "Цуцлагдсан",
    color: "text-red-600",
    bgColor: "bg-red-100",
    icon: <XCircle className="w-4 h-4" />,
  },
};

// Админ гараар сонгодог төлвийн урсгал: Хүлээгдэж буй → Баталгаажсан →
// Хүргэгдэж буй → Хүргэгдсэн → Цуцлагдсан. PROCESSING нь энэ жагсаалтад
// ороогүй ч STATUS_META-д тодорхойлогдсон тул хуучин өгөгдөлд тохиолдвол
// зөв харагдана.
const STATUS_FLOW: OrderStatus[] = ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"];

const SOURCE_META: Record<OrderSource, { label: string; badge: string }> = {
  WEBSITE: { label: "Вэбсайт", badge: "bg-indigo-100 text-indigo-700" },
  FACEBOOK: { label: "Facebook", badge: "bg-[#1877F2]/10 text-[#1877F2]" },
};

// Хүргэгдэж эхэлсэн/дууссан эсвэл баталгаажсан захиалгыг төлбөр төлөгдсөнд тооцно
function derivePaymentStatus(status: OrderStatus): OrderPaymentStatus {
  return status === "PAID" || status === "SHIPPED" || status === "COMPLETED" ? "PAID" : "UNPAID";
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface ManualItemRow {
  key: string;
  productId: number | null;
  quantity: number;
  unitPrice: number | "";
  selectedColor?: string;
  selectedSize?: string;
}

let rowKeyCounter = 0;
function emptyItemRow(): ManualItemRow {
  rowKeyCounter += 1;
  return { key: `row-${rowKeyCounter}`, productId: null, quantity: 1, unitPrice: "" };
}

interface OrderFormState {
  source: OrderSource;
  customerName: string;
  phone: string;
  address: string;
  note: string;
  orderDate: string;
  status: OrderStatus;
  items: ManualItemRow[];
}

function defaultFormState(): OrderFormState {
  return {
    source: "FACEBOOK",
    customerName: "",
    phone: "",
    address: "",
    note: "",
    orderDate: toDateInputValue(new Date()),
    status: "PENDING",
    items: [emptyItemRow()],
  };
}

interface DetailFormState {
  source: OrderSource;
  customerName: string;
  phone: string;
  address: string;
  note: string;
  orderDate: string;
  status: OrderStatus;
}

export default function AdminOrdersPage() {
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [sourceFilter, setSourceFilter] = useState<OrderSource | "ALL">("ALL");

  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailForm, setDetailForm] = useState<DetailFormState | null>(null);
  const [savingDetail, setSavingDetail] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<OrderFormState>(defaultFormState());
  const [creating, setCreating] = useState(false);

  // Хайлтын оролтыг debounce хийж 400мс идэвхгүй байвал л хайлт хийнэ
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Шүүлтүүр солигдоход хуудсыг эхлэл рүү буцаана
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sourceFilter]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiService.getAdminOrders({
        search: search || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        source: sourceFilter !== "ALL" ? sourceFilter : undefined,
        page: currentPage,
        limit: PAGE_SIZE,
      });
      setOrders(result.data);
      setTotal(result.total);
      setTotalPages(Math.max(1, result.pages));
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      showToast("Захиалга ачаалахад алдаа гарлаа", "error");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sourceFilter, currentPage, showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const ensureProductsLoaded = async () => {
    if (productsLoaded) return;
    try {
      const all = await apiService.getAllProducts();
      setProducts(all.filter(p => (p.postType ?? "PRODUCT") === "PRODUCT"));
      setProductsLoaded(true);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      showToast("Бараа ачаалахад алдаа гарлаа", "error");
    }
  };

  // Хэрэглэгчийн харагдах нэр/утас: вэбсайтын захиалгад холбогдсон
  // акаунт байдаг тул түүнийг эхэнд, гар захиалгад customerName/phone-г
  // харуулна
  const getCustomerName = (order: Order) => order.user?.name || order.customerName || "Тодорхойгүй";
  const getCustomerPhone = (order: Order) => order.user?.phone || order.phone || "-";

  // Quick status change — хүснэгтэн дэх мөр бүрийн сонголтоос шууд
  const handleQuickStatusChange = async (order: Order, newStatus: OrderStatus) => {
    if (newStatus === order.status) return;
    setUpdatingOrderId(order.id);
    try {
      const updated = await apiService.updateManualOrder(order.id, {
        status: newStatus,
        paymentStatus: derivePaymentStatus(newStatus),
      });
      setOrders(prev => prev.map(o => (o.id === order.id ? updated : o)));
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(updated);
        setDetailForm(prev => (prev ? { ...prev, status: newStatus } : prev));
      }
      showToast("Захиалгын төлөв шинэчлэгдлээ", "success");
    } catch (error) {
      console.error("Failed to update order status:", error);
      showToast(getApiErrorMessage(error, "Төлөв шинэчлэхэд алдаа гарлаа"), "error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const openDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailForm({
      source: order.source,
      customerName: order.customerName ?? order.user?.name ?? "",
      phone: order.phone ?? order.user?.phone ?? "",
      address: order.address ?? order.shippingAddress?.addressLine ?? "",
      note: order.note ?? "",
      orderDate: toDateInputValue(new Date(order.createdAt)),
      status: order.status,
    });
  };

  const closeDetail = () => {
    setSelectedOrder(null);
    setDetailForm(null);
  };

  const handleSaveDetail = async () => {
    if (!selectedOrder || !detailForm) return;
    if (!detailForm.customerName.trim() || !detailForm.phone.trim()) {
      showToast("Нэр болон утасны дугаараа бөглөнө үү", "error");
      return;
    }

    setSavingDetail(true);
    try {
      const updated = await apiService.updateManualOrder(selectedOrder.id, {
        source: detailForm.source,
        customerName: detailForm.customerName.trim(),
        phone: detailForm.phone.trim(),
        address: detailForm.address.trim() || undefined,
        note: detailForm.note.trim() || undefined,
        status: detailForm.status,
        paymentStatus: derivePaymentStatus(detailForm.status),
        orderDate: detailForm.orderDate || undefined,
      });
      setOrders(prev => prev.map(o => (o.id === selectedOrder.id ? updated : o)));
      setSelectedOrder(updated);
      showToast("Захиалга хадгалагдлаа", "success");
    } catch (error) {
      console.error("Failed to update order:", error);
      showToast(getApiErrorMessage(error, "Хадгалахад алдаа гарлаа"), "error");
    } finally {
      setSavingDetail(false);
    }
  };

  // ---- Шинэ захиалгын форм ----

  const openCreateModal = async () => {
    setForm(defaultFormState());
    setShowCreateModal(true);
    await ensureProductsLoaded();
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setForm(defaultFormState());
  };

  const updateItemRow = (key: string, patch: Partial<ManualItemRow>) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map(row => (row.key === key ? { ...row, ...patch } : row)),
    }));
  };

  const handleProductSelect = (key: string, productId: number) => {
    const product = products.find(p => p.id === productId);
    const effectivePrice = product
      ? parseFloat(product.salePrice || product.price) || 0
      : "";
    updateItemRow(key, {
      productId,
      unitPrice: effectivePrice,
      selectedColor: undefined,
      selectedSize: undefined,
    });
  };

  const addItemRow = () => {
    setForm(prev => ({ ...prev, items: [...prev.items, emptyItemRow()] }));
  };

  const removeItemRow = (key: string) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.length > 1 ? prev.items.filter(row => row.key !== key) : prev.items,
    }));
  };

  const formTotal = form.items.reduce(
    (sum, row) => sum + (Number(row.unitPrice) || 0) * (Number(row.quantity) || 0),
    0,
  );

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.customerName.trim() || !form.phone.trim()) {
      showToast("Хэрэглэгчийн нэр болон утасны дугаараа бөглөнө үү", "error");
      return;
    }
    if (form.items.some(row => !row.productId || row.quantity < 1)) {
      showToast("Бараа бүрт барааны нэр болон тоо ширхэгийг зөв бөглөнө үү", "error");
      return;
    }

    const items: ManualOrderItem[] = form.items.map(row => ({
      productId: row.productId as number,
      quantity: row.quantity,
      unitPrice: row.unitPrice === "" ? undefined : Number(row.unitPrice),
      selectedColor: row.selectedColor || undefined,
      selectedSize: row.selectedSize || undefined,
    }));

    setCreating(true);
    try {
      await apiService.createManualOrder({
        source: form.source,
        customerName: form.customerName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim() || undefined,
        note: form.note.trim() || undefined,
        items,
        status: form.status,
        paymentStatus: derivePaymentStatus(form.status),
        orderDate: form.orderDate || undefined,
      });
      showToast("Захиалга амжилттай бүртгэгдлээ", "success");
      closeCreateModal();
      fetchOrders();
    } catch (error) {
      console.error("Failed to create manual order:", error);
      showToast(getApiErrorMessage(error, "Захиалга бүртгэхэд алдаа гарлаа"), "error");
    } finally {
      setCreating(false);
    }
  };

  // Format price
  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("mn-MN").format(numPrice || 0) + "₮";
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

  const getStatusInfo = (status: OrderStatus): StatusMeta =>
    STATUS_META[status] ?? {
      label: "Тодорхойгүй",
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      icon: <Clock className="w-4 h-4" />,
    };

  if (loading && orders.length === 0) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
            Захиалгын удирдлага
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Бүх захиалгыг хянах, удирдах ({total} захиалга)
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-mega-600 hover:bg-mega-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors text-sm sm:text-base"
        >
          <Plus size={18} />
          Захиалга бүртгэх
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Утасны дугаар, нэр, захиалгын дугаараар хайх..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mega-500 focus:border-mega-500"
            />
          </div>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value as OrderSource | "ALL")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mega-500 focus:border-mega-500 bg-white"
          >
            <option value="ALL">Бүх сувгаас</option>
            <option value="WEBSITE">Вэбсайт</option>
            <option value="FACEBOOK">Facebook</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as OrderStatus | "ALL")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mega-500 focus:border-mega-500 bg-white"
          >
            <option value="ALL">Бүх төлөв</option>
            {STATUS_FLOW.map(status => (
              <option key={status} value={status}>
                {STATUS_META[status].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders */}
      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {search || statusFilter !== "ALL" || sourceFilter !== "ALL"
              ? "Хайлтын үр дүн олдсонгүй"
              : "Захиалга байхгүй"}
          </h3>
          <p className="text-gray-600">
            {search || statusFilter !== "ALL" || sourceFilter !== "ALL"
              ? "Өөр хайлтын нөхцөл ашиглан дахин оролдоно уу."
              : "Одоогоор захиалга байхгүй байна."}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="space-y-3 lg:hidden">
            {orders.map(order => {
              const statusInfo = getStatusInfo(order.status);
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow p-4 space-y-3"
                  onClick={() => openDetail(order)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">#{order.id}</span>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${SOURCE_META[order.source]?.badge ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {SOURCE_META[order.source]?.label ?? order.source}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatPrice(order.total)}</div>
                      <div className="text-xs text-gray-500">
                        {order.orderItems.length} бүтээгдэхүүн
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{getCustomerName(order)}</span>
                    <span className="text-gray-400">·</span>
                    <span>{getCustomerPhone(order)}</span>
                  </div>

                  <div
                    className="flex items-center justify-between gap-2"
                    onClick={e => e.stopPropagation()}
                  >
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}
                    >
                      {statusInfo.icon}
                      {statusInfo.label}
                    </span>
                    <select
                      value={order.status}
                      onChange={e => handleQuickStatusChange(order, e.target.value as OrderStatus)}
                      disabled={updatingOrderId === order.id}
                      className="text-xs border border-gray-300 rounded px-2 py-1.5 bg-white disabled:opacity-50"
                    >
                      {STATUS_FLOW.map(status => (
                        <option key={status} value={status}>
                          {STATUS_META[status].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: table */}
          <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
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
                      Эх сурвалж
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
                  {orders.map(order => {
                    const statusInfo = getStatusInfo(order.status);
                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => openDetail(order)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Package className="w-5 h-5 text-gray-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">#{order.id}</div>
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
                                {getCustomerName(order)}
                              </div>
                              <div className="text-sm text-gray-500">{getCustomerPhone(order)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${SOURCE_META[order.source]?.badge ?? "bg-gray-100 text-gray-600"}`}
                          >
                            {SOURCE_META[order.source]?.label ?? order.source}
                          </span>
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
                            <span className="ml-1">{statusInfo.label}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                            <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <select
                            value={order.status}
                            onChange={e =>
                              handleQuickStatusChange(order, e.target.value as OrderStatus)
                            }
                            disabled={updatingOrderId === order.id}
                            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white disabled:opacity-50"
                            onClick={e => e.stopPropagation()}
                          >
                            {STATUS_FLOW.map(status => (
                              <option key={status} value={status}>
                                {STATUS_META[status].label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-lg shadow px-4 py-3">
              <p className="text-sm text-gray-500">
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, total)} /{" "}
                {total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm rounded-md border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Өмнөх
                </button>
                <span className="px-3 text-sm text-gray-600">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm rounded-md border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Дараах
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Order Detail / Edit Modal */}
      {selectedOrder && detailForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4">
          <div className="bg-white w-full md:w-3/4 lg:w-2/3 max-h-[90vh] overflow-auto rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Захиалгын дэлгэрэнгүй #{selectedOrder.id}
                </h3>
                <p className="text-sm text-gray-500">Бүртгэсэн: {formatDate(selectedOrder.createdAt)}</p>
              </div>
              <div className="sm:ml-4 flex items-center space-x-3">
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
                <button onClick={closeDetail} className="text-gray-600 hover:text-gray-900">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded p-4 space-y-3">
                <h4 className="font-medium text-gray-800">Хэрэглэгчийн мэдээлэл</h4>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Нэр</label>
                  <input
                    type="text"
                    value={detailForm.customerName}
                    onChange={e => setDetailForm({ ...detailForm, customerName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mega-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Утасны дугаар
                  </label>
                  <input
                    type="text"
                    value={detailForm.phone}
                    onChange={e => setDetailForm({ ...detailForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mega-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Хаяг</label>
                  <textarea
                    rows={2}
                    value={detailForm.address}
                    onChange={e => setDetailForm({ ...detailForm, address: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mega-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Тэмдэглэл{" "}
                    <span className="text-gray-400 font-normal">
                      (Facebook чат холбоос, тохиролцоо г.м.)
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    value={detailForm.note}
                    onChange={e => setDetailForm({ ...detailForm, note: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mega-500"
                  />
                </div>
              </div>

              <div className="border rounded p-4 space-y-3">
                <h4 className="font-medium text-gray-800">Захиалгын мэдээлэл</h4>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Эх сурвалж
                  </label>
                  <select
                    value={detailForm.source}
                    onChange={e =>
                      setDetailForm({ ...detailForm, source: e.target.value as OrderSource })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mega-500 bg-white"
                  >
                    <option value="WEBSITE">Вэбсайт</option>
                    <option value="FACEBOOK">Facebook</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Захиалгын огноо
                  </label>
                  <input
                    type="date"
                    value={detailForm.orderDate}
                    onChange={e => setDetailForm({ ...detailForm, orderDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mega-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Төлөв</label>
                  <select
                    value={detailForm.status}
                    onChange={e =>
                      setDetailForm({ ...detailForm, status: e.target.value as OrderStatus })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mega-500 bg-white"
                  >
                    {STATUS_FLOW.map(status => (
                      <option key={status} value={status}>
                        {STATUS_META[status].label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Нийт дүн</label>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatPrice(selectedOrder.total)}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSaveDetail}
                disabled={savingDetail}
                className="px-4 py-2 bg-mega-600 hover:bg-mega-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {savingDetail ? "Хадгалж байна..." : "Хадгалах"}
              </button>
            </div>

            <div className="mt-6">
              <h4 className="font-medium text-gray-800">Захиалгын бүтээгдэхүүнүүд</h4>
              <div className="mt-3 space-y-3">
                {selectedOrder.orderItems.map(item => (
                  <div
                    key={item.id}
                    className="border rounded p-3 flex flex-col md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:space-x-4">
                      <div>
                        {Array.isArray(item.product?.images) && item.product?.images?.[0] ? (
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
                      <div className="mt-2 sm:mt-0">
                        <div className="text-sm font-semibold text-gray-900">
                          {item.product?.name || "-"}
                          {(item.selectedColor || item.selectedSize) && (
                            <span className="text-gray-500 font-normal">
                              {" "}
                              ({[item.selectedColor, item.selectedSize].filter(Boolean).join(", ")})
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-800 mt-1">
                          Нэгж үнэ:{" "}
                          {formatPrice(item.unitPrice || item.price || item.product?.price || "0")}
                        </div>
                        <div className="text-sm text-gray-800">Тоо ширхэг: {item.quantity}</div>
                      </div>
                    </div>

                    <div className="mt-3 md:mt-0 text-center sm:text-right">
                      <div className="text-sm text-gray-700">
                        Нийт:{" "}
                        {formatPrice(
                          (
                            parseFloat(String(item.unitPrice || item.price || item.product?.price || 0)) *
                            item.quantity
                          ).toFixed(2),
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedProduct(item.product)}
                        disabled={!item.product}
                        className="mt-2 inline-block text-sm text-mega-600 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:no-underline"
                      >
                        Бүтээгдэхүүний дэлгэрэнгүй үзэх
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Sub-modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Бүтээгдэхүүний дэлгэрэнгүй</h3>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(Array.isArray(selectedProduct.images)
                  ? selectedProduct.images
                  : selectedProduct.images
                    ? [selectedProduct.images]
                    : []
                ).map((img, idx) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={idx}
                    src={String(img)}
                    alt={selectedProduct.name}
                    className="w-24 h-24 object-cover rounded border"
                  />
                ))}
                {(!selectedProduct.images ||
                  (Array.isArray(selectedProduct.images) && selectedProduct.images.length === 0)) && (
                  <div className="w-24 h-24 bg-gray-100 flex items-center justify-center rounded text-gray-400 text-xs">
                    No image
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2 text-sm text-gray-700">
                <div className="text-base font-semibold text-gray-900">{selectedProduct.name}</div>
                {selectedProduct.description && (
                  <div className="text-gray-600 whitespace-pre-wrap">
                    {selectedProduct.description}
                  </div>
                )}
                <div>
                  <strong>Үнэ:</strong> {formatPrice(selectedProduct.price)}
                  {selectedProduct.salePrice && (
                    <span className="text-red-600 ml-2">
                      Хямдарсан үнэ: {formatPrice(selectedProduct.salePrice)}
                      {selectedProduct.discountPercentage
                        ? ` (-${selectedProduct.discountPercentage}%)`
                        : ""}
                    </span>
                  )}
                </div>
                <div>
                  <strong>Үлдэгдэл:</strong> {selectedProduct.stock}
                </div>
                {selectedProduct.category?.name && (
                  <div>
                    <strong>Ангилал:</strong> {selectedProduct.category.name}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 bg-gray-100 rounded"
                >
                  Хаах
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Manual Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Захиалга бүртгэх</h2>
              <button onClick={closeCreateModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-8">
              {/* Хэрэглэгчийн мэдээлэл */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 pb-2">
                  Хэрэглэгчийн мэдээлэл
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Хэрэглэгчийн нэр
                    </label>
                    <input
                      type="text"
                      required
                      value={form.customerName}
                      onChange={e => setForm({ ...form, customerName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mega-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Утасны дугаар
                    </label>
                    <input
                      type="text"
                      required
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mega-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Хаяг <span className="text-gray-400 font-normal">(заавал биш)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mega-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Тэмдэглэл{" "}
                    <span className="text-gray-400 font-normal">
                      (Facebook чат холбоос гэх мэт, заавал биш)
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    value={form.note}
                    onChange={e => setForm({ ...form, note: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mega-500"
                  />
                </div>
              </div>

              {/* Захиалгын мэдээлэл */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 pb-2">
                  Захиалгын мэдээлэл
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Эх сурвалж
                    </label>
                    <select
                      value={form.source}
                      onChange={e => setForm({ ...form, source: e.target.value as OrderSource })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mega-500 bg-white"
                    >
                      <option value="FACEBOOK">Facebook</option>
                      <option value="WEBSITE">Вэбсайт</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Захиалгын огноо
                    </label>
                    <input
                      type="date"
                      required
                      value={form.orderDate}
                      onChange={e => setForm({ ...form, orderDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mega-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Төлөв</label>
                    <select
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value as OrderStatus })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mega-500 bg-white"
                    >
                      {STATUS_FLOW.map(status => (
                        <option key={status} value={status}>
                          {STATUS_META[status].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Барааны мөрүүд */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Захиалсан бараа
                  </h3>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-sm text-mega-600 hover:underline flex items-center gap-1"
                  >
                    <Plus size={14} /> Мөр нэмэх
                  </button>
                </div>

                <div className="space-y-3">
                  {form.items.map(row => {
                    const product = products.find(p => p.id === row.productId);
                    const rowTotal = (Number(row.unitPrice) || 0) * (Number(row.quantity) || 0);
                    return (
                      <div key={row.key} className="border rounded-lg p-3 space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <select
                            required
                            value={row.productId ?? ""}
                            onChange={e => handleProductSelect(row.key, Number(e.target.value))}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mega-500 bg-white text-sm"
                          >
                            <option value="" disabled>
                              -- Бараа сонгох --
                            </option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({formatPrice(p.salePrice || p.price)})
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => removeItemRow(row.key)}
                            disabled={form.items.length === 1}
                            className="text-red-500 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed p-2 self-start"
                            title="Мөр устгах"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        {product && ((product.colors && product.colors.length > 0) || (product.sizes && product.sizes.length > 0)) && (
                          <div className="grid grid-cols-2 gap-3">
                            {product.colors && product.colors.length > 0 && (
                              <select
                                value={row.selectedColor ?? ""}
                                onChange={e =>
                                  updateItemRow(row.key, { selectedColor: e.target.value || undefined })
                                }
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                              >
                                <option value="">Өнгө сонгох</option>
                                {product.colors.map(c => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            )}
                            {product.sizes && product.sizes.length > 0 && (
                              <select
                                value={row.selectedSize ?? ""}
                                onChange={e =>
                                  updateItemRow(row.key, { selectedSize: e.target.value || undefined })
                                }
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                              >
                                <option value="">Хэмжээ сонгох</option>
                                {product.sizes.map(s => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Тоо ширхэг</label>
                            <input
                              type="number"
                              min={1}
                              required
                              value={row.quantity}
                              onChange={e =>
                                updateItemRow(row.key, { quantity: parseInt(e.target.value) || 1 })
                              }
                              onFocus={e => e.target.select()}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-mega-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Нэгж үнэ (₮)</label>
                            <input
                              type="number"
                              min={0}
                              step={100}
                              required
                              value={row.unitPrice}
                              onChange={e =>
                                updateItemRow(row.key, {
                                  unitPrice: e.target.value === "" ? "" : Number(e.target.value),
                                })
                              }
                              onFocus={e => e.target.select()}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-mega-500"
                            />
                          </div>
                        </div>

                        <div className="text-right text-sm text-gray-600">
                          Мөрийн дүн: <span className="font-medium text-gray-900">{formatPrice(rowTotal)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end items-center gap-2 pt-2 border-t border-gray-100">
                  <span className="text-sm text-gray-600">Нийт дүн:</span>
                  <span className="text-xl font-bold text-mega-700">{formatPrice(formTotal)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  Болих
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2 bg-mega-600 hover:bg-mega-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {creating ? "Бүртгэж байна..." : "Захиалга бүртгэх"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
