import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  // dupla proteção (middleware já cuida, mas garante)
  if (!session || session.user.role !== "ADMIN") {
    redirect("/retencao?forbidden=1");
  }

  return (
    <main style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>
        Painel Administrativo
      </h1>
      <p style={{ color: "#6b7280", marginTop: 8 }}>
        Bem-vindo, {session.user.name}. Você está logado como <strong>ADMIN</strong>.
      </p>

      <div
        style={{
          marginTop: 24,
          padding: 16,
          border: "1px solid #d1d5db",
          borderRadius: 8,
          backgroundColor: "#f9fafb",
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 8 }}>
          Em breve aqui:
        </h2>
        <ul style={{ color: "#374151", lineHeight: 1.8, paddingLeft: 20 }}>
          <li>Configuração de competência (meta, orçamento, dias úteis...)</li>
          <li>Gerenciamento de usuários</li>
        </ul>
      </div>
    </main>
  );
}