"use client";

export default function FloatingSocialBar({ settings }: { settings?: any }) {
  if (!settings?.floatingBar?.enabled) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-3">
      {settings.floatingBar.links?.map((link: any, i: number) => (
        <a
          key={i}
          href={link.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-full bg-primary-orange text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          aria-label={link.label || "Social link"}
        >
          {link.icon ? (
            <span className="text-lg">{link.icon}</span>
          ) : (
            <span className="text-sm font-bold">{link.label?.[0] || "S"}</span>
          )}
        </a>
      ))}
    </div>
  );
}
