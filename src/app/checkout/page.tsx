"use client";

import React, { useState, useEffect } from "react";

import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LoginModal } from "@/components/LoginModal";
import Loading from "@/components/Loading";
import { CreateOrderRequest } from "@/services/apiService";
import { CART_ENABLED } from "@/config/featureFlags";
import { SHIPPING_FEE } from "@/constants/constants";

// "Худалдан авах" товчоор (барааны дэлгэц) ирсэн ганц барааны мэдээлэл —
// sessionStorage-д "buy_now_item" түлхүүрээр хадгалагдана
interface BuyNowItem {
  productId: number;
  quantity: number;
  unitPrice: number;
  name: string;
  image?: string;
  selectedColor?: string | null;
  selectedSize?: string | null;
}

export default function CheckoutPage() {
  const { cart, loading: cartLoading } = useCart();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState(user?.name || "");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [buyNowItem, setBuyNowItem] = useState<BuyNowItem | null>(null);
  const [buyNowLoaded, setBuyNowLoaded] = useState(false);

  // Сагсыг алгасаад шууд ирсэн "Худалдан авах" барааг уншина
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("buy_now_item");
      if (raw) setBuyNowItem(JSON.parse(raw));
    } catch (e) {
      console.error(e);
    } finally {
      setBuyNowLoaded(true);
    }
  }, []);

  const formatPrice = (price: number) => new Intl.NumberFormat("mn-MN").format(price) + "₮";

  // Нэвтрэлтийн төлөв тодорхойгүй байгаа үед хүлээнэ
  if (authLoading) {
    return <Loading />;
  }

  // Захиалга хийхэд нэвтрэлт заавал шаардлагатай
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Нэвтрэх шаардлагатай
          </h2>
          <p className="text-gray-600 mb-6">
            Захиалга хийхийн тулд эхлээд нэвтэрнэ үү.
          </p>
          <button
            onClick={() => setShowLoginModal(true)}
            className="bg-mega-600 text-white px-6 py-3 rounded-lg hover:bg-mega-700 transition-colors"
          >
            Нэвтрэх
          </button>
        </div>
        <Footer />
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      </div>
    );
  }

  // buy-now өгөгдөл уншигдаагүй, эсвэл (сагсны горимд) сагс сервэрээс
  // ачаалагдаж дуусаагүй үед түр "хоосон" мессеж харуулахгүй
  if (!buyNowLoaded || (CART_ENABLED && !buyNowItem && cartLoading)) {
    return <Loading />;
  }

  // Захиалах зүйлсийн жагсаалт: "Худалдан авах" горим давамгайлна, эс бөгөөс
  // (CART_ENABLED=true үед) сагсны агуулгаар ажиллана
  const summaryItems = buyNowItem
    ? [
        {
          key: `buy-now-${buyNowItem.productId}`,
          name: buyNowItem.name,
          quantity: buyNowItem.quantity,
          lineTotal: buyNowItem.unitPrice * buyNowItem.quantity,
          selectedColor: buyNowItem.selectedColor,
          selectedSize: buyNowItem.selectedSize,
        },
      ]
    : CART_ENABLED && cart
    ? cart.cartItems.map(item => ({
        key: String(item.id),
        name: item.product.name,
        quantity: item.quantity,
        lineTotal: parseFloat(item.product.salePrice ?? item.product.price) * item.quantity,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
      }))
    : [];

  if (summaryItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-semibold">Захиалах бараа сонгогдоогүй байна</h2>
          <p className="text-gray-600 mt-3">
            Дэлгүүрээс бүтээгдэхүүн сонгож &quot;Худалдан авах&quot; товч дарна уу.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  const subtotal = summaryItems.reduce((total, item) => total + item.lineTotal, 0);
  // Хүргэлтийн тогтмол төлбөр үндсэн үнэ дээр нэмэгдэнэ
  const totalAmount = subtotal + SHIPPING_FEE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Энэ цэг хүртэл ирсэн бол хэрэглэгч аль хэдийн нэвтэрсэн (дээрх
    // Нэвтрэх шаардлагатай шалгалтыг давсан) — сервер token-оос
    // хэрэглэгчийг таньж захиалгад холбоно.
    setIsProcessing(true);
    try {
      // colors/sizes сонгоогүй бол selectedColor/selectedSize-г огт дамжуулахгүй
      const orderItems = buyNowItem
        ? [
            {
              productId: buyNowItem.productId,
              quantity: buyNowItem.quantity,
              selectedColor: buyNowItem.selectedColor ?? undefined,
              selectedSize: buyNowItem.selectedSize ?? undefined,
            },
          ]
        : (cart?.cartItems ?? []).map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            selectedColor: item.selectedColor ?? undefined,
            selectedSize: item.selectedSize ?? undefined,
          }));

      // phone одоо ЗААВАЛ, shippingAddress OPTIONAL тул хялбарчилсан
      // (утасны дугаараар л) урсгалд бүхэлд нь орхигдоно
      const orderData: CreateOrderRequest = CART_ENABLED
        ? {
            orderItems,
            phone,
            shippingAddress: { fullName, phone, city, addressLine, note },
          }
        : {
            orderItems,
            phone,
          };

      const pendingOrder = { ...orderData, totalAmount, email: user?.email };

      // store temporarily and proceed to payment page
      try {
        sessionStorage.setItem("pending_order", JSON.stringify(pendingOrder));
        sessionStorage.removeItem("buy_now_item");
      } catch (e) {
        console.warn("Could not write pending_order to sessionStorage", e);
      }

      router.push("/checkout/payment");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form className="lg:col-span-2 bg-white rounded-lg shadow p-6" onSubmit={handleSubmit}>
            <h2 className="text-xl font-semibold mb-4">Захиалгын мэдээлэл</h2>

            {CART_ENABLED ? (
              // Хуучин (сагс дээр суурилсан) урсгал — CART_ENABLED=true болгож буцаах боломжтой
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600">Нэр</label>
                  <input
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="mt-1 block w-full border border-gray-200 rounded px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600">Утас</label>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="mt-1 block w-full border border-gray-200 rounded px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600">Хот</label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1 block w-full border border-gray-200 rounded px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600">Хаяг</label>
                  <input
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    className="mt-1 block w-full border border-gray-200 rounded px-3 py-2"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-600">Тайлбар (дэлгэрэнгүй)</label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="mt-1 block w-full border border-gray-200 rounded px-3 py-2"
                  />
                </div>
              </div>
            ) : (
              // Хялбарчилсан урсгал: зөвхөн утасны дугаар
              <div>
                <label className="block text-sm text-gray-600">Утасны дугаар</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="\d{8}"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="99112233"
                  className="mt-1 block w-full border border-gray-200 rounded px-3 py-2"
                  required
                />
              </div>
            )}

            <div className="mt-6">
              <button
                type="submit"
                disabled={isProcessing}
                className="bg-mega-600 text-white px-6 py-3 rounded-lg hover:bg-mega-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? "Төлбөр рүү шилжиж байна..." : "Төлбөр рүү шилжих"}
              </button>
            </div>
          </form>

          <aside className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Захиалгын тойм</h3>
            <div className="space-y-3">
              {summaryItems.map(item => {
                const variant = [item.selectedColor, item.selectedSize]
                  .filter(Boolean)
                  .join(", ");
                return (
                  <div key={item.key} className="flex justify-between text-sm">
                    <div className="min-w-0">
                      <div className="truncate">
                        {item.name}
                        {variant && (
                          <span className="text-gray-500"> ({variant})</span>
                        )}
                      </div>
                      <div className="text-gray-500 text-xs">{item.quantity} ширхэг</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatPrice(item.lineTotal)}</div>
                    </div>
                  </div>
                );
              })}

              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Нийт:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Хүргэлт:</span>
                  <span>{formatPrice(SHIPPING_FEE)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold mt-2">
                  <span>Нийт дүн:</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}
