"use client";

import { useState, useEffect } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { apiService } from "@/services/apiService";
import Link from "next/link";
import {
  ShoppingBag,
  Newspaper,
  BookOpen,
  Trophy,
  ArrowRight,
  Star,
  Users,
  Target,
  Award,
} from "lucide-react";

export default function HomePage() {
  const [stats, setStats] = useState({
    products: 0,
    news: 0,
    lessons: 0,
    competitions: 0,
  });

  useEffect(() => {
    // Load statistics
    const loadStats = async () => {
      try {
        const [products, news, lessons, competitions] = await Promise.all([
          apiService
            .getProducts()
            .then((data) => ({ total: data.length }))
            .catch(() => ({ total: 0 })),
          apiService.getNews({ page: 1, limit: 1 }).catch(() => ({ total: 0 })),
          apiService.getPublicLessons(1, 1).catch(() => ({ total: 0 })),
          apiService.getCompetitions({ page: 1, limit: 1 }).catch(() => ({ total: 0 })),
        ]);

        setStats({
          products: products.total || 0,
          news: news.total || 0,
          lessons: lessons.total || 0,
          competitions: competitions.total || 0,
        });
      } catch (error) {
        console.error("Failed to load stats:", error);
      }
    };

    loadStats();
  }, []);

  const modules = [
    {
      title: "Дэлгүүр",
      description: "Рубик шоо болон холбогдох бүтээгдэхүүнүүд",
      icon: ShoppingBag,
      href: "/shop",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      iconColor: "text-blue-100",
      count: stats.products,
      features: ["Янз бүрийн рубик шоо", "Хурдны шоо", "хэрэгсэл"],
    },
    {
      title: "Мэдээ",
      description: "Клубын болон дэлхийн speedcubing мэдээ",
      icon: Newspaper,
      href: "/news",
      color: "bg-gradient-to-br from-green-500 to-green-600",
      iconColor: "text-green-100",
      count: stats.news,
      features: ["Шинэ мэдээ", "Уралдааны үр дүн", "Дэлхийн рекорд"],
    },
    {
      title: "Хичээл",
      description: "Рубик шооны алгоритм болон техник сурах",
      icon: BookOpen,
      href: "/lessons",
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      iconColor: "text-purple-100",
      count: stats.lessons,
      features: ["Видео хичээл", "Алгоритм", "Практик дасгал"],
    },
    {
      title: "Тэмцээн",
      description: "Клубын болон олон улсын тэмцээнүүд",
      icon: Trophy,
      href: "/competitions",
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
      iconColor: "text-orange-100",
      count: stats.competitions,
      features: ["Уралдаан", "Бүртгэл"],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-blue-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="mb-6">
              <span className="block text-4xl md:text-6xl font-bold">MEGA</span>
              <span className="block text-3xl md:text-3xl font-bold">
                Рубик шооны клубт тавтай морил
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Рубик шооны спортыг хөгжүүлэх, түгээх зорилготой клуб
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400 opacity-10 rounded-full"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-blue-400 opacity-10 rounded-full"></div>
        <div className="absolute bottom-20 left-32 w-12 h-12 bg-green-400 opacity-10 rounded-full"></div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Клубын статистик</h2>
            <p className="text-xl text-gray-600">Манай клубын үйл ажиллагааны тоо баримт</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                <ShoppingBag className="text-blue-600" size={24} />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.products}</div>
              <div className="text-sm text-gray-600">Бүтээгдэхүүн</div>
            </div>

            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
                <Newspaper className="text-green-600" size={24} />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.news}</div>
              <div className="text-sm text-gray-600">Мэдээ</div>
            </div>

            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
                <BookOpen className="text-purple-600" size={24} />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.lessons}</div>
              <div className="text-sm text-gray-600">Хичээл</div>
            </div>

            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-4">
                <Trophy className="text-orange-600" size={24} />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.competitions}</div>
              <div className="text-sm text-gray-600">Тэмцээн</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Modules Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Үндсэн модулиуд</h2>
            <p className="text-xl text-gray-600">Клубын үйл ажиллагааны бүх хэсэгтэй танилцаарай</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {modules.map((module) => {
              const IconComponent = module.icon;
              return (
                <Link key={module.title} href={module.href} className="group block">
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                    <div className={`${module.color} p-8 text-white relative overflow-hidden`}>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <IconComponent size={48} className={module.iconColor} />
                          <div className="text-right">
                            <div className="text-2xl font-bold">{module.count}</div>
                            <div className="text-sm opacity-80">Нийт</div>
                          </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-2">{module.title}</h3>
                        <p className="text-lg opacity-90">{module.description}</p>
                      </div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full transform translate-x-8 -translate-y-8"></div>
                    </div>

                    <div className="p-6">
                      <ul className="space-y-2 mb-6">
                        {module.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-gray-600">
                            <Star size={16} className="text-yellow-500 fill-current" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Дэлгэрэнгүй үзэх</span>
                        <ArrowRight
                          size={20}
                          className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Яагаад биднийг сонгох вэ?</h2>
            <p className="text-xl text-gray-600">Манай клубын давуу талууд</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                <Users className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Найрсаг хамт олон</h3>
              <p className="text-gray-600">
                Ижил сонирхолтой найз нөхөдтэй танилцаж, хамтдаа дээшлэх боломж
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                <Target className="text-green-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Цогц сургалт</h3>
              <p className="text-gray-600">
                Анхан шатнаас дээд түвшин хүртэл системтэй хичээл, алгоритм сургалт
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-6">
                <Award className="text-yellow-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Тэмцээний боломж</h3>
              <p className="text-gray-600">
                Дотоод болон олон улсын тэмцээнд оролцох, шагнал хүртэх боломж
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
