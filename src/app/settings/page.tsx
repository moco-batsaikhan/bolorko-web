export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Захиалга</h1>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900"># 003</h3>
                  <p className="text-sm text-gray-600">2024-01-20</p>
                </div>
                <span className="text-sm font-medium text-yellow-600">Хүлээгдэж буй</span>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-900">Аяллын үүргэвч</p>
                <p className="text-sm font-medium text-gray-900">85,000₮</p>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900"># 004</h3>
                  <p className="text-sm text-gray-600">2024-01-18</p>
                </div>
                <span className="text-sm font-medium text-blue-600">Хүргэлтэнд</span>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-900">Подволк</p>
                <p className="text-sm font-medium text-gray-900">15,000₮</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
