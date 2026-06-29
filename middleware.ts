import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { tenantSlugFromHost, portalLoginUrl } from "./lib/tenant-host";

// Login centralizado no portal do tenant ({slug}.crm-operacional.com.br).
// Multi-tenant: a sessão só vale no subdomínio do próprio tenant.
export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host");

  // Rotas que precisam responder sem sessão (SSO cria a sessão; NextAuth/session)
  if (pathname.startsWith("/api/auth") || pathname === "/api/sso/enter") {
    return NextResponse.next();
  }

  // Sem sessão → portal do tenant atual (login único)
  if (!token) {
    return NextResponse.redirect(portalLoginUrl(host));
  }

  // Sessão de tenant diferente do subdomínio → trata como não autenticado.
  const hostSlug = tenantSlugFromHost(host);
  if (token.tenantSlug !== hostSlug && !pathname.startsWith("/api/sso")) {
    return NextResponse.redirect(portalLoginUrl(host));
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
