"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/contexts/ToastContext";
import { TrendingUp, PlusCircle, Edit3, Trash2, Eye, Trophy } from "lucide-react";

export default function AdminCompetitionsPage() {
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Тэмцээний удирдлага</h2>
          <p className="text-gray-600">Клубын тэмцээн уралдаануудыг удирдах</p>
        </div>
        <button className="px-4 py-2 bg-mega-600 text-white rounded-lg hover:bg-mega-700 transition-colors">
          <PlusCircle className="w-4 h-4 mr-2 inline" />
          Шинэ тэмцээн
        </button>
      </div>

      {/* Coming Soon */}
      <div className="text-center py-12">
        <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Тэмцээний удирдлага</h3>
        <p className="text-gray-600 mb-4">Энэ хэсгийг удахгүй нэмэх болно.</p>
        <div className="bg-gray-100 rounded-lg p-6 max-w-md mx-auto">
          <h4 className="font-semibold text-gray-800 mb-2">Багтаах боломжит функцүүд:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Тэмцээн зохион байгуулах</li>
            <li>• Оролцогч бүртгэх</li>
            <li>• Үр дүн оруулах</li>
            <li>• Шагналын мэдээлэл</li>
            <li>• Цагийн хуваарь</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
