"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CIDADES = [
  ["CACHOEIRINHA", "Cachoeirinha"],
  ["GRAVATAI", "Gravataí"],
  ["TRAMANDAI", "Tramandaí"],
  ["IMBE", "Imbé"],
  ["CIDREIRA", "Cidreira"],
  ["OSORIO", "Osório"],
  ["SAO_LEOPOLDO", "São Leopoldo"],
  ["NOVO_HAMBURGO", "Novo Hamburgo"],
  ["IVOTI", "Ivoti"],
  ["TAQUARA", "Taquara"],
  ["IGREJINHA", "Igrejinha"],
  ["PAROBE", "Parobé"],
  ["ESTANCIA_VELHA", "Estância Velha"],
  ["DOIS_IRMAOS", "Dois Irmãos"],
  ["CAMPO_BOM", "Campo Bom"],
  ["SAPUCAIA", "Sapucaia do Sul"],
  ["ESTEIO", "Esteio"],
  ["CANOAS", "Canoas"],
  ["PORTO_ALEGRE", "Porto Alegre"],
  ["VIAMAO", "Viamão"],
  ["ALVORADA", "Alvorada"],
] as const;

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

const CAMPO: React.CSSProperties = {
  display: "grid",
  gap: 4,
  marginBottom: 12,
};

const LABEL: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
};

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

const GRID2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
};

interface Props {
  onSucesso: () => void;
  onCancelar: () => void;
}

export function FormNovaSolicitacao({ onSucesso, onCancelar }: Props) {
  const router = useRouter();

  const [form, setForm] = useState({
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
  });

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      const res = await fetch("/api/retencao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error ?? "Erro ao salvar. Tente novamente.");
        return;
      }

      router.refresh(); // recarrega os dados do Server Component
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
          Nova Solicitação
        </h2>

        <form onSubmit={onSubmit}>
          {/* Cliente */}
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

          {/* Localização */}
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
                {CIDADES.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
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

          {/* Status e Motivo */}
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
            <div style={CAMPO}>
              <label style={LABEL}>Motivo do cancelamento</label>
              <select
                style={INPUT}
                value={form.motivo}
                onChange={(e) => set("motivo", e.target.value)}
              >
                <option value="">Selecione...</option>
                {MOTIVOS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Retirada */}
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

          {/* Observações */}
          <div style={CAMPO}>
            <label style={LABEL}>Observações</label>
            <textarea
              style={{ ...INPUT, minHeight: 72, resize: "vertical" }}
              value={form.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
              placeholder="Detalhes relevantes sobre o caso..."
            />
          </div>

          {/* Erro */}
          {erro && (
            <p style={{ color: "#b91c1c", fontSize: 13, marginBottom: 12 }}>{erro}</p>
          )}

          {/* Ações */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button
              type="button"
              onClick={onCancelar}
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
              Cancelar
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
              {enviando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}