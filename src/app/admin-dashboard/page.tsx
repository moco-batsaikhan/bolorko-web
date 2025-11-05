"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new admin dashboard structure
    router.push("/admin/users");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mega-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Админ панел руу шилжүүлж байна...</p>
      </div>
    </div>
  );
}
