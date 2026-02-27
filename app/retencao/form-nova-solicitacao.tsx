"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CidadeOption } from "@/lib/retencao";
import type { RascunhoSolicitacao } from "./botao-nova-solicitacao";

const REGIOES = [
  ["SINOS", "Sinos"],
  ["LITORAL", "Litoral"],
  ["MATRIZ", "Matriz"],
] as const;

const MOTIVOS = [
  ["INSATISFACAO_ATD", "Insatisfação com Atendimento"],
  ["INSATISFACAO_SERVICO", "Insatisfação com Serviço"],
  ["MUDANCA_ENDERECO", "Mudança de Endereço"],
  ["MOTIVOS_PESSOAIS", "Motivos Pessoais"],
  ["TROCA_PROVEDOR", "Troca de Provedor"],
  ["PROBLEMAS_FINANC", "Problemas Financeiros"],
  ["OUTROS", "Outros"],
] as const;

const STATUS = [
  ["CANCELADO", "Cancelado"],
  ["RETIDO", "Retido"],
  ["INADIMPLENCIA", "Inadimplência"],
] as const;

const CAMPO: React.CSSProperties = { display: "grid", gap: 4, marginBottom: 12 };
const LABEL: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "#374151" };
const INPUT: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 14,
  width: "100%",
  boxSizing: "border-box",
  color: "#111827",
  backgroundColor: "#fff",
};
const GRID2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };

interface Solicitacao {
  id: string;
  nomeCliente: string;
  contato: string | null;
  bairro: string | null;
  cidade: string;
  regiao: string;
  status: string;
  motivo: string | null;
  observacoes: string | null;
  retiradaTexto: string | null;
  agendaRetirada: Date | null;
}

interface Props {
  competenciaId?: string;
  cidades: CidadeOption[];
  rascunho?: RascunhoSolicitacao;
  solicitacao?: Solicitacao;
  onSucesso: () => void;
  onFechar?: (formAtual: RascunhoSolicitacao) => void;  // criação: salva rascunho
  onDescartar?: () => void;                               // criação: descarta rascunho
  onCancelar?: () => void;                                // edição: fecha simples
}

function formatarDataParaInput(data: Date | null): string {
  if (!data) return "";
  const d = new Date(data);
  return d.toISOString().split("T")[0];
}

function formTemDados(f: RascunhoSolicitacao): boolean {
  return Object.values(f).some((v) => v.trim() !== "");
}

export function FormNovaSolicitacao({
  competenciaId,
  cidades,
  rascunho,
  solicitacao,
  onSucesso,
  onFechar,
  onDescartar,
  onCancelar,
}: Props) {
  const router = useRouter();
  const ehEdicao = !!solicitacao;

  const [form, setForm] = useState<RascunhoSolicitacao>({
    nomeCliente: solicitacao?.nomeCliente ?? rascunho?.nomeCliente ?? "",
    contato: solicitacao?.contato ?? rascunho?.contato ?? "",
    bairro: solicitacao?.bairro ?? rascunho?.bairro ?? "",
    cidade: solicitacao?.cidade ?? rascunho?.cidade ?? "",
    regiao: solicitacao?.regiao ?? rascunho?.regiao ?? "",
    status: solicitacao?.status ?? rascunho?.status ?? "",
    motivo: solicitacao?.motivo ?? rascunho?.motivo ?? "",
    observacoes: solicitacao?.observacoes ?? rascunho?.observacoes ?? "",
    retiradaTexto: solicitacao?.retiradaTexto ?? rascunho?.retiradaTexto ?? "",
    agendaRetirada: solicitacao
      ? formatarDataParaInput(solicitacao.agendaRetirada)
      : rascunho?.agendaRetirada ?? "",
  });

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "status") {
        if (value === "INADIMPLENCIA") {
          next.motivo = "INADIMPLENCIA_90";
        } else if (prev.status === "INADIMPLENCIA") {
          next.motivo = "";
        }
      }
      return next;
    });
  }

  // Fecha o modal — na criação, salva rascunho; na edição, fecha direto
  function handleFecharModal() {
    if (ehEdicao) {
      onCancelar?.();
      return;
    }

    // Se tem dados, salva como rascunho silenciosamente
    if (formTemDados(form)) {
      onFechar?.(form);
    } else {
      onDescartar?.();
    }
  }

  // Botão Cancelar explícito — pergunta se quer descartar quando tem dados
  function handleCancelar() {
    if (ehEdicao) {
      onCancelar?.();
      return;
    }

    if (formTemDados(form)) {
      if (confirm("Deseja descartar o rascunho? Os dados preenchidos serão perdidos.")) {
        onDescartar?.();
      }
    } else {
      onDescartar?.();
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      const url = ehEdicao ? `/api/retencao/${solicitacao.id}` : "/api/retencao";
      const method = ehEdicao ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ...(ehEdicao ? {} : { competenciaId }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error ?? "Erro ao salvar. Tente novamente.");
        return;
      }

      router.refresh();
      onSucesso();
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      onClick={handleFecharModal}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#fff",
          borderRadius: 10,
          padding: 28,
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "#111827" }}>
          {ehEdicao ? "Editar Solicitação" : "Nova Solicitação"}
        </h2>

        <form onSubmit={onSubmit}>
          <div style={CAMPO}>
            <label style={LABEL}>Nome do cliente *</label>
            <input
              style={INPUT}
              value={form.nomeCliente}
              onChange={(e) => set("nomeCliente", e.target.value)}
              placeholder="Nome completo"
              required
            />
          </div>

          <div style={GRID2}>
            <div style={CAMPO}>
              <label style={LABEL}>Contato</label>
              <input
                style={INPUT}
                value={form.contato}
                onChange={(e) => set("contato", e.target.value)}
                placeholder="(51) 99999-0000"
              />
            </div>
            <div style={CAMPO}>
              <label style={LABEL}>Bairro</label>
              <input
                style={INPUT}
                value={form.bairro}
                onChange={(e) => set("bairro", e.target.value)}
                placeholder="Bairro"
              />
            </div>
          </div>

          <div style={GRID2}>
            <div style={CAMPO}>
              <label style={LABEL}>Cidade *</label>
              <select
                style={INPUT}
                value={form.cidade}
                onChange={(e) => set("cidade", e.target.value)}
                required
              >
                <option value="">Selecione...</option>
                {cidades.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <div style={CAMPO}>
              <label style={LABEL}>Região *</label>
              <select
                style={INPUT}
                value={form.regiao}
                onChange={(e) => set("regiao", e.target.value)}
                required
              >
                <option value="">Selecione...</option>
                {REGIOES.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={GRID2}>
            <div style={CAMPO}>
              <label style={LABEL}>Status *</label>
              <select
                style={INPUT}
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                required
              >
                <option value="">Selecione...</option>
                {STATUS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {form.status === "CANCELADO" && (
              <div style={CAMPO}>
                <label style={LABEL}>Motivo *</label>
                <select
                  style={INPUT}
                  value={form.motivo}
                  onChange={(e) => set("motivo", e.target.value)}
                  required
                >
                  <option value="">Selecione...</option>
                  {MOTIVOS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            )}

            {form.status === "INADIMPLENCIA" && (
              <div style={CAMPO}>
                <label style={LABEL}>Motivo</label>
                <input
                  style={{ ...INPUT, backgroundColor: "#f3f4f6", color: "#6b7280" }}
                  value="90 + Inadimplência"
                  disabled
                />
              </div>
            )}
          </div>

          <div style={GRID2}>
            <div style={CAMPO}>
              <label style={LABEL}>Situação da retirada</label>
              <input
                style={INPUT}
                value={form.retiradaTexto}
                onChange={(e) => set("retiradaTexto", e.target.value)}
                placeholder="Ex: Sem retirada, Entregou em loja..."
              />
            </div>
            <div style={CAMPO}>
              <label style={LABEL}>Agenda de retirada</label>
              <input
                style={INPUT}
                type="date"
                value={form.agendaRetirada}
                onChange={(e) => set("agendaRetirada", e.target.value)}
              />
            </div>
          </div>

          <div style={CAMPO}>
            <label style={LABEL}>Observações</label>
            <textarea
              style={{ ...INPUT, minHeight: 72, resize: "vertical" }}
              value={form.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
              placeholder="Detalhes relevantes sobre o caso..."
            />
          </div>

          {erro && (
            <p style={{ color: "#b91c1c", fontSize: 13, marginBottom: 12 }}>{erro}</p>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button
              type="button"
              onClick={handleCancelar}
              style={{
                padding: "8px 18px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                background: "#fff",
                color: "#374151",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              {ehEdicao ? "Cancelar" : "Descartar"}
            </button>
            <button
              type="submit"
              disabled={enviando}
              style={{
                padding: "8px 18px",
                border: "none",
                borderRadius: 6,
                background: enviando ? "#9ca3af" : "#2563eb",
                color: "#fff",
                cursor: enviando ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {enviando ? "Salvando..." : ehEdicao ? "Salvar alterações" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}