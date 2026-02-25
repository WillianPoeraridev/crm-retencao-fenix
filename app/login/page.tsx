"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/retencao";

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password: senha,
        redirect: false,
      });

      if (result?.error) {
        setErro("Email ou senha incorretos.");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          padding: "40px 36px",
          width: "100%",
          maxWidth: 380,
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔥</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>
            Fênix CRM
          </h1>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
            Sistema de Retenção
          </p>
        </div>

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              autoComplete="email"
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 14,
                color: "#111827",
                backgroundColor: "#fff",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 14,
                color: "#111827",
                backgroundColor: "#fff",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>

          {erro && (
            <div
              style={{
                padding: "8px 12px",
                marginBottom: 16,
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 6,
                color: "#991b1b",
                fontSize: 13,
              }}
            >
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            style={{
              width: "100%",
              padding: "10px",
              border: "none",
              borderRadius: 6,
              backgroundColor: carregando ? "#9ca3af" : "#111827",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: carregando ? "not-allowed" : "pointer",
            }}
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}