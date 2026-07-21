"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/constants/roles";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, LogOut, Home } from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, login, logout, error } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = isAuthenticated && user?.role === UserRole.ADMIN;

  // Админ эрхтэй нь батлагдвал шууд удирдлагын хэсэг рүү шилжүүлнэ
  useEffect(() => {
    if (isLoading) return;
    if (isAdmin) {
      router.replace("/admin/users");
    }
  }, [isLoading, isAdmin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      // Амжилттай бол дээрх useEffect админ эсэхийг шалгаад шилжүүлнэ
    } finally {
      setSubmitting(false);
    }
  };

  // Auth ачаалж байх үед эсвэл админ руу шилжиж байх үед
  if (isLoading || isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mega-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isAdmin ? "Админ панел руу шилжүүлж байна..." : "Шалгаж байна..."}
          </p>
        </div>
      </div>
    );
  }

  // Нэвтэрсэн ч админ эрхгүй хэрэглэгч
  if (isAuthenticated && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
            <ShieldCheck className="text-red-600" size={32} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Хандах эрхгүй байна</h1>
          <p className="text-gray-600 mb-6">
            <span className="font-medium">{user?.email}</span> бүртгэл админ эрхгүй байна.
            Админ эрхтэй бүртгэлээр дахин нэвтэрнэ үү.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={logout}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut size={18} />
              Гарч, өөр бүртгэлээр нэвтрэх
            </button>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Home size={18} />
              Нүүр хуудас руу буцах
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Нэвтрээгүй — админ login форм
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-red-700 to-red-500 px-8 py-6 text-white text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/15 rounded-full mb-3">
              <ShieldCheck size={28} />
            </div>
            <h1 className="text-xl font-bold">Bolorko Админ</h1>
            <p className="text-sm text-red-100 mt-1">Удирдлагын системд нэвтрэх</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">И-мэйл</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Нууц үг</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-11 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Нууц үг нуух" : "Нууц үг харах"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Нэвтэрч байна...
                </>
              ) : (
                "Нэвтрэх"
              )}
            </button>
          </form>

          <div className="px-8 pb-6 text-center">
            <Link href="/" className="text-sm text-gray-500 hover:text-mega-600 transition-colors">
              ← Нүүр хуудас руу буцах
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
