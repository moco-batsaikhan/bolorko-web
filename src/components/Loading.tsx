// app/loading.tsx  (эсвэл app/таны-зам/loading.tsx)
import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex items-center gap-3 justify-center">
      <Image
        src="/mega-logo.png"
        alt="Лого"
        width={50}
        height={50}
        className="animate-spin motion-reduce:animate-none"
        priority
      />
      <span className="text-lg text-gray-600 dark:text-gray-600">Уншиж байна…</span>
    </div>
  );
}
