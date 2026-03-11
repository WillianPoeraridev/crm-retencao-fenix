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

  if (solicitacoes.length === 0) {
    return <p style={{ color: "#6b7280", marginTop: 16 }}>Nenhuma solicitação registrada neste mês.</p>;
  }

  return (
    <>
      {erroExclusao && (
        <div style={{ padding: "8px 12px", marginBottom: 12, backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, color: "#991b1b", fontSize: 13 }}>
          {erroExclusao}
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: "left", backgroundColor: "#1e2530", color: "#ffffff", borderBottom: "1px solid #2a3340" }}>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Data</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Cliente</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Cidade</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Região</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Status</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Motivo</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Atendente</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Observações</th>
              <th style={{ padding: "8px 12px", fontWeight: 600, textAlign: "center" }}>IXC</th>
              <th style={{ padding: "8px 12px", width: "1%" }}></th>
            </tr>
          </thead>
          <tbody>
            {solicitacoes.map((s, i) => (
              <tr
                key={s.id}
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  backgroundColor: i % 2 === 0 ? "#ffffff" : "#f9fafb",
                  opacity: excluindo === s.id ? 0.5 : 1,
                }}
              >
                <td style={{ padding: "8px 12px", whiteSpace: "nowrap", color: "#111827" }}>
                  {formatarData(s.dataRegistro)}
                </td>
                <td style={{ padding: "8px 12px", fontWeight: 500, color: "#111827" }}>
                  {s.nomeCliente}
                  {s.contato && (
                    <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 400 }}>{s.contato}</div>
                  )}
                </td>
                <td style={{ padding: "8px 12px", color: "#111827" }}>
                  {s.cidadeInfo.nome}
                  {s.bairro && (
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{s.bairro}</div>
                  )}
                </td>
                <td style={{ padding: "8px 12px", color: "#111827" }}>{s.regiao}</td>
                <td style={{ padding: "8px 12px" }}>
                  <span style={{ fontWeight: 600, color: STATUS_COR[s.status] ?? "#111827" }}>
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                </td>
                <td style={{ padding: "8px 12px", color: "#111827" }}>
                  {s.motivo ? MOTIVO_LABEL[s.motivo] ?? s.motivo : "—"}
                </td>
                <td style={{ padding: "8px 12px", color: "#111827" }}>{s.atendente.name}</td>
                <td style={{ padding: "8px 12px", color: "#6b7280", maxWidth: 200 }}>
                  {s.observacoes ?? "—"}
                  {s.transbordo && (
                    <div style={{ fontSize: 11, color: "#b45309", marginTop: 2 }}>{s.transbordo}</div>
                  )}
                </td>
                <td style={{ padding: "8px 12px", textAlign: "center", color: s.registradoIXC ? "#15803d" : "#d1d5db", fontWeight: 600, fontSize: 13 }}>
                  {s.registradoIXC ? "SIM" : "—"}
                </td>
                <td style={{ padding: "8px 12px", whiteSpace: "nowrap", width: "1%", textAlign: "right" }}>
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