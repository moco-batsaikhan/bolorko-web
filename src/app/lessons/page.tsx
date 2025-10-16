import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Link from "next/link";

export default function LessonsPage() {
  return (
    <div className="min-h-screen bg-white">
      {" "}
      <Header />
      <h1>Lessons page</h1>
      <Footer />
    </div>
  );
}
