"use client";

import { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const { login, register, isLoading, error: authError } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (isLoginMode) {
      // Login logic
      if (!email || !password) {
        setLocalError("И-мэйл болон нууц үг оруулна уу");
        return;
      }

      const success = await login(email, password);
      if (success) {
        // Show success toast
        showToast("Амжилттай нэвтэрлээ!", "success");

        // Close modal after short delay
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    } else {
      // Register logic
      if (!name || !email || !password) {
        setLocalError("Бүх талбарыг бөглөнө үү");
        return;
      }

      if (password.length < 6) {
        setLocalError("Нууц үг дор хаяж 6 тэмдэгт байх ёстой");
        return;
      }

      const success = await register(name, email, password);
      if (success) {
        // Show success toast and switch to login mode
        showToast("Бүртгэл амжилттай! Одоо нэвтэрнэ үү.", "success");

        // Clear form and switch to login mode
        setName("");
        setPassword("");
        setLocalError("");
        setIsLoginMode(true);
      }
    }
  };

  const handleClose = () => {
    onClose();
    setName("");
    setEmail("");
    setPassword("");
    setLocalError("");
    setIsLoginMode(true);
  };

  const switchMode = () => {
    setIsLoginMode(!isLoginMode);
    setLocalError("");
    setName("");
    setEmail("");
    setPassword("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 animate-in slide-in-from-top-4 duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {isLoginMode ? "Нэвтрэх" : "Бүртгүүлэх"}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setIsLoginMode(true)}
            className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
              isLoginMode
                ? "text-mega-600 border-b-2 border-mega-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Нэвтрэх
          </button>
          <button
            type="button"
            onClick={() => setIsLoginMode(false)}
            className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
              !isLoginMode
                ? "text-mega-600 border-b-2 border-mega-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Бүртгүүлэх
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Нэр
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500 focus:border-transparent transition-all duration-200"
                placeholder="Нэрээ оруулна уу"
                required={!isLoginMode}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              И-мэйл
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500 focus:border-transparent transition-all duration-200"
              placeholder="И-мэйл хаягаа оруулна уу"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Нууц үг
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500 focus:border-transparent transition-all duration-200"
                placeholder="Нууц үгээ оруулна уу"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {(localError || authError) && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded border border-red-200">
              {localError || authError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-mega-600 text-white py-2 px-4 rounded-lg hover:bg-mega-700 focus:outline-none focus:ring-2 focus:ring-mega-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? isLoginMode
                ? "Нэвтэрч байна..."
                : "Бүртгүүлж байна..."
              : isLoginMode
              ? "Нэвтрэх"
              : "Бүртгүүлэх"}
          </button>
        </form>
      </div>
    </div>
  );
}
