"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  apiService,
  Cart,
  CartTotal,
  isInsufficientStockError,
} from "@/services/apiService";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

interface CartContextType {
  cart: Cart | null;
  cartTotal: CartTotal | null;
  loading: boolean;
  itemCount: number;
  addToCart: (
    productId: number,
    quantity?: number,
    options?: { selectedColor?: string; selectedSize?: string }
  ) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartTotal, setCartTotal] = useState<CartTotal | null>(null);
  const [loading, setLoading] = useState(false);

  const itemCount = cart?.cartItems.reduce((total, item) => total + item.quantity, 0) || 0;

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart(null);
      setCartTotal(null);
      return;
    }

    try {
      setLoading(true);
      const [cartData, totalData] = await Promise.all([
        apiService.getUserCart(user.id).catch(() => null),
        apiService.getCartTotal(user.id).catch(() => null),
      ]);

      setCart(cartData);
      setCartTotal(totalData);
    } catch (error) {
      console.error("Failed to refresh cart:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addToCart = async (
    productId: number,
    quantity: number = 1,
    options?: { selectedColor?: string; selectedSize?: string }
  ) => {
    if (!user) {
      showToast("Сагсанд нэмэхийн тулд эхлээд нэвтэрнэ үү", "error");
      return;
    }

    try {
      setLoading(true);
      await apiService.addToCart(user.id, {
        productId,
        quantity,
        selectedColor: options?.selectedColor,
        selectedSize: options?.selectedSize,
      });
      await refreshCart();
      showToast("Бүтээгдэхүүн сагсанд нэмэгдлээ", "success");
    } catch (error) {
      console.error("Failed to add to cart:", error);
      if (isInsufficientStockError(error)) {
        showToast("Уучлаарай, энэ барааны нөөц хүрэлцэхгүй байна", "error");
      } else {
        showToast("Сагсанд нэмэхэд алдаа гарлаа", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    if (!user) return;

    try {
      setLoading(true);
      await apiService.updateCartItemQuantity(user.id, itemId, { quantity });
      await refreshCart();
      showToast("Тоо ширхэг шинэчлэгдлээ", "success");
    } catch (error) {
      console.error("Failed to update quantity:", error);
      if (isInsufficientStockError(error)) {
        showToast("Уучлаарай, энэ барааны нөөц хүрэлцэхгүй байна", "error");
      } else {
        showToast("Тоо ширхэг шинэчлэхэд алдаа гарлаа", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: number) => {
    if (!user) return;

    try {
      setLoading(true);
      await apiService.removeCartItem(user.id, itemId);
      await refreshCart();
      showToast("Бүтээгдэхүүн сагснаас хасагдлаа", "success");
    } catch (error) {
      console.error("Failed to remove item:", error);
      showToast("Бүтээгдэхүүн хасахад алдаа гарлаа", "error");
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      setLoading(true);
      await apiService.clearCart(user.id);
      await refreshCart();
      showToast("Сагс хоосон болгогдлоо", "success");
    } catch (error) {
      console.error("Failed to clear cart:", error);
      showToast("Сагс хоосон болгоход алдаа гарлаа", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartTotal,
        loading,
        itemCount,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
