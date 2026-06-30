import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withTenant } from "@/lib/prisma";

// PATCH — ativar/desativar cidade (ADMIN only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const db = withTenant(session.user.tenantId);
    const { id } = await params;
    const body = await req.json();
    const { isActive } = body;

    const existente = await db.cidade.findFirst({ where: { id } });
    if (!existente) {
      return NextResponse.json({ error: "Cidade não encontrada." }, { status: 404 });
    }

    const atualizada = await db.cidade.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json(atualizada);
  } catch (error) {
    console.error("[cidades/[id] PATCH]", error);
    return NextResponse.json({ error: "Erro interno. Tente novamente." }, { status: 500 });
  }
}
