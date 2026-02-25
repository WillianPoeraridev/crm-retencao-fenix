import { getCompetenciaByAnoMes, getSolicitacoesByCompetencia, resolverAnoMes } from "@/lib/retencao";
import { TabelaSolicitacoes } from "./tabela-solicitacoes";
import { BotaoNovaSolicitacao } from "./botao-nova-solicitacao";
import { SeletorCompetencia } from "./seletor-competencia";

export default async function RetencaoPage({
  searchParams,
}: {
  searchParams: Promise<{ forbidden?: string; ano?: string; mes?: string }>;
}) {
  const params = await searchParams;
  const { ano, mes } = resolverAnoMes(params);
  const competencia = await getCompetenciaByAnoMes(ano, mes);

  const solicitacoes = competencia
    ? await getSolicitacoesByCompetencia(competencia.id)
    : [];

  const totalCancelados = solicitacoes.filter((s) => s.status === "CANCELADO").length;
  const totalRetidos = solicitacoes.filter((s) => s.status === "RETIDO").length;
  const totalInadimplencia = solicitacoes.filter((s) => s.status === "INADIMPLENCIA").length;

  return (
    <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      {params.forbidden && (
        <div
          style={{
            padding: "10px 16px",
            marginBottom: 16,
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 6,
            color: "#991b1b",
            fontSize: 14,
          }}
        >
          Acesso negado. Área restrita para administradores.
        </div>
      )}

      {/* Header: seletor + botão */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <SeletorCompetencia ano={ano} mes={mes} temCompetencia={!!competencia} />
        <BotaoNovaSolicitacao />
      </div>

      {/* Cards de resumo */}
      {competencia ? (
        <>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <CardResumo label="Cancelados" valor={totalCancelados} meta={competencia.metaCancelamentos} cor="#b91c1c" />
            <CardResumo label="Retidos" valor={totalRetidos} cor="#15803d" />
            <CardResumo label="Inadimplência" valor={totalInadimplencia} cor="#b45309" />
            <CardResumo label="Total de Registros" valor={solicitacoes.length} />
          </div>
          <TabelaSolicitacoes solicitacoes={solicitacoes} />
        </>
      ) : (
        <div
          style={{
            marginTop: 32,
            padding: 24,
            border: "1px dashed #d1d5db",
            borderRadius: 8,
            textAlign: "center",
            color: "#6b7280",
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
  meta,
  cor = "#111827",
}: {
  label: string;
  valor: number;
  meta?: number | null;
  cor?: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: "12px 20px",
        minWidth: 140,
        backgroundColor: "#ffffff",
      }}
    >
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: cor }}>{valor}</div>
      {meta != null && (
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
          meta: {meta}
        </div>
      )}
    </div>
  );
}