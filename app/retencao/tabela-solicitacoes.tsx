"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SolicitacaoComAtendente, CidadeOption } from "@/lib/retencao";
import { FormNovaSolicitacao } from "./form-nova-solicitacao";
import { Toast } from "@/app/toast";
import { STATUS_LABEL, MOTIVO_LABEL } from "@/lib/labels";
import { fmtBRL, shortName } from "@/lib/format";

// Token de cor por status para o badge (acompanha tema claro/escuro). STATUS_COR
// (lib) continua em hex porque é usado também nos exports (Excel).
const STATUS_TOKEN: Record<string, string> = {
  CANCELADO: "var(--danger)",
  RETIDO: "var(--success)",
  INADIMPLENCIA: "var(--warning-strong)",
};

function formatarData(data: Date) {
  // UTC pra bater server (UTC) e cliente (horário local) — a data é salva
  // como meia-noite UTC; getDate()/getMonth() locais causavam hydration mismatch.
  const d = new Date(data);
  const dia = d.getUTCDate().toString().padStart(2, "0");
  const mes = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  return `${dia}/${mes}`;
}

interface Props {
  solicitacoes: SolicitacaoComAtendente[];
  cidades: CidadeOption[];
}

export function TabelaSolicitacoes({ solicitacoes, cidades }: Props) {
  const router = useRouter();
  const [editando, setEditando] = useState<SolicitacaoComAtendente | null>(null);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [confirmarExclusaoId, setConfirmarExclusaoId] = useState<string | null>(null);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function handleEditSucesso() {
    setEditando(null);
    setToast("Solicitação atualizada com sucesso!");
  }

  async function handleExcluirConfirmado() {
    if (!confirmarExclusaoId) return;
    const id = confirmarExclusaoId;
    setConfirmarExclusaoId(null);
    setExcluindo(id);
    setErroExclusao(null);

    try {
      const res = await fetch(`/api/retencao/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setErroExclusao(data.error ?? "Erro ao excluir.");
        return;
      }
      router.refresh();
      setToast("Solicitação excluída com sucesso!");
    } catch {
      setErroExclusao("Erro de conexão. Tente novamente.");
    } finally {
      setExcluindo(null);
    }
  }

  return (
    <>
      {erroExclusao && (
        <div style={{ padding: "8px 12px", marginBottom: 12, backgroundColor: "var(--danger-bg)", border: "1px solid var(--danger-border)", borderRadius: 6, color: "var(--danger-strong)", fontSize: 13 }}>
          {erroExclusao}
        </div>
      )}

      <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 8, backgroundColor: "var(--surface)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ textAlign: "left", backgroundColor: "var(--surface-2)", borderBottom: "2px solid var(--border)" }}>
              {["Data", "Cliente", "Cidade", "Região", "Status", "Ticket", "Motivo", "Atendente", "Observações"].map((h) => (
                <th key={h} style={{ padding: "8px 10px", color: "var(--fg-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
              ))}
              <th style={{ padding: "8px 10px", color: "var(--fg-muted)", fontWeight: 600, textAlign: "center" }}>IXC</th>
              <th style={{ padding: "8px 10px", width: "1%" }}></th>
            </tr>
          </thead>
          <tbody>
            {solicitacoes.map((s, i) => (
              <tr
                key={s.id}
                style={{
                  borderBottom: "1px solid var(--border)",
                  backgroundColor: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)",
                  opacity: excluindo === s.id ? 0.5 : 1,
                }}
              >
                <td style={{ padding: "7px 10px", whiteSpace: "nowrap", color: "var(--fg)" }}>
                  {formatarData(s.dataRegistro)}
                </td>
                <td style={{ padding: "7px 10px", fontWeight: 500, color: "var(--fg)", maxWidth: 220 }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.nomeCliente}</div>
                  {s.contato && (
                    <div style={{ fontSize: 11, color: "var(--fg-muted)", fontWeight: 400 }}>{s.contato}</div>
                  )}
                </td>
                <td style={{ padding: "7px 10px", color: "var(--fg)", maxWidth: 160 }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.cidadeInfo.nome}</div>
                  {s.bairro && (
                    <div style={{ fontSize: 11, color: "var(--fg-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.bairro}</div>
                  )}
                </td>
                <td style={{ padding: "7px 10px" }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: s.regiaoRef?.cor ?? "var(--fg-muted)",
                  }}>
                    {s.regiaoRef?.nome ?? "—"}
                  </span>
                </td>
                <td style={{ padding: "7px 10px" }}>
                  <span style={{
                    padding: "2px 6px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                    color: STATUS_TOKEN[s.status] ?? "var(--fg)",
                    backgroundColor: STATUS_TOKEN[s.status]
                      ? `color-mix(in srgb, ${STATUS_TOKEN[s.status]} 14%, transparent)`
                      : "transparent",
                  }}>
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                </td>
                <td style={{ padding: "7px 10px", color: s.ticketCents != null ? "var(--fg)" : "var(--fg-subtle)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                  {s.ticketCents != null ? fmtBRL(s.ticketCents / 100) : "—"}
                </td>
                <td style={{ padding: "7px 10px", color: "var(--fg-muted)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.motivo ? MOTIVO_LABEL[s.motivo] ?? s.motivo : "—"}
                </td>
                <td style={{ padding: "7px 10px", fontWeight: 500, color: "var(--fg)" }}>{shortName(s.atendente.name)}</td>
                <td style={{ padding: "7px 10px", color: "var(--fg-muted)", maxWidth: 220 }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.observacoes ?? "—"}</div>
                  {s.transbordo && (
                    <div style={{ fontSize: 11, color: "var(--warning-strong)", marginTop: 2 }}>{s.transbordo}</div>
                  )}
                </td>
                <td style={{ padding: "7px 10px", textAlign: "center", color: s.registradoIXC ? "var(--success)" : "var(--border-strong)", fontWeight: 600, fontSize: 11 }}>
                  {s.registradoIXC ? "SIM" : "—"}
                </td>
                <td style={{ padding: "7px 10px", whiteSpace: "nowrap", width: "1%", textAlign: "right" }}>
                  <button
                    onClick={() => setEditando(s)}
                    style={{
                      padding: "3px 10px",
                      border: "1px solid var(--border-strong)",
                      borderRadius: 5,
                      background: "var(--surface)",
                      color: "var(--fg-secondary)",
                      cursor: "pointer",
                      fontSize: 12,
                      marginRight: 6,
                    }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setConfirmarExclusaoId(s.id)}
                    disabled={excluindo === s.id}
                    title="Excluir solicitação"
                    style={{
                      padding: "3px 7px",
                      border: "none",
                      borderRadius: 5,
                      background: "transparent",
                      cursor: excluindo === s.id ? "not-allowed" : "pointer",
                      lineHeight: 1,
                      opacity: excluindo === s.id ? 0.4 : 1,
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {solicitacoes.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: "var(--fg-subtle)", fontSize: 13 }}>Nenhuma solicitação encontrada.</div>
        )}
      </div>

      {editando && (
        <FormNovaSolicitacao
          solicitacao={editando}
          cidades={cidades}
          onSucesso={handleEditSucesso}
          onCancelar={() => setEditando(null)}
        />
      )}

      {confirmarExclusaoId && (
        <div
          onClick={() => setConfirmarExclusaoId(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "var(--surface)",
              borderRadius: 10,
              width: "100%",
              maxWidth: 400,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border)", flexShrink: 0, backgroundColor: "var(--surface-2)", borderRadius: "10px 10px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--fg)", margin: 0 }}>Excluir solicitação</h2>
              <button type="button" onClick={() => setConfirmarExclusaoId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-subtle)", fontSize: 20, lineHeight: 1, padding: "4px 6px", borderRadius: 4 }} aria-label="Fechar">✕</button>
            </div>
            <div style={{ padding: "20px 24px 24px" }}>
            <p style={{ fontSize: 14, color: "var(--fg-muted)", marginBottom: 24 }}>
              Tem certeza? Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setConfirmarExclusaoId(null)}
                style={{
                  padding: "8px 18px",
                  border: "1px solid var(--border-strong)",
                  borderRadius: 6,
                  background: "var(--surface)",
                  color: "var(--fg-secondary)",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleExcluirConfirmado}
                style={{
                  padding: "8px 18px",
                  border: "none",
                  borderRadius: 6,
                  background: "var(--danger-solid)",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Excluir
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast mensagem={toast} onClose={() => setToast(null)} />}
    </>
  );
}