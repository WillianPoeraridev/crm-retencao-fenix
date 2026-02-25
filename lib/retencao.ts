import { prisma } from "@/lib/prisma";

// Busca a competência do mês/ano atual
export async function getCompetenciaAtual() {
  const now = new Date();
  return getCompetenciaByAnoMes(now.getFullYear(), now.getMonth() + 1);
}

// Busca a competência de um mês/ano específico
export async function getCompetenciaByAnoMes(ano: number, mes: number) {
  return prisma.competencia.findUnique({
    where: { ano_mes: { ano, mes } },
  });
}

// Retorna ano e mês a partir dos searchParams da URL
// Se não vier nada, usa o mês atual
export function resolverAnoMes(params: { ano?: string; mes?: string }) {
  const now = new Date();
  const ano = params.ano ? parseInt(params.ano) : now.getFullYear();
  const mes = params.mes ? parseInt(params.mes) : now.getMonth() + 1;

  // sanidade: mês entre 1 e 12, ano razoável
  if (mes < 1 || mes > 12 || ano < 2020 || ano > 2100) {
    return { ano: now.getFullYear(), mes: now.getMonth() + 1 };
  }

  return { ano, mes };
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