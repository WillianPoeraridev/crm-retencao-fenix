"use client";

import { useState, useCallback } from "react";
import { FormNovaSolicitacao } from "./form-nova-solicitacao";
import { Toast } from "@/app/toast";
import type { CidadeOption } from "@/lib/retencao";

export interface RascunhoSolicitacao {
  cpfCnpj: string; // só dígitos; UI mostra com máscara
  nomeCliente: string;
  contato: string;
  bairro: string;
  cidade: string;
  regiaoId: string;
  status: string;
  motivo: string;
  observacoes: string;
  retiradaTexto: string;
  agendaRetirada: string;
  registradoIXC: string; // "true" | ""
  transbordo: string;
  dataRegistro: string; // formato yyyy-mm-dd
  ticket: string; // valor do plano em R$ (ex: "99,90")
}

const RASCUNHO_VAZIO: RascunhoSolicitacao = {
  cpfCnpj: "",
  nomeCliente: "",
  contato: "",
  bairro: "",
  cidade: "",
  regiaoId: "",
  status: "",
  motivo: "",
  observacoes: "",
  retiradaTexto: "",
  agendaRetirada: "",
  registradoIXC: "true",
  transbordo: "",
  dataRegistro: new Date().toISOString().split("T")[0],
  ticket: "",
};

function rascunhoTemDados(r: RascunhoSolicitacao): boolean {
  return Object.values(r).some((v) => v.trim() !== "" && v !== "true");
}

interface Props {
  competenciaId: string | null;
  cidades: CidadeOption[];
  ano: number;
  mes: number;
}

export function BotaoNovaSolicitacao({ competenciaId, cidades, ano, mes }: Props) {
  const [aberto, setAberto] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState<RascunhoSolicitacao>(RASCUNHO_VAZIO);

  function handleSucesso() {
    setAberto(false);
    setRascunho(RASCUNHO_VAZIO);
    setToast("Solicitação criada com sucesso!");
  }

  const handleFechar = useCallback((formAtual: RascunhoSolicitacao) => {
    setRascunho(formAtual);
    setAberto(false);
  }, []);

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
            background: competenciaId ? "var(--primary-solid)" : "var(--fg-subtle)",
            color: "#fff",
            cursor: competenciaId ? "pointer" : "not-allowed",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          + Nova Solicitação
        </button>

        {temRascunho && !aberto && (
          <span style={{ fontSize: 12, color: "var(--warning-strong)", fontWeight: 500 }}>
            ● rascunho salvo
          </span>
        )}
      </div>

      {aberto && competenciaId && (
        <FormNovaSolicitacao
          competenciaId={competenciaId}
          cidades={cidades}
          rascunho={rascunho}
          ano={ano}
          mes={mes}
          onSucesso={handleSucesso}
          onFechar={handleFechar}
          onDescartar={handleDescartar}
        />
      )}

      {toast && <Toast mensagem={toast} onClose={() => setToast(null)} />}
    </>
  );
}