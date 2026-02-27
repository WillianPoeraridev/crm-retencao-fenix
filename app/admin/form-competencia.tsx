"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MESES = [
  [1, "Janeiro"], [2, "Fevereiro"], [3, "Março"], [4, "Abril"],
  [5, "Maio"], [6, "Junho"], [7, "Julho"], [8, "Agosto"],
  [9, "Setembro"], [10, "Outubro"], [11, "Novembro"], [12, "Dezembro"],
] as const;

interface Competencia {
  id: string;
  ano: number;
  mes: number;
  metaCancelamentos: number | null;
  orcamentoComissaoCents: number | null;
  baseAtivosTotal: number | null;
  diasUteis: number | null;
  diasTrabalhados: number | null;
  metaDiariaManual: number | null;
}

interface Props {
  competencia?: Competencia;
  onSucesso: () => void;
  onCancelar: () => void;
}

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
const HINT: React.CSSProperties = { fontSize: 11, color: "#9ca3af", marginTop: 2 };

export function FormCompetencia({ competencia, onSucesso, onCancelar }: Props) {
  const router = useRouter();
  const anoAtual = new Date().getFullYear();
  const ehEdicao = !!competencia;

  const [form, setForm] = useState({
    ano: competencia?.ano.toString() ?? anoAtual.toString(),
    mes: competencia?.mes.toString() ?? "",
    metaCancelamentos: competencia?.metaCancelamentos?.toString() ?? "",
    orcamentoComissao: competencia?.orcamentoComissaoCents
      ? (competencia.orcamentoComissaoCents / 100).toString()
      : "",
    baseAtivosTotal: competencia?.baseAtivosTotal?.toString() ?? "",
    diasUteis: competencia?.diasUteis?.toString() ?? "",
    diasTrabalhados: competencia?.diasTrabalhados?.toString() ?? "",
    metaDiariaManual: competencia?.metaDiariaManual?.toString() ?? "",
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
      const url = ehEdicao ? `/api/competencia/${competencia.id}` : "/api/competencia";
      const method = ehEdicao ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ano: form.ano,
          mes: form.mes,
          metaCancelamentos: form.metaCancelamentos,
          orcamentoComissaoCents: form.orcamentoComissao,
          baseAtivosTotal: form.baseAtivosTotal,
          diasUteis: form.diasUteis,
          diasTrabalhados: form.diasTrabalhados,
          metaDiariaManual: form.metaDiariaManual,
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
      onClick={onCancelar}
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
          maxWidth: 520,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "#111827" }}>
          {ehEdicao ? "Editar Competência" : "Nova Competência"}
        </h2>

        <form onSubmit={onSubmit}>
          {!ehEdicao && (
            <div style={GRID2}>
              <div style={CAMPO}>
                <label style={LABEL}>Mês *</label>
                <select style={INPUT} value={form.mes} onChange={(e) => set("mes", e.target.value)} required>
                  <option value="">Selecione...</option>
                  {MESES.map(([valor, nome]) => (
                    <option key={valor} value={valor}>{nome}</option>
                  ))}
                </select>
              </div>
              <div style={CAMPO}>
                <label style={LABEL}>Ano *</label>
                <input style={INPUT} type="number" value={form.ano} onChange={(e) => set("ano", e.target.value)} min={2020} max={2100} required />
              </div>
            </div>
          )}

          {ehEdicao && (
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
              Editando: <strong style={{ color: "#111827" }}>{MESES.find(([v]) => v === competencia.mes)?.[1]} {competencia.ano}</strong>
            </p>
          )}

          <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 14, marginBottom: 4 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Metas</p>
          </div>

          <div style={GRID2}>
            <div style={CAMPO}>
              <label style={LABEL}>Meta de cancelamentos</label>
              <input style={INPUT} type="number" value={form.metaCancelamentos} onChange={(e) => set("metaCancelamentos", e.target.value)} placeholder="ex: 220" min={0} />
            </div>
            <div style={CAMPO}>
              <label style={LABEL}>Meta diária (manual)</label>
              <input style={INPUT} type="number" value={form.metaDiariaManual} onChange={(e) => set("metaDiariaManual", e.target.value)} placeholder="ex: 9" min={0} />
            </div>
          </div>

          <div style={GRID2}>
            <div style={CAMPO}>
              <label style={LABEL}>Dias úteis</label>
              <input style={INPUT} type="number" value={form.diasUteis} onChange={(e) => set("diasUteis", e.target.value)} placeholder="ex: 24" min={0} />
            </div>
            <div style={CAMPO}>
              <label style={LABEL}>Dias trabalhados</label>
              <input style={INPUT} type="number" value={form.diasTrabalhados} onChange={(e) => set("diasTrabalhados", e.target.value)} placeholder="ex: 19" min={0} />
            </div>
          </div>

          <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 14, marginBottom: 4 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Financeiro</p>
          </div>

          <div style={GRID2}>
            <div style={CAMPO}>
              <label style={LABEL}>Orçamento de comissão (R$)</label>
              <input style={INPUT} type="number" step="0.01" value={form.orcamentoComissao} onChange={(e) => set("orcamentoComissao", e.target.value)} placeholder="ex: 2000.00" min={0} />
              <span style={HINT}>Valor em reais (ex: 2000.00)</span>
            </div>
            <div style={CAMPO}>
              <label style={LABEL}>Base de clientes ativos</label>
              <input style={INPUT} type="number" value={form.baseAtivosTotal} onChange={(e) => set("baseAtivosTotal", e.target.value)} placeholder="ex: 19554" min={0} />
            </div>
          </div>

          {erro && <p style={{ color: "#b91c1c", fontSize: 13, marginBottom: 12 }}>{erro}</p>}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
            <button type="button" onClick={onCancelar} style={{ padding: "8px 18px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", color: "#374151", cursor: "pointer", fontSize: 14 }}>Cancelar</button>
            <button type="submit" disabled={enviando} style={{ padding: "8px 18px", border: "none", borderRadius: 6, background: enviando ? "#9ca3af" : "#2563eb", color: "#fff", cursor: enviando ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600 }}>{enviando ? "Salvando..." : ehEdicao ? "Salvar alterações" : "Criar competência"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}