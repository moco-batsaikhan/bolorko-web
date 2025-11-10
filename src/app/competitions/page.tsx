"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { apiService, Competition } from "@/services/apiService";
import { API_BASE_URL } from "@/constants/constants";
import Link from "next/link";
import { Trophy, Calendar, MapPin, ExternalLink, Search } from "lucide-react";

export default function CompetitionsPage() {
  const [loading, setLoading] = useState(true);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [filteredCompetitions, setFilteredCompetitions] = useState<Competition[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const loadCompetitions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getCompetitions({ page: 1, limit: 100 });
      setCompetitions(response.data);
      setFilteredCompetitions(response.data);
    } catch (error) {
      console.error("Failed to load competitions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompetitions();
  }, [loadCompetitions]);

  useEffect(() => {
    let filtered = competitions;

    // Filter by status
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((competition) => competition.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (competition) =>
          competition.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          competition.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          competition.address.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredCompetitions(filtered);
  }, [competitions, statusFilter, searchTerm]);

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

  const getStatusBadge = (status: string) => {
    const statusMap = {
      UPCOMING: { label: "Удахгүй", color: "bg-blue-100 text-blue-800" },
      ONGOING: { label: "Явагдаж буй", color: "bg-green-100 text-green-800" },
      COMPLETED: { label: "Дууссан", color: "bg-gray-100 text-gray-800" },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.UPCOMING;
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  const getStatusCounts = () => {
    return {
      all: competitions.length,
      upcoming: competitions.filter((c) => c.status === "UPCOMING").length,
      ongoing: competitions.filter((c) => c.status === "ONGOING").length,
      completed: competitions.filter((c) => c.status === "COMPLETED").length,
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Тэмцээн Уралдаанууд</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              MEGA клубын зохион байгуулж буй тэмцээн уралдаануудад оролцож, өөрийн ур чадварыг
              шалгаарай!
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Тэмцээн хайх..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="md:w-64">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">Бүх төлөв ({statusCounts.all})</option>
                <option value="UPCOMING">Удахгүй ({statusCounts.upcoming})</option>
                <option value="ONGOING">Явагдаж буй ({statusCounts.ongoing})</option>
                <option value="COMPLETED">Дууссан ({statusCounts.completed})</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-6">
              <p className="text-gray-600">
                {filteredCompetitions.length} тэмцээн олдлоо
                {searchTerm && ` "${searchTerm}" хайлтын дагуу`}
              </p>
            </div>

            {/* Competitions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompetitions.map((competition) => (
                <div
                  key={competition.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Image */}
                  <div className="aspect-video relative">
                    {competition.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
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
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                        <Trophy size={48} className="text-blue-400" />
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      {getStatusBadge(competition.status)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {competition.title}
                    </h3>

                    <p className="text-gray-600 mb-4 line-clamp-2">{competition.description}</p>

                    {/* Date and Location */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar size={16} className="mr-2" />
                        {formatDate(competition.startDate)} - {formatDate(competition.endDate)}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin size={16} className="mr-2" />
                        {competition.address}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        href={`/competitions/${competition.id}`}
                        className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Дэлгэрэнгүй
                      </Link>
                      <a
                        href={competition.registerLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                        title="Бүртгүүлэх"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredCompetitions.length === 0 && !loading && (
              <div className="text-center py-12">
                <Trophy className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm ? "Хайлтын үр дүн олдсонгүй" : "Тэмцээн байхгүй"}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {searchTerm
                    ? `"${searchTerm}" хайлтаар илэрц олдсонгүй. Өөр түлхүүр үг ашиглана уу.`
                    : "Одоогоор зохион байгуулагдаж буй тэмцээн байхгүй байна."}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
