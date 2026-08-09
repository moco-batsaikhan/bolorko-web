"use client";

import Link from "next/link";
import { LogOut, ShoppingBag } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export function AdminHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/admin/products" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/imgs/icon.png" alt="Bolorko Logo" className="w-10 h-10 object-contain" />
            </div>
            <span className="font-display text-2xl font-bold tracking-wide text-gray-900 group-hover:text-red-600 transition-colors duration-200">
              BOLORKO
            </span>
            <span className="hidden sm:inline text-xs font-medium uppercase tracking-widest text-gray-400 border-l border-gray-200 pl-3 ml-1">
              Админ
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2 md:gap-4">
            <Link
              href="/"
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-mega-600 hover:bg-mega-50 rounded-lg transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Дэлгүүр рүү очих
            </Link>

            <div className="hidden md:block text-right">
              <div className="text-sm font-semibold text-gray-900">
                {user?.name || "Админ"}
              </div>
              <div className="text-xs text-gray-500">{user?.phone}</div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Гарах</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
