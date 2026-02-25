import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  // 1. Só ADMIN pode criar competência
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await req.json();
  const {
    ano,
    mes,
    metaCancelamentos,
    orcamentoComissaoCents,
    baseAtivosTotal,
    diasUteis,
    diasTrabalhados,
    metaDiariaManual,
  } = body;

  // 2. Validação dos campos obrigatórios
  if (!ano || !mes) {
    return NextResponse.json(
      { error: "Ano e mês são obrigatórios." },
      { status: 400 }
    );
  }

  // 3. Verifica se já existe
  const existente = await prisma.competencia.findUnique({
    where: { ano_mes: { ano: Number(ano), mes: Number(mes) } },
  });

  if (existente) {
    return NextResponse.json(
      { error: "Já existe uma competência para este mês/ano." },
      { status: 409 }
    );
  }

  // 4. Cria
  const competencia = await prisma.competencia.create({
    data: {
      ano: Number(ano),
      mes: Number(mes),
      metaCancelamentos: metaCancelamentos ? Number(metaCancelamentos) : null,
      orcamentoComissaoCents: orcamentoComissaoCents
        ? Math.round(Number(orcamentoComissaoCents) * 100) // recebe em R$, salva em centavos
        : null,
      baseAtivosTotal: baseAtivosTotal ? Number(baseAtivosTotal) : null,
      diasUteis: diasUteis ? Number(diasUteis) : null,
      diasTrabalhados: diasTrabalhados ? Number(diasTrabalhados) : null,
      metaDiariaManual: metaDiariaManual ? Number(metaDiariaManual) : null,
    },
  });

  return NextResponse.json(competencia, { status: 201 });
}