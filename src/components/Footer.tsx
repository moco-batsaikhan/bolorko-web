import Link from "next/link";
import { MapPin, Phone, Mail, Facebook } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-100 text-black py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200 ">
                <img src="/imgs/mega-logo.png" alt="MEGA Logo" className="w-8 h-8 " />
              </div>
              <span className="text-xl font-bold">MEGA</span>
            </div>
            <p className="text-gray-600 mb-4">ME to WE</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Холбоос</h3>
            <ul className="space-y-2 text-gray-700">
              <li>
                <Link href="/lessons" className="hover:text-mega-600 transition-colors">
                  Хичээл
                </Link>
              </li>
              <li>
                <Link href="/competitions" className="hover:text-mega-600 transition-colors">
                  Тэмцээн уралдаан
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-mega-600 transition-colors">
                  Дэлгүүр
                </Link>
              </li>
              <li>
                <Link href="/news" className="hover:text-mega-600 transition-colors">
                  Мэдээ мэдээлэл
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Холбоо барих</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <MapPin className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
                Хаяг: Багшийн дээдийн замын урд талд, UBH Center, 9-р давхар, 907 тоот
              </li>
              <li className="flex items-start">
                <Phone className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
                Утас: 89199853
              </li>
              <li className="flex items-start">
                <Mail className="w-4 h-4 mr-2  mt-1 flex-shrink-0" />
                И-мэйл хаяг: megaspeedcubestore@gmail.com
              </li>
              <li className="flex items-start">
                <Facebook className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
                Facebook хаяг:
                <Link
                  href="https://www.facebook.com/rubikshooniidelguur"
                  className="hover:text-mega-600 transition-colors"
                >
                  MEGA Рубик Шооны Дэлгүүр
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
