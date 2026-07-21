"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { API_BASE_URL } from "@/constants/constants";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  apiService,
  CreateOrderRequest,
  isInsufficientStockError,
} from "@/services/apiService";

interface PendingOrder extends CreateOrderRequest {
  totalAmount: number;
  email?: string;
}

interface QPayUrl {
  name: string;
  description?: string;
  logo?: string;
  link: string;
}

interface InvoiceResponse {
  invoiceId?: string;
  invoice_id?: string;
  id?: string;
  qpayData?: {
    qr_image?: string;
    urls?: QPayUrl[];
  };
}

export default function PaymentPage() {
  const { clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [invoiceResponse, setInvoiceResponse] = useState<InvoiceResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const checkPayment = useCallback(async () => {
    if (!invoiceResponse) {
      showToast("Инвойс олдсонгүй", "error");
      return;
    }

    if (!pendingOrder) {
      showToast("Захиалга олдсонгүй", "error");
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const invoiceId =
        invoiceResponse.invoiceId ||
        invoiceResponse.invoice_id ||
        invoiceResponse.id;

      if (!invoiceId) {
        throw new Error("Invoice ID алга байна");
      }

      const token = localStorage.getItem("access_token");

      const res = await fetch(
        `${API_BASE_URL}/payments/check-status/${encodeURIComponent(
          invoiceId
        )}`,
        {
          method: "GET",
          headers: {
            accept: "*/*",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }

      const data = await res.json();

      // Example response: { invoiceId: 'MEGA-...', status: 'PAID', paidAt: '...' }
      if (data.status === "PAID") {
        try {
          await apiService.createOrder(pendingOrder);
          sessionStorage.removeItem("pending_order");
          await clearCart();
        } catch (e) {
          console.error("Order creation failed", e);
          // Backend транзакцтай тул захиалга огт үүсээгүй — нөөц зөрчил үлдэхгүй
          if (isInsufficientStockError(e)) {
            showToast(
              "Уучлаарай, зарим барааны нөөц дуссан тул захиалга үүсгэж чадсангүй. Бидэнтэй холбогдоно уу.",
              "error"
            );
          } else {
            showToast("Төлбөр амжилттай, захиалга үүсэхэд алдаа гарлаа", "error");
          }
          router.push(user ? "/orders" : "/");
          return;
        }

        showToast("Төлбөр амжилттай төлөгдсөн", "success");
        router.push(user ? "/orders" : "/");
      } else {
        showToast(`Төлбөрийн төлөв: ${data.status || "UNKNOWN"}`, "error");
      }
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Төлбөр шалгах явцад алдаа гарлаа";
      setErrorMsg(message);
      showToast(message, "error");
    } finally {
      setIsProcessing(false);
    }
  }, [invoiceResponse, pendingOrder, showToast, router, clearCart, user]);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("pending_order");
      if (!raw) {
        router.push("/checkout");
        return;
      }
      setPendingOrder(JSON.parse(raw));
    } catch (e) {
      console.error(e);
      router.push("/checkout");
    }
  }, [router]);

  // Poll payment status in background every 5 seconds while an invoice exists
  useEffect(() => {
    if (!invoiceResponse) return;

    const interval = setInterval(() => {
      // avoid starting overlapping checks
      if (!isProcessing) {
        // call checkPayment; safe because checkPayment is memoized with useCallback
        void checkPayment();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [invoiceResponse, checkPayment, isProcessing]);

  // Auto-trigger invoice creation when pendingOrder is ready
  // (зочны захиалга дэмжигддэг тул нэвтрэлт шаардахгүй)
  useEffect(() => {
    if (!pendingOrder) return;
    if (invoiceResponse) return; // already have response
    if (isProcessing) return;

    // call payment flow automatically
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    handlePayment();
    // NOTE: intentionally not listing handlePayment in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingOrder, user]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("mn-MN").format(price) + "₮";

  const handlePayment = async () => {
    if (!pendingOrder) {
      showToast("Захиалга олдсонгүй", "error");
      return;
    }
    setIsProcessing(true);
    setErrorMsg(null);
    setInvoiceResponse(null);

    try {
      // Build request body expected by the payments API
      const body = {
        // Анхаар: туршилтын үед энд түр 10 гэж тавьж байсан —
        // одоо захиалгын жинхэнэ нийт дүнг илгээнэ
        amount: pendingOrder.totalAmount,
        redirectUrl: `${API_BASE_URL}/payments/webhook/qpay`,
        email: user?.email || pendingOrder.email || "",
        productName: `Bolorko Захиалга`,
      };

      const token = localStorage.getItem("access_token");

      const res = await fetch(`${API_BASE_URL}/payments/invoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setInvoiceResponse(data);

      //!!!!!!!!!!!!!!!!!!!!!! Optionally create order after invoice created
      //   try {
      //     await apiService.createOrder(pendingOrder);
      //     // clear local pending order and cart
      //     sessionStorage.removeItem("pending_order");
      //     await clearCart();
      //   } catch (e) {
      //     // ignore order creation errors for now
      //     console.error("Order creation error", e);
      //   }
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Төлбөр амжилтгүй боллоо";
      setErrorMsg(message);
      showToast(message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow p-6">
          {!pendingOrder ? (
            <p>Төлбөр хийх захиалга олдсонгүй. Буцах...</p>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <div className="text-lg font-semibold">
                  Нийт: {formatPrice(pendingOrder.totalAmount)}
                </div>
                <button
                  onClick={checkPayment}
                  className="bg-mega-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  {isProcessing ? "Шалгаж байна..." : "Төлбөр шалгах"}
                </button>
              </div>

              {errorMsg && (
                <div className="text-red-600 text-sm mb-4">{errorMsg}</div>
              )}

              {invoiceResponse && (
                <div className="mt-6 bg-gray-50 p-4 rounded">
                  <div className="text-sm">
                    {invoiceResponse.qpayData?.qr_image && (
                      <div className="mt-4">
                        <img
                          alt="qpay-qr"
                          className="w-48 h-48 object-contain"
                          src={`data:image/png;base64,${invoiceResponse.qpayData.qr_image}`}
                        />
                      </div>
                    )}

                    {invoiceResponse.qpayData?.urls && (
                      <div className="mt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {invoiceResponse.qpayData.urls.map(
                            (u: QPayUrl, i: number) => (
                              <a
                                key={i}
                                href={u.link}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-3 p-2 border rounded hover:shadow-sm"
                              >
                                {u.logo ? (
                                  <img
                                    src={u.logo}
                                    alt={u.name}
                                    className="w-10 h-10 object-contain"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-100 rounded" />
                                )}
                                <div className="text-sm">
                                  <div className="font-medium">{u.name}</div>
                                  <div className="text-xs text-gray-500">
                                    {u.description}
                                  </div>
                                </div>
                              </a>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
