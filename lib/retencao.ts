import { prisma } from "@/lib/prisma";

// Busca a competência do mês/ano atual
export async function getCompetenciaAtual() {
  const now = new Date();
  return prisma.competencia.findUnique({
    where: {
      ano_mes: {
        ano: now.getFullYear(),
        mes: now.getMonth() + 1,
      },
    },
  });
}

// Busca todas as solicitações de uma competência, com dados do atendente
export async function getSolicitacoesByCompetencia(competenciaId: string) {
  return prisma.solicitacaoRetencao.findMany({
    where: { competenciaId },
    include: {
      atendente: {
        select: { id: true, name: true },
      },
    },
    orderBy: { dataRegistro: "desc" },
  });
}

// Tipo inferido do retorno — usado nos componentes para tipagem
export type SolicitacaoComAtendente = Awaited<
  ReturnType<typeof getSolicitacoesByCompetencia>
>[number];