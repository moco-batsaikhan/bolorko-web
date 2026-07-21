"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { apiService, Product } from "@/services/apiService";
import { API_BASE_URL } from "@/constants/constants";
import Loading from "@/components/Loading";
import { Newspaper, Calendar, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

function getImageUrls(images: string[] | string | null): string[] {
  if (!images) return [];

  if (typeof images === "string") {
    if (images === "string") return [];
    return [images.startsWith("http") ? images : `${API_BASE_URL}${images}`];
  }

  if (Array.isArray(images)) {
    return images.map((img) => (img.startsWith("http") ? img : `${API_BASE_URL}${img}`));
  }

  return [];
}

// Текст доторх URL болон утасны дугаарыг дарж болдог линк болгоно
function renderText(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+|\b\d{8}\b)/g);
  return parts.map((part, i) => {
    if (part.startsWith("http")) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="text-red-600 hover:underline break-all"
        >
          {part}
        </a>
      );
    }
    if (/^\d{8}$/.test(part)) {
      return (
        <a key={i} href={`tel:${part}`} className="text-red-600 hover:underline">
          {part}
        </a>
      );
    }
    return part;
  });
}

function InfoCard({ post }: { post: Product }) {
  const [expanded, setExpanded] = useState(false);
  const images = getImageUrls(post.images);
  const isLong = post.description.length > 300;

  return (
    <article className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Post header */}
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">{post.name}</h2>
          {post.postedAt && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
              <Calendar size={13} />
              {new Date(post.postedAt).toLocaleDateString("mn-MN")}
            </div>
          )}
        </div>
        {post.permalinkUrl && (
          <a
            href={post.permalinkUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#1877F2] transition-colors flex-shrink-0"
            title="Facebook дээр үзэх"
          >
            <ExternalLink size={14} />
            Facebook
          </a>
        )}
      </div>

      {/* Text */}
      <div className="px-5 pb-4">
        <p
          className={`text-gray-700 text-sm leading-relaxed whitespace-pre-line break-words ${
            !expanded && isLong ? "line-clamp-5" : ""
          }`}
        >
          {renderText(post.description)}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
          >
            {expanded ? (
              <>
                Хураах <ChevronUp size={16} />
              </>
            ) : (
              <>
                Дэлгэрэнгүй <ChevronDown size={16} />
              </>
            )}
          </button>
        )}
      </div>

      {/* Images */}
      {images.length > 0 && (
        <div
          className={`grid gap-0.5 ${
            images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-3"
          }`}
        >
          {images.slice(0, 6).map((url, i) => (
            <div key={i} className="relative aspect-square bg-gray-100 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`${post.name} ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {i === 5 && images.length > 6 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-lg font-semibold">
                  +{images.length - 6}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

export default function InfoPage() {
  const [posts, setPosts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await apiService.getProducts({ type: "INFO" });
        // Шинэ пост эхэндээ
        data.sort((a, b) => {
          const dateA = new Date(a.postedAt || a.createdAt).getTime();
          const dateB = new Date(b.postedAt || b.createdAt).getTime();
          return dateB - dateA;
        });
        setPosts(data);
      } catch (err) {
        console.error("Failed to load info posts:", err);
        setError("Мэдээлэл ачаалахад алдаа гарлаа");
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <div className="bg-gradient-to-br from-red-700 to-red-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-90" />
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Мэдээлэл</h1>
          <p className="text-red-100">Дэлгүүрийн шинэ мэдээ, зарлал</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <Loading />
        ) : error ? (
          <div className="text-center py-16 text-gray-500">{error}</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Newspaper size={48} className="mx-auto mb-4 text-gray-300" />
            Одоогоор мэдээлэл байхгүй байна
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <InfoCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
