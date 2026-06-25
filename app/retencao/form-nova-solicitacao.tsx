"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CidadeOption } from "@/lib/retencao";
import type { RascunhoSolicitacao } from "./botao-nova-solicitacao";
import {
  formatCpfCnpj,
  isValidCpfCnpj,
  normalizeCpfCnpj,
} from "@/lib/validators/cpf-cnpj";

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
const LABEL: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "var(--fg-secondary)" };
const INPUT: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid var(--border-strong)",
  borderRadius: 6,
  fontSize: 14,
  width: "100%",
  boxSizing: "border-box",
  color: "var(--fg)",
  backgroundColor: "var(--surface)",
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
  dataRegistro: Date;
  registradoIXC: boolean;
  transbordo: string | null;
  ticketCents: number | null;
  customerId?: string | null;
}

interface Props {
  competenciaId?: string;
  cidades: CidadeOption[];
  rascunho?: RascunhoSolicitacao;
  solicitacao?: Solicitacao;
  ano?: number;
  mes?: number;
  onSucesso: () => void;
  onFechar?: (formAtual: RascunhoSolicitacao) => void;
  onDescartar?: () => void;
  onCancelar?: () => void;
}

// Estado do CPF/CNPJ — discriminated union pra UI saber qual badge mostrar
type CpfStatus =
  | { tipo: "idle" }
  | { tipo: "checking" }
  | { tipo: "invalid"; mensagem: string }
  | {
      tipo: "found";
      customerId: string;
      nome: string;
      contatoPrimario: string | null;
      counts: { vendas: number; leads: number; solicitacoes: number };
    }
  | { tipo: "new" };

const MESES_ABREV = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

function mesAnteriorLabel(ano: number, mes: number): string {
  if (mes === 1) return `transbordo DEZ/${ano - 1}`;
  return `transbordo ${MESES_ABREV[mes - 2]}`;
}

function formatarDataParaInput(data: Date | null): string {
  if (!data) return "";
  const d = new Date(data);
  return d.toISOString().split("T")[0];
}

function formTemDados(f: RascunhoSolicitacao): boolean {
  return Object.values(f).some((v) => v.trim() !== "" && v !== "true");
}

export function FormNovaSolicitacao({
  competenciaId,
  cidades,
  rascunho,
  solicitacao,
  ano,
  mes,
  onSucesso,
  onFechar,
  onDescartar,
  onCancelar,
}: Props) {
  const router = useRouter();
  const ehEdicao = !!solicitacao;

  const [form, setForm] = useState<RascunhoSolicitacao>({
    cpfCnpj: rascunho?.cpfCnpj ?? "",
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
    registradoIXC: solicitacao
      ? (solicitacao.registradoIXC ? "true" : "")
      : (rascunho?.registradoIXC ?? "true"),
    transbordo: solicitacao?.transbordo ?? rascunho?.transbordo ?? "",
    dataRegistro: solicitacao
      ? formatarDataParaInput(solicitacao.dataRegistro)
      : rascunho?.dataRegistro ?? new Date().toISOString().split("T")[0],
    ticket: solicitacao?.ticketCents != null
      ? (solicitacao.ticketCents / 100).toFixed(2).replace(".", ",")
      : (rascunho?.ticket ?? ""),
  });

  const [cpfStatus, setCpfStatus] = useState<CpfStatus>({ tipo: "idle" });
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
      // Quando desmarca IXC → preenche transbordo automaticamente
      if (field === "registradoIXC") {
        if (value === "" && ano && mes) {
          next.transbordo = mesAnteriorLabel(ano, mes);
        } else if (value === "true") {
          // Limpa transbordo automático ao remarcar (só se ainda for o label gerado)
          if (ano && mes && next.transbordo === mesAnteriorLabel(ano, mes)) {
            next.transbordo = "";
          }
        }
      }
      return next;
    });
  }

  // Lookup no Customer master quando o usuário sai do campo CPF/CNPJ
  async function handleCpfBlur() {
    const raw = form.cpfCnpj.trim();
    if (!raw) {
      setCpfStatus({ tipo: "idle" });
      return;
    }
    if (!isValidCpfCnpj(raw)) {
      setCpfStatus({ tipo: "invalid", mensagem: "CPF/CNPJ inválido" });
      return;
    }
    setCpfStatus({ tipo: "checking" });
    try {
      const res = await fetch("/api/customer/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpfCnpj: raw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCpfStatus({ tipo: "invalid", mensagem: data.error ?? "Erro ao consultar" });
        return;
      }
      if (data.found) {
        setCpfStatus({
          tipo: "found",
          customerId: data.id,
          nome: data.nome,
          contatoPrimario: data.contatoPrimario,
          counts: data.counts,
        });
        // Autopreenche nome/contato apenas se ainda estiverem vazios (não sobrescreve o que o atendente digitou)
        setForm((prev) => ({
          ...prev,
          nomeCliente: prev.nomeCliente.trim() ? prev.nomeCliente : data.nome,
          contato: prev.contato.trim() ? prev.contato : (data.contatoPrimario ?? ""),
        }));
      } else {
        setCpfStatus({ tipo: "new" });
      }
    } catch {
      setCpfStatus({ tipo: "invalid", mensagem: "Erro de conexão ao consultar cliente" });
    }
  }

  // Sempre que o usuário edita o CPF, volta pra "idle" — força novo lookup no blur seguinte
  function setCpf(value: string) {
    setForm((prev) => ({ ...prev, cpfCnpj: value }));
    setCpfStatus({ tipo: "idle" });
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
      // 1. Resolve customerId se o atendente preencheu o CPF
      let customerId: string | null = null;
      const cpfRaw = form.cpfCnpj.trim();
      if (cpfRaw) {
        if (!isValidCpfCnpj(cpfRaw)) {
          setErro("CPF/CNPJ inválido. Corrija ou deixe em branco.");
          return;
        }
        if (cpfStatus.tipo === "found") {
          customerId = cpfStatus.customerId;
        } else {
          // Não houve onBlur ainda OU foi cliente novo — chama o endpoint passando o nome pra criar
          const lookupRes = await fetch("/api/customer/lookup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cpfCnpj: cpfRaw,
              nome: form.nomeCliente.trim(),
              contatoPrimario: form.contato.trim() || null,
            }),
          });
          const lookupData = await lookupRes.json();
          if (!lookupRes.ok || !lookupData.found) {
            setErro(lookupData.error ?? "Não foi possível registrar o cliente.");
            return;
          }
          customerId = lookupData.id;
        }
      }

      const url = ehEdicao ? `/api/retencao/${solicitacao.id}` : "/api/retencao";
      const method = ehEdicao ? "PATCH" : "POST";

      // Converte "99,90" / "99.90" → 9990 (centavos). Vazio/inválido = null.
      const ticketLimpo = form.ticket.replace(/[R$\s]/g, "").replace(",", ".");
      const ticketNum = parseFloat(ticketLimpo);
      const ticketCents = ticketLimpo && !isNaN(ticketNum) ? Math.round(ticketNum * 100) : null;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          cpfCnpj: cpfRaw ? normalizeCpfCnpj(cpfRaw) : "",
          customerId,
          registradoIXC: form.registradoIXC === "true",
          ticketCents,
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
          backgroundColor: "var(--surface)",
          borderRadius: 10,
          padding: 28,
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "var(--fg)" }}>
          {ehEdicao ? "Editar Solicitação" : "Nova Solicitação"}
        </h2>

        <form onSubmit={onSubmit}>
          <div style={CAMPO}>
            <label style={LABEL}>CPF / CNPJ</label>
            <input
              style={{
                ...INPUT,
                border:
                  cpfStatus.tipo === "invalid" ? "1px solid var(--danger)" :
                  cpfStatus.tipo === "found" ? "1px solid var(--success)" :
                  cpfStatus.tipo === "new" ? "1px solid var(--primary)" :
                  INPUT.border,
              }}
              value={form.cpfCnpj ? formatCpfCnpj(form.cpfCnpj) : ""}
              onChange={(e) => setCpf(e.target.value)}
              onBlur={handleCpfBlur}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              inputMode="numeric"
              autoComplete="off"
            />
            <CpfStatusBadge status={cpfStatus} />
          </div>

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

          <div style={CAMPO}>
            <label style={LABEL}>Data do atendimento *</label>
            <input
              style={INPUT}
              type="date"
              value={form.dataRegistro}
              onChange={(e) => set("dataRegistro", e.target.value)}
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
                  style={{ ...INPUT, backgroundColor: "var(--border)", color: "var(--fg-muted)" }}
                  value="90 + Inadimplência"
                  disabled
                />
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div style={CAMPO}>
              <label style={LABEL}>Ticket do cliente (R$)</label>
              <input
                style={INPUT}
                value={form.ticket}
                onChange={(e) => set("ticket", e.target.value)}
                placeholder="99,90"
                inputMode="decimal"
              />
            </div>
            <div style={CAMPO}>
              <label style={LABEL}>Situação da retirada</label>
              <select
                style={INPUT}
                value={form.retiradaTexto}
                onChange={(e) => set("retiradaTexto", e.target.value)}
              >
                <option value="">—</option>
                <option value="Retirar">Retirar</option>
                <option value="Sem retirada">Sem retirada</option>
              </select>
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

          <div style={GRID2}>
            <div style={CAMPO}>
              <label style={LABEL}>Transbordo</label>
              <input
                style={INPUT}
                value={form.transbordo}
                onChange={(e) => set("transbordo", e.target.value)}
                placeholder="Ex: transbordo FEV"
              />
            </div>
            <div style={{ ...CAMPO, justifyContent: "flex-end" }}>
              <label style={LABEL}>Registrado IXC</label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={form.registradoIXC === "true"}
                  onChange={(e) => set("registradoIXC", e.target.checked ? "true" : "")}
                  style={{ width: 16, height: 16, cursor: "pointer" }}
                />
                <span style={{ fontSize: 14, color: "var(--fg-secondary)" }}>SIM</span>
              </label>
            </div>
          </div>

          {erro && (
            <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12 }}>{erro}</p>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button
              type="button"
              onClick={handleCancelar}
              style={{
                padding: "8px 18px",
                border: "1px solid var(--border-strong)",
                borderRadius: 6,
                background: "var(--surface)",
                color: "var(--fg-secondary)",
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
                background: enviando ? "var(--fg-subtle)" : "var(--primary)",
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

// ============================================================
// Badge condicional que mostra o status do lookup do CPF/CNPJ
// ============================================================
function CpfStatusBadge({ status }: { status: CpfStatus }) {
  const BASE: React.CSSProperties = {
    fontSize: 12,
    marginTop: 4,
    padding: "4px 8px",
    borderRadius: 4,
    display: "inline-block",
  };

  switch (status.tipo) {
    case "idle":
      return null;
    case "checking":
      return <span style={{ ...BASE, background: "var(--border)", color: "var(--fg-muted)" }}>Consultando…</span>;
    case "invalid":
      return <span style={{ ...BASE, background: "var(--danger-bg-strong)", color: "var(--danger-strong)" }}>{status.mensagem}</span>;
    case "new":
      return <span style={{ ...BASE, background: "var(--primary-bg)", color: "var(--info-strong)" }}>Cliente novo — será cadastrado ao salvar</span>;
    case "found": {
      const { vendas, leads, solicitacoes } = status.counts;
      const partes: string[] = [];
      if (vendas) partes.push(`${vendas} venda${vendas > 1 ? "s" : ""}`);
      if (leads) partes.push(`${leads} lead${leads > 1 ? "s" : ""}`);
      if (solicitacoes) partes.push(`${solicitacoes} retenç${solicitacoes > 1 ? "ões" : "ão"}`);
      const resumo = partes.length ? partes.join(" · ") : "sem histórico";
      return (
        <span style={{ ...BASE, background: "var(--success-bg)", color: "var(--success)" }}>
          ✓ Cliente conhecido ({resumo})
        </span>
      );
    }
  }
}
