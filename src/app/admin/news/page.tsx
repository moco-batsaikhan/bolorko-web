"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/contexts/ToastContext";
import {
  apiService,
  NewsArticle,
  NewsResponse,
  UpdateNewsRequest,
  CreateNewsRequest,
  NewsCategory,
} from "@/services/apiService";
import {
  FileText,
  PlusCircle,
  Edit3,
  Trash2,
  Eye,
  Search,
  Filter,
  Calendar,
  User,
  Tag,
  TrendingUp,
  ChevronLeft,
  MessageSquare,
  ChevronRight,
  X,
  Save,
  Upload,
  MessageCircle,
} from "lucide-react";

export default function AdminNewsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNews, setTotalNews] = useState(0);
  const limit = 10;

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null);
  const [editForm, setEditForm] = useState<UpdateNewsRequest>({
    title: "",
    content: "",
    excerpt: "",
    isPublished: false,
    categoryId: 1,
  });
  const [updating, setUpdating] = useState(false);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingNews, setDeletingNews] = useState<NewsArticle | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateNewsRequest>({
    title: "",
    content: "",
    excerpt: "",
    isPublished: false,
    categoryId: 1,
  });
  const [creating, setCreating] = useState(false);

  // Comment deletion state
  const [deletingComment, setDeletingComment] = useState<number | null>(null);

  // Categories state
  const [categories, setCategories] = useState<NewsCategory[]>([]);

  useEffect(() => {
    fetchNews();
    fetchCategories();
  }, [currentPage]);

  const fetchCategories = async () => {
    try {
      const categoriesData = await apiService.getNewsCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response: NewsResponse = await apiService.getAdminNews(currentPage, limit);
      setNews(response.data);
      setTotalPages(response.pages);
      setTotalNews(response.total);
    } catch (error) {
      console.error("Error fetching news:", error);
      showToast("Мэдээний мэдээлэл ачаалахад алдаа гарлаа", "error");
    } finally {
      setLoading(false);
    }
  };

  // Edit handlers
  const handleEditClick = (article: NewsArticle) => {
    console.log("Article with comments:", article);
    console.log("Comments count:", article.comments?.length || 0);
    setEditingNews(article);
    setEditForm({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      isPublished: article.isPublished,
      categoryId: article.categoryId || 1,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNews) return;

    try {
      setUpdating(true);
      const updatedNews = await apiService.updateNews(editingNews.id, editForm);

      // Update the news in the local state
      setNews(news.map((article) => (article.id === editingNews.id ? updatedNews : article)));

      setShowEditModal(false);
      setEditingNews(null);
      showToast("Мэдээ амжилттай шинэчлэгдлээ", "success");
    } catch (error) {
      console.error("Error updating news:", error);
      showToast("Мэдээ шинэчлэхэд алдаа гарлаа", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleEditModalClose = () => {
    setShowEditModal(false);
    setEditingNews(null);
    setEditForm({
      title: "",
      content: "",
      excerpt: "",
      isPublished: false,
      categoryId: 1,
    });
  };

  // Delete handlers
  const handleDeleteClick = (article: NewsArticle) => {
    setDeletingNews(article);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingNews) return;

    try {
      setDeleting(true);
      await apiService.deleteNews(deletingNews.id);

      // Remove the news from the local state
      setNews(news.filter((article) => article.id !== deletingNews.id));
      setTotalNews(totalNews - 1);

      setShowDeleteModal(false);
      setDeletingNews(null);
      showToast("Мэдээ амжилттай устгагдлаа", "success");
    } catch (error) {
      console.error("Error deleting news:", error);
      showToast("Мэдээ устгахад алдаа гарлаа", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteModalClose = () => {
    setShowDeleteModal(false);
    setDeletingNews(null);
  };

  // Create handlers
  const handleCreateClick = () => {
    setCreateForm({
      title: "",
      content: "",
      excerpt: "",
      isPublished: false,
      categoryId: 1,
    });
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setCreating(true);
      const newNews = await apiService.createNews(createForm);

      // Add the new news to the local state at the beginning
      setNews([newNews, ...news]);
      setTotalNews(totalNews + 1);

      setShowCreateModal(false);
      showToast("Мэдээ амжилттай нэмэгдлээ", "success");

      // Reset form
      setCreateForm({
        title: "",
        content: "",
        excerpt: "",
        isPublished: false,
        categoryId: 1,
      });
    } catch (error) {
      console.error("Error creating news:", error);
      showToast("Мэдээ нэмэхэд алдаа гарлаа", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateModalClose = () => {
    setShowCreateModal(false);
    setCreateForm({
      title: "",
      content: "",
      excerpt: "",
      isPublished: false,
      categoryId: 1,
    });
  };

  // Comment handlers
  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("Энэ сэтгэгдлийг устгах уу?")) return;

    try {
      setDeletingComment(commentId);
      await apiService.deleteComment(commentId);

      // Update the editing news to remove the deleted comment
      if (editingNews && editingNews.comments) {
        const updatedComments = editingNews.comments.filter((comment) => comment.id !== commentId);
        const updatedNews = { ...editingNews, comments: updatedComments };
        setEditingNews(updatedNews);

        // Also update the news in the main list
        setNews(
          news.map((article) =>
            article.id === editingNews.id ? { ...article, comments: updatedComments } : article,
          ),
        );
      }

      showToast("Сэтгэгдэл амжилттай устгагдлаа", "success");
    } catch (error) {
      console.error("Error deleting comment:", error);
      showToast("Сэтгэгдэл устгахад алдаа гарлаа", "error");
    } finally {
      setDeletingComment(null);
    }
  };

  // Filter news based on search term, category, and status
  const filteredNews = news.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (article.author?.name || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === "all" || article.category?.name === filterCategory;

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "published" && article.isPublished) ||
      (filterStatus === "draft" && !article.isPublished);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStatusBadge = (isPublished: boolean) => {
    if (isPublished) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Нийтлэгдсэн
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Ноорог
        </span>
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Мэдээний удирдлага</h2>
          <p className="text-gray-600">Нийт {totalNews} мэдээ</p>
        </div>
        <button
          onClick={handleCreateClick}
          className="px-4 py-2 bg-mega-600 text-white rounded-lg hover:bg-mega-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4 mr-2 inline" />
          Шинэ мэдээ
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Нийт мэдээ</p>
              <p className="text-2xl font-bold text-gray-900">{totalNews}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Нийт үзлэт</p>
              <p className="text-2xl font-bold text-gray-900">
                {news.reduce((total, article) => total + article.viewCount, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Нийтлэгдсэн</p>
              <p className="text-2xl font-bold text-gray-900">
                {news.filter((article) => article.isPublished).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Edit3 className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ноорог</p>
              <p className="text-2xl font-bold text-gray-900">
                {news.filter((article) => !article.isPublished).length}
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
                placeholder="Мэдээний гарчиг, агуулга хайх..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500"
            >
              <option value="all">Бүх ангилал</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500"
            >
              <option value="all">Бүх төлөв</option>
              <option value="published">Нийтлэгдсэн</option>
              <option value="draft">Ноорог</option>
            </select>
            <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* News List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Мэдээ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ангилал
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Зохиогч
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Төлөв
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Үзлэт
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Огноо
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Үйлдэл
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredNews.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-start">
                      {article.imageUrl && (
                        <div className="flex-shrink-0 mr-4">
                          <img
                            src={`http://129.212.228.96${article.imageUrl}`}
                            alt={article.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900 line-clamp-2">
                          {article.title}
                        </div>
                        <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {article.excerpt}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {article.category?.name ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Tag className="w-3 h-3 mr-1" />
                        {article.category.name}
                      </span>
                    ) : (
                      <span className="text-gray-400">Ангилалгүй</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {article.author?.name || "Тодорхойгүй"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(article.isPublished)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Eye className="w-4 h-4 mr-1" />
                      {article.viewCount}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(article.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditClick(article)}
                        className="text-green-600 hover:text-green-900 transition-colors"
                        title="Засах"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(article)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Устгах"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredNews.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {news.length === 0 ? "Мэдээ олдсонгүй" : "Хайлтын үр дүн олдсонгүй"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Хуудас {currentPage} / {totalPages} ({totalNews} мэдээ)
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    currentPage === page
                      ? "bg-mega-600 text-white"
                      : "border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit News Modal */}
      {showEditModal && editingNews && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Мэдээ засах</h3>
              <button
                onClick={handleEditModalClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={updating}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Гарчиг *
                </label>
                <input
                  type="text"
                  id="title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
                  Товч агуулга *
                </label>
                <textarea
                  id="excerpt"
                  value={editForm.excerpt}
                  onChange={(e) => setEditForm({ ...editForm, excerpt: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Дэлгэрэнгүй агуулга *
                </label>
                <textarea
                  id="content"
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="categoryId"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Ангилал *
                  </label>
                  <select
                    id="categoryId"
                    value={editForm.categoryId}
                    onChange={(e) =>
                      setEditForm({ ...editForm, categoryId: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500 focus:border-transparent"
                    required
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="isPublished"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Төлөв
                  </label>
                  <select
                    id="isPublished"
                    value={editForm.isPublished.toString()}
                    onChange={(e) =>
                      setEditForm({ ...editForm, isPublished: e.target.value === "true" })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500 focus:border-transparent"
                  >
                    <option value="false">Ноорог</option>
                    <option value="true">Нийтлэх</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                  Зураг (шинэчлэх бол сонгоно уу)
                </label>
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={(e) => setEditForm({ ...editForm, image: e.target.files?.[0] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500 focus:border-transparent"
                />
                {editingNews.imageUrl && (
                  <div className="mt-2">
                    <img
                      src={`http://129.212.228.96${editingNews.imageUrl}`}
                      alt="Current"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Сэтгэгдлүүд ({editingNews.comments?.length || 0})
                </label>
                <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                  {editingNews.comments && editingNews.comments.length > 0 ? (
                    <div className="space-y-3">
                      {editingNews.comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                                  <User className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {comment.author?.name || "Тодорхойгүй"}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.createdAt).toLocaleDateString("mn-MN")}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">{comment.content}</p>
                            </div>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              disabled={deletingComment === comment.id}
                              className="ml-2 text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                              title="Сэтгэгдэл устгах"
                            >
                              {deletingComment === comment.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>Сэтгэгдэл байхгүй байна</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleEditModalClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={updating}
                >
                  Болих
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex items-center px-4 py-2 bg-mega-600 text-white rounded-lg hover:bg-mega-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Шинэчлэж байна...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Хадгалах
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete News Confirmation Modal */}
      {showDeleteModal && deletingNews && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Мэдээ устгах</h3>
              <button
                onClick={handleDeleteModalClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={deleting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium">Энэ үйлдлийг буцаах боломжгүй!</p>
                  <p className="text-gray-500 text-sm">Мэдээний бүх мэдээлэл бүрмөсөн устна.</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">Устгах мэдээ:</span>
                </p>
                <div className="flex items-start">
                  {deletingNews.imageUrl && (
                    <img
                      src={`http://129.212.228.96${deletingNews.imageUrl}`}
                      alt={deletingNews.title}
                      className="w-16 h-16 object-cover rounded-lg mr-3 flex-shrink-0"
                    />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{deletingNews.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{deletingNews.excerpt}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleDeleteModalClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={deleting}
              >
                Болих
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Устгаж байна...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Устгах
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create News Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Шинэ мэдээ нэмэх</h3>
              <button
                onClick={handleCreateModalClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={creating}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="create-title"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Гарчиг *
                </label>
                <input
                  type="text"
                  id="create-title"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="create-excerpt"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Товч агуулга *
                </label>
                <textarea
                  id="create-excerpt"
                  value={createForm.excerpt}
                  onChange={(e) => setCreateForm({ ...createForm, excerpt: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="create-content"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Дэлгэрэнгүй агуулга *
                </label>
                <textarea
                  id="create-content"
                  value={createForm.content}
                  onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="create-categoryId"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Ангилал *
                  </label>
                  <select
                    id="create-categoryId"
                    value={createForm.categoryId}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, categoryId: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500 focus:border-transparent"
                    required
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="create-isPublished"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Төлөв
                  </label>
                  <select
                    id="create-isPublished"
                    value={createForm.isPublished.toString()}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, isPublished: e.target.value === "true" })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500 focus:border-transparent"
                  >
                    <option value="false">Ноорог</option>
                    <option value="true">Нийтлэх</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="create-image"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Зураг *
                </label>
                <input
                  type="file"
                  id="create-image"
                  accept="image/*"
                  onChange={(e) => setCreateForm({ ...createForm, image: e.target.files?.[0] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500 focus:border-transparent"
                  required
                />
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
                      <PlusCircle className="w-4 h-4 mr-2" />
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
