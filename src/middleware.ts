import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths and auth API
  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get("n8n-snipper-session")?.value;
  const secret = process.env.AUTH_SECRET;

  if (!session || !secret || session !== secret) {
    // API routes return 401; pages redirect to login
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
