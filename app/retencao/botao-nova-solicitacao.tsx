"use client";

import { useState, useCallback } from "react";
import { FormNovaSolicitacao } from "./form-nova-solicitacao";
import { Toast } from "@/app/toast";
import type { CidadeOption } from "@/lib/retencao";

export interface RascunhoSolicitacao {
  nomeCliente: string;
  contato: string;
  bairro: string;
  cidade: string;
  regiao: string;
  status: string;
  motivo: string;
  observacoes: string;
  retiradaTexto: string;
  agendaRetirada: string;
}

const RASCUNHO_VAZIO: RascunhoSolicitacao = {
  nomeCliente: "",
  contato: "",
  bairro: "",
  cidade: "",
  regiao: "",
  status: "",
  motivo: "",
  observacoes: "",
  retiradaTexto: "",
  agendaRetirada: "",
};

function rascunhoTemDados(r: RascunhoSolicitacao): boolean {
  return Object.values(r).some((v) => v.trim() !== "");
}

interface Props {
  competenciaId: string | null;
  cidades: CidadeOption[];
}

export function BotaoNovaSolicitacao({ competenciaId, cidades }: Props) {
  const [aberto, setAberto] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState<RascunhoSolicitacao>(RASCUNHO_VAZIO);

  function handleSucesso() {
    setAberto(false);
    setRascunho(RASCUNHO_VAZIO);
    setToast("Solicitação criada com sucesso!");
  }

  // Salva o estado atual do form antes de fechar
  const handleFechar = useCallback((formAtual: RascunhoSolicitacao) => {
    setRascunho(formAtual);
    setAberto(false);
  }, []);

  // Descarta o rascunho e fecha
  const handleDescartar = useCallback(() => {
    setRascunho(RASCUNHO_VAZIO);
    setAberto(false);
  }, []);

  const temRascunho = rascunhoTemDados(rascunho);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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

        {temRascunho && !aberto && (
          <span style={{ fontSize: 12, color: "#b45309", fontWeight: 500 }}>
            ● rascunho salvo
          </span>
        )}
      </div>

      {aberto && competenciaId && (
        <FormNovaSolicitacao
          competenciaId={competenciaId}
          cidades={cidades}
          rascunho={rascunho}
          onSucesso={handleSucesso}
          onFechar={handleFechar}
          onDescartar={handleDescartar}
        />
      )}

      {toast && <Toast mensagem={toast} onClose={() => setToast(null)} />}
    </>
  );
}