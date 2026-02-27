"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "@/app/toast";

interface Cidade {
  id: string;
  nome: string;
  isActive: boolean;
}

interface Props {
  cidades: Cidade[];
}

const CAMPO: React.CSSProperties = { display: "grid", gap: 4, marginBottom: 14 };
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

export function AdminCidades({ cidades }: Props) {
  const router = useRouter();
  const [criando, setCriando] = useState(false);
  const [form, setForm] = useState({ id: "", nome: "" });
  const [carregando, setCarregando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function toggleAtivo(id: string, ativo: boolean) {
    setErro(null);
    setCarregando(id);
    try {
      const res = await fetch(`/api/cidades/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !ativo }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error ?? "Erro ao atualizar."); return; }
      router.refresh();
      setToast(ativo ? "Cidade desativada." : "Cidade ativada.");
    } catch {
      setErro("Erro de conexão.");
    } finally {
      setCarregando(null);
    }
  }

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/cidades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error ?? "Erro ao criar cidade."); return; }
      router.refresh();
      setCriando(false);
      setForm({ id: "", nome: "" });
      setToast("Cidade criada com sucesso!");
    } catch {
      setErro("Erro de conexão.");
    } finally {
      setEnviando(false);
    }
  }

  const ativas = cidades.filter((c) => c.isActive).length;

  return (
    <>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
            Cidades ({ativas} ativas de {cidades.length})
          </h2>
          <button
            onClick={() => setCriando(true)}
            style={{ padding: "6px 14px", border: "none", borderRadius: 6, background: "#2563eb", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
          >
            + Nova cidade
          </button>
        </div>

        {erro && (
          <div style={{ padding: "8px 20px", backgroundColor: "#fef2f2", borderBottom: "1px solid #fecaca", color: "#991b1b", fontSize: 13 }}>
            {erro}
          </div>
        )}

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ backgroundColor: "#111827", color: "#fff", textAlign: "left" }}>
              <th style={{ padding: "8px 16px", fontWeight: 600 }}>Código</th>
              <th style={{ padding: "8px 16px", fontWeight: 600 }}>Nome</th>
              <th style={{ padding: "8px 16px", fontWeight: 600 }}>Status</th>
              <th style={{ padding: "8px 16px" }}></th>
            </tr>
          </thead>
          <tbody>
            {cidades.map((c, i) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb", opacity: carregando === c.id ? 0.5 : 1 }}>
                <td style={{ padding: "10px 16px", fontFamily: "monospace", fontSize: 12, color: "#6b7280" }}>{c.id}</td>
                <td style={{ padding: "10px 16px", fontWeight: 500, color: "#111827" }}>{c.nome}</td>
                <td style={{ padding: "10px 16px" }}>
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 10, fontWeight: 600,
                    backgroundColor: c.isActive ? "#dcfce7" : "#fee2e2",
                    color: c.isActive ? "#15803d" : "#b91c1c",
                  }}>
                    {c.isActive ? "Ativa" : "Inativa"}
                  </span>
                </td>
                <td style={{ padding: "10px 16px" }}>
                  <button
                    onClick={() => toggleAtivo(c.id, c.isActive)}
                    disabled={carregando === c.id}
                    style={{ padding: "3px 10px", border: "1px solid #d1d5db", borderRadius: 5, background: "#fff", color: "#374151", cursor: "pointer", fontSize: 12 }}
                  >
                    {c.isActive ? "Desativar" : "Ativar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de criação */}
      {criando && (
        <div
          onClick={() => setCriando(false)}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "#fff", borderRadius: 10, padding: 28, width: "100%", maxWidth: 420 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "#111827" }}>Nova Cidade</h2>
            <form onSubmit={handleCriar}>
              <div style={CAMPO}>
                <label style={LABEL}>Código *</label>
                <input
                  style={INPUT}
                  value={form.id}
                  onChange={(e) => setForm((p) => ({ ...p, id: e.target.value }))}
                  placeholder="Ex: NOVA_CIDADE"
                  required
                />
                <span style={{ fontSize: 11, color: "#9ca3af" }}>Será convertido para maiúsculas com underscores</span>
              </div>
              <div style={CAMPO}>
                <label style={LABEL}>Nome *</label>
                <input
                  style={INPUT}
                  value={form.nome}
                  onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                  placeholder="Ex: Nova Cidade"
                  required
                />
              </div>
              {erro && <p style={{ color: "#b91c1c", fontSize: 13, marginBottom: 12 }}>{erro}</p>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" onClick={() => setCriando(false)} style={{ padding: "8px 18px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", color: "#374151", cursor: "pointer", fontSize: 14 }}>Cancelar</button>
                <button type="submit" disabled={enviando} style={{ padding: "8px 18px", border: "none", borderRadius: 6, background: enviando ? "#9ca3af" : "#2563eb", color: "#fff", cursor: enviando ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600 }}>{enviando ? "Criando..." : "Criar cidade"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast mensagem={toast} onClose={() => setToast(null)} />}
    </>
  );
}