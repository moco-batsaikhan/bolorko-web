"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/contexts/ToastContext";
import { ShoppingCart, Eye, CheckCircle, Clock, XCircle, Search, Filter } from "lucide-react";

export default function AdminOrdersPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mega-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Захиалгын удирдлага</h2>
        <p className="text-gray-600">Бүх захиалгыг хянах болон удирдах</p>
      </div>

      {/* Coming Soon */}
      <div className="text-center py-12">
        <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Захиалгын удирдлага</h3>
        <p className="text-gray-600 mb-4">Энэ хэсгийг удахгүй нэмэх болно.</p>
        <div className="bg-gray-100 rounded-lg p-6 max-w-md mx-auto">
          <h4 className="font-semibold text-gray-800 mb-2">Багтаах боломжит функцүүд:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Захиалгын жагсаалт харах</li>
            <li>• Захиалгын төлөв өөрчлөх</li>
            <li>• Захиалгын дэлгэрэнгүй мэдээлэл</li>
            <li>• Худалдааны тайлан</li>
            <li>• Төлбөрийн мэдээлэл</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
