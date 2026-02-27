"use client";

import { useState } from "react";
import { FormNovaSolicitacao } from "./form-nova-solicitacao";
import { Toast } from "@/app/toast";
import type { CidadeOption } from "@/lib/retencao";

interface Props {
  competenciaId: string | null;
  cidades: CidadeOption[];
}

export function BotaoNovaSolicitacao({ competenciaId, cidades }: Props) {
  const [aberto, setAberto] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function handleSucesso() {
    setAberto(false);
    setToast("Solicitação criada com sucesso!");
  }

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
          cidades={cidades}
          onSucesso={handleSucesso}
          onCancelar={() => setAberto(false)}
        />
      )}

      {toast && <Toast mensagem={toast} onClose={() => setToast(null)} />}
    </>
  );
}