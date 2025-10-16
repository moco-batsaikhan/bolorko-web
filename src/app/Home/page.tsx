"use client";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { apiService } from "@/services/apiService";
import { Link } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <h1>Home page</h1>
      <button
        onClick={() => {
          apiService.getCurrentUser().then((user) => {
            console.log("Current User:", user);
          });
        }}
      >
        gg
      </button>
      <Footer />
    </div>
  );
}
