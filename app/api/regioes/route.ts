import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withTenant } from "@/lib/prisma";
import { z } from "zod";

const criarSchema = z.object({
  nome: z.string().trim().min(1).max(60),
  ordem: z.number().int().optional(),
  cor: z.string().trim().max(60).nullish(),
  isForaArea: z.boolean().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const db = withTenant(session.user.tenantId);
  const regioes = await db.regiao.findMany({ orderBy: [{ ordem: "asc" }, { nome: "asc" }] });
  return NextResponse.json(regioes);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const parsed = criarSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  const db = withTenant(session.user.tenantId);
  const regiao = await db.regiao.create({
    data: { tenantId: session.user.tenantId, nome: parsed.data.nome, ordem: parsed.data.ordem ?? 0, cor: parsed.data.cor ?? null, isForaArea: parsed.data.isForaArea ?? false },
  });
  return NextResponse.json(regiao, { status: 201 });
}
