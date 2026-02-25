"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormUsuario } from "./form-usuario";

interface Usuario {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface Props {
  usuarios: Usuario[];
  sessaoId: string; // id do admin logado — para bloquear desativar a si mesmo
}

export function AdminUsuarios({ usuarios, sessaoId }: Props) {
  const router = useRouter();
  const [criando, setCriando] = useState(false);
  const [redefinindo, setRedefinindo] = useState<string | null>(null); // id do usuário
  const [novaSenha, setNovaSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState<string | null>(null);

  async function toggleAtivo(id: string, ativo: boolean) {
    setErro(null);
    setCarregando(id);
    try {
      const res = await fetch(`/api/usuarios/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !ativo }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error ?? "Erro ao atualizar."); return; }
      router.refresh();
    } catch {
      setErro("Erro de conexão.");
    } finally {
      setCarregando(null);
    }
  }

  async function handleRedefinirSenha(id: string) {
    if (!novaSenha) return;
    setErro(null);
    setCarregando(id);
    try {
      const res = await fetch(`/api/usuarios/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: novaSenha }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error ?? "Erro ao redefinir senha."); return; }
      setRedefinindo(null);
      setNovaSenha("");
    } catch {
      setErro("Erro de conexão.");
    } finally {
      setCarregando(null);
    }
  }

  return (
    <>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
            Atendentes ({usuarios.filter(u => u.role === "ATENDENTE").length})
          </h2>
          <button
            onClick={() => setCriando(true)}
            style={{ padding: "6px 14px", border: "none", borderRadius: 6, background: "#2563eb", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
          >
            + Novo atendente
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
              <th style={{ padding: "8px 16px", fontWeight: 600 }}>Nome</th>
              <th style={{ padding: "8px 16px", fontWeight: 600 }}>Email</th>
              <th style={{ padding: "8px 16px", fontWeight: 600 }}>Role</th>
              <th style={{ padding: "8px 16px", fontWeight: 600 }}>Status</th>
              <th style={{ padding: "8px 16px" }}></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u, i) => (
              <tr key={u.id} style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb", opacity: carregando === u.id ? 0.5 : 1 }}>
                <td style={{ padding: "10px 16px", fontWeight: 500, color: "#111827" }}>{u.name}</td>
                <td style={{ padding: "10px 16px", color: "#6b7280" }}>{u.email}</td>
                <td style={{ padding: "10px 16px" }}>
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 10, fontWeight: 600,
                    backgroundColor: u.role === "ADMIN" ? "#dbeafe" : "#f3f4f6",
                    color: u.role === "ADMIN" ? "#1d4ed8" : "#374151",
                  }}>
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: "10px 16px" }}>
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 10, fontWeight: 600,
                    backgroundColor: u.isActive ? "#dcfce7" : "#fee2e2",
                    color: u.isActive ? "#15803d" : "#b91c1c",
                  }}>
                    {u.isActive ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                  {/* Não mostra ações para o próprio admin logado */}
                  {u.id !== sessaoId && (
                    <>
                      <button
                        onClick={() => toggleAtivo(u.id, u.isActive)}
                        disabled={carregando === u.id}
                        style={{ padding: "3px 10px", border: "1px solid #d1d5db", borderRadius: 5, background: "#fff", color: "#374151", cursor: "pointer", fontSize: 12, marginRight: 6 }}
                      >
                        {u.isActive ? "Desativar" : "Ativar"}
                      </button>
                      <button
                        onClick={() => { setRedefinindo(u.id); setNovaSenha(""); setErro(null); }}
                        style={{ padding: "3px 10px", border: "1px solid #d1d5db", borderRadius: 5, background: "#fff", color: "#374151", cursor: "pointer", fontSize: 12 }}
                      >
                        Redefinir senha
                      </button>
                    </>
                  )}

                  {/* Inline: campo de nova senha */}
                  {redefinindo === u.id && (
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6 }}>
                      <input
                        type="password"
                        placeholder="Nova senha (min. 6)"
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        style={{ padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 5, fontSize: 12, width: 160, color: "#111827" }}
                      />
                      <button
                        onClick={() => handleRedefinirSenha(u.id)}
                        disabled={novaSenha.length < 6}
                        style={{ padding: "4px 10px", border: "none", borderRadius: 5, background: novaSenha.length < 6 ? "#9ca3af" : "#2563eb", color: "#fff", cursor: novaSenha.length < 6 ? "not-allowed" : "pointer", fontSize: 12 }}
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => setRedefinindo(null)}
                        style={{ padding: "4px 10px", border: "1px solid #d1d5db", borderRadius: 5, background: "#fff", color: "#6b7280", cursor: "pointer", fontSize: 12 }}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {criando && (
        <FormUsuario
          onSucesso={() => setCriando(false)}
          onCancelar={() => setCriando(false)}
        />
      )}
    </>
  );
}