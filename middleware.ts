import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // se não estiver logado, manda pro login
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // se tentar acessar /admin sem ser ADMIN, redireciona pra /retencao
  if (req.nextUrl.pathname.startsWith("/admin") && token.role !== "ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = "/retencao";
    url.searchParams.set("forbidden", "1");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/retencao/:path*", "/admin/:path*"],
};