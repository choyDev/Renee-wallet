import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Public pages users may visit while logged out
const PUBLIC = new Set<string>(["/", "/signin", "/signup"]);

// Reuse your server secret
const secret = new TextEncoder().encode(process.env.JWT_SECRET || "supersecretkey");

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow Next internals, assets, and your auth APIs
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|map|txt)$/)
  ) {
    return NextResponse.next();
  }

  // Allow public pages
  if (PUBLIC.has(pathname)) return NextResponse.next();

  // Check auth cookie
  const token = req.cookies.get("token")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // (Optional) Verify JWT signature/expiry
  try {
    await jwtVerify(token, secret); // HS256 by default (compatible with jsonwebtoken.sign)
    return NextResponse.next();
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  // run on all app routes except static assets
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)"],
};
