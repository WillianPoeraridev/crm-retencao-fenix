import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH — ativar/desativar cidade (ADMIN only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { isActive } = body;

  const existente = await prisma.cidade.findUnique({ where: { id } });
  if (!existente) {
    return NextResponse.json({ error: "Cidade não encontrada." }, { status: 404 });
  }

  const atualizada = await prisma.cidade.update({
    where: { id },
    data: { isActive },
  });

  return NextResponse.json(atualizada);
}