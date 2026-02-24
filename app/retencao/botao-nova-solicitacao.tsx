"use client";

import { useState } from "react";
import { FormNovaSolicitacao } from "./form-nova-solicitacao";

export function BotaoNovaSolicitacao() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        style={{
          padding: "8px 18px",
          border: "none",
          borderRadius: 6,
          background: "#2563eb",
          color: "#fff",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        + Nova Solicitação
      </button>

      {aberto && (
        <FormNovaSolicitacao
          onSucesso={() => setAberto(false)}
          onCancelar={() => setAberto(false)}
        />
      )}
    </>
  );
}