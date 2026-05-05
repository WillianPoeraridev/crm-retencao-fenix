"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SolicitacaoComAtendente, CidadeOption } from "@/lib/retencao";
import { FormNovaSolicitacao } from "./form-nova-solicitacao";
import { Toast } from "@/app/toast";
import { STATUS_LABEL, STATUS_COR, MOTIVO_LABEL } from "@/lib/labels";

function formatarData(data: Date) {
  const d = new Date(data);
  const dia = d.getDate().toString().padStart(2, "0");
  const mes = (d.getMonth() + 1).toString().padStart(2, "0");
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
        <div style={{ padding: "8px 12px", marginBottom: 12, backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, color: "#991b1b", fontSize: 13 }}>
          {erroExclusao}
        </div>
      )}

      <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 8, backgroundColor: "#fff" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ textAlign: "left", backgroundColor: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
              {["Data", "Cliente", "Cidade", "Região", "Status", "Motivo", "Atendente", "Observações"].map((h) => (
                <th key={h} style={{ padding: "8px 10px", color: "#6b7280", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
              ))}
              <th style={{ padding: "8px 10px", color: "#6b7280", fontWeight: 600, textAlign: "center" }}>IXC</th>
              <th style={{ padding: "8px 10px", width: "1%" }}></th>
            </tr>
          </thead>
          <tbody>
            {solicitacoes.map((s, i) => (
              <tr
                key={s.id}
                style={{
                  borderBottom: "1px solid #f3f4f6",
                  backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb",
                  opacity: excluindo === s.id ? 0.5 : 1,
                }}
              >
                <td style={{ padding: "7px 10px", whiteSpace: "nowrap", color: "#111827" }}>
                  {formatarData(s.dataRegistro)}
                </td>
                <td style={{ padding: "7px 10px", fontWeight: 500, color: "#111827", maxWidth: 220 }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.nomeCliente}</div>
                  {s.contato && (
                    <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 400 }}>{s.contato}</div>
                  )}
                </td>
                <td style={{ padding: "7px 10px", color: "#111827", maxWidth: 160 }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.cidadeInfo.nome}</div>
                  {s.bairro && (
                    <div style={{ fontSize: 11, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.bairro}</div>
                  )}
                </td>
                <td style={{ padding: "7px 10px" }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: s.regiao === "MATRIZ" ? "#0369a1" : s.regiao === "LITORAL" ? "#0891b2" : "#7c3aed",
                  }}>
                    {s.regiao}
                  </span>
                </td>
                <td style={{ padding: "7px 10px" }}>
                  <span style={{
                    padding: "2px 6px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                    color: STATUS_COR[s.status] ?? "#111827",
                    backgroundColor: `${STATUS_COR[s.status] ?? "#111827"}15`,
                  }}>
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                </td>
                <td style={{ padding: "7px 10px", color: "#6b7280", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.motivo ? MOTIVO_LABEL[s.motivo] ?? s.motivo : "—"}
                </td>
                <td style={{ padding: "7px 10px", fontWeight: 500, color: "#111827" }}>{s.atendente.name.split(" ")[0]}</td>
                <td style={{ padding: "7px 10px", color: "#6b7280", maxWidth: 220 }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.observacoes ?? "—"}</div>
                  {s.transbordo && (
                    <div style={{ fontSize: 11, color: "#b45309", marginTop: 2 }}>{s.transbordo}</div>
                  )}
                </td>
                <td style={{ padding: "7px 10px", textAlign: "center", color: s.registradoIXC ? "#15803d" : "#d1d5db", fontWeight: 600, fontSize: 11 }}>
                  {s.registradoIXC ? "SIM" : "—"}
                </td>
                <td style={{ padding: "7px 10px", whiteSpace: "nowrap", width: "1%", textAlign: "right" }}>
                  <button
                    onClick={() => setEditando(s)}
                    style={{
                      padding: "3px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: 5,
                      background: "#fff",
                      color: "#374151",
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          <div style={{ padding: 24, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>Nenhuma solicitação encontrada.</div>
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
              backgroundColor: "#fff",
              borderRadius: 10,
              padding: 28,
              width: "100%",
              maxWidth: 400,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
              Excluir solicitação
            </h2>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
              Tem certeza? Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setConfirmarExclusaoId(null)}
                style={{
                  padding: "8px 18px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  background: "#fff",
                  color: "#374151",
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
                  background: "#b91c1c",
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
      )}

      {toast && <Toast mensagem={toast} onClose={() => setToast(null)} />}
    </>
  );
}