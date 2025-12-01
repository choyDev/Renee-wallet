import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC = new Set<string>(["/", "/signin", "/signup"]);

const secretUser = new TextEncoder().encode(process.env.JWT_SECRET || "supersecretkey");

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static & next internals
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|map|txt)$/)
  ) {
    return NextResponse.next();
  }

  // --- Read token from cookie ---
  const token = req.cookies.get("token")?.value;
  let session: any = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, secretUser);
      session = payload; // { id, email, role }
    } catch (e) {
      session = null;
    }
  }

  // -------------------------------
  // PUBLIC pages (no auth needed)
  // -------------------------------
  if (PUBLIC.has(pathname)) {
    return NextResponse.next();
  }

  // -------------------------------
  // ADMIN PROTECTION
  // -------------------------------
  if (pathname.startsWith("/admin")) {
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/signin";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    if (session.role !== "admin") {
      // user trying to access admin → redirect to user dashboard
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    return NextResponse.next(); // admin allowed
  }

  // -------------------------------
  // USER ROUTES
  // -------------------------------
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/signin";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    // If admin tries to access user dashboard → redirect to admin area
    if (session.role === "admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }

    return NextResponse.next(); // user allowed
  }

  // For all other pages → require login
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)"],
};
