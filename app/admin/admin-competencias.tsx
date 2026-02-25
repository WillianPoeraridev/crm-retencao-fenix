"use client";

import { useState } from "react";
import { FormCompetencia } from "./form-competencia";

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

  function formatarReais(cents: number | null) {
    if (cents == null) return "—";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  }

  return (
    <>
      {/* Seção de competências */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {/* Header da seção */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            backgroundColor: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
            Competências ({competencias.length})
          </h2>
          <button
            onClick={() => setCriando(true)}
            style={{
              padding: "6px 14px",
              border: "none",
              borderRadius: 6,
              background: "#2563eb",
              color: "#fff",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            + Nova competência
          </button>
        </div>

        {/* Lista */}
        {competencias.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "#6b7280", fontSize: 14 }}>
            Nenhuma competência cadastrada ainda.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ backgroundColor: "#111827", color: "#fff", textAlign: "left" }}>
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
                <tr
                  key={c.id}
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb",
                  }}
                >
                  <td style={{ padding: "10px 16px", fontWeight: 600, color: "#111827" }}>
                    {MESES[c.mes - 1]} {c.ano}
                  </td>
                  <td style={{ padding: "10px 16px", color: "#111827" }}>
                    {c.metaCancelamentos ?? "—"}
                  </td>
                  <td style={{ padding: "10px 16px", color: "#111827" }}>
                    {formatarReais(c.orcamentoComissaoCents)}
                  </td>
                  <td style={{ padding: "10px 16px", color: "#111827" }}>
                    {c.baseAtivosTotal?.toLocaleString("pt-BR") ?? "—"}
                  </td>
                  <td style={{ padding: "10px 16px", color: "#111827" }}>
                    {c.diasUteis ?? "—"}
                  </td>
                  <td style={{ padding: "10px 16px", color: "#111827" }}>
                    {c.diasTrabalhados ?? "—"}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <button
                      onClick={() => setEditando(c)}
                      style={{
                        padding: "4px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: 6,
                        background: "#fff",
                        color: "#374151",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
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

      {/* Modais */}
      {criando && (
        <FormCompetencia
          onSucesso={() => setCriando(false)}
          onCancelar={() => setCriando(false)}
        />
      )}

      {editando && (
        <FormCompetencia
          competencia={editando}
          onSucesso={() => setEditando(null)}
          onCancelar={() => setEditando(null)}
        />
      )}
    </>
  );
}