"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/contexts/ToastContext";
import {
  apiService,
  Lesson,
  CreateLessonRequest,
  UpdateLessonRequest,
  CreateLessonVideoRequest,
} from "@/services/apiService";
import {
  Calendar,
  PlusCircle,
  Edit3,
  Trash2,
  Eye,
  BookOpen,
  Search,
  Filter,
  User,
  MessageSquare,
  Play,
  X,
  Save,
  Upload,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function AdminLessonsPage() {
  const { showToast } = useToast();

  // Default form state
  const defaultFormData: CreateLessonRequest = {
    title: "",
    description: "",
    price: 0, // Keep for API compatibility but hide from UI
    isPublished: false,
    image: undefined,
  };

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLessons, setTotalLessons] = useState(0);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateLessonRequest>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Video management states
  const [videoFormData, setVideoFormData] = useState<CreateLessonVideoRequest>({
    lessonId: 0,
    description: "",
    videoUrl: "",
    order: 1,
  });
  const [isAddingVideo, setIsAddingVideo] = useState(false);

  useEffect(() => {
    fetchLessons();
  }, [currentPage, filterStatus]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAdminLessons(currentPage, 10);
      setLessons(response.data);
      setTotalPages(response.pages);
      setTotalLessons(response.total);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      showToast("Хичээлийн мэдээлэл ачааллахад алдаа гарлаа", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setIsSubmitting(true);

    try {
      const newLesson = await apiService.createLesson(formData);
      setLessons([newLesson, ...lessons]);
      setIsCreateModalOpen(false);
      setFormData({ ...defaultFormData });
      showToast("Хичээл амжилттай үүсгэлээ", "success");
    } catch (error) {
      console.error("Error creating lesson:", error);
      showToast("Хичээл үүсгэхэд алдаа гарлаа", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setFormData({
      title: lesson.title,
      description: lesson.description,
      price: parseFloat(lesson.price) || 0,
      isPublished: lesson.isPublished,
      image: undefined,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLesson) return;

    setFormErrors({});
    setIsSubmitting(true);

    try {
      const updatedLesson = await apiService.updateLesson(selectedLesson.id, formData);
      setLessons(
        lessons.map((lesson) => (lesson.id === selectedLesson.id ? updatedLesson : lesson)),
      );
      setIsEditModalOpen(false);
      setSelectedLesson(null);
      showToast("Хичээл амжилттай шинэчлэлээ", "success");
    } catch (error) {
      console.error("Error updating lesson:", error);
      showToast("Хичээл шинэчлэхэд алдаа гарлаа", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLesson = async (id: number) => {
    if (!confirm("Та энэ хичээлийг устгахдаа итгэлтэй байна уу?")) {
      return;
    }

    try {
      await apiService.deleteLesson(id);
      setLessons(lessons.filter((lesson) => lesson.id !== id));
      showToast("Хичээл амжилттай устгагдлаа", "success");
    } catch (error) {
      console.error("Error deleting lesson:", error);
      showToast("Хичээл устгахад алдаа гарлаа", "error");
    }
  };

  const handleDeleteComment = async (commentId: number, lessonId: number) => {
    if (!confirm("Та энэ сэтгэгдлийг устгахдаа итгэлтэй байна уу?")) {
      return;
    }

    try {
      await apiService.deleteLessonComment(commentId);

      // Update the lesson's comments in state
      setLessons(
        lessons.map((lesson) => {
          if (lesson.id === lessonId) {
            return {
              ...lesson,
              comments: lesson.comments.filter((comment) => comment.id !== commentId),
            };
          }
          return lesson;
        }),
      );

      // Update selected lesson if it's currently being viewed
      if (selectedLesson && selectedLesson.id === lessonId) {
        setSelectedLesson({
          ...selectedLesson,
          comments: selectedLesson.comments.filter((comment) => comment.id !== commentId),
        });
      }

      showToast("Сэтгэгдэл амжилттай устгагдлаа", "success");
    } catch (error) {
      console.error("Error deleting comment:", error);
      showToast("Сэтгэгдэл устгахад алдаа гарлаа", "error");
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLesson) return;

    setIsAddingVideo(true);

    try {
      const newVideo = await apiService.createLessonVideo({
        ...videoFormData,
        lessonId: selectedLesson.id,
        order: selectedLesson.videos?.length ? selectedLesson.videos.length + 1 : 1,
      });

      // Update the selected lesson with new video
      const updatedLesson = {
        ...selectedLesson,
        videos: [...(selectedLesson.videos || []), newVideo],
      };
      setSelectedLesson(updatedLesson);

      // Update the lesson in the main list
      setLessons(
        lessons.map((lesson) => (lesson.id === selectedLesson.id ? updatedLesson : lesson)),
      );

      // Reset form
      setVideoFormData({
        lessonId: 0,
        description: "",
        videoUrl: "",
        order: 1,
      });

      showToast("Видео амжилттай нэмэгдлээ", "success");
    } catch (error) {
      console.error("Error adding video:", error);
      showToast("Видео нэмэхэд алдаа гарлаа", "error");
    } finally {
      setIsAddingVideo(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
    }
  };

  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "published" && lesson.isPublished) ||
      (filterStatus === "draft" && !lesson.isPublished);

    return matchesSearch && matchesFilter;
  });

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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Хичээлийн удирдлага</h2>
          <p className="text-gray-600">Онлайн хичээлүүдийг удирдах</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-mega-600 text-white rounded-lg hover:bg-mega-700 transition-colors flex items-center"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Шинэ хичээл
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Нийт хичээл</p>
              <p className="text-2xl font-semibold text-gray-900">{totalLessons}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Нийтэлсэн</p>
              <p className="text-2xl font-semibold text-gray-900">
                {lessons.filter((lesson) => lesson.isPublished).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Ноорог</p>
              <p className="text-2xl font-semibold text-gray-900">
                {lessons.filter((lesson) => !lesson.isPublished).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <Eye className="w-8 h-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Нийт үзсэн</p>
              <p className="text-2xl font-semibold text-gray-900">
                {lessons.reduce((sum, lesson) => sum + lesson.viewCount, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Хичээл хайх..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mega-500 focus:border-mega-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mega-500 focus:border-mega-500"
            >
              <option value="all">Бүх хичээл</option>
              <option value="published">Нийтэлсэн</option>
              <option value="draft">Ноорог</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lessons Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Хичээл
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Видео
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Сэтгэгдэл
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Үүссэн
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Үйлдэл
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLessons.map((lesson) => (
                <tr key={lesson.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        <img
                          className="h-12 w-12 rounded-lg object-cover"
                          src={
                            lesson.image
                              ? `http://0.0.0.0:3000${lesson.image}`
                              : "/imgs/placeholder-lesson.jpg"
                          }
                          alt={lesson.title}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{lesson.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-2">
                          {lesson.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        lesson.isPublished
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {lesson.isPublished ? "Нийтэлсэн" : "Ноорог"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Play className="w-4 h-4 mr-1 text-blue-500" />
                      {lesson.videos?.length || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <MessageSquare className="w-4 h-4 mr-1 text-purple-500" />
                      {lesson.comments?.length || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(lesson.createdAt).toLocaleDateString("mn-MN")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEditClick(lesson)}
                        className="text-mega-600 hover:text-mega-900 p-1 hover:bg-mega-50 rounded"
                        title="Засах"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLesson(lesson.id)}
                        className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                        title="Устгах"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLessons.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Хичээл олдсонгүй</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === page
                    ? "bg-mega-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create Lesson Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Шинэ хичээл үүсгэх</h3>
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setFormData({ ...defaultFormData });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateLesson} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Хичээлийн нэр *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-mega-500 focus:border-mega-500"
                    required
                  />
                  {formErrors.title && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Тайлбар *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-mega-500 focus:border-mega-500"
                    required
                  />
                  {formErrors.description && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Зураг</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-mega-500 focus:border-mega-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="h-4 w-4 text-mega-600 focus:ring-mega-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900">
                    Нийтлэх
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setFormData({ ...defaultFormData });
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Цуцлах
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-mega-600 text-white rounded-md hover:bg-mega-700 disabled:opacity-50 flex items-center"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {isSubmitting ? "Хадгалж байна..." : "Хадгалах"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lesson Modal */}
      {isEditModalOpen && selectedLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Хичээл засах</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left side - Form */}
                <div>
                  <form onSubmit={handleUpdateLesson} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Хичээлийн нэр *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-mega-500 focus:border-mega-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Тайлбар *
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-mega-500 focus:border-mega-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Шинэ зураг
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-mega-500 focus:border-mega-500"
                      />
                      {selectedLesson.image && (
                        <div className="mt-2">
                          <img
                            src={`http://0.0.0.0:3000${selectedLesson.image}`}
                            alt="Current"
                            className="h-20 w-20 object-cover rounded-md"
                          />
                          <p className="text-sm text-gray-500 mt-1">Одоогийн зураг</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="editIsPublished"
                        checked={formData.isPublished}
                        onChange={(e) =>
                          setFormData({ ...formData, isPublished: e.target.checked })
                        }
                        className="h-4 w-4 text-mega-600 focus:ring-mega-500 border-gray-300 rounded"
                      />
                      <label htmlFor="editIsPublished" className="ml-2 block text-sm text-gray-900">
                        Нийтлэх
                      </label>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsEditModalOpen(false)}
                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                      >
                        Цуцлах
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-mega-600 text-white rounded-md hover:bg-mega-700 disabled:opacity-50 flex items-center"
                      >
                        {isSubmitting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        {isSubmitting ? "Шинэчилж байна..." : "Шинэчлэх"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right side - Videos and Comments */}
                <div className="space-y-6">
                  {/* Videos Section */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                      <Play className="w-5 h-5 mr-2" />
                      Видео хичээлүүд ({selectedLesson.videos?.length || 0})
                    </h4>

                    {/* Add Video Form */}
                    <form onSubmit={handleAddVideo} className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="space-y-3">
                        <div>
                          <input
                            type="text"
                            placeholder="Видео тайлбар..."
                            value={videoFormData.description}
                            onChange={(e) =>
                              setVideoFormData({ ...videoFormData, description: e.target.value })
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-mega-500 focus:border-mega-500"
                            required
                          />
                        </div>
                        <div>
                          <input
                            type="url"
                            placeholder="YouTube URL..."
                            value={videoFormData.videoUrl}
                            onChange={(e) =>
                              setVideoFormData({ ...videoFormData, videoUrl: e.target.value })
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-mega-500 focus:border-mega-500"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isAddingVideo}
                          className="w-full bg-mega-600 text-white py-2 px-3 rounded-md hover:bg-mega-700 disabled:opacity-50 text-sm flex items-center justify-center"
                        >
                          {isAddingVideo ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <PlusCircle className="w-4 h-4 mr-2" />
                          )}
                          {isAddingVideo ? "Нэмж байна..." : "Видео нэмэх"}
                        </button>
                      </div>
                    </form>

                    {/* Videos List */}
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {selectedLesson.videos && selectedLesson.videos.length > 0 ? (
                        selectedLesson.videos.map((video, index) => (
                          <div
                            key={video.id}
                            className="bg-white border border-gray-200 p-3 rounded-lg"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <Play className="w-3 h-3 text-mega-600" />
                                  <span className="text-xs font-medium text-gray-900">
                                    Хичээл {index + 1}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 mb-1">{video.description}</p>
                                <a
                                  href={video.videoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:text-blue-800 truncate block"
                                >
                                  {video.videoUrl}
                                </a>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <Play className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Видео байхгүй</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Сэтгэгдлүүд ({selectedLesson.comments?.length || 0})
                    </h4>

                    <div className="max-h-64 overflow-y-auto space-y-3">
                      {selectedLesson.comments && selectedLesson.comments.length > 0 ? (
                        selectedLesson.comments.map((comment) => (
                          <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900">
                                  {comment.user?.name || "Хэрэглэгч"}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.createdAt).toLocaleDateString("mn-MN")}
                                </span>
                              </div>
                              <button
                                onClick={() => handleDeleteComment(comment.id, selectedLesson.id)}
                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                title="Сэтгэгдэл устгах"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="text-sm text-gray-700">{comment.comment}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <MessageSquare className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Сэтгэгдэл байхгүй</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
