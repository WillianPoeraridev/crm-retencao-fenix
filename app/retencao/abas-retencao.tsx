"use client";

import { useState } from "react";

type Aba = "tabela" | "informacoes";

interface Props {
  children: [React.ReactNode, React.ReactNode]; // [tabela, informacoes]
}

export function AbasRetencao({ children }: Props) {
  const [aba, setAba] = useState<Aba>("tabela");

  return (
    <div>
      {/* Botões de aba */}
      <div style={{ display: "flex", gap: 4, borderBottom: "2px solid #e5e7eb", marginBottom: 20 }}>
        <BotaoAba
          label="Tabela"
          ativa={aba === "tabela"}
          onClick={() => setAba("tabela")}
        />
        <BotaoAba
          label="Informações"
          ativa={aba === "informacoes"}
          onClick={() => setAba("informacoes")}
        />
      </div>

      {/* Conteúdo */}
      <div style={{ display: aba === "tabela" ? "block" : "none" }}>
        {children[0]}
      </div>
      <div style={{ display: aba === "informacoes" ? "block" : "none" }}>
        {children[1]}
      </div>
    </div>
  );
}

function BotaoAba({
  label,
  ativa,
  onClick,
}: {
  label: string;
  ativa: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 20px",
        border: "none",
        borderBottom: ativa ? "2px solid #2563eb" : "2px solid transparent",
        marginBottom: -2,
        background: "transparent",
        cursor: "pointer",
        fontSize: 14,
        fontWeight: ativa ? 700 : 400,
        color: ativa ? "#2563eb" : "#6b7280",
        transition: "color 0.15s",
      }}
    >
      {label}
    </button>
  );
}