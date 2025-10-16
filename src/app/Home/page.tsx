import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Link } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <h1>Home page</h1>
      <Footer />
    </div>
  );
}
