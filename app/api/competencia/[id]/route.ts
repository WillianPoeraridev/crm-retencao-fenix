import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Só ADMIN pode editar
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const {
    metaCancelamentos,
    orcamentoComissaoCents,
    baseAtivosTotal,
    diasUteis,
    diasTrabalhados,
    metaDiariaManual,
  } = body;

  // 2. Verifica se existe
  const existente = await prisma.competencia.findUnique({ where: { id } });
  if (!existente) {
    return NextResponse.json(
      { error: "Competência não encontrada." },
      { status: 404 }
    );
  }

  // 3. Atualiza — null limpa o campo, undefined mantém o valor atual
  const competencia = await prisma.competencia.update({
    where: { id },
    data: {
      metaCancelamentos: metaCancelamentos !== undefined
        ? (metaCancelamentos === "" ? null : Number(metaCancelamentos))
        : undefined,
      orcamentoComissaoCents: orcamentoComissaoCents !== undefined
        ? (orcamentoComissaoCents === "" ? null : Math.round(Number(orcamentoComissaoCents) * 100))
        : undefined,
      baseAtivosTotal: baseAtivosTotal !== undefined
        ? (baseAtivosTotal === "" ? null : Number(baseAtivosTotal))
        : undefined,
      diasUteis: diasUteis !== undefined
        ? (diasUteis === "" ? null : Number(diasUteis))
        : undefined,
      diasTrabalhados: diasTrabalhados !== undefined
        ? (diasTrabalhados === "" ? null : Number(diasTrabalhados))
        : undefined,
      metaDiariaManual: metaDiariaManual !== undefined
        ? (metaDiariaManual === "" ? null : Number(metaDiariaManual))
        : undefined,
    },
  });

  return NextResponse.json(competencia);
}