"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

interface Props {
  onSucesso: () => void;
  onCancelar: () => void;
}

export function FormUsuario({ onSucesso, onCancelar }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
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
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error ?? "Erro ao criar usuário.");
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
          maxWidth: 420,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "#111827" }}>
          Novo Atendente
        </h2>

        <form onSubmit={onSubmit}>
          <div style={CAMPO}>
            <label style={LABEL}>Nome *</label>
            <input style={INPUT} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Nome completo" required />
          </div>
          <div style={CAMPO}>
            <label style={LABEL}>Email *</label>
            <input style={INPUT} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="atendente@fenixfibra.com.br" required />
          </div>
          <div style={CAMPO}>
            <label style={LABEL}>Senha provisória *</label>
            <input style={INPUT} type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} />
          </div>

          {erro && <p style={{ color: "#b91c1c", fontSize: 13, marginBottom: 12 }}>{erro}</p>}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button type="button" onClick={onCancelar} style={{ padding: "8px 18px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", color: "#374151", cursor: "pointer", fontSize: 14 }}>Cancelar</button>
            <button type="submit" disabled={enviando} style={{ padding: "8px 18px", border: "none", borderRadius: 6, background: enviando ? "#9ca3af" : "#2563eb", color: "#fff", cursor: enviando ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600 }}>{enviando ? "Criando..." : "Criar atendente"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}