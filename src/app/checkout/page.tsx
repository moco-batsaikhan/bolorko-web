"use client";

import React, { useState } from "react";

import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { apiService } from "@/services/apiService";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [fullName, setFullName] = useState(user?.name || "");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("mn-MN").format(price) + "₮";

  if (!cart || cart.cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-semibold">Сагс хоосон байна</h2>
          <p className="text-gray-600 mt-3">
            Захиалга хийхэд өмнө нь бүтээгдэхүүн нэмнэ үү.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  const subtotal = cart.cartItems.reduce(
    (total, item) => total + parseFloat(item.product.price) * item.quantity,
    0
  );
  const shippingCost = subtotal > 50000 ? 0 : 5000;
  const totalAmount = subtotal + shippingCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast("Нэвтрээгүй байна", "error");
      return;
    }
    // Save pending order to sessionStorage and redirect user to payment page
    setIsProcessing(true);
    try {
      const orderItems = cart.cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const orderData = {
        userId: user.id,
        orderItems,
        shippingAddress: {
          fullName,
          phone,
          city,
          addressLine,
          note,
        },
        totalAmount,
      };

      // store temporarily and proceed to payment page
      try {
        sessionStorage.setItem("pending_order", JSON.stringify(orderData));
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
          <form
            className="lg:col-span-2 bg-white rounded-lg shadow p-6"
            onSubmit={handleSubmit}
          >
            <h2 className="text-xl font-semibold mb-4">Хүргэлтийн мэдээлэл</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600">Нэр</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 block w-full border border-gray-200 rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600">Утас</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
                <label className="block text-sm text-gray-600">
                  Тайлбар (дэлгэрэнгүй)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1 block w-full border border-gray-200 rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={isProcessing}
                className="bg-mega-600 text-white px-6 py-3 rounded-lg hover:bg-mega-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing
                  ? "Төлбөр рүү шилжиж байна..."
                  : "Төлбөр рүү шилжих"}
              </button>
            </div>
          </form>

          <aside className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Захиалгын тойм</h3>
            <div className="space-y-3">
              {cart.cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div className="min-w-0">
                    <div className="truncate">{item.product.name}</div>
                    <div className="text-gray-500 text-xs">
                      {item.quantity} ширхэг
                    </div>
                  </div>
                  <div className="font-medium">
                    {formatPrice(
                      parseFloat(item.product.price) * item.quantity
                    )}
                  </div>
                </div>
              ))}

              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Нийт:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Хүргэлт:</span>
                  <span>
                    {shippingCost > 0 ? formatPrice(shippingCost) : "Үнэгүй"}
                  </span>
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
