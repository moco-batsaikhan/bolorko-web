"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/contexts/ToastContext";
import { apiService, NewsCategory } from "@/services/apiService";
import { Tag, PlusCircle, Edit3, Trash2, Eye, Search, X, Save, Calendar } from "lucide-react";

interface CategoryFormData {
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
}

export default function AdminNewsCategoriesPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CategoryFormData>({
    name: "",
    slug: "",
    description: "",
    isActive: true,
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const categoriesData = await apiService.getNewsCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching categories:", error);
      showToast("Ангиллын мэдээлэл ачаалахад алдаа гарлаа", "error");
    } finally {
      setLoading(false);
    }
  };

  // Create handlers
  const handleCreateClick = () => {
    setCreateForm({
      name: "",
      slug: "",
      description: "",
      isActive: true,
    });
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setCreating(true);
      const newCategory = await apiService.createCategory(createForm);

      // Add the new category to the local state
      setCategories([...categories, newCategory]);

      setShowCreateModal(false);
      showToast("Ангилал амжилттай нэмэгдлээ", "success");

      // Reset form
      setCreateForm({
        name: "",
        slug: "",
        description: "",
        isActive: true,
      });
    } catch (error) {
      console.error("Error creating category:", error);
      showToast("Ангилал нэмэхэд алдаа гарлаа", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateModalClose = () => {
    setShowCreateModal(false);
    setCreateForm({
      name: "",
      slug: "",
      description: "",
      isActive: true,
    });
  };

  // Auto generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]/g, "");

    setCreateForm({
      ...createForm,
      name: name,
      slug: slug,
    });
  };

  // Filter categories based on search term and status
  const filteredCategories = categories.filter((category) => {
    const matchesSearch =
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.slug.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && category.isActive) ||
      (filterStatus === "inactive" && !category.isActive);

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Идэвхитэй
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Идэвхгүй
        </span>
      );
    }
  };

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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ангиллын удирдлага</h2>
          <p className="text-gray-600">Нийт {categories.length} ангилал</p>
        </div>
        <button
          onClick={handleCreateClick}
          className="px-4 py-2 bg-mega-600 text-white rounded-lg hover:bg-mega-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4 mr-2 inline" />
          Шинэ ангилал
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Tag className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Нийт ангилал</p>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Идэвхитэй</p>
              <p className="text-2xl font-bold text-gray-900">
                {categories.filter((cat) => cat.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <X className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Идэвхгүй</p>
              <p className="text-2xl font-bold text-gray-900">
                {categories.filter((cat) => !cat.isActive).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ангилалын нэр, тайлбар хайх..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500"
            >
              <option value="all">Бүх төлөв</option>
              <option value="active">Идэвхитэй</option>
              <option value="inactive">Идэвхгүй</option>
            </select>
          </div>
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ангилал
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Төлөв
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Үүсгэсэн огноо
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Үйлдэл
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCategories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                      <div className="text-sm text-gray-500">{category.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {category.slug}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(category.isActive)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(category.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        className="text-green-600 hover:text-green-900 transition-colors"
                        title="Засах"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Устгах"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    {categories.length === 0 ? "Ангилал олдсонгүй" : "Хайлтын үр дүн олдсонгүй"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Category Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Шинэ ангилал нэмэх</h3>
              <button
                onClick={handleCreateModalClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={creating}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="create-name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Нэр *
                </label>
                <input
                  type="text"
                  id="create-name"
                  value={createForm.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="create-slug"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Slug *
                </label>
                <input
                  type="text"
                  id="create-slug"
                  value={createForm.slug}
                  onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="create-description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Тайлбар *
                </label>
                <textarea
                  id="create-description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="create-isActive"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Төлөв
                </label>
                <select
                  id="create-isActive"
                  value={(createForm.isActive ?? true).toString()}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, isActive: e.target.value === "true" })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500 focus:border-transparent"
                >
                  <option value="true">Идэвхитэй</option>
                  <option value="false">Идэвхгүй</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCreateModalClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={creating}
                >
                  Болих
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center px-4 py-2 bg-mega-600 text-white rounded-lg hover:bg-mega-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Нэмж байна...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Нэмэх
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
