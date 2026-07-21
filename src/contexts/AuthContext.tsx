"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiService, User } from "../services/apiService";
import { STORAGE_KEYS } from "../constants/constants";
import { useToast } from "./ToastContext";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const clearSession = () => {
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      setUser(null);
    };

    const initAuth = async () => {
      const savedUser = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      if (!savedUser || !token) {
        setIsLoading(false);
        return;
      }

      let parsedUser: User | null = null;
      try {
        parsedUser = JSON.parse(savedUser);
      } catch (error) {
        console.error("Error parsing saved user data:", error);
        clearSession();
        setIsLoading(false);
        return;
      }

      // localStorage-д хадгалсан мэдээлэл хуучирсан байж болзошгүй тул
      // token-г backend дээр баталгаажуулж, хэрэглэгчийн мэдээллийг шинэчилнэ
      try {
        const freshUser = await apiService.validateSession();
        if (freshUser) {
          const mergedUser = { ...parsedUser, ...freshUser };
          setUser(mergedUser);
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(mergedUser));
        } else {
          // Token хүчингүй (хуучирсан эсвэл өөр backend-ийнх) — session-г цэвэрлэнэ
          clearSession();
        }
      } catch (error) {
        // Сүлжээ/серверийн түр зуурын алдаа — хадгалсан мэдээллээр үргэлжлүүлнэ
        console.error("Session validation failed, using saved user:", error);
        setUser(parsedUser);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Backend-ийн алдааны мессежийг хэрэглэгчид ойлгомжтой монгол хэл рүү хөрвүүлнэ
  const translateAuthError = (error: unknown): string => {
    if (!(error instanceof Error)) return "Нэвтрэхэд алдаа гарлаа";
    if (/invalid credentials/i.test(error.message)) {
      return "И-мэйл эсвэл нууц үг буруу байна";
    }
    if (/failed to fetch|network/i.test(error.message)) {
      return "Сервертэй холбогдож чадсангүй. Дахин оролдоно уу.";
    }
    return error.message;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.login({ email, password });
      setUser(response.user);
      setIsLoading(false);
      return true;
    } catch (error: unknown) {
      // console.error ашиглахгүй — Next dev overlay-г crash шиг харуулдаг
      console.warn("Login failed:", error instanceof Error ? error.message : error);
      setError(translateAuthError(error));
      setIsLoading(false);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.register({ name, email, password });
      setUser(response.user);
      setIsLoading(false);
      return true;
    } catch (error: unknown) {
      console.warn("Register failed:", error instanceof Error ? error.message : error);
      setError(
        error instanceof Error && /already exists|давхардсан/i.test(error.message)
          ? "Энэ и-мэйл хаягаар аль хэдийн бүртгүүлсэн байна"
          : translateAuthError(error)
      );
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiService.logout();
      showToast("Амжилттай гарлаа!", "success");
    } catch (error) {
      console.error("Logout error:", error);
      showToast("Гарахад алдаа гарлаа", "error");
    } finally {
      setUser(null);
      setError(null);
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    isLoading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
