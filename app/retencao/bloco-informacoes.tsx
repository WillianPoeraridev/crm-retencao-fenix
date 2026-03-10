import type { SolicitacaoComAtendente } from "@/lib/retencao";

interface Competencia {
  metaCancelamentos: number | null;
  orcamentoComissaoCents: number | null;
  baseAtivosTotal: number | null;
  diasUteis: number | null;
  diasTrabalhados: number | null;
  metaDiariaManual: number | null;
}

interface Props {
  solicitacoes: SolicitacaoComAtendente[];
  competencia: Competencia;
}

const MOTIVO_LABEL: Record<string, string> = {
  INSATISFACAO_ATD: "Insatisfação c/ Atendimento",
  INSATISFACAO_SERVICO: "Insatisfação c/ Serviço",
  MUDANCA_ENDERECO: "Mudança de Endereço",
  MOTIVOS_PESSOAIS: "Motivos Pessoais",
  TROCA_PROVEDOR: "Troca de Provedor",
  PROBLEMAS_FINANC: "Problemas Financeiros",
  OUTROS: "Outros",
};

const REGIAO_LABEL: Record<string, string> = {
  SINOS: "Sinos",
  LITORAL: "Litoral",
  MATRIZ: "Matriz",
};

function pct(valor: number, total: number) {
  if (total === 0) return "0,00%";
  return ((valor / total) * 100).toFixed(2).replace(".", ",") + "%";
}

function pctNum(valor: number, total: number) {
  if (total === 0) return 0;
  return (valor / total) * 100;
}

function formatarReais(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function BlocoInformacoes({ solicitacoes, competencia }: Props) {
  const cancelados = solicitacoes.filter((s) => s.status === "CANCELADO");
  const retidos = solicitacoes.filter((s) => s.status === "RETIDO");
  const inadimplentes = solicitacoes.filter((s) => s.status === "INADIMPLENCIA");

  const totalCancelados = cancelados.length;
  const totalRetidos = retidos.length;
  const totalInadimplencia = inadimplentes.length;
  const totalAtendidos = totalCancelados + totalRetidos;
  const totalEmpresa = totalCancelados + totalInadimplencia;

  const saldo = (competencia.metaCancelamentos ?? 0) - totalCancelados;
  const diasRestantes = (competencia.diasUteis ?? 0) - (competencia.diasTrabalhados ?? 0);
  const metaRecalculada = diasRestantes > 0 ? Math.ceil(saldo / diasRestantes) : null;
  const churnGeral =
    competencia.baseAtivosTotal && competencia.baseAtivosTotal > 0
      ? totalEmpresa / competencia.baseAtivosTotal
      : null;

  const motivosCount: Record<string, number> = {};
  for (const s of cancelados) {
    if (s.motivo && s.motivo !== "INADIMPLENCIA_90") {
      motivosCount[s.motivo] = (motivosCount[s.motivo] ?? 0) + 1;
    }
  }
  const motivosOrdenados = Object.entries(motivosCount).sort((a, b) => b[1] - a[1]);

  const atendentesMap: Record<
    string,
    { nome: string; total: number; cancelados: number; retidos: number }
  > = {};
  for (const s of solicitacoes) {
    if (s.status === "INADIMPLENCIA") continue;
    const id = s.atendente.id;
    if (!atendentesMap[id]) {
      atendentesMap[id] = { nome: s.atendente.name, total: 0, cancelados: 0, retidos: 0 };
    }
    atendentesMap[id].total++;
    if (s.status === "CANCELADO") atendentesMap[id].cancelados++;
    if (s.status === "RETIDO") atendentesMap[id].retidos++;
  }
  const ranking = Object.values(atendentesMap).sort((a, b) => b.retidos - a.retidos);

  const regiaoMap: Record<string, { cancelados: number; retidos: number; inadimplencia: number }> = {};
  for (const s of solicitacoes) {
    const r = s.regiao;
    if (!regiaoMap[r]) regiaoMap[r] = { cancelados: 0, retidos: 0, inadimplencia: 0 };
    if (s.status === "CANCELADO") regiaoMap[r].cancelados++;
    if (s.status === "RETIDO") regiaoMap[r].retidos++;
    if (s.status === "INADIMPLENCIA") regiaoMap[r].inadimplencia++;
  }
  const regioes = Object.entries(regiaoMap).sort((a, b) => b[1].cancelados - a[1].cancelados);
  const maxCancelRegiao = Math.max(...regioes.map(([, v]) => v.cancelados), 1);

  const cidadeMap: Record<string, { nome: string; cancelados: number; retidos: number; inadimplencia: number }> = {};
  for (const s of solicitacoes) {
    const id = s.cidade;
    if (!cidadeMap[id]) cidadeMap[id] = { nome: s.cidadeInfo.nome, cancelados: 0, retidos: 0, inadimplencia: 0 };
    if (s.status === "CANCELADO") cidadeMap[id].cancelados++;
    if (s.status === "RETIDO") cidadeMap[id].retidos++;
    if (s.status === "INADIMPLENCIA") cidadeMap[id].inadimplencia++;
  }
  const cidades = Object.values(cidadeMap)
    .filter((c) => c.cancelados > 0)
    .sort((a, b) => b.cancelados - a.cancelados);
  const maxCancelCidade = Math.max(...cidades.map((c) => c.cancelados), 1);

  return (
    <div style={{ marginTop: 32 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 16 }}>
        Informações
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Secao titulo="Indicadores da Competência">
            <LinhaInfo label="Realizado orgânico" valor={totalCancelados} />
            <LinhaInfo label="Realizado inadimplência" valor={totalInadimplencia} />
            <LinhaInfo label="Total empresa" valor={totalEmpresa} destaque />
            <LinhaInfo label="Saldo" valor={saldo} cor={saldo >= 0 ? "#15803d" : "#b91c1c"} />
            {diasRestantes > 0 && (
              <LinhaInfo label="Dias restantes" valor={diasRestantes} />
            )}
            {metaRecalculada !== null && (
              <LinhaInfo
                label="Meta recalculada"
                valor={metaRecalculada}
                cor={metaRecalculada <= 0 ? "#15803d" : "#b45309"}
              />
            )}
            {churnGeral !== null && (
              <LinhaInfo
                label="Churn geral fulltime"
                valorStr={(churnGeral * 100).toFixed(2).replace(".", ",") + "%"}
              />
            )}
          </Secao>

          <Secao titulo={`Motivos de Cancelamento (${totalCancelados} cancelados)`}>
            {motivosOrdenados.length === 0 ? (
              <p style={{ fontSize: 13, color: "#9ca3af" }}>Nenhum cancelamento registrado.</p>
            ) : (
              motivosOrdenados.map(([motivo, count]) => (
                <div
                  key={motivo}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 0",
                    borderBottom: "1px solid #f3f4f6",
                  }}
                >
                  <span style={{ fontSize: 13, color: "#374151" }}>
                    {MOTIVO_LABEL[motivo] ?? motivo}
                  </span>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>
                    {count}{" "}
                    <span style={{ color: "#9ca3af" }}>({pct(count, totalCancelados)})</span>
                  </span>
                </div>
              ))
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 8,
                paddingTop: 8,
                borderTop: "2px solid #e5e7eb",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Tx. de retenção</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>
                {pct(totalRetidos, totalAtendidos)}
              </span>
            </div>
          </Secao>
        </div>

        <Secao titulo="Ranking por Atendente">
          {ranking.length === 0 ? (
            <p style={{ fontSize: 13, color: "#9ca3af" }}>Nenhum registro ainda.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                  <th style={{ padding: "6px 8px", color: "#6b7280", fontWeight: 600 }}>Atendente</th>
                  <th style={{ padding: "6px 8px", color: "#6b7280", fontWeight: 600, textAlign: "right" }}>Total</th>
                  <th style={{ padding: "6px 8px", color: "#6b7280", fontWeight: 600, textAlign: "right" }}>Cancel.</th>
                  <th style={{ padding: "6px 8px", color: "#6b7280", fontWeight: 600, textAlign: "right" }}>Retidos</th>
                  <th style={{ padding: "6px 8px", color: "#6b7280", fontWeight: 600, textAlign: "right" }}>Tx. Ret.</th>
                  <th style={{ padding: "6px 8px", color: "#6b7280", fontWeight: 600, textAlign: "right" }}>Tx. Part.</th>
                  <th style={{ padding: "6px 8px", color: "#6b7280", fontWeight: 600, textAlign: "right" }}>Proj. Comissão</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((a, i) => {
                  const txParticipacao = totalRetidos > 0 ? a.retidos / totalRetidos : 0;
                  const projComissao = competencia.orcamentoComissaoCents
                    ? competencia.orcamentoComissaoCents * txParticipacao
                    : null;
                  return (
                    <tr
                      key={a.nome}
                      style={{
                        borderBottom: "1px solid #f3f4f6",
                        backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb",
                      }}
                    >
                      <td style={{ padding: "8px 8px", fontWeight: 600, color: "#111827" }}>{a.nome}</td>
                      <td style={{ padding: "8px 8px", textAlign: "right", color: "#374151" }}>{a.total}</td>
                      <td style={{ padding: "8px 8px", textAlign: "right", color: "#b91c1c" }}>{a.cancelados}</td>
                      <td style={{ padding: "8px 8px", textAlign: "right", color: "#15803d" }}>{a.retidos}</td>
                      <td style={{ padding: "8px 8px", textAlign: "right", color: "#374151" }}>{pct(a.retidos, a.total)}</td>
                      <td style={{ padding: "8px 8px", textAlign: "right", color: "#374151" }}>{pct(a.retidos, totalRetidos)}</td>
                      <td style={{ padding: "8px 8px", textAlign: "right", color: "#15803d", fontWeight: 600 }}>
                        {projComissao !== null ? formatarReais(projComissao) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {competencia.orcamentoComissaoCents && (
                <tfoot>
                  <tr style={{ borderTop: "2px solid #e5e7eb" }}>
                    <td colSpan={6} style={{ padding: "8px 8px", fontSize: 13, fontWeight: 600, color: "#6b7280" }}>
                      Orçamento total
                    </td>
                    <td style={{ padding: "8px 8px", textAlign: "right", fontWeight: 700, color: "#111827" }}>
                      {formatarReais(competencia.orcamentoComissaoCents)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </Secao>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Secao titulo="Cancelamentos por Região">
          {regioes.length === 0 ? (
            <p style={{ fontSize: 13, color: "#9ca3af" }}>Nenhum registro ainda.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {regioes.map(([regiao, dados]) => {
                const totalAtendidosRegiao = dados.cancelados + dados.retidos;
                const barPct = pctNum(dados.cancelados, maxCancelRegiao);
                return (
                  <div key={regiao}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                        {REGIAO_LABEL[regiao] ?? regiao}
                      </span>
                      <div style={{ display: "flex", gap: 14, fontSize: 12 }}>
                        <span style={{ color: "#b91c1c", fontWeight: 600 }}>{dados.cancelados} cancel.</span>
                        <span style={{ color: "#15803d", fontWeight: 600 }}>{dados.retidos} retidos</span>
                        <span style={{ color: "#6b7280" }}>{pct(dados.retidos, totalAtendidosRegiao)} ret.</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", backgroundColor: "#f3f4f6" }}>
                      <div style={{ width: `${barPct}%`, backgroundColor: "#b91c1c", transition: "width 0.3s ease" }} />
                      <div style={{ width: `${pctNum(dados.retidos, maxCancelRegiao)}%`, backgroundColor: "#86efac", transition: "width 0.3s ease" }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>
                      {pct(dados.cancelados, totalCancelados)} dos cancelamentos do mês
                      {dados.inadimplencia > 0 && (
                        <span style={{ marginLeft: 8, color: "#b45309" }}>· {dados.inadimplencia} inadimpl.</span>
                      )}
                    </div>
                  </div>
                );
              })}
              <div style={{ borderTop: "2px solid #e5e7eb", paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Total</span>
                <div style={{ display: "flex", gap: 14, fontSize: 12 }}>
                  <span style={{ color: "#b91c1c", fontWeight: 700 }}>{totalCancelados} cancel.</span>
                  <span style={{ color: "#15803d", fontWeight: 700 }}>{totalRetidos} retidos</span>
                  {totalInadimplencia > 0 && (
                    <span style={{ color: "#b45309", fontWeight: 700 }}>{totalInadimplencia} inadimpl.</span>
                  )}
                  <span style={{ color: "#6b7280" }}>{pct(totalRetidos, totalAtendidos)} ret.</span>
                </div>
              </div>
            </div>
          )}
        </Secao>

        <Secao titulo={`Cancelamentos por Cidade (${cidades.length} ${cidades.length === 1 ? "cidade" : "cidades"})`}>
          {cidades.length === 0 ? (
            <p style={{ fontSize: 13, color: "#9ca3af" }}>Nenhum cancelamento registrado.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                  <th style={{ padding: "5px 8px", color: "#6b7280", fontWeight: 600 }}>Cidade</th>
                  <th style={{ padding: "5px 8px", color: "#6b7280", fontWeight: 600, textAlign: "right" }}>Cancel.</th>
                  <th style={{ padding: "5px 8px", color: "#6b7280", fontWeight: 600, textAlign: "right" }}>Retidos</th>
                  <th style={{ padding: "5px 8px", color: "#6b7280", fontWeight: 600, textAlign: "right" }}>Tx. Ret.</th>
                  <th style={{ padding: "5px 4px", color: "#6b7280", fontWeight: 600 }}>Proporção</th>
                </tr>
              </thead>
              <tbody>
                {cidades.map((c, i) => {
                  const totalAtendidosCidade = c.cancelados + c.retidos;
                  const barWidth = pctNum(c.cancelados, maxCancelCidade);
                  return (
                    <tr key={c.nome} style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                      <td style={{ padding: "7px 8px", fontWeight: 600, color: "#111827" }}>{c.nome}</td>
                      <td style={{ padding: "7px 8px", textAlign: "right", color: "#b91c1c", fontWeight: 700 }}>{c.cancelados}</td>
                      <td style={{ padding: "7px 8px", textAlign: "right", color: "#15803d" }}>{c.retidos}</td>
                      <td style={{ padding: "7px 8px", textAlign: "right", color: "#374151" }}>{pct(c.retidos, totalAtendidosCidade)}</td>
                      <td style={{ padding: "7px 4px", minWidth: 80 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ flex: 1, height: 6, backgroundColor: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${barWidth}%`, height: "100%", backgroundColor: "#b91c1c", borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>
                            {pct(c.cancelados, totalCancelados)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #e5e7eb" }}>
                  <td style={{ padding: "7px 8px", fontWeight: 700, color: "#111827", fontSize: 13 }}>Total</td>
                  <td style={{ padding: "7px 8px", textAlign: "right", fontWeight: 700, color: "#b91c1c" }}>{totalCancelados}</td>
                  <td style={{ padding: "7px 8px", textAlign: "right", fontWeight: 700, color: "#15803d" }}>{totalRetidos}</td>
                  <td style={{ padding: "7px 8px", textAlign: "right", fontWeight: 700, color: "#374151" }}>{pct(totalRetidos, totalAtendidos)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </Secao>
      </div>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ backgroundColor: "#f9fafb", padding: "10px 16px", borderBottom: "1px solid #e5e7eb" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{titulo}</span>
      </div>
      <div style={{ padding: "12px 16px" }}>{children}</div>
    </div>
  );
}

function LinhaInfo({
  label,
  valor,
  valorStr,
  cor = "#111827",
  destaque = false,
}: {
  label: string;
  valor?: number;
  valorStr?: string;
  cor?: string;
  destaque?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "6px 0",
        borderBottom: "1px solid #f3f4f6",
        backgroundColor: destaque ? "#fefce8" : "transparent",
      }}
    >
      <span style={{ fontSize: 13, color: "#374151" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: destaque ? 700 : 600, color: cor }}>
        {valorStr ?? valor}
      </span>
    </div>
  );
}