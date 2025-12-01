"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { apiService, Lesson, CreateLessonCommentRequest } from "@/services/apiService";
import {
  BookOpen,
  Play,
  DollarSign,
  MessageSquare,
  Eye,
  Calendar,
  Search,
  Filter,
  User,
  Send,
  Star,
  Clock,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

export default function LessonsPage() {
  const { showToast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLessons, setTotalLessons] = useState(0);

  // Comment modal states
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    fetchLessons();
  }, [currentPage]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPublicLessons(currentPage, 12);
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

  const handleViewComments = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setIsCommentModalOpen(true);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      showToast("Сэтгэгдэл үлдээхийн тулд нэвтэрнэ үү", "error");
      return;
    }

    if (!selectedLesson || !newComment.trim()) {
      return;
    }

    setIsSubmittingComment(true);

    try {
      const commentData: CreateLessonCommentRequest = {
        lessonId: selectedLesson.id,
        comment: newComment.trim(),
      };

      const createdComment = await apiService.createLessonComment(commentData);

      // Update the selected lesson's comments
      const updatedLesson = {
        ...selectedLesson,
        comments: [createdComment, ...selectedLesson.comments],
      };
      setSelectedLesson(updatedLesson);

      // Update the lesson in the main list
      setLessons(
        lessons.map((lesson) => (lesson.id === selectedLesson.id ? updatedLesson : lesson)),
      );

      setNewComment("");
      showToast("Сэтгэгдэл амжилттай нэмэгдлээ", "success");
    } catch (error) {
      console.error("Error creating comment:", error);
      showToast("Сэтгэгдэл нэмэхэд алдаа гарлаа", "error");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const filteredLessons = lessons
    .filter(
      (lesson) =>
        lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.description.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .filter((lesson) => lesson.isPublished);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mega-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-900 to-black text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Онлайн хичээлүүд</h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Мэргэжлийн багш нарын хичээлээр өөрийн чадварыг хөгжүүлээрэй
            </p>
            <div className="flex justify-center items-center space-x-8 text-gray-300">
              <div className="flex items-center">
                <BookOpen className="w-6 h-6 mr-2" />
                <span>{totalLessons} хичээл</span>
              </div>
              <div className="flex items-center">
                <User className="w-6 h-6 mr-2" />
                <span>10+ видео</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Хичээл хайх..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mega-500 focus:border-mega-500"
                />
              </div>
            </div>

            <div className="flex items-center text-sm text-gray-600">
              <Filter className="w-4 h-4 mr-2" />
              {filteredLessons.length} хичээл олдлоо
            </div>
          </div>
        </div>

        {/* Lessons Grid */}
        {filteredLessons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
              >
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={
                      lesson.image
                        ? `http://129.212.228.96${lesson.image}`
                        : "/imgs/placeholder-lesson.jpg"
                    }
                    alt={lesson.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <div className="bg-black bg-opacity-70 text-white px-2 py-1 rounded-md flex items-center text-sm">
                      <Play className="w-3 h-3 mr-1" />
                      {lesson.videos?.length || 0} видео
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {lesson.title}
                  </h3>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{lesson.description}</p>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      {lesson.viewCount} үзсэн
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(lesson.createdAt).toLocaleDateString("mn-MN")}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleViewComments(lesson)}
                      className="flex items-center text-gray-600 hover:text-mega-600 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      {lesson.comments?.length || 0} сэтгэгдэл
                    </button>

                    <Link
                      href={`/lessons/${lesson.id}`}
                      className="bg-mega-600 text-white px-4 py-2 rounded-md hover:bg-mega-700 transition-colors text-sm font-medium"
                    >
                      Дэлгэрэнгүй
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Хичээл олдсонгүй</h3>
            <p className="text-gray-600">
              {searchTerm ? "Хайлтын үр дүн олдсонгүй" : "Одоогоор хичээл байхгүй байна"}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-12">
            <div className="flex space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
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
      </div>

      {/* Comments Modal */}
      {isCommentModalOpen && selectedLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {selectedLesson.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedLesson.comments?.length || 0} сэтгэгдэл
                  </p>
                </div>
                <button
                  onClick={() => setIsCommentModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-96 p-6">
              {selectedLesson.comments && selectedLesson.comments.length > 0 ? (
                <div className="space-y-4">
                  {selectedLesson.comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {comment.user?.name || "Хэрэглэгч"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString("mn-MN")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Сэтгэгдэл байхгүй байна</p>
                  <p className="text-sm text-gray-400">Анхны сэтгэгдэлийг та үлдээж болно</p>
                </div>
              )}
            </div>

            {/* Comment Form */}
            {isAuthenticated ? (
              <div className="p-6 border-t bg-gray-50">
                <form onSubmit={handleSubmitComment} className="space-y-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Сэтгэгдэл үлдээх..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-mega-500 focus:border-mega-500 resize-none"
                    required
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingComment || !newComment.trim()}
                      className="bg-mega-600 text-white px-4 py-2 rounded-md hover:bg-mega-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isSubmittingComment ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      {isSubmittingComment ? "Илгээж байна..." : "Сэтгэгдэл үлдээх"}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="p-6 border-t bg-gray-50 text-center">
                <p className="text-gray-600 mb-3">Сэтгэгдэл үлдээхийн тулд нэвтэрнэ үү</p>
                <Link
                  href="/"
                  className="bg-mega-600 text-white px-4 py-2 rounded-md hover:bg-mega-700 transition-colors inline-block"
                  onClick={() => setIsCommentModalOpen(false)}
                >
                  Нэвтрэх
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
