import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";
import { CART_ENABLED } from "@/config/featureFlags";

function FacebookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.47H15.2c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-red-950 text-red-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/imgs/icon.png" alt="Bolorko Logo" className="w-8 h-8 object-contain" />
              <span className="font-display text-xl font-bold tracking-wide text-white">
                BOLORKO
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Загварлаг хувцас, аяллын хэрэгслийн онлайн дэлгүүр
            </p>
            <a
              href="https://www.facebook.com/momsoonshop"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center w-9 h-9 mt-5 rounded-full bg-white/10 text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
              aria-label="Facebook хуудас"
            >
              <FacebookIcon size={16} />
            </a>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-[0.2em] mb-5">
              Холбоос
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/shop" className="text-gray-400 hover:text-white transition-colors">
                  Дэлгүүр
                </Link>
              </li>
              <li>
                <Link href="/info" className="text-gray-400 hover:text-white transition-colors">
                  Мэдээлэл
                </Link>
              </li>
              {CART_ENABLED && (
                <li>
                  <Link href="/cart" className="text-gray-400 hover:text-white transition-colors">
                    Сагс
                  </Link>
                </li>
              )}
              <li>
                <Link href="/orders" className="text-gray-400 hover:text-white transition-colors">
                  Захиалга
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-gray-400 hover:text-white transition-colors">
                  Хувийн мэдээлэл
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-[0.2em] mb-5">
              Холбоо барих
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <a
                  href="tel:88015662"
                  className="flex items-center gap-3 hover:text-white transition-colors"
                >
                  <Phone size={16} className="flex-shrink-0 text-gray-500" />
                  88015662
                </a>
              </li>
              <li>
                <a
                  href="mailto:batsaikhan0408@gmail.com"
                  className="flex items-center gap-3 hover:text-white transition-colors"
                >
                  <Mail size={16} className="flex-shrink-0 text-gray-500" />
                  batsaikhan0408@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <p className="text-xs text-gray-500 text-center uppercase tracking-widest">
            © {new Date().getFullYear()} Bolorko. Бүх эрх хуулиар хамгаалагдсан.
          </p>
        </div>
      </div>
    </footer>
  );
}
