import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withTenant } from "@/lib/prisma";
import { z } from "zod";

const atualizarSchema = z.object({
  nome: z.string().trim().min(1).max(60).optional(),
  ordem: z.number().int().optional(),
  cor: z.string().trim().max(60).nullish(),
  isForaArea: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const { id } = await params;
  const parsed = atualizarSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  const db = withTenant(session.user.tenantId);
  const regiao = await db.regiao.update({ where: { id }, data: parsed.data });
  return NextResponse.json(regiao);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const { id } = await params;
  const db = withTenant(session.user.tenantId);
  const solicitacoes = await db.solicitacaoRetencao.count({ where: { regiaoId: id } });
  if (solicitacoes > 0) {
    const regiao = await db.regiao.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ...regiao, softDeleted: true, solicitacoes });
  }
  await db.regiao.delete({ where: { id } });
  return NextResponse.json({ id, deleted: true });
}
