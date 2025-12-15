"use client";

import React, { useEffect, useState } from "react";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { apiService, User } from "../../services/apiService";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [oldPassword, setOldPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [passwordSaving, setPasswordSaving] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      try {
        const data = await apiService.getCurrentUser();
        if (mounted) setUser(data);
      } catch (error: unknown) {
        console.error("Failed to fetch current user:", error);
        const message =
          error instanceof Error
            ? error.message
            : typeof error === "string"
            ? error
            : String(error);
        if (mounted) setError(message || "Алдаа гарлаа");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUser();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload = { name: name.trim(), email: email.trim() };
      const updated = await apiService.updateProfile(payload);
      setUser(updated);
      setEditMode(false);
      setSuccessMessage("Мэдээлэл амжилттай шинэчлэгдлээ.");
    } catch (err: unknown) {
      console.error("Profile update failed:", err);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
          ? err
          : String(err);
      setError(message || "Шинэчлэхэд алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
    setEditMode(false);
    setError(null);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("Бүх талбарыг бөглөнө үү.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Шинэ нууц үг ижил байх ёстой.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Шинэ нууц үг дор хаяж 6 тэмдэгттэй байх ёстой.");
      return;
    }

    setPasswordSaving(true);

    try {
      await apiService.changePassword({ oldPassword, newPassword });
      setPasswordSuccess("Нууц үг амжилттай солигдлоо.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      console.error("Change password failed:", err);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
          ? err
          : String(err);
      setPasswordError(message || "Нууц үг солихад алдаа гарлаа");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sidebar */}
            <aside className="col-span-full md:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 text-center w-full">
                <div className="mx-auto w-28 h-28 rounded-full bg-mega-50 flex items-center justify-center text-3xl text-mega-600 font-semibold">
                  {user?.name
                    ? user.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "U"}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {user?.name}
                </h3>
                <p className="text-sm text-gray-500">{user?.email}</p>
                {user?.role === "ADMIN" && (
                  <p className="mt-3 text-xs text-gray-600">
                    Роль: {user?.role}
                  </p>
                )}

                <div className="mt-5">
                  {!editMode ? (
                    <button
                      onClick={() => setEditMode(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-mega-600 text-white rounded-md hover:bg-mega-700"
                    >
                      Засах
                    </button>
                  ) : (
                    <button
                      onClick={handleCancel}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                    >
                      Болих
                    </button>
                  )}
                </div>
              </div>
            </aside>

            {/* Main content */}
            <main className="col-span-full md:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Хувийн мэдээлэл
                  </h2>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-mega-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Уншиж байна...</p>
                  </div>
                ) : error ? (
                  <div className="text-red-600">{error}</div>
                ) : user ? (
                  <div>
                    {successMessage && (
                      <div className="text-green-600 mb-3">
                        {successMessage}
                      </div>
                    )}

                    {!editMode ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Нэр</p>
                          <p className="font-medium text-gray-900">
                            {user.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">И-мэйл</p>
                          <p className="font-medium text-gray-900">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSave} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Нэр
                          </label>
                          <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-mega-200"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            И-мэйл
                          </label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-mega-200"
                            required
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center px-4 py-2 bg-mega-600 text-white rounded-md hover:bg-mega-700 disabled:opacity-60"
                          >
                            {saving ? "Хадгалж..." : "Хадгалах"}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancel}
                            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                          >
                            Болих
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ) : (
                  <div>Хэрэглэгчийн мэдээлэл олдсонгүй.</div>
                )}
              </div>

              {/* Password card */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Нууц үг солих
                </h3>
                {passwordSuccess && (
                  <div className="text-green-600 mb-3">{passwordSuccess}</div>
                )}
                {passwordError && (
                  <div className="text-red-600 mb-3">{passwordError}</div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Одоогийн нууц үг
                    </label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-mega-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Шинэ нууц үг
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-mega-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Шинэ нууц үг (давтан)
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-mega-200"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="inline-flex items-center px-4 py-2 bg-mega-600 text-white rounded-md hover:bg-mega-700 disabled:opacity-60"
                    >
                      {passwordSaving ? "Ашиглаж байна..." : "Нууц үг солих"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOldPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                        setPasswordError(null);
                        setPasswordSuccess(null);
                      }}
                      className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                    >
                      Цэвэрлэх
                    </button>
                  </div>
                </form>
              </div>
            </main>
          </div>
        </div>
      </div>
      <Footer />
    </ProtectedRoute>
  );
}
