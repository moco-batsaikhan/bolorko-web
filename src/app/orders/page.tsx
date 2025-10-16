export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Гүйлгээний түүх</h1>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900"># 001</h3>
                  <p className="text-sm text-gray-600">2024-01-15</p>
                </div>
                <span className="text-sm font-medium text-green-600">Амжилттай</span>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-900">Rubik's Cube 3x3</p>
                <p className="text-sm font-medium text-gray-900">25,000₮</p>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900"># 002</h3>
                  <p className="text-sm text-gray-600">2024-01-10</p>
                </div>
                <span className="text-sm font-medium text-green-600">Амжилттай</span>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-900">Speed Cube Lube</p>
                <p className="text-sm font-medium text-gray-900">5,000₮</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
