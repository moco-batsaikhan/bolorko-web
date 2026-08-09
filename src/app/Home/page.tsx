"use client";

import { useState, useEffect, useRef } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { apiService, Product, ProductCategory, Banner } from "@/services/apiService";
import { API_BASE_URL } from "@/constants/constants";
import Loading from "@/components/Loading";
import Link from "next/link";
import { ShoppingBag, ShoppingCart, Star, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { LoginModal } from "@/components/LoginModal";
import { CART_ENABLED, STOCK_CHECK_ENABLED } from "@/config/featureFlags";

const FACEBOOK_URL = "https://www.facebook.com/momsoonshop";

function getBannerImageUrl(banner: Banner): string | null {
  if (!banner.image) return null;
  return banner.image.startsWith("http") ? banner.image : `${API_BASE_URL}${banner.image}`;
}

function getProductImageUrl(images: string[] | string | null): string | null {
  if (!images) return null;

  if (typeof images === "string") {
    if (images === "string") return null;
    return images.startsWith("http") ? images : `${API_BASE_URL}${images}`;
  }

  if (Array.isArray(images) && images.length > 0) {
    const firstImage = images[0];
    return firstImage.startsWith("http") ? firstImage : `${API_BASE_URL}${firstImage}`;
  }

  return null;
}

function formatPrice(price: string | number) {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  if (!numPrice) return "Үнэ асууна уу";
  return new Intl.NumberFormat("mn-MN").format(numPrice) + "₮";
}

interface CategoryCard {
  category: ProductCategory;
  image: string | null;
}

interface CategorySection {
  category: ProductCategory;
  products: Product[];
}

function ProductCard({
  product,
  addingProductId,
  onQuickAdd,
}: {
  product: Product;
  addingProductId: number | null;
  onQuickAdd: (e: React.MouseEvent, productId: number) => void;
}) {
  const imageUrl = getProductImageUrl(product.images);
  // Нөөцийн хяналт түр хаагдсан тул stock-оос үл хамааран захиалах боломжтой
  const outOfStock = STOCK_CHECK_ENABLED && product.stock <= 0;

  return (
    <Link href={`/shop/${product.id}`} className="group block h-full">
      <div className="card-3d bg-white h-full flex flex-col">
        <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package size={48} className="text-gray-300" />
            </div>
          )}

          {product.discountPercentage && (
            <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1">
              -{product.discountPercentage}%
            </span>
          )}
          {outOfStock && (
            <span className="absolute top-3 right-3 bg-gray-800 text-white text-xs font-medium px-2 py-1 uppercase tracking-wider">
              Дууссан
            </span>
          )}
        </div>

        <div className="pt-4 pb-5 px-3 flex flex-col items-center text-center flex-1">
          <h3 className="text-xs md:text-sm font-medium uppercase tracking-wider text-gray-900 line-clamp-2 mb-2 group-hover:text-red-600 transition-colors">
            {product.name}
          </h3>

          {product.ratingCount > 0 && (
            <div className="flex items-center gap-1 mb-1.5">
              <Star size={12} className="text-yellow-400 fill-current" />
              <span className="text-xs text-gray-400">
                {parseFloat(product.averageRating).toFixed(1)} ({product.ratingCount})
              </span>
            </div>
          )}

          <div className="flex items-baseline justify-center gap-2 mb-3">
            <span
              className={`text-sm md:text-base font-semibold ${
                product.discountPercentage ? "text-red-600" : "text-gray-900"
              }`}
            >
              {formatPrice(product.salePrice ?? product.price)}
            </span>
            {product.discountPercentage && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* CART_ENABLED=false үед энэ товч нуугдана — барааны карт дээр
              дарахад шууд бүтээгдэхүүний дэлгэц рүү орж, тэндээс захиална */}
          {CART_ENABLED && (
            <button
              onClick={e => onQuickAdd(e, product.id)}
              disabled={outOfStock || addingProductId === product.id}
              className="mt-auto w-full max-w-[180px] flex items-center justify-center gap-2 px-4 py-2 border border-red-600 text-red-600 text-xs font-medium uppercase tracking-widest hover:bg-red-600 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-red-600"
            >
              {addingProductId === product.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <>
                  <ShoppingCart size={14} />
                  {outOfStock ? "Дууссан" : "Сагслах"}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

function ProductSlider({
  products,
  addingProductId,
  onQuickAdd,
}: {
  products: Product[];
  addingProductId: number | null;
  onQuickAdd: (e: React.MouseEvent, productId: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;
    const amount = container.clientWidth * 0.85;
    container.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className="relative group/slider">
      <div
        ref={scrollRef}
        className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 no-scrollbar"
      >
        {products.map(product => (
          <div key={product.id} className="snap-start shrink-0 w-[46%] sm:w-[32%] lg:w-[23%]">
            <ProductCard
              product={product}
              addingProductId={addingProductId}
              onQuickAdd={onQuickAdd}
            />
          </div>
        ))}
      </div>

      {products.length > 2 && (
        <>
          <button
            type="button"
            onClick={() => scroll("left")}
            className="hidden md:flex absolute left-0 top-[38%] -translate-y-1/2 -translate-x-4 items-center justify-center w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 text-gray-700 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors opacity-0 group-hover/slider:opacity-100"
            aria-label="Өмнөх бараа"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="hidden md:flex absolute right-0 top-[38%] -translate-y-1/2 translate-x-4 items-center justify-center w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 text-gray-700 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors opacity-0 group-hover/slider:opacity-100"
            aria-label="Дараагийн бараа"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}
    </div>
  );
}

export default function HomePage() {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [infoPosts, setInfoPosts] = useState<Product[]>([]);
  const [categoryCards, setCategoryCards] = useState<CategoryCard[]>([]);
  const [categorySections, setCategorySections] = useState<CategorySection[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addingProductId, setAddingProductId] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [infoData, featuredCategories, bannersData, allProducts] = await Promise.all([
          apiService.getProducts({ type: "INFO" }).catch(() => [] as Product[]),
          apiService.getFeaturedCategories().catch(() => [] as ProductCategory[]),
          apiService.getActiveBanners().catch(() => [] as Banner[]),
          apiService.getProducts({ type: "PRODUCT" }).catch(() => [] as Product[]),
        ]);

        // Онцолсон категори байхгүй бол бүх үндсэн категориор fallback хийнэ
        const mainCategories =
          featuredCategories.length > 0
            ? featuredCategories
            : await apiService.getMainCategories().catch(() => [] as ProductCategory[]);

        // INFO постуудыг шинээс хуучин руу эрэмбэлнэ
        infoData.sort((a, b) => {
          const dateA = new Date(a.postedAt || a.createdAt).getTime();
          const dateB = new Date(b.postedAt || b.createdAt).getTime();
          return dateB - dateA;
        });
        setInfoPosts(infoData);
        setBanners(bannersData.filter(b => getBannerImageUrl(b)));

        // Шинэ бараа: идэвхтэйг шинээс хуучин руу
        const activeProducts = allProducts.filter(p => p.status === "ACTIVE");
        const arrivals = [...activeProducts].sort(
          (a, b) =>
            new Date(b.postedAt || b.createdAt).getTime() -
            new Date(a.postedAt || a.createdAt).getTime(),
        );
        setNewArrivals(arrivals.slice(0, 10));

        // Ангилал бүрийн бараануудыг татна: дугуй картын зураг болон
        // ангиллын барааны хэсгүүдэд хоёуланд нь ашиглагдана
        const sectionResults = await Promise.all(
          mainCategories.map(async category => {
            const products = await apiService
              .getProducts({ type: "PRODUCT", categoryId: category.id })
              .catch(() => [] as Product[]);
            const active = products.filter(p => p.status === "ACTIVE");

            // Картын зураг: категорийн өөрийн зураг, байхгүй бол эхний барааных
            let image: string | null = null;
            if (category.image) {
              image = category.image.startsWith("http")
                ? category.image
                : `${API_BASE_URL}${category.image}`;
            } else {
              const withImage = active.find(p => getProductImageUrl(p.images));
              image = withImage ? getProductImageUrl(withImage.images) : null;
            }

            return { category, image, products: active.slice(0, 10) };
          }),
        );
        setCategoryCards(sectionResults.map(({ category, image }) => ({ category, image })));
        setCategorySections(
          sectionResults
            .filter(s => s.products.length > 0)
            .map(({ category, products }) => ({ category, products })),
        );
      } catch (error) {
        console.error("Failed to load home data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Banner auto-rotate every 5 seconds
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const handleQuickAdd = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    setAddingProductId(productId);
    try {
      await addToCart(productId, 1);
    } finally {
      setAddingProductId(null);
    }
  };

  // Follow grid: бараа болон мэдээллийн зургуудаас 6-г цуглуулна
  const followImages = [...newArrivals, ...infoPosts]
    .map(p => getProductImageUrl(p.images))
    .filter((url): url is string => !!url)
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero — Banner Carousel */}
      {banners.length > 0 ? (
        <section className="relative bg-red-950 overflow-hidden">
          <div className="relative aspect-[16/10] sm:aspect-[21/9] lg:aspect-[3/1] max-h-[560px] w-full">
            {banners.map((banner, index) => {
              const slideInner = (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getBannerImageUrl(banner)!}
                    alt={banner.title || `Banner ${index + 1}`}
                    className="relative w-full h-full object-cover"
                  />

                  {/* Overlay text */}
                  {/* {banner.title && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end justify-center pb-10 md:pb-14">
                      <div className="text-center text-white px-4">
                        {banner.description && (
                          <p className="text-xs md:text-sm uppercase tracking-[0.25em] mb-2 opacity-90">
                            {banner.description}
                          </p>
                        )}
                        <h2 className="font-display text-2xl md:text-4xl lg:text-5xl font-bold uppercase mb-4">
                          {banner.title}
                        </h2>
                        <span className="inline-block bg-red-600 text-white text-xs uppercase tracking-widest px-6 py-3 hover:bg-red-700 transition-colors">
                          Дэлгүүр үзэх
                        </span>
                      </div>
                    </div>
                  )} */}
                </>
              );

              const slideClass = `absolute inset-0 transition-opacity duration-700 ${
                index === currentBanner ? "opacity-100" : "opacity-0 pointer-events-none"
              }`;

              const href = banner.link || "/shop";
              return href.startsWith("/") ? (
                <Link key={banner.id} href={href} className={`${slideClass} block`}>
                  {slideInner}
                </Link>
              ) : (
                <a
                  key={banner.id}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className={`${slideClass} block`}
                >
                  {slideInner}
                </a>
              );
            })}

            {banners.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentBanner(prev => (prev - 1 + banners.length) % banners.length)
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/70 hover:bg-white text-gray-900 transition-colors"
                  aria-label="Өмнөх баннер"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setCurrentBanner(prev => (prev + 1) % banners.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/70 hover:bg-white text-gray-900 transition-colors"
                  aria-label="Дараагийн баннер"
                >
                  <ChevronRight size={20} />
                </button>

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentBanner(index)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        index === currentBanner ? "w-6 bg-white" : "w-1.5 bg-white/50"
                      }`}
                      aria-label={`Баннер ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      ) : (
        /* Hero fallback — banner байхгүй үед */
        <section className="relative bg-gradient-to-br from-red-800 via-red-700 to-red-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center">
            <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-red-200 mb-4">
              Bolorko Collection
            </p>
            <h1 className="font-display text-4xl md:text-6xl font-bold uppercase mb-6">
              Хувцас, аяллын
              <br />
              хэрэгсэл
            </h1>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-white text-red-600 text-xs font-medium uppercase tracking-widest px-8 py-4 hover:bg-red-100 transition-colors"
            >
              <ShoppingBag size={16} />
              Дэлгүүр үзэх
            </Link>
          </div>
        </section>
      )}

      {loading ? (
        <div className="py-20">
          <Loading />
        </div>
      ) : (
        <>
          {/* Ангиллын зурагт картууд */}
          {categoryCards.length > 0 && (
            <section className="py-10 md:py-14 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="font-display text-2xl md:text-4xl font-bold uppercase text-center text-gray-900 mb-8 md:mb-10">
                  Ангилал
                </h2>

                <div className="flex flex-wrap justify-center gap-x-6 gap-y-8 md:gap-x-10">
                  {categoryCards.map(card => (
                    <div key={card.category.id} className="flex flex-col items-center w-32 md:w-40">
                      {/* Дугуй зураг */}
                      <Link href={`/shop?category=${card.category.id}`} className="group block">
                        <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden bg-gray-100 ring-2 ring-gray-200 ring-offset-4 group-hover:ring-red-600 transition-all duration-300 shadow-md group-hover:shadow-xl">
                          {card.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={card.image}
                              alt={card.category.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                              <Package size={32} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <h3 className="mt-3 text-sm md:text-base font-semibold text-center text-gray-900 group-hover:text-red-600 transition-colors">
                          {card.category.name}
                        </h3>
                      </Link>

                      {/* Дэд ангиллын задаргаа */}
                      {/* {card.category.children && card.category.children.length > 0 && (
                        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                          {card.category.children.map(sub => (
                            <Link
                              key={sub.id}
                              href={`/shop?category=${sub.id}`}
                              className="px-2.5 py-1 text-[11px] text-gray-500 bg-gray-50 border border-gray-200 rounded-full hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )} */}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Шинэ бараа */}
          {newArrivals.length > 0 && (
            <section className="py-10 md:py-14 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="font-display text-2xl md:text-4xl font-bold uppercase text-center text-gray-900 mb-8 md:mb-10">
                  Шинэ бараа
                </h2>

                <ProductSlider
                  products={newArrivals}
                  addingProductId={addingProductId}
                  onQuickAdd={handleQuickAdd}
                />

                <div className="text-center mt-10">
                  <Link
                    href="/shop"
                    className="inline-block border border-red-600 text-red-600 text-xs font-medium uppercase tracking-widest px-10 py-3.5 hover:bg-red-600 hover:text-white transition-colors"
                  >
                    Бүх барааг үзэх
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* Ангилал бүрийн бараанууд */}
          {categorySections.map((section, index) => (
            <section
              key={section.category.id}
              className={`py-10 md:py-14 ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Хоёр талдаа нарийн зураастай elegant гарчиг */}
                <div className="flex items-center gap-4 md:gap-8 mb-8 md:mb-10">
                  <span className="flex-1 h-px bg-gray-300"></span>
                  <h2 className="font-display text-xl md:text-3xl font-bold uppercase text-gray-900 text-center">
                    {section.category.name}
                  </h2>
                  <span className="flex-1 h-px bg-gray-300"></span>
                </div>

                <ProductSlider
                  products={section.products}
                  addingProductId={addingProductId}
                  onQuickAdd={handleQuickAdd}
                />

                <div className="text-center mt-8">
                  <Link
                    href={`/shop?category=${section.category.id}`}
                    className="inline-block text-xs font-medium uppercase tracking-widest text-red-600 border-b border-red-600 pb-0.5 hover:text-red-800 hover:border-red-800 transition-colors"
                  >
                    {section.category.name} — бүгдийг үзэх
                  </Link>
                </div>
              </div>
            </section>
          ))}

          {/* Мэдээлэл — сэтгүүлийн (editorial) загвар */}
          {infoPosts.length > 0 && (
            <section className="py-12 md:py-16 bg-white border-t border-gray-100">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <p className="text-center text-xs uppercase tracking-[0.3em] text-gray-400 mb-2">
                  Bolorko
                </p>
                <h2 className="font-display text-2xl md:text-4xl font-bold uppercase text-center text-gray-900 mb-8 md:mb-12">
                  Мэдээлэл
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
                  {infoPosts.slice(0, 3).map(post => {
                    const imageUrl = getProductImageUrl(post.images);
                    return (
                      <Link key={post.id} href="/info" className="group block">
                        {imageUrl && (
                          <div className="aspect-[4/3] bg-gray-100 overflow-hidden mb-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imageUrl}
                              alt={post.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                              loading="lazy"
                            />
                          </div>
                        )}
                        {post.postedAt && (
                          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400 mb-2">
                            {new Date(post.postedAt).toLocaleDateString("mn-MN")}
                          </p>
                        )}
                        <h3 className="font-display text-lg md:text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">
                          {post.name}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-3 mt-2 leading-relaxed">
                          {post.description}
                        </p>
                        <span className="inline-block mt-3 text-xs font-medium uppercase tracking-widest text-red-600 border-b border-red-600 pb-0.5 group-hover:text-red-800 group-hover:border-red-800 transition-colors">
                          Цааш унших
                        </span>
                      </Link>
                    );
                  })}
                </div>

                <div className="text-center mt-10">
                  <Link
                    href="/info"
                    className="inline-block border border-gray-300 text-gray-700 text-xs font-medium uppercase tracking-widest px-10 py-3.5 hover:border-red-600 hover:text-red-600 transition-colors"
                  >
                    Бүх мэдээллийг үзэх
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* Биднийг дагаарай */}
          {followImages.length > 0 && (
            <section className="py-10 md:py-12 bg-gray-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h3 className="font-display text-lg md:text-2xl font-bold uppercase text-center text-gray-900 mb-2">
                  Биднийг дагаарай
                </h3>
                <p className="text-center mb-6">
                  <a
                    href={FACEBOOK_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs uppercase tracking-widest text-gray-500 hover:text-red-600 transition-colors"
                  >
                    Facebook хуудас руу очих →
                  </a>
                </p>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {followImages.map((url, i) => (
                    <a
                      key={i}
                      href={FACEBOOK_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="block aspect-square bg-gray-200 overflow-hidden group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Bolorko ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 group-hover:opacity-80 transition-all duration-500"
                        loading="lazy"
                      />
                    </a>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      <Footer />
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}
