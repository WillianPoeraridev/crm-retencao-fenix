import { NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { validarPasse } from "@/lib/sso";
import { tenantSlugFromHost, resolveTenantBySlug } from "@/lib/tenant";

// Consome um passe vindo de outro app da plataforma e cria a sessão local (sem senha).
// Multi-tenant: o passe carrega tenant; conferimos que o slug bate com o
// subdomínio e buscamos o user ESCOPADO ao tenant.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const payload = validarPasse(searchParams.get("passe"));
  if (!payload) {
    return NextResponse.redirect(new URL("/login?sso=invalido", req.url));
  }

  const hostSlug = tenantSlugFromHost(req.headers.get("host"));
  if (payload.tenantSlug !== hostSlug) {
    return NextResponse.redirect(new URL("/login?sso=tenant", req.url));
  }
  const tenant = await resolveTenantBySlug(hostSlug);
  if (!tenant || tenant.id !== payload.tenantId) {
    return NextResponse.redirect(new URL("/login?sso=tenant", req.url));
  }

  const user = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email: payload.email } },
  });
  if (!user || !user.isActive) {
    return NextResponse.redirect(new URL("/login?sso=negado", req.url));
  }

  const maxAge = 30 * 24 * 60 * 60;
  const sessionToken = await encode({
    token: {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantNome: tenant.nome,
      sub: user.id,
    },
    secret: process.env.NEXTAUTH_SECRET!,
    maxAge,
  });

  const isProd = process.env.NODE_ENV === "production";
  const cookieName = isProd ? "__Secure-next-auth.session-token" : "next-auth.session-token";

  const res = NextResponse.redirect(new URL("/retencao", req.url));
  res.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  return res;
}
