import { NextRequest, NextResponse } from "next/server";

// Content-Security-Policy — nonce-based (Next.js-ийн албан ёсны загвар:
// https://nextjs.org/docs/app/guides/content-security-policy).
//
// `script-src`-д зөвхөн 'self' болон энэ хүсэлт бүрд шинээр үүсгэсэн
// nonce-той script-ыг л зөвшөөрдөг тул хэн нэг HTML response-д
// (жишээ нь compromised CDN/proxy/inline injection-аар) шинэ <script>
// tag тарьсан ч nonce тохирохгүй тул browser өөрөө блоклоно — яг
// өмнө тохиолдсон EtherHiding/inline-eval төрлийн халдлагыг таслах
// зорилготой.
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://*.fbcdn.net https://*.cdninstagram.com https://bolorko-uploads.fra1.digitaloceanspaces.com https://*.digitaloceanspaces.com;
    font-src 'self' data:;
    connect-src 'self' https://*.ondigitalocean.app https://bolorko-backend-aaeg6.ondigitalocean.app;
    frame-src https://www.facebook.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'self';
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set("Content-Security-Policy", cspHeader);
  // Нэмэлт хамгаалалтын header-үүд
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    // Next.js-ийн статик файл/зурагны боловсруулалт болон favicon-оос бусад
    // бүх хуудсанд хамаарна
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
