import { ProtectedRoute } from "../../components/ProtectedRoute";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Хувийн мэдээлэл</h1>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Нэр</label>
                <p className="mt-1 text-sm text-gray-900">Baganaa</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">И-мэйл</label>
                <p className="mt-1 text-sm text-gray-900">baganaa@example.com</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Утасны дугаар</label>
                <p className="mt-1 text-sm text-gray-900">+976 9999 9999</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </ProtectedRoute>
  );
}
