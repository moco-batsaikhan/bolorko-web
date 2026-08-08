"use client";

import React, { useEffect, useState, useCallback } from "react";
import QRCode from "qrcode";
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
  getApiErrorMessage,
  StorePayLoan,
  PocketInvoice,
} from "@/services/apiService";

const POCKET_FAILURE_STATES = new Set(["cancelled", "rejected", "unsuccess"]);

interface PendingOrder extends CreateOrderRequest {
  totalAmount: number;
  // Захиалгад Storepay/Pocket-ээр төлж болохгүй бараа орсон эсэхийг
  // checkout хуудаснаас дамжуулна (тодорхойгүй бол зөвшөөрсөнд тооцно)
  installmentPaymentAllowed?: boolean;
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

  const [paymentMethod, setPaymentMethod] = useState<"qpay" | "storepay" | "pocket">(
    "qpay",
  );
  const [mobileNumber, setMobileNumber] = useState("");
  const [mobileError, setMobileError] = useState<string | null>(null);
  // StorePay-д orderId урьдчилан шаардлагатай тул QPay-ээс ялгаатай нь
  // захиалгыг зээл үүсгэхээс өмнө үүсгэнэ — амжилтгүй болоод дахин оролдоход
  // давхар захиалга үүсгэхгүйн тулд id-г хадгална
  const [storePayOrderId, setStorePayOrderId] = useState<number | null>(null);
  const [storePayLoan, setStorePayLoan] = useState<StorePayLoan | null>(null);
  const [storePayStatus, setStorePayStatus] = useState<
    "idle" | "pending" | "confirmed" | "timeout"
  >("idle");
  const [isCancellingStorePay, setIsCancellingStorePay] = useState(false);

  // Pocket Zero-д ч мөн адил orderId урьдчилан шаардлагатай — дахин
  // оролдоход давхар захиалга үүсгэхгүйн тулд id-г хадгална
  const [pocketOrderId, setPocketOrderId] = useState<number | null>(null);
  const [pocketInvoice, setPocketInvoice] = useState<PocketInvoice | null>(null);
  const [pocketQrDataUrl, setPocketQrDataUrl] = useState<string | null>(null);
  const [pocketStatus, setPocketStatus] = useState<
    "idle" | "pending" | "paid" | "failed" | "timeout"
  >("idle");
  const [pocketFailureReason, setPocketFailureReason] = useState<string | null>(null);

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

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("mn-MN").format(price) + "₮";

  // Тодорхойгүй (хуучин sessionStorage өгөгдөл) бол зөвшөөрсөнд тооцно
  const installmentAllowed = pendingOrder?.installmentPaymentAllowed !== false;

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
        // User дээр email талбар байхгүй болсон тул QPay invoice-д хоосон
        // утга дамжуулна (энэ endpoint нь mail/* биш, тусад нь шалгах хэрэгтэй)
        email: "",
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

  const handleStorePayPayment = async () => {
    if (!pendingOrder) {
      showToast("Захиалга олдсонгүй", "error");
      return;
    }
    // UI-аас нуусан ч гэсэн шууд дуудагдах боломжтой тул давхар хамгаална
    if (!installmentAllowed) {
      showToast("Энэ бараанд хэсэгчилсэн төлбөр боломжгүй", "error");
      return;
    }
    if (!/^\d{8}$/.test(mobileNumber)) {
      setMobileError("Утасны дугаар 8 оронтой байх ёстой");
      return;
    }
    setMobileError(null);
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // StorePay-д orderId урьдчилан шаардлагатай (QPay эсрэгээрээ, төлбөр
      // баталгаажсаны дараа захиалга үүсгэдэг) — өмнө нь үүссэн бол дахин үүсгэхгүй
      let orderId = storePayOrderId;
      if (!orderId) {
        const { order } = await apiService.createOrder(pendingOrder);
        orderId = order.id;
        setStorePayOrderId(orderId);
      }

      const loan = await apiService.createStorePayLoan({
        mobileNumber,
        description: `Order #${orderId}`,
        amount: pendingOrder.totalAmount,
        orderId,
      });

      setStorePayLoan(loan);
      setStorePayStatus("pending");

      try {
        sessionStorage.setItem(
          "storepay_loan",
          JSON.stringify({ loanId: loan.loanId, requestId: loan.requestId, orderId })
        );
      } catch (e) {
        console.warn("Could not write storepay_loan to sessionStorage", e);
      }
    } catch (err) {
      console.error(err);
      const message = getApiErrorMessage(err, "StorePay зээл үүсгэхэд алдаа гарлаа");
      setErrorMsg(message);
      showToast(message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStorePayCancel = async () => {
    if (!storePayLoan) return;
    setIsCancellingStorePay(true);

    try {
      await apiService.cancelStorePayLoan(storePayLoan.loanId);
      showToast("StorePay зээл цуцлагдлаа", "success");
    } catch (err) {
      console.error(err);
      showToast(getApiErrorMessage(err, "Цуцлахад алдаа гарлаа"), "error");
    } finally {
      setIsCancellingStorePay(false);
      setStorePayLoan(null);
      setStorePayStatus("idle");
      sessionStorage.removeItem("storepay_loan");
    }
  };

  // StorePay баталгаажилтыг 4 секунд тутам polling хийж шалгана,
  // 8 минутын дотор баталгаажаагүй бол timeout болгоно
  useEffect(() => {
    if (!storePayLoan || storePayStatus !== "pending") return;

    const interval = setInterval(async () => {
      try {
        const result = await apiService.checkStorePayLoan(storePayLoan.loanId);
        if (result.value === true || result.data?.isConfirmed) {
          setStorePayStatus("confirmed");
        }
      } catch (err) {
        console.error("StorePay check error", err);
      }
    }, 4000);

    const timeout = setTimeout(() => {
      setStorePayStatus((prev) => (prev === "pending" ? "timeout" : prev));
    }, 8 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [storePayLoan, storePayStatus]);

  // Баталгаажсаны дараа сагс/сешн цэвэрлэж захиалгын хуудас руу шилжинэ
  useEffect(() => {
    if (storePayStatus !== "confirmed") return;

    sessionStorage.removeItem("pending_order");
    sessionStorage.removeItem("storepay_loan");
    void clearCart();
    showToast("Зээл баталгаажлаа, захиалга амжилттай боллоо", "success");
    router.push(user ? "/orders" : "/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storePayStatus]);

  const handlePocketPayment = async () => {
    if (!pendingOrder) {
      showToast("Захиалга олдсонгүй", "error");
      return;
    }
    // UI-аас нуусан ч гэсэн шууд дуудагдах боломжтой тул давхар хамгаална
    if (!installmentAllowed) {
      showToast("Энэ бараанд хэсэгчилсэн төлбөр боломжгүй", "error");
      return;
    }
    setIsProcessing(true);
    setErrorMsg(null);
    setPocketFailureReason(null);

    try {
      // Pocket-д ч мөн StorePay-тэй адил orderId урьдчилан шаардлагатай
      let orderId = pocketOrderId;
      if (!orderId) {
        const { order } = await apiService.createOrder(pendingOrder);
        orderId = order.id;
        setPocketOrderId(orderId);
      }

      // Invoice үүсгэхээс өмнө order.id бэлэн (хүчинтэй) эсэхийг шалгана
      if (!orderId || Number.isNaN(orderId)) {
        throw new Error("Захиалга бэлэн болоогүй байна");
      }

      const invoice = await apiService.createPocketInvoice({
        amount: pendingOrder.totalAmount,
        orderId,
        info: `Order #${orderId}`,
      });

      setPocketInvoice(invoice);
      setPocketStatus("pending");

      try {
        sessionStorage.setItem(
          "pocket_invoice",
          JSON.stringify({ orderNumber: invoice.orderNumber, orderId })
        );
      } catch (e) {
        console.warn("Could not write pocket_invoice to sessionStorage", e);
      }
    } catch (err) {
      console.error(err);
      const message = getApiErrorMessage(err, "Pocket төлбөр эхлүүлэхэд алдаа гарлаа");
      setErrorMsg(message);
      showToast(message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Дахин оролдоход хуучин invoice-г шинэчлэхгүй, шинээр үүсгэнэ
  // (орших orderId-г дахин ашиглана)
  const handlePocketRetry = () => {
    setPocketInvoice(null);
    setPocketQrDataUrl(null);
    setPocketStatus("idle");
    setPocketFailureReason(null);
    sessionStorage.removeItem("pocket_invoice");
    void handlePocketPayment();
  };

  // qr нь шахагдсан опак string тул зөвхөн QR зурган хэлбэрт хөрвүүлж харуулна,
  // задлан унших оролдлого хийхгүй
  useEffect(() => {
    if (!pocketInvoice?.qr) {
      setPocketQrDataUrl(null);
      return;
    }

    let cancelled = false;
    QRCode.toDataURL(pocketInvoice.qr)
      .then((url) => {
        if (!cancelled) setPocketQrDataUrl(url);
      })
      .catch((err) => {
        console.error("Pocket QR render error", err);
      });

    return () => {
      cancelled = true;
    };
  }, [pocketInvoice?.qr]);

  // Pocket invoice төлөвийг 4 секунд тутам polling хийж шалгана,
  // 8 минутын дотор эцсийн төлөвт хүрээгүй бол timeout болгоно
  useEffect(() => {
    if (!pocketInvoice || pocketStatus !== "pending") return;

    const interval = setInterval(async () => {
      try {
        const result = await apiService.checkPocketInvoiceStatus(
          pocketInvoice.orderNumber
        );
        if (result.state === "paid") {
          setPocketStatus("paid");
        } else if (POCKET_FAILURE_STATES.has(result.state)) {
          setPocketFailureReason(result.description);
          setPocketStatus("failed");
        }
        // pending/processing/processed — үргэлжлүүлж хүлээнэ
      } catch (err) {
        console.error("Pocket check error", err);
      }
    }, 4000);

    const timeout = setTimeout(() => {
      setPocketStatus((prev) => (prev === "pending" ? "timeout" : prev));
    }, 8 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [pocketInvoice, pocketStatus]);

  // Төлбөр амжилттай болсны дараа сагс/сешн цэвэрлэж захиалгын хуудас руу шилжинэ
  useEffect(() => {
    if (pocketStatus !== "paid") return;

    sessionStorage.removeItem("pending_order");
    sessionStorage.removeItem("pocket_invoice");
    void clearCart();
    showToast("Төлбөр амжилттай төлөгдлөө", "success");
    router.push(user ? "/orders" : "/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pocketStatus]);

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
                {invoiceResponse && (
                  <button
                    onClick={checkPayment}
                    disabled={isProcessing}
                    className="bg-mega-600 text-white px-4 py-2 rounded disabled:opacity-50"
                  >
                    {isProcessing ? "Шалгаж байна..." : "Төлбөр шалгах"}
                  </button>
                )}
              </div>

              {errorMsg && (
                <div className="text-red-600 text-sm mb-4">{errorMsg}</div>
              )}

              {!invoiceResponse && !storePayLoan && !pocketInvoice && (
                <div className="mb-6">
                  <div className="text-sm font-medium text-gray-700 mb-3">
                    Төлбөрийн хэрэгсэл сонгоно уу
                  </div>
                  {/* Шууд төлөх */}
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Шууд төлөх
                  </div>
                  <div className="grid grid-cols-1 gap-4 mb-5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("qpay")}
                      className={`flex items-center gap-3 text-left p-4 border-2 rounded-lg transition-colors ${
                        paymentMethod === "qpay"
                          ? "border-mega-600 bg-mega-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/imgs/qpay.jpg"
                        alt="QPay"
                        className="w-10 h-10 object-contain rounded flex-shrink-0"
                      />
                      <div>
                        <div className="font-semibold">QPay</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Банкны апп-аар шууд төлөх
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Хуваан төлөх — StorePay, Pocket */}
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Хуваан төлөх
                  </div>
                  {installmentAllowed ? (
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("storepay")}
                        className={`flex items-center gap-3 text-left p-4 border-2 rounded-lg transition-colors ${
                          paymentMethod === "storepay"
                            ? "border-mega-600 bg-mega-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/imgs/storepay.jpg"
                          alt="StorePay"
                          className="w-10 h-10 object-contain rounded flex-shrink-0"
                        />
                        <div>
                          <div className="font-semibold">StorePay</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Зээлээр авах (лизинг)
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod("pocket")}
                        className={`flex items-center gap-3 text-left p-4 border-2 rounded-lg transition-colors ${
                          paymentMethod === "pocket"
                            ? "border-mega-600 bg-mega-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/imgs/pocket.png"
                          alt="Pocket"
                          className="w-10 h-10 object-contain rounded flex-shrink-0"
                        />
                        <div>
                          <div className="font-semibold">Pocket Zero</div>
                          <div className="text-xs text-gray-500 mt-1">
                            QR/апп-аар зээлээр авах
                          </div>
                        </div>
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-4">
                      Энэ бараанд хэсэгчилсэн төлбөр (Storepay/Pocket) боломжгүй. QPay-ээр
                      төлнө үү.
                    </p>
                  )}

                  {installmentAllowed && paymentMethod === "storepay" && (
                    <div className="mt-4 max-w-xs">
                      <label className="block text-sm text-gray-600 mb-1">
                        Утасны дугаар
                      </label>
                      <input
                        value={mobileNumber}
                        onChange={(e) => {
                          setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 8));
                          setMobileError(null);
                        }}
                        placeholder="99xxxxxx"
                        inputMode="numeric"
                        maxLength={8}
                        className="block w-full border border-gray-200 rounded px-3 py-2"
                      />
                      {mobileError && (
                        <p className="text-red-600 text-xs mt-1">{mobileError}</p>
                      )}
                    </div>
                  )}

                  <div className="mt-4">
                    {paymentMethod === "qpay" && (
                      <button
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="bg-mega-600 text-white px-6 py-3 rounded-lg hover:bg-mega-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? "Түр хүлээнэ үү..." : "QPay-ээр төлөх"}
                      </button>
                    )}
                    {paymentMethod === "storepay" && (
                      <button
                        onClick={handleStorePayPayment}
                        disabled={isProcessing}
                        className="bg-mega-600 text-white px-6 py-3 rounded-lg hover:bg-mega-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? "Түр хүлээнэ үү..." : "StorePay-аар авах"}
                      </button>
                    )}
                    {paymentMethod === "pocket" && (
                      <button
                        onClick={handlePocketPayment}
                        disabled={isProcessing}
                        className="bg-mega-600 text-white px-6 py-3 rounded-lg hover:bg-mega-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? "Түр хүлээнэ үү..." : "Pocket Zero-оор авах"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {storePayLoan && (
                <div className="mt-6 bg-gray-50 p-6 rounded text-center">
                  {storePayStatus === "pending" && (
                    <>
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-mega-600 mx-auto mb-4" />
                      <p className="font-medium">Хүлээгдэж байна...</p>
                      <p className="text-sm text-gray-500 mt-2">
                        StorePay апп/дэлгүүрийн менежерээр зээлээ баталгаажуулна
                        уу. Баталгаажсаны дараа автоматаар үргэлжлүүлнэ.
                      </p>
                    </>
                  )}
                  {storePayStatus === "timeout" && (
                    <>
                      <p className="font-medium text-red-600">
                        Хугацаа дууссан
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        StorePay апп дээрээ шалгана уу, эсвэл цуцлаад дахин
                        оролдоно уу.
                      </p>
                    </>
                  )}
                  <button
                    onClick={handleStorePayCancel}
                    disabled={isCancellingStorePay}
                    className="mt-4 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 disabled:opacity-50"
                  >
                    {isCancellingStorePay ? "Цуцалж байна..." : "Цуцлах"}
                  </button>
                </div>
              )}

              {pocketInvoice && (
                <div className="mt-6 bg-gray-50 p-6 rounded text-center">
                  {pocketStatus === "pending" && (
                    <>
                      {pocketQrDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={pocketQrDataUrl}
                          alt="Pocket QR"
                          className="w-48 h-48 object-contain mx-auto mb-4"
                        />
                      ) : (
                        <div className="w-48 h-48 mx-auto mb-4 flex items-center justify-center text-sm text-gray-400">
                          QR код бэлдэж байна...
                        </div>
                      )}

                      <a
                        href={pocketInvoice.deeplink}
                        className="block sm:hidden bg-mega-600 text-white px-6 py-3 rounded-lg mb-4"
                      >
                        Pocket аппаар төлөх
                      </a>

                      <p className="font-medium">Хүлээгдэж байна...</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Pocket апп-аараа QR кодыг уншуулах эсвэл дээрх товчоор
                        шууд нээж төлбөрөө баталгаажуулна уу.
                      </p>
                    </>
                  )}
                  {pocketStatus === "timeout" && (
                    <>
                      <p className="font-medium text-red-600">
                        Хугацаа дууссан
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Хугацаа дууслаа, дахин оролдоно уу.
                      </p>
                      <button
                        onClick={handlePocketRetry}
                        disabled={isProcessing}
                        className="mt-4 bg-mega-600 text-white px-4 py-2 rounded disabled:opacity-50"
                      >
                        {isProcessing ? "Түр хүлээнэ үү..." : "Дахин оролдох"}
                      </button>
                    </>
                  )}
                  {pocketStatus === "failed" && (
                    <>
                      <p className="font-medium text-red-600">
                        Төлбөр амжилтгүй боллоо
                      </p>
                      {pocketFailureReason && (
                        <p className="text-sm text-gray-500 mt-2">
                          {pocketFailureReason}
                        </p>
                      )}
                      <button
                        onClick={handlePocketRetry}
                        disabled={isProcessing}
                        className="mt-4 bg-mega-600 text-white px-4 py-2 rounded disabled:opacity-50"
                      >
                        {isProcessing ? "Түр хүлээнэ үү..." : "Дахин оролдох"}
                      </button>
                    </>
                  )}
                </div>
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
