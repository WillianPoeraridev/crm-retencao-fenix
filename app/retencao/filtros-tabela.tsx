"use client";

import { useState, useMemo } from "react";
import type { SolicitacaoComAtendente } from "@/lib/retencao";
import { TabelaSolicitacoes } from "./tabela-solicitacoes";

const STATUS_OPCOES = [
  ["", "Todos os status"],
  ["CANCELADO", "Cancelado"],
  ["RETIDO", "Retido"],
  ["INADIMPLENCIA", "Inadimplência"],
] as const;

const INPUT: React.CSSProperties = {
  padding: "7px 10px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 13,
  color: "#111827",
  backgroundColor: "#fff",
  outline: "none",
};

interface Props {
  solicitacoes: SolicitacaoComAtendente[];
}

export function FiltrosTabela({ solicitacoes }: Props) {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");
  const [atendenteId, setAtendenteId] = useState("");

  // Monta lista de atendentes únicos a partir dos dados
  const atendentes = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const s of solicitacoes) {
      mapa.set(s.atendente.id, s.atendente.name);
    }
    return Array.from(mapa.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [solicitacoes]);

  // Filtra o array em memória
  const filtradas = useMemo(() => {
    return solicitacoes.filter((s) => {
      if (busca && !s.nomeCliente.toLowerCase().includes(busca.toLowerCase())) return false;
      if (status && s.status !== status) return false;
      if (atendenteId && s.atendente.id !== atendenteId) return false;
      return true;
    });
  }, [solicitacoes, busca, status, atendenteId]);

  const temFiltroAtivo = busca || status || atendenteId;

  function limpar() {
    setBusca("");
    setStatus("");
    setAtendenteId("");
  }

  return (
    <div>
      {/* Barra de filtros */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 12,
          padding: "10px 14px",
          backgroundColor: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
        }}
      >
        {/* Busca por nome */}
        <input
          style={{ ...INPUT, minWidth: 200, flex: 1 }}
          placeholder="Buscar por nome do cliente..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        {/* Filtro por status */}
        <select
          style={{ ...INPUT, minWidth: 160 }}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {STATUS_OPCOES.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {/* Filtro por atendente */}
        <select
          style={{ ...INPUT, minWidth: 160 }}
          value={atendenteId}
          onChange={(e) => setAtendenteId(e.target.value)}
        >
          <option value="">Todos os atendentes</option>
          {atendentes.map(([id, nome]) => (
            <option key={id} value={id}>{nome}</option>
          ))}
        </select>

        {/* Contador + limpar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          <span style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>
            {filtradas.length} de {solicitacoes.length} registro{solicitacoes.length !== 1 ? "s" : ""}
          </span>
          {temFiltroAtivo && (
            <button
              onClick={limpar}
              style={{
                padding: "4px 10px",
                border: "1px solid #d1d5db",
                borderRadius: 5,
                background: "#fff",
                color: "#6b7280",
                cursor: "pointer",
                fontSize: 12,
                whiteSpace: "nowrap",
              }}
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabela filtrada */}
      <TabelaSolicitacoes solicitacoes={filtradas} />
    </div>
  );
}