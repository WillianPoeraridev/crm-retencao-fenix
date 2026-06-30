"use client";

import { useState, useEffect } from "react";

type Regiao = { id: string; nome: string; cor: string | null; isForaArea: boolean; isActive: boolean };

const inp = { padding: "7px 10px", border: "1px solid var(--border-strong)", borderRadius: 6, fontSize: 13 } as const;

export function AdminRegioes() {
  const [regioes, setRegioes] = useState<Regiao[]>([]);
  const [form, setForm] = useState({ nome: "", cor: "", isForaArea: false });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nome: "", cor: "" });

  const carregar = () => fetch("/api/regioes").then(r => r.json()).then(d => setRegioes(Array.isArray(d) ? d : []));
  useEffect(() => { carregar(); }, []);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/regioes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: form.nome, cor: form.cor || null, isForaArea: form.isForaArea, ordem: regioes.length }) });
    if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error || "Erro ao criar"); return; }
    setForm({ nome: "", cor: "", isForaArea: false }); carregar();
  }

  async function salvarEdicao(id: string) {
    const res = await fetch(`/api/regioes/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: editForm.nome, cor: editForm.cor || null }) });
    if (!res.ok) { alert("Erro ao salvar"); return; }
    setEditId(null); carregar();
  }

  async function excluir(r: Regiao) {
    if (!confirm(`Excluir a região "${r.nome}"?\n\nSe houver solicitações vinculadas, ela é apenas desativada.`)) return;
    const res = await fetch(`/api/regioes/${r.id}`, { method: "DELETE" });
    if (!res.ok) { alert("Erro ao excluir"); return; }
    const data = await res.json().catch(() => ({}));
    if (data.softDeleted) alert(`"${r.nome}" tinha vínculos (${data.solicitacoes} solicitações) — foi desativada.`);
    carregar();
  }

  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Regiões</h2>
      <form onSubmit={criar} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 14, marginBottom: 14, backgroundColor: "var(--surface)", display: "flex", gap: 10, alignItems: "end", flexWrap: "wrap" }}>
        <div><label style={{ fontSize: 12, color: "var(--fg-secondary)", display: "block", marginBottom: 4 }}>Nome</label><input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required placeholder="Ex: Centro" style={inp} /></div>
        <div><label style={{ fontSize: 12, color: "var(--fg-secondary)", display: "block", marginBottom: 4 }}>Cor</label><input value={form.cor} onChange={e => setForm({ ...form, cor: e.target.value })} placeholder="var(--info)" style={inp} /></div>
        <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6, color: "var(--fg-secondary)" }}><input type="checkbox" checked={form.isForaArea} onChange={e => setForm({ ...form, isForaArea: e.target.checked })} /> Fora de área</label>
        <button type="submit" style={{ padding: "8px 16px", backgroundColor: "var(--primary-solid)", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Criar</button>
      </form>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {regioes.map(r => (
          <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 6, backgroundColor: r.isActive === false ? "var(--surface-2)" : "var(--surface)", opacity: r.isActive === false ? 0.6 : 1 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: r.cor || "var(--border-strong)", flexShrink: 0 }} />
            {editId === r.id ? (
              <>
                <input value={editForm.nome} onChange={e => setEditForm({ ...editForm, nome: e.target.value })} style={{ ...inp, flex: 1 }} />
                <input value={editForm.cor} onChange={e => setEditForm({ ...editForm, cor: e.target.value })} placeholder="cor" style={{ ...inp, width: 120 }} />
                <button onClick={() => salvarEdicao(r.id)} style={{ padding: "4px 10px", border: "none", borderRadius: 4, backgroundColor: "var(--success-solid)", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Salvar</button>
                <button onClick={() => setEditId(null)} style={{ padding: "4px 10px", border: "1px solid var(--border-strong)", borderRadius: 4, background: "none", color: "var(--fg-muted)", fontSize: 11, cursor: "pointer" }}>Cancelar</button>
              </>
            ) : (
              <>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{r.nome}</span>
                {r.isForaArea && <span style={{ fontSize: 11, color: "var(--warning)", fontWeight: 600 }}>fora de área</span>}
                {r.isActive === false && <span style={{ fontSize: 11, color: "var(--danger)" }}>inativa</span>}
                <button onClick={() => { setEditId(r.id); setEditForm({ nome: r.nome, cor: r.cor || "" }); }} style={{ padding: "4px 10px", border: "1px solid var(--border-strong)", borderRadius: 4, backgroundColor: "var(--surface)", color: "var(--fg-secondary)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Editar</button>
                <button onClick={() => excluir(r)} style={{ padding: "4px 10px", border: "1px solid var(--danger-border)", borderRadius: 4, backgroundColor: "var(--surface)", color: "var(--danger)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Excluir</button>
              </>
            )}
          </div>
        ))}
        {regioes.length === 0 && <div style={{ padding: 14, textAlign: "center", color: "var(--fg-muted)", fontSize: 13 }}>Nenhuma região. Crie as regiões que a operação atende.</div>}
      </div>
    </section>
  );
}
