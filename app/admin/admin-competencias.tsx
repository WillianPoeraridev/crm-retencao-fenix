"use client";

import { useState } from "react";
import { FormCompetencia } from "./form-competencia";
import { Toast } from "@/app/toast";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface Competencia {
  id: string;
  ano: number;
  mes: number;
  metaCancelamentos: number | null;
  orcamentoComissaoCents: number | null;
  baseAtivosTotal: number | null;
  diasUteis: number | null;
  diasTrabalhados: number | null;
  metaDiariaManual: number | null;
}

interface Props {
  competencias: Competencia[];
}

export function AdminCompetencias({ competencias }: Props) {
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState<Competencia | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function handleSucessoCriacao() {
    setCriando(false);
    setToast("Competência criada com sucesso!");
  }

  function handleSucessoEdicao() {
    setEditando(null);
    setToast("Competência atualizada com sucesso!");
  }

  function formatarReais(cents: number | null) {
    if (cents == null) return "—";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  }

  return (
    <>
      <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", backgroundColor: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)" }}>
            Competências ({competencias.length})
          </h2>
          <button
            onClick={() => setCriando(true)}
            style={{ padding: "6px 14px", border: "none", borderRadius: 6, background: "var(--primary-solid)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
          >
            + Nova competência
          </button>
        </div>

        {competencias.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--fg-muted)", fontSize: 14 }}>
            Nenhuma competência cadastrada ainda.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ backgroundColor: "var(--th-bg)", color: "#fff", textAlign: "left" }}>
                <th style={{ padding: "8px 16px", fontWeight: 600 }}>Competência</th>
                <th style={{ padding: "8px 16px", fontWeight: 600 }}>Meta</th>
                <th style={{ padding: "8px 16px", fontWeight: 600 }}>Orçamento</th>
                <th style={{ padding: "8px 16px", fontWeight: 600 }}>Base clientes</th>
                <th style={{ padding: "8px 16px", fontWeight: 600 }}>Dias úteis</th>
                <th style={{ padding: "8px 16px", fontWeight: 600 }}>Dias trab.</th>
                <th style={{ padding: "8px 16px" }}></th>
              </tr>
            </thead>
            <tbody>
              {competencias.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: "1px solid var(--border)", backgroundColor: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)" }}>
                  <td style={{ padding: "10px 16px", fontWeight: 600, color: "var(--fg)" }}>{MESES[c.mes - 1]} {c.ano}</td>
                  <td style={{ padding: "10px 16px", color: "var(--fg)" }}>{c.metaCancelamentos ?? "—"}</td>
                  <td style={{ padding: "10px 16px", color: "var(--fg)" }}>{formatarReais(c.orcamentoComissaoCents)}</td>
                  <td style={{ padding: "10px 16px", color: "var(--fg)" }}>{c.baseAtivosTotal?.toLocaleString("pt-BR") ?? "—"}</td>
                  <td style={{ padding: "10px 16px", color: "var(--fg)" }}>{c.diasUteis ?? "—"}</td>
                  <td style={{ padding: "10px 16px", color: "var(--fg)" }}>{c.diasTrabalhados ?? "—"}</td>
                  <td style={{ padding: "10px 16px" }}>
                    <button
                      onClick={() => setEditando(c)}
                      style={{ padding: "4px 12px", border: "1px solid var(--border-strong)", borderRadius: 6, background: "var(--surface)", color: "var(--fg-secondary)", cursor: "pointer", fontSize: 13 }}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {criando && (
        <FormCompetencia
          onSucesso={handleSucessoCriacao}
          onCancelar={() => setCriando(false)}
        />
      )}

      {editando && (
        <FormCompetencia
          competencia={editando}
          onSucesso={handleSucessoEdicao}
          onCancelar={() => setEditando(null)}
        />
      )}

      {toast && <Toast mensagem={toast} onClose={() => setToast(null)} />}
    </>
  );
}