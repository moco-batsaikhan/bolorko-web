import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Link from "next/link";

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-white">
      {" "}
      <Header />
      <h1>News page</h1>
      <Footer />
    </div>
  );
}
