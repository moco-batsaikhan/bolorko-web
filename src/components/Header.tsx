"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  ShoppingCart,
  User,
  Menu,
  X,
  LogOut,
  Search,
  LayoutGrid,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { UserRole } from "@/constants/roles";
import { apiService, ProductCategory } from "@/services/apiService";
import { CART_ENABLED } from "@/config/featureFlags";

export function Header() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileProfileRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  // Ангиллуудыг татна (үндсэн + дэд nested)
  useEffect(() => {
    apiService
      .getMainCategories()
      .then(setCategories)
      .catch(err => console.error("Failed to load categories:", err));
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (isProfileOpen) {
        const isOutsideDesktop = profileRef.current && !profileRef.current.contains(target);
        const isOutsideMobile =
          mobileProfileRef.current && !mobileProfileRef.current.contains(target);
        if (isOutsideDesktop && isOutsideMobile) {
          setIsProfileOpen(false);
        }
      }

      if (isCategoryOpen && categoryRef.current && !categoryRef.current.contains(target)) {
        setIsCategoryOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen, isCategoryOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/shop?search=${encodeURIComponent(q)}` : "/shop");
    setIsMenuOpen(false);
  };

  const goToCategory = (categoryId: number) => {
    setIsCategoryOpen(false);
    setIsMenuOpen(false);
    router.push(`/shop?category=${categoryId}`);
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      {/* Зарын мөр */}
      {/* <div className="bg-red-600 text-white py-2 text-center text-xs tracking-widest uppercase">
        50,000₮-с дээш захиалгад хот дотор үнэгүй хүргэлт
      </div> */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 md:gap-6 h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/imgs/icon.png" alt="Bolorko Logo" className="w-10 h-10 object-contain" />
              </div>
              <span className="font-display text-2xl font-bold tracking-wide text-gray-900 group-hover:text-red-600 transition-colors duration-200">
                BOLORKO
              </span>
            </Link>
          </div>

          {/* Ангилал (задардаг) — desktop */}
          <div className="hidden md:block relative" ref={categoryRef}>
            <button
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium uppercase tracking-wider transition-colors border ${
                isCategoryOpen
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white text-gray-900 border-gray-300 hover:border-red-600 hover:text-red-600"
              }`}
            >
              <LayoutGrid size={18} />
              Ангилал
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${
                  isCategoryOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Задардаг панель */}
            {isCategoryOpen && (
              <div className="dropdown-3d absolute left-0 top-full mt-2 w-80 bg-white rounded-xl border border-gray-100 py-3 z-50 max-h-[70vh] overflow-y-auto">
                {categories.length === 0 ? (
                  <p className="px-5 py-3 text-sm text-gray-500">Ангилал байхгүй байна</p>
                ) : (
                  categories.map(main => (
                    <div key={main.id} className="px-2">
                      <button
                        onClick={() => goToCategory(main.id)}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-left font-semibold text-gray-900 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                      >
                        {main.name}
                        <ChevronRight size={16} className="text-gray-300" />
                      </button>
                      {main.children && main.children.length > 0 && (
                        <div className="ml-3 pl-3 border-l-2 border-red-100 mb-1">
                          {main.children.map(sub => (
                            <button
                              key={sub.id}
                              onClick={() => goToCategory(sub.id)}
                              className="w-full px-3 py-2 text-left text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                            >
                              {sub.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Хайлт — desktop */}
          <form onSubmit={handleSearch} className="hidden md:block flex-1 max-w-xl">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Бараа хайх..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mega-500 focus:bg-white transition-colors"
              />
            </div>
          </form>

          <div className="flex-1 md:hidden"></div>

          {/* Right side icons */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Сагсны урсгал түр хаагдсан (CART_ENABLED=false) — буцаахдаа зөвхөн флагийг true болгоно */}
            {CART_ENABLED && (
              <Link
                href="/cart"
                className="relative p-2 text-gray-700 hover:text-mega-600 transition-all duration-300 hover:bg-mega-50 rounded-lg transform hover:scale-110"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </Link>
            )}

            {/* Энгийн хэрэглэгчид нэвтрэх сонголт харагдахгүй — зөвхөн admin-dashboard
                хэсэгт login харуулна. Аль хэдийн нэвтэрсэн хэрэглэгчид (админ гэх мэт)
                профайлын цэсээ ашиглах боломжтой хэвээр байна. */}
            {isAuthenticated && (
            <div className="relative hidden md:block" ref={profileRef}>
              <button
                className="p-2 text-gray-700 hover:text-mega-600 transition-all duration-300 hover:bg-mega-50 rounded-lg transform hover:scale-110"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <User className="w-5 h-5" />
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="dropdown-3d absolute right-0 top-full mt-2 w-48 bg-white rounded-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="font-semibold text-gray-900">{user?.name || "Хэрэглэгч"}</div>
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
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-700 hover:text-mega-600 hover:bg-mega-50 rounded-lg transition-all duration-300"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Цэс"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden animate-in slide-in-from-top-4 duration-300">
          <div className="px-4 pt-3 pb-4 space-y-3 bg-white border-t shadow-lg">
            {/* Хайлт — mobile */}
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Бараа хайх..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mega-500"
                />
              </div>
            </form>

            {/* Ангиллууд — mobile */}
            <div>
              <div className="flex items-center gap-2 px-1 mb-2 text-sm font-semibold text-gray-900">
                <LayoutGrid size={16} className="text-red-600" />
                Ангилал
              </div>
              <div className="space-y-1">
                {categories.map(main => (
                  <div key={main.id}>
                    <button
                      onClick={() => goToCategory(main.id)}
                      className="w-full px-3 py-2 text-left font-medium text-gray-800 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                    >
                      {main.name}
                    </button>
                    {main.children && main.children.length > 0 && (
                      <div className="ml-4 pl-3 border-l-2 border-red-100">
                        {main.children.map(sub => (
                          <button
                            key={sub.id}
                            onClick={() => goToCategory(sub.id)}
                            className="w-full px-3 py-1.5 text-left text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/info"
              className="block px-3 py-2 text-gray-700 font-medium hover:bg-mega-50 hover:text-mega-600 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Мэдээлэл
            </Link>

            {/* Mobile profile — энгийн хэрэглэгчид нэвтрэх сонголт харагдахгүй */}
            {isAuthenticated && (
            <div className="border-t border-gray-200 pt-2">
              <div className="relative" ref={mobileProfileRef}>
                <button
                  className="flex items-center w-full px-3 py-2 text-gray-700 hover:bg-mega-50 hover:text-mega-600 rounded-lg transition-all duration-200"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  <User className="w-4 h-4 mr-3" />
                  Профайл
                </button>

                {isProfileOpen && (
                  <div className="ml-7 mt-1 space-y-1">
                    <div className="px-3 py-1 text-sm font-medium text-gray-900 border-b border-gray-100">
                      {user?.name || "Хэрэглэгч"}
                    </div>
                    {user?.role === UserRole.ADMIN && (
                      <Link
                        href="/admin-dashboard"
                        className="block px-3 py-2 text-sm text-gray-600 hover:bg-mega-50 hover:text-mega-600 rounded transition-colors"
                        onClick={() => {
                          setIsProfileOpen(false);
                          setIsMenuOpen(false);
                        }}
                      >
                        Админ панель
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      className="block px-3 py-2 text-sm text-gray-600 hover:bg-mega-50 hover:text-mega-600 rounded transition-colors"
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsMenuOpen(false);
                      }}
                    >
                      Хувийн мэдээлэл
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-3 py-2 text-sm text-gray-600 hover:bg-mega-50 hover:text-mega-600 rounded transition-colors"
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsMenuOpen(false);
                      }}
                    >
                      Захиалга
                    </Link>
                    <button
                      className="flex items-center w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
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
            )}
          </div>
        </div>
      )}
    </header>
  );
}
