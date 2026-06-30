import { withTenant } from "@/lib/prisma";

// Helpers de leitura do CRM Retenção. Recebem tenantId (da sessão) e usam withTenant.

// Busca a competência do mês/ano atual
export async function getCompetenciaAtual(tenantId: string) {
  const now = new Date();
  return getCompetenciaByAnoMes(tenantId, now.getFullYear(), now.getMonth() + 1);
}

// Busca a competência de um mês/ano específico
export async function getCompetenciaByAnoMes(tenantId: string, ano: number, mes: number) {
  return withTenant(tenantId).competencia.findFirst({
    where: { ano, mes },
  });
}

// Retorna ano e mês a partir dos searchParams da URL
export function resolverAnoMes(params: { ano?: string; mes?: string }) {
  const now = new Date();
  const ano = params.ano ? parseInt(params.ano) : now.getFullYear();
  const mes = params.mes ? parseInt(params.mes) : now.getMonth() + 1;

  if (mes < 1 || mes > 12 || ano < 2020 || ano > 2100) {
    return { ano: now.getFullYear(), mes: now.getMonth() + 1 };
  }

  return { ano, mes };
}

// Busca todas as solicitações de uma competência, com atendente e cidade
export async function getSolicitacoesByCompetencia(tenantId: string, competenciaId: string) {
  return withTenant(tenantId).solicitacaoRetencao.findMany({
    where: { competenciaId },
    include: {
      atendente: {
        select: { id: true, name: true },
      },
      cidadeInfo: {
        select: { id: true, nome: true },
      },
      regiaoRef: {
        select: { id: true, nome: true, cor: true },
      },
    },
    orderBy: { dataRegistro: "desc" },
  });
}

// Regiões ativas do tenant (dropdowns / agrupamentos).
export async function getRegioesAtivas(tenantId: string) {
  return withTenant(tenantId).regiao.findMany({
    where: { isActive: true },
    orderBy: [{ ordem: "asc" }, { nome: "asc" }],
    select: { id: true, nome: true, cor: true },
  });
}

// Busca cidades ativas (para dropdowns)
export async function getCidadesAtivas(tenantId: string) {
  return withTenant(tenantId).cidade.findMany({
    where: { isActive: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });
}

// Tipo inferido do retorno — usado nos componentes para tipagem
export type SolicitacaoComAtendente = Awaited<
  ReturnType<typeof getSolicitacoesByCompetencia>
>[number];

export type CidadeOption = { id: string; nome: string };