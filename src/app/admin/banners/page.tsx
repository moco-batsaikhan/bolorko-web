"use client";

import { useState, useEffect, useCallback } from "react";
import { apiService, Banner } from "@/services/apiService";
import { useToast } from "@/contexts/ToastContext";
import { API_BASE_URL } from "@/constants/constants";
import Loading from "@/components/Loading";
import { Plus, Edit, Trash2, X, Save, Image as ImageIcon, Eye, EyeOff } from "lucide-react";

function getBannerImageUrl(banner: Banner): string | null {
  if (!banner.image) return null;
  return banner.image.startsWith("http") ? banner.image : `${API_BASE_URL}${banner.image}`;
}

export default function AdminBanners() {
  const { showToast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.getBanners();
      setBanners(data);
    } catch (error) {
      console.error("Failed to fetch banners:", error);
      showToast("Баннер ачаалахад алдаа гарлаа", "error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const openCreateModal = () => {
    setEditingBanner(null);
    setTitle("");
    setDescription("");
    setLink("");
    setImageFile(null);
    setImagePreview(null);
    setSortOrder(banners.length > 0 ? Math.max(...banners.map(b => b.sortOrder)) + 1 : 0);
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setTitle(banner.title);
    setDescription(banner.description || "");
    setLink(banner.link || "");
    setImageFile(null);
    setImagePreview(getBannerImageUrl(banner));
    setSortOrder(banner.sortOrder);
    setIsActive(banner.isActive);
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Зургийн хэмжээ 5MB-аас хэтэрч болохгүй", "error");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showToast("Баннерын гарчиг оруулна уу", "error");
      return;
    }

    if (!editingBanner && !imageFile) {
      showToast("Баннерын зураг сонгоно уу", "error");
      return;
    }

    setSaving(true);
    try {
      if (editingBanner) {
        await apiService.updateBanner(editingBanner.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          link: link.trim() || undefined,
          image: imageFile || undefined,
          sortOrder,
          isActive,
        });
        showToast("Баннер шинэчлэгдлээ", "success");
      } else {
        await apiService.createBanner({
          title: title.trim(),
          description: description.trim() || undefined,
          link: link.trim() || undefined,
          image: imageFile!,
          sortOrder,
          isActive,
        });
        showToast("Баннер үүслээ", "success");
      }
      setShowModal(false);
      await fetchBanners();
    } catch (error) {
      console.error("Failed to save banner:", error);
      showToast("Баннер хадгалахад алдаа гарлаа", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      await apiService.updateBanner(banner.id, {
        title: banner.title,
        sortOrder: banner.sortOrder,
        isActive: !banner.isActive,
      });
      showToast(banner.isActive ? "Баннер идэвхгүй боллоо" : "Баннер идэвхтэй боллоо", "success");
      await fetchBanners();
    } catch (error) {
      console.error("Failed to toggle banner:", error);
      showToast("Баннер шинэчлэхэд алдаа гарлаа", "error");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Энэ баннерыг устгахдаа итгэлтэй байна уу?")) return;

    setDeletingId(id);
    try {
      await apiService.deleteBanner(id);
      showToast("Баннер устгагдлаа", "success");
      await fetchBanners();
    } catch (error) {
      console.error("Failed to delete banner:", error);
      showToast("Баннер устгахад алдаа гарлаа", "error");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Баннерын удирдлага</h2>
          <p className="text-gray-600">Нүүр хуудасны баннеруудыг удирдах</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center px-4 py-2 bg-mega-600 text-white rounded-lg hover:bg-mega-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Баннер нэмэх
        </button>
      </div>

      {/* Banner List */}
      {banners.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
          <ImageIcon size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="mb-4">Одоогоор баннер байхгүй байна</p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center px-4 py-2 bg-mega-600 text-white rounded-lg hover:bg-mega-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Эхний баннераа нэмэх
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map(banner => {
            const imageUrl = getBannerImageUrl(banner);
            return (
              <div
                key={banner.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200"
              >
                <div className="relative aspect-[21/9] bg-gray-100 flex items-center justify-center">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt={banner.title || `Banner #${banner.id}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ImageIcon size={40} className="text-gray-300" />
                  )}
                  <span
                    className={`absolute top-2 left-2 text-xs font-medium px-2 py-1 rounded-md ${
                      banner.isActive ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {banner.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                  </span>
                  <span className="absolute top-2 right-2 bg-white text-gray-700 text-xs font-medium px-2 py-1 rounded-md shadow-sm">
                    Эрэмбэ: {banner.sortOrder}
                  </span>
                </div>

                <div className="px-4 pt-3">
                  <h3 className="font-semibold text-gray-900 truncate">{banner.title}</h3>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleActive(banner)}
                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-mega-600 transition-colors"
                    title={banner.isActive ? "Идэвхгүй болгох" : "Идэвхтэй болгох"}
                  >
                    {banner.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                    {banner.isActive ? "Нуух" : "Харуулах"}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(banner)}
                      className="p-2 text-gray-600 hover:text-mega-600 hover:bg-mega-50 rounded-lg transition-colors"
                      title="Засах"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      disabled={deletingId === banner.id}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Устгах"
                    >
                      {deletingId === banner.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          {/* Толгой болон "Хадгалах" товчтой доод хэсэг тогтмол, зөвхөн дунд нь гүйлгэгдэнэ */}
          <div className="bg-white w-full max-w-lg rounded-lg max-h-[85vh] shadow-lg flex flex-col">
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingBanner ? "Баннер засах" : "Шинэ баннер нэмэх"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Гарчиг <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Жишээ: Зуны хямдрал"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тайлбар <span className="text-gray-400 font-normal">(заавал биш)</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Богино тайлбар"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500"
                />
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Холбоос <span className="text-gray-400 font-normal">(заавал биш)</span>
                </label>
                <input
                  type="text"
                  value={link}
                  onChange={e => setLink(e.target.value)}
                  placeholder="Жишээ: /shop/5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Баннер дээр дарахад энэ хуудас руу шилжинэ
                </p>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Баннерын зураг {!editingBanner && <span className="text-red-500">*</span>}
                </label>
                <div className="aspect-[21/9] max-h-36 w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden relative">
                  {imagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imagePreview}
                      alt="Banner preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <ImageIcon size={32} className="mx-auto mb-2" />
                      <p className="text-sm">Зураг сонгоно уу (5MB хүртэл)</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  jpg, png, gif, webp — дээд тал нь 5MB. Өргөн хэлбэрийн (21:9) зураг тохиромжтой.
                </p>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Эрэмбэ (бага тоо эхэнд харагдана)
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={e => setSortOrder(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500"
                />
              </div>

              {/* Active */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="w-4 h-4 accent-red-600"
                />
                <span className="text-sm font-medium text-gray-700">
                  Идэвхтэй (нүүр хуудсанд харагдана)
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-3 px-6 py-3 border-t border-gray-200 bg-gray-50 flex-shrink-0 rounded-b-lg">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Болих
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-mega-600 text-white rounded-lg hover:bg-mega-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Хадгалах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
