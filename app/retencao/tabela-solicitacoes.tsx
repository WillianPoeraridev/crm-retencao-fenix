"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SolicitacaoComAtendente, CidadeOption } from "@/lib/retencao";
import { FormNovaSolicitacao } from "./form-nova-solicitacao";
import { Toast } from "@/app/toast";

const STATUS_LABEL: Record<string, string> = {
  CANCELADO: "Cancelado",
  RETIDO: "Retido",
  INADIMPLENCIA: "Inadimplência",
};

const STATUS_COR: Record<string, string> = {
  CANCELADO: "#b91c1c",
  RETIDO: "#15803d",
  INADIMPLENCIA: "#b45309",
};

const MOTIVO_LABEL: Record<string, string> = {
  INSATISFACAO_ATD: "Insatisfação Atendimento",
  INSATISFACAO_SERVICO: "Insatisfação Serviço",
  MUDANCA_ENDERECO: "Mudança de Endereço",
  MOTIVOS_PESSOAIS: "Motivos Pessoais",
  TROCA_PROVEDOR: "Troca de Provedor",
  PROBLEMAS_FINANC: "Problemas Financeiros",
  OUTROS: "Outros",
  INADIMPLENCIA_90: "90 + Inadimplência",
};

function formatarData(data: Date) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(data));
}

interface Props {
  solicitacoes: SolicitacaoComAtendente[];
  cidades: CidadeOption[];
}

export function TabelaSolicitacoes({ solicitacoes, cidades }: Props) {
  const router = useRouter();
  const [editando, setEditando] = useState<SolicitacaoComAtendente | null>(null);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function handleEditSucesso() {
    setEditando(null);
    setToast("Solicitação atualizada com sucesso!");
  }

  async function handleExcluir(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta solicitação? Esta ação não pode ser desfeita.")) return;

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
            <tr style={{ textAlign: "left", backgroundColor: "#111827", color: "#ffffff" }}>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Data</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Cliente</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Cidade</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Região</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Status</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Motivo</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Atendente</th>
              <th style={{ padding: "8px 12px", fontWeight: 600 }}>Observações</th>
              <th style={{ padding: "8px 12px" }}></th>
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
                <td style={{ padding: "8px 12px", color: "#111827" }}>{s.cidadeInfo.nome}</td>
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
                </td>
                <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
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
                    onClick={() => handleExcluir(s.id)}
                    disabled={excluindo === s.id}
                    style={{
                      padding: "3px 10px",
                      border: "1px solid #fecaca",
                      borderRadius: 5,
                      background: "#fff",
                      color: "#b91c1c",
                      cursor: excluindo === s.id ? "not-allowed" : "pointer",
                      fontSize: 12,
                    }}
                  >
                    Excluir
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

      {toast && <Toast mensagem={toast} onClose={() => setToast(null)} />}
    </>
  );
}