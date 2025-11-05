"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "next/navigation";
import { apiService, Lesson, CreateLessonCommentRequest } from "@/services/apiService";
import {
  BookOpen,
  Play,
  MessageSquare,
  Eye,
  Calendar,
  User,
  Send,
  Clock,
  ArrowLeft,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";

export default function LessonDetailPage() {
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  const params = useParams();
  const lessonId = parseInt(params.id as string);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>("");
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number>(0);

  useEffect(() => {
    if (lessonId) {
      fetchLessonDetail();
    }
  }, [lessonId]);

  const fetchLessonDetail = async () => {
    try {
      setLoading(true);
      const lesson = await apiService.getPublicLessonDetail(lessonId);

      if (lesson) {
        setLesson(lesson);
        // Start with lesson overview, user can click to play videos
        setCurrentVideoUrl("");
        setSelectedVideoIndex(0);
      } else {
        showToast("Хичээл олдсонгүй", "error");
      }
    } catch (error) {
      console.error("Error fetching lesson:", error);
      showToast("Хичээлийн мэдээлэл ачааллахад алдаа гарлаа", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSelect = (videoUrl: string, index: number) => {
    setCurrentVideoUrl(videoUrl);
    setSelectedVideoIndex(index);
  };

  const getEmbeddedVideoUrl = (url: string) => {
    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      showToast("Сэтгэгдэл үлдээхийн тулд нэвтэрнэ үү", "error");
      return;
    }

    if (!lesson || !newComment.trim()) {
      return;
    }

    setIsSubmittingComment(true);

    try {
      const commentData: CreateLessonCommentRequest = {
        lessonId: lesson.id,
        comment: newComment.trim(),
      };

      const createdComment = await apiService.createLessonComment(commentData);

      // Update the lesson's comments
      setLesson({
        ...lesson,
        comments: [createdComment, ...lesson.comments],
      });

      setNewComment("");
      showToast("Сэтгэгдэл амжилттай нэмэгдлээ", "success");
    } catch (error) {
      console.error("Error creating comment:", error);
      showToast("Сэтгэгдэл нэмэхэд алдаа гарлаа", "error");
    } finally {
      setIsSubmittingComment(false);
    }
  };

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

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Хичээл олдсонгүй</h1>
          <p className="text-gray-600 mb-6">Уучлаарай, таны хайж байгаа хичээл олдсонгүй.</p>
          <Link
            href="/lessons"
            className="bg-mega-600 text-white px-6 py-3 rounded-md hover:bg-mega-700 transition-colors"
          >
            Хичээлүүдийн жагсаалт руу буцах
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/lessons"
            className="flex items-center text-mega-600 hover:text-mega-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Хичээлүүдийн жагсаалт руу буцах
          </Link>
        </div>

        {/* Lesson Header */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          {currentVideoUrl && (
            <div className="p-4 bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Play className="w-4 h-4 text-mega-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Хичээл {selectedVideoIndex + 1} тоглож байна
                  </span>
                </div>
                <button
                  onClick={() => setCurrentVideoUrl("")}
                  className="text-sm text-gray-600 hover:text-gray-800 flex items-center space-x-1"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Хичээлийн танилцуулга</span>
                </button>
              </div>
            </div>
          )}
          <div className="aspect-video relative">
            {currentVideoUrl ? (
              <iframe
                src={getEmbeddedVideoUrl(currentVideoUrl)}
                title={`Хичээл ${selectedVideoIndex + 1}`}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : lesson.videos && lesson.videos.length > 0 ? (
              <>
                <img
                  src={
                    lesson.image
                      ? `http://0.0.0.0:3000${lesson.image}`
                      : "/imgs/placeholder-lesson.jpg"
                  }
                  alt={lesson.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <button
                    onClick={() => handleVideoSelect(lesson.videos[0].videoUrl, 0)}
                    className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-4 transition-all"
                  >
                    <Play className="w-12 h-12 text-mega-600" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <img
                  src={
                    lesson.image
                      ? `http://0.0.0.0:3000${lesson.image}`
                      : "/imgs/placeholder-lesson.jpg"
                  }
                  alt={lesson.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <div className="bg-white bg-opacity-90 rounded-full p-4">
                    <BookOpen className="w-12 h-12 text-gray-600" />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="p-8">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{lesson.title}</h1>
                <p className="text-gray-600 text-lg mb-6">{lesson.description}</p>

                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-6">
                  <div className="flex items-center">
                    <Play className="w-4 h-4 mr-2" />
                    {lesson.videos?.length || 0} видео хичээл
                  </div>
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-2" />
                    {lesson.viewCount} үзсэн
                  </div>
                  <div className="flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {lesson.comments?.length || 0} сэтгэгдэл
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(lesson.createdAt).toLocaleDateString("mn-MN")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lesson Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Videos Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Хичээлийн агуулга</h2>

              {lesson.videos && lesson.videos.length > 0 ? (
                <div className="space-y-3">
                  {lesson.videos.map((video, index) => (
                    <div
                      key={video.id}
                      className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        selectedVideoIndex === index && currentVideoUrl
                          ? "border-mega-500 bg-mega-50"
                          : "border-gray-200"
                      }`}
                      onClick={() => handleVideoSelect(video.videoUrl, index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`rounded-full p-2 ${
                              selectedVideoIndex === index && currentVideoUrl
                                ? "bg-mega-600 text-white"
                                : "bg-mega-100 text-mega-600"
                            }`}
                          >
                            <Play className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              Хичээл {index + 1}: {video.description}
                            </h3>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <Clock className="w-3 h-3 mr-1" />
                              Хугацаа: ~15 минут
                            </div>
                          </div>
                        </div>
                        <button
                          className={`font-medium ${
                            selectedVideoIndex === index && currentVideoUrl
                              ? "text-mega-600 bg-mega-100 px-3 py-1 rounded-full text-sm"
                              : "text-mega-600 hover:text-mega-700"
                          }`}
                        >
                          {selectedVideoIndex === index && currentVideoUrl
                            ? "Тоглож байна"
                            : "Үзэх"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Play className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Видео хичээл байхгүй байна</p>
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Сэтгэгдлүүд ({lesson.comments?.length || 0})
              </h2>

              {/* Comment Form */}
              {isAuthenticated ? (
                <form onSubmit={handleSubmitComment} className="mb-8">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Энэ хичээлийн талаар сэтгэгдэл үлдээх..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mega-500 focus:border-mega-500 resize-none"
                    required
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      type="submit"
                      disabled={isSubmittingComment || !newComment.trim()}
                      className="bg-mega-600 text-white px-6 py-2 rounded-lg hover:bg-mega-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
              ) : (
                <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-gray-600 mb-3">Сэтгэгдэл үлдээхийн тулд нэвтэрнэ үү</p>
                  <Link
                    href="/"
                    className="bg-mega-600 text-white px-4 py-2 rounded-md hover:bg-mega-700 transition-colors inline-block"
                  >
                    Нэвтрэх
                  </Link>
                </div>
              )}

              {/* Comments List */}
              {lesson.comments && lesson.comments.length > 0 ? (
                <div className="space-y-4">
                  {lesson.comments.map((comment) => (
                    <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="bg-mega-100 rounded-full p-2">
                          <User className="w-4 h-4 text-mega-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {comment.user?.name || "Хэрэглэгч"}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {new Date(comment.createdAt).toLocaleDateString("mn-MN")}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 ml-11">{comment.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">Сэтгэгдэл байхгүй байна</p>
                  <p className="text-sm text-gray-400">Анхны сэтгэгдэлийг та үлдээж болно</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Lesson Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Хичээлийн мэдээлэл</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Үзсэн тоо:</span>
                  <span className="font-medium">{lesson.viewCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Видео тоо:</span>
                  <span className="font-medium">{lesson.videos?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Сэтгэгдэл:</span>
                  <span className="font-medium">{lesson.comments?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Үүссэн:</span>
                  <span className="font-medium">
                    {new Date(lesson.createdAt).toLocaleDateString("mn-MN")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
