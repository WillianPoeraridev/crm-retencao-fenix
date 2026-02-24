import type { SolicitacaoComAtendente } from "@/lib/retencao";

const STATUS_LABEL: Record<string, string> = {
  CANCELADO: "Cancelado",
  RETIDO: "Retido",
  INADIMPLENCIA: "Inadimplência",
};

const STATUS_COR: Record<string, string> = {
  CANCELADO: "color: #b91c1c",
  RETIDO: "color: #15803d",
  INADIMPLENCIA: "color: #b45309",
};

const MOTIVO_LABEL: Record<string, string> = {
  INSATISFACAO_ATD: "Insatisfação Atendimento",
  INSATISFACAO_SERVICO: "Insatisfação Serviço",
  MUDANCA_ENDERECO: "Mudança de Endereço",
  MOTIVOS_PESSOAIS: "Motivos Pessoais",
  TROCA_PROVEDOR: "Troca de Provedor",
  PROBLEMAS_FINANC: "Problemas Financeiros",
  OUTROS: "Outros",
};

function formatarData(data: Date) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(data));
}

function formatarCidade(cidade: string) {
  return cidade
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Props {
  solicitacoes: SolicitacaoComAtendente[];
}

export function TabelaSolicitacoes({ solicitacoes }: Props) {
  if (solicitacoes.length === 0) {
    return <p style={{ color: "#6b7280", marginTop: 16 }}>Nenhuma solicitação registrada neste mês.</p>;
  }

  return (
    <div style={{ overflowX: "auto", marginTop: 16 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", backgroundColor: "#111827", color: "#ffffff" }}>
            <th style={{ padding: "8px 12px", fontWeight: 600 }}>Data</th>
            <th style={{ padding: "8px 12px", fontWeight: 600 }}>Cliente</th>
            <th style={{ padding: "8px 12px", fontWeight: 600 }}>Cidade</th>
            <th style={{ padding: "8px 12px", fontWeight: 600 }}>Região</th>
            <th style={{ padding: "8px 12px", fontWeight: 600 }}>Status</th>
            <th style={{ padding: "8px 12px", fontWeight: 600 }}>Motivo</th>
            <th style={{ padding: "8px 12px", fontWeight: 600 }}>Atendente</th>
            <th style={{ padding: "8px 12px", fontWeight: 600 }}>Observações</th>
          </tr>
        </thead>
        <tbody>
          {solicitacoes.map((s, i) => (
            <tr
              key={s.id}
              style={{
                borderBottom: "1px solid #e5e7eb",
                backgroundColor: i % 2 === 0 ? "#ffffff" : "#f9fafb",
              }}
            >
              <td style={{ padding: "8px 12px", whiteSpace: "nowrap", color: "#111827" }}>
                {formatarData(s.dataRegistro)}
              </td>
              <td style={{ padding: "8px 12px", fontWeight: 500, color: "#111827" }}>
                {s.nomeCliente}
                {s.contato && (
                  <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 400 }}>
                    {s.contato}
                  </div>
                )}
              </td>
              <td style={{ padding: "8px 12px", color: "#111827" }}>{formatarCidade(s.cidade)}</td>
              <td style={{ padding: "8px 12px", color: "#111827" }}>{s.regiao}</td>
              <td style={{ padding: "8px 12px" }}>
                <span style={{ fontWeight: 600, ...Object.fromEntries(STATUS_COR[s.status].split(";").map(p => p.trim().split(": "))) }}>
                  {STATUS_LABEL[s.status] ?? s.status}
                </span>
              </td>
              <td style={{ padding: "8px 12px", color: "#111827" }}>
                {s.motivo ? MOTIVO_LABEL[s.motivo] ?? s.motivo : "—"}
              </td>
              <td style={{ padding: "8px 12px", color: "#111827" }}>{s.atendente.name}</td>
              <td style={{ padding: "8px 12px", color: "#6b7280", maxWidth: 200 }}>
                {s.observacoes ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}