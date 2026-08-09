"use client";

import { useEffect, useState } from "react";
import { apiService, FacebookLiveStatus } from "@/services/apiService";

// Хуудас ачаалагдах бүрд шалгаад, дараа нь тогтмол давтамжтайгаар
// (60 секунд тутам) Facebook хуудас яг одоо live эфир хийж байгаа эсэхийг
// шалгана. Live биш үед юу ч харуулахгүй (null buцаана).
const POLL_INTERVAL_MS = 60_000;

export function FacebookLiveBanner() {
  const [status, setStatus] = useState<FacebookLiveStatus | null>(null);

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

  const embedSrc = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
    status.permalinkUrl
  )}&show_text=false&autoplay=true&mute=true`;

  return (
    <section className="bg-red-950 py-4 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <span className="text-white text-xs font-bold uppercase tracking-widest">
            Шууд эфир
          </span>
          {status.title && (
            <span className="text-white/70 text-xs truncate">— {status.title}</span>
          )}
        </div>
        <div className="relative w-full aspect-video bg-black overflow-hidden rounded">
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
          className="block text-center text-white/70 hover:text-white text-xs mt-2 underline"
        >
          Facebook дээр нээж үзэх
        </a>
      </div>
    </section>
  );
}
