import { getCompetenciaByAnoMes, getSolicitacoesByCompetencia, getCidadesAtivas, resolverAnoMes } from "@/lib/retencao";
import { RetencaoRealtime } from "./retencao-realtime";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FiltrosTabela } from "./filtros-tabela";
import { BotaoNovaSolicitacao } from "./botao-nova-solicitacao";
import { SeletorCompetencia } from "./seletor-competencia";
import { BlocoInformacoes } from "./bloco-informacoes";
import { AbasRetencao } from "./abas-retencao";
import { ImportarExportar } from "./importar-exportar";
import { fmtBRL } from "@/lib/format";

export default async function RetencaoPage({
  searchParams,
}: {
  searchParams: Promise<{ forbidden?: string; ano?: string; mes?: string }>;
}) {
  const params = await searchParams;
  const { ano, mes } = resolverAnoMes(params);
  const competencia = await getCompetenciaByAnoMes(ano, mes);
  const cidades = await getCidadesAtivas();
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  const solicitacoes = competencia
    ? await getSolicitacoesByCompetencia(competencia.id)
    : [];

  const cancelados = solicitacoes.filter((s) => s.status === "CANCELADO");
  const retidos = solicitacoes.filter((s) => s.status === "RETIDO");
  const totalCancelados = cancelados.length;
  const totalRetidos = retidos.length;
  const totalInadimplencia = solicitacoes.filter((s) => s.status === "INADIMPLENCIA").length;
  const totalEmpresa = totalCancelados + totalInadimplencia;
  const mrrCanceladoCents = cancelados.reduce((s, x) => s + (x.ticketCents ?? 0), 0);
  const mrrRetidoCents = retidos.reduce((s, x) => s + (x.ticketCents ?? 0), 0);

  const saldo = competencia?.metaCancelamentos != null
    ? competencia.metaCancelamentos - totalCancelados
    : null;

  return (
    <main style={{ padding: "12px 40px" }}>
      <RetencaoRealtime />
      {params.forbidden && (
        <div
          style={{
            padding: "10px 16px",
            marginBottom: 16,
            backgroundColor: "var(--danger-bg)",
            border: "1px solid var(--danger-border)",
            borderRadius: 6,
            color: "var(--danger-strong)",
            fontSize: 14,
          }}
        >
          Acesso negado. Área restrita para administradores.
        </div>
      )}

      {/* Header: linha 1 - seletor + botões */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
        <SeletorCompetencia ano={ano} mes={mes} temCompetencia={!!competencia} />
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: "auto", alignSelf: "flex-start" }}>
          <ImportarExportar competenciaId={competencia?.id ?? null} ano={ano} isAdmin={isAdmin} />
          <BotaoNovaSolicitacao competenciaId={competencia?.id ?? null} cidades={cidades} ano={ano} mes={mes} />
        </div>
      </div>

      {/* Header: linha 2 - cards */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {competencia && <>
          <CardResumo label="Cancelados" valor={totalCancelados} meta={competencia.metaCancelamentos} cor="var(--danger)" />
          <CardResumo label="Retidos" valor={totalRetidos} cor="var(--success)" />
          <CardResumo label="Inadimplência" valor={totalInadimplencia} cor="var(--warning-strong)" />
          <CardResumo label="Total Empresa" valor={totalEmpresa} cor="var(--fg)" />
          {saldo !== null && (
            <CardResumo label="Saldo" valor={saldo} cor={saldo >= 0 ? "var(--success)" : "var(--danger)"} />
          )}
          {mrrCanceladoCents > 0 && (
            <CardResumo label="MRR Perdido" valorStr={fmtBRL(mrrCanceladoCents / 100)} cor="var(--danger)" />
          )}
          {mrrRetidoCents > 0 && (
            <CardResumo label="MRR Retido" valorStr={fmtBRL(mrrRetidoCents / 100)} cor="var(--success)" />
          )}
        </>}
      </div>

      {competencia ? (
        <>
          {/* Abas: Tabela | Informações */}
          <AbasRetencao>
            <FiltrosTabela solicitacoes={solicitacoes} cidades={cidades} />
            <BlocoInformacoes solicitacoes={solicitacoes} competencia={competencia} />
          </AbasRetencao>
        </>
      ) : (
        <div
          style={{
            marginTop: 28,
            padding: 18,
            border: "1px dashed var(--border-strong)",
            borderRadius: 8,
            textAlign: "center",
            color: "var(--fg-muted)",
          }}
        >
          <p style={{ fontSize: 16, marginBottom: 8 }}>Nenhuma competência cadastrada para este mês.</p>
          <p style={{ fontSize: 13 }}>Um administrador precisa configurar os dados desta competência.</p>
        </div>
      )}
    </main>
  );
}

function CardResumo({
  label,
  valor,
  valorStr,
  meta,
  cor = "var(--fg)",
}: {
  label: string;
  valor?: number;
  valorStr?: string;
  meta?: number | null;
  cor?: string;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "10px 16px",
        minWidth: 120,
        backgroundColor: "var(--surface)",
      }}
    >
      <div style={{ fontSize: 11, color: "var(--fg-muted)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: cor }}>{valorStr ?? valor}</div>
      {meta != null && (
        <div style={{ fontSize: 11, color: "var(--fg-muted)", marginTop: 2 }}>
          meta: {meta}
        </div>
      )}
    </div>
  );
}