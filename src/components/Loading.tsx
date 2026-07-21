import { ShoppingBag } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-red-100"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-600 animate-spin motion-reduce:animate-none"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <ShoppingBag className="w-6 h-6 text-red-600 animate-pulse motion-reduce:animate-none" />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-gray-600 font-medium">Уншиж байна</span>
        <span className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:0ms]"></span>
          <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:150ms]"></span>
          <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:300ms]"></span>
        </span>
      </div>
    </div>
  );
}
