"use client";

import { useEffect, useState } from "react";
import { Maximize2, Minimize2, X } from "lucide-react";
import { apiService, FacebookLiveStatus } from "@/services/apiService";

// Хуудас ачаалагдах бүрд шалгаад, дараа нь тогтмол давтамжтайгаар
// (60 секунд тутам) Facebook хуудас яг одоо live эфир хийж байгаа эсэхийг
// шалгана. Live биш үед юу ч харуулахгүй (null buцаана).
const POLL_INTERVAL_MS = 60_000;

export function FacebookLiveBanner() {
  const [status, setStatus] = useState<FacebookLiveStatus | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  // Хэрэглэгч хаасан тохиолдолд яг тухайн эфирийг л дахин үзүүлэхгүй өнгөрөөнэ —
  // харин дараагийн шинэ эфир эхэлбэл (permalink солигдвол) дахин харуулна.
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkLive = async () => {
      try {
        const result = await apiService.getFacebookLiveStatus();
        if (!cancelled) setStatus(result);
      } catch {
        // Сүлжээний асуудал зэрэг үед зүгээр л live биш гэж тооцоод өнгөрнө
        if (!cancelled) setStatus({ isLive: false, permalinkUrl: null, embedHtml: null, title: null });
      }
    };

    void checkLive();
    const interval = setInterval(checkLive, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!status?.isLive || !status.permalinkUrl) return null;
  if (dismissedFor === status.permalinkUrl) return null;

  const embedSrc = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
    status.permalinkUrl
  )}&show_text=false&autoplay=true&mute=true`;

  return (
    <div
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 rounded-xl overflow-hidden shadow-2xl border border-black/20 bg-black transition-[width] duration-300 ease-in-out ${
        isExpanded ? "w-[320px] sm:w-[440px]" : "w-[190px] sm:w-64"
      }`}
    >
      {/* Толгой хэсэг */}
      <div className="flex items-center justify-between gap-1.5 pl-2.5 pr-1.5 py-1.5 bg-red-950">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest flex-shrink-0">
            Live
          </span>
          {status.title && isExpanded && (
            <span className="text-white/60 text-[10px] sm:text-xs truncate">
              — {status.title}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsExpanded(prev => !prev)}
            className="p-1 rounded text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={isExpanded ? "Жижигрүүлэх" : "Томруулах"}
            title={isExpanded ? "Жижигрүүлэх" : "Томруулах"}
          >
            {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          <button
            type="button"
            onClick={() => setDismissedFor(status.permalinkUrl)}
            className="p-1 rounded text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Хаах"
            title="Хаах"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Видео */}
      <div className="relative w-full aspect-video bg-black">
        <iframe
          src={embedSrc}
          className="absolute inset-0 w-full h-full"
          style={{ border: "none", overflow: "hidden" }}
          allow="autoplay; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          title="Facebook Live"
        />
      </div>

      <a
        href={status.permalinkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center bg-red-950 text-white/60 hover:text-white text-[10px] py-1 transition-colors"
      >
        Facebook дээр нээж үзэх
      </a>
    </div>
  );
}
