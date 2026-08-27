import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isPrivatePath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname.startsWith("/my-bookings") ||
    pathname.startsWith("/master-booking") ||
    pathname.startsWith("/book/link") ||
    pathname.startsWith("/b/") ||
    pathname.startsWith("/preview")
  );
}

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  if (isPrivatePath(request.nextUrl.pathname)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
