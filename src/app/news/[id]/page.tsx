"use client";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiService, NewsArticle } from "@/services/apiService";
import Link from "next/link";
import {
  Calendar,
  User,
  Eye,
  ArrowLeft,
  Share2,
  ChevronRight,
  MessageCircle,
  Send,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { LoginModal } from "@/components/LoginModal";
import Loading from "@/components/Loading";

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Fetch article details
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const articleId = parseInt(params.id as string);
        if (isNaN(articleId)) {
          setError("Мэдээний ID буруу байна");
          return;
        }

        const articleData = await apiService.getNewsDetail(articleId);
        console.log(articleData);
        setArticle(articleData);
        setError(null);
      } catch (err) {
        setError("Мэдээ ачаалахад алдаа гарлаа");
        console.error("Error fetching article:", err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchArticle();
    }
  }, [params.id]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  };

  // Handle comment submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentText.trim()) {
      showToast("Сэтгэгдэл хоосон байна", "error");
      return;
    }

    if (!isAuthenticated) {
      showToast("Сэтгэгдэл бичихийн тулд нэвтэрнэ үү", "error");
      return;
    }

    try {
      setSubmittingComment(true);
      const articleId = parseInt(params.id as string);
      const newComment = await apiService.addNewsComment(articleId, commentText);

      // Ensure author data is complete for new comment
      const completeComment = {
        ...newComment,
        author: newComment.author || {
          id: user?.id || 0,
          name: user?.name || "Unknown",
          email: user?.email || "",
          roleId: 1,
          createdAt: new Date().toISOString(),
        },
      };

      // Update article with new comment
      if (article) {
        setArticle({
          ...article,
          comments: [...article.comments, completeComment],
        });
      }

      setCommentText("");
      showToast("Сэтгэгдэл амжилттай нэмэгдлээ", "success");
    } catch (err) {
      showToast("Сэтгэгдэл нэмэхэд алдаа гарлаа", "error");
      console.error("Error adding comment:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <Link
          href="/news"
          className="inline-flex items-center text-mega-600 hover:text-mega-700 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Мэдээ рүү буцах
        </Link>

        {/* Article Header */}
        <header className="mb-8">
          {article!.category && (
            <div className="mb-4">
              <span className="inline-block bg-mega-100 text-mega-800 px-3 py-1 rounded-full text-sm font-medium">
                {article!.category.name}
              </span>
            </div>
          )}

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {article!.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4 text-gray-600">
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                <span className="font-medium">{article!.author.name}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{formatDate(article!.createdAt)}</span>
              </div>
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                <span>{article!.viewCount} үзсэн</span>
              </div>
              <div className="flex items-center">
                <MessageCircle className="w-4 h-4 mr-2" />
                <span>{article!.comments.length} сэтгэгдэл</span>
              </div>
            </div>
          </div>
        </header>

        {/* Article Image */}
        {article!.imageUrl && (
          <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
            <img
              src={
                article!.imageUrl.startsWith("http")
                  ? article!.imageUrl
                  : `http://0.0.0.0:3000${article!.imageUrl}`
              }
              alt={article!.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Article Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div
            className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
            style={{ lineHeight: "1.8" }}
          >
            {article!.content.split("\n").map((paragraph, index) => (
              <p key={index} className="mb-4">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </article>

      {/* Comment Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center mb-6">
            <MessageCircle className="w-5 h-5 mr-2 text-mega-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Сэтгэгдэл ({article?.comments.length || 0})
            </h2>
          </div>

          {/* Comments List */}
          <div className="space-y-6">
            {article?.comments && article.comments.length > 0 ? (
              article.comments.map((comment) => (
                <div key={comment.id} className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{comment.author.name}</h4>
                        <span className="text-sm text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Сэтгэгдэл байхгүй байна
                </h3>
                <p className="text-gray-600">Энэ нийтлэлд анхны сэтгэгдлээ үлдээнэ үү!</p>
              </div>
            )}
          </div>
          {/* Comment Form */}
          {isAuthenticated ? (
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <div className="flex items-start mt-12 space-x-4">
                <div className="w-10 h-10 bg-mega-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Сэтгэгдэл бичих..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mega-500 focus:border-transparent resize-none"
                    disabled={submittingComment}
                  />
                  <div className="flex justify-between items-center mt-3">
                    <button
                      type="submit"
                      disabled={submittingComment || !commentText.trim()}
                      className="flex items-center px-4 py-2 bg-mega-600 text-white rounded-lg hover:bg-mega-700 focus:outline-none focus:ring-2 focus:ring-mega-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingComment ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Илгээж байна...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Сэтгэгдэл илгээх
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-12 mb-8 text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Сэтгэгдэл бичих</h3>
              <p className="text-gray-600 mb-4">Сэтгэгдэл бичихийн тулд эхлээд нэвтэрнэ үү</p>
              <button
                onClick={() => {
                  setShowLoginModal(true);
                }}
                className="bg-mega-600 text-white px-6 py-2 rounded-lg hover:bg-mega-700 transition-colors"
              >
                Нэвтрэх
              </button>
            </div>
          )}
        </div>
      </div>

      <Footer />
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}
