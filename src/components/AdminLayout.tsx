"use client";

import { AdminHeader } from "@/components/AdminHeader";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Users, ShoppingCart, Package, Image as ImageIcon } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  // Check admin access
  useEffect(() => {
    // Auth localStorage-оос ачаалж дуусахаас өмнө шийдвэр гаргахгүй
    if (isLoading) return;

    // Нэвтрээгүй эсвэл эрхгүй бол админ login хуудас руу чиглүүлнэ
    if (!isAuthenticated) {
      router.replace("/admin-dashboard");
      return;
    }

    if (user?.role !== "ADMIN") {
      showToast("Админ эрхээр нэвтэрнэ үү", "error");
      router.replace("/admin-dashboard");
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAuthenticated, isLoading]);

  // If not authenticated or not admin, show loading or redirect
  if (isLoading || !isAuthenticated || user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mega-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Админ эрх шалгаж байна...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    // { id: "dashboard", name: "Үндсэн самbar", icon: BarChart3, href: "/admin/dashboard" },
    { id: "users", name: "Хэрэглэгчид", icon: Users, href: "/admin/users" },
    { id: "orders", name: "Захиалга", icon: ShoppingCart, href: "/admin/orders" },
    { id: "products", name: "Бүтээгдэхүүн", icon: Package, href: "/admin/products" },
    { id: "banners", name: "Баннер", icon: ImageIcon, href: "/admin/banners" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Админ удирдлагын систем</h1>
          <p className="text-gray-600">Вэбсайтын агуулга болон хэрэглэгчдийг удирдах</p>
        </div>

        {/* Main Layout with Sidebar */}
        <div className="flex">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-white rounded-lg shadow-sm h-fit mr-8">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Удирдлагын цэс</h3>
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                        isActive
                          ? "bg-mega-100 text-mega-700 border border-mega-200"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
