import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Login centralizado no portal. Quem chega sem sessão é mandado pro
// crm-operacional.com.br, que valida e roteia de volta via passe SSO.
const PORTAL = process.env.NEXT_PUBLIC_DASHBOARD_URL || "https://crm-operacional.com.br";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Rotas que precisam responder sem sessão (SSO cria a sessão; NextAuth/session)
  if (pathname.startsWith("/api/auth") || pathname === "/api/sso/enter") {
    return NextResponse.next();
  }

  // Sem sessão → portal central (login único)
  if (!token) {
    return NextResponse.redirect(new URL("/login", PORTAL));
  }

  // Já logado abrindo a tela de login local → vai pro app
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/retencao", req.url));
  }

  // se tentar acessar /admin sem ser ADMIN, redireciona pra /retencao
  if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = "/retencao";
    url.searchParams.set("forbidden", "1");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};