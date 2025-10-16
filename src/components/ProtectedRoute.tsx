"use client";

import { ReactNode, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { LoginModal } from "./LoginModal";

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Уншиж байна...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md mx-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Нэвтрэх шаардлагатай</h2>
            <p className="text-gray-600 mb-6">Энэ хуудсыг үзэхийн тулд эхлээд нэвтэрнэ үү.</p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200"
            >
              Нэвтрэх
            </button>
          </div>
        </div>
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      </>
    );
  }

  return <>{children}</>;
}
