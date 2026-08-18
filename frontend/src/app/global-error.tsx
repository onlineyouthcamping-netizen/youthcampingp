"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-800 p-6 text-center font-sans">
        <div className="max-w-md space-y-4 bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
          <h2 className="text-xl font-bold text-rose-600">Something went wrong!</h2>
          <p className="text-sm text-slate-500">
            {error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
