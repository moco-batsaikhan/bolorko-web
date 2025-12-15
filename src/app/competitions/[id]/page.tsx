"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  apiService,
  Competition,
  CompetitionComment,
} from "@/services/apiService";
import { API_BASE_URL } from "@/constants/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Calendar,
  MapPin,
  ExternalLink,
  ArrowLeft,
  MessageCircle,
  Send,
  Trash2,
  User,
} from "lucide-react";

interface CompetitionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CompetitionDetailPage({
  params,
}: CompetitionDetailPageProps) {
  const resolvedParams = React.use(params);
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [comments, setComments] = useState<CompetitionComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const loadCompetition = useCallback(async () => {
    try {
      setLoading(true);
      const competitionData = await apiService.getCompetitionById(
        parseInt(resolvedParams.id)
      );
      setCompetition(competitionData);

      // Load comments
      const commentsData = await apiService.getCompetitionComments(
        parseInt(resolvedParams.id)
      );
      setComments(commentsData);
    } catch (error) {
      console.error("Failed to load competition:", error);
      showToast("Тэмцээний мэдээлэл ачааллахад алдаа гарлаа", "error");
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id, showToast]);

  useEffect(() => {
    loadCompetition();
  }, [loadCompetition]);

  const getFullImageUrl = (imageUrl: string) => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http")) return imageUrl;
    return `${API_BASE_URL}${imageUrl}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("mn-MN");
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      UPCOMING: {
        label: "Удахгүй",
        color: "bg-blue-100 text-blue-800 border-blue-200",
      },
      ONGOING: {
        label: "Явагдаж буй",
        color: "bg-green-100 text-green-800 border-green-200",
      },
      COMPLETED: {
        label: "Дууссан",
        color: "bg-gray-100 text-gray-800 border-gray-200",
      },
    };

    const statusInfo =
      statusMap[status as keyof typeof statusMap] || statusMap.UPCOMING;
    return (
      <span
        className={`px-4 py-2 text-sm font-medium rounded-full border ${statusInfo.color}`}
      >
        {statusInfo.label}
      </span>
    );
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      setSubmittingComment(true);
      await apiService.createCompetitionComment(
        parseInt(resolvedParams.id),
        newComment.trim()
      );
      setNewComment("");

      // Reload comments
      const commentsData = await apiService.getCompetitionComments(
        parseInt(resolvedParams.id)
      );
      setComments(commentsData);

      showToast("Сэтгэгдэл амжилттай нэмэгдлээ", "success");
    } catch (error) {
      console.error("Failed to create comment:", error);
      showToast("Сэтгэгдэл нэмэхэд алдаа гарлаа", "error");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm("Сэтгэгдлийг устгахдаа итгэлтэй байна уу?")) return;

    try {
      await apiService.deleteCompetitionComment(commentId);

      // Reload comments
      const commentsData = await apiService.getCompetitionComments(
        parseInt(resolvedParams.id)
      );
      setComments(commentsData);

      showToast("Сэтгэгдэл амжилттай устгагдлаа", "success");
    } catch (error) {
      console.error("Failed to delete comment:", error);
      showToast("Сэтгэгдэл устгахад алдаа гарлаа", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <Trophy className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Тэмцээн олдсонгүй
            </h1>
            <p className="text-gray-600 mb-6">
              Хүссэн тэмцээн олдсонгүй эсвэл устгагдсан байна.
            </p>
            <Link
              href="/competitions"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft size={16} />
              Тэмцээний жагсаалт руу буцах
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/competitions"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft size={16} />
            Тэмцээний жагсаалт руу буцах
          </Link>
        </div>

        {/* Competition Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          {/* Image */}
          {competition.image && (
            <div className="aspect-video relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getFullImageUrl(competition.image)}
                alt={competition.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "";
                  target.style.display = "none";
                }}
              />
              <div className="absolute top-6 right-6">
                {getStatusBadge(competition.status)}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-8">
            {/* Title and Status */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {competition.title}
                </h1>
                {!competition.image && (
                  <div className="mb-4">
                    {getStatusBadge(competition.status)}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Тэмцээний тухай
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {competition.description}
              </p>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Date */}
              <div className="flex items-start gap-3">
                <Calendar className="text-blue-600 mt-1" size={20} />
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Огноо</h3>
                  <p className="text-gray-600">
                    <span className="block">
                      Эхлэх: {formatDate(competition.startDate)}
                    </span>
                    <span className="block">
                      Дуусах: {formatDate(competition.endDate)}
                    </span>
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3">
                <MapPin className="text-green-600 mt-1" size={20} />
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Байршил</h3>
                  <p className="text-gray-600">{competition.address}</p>
                </div>
              </div>
            </div>

            {/* Register Button - Only show for UPCOMING competitions */}
            {competition.status === "UPCOMING" && (
              <div className="border-t pt-6">
                <a
                  href={competition.registerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-lg font-medium"
                >
                  <ExternalLink size={20} />
                  Тэмцээнд бүртгүүлэх
                </a>
              </div>
            )}

            {/* Status message for non-upcoming competitions */}
            {competition.status !== "UPCOMING" && (
              <div className="border-t pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-6 py-3 rounded-lg text-lg font-medium">
                  <Trophy size={20} />
                  {competition.status === "ONGOING"
                    ? "Тэмцээн явагдаж байна"
                    : "Тэмцээн дууссан"}
                </div>
                {user?.role === "ADMIN" && (
                  <button
                    className="text-blue-600 cursor-pointer"
                    onClick={() => {
                      if (competition)
                        router.push(`/competitions/${competition.id}/result`);
                    }}
                  >
                    Үр дүн харах
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center gap-2">
              <MessageCircle className="text-blue-600" size={20} />
              <h2 className="text-xl font-semibold text-gray-900">
                Сэтгэгдэл ({comments.length})
              </h2>
            </div>
          </div>

          {/* Comment Form */}
          {user ? (
            <div className="p-6 border-b bg-gray-50">
              <form onSubmit={handleSubmitComment} className="space-y-4">
                <div>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Сэтгэгдэл бичих..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingComment || !newComment.trim()}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingComment ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send size={16} />
                    )}
                    Илгээх
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-6 border-b bg-gray-50">
              <p className="text-gray-600 text-center">
                Сэтгэгдэл бичихийн тулд{" "}
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-700"
                >
                  нэвтрэх
                </Link>{" "}
                хэрэгтэй.
              </p>
            </div>
          )}

          {/* Comments List */}
          <div className="divide-y">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User size={20} className="text-gray-500" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {comment.user.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {formatDateTime(comment.createdAt)}
                          </p>
                        </div>
                        {user &&
                          (user.id === comment.user.id ||
                            user.role === "ADMIN") && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-red-600 hover:text-red-700 p-1"
                              title="Устгах"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                      </div>
                      <p className="text-gray-700 whitespace-pre-line">
                        {comment.comment}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">
                  Одоогоор сэтгэгдэл байхгүй байна.
                </p>
                {user && (
                  <p className="text-gray-500 text-sm mt-1">
                    Эхний сэтгэгдлээ үлдээрэй!
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
