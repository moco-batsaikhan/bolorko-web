"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/contexts/ToastContext";
import {
  apiService,
  Competition,
  CreateCompetitionRequest,
  UpdateCompetitionRequest,
} from "@/services/apiService";
import { API_BASE_URL } from "@/constants/constants";
import { PlusCircle, Edit3, Trash2, Trophy, Calendar, MapPin, ExternalLink, X } from "lucide-react";

export default function AdminCompetitionsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);

  const [formData, setFormData] = useState<CreateCompetitionRequest>({
    title: "",
    description: "",
    status: "UPCOMING",
    startDate: "",
    endDate: "",
    registerLink: "",
    address: "",
  });

  const [editFormData, setEditFormData] = useState<UpdateCompetitionRequest>({
    title: "",
    description: "",
    status: "UPCOMING",
    startDate: "",
    endDate: "",
    registerLink: "",
    address: "",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  const loadCompetitions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getCompetitions({ page: 1, limit: 50 });
      setCompetitions(response.data);
    } catch (error) {
      showToast("Тэмцээний жагсаалт ачааллахад алдаа гарлaa", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadCompetitions();
  }, [loadCompetitions]);

  const getFullImageUrl = (imageUrl: string) => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http")) return imageUrl;
    return `${API_BASE_URL}${imageUrl}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("mn-MN");
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      UPCOMING: { label: "Удахгүй", color: "bg-blue-100 text-blue-800" },
      ONGOING: { label: "Явагдаж буй", color: "bg-green-100 text-green-800" },
      COMPLETED: { label: "Дууссан", color: "bg-gray-100 text-gray-800" },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.UPCOMING;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditFormData({ ...editFormData, image: file });
      const reader = new FileReader();
      reader.onload = () => {
        setEditImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createCompetition(formData);
      showToast("Тэмцээн амжилттай үүсгэгдлээ", "success");
      setShowCreateModal(false);
      resetForm();
      loadCompetitions();
    } catch (error) {
      showToast("Тэмцээн үүсгэхэд алдаа гарлaa", "error");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompetition) return;

    try {
      console.log(editFormData);
      await apiService.updateCompetition(selectedCompetition.id, editFormData);
      showToast("Тэмцээн амжилттай засагдлаа", "success");
      setShowEditModal(false);
      setSelectedCompetition(null);
      resetEditForm();
      loadCompetitions();
    } catch (error) {
      showToast("Тэмцээн засахад алдаа гарлaa", "error");
    }
  };

  const handleDelete = async (competition: Competition) => {
    if (window.confirm(`"${competition.title}" тэмцээнийг устгахдаа итгэлтэй байна уу?`)) {
      try {
        await apiService.deleteCompetition(competition.id);
        showToast("Тэмцээн амжилттай устгагдлаа", "success");
        loadCompetitions();
      } catch (error) {
        showToast("Тэмцээн устгахад алдаа гарлaa", "error");
      }
    }
  };

  const openEditModal = (competition: Competition) => {
    setSelectedCompetition(competition);
    setEditFormData({
      title: competition.title,
      description: competition.description,
      status: competition.status,
      startDate: competition.startDate.split("T")[0], // Format for date input
      endDate: competition.endDate.split("T")[0],
      registerLink: competition.registerLink,
      address: competition.address,
    });
    setEditImagePreview(competition.image ? getFullImageUrl(competition.image) : null);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      status: "UPCOMING",
      startDate: "",
      endDate: "",
      registerLink: "",
      address: "",
    });
    setImagePreview(null);
  };

  const resetEditForm = () => {
    setEditFormData({
      title: "",
      description: "",
      status: "UPCOMING",
      startDate: "",
      endDate: "",
      registerLink: "",
      address: "",
    });
    setEditImagePreview(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <PlusCircle size={16} />
          Шинэ тэмцээн
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Trophy className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Нийт тэмцээн</p>
              <p className="text-2xl font-bold text-gray-900">{competitions.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Удахгүй</p>
              <p className="text-2xl font-bold text-gray-900">
                {competitions.filter((c) => c.status === "UPCOMING").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ExternalLink className="h-8 w-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Явагдаж буй</p>
              <p className="text-2xl font-bold text-gray-900">
                {competitions.filter((c) => c.status === "ONGOING").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Competitions Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Тэмцээний жагсаалт</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Зураг
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Нэр
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Төлөв
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Огноо
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Байршил
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Үйлдэл
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {competitions.map((competition) => (
                <tr key={competition.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {competition.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        className="h-10 w-10 rounded object-cover"
                        src={getFullImageUrl(competition.image)}
                        alt={competition.title}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "";
                          target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                        <Trophy size={20} className="text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{competition.title}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {competition.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(competition.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(competition.startDate)} - {formatDate(competition.endDate)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center gap-1">
                      <MapPin size={14} />
                      <span className="truncate max-w-xs">{competition.address}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(competition)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Засах"
                      >
                        <Edit3 size={16} />
                      </button>
                      <a
                        href={competition.registerLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-900 p-1"
                        title="Бүртгэлийн холбоос"
                      >
                        <ExternalLink size={16} />
                      </a>
                      <button
                        onClick={() => handleDelete(competition)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Устгах"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {competitions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Trophy className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Тэмцээн байхгүй</h3>
                    <p className="mt-1 text-sm text-gray-500">Эхний тэмцээнээ үүсгэж эхлээрэй.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Competition Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Шинэ тэмцээн үүсгэх</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тэмцээний нэр
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Тайлбар</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Эхлэх огноо
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дуусах огноо
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Төлөв</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as "UPCOMING" | "ONGOING" | "COMPLETED",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="UPCOMING">Удахгүй</option>
                  <option value="ONGOING">Явагдаж буй</option>
                  <option value="COMPLETED">Дууссан</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Байршил</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Бүртгэлийн холбоос
                </label>
                <input
                  type="url"
                  value={formData.registerLink}
                  onChange={(e) => setFormData({ ...formData, registerLink: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Зураг</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {imagePreview && (
                  <div className="mt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Цуцлах
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Үүсгэх
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Competition Modal */}
      {showEditModal && selectedCompetition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Тэмцээн засах</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedCompetition(null);
                  resetEditForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тэмцээний нэр
                </label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Тайлбар</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Эхлэх огноо
                  </label>
                  <input
                    type="date"
                    value={editFormData.startDate}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дуусах огноо
                  </label>
                  <input
                    type="date"
                    value={editFormData.endDate}
                    onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Төлөв</label>
                <select
                  value={editFormData.status}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      status: e.target.value as "UPCOMING" | "ONGOING" | "COMPLETED",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="UPCOMING">Удахгүй</option>
                  <option value="ONGOING">Явагдаж буй</option>
                  <option value="COMPLETED">Дууссан</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Байршил</label>
                <input
                  type="text"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Бүртгэлийн холбоос
                </label>
                <input
                  type="url"
                  value={editFormData.registerLink}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, registerLink: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Зураг (шинэчлэх)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {editImagePreview && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-1">
                      {editFormData.image ? "Шинэ зураг:" : "Одоогийн зураг:"}
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editImagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedCompetition(null);
                    resetEditForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Цуцлах
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Хадгалах
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
