import { NextResponse } from "next/server";

export default function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const pathname = request.nextUrl.pathname;

  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/coach/dashboard", request.url));
  }
  if (pathname === "/client/login" && token) {
    return NextResponse.redirect(new URL("/client/app/dashboard", request.url));
  }

  if (pathname.startsWith("/coach") && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname.startsWith("/client/app") && !token) {
    return NextResponse.redirect(new URL("/client/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/coach/:path*", "/login", "/client/:path*"],
};
