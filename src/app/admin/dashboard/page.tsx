"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/contexts/ToastContext";
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  PlusCircle,
  CheckCircle,
  Activity,
  Star,
  Settings,
} from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  newUsersThisMonth: number;
  ordersThisMonth: number;
  revenueThisMonth: number;
}

export default function AdminDashboardPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Mock data - replace with actual API calls
      setStats({
        totalUsers: 1245,
        totalProducts: 89,
        totalOrders: 456,
        totalRevenue: 2340000,
        newUsersThisMonth: 67,
        ordersThisMonth: 123,
        revenueThisMonth: 890000,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      showToast("Өгөгдөл ачаалахад алдаа гарлаа", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("mn-MN").format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("mn-MN").format(num) + "₮";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mega-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Үндсэн самbar</h2>
        <p className="text-gray-600">Системийн ерөнхий мэдээлэл болон статистик</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Нийт хэрэглэгч</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatNumber(stats?.totalUsers || 0)}
              </p>
              <p className="text-xs text-green-600">+{stats?.newUsersThisMonth || 0} энэ сард</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Нийт бүтээгдэхүүн</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatNumber(stats?.totalProducts || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Нийт захиалга</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatNumber(stats?.totalOrders || 0)}
              </p>
              <p className="text-xs text-green-600">+{stats?.ordersThisMonth || 0} энэ сард</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Нийт орлого</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(stats?.totalRevenue || 0)}
              </p>
              <p className="text-xs text-green-600">
                +{formatCurrency(stats?.revenueThisMonth || 0)} энэ сард
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Хурдан үйлдлүүд</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <PlusCircle className="w-5 h-5 text-mega-600 mr-3" />
            <span className="font-medium">Шинэ мэдээ нэмэх</span>
          </button>
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Package className="w-5 h-5 text-mega-600 mr-3" />
            <span className="font-medium">Бүтээгдэхүүн нэмэх</span>
          </button>
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Users className="w-5 h-5 text-mega-600 mr-3" />
            <span className="font-medium">Хэрэглэгч удирдах</span>
          </button>
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Settings className="w-5 h-5 text-mega-600 mr-3" />
            <span className="font-medium">Тохиргоо</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Сүүлийн үйл ажиллагаа</h3>
        <div className="space-y-4">
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium">Шинэ захиалга #1234 батлагдлаа</p>
              <p className="text-xs text-gray-500">5 минутын өмнө</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <Activity className="w-5 h-5 text-blue-500 mr-3" />
            <div>
              <p className="text-sm font-medium">Шинэ хэрэглэгч бүртгүүллээ</p>
              <p className="text-xs text-gray-500">15 минутын өмнө</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <Star className="w-5 h-5 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm font-medium">Шинэ 5 одтой үнэлгээ ирлээ</p>
              <p className="text-xs text-gray-500">30 минутын өмнө</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
