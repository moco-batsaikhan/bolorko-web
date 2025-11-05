"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ShoppingCart, User, Menu, X, LogOut, LogIn } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { LoginModal } from "./LoginModal";
import { UserRole } from "@/constants/roles";

export function Header() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileProfileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!isProfileOpen) return;

      const target = event.target as Node;

      const isOutsideDesktop = profileRef.current && !profileRef.current.contains(target);
      const isOutsideMobile =
        mobileProfileRef.current && !mobileProfileRef.current.contains(target);

      if (isOutsideDesktop && isOutsideMobile) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen]);

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200 ">
                <img
                  src="/imgs/mega-logo.png"
                  alt="MEGA Logo"
                  className="w-10 h-10 object-contain transform group-hover:rotate-180 transition-transform duration-300"
                />
              </div>
              <span className="text-xl font-bold text-gray-900 group-hover:text-mega-600 transition-colors duration-200">
                MEGA{" "}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              href="/"
              className={`relative px-3 py-2 text-sm font-medium transition-all duration-300 group ${
                pathname === "/" ? "text-mega-600" : "text-gray-700 hover:text-mega-600"
              }`}
            >
              Нүүр
              <span
                className={`absolute bottom-0 left-0 h-0.5 bg-mega-600 transition-all duration-300 ${
                  pathname === "/" ? "w-full" : "w-0 group-hover:w-full"
                }`}
              ></span>
            </Link>
            <Link
              href="/news"
              className={`relative px-3 py-2 text-sm font-medium transition-all duration-300 group ${
                pathname === "/news" ? "text-mega-600" : "text-gray-700 hover:text-mega-600"
              }`}
            >
              Мэдээ
              <span
                className={`absolute bottom-0 left-0 h-0.5 bg-mega-600 transition-all duration-300 ${
                  pathname === "/news" ? "w-full" : "w-0 group-hover:w-full"
                }`}
              ></span>
            </Link>
            <Link
              href="/shop"
              className={`relative px-3 py-2 text-sm font-medium transition-all duration-300 group ${
                pathname === "/shop" ? "text-mega-600" : "text-gray-700 hover:text-mega-600"
              }`}
            >
              Дэлгүүр
              <span
                className={`absolute bottom-0 left-0 h-0.5 bg-mega-600 transition-all duration-300 ${
                  pathname === "/shop" ? "w-full" : "w-0 group-hover:w-full"
                }`}
              ></span>
            </Link>
            <Link
              href="/lessons"
              className={`relative px-3 py-2 text-sm font-medium transition-all duration-300 group ${
                pathname === "/lessons" ? "text-mega-600" : "text-gray-700 hover:text-mega-600"
              }`}
            >
              Хичээл
              <span
                className={`absolute bottom-0 left-0 h-0.5 bg-mega-600 transition-all duration-300 ${
                  pathname === "/lessons" ? "w-full" : "w-0 group-hover:w-full"
                }`}
              ></span>
            </Link>
            <Link
              href="/competitions"
              className={`relative px-3 py-2 text-sm font-medium transition-all duration-300 group ${
                pathname === "/competitions" ? "text-mega-600" : "text-gray-700 hover:text-mega-600"
              }`}
            >
              Тэмцээн
              <span
                className={`absolute bottom-0 left-0 h-0.5 bg-mega-600 transition-all duration-300 ${
                  pathname === "/competitions" ? "w-full" : "w-0 group-hover:w-full"
                }`}
              ></span>
            </Link>
          </nav>

          {/* Right side icons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/cart"
              className="p-2 text-gray-700 hover:text-mega-600 transition-all duration-300 hover:bg-mega-50 rounded-lg transform hover:scale-110"
              onClick={() => setIsMenuOpen(false)}
            >
              <ShoppingCart className="w-5 h-5" />
            </Link>
            <div className="relative" ref={profileRef}>
              <button
                className="p-2 text-gray-700 hover:text-mega-600 transition-all duration-300 hover:bg-mega-50 rounded-lg transform hover:scale-110"
                onClick={() =>
                  isAuthenticated ? setIsProfileOpen(!isProfileOpen) : setShowLoginModal(true)
                }
              >
                {isAuthenticated ? <User className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && isAuthenticated && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 transform opacity-100 scale-100 animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="font-semibold text-gray-900 animate-in slide-in-from-left-4 duration-300">
                      {user?.name || "Хэрэглэгч"}
                    </div>
                    <div className="text-sm text-gray-500">{user?.email}</div>
                  </div>
                  {user?.role === UserRole.ADMIN && (
                    <Link
                      href="/admin-dashboard"
                      className="block px-4 py-2 text-gray-700 hover:bg-mega-50 hover:text-mega-600 transition-all duration-200 border-b border-gray-100 hover:translate-x-1"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Админ панель
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-gray-700 hover:bg-mega-50 hover:text-mega-600 transition-all duration-200 border-b border-gray-100 hover:translate-x-1"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    Хувийн мэдээлэл
                  </Link>
                  <Link
                    href="/orders"
                    className="block px-4 py-2 text-gray-700 hover:bg-mega-50 hover:text-mega-600 transition-all duration-200 border-b border-gray-100 hover:translate-x-1"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    Гүйлгээний түүх
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-gray-700 hover:bg-mega-50 hover:text-mega-600 transition-all duration-200 border-b border-gray-100 hover:translate-x-1"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    Захиалга
                  </Link>
                  <button
                    className="flex items-center w-full text-left px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200 hover:translate-x-1"
                    onClick={() => {
                      logout();
                      setIsProfileOpen(false);
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Гарах
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-gray-700 hover:text-mega-600 hover:bg-mega-50 rounded-lg transition-all duration-300 transform hover:scale-110"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <div className="transform transition-transform duration-300">
              {isMenuOpen ? (
                <X className="w-5 h-5 transform rotate-90 transition-transform duration-300" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden animate-in slide-in-from-top-4 duration-300">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t shadow-lg">
            <Link
              href="/"
              className="block px-3 py-2 text-gray-900 font-medium hover:bg-mega-50 hover:text-mega-600 rounded-lg transition-all duration-200 hover:translate-x-1"
              onClick={() => setIsMenuOpen(false)}
            >
              Нүүр
            </Link>
            <Link
              href="/news"
              className="block px-3 py-2 text-gray-700 hover:bg-mega-50 hover:text-mega-600 rounded-lg transition-all duration-200 hover:translate-x-1"
              onClick={() => setIsMenuOpen(false)}
            >
              Мэдээ
            </Link>
            <Link
              href="/shop"
              className="block px-3 py-2 text-gray-700 hover:bg-mega-50 hover:text-mega-600 rounded-lg transition-all duration-200 hover:translate-x-1"
              onClick={() => setIsMenuOpen(false)}
            >
              Дэлгүүр
            </Link>
            <Link
              href="/lessons"
              className="block px-3 py-2 text-gray-700 hover:bg-mega-50 hover:text-mega-600 rounded-lg transition-all duration-200 hover:translate-x-1"
              onClick={() => setIsMenuOpen(false)}
            >
              Хичээл
            </Link>
            <Link
              href="/competitions"
              className="block px-3 py-2 text-gray-700 hover:bg-mega-50 hover:text-mega-600 rounded-lg transition-all duration-200 hover:translate-x-1"
              onClick={() => setIsMenuOpen(false)}
            >
              Тэмцээн
            </Link>

            {/* Mobile cart and profile */}
            <div className="border-t border-gray-200 mt-2 pt-2">
              <Link
                href="/cart"
                className="flex items-center px-3 py-2 text-gray-700 hover:bg-mega-50 hover:text-mega-600 rounded-lg transition-all duration-200 hover:translate-x-1"
                onClick={() => setIsMenuOpen(false)}
              >
                <ShoppingCart className="w-4 h-4 mr-3" />
                Сагс
              </Link>

              {/* Mobile Profile Dropdown */}
              <div className="relative" ref={mobileProfileRef}>
                <button
                  className="flex items-center w-full px-3 py-2 text-gray-700 hover:bg-mega-50 hover:text-mega-600 rounded-lg transition-all duration-200 hover:translate-x-1"
                  onClick={() =>
                    isAuthenticated ? setIsProfileOpen(!isProfileOpen) : setShowLoginModal(true)
                  }
                >
                  <User className="w-4 h-4 mr-3 transform transition-transform duration-200" />
                  {isAuthenticated ? "Профайл" : "Нэвтрэх"}
                </button>

                {isProfileOpen && isAuthenticated && (
                  <div className="ml-7 mt-1 space-y-1 animate-in slide-in-from-left-4 duration-300">
                    <div className="px-3 py-1 text-sm font-medium text-gray-900 border-b border-gray-100">
                      {user?.name || "Хэрэглэгч"}
                    </div>
                    <Link
                      href="/profile"
                      className="block px-3 py-2 text-sm text-gray-600 hover:bg-mega-50 hover:text-mega-600 rounded transition-all duration-200 hover:translate-x-1"
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsMenuOpen(false);
                      }}
                    >
                      Хувийн мэдээлэл
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-3 py-2 text-sm text-gray-600 hover:bg-mega-50 hover:text-mega-600 rounded transition-all duration-200 hover:translate-x-1"
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsMenuOpen(false);
                      }}
                    >
                      Гүйлгээний түүх
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-3 py-2 text-sm text-gray-600 hover:bg-mega-50 hover:text-mega-600 rounded transition-all duration-200 hover:translate-x-1"
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsMenuOpen(false);
                      }}
                    >
                      Захиалга
                    </Link>
                    <button
                      className="flex items-center w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 rounded transition-all duration-200 hover:translate-x-1"
                      onClick={() => {
                        logout();
                        setIsProfileOpen(false);
                        setIsMenuOpen(false);
                      }}
                    >
                      <LogOut className="w-3 h-3 mr-2" />
                      Гарах
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </header>
  );
}
