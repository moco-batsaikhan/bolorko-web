"use client";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useState, useEffect } from "react";
import { apiService, NewsArticle, NewsCategory, NewsResponse } from "@/services/apiService";
import Link from "next/link";
import {
  Calendar,
  User,
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import Loading from "@/components/Loading";

export default function NewsPage() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 10;

  // Fetch news data
  const fetchNews = async (page: number = 1, categoryId?: number) => {
    try {
      setLoading(true);
      const response = await apiService.getNews({
        page,
        limit: ITEMS_PER_PAGE,
        categoryId: categoryId || undefined,
      });
      setNews(response.data);
      setTotalPages(response.pages);
      setError(null);
    } catch (err) {
      setError("Мэдээ татахад алдаа гарлаа");
      console.error("Error fetching news:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const categoriesData = await apiService.getNewsCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCategories();
    fetchNews(1, selectedCategory || undefined);
  }, []);

  // Handle category filter
  const handleCategoryFilter = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
    fetchNews(1, categoryId || undefined);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchNews(page, selectedCategory || undefined);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="relative text-white py-20 h-96 overflow-hidden">
        <img src="/imgs/news-bg.jpg" alt="bg" className="absolute inset-0 bg-cover bg-center" />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/60"></div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight drop-shadow-2xl">
              Мэдээ мэдээлэл
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto leading-relaxed">
              MEGA клубын хамгийн сүүлийн үеийн мэдээ,
              <span className="font-semibold"> төсөл болон үйл ажиллагааны талаарх </span>
              мэдээлэл
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Filter className="w-5 h-5 mr-2 text-mega-600" />
            <h3 className="text-lg font-semibold text-gray-900">Ангилал</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCategoryFilter(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedCategory === null
                  ? "bg-mega-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-mega-50 border border-gray-200"
              }`}
            >
              Бүгд
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryFilter(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category.id
                    ? "bg-mega-600 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-mega-50 border border-gray-200"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <Loading />
        ) : (
          <>
            {/* News List */}
            <div className="space-y-6 mb-12">
              {news.map((article) => (
                <Link
                  key={article.id}
                  href={`/news/${article.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group block"
                >
                  <div className="flex">
                    {/* Article Image */}
                    <div className="relative overflow-hidden w-48 flex-shrink-0">
                      {article.imageUrl ? (
                        <img
                          src={
                            article.imageUrl.startsWith("http")
                              ? article.imageUrl
                              : `http://0.0.0.0:3000${article.imageUrl}`
                          }
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                          <div className="text-gray-400 text-center">
                            <div className="w-12 h-12 bg-gray-300 rounded-lg mx-auto mb-1 flex items-center justify-center">
                              📰
                            </div>
                            <p className="text-xs">Зураг байхгүй</p>
                          </div>
                        </div>
                      )}
                      {article.category && (
                        <div className="absolute top-2 left-2">
                          <span className="bg-mega-600 text-white px-2 py-1 rounded text-xs font-medium">
                            {article.category.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Article Content */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900  group-hover:text-mega-600 transition-colors line-clamp-2">
                          {article.title}
                        </h2>
                        <p className="text-gray-600 mb-4 line-clamp-2">{article.excerpt}</p>
                      </div>

                      {/* Article Meta */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {article.author.name}
                          </div>
                          <div className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            {article.viewCount}
                          </div>
                          <div className="flex items-center">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            {article.comments.length}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(article.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Empty State */}
            {news.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  📰
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Мэдээ олдсонгүй</h3>
                <p className="text-gray-600">Энэ ангиллаар мэдээ байхгүй байна.</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Өмнөх
                </button>

                <div className="flex space-x-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === i + 1
                          ? "bg-mega-600 text-white"
                          : "text-gray-700 bg-white border border-gray-300 hover:bg-mega-50"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Дараах
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
