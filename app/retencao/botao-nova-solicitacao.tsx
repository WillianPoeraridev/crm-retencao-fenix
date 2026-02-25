"use client";

import { useState } from "react";
import { FormNovaSolicitacao } from "./form-nova-solicitacao";

interface Props {
  competenciaId: string | null;
}

export function BotaoNovaSolicitacao({ competenciaId }: Props) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        disabled={!competenciaId}
        style={{
          padding: "8px 18px",
          border: "none",
          borderRadius: 6,
          background: competenciaId ? "#2563eb" : "#9ca3af",
          color: "#fff",
          cursor: competenciaId ? "pointer" : "not-allowed",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        + Nova Solicitação
      </button>

      {aberto && competenciaId && (
        <FormNovaSolicitacao
          competenciaId={competenciaId}
          onSucesso={() => setAberto(false)}
          onCancelar={() => setAberto(false)}
        />
      )}
    </>
  );
}