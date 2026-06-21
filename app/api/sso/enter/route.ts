import { NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { validarPasse } from "@/lib/sso";

// Consome um passe vindo de outro app Fênix e cria a sessão local (sem senha).
// Só entra quem existe como ADMIN ativo aqui.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const payload = validarPasse(searchParams.get("passe"));
  if (!payload) {
    return NextResponse.redirect(new URL("/login?sso=invalido", req.url));
  }

  // Qualquer usuário ativo deste CRM pode entrar via passe (vindo do portal de
  // login central ou da navegação da gerência). O passe é assinado (SSO_SECRET)
  // e o usuário precisa existir/estar ativo aqui — duplo controle de acesso.
  const user = await prisma.user.findUnique({ where: { email: payload.email } });
  if (!user || !user.isActive) {
    return NextResponse.redirect(new URL("/login?sso=negado", req.url));
  }

  const maxAge = 30 * 24 * 60 * 60;
  const sessionToken = await encode({
    token: { id: user.id, role: user.role, name: user.name, email: user.email, sub: user.id },
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
