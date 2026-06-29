import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { gerarPasse, appUrl, type AppName } from "@/lib/sso";

// Gera um passe da sessão atual e redireciona pro app de destino DENTRO do mesmo
// tenant. O destino é construído a partir do tenantSlug da sessão (servidor).
const APPS_VALIDOS: AppName[] = ["comercial", "retencao", "dashboard"];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const app = searchParams.get("app") as AppName | null;

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/retencao?sso=forbidden", req.url));
  }
  if (!app || !APPS_VALIDOS.includes(app)) {
    return NextResponse.redirect(new URL("/retencao", req.url));
  }

  const passe = gerarPasse(
    session.user.email,
    session.user.name ?? "",
    session.user.tenantId,
    session.user.tenantSlug,
  );
  const destino = new URL("/api/sso/enter", appUrl(app, session.user.tenantSlug));
  destino.searchParams.set("passe", passe);
  return NextResponse.redirect(destino.toString());
}
