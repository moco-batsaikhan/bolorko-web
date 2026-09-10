"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/contexts/ToastContext";
import {
  apiService,
  ReportSummary,
  ReportGroupBy,
  OrderSource,
  OrderStatus,
  Order,
} from "@/services/apiService";
import { TrendingUp, ShoppingCart, Wallet, Download, FileSpreadsheet } from "lucide-react";
import Loading from "@/components/Loading";
import writeExcelFile, { Column } from "write-excel-file/browser";

const SOURCE_META: Record<OrderSource, { label: string; badge: string }> = {
  WEBSITE: { label: "Вэбсайт", badge: "bg-indigo-100 text-indigo-700" },
  FACEBOOK: { label: "Гараар бүртгэсэн (Facebook)", badge: "bg-[#1877F2]/10 text-[#1877F2]" },
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Хүлээгдэж байна",
  PAID: "Баталгаажсан",
  PROCESSING: "Бэлтгэж байна",
  SHIPPED: "Хүргэгдэж байна",
  COMPLETED: "Хүргэгдсэн",
  CANCELLED: "Цуцлагдсан",
};

const GROUP_BY_OPTIONS: { value: ReportGroupBy; label: string }[] = [
  { value: ReportGroupBy.DAY, label: "Өдрөөр" },
  { value: ReportGroupBy.WEEK, label: "Долоо хоногоор" },
  { value: ReportGroupBy.MONTH, label: "Сараар" },
];

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface PaidItemRow {
  orderDate: Date;
  orderId: number;
  source: string;
  customer: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  status: string;
}

const EXCEL_COLUMNS: Column<PaidItemRow>[] = [
  {
    header: "Огноо",
    width: 12,
    cell: row => ({ value: row.orderDate, type: Date, format: "yyyy-mm-dd" }),
  },
  {
    header: "Захиалгын №",
    width: 12,
    cell: row => ({ value: row.orderId, type: Number }),
  },
  {
    header: "Эх сурвалж",
    width: 22,
    cell: row => ({ value: row.source, type: String }),
  },
  {
    header: "Харилцагч",
    width: 22,
    cell: row => ({ value: row.customer, type: String }),
  },
  {
    header: "Бараа",
    width: 30,
    cell: row => ({ value: row.productName, type: String }),
  },
  {
    header: "Тоо ширхэг",
    width: 10,
    cell: row => ({ value: row.quantity, type: Number }),
  },
  {
    header: "Нэгж үнэ",
    width: 14,
    cell: row => ({ value: row.unitPrice, type: Number, format: "#,##0" }),
  },
  {
    header: "Дүн",
    width: 14,
    cell: row => ({ value: row.lineTotal, type: Number, format: "#,##0" }),
  },
  {
    header: "Төлөв",
    width: 16,
    cell: row => ({ value: row.status, type: String }),
  },
];

export default function AdminReportsPage() {
  const { showToast } = useToast();

  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [startDate, setStartDate] = useState(toDateInputValue(firstOfMonth));
  const [endDate, setEndDate] = useState(toDateInputValue(today));
  const [groupBy, setGroupBy] = useState<ReportGroupBy>(ReportGroupBy.DAY);

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.getAdminReportSummary({ startDate, endDate, groupBy });
      setSummary(data);
    } catch (error) {
      console.error("Failed to fetch report summary:", error);
      showToast("Тайлан ачаалахад алдаа гарлаа", "error");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, groupBy, showToast]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const formatCurrency = (num: number) => new Intl.NumberFormat("mn-MN").format(num) + "₮";
  const formatNumber = (num: number) => new Intl.NumberFormat("mn-MN").format(num);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await apiService.exportAdminReportCsv({ startDate, endDate });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zahialga_${startDate}_${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export report:", error);
      showToast("Тайлан татахад алдаа гарлаа", "error");
    } finally {
      setExporting(false);
    }
  };

  // Сонгосон хугацаанд төлбөр баталгаажсан (амжилттай) захиалгуудыг бүгдийг
  // хуудаслан татаж, барааны мөр бүрийг (сонгосон бараа тус бүрээр) буцаана
  const fetchPaidOrders = async (): Promise<Order[]> => {
    const pageSize = 200;
    let page = 1;
    const orders: Order[] = [];

    while (true) {
      const result = await apiService.getAdminOrders({ startDate, endDate, page, limit: pageSize });
      orders.push(...result.data);
      if (page >= result.pages || result.data.length === 0) break;
      page += 1;
    }

    return orders.filter(order => order.paymentStatus === "PAID");
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const paidOrders = await fetchPaidOrders();

      const rows: PaidItemRow[] = paidOrders.flatMap(order =>
        order.orderItems.map(item => {
          const unitPrice = parseFloat(item.unitPrice || item.price || "0") || 0;
          return {
            orderDate: new Date(order.createdAt),
            orderId: order.id,
            source: SOURCE_META[order.source]?.label ?? order.source,
            customer: order.user?.name || order.customerName || "Тодорхойгүй",
            productName: item.product?.name || item.customName || "-",
            quantity: item.quantity,
            unitPrice,
            lineTotal: unitPrice * item.quantity,
            status: STATUS_LABELS[order.status] ?? order.status,
          };
        }),
      );

      if (rows.length === 0) {
        showToast("Сонгосон хугацаанд амжилттай захиалга алга", "error");
        return;
      }

      await writeExcelFile(rows, { columns: EXCEL_COLUMNS }).toFile(
        `amjilttai_baraa_${startDate}_${endDate}.xlsx`,
      );
    } catch (error) {
      console.error("Failed to export Excel report:", error);
      showToast("Excel файл татахад алдаа гарлаа", "error");
    } finally {
      setExportingExcel(false);
    }
  };

  if (loading && !summary) {
    return <Loading />;
  }

  const avgOrderValue =
    summary && summary.orderCount > 0 ? summary.totalRevenue / summary.orderCount : 0;
  const maxSourceRevenue = Math.max(1, ...(summary?.bySource.map(s => s.revenue) ?? [0]));
  const maxTimelineRevenue = Math.max(1, ...(summary?.timeline.map(t => t.revenue) ?? [0]));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
            Орлогын тайлан
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Гараар бүртгэсэн болон вэбсайтын захиалгын орлогыг хянах
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={exporting || !summary || summary.orderCount === 0}
            className="inline-flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg font-medium transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            {exporting ? "Татаж байна..." : "CSV татах"}
          </button>
          <button
            onClick={handleExportExcel}
            disabled={exportingExcel || !summary || summary.orderCount === 0}
            title="Зөвхөн төлбөр баталгаажсан (амжилттай) захиалгын барааны жагсаалт"
            className="inline-flex items-center justify-center gap-2 bg-mega-600 hover:bg-mega-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet size={18} />
            {exportingExcel ? "Татаж байна..." : "Excel татах"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Эхлэх огноо</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mega-500 focus:border-mega-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Дуусах огноо</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mega-500 focus:border-mega-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Хугацааны цуваа
            </label>
            <select
              value={groupBy}
              onChange={e => setGroupBy(e.target.value as ReportGroupBy)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mega-500 focus:border-mega-500 bg-white"
            >
              {GROUP_BY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Нийт орлого</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(summary?.totalRevenue ?? 0)}
              </p>
              <p className="text-xs text-gray-400">Зөвхөн төлбөр баталгаажсан захиалга</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Захиалгын тоо</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatNumber(summary?.orderCount ?? 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Wallet className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Дундаж захиалгын дүн</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(avgOrderValue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* By Source Breakdown */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Эх сурвалжаар</h3>
        {summary && summary.bySource.length > 0 ? (
          <div className="space-y-4">
            {summary.bySource.map(row => (
              <div key={row.source}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${SOURCE_META[row.source]?.badge ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {SOURCE_META[row.source]?.label ?? row.source}
                  </span>
                  <span className="text-gray-600">
                    {formatCurrency(row.revenue)} · {formatNumber(row.orderCount)} захиалга
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-mega-600 rounded-full"
                    style={{ width: `${(row.revenue / maxSourceRevenue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Сонгосон хугацаанд захиалга алга</p>
        )}
      </div>

      {/* By Status Breakdown */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Төлвөөр</h3>
        {summary && summary.byStatus.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {summary.byStatus.map(row => (
              <div key={row.status} className="border border-gray-100 rounded-lg p-3">
                <p className="text-xs text-gray-500">{STATUS_LABELS[row.status] ?? row.status}</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatNumber(row.orderCount)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Сонгосон хугацаанд захиалга алга</p>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Хугацааны хандлага</h3>
        </div>
        {summary && summary.timeline.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Үе
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Захиалга
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Орлого
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summary.timeline.map(row => (
                  <tr key={row.period}>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                      {row.period}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                      {formatNumber(row.orderCount)}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden shrink-0">
                          <div
                            className="h-full bg-mega-600 rounded-full"
                            style={{ width: `${(row.revenue / maxTimelineRevenue) * 100}%` }}
                          />
                        </div>
                        {formatCurrency(row.revenue)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400 px-4 sm:px-6 py-6">
            Сонгосон хугацаанд захиалга алга
          </p>
        )}
      </div>
    </div>
  );
}
