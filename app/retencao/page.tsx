import { getCompetenciaAtual, getSolicitacoesByCompetencia } from "@/lib/retencao";
import { TabelaSolicitacoes } from "./tabela-solicitacoes";
import { BotaoNovaSolicitacao } from "./botao-nova-solicitacao";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default async function RetencaoPage({
  searchParams,
}: {
  searchParams: Promise<{ forbidden?: string }>;
}) {
  const params = await searchParams;
  const competencia = await getCompetenciaAtual();

  if (!competencia) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Retenção</h1>
        <p style={{ color: "#b91c1c", marginTop: 12 }}>
          Nenhuma competência ativa encontrada para este mês. Contate o administrador.
        </p>
      </main>
    );
  }

  const solicitacoes = await getSolicitacoesByCompetencia(competencia.id);

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>
          Retenção — {MESES[competencia.mes - 1]} {competencia.ano}
        </h1>
        <BotaoNovaSolicitacao />
      </div>

      {/* Cards de resumo */}
      <div style={{ display: "flex", gap: 16, marginTop: 20, flexWrap: "wrap" }}>
        <CardResumo label="Cancelados" valor={totalCancelados} meta={competencia.metaCancelamentos} cor="#b91c1c" />
        <CardResumo label="Retidos" valor={totalRetidos} cor="#15803d" />
        <CardResumo label="Inadimplência" valor={totalInadimplencia} cor="#b45309" />
        <CardResumo label="Total de Registros" valor={solicitacoes.length} />
      </div>

      {/* Tabela */}
      <TabelaSolicitacoes solicitacoes={solicitacoes} />
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